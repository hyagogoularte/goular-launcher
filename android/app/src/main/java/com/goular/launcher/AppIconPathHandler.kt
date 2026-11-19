package com.goular.launcher

import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.util.LruCache
import android.webkit.WebResourceResponse
import androidx.core.graphics.drawable.toBitmap
import androidx.webkit.WebViewAssetLoader
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream

/**
 * Serve banners e ícones dos apps instalados como PNG para o WebView:
 *   http://appassets.androidplatform.net/appicons/banner/<pacote>
 *   http://appassets.androidplatform.net/appicons/icon/<pacote>
 * Assim a UI usa a arte oficial de cada app sem guardar logos no repositório.
 */
class AppIconPathHandler(private val pm: PackageManager) : WebViewAssetLoader.PathHandler {

    private val cache = object : LruCache<String, ByteArray>(8 * 1024 * 1024) {
        override fun sizeOf(key: String, value: ByteArray) = value.size
    }

    override fun handle(path: String): WebResourceResponse {
        val parts = path.split('/', limit = 2)
        if (parts.size != 2) return notFound()
        val (kind, pkg) = parts

        val bytes = cache.get(path) ?: render(kind, pkg)?.also { cache.put(path, it) }
        return if (bytes == null) {
            notFound()
        } else {
            WebResourceResponse("image/png", null, ByteArrayInputStream(bytes))
        }
    }

    private fun render(kind: String, pkg: String): ByteArray? {
        val drawable: Drawable = try {
            when (kind) {
                "banner" -> pm.getLeanbackLaunchIntentForPackage(pkg)?.let { pm.getActivityBanner(it) }
                    ?: pm.getApplicationBanner(pkg)
                "icon" -> pm.getApplicationIcon(pkg)
                else -> null
            }
        } catch (e: PackageManager.NameNotFoundException) {
            null
        } ?: return null

        // Banner que é só cor/degradê (ex.: apps "stub" da Amazon) não identifica o app:
        // sem ele o tile mostra o ícone e o nome.
        if (kind == "banner" && (drawable is ColorDrawable || drawable is GradientDrawable)) return null

        // Banner em XML (vetor) pode não ter tamanho próprio: usa o padrão 320x180.
        val (w, h) = when {
            kind == "icon" -> 192 to 192
            drawable.intrinsicWidth > 0 && drawable.intrinsicHeight > 0 ->
                drawable.intrinsicWidth to drawable.intrinsicHeight
            else -> 320 to 180
        }
        return try {
            val bitmap = drawable.toBitmap(w, h)
            ByteArrayOutputStream().use { out ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                out.toByteArray()
            }
        } catch (e: RuntimeException) {
            null // arte que não desenha: o tile cai para o ícone/texto
        }
    }

    private fun notFound() =
        WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), ByteArrayInputStream(ByteArray(0)))
}
