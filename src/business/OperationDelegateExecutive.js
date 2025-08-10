/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

var parse = require("parseparams");

var watch = function () {

    var [
        operation,
        data,
        index,
        continṵe,
        watchers
    ] = arguments;
    var watching = !!watchers[operation];
    watching &= index > -1;
    if (watching) {

        watching &= index < watchers[operation].length;
    }
    if (watching) {

        var async = parse(watchers[operation][index])[1] === "continṵe";
        if (async) watchers[operation][index](data, () => watch(...[
            operation,
            data,
            index + 1,
            continṵe,
            watchers
        ]), () => continṵe()); else {

            for (var i = index; i < watchers[operation].length; i++) {

                watchers[operation][i](data);
            }
            continṵe();
        }
    } else continṵe();
};

var getServiceContinue = function (internalDelegate) {

    var that = this;
    return function () {

        var lazyParameters = typeof that.data.parameters === "function";
        var lazyService = typeof that.data.service === "function";
        let callingBack = typeof that.data.callback === "function";
        let externalCallbackDelegate = function () {

            if (callingBack) that.data.callback.apply(null, arguments);
            return that.data.append;
        };
        let externalDelegates = [
            lazyParameters ? that.data.parameters : () => that.data.parameters,
            lazyService ? that.data.service : () => that.data.service,
            externalCallbackDelegate
        ];
        internalDelegate(...externalDelegates);
    };
};

var getModelContinue = function (internalDelegate) {

    var that = this;
    return function () {

        var lazyWrapper = typeof that.data.wrapper === "function";
        var lazyEntity = typeof that.data.entity === "function";
        let callingBack = typeof that.data.callback === "function";
        let externalCallbackDelegate = function () {

            if (callingBack) that.data.callback.apply(null, arguments);
            return that.data.append;
        };
        let externalDelegates = [
            lazyWrapper ? that.data.wrapper : () => that.data.wrapper,
            lazyEntity ? that.data.entity : () => that.data.entity,
            externalCallbackDelegate
        ];
        internalDelegate(...externalDelegates);
    };
};

var getServiceMappingContinue = function (internalDelegate) {

    var that = this;
    return function () {

        let callingBack = typeof that.data.callback === "function";
        let externalCallbackDelegate = function () {

            if (callingBack) that.data.callback.apply(null, arguments);
        };
        let externalDelegates = [externalCallbackDelegate];
        internalDelegate(...externalDelegates);
    };
};

var getModelMappingContinue = function (internalDelegate) {

    var that = this;
    return function () {

        var lazyIdentifiers = typeof that.data.identifiers === "function";
        let callingBack = typeof that.data.callback === "function";
        let externalCallbackDelegate = function () {

            if (callingBack) that.data.callback.apply(null, arguments);
        };
        let externalIdentifiersDelegate = function () {

            if (lazyIdentifiers) {

                return that.data.identifiers.apply(null, arguments) || [];
            } return that.data.identifiers || [];
        };
        let externalDelegates = [
            externalIdentifiersDelegate,
            externalCallbackDelegate
        ];
        internalDelegate(...externalDelegates);
    };
};

var getErrorHandlingContinue = function (internalDelegate) {

    var that = this;
    return function () {

        var lazyError = typeof that.data.error === "function";
        let externalDelegates = [
            lazyError ? that.data.error : () => that.data.error
        ];
        internalDelegate(...externalDelegates);
    };
};

var OperationDelegateExecutive = function (options) {

    var self = this;
    var watchers = options.watchers;
    self.executeServiceOperation = function () {

        var that = this;
        var [
            serviceOperation,
            internalDelegate,
            parameters,
            service,
            callback,
            append
        ] = arguments;
        if (parameters) {

            that.data.parameters = parameters;
        }
        if (service) {

            that.data.service = service;
        }
        if (callback) {

            that.data.callback = callback;
        }
        if (typeof parameters === "boolean") {

            that.data.append = parameters;
        } else if (typeof append === "boolean") {

            that.data.append = append;
        }
        var serviceContinue = getServiceContinue.apply(that, [internalDelegate]);
        watch(serviceOperation, that.data, 0, serviceContinue, watchers);
    };
    self.executeModelOperation = function () {

        var that = this;
        var [
            modelOperation,
            internalDelegate,
            queryOrObjects,
            entity,
            callback,
            append
        ] = arguments;
        var lazyQuery = !Array.isArray(queryOrObjects);
        lazyQuery &= typeof that.data.query === "function";
        var lazyAggregate = typeof that.data.aggregate === "function";
        var lazyFilter = typeof that.data.filter === "function";
        if (that.data.objects) {

            that.data.wrapper = that.data.objects;
        } else that.data.wrapper = {

            getObjectQuery: lazyQuery ? that.data.query : () => queryOrObjects || that.data.query,
            getObjectAggregate: lazyAggregate ? that.data.aggregate : () => that.data.aggregate,
            getObjectFilter: lazyFilter ? that.data.filter : () => that.data.filter
        };
        if (entity) {

            that.data.entity = entity;
        }
        if (callback) {

            that.data.callback = callback;
        }
        if (typeof queryOrObjects === "boolean") {

            that.data.append = queryOrObjects;
        } else if (typeof append === "boolean") {

            that.data.append = append;
        }
        var modelContinue = getModelContinue.apply(that, [internalDelegate]);
        watch(modelOperation, that.data, 0, modelContinue, watchers);
    };
    self.executeServiceMappingOperation = function () {

        var that = this;
        var [
            businessOperation,
            internalDelegate,
            callback
        ] = arguments;
        if (callback) {

            that.data.callback = callback;
        }
        var serviceMappingContinue = getServiceMappingContinue.apply(that, [internalDelegate]);
        watch(...[
            businessOperation,
            that.data,
            0,
            serviceMappingContinue,
            watchers
        ]);
    };
    self.executeModelMappingOperation = function () {

        var that = this;
        var [
            businessOperation,
            internalDelegate,
            identifiers,
            callback
        ] = arguments;
        if (identifiers) {

            that.data.identifiers = identifiers;
        }
        if (callback) {

            that.data.callback = callback;
        }
        var modelMappingContinue = getModelMappingContinue.apply(that, [internalDelegate]);
        watch(...[
            businessOperation,
            that.data,
            0,
            modelMappingContinue,
            watchers
        ]);
    };
    self.executeErrorHandlingOperation = function () {

        var that = this;
        var [
            businessOperation,
            internalDelegate,
            error
        ] = arguments;
        if (error) {

            that.data.error = error;
        }
        var errorHandlingContinue = getErrorHandlingContinue.apply(that, [internalDelegate]);
        watch(...[
            businessOperation,
            that.data,
            0,
            errorHandlingContinue,
            watchers
        ]);
    };
};

module.exports.OperationDelegateExecutive = OperationDelegateExecutive;
