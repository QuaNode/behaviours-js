/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

var { BusinessObjectMapping } = require("./BusinessObjectMapping.js");

var getInputObjectsShallowCopy = function () {

    var [
        objects,
        superProperty,
        getSubProperty,
        getInputObject
    ] = arguments;
    return function () {

        var cb = arguments[0];
        var push = function (index, inputObjects) {

            var pushInputObject = function (inputObject) {

                inputObjects.push(inputObject);
                if (objects[index + 1]) {

                    push(index + 1, inputObjects);
                } else if (typeof cb === "function") cb(inputObjects);
            };
            setTimeout(function () {

                getInputObject(...[
                    objects[index],
                    superProperty,
                    getSubProperty
                ])(pushInputObject);
            }, 0);
        };
        if (Array.isArray(objects)) {

            if (objects[0]) push(0, []); else {

                if (typeof cb === "function") cb([]);
            }
        } else if (objects) getInputObject(...[
            objects,
            superProperty,
            getSubProperty
        ])(function (inputObject) {

            if (typeof cb === "function") cb(inputObject);
        });
    };
};

var getInputObjectShallowCopy = function () {

    var [
        object,
        superProperty,
        getSubProperty,
        getProperty,
        relate,
        getInputObjects,
        getInputObject
    ] = arguments;
    return function () {

        var cb = arguments[0];
        var inputObject = {};
        var businessObjectMapping = new BusinessObjectMapping();
        businessObjectMapping.map(...[
            inputObject,
            object,
            true,
            superProperty,
            getSubProperty ||
            getProperty
        ]);
        if (relate) businessObjectMapping.relate(...[
            inputObject,
            object,
            superProperty,
            getInputObjects,
            getInputObject,
            getSubProperty ||
            getProperty
        ])(function () {

            if (typeof cb === "function") cb(inputObject);
        }); else if (typeof cb === "function") cb(inputObject);
    };
};

var getBusinessObjectsShallowCopy = function () {

    var [
        objects,
        superProperty,
        getSubProperty,
        getBusinessObject
    ] = arguments;
    return function () {

        var cb = arguments[0];
        var push = function (index, businessObjects) {

            var pushBusinessObject = function (businessObject) {

                businessObjects.push(businessObject);
                if (objects[index + 1]) push(index + 1, businessObjects); else {

                    if (typeof cb === "function") cb(businessObjects);
                }
            };
            setTimeout(function () {

                getBusinessObject(...[
                    objects[index],
                    superProperty,
                    getSubProperty
                ])(pushBusinessObject);
            }, 0);
        };
        if (objects[0]) push(0, []); else if (typeof cb === "function") cb([]);
    };
};

var mapObjects = function () {

    var [
        fromObjects,
        getBusinessObjectFunc,
        callback
    ] = arguments;
    return function (getIdentificationAttributes, setBusinessObjects) {

        var getBusinessObjects = function () {

            var [
                objects,
                superProperty,
                getSubProperty
            ] = arguments;
            return getBusinessObjectsShallowCopy(...[
                objects,
                superProperty,
                getSubProperty,
                getBusinessObject
            ]);
        };
        var getBusinessObject = getBusinessObjectFunc(...[
            getBusinessObjects,
            getIdentificationAttributes
        ]);
        var settingBusinessObject_s = typeof setBusinessObjects === "function";
        var fromMany = Array.isArray(fromObjects);
        if (settingBusinessObject_s) {

            let getShallowCopy = fromMany ? getBusinessObjects : getBusinessObject;
            let shallowCopy = getShallowCopy(fromObjects);
            shallowCopy(function (toObjects) {

                setBusinessObjects(toObjects);
                callback(toObjects);
            });
        } else callback();
    };
};

var getBusinessObjectShallowCopy_To = function () {

    var [
        object,
        superProperty,
        getSubProperty,
        getProperty,
        getBusinessObjects,
        getBusinessObject
    ] = arguments;
    return function () {

        var cb = arguments[0];
        var businessObject = {};
        var businessObjectMapping = new BusinessObjectMapping();
        businessObjectMapping.map(...[
            businessObject,
            object,
            true,
            superProperty,
            getSubProperty ||
            getProperty
        ]);
        businessObjectMapping.relate(...[
            businessObject,
            object,
            superProperty,
            getBusinessObjects,
            getBusinessObject,
            getSubProperty ||
            getProperty
        ])(function () {

            if (typeof cb === "function") cb(businessObject);
        });
    };
};

var getBusinessObjectShallowCopy_Between = function () {

    var [
        object,
        superProperty,
        getSubProperty,
        getProperty,
        inputObjects,
        getIdentificationAttributes
    ] = arguments;
    return function () {

        var cb = arguments[0];
        var businessObject = {};
        var businessObjectMapping = new BusinessObjectMapping();
        var many = Array.isArray(inputObjects);
        businessObject = (many ? inputObjects : [
            inputObjects
        ]).filter(function (inputObject) {

            if (typeof getIdentificationAttributes === "function") {

                return getIdentificationAttributes().every(function () {

                    var [idAttr] = arguments;
                    if (object) {

                        return businessObjectMapping.getAttributeValue(...[
                            inputObject,
                            getSubProperty ||
                            getProperty,
                            idAttr,
                            superProperty
                        ]) === object[idAttr];
                    }
                });
            }
        })[0];
        businessObjectMapping.map(...[
            businessObject,
            object,
            false,
            superProperty,
            getSubProperty ||
            getProperty
        ]);
        businessObjectMapping.deepMap(...[
            businessObject,
            object,
            superProperty,
            getSubProperty ||
            getProperty
        ]);
        if (typeof cb === "function") cb(businessObject);
    };
};

var BusinessOperationDelegate = function () { };

BusinessOperationDelegate.prototype.mapFromObjects = function () {

    var [
        fromObjects,
        getProperty,
        relate,
        callback
    ] = arguments;
    return function (setInputObjects) {

        var getInputObjects = function () {

            var [
                objects,
                superProperty,
                getSubProperty
            ] = arguments;
            return getInputObjectsShallowCopy(...[
                objects,
                superProperty,
                getSubProperty,
                getInputObject
            ]);
        };
        var getInputObject = function () {

            var [
                object,
                superProperty,
                getSubProperty
            ] = arguments;
            return getInputObjectShallowCopy(...[
                object,
                superProperty,
                getSubProperty,
                getProperty,
                relate,
                getInputObjects,
                getInputObject
            ]);
        };
        if (typeof setInputObjects === "function") {

            let shallowCopy = getInputObjects(fromObjects);
            shallowCopy(function (inputObjects) {

                setInputObjects(inputObjects);
                callback();
            });
        } else callback();
    };
};

BusinessOperationDelegate.prototype.mapToObjects = function () {

    var [
        [fromObjects],
        getProperty,
        callback
    ] = arguments;
    return mapObjects(fromObjects, function (getBusinessObjects) {

        var getBusinessObject = function () {

            var [
                object,
                superProperty,
                getSubProperty
            ] = arguments;
            return getBusinessObjectShallowCopy_To(...[
                object,
                superProperty,
                getSubProperty,
                getProperty,
                getBusinessObjects,
                getBusinessObject
            ]);
        };
        return getBusinessObject;
    }, callback);
};

BusinessOperationDelegate.prototype.mapBetweenObjects = function () {

    var [
        [fromObjects, inputObjects],
        getProperty,
        callback
    ] = arguments;
    return mapObjects(fromObjects, function () {

        var [_, getIdentificationAttributes] = arguments;
        var getBusinessObject = function () {

            var [
                object,
                superProperty,
                getSubProperty
            ] = arguments;
            return getBusinessObjectShallowCopy_Between(...[
                object,
                superProperty,
                getSubProperty,
                getProperty,
                inputObjects,
                getIdentificationAttributes
            ]);
        };
        return getBusinessObject;
    }, callback);
};

module.exports.BusinessOperationDelegate = BusinessOperationDelegate;
