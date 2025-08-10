/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

var { BusinessBehaviour } = require("./BusinessBehaviour.js");
var { BusinessBehaviourType } = require("./BusinessBehaviour.js");
var { ModelOperationDelegate } = require("./ModelOperationDelegate.js");
var { ServiceOperationDelegate } = require("./ServiceOperationDelegate.js");
var { BusinessOperationDelegate } = require("./BusinessOperationDelegate.js");
var { BusinessBehaviourQueue } = require("./BusinessBehaviourQueue.js");
var { BusinessBehaviourCycle } = require("./BusinessBehaviourCycle.js");
var { BusinessDelegator } = require("./BusinessDelegator.js");

var BusinessController = function (options) {

    var self = this;
    var ignoreBehaviours = false;
    var {
        identifier,
        modelController,
        getModelMethods,
        serviceController,
        getServiceMethods,
        resourceController,
        fetchMethod,
        FetchBehaviour
    } = options;
    self.FetchBehaviour = FetchBehaviour;
    var {
        validateServiceOperations,
        validateModelOperations
    } = BusinessBehaviourCycle;
    var serviceOperations = validateServiceOperations(...[
        options.serviceOperations
    ]);
    var modelOperations = validateModelOperations(...[
        options.modelOperations
    ]);
    var { operationCallback } = options;
    if (FetchBehaviour && !(FetchBehaviour.prototype instanceof BusinessBehaviour)) {

        throw new Error("Invalid fetch behaviour type");
    }
    var modelOperationDelegate = new ModelOperationDelegate({

        modelController,
        getModelMethods,
        modelOperations
    });
    var serviceOperationDelegate = new ServiceOperationDelegate({

        modelController,
        ModelEntity: options.ModelEntity,
        QueryExpression: options.QueryExpression,
        ComparisonOperators: options.ComparisonOperators,
        serviceController,
        getServiceMethods,
        serviceOperations,
        resourceController,
        fetchMethod,
        FetchBehaviour
    });
    var businessOperationDelegate = new BusinessOperationDelegate();
    var businessBehaviourQueue = new BusinessBehaviourQueue(...[
        BusinessBehaviourCycle.setComplete,
        BusinessBehaviourCycle.setError
    ]);
    var businessDelegator = new BusinessDelegator({

        modelOperationDelegate,
        serviceOperationDelegate,
        businessOperationDelegate,
        FetchBehaviour,
        operationCallback
    });
    var {
        delegateServiceOperation,
        delegateModelOperation,
        delegateServiceMappingOperation,
        delegateModelMappingOperation
    } = businessDelegator;
    var businessBehaviourCycle = new BusinessBehaviourCycle({

        businessController: self,
        serviceOperations,
        modelOperations,
        BusinessBehaviourType,
        businessBehaviourQueue,
        delegateServiceOperation,
        delegateModelOperation,
        delegateServiceMappingOperation,
        delegateModelMappingOperation
    });
    self.modelController = modelController;
    self.serviceController = serviceController;
    self.resourceController = resourceController;
    self.getQueueLength = () => businessBehaviourQueue.length();
    self.forceCancelBehaviours = () => businessBehaviourQueue.cancelAll(...[
        businessDelegator.cancelRunningBehaviour
    ]);
    self.ignoreBehaviours = () => ignoreBehaviours = true;
    self.acceptBehaviours = () => ignoreBehaviours = false;
    self.runBehaviour = function (behaviour, getProperty, callback) {

        if (!(behaviour instanceof BusinessBehaviour)) {

            throw new Error("Invalid behaviour");
        }
        var ignoring = ignoreBehaviours
        ignoring |= businessBehaviourQueue.isEnqueued(behaviour);
        if (ignoring) return () => { };
        behaviour.getProperty = getProperty || ((property) => property);
        behaviour.callback = callback;
        behaviour.controller = identifier;
        return businessBehaviourQueue.enqueue(...[
            behaviour,
            () => businessBehaviourCycle.runNextBehaviour(),
            businessDelegator.cancelRunningBehaviour
        ]);
    };
};

module.exports.BusinessController = BusinessController;
