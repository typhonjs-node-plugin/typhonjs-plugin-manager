import path         from 'path';

import EventProxy   from 'backbone-esnext-events/src/EventProxy.js';

import PluginEntry  from './PluginEntry.js';
import PluginEvent  from './PluginEvent.js';

/**
 * Provides a lightweight plugin manager for Node / NPM with optional `backbone-esnext-events`
 * integration for plugins in a safe and protected manner across NPM modules, local files, and preloaded object
 * instances. This pattern facilitates message passing between modules versus direct dependencies / method invocation.
 *
 * It isn't necessary to use an eventbus associated with the plugin manager though invocation then relies on invoking
 * methods directly with the plugin manager instance.
 *
 * When passing in an eventbus from `backbone-esnext-events` the plugin manager will register by default under these
 * event categories:
 *
 * `plugins:add` - {@link PluginManager#add}
 *
 * `plugins:add:all` - {@link PluginManager#addAll}
 *
 * `plugins:enable:all:plugins` - {@link PluginManager#enableAllPlugins}
 *
 * `plugins:enable:plugin` - {@link PluginManager#enablePlugin}
 *
 * `plugins:enable:plugins` - {@link PluginManager#enablePlugins}
 *
 * `plugins:get:method:names` - {@link PluginManager#getMethodNames}
 *
 * `plugins:get:options` - {@link PluginManager#getOptions}
 *
 * `plugins:get:plugin:method:names` - {@link PluginManager#getPluginMethodNames}
 *
 * `plugins:get:plugin:names` - {@link PluginManager#getPluginNames}
 *
 * `plugins:get:plugin:options` - {@link PluginManager#getPluginOptions}
 *
 * `plugins:has:method` - {@link PluginManager#hasMethod}
 *
 * `plugins:has:plugin` - {@link PluginManager#hasPlugin}
 *
 * `plugins:has:plugin:method` - {@link PluginManager#hasPluginMethod}
 *
 * `plugins:invoke:async` - {@link PluginManager#invokeAsync}
 *
 * `plugins:invoke:sync` - {@link PluginManager#invokeSync}
 *
 * `plugins:invoke:sync:event` - {@link PluginManager#invokeSyncEvent}
 *
 * `plugins:remove` - {@link PluginManager#remove}
 *
 * `plugins:remove:all` - {@link PluginManager#removeAll}
 *
 * Automatically when a plugin is loaded and unloaded respective callbacks `onPluginLoad` and `onPluginUnload` will
 * be attempted to be invoked on the plugin. This is an opportunity for the plugin to receive any associated eventbus
 * and wire itself into it. It should be noted that a protected proxy around the eventbus is passed to the plugins
 * such that when the plugin is removed automatically all events registered on the eventbus are cleaned up without
 * a plugin author needing to do this manually in the `onPluginUnload` callback. This solves any dangling event binding
 * issues.
 *
 * If eventbus functionality is enabled it is important especially if using a process / global level eventbus such as
 * `backbone-esnext-eventbus` to call {@link PluginManager#destroy} to clean up all plugin eventbus resources and
 * the plugin manager event bindings.
 *
 * @see https://www.npmjs.com/package/backbone-esnext-events
 * @see https://www.npmjs.com/package/backbone-esnext-eventbus
 *
 * @example
 * import Events        from 'backbone-esnext-events';   // Imports the TyphonEvents class for local usage.
 * ::or alternatively::
 * import eventbus      from 'backbone-esnext-eventbus'; // Imports a global / process level eventbus.
 *
 * import PluginManager from 'typhonjs-plugin-manager';
 *
 * const pluginManager = new PluginManager({ eventbus });
 *
 * pluginManager.add({ name: 'an-npm-plugin-enabled-module' });
 * pluginManager.add({ name: 'my-local-module', target: './myModule.js' });
 *
 * // Let's say an-npm-plugin-enabled-module responds to 'cool:event' which returns 'true'.
 * // Let's say my-local-module responds to 'hot:event' which returns 'false'.
 * // Both of the plugin / modules will have 'onPluginLoaded' invoked with a proxy to the eventbus and any plugin
 * // options defined.
 *
 * // One can then use the eventbus functionality to invoke associated module / plugin methods even retrieving results.
 * assert(eventbus.triggerSync('cool:event') === true);
 * assert(eventbus.triggerSync('hot:event') === false);
 *
 * // One can also indirectly invoke any method of the plugin via:
 * eventbus.triggerSync('plugins:invoke:sync:event', 'aCoolMethod'); // Any plugin with a method named `aCoolMethod` is invoked.
 * eventbus.triggerSync('plugins:invoke:sync:event', 'aCoolMethod', {}, {}, 'an-npm-plugin-enabled-module'); // specific invocation.
 *
 * // The 3rd parameter defines a pass through object hash and the 4th will make a copy of the hash sending a single
 * // event / object hash to the invoked method.
 *
 * // -----------------------
 *
 * // Given that `backbone-esnext-eventbus` defines a global / process level eventbus you can import it in an entirely
 * // different file or even NPM module and invoke methods of loaded plugins like this:
 *
 * import eventbus from 'backbone-esnext-eventbus';
 *
 * eventbus.triggerSync('plugins:invoke', 'aCoolMethod'); // Any plugin with a method named `aCoolMethod` is invoked.
 *
 * assert(eventbus.triggerSync('cool:event') === true);
 *
 * eventbus.trigger('plugins:remove', 'an-npm-plugin-enabled-module'); // Removes the plugin and unregisters events.
 *
 * assert(eventbus.triggerSync('cool:event') === true); // Will now fail!
 *
 * // In this case though when using the global eventbus be mindful to always call `pluginManager.destroy()` in the main
 * // thread of execution scope to remove all plugins and the plugin manager event bindings!
 */
export default class PluginManager
{
   /**
    * Instantiates PluginManager
    *
    * @param {object}   [options] - Provides various configuration options:
    *
    * @param {TyphonEvents}   [options.eventbus] - An instance of 'backbone-esnext-events' used as the plugin eventbus.
    *
    * @param {string}   [options.eventPrepend='plugin'] - A customized name to prepend PluginManager events on the
    *                                                     eventbus.
    *
    * @param {boolean}  [options.throwNoMethod=false] - If true then when a method fails to be invoked by any plugin
    *                                                   an exception will be thrown.
    *
    * @param {boolean}  [options.throwNoPlugin=false] - If true then when no plugin is matched to be invoked an
    *                                                   exception will be thrown.
    */
   constructor(options = {})
   {
      if (typeof options !== 'object') { throw new TypeError(`'options' is not an object.`); }

      /**
       * Stores the plugins by name with an associated PluginEntry.
       * @type {Map<string, PluginEntry>}
       * @private
       */
      this._pluginMap = new Map();

      /**
       * Stores any associated eventbus.
       * @type {TyphonEvents}
       * @private
       */
      this._eventbus = null;

      /**
       * Defines options for throwing exceptions. Turned off by default.
       * @type {ManagerOptions}
       * @private
       */
      this._options = { noEventAdd: false, noEventRemoval: false, throwNoMethod: false, throwNoPlugin: false };

      if (typeof options.eventbus === 'object') { this.setEventbus(options.eventbus, options.eventPrepend); }

      this.setOptions(options);
   }

   /**
    * Adds a plugin by the given configuration parameters. A plugin `name` is always required. If no other options
    * are provided then the `name` doubles as the NPM module / local file to load. The loading first checks for an
    * existing `instance` to use as the plugin. Then the `target` is chosen as the NPM module / local file to load.
    * By passing in `options` this will be stored and accessible to the plugin during all callbacks.
    *
    * @param {PluginConfig}   pluginConfig - Defines the plugin to load.
    */
   add(pluginConfig)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof pluginConfig !== 'object') { throw new TypeError(`'pluginConfig' is not an 'object'.`); }

      if (typeof pluginConfig.name !== 'string')
      {
         throw new TypeError(`'pluginConfig.name' is not a 'string' for entry: ${JSON.stringify(pluginConfig)}.`);
      }

      if (typeof pluginConfig.target !== 'undefined' && typeof pluginConfig.target !== 'string')
      {
         throw new TypeError(`'pluginConfig.target' is not a string for entry: ${JSON.stringify(pluginConfig)}.`);
      }

      if (typeof pluginConfig.options !== 'undefined' && typeof pluginConfig.options !== 'object')
      {
         throw new TypeError(`'pluginConfig.options' is not an 'object' for entry: ${JSON.stringify(pluginConfig)}.`);
      }

      let instance, type;

      // Use an existing instance of a plugin
      if (typeof pluginConfig.instance === 'object')
      {
         instance = pluginConfig.instance;
         type = 'instance';
      }
      else
      {
         // If a target is defined use it instead of the name.
         const target = pluginConfig.target || pluginConfig.name;

         if (target.match(/^[.\/\\]/))
         {
            instance = require(path.resolve(target)); // eslint-disable global-require
         }
         else
         {
            instance = require(target);               // eslint-disable global-require
         }

         type = 'require';
      }

      const eventProxy = this._eventbus !== null && typeof this._eventbus !== 'undefined' ?
       new EventProxy(this._eventbus) : void 0;

      this._pluginMap.set(pluginConfig.name, new PluginEntry(pluginConfig.name, type, instance, eventProxy,
       pluginConfig.options));

      // Invoke private module method which allows skipping optional error checking.
      s_INVOKE_SYNC_EVENTS('onPluginLoad', {}, {}, pluginConfig.name, this._pluginMap, this._options, false);
   }

   /**
    * Initializes multiple plugins in a single call.
    *
    * @param {Array<PluginConfig>} pluginConfigs - An array of plugin config object hash entries.
    */
   addAll(pluginConfigs = [])
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (!Array.isArray(pluginConfigs)) { throw new TypeError(`'plugins' is not an array.`); }

      for (const pluginConfig of pluginConfigs) { this.add(pluginConfig); }
   }

   /**
    * Provides the eventbus callback which may prevent addition if optional `noEventAdd` is enabled. This disables
    * the ability for plugins to be added via events preventing any external code adding plugins in this manner.
    *
    * @param {string}   pluginName - The plugin name to remove.
    *
    * @returns {boolean} - Operation success.
    * @private
    */
   _addEventbus(pluginName)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return !this._options.noEventAdd ? this.add(pluginName) : false;
   }

   /**
    * Provides the eventbus callback which may prevent addition if optional `noEventAdd` is enabled. This disables
    * the ability for plugins to be added via events preventing any external code adding plugins in this manner.
    *
    * @private
    */
   _addAllEventbus()
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (!this._options.noEventAdd) { this.addAll(); }
   }

   /**
    * Destroys all managed plugins after unloading them.
    */
   destroy()
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      this.removeAll();

      if (this._eventbus !== null && typeof this._eventbus !== 'undefined')
      {
         this._eventbus.off(`${this._eventPrepend}:add`, this._addEventbus, this);
         this._eventbus.off(`${this._eventPrepend}:add:all`, this._addAllEventbus, this);
         this._eventbus.off(`${this._eventPrepend}:enable:all:plugins`, this.enableAllPlugins, this);
         this._eventbus.off(`${this._eventPrepend}:enable:plugin`, this.enablePlugin, this);
         this._eventbus.off(`${this._eventPrepend}:enable:plugins`, this.enablePlugins, this);
         this._eventbus.off(`${this._eventPrepend}:get:method:names`, this.getMethodNames, this);
         this._eventbus.off(`${this._eventPrepend}:get:options`, this.getOptions, this);
         this._eventbus.off(`${this._eventPrepend}:get:plugin:method:names`, this.getPluginMethodNames, this);
         this._eventbus.off(`${this._eventPrepend}:get:plugin:names`, this.getPluginNames, this);
         this._eventbus.off(`${this._eventPrepend}:get:plugin:options`, this.getPluginOptions, this);
         this._eventbus.off(`${this._eventPrepend}:has:method`, this.hasMethod, this);
         this._eventbus.off(`${this._eventPrepend}:has:plugin`, this.hasPlugin, this);
         this._eventbus.off(`${this._eventPrepend}:has:plugin:method`, this.hasPluginMethod, this);
         this._eventbus.off(`${this._eventPrepend}:invoke:async`, this.invokeAsync, this);
         this._eventbus.off(`${this._eventPrepend}:invoke:sync`, this.invokeSync, this);
         this._eventbus.off(`${this._eventPrepend}:invoke:sync:event`, this.invokeSyncEvent, this);
         this._eventbus.off(`${this._eventPrepend}:remove`, this._removeEventbus, this);
         this._eventbus.off(`${this._eventPrepend}:remove:all`, this._removeAllEventbus, this);
      }

      this._pluginMap = null;
      this._eventbus = null;
   }

   /**
    * Enables or disables all plugins.
    *
    * @param {boolean}  enabled - The new enabled state.
    */
   enableAllPlugins(enabled)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof enabled !== 'boolean') { throw new TypeError(`'enabled' is not a boolean.`); }

      for (const plugin of this._pluginMap.values()) { plugin.enabled = enabled; }
   }

   /**
    * Enables or disables a single plugin.
    *
    * @param {string}   pluginName - Plugin name to set state.
    * @param {boolean}  enabled - The new enabled state.
    *
    * @returns {boolean} - Operation success.
    */
   enablePlugin(pluginName, enabled)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof pluginName !== 'string') { throw new TypeError(`'pluginName' is not a string.`); }
      if (typeof enabled !== 'boolean') { throw new TypeError(`'enabled' is not a boolean.`); }

      const entry = this._pluginMap.get(pluginName);

      if (entry instanceof PluginEntry)
      {
         entry.enabled = enabled;
         return true;
      }

      return false;
   }

   /**
    * Enables or disables a set of plugins given an array or iterabe of plugin names.
    *
    * @param {Array<string>}  pluginNames - An array / iterable of plugin names.
    * @param {boolean}        enabled - The new enabled state.
    *
    * @returns {boolean} - Operation success.
    */
   enablePlugins(pluginNames, enabled)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof enabled !== 'boolean') { throw new TypeError(`'enabled' is not a boolean.`); }

      let success = true;

      for (const pluginName of pluginNames)
      {
         const entry = this._pluginMap.get(pluginName);

         if (entry instanceof PluginEntry)
         {
            entry.enabled = enabled;
         }
         else
         {
            success = false;
         }
      }

      return success;
   }

   /**
    * Returns any associated eventbus.
    *
    * @returns {TyphonEvents|null}
    */
   getEventbus()
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return this._eventbus;
   }

   /**
    * Returns all method names or if a boolean is passed in will return method names for plugins by current enabled
    * state.
    *
    * @param {boolean|undefined} enabled - If enabled is a boolean it will return plugin methods names given their
    *                                      enabled state.
    *
    * @param {string|undefined}  pluginName - If a string then just this plugins methods names are returned.
    *
    * @returns {Array<string>}
    */
   getMethodNames(enabled = void 0, pluginName = void 0)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof enabled !== 'boolean' && typeof enabled !== 'undefined')
      {
         throw new TypeError(`'enabled' is not a 'boolean' or 'undefined'.`);
      }

      const results = {};
      const allEnabled = typeof enabled === 'undefined';
      const allNames = typeof pluginName === 'undefined';

      for (const plugin of this._pluginMap.values())
      {
         if (plugin.instance && (allEnabled || plugin.enabled === enabled) && (allNames || plugin.name === pluginName))
         {
            for (const name of s_GET_ALL_PROPERTY_NAMES(plugin.instance))
            {
               // Skip any names that are not a function or are the constructor.
               if (plugin.instance[name] instanceof Function && name !== 'constructor') { results[name] = true; }
            }
         }
      }

      return Object.keys(results);
   }

   /**
    * Returns a copy of the plugin manager options.
    *
    * @returns {ManagerOptions}
    */
   getOptions()
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return JSON.parse(JSON.stringify(this._options));
   }

   /**
    * Returns all plugin names or if a boolean is passed in will return plugin names by current enabled state.
    *
    * @param {boolean|undefined} enabled - If enabled is a boolean it will return plugins given their enabled state.
    *
    * @returns {Array<{plugin: string, method: string}>}
    */
   getPluginMethodNames(enabled = void 0)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof enabled !== 'boolean' && typeof enabled !== 'undefined')
      {
         throw new TypeError(`'enabled' is not a 'boolean' or 'undefined'.`);
      }

      const results = [];
      const allPlugins = typeof enabled === 'undefined';

      for (const plugin of this._pluginMap.values())
      {
         if (plugin.instance && (allPlugins || plugin.enabled === enabled))
         {
            for (const name of s_GET_ALL_PROPERTY_NAMES(plugin.instance))
            {
               // Skip any names that are not a function or are the constructor.
               if (plugin.instance[name] instanceof Function && name !== 'constructor')
               {
                  results.push({ plugin: plugin.name, method: name });
               }
            }
         }
      }

      return results;
   }

   /**
    * Returns all plugin names or if a boolean is passed in will return plugin names by current enabled state.
    *
    * @param {boolean|undefined} enabled - If enabled is a boolean it will return plugins given their enabled state.
    *
    * @returns {Array<string>}
    */
   getPluginNames(enabled = void 0)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof enabled !== 'boolean' && typeof enabled !== 'undefined')
      {
         throw new TypeError(`'enabled' is not a 'boolean' or 'undefined'.`);
      }

      // Return all plugin names if enabled is not defined.
      if (enabled === void 0) { return Array.from(this._pluginMap.keys()); }

      const results = [];

      for (const plugin of this._pluginMap.values())
      {
         if (plugin.enabled === enabled) { results.push(plugin.name); }
      }

      return results;
   }

   /**
    * Returns a copy of the given plugin options.
    *
    * @param {string}   pluginName - Plugin name to retrieve.
    *
    * @returns {*}
    */
   getPluginOptions(pluginName)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof pluginName !== 'string') { throw new TypeError(`'pluginName' is not a string.`); }

      let result;

      const entry = this._pluginMap.get(pluginName);

      if (entry instanceof PluginEntry) { result = JSON.parse(JSON.stringify(entry.options)); }

      return result;
   }

   /**
    * Returns true if there is at least one plugin loaded with the given method name.
    *
    * @param {string}   methodName - Method name to test.
    *
    * @returns {boolean} - True method is found.
    */
   hasMethod(methodName)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof methodName !== 'string') { throw new TypeError(`'methodName' is not a string.`); }

      for (const plugin of this._pluginMap.values())
      {
         if (typeof plugin.instance[methodName] === 'function') { return true; }
      }

      return false;
   }

   /**
    * Returns true if there is a plugin loaded with the given plugin name.
    *
    * @param {string}   pluginName - Plugin name to test.
    *
    * @returns {boolean} - True if a plugin exists.
    */
   hasPlugin(pluginName)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof pluginName !== 'string') { throw new TypeError(`'pluginName' is not a string.`); }

      return this._pluginMap.has(pluginName);
   }

   /**
    * Returns true if there is a plugin loaded with the given plugin name that also has a method with the given
    * method name.
    *
    * @param {string}   pluginName - Plugin name to test.
    * @param {string}   methodName - Method name to test.
    *
    * @returns {boolean} - True if a plugin and method exists.
    */
   hasPluginMethod(pluginName, methodName)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof pluginName !== 'string') { throw new TypeError(`'pluginName' is not a string.`); }
      if (typeof methodName !== 'string') { throw new TypeError(`'methodName' is not a string.`); }

      const plugin = this._pluginMap.get(pluginName);

      return plugin instanceof PluginEntry && typeof plugin[methodName] === 'function';
   }

   /**
    * This dispatch method uses ES6 Promises and adds any returned results to an array which is added to a Promise.all
    * construction which passes back a Promise which waits until all Promises complete. Any target invoked may return a
    * Promise or any result. This is very useful to use for any asynchronous operations.
    *
    * @param {string|Array<string>} nameOrList - An optional plugin name or array / iterable of plugin names to
    *                                            invoke.
    * @param {string}               methodName - Method name to invoke.
    * @param {*}                    args - Optional arguments.
    *
    * @returns {*|Array<*>}
    */
   invokeAsync(nameOrList = this._pluginMap.keys(), methodName, ...args)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof nameOrList !== 'string' && !Array.isArray(nameOrList) &&
       typeof nameOrList[Symbol.iterator] !== 'function')
      {
         throw new TypeError(`'nameOrList' is not a string, array, or iterator.`);
      }

      if (typeof methodName !== 'string') { throw new TypeError(`'methodName' is not a string.`); }

      // Track if a plugin method is invoked.
      let hasMethod = false;
      let hasPlugin = false;

      // Capture results.
      let result;
      const results = [];

      try
      {
         if (typeof nameOrList === 'string')
         {
            const plugin = this._pluginMap.get(nameOrList);

            if (plugin instanceof PluginEntry && plugin.enabled && plugin.instance)
            {
               hasPlugin = true;

               if (typeof plugin.instance[methodName] === 'function')
               {
                  result = args.length > 0 ? plugin.instance[methodName](...args) : plugin.instance[methodName]();

                  // If we received a valid result return immediately.
                  if (result !== null || typeof result !== 'undefined') { results.push(result); }

                  hasMethod = true;
               }
            }
         }
         else
         {
            for (const name of nameOrList)
            {
               const plugin = this._pluginMap.get(name);

               if (plugin instanceof PluginEntry && plugin.enabled && plugin.instance)
               {
                  hasPlugin = true;

                  if (typeof plugin.instance[methodName] === 'function')
                  {
                     result = args.length > 0 ? plugin.instance[methodName](...args) : plugin.instance[methodName]();

                     // If we received a valid result return immediately.
                     if (result !== null || typeof result !== 'undefined') { results.push(result); }

                     hasMethod = true;
                  }
               }
            }
         }

         if (this._options.throwNoPlugin && !hasPlugin)
         {
            return Promise.reject(new Error(`PluginManager failed to find any target plugins.`));
         }

         if (this._options.throwNoMethod && !hasMethod)
         {
            return Promise.reject(new Error(`PluginManager failed to invoke '${methodName}'.`));
         }
      }
      catch (error)
      {
         return Promise.reject(error);
      }

      // If there are multiple results then use Promise.all otherwise Promise.resolve.
      return results.length > 1 ? Promise.all(results) : Promise.resolve(result);
   }

   /**
    * This dispatch method synchronously passes back a single value or an array with all results returned by any
    * invoked targets.
    *
    * @param {string|Array<string>} nameOrList - An optional plugin name or array / iterable of plugin names to
    *                                             invoke.
    * @param {string}               methodName - Method name to invoke.
    * @param {*}                    args - Optional arguments.
    *
    * @returns {*|Array<*>}
    */
   invokeSync(nameOrList = this._pluginMap.keys(), methodName, ...args)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof nameOrList !== 'string' && !Array.isArray(nameOrList) &&
       typeof nameOrList[Symbol.iterator] !== 'function')
      {
         throw new TypeError(`'nameOrList' is not a string, array, or iterator.`);
      }

      if (typeof methodName !== 'string') { throw new TypeError(`'methodName' is not a string.`); }

      // Track if a plugin method is invoked.
      let hasMethod = false;
      let hasPlugin = false;

      // Capture results.
      let result;
      const results = [];

      if (typeof nameOrList === 'string')
      {
         const plugin = this._pluginMap.get(nameOrList);

         if (plugin instanceof PluginEntry && plugin.enabled && plugin.instance)
         {
            hasPlugin = true;

            if (typeof plugin.instance[methodName] === 'function')
            {
               result = args.length > 0 ? plugin.instance[methodName](...args) : plugin.instance[methodName]();

               // If we received a valid result return immediately.
               if (result !== null || typeof result !== 'undefined') { results.push(result); }

               hasMethod = true;
            }
         }
      }
      else
      {
         for (const name of nameOrList)
         {
            const plugin = this._pluginMap.get(name);

            if (plugin instanceof PluginEntry && plugin.enabled && plugin.instance)
            {
               hasPlugin = true;

               if (typeof plugin.instance[methodName] === 'function')
               {
                  result = args.length > 0 ? plugin.instance[methodName](...args) : plugin.instance[methodName]();

                  // If we received a valid result return immediately.
                  if (result !== null || typeof result !== 'undefined') { results.push(result); }

                  hasMethod = true;
               }
            }
         }
      }

      if (this._options.throwNoPlugin && !hasPlugin)
      {
         throw new Error(`PluginManager failed to find any target plugins.`);
      }

      if (this._options.throwNoMethod && !hasMethod)
      {
         throw new Error(`PluginManager failed to invoke '${methodName}'.`);
      }

      // Return the results array if there are more than one or just a single result.
      return results.length > 1 ? results : result;
   }

   /**
    * This dispatch method synchronously passes to and returns from any invoked targets a PluginEvent.
    *
    * @param {string}                methodName - Method name to invoke.
    *
    * @param {object}                copyProps - plugin event object.
    *
    * @param {object}                passthruProps - if true, event has plugin option.
    *
    * @param {string|Array<string>}  nameOrList - An optional plugin name or array / iterable of plugin names to
    *                                             invoke.
    *
    * @returns {PluginEvent}
    */
   invokeSyncEvent(methodName, copyProps = {}, passthruProps = {}, nameOrList = this._pluginMap.keys())
   {
      // Invokes the private internal sync events method with optional error checking enabled.
      return s_INVOKE_SYNC_EVENTS(methodName, copyProps, passthruProps, nameOrList, this._pluginMap, this._options);
   }

   /**
    * Sets the eventbus associated with this plugin manager. If any previous eventbus was associated all plugin manager
    * events will be removed then added to the new eventbus. If there are any existing plugins being managed their
    * events will be removed from the old eventbus and then `onPluginLoad` will be called with the new eventbus.
    *
    * @param {TyphonEvents}   targetEventbus - The target eventbus to associate.
    *
    * @param {string}         [eventPrepend='plugins'] - An optional string to prepend to all of the event binding
    *                                                    targets.
    *
    * @returns {PluginManager}
    */
   setEventbus(targetEventbus, eventPrepend = 'plugins')
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (typeof targetEventbus !== 'object') { throw new TypeError(`'targetEventbus' is not an 'object'.`); }
      if (typeof eventPrepend !== 'string') { throw new TypeError(`'eventPrepend' is not a 'string'.`); }

      // Early escape if the targetEventbus is the same as the current eventbus.
      if (targetEventbus === this._eventbus) { return this; }

      const oldPrepend = this._eventPrepend;

      this._eventPrepend = eventPrepend;

      // Unload and reload any existing plugins from the old eventbus to the target eventbus.
      if (this._pluginMap.size > 0)
      {
         // Invoke private module method which allows skipping optional error checking.
         s_INVOKE_SYNC_EVENTS('onPluginUnload', {}, {}, this._pluginMap.keys(), this._pluginMap, this._options, false);

         for (const entry of this._pluginMap.values())
         {
            if (entry.eventProxy instanceof EventProxy) { entry.eventProxy.destroy(); }

            entry.eventProxy = new EventProxy(targetEventbus);
         }

         // Invoke private module method which allows skipping optional error checking.
         s_INVOKE_SYNC_EVENTS('onPluginLoad', {}, {}, this._pluginMap.keys(), this._pluginMap, this._options, false);
      }

      if (this._eventbus !== null)
      {
         this._eventbus.off(`${oldPrepend}:add`, this._addEventbus, this);
         this._eventbus.off(`${oldPrepend}:add:all`, this._addAllEventbus, this);
         this._eventbus.off(`${oldPrepend}:enable:all:plugins`, this.enableAllPlugins, this);
         this._eventbus.off(`${oldPrepend}:enable:plugin`, this.enablePlugin, this);
         this._eventbus.off(`${oldPrepend}:enable:plugins`, this.enablePlugins, this);
         this._eventbus.off(`${oldPrepend}:get:method:names`, this.getMethodNames, this);
         this._eventbus.off(`${oldPrepend}:get:options`, this.getOptions, this);
         this._eventbus.off(`${oldPrepend}:get:plugin:method:names`, this.getPluginMethodNames, this);
         this._eventbus.off(`${oldPrepend}:get:plugin:names`, this.getPluginNames, this);
         this._eventbus.off(`${oldPrepend}:get:plugin:options`, this.getPluginOptions, this);
         this._eventbus.off(`${oldPrepend}:has:method`, this.hasMethod, this);
         this._eventbus.off(`${oldPrepend}:has:plugin`, this.hasPlugin, this);
         this._eventbus.off(`${oldPrepend}:has:plugin:method`, this.hasPluginMethod, this);
         this._eventbus.off(`${oldPrepend}:invoke:async`, this.invokeAsync, this);
         this._eventbus.off(`${oldPrepend}:invoke:sync`, this.invokeSync, this);
         this._eventbus.off(`${oldPrepend}:invoke:sync:event`, this.invokeSyncEvent, this);
         this._eventbus.off(`${oldPrepend}:remove`, this._removeEventbus, this);
         this._eventbus.off(`${oldPrepend}:remove:all`, this._removeAllEventbus, this);
      }

      targetEventbus.on(`${eventPrepend}:add`, this._addEventbus, this);
      targetEventbus.on(`${eventPrepend}:add:all`, this._addAllEventbus, this);
      targetEventbus.on(`${eventPrepend}:enable:all:plugins`, this.enableAllPlugins, this);
      targetEventbus.on(`${eventPrepend}:enable:plugin`, this.enablePlugin, this);
      targetEventbus.on(`${eventPrepend}:enable:plugins`, this.enablePlugins, this);
      targetEventbus.on(`${eventPrepend}:get:method:names`, this.getMethodNames, this);
      targetEventbus.on(`${eventPrepend}:get:options`, this.getOptions, this);
      targetEventbus.on(`${eventPrepend}:get:plugin:method:names`, this.getPluginMethodNames, this);
      targetEventbus.on(`${eventPrepend}:get:plugin:names`, this.getPluginNames, this);
      targetEventbus.on(`${eventPrepend}:get:plugin:options`, this.getPluginOptions, this);
      targetEventbus.on(`${eventPrepend}:has:method`, this.hasMethod, this);
      targetEventbus.on(`${eventPrepend}:has:plugin`, this.hasPlugin, this);
      targetEventbus.on(`${eventPrepend}:has:plugin:method`, this.hasPluginMethod, this);
      targetEventbus.on(`${eventPrepend}:invoke:async`, this.invokeAsync, this);
      targetEventbus.on(`${eventPrepend}:invoke:sync`, this.invokeSync, this);
      targetEventbus.on(`${eventPrepend}:invoke:sync:event`, this.invokeSyncEvent, this);
      targetEventbus.on(`${eventPrepend}:remove`, this._removeEventbus, this);
      targetEventbus.on(`${eventPrepend}:remove:all`, this._removeAllEventbus, this);

      this._eventbus = targetEventbus;

      return this;
   }

   /**
    * Set optional parameters. All parameters are off by default.
    *
    * @param {ManagerOptions} options - Defines optional parameters to set.
    */
   setOptions(options = {})
   {
      if (typeof options !== 'object') { throw new TypeError(`'options' is not an object.`); }

      if (typeof options.noEventAdd === 'boolean') { this._options.noEventAdd = options.noEventAdd; }
      if (typeof options.noEventRemoval === 'boolean') { this._options.noEventRemoval = options.noEventRemoval; }
      if (typeof options.throwNoMethod === 'boolean') { this._options.throwNoMethod = options.throwNoMethod; }
      if (typeof options.throwNoPlugin === 'boolean') { this._options.throwNoPlugin = options.throwNoPlugin; }
   }

   /**
    * Removes a plugin by name after unloading it and clearing any event bindings automatically.
    *
    * @param {string}   pluginName - The plugin name to remove.
    *
    * @returns {boolean} - Operation success.
    */
   remove(pluginName)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      const entry = this._pluginMap.get(pluginName);

      if (entry instanceof PluginEntry)
      {
         // Invoke private module method which allows skipping optional error checking.
         s_INVOKE_SYNC_EVENTS('onPluginUnload', {}, {}, pluginName, this._pluginMap, this._options, false);

         if (entry.eventProxy instanceof EventProxy) { entry.eventProxy.destroy(); }

         this._pluginMap.delete(pluginName);

         return true;
      }

      return false;
   }

   /**
    * Removes all plugins after unloading them and clearing any event bindings automatically.
    */
   removeAll()
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      // Invoke private module method which allows skipping optional error checking.
      s_INVOKE_SYNC_EVENTS('onPluginUnload', {}, {}, this._pluginMap.keys(), this._pluginMap, this._options, false);

      for (const entry of this._pluginMap.values())
      {
         if (entry.eventProxy instanceof EventProxy) { entry.eventProxy.destroy(); }
      }

      this._pluginMap.clear();
   }

   /**
    * Provides the eventbus callback which may prevent removal if optional `noEventRemoval` is enabled. This disables
    * the ability for plugins to be removed via events preventing any external code removing plugins in this manner.
    *
    * @param {string}   pluginName - The plugin name to remove.
    *
    * @returns {boolean} - Operation success.
    * @private
    */
   _removeEventbus(pluginName)
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      return !this._options.noEventRemoval ? this.remove(pluginName) : false;
   }

   /**
    * Provides the eventbus callback which may prevent removal if optional `noEventRemoval` is enabled. This disables
    * the ability for plugins to be removed via events preventing any external code removing plugins in this manner.
    *
    * @private
    */
   _removeAllEventbus()
   {
      if (this._pluginMap === null) { throw new ReferenceError('This PluginManager instance has been destroyed.'); }

      if (!this._options.noEventRemoval) { this.removeAll(); }
   }
}
/**
 * Private implementation to invoke synchronous events. This allows internal calls in PluginManager for
 * `onPluginLoad` and `onPluginUnload` callbacks to bypass optional error checking.
 *
 * This dispatch method synchronously passes to and returns from any invoked targets a PluginEvent.
 *
 * @param {string}                     methodName - Method name to invoke.
 *
 * @param {object}                     copyProps - plugin event object.
 *
 * @param {object}                     passthruProps - if true, event has plugin option.
 *
 * @param {string|Array<string>}       nameOrList - An optional plugin name or array / iterable of plugin names to
 *                                                  invoke.
 *
 * @param {Map<string, PluginEvent>}   pluginMap - Stores the plugins by name with an associated PluginEntry.
 *
 * @param {object}                     options - Defines options for throwing exceptions. Turned off by default.
 *
 * @param {boolean}                    [performErrorCheck=true] - If false optional error checking is disabled.
 *
 * @returns {PluginEvent}
 */
const s_INVOKE_SYNC_EVENTS = (methodName, copyProps = {}, passthruProps = {}, nameOrList, pluginMap, options,
                              performErrorCheck = true) =>
{
   if (typeof methodName !== 'string') { throw new TypeError(`'methodName' is not a string.`); }
   if (typeof passthruProps !== 'object') { throw new TypeError(`'passthruProps' is not an object.`); }
   if (typeof copyProps !== 'object') { throw new TypeError(`'copyProps' is not an object.`); }

   if (typeof nameOrList !== 'string' && !Array.isArray(nameOrList) &&
    typeof nameOrList[Symbol.iterator] !== 'function')
   {
      throw new TypeError(`'nameOrList' is not a string, array, or iterator.`);
   }

   // Track how many plugins were invoked.
   let pluginInvokeCount = 0;
   const pluginInvokeNames = [];

   // Track if a plugin method is invoked
   let hasMethod = false;
   let hasPlugin = false;

   // Create plugin event.
   const ev = new PluginEvent(copyProps, passthruProps);

   if (typeof nameOrList === 'string')
   {
      const plugin = pluginMap.get(nameOrList);

      if (plugin instanceof PluginEntry && plugin.enabled && plugin.instance)
      {
         hasPlugin = true;

         if (typeof plugin.instance[methodName] === 'function')
         {
            ev.eventbus = plugin.eventProxy;
            ev.pluginName = plugin.name;
            ev.pluginOptions = plugin.options;

            plugin.instance[methodName](ev);

            hasMethod = true;
            pluginInvokeCount++;
            pluginInvokeNames.push(plugin.name);
         }
      }
   }
   else
   {
      for (const name of nameOrList)
      {
         const plugin = pluginMap.get(name);

         if (plugin instanceof PluginEntry && plugin.enabled && plugin.instance)
         {
            hasPlugin = true;

            if (typeof plugin.instance[methodName] === 'function')
            {
               ev.eventbus = plugin.eventProxy;
               ev.pluginName = plugin.name;
               ev.pluginOptions = plugin.options;

               plugin.instance[methodName](ev);

               hasMethod = true;
               pluginInvokeCount++;
               pluginInvokeNames.push(plugin.name);
            }
         }
      }
   }

   if (performErrorCheck && options.throwNoPlugin && !hasPlugin)
   {
      throw new Error(`PluginManager failed to find any target plugins.`);
   }

   if (performErrorCheck && options.throwNoMethod && !hasMethod)
   {
      throw new Error(`PluginManager failed to invoke '${methodName}'.`);
   }

   // Add meta data for plugin invoke count.
   ev.data.$$plugin_invoke_count = pluginInvokeCount;
   ev.data.$$plugin_invoke_names = pluginInvokeNames;

   return ev.data;
};

/**
 * Walks an objects inheritance tree collecting property names stopping before `Object` is reached.
 *
 * @param {object}   obj - object to walks.
 *
 * @returns {Array}
 * @ignore
 */
const s_GET_ALL_PROPERTY_NAMES = (obj) =>
{
   const props = [];

   do
   {
      Object.getOwnPropertyNames(obj).forEach((prop) => { if (props.indexOf(prop) === -1) { props.push(prop); } });
      obj = Object.getPrototypeOf(obj);
   } while (typeof obj !== 'undefined' && obj !== null && !(obj === Object.prototype));

   return props;
};
