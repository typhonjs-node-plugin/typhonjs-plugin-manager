import { assert }    from 'chai';
import EventProxy    from 'backbone-esnext-events/src/EventProxy';
import TyphonEvents  from 'backbone-esnext-events/src/TyphonEvents';

import PluginManager from '../../src/PluginManager.js';

/**
 * A plugin class
 */
class PluginTest
{
   /**
    * Increments a result count.
    * @param {PluginEvent} event - A plugin event.
    */
   test(event)
   {
      event.data.result.count++;
      assert.strictEqual(event.pluginName, 'PluginTest');
   }

   /**
    * Register event bindings
    * @param {PluginEvent} ev - A plugin event.
    */
   onPluginLoad(ev)
   {
      if (ev.eventbus)
      {
         ev.eventbus.on('test:trigger', () => {});
         ev.eventbus.on('test:trigger2', () => {});
         ev.eventbus.on('test:trigger3', () => {});
      }
   }
}

/**
 * A plugin object
 */
const pluginTest =
{
   test: (event) =>
   {
      event.data.result.count++;
      assert.strictEqual(event.pluginName, 'pluginTest');
   },

   onPluginLoad: (ev) =>
   {
      if (ev.eventbus)
      {
         ev.eventbus.on('test:trigger', () => {});
         ev.eventbus.on('test:trigger4', () => {});
         ev.eventbus.on('test:trigger5', () => {});
      }
   }
};

/**
 * Increments a result count.
 */
class PluginTestNoName2
{
   /**
    * Increments a result count.
    * @param {PluginEvent} event - A plugin event.
    */
   test2(event) { event.data.result.count++; }
}

/**
 * Defines an asynchronous test class.
 */
class PluginTestAsync
{
   /**
    * A ctor
    */
   constructor() { this.c = 3; }

   /**
    * Provides a delayed promise.
    * @returns {Promise}
    */
   onPluginLoad()
   {
      return new Promise((resolve) =>
      {
         setTimeout(() => resolve(), 1000);
      });
   }

   /**
    * Returns a number result.
    * @param {number} a - A number.
    * @param {number} b - A number.
    * @returns {Promise<number>}
    */
   test(a, b)
   {
      return new Promise((resolve) =>
      {
         setTimeout(() => resolve(a + b + this.c), 1000);
      });
   }

   /**
    * Increments a result count after a 1 second delay.
    * @param {PluginEvent} event - A plugin event.
    * @returns {Promise<PluginEvent>}
    */
   test2(event)
   {
      return new Promise((resolve) =>
      {
         setTimeout(() => resolve(event.data.result.count++), 1000);
      });
   }
}

/**
 * Defines a synchronous test class.
 */
class PluginTestSync
{
   /**
    * A ctor
    */
   constructor() { this.c = 3; }

   /**
    * Returns a number result.
    * @param {number} a - A number.
    * @param {number} b - A number.
    * @returns {number}
    */
   test(a, b) { return a + b + this.c; }
}

suite('PluginManager:', () =>
{
   let pluginManager, testData;

   beforeEach(() =>
   {
      pluginManager = new PluginManager({ eventbus: new TyphonEvents() });
      testData = { result: { count: 0 } };
   });

   test('PluginManager constructor function is exported', () =>
   {
      assert.isFunction(PluginManager);
   });

   test('PluginManager instance is object', () =>
   {
      assert.isObject(pluginManager);
   });

   test('invokeAsyncEvent - PluginManager throws when called with empty parameters', async () =>
   {
      try
      {
         await pluginManager.invokeAsyncEvent();
      }
      catch (err)
      {
         return;
      }

      throw new Error('invokeAsyncEvent should have thrown an error');
   });

   test('invokeSyncEvent - PluginManager throws when called with empty parameters', () =>
   {
      assert.throws(() => { pluginManager.invokeSyncEvent(); });
   });

   test('PluginManager throws w/ add (no options)', async () =>
   {
      try
      {
         await pluginManager.add();
      }
      catch (err)
      {
         return;
      }

      throw new Error('No error thrown: should not reach here!');
   });

   test('PluginManager return undefined for createEventProxy when no eventbus is assigned', () =>
   {
      pluginManager = new PluginManager();
      assert.isUndefined(pluginManager.createEventProxy());
   });

   test('PluginManager returns EventProxy for createEventProxy when eventbus is assigned', () =>
   {
      assert.isTrue(pluginManager.createEventProxy() instanceof EventProxy);
   });

   test('invokeAsyncEvent - PluginManager has empty result', async () =>
   {
      const event = await pluginManager.invokeAsyncEvent('test');

      assert.isObject(event);
      assert.lengthOf(Object.keys(event), 2);
      assert.strictEqual(event.$$plugin_invoke_count, 0);
   });

   test('invokeSyncEvent - PluginManager has empty result', () =>
   {
      const event = pluginManager.invokeSyncEvent('test');

      assert.isObject(event);
      assert.lengthOf(Object.keys(event), 2);
      assert.strictEqual(event.$$plugin_invoke_count, 0);
   });

   test('invokeAsyncEvent - PluginManager w/ plugin and missing method has empty event result', async () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });

      const event = await pluginManager.invokeAsyncEvent('nop');

      assert.isObject(event);
      assert.lengthOf(Object.keys(event), 2);
      assert.strictEqual(event.$$plugin_invoke_count, 0);
   });

   test('invokeSyncEvent - PluginManager w/ plugin and missing method has empty event result', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });

      const event = pluginManager.invokeSyncEvent('nop');

      assert.isObject(event);
      assert.lengthOf(Object.keys(event), 2);
      assert.strictEqual(event.$$plugin_invoke_count, 0);
   });

   test('invokeAsyncEvent - PluginManager has valid test / class result (pass through)', async () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });

      const event = await pluginManager.invokeAsyncEvent('test', void 0, testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 1);
      assert.strictEqual(event.$$plugin_invoke_count, 1);
   });

   test('invokeSyncEvent - PluginManager has valid test / class result (pass through)', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });

      const event = pluginManager.invokeSyncEvent('test', void 0, testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 1);
      assert.strictEqual(event.$$plugin_invoke_count, 1);
   });

   test('invokeAsyncEvent - PluginManager has valid test / object result (pass through)', async () =>
   {
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = await pluginManager.invokeAsyncEvent('test', void 0, testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 1);
   });

   test('invokeSyncEvent - PluginManager has valid test / object result (pass through)', () =>
   {
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = pluginManager.invokeSyncEvent('test', void 0, testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 1);
   });

   test('invokeAsyncEvent - PluginManager has invoked both plugins (pass through)', async () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = await pluginManager.invokeAsyncEvent('test', void 0, testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 2);
      assert.strictEqual(testData.result.count, 2);
   });

   test('invokeSyncEvent - PluginManager has invoked both plugins (pass through)', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = pluginManager.invokeSyncEvent('test', void 0, testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 2);
      assert.strictEqual(testData.result.count, 2);
   });

   test('invokeAsyncEvent - PluginManager has valid test / class result (copy)', async () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });

      const event = await pluginManager.invokeAsyncEvent('test', testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 0);
      assert.strictEqual(event.$$plugin_invoke_count, 1);
      assert.strictEqual(event.$$plugin_invoke_names[0], 'PluginTest');
   });

   test('invokeSyncEvent - PluginManager has valid test / class result (copy)', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });

      const event = pluginManager.invokeSyncEvent('test', testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 0);
      assert.strictEqual(event.$$plugin_invoke_count, 1);
      assert.strictEqual(event.$$plugin_invoke_names[0], 'PluginTest');
   });

   test('invokeAsyncEvent - PluginManager has valid test / object result (copy)', async () =>
   {
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = await pluginManager.invokeAsyncEvent('test', testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 0);
   });

   test('invokeSyncEvent - PluginManager has valid test / object result (copy)', () =>
   {
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = pluginManager.invokeSyncEvent('test', testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 0);
   });

   test('invokeAsyncEvent - PluginManager has invoked both plugins (copy)', async () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = await pluginManager.invokeAsyncEvent('test', testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 2);
      assert.strictEqual(testData.result.count, 0);
   });

   test('invokeSyncEvent - PluginManager has invoked both plugins (copy)', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = pluginManager.invokeSyncEvent('test', testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 2);
      assert.strictEqual(testData.result.count, 0);
   });

   test('invokeAsyncEvent - PluginManager has invoked both plugins (copy)', async () =>
   {
      await pluginManager.addAsync({ name: 'PluginTestAsync', instance: new PluginTestAsync() });
      await pluginManager.addAsync({ name: 'PluginTestAsync2', instance: new PluginTestAsync() });

      const event = await pluginManager.invokeAsyncEvent('test2', testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 2);
      assert.strictEqual(testData.result.count, 0);
   });

   test('invoke - PluginManager has invoked with no results', () =>
   {
      let invoked = false;

      pluginManager.add({ name: 'PluginTestSync', instance: { test: () => { invoked = true; } } });

      pluginManager.invoke('test', void 0, 'PluginTestSync');

      assert.strictEqual(invoked, true);
   });

   test('promise - invokeAsync - PluginManager has invoked one result (async)', (done) =>
   {
      pluginManager.addAsync({ name: 'PluginTestAsync', instance: new PluginTestAsync() }).then(() =>
      {
         pluginManager.invokeAsync('test', [1, 2], 'PluginTestAsync').then((results) =>
         {
            assert.isNumber(results);
            assert.strictEqual(results, 6);
            done();
         });
      });
   });

   test('promise - invokeAsync - PluginManager has invoked two results (async)', (done) =>
   {
      pluginManager.addAllAsync([
         { name: 'PluginTestAsync', instance: new PluginTestAsync() },
         { name: 'PluginTestAsync2', instance: new PluginTestAsync() }
      ]).then(() =>
      {
         pluginManager.invokeAsync('test', [1, 2]).then((results) =>
         {
            assert.isArray(results);
            assert.isNumber(results[0]);
            assert.isNumber(results[1]);
            assert.strictEqual(results[0], 6);
            assert.strictEqual(results[1], 6);
            done();
         });
      });
   });

   test('async / await - invokeAsync - PluginManager has invoked one result (async)', async () =>
   {
      await pluginManager.addAsync({ name: 'PluginTestAsync', instance: new PluginTestAsync() });

      const results = await pluginManager.invokeAsync('test', [1, 2], 'PluginTestAsync');

      assert.isNumber(results);
      assert.strictEqual(results, 6);
   });

   test('async / await - invokeAsync - PluginManager has invoked two results (async)', async () =>
   {
      await pluginManager.addAsync({ name: 'PluginTestAsync', instance: new PluginTestAsync() });
      await pluginManager.addAsync({ name: 'PluginTestAsync2', instance: new PluginTestAsync() });

      const results = await pluginManager.invokeAsync('test', [1, 2]);

      assert.isArray(results);
      assert.isNumber(results[0]);
      assert.isNumber(results[1]);
      assert.strictEqual(results[0], 6);
      assert.strictEqual(results[1], 6);
   });

   test('invokeSync - PluginManager has invoked one result (sync)', () =>
   {
      pluginManager.add({ name: 'PluginTestSync', instance: new PluginTestSync() });

      const result = pluginManager.invokeSync('test', [1, 2], 'PluginTestSync');

      assert.isNumber(result);
      assert.strictEqual(result, 6);
   });

   test('invokeSync - PluginManager has invoked two results (sync)', () =>
   {
      pluginManager.add({ name: 'PluginTestSync', instance: new PluginTestSync() });
      pluginManager.add({ name: 'PluginTestSync2', instance: new PluginTestSync() });

      const result = pluginManager.invokeSync('test', [1, 2]);

      assert.isArray(result);
      assert.strictEqual(result[0], 6);
      assert.strictEqual(result[1], 6);
   });

   test('PluginConfig is valid', () =>
   {
      assert.isTrue(pluginManager.isValidConfig({ name: 'test' }));
      assert.isTrue(pluginManager.isValidConfig({ name: 'test', target: 'target' }));
      assert.isTrue(pluginManager.isValidConfig({ name: 'test', target: 'target', options: {} }));
      assert.isTrue(pluginManager.isValidConfig({ name: 'test', options: {} }));
   });

   test('PluginConfig is invalid', () =>
   {
      assert.isFalse(pluginManager.isValidConfig());
      assert.isFalse(pluginManager.isValidConfig({}));
      assert.isFalse(pluginManager.isValidConfig({ name: 123 }));
      assert.isFalse(pluginManager.isValidConfig({ target: 'target' }));
      assert.isFalse(pluginManager.isValidConfig({ options: {} }));
      assert.isFalse(pluginManager.isValidConfig({ name: 'test', target: 123 }));
      assert.isFalse(pluginManager.isValidConfig({ name: 'test', target: 'target', options: 123 }));
      assert.isFalse(pluginManager.isValidConfig({ name: 'test', options: 123 }));
   });

   test('PluginManager get unique method names', () =>
   {
      pluginManager.add({ name: 'PluginTestSync', instance: new PluginTestSync() });
      pluginManager.add({ name: 'PluginTestNoName2', instance: new PluginTestNoName2() });

      const results = pluginManager.getMethodNames();

      assert.isArray(results);
      assert.lengthOf(results, 2);
      assert.strictEqual(results[0], 'test');
      assert.strictEqual(results[1], 'test2');
   });

   test('PluginManager get plugin data', () =>
   {
      pluginManager.add({ name: 'PluginTestSync', instance: new PluginTestSync() }, { name: 'modulename' });

      const results = pluginManager.getPluginData('PluginTestSync');

      assert.isObject(results);

      assert(JSON.stringify(results), '{"manager":{"eventPrepend":"plugins"},"module":{"name":"modulename"},"plugin":{"name":"PluginTestSync","scopedName":"plugins:PluginTestSync","target":"PluginTestSync","targetEscaped":"PluginTestSync","type":"instance","options":{}}}');
   });

   test('PluginManager get all plugin data', () =>
   {
      pluginManager.addAll(
      [
         { name: 'PluginTestSync', instance: new PluginTestSync() },
         { name: 'PluginTestNoName2', instance: new PluginTestNoName2() }
      ], { name: 'modulename' });

      const results = pluginManager.getAllPluginData();

      assert.isArray(results);

      assert(JSON.stringify(results), '[{"manager":{"eventPrepend":"plugins"},"module":{"name":"modulename"},"plugin":{"name":"PluginTestSync","scopedName":"plugins:PluginTestSync","target":"PluginTestSync","targetEscaped":"PluginTestSync","type":"instance","options":{}}},{"manager":{"eventPrepend":"plugins"},"module":{"name":"modulename"},"plugin":{"name":"PluginTestNoName2","scopedName":"plugins:PluginTestNoName2","target":"PluginTestNoName2","targetEscaped":"PluginTestNoName2","type":"instance","options":{}}}]');
   });

   test('PluginManager get plugin event names', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      let results = pluginManager.getPluginsEventNames();

      assert(JSON.stringify(results), '[{"pluginName":"PluginTest","events":["test:trigger","test:trigger2,"test:trigger3"]},{"pluginName":"pluginTest","events":["test:trigger","test:trigger4","test:trigger5"]}]');

      results = pluginManager.getPluginsEventNames('PluginTest');

      assert(JSON.stringify(results), '[{"pluginName":"PluginTest","events":["test:trigger","test:trigger2","test:trigger3"]}]');

      results = pluginManager.getPluginsEventNames('pluginTest');

      assert(JSON.stringify(results), '[{"pluginName":"pluginTest","events":["test:trigger","test:trigger4","test:trigger5"]}]');
   });

   test('PluginManager get plugin name from event name', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      assert.throws(() => pluginManager.getPluginsByEventName());

      let results = pluginManager.getPluginsByEventName('test:trigger');

      assert(JSON.stringify(results), '["PluginTest","pluginTest"]');

      results = pluginManager.getPluginsByEventName('test:trigger2');

      assert(JSON.stringify(results), '["PluginTest"]');

      results = pluginManager.getPluginsByEventName('test:trigger4');

      assert(JSON.stringify(results), '["pluginTest"]');
   });

   test('PluginManager get plugin names', () =>
   {
      pluginManager.add({ name: 'PluginTestSync', instance: new PluginTestSync() });
      pluginManager.add({ name: 'PluginTestSync2', instance: new PluginTestSync() });

      const results = pluginManager.getPluginNames();

      assert.isArray(results);
      assert.lengthOf(results, 2);
      assert.strictEqual(results[0], 'PluginTestSync');
      assert.strictEqual(results[1], 'PluginTestSync2');
   });

   test('PluginManager get plugin event names', () =>
   {
      pluginManager.add({ name: 'PluginTestSync', instance: new PluginTestSync() });
      pluginManager.add({ name: 'PluginTestSync2', instance: new PluginTestSync() });

      const results = pluginManager.getPluginNames();

      assert.isArray(results);
      assert.lengthOf(results, 2);
      assert.strictEqual(results[0], 'PluginTestSync');
      assert.strictEqual(results[1], 'PluginTestSync2');
   });

   test('PluginManager get plugin / method names', () =>
   {
      pluginManager.add({ name: 'PluginTestSync', instance: new PluginTestSync() });
      pluginManager.add({ name: 'PluginTestNoName2', instance: new PluginTestNoName2() });

      const results = pluginManager.getPluginMethodNames();

      assert.isArray(results);
      assert.lengthOf(results, 2);
      assert.strictEqual(results[0].plugin, 'PluginTestSync');
      assert.strictEqual(results[0].method, 'test');
      assert.strictEqual(results[1].plugin, 'PluginTestNoName2');
      assert.strictEqual(results[1].method, 'test2');
   });
});
