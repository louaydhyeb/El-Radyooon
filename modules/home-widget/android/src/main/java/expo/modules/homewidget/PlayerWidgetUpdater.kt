package expo.modules.homewidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.view.View
import android.widget.RemoteViews

object PlayerWidgetUpdater {
  const val PREFS = "el_radyooon_home_widget"
  const val KEY_STATION = "stationName"
  const val KEY_SUBTITLE = "subtitle"
  const val KEY_PLAYING = "isPlaying"
  const val KEY_HAS_STATION = "hasStation"
  const val KEY_TOGGLE_LABEL = "toggleLabel"

  const val ACTION_TOGGLE = "expo.modules.homewidget.TOGGLE"
  private const val AUDIO_TOGGLE = "expo.modules.audio.action.TOGGLE"
  private const val AUDIO_SERVICE = "expo.modules.audio.service.AudioControlsService"

  fun publish(
    context: Context,
    stationName: String,
    subtitle: String,
    isPlaying: Boolean,
    hasStation: Boolean,
    toggleLabel: String,
  ) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_STATION, stationName)
      .putString(KEY_SUBTITLE, subtitle)
      .putBoolean(KEY_PLAYING, isPlaying)
      .putBoolean(KEY_HAS_STATION, hasStation)
      .putString(KEY_TOGGLE_LABEL, toggleLabel)
      .apply()
    refresh(context)
  }

  fun refresh(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    val ids = manager.getAppWidgetIds(ComponentName(context, PlayerWidgetProvider::class.java))
    if (ids.isEmpty()) {
      return
    }
    val views = buildViews(context)
    manager.updateAppWidget(ids, views)
  }

  fun buildViews(context: Context): RemoteViews {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val hasStation = prefs.getBoolean(KEY_HAS_STATION, false)
    val isPlaying = prefs.getBoolean(KEY_PLAYING, false)
    val stationName = prefs.getString(KEY_STATION, null)
      ?.takeIf { it.isNotBlank() }
      ?: context.getString(R.string.widget_empty_title)
    val subtitle = prefs.getString(KEY_SUBTITLE, null)
      ?.takeIf { it.isNotBlank() }
      ?: context.getString(R.string.widget_empty_subtitle)
    val toggleLabel = prefs.getString(KEY_TOGGLE_LABEL, null)
      ?.takeIf { it.isNotBlank() }
      ?: context.getString(if (isPlaying) R.string.widget_pause else R.string.widget_play)

    val views = RemoteViews(context.packageName, R.layout.player_widget)
    views.setTextViewText(R.id.widget_station, stationName)
    views.setTextViewText(R.id.widget_subtitle, subtitle)
    views.setImageViewResource(
      R.id.widget_toggle,
      if (hasStation && isPlaying) R.drawable.widget_ic_pause else R.drawable.widget_ic_play,
    )
    views.setContentDescription(R.id.widget_toggle, toggleLabel)
    views.setViewVisibility(R.id.widget_toggle, View.VISIBLE)

    views.setOnClickPendingIntent(R.id.widget_root, openAppIntent(context))
    views.setOnClickPendingIntent(R.id.widget_toggle, toggleIntent(context))
    return views
  }

  fun requestToggle(context: Context) {
    val hasStation = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getBoolean(KEY_HAS_STATION, false)
    if (!hasStation) {
      openApp(context)
      return
    }
    if (HomeWidgetModule.emitToggle()) {
      return
    }
    if (!startAudioToggle(context)) {
      openApp(context)
    }
  }

  private fun startAudioToggle(context: Context): Boolean {
    return try {
      val intent = Intent().setClassName(context.packageName, AUDIO_SERVICE).setAction(AUDIO_TOGGLE)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
      true
    } catch (_: Exception) {
      false
    }
  }

  fun openApp(context: Context) {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
    context.startActivity(launch)
  }

  private fun openAppIntent(context: Context): PendingIntent {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: Intent().setClassName(context.packageName, "${context.packageName}.MainActivity")
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
    return PendingIntent.getActivity(context, 1002, launch, pendingFlags())
  }

  private fun toggleIntent(context: Context): PendingIntent {
    val intent = Intent(context, PlayerWidgetProvider::class.java).setAction(ACTION_TOGGLE)
    return PendingIntent.getBroadcast(context, 1001, intent, pendingFlags())
  }

  private fun pendingFlags(): Int {
    return PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  }
}
