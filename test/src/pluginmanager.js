'use strict';

import { assert }          from 'chai';

import PluginManager  from '../../src/PluginManager.js';

class PluginTest { test(event) { event.data.result++; } }
const pluginTest = { test: (event) => { event.data.result++; } };

suite('PluginManager:', () =>
{
   let pluginManager;

   setup(() => { pluginManager = new PluginManager(); });
   teardown(() => { pluginManager = undefined; });

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
      assert.throws(() => { pluginManager.invoke(); });
   });

   test('PluginManager has empty null event result', () =>
   {
      const event = pluginManager.invoke('test');

      assert.isNull(event);
   });

   test('PluginManager w/ plugin and missing method has empty null event result', () =>
   {
      pluginManager.addPlugin(new PluginTest());

      const event = pluginManager.invoke('nop');

      assert.isNull(event);
   });

   test('PluginManager has valid test / class result', () =>
   {
      pluginManager.addPlugin(new PluginTest());

      const event = pluginManager.invoke('test', { result: 0 });

      assert.isObject(event);
      assert.strictEqual(event.data.result, 1);
   });

   test('PluginManager has valid test / object result', () =>
   {
      pluginManager.addPlugin(pluginTest);

      const event = pluginManager.invoke('test', { result: 0 });

      assert.isObject(event);
      assert.strictEqual(event.data.result, 1);
   });

   test('PluginManager has invoked both plugins', () =>
   {
      pluginManager.addPlugin(new PluginTest());
      pluginManager.addPlugin(pluginTest);

      const event = pluginManager.invoke('test', { result: 0 });

      assert.isObject(event);
      assert.strictEqual(event.data.result, 2);
   });

   test('PluginManager has invoked both plugins with a copy of data', () =>
   {
      pluginManager.addPlugin(new PluginTest());
      pluginManager.addPlugin(pluginTest);

      const data = { result: 0 };

      const event = pluginManager.invoke('test', data);

      assert.isObject(event);
      assert.strictEqual(event.data.result, 2);
      assert.strictEqual(data.result, 0);
   });
});
