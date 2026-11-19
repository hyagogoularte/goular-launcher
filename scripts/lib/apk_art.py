"""Extrai de um APK o arquivo de imagem de um recurso (banner ou ícone), sem dependências.

Uso: python3 -I scripts/lib/apk_art.py <0xRESID> <saida-sem-extensao> <apk> [split.apk...]
Lê o resources.arsc, resolve o id (seguindo referências) para os arquivos de todas as
densidades e grava o maior PNG/WebP/JPG como <saida>.<ext>. Se o recurso só existir em
XML (vetor, ícone adaptativo, shape), converte para <saida>.svg. Sai com código 2 se
não houver imagem.
Usado por scripts/pull-app-art.sh.
"""
import base64
import struct
import sys
import zipfile


def read_pool(buf, off):
    _, hsz, _size, count, _styles, flags, sstart, _ = struct.unpack_from('<HHIIIIII', buf, off)
    utf8 = bool(flags & 0x100)
    offs = struct.unpack_from('<%dI' % count, buf, off + hsz)
    base = off + sstart
    out = []
    for o in offs:
        p = base + o
        if utf8:
            n = buf[p]
            p += 2 if n & 0x80 else 1
            n = buf[p]
            if n & 0x80:
                n = ((n & 0x7F) << 8) | buf[p + 1]
                p += 2
            else:
                p += 1
            out.append(buf[p:p + n].decode('utf-8', 'replace'))
        else:
            n = struct.unpack_from('<H', buf, p)[0]
            p += 2
            if n & 0x8000:
                n = ((n & 0x7FFF) << 16) | struct.unpack_from('<H', buf, p)[0]
                p += 2
            out.append(buf[p:p + 2 * n].decode('utf-16le', 'replace'))
    return out


def parse(buf):
    """(strings, table) com table[(pacote, tipo, entrada)] = [(tipo_valor, dado), ...]."""
    _, hsz, size, _ = struct.unpack_from('<HHII', buf, 0)
    off = hsz
    strings = []
    table = {}
    while off < size:
        ctype, chsz, csize = struct.unpack_from('<HHI', buf, off)
        if ctype == 0x0001:
            strings = read_pool(buf, off)
        elif ctype == 0x0200:
            pid = struct.unpack_from('<I', buf, off + 8)[0]
            p = off + chsz
            end = off + csize
            while p < end:
                t, thsz, tsize = struct.unpack_from('<HHI', buf, p)
                if t == 0x0201:
                    tid, flags = buf[p + 8], buf[p + 9]
                    count, estart = struct.unpack_from('<II', buf, p + 12)
                    idx = p + thsz
                    if flags & 0x01:  # esparso
                        pairs = [struct.unpack_from('<HH', buf, idx + 4 * i) for i in range(count)]
                        entries = [(e, o * 4) for e, o in pairs]
                    else:
                        offs = struct.unpack_from('<%dI' % count, buf, idx)
                        entries = [(i, o) for i, o in enumerate(offs) if o != 0xFFFFFFFF]
                    for eidx, eo in entries:
                        e = p + estart + eo
                        esize, eflags = struct.unpack_from('<HH', buf, e)
                        if eflags & 0x0008:  # compacto
                            dtype, data = eflags >> 8, struct.unpack_from('<I', buf, e + 4)[0]
                        elif eflags & 0x0001:  # complexo
                            continue
                        else:
                            dtype, data = buf[e + esize + 3], struct.unpack_from('<I', buf, e + esize + 4)[0]
                        table.setdefault((pid, tid, eidx), []).append((dtype, data))
                p += tsize
        off += csize
    return strings, table


def files_for(strings, table, rid, depth=0):
    found = []
    for dtype, data in table.get((rid >> 24, (rid >> 16) & 0xFF, rid & 0xFFFF), []):
        if dtype == 0x03:
            found.append(strings[data])
        elif dtype == 0x01 and depth < 5:
            found += files_for(strings, table, data, depth + 1)
    return found


RASTER = ('.png', '.webp', '.jpg')
MIME = {'png': 'image/png', 'webp': 'image/webp', 'jpg': 'image/jpeg'}


def resolve(strings, table, rid, depth=0):
    """Valores finais (tipo, dado) de um recurso, seguindo referências."""
    found = []
    for dtype, data in table.get((rid >> 24, (rid >> 16) & 0xFF, rid & 0xFFFF), []):
        if dtype == 0x01 and depth < 5:
            found += resolve(strings, table, data, depth + 1)
        else:
            found.append((dtype, data))
    return found


def read_axml(buf):
    """XML binário do Android → árvore (tag, {atributo: (tipo, dado)}, filhos)."""
    strings, resids = [], []
    root = None
    stack = []
    off = 8
    while off < len(buf):
        t, hsz, size = struct.unpack_from('<HHI', buf, off)
        if t == 0x0001:
            strings = read_pool(buf, off)
        elif t == 0x0180:
            resids = struct.unpack_from('<%dI' % ((size - hsz) // 4), buf, off + hsz)
        elif t == 0x0102:
            name = struct.unpack_from('<I', buf, off + 20)[0]
            astart, asize, acount = struct.unpack_from('<HHH', buf, off + 24)
            attrs = {}
            for i in range(acount):
                _, n, raw, _, _, vt, vd = struct.unpack_from('<IIIHBBI', buf, off + 16 + astart + i * asize)
                key = strings[n] or ANDROID_ATTRS.get(resids[n] if n < len(resids) else 0, '')
                attrs[key] = (0x03, strings[vd]) if vt == 0x03 else (vt, vd)
            node = (strings[name], attrs, [])
            if stack:
                stack[-1][2].append(node)
            else:
                root = node
            stack.append(node)
        elif t == 0x0103:
            stack.pop()
        off += size
    return root


# Ids de atributos android: usados quando o APK foi otimizado e perdeu os nomes.
ANDROID_ATTRS = {
    0x01010199: 'drawable', 0x01010119: 'src', 0x0101019b: 'endColor', 0x0101019d: 'startColor',
    0x010101a0: 'angle', 0x010101a8: 'radius', 0x0101011c: 'shape', 0x010101a5: 'color',
    0x01010402: 'viewportWidth', 0x01010403: 'viewportHeight', 0x01010155: 'height',
    0x01010159: 'width', 0x01010404: 'fillColor', 0x01010405: 'pathData', 0x01010406: 'strokeColor',
    0x01010407: 'strokeWidth', 0x010104cc: 'fillAlpha', 0x010104cb: 'strokeAlpha',
    0x0101051e: 'fillType', 0x01010324: 'pivotX', 0x01010325: 'pivotY', 0x01010326: 'rotation',
    0x01010327: 'scaleX', 0x01010328: 'scaleY', 0x01010320: 'translateX', 0x01010321: 'translateY',
    0x0101031f: 'alpha',
}


def as_float(v):
    return struct.unpack('<f', struct.pack('<I', v[1]))[0] if v[0] == 0x04 else float(v[1])


def as_dim(v):
    """Dimensão complexa (dp/px) → número."""
    if v[0] != 0x05:
        return as_float(v)
    mult = (1 / 256, 1 / 32768, 1 / 8388608, 1 / 2147483648)[(v[1] >> 4) & 3]
    return struct.unpack('<i', struct.pack('<I', v[1] & 0xFFFFFF00))[0] * mult


class Svg:
    """Converte drawables em XML (vector, adaptive-icon, shape, bitmap, layer-list) para SVG."""

    def __init__(self, zips):
        self.zips = zips  # [(zip, nomes, strings, tabela)]

    def lookup(self, rid):
        for z, names, strings, table in self.zips:
            vals = resolve(strings, table, rid)
            if vals:
                files = [strings[d] for t, d in vals if t == 0x03 and strings[d] in names]
                return z, files, vals
        return None, [], []

    def color(self, v):
        if v is None:
            return None
        if v[0] == 0x01:
            z, files, vals = self.lookup(v[1])
            for t, d in vals:
                if 0x1C <= t <= 0x1F:
                    return self.color((t, d))
            for f in files:  # lista de estados de cor: usa o primeiro item
                root = read_axml(z.read(f))
                for _, attrs, _ in [root] + root[2]:
                    if 'color' in attrs:
                        return self.color(attrs['color'])
            return None
        if 0x1C <= v[0] <= 0x1F:
            a = 255 if v[0] in (0x1D, 0x1F) else (v[1] >> 24) & 0xFF
            return 'rgba(%d,%d,%d,%.3f)' % ((v[1] >> 16) & 0xFF, (v[1] >> 8) & 0xFF, v[1] & 0xFF, a / 255)
        return None

    def drawable(self, v, w, h):
        """SVG (elemento <svg>) de um valor de drawable, desenhado numa caixa w×h."""
        if v is None:
            return ''
        if 0x1C <= v[0] <= 0x1F:
            return self.box(w, h, '<rect width="%g" height="%g" fill="%s"/>' % (w, h, self.color(v)))
        if v[0] != 0x01:
            return ''
        z, files, vals = self.lookup(v[1])
        for t, d in vals:
            if 0x1C <= t <= 0x1F:
                return self.drawable((t, d), w, h)
        rasters = [f for f in files if f.lower().endswith(RASTER)]
        if rasters:
            f = max(rasters, key=lambda f: z.getinfo(f).file_size)
            data = base64.b64encode(z.read(f)).decode()
            return self.box(w, h, '<image width="%g" height="%g" preserveAspectRatio="xMidYMid meet" '
                                  'href="data:%s;base64,%s"/>' % (w, h, MIME[f.rsplit('.', 1)[1].lower()], data))
        xmls = [f for f in files if f.endswith('.xml')]
        return self.node(read_axml(z.read(xmls[0])), w, h) if xmls else ''

    def box(self, w, h, inner, view=None):
        return '<svg xmlns="http://www.w3.org/2000/svg" width="%g" height="%g" viewBox="%s" ' \
               'preserveAspectRatio="none">%s</svg>' % (w, h, view or '0 0 %g %g' % (w, h), inner)

    def node(self, n, w, h):
        tag, a, kids = n
        if tag == 'vector':
            vw, vh = as_float(a['viewportWidth']), as_float(a['viewportHeight'])
            return self.box(w, h, ''.join(self.vec(k) for k in kids), '0 0 %g %g' % (vw, vh))
        if tag == 'adaptive-icon':
            # As camadas têm 108 dp; o launcher mostra só os 72 dp do meio.
            layers = ''.join(self.place(self.child(k, 108, 108), 0, 0, 108, 108)
                             for k in kids if k[0] in ('background', 'foreground'))
            return self.box(w, h, layers, '18 18 72 72')
        if tag in ('bitmap', 'nine-patch'):
            return self.drawable(a.get('src'), w, h)
        if tag in ('layer-list', 'inset'):
            items = kids if tag == 'layer-list' else [n]
            return self.box(w, h, ''.join(self.child(i, w, h) for i in items))
        if tag == 'shape':
            return self.box(w, h, self.shape(a, kids, w, h))
        return ''

    def child(self, n, w, h):
        """Camada/item: drawable por referência (android:drawable) ou declarado dentro dele."""
        if 'drawable' in n[1]:
            return self.drawable(n[1]['drawable'], w, h)
        return ''.join(self.node(k, w, h) for k in n[2])

    @staticmethod
    def place(svg, x, y, w, h):
        return svg.replace('<svg ', '<svg x="%g" y="%g" ' % (x, y), 1) if svg else ''

    def shape(self, a, kids, w, h):
        fill, defs, r = 'none', '', 0
        for tag, ka, _ in kids:
            if tag == 'solid':
                fill = self.color(ka.get('color')) or 'none'
            elif tag == 'gradient':
                ang = as_float(ka['angle']) if 'angle' in ka else 0
                # angle=0: esquerda→direita; 90: baixo→cima (convenção do Android)
                x2, y2 = {0: (1, 0), 45: (1, -1), 90: (0, -1), 135: (-1, -1), 180: (-1, 0),
                          225: (-1, 1), 270: (0, 1), 315: (1, 1)}.get(int(ang) % 360, (1, 0))
                defs = '<defs><linearGradient id="g" x1="%g" y1="%g" x2="%g" y2="%g">' \
                       '<stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/>' \
                       '</linearGradient></defs>' % ((1 - x2) / 2, (1 - y2) / 2, (1 + x2) / 2, (1 + y2) / 2,
                                                     self.color(ka.get('startColor')), self.color(ka.get('endColor')))
                fill = 'url(#g)'
            elif tag == 'corners' and 'radius' in ka:
                r = as_dim(ka['radius'])
        if a.get('shape', (0, 0))[1] == 1:  # oval
            return defs + '<ellipse cx="%g" cy="%g" rx="%g" ry="%g" fill="%s"/>' % (w / 2, h / 2, w / 2, h / 2, fill)
        return defs + '<rect width="%g" height="%g" rx="%g" fill="%s"/>' % (w, h, r, fill)

    def vec(self, n):
        tag, a, kids = n
        if tag == 'group':
            g = lambda k, d: as_float(a[k]) if k in a else d
            px, py = g('pivotX', 0), g('pivotY', 0)
            tr = 'translate(%g %g) rotate(%g) scale(%g %g) translate(%g %g)' % (
                g('translateX', 0) + px, g('translateY', 0) + py, g('rotation', 0),
                g('scaleX', 1), g('scaleY', 1), -px, -py)
            return '<g transform="%s">%s</g>' % (tr, ''.join(self.vec(k) for k in kids))
        if tag != 'path' or 'pathData' not in a:
            return ''
        fill = self.color(a.get('fillColor')) or 'none'
        stroke = self.color(a.get('strokeColor')) or 'none'
        extra = ''
        if stroke != 'none':
            extra += ' stroke="%s" stroke-width="%g"' % (stroke, as_float(a.get('strokeWidth', (0x04, 0))))
        if 'fillAlpha' in a:
            extra += ' fill-opacity="%g"' % as_float(a['fillAlpha'])
        if a.get('fillType', (0, 0))[1] == 1:
            extra += ' fill-rule="evenodd"'
        return '<path d="%s" fill="%s"%s/>' % (a['pathData'][1], fill, extra)


def main():
    rid, out, apks = int(sys.argv[1], 16), sys.argv[2], sys.argv[3:]
    kind_box = (320, 180) if out.replace('\\', '/').split('/')[-2] == 'banner' else (192, 192)
    zips = []
    for apk in apks:  # base.apk e, se houver, os splits de densidade
        z = zipfile.ZipFile(apk)
        names = set(z.namelist())
        if 'resources.arsc' in names:
            strings, table = parse(z.read('resources.arsc'))
            zips.append((z, names, strings, table))

    best = None  # (tamanho, zip, arquivo)
    for z, names, strings, table in zips:
        for f in files_for(strings, table, rid):
            if f in names and f.lower().endswith(RASTER):
                size = z.getinfo(f).file_size
                if best is None or size > best[0]:
                    best = (size, z, f)
    if best is not None:
        _, z, f = best
        path = '%s.%s' % (out, f.rsplit('.', 1)[1].lower())
        data = z.read(f)
    else:
        svg = Svg(zips).drawable((0x01, rid), *kind_box)
        # Só cor/degradê, sem desenho nem imagem, não identifica o app: trata como sem arte.
        if '<path' not in svg and '<image' not in svg:
            sys.exit(2)
        path, data = out + '.svg', svg.encode()
    with open(path, 'wb') as fh:
        fh.write(data)
    print(path)


if __name__ == '__main__':
    main()
