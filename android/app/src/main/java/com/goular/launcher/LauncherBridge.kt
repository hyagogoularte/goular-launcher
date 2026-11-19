package com.goular.launcher

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
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

    /** JSON: [{ packageName, label, isTvApp, category }] — apps abríveis, sem o próprio launcher. */
    @JavascriptInterface
    fun getInstalledApps(): String {
        val pm = activity.packageManager
        val apps = linkedMapOf<String, JSONObject>()
        for (category in listOf(Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER)) {
            val query = Intent(Intent.ACTION_MAIN).addCategory(category)
            for (info in pm.queryIntentActivities(query, 0)) {
                val pkg = info.activityInfo.packageName
                if (pkg == activity.packageName || apps.containsKey(pkg)) continue
                // Apps que só a Amazon pode abrir (ex.: Kids, Perfis) ficariam mortos na grade.
                if (!canStart(info.activityInfo)) continue
                apps[pkg] = JSONObject()
                    .put("packageName", pkg)
                    .put("label", info.loadLabel(pm).toString())
                    .put("isTvApp", category == Intent.CATEGORY_LEANBACK_LAUNCHER)
                    .put("category", appCategory(info.activityInfo.applicationInfo) ?: JSONObject.NULL)
            }
        }
        return JSONArray(apps.values).toString()
    }

    /** Categoria declarada pelo app (Android 8+), usada para agrupar em "Todos os aplicativos". */
    private fun appCategory(info: ApplicationInfo): String? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return null
        return when (info.category) {
            ApplicationInfo.CATEGORY_VIDEO -> "video"
            ApplicationInfo.CATEGORY_AUDIO -> "audio"
            ApplicationInfo.CATEGORY_GAME -> "game"
            ApplicationInfo.CATEGORY_IMAGE -> "image"
            ApplicationInfo.CATEGORY_PRODUCTIVITY -> "productivity"
            ApplicationInfo.CATEGORY_NEWS -> "news"
            ApplicationInfo.CATEGORY_SOCIAL -> "social"
            ApplicationInfo.CATEGORY_MAPS -> "maps"
            else -> null
        }
    }

    /**
     * Abre o app (preferindo a entrada de TV). Retorna false se não estiver instalado
     * ou se o Goular não tiver permissão para abri-lo.
     */
    @JavascriptInterface
    fun launchApp(packageName: String): Boolean {
        val pm = activity.packageManager
        val intent = LAUNCH_OVERRIDES[packageName]
            ?.let { Intent(Intent.ACTION_MAIN).setClassName(packageName, it) }
            ?.takeIf { pm.resolveActivity(it, 0) != null }
            ?: pm.getLeanbackLaunchIntentForPackage(packageName)
            ?: pm.getLaunchIntentForPackage(packageName)
            ?: return false
        val target = pm.resolveActivity(intent, 0)?.activityInfo ?: return false
        if (!canStart(target)) return false
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        activity.runOnUiThread {
            try {
                activity.startActivity(intent)
            } catch (e: ActivityNotFoundException) {
                Log.w(TAG, "Não foi possível abrir $packageName", e)
            } catch (e: SecurityException) {
                Log.w(TAG, "Sem permissão para abrir $packageName", e)
            }
        }
        return true
    }

    /** A activity exige uma permissão que o Goular não tem (só apps da Amazon têm)? */
    private fun canStart(info: ActivityInfo): Boolean {
        val required = info.permission ?: return true
        return activity.checkSelfPermission(required) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * Menu Configurações do Fire TV (Rede, Meu Fire TV, Aplicativos…).
     * No Fire OS, ACTION_SETTINGS passa antes pela tela inicial da Amazon
     * (HomeActivity_vNext), e o HomeWatcherService devolve o usuário ao Goular.
     * Por isso abre direto a tela do menu, numa tarefa limpa (voltar não empilha
     * cópias dela); o genérico fica só de reserva para outros aparelhos.
     */
    @JavascriptInterface
    fun openSystemSettings() {
        val flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        val candidates = listOf(
            Intent().setClassName(AMAZON_LAUNCHER, "$AMAZON_LAUNCHER.ui.MainSettingsActivity"),
            Intent(Settings.ACTION_SETTINGS),
        )
        activity.runOnUiThread {
            for (intent in candidates) {
                try {
                    activity.startActivity(intent.addFlags(flags))
                    return@runOnUiThread
                } catch (e: ActivityNotFoundException) {
                    Log.w(TAG, "Configurações indisponíveis por $intent", e)
                } catch (e: SecurityException) {
                    Log.w(TAG, "Configurações bloqueadas por $intent", e)
                }
            }
        }
    }

    @JavascriptInterface
    fun getAppVersion(): String = BuildConfig.VERSION_NAME

    private companion object {
        const val TAG = "GoularBridge"
        const val AMAZON_LAUNCHER = "com.amazon.tv.launcher"

        /**
         * Apps cuja entrada padrão passa pela tela inicial da Amazon (e o
         * HomeWatcherService devolveria ao Goular): abre direto a tela própria deles.
         */
        val LAUNCH_OVERRIDES = mapOf(
            // Appstore: a entrada padrão abre a seção Apps da tela da Amazon; esta é a loja.
            "com.amazon.venezia" to "com.amazon.venezia.ade.ADEHomeActivity",
        )
    }
}
