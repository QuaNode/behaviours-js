/*jslint node: true */
"use strict";

var ServiceParameterKey = {

    USERNAME: "username",
    PASSWORD: "password",
    ACCEPT: "Accept",
    RESOURCE: "resource",
    REQUEST_DIGEST: "X-RequestDigest",
    META_DATA: "__metadata",
    CONTENT_TYPE: "Content-Type",
    IF_MATCH: "IF-MATCH",
    X_HTTP_METHOD: "X-Http-Method"
};

var ServiceParameterType = {

    DATA: "data",
    OPTION: "option",
    BODY: "body",
    HEADER: "header",
    METHOD: "method",
    URIQUERY: "uriquery",
    URIPARAMETER: "uriparameter",
    OTHER: "other"
};

module.exports.ServiceParameter = function (options) {

    var self = this;
    var {
        key,
        value,
        type
    } = options;
    self.key = () => key;
    self.value = () => value;
    self.type = () => type;
    self.setKey = (keyParameter) => key = keyParameter;
    self.setValue = (valueParameter) => value = valueParameter;
    self.setType = function (typeParameter) {

        if (type !== typeParameter) {

            switch (typeParameter) {

                case ServiceParameterType.DATA:
                case ServiceParameterType.OPTION:
                case ServiceParameterType.BODY:
                case ServiceParameterType.HEADER:
                case ServiceParameterType.METHOD:
                case ServiceParameterType.URIQUERY:
                case ServiceParameterType.URIPARAMETER:
                case ServiceParameterType.OTHER:
                    type = typeParameter;
                    break;
                default:
                    throw new Error("Invalid service parameter type");
            }
        }
    };
    if (type) self.setType(type); else {

        type = ServiceParameterType.DATA;
    }
};

module.exports.ServiceParameterKey = ServiceParameterKey;

module.exports.ServiceParameterType = ServiceParameterType;
