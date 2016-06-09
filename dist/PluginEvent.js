"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Plugin Event class.
 */

var PluginEvent =
/**
 * Initializes PluginEvent.
 *
 * @param {object}   data - event data.
 * @param {boolean}  copy - potentially copy data.
 */
function PluginEvent() {
  var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var copy = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

  _classCallCheck(this, PluginEvent);

  this.data = copy ? s_COPY(data) : data;
};

// Module private ---------------------------------------------------------------------------------------------------

/**
 * Copies an object.
 *
 * @param {object}   obj - Object to copy.
 *
 * @returns {object}
 */


exports.default = PluginEvent;
var s_COPY = function s_COPY(obj) {
  return JSON.parse(JSON.stringify(obj));
};
module.exports = exports["default"];