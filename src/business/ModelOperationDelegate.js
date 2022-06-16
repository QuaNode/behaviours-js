/*jslint node: true */
"use strict";

var getManipulateDelegate = function () {

    var self = this;
    var [
        modelOperation,
        modelOperations,
        modelMethods,
        callback
    ] = arguments;
    return function () {

        var [
            getObjWrapperOrObjAttributes,
            getModelEntity,
            setModelObjects
        ] = arguments;
        if (!self.modelController) {

            throw new Error("No model controller for offline behaviour");
        }
        for (var i = 0; i < modelOperations.length; i++) {

            var method = modelMethods[modelOperations[i]];
            if (typeof self.modelController[method] !== "function") {

                throw new Error("Invalid model method");
            }
        }
        var modelCallback = function (modelObjects, error) {

            var callingBack = typeof setModelObjects === "function";
            if (callingBack) {

                callingBack &= setModelObjects(modelObjects, error);
            }
            if (callingBack) callingBack &= modelObjects;
            if (callingBack) callback(modelObjects, error);
            else callback(null, error);
        };
        var wp = typeof getObjWrapperOrObjAttributes === "function";
        if (wp) wp = getObjWrapperOrObjAttributes();
        else wp = [];
        if (typeof getModelEntity === "function") {

            var md = getModelEntity();
            var method = modelMethods[modelOperation];
            self.modelController[method](wp, md, modelCallback);
        } else modelCallback();
    };
};

var ModelOperationDelegate = function (options) {

    var self = this;
    var {
        modelController,
        getModelMethods,
        modelOperations
    } = options;
    if (!getModelMethods) getModelMethods = function (index) {

        var methods = [
            "addObjects",
            "removeObjects",
            "getObjects"
        ];
        return index === undefined ? methods : methods[index];
    };
    var modelMethods = {};
    if (modelController) {

        var invalidMethods = typeof getModelMethods !== "function";
        if (!invalidMethods) {

            invalidMethods |= !Array.isArray(getModelMethods());
        }
        if (!invalidMethods) {

            invalidMethods |= getModelMethods().length < 3;
        }
        if (invalidMethods) throw new Error("Invalid model methods");
        for (var i = 0; i < modelOperations.length; i++) {

            var method = getModelMethods(i, modelOperations[i]);
            modelMethods[modelOperations[i]] = method;
            if (typeof modelController[method] !== "function") {

                throw new Error("Invalid model method");
            }
        }
    }
    self.modelController = modelController;
    self.manipulate = function (modelOperation, callback) {

        return getManipulateDelegate.apply(self, [
            modelOperation,
            modelOperations,
            modelMethods,
            callback
        ]);
    };
};

module.exports.ModelOperationDelegate = ModelOperationDelegate;
