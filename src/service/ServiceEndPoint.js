/*jslint node: true */
"use strict";

var { ServiceAdapter } = require("./ServiceAdapter.js");
var { ServiceObjectMetadata } = require("./ServiceResponseMetadata.js");

module.exports.ServiceEndPoint = function (options) {

    var self = this;
    var {
        baseURI,
        Adapter,
        responseMetadata
    } = options;
    if (typeof baseURI !== "string") {

        throw new Error("Invalid URI");
    }
    var invalidAdapter = typeof Adapter !== "function";
    if (!invalidAdapter) {

        invalidAdapter |= !(Adapter.prototype instanceof ServiceAdapter);
    }
    if (invalidAdapter) {

        throw new Error("Invalid service provider");
    }
    var invalidMetadata = !!responseMetadata;
    if (invalidMetadata) {

        invalidMetadata &= !(responseMetadata instanceof ServiceObjectMetadata);
    }
    if (invalidMetadata) {

        throw new Error("Invalid response metadata");
    }
    self.responseMetadata = responseMetadata;
    self.adapter = (param) => new Adapter(baseURI, param);
    self.consumableByAdapter = function (serviceAdapter) {

        if (serviceAdapter instanceof Adapter) {

            return serviceAdapter.getBaseURI() === baseURI;
        }
    };
};
