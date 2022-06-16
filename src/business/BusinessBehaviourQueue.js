/*jslint node: true */
"use strict";

var getCancelFunc = function () {

    var self = this;
    var [
        behaviour,
        cancelExecutingBehaviour,
        behaviourQueue,
        executingBehaviourQueue
    ] = arguments;
    return function (ignoreSetComplete) {

        behaviourQueue.forEach(function (queueBehaviour) {

            if (behaviour.hasMandatoryBehaviour(...[
                queueBehaviour
            ])) getCancelFunc.apply(self, [
                queueBehaviour,
                cancelExecutingBehaviour,
                behaviourQueue,
                executingBehaviourQueue
            ])();
        });
        if (executingBehaviourQueue.indexOf(behaviour) > -1) {

            var cancelling = typeof cancelExecutingBehaviour === "function";
            if (cancelling) cancelExecutingBehaviour(...[
                behaviour
            ]);
        } else if (behaviourQueue.indexOf(behaviour) > -1) self.dequeue(...[
            behaviour,
            ignoreSetComplete,
            "cancelled"
        ]);
    };
};

var getCompletionObject = function (completionDelegate) {

    return {

        data: {

            success: null,
            dependentBehaviours: null
        },
        apply: function (success, dependentBehaviours) {

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
        success: function () {

            this.data.success = arguments[0];
            return this;
        },
        dependencies: function () {

            this.data.dependentBehaviours = arguments[0];
            return this;
        }
    };
};

var BusinessBehaviourQueue = function (setComplete, setError) {

    var self = this;
    var behaviourQueue = [];
    var executingBehaviourQueue = [];
    self.length = () => behaviourQueue.length;
    self.cancelAll = function (cancelExecutingBehaviour) {

        for (var i = 0; i < behaviourQueue.length; i++) {

            getCancelFunc.apply(self, [
                behaviourQueue[i],
                cancelExecutingBehaviour,
                behaviourQueue,
                executingBehaviourQueue
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

            index = executingBehaviourQueue.indexOf(currentBehaviour);
            if (index > -1) executingBehaviourQueue.splice(index, 1);
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
        if (behaviourQueue.indexOf(...[
            behaviour
        ]) === behaviourQueue.length - 1) next();
        return getCancelFunc.apply(self, [
            behaviour,
            cancelExecutingBehaviour,
            behaviourQueue,
            executingBehaviourQueue
        ]);
    };
    self.dequeue = function () {

        var [
            currentBehaviour,
            ignoreSetComplete,
            error
        ] = arguments;
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
                    shouldDequeue &= executingBehaviourQueue.indexOf(...[
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
            });
            return true;
        }
        return false;
    };
    self.execute = function () {

        var currentBehaviour = null;
        for (var i = behaviourQueue.length - 1; i >= 0; i--) {

            if (executingBehaviourQueue.indexOf(...[
                behaviourQueue[i]
            ]) === -1) {

                currentBehaviour = behaviourQueue[i];
                executingBehaviourQueue.push(currentBehaviour);
                break;
            }
        }
        return currentBehaviour;
    };
    self.finish = function (currentBehaviour, next) {

        if (executingBehaviourQueue.every(function () {

            var [executingBehaviour] = arguments;
            return !executingBehaviour.hasMandatoryBehaviour(...[
                currentBehaviour
            ]);
        })) next();
        var index = executingBehaviourQueue.indexOf(...[
            currentBehaviour
        ]);
        if (index > -1) executingBehaviourQueue.splice(index, 1);
    };
};

module.exports.BusinessBehaviourQueue = BusinessBehaviourQueue;
