package com.goular.launcher

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.provider.Settings
import android.util.Log
import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

/**
 * Exposta ao JavaScript como window.GoularNative (ver web/src/services/native.ts).
 * Métodos @JavascriptInterface rodam numa thread do WebView, não na UI thread.
 */
class LauncherBridge(private val activity: Activity) {

    /** JSON: [{ packageName, label, isTvApp }] — apps abríveis, sem o próprio launcher. */
    @JavascriptInterface
    fun getInstalledApps(): String {
        val pm = activity.packageManager
        val apps = linkedMapOf<String, JSONObject>()
        for (category in listOf(Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER)) {
            val query = Intent(Intent.ACTION_MAIN).addCategory(category)
            for (info in pm.queryIntentActivities(query, 0)) {
                val pkg = info.activityInfo.packageName
                if (pkg == activity.packageName || apps.containsKey(pkg)) continue
                apps[pkg] = JSONObject()
                    .put("packageName", pkg)
                    .put("label", info.loadLabel(pm).toString())
                    .put("isTvApp", category == Intent.CATEGORY_LEANBACK_LAUNCHER)
            }
        }
        return JSONArray(apps.values).toString()
    }

    /** Abre o app (preferindo a entrada de TV). Retorna false se não estiver instalado. */
    @JavascriptInterface
    fun launchApp(packageName: String): Boolean {
        val pm = activity.packageManager
        val intent = pm.getLeanbackLaunchIntentForPackage(packageName)
            ?: pm.getLaunchIntentForPackage(packageName)
            ?: return false
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        activity.runOnUiThread {
            try {
                activity.startActivity(intent)
            } catch (e: ActivityNotFoundException) {
                Log.w(TAG, "Não foi possível abrir $packageName", e)
            }
        }
        return true
    }

    /** Configurações do Fire TV. */
    @JavascriptInterface
    fun openSystemSettings() {
        activity.runOnUiThread {
            activity.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        }
    }

    @JavascriptInterface
    fun getAppVersion(): String = BuildConfig.VERSION_NAME

    private companion object {
        const val TAG = "GoularBridge"
    }
}
