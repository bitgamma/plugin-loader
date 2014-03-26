[![Build Status](https://travis-ci.org/briksoftware/plugin-loader.svg?branch=master)](https://travis-ci.org/briksoftware/plugin-loader)

This is a dynamic plugin loader for node.js applications. It allows specifing one or more directories to monitor and automatically load modules as soon as they appear and unload them if they disappear. The ```PluginLoader``` object is an ```EventEmitter``` and emits events on loading/unloading of modules. If the module exports a load method, it is invoked on load. If the module exports an unload method, it is invoked on unload.

## Dependencies

* node v0.10.x
* mocha v1.18.x (only required to run the tests)
* chai v1.9.x (only required to run the tests)

## Examples

Initializing a PluginLoader object is easy

```
var PluginLoader = require('plugin-loader').PluginLoader;
var loader = PluginLoader(["path1", "path2", ...]);
```

You can then add listner for the ```pluginLoaded``` and ```pluginUnloaded``` events.

```
loader.on('pluginLoaded', function(pluginName, plugin) {
  // at this point, if the module implements a load() method, it has been invoked already
  console.log(pluginName + ' loaded!');
  plugin.doSomethingToInitialize(...);
  ...
});

loader.on('pluginUnloaded', function(pluginName, plugin) {
  // at this point, if the module implements an unload() method, it has been invoked already
  console.log(pluginName + ' unloaded!');
  plugin.doSomethingToCleanup(...);
  ...
});
```

You can either start monitoring the specified directories

```
loader.startMonitoring();
```

or you can invoke a one-time scan of the directories

```
loader.discover();
```

By the way, it is a good idea, if you used ```startMonitoring()``` to invoke ```stopMonitoring()``` before exiting.

## License

MIT License. Copyright 2014 Michele Balistreri.
