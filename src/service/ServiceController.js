/*jslint node: true */
"use strict";

var { ServiceEndPoint } = require("./ServiceEndPoint.js");
var { ServiceParameter } = require("./ServiceParameter.js");
var { ServiceParameterType } = require("./ServiceParameter.js");
var { ServiceObjectMapping } = require("./ServiceObjectMapping.js");

var encodeServiceParameters = function () {

    var [
        serviceParameters,
        request
    ] = arguments;
    request.method = "GET";
    for (var i = 0, q = 0; i < serviceParameters.length; i++) {

        var type = serviceParameters[i].type();
        var key = serviceParameters[i].key();
        var value = serviceParameters[i].value();
        switch (type) {

            case ServiceParameterType.BODY:
                if (!request.body) request.body = {};
                request.body[key] = value;
                break;
            case ServiceParameterType.HEADER:
                if (!request.headers) request.headers = {};
                request.headers[key] = value;
                break;
            case ServiceParameterType.METHOD:
                request.method = value;
                break;
            case ServiceParameterType.URIQUERY:
                if (q++ > 0) request.path += "&";
                else request.path += "?";
                request.path += key;
                request.path += "=";
                request.path += encodeURIComponent(value);
                break;
            case ServiceParameterType.URIPARAMETER:
                request.path = request.path.replace(...[
                    ":" + key,
                    encodeURIComponent(value)
                ]);
                break;
            default:
                throw new Error("Invalid service paramater");
        }
    }
};

var getQueryByIDCallback = function () {

    var [
        index,
        serviceObjects,
        objectMetadata,
        callback,
        options,
        serviceObjectMapping,
        modelEntity
    ] = arguments;
    var {
        addObjects,
        save,
        objectAttributesMethod
    } = options;
    return (modelObjects) => serviceObjectMapping.mapServiceObject(...[
        serviceObjects[index],
        objectMetadata,
        modelEntity &&
        modelEntity[objectAttributesMethod](),
        Array.isArray(modelObjects) ? modelObjects : [],
        function (modelObject, op) {

            var next = function () {

                var continuing = (index + 1) < serviceObjects.length;
                var saving = index % 1000 === 0;
                saving |= index === (serviceObjects.length - 1);
                if (modelEntity && saving) {

                    var validSave = typeof save === "function";
                    if (validSave) save(function () {

                        if (continuing) queryByID(...[
                            index + 1,
                            serviceObjects,
                            objectMetadata,
                            callback,
                            options,
                            serviceObjectMapping,
                            modelEntity
                        ]); else callback();
                    }); else throw new Error("Invalid save function");
                } else if (continuing) queryByID(...[
                    index + 1,
                    serviceObjects,
                    objectMetadata,
                    callback,
                    options,
                    serviceObjectMapping,
                    modelEntity
                ]); else callback();
            };
            if (modelEntity && op === "insert") {

                var adding = typeof addObjects === "function";
                if (adding) addObjects(...[
                    [modelObject],
                    modelEntity,
                    () => next()
                ]); else throw new Error("Invalid add objects function");
            } else next();
        }
    ]);
};

var queryByID = function () {

    var [
        index,
        serviceObjects,
        objectMetadata,
        callback,
        options,
        serviceObjectMapping,
        modelEntity
    ] = arguments;
    var {
        getObjectsByID,
        objectAttributesMethod
    } = options;
    setTimeout(function () {

        var serviceObject = serviceObjects[index];
        var idServiceValue = serviceObjectMapping.getIDServiceValue(...[
            serviceObject,
            objectMetadata,
            modelEntity &&
            modelEntity[objectAttributesMethod]()
        ]);
        if (idServiceValue) {

            var identifying = typeof getObjectsByID === "function";
            if (identifying) getObjectsByID(...[
                objectMetadata.id,
                idServiceValue,
                modelEntity,
                getQueryByIDCallback(...[
                    index,
                    serviceObjects,
                    objectMetadata,
                    callback,
                    options,
                    serviceObjectMapping,
                    modelEntity
                ])
            ]); else getQueryByIDCallback(...[
                index,
                serviceObjects,
                objectMetadata,
                callback,
                options,
                serviceObjectMapping,
                modelEntity
            ])();
        } else getQueryByIDCallback(...[
            index,
            serviceObjects,
            objectMetadata,
            callback,
            options,
            serviceObjectMapping,
            modelEntity
        ])();
    }, 0);
};

var mapAndSync = function () {

    var [
        serviceObjects,
        objectMetadata,
        callback,
        options
    ] = arguments;
    var serviceObjectMapping = new ServiceObjectMapping();
    var {
        createModelEntity,
        objectAttributesMethod
    } = options;
    var mapping_syncing = !!serviceObjects;
    mapping_syncing &= !!objectMetadata;
    if (mapping_syncing) {

        mapping_syncing &= !!objectMetadata.model;
    }
    if (mapping_syncing) {

        mapping_syncing &= Array.isArray(objectMetadata.attributes);
    }
    if (mapping_syncing) {

        var modelEntity = null;
        var many = objectMetadata.model.length > 0;
        var creating = typeof createModelEntity === "function";
        if (many && creating) modelEntity = createModelEntity(...[
            objectMetadata.model
        ]);
        if (many) {

            if (!creating) {

                throw new Error("Invalid create entity function");
            } else if (!modelEntity) {

                throw new Error("Invalid entity name");
            } else {

                var invalidMethod = typeof objectAttributesMethod !== "string";
                if (!invalidMethod) {

                    invalidMethod |= !modelEntity[objectAttributesMethod];
                }
                if (invalidMethod) {

                    throw new Error("Invalid object attributes method name");
                }
            }
        }
        var one = !Array.isArray(serviceObjects);
        if (one) serviceObjects = [serviceObjects];
        queryByID(...[
            0,
            serviceObjects,
            objectMetadata,
            callback,
            options,
            serviceObjectMapping,
            modelEntity
        ]);
    } else callback();
};

var reflectOnModel = function () {

    var [
        response,
        objectMetadata,
        callback,
        options
    ] = arguments;
    var serviceObjects = null;
    if (Array.isArray(response)) serviceObjects = response;
    else {

        var extracting = typeof response === "object";
        extracting &= !!objectMetadata;
        if (extracting) {

            extracting &= typeof objectMetadata.name === "string";
        }
        if (extracting) {

            var path = objectMetadata.name;
            if (path.length === 0) serviceObjects = [response];
            else {

                var components = path.split(".");
                var res = response;
                for (var i = 0; i < components.length && res; i++) {

                    res = res[components[i]];
                }
                if (res) serviceObjects = res;
            }
        }
    }
    mapAndSync(...[
        serviceObjects,
        objectMetadata,
        () => callback(serviceObjects),
        options
    ]);
};

var createRequest = function () {

    var [
        servicePrameters,
        serviceEndPoint,
        type,
        callback,
        serviceAdapter,
        options
    ] = arguments;
    var one = !Array.isArray(servicePrameters);
    if (one || servicePrameters.some(function () {

        var [servicePrameter] = arguments;
        return !(servicePrameter instanceof ServiceParameter);
    }))
        throw new Error("Invalid service paramaters");
    if (!(serviceEndPoint instanceof ServiceEndPoint)) {

        throw new Error("Invalid service endpoint");
    }
    var request = {

        type: type,
        path: serviceEndPoint.path,
        context: serviceEndPoint.context
    };
    encodeServiceParameters(...[
        servicePrameters,
        request
    ]);
    if (!serviceEndPoint.consumableByAdapter(...[
        serviceAdapter
    ])) serviceAdapter = serviceEndPoint.adapter();
    serviceAdapter.sendRequest(...[
        request,
        (response, error) => reflectOnModel(...[
            response,
            serviceEndPoint.responseMetadata,
            function (serviceObjects) {

                var callingBack = typeof callback === "function";
                if (callingBack) callback(...[
                    serviceObjects ||
                    response,
                    error
                ]);
            },
            options
        ])
    ]);
    return serviceAdapter;
};

module.exports.ServiceController = function (options) {

    var self = this;
    var serviceAdapter = null;
    self.authenticate = function () {

        var [
            servicePrameters,
            serviceEndPoint,
            callback
        ] = arguments;
        serviceAdapter = createRequest(...[
            servicePrameters,
            serviceEndPoint,
            "authentication",
            callback,
            serviceAdapter,
            options
        ]);
    };
    self.request = function () {

        var [
            servicePrameters,
            serviceEndPoint,
            callback
        ] = arguments;
        serviceAdapter = createRequest(...[
            servicePrameters,
            serviceEndPoint,
            "request",
            callback,
            serviceAdapter,
            options
        ]);
    };
};
