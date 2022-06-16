/*jslint node: true */
/*jshint esversion: 6 */
"use strict";

var copy = require("shallow-copy");
var { BusinessBehaviourCore } = require("./BusinessBehaviourCore.js");
var { BusinessLanguage } = require("./BusinessLanguage.js");
var define = require("define-js");

var BusinessBehaviourType = {

    ONLINESYNC: 0,
    OFFLINESYNC: 1,
    ONLINEACTION: 2,
    OFFLINEACTION: 3
};

var BusinessBehaviour = module.exports.BusinessBehaviour = define(function (init) {

    return function (options) {

        if (typeof options !== "object") {

            throw new Error("Invalid behaviour parameters");
        }
        var languageParameters = {

            middlewares: {},
            delegates: {},
            watchers: {},
            useConditions: {},
            beginConditions: {},
        };
        var self = init.apply(this, [languageParameters]).self();
        var businessBehaviourCore = new BusinessBehaviourCore(...[
            languageParameters
        ]);
        var type = null;
        self.priority = options.priority;
        self.name = options.name;
        self.inputObjects = options.inputObjects;
        self.state = {};
        self.searchText = options.searchText;
        self.mandatoryBehaviour = options.mandatoryBehaviour;
        self.getType = () => type;
        self.setType = function (typeParameter) {

            if (typeParameter !== undefined) {

                for (var behaviourType in BusinessBehaviourType) {

                    if (BusinessBehaviourType.hasOwnProperty(...[
                        behaviourType
                    ])) {

                        var typë = BusinessBehaviourType[behaviourType];
                        if (typë === typeParameter) {

                            type = typeParameter;
                            return;
                        }
                    }
                }
            }
            throw new Error("Invalid behaviour type");
        };
        self.setType(options.type);
        self.prepareOperations = function () {

            var [
                serviceOperations,
                modelOperations,
                businessOperations
            ] = arguments;
            self.state.serviceOperations = copy(serviceOperations);
            self.state.modelOperations = copy(modelOperations);
            self.state.businessOperations = copy(businessOperations);
            Object.keys(languageParameters.delegates).every(function () {

                var [delegate] = arguments;
                if ([
                    ...businessOperations,
                    ...serviceOperations,
                    ...modelOperations
                ].indexOf(delegate) === -1) {

                    throw new Error("Invalid operation name: " + delegate);
                }
            });
        };
        var {
            beginServiceOperation,
            beginModelOperation,
            beginBusinessOperation
        } = businessBehaviourCore;
        self.beginServiceOperation = function () {

            return beginServiceOperation.apply(...[
                self,
                arguments
            ]);
        };
        self.beginModelOperation = function () {

            return beginModelOperation.apply(...[
                self,
                arguments
            ]);
        };
        self.beginBusinessOperation = function () {

            return beginBusinessOperation.apply(...[
                self,
                arguments
            ]);
        };
    };
}).extend(BusinessLanguage).defaults({});

BusinessBehaviour.prototype.hasMandatoryBehaviour = function () {

    var self = this;
    var [behaviour] = arguments;
    var mandatory = self.mandatoryBehaviour === behaviour;
    if (behaviour && mandatory) return true;
    else if (self.mandatoryBehaviour instanceof BusinessBehaviour) {

        return self.mandatoryBehaviour.hasMandatoryBehaviour(...[
            behaviour
        ]);
    } else return false;
};

BusinessBehaviour.prototype.isEqualToBehaviour = (behaviour) => this === behaviour;

module.exports.BusinessBehaviourType = BusinessBehaviourType;
