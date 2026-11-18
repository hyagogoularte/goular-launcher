package com.goular.launcher

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.SystemClock
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * O Fire OS não deixa trocar a tela inicial padrão. Este serviço de
 * acessibilidade observa quando a tela inicial da Amazon aparece (botão Home,
 * boot, saída de um app) e abre o Goular por cima.
 *
 * Ativação (uma vez, via adb): scripts/enable-home-watcher.sh
 * Diagnóstico: adb logcat -s GoularHome  → mostra pacote/classe de cada janela.
 */
class HomeWatcherService : AccessibilityService() {

    private var lastLaunchAt = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return
        val cls = event.className?.toString().orEmpty()
        Log.d(TAG, "janela: $pkg / $cls")

        if (pkg !in AMAZON_LAUNCHERS) return
        // Telas do pacote da Amazon que devem continuar acessíveis (ajuste olhando o logcat).
        if (PASSTHROUGH_HINTS.any { cls.contains(it, ignoreCase = true) }) return

        val now = SystemClock.elapsedRealtime()
        if (now - lastLaunchAt < DEBOUNCE_MS) return
        lastLaunchAt = now

        Log.i(TAG, "tela inicial da Amazon detectada ($cls) → abrindo Goular")
        startActivity(
            Intent(this, MainActivity::class.java).addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                    Intent.FLAG_ACTIVITY_NO_ANIMATION,
            ),
        )
    }

    override fun onInterrupt() = Unit

    private companion object {
        const val TAG = "GoularHome"
        const val DEBOUNCE_MS = 800L
        val AMAZON_LAUNCHERS = setOf("com.amazon.tv.launcher")
        val PASSTHROUGH_HINTS = listOf("Settings", "Profile", "Search")
    }
}
