/**
 * Defines a class holding the data associated with a plugin including it's instance.
 */
export default class PluginEntry
{
   /**
    * Instantiates a PluginEntry.
    *
    * @param {string}      name - The plugin name.
    * @param {string}      type - The plugin type: `instance`, `require-module`, `require-path`.
    * @param {string}      target - The plugin target: a local file path or module name.
    * @param {Object}      instance - The loaded plugin instance.
    * @param {EventProxy}  eventProxy - An EventProxy associated with the plugin wrapping the plugin manager eventbus.
    * @param {object}      [options] - Optional plugin options.
    */
   constructor(name, type, target, instance, eventProxy = void 0, options = {})
   {
      /**
       * The plugin enabled state.
       * @type {boolean}
       * @private
       */
      this._enabled = true;

      /**
       * The plugin name.
       * @type {string}
       * @private
       */
      this._name = name;

      /**
       * The plugin type: `instance`, `require-module`, `require-path`.
       * @type {string}
       * @private
       */
      this._type = type;

      /**
       * The plugin target: a local file path or module name.
       * @type {string}
       * @private
       */
      this._target = target;

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

      // Create escaped version of target
      if (typeof target === 'string')
      {
         // Remove any leading relative directory paths.
         let escaped = target.replace(/^(\.\.|\.)/, '');

         // Escape any forward / reverse slashes for RegExp creation.
         escaped = escaped.replace(/[\\]/g, '\\');
         escaped = escaped.replace(/[\/]/g, '\\/');

         /**
          * Provides a sanitized escaped target string suitable for RegExp construction.
          * @type {string}
          */
         this._targetEscaped = escaped;
      }
   }

   /**
    * Get enabled.
    * @returns {boolean}
    */
   get enabled() { return this._enabled; }

   /**
    * Set enabled.
    * @param {boolean} enabled - New enabled state.
    */
   set enabled(enabled)
   {
      /**
       * The plugin enabled state.
       * @type {boolean}
       * @private
       */
      this._enabled = enabled;
   }

   /**
    * Get associated EventProxy.
    * @returns {EventProxy}
    */
   get eventProxy() { return this._eventProxy; }

   /**
    * Get plugin instance.
    * @returns {Object}
    */
   get instance() { return this._instance; }

   /**
    * Get name.
    * @returns {string}
    */
   get name() { return this._name; }

   /**
    * Get plugin target.
    * @returns {string}
    */
   get target() { return this._target; }

   /**
    * Get escaped plugin target.
    * @returns {string}
    */
   get targetEscaped() { return this._targetEscaped; }

   /**
    * Get plugin type.
    * @returns {string}
    */
   get type() { return this._type; }

   /**
    * Get plugin options.
    * @returns {Object}
    */
   get options() { return this._options; }
}
