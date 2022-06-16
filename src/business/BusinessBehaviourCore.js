/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

var { OperationDelegateExecutive } = require("./OperationDelegateExecutive.js");
var { BusinessOperation } = require("./BusinessBehaviourCycle.js");
var parse = require("parseparams");

var ifCondition = function (operation, conditions) {

    var lazy = typeof conditions[operation] === "function";
    var scalar = typeof conditions[operation] === "boolean";
    if (lazy && !conditions[operation]()) return false;
    else if (scalar && !conditions[operation]) return false;
    return true;
};

var middleware = function () {

    var [
        operation,
        businessController,
        index,
        next,
        middlewares,
        useConditions
    ] = arguments;
    var middling = !!middlewares[operation];
    middling &= index > -1;
    if (middling) {

        middling &= index < middlewares[operation].length;
    }
    if (middling && ifCondition(operation, useConditions)) {

        var async = parse(middlewares[operation][index])[2] === "next";
        if (async) middlewares[operation][index](...[
            operation,
            businessController,
            () => middleware(...[
                operation,
                businessController,
                index + 1,
                next,
                middlewares,
                useConditions
            ]),
            next
        ]); else {

            for (var i = index; i < middlewares[operation].length; i++) {

                middlewares[operation][i](operation, businessController);
            }
            next();
        }
    } else next();
};

var getOperationFunc = function (attribute) {

    return function () {

        this.data[attribute] = arguments[0];
        return this;
    };
};

var getOperationCancelFunc = function (delegate) {

    return () => delegate();
};

var getServiceOperation = function () {

    var [
        operationDelegateExecutive,
        serviceOperation,
        delegate
    ] = arguments;
    return {

        data: {

            append: null,
            parameters: null,
            service: null,
            callback: null,
        },
        apply: function (parameters, service, callback, append) {

            var {
                executeServiceOperation
            } = operationDelegateExecutive;
            executeServiceOperation.apply(this, [
                serviceOperation,
                delegate,
                parameters,
                service,
                callback,
                append
            ]);
        },
        parameters: getOperationFunc("parameters"),
        resource: getOperationFunc("parameters"),
        service: getOperationFunc("service"),
        stream: getOperationFunc("service"),
        append: getOperationFunc("append"),
        callback: getOperationFunc("callback"),
        cancel: getOperationCancelFunc(delegate)
    };
};

var getModelOperation = function () {

    var [
        operationDelegateExecutive,
        modelOperation,
        delegate
    ] = arguments;
    return {

        data: {

            append: null,
            query: null,
            aggregate: null,
            filter: null,
            objects: null,
            entity: null,
            callback: null
        },
        apply: function (queryOrObjects, entity, callback, append) {

            var {
                executeModelOperation
            } = operationDelegateExecutive;
            executeModelOperation.apply(this, [
                modelOperation,
                delegate,
                queryOrObjects,
                entity,
                callback,
                append
            ]);
        },
        objects: getOperationFunc("objects"),
        query: getOperationFunc("query"),
        aggregate: getOperationFunc("aggregate"),
        filter: getOperationFunc("filter"),
        entity: getOperationFunc("entity"),
        append: getOperationFunc("append"),
        callback: getOperationFunc("callback"),
        cancel: getOperationCancelFunc(delegate)
    };
};

var getServiceMappingOperation = function () {

    var [
        operationDelegateExecutive,
        businessOperation,
        delegate
    ] = arguments;
    return {

        data: {

            callback: null
        },
        apply: function (callback) {

            var {
                executeServiceMappingOperation
            } = operationDelegateExecutive;
            executeServiceMappingOperation.apply(this, [
                businessOperation,
                delegate,
                callback
            ]);
        },
        callback: getOperationFunc("callback"),
        cancel: getOperationCancelFunc(delegate)
    };
};

var getModelMappingOperation = function () {

    var [
        operationDelegateExecutive,
        businessOperation,
        delegate
    ] = arguments;
    return {

        data: {

            identifiers: null,
            callback: null
        },
        apply: function (identifiers, callback) {

            var {
                executeModelMappingOperation
            } = operationDelegateExecutive;
            executeModelMappingOperation.apply(this, [
                businessOperation,
                delegate,
                identifiers,
                callback
            ]);
        },
        identifiers: getOperationFunc("identifiers"),
        callback: getOperationFunc("callback"),
        cancel: getOperationCancelFunc(delegate)
    };
};

var getErrorHandlingOperation = function () {

    var [
        operationDelegateExecutive,
        businessOperation,
        delegate
    ] = arguments;
    return {

        data: {

            error: null
        },
        apply: function (error) {

            var {
                executeErrorHandlingOperation
            } = operationDelegateExecutive;
            executeErrorHandlingOperation.apply(this, [
                businessOperation,
                delegate,
                error
            ]);
        },
        error: getOperationFunc("error"),
        cancel: getOperationCancelFunc(delegate)
    };
};

var BusinessBehaviourCore = function (options) {

    var self = this;
    var middlewares = options.middlewares;
    var delegates = options.delegates;
    var watchers = options.watchers;
    var useConditions = options.useConditions;
    var beginConditions = options.beginConditions;
    var operationDelegateExecutive = new OperationDelegateExecutive({

        watchers: watchers
    });
    self.beginServiceOperation = function () {

        var [
            serviceOperation,
            businessController,
            delegate
        ] = arguments;
        var delegateExisted = !!delegates[serviceOperation];
        middleware(...[
            serviceOperation,
            businessController,
            0,
            function () {

                if (delegateExisted && ifCondition(...[
                    serviceOperation,
                    beginConditions
                ])) delegates[serviceOperation](...[
                    serviceOperation,
                    businessController,
                    getServiceOperation(...[
                        operationDelegateExecutive,
                        serviceOperation,
                        delegate
                    ])
                ]); else if (delegateExisted) delegate();
            },
            middlewares,
            useConditions
        ]);
        return delegateExisted;
    };
    self.beginModelOperation = function () {

        var [
            modelOperation,
            businessController,
            delegate
        ] = arguments;
        var delegateExisted = !!delegates[modelOperation];
        middleware(...[
            modelOperation,
            businessController,
            0,
            function () {

                if (delegateExisted && ifCondition(...[
                    modelOperation,
                    beginConditions
                ])) delegates[modelOperation](...[
                    modelOperation,
                    businessController,
                    getModelOperation(...[
                        operationDelegateExecutive,
                        modelOperation,
                        delegate
                    ])
                ]); else if (delegateExisted) delegate();
            },
            middlewares,
            useConditions
        ]);
        return delegateExisted;
    };
    self.beginBusinessOperation = function () {

        var [
            businessOperation,
            businessController,
            delegate
        ] = arguments;
        var delegateExisted = !!delegates[businessOperation];
        middleware(...[
            businessOperation,
            businessController,
            0,
            function () {

                if (delegateExisted && ifCondition(...[
                    businessOperation,
                    beginConditions
                ])) switch (businessOperation) {

                    case BusinessOperation.SERVICEOBJECTMAPPING:
                        delegates[businessOperation](...[
                            businessOperation,
                            businessController,
                            getServiceMappingOperation(...[
                                operationDelegateExecutive,
                                businessOperation,
                                delegate
                            ])
                        ]);
                        break;
                    case BusinessOperation.MODELOBJECTMAPPING:
                        delegates[businessOperation](...[
                            businessOperation,
                            businessController,
                            getModelMappingOperation(...[
                                operationDelegateExecutive,
                                businessOperation,
                                delegate
                            ])
                        ]);
                        break;
                    case BusinessOperation.ERRORHANDLING:
                        delegates[businessOperation](...[
                            businessOperation,
                            businessController,
                            getErrorHandlingOperation(...[
                                operationDelegateExecutive,
                                businessOperation,
                                delegate
                            ])
                        ]);
                        break;
                } else if (delegateExisted) delegate();
            },
            middlewares,
            useConditions
        ]);
        return delegateExisted;
    };
};

module.exports.BusinessBehaviourCore = BusinessBehaviourCore;
