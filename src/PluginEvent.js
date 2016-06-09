/**
 * Plugin Event class.
 */
export default class PluginEvent
{
   /**
    * Initializes PluginEvent.
    *
    * @param {object}   data - event data.
    * @param {boolean}  copy - potentially copy data.
    */
   constructor(data = {}, copy = true)
   {
      this.data = copy ? s_COPY(data) : data;
   }
}

// Module private ---------------------------------------------------------------------------------------------------

/**
 * Copies an object.
 *
 * @param {object}   obj - Object to copy.
 *
 * @returns {object}
 */
const s_COPY = (obj) =>
{
   return JSON.parse(JSON.stringify(obj));
};
