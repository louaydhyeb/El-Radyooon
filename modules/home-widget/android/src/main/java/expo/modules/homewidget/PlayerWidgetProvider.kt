package expo.modules.homewidget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent

class PlayerWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    val views = PlayerWidgetUpdater.buildViews(context)
    appWidgetIds.forEach { id ->
      appWidgetManager.updateAppWidget(id, views)
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == PlayerWidgetUpdater.ACTION_TOGGLE) {
      PlayerWidgetUpdater.requestToggle(context)
      return
    }
    super.onReceive(context, intent)
  }
}
