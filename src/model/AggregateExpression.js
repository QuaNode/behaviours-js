/*jslint node: true */
"use strict";

var ComputationOperators = null;

module.exports.setComputationOperators = function (co) {

    if (typeof co !== "object") {

        throw new Error("Invalid computation operators");
    }
    ComputationOperators = co;
    module.exports.ComputationOperators = ComputationOperators;
};

var isValidOperator = function (object, value) {

    for (var prop in object) {

        if (object.hasOwnProperty(prop)) {

            if (object[prop] === value) {

                return true;
            }
        }
    }
    return false;
};

var AggregateExpression = function (options) {

    var self = this;
    if (!ComputationOperators) {

        throw new Error("Set computation operators before" +
            " using aggregate expression");
    }
    var {
        fieldValue,
        fieldName,
        contextualLevels,
        computationOrder
    } = options;
    var one = !Array.isArray(fieldValue);
    if (one) fieldValue = [fieldValue];
    fieldValue.forEach(function (computationOperator) {

        var func = typeof computationOperator === "function";
        if (func && !isValidOperator(...[
            ComputationOperators,
            computationOperator
        ])) {

            throw new Error("The computation operator is not " +
                "one of the allowed computation operators," +
                " please use ComputationOperators");
        }
    });
    self.fieldName = fieldName;
    self.fieldValue = fieldValue;
    var many = Array.isArray(contextualLevels);
    if (many) self.contextualLevels = contextualLevels;
    else contextualLevels = [];
    self.computationOrder = computationOrder || 0;
};

module.exports.AggregateExpression = AggregateExpression;
