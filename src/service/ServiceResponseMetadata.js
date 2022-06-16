/*jslint node: true */
"use strict";

var ServiceAttributeMetadata;

var ServiceObjectMetadata = module.exports.ServiceObjectMetadata = function (options) {

    var self = this;
    var {
        modelAttributes,
        serviceAttributes,
        model,
        name,
        attributesKeyName,
        attributesValueName,
        id,
        storeID
    } = options;
    if (typeof model === "string") self.model = model;
    if (typeof name === "string") self.name = name;
    if (typeof attributesKeyName === "string") {

        self.attributesKeyName = attributesKeyName;
    }
    if (typeof attributesValueName === "string") {

        self.attributesValueName = attributesValueName;
    }
    var many = Array.isArray(modelAttributes);
    many &= Array.isArray(serviceAttributes);
    if (many) {

        if (modelAttributes.length !== serviceAttributes.length) {

            throw new Error("Invalid attributes count");
        }
        self.attributes = [];
        for (var i = 0; i < modelAttributes.length; i++) {

            var attribute = new ServiceAttributeMetadata({

                model: modelAttributes[i],
                name: serviceAttributes[i],
            });
            self.attributes.push(attribute);
        }
    }
    if (typeof id === "string") self.id = id;
    self.storeID = storeID;
};

module.exports.ServiceAttributeMetadata = ServiceAttributeMetadata = function (options) {

    var self = this;
    var {
        model,
        name,
        getValue,
        metadata
    } = options;
    if (typeof model === "string") self.model = model;
    if (typeof name === "string") self.name = name;
    if (getValue) {

        if (typeof getValue === "function") self.getValue = getValue;
        else throw new Error("Invalid service attribute value function");
    }
    if (metadata) {

        if (metadata instanceof ServiceObjectMetadata) {

            self.metadata = metadata;
        } else {

            throw new Error("Invalid service attribute object metadata");
        }
    }
};
