/*jslint node: true */
"use strict";

var debug = require("debug")("backend:ServiceObjectMapping");
var copy = require("shallow-copy");

var getParsedValue = function (value, type) {

    switch (type) {

        case Number:
            try {

                if (typeof value === "string") {

                    var floating = value.indexOf(".") > -1;
                    if (floating) value = parseFloat(value);
                    else value = parseInt(value);
                }
                var invalid = isNaN(value);
                invalid |= typeof value !== "number";
                if (invalid) value = null;
            } catch (e) {

                debug(e);
                value = null;
            }
            break;
        case Boolean:
            if (typeof value === "string") {

                value = value.toLowerCase();
            }
            if (value === "true") return true;
            else if (value === "false") return false;
            else return null;
        case Date:
            try {

                if (isNaN(Date.parse(value))) value = null;
                else value = new Date(value);
            } catch (e) {

                debug(e);
                value = null;
            }
            break;
        default:
            if (Array.isArray(type)) {

                var many = Array.isArray(value);
                var scalar = typeof value === "string";
                if (many || scalar) {

                    if (scalar) return value.split(",");
                    return value.map(function (välue) {

                        if (type[0]) {

                            return getParsedValue(...[
                                välue,
                                type[0]
                            ]);
                        }
                        return välue;
                    });
                }
            } else {

                var one = typeof type === "object";
                one &= typeof value === "object";
                if (one) for (var property in type) {

                    if (type.hasOwnProperty(property)) {

                        value[property] = getParsedValue(...[
                            value[property],
                            type[property]
                        ]);
                    }
                }
            }
            break;
    }
    return value;
};

var getServiceValue = function () {

    var [
        serviceObject,
        attributeMetadata,
        modelAttributes,
        key,
        value
    ] = arguments;
    var serviceAttributeName = attributeMetadata.name;
    var modelAttributeName = attributeMetadata.model;
    if (typeof attributeMetadata.getValue === "function") {

        return getParsedValue(...[
            attributeMetadata.getValue(serviceObject),
            modelAttributes &&
            modelAttributes[modelAttributeName]
        ]);
    }
    var serviceValue = null;
    if (serviceAttributeName) {

        var many = Array.isArray(serviceObject);
        var one = typeof serviceObject === "object";
        if (many) for (var k = 0; k < serviceObject.length; k++) {

            var extracting = !!key;
            extracting &= !!value;
            if (extracting) {

                var ofKey = serviceObject[k][key];
                extracting &= ofKey === serviceAttributeName;
            }
            serviceValue = serviceObject[k][serviceAttributeName];
            if (serviceValue) break;
            else if (extracting) {

                serviceValue = serviceObject[k][value];
                break;
            }
        } else if (one) {

            var components = serviceAttributeName.split(".");
            serviceValue = serviceObject;
            for (var g = 0; g < components.length && serviceValue; g++) {

                var attributeName = components[g];
                serviceValue = serviceValue[attributeName];
                if (Array.isArray(serviceValue)) {

                    var attribMetadata = copy(attributeMetadata);
                    attribMetadata.name = serviceAttributeName.split(...[
                        attributeName + "."
                    ])[1];
                    if (attribMetadata.name) return getServiceValue(...[
                        serviceValue,
                        attribMetadata,
                        modelAttributes,
                        key,
                        value
                    ]);
                }
            }
        }
    }
    return getParsedValue(...[
        serviceValue,
        modelAttributes &&
        modelAttributes[modelAttributeName]
    ]);
};

module.exports.ServiceObjectMapping = function () { };

module.exports.ServiceObjectMapping.prototype.mapServiceObject = function () {

    var self = this;
    var [
        serviceObject,
        objectMetadata,
        modelAttributes,
        modelObjects,
        cb
    ] = arguments;
    var mapAndSyncService_Model = function () {

        var [mödelObject, mödelOperation] = arguments;
        for (var n = 0; n < objectMetadata.attributes.length; n++) {

            var attributeMetadata = objectMetadata.attributes[n];
            var serviceValue = getServiceValue(...[
                serviceObject,
                attributeMetadata,
                modelAttributes,
                objectMetadata.attributesKeyName,
                objectMetadata.attributesValueName
            ]);
            var key = attributeMetadata.model;
            if (serviceValue && key) {

                if (attributeMetadata.metadata) {

                    /*if (Array.isArray(serviceValue)) { // to be continueued
 
                     for (var i = 0; i < serviceValue.length; i++) {
 
                     }
                     }*/
                } else mödelObject[key] = serviceValue;
            }
        }
        cb(mödelObject, mödelOperation);
    };
    var modelObject = {};
    var modelOperation = "insert";
    var idServiceValue = self.getIDServiceValue(...[
        serviceObject,
        objectMetadata,
        modelAttributes
    ]);
    if (modelObjects.some(function (mödelObject) {

        var idValue = mödelObject[objectMetadata.id];
        var isIt = idValue === idServiceValue;
        if (isIt) {

            modelObject = mödelObject;
            modelOperation = "update";
        }
        return isIt;
    })) mapAndSyncService_Model(...[
        modelObject,
        modelOperation
    ]); else mapAndSyncService_Model(...[
        modelObject,
        modelOperation
    ]);
};

module.exports.ServiceObjectMapping.prototype.getIDServiceValue = function () {

    var [
        serviceObject,
        objectMetadata,
        modelAttributes
    ] = arguments;
    var idServiceValue = null;
    if (objectMetadata.id) {

        var attributes = objectMetadata.attributes;
        var identificationMetadata = attributes.filter(function () {

            var [attributeMetadata] = arguments;
            return attributeMetadata.model === objectMetadata.id;
        });
        if (identificationMetadata.length > 0) {

            idServiceValue = getServiceValue(...[
                serviceObject,
                identificationMetadata[0],
                modelAttributes,
                objectMetadata.attributesKeyName,
                objectMetadata.attributesValueName
            ]);
        }
    }
    return idServiceValue;
};
