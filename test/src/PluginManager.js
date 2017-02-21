import { assert }    from 'chai';
import EventProxy    from 'backbone-esnext-events/src/EventProxy';
import TyphonEvents  from 'backbone-esnext-events/src/TyphonEvents';

import PluginManager from '../../src/PluginManager.js';

class PluginTest { test(event) { event.data.result.count++; assert.strictEqual(event.pluginName, 'PluginTest'); } }

const pluginTest = { test: (event) => { event.data.result.count++; assert.strictEqual(event.pluginName, 'pluginTest'); } };

// class PluginTestNoName { test(event) { event.data.result.count++; } }
class PluginTestNoName2 { test2(event) { event.data.result.count++; } }

class PluginTestSync
{
   constructor() { this.c = 3; }
   test(a, b) { return a + b + this.c; }
}

suite('PluginManager:', () =>
{
   let pluginManager, testData;

   beforeEach(() => { pluginManager = new PluginManager(); testData = { result: { count: 0 } }; });

   test('PluginManager constructor function is exported', () =>
   {
      assert.isFunction(PluginManager);
   });

   test('PluginManager instance is object', () =>
   {
      assert.isObject(pluginManager);
   });

   test('PluginManager throws when invoke is called with empty parameters', () =>
   {
      assert.throws(() => { pluginManager.invokeSyncEvent(); });
   });

   test('PluginManager throws w/ add (no options)', () =>
   {
      assert.throws(() => { pluginManager.add(); });
   });

   test('PluginManager return undefined for createEventProxy when no eventbus is assigned', () =>
   {
      assert.isUndefined(pluginManager.createEventProxy());
   });

   test('PluginManager returns EventProxy for createEventProxy when eventbus is assigned', () =>
   {
      pluginManager = new PluginManager({ eventbus: new TyphonEvents() });
      assert.isTrue(pluginManager.createEventProxy() instanceof EventProxy);
   });

   test('PluginManager has empty result', () =>
   {
      const event = pluginManager.invokeSyncEvent('test');

      assert.isObject(event);
      assert.lengthOf(Object.keys(event), 2);
      assert(event.$$plugin_invoke_count === 0);
   });

   test('PluginManager w/ plugin and missing method has empty event result', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });

      const event = pluginManager.invokeSyncEvent('nop');

      assert.isObject(event);
      assert.lengthOf(Object.keys(event), 2);
      assert.strictEqual(event.$$plugin_invoke_count, 0);
   });

   test('PluginManager has valid test / class result (pass through)', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });

      const event = pluginManager.invokeSyncEvent('test', void 0, testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 1);
      assert.strictEqual(event.$$plugin_invoke_count, 1);
   });

   test('PluginManager has valid test / object result (pass through)', () =>
   {
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = pluginManager.invokeSyncEvent('test', void 0, testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 1);
   });

   test('PluginManager has invoked both plugins (pass through)', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = pluginManager.invokeSyncEvent('test', void 0, testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 2);
      assert.strictEqual(testData.result.count, 2);
   });

   test('PluginManager has valid test / class result (copy)', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });

      const event = pluginManager.invokeSyncEvent('test', testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 0);
      assert.strictEqual(event.$$plugin_invoke_count, 1);
      assert.strictEqual(event.$$plugin_invoke_names[0], 'PluginTest');
   });

   test('PluginManager has valid test / object result (copy)', () =>
   {
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = pluginManager.invokeSyncEvent('test', testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 1);
      assert.strictEqual(testData.result.count, 0);
   });

   test('PluginManager has invoked both plugins (copy)', () =>
   {
      pluginManager.add({ name: 'PluginTest', instance: new PluginTest() });
      pluginManager.add({ name: 'pluginTest', instance: pluginTest });

      const event = pluginManager.invokeSyncEvent('test', testData);

      assert.isObject(event);
      assert.strictEqual(event.result.count, 2);
      assert.strictEqual(testData.result.count, 0);
   });

   test('PluginManager has invoked one result (sync)', () =>
   {
      pluginManager.add({ name: 'PluginTestSync', instance: new PluginTestSync() });

      const result = pluginManager.invokeSync('PluginTestSync', 'test', 1, 2);

      assert.isNumber(result);
      assert.strictEqual(result, 6);
   });

   test('PluginManager has invoked two results (sync)', () =>
   {
      pluginManager.add({ name: 'PluginTestSync', instance: new PluginTestSync() });
      pluginManager.add({ name: 'PluginTestSync2', instance: new PluginTestSync() });

      const result = pluginManager.invokeSync(void 0, 'test', 1, 2);

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
