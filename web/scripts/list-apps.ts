/**
 * Lê (stdin) a lista gerada por scripts/list-apps.sh e imprime, em Markdown,
 * onde cada app aparece no Goular. Roda direto no Node 23.6+ (sem compilar).
 * Usa as mesmas regras da tela "Todos os aplicativos".
 */
import { readFileSync } from 'node:fs';
import { config } from '../src/config.ts';
import {
  type AppGroupId,
  classifyApp,
  GROUPS_IN_ORDER,
  isHiddenApp,
  suggestGroup,
} from '../src/services/appGroups.ts';

interface DeviceApp {
  packageName: string;
  label: string;
  isTvApp: boolean;
  system: boolean;
}

const [model = '?', fireOs = '?', totalPackages = '?'] = process.argv.slice(2);
const apps = (JSON.parse(readFileSync(0, 'utf8')) as DeviceApp[]).sort((a, b) =>
  a.packageName.localeCompare(b.packageName),
);
const onHome = new Set(config.homeRows.flatMap((r) => r.packages));

const origin = (a: DeviceApp) => (a.system ? 'de fábrica' : 'instalado');
const kind = (a: DeviceApp) => (a.isTvApp ? 'TV' : 'celular');
const row = (a: DeviceApp, extra = '') =>
  `| \`${a.packageName}\` | ${origin(a)} | ${kind(a)} |${extra}`;

const out: string[] = [
  `# Apps no ${model} (${fireOs})`,
  '',
  `${apps.length} apps abríveis de ${totalPackages} pacotes no aparelho (o resto são serviços sem tela).`,
  '',
];

const hidden = apps.filter((a) => isHiddenApp(a.packageName, config.hiddenApps));
const visible = apps.filter((a) => !hidden.includes(a));

out.push('## Blocos do Início', '', '| Pacote | Situação |', '|---|---|');
for (const [pkg, title] of config.homeRows.flatMap((r) => r.packages.map((p) => [p, r.title]))) {
  const found = apps.some((a) => a.packageName === pkg);
  out.push(`| \`${pkg}\` (${title}) | ${found ? 'instalado' : '**não encontrado** — corrija em config.ts'} |`);
}
out.push('');

const groupLabel = (id: AppGroupId | undefined) => GROUPS_IN_ORDER.find((g) => g.id === id)?.label ?? '—';

for (const group of GROUPS_IN_ORDER) {
  const list = visible.filter((a) => classifyApp(a, config.appGroupOverrides) === group.id);
  if (list.length === 0) continue;
  if (group.id === 'other') {
    // Apps novos, fora do catálogo: ficam em Outros até serem organizados.
    out.push(
      `## ${group.label} (${list.length}) — novos, a organizar`,
      '',
      'Para tirar daqui: adicione o pacote em `KNOWN_PACKAGES` (`appGroups.ts`) e em `config.appCatalog`,',
      'ou só em `config.appGroupOverrides`. Para esconder: `config.hiddenApps`.',
      '',
      '| Pacote | Origem | Tipo | Sugestão de grupo |',
      '|---|---|---|---|',
    );
    for (const a of list) out.push(row(a, ` ${groupLabel(suggestGroup(a))} |`));
  } else {
    out.push(`## ${group.label} (${list.length})`, '', '| Pacote | Origem | Tipo | No Início |', '|---|---|---|---|');
    for (const a of list) out.push(row(a, ` ${onHome.has(a.packageName) ? 'sim' : ''} |`));
  }
  out.push('');
}

if (hidden.length > 0) {
  out.push(`## Ocultos (${hidden.length})`, '', '| Pacote | Origem | Tipo |', '|---|---|---|');
  for (const a of hidden) out.push(row(a));
  out.push('');
}

console.log(out.join('\n'));
