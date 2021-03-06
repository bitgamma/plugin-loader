/*
* The MIT License (MIT)
*
* Copyright (c) 2014 Michele Balistreri
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

describe('PluginLoader', function() {
  var chai = require('chai').should();
  var PluginLoader = require('../lib/plugin-loader').PluginLoader;
  var EventEmitter = require('events').EventEmitter;
  var path = require('path');
  var fs = require('fs');
  var staticPluginFolder = path.join(__dirname, 'test_plugins');
  var dynamicPluginFolder = path.join(__dirname, 'test_plugins_dynamic');
  var badPluginFolder = path.join(__dirname, 'bad_plugins');
  var pluginFolders = [ staticPluginFolder, dynamicPluginFolder ];

  describe('#PluginLoader', function() {
    it('it should create a PluginLoader object inheriting from EventEmitter and with no loaded modules and given module path', function() {
			var loader = new PluginLoader(pluginFolders);
      loader.should.be.instanceof(EventEmitter);
      loader.loadedModules.should.deep.equal({});
      loader.modulePath.should.deep.equal(pluginFolders);
    });
  });

  describe('#discover', function() {
    it('it should load all plugins from the test_plugins directory', function(done) {
			var loader = new PluginLoader(pluginFolders);
      var plugin1Loaded = false;
      var plugin2Loaded = false;

      loader.on('pluginLoaded', function(pluginName, plugin) {
        pluginName.should.match(/^plugin1$|^plugin2$/);

        if (pluginName == 'plugin1') {
          plugin1Loaded = true;
          plugin.hasBeenLoaded.should.equal(true);
        } else if (pluginName == 'plugin2') {
          plugin2Loaded = true;
          plugin.hasBeenUnloaded.should.equal(false);
        }

        if (plugin1Loaded && plugin2Loaded) {
          done();
        }
      });

      loader.discover();
    });

    it('it should emit `allPluginsLoaded` when all plugins are loaded when discover emitAllPluginsLoaded argument is true', function(done) {
      var loader = new PluginLoader(pluginFolders);

      loader.on('allPluginsLoaded', function(errorsOccured) {
        chai.equal(errorsOccured, undefined);
        done();
      });

      loader.discover(true);
    });

    it('it should not emit `allPluginsLoaded` when discover emitAllPluginsLoaded argument is falsy', function(done) {
      var loader = new PluginLoader(pluginFolders);

      loader.on('allPluginsLoaded', function(errorsOccured) {
        done(new Error('allPluginsLoaded should not be emitted.'));
      });

      loader.discover(undefined);

      setTimeout(done, 200);
    });

    it('allPluginsLoaded event errorsOccured argument should contains occurred events', function(done) {
      var loader = new PluginLoader(['una strana directory', badPluginFolder]);

      loader.on('allPluginsLoaded', function(errorsOccured) {
        errorsOccured.should.be.an('array');
        errorsOccured.length.should.equal(2);
        errorsOccured[0].code.should.equal('ENOENT');
        errorsOccured[1].should.be.instanceOf(SyntaxError);
        done();
      });

      loader.discover(true);
    });

    it('it should emit `error` when error are catch loading directories', function(done) {
      var loader = new PluginLoader(['una strana directory']);

      loader.on('error', function(err) {
        err.code.should.equal('ENOENT');
        done();
      });

      loader.discover();
    });

    it('it should emit `error` when error are catch loading modules', function(done) {
      var loader = new PluginLoader([badPluginFolder]);

      loader.on('error', function(err) {
        err.should.be.instanceOf(SyntaxError);
        done();
      });

      loader.discover();
    });




    it('it should unload all plugins removed from the test_plugin folder', function(done) {
			var loader = new PluginLoader(pluginFolders);
      loader.discover();

      var plugin1Unloaded = false;
      var plugin2Unloaded = false;

      loader.on('pluginUnloaded', function(pluginName, plugin) {
        pluginName.should.match(/^plugin1$|^plugin2$/);

        if (pluginName == 'plugin1') {
          plugin1Unloaded = true;
          plugin.hasBeenLoaded.should.equal(true);
        } else if (pluginName == 'plugin2') {
          plugin2Unloaded = true;
          plugin.hasBeenUnloaded.should.equal(true);
        }

        if (plugin1Unloaded && plugin2Unloaded) {
          done();
        }
      });

      // we change the loader path to remove both plugins without changing the file system
      loader.modulePath[0] = loader.modulePath[1];
      loader.discover();
    });
  });

  // Temporary disable for Travis Build until problem solved/mocks implemented.
  /*describe('#startMonitoring', function() {
    function removeLinks() {
      try {
        fs.unlinkSync(path.join(dynamicPluginFolder, 'plugin1'));
        fs.unlinkSync(path.join(dynamicPluginFolder, 'plugin2'));
      } catch(err) {
        //ignore
      }
    }

    beforeEach(removeLinks);
    afterEach(removeLinks);

    it('it should detect new modules in the test_plugins_dynamics folder', function(done) {
			var loader = new PluginLoader([dynamicPluginFolder]);

      loader.on('pluginLoaded', function(pluginName, plugin) {
        pluginName.should.equal('plugin1');
        plugin.hasBeenLoaded.should.equal(true);
        loader.stopMonitoring();
        fs.unlinkSync(path.join(dynamicPluginFolder, pluginName));
        done();
      });

      loader.startMonitoring();
      fs.linkSync(path.join(staticPluginFolder, 'plugin1'), path.join(dynamicPluginFolder, 'plugin1'));
    });

    it('it should detect removed modules from the test_plugins_dynamics folder', function(done) {
			var loader = new PluginLoader([dynamicPluginFolder]);
      fs.linkSync(path.join(staticPluginFolder, 'plugin2'), path.join(dynamicPluginFolder, 'plugin2'));

      loader.on('pluginLoaded', function(pluginName, plugin) {
        loader.startMonitoring();
        fs.unlinkSync(path.join(dynamicPluginFolder, 'plugin2'));
      });

      loader.discover();

      loader.on('pluginUnloaded', function(pluginName, plugin) {
        pluginName.should.equal('plugin2');
        plugin.hasBeenUnloaded.should.equal(true);
        loader.stopMonitoring();
        done();
      });
    });
  });*/

  describe('#stopMonitoring', function() {
    it('it should stop detecting changes in the test_plugins folder', function() {
			var loader = new PluginLoader([staticPluginFolder]);
      var stopped = false;
      loader.startMonitoring();
      var watchers = loader._watchers;
      loader._watchers = [ { close: function() { stopped = true } }];
      loader.stopMonitoring();
      stopped.should.equal(true);
      watchers[0].close();
    });
  });
});
