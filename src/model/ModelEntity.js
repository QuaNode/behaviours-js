/*jslint node: true */
'use strict';

var ModelEntities = {};

module.exports.ModelEntity = function (options) {

    var self = this;
    var constructor = options.constructor;
    var attributes = options.attributes;
    var features = options.features;
    var query = options.query;
    var aggregate = options.aggregate;
    if (typeof constructor !== 'function' || typeof attributes !== 'object' ||
        (features !== undefined && typeof attributes !== 'object') ||
        (aggregate !== undefined && !Array.isArray(aggregate)) ||
        (query !== undefined && !Array.isArray(query)))
        throw new Error('Invalid entity parameters');
    self.getObjectConstructor = function () {

        return constructor;
    };
    self.getObjectAttributes = function () {

        return attributes;
    };
    self.getObjectFeatures = function () {

        return features;
    };
    self.getObjectQuery = function () {

        return query;
    };
    self.getObjectAggregate = function () {

        return aggregate;
    };
};

module.exports.ModelEntity.registerModelEntity = function (options) {

    var entity = options.entity;
    var entityName = options.entityName;
    var validEntity = typeof entity === 'function';
    var validEntityName = typeof entityName === 'string' && entityName.length > 0;
    if (validEntityName && ModelEntities[entityName])
        throw new Error('Entity with same name already registered: ' + entityName);
    if (validEntity && validEntityName) ModelEntities[entityName] = entity;
    else throw new Error('Invalid entity parameters');
};

module.exports.ModelEntity.createModelEntity = function (entityName, options) {

    return ModelEntities[entityName] && new ModelEntities[entityName](options);
};

module.exports.ModelEntity.getModelEntity = function (entityName) {

    return ModelEntities[entityName];
};
