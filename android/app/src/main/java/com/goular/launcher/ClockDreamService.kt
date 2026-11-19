package com.goular.launcher

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.Shader
import android.graphics.Typeface
import android.service.dreams.DreamService
import android.text.format.DateFormat
import android.view.View
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.abs
import kotlin.math.min
import kotlin.random.Random

/**
 * Protetor de tela do Goular: fundo quase preto no degradê do launcher e um bloco com
 * a data ("QUI. 19 DE NOV.") e, embaixo, a hora na mesma largura da data. O bloco
 * atravessa a tela na diagonal; ao bater numa borda, volta na direção oposta (como
 * os protetores antigos do Windows). Desenhado direto no Canvas, sem WebView.
 *
 * Ativação (uma vez, via adb): scripts/enable-screensaver.sh
 * Qualquer tecla do controle encerra o protetor.
 */
class ClockDreamService : DreamService() {

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        isInteractive = false // qualquer tecla acorda
        isFullscreen = true
        isScreenBright = true
        setContentView(BouncingClockView(this))
    }
}

@SuppressLint("ViewConstructor")
private class BouncingClockView(context: Context) : View(context) {

    private val background = Paint()
    private val datePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(189, 226, 232, 255) // --c-text-muted
        typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        letterSpacing = 0.04f
    }
    private val timePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(240, 244, 247, 255) // --c-text
        typeface = Typeface.create("sans-serif-light", Typeface.NORMAL)
    }
    private val dateBounds = Rect()
    private val timeBounds = Rect()
    private val is24h = DateFormat.is24HourFormat(context)
    private val weekdayFormat = SimpleDateFormat("EEE", PT_BR)
    private val monthFormat = SimpleDateFormat("MMM", PT_BR)
    private val dayFormat = SimpleDateFormat("d", PT_BR)

    private var dateText = ""
    private var timeText = ""
    private var minuteShown = -1L
    private var gap = 0f

    /** Canto superior esquerdo do bloco (data + hora), em px. */
    private var x = 0f
    private var y = 0f
    private var blockW = 0f
    private var blockH = 0f
    /** Velocidade em px/s. */
    private var vx = 0f
    private var vy = 0f
    private var lastFrameNanos = 0L

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        // Mesmo degradê do fundo do Goular (da esquerda para a direita, levemente
        // inclinado), escurecido até quase preto: descansa a vista e a tela.
        background.shader = LinearGradient(
            0f, 0f, w.toFloat(), h * 0.45f,
            intArrayOf(BG_0, BG_1, BG_2), floatArrayOf(0f, 0.55f, 1f), Shader.TileMode.CLAMP,
        )
        datePaint.textSize = h * DATE_SIZE_RATIO
        gap = h * GAP_RATIO
        val speed = h * SPEED_RATIO
        vx = speed * if (Random.nextBoolean()) 1 else -1
        vy = speed * if (Random.nextBoolean()) 1 else -1
        refreshText(force = true)
        x = Random.nextFloat() * (w - blockW).coerceAtLeast(0f)
        y = Random.nextFloat() * (h - blockH).coerceAtLeast(0f)
        lastFrameNanos = 0L
    }

    override fun onDraw(canvas: Canvas) {
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), background)
        refreshText(force = false)

        val now = System.nanoTime()
        // Limita o passo: depois de uma pausa longa o bloco não "teleporta".
        val dt = if (lastFrameNanos == 0L) 0f else min((now - lastFrameNanos) / 1e9f, MAX_STEP_S)
        lastFrameNanos = now
        move(dt)

        // bounds são relativos à linha de base: compensa para desenhar no retângulo do bloco.
        canvas.drawText(dateText, x - dateBounds.left, y - dateBounds.top, datePaint)
        val timeTop = y + dateBounds.height() + gap
        canvas.drawText(timeText, x - timeBounds.left, timeTop - timeBounds.top, timePaint)
        postInvalidateOnAnimation()
    }

    private fun move(dt: Float) {
        val maxX = (width - blockW).coerceAtLeast(0f)
        val maxY = (height - blockH).coerceAtLeast(0f)
        x += vx * dt
        y += vy * dt
        if (x <= 0f) { x = 0f; vx = abs(vx) } else if (x >= maxX) { x = maxX; vx = -abs(vx) }
        if (y <= 0f) { y = 0f; vy = abs(vy) } else if (y >= maxY) { y = maxY; vy = -abs(vy) }
    }

    /**
     * Na virada do minuto refaz os textos e o tamanho da hora: ela é escalada para ter
     * exatamente a largura da data ("QUI. 19 DE NOV."), por isso fica bem maior.
     */
    private fun refreshText(force: Boolean) {
        val nowMs = System.currentTimeMillis()
        val minute = nowMs / 60_000
        if (!force && minute == minuteShown) return
        minuteShown = minute
        val now = Date(nowMs)

        dateText = formatDate(now)
        datePaint.getTextBounds(dateText, 0, dateText.length, dateBounds)

        timeText = DateFormat.format(if (is24h) "HH:mm" else "h:mm", now).toString()
        timePaint.textSize = REFERENCE_SIZE
        timePaint.getTextBounds(timeText, 0, timeText.length, timeBounds)
        timePaint.textSize = REFERENCE_SIZE * dateBounds.width() / timeBounds.width().coerceAtLeast(1)
        timePaint.getTextBounds(timeText, 0, timeText.length, timeBounds)

        blockW = maxOf(dateBounds.width(), timeBounds.width()).toFloat()
        blockH = dateBounds.height() + gap + timeBounds.height()
    }

    /** "QUI. 19 DE NOV.": tudo em maiúsculas. */
    private fun formatDate(date: Date): String {
        val weekday = withDot(weekdayFormat.format(date))
        val month = withDot(monthFormat.format(date))
        return "$weekday ${dayFormat.format(date)} DE $month".uppercase(PT_BR)
    }

    private fun withDot(abbr: String) = abbr.trimEnd('.') + "."

    private companion object {
        val PT_BR: Locale = Locale("pt", "BR")
        // Fundo do Goular (web/src/styles/tokens.css: --c-bg-0, -1, -2) a ~35% do
        // brilho: mesmo matiz azul/roxo, quase preto.
        val BG_0 = Color.rgb(0x01, 0x04, 0x0b)
        val BG_1 = Color.rgb(0x03, 0x08, 0x14)
        val BG_2 = Color.rgb(0x09, 0x08, 0x21)
        // Proporcional à altura: em 1080p a data tem ~39 px, a hora ~120 px e o bloco
        // anda ~130 px/s.
        const val DATE_SIZE_RATIO = 0.036f
        const val GAP_RATIO = 0.016f
        const val SPEED_RATIO = 0.12f
        const val REFERENCE_SIZE = 100f
        const val MAX_STEP_S = 0.1f
    }
}
