'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _PluginEvent = require('./PluginEvent.js');

var _PluginEvent2 = _interopRequireDefault(_PluginEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Provides a generic plugin manager and dispatch mechanism.
 */

var PluginManager = function () {
   /**
    * Initializes plugin manager.
    */

   function PluginManager() {
      _classCallCheck(this, PluginManager);

      this._plugins = [];
   }

   _createClass(PluginManager, [{
      key: 'addPlugin',
      value: function addPlugin(plugin) {
         if ((typeof plugin === 'undefined' ? 'undefined' : _typeof(plugin)) !== 'object') {
            throw new TypeError('addPlugin error: plugin is not an object');
         }

         this._plugins.push(plugin);
      }

      /**
       * Iterates through all loaded plugins and if methodName is found as a function then invokes it with the given data.
       *
       * @param {string}   methodName -
       * @param {object}   data -
       * @param {boolean}  copy -
       *
       * @returns {Array<PluginEvent>}
       */

   }, {
      key: 'invoke',
      value: function invoke(methodName) {
         var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
         var copy = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

         if (typeof methodName !== 'string') {
            throw new TypeError('invoke error: `methodName` is not a `string`.');
         }

         var event = null;
         var hasMethod = false;

         // Verify that at least one plugin has the requested invocation method.
         for (var cntr = 0; cntr < this._plugins.length; cntr++) {
            var plugin = this._plugins[cntr];
            if (typeof plugin[methodName] === 'function') {
               hasMethod = true;break;
            }
         }

         if (hasMethod) {
            event = new _PluginEvent2.default(data, copy);

            for (var _cntr = 0; _cntr < this._plugins.length; _cntr++) {
               var _plugin = this._plugins[_cntr];

               // Invoke plugin method if it exists.
               if (typeof _plugin[methodName] === 'function') {
                  _plugin[methodName](event);
               }
            }

            return event;
         }

         return null;
      }
   }]);

   return PluginManager;
}();

exports.default = PluginManager;
module.exports = exports['default'];