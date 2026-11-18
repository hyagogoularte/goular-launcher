package com.goular.launcher

import android.annotation.SuppressLint
import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader

/**
 * Casca do launcher: uma Activity em tela cheia com um WebView que carrega a
 * UI React (web/ → assets/www). Toda a interface é web; aqui ficam só o que
 * o navegador não consegue fazer: listar/abrir apps, voltar, eventos do sistema.
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView

    private val packageReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) = dispatchToWeb("packages-changed")
    }

    @SuppressLint("SetJavaScriptEnabled", "JavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (BuildConfig.DEBUG) {
            // chrome://inspect no Mac, com o Fire Stick conectado via adb
            WebView.setWebContentsDebuggingEnabled(true)
        }

        val assetLoader = WebViewAssetLoader.Builder()
            .setHttpAllowed(true) // origem http: permite falar com o Home Assistant em http na rede local
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/appicons/", AppIconPathHandler(packageManager))
            .build()

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#040B1F"))
            isFocusable = true
            isFocusableInTouchMode = true
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.mediaPlaybackRequiresUserGesture = true
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    assetLoader.shouldInterceptRequest(request.url)
            }
            addJavascriptInterface(LauncherBridge(this@MainActivity), "GoularNative")
        }
        setContentView(webView)

        val url = BuildConfig.DEV_SERVER_URL.ifBlank { "http://appassets.androidplatform.net/assets/www/index.html" }
        webView.loadUrl(url)
        webView.requestFocus()

        registerReceiver(packageReceiver, IntentFilter().apply {
            addAction(Intent.ACTION_PACKAGE_ADDED)
            addAction(Intent.ACTION_PACKAGE_REMOVED)
            addAction(Intent.ACTION_PACKAGE_CHANGED)
            addDataScheme("package")
        })
    }

    /** O botão voltar nunca fecha o launcher: vira um evento para a UI decidir. */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK) {
            if (event.action == KeyEvent.ACTION_UP) dispatchToWeb("back")
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    /** Home pressionado com o launcher já na frente (launchMode singleTask). */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        dispatchToWeb("home")
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        dispatchToWeb("resume")
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        unregisterReceiver(packageReceiver)
        webView.destroy()
        super.onDestroy()
    }

    private fun dispatchToWeb(name: String) {
        if (!::webView.isInitialized) return
        webView.post {
            webView.evaluateJavascript("window.dispatchEvent(new Event('goular:$name'))", null)
        }
    }
}
