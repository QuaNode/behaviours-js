/*jslint node: true */
"use strict";

var ModelEntities = {};

module.exports.ModelEntity = function (options) {

    var self = this;
    var {
        constructor,
        constructors,
        attributes,
        features,
        query,
        aggregate
    } = options;
    var invalidOptions = typeof constructor !== "function";
    if (invalidOptions) {

        invalidOptions = typeof constructors !== "object";
        if (!invalidOptions) {

            let databases = Object.keys(constructors);
            invalidOptions |= databases.length === 0;
            if (!invalidOptions) {

                invalidOptions |= databases.some(function (key) {

                    return typeof constructors[key] !== "function";
                });
            }
        }
    }
    invalidOptions |= typeof attributes !== "object";
    if (features !== undefined) {

        invalidOptions |= typeof features !== "object";
    }
    if (aggregate !== undefined) {

        invalidOptions |= !Array.isArray(aggregate);
    }
    if (query !== undefined) {

        invalidOptions |= !Array.isArray(query);
    }
    if (invalidOptions) throw new Error("Invalid entity options");
    self.getObjectConstructor = function (database) {

        if (constructor) return constructor;
        let databases = Object.keys(constructors);
        if (databases.length == 1) return constructors[databases[0]];
        return constructors[database];
    };
    self.getObjectAttributes = () => attributes;
    self.getObjectFeatures = () => features;
    self.getObjectQuery = () => query;
    self.getObjectAggregate = () => aggregate;
};

module.exports.ModelEntity.registerModelEntity = function (options) {

    var {
        entity,
        entityName
    } = options;
    var validEntity = typeof entity === "function";
    var validName = typeof entityName === "string";
    if (validName) validName &= entityName.length > 0;
    if (validName && ModelEntities[entityName]) {

        throw new Error("Entity with same name already" +
            " registered: " + entityName);
    }
    if (validEntity && validName) {

        ModelEntities[entityName] = entity;
    } else throw new Error("Invalid entity parameters");
};

module.exports.ModelEntity.createModelEntity = function () {

    var [entityName, options] = arguments;
    if (ModelEntities[entityName]) {

        return new ModelEntities[entityName](options);
    }
};

module.exports.ModelEntity.getModelEntity = function (entityName) {

    return ModelEntities[entityName];
};
