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

    BODY: "body",
    HEADER: "header",
    METHOD: "method",
    URIQUERY: "uriquery",
    URIPARAMETER: "uriparameter"
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

                case ServiceParameterType.BODY:
                    type = typeParameter;
                    break;
                case ServiceParameterType.HEADER:
                    type = typeParameter;
                    break;
                case ServiceParameterType.METHOD:
                    type = typeParameter;
                    break;
                case ServiceParameterType.URIQUERY:
                    type = typeParameter;
                    break;
                case ServiceParameterType.URIPARAMETER:
                    type = typeParameter;
                    break;
                default:
                    throw new Error("Invalid service parameter type");
            }
        }
    };
    self.setType(type);
};

module.exports.ServiceParameterKey = ServiceParameterKey;

module.exports.ServiceParameterType = ServiceParameterType;
