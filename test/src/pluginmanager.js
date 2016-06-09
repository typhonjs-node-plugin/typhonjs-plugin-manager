'use strict';

import { assert }          from 'chai';

import PluginManagerClass  from '../../src/PluginManager.js';

const managerPath =        '../../dist/PluginManager';

class PluginTest { test(event) { event.data.result++; } }
const pluginTest = { test: (event) => { event.data.result++; } };

suite('PluginManager:', () =>
{
   suite('require:', () =>
   {
      let PluginManager;

      setup(() => { PluginManager = require(managerPath); });
      teardown(() => { PluginManager = undefined; });

      test('require does not throw', () =>
      {
         assert.doesNotThrow(() => { require(managerPath); });
      });

      test('PluginManager constructor function is exported', () =>
      {
         assert.isFunction(PluginManager);
      });

      test('PluginManager instance is object', () =>
      {
         const pluginManager = new PluginManager();
         assert.isObject(pluginManager);
      });

      test('PluginManager throws when invoke is called with empty parameters', () =>
      {
         const pluginManager = new PluginManager();
         assert.throws(() => { pluginManager.invoke(); });
      });

      test('PluginManager has null event result', () =>
      {
         const pluginManager = new PluginManager();
         const event = pluginManager.invoke('test');

         assert.isNull(event);
      });

      test('PluginManager has valid test / class result', () =>
      {
         const pluginManager = new PluginManager();
         pluginManager.addPlugin(new PluginTest());

         const event = pluginManager.invoke('test', { result: 0 });

         assert.isObject(event);
         assert.strictEqual(event.data.result, 1);
      });

      test('PluginManager has valid test / object result', () =>
      {
         const pluginManager = new PluginManager();
         pluginManager.addPlugin(pluginTest);

         const event = pluginManager.invoke('test', { result: 0 });

         assert.isObject(event);
         assert.strictEqual(event.data.result, 1);
      });

      test('PluginManager has invoked both plugins', () =>
      {
         const pluginManager = new PluginManager();
         pluginManager.addPlugin(new PluginTest());
         pluginManager.addPlugin(pluginTest);

         const event = pluginManager.invoke('test', { result: 0 });

         assert.isObject(event);
         assert.strictEqual(event.data.result, 2);
      });
   });

   suite('ES Module:', () =>
   {
      let pluginManager;

      setup(() => { pluginManager = new PluginManagerClass(); });
      teardown(() => { pluginManager = undefined; });

      test('PluginManager constructor function is exported', () =>
      {
         assert.isFunction(PluginManagerClass);
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
});
