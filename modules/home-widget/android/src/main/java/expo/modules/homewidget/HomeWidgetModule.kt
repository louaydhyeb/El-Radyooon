package expo.modules.homewidget

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference

class HomeWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HomeWidget")
    Events("onToggle")

    OnCreate {
      instance = WeakReference(this@HomeWidgetModule)
    }

    OnDestroy {
      if (instance?.get() === this@HomeWidgetModule) {
        instance = null
      }
    }

    AsyncFunction("update") { stationName: String, subtitle: String, isPlaying: Boolean, hasStation: Boolean, toggleLabel: String ->
      val context = appContext.reactContext?.applicationContext ?: return@AsyncFunction
      PlayerWidgetUpdater.publish(context, stationName, subtitle, isPlaying, hasStation, toggleLabel)
    }
  }

  companion object {
    @Volatile
    private var instance: WeakReference<HomeWidgetModule>? = null

    fun emitToggle(): Boolean {
      val module = instance?.get() ?: return false
      module.sendEvent("onToggle")
      return true
    }
  }
}
