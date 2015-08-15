(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.validate = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
'use strict';

var parseCSSColor = require('csscolorparser').parseCSSColor;
var format = require('util').format;

module.exports = function(style, reference) {

    var constants = style.constants || {},
        layers = {},
        errors = [];

    function error(key, val /*, message, ...*/) {
        var err = {
            message: (key ? key + ': ' : '') +
            format.apply(format, Array.prototype.slice.call(arguments, 2))
        };

        if (val !== null && val !== undefined && val.__line__) {
            err.line = val.__line__;
        }

        errors.push(err);
    }

    // Main recursive validation function. Tracks:
    //
    // - key: string representing location of validation in style tree. Used only
    //   for more informative error reporting.
    // - val: current value from style being evaluated. May be anything from a
    //   high level object that needs to be descended into deeper or a simple
    //   scalar value.
    // - spec: current spec being evaluated. Tracks val.
    //
    function validate(key, val, spec) {
        var type = typeof_(val);

        // Constants
        if (type === 'string' && val[0] === '@') {
            if (!(val in constants)) {
                return error(key, val, 'constant "%s" not found', val);
            }
            val = constants[val];
            type = typeof_(val);
        }

        // Functions
        if (spec.function && type === 'object') {
            return validate.function(key, val, spec);
        }

        if (spec.type) {
            var validator = validate[spec.type];
            if (validator) {
                return validator(key, val, spec);
            }
            spec = reference[spec.type];
        }

        validate.object(key, val, spec);
    }

    validate.constants = function(key, val) {
        var type = typeof_(val);
        if (type !== 'object') {
            return error(key, val, 'object expected, %s found', type);
        }

        for (var k in val) {
            if (k[0] !== '@') {
                error(key + '.' + k, val[k], 'constants must start with "@"');
            }
        }
    };

    validate.source = function(key, val) {
        if (!val.type) {
            error(key, val, '"type" is required');
            return;
        }

        var type = unbundle(val.type);
        switch (type) {
            case 'vector':
            case 'raster':
                validate.object(key, val, reference.source_tile);

                if ('url' in val) {
                    for (var prop in val) {
                        if (['type', 'url', 'tileSize'].indexOf(prop) < 0) {
                            error(key + '.' + prop, val[prop], 'a source with a "url" property may not include a "%s" property', prop);
                        }
                    }
                }

                break;
            case 'geojson':
                validate.object(key, val, reference.source_geojson);
                break;
            case 'video':
                validate.object(key, val, reference.source_video);
                break;
            default:
                validate.enum(key + '.type', val.type, {values: ['vector', 'raster', 'geojson', 'video']});
        }
    };

    validate.layer = function(key, val) {
        if (!val.type && !val.ref) {
            error(key, val, 'either "type" or "ref" is required');
        }

        var type = unbundle(val.type),
            ref = unbundle(val.ref);

        if (val.id) {
            if (layers[val.id]) {
                error(key, val.id, 'duplicate layer id "%s", previously used at line %d', val.id, layers[val.id]);
            } else {
                layers[val.id] = val.id.__line__;
            }
        }

        if ('ref' in val) {
            ['type', 'source', 'source-layer', 'filter', 'layout'].forEach(function (p) {
                if (p in val) {
                    error(key, val[p], '"%s" is prohibited for ref layers', p);
                }
            });

            var parent;

            style.layers.forEach(function(layer) {
                if (layer.id == ref) parent = layer;
            });

            if (!parent) {
                error(key, val.ref, 'ref layer "%s" not found', ref);
            } else if (parent.ref) {
                error(key, val.ref, 'ref cannot reference another ref layer');
            } else {
                type = parent.type;
            }
        } else if (type !== 'background') {
            if (!val.source) {
                error(key, val, 'missing required property "source"');
            } else {
                var source = style.sources[val.source];
                if (!source) {
                    error(key, val.source, 'source "%s" not found', val.source);
                } else if (source.type == 'vector' && type == 'raster') {
                    error(key, val.source, 'layer "%s" requires a raster source', val.id);
                } else if (source.type == 'raster' && type != 'raster') {
                    error(key, val.source, 'layer "%s" requires a vector source', val.id);
                }
            }
        }

        validate.object(key, val, reference.layer, {
            filter: validate.filter,
            layout: function(key, val) {
                var spec = reference['layout_' + type];
                return type && spec && validate(key, val, spec);
            },
            paint: function(key, val) {
                var spec = reference['paint_' + type];
                return type && spec && validate(key, val, spec);
            }
        });
    };

    validate.object = function (key, val, spec, validators) {
        validators = validators || {};

        var type = typeof_(val);
        if (type !== 'object') {
            return error(key, val, 'object expected, %s found', type);
        }

        for (var k in val) {
            var speckey = k.split('.')[0]; // treat 'paint.*' as 'paint'
            var def = spec[speckey] || spec['*'];
            var transition = speckey.match(/^(.*)-transition$/);

            if (def) {
                (validators[speckey] || validate)((key ? key + '.' : key) + k, val[k], def);
            } else if (transition && spec[transition[1]] && spec[transition[1]].transition) {
                validate((key ? key + '.' : key) + k, val[k], reference.transition);
            // tolerate root-level extra keys & arbitrary layer properties
            } else if (key !== '' && key.split('.').length !== 1) {
                error(key, val[k], 'unknown property "%s"', k);
            }
        }

        for (var l in spec) {
            if (spec[l].required && spec[l]['default'] === undefined && val[l] === undefined) {
                error(key, val, 'missing required property "%s"', l);
            }
        }
    };

    validate.array = function (key, val, spec, validator) {
        if (typeof_(val) !== 'array') {
            return error(key, val, 'array expected, %s found', typeof_(val));
        }

        if (spec.length && val.length !== spec.length) {
            return error(key, val, 'array length %d expected, length %d found', spec.length, val.length);
        }

        var value = {
            "type": spec.value
        };

        if (style.version < 7) {
            value.function = spec.function;
        }

        if (typeof_(spec.value) === 'object') {
            value = spec.value;
        }

        for (var i = 0; i < val.length; i++) {
            (validator || validate)(key + '[' + i + ']', val[i], value);
        }
    };

    validate.filter = function(key, val) {
        var type;

        if (typeof_(val) !== 'array') {
            return error(key, val, 'array expected, %s found', typeof_(val));
        }

        if (val.length < 1) {
            return error(key, val, 'filter array must have at least 1 element');
        }

        validate.enum(key + '[0]', val[0], reference.filter_operator);

        switch (unbundle(val[0])) {
            case '<':
            case '<=':
            case '>':
            case '>=':
                if (val.length >= 2 && val[1] == '$type') {
                    error(key, val, '"$type" cannot be use with operator "%s"', val[0]);
                }
            /* falls through */
            case '==':
            case '!=':
                if (val.length != 3) {
                    error(key, val, 'filter array for operator "%s" must have 3 elements', val[0]);
                }
            /* falls through */
            case 'in':
            case '!in':
                if (val.length >= 2) {
                    type = typeof_(val[1]);
                    if (type !== 'string') {
                        error(key + '[1]', val[1], 'string expected, %s found', type);
                    } else if (val[1][0] === '@') {
                        error(key + '[1]', val[1], 'filter key cannot be a constant');
                    }
                }
                for (var i = 2; i < val.length; i++) {
                    type = typeof_(val[i]);
                    if (val[1] == '$type') {
                        validate.enum(key + '[' + i + ']', val[i], reference.geometry_type);
                    } else if (type === 'string' && val[i][0] === '@') {
                        error(key + '[' + i + ']', val[i], 'filter value cannot be a constant');
                    } else if (type !== 'string' && type !== 'number' && type !== 'boolean') {
                        error(key + '[' + i + ']', val[i], 'string, number, or boolean expected, %s found', type);
                    }
                }
                break;

            case 'any':
            case 'all':
            case 'none':
                for (i = 1; i < val.length; i++) {
                    validate.filter(key + '[' + i + ']', val[i]);
                }
                break;
        }
    };

    validate.function = function(key, val, spec) {
        validate.object(key, val, reference.function, {
            stops: function (key, val, arraySpec) {
                var lastStop = -Infinity;
                validate.array(key, val, arraySpec, function validateStop(key, val) {
                    if (typeof_(val) !== 'array') {
                        return error(key, val, 'array expected, %s found', typeof_(val));
                    }

                    if (val.length !== 2) {
                        return error(key, val, 'array length %d expected, length %d found', 2, val.length);
                    }

                    validate(key + '[0]', val[0], {type: 'number'});
                    validate(key + '[1]', val[1], spec);

                    if (typeof_(val[0]) === 'number') {
                        if (spec.function === 'piecewise-constant' && val[0] % 1 !== 0) {
                            error(key + '[0]', val[0], 'zoom level for piecewise-constant functions must be an integer');
                        }

                        if (val[0] < lastStop) {
                            error(key + '[0]', val[0], 'array stops must appear in ascending order');
                        }

                        lastStop = val[0];
                    }
                });

                if (typeof_(val) === 'array' && val.length === 0) {
                    error(key, val, 'array must have at least one stop');
                }
            }
        });
    };

    validate.enum = function (key, val, spec) {
        if (spec.values.indexOf(unbundle(val)) === -1) {
            error(key, val, 'expected one of [%s], %s found', spec.values.join(', '), val);
        }
    };

    validate.color = function(key, val) {
        var type = typeof_(val);
        if (type !== 'string') {
            error(key, val, 'color expected, %s found', type);
        } else if (parseCSSColor(val) === null) {
            error(key, val, 'color expected, "%s" found', val);
        }
    };

    function typeValidator(expected) {
        return function(key, val, spec) {
            var actual = typeof_(val);
            if (actual !== expected) {
                error(key, val, '%s expected, %s found', expected, actual);
            }

            if ('minimum' in spec && val < spec.minimum) {
                error(key, val, '%s is less than the minimum value %s', val, spec.minimum);
            }

            if ('maximum' in spec && val > spec.maximum) {
                error(key, val, '%s is greater than the maximum value %s', val, spec.maximum);
            }
        };
    }

    validate.number = typeValidator('number');
    validate.string = typeValidator('string');
    validate.boolean = typeValidator('boolean');

    validate['*'] = function() {};

    validate('', style, reference.$root);

    return errors;
};

function typeof_(val) {
    if (val instanceof Number)
        return 'number';
    if (val instanceof String)
        return 'string';
    if (val instanceof Boolean)
        return 'boolean';
    if (Array.isArray(val))
        return 'array';
    if (val === null)
        return 'null';
    return typeof val;
}

function unbundle(_) {
    if (_ instanceof Number ||
        _ instanceof String ||
        _ instanceof Boolean) {
        return _.valueOf();
    } else {
        return _;
    }
}

},{"csscolorparser":6,"util":4}],6:[function(require,module,exports){
// (c) Dean McNamee <dean@gmail.com>, 2012.
//
// https://github.com/deanm/css-color-parser-js
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// http://www.w3.org/TR/css3-color/
var kCSSColorTable = {
  "transparent": [0,0,0,0], "aliceblue": [240,248,255,1],
  "antiquewhite": [250,235,215,1], "aqua": [0,255,255,1],
  "aquamarine": [127,255,212,1], "azure": [240,255,255,1],
  "beige": [245,245,220,1], "bisque": [255,228,196,1],
  "black": [0,0,0,1], "blanchedalmond": [255,235,205,1],
  "blue": [0,0,255,1], "blueviolet": [138,43,226,1],
  "brown": [165,42,42,1], "burlywood": [222,184,135,1],
  "cadetblue": [95,158,160,1], "chartreuse": [127,255,0,1],
  "chocolate": [210,105,30,1], "coral": [255,127,80,1],
  "cornflowerblue": [100,149,237,1], "cornsilk": [255,248,220,1],
  "crimson": [220,20,60,1], "cyan": [0,255,255,1],
  "darkblue": [0,0,139,1], "darkcyan": [0,139,139,1],
  "darkgoldenrod": [184,134,11,1], "darkgray": [169,169,169,1],
  "darkgreen": [0,100,0,1], "darkgrey": [169,169,169,1],
  "darkkhaki": [189,183,107,1], "darkmagenta": [139,0,139,1],
  "darkolivegreen": [85,107,47,1], "darkorange": [255,140,0,1],
  "darkorchid": [153,50,204,1], "darkred": [139,0,0,1],
  "darksalmon": [233,150,122,1], "darkseagreen": [143,188,143,1],
  "darkslateblue": [72,61,139,1], "darkslategray": [47,79,79,1],
  "darkslategrey": [47,79,79,1], "darkturquoise": [0,206,209,1],
  "darkviolet": [148,0,211,1], "deeppink": [255,20,147,1],
  "deepskyblue": [0,191,255,1], "dimgray": [105,105,105,1],
  "dimgrey": [105,105,105,1], "dodgerblue": [30,144,255,1],
  "firebrick": [178,34,34,1], "floralwhite": [255,250,240,1],
  "forestgreen": [34,139,34,1], "fuchsia": [255,0,255,1],
  "gainsboro": [220,220,220,1], "ghostwhite": [248,248,255,1],
  "gold": [255,215,0,1], "goldenrod": [218,165,32,1],
  "gray": [128,128,128,1], "green": [0,128,0,1],
  "greenyellow": [173,255,47,1], "grey": [128,128,128,1],
  "honeydew": [240,255,240,1], "hotpink": [255,105,180,1],
  "indianred": [205,92,92,1], "indigo": [75,0,130,1],
  "ivory": [255,255,240,1], "khaki": [240,230,140,1],
  "lavender": [230,230,250,1], "lavenderblush": [255,240,245,1],
  "lawngreen": [124,252,0,1], "lemonchiffon": [255,250,205,1],
  "lightblue": [173,216,230,1], "lightcoral": [240,128,128,1],
  "lightcyan": [224,255,255,1], "lightgoldenrodyellow": [250,250,210,1],
  "lightgray": [211,211,211,1], "lightgreen": [144,238,144,1],
  "lightgrey": [211,211,211,1], "lightpink": [255,182,193,1],
  "lightsalmon": [255,160,122,1], "lightseagreen": [32,178,170,1],
  "lightskyblue": [135,206,250,1], "lightslategray": [119,136,153,1],
  "lightslategrey": [119,136,153,1], "lightsteelblue": [176,196,222,1],
  "lightyellow": [255,255,224,1], "lime": [0,255,0,1],
  "limegreen": [50,205,50,1], "linen": [250,240,230,1],
  "magenta": [255,0,255,1], "maroon": [128,0,0,1],
  "mediumaquamarine": [102,205,170,1], "mediumblue": [0,0,205,1],
  "mediumorchid": [186,85,211,1], "mediumpurple": [147,112,219,1],
  "mediumseagreen": [60,179,113,1], "mediumslateblue": [123,104,238,1],
  "mediumspringgreen": [0,250,154,1], "mediumturquoise": [72,209,204,1],
  "mediumvioletred": [199,21,133,1], "midnightblue": [25,25,112,1],
  "mintcream": [245,255,250,1], "mistyrose": [255,228,225,1],
  "moccasin": [255,228,181,1], "navajowhite": [255,222,173,1],
  "navy": [0,0,128,1], "oldlace": [253,245,230,1],
  "olive": [128,128,0,1], "olivedrab": [107,142,35,1],
  "orange": [255,165,0,1], "orangered": [255,69,0,1],
  "orchid": [218,112,214,1], "palegoldenrod": [238,232,170,1],
  "palegreen": [152,251,152,1], "paleturquoise": [175,238,238,1],
  "palevioletred": [219,112,147,1], "papayawhip": [255,239,213,1],
  "peachpuff": [255,218,185,1], "peru": [205,133,63,1],
  "pink": [255,192,203,1], "plum": [221,160,221,1],
  "powderblue": [176,224,230,1], "purple": [128,0,128,1],
  "red": [255,0,0,1], "rosybrown": [188,143,143,1],
  "royalblue": [65,105,225,1], "saddlebrown": [139,69,19,1],
  "salmon": [250,128,114,1], "sandybrown": [244,164,96,1],
  "seagreen": [46,139,87,1], "seashell": [255,245,238,1],
  "sienna": [160,82,45,1], "silver": [192,192,192,1],
  "skyblue": [135,206,235,1], "slateblue": [106,90,205,1],
  "slategray": [112,128,144,1], "slategrey": [112,128,144,1],
  "snow": [255,250,250,1], "springgreen": [0,255,127,1],
  "steelblue": [70,130,180,1], "tan": [210,180,140,1],
  "teal": [0,128,128,1], "thistle": [216,191,216,1],
  "tomato": [255,99,71,1], "turquoise": [64,224,208,1],
  "violet": [238,130,238,1], "wheat": [245,222,179,1],
  "white": [255,255,255,1], "whitesmoke": [245,245,245,1],
  "yellow": [255,255,0,1], "yellowgreen": [154,205,50,1]}

function clamp_css_byte(i) {  // Clamp to integer 0 .. 255.
  i = Math.round(i);  // Seems to be what Chrome does (vs truncation).
  return i < 0 ? 0 : i > 255 ? 255 : i;
}

function clamp_css_float(f) {  // Clamp to float 0.0 .. 1.0.
  return f < 0 ? 0 : f > 1 ? 1 : f;
}

function parse_css_int(str) {  // int or percentage.
  if (str[str.length - 1] === '%')
    return clamp_css_byte(parseFloat(str) / 100 * 255);
  return clamp_css_byte(parseInt(str));
}

function parse_css_float(str) {  // float or percentage.
  if (str[str.length - 1] === '%')
    return clamp_css_float(parseFloat(str) / 100);
  return clamp_css_float(parseFloat(str));
}

function css_hue_to_rgb(m1, m2, h) {
  if (h < 0) h += 1;
  else if (h > 1) h -= 1;

  if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
  if (h * 2 < 1) return m2;
  if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
  return m1;
}

function parseCSSColor(css_str) {
  // Remove all whitespace, not compliant, but should just be more accepting.
  var str = css_str.replace(/ /g, '').toLowerCase();

  // Color keywords (and transparent) lookup.
  if (str in kCSSColorTable) return kCSSColorTable[str].slice();  // dup.

  // #abc and #abc123 syntax.
  if (str[0] === '#') {
    if (str.length === 4) {
      var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
      if (!(iv >= 0 && iv <= 0xfff)) return null;  // Covers NaN.
      return [((iv & 0xf00) >> 4) | ((iv & 0xf00) >> 8),
              (iv & 0xf0) | ((iv & 0xf0) >> 4),
              (iv & 0xf) | ((iv & 0xf) << 4),
              1];
    } else if (str.length === 7) {
      var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
      if (!(iv >= 0 && iv <= 0xffffff)) return null;  // Covers NaN.
      return [(iv & 0xff0000) >> 16,
              (iv & 0xff00) >> 8,
              iv & 0xff,
              1];
    }

    return null;
  }

  var op = str.indexOf('('), ep = str.indexOf(')');
  if (op !== -1 && ep + 1 === str.length) {
    var fname = str.substr(0, op);
    var params = str.substr(op+1, ep-(op+1)).split(',');
    var alpha = 1;  // To allow case fallthrough.
    switch (fname) {
      case 'rgba':
        if (params.length !== 4) return null;
        alpha = parse_css_float(params.pop());
        // Fall through.
      case 'rgb':
        if (params.length !== 3) return null;
        return [parse_css_int(params[0]),
                parse_css_int(params[1]),
                parse_css_int(params[2]),
                alpha];
      case 'hsla':
        if (params.length !== 4) return null;
        alpha = parse_css_float(params.pop());
        // Fall through.
      case 'hsl':
        if (params.length !== 3) return null;
        var h = (((parseFloat(params[0]) % 360) + 360) % 360) / 360;  // 0 .. 1
        // NOTE(deanm): According to the CSS spec s/l should only be
        // percentages, but we don't bother and let float or percentage.
        var s = parse_css_float(params[1]);
        var l = parse_css_float(params[2]);
        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;
        return [clamp_css_byte(css_hue_to_rgb(m1, m2, h+1/3) * 255),
                clamp_css_byte(css_hue_to_rgb(m1, m2, h) * 255),
                clamp_css_byte(css_hue_to_rgb(m1, m2, h-1/3) * 255),
                alpha];
      default:
        return null;
    }
  }

  return null;
}

try { exports.parseCSSColor = parseCSSColor } catch(e) { }

},{}],7:[function(require,module,exports){
module.exports = require('./v7.json');

},{"./v7.json":8}],8:[function(require,module,exports){
module.exports={
  "$version": 7,
  "$root": {
    "version": {
      "required": true,
      "type": "enum",
      "values": [
        7
      ],
      "doc": "Stylesheet version number. Must be 7."
    },
    "name": {
      "type": "string",
      "doc": "A human-readable name for the style."
    },
    "constants": {
      "type": "constants",
      "doc": "An object of constants to be referenced in layers."
    },
    "sources": {
      "required": true,
      "type": "sources",
      "doc": "Data source specifications."
    },
    "sprite": {
      "type": "string",
      "doc": "A base URL for retrieving the sprite image and metadata. The extensions `.png`, `.json` and scale factor `@2x.png` will be automatically appended."
    },
    "glyphs": {
      "type": "string",
      "doc": "A URL template for loading signed-distance-field glyph sets in PBF format. Valid tokens are {fontstack} and {range}."
    },
    "transition": {
      "type": "transition",
      "doc": "A global transition definition to use as a default across properties."
    },
    "layers": {
      "required": true,
      "type": "array",
      "value": "layer",
      "doc": "Layers will be drawn in the order of this array."
    }
  },
  "constants": {
    "*": {
      "type": "*",
      "doc": "A constant that will be replaced verbatim in the referencing place. This can be anything, including objects and arrays. All variable names must be prefixed with an `@` symbol."
    }
  },
  "sources": {
    "*": {
      "type": "source",
      "doc": "Specification of a data source. For vector and raster sources, either TileJSON or a URL to a TileJSON must be provided. For GeoJSON and video sources, a URL must be provided."
    }
  },
  "source": [
    "source_tile",
    "source_geojson",
    "source_video"
  ],
  "source_tile": {
    "type": {
      "required": true,
      "type": "enum",
      "values": [
        "vector",
        "raster"
      ],
      "doc": "The data type of the source."
    },
    "url": {
      "type": "string",
      "doc": "A URL to a TileJSON resource. Supported protocols are `http:`, `https:`, and `mapbox://<mapid>`."
    },
    "tiles": {
      "type": "array",
      "value": "string",
      "doc": "An array of one or more tile source URLs, as in the TileJSON spec."
    },
    "minzoom": {
      "type": "number",
      "default": 0,
      "doc": "Minimum zoom level for which tiles are available, as in the TileJSON spec."
    },
    "maxzoom": {
      "type": "number",
      "default": 22,
      "doc": "Maximum zoom level for which tiles are available, as in the TileJSON spec. Data from tiles at the maxzoom are used when displaying the map at higher zoom levels."
    },
    "tileSize": {
      "type": "number",
      "default": 512,
      "units": "pixels",
      "doc": "The minimum visual size to display tiles for this layer. Only configurable for raster layers."
    },
    "*": {
      "type": "*",
      "doc": "Other keys to configure the data source."
    }
  },
  "source_geojson": {
    "type": {
      "required": true,
      "type": "enum",
      "values": [
        "geojson"
      ]
    },
    "data": {
      "type": "*"
    }
  },
  "source_video": {
    "type": {
      "required": true,
      "type": "enum",
      "values": [
        "video"
      ]
    },
    "url": {
      "required": true,
      "type": "array",
      "value": "string",
      "doc": "URLs to video content in order of preferred format."
    },
    "coordinates": {
      "required": true,
      "type": "array",
      "length": 4,
      "value": {
        "type": "array",
        "length": 2,
        "value": "number"
      }
    }
  },
  "layer": {
    "id": {
      "type": "string",
      "doc": "Unique layer name."
    },
    "type": {
      "type": "enum",
      "values": [
        "fill",
        "line",
        "symbol",
        "raster",
        "background"
      ],
      "doc": "Rendering type of this layer."
    },
    "ref": {
      "type": "string",
      "doc": "References another layer to copy `type`, `source`, `source-layer`, `minzoom`, `maxzoom`, `filter`, and `layout` properties from. This allows the layers to share processing and be more efficient."
    },
    "source": {
      "type": "string",
      "doc": "Name of a source description to be used for this layer."
    },
    "source-layer": {
      "type": "string",
      "doc": "Layer to use from a vector tile source. Required if the source supports multiple layers."
    },
    "minzoom": {
      "type": "number",
      "minimum": 0,
      "maximum": 22,
      "doc": "The minimum zoom level on which the layer gets parsed and appears on."
    },
    "maxzoom": {
      "type": "number",
      "minimum": 0,
      "maximum": 22,
      "doc": "The maximum zoom level on which the layer gets parsed and appears on."
    },
    "interactive": {
      "type": "boolean",
      "doc": "Enable querying of feature data from this layer for interactivity.",
      "default": false
    },
    "filter": {
      "type": "filter",
      "doc": "A expression specifying conditions on source features. Only features that match the filter are displayed."
    },
    "layout": {
      "type": "layout",
      "doc": "Layout properties for the layer."
    },
    "paint": {
      "type": "paint",
      "doc": "Default paint properties for this layer."
    },
    "paint.*": {
      "type": "paint",
      "doc": "Class-specific paint properties for this layer. The class name is the part after the first dot."
    }
  },
  "layout": [
    "layout_fill",
    "layout_line",
    "layout_symbol",
    "layout_raster",
    "layout_background"
  ],
  "layout_background": {
    "visibility": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "visible",
        "none"
      ],
      "default": "visible",
      "doc": "The display of this layer. `none` hides this layer."
    }
  },
  "layout_fill": {
    "visibility": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "visible",
        "none"
      ],
      "default": "visible",
      "doc": "The display of this layer. `none` hides this layer."
    }
  },
  "layout_line": {
    "line-cap": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "butt",
        "round",
        "square"
      ],
      "default": "butt",
      "doc": "The display of line endings."
    },
    "line-join": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "bevel",
        "round",
        "miter"
      ],
      "default": "miter",
      "doc": "The display of lines when joining."
    },
    "line-miter-limit": {
      "type": "number",
      "default": 2,
      "function": "interpolated",
      "doc": "Used to automatically convert miter joins to bevel joins for sharp angles.",
      "requires": [
        {
          "line-join": "miter"
        }
      ]
    },
    "line-round-limit": {
      "type": "number",
      "default": 1,
      "function": "interpolated",
      "doc": "Used to automatically convert round joins to miter joins for shallow angles.",
      "requires": [
        {
          "line-join": "round"
        }
      ]
    },
    "visibility": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "visible",
        "none"
      ],
      "default": "visible",
      "doc": "The display of this layer. `none` hides this layer."
    }
  },
  "layout_symbol": {
    "symbol-placement": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
          "point",
          "line"
      ],
      "default": "point",
      "doc": "Label placement relative to its geometry. `line` can only be used on LineStrings and Polygons."
    },
    "symbol-min-distance": {
      "type": "number",
      "default": 250,
      "minimum": 1,
      "function": "interpolated",
      "units": "pixels",
      "doc": "Minimum distance between two symbol anchors.",
      "requires": [
        {
          "symbol-placement": "line"
        }
      ]
    },
    "symbol-avoid-edges": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the symbols will not cross tile edges to avoid mutual collisions. Recommended in layers that don't have enough padding in the vector tile to prevent collisions, or if it is a point symbol layer placed after a line symbol layer."
    },
    "icon-allow-overlap": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the icon will be visible even if it collides with other icons and text.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-ignore-placement": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the icon won't affect placement of other icons and text.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-optional": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the symbol will appear without its icon, in spaces where the icon would make it too large to fit.",
      "requires": [
        "icon-image",
        "text-field"
      ]
    },
    "icon-rotation-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "default": "viewport",
      "doc": "Orientation of icon when map is rotated.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-max-size": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "doc": "The maximum factor to scale the icon.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-image": {
      "type": "string",
      "function": "piecewise-constant",
      "doc": "A string with {tokens} replaced, referencing the data property to pull from.",
      "tokens": true
    },
    "icon-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "function": "interpolated",
      "units": "degrees",
      "doc": "Rotates the icon clockwise.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-padding": {
      "type": "number",
      "default": 2,
      "minimum": 0,
      "function": "interpolated",
      "units": "pixels",
      "doc": "Padding value around icon bounding box to avoid icon collisions.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-keep-upright": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the icon may be flipped to prevent it from being rendered upside-down",
      "requires": [
        "icon-image",
        {
          "icon-rotation-alignment": "map"
        }
      ]
    },
    "icon-offset": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "doc": "Icon's offset distance. Values are [x, y] where negatives indicate left and up, respectively.",
      "requires": [
        "icon-image"
      ]
    },
    "text-rotation-alignment": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "default": "viewport",
      "doc": "Orientation of icon or text when map is rotated.",
      "requires": [
        "text-field"
      ]
    },
    "text-field": {
      "type": "string",
      "function": "piecewise-constant",
      "default": "",
      "tokens": true,
      "doc": "Value to use for a text label. Feature properties are specified using tokens like {field_name}."
    },
    "text-font": {
      "type": "string",
      "function": "piecewise-constant",
      "default": "Open Sans Regular, Arial Unicode MS Regular",
      "doc": "Font stack to use for displaying text.",
      "requires": [
        "text-field"
      ]
    },
    "text-max-size": {
      "type": "number",
      "default": 16,
      "minimum": 0,
      "units": "pixels",
      "function": "interpolated",
      "doc": "The maximum size text will be laid out, to calculate collisions with.",
      "requires": [
        "text-field"
      ]
    },
    "text-max-width": {
      "type": "number",
      "default": 15,
      "minimum": 0,
      "units": "em",
      "function": "interpolated",
      "doc": "The maximum line width for text wrapping.",
      "requires": [
        "text-field"
      ]
    },
    "text-line-height": {
      "type": "number",
      "default": 1.2,
      "units": "em",
      "function": "interpolated",
      "doc": "Text leading value for multi-line text.",
      "requires": [
        "text-field"
      ]
    },
    "text-letter-spacing": {
      "type": "number",
      "default": 0,
      "units": "em",
      "function": "interpolated",
      "doc": "Text kerning value.",
      "requires": [
        "text-field"
      ]
    },
    "text-justify": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "left",
        "center",
        "right"
      ],
      "default": "center",
      "doc": "Text justification options.",
      "requires": [
        "text-field"
      ]
    },
    "text-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "center",
        "left",
        "right",
        "top",
        "bottom",
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right"
      ],
      "default": "center",
      "doc": "Which part of the text to place closest to the anchor.",
      "requires": [
        "text-field"
      ]
    },
    "text-max-angle": {
      "type": "number",
      "default": 45,
      "units": "degrees",
      "function": "interpolated",
      "doc": "Maximum angle change between adjacent characters.",
      "requires": [
        "text-field",
        {
          "symbol-placement": "line"
        }
      ]
    },
    "text-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "units": "degrees",
      "function": "interpolated",
      "doc": "Rotates the text clockwise.",
      "requires": [
        "text-field"
      ]
    },
    "text-padding": {
      "type": "number",
      "default": 2,
      "minimum": 0,
      "units": "pixels",
      "function": "interpolated",
      "doc": "Padding value around text bounding box to avoid label collisions.",
      "requires": [
        "text-field"
      ]
    },
    "text-keep-upright": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": true,
      "doc": "If true, the text may be flipped vertically to prevent it from being rendered upside-down.",
      "requires": [
        "text-field",
        {
          "text-rotation-alignment": "map"
        }
      ]
    },
    "text-transform": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "none",
        "uppercase",
        "lowercase"
      ],
      "default": "none",
      "doc": "Specifies how to capitalize text, similar to the CSS `text-transform` property.",
      "requires": [
        "text-field"
      ]
    },
    "text-offset": {
      "type": "array",
      "doc": "Specifies the distance that text is offset from its anchor horizontally and vertically.",
      "value": "number",
      "units": "ems",
      "function": "interpolated",
      "length": 2,
      "default": [
        0,
        0
      ],
      "requires": [
        "text-field"
      ]
    },
    "text-allow-overlap": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the text will be visible even if it collides with other icons and labels.",
      "requires": [
        "text-field"
      ]
    },
    "text-ignore-placement": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the text won't affect placement of other icons and labels.",
      "requires": [
        "text-field"
      ]
    },
    "text-optional": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": false,
      "doc": "If true, the symbol will appear without its text, in spaces where the text would make it too large to fit.",
      "requires": [
        "text-field",
        "icon-image"
      ]
    },
    "visibility": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "visible",
        "none"
      ],
      "default": "visible",
      "doc": "The display of this layer. `none` hides this layer."
    }
  },
  "layout_raster": {
    "visibility": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "visible",
        "none"
      ],
      "default": "visible",
      "doc": "The display of this layer. `none` hides this layer."
    }
  },
  "filter": {
    "type": "array",
    "value": "*"
  },
  "filter_operator": {
    "type": "enum",
    "values": [
      "==",
      "!=",
      ">",
      ">=",
      "<",
      "<=",
      "in",
      "!in",
      "all",
      "any",
      "none"
    ]
  },
  "geometry_type": {
    "type": "enum",
    "values": [
      "Point",
      "LineString",
      "Polygon"
    ]
  },
  "function": {
    "stops": {
      "type": "array",
      "required": true,
      "doc": "An array of stops.",
      "value": "function_stop"
    },
    "base": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "doc": "The exponential base of the interpolation curve. It controls the rate at which the result increases. Higher values make the result increase more towards the high end of the range. With `1` the stops are interpolated linearly."
    }
  },
  "function_stop": {
    "type": "array",
    "minimum": 0,
    "maximum": 22,
    "value": [
      "number",
      "color"
    ],
    "length": 2,
    "doc": "Zoom level and value pair."
  },
  "paint": [
    "paint_fill",
    "paint_line",
    "paint_symbol",
    "paint_raster",
    "paint_background"
  ],
  "paint_fill": {
    "fill-antialias": {
      "type": "boolean",
      "function": "piecewise-constant",
      "default": true,
      "doc": "Whether or not the fill should be antialiased."
    },
    "fill-opacity": {
      "type": "number",
      "function": "interpolated",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity given to the fill color.",
      "transition": true
    },
    "fill-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The color of the fill.",
      "function": "interpolated",
      "transition": true,
      "requires": [
        {
          "!": "fill-image"
        }
      ]
    },
    "fill-outline-color": {
      "type": "color",
      "doc": "The outline color of the fill. Matches the value of `fill-color` if unspecified.",
      "function": "interpolated",
      "transition": true,
      "requires": [
        {
          "!": "fill-image"
        },
        {
          "fill-antialias": true
        }
      ]
    },
    "fill-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively."
    },
    "fill-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "fill-translate"
      ]
    },
    "fill-image": {
      "type": "string",
      "function": "piecewise-constant",
      "transition": true,
      "doc": "Name of image in sprite to use for drawing image fills."
    }
  },
  "paint_line": {
    "line-opacity": {
      "type": "number",
      "doc": "The opacity at which the line will be drawn.",
      "function": "interpolated",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "transition": true
    },
    "line-color": {
      "type": "color",
      "doc": "The color with which the line will be drawn.",
      "default": "#000000",
      "function": "interpolated",
      "transition": true,
      "requires": [
        {
          "!": "line-image"
        }
      ]
    },
    "line-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "The geometry's offset. Values are [x, y] where negatives indicate left and up, respectively."
    },
    "line-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "line-translate"
      ]
    },
    "line-width": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Stroke thickness."
    },
    "line-gap-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "doc": "Draws a line casing outside of a line's actual path. Value indicates the width of the inner gap.",
      "function": "interpolated",
      "transition": true,
      "units": "pixels"
    },
    "line-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Blur applied to the line, in pixels."
    },
    "line-dasharray": {
      "type": "array",
      "function": "piecewise-constant",
      "value": "number",
      "doc": "Specifies the lengths of the alternating dashes and gaps that form the dash pattern. The lengths are later scaled by the line width. To convert a dash length to pixels, multiply the length by the current line width.",
      "minimum": 0,
      "transition": true,
      "units": "line widths",
      "requires": [
        {
          "!": "line-image"
        }
      ]
    },
    "line-image": {
      "type": "string",
      "function": "piecewise-constant",
      "transition": true,
      "doc": "Name of image in sprite to use for drawing image lines."
    }
  },
  "paint_symbol": {
    "icon-opacity": {
      "doc": "The opacity at which the icon will be drawn.",
      "type": "number",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "transition": true,
      "requires": [
        "icon-image"
      ]
    },
    "icon-size": {
      "type": "number",
      "default": 1,
      "function": "interpolated",
      "transition": true,
      "doc": "Scale factor for icon. 1 is original size, 3 triples the size.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-color": {
      "type": "color",
      "default": "#000000",
      "function": "interpolated",
      "transition": true,
      "doc": "The color of the icon. This can only be used with sdf icons.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-halo-color": {
      "type": "color",
      "default": "rgba(0, 0, 0, 0)",
      "function": "interpolated",
      "transition": true,
      "doc": "The color of the icon's halo. Icon halos can only be used with sdf icons.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-halo-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Distance of halo to the icon outline.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-halo-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Fade out the halo towards the outside.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "An icon's offset distance. Values are [x, y] where negatives indicate left and up, respectively.",
      "requires": [
        "icon-image"
      ]
    },
    "icon-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "icon-image",
        "icon-translate"
      ]
    },
    "text-opacity": {
      "type": "number",
      "doc": "The opacity at which the text will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "transition": true,
      "requires": [
        "text-field"
      ]
    },
    "text-size": {
      "type": "number",
      "default": 16,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Font size. If unspecified, the text will be as big as allowed by the layer definition.",
      "requires": [
        "text-field"
      ]
    },
    "text-color": {
      "type": "color",
      "doc": "The color with which the text will be drawn.",
      "default": "#000000",
      "function": "interpolated",
      "transition": true,
      "requires": [
        "text-field"
      ]
    },
    "text-halo-color": {
      "type": "color",
      "default": "rgba(0, 0, 0, 0)",
      "function": "interpolated",
      "transition": true,
      "doc": "The color of the text's halo, which helps it stand out from backgrounds.",
      "requires": [
        "text-field"
      ]
    },
    "text-halo-width": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Distance of halo to the font outline. Max text halo width is 1/4 of the font-size.",
      "requires": [
        "text-field"
      ]
    },
    "text-halo-blur": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "The halo's fadeout distance towards the outside.",
      "requires": [
        "text-field"
      ]
    },
    "text-translate": {
      "type": "array",
      "value": "number",
      "length": 2,
      "default": [
        0,
        0
      ],
      "function": "interpolated",
      "transition": true,
      "units": "pixels",
      "doc": "Label offset. Values are [x, y] where negatives indicate left and up, respectively.",
      "requires": [
        "text-field"
      ]
    },
    "text-translate-anchor": {
      "type": "enum",
      "function": "piecewise-constant",
      "values": [
        "map",
        "viewport"
      ],
      "doc": "Control whether the translation is relative to the map (north) or viewport (screen)",
      "default": "map",
      "requires": [
        "text-field",
        "text-translate"
      ]
    }
  },
  "paint_raster": {
    "raster-opacity": {
      "type": "number",
      "doc": "The opacity at which the image will be drawn.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "function": "interpolated",
      "transition": true
    },
    "raster-hue-rotate": {
      "type": "number",
      "default": 0,
      "period": 360,
      "function": "interpolated",
      "transition": true,
      "units": "degrees",
      "doc": "Rotates hues around the color wheel."
    },
    "raster-brightness-min": {
      "type": "number",
      "function": "interpolated",
      "doc": "Increase or reduce the brightness of the image. The value is the minimum brightness.",
      "default": 0,
      "minimum": 0,
      "maximum": 1,
      "transition": true
    },
    "raster-brightness-max": {
      "type": "number",
      "function": "interpolated",
      "doc": "Increase or reduce the brightness of the image. The value is the maximum brightness.",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "transition": true
    },
    "raster-saturation": {
      "type": "number",
      "doc": "Increase or reduce the saturation of the image.",
      "default": 0,
      "minimum": -1,
      "maximum": 1,
      "function": "interpolated",
      "transition": true
    },
    "raster-contrast": {
      "type": "number",
      "doc": "Increase or reduce the contrast of the image.",
      "default": 0,
      "minimum": -1,
      "maximum": 1,
      "function": "interpolated",
      "transition": true
    },
    "raster-fade-duration": {
      "type": "number",
      "default": 300,
      "minimum": 0,
      "function": "interpolated",
      "transition": true,
      "units": "milliseconds",
      "doc": "Fade duration when a new tile is added."
    }
  },
  "paint_background": {
    "background-color": {
      "type": "color",
      "default": "#000000",
      "doc": "The color with which the background will be drawn.",
      "function": "interpolated",
      "transition": true,
      "requires": [
        {
          "!": "background-image"
        }
      ]
    },
    "background-image": {
      "type": "string",
      "function": "piecewise-constant",
      "transition": true,
      "doc": "Optionally an image which is drawn as the background."
    },
    "background-opacity": {
      "type": "number",
      "default": 1,
      "minimum": 0,
      "maximum": 1,
      "doc": "The opacity at which the background will be drawn.",
      "function": "interpolated",
      "transition": true
    }
  },
  "transition": {
    "duration": {
      "type": "number",
      "default": 300,
      "minimum": 0,
      "units": "milliseconds",
      "doc": "Time allotted for transitions to complete."
    },
    "delay": {
      "type": "number",
      "default": 0,
      "minimum": 0,
      "units": "milliseconds",
      "doc": "Length of time before a transition begins."
    }
  }
}

},{}],"mapbox-gl-style-spec/lib/validate/latest":[function(require,module,exports){
'use strict';

var reference = require('../../reference/latest.js');
var validate = require('./parsed');

module.exports = function(style) {
    return validate(style, reference);
};

},{"../../reference/latest.js":7,"./parsed":5}]},{},[])("mapbox-gl-style-spec/lib/validate/latest")
});