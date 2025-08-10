/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

var { BusinessBehaviourType: BehaviourTypes } = require("./BusinessBehaviour.js");
var { BusinessOperation } = require("./BusinessBehaviourCycle.js");
var { OperationType } = require("./BusinessBehaviourCycle.js");

var getFetchCallback = function () {

    var [
        currentBehaviour,
        operationCallback,
        callback
    ] = arguments;
    return function (resource, error) {

        if (resource) currentBehaviour.state.serviceObjects = [
            resource.data ||
            resource.id ||
            resource.path
        ];
        if (error) currentBehaviour.state.error = error;
        let callingBack = typeof operationCallback === "function";
        if (callingBack) operationCallback({

            behaviour: currentBehaviour.name,
            inputObjects: currentBehaviour.inputObjects,
            resource,
            error
        }, OperationType.FETCH);
        callback();
    };
};

var getFetchCancelCallback = function (currentBehaviour) {

    return function (cancel) {

        if (typeof cancel === "function") {

            let _cancel = currentBehaviour.cancel;
            currentBehaviour.cancel = function () {

                cancel();
                if (typeof _cancel === "function") {

                    _cancel();
                }
            };
        }
    };
};

var getRequestCallback = function () {

    var [
        currentBehaviour,
        serviceOperation,
        operationCallback,
        callback
    ] = arguments;
    return function (serviceObjects, error) {

        let state = currentBehaviour.state;
        if (serviceObjects) {

            if (!state.serviceObjects) state.serviceObjects = [];
            var many = Array.isArray(serviceObjects);
            if (many) Array.prototype.push.apply(...[
                state.serviceObjects,
                serviceObjects
            ]); else state.serviceObjects.push(serviceObjects);
        }
        if (error) state.error = error;
        let callingBack = typeof operationCallback === "function";
        if (callingBack) operationCallback({

            behaviour: currentBehaviour.name,
            inputObjects: currentBehaviour.inputObjects,
            serviceObjects,
            error
        }, OperationType.REQUEST, serviceOperation);
        callback();
    };
};

var getManipulateCallback = function () {

    var [
        currentBehaviour,
        modelOperation,
        operationCallback,
        callback
    ] = arguments;
    return function (modelObjects, error) {

        let state = currentBehaviour.state;
        if (modelObjects) {

            if (!state.modelObjects) state.modelObjects = [];
            var many = Array.isArray(modelObjects);
            if (many) Array.prototype.push.apply(...[
                state.modelObjects,
                modelObjects
            ]); else state.modelObjects.push(modelObjects);
        }
        if (error) state.error = error;
        let callingBack = typeof operationCallback === "function";
        if (callingBack) operationCallback({

            behaviour: currentBehaviour.name,
            inputObjects: currentBehaviour.inputObjects,
            modelObjects,
            error
        }, OperationType.MANIPULATE, modelOperation);
        callback();
    };
};

var getMapFromCallback = function () {

    var [
        currentBehaviour,
        operationCallback,
        callback
    ] = arguments;
    return function () {

        let callingBack = typeof operationCallback === "function";
        if (callingBack) operationCallback({

            behaviour: currentBehaviour.name,
            inputObjects: currentBehaviour.inputObjects
        }, OperationType.MAPFROM, BusinessOperation.SERVICEOBJECTMAPPING);
        callback();
    };
};

var getMappingCallback = function () {

    var [
        currentBehaviour,
        operation,
        operationCallback,
        callback
    ] = arguments;
    return function (businessObjects) {

        let callingBack = typeof operationCallback === "function";
        if (callingBack) operationCallback({

            behaviour: currentBehaviour.name,
            inputObjects: currentBehaviour.inputObjects,
            businessObjects
        }, operation, BusinessOperation.MODELOBJECTMAPPING);
        callback(businessObjects);
    };
};

var BusinessDelegator = function (options) {

    var self = this;
    var {
        modelOperationDelegate,
        serviceOperationDelegate,
        businessOperationDelegate,
        FetchBehaviour,
        operationCallback
    } = options;
    self.delegateServiceOperation = function () {

        var [
            currentBehaviour,
            serviceOperation,
            callback
        ] = arguments;
        var fetchCallback = getFetchCallback(...[
            currentBehaviour,
            operationCallback,
            callback
        ]);
        var fetchCancelCallback = getFetchCancelCallback(currentBehaviour);
        var fetching = FetchBehaviour;
        if (fetching) {

            fetching = currentBehaviour instanceof FetchBehaviour;
        }
        var requestCallback = getRequestCallback(...[
            currentBehaviour,
            serviceOperation,
            operationCallback,
            callback
        ]);
        return fetching ? serviceOperationDelegate.fetch(...[
            fetchCallback,
            fetchCancelCallback
        ]) : serviceOperationDelegate.request(...[
            serviceOperation,
            requestCallback
        ]);
    };
    self.delegateModelOperation = function () {

        var [
            currentBehaviour,
            modelOperation,
            callback
        ] = arguments;
        var manipulateCallback = getManipulateCallback(...[
            currentBehaviour,
            modelOperation,
            operationCallback,
            callback
        ]);
        return modelOperationDelegate.manipulate(...[
            modelOperation,
            manipulateCallback
        ]);
    };
    self.delegateServiceMappingOperation = function () {

        var [currentBehaviour, callback] = arguments;
        var type = currentBehaviour.getType();
        var isOnlineAction = type === BehaviourTypes.ONLINEACTION;
        var mapFromCallback = getMapFromCallback(...[
            currentBehaviour,
            operationCallback,
            callback
        ]);
        return businessOperationDelegate.mapFromObjects(...[
            currentBehaviour.inputObjects,
            currentBehaviour.getProperty,
            isOnlineAction,
            mapFromCallback
        ]);
    };
    self.delegateModelMappingOperation = function () {

        var [currentBehaviour, callback] = arguments;
        var mapping = {
            [BehaviourTypes.ONLINEACTION]: OperationType.MAPBETWEEN,
            [BehaviourTypes.OFFLINEACTION]: OperationType.MAPBETWEEN,
            [BehaviourTypes.ONLINESYNC]: OperationType.MAPTO,
            [BehaviourTypes.OFFLINESYNC]: OperationType.MAPTO
        }[currentBehaviour.getType()];
        let map = {
            [OperationType.MAPTO]: businessOperationDelegate.mapToObjects,
            [OperationType.MAPBETWEEN]: businessOperationDelegate.mapBetweenObjects
        }[mapping];
        if (typeof map !== "function") {

            throw new Error("Invalid business behaviour type");
        }
        let state = currentBehaviour.state;
        let fromObjects = state.modelObjects;
        if (!fromObjects) fromObjects = state.serviceObjects;
        let mappingCallback = getMappingCallback(...[
            currentBehaviour,
            mapping,
            operationCallback,
            callback
        ]);
        return map(...[
            [fromObjects, currentBehaviour.inputObjects],
            currentBehaviour.getProperty,
            mappingCallback
        ]);
    };
};

BusinessDelegator.prototype.cancelRunningBehaviour = function (behaviour) {

    if (typeof behaviour.cancel === "function") {

        behaviour.cancel();
        behaviour.cancel = null;
    }
};

module.exports.BusinessDelegator = BusinessDelegator;
