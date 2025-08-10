/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

var { OperationDelegateExecutive } = require("./OperationDelegateExecutive.js");
var { BusinessOperation } = require("./BusinessBehaviourCycle.js");
var parse = require("parseparams");

var checkIf = function (operation, conditions) {

    var lazy = typeof conditions[operation] === "function";
    var scalar = typeof conditions[operation] === "boolean";
    if (lazy && !conditions[operation]()) return false; else {

        if (scalar && !conditions[operation]) return false;
    }
    return true;
};

var runMiddleware = function () {

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
    if (middling && checkIf(operation, useConditions)) {

        var async = parse(middlewares[operation][index])[2] === "next";
        if (async) middlewares[operation][index](...[
            operation,
            businessController,
            () => runMiddleware(...[
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

var getOperationCancelFunc = function (internalDelegate) {

    return function () {

        this.apply = () => { };
        return internalDelegate();
    };
};

var getServiceOperation = function () {

    let [
        operationDelegateExecutive,
        serviceOperation,
        internalDelegate
    ] = arguments;
    return {

        data: {

            append: null,
            parameters: null,
            service: null,
            callback: null
        },
        apply(parameters, service, callback, append) {

            var {
                executeServiceOperation
            } = operationDelegateExecutive;
            executeServiceOperation.apply(this, [
                serviceOperation,
                internalDelegate,
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
        cancel: getOperationCancelFunc(internalDelegate)
    };
};

var getModelOperation = function () {

    let [
        operationDelegateExecutive,
        modelOperation,
        internalDelegate
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
        apply(queryOrObjects, entity, callback, append) {

            var {
                executeModelOperation
            } = operationDelegateExecutive;
            executeModelOperation.apply(this, [
                modelOperation,
                internalDelegate,
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
        cancel: getOperationCancelFunc(internalDelegate)
    };
};

var getServiceMappingOperation = function () {

    let [
        operationDelegateExecutive,
        businessOperation,
        internalDelegate
    ] = arguments;
    return {

        data: {

            callback: null
        },
        apply(callback) {

            var {
                executeServiceMappingOperation
            } = operationDelegateExecutive;
            executeServiceMappingOperation.apply(this, [
                businessOperation,
                internalDelegate,
                callback
            ]);
        },
        callback: getOperationFunc("callback"),
        cancel: getOperationCancelFunc(internalDelegate)
    };
};

var getModelMappingOperation = function () {

    let [
        operationDelegateExecutive,
        businessOperation,
        internalDelegate
    ] = arguments;
    return {

        data: {

            identifiers: null,
            callback: null
        },
        apply(identifiers, callback) {

            var {
                executeModelMappingOperation
            } = operationDelegateExecutive;
            executeModelMappingOperation.apply(this, [
                businessOperation,
                internalDelegate,
                identifiers,
                callback
            ]);
        },
        identifiers: getOperationFunc("identifiers"),
        callback: getOperationFunc("callback"),
        cancel: getOperationCancelFunc(internalDelegate)
    };
};

var getErrorHandlingOperation = function () {

    let [
        operationDelegateExecutive,
        businessOperation,
        internalDelegate
    ] = arguments;
    return {

        data: {

            error: null
        },
        apply(error) {

            var {
                executeErrorHandlingOperation
            } = operationDelegateExecutive;
            executeErrorHandlingOperation.apply(this, [
                businessOperation,
                internalDelegate,
                error
            ]);
        },
        error: getOperationFunc("error"),
        cancel: getOperationCancelFunc(internalDelegate)
    };
};

var getBusinessOperation = function () {

    let [
        operationDelegateExecutive,
        businessOperation,
        internalDelegate
    ] = arguments;
    let getOperation = {
        [BusinessOperation.SERVICEOBJECTMAPPING]: getServiceMappingOperation,
        [BusinessOperation.MODELOBJECTMAPPING]: getModelMappingOperation,
        [BusinessOperation.ERRORHANDLING]: getErrorHandlingOperation
    }[businessOperation];
    if (typeof getOperation !== "function") {

        throw new Error("Invalid business operation");
    }
    return getOperation(...[
        operationDelegateExecutive,
        businessOperation,
        internalDelegate
    ]);
};

var getNext = function () {

    let [
        operationDelegateExecutive,
        operationKey,
        beginConditions,
        businessController,
        getOperation,
        delegates,
        delegateExisted,
        internalDelegate
    ] = arguments;
    return function () {

        if (delegateExisted && checkIf(...[
            operationKey,
            beginConditions
        ])) {

            let operation = getOperation(...[
                operationDelegateExecutive,
                operationKey,
                internalDelegate
            ]);
            delegates[operationKey](...[
                operationKey,
                businessController,
                operation
            ]);
        } else if (delegateExisted) internalDelegate();
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

        watchers
    });
    self.beginServiceOperation = function () {

        let [
            serviceOperation,
            businessController,
            internalDelegate
        ] = arguments;
        let delegateExisted = !!delegates[serviceOperation];
        let next = getNext(...[
            operationDelegateExecutive,
            serviceOperation,
            beginConditions,
            businessController,
            getServiceOperation,
            delegates,
            delegateExisted,
            internalDelegate
        ]);
        runMiddleware(...[
            serviceOperation,
            businessController,
            0,
            next,
            middlewares,
            useConditions
        ]);
        return delegateExisted;
    };
    self.beginModelOperation = function () {

        let [
            modelOperation,
            businessController,
            internalDelegate
        ] = arguments;
        let delegateExisted = !!delegates[modelOperation];
        let next = getNext(...[
            operationDelegateExecutive,
            modelOperation,
            beginConditions,
            businessController,
            getModelOperation,
            delegates,
            delegateExisted,
            internalDelegate
        ]);
        runMiddleware(...[
            modelOperation,
            businessController,
            0,
            next,
            middlewares,
            useConditions
        ]);
        return delegateExisted;
    };
    self.beginBusinessOperation = function () {

        let [
            businessOperation,
            businessController,
            internalDelegate
        ] = arguments;
        let delegateExisted = !!delegates[businessOperation];
        let next = getNext(...[
            operationDelegateExecutive,
            businessOperation,
            beginConditions,
            businessController,
            getBusinessOperation,
            delegates,
            delegateExisted,
            internalDelegate
        ]);
        runMiddleware(...[
            businessOperation,
            businessController,
            0,
            next,
            middlewares,
            useConditions
        ]);
        return delegateExisted;
    };
};

module.exports.BusinessBehaviourCore = BusinessBehaviourCore;
