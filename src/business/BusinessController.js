/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

var BusinessBehaviour = require('./BusinessBehaviour.js').BusinessBehaviour;
var BusinessBehaviourTypes = require('./BusinessBehaviour.js').BusinessBehaviourType;
var ModelOperationDelegate = require('./ModelOperationDelegate.js').ModelOperationDelegate;
var ServiceOperationDelegate = require('./ServiceOperationDelegate.js').ServiceOperationDelegate;
var BusinessOperationDelegate = require('./BusinessOperationDelegate.js').BusinessOperationDelegate;
var BusinessBehaviourQueue = require('./BusinessBehaviourQueue.js').BusinessBehaviourQueue;
var BusinessBehaviourCycle = require('./BusinessBehaviourCycle.js').BusinessBehaviourCycle;
var BusinessDelegator = require('./BusinessDelegator.js').BusinessDelegator;

var BusinessController = function (options) {

    var self = this;
    var ignoreBehaviours = false;
    var modelController = options.modelController;
    var getModelMethods = options.getModelMethods;
    var serviceController = options.serviceController;
    var getServiceMethods = options.getServiceMethods;
    var resourceController = options.resourceController;
    var fetchMethod = options.fetchMethod;
    var FetchBehaviour = self.FetchBehaviour = options.FetchBehaviour;
    var serviceOperations =
        BusinessBehaviourCycle.validateServiceOperations(options.serviceOperations);
    var modelOperations = BusinessBehaviourCycle.validateModelOperations(options.modelOperations);
    var operationCallback = options.operationCallback;
    if (FetchBehaviour && !(FetchBehaviour.prototype instanceof BusinessBehaviour))
        throw new Error('Invalid fetch behaviour type');
    var modelOperationDelegate = new ModelOperationDelegate({

        modelController: modelController,
        getModelMethods: getModelMethods,
        modelOperations: modelOperations
    });
    var serviceOperationDelegate = new ServiceOperationDelegate({

        modelController: modelController,
        ModelEntity: options.ModelEntity,
        QueryExpression: options.QueryExpression,
        ComparisonOperators: options.ComparisonOperators,
        serviceController: serviceController,
        getServiceMethods: getServiceMethods,
        serviceOperations: serviceOperations,
        resourceController: resourceController,
        fetchMethod: fetchMethod,
        FetchBehaviour: FetchBehaviour
    });
    var businessOperationDelegate = new BusinessOperationDelegate();
    var businessBehaviourQueue = new BusinessBehaviourQueue(BusinessBehaviourCycle.setComplete,
        BusinessBehaviourCycle.setError);
    var businessDelegator = new BusinessDelegator({

        modelOperationDelegate: modelOperationDelegate,
        serviceOperationDelegate: serviceOperationDelegate,
        businessOperationDelegate: businessOperationDelegate,
        FetchBehaviour: FetchBehaviour,
        operationCallback: operationCallback
    });
    var businessBehaviourCycle = new BusinessBehaviourCycle({

        businessController: self,
        serviceOperations: serviceOperations,
        modelOperations: modelOperations,
        BusinessBehaviourTypes: BusinessBehaviourTypes,
        businessBehaviourQueue: businessBehaviourQueue,
        delegateServiceOperation: businessDelegator.delegateServiceOperation,
        delegateModelOperation: businessDelegator.delegateModelOperation,
        delegateServiceMappingOperation: businessDelegator.delegateServiceMappingOperation,
        delegateModelMappingOperation: businessDelegator.delegateModelMappingOperation
    });
    self.modelController = modelController;
    self.serviceController = serviceController;
    self.resourceController = resourceController;
    self.getQueueLength = function () {

        return businessBehaviourQueue.length();
    };
    self.forceCancelBehaviours = function () {

        businessBehaviourQueue.cancelAll(businessDelegator.cancelRunningBehaviour);
    };
    self.ignoreBehaviours = function () {

        ignoreBehaviours = true;
    };
    self.acceptBehaviours = function () {

        ignoreBehaviours = false;
    };
    self.runBehaviour = function (behaviour, getProperty, callback) {

        if (!(behaviour instanceof BusinessBehaviour)) {

            throw new Error('Invalid behaviour');
        }
        if (ignoreBehaviours || businessBehaviourQueue.isEnqueued(behaviour)) return function () { };
        behaviour.getProperty = getProperty || function (property) {

            return property;
        };
        behaviour.callback = callback;
        return businessBehaviourQueue.enqueue(behaviour, function () {

            businessBehaviourCycle.runNextBehaviour();
        }, businessDelegator.cancelRunningBehaviour);
    };
};

module.exports.BusinessController = BusinessController;
