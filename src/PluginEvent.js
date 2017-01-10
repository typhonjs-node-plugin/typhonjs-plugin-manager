/**
 * PluginEvent - Provides the data / event passed to all invoked methods in {@link PluginManager#invokeSyncEvent}. The
 * `event.data` field is returned to the caller. Before returning though additional the following additional metadata
 * is attached:
 *
 * (number)          `$$plugin_invoke_count` - The count of plugins invoked.
 *
 * (Array<string>)   `$$plugin_invoke_names` - The names of plugins invoked.
 */
export default class PluginEvent
{
   /**
    * Initializes PluginEvent.
    *
    * @param {object} copyProps - Event data to copy.
    * @param {object} passthruProps - Event data to pass through.
    */
   constructor(copyProps = {}, passthruProps = {})
   {
      /**
       * Provides the unified event data assigning any pass through data to the copied data supplied.
       */
      this.data = Object.assign(JSON.parse(JSON.stringify(copyProps)), passthruProps);

      /**
       * Unique data available in each plugin invoked.
       * @type {EventProxy} - The active EventProxy for that particular plugin.
       */
      this.eventbus = void 0;

      /**
       * Unique data available in each plugin invoked.
       * @type {string} - The active plugin name.
       */
      this.pluginName = void 0;

      /**
       * Unique data available in each plugin invoked.
       * @type {object} - The active plugin options.
       */
      this.pluginOptions = void 0;
   }
}
