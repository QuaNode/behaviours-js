/*jslint node: true */
"use strict";

var getIfReturn = function () {

    var self = this;
    var [beginConditions, condition] = arguments;
    return {

        begin: function () {

            var operations = arguments[0];
            if (typeof operations === "string") {

                operations = [operations];
            }
            if (Array.isArray(operations)) {

                for (var i = 0; i < operations.length; i++) {

                    beginConditions[operations[i]] = condition;
                }
            }
            return self.begin.apply(self, arguments);
        }
    };
};

var getUseReturn = function () {

    var self = this;
    var [
        middlewares,
        middleware,
        useConditions,
        beginConditions,
        begin
    ] = arguments;
    return {

        begin: function () {

            for (var j = 0; j < arguments.length; j++) {

                if (typeof arguments[j] !== "function") {

                    throw new Error("Invalid begin parameters");
                }
            }
            begin = arguments;
            return this;
        },
        when: function () {

            var [operations, condition, options] = arguments;
            var withoutCondition = typeof condition === "object";
            withoutCondition &= typeof options !== "object";
            if (withoutCondition) options = condition;
            var useMiddlewareWhen = function (operation) {

                var usedMiddlewares = middlewares[operation];
                if (typeof options === "object") {

                    var followingOrder = options.order > -1;
                    followingOrder &= options.order < usedMiddlewares.length;
                    if (followingOrder) {

                        if (options.override === true) {

                            usedMiddlewares[options.order] = middleware;
                            return;
                        } else {

                            usedMiddlewares.splice(options.order, 0, middleware);
                            return;
                        }
                    } else if (options.override === true) {

                        usedMiddlewares = middlewares[operation] = [middleware];
                        return;
                    }
                }
                var withCondition = typeof condition === "boolean";
                withCondition |= typeof condition === "function";
                if (withCondition) {

                    useConditions[operations[i]] = condition;
                    if (begin) beginConditions[operations[i]] = condition;
                }
                if (!Array.isArray(usedMiddlewares)) {

                    usedMiddlewares = middlewares[operation] = [];
                }
                usedMiddlewares.push(middleware);
            };
            if (!Array.isArray(operations)) operations = [operations];
            for (var i = 0; i < operations.length; i++) {

                if (typeof operations[i] !== "string") {

                    throw new Error("Invalid operation key");
                }
                useMiddlewareWhen(operations[i]);
            }
            if (begin) {

                var args = Array.prototype.slice.call(begin);
                args.unshift(operations);
                self.begin.apply(self, args);
            }
            return self;
        }
    };
};

var BusinessLanguage = function (options) {

    var self = this;
    var {
        middlewares,
        delegates,
        watchers,
        useConditions,
        beginConditions
    } = options;
    self.watch = function (operation, callback) {

        var withoutOperation = typeof operation !== "string";
        var withoutCallback = typeof callback !== "function";
        if (withoutOperation || withoutCallback) {

            throw new Error("Invalid watch parameters");
        }
        if (!watchers[operation]) watchers[operation] = [];
        watchers[operation].push(callback);
        return self;
    };
    self.if = function () {

        var condition = arguments[0];
        return getIfReturn.apply(self, [
            beginConditions,
            condition
        ]);
    };
    self.begin = function () {

        if (arguments.length > 1) {

            var operations = arguments[0];
            var oneOperation = typeof operations === "string";
            oneOperation &= typeof arguments[1] === "function";
            var manyOperations = Array.isArray(operations);
            if (manyOperations) {

                manyOperations = operations.length <= arguments.length - 1;
            }
            if (oneOperation) delegates[operations] = arguments[1];
            else if (manyOperations) {

                for (var i = 1; i < arguments.length; i++) {

                    if (typeof arguments[i] !== "function") {

                        throw new Error("Invalid delegate function");
                    }
                    delegates[operations[i - 1]] = arguments[i];
                }
            } else throw new Error("Invalid begin parameters");
        } else throw new Error("Invalid begin parameters");
        return self;
    };
    self.use = function (middleware) {

        if (typeof middleware !== "function") {

            throw new Error("Invalid behaviour middleware function");
        }
        var begin = null;
        return getUseReturn.apply(self, [
            middlewares,
            middleware,
            useConditions,
            beginConditions,
            begin
        ]);
    };
};

module.exports.BusinessLanguage = BusinessLanguage;
