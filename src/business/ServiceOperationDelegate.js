/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

var { OperationType } = require("./BusinessBehaviourCycle.js");
var { ServiceController } = require("../service/ServiceController.js");

var getRequestDelegate = function () {

    var self = this;
    var [
        serviceOperation,
        serviceOperations,
        serviceMethods,
        callback
    ] = arguments;
    return function () {

        var [
            getServiceParameters,
            getEndPoint,
            setServiceObjects
        ] = arguments;
        var SERVICEOPERATION = serviceOperation.toUpperCase();
        if (SERVICEOPERATION == OperationType.FETCH.toUpperCase()) {

            throw new Error("Missing or invalid fetch behaviour");
        }
        if (!self.serviceController) {

            throw new Error("No service controller for online behaviour");
        }
        for (var i = 0; i < serviceOperations.length; i++) {

            var method = serviceMethods[serviceOperations[i]];
            if (typeof self.serviceController[method] !== "function") {

                throw new Error("Invalid service method");
            }
        }
        var requestHandler = function (serviceObjects, error) {

            var callingBack = typeof setServiceObjects === "function";
            if (callingBack) {

                callingBack &= !!setServiceObjects(serviceObjects, error);
            }
            if (callingBack) callingBack &= !!serviceObjects
            if (callingBack) callback(serviceObjects, error);
            else callback(null, error);
        };
        var sp = typeof getServiceParameters === "function";
        if (sp) sp = getServiceParameters();
        else sp = [];
        if (typeof getEndPoint === "function") {

            var ep = getEndPoint();
            var method = serviceMethods[serviceOperation];
            self.serviceController[method](sp, ep, requestHandler);
        } else requestHandler();
    };
};

var getFetchDelegate = function () {

    var self = this;
    var [
        fetchMethod,
        setCancel,
        callback
    ] = arguments;
    return function () {

        var [
            getResourceInfo,
            getStream,
            setResourceInfo
        ] = arguments;
        if (!self.resourceController) {

            throw new Error("No resource controller for fetch behaviour");
        }
        if (typeof self.resourceController[fetchMethod] !== "function") {

            throw new Error("Invalid fetch method");
        }
        var resource = null;
        var fetchHandler = function (updated_resource, error) {

            var callingBack = typeof setResourceInfo === "function";
            if (callingBack) {

                callingBack &= !!setResourceInfo(resource, error);
            }
            callingBack &= !!updated_resource;
            if (callingBack) callback(updated_resource, error);
            else callback(null, error);
        };
        var stream = typeof getStream === "function";
        if (stream) stream = getStream();
        else stream = undefined;
        if (typeof getResourceInfo === "function") {

            resource = getResourceInfo();
            var cancel = self.resourceController[fetchMethod](...[
                resource,
                stream,
                fetchHandler
            ]);
            if (typeof setCancel === "function") setCancel(cancel);
        } else fetchHandler();
    };
};

var getObjectsByIDFunc = function (modelController, options) {

    return function (id, value, modelEntity, callback) {

        var {
            QueryExpression,
            ComparisonOperators
        } = options;
        var queryByID = typeof QueryExpression === "function";
        if (queryByID) queryByID = [new QueryExpression({

            fieldName: id,
            comparisonOperator: ComparisonOperators && ComparisonOperators.EQUAL,
            fieldValue: value
        })];
        var gettingObjects = !!modelController;
        if (gettingObjects) {

            gettingObjects &= typeof modelController.getObjects === "function";
        }
        if (gettingObjects) modelController.getObjects(...[
            queryByID,
            modelEntity,
            function (result, error) {

                var many = Array.isArray(result);
                callback(...[
                    many ? result : result && result.modelObjects,
                    error
                ]);
            }
        ]);
    };
};

var ServiceOperationDelegate = function (options) {

    var self = this;
    var {
        modelController,
        serviceController,
        serviceControllerOptions,
        ModelEntity,
        getServiceMethods,
        serviceOperations,
        resourceController,
        fetchMethod
    } = options;
    if (!serviceController) {

        if (!serviceControllerOptions) {

            serviceControllerOptions = {

                createModelEntity: ModelEntity && ModelEntity.createModelEntity,
                getObjectsByID: getObjectsByIDFunc(modelController, options),
                addObjects: modelController && modelController.addObjects,
                save: modelController && modelController.save,
                objectAttributesMethod: "getObjectAttributes"
            }
        }
        serviceController = new ServiceController(serviceControllerOptions);
    }
    if (!getServiceMethods) getServiceMethods = function (index) {

        var methods = [
            "request",
            "authenticate"
        ];
        return index === undefined ? methods : methods[index];
    };
    if (!fetchMethod) fetchMethod = "loadResource";
    var serviceMethods = {};
    if (serviceController) {

        var invalidMethods = typeof getServiceMethods !== "function";
        if (!invalidMethods) {

            invalidMethods |= !Array.isArray(getServiceMethods());
        }
        if (!invalidMethods) {

            invalidMethods |= getServiceMethods().length < 2;
        }
        if (invalidMethods) throw new Error("Invalid service methods");
        for (var i = 0; i < serviceOperations.length; i++) {

            var method = getServiceMethods(i, serviceOperations[i]);
            serviceMethods[serviceOperations[i]] = method;
        }
    }
    if (resourceController) {

        if (typeof fetchMethod !== "string") {

            throw new Error("Invalid fetch methods");
        }
    }
    self.serviceController = serviceController;
    self.resourceController = resourceController;
    self.request = function (serviceOperation, callback) {

        return getRequestDelegate.apply(self, [
            serviceOperation,
            serviceOperations,
            serviceMethods,
            callback
        ]);
    };
    self.fetch = function (callback, setCancel) {

        return getFetchDelegate.apply(self, [
            fetchMethod,
            setCancel,
            callback
        ]);
    };
};

module.exports.ServiceOperationDelegate = ServiceOperationDelegate;