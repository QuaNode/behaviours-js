/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

var parse = require('parseparams');

var watch = function (operation, data, index, continṵe, watchers) {

    if (watchers[operation] && index > -1 && index < watchers[operation].length) {

        if (parse(watchers[operation][index])[1] === 'continṵe')
            watchers[operation][index](data, function () {

                watch(operation, data, index + 1, continṵe, watchers);
            }, function () {

                continṵe();
            }); else {

            for (var i = index; i < watchers[operation].length; i++) {

                watchers[operation][i](data);
            }
            continṵe();
        }
    } else {

        continṵe();
    }
};

var getServiceContinue = function (delegate) {

    var that = this;
    return function () {

        delegate(typeof that.data.parameters === 'function' ? that.data.parameters : function () {

            return that.data.parameters;
        }, typeof that.data.service === 'function' ? that.data.service : function () {

            return that.data.service;
        }, function () {

            if (typeof that.data.callback === 'function') that.data.callback.apply(null, arguments);
            return that.data.append;
        });
    };
};

var getModelContinue = function (delegate) {

    var that = this;
    return function () {

        delegate(typeof that.data.wrapper === 'function' ? that.data.wrapper : function () {

            return that.data.wrapper;
        }, typeof that.data.entity === 'function' ? that.data.entity : function () {

            return that.data.entity;
        }, function () {

            if (typeof that.data.callback === 'function') that.data.callback.apply(null, arguments);
            return that.data.append;
        });
    };
};

var getServiceMappingContinue = function (delegate) {

    var that = this;
    return function () {

        delegate(function () {

            if (typeof that.data.callback === 'function') that.data.callback.apply(null, arguments);
        });
    };
};

var getModelMappingContinue = function (delegate) {

    var that = this;
    return function () {

        delegate(function () {

            if (typeof that.data.identifiers === 'function')
                return that.data.identifiers.apply(null, arguments) || [];
            return that.data.identifiers || [];
        }, function () {

            if (typeof that.data.callback === 'function') that.data.callback.apply(null, arguments);
        });
    };
};

var getErrorHandlingContinue = function (delegate) {

    var that = this;
    return function () {

        delegate(typeof that.data.error === 'function' ? that.data.error : function () {

            return that.data.error;
        });
    };
};

var OperationDelegateExecutive = function (options) {

    var self = this;
    var watchers = options.watchers;
    self.executeServiceOperation = function (serviceOperation, delegate, parameters, service, callback, append) {

        var that = this;
        that.data.parameters = parameters || that.data.parameters;
        that.data.service = service || that.data.service;
        that.data.callback = callback || that.data.callback;
        that.data.append = typeof parameters === 'boolean' ? parameters :
            typeof append === 'boolean' ? append : that.data.append;
        var serviceContinue = getServiceContinue.apply(that, [delegate]);
        watch(serviceOperation, that.data, 0, serviceContinue, watchers);
    };
    self.executeModelOperation = function (modelOperation, delegate, queryOrObjects, entity, callback, append) {

        var that = this;
        that.data.wrapper = that.data.objects || {

            getObjectQuery: !Array.isArray(queryOrObjects) && typeof that.data.query === 'function' ?
                that.data.query : function () {

                    return queryOrObjects || that.data.query;
                },
            getObjectAggregate:
                typeof that.data.aggregate === 'function' ? that.data.aggregate : function () {

                    return that.data.aggregate;
                },
            getObjectFilter:
                typeof that.data.filter === 'function' ? that.data.filter : function () {

                    return that.data.filter;
                }
        };
        that.data.entity = entity || that.data.entity;
        that.data.callback = callback || that.data.callback;
        that.data.append = typeof queryOrObjects === 'boolean' ? queryOrObjects :
            typeof append === 'boolean' ? append : that.data.append;
        var modelContinue = getModelContinue.apply(that, [delegate]);
        watch(modelOperation, that.data, 0, modelContinue, watchers);
    };
    self.executeServiceMappingOperation = function (businessOperation, delegate, callback) {

        var that = this;
        that.data.callback = callback || that.data.callback;
        var serviceMappingContinue = getServiceMappingContinue.apply(that, [delegate]);
        watch(businessOperation, that.data, 0, serviceMappingContinue, watchers);
    };
    self.executeModelMappingOperation = function (businessOperation, delegate, identifiers, callback) {

        var that = this;
        that.data.identifiers = identifiers || that.data.identifiers;
        that.data.callback = callback || that.data.callback;
        var modelMappingContinue = getModelMappingContinue.apply(that, [delegate]);
        watch(businessOperation, that.data, 0, modelMappingContinue, watchers);
    };
    self.executeErrorHandlingOperation = function (businessOperation, delegate, error) {

        var that = this;
        that.data.error = error || that.data.error;
        var errorHandlingContinue = getErrorHandlingContinue.apply(that, [delegate]);
        watch(businessOperation, that.data, 0, errorHandlingContinue, watchers);
    };
};

module.exports.OperationDelegateExecutive = OperationDelegateExecutive;
