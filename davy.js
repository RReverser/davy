(function(global) {
  "use strict";
  if (typeof define === "function" && define.amd) {
    define(Promise);
  } else if (typeof module === "object" && module.exports) {
    module.exports = Promise;
    var nextTick = require("subsequent");
  } else {
    global.Davy = global.Promise = Promise;
    var nextTick = global.nextTick;
  }
  function Promise(value) {
    this.value = value;
    this.deferreds = [];
  }
  Promise.SUCCESS = "fulfill";
  Promise.FAILURE = "reject";
  Promise.prototype.isFulfilled = false;
  Promise.prototype.isRejected = false;
  Promise.prototype.then = function(onFulfill, onReject) {
    var promise = new Promise(), deferred = defer(promise, onFulfill, onReject);
    if (this.isFulfilled || this.isRejected) {
      resolve(deferred, this.isFulfilled ? Promise.SUCCESS : Promise.FAILURE, this.value);
    } else {
      this.deferreds.push(deferred);
    }
    return promise;
  };
  Promise.prototype.fulfill = function(value) {
    if (this.isFulfilled || this.isRejected) return;
    try {
      if (value === this) throw new TypeError("Can't resolve a promise with itself.");
      if (isObject(value) || isFunction(value)) {
        var then = value.then, self = this;
        if (isFunction(then)) {
          then.call(value, function(val) {
            self.fulfill(val);
          }, function(err) {
            self.reject(err);
          });
          return;
        }
      }
      this.isFulfilled = true;
      this.complete(value);
    } catch (e) {
      this.reject(e);
    }
  };
  Promise.prototype.reject = function(error) {
    if (this.isFulfilled || this.isRejected) return;
    this.isRejected = true;
    this.complete(error);
  };
  Promise.prototype.complete = function(value) {
    this.value = value;
    var type = this.isFulfilled ? Promise.SUCCESS : Promise.FAILURE;
    for (var i = 0; i < this.deferreds.length; ++i) {
      resolve(this.deferreds[i], type, value);
    }
    this.deferreds = undefined;
  };
  function resolve(deferred, type, value) {
    nextTick(function() {
      var fn = deferred[type], promise = deferred.promise, res;
      if (isFunction(fn)) {
        try {
          res = fn(value);
        } catch (e) {
          promise.reject(e);
          return;
        }
        promise.fulfill(res);
      } else {
        promise[type](value);
      }
    });
  }
  function defer(promise, fulfill, reject) {
    return {
      promise: promise,
      fulfill: fulfill,
      reject: reject
    };
  }
  function isObject(obj) {
    return obj && typeof obj === "object";
  }
  function isFunction(fn) {
    return fn && typeof fn === "function";
  }
})(this);