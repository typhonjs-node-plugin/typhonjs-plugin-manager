/**
 * Defines a class holding the data associated with a plugin including it's instance.
 */
export default class PluginEntry
{
   /**
    * Get enabled.
    * @returns {boolean}
    */
   get enabled() { return this._enabled; }

   /**
    * Get name.
    * @returns {string}
    */
   get name() { return this._name; }

   /**
    * Get plugin type.
    * @returns {string}
    */
   get type() { return this._type; }

   /**
    * Get plugin instance.
    * @returns {Object}
    */
   get instance() { return this._instance; }

   /**
    * Get associated EventProxy.
    * @returns {EventProxy}
    */
   get eventProxy() { return this._eventProxy; }

   /**
    * Get plugin options.
    * @returns {Object}
    */
   get options() { return this._options; }

   /**
    * Set enabled.
    * @param {boolean} enabled - New enabled state.
    */
   set enabled(enabled) { this._enabled = enabled; }

   /**
    * Instantiates a PluginEntry.
    *
    * @param {string}      name - The plugin name.
    * @param {string}      type - The plugin type: `require` or `instance`.
    * @param {Object}      instance - The loaded plugin instance.
    * @param {EventProxy}  eventProxy - An EventProxy associated with the plugin wrapping the plugin manager eventbus.
    * @param {object}      [options] - Optional plugin options.
    */
   constructor(name, type, instance, eventProxy = void 0, options = void 0)
   {
      /**
       * The plugin enabled state.
       * @type {boolean}
       */
      this._enabled = true;

      /**
       * The plugin name.
       * @type {string}
       * @private
       */
      this._name = name;

      /**
       * The plugin type: `require` or `instance`.
       * @type {string}
       * @private
       */
      this._type = type;

      /**
       * The loaded plugin instance.
       * @type {Object}
       * @private
       */
      this._instance = instance;

      /**
       * An EventProxy associated with the plugin wrapping the plugin manager eventbus.
       * @type {EventProxy}
       * @private
       */
      this._eventProxy = eventProxy;

      /**
       * Optional plugin options.
       * @type {Object}
       * @private
       */
      this._options = options;
   }
}
