/*jslint node: true */
"use strict";

var debug = require("debug")("backend:BusinessBehaviourQueue");

var getCancelFunc = function () {

    var self = this;
    var [
        behaviour,
        cancelExecutingBehaviour,
        behaviourQueue,
        executingBehaviours
    ] = arguments;
    return function (ignoreSetComplete, cancellingReason) {

        behaviourQueue.forEach(function (queueBehaviour) {

            if (behaviour.hasMandatoryBehaviour(queueBehaviour)) {

                getCancelFunc.apply(self, [
                    queueBehaviour,
                    cancelExecutingBehaviour,
                    behaviourQueue,
                    executingBehaviours
                ])();
            }
        });
        if (executingBehaviours.indexOf(behaviour) > -1) {

            var state = behaviour.state;
            var dump = JSON.stringify({
                operations: [
                    ...state.serviceOperations,
                    ...state.modelOperations,
                    ...state.businessOperations
                ]
            });
            state.serviceOperations = [];
            state.modelOperations = [];
            state.businessOperations = [];
            if (cancellingReason) {

                state.error = new Error(cancellingReason);
            }
            var cancelling = typeof cancelExecutingBehaviour === "function";
            if (cancelling) cancelExecutingBehaviour(behaviour);
            if (typeof state.next === "function") {

                if (!behaviour.timeout) behaviour.timeout = 60;
                setTimeout(function () {

                    if (executingBehaviours.indexOf(behaviour) === -1) {

                        return;
                    }
                    var name = behaviour.name || "";
                    debug("Behaviour " + name + " hangs: " + dump);
                    if (typeof state.next === "function") {

                        state.next();
                        state.cancelled = true;
                        return;
                    }
                    debug("Behaviour " + name + " failed to cancel!");
                }, behaviour.timeout * 1000);
            }
        } else if (behaviourQueue.indexOf(behaviour) > -1) {

            self.dequeue(...[
                behaviour,
                ignoreSetComplete,
                cancellingReason || "cancelled"
            ]);
        }
    };
};

var getCompletionObject = function (completionDelegate) {

    return {

        data: {

            success: null,
            dependentBehaviours: null
        },
        apply(success, dependentBehaviours) {

            if (typeof success === "boolean") this.data.success = success;
            if (dependentBehaviours) {

                this.data.dependentBehaviours = dependentBehaviours;
            }
            completionDelegate(function () {

                if (typeof this.data.success === "function") {

                    return this.data.success.apply(null, arguments);
                }
                return this.data.success;
            }, function () {

                if (typeof this.data.dependentBehaviours === "function") {

                    return this.data.dependentBehaviours.apply(...[
                        null,
                        arguments
                    ]);
                }
                return this.data.dependentBehaviours;
            });
        },
        success() {

            this.data.success = arguments[0];
            return this;
        },
        dependencies() {

            this.data.dependentBehaviours = arguments[0];
            return this;
        }
    };
};

var BusinessBehaviourQueue = function (setComplete, setError) {

    var self = this;
    var behaviourQueue = [];
    var executingBehaviours = [];
    self.length = () => behaviourQueue.length;
    self.cancelAll = function (cancelExecutingBehaviour) {

        for (var i = 0; i < behaviourQueue.length; i++) {

            getCancelFunc.apply(self, [
                behaviourQueue[i],
                cancelExecutingBehaviour,
                behaviourQueue,
                executingBehaviours
            ])();
        }
    };
    self.isEnqueued = (behaviour) => behaviourQueue.some(function () {

        var [queueBehaviour] = arguments;
        return behaviour.isEqualToBehaviour(queueBehaviour);
    });
    self.suspend = function (currentBehaviour) {

        var index = behaviourQueue.indexOf(currentBehaviour);
        if (index > -1 && index !== behaviourQueue.length - 1) {

            index = executingBehaviours.indexOf(currentBehaviour);
            if (index > -1) executingBehaviours.splice(index, 1);
            return true;
        }
        return false;
    };
    self.enqueue = function (behaviour, next, cancelExecutingBehaviour) {

        for (var i = behaviourQueue.length - 1; true; i--) {

            var shouldEnqueue = i < 0;
            var currentBehaviour = shouldEnqueue ? null : behaviourQueue[i];
            if (!shouldEnqueue) {

                var {
                    hasMandatoryBehaviour,
                    priority
                } = currentBehaviour;
                shouldEnqueue |= hasMandatoryBehaviour.apply(...[
                    currentBehaviour,
                    [behaviour]
                ]);
                shouldEnqueue |= priority < behaviour.priority;
            }
            if (shouldEnqueue) {

                behaviourQueue.splice(i + 1, 0, behaviour);
                break;
            }
        }
        var cancelFunc = getCancelFunc.apply(self, [
            behaviour,
            cancelExecutingBehaviour,
            behaviourQueue,
            executingBehaviours
        ]);
        var index = behaviourQueue.indexOf(behaviour);
        if (behaviour.timeout > 0) {

            behaviour._timeout = setTimeout(function () {

                behaviour._timeout = undefined;
                delete behaviour._timeout;
                var length = behaviourQueue.length;
                var reason = "Behaviour timeout at index " + index;
                reason += " while " + length + " in the queue";
                cancelFunc(false, reason);
            }, behaviour.timeout * 1000);
        }
        if (index === behaviourQueue.length - 1) next();
        return cancelFunc;
    };
    self.dequeue = function () {

        var [
            currentBehaviour,
            ignoreSetComplete,
            error
        ] = arguments;
        if (currentBehaviour._timeout) {

            clearTimeout(currentBehaviour._timeout);
            currentBehaviour._timeout = undefined;
            delete currentBehaviour._timeout;
        }
        var index = behaviourQueue.indexOf(currentBehaviour);
        if (index > -1) {

            behaviourQueue.splice(index, 1);
            var completionDelegate = function () {

                var [isSuccess, getDependentBehaviours] = arguments;
                var success = typeof isSuccess === "function";
                if (success) success = isSuccess();
                var dependentBehaviours = [];
                if (typeof getDependentBehaviours === "function") {

                    dependentBehaviours = getDependentBehaviours();
                }
                if (!success) dependentBehaviours.forEach(function () {

                    var [executingBehaviour] = arguments;
                    var shouldDequeue = behaviourQueue.indexOf(...[
                        executingBehaviour
                    ]) > -1;
                    shouldDequeue &= executingBehaviours.indexOf(...[
                        executingBehaviour
                    ]) === -1;
                    if (shouldDequeue) self.dequeue(...[
                        executingBehaviour,
                        false,
                        "failed"
                    ]);
                });
            };
            var completing = !ignoreSetComplete;
            completing &= typeof setComplete === "function";
            if (completing) setTimeout(function () {

                if (typeof setError === "function" && error) {

                    setError(currentBehaviour, error);
                }
                setComplete(...[
                    currentBehaviour,
                    getCompletionObject(completionDelegate)
                ]);
            }, 0);
            return true;
        }
        return false;
    };
    self.execute = function () {

        var currentBehaviour = null;
        for (var i = behaviourQueue.length - 1; i >= 0; i--) {

            if (executingBehaviours.indexOf(...[
                behaviourQueue[i]
            ]) === -1) {

                currentBehaviour = behaviourQueue[i];
                executingBehaviours.push(currentBehaviour);
                break;
            }
        }
        return currentBehaviour;
    };
    self.finish = function (currentBehaviour, next) {

        if (executingBehaviours.every(function () {

            var [executingBehaviour] = arguments;
            return !executingBehaviour.hasMandatoryBehaviour(...[
                currentBehaviour
            ]);
        })) next();
        var index = executingBehaviours.indexOf(currentBehaviour);
        if (index > -1) executingBehaviours.splice(index, 1);
    };
};

module.exports.BusinessBehaviourQueue = BusinessBehaviourQueue;
