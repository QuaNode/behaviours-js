/*jslint node: true */
"use strict";

var debug = require("debug")("backend:BusinessBehaviourCycle");

var BusinessOperation = {

    SERVICEOBJECTMAPPING: "ServiceObjectMapping",
    MODELOBJECTMAPPING: "ModelObjectMapping",
    ERRORHANDLING: "ErrorHandling"
};

var ServiceOperation = {

    FETCH: "Fetch",
    AUTHENTICATION: "Authentication",
    REQUEST: "Request"
};

var ModelOperation = {

    QUERY: "Query",
    DELETE: "Delete",
    INSERT: "Insert"
};

var OperationType = {

    FETCH: "fetch",
    REQUEST: "request",
    MANIPULATE: "manipulate",
    MAPFROM: "mapfrom",
    MAPTO: "mapto",
    MAPBETWEEN: "mapbetween"
};

var validateServiceOperations = function (serviceOperations) {

    return Array.isArray(serviceOperations) ? serviceOperations : [
        ServiceOperation.REQUEST,
        ServiceOperation.AUTHENTICATION,
        ServiceOperation.FETCH
    ];
};

var validateModelOperations = function (modelOperations) {

    return Array.isArray(modelOperations) ? modelOperations : [
        ModelOperation.INSERT,
        ModelOperation.DELETE,
        ModelOperation.QUERY
    ];
};

var ignoreBusinessOperation = function () {

    var [
        currentBehaviour,
        businessOperation,
        remove
    ] = arguments;
    var businessOperations = currentBehaviour.state.businessOperations;
    var index = businessOperations.indexOf(businessOperation);
    if (remove && index > -1) businessOperations.splice(index, 1);
    return index === -1;
};

var endRunningBehaviour = function (currentBehaviour, options) {

    var self = this;
    var {
        businessBehaviourQueue,
        businessController
    } = options;
    ignoreBusinessOperation(...[
        currentBehaviour,
        BusinessOperation.MODELOBJECTMAPPING,
        true
    ]);
    if (businessBehaviourQueue.suspend(currentBehaviour)) return;
    var endRunning = function (getError) {

        if (typeof getError === "function") {

            var error = getError(currentBehaviour.state.error);
            currentBehaviour.state.error = error || undefined;
        }
        ignoreBusinessOperation(...[
            currentBehaviour,
            BusinessOperation.ERRORHANDLING,
            true
        ]);
        if (businessBehaviourQueue.suspend(currentBehaviour)) return;
        if (businessBehaviourQueue.dequeue(currentBehaviour)) {

            businessBehaviourQueue.finish(...[
                currentBehaviour,
                () => self.runNextBehaviour()
            ]);
        } else debug("Behaviour already dequeued, may be misuse of next()");
    };
    if (ignoreBusinessOperation(...[
        currentBehaviour,
        BusinessOperation.ERRORHANDLING,
        false
    ]) || !currentBehaviour.beginBusinessOperation(...[
        BusinessOperation.ERRORHANDLING,
        businessController,
        endRunning
    ])) endRunning();
};

var continueRunningBehaviour = function (currentBehaviour, options) {

    var self = this;
    var {
        businessBehaviourQueue,
        businessController,
        delegateModelOperation,
        delegateModelMappingOperation
    } = options;
    ignoreBusinessOperation(...[
        currentBehaviour,
        BusinessOperation.SERVICEOBJECTMAPPING,
        true
    ]);
    if (businessBehaviourQueue.suspend(currentBehaviour)) return;
    var state = currentBehaviour.state;
    var continueRunning = () => continueRunningBehaviour.apply(self, [
        currentBehaviour,
        options
    ]);
    var continueEnding = (businessObjects) => {

        if (businessObjects) {

            state.businessObjects = businessObjects;
        }
        endRunningBehaviour.apply(self, [currentBehaviour, options]);
    };
    var modelOperation = state.modelOperations.pop();
    if (modelOperation) {

        var internalModelDelegator = delegateModelOperation(...[
            currentBehaviour,
            modelOperation,
            continueRunning
        ]);
        if (!currentBehaviour.beginModelOperation(...[
            modelOperation,
            businessController,
            internalModelDelegator
        ])) continueRunning();
    } else {

        let internalMappingDelegator = delegateModelMappingOperation(...[
            currentBehaviour,
            continueEnding
        ]);
        if (ignoreBusinessOperation(...[
            currentBehaviour,
            BusinessOperation.MODELOBJECTMAPPING,
            false
        ]) || !currentBehaviour.beginBusinessOperation(...[
            BusinessOperation.MODELOBJECTMAPPING,
            businessController,
            internalMappingDelegator
        ])) continueEnding();
    }
};

var beginRunnigBehaviour = function (currentBehaviour, options) {

    var self = this;
    var {
        businessBehaviourQueue,
        businessController,
        delegateServiceOperation,
        delegateServiceMappingOperation
    } = options;
    if (businessBehaviourQueue.suspend(currentBehaviour)) return;
    var beginRunning = () => beginRunnigBehaviour.apply(self, [
        currentBehaviour,
        options
    ]);
    var beginRunningService = function () {

        var internalServiceDelegator = delegateServiceOperation(...[
            currentBehaviour,
            serviceOperation,
            beginRunning
        ]);
        if (!currentBehaviour.beginServiceOperation(...[
            serviceOperation,
            businessController,
            internalServiceDelegator
        ])) beginRunning();
    };
    var serviceOperation = currentBehaviour.state.serviceOperations.pop();
    if (serviceOperation) {

        let internalMappingDelegator = delegateServiceMappingOperation(...[
            currentBehaviour,
            beginRunningService
        ]);
        if (ignoreBusinessOperation(...[
            currentBehaviour,
            BusinessOperation.SERVICEOBJECTMAPPING,
            false
        ]) || !currentBehaviour.beginBusinessOperation(...[
            BusinessOperation.SERVICEOBJECTMAPPING,
            businessController,
            internalMappingDelegator
        ])) beginRunningService();
    } else continueRunningBehaviour.apply(self, [
        currentBehaviour,
        options
    ]);
};

var BusinessBehaviourCycle = function (options) {

    var self = this;
    var serviceOperations = validateServiceOperations(...[
        options.serviceOperations
    ]);
    var modelOperations = validateModelOperations(...[
        options.modelOperations
    ]);
    var businessOperations = [
        BusinessOperation.ERRORHANDLING,
        BusinessOperation.MODELOBJECTMAPPING,
        BusinessOperation.SERVICEOBJECTMAPPING
    ];
    if ([
        ...businessOperations,
        ...serviceOperations,
        ...modelOperations
    ].some(function (operation, _, operations) {

        if (typeof operation !== "string") return true;
        return operations.filter(function (op) {

            return operation === op;
        }).length > 1;
    })) throw new Error("Operations should be an array of unique strings");
    var {
        businessBehaviourQueue,
        BusinessBehaviourType
    } = options;
    self.runNextBehaviour = function () {

        var currentBehaviour = businessBehaviourQueue.execute();
        if (currentBehaviour) {

            currentBehaviour.prepareOperations(...[
                serviceOperations,
                modelOperations,
                businessOperations
            ]);
            var run = {
                [BusinessBehaviourType.ONLINESYNC]: beginRunnigBehaviour,
                [BusinessBehaviourType.ONLINEACTION]: beginRunnigBehaviour,
                [BusinessBehaviourType.OFFLINESYNC]: continueRunningBehaviour,
                [BusinessBehaviourType.OFFLINEACTION]: continueRunningBehaviour,
            }[currentBehaviour.getType()];
            if (typeof run !== "function") {

                throw new Error("Invalid behaviour type");
            }
            run.apply(self, [currentBehaviour, options]);
        }
    };
};

BusinessBehaviourCycle.setComplete = function () {

    var [
        currentBehaviour,
        completionDelegate
    ] = arguments;
    var callingBack = typeof currentBehaviour.callback === "function";
    if (callingBack) currentBehaviour.callback(...[
        currentBehaviour.state.businessObjects ||
        currentBehaviour.state.modelObjects ||
        currentBehaviour.state.serviceObjects ||
        [],
        currentBehaviour.state.error,
        completionDelegate
    ]);
};

BusinessBehaviourCycle.setError = function (behaviour, err) {

    switch (err) {

        case "cancelled":
            behaviour.state.error = new Error("Behaviour cancelled");
            break;
        case "failed":
            behaviour.state.error = new Error("Mandatory behaviour failed");
            break;
    }
};

BusinessBehaviourCycle.validateServiceOperations = validateServiceOperations;

BusinessBehaviourCycle.validateModelOperations = validateModelOperations;

module.exports.BusinessBehaviourCycle = BusinessBehaviourCycle;

module.exports.BusinessOperation = BusinessOperation;

module.exports.ServiceOperation = ServiceOperation;

module.exports.OperationType = OperationType;
