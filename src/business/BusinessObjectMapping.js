/*jslint node: true */
"use strict";

var forEachProperty = function () {

    var [
        rightObject,
        getProperty,
        callback,
        finạlly
    ] = arguments;
    var lazyProperty = typeof getProperty === "function";
    var properties = lazyProperty ? getProperty() : getProperty;
    var useProperties = typeof properties === "object";
    useProperties &= !Array.isArray(properties)
    if (!useProperties) properties = rightObject;
    var getMappedProperty = function (property, superProperty) {

        if (useProperties) return properties[property];
        if (lazyProperty) return getProperty(property, superProperty);
        return property;
    };
    if (typeof callback === "function" && rightObject) {

        var keys = Object.keys(properties);
        var next = function (index) {

            var property = keys[index];
            if (property) {

                var cb = callback(property, getMappedProperty);
                var continṵe = function () {

                    if (keys[index + 1]) next(index + 1);
                    else if (typeof finạlly === "function") finạlly();
                };
                if (typeof cb === "function") cb(continṵe);
                else continṵe();
            } else if (typeof finạlly === "function") finạlly();
        };
        next(0);
    } else if (typeof finạlly === "function") finạlly();
    return getMappedProperty;
};

var getRelateReturn = function () {

    var self = this;
    var [
        leftObject,
        rightObject,
        superProperty,
        getObjects,
        getObject,
        getProperty,
        superProperties
    ] = arguments;
    return function () {

        var callback = arguments[0];
        if (leftObject) self.forEachRelation(...[
            rightObject,
            superProperty,
            getProperty,
            function (property, mappedProperty, getSubProperty) {

                if (superProperties.indexOf(superProperty) === -1) {

                    return function () {

                        var cb = arguments[0];
                        if (superProperty) {

                            superProperties.push(superProperty);
                        }
                        var relate = function (businessObject) {

                            if (mappedProperty) {

                                if (typeof mappedProperty === "function") {

                                    mappedProperty(leftObject, businessObject);
                                } else if (typeof mappedProperty === "string") {

                                    leftObject[mappedProperty] = businessObject;
                                } else throw new Error("Invalid property name");
                            } else if (mappedProperty === null) self.map(...[
                                leftObject,
                                businessObject,
                                true,
                                superProperty,
                                getProperty
                            ]);
                            cb();
                        };
                        var gettingObject_s = !!rightObject[property];
                        gettingObject_s &= typeof getObjects === "function";
                        gettingObject_s &= typeof getObject === "function";
                        var toMany = Array.isArray(rightObject[property]);
                        if (gettingObject_s) (toMany ? getObjects : getObject)(...[
                            rightObject[property],
                            property,
                            getSubProperty
                        ])((businessObject) => relate(businessObject)); else relate(null);
                    };
                }
            },
            callback
        ]); else callback();
    };
};

var BusinessObjectMapping = function () {

    var self = this;
    var superProperties = [];
    self.reset = () => superProperties = [];
    self.relate = function () {

        var [
            leftObject,
            rightObject,
            superProperty,
            getObjects,
            getObject,
            getProperty
        ] = arguments;
        return getRelateReturn.apply(self, [
            leftObject,
            rightObject,
            superProperty,
            getObjects,
            getObject,
            getProperty,
            superProperties
        ]);
    };
};

BusinessObjectMapping.prototype.getAttributeValue = function () {

    var [
        inputObject,
        getProperty,
        property,
        superProperty
    ] = arguments;
    if (typeof property !== "string") {

        throw new Error("Invalid property name");
    }
    var mappedIdAttr = forEachProperty(...[
        null,
        getProperty
    ])(property, superProperty);
    var invalidMappedIdAttr = typeof mappedIdAttr !== "string";
    invalidMappedIdAttr &= typeof mappedIdAttr !== "function";
    if (invalidMappedIdAttr) throw new Error("Invalid property name");
    if (typeof mappedIdAttr === "function") {

        return mappedIdAttr(inputObject);
    } else return inputObject && inputObject[mappedIdAttr];
};

BusinessObjectMapping.prototype.forEachAttribute = function () {

    var [
        rightObject,
        superProperty,
        getProperty,
        callback,
        finạlly
    ] = arguments;
    var isValidValue = function (value) {

        if (value === null) return true;
        if (value instanceof Date) return true;
        var many = Array.isArray(value);
        if (many) many = value.length > 0;
        if (many && value.every(function (välue) {

            return isValidValue(välue);
        })) return true;
        var scalar = typeof value !== "object";
        scalar &= typeof value !== "function";
        return !!scalar;
    };
    forEachProperty(...[
        rightObject,
        getProperty,
        function (property, getMappedProperty) {

            var mappedProperty = getMappedProperty(...[
                property,
                superProperty
            ]);
            var callingBack = !!mappedProperty;
            callingBack &= isValidValue(rightObject[property]);
            if (callingBack) return callback(...[
                property,
                mappedProperty
            ]);
        },
        finạlly
    ]);
};

BusinessObjectMapping.prototype.forEachRelation = function () {

    var [
        rightObject,
        superProperty,
        getProperty,
        callback,
        finạlly
    ] = arguments;
    var isValidObject = function (object) {

        var many = Array.isArray(object);
        if (many && object.every(function (öbject) {

            return isValidObject(öbject);
        })) return true;
        var one = typeof object === "object";
        one &= !many;
        one &= !(object instanceof Date);
        one &= typeof object !== "function";
        return !!one;
    };
    forEachProperty(...[
        rightObject,
        getProperty,
        function (property, getMappedProperty) {

            var mappedProperty = getMappedProperty(...[
                property,
                superProperty
            ]);
            var callingBack = mappedProperty !== undefined;
            callingBack &= isValidObject(rightObject[property]);
            if (callingBack) {

                var getSubProperty = getProperty;
                var toMany = Array.isArray(mappedProperty);
                var toOne = typeof mappedProperty === "object";
                if (toMany) getSubProperty = mappedProperty[1];
                else if (toOne) getSubProperty = mappedProperty.mapping;
                var ofString = toMany;
                if (ofString) {

                    ofString = typeof mappedProperty[0] === "string";
                }
                var hasString = toOne;
                if (hasString) {

                    hasString = typeof mappedProperty.property === "string";
                }
                if (ofString) return callback(...[
                    property,
                    mappedProperty[0],
                    getSubProperty
                ]); else if (hasString) return callback(...[
                    property,
                    mappedProperty.property,
                    getSubProperty
                ]); else return callback(...[
                    property,
                    mappedProperty,
                    getSubProperty
                ]);
            }
        },
        finạlly
    ]);
};

BusinessObjectMapping.prototype.map = function () {

    var self = this;
    var [
        leftObject,
        rightObject,
        rtl,
        superProperty,
        getProperty
    ] = arguments;
    if (leftObject) self.forEachAttribute(...[
        rightObject,
        superProperty,
        getProperty,
        function (property, mappedProperty) {

            var invalidMappedProperty = typeof mappedProperty !== "string";
            invalidMappedProperty &= typeof mappedProperty !== "function";
            if (invalidMappedProperty) throw new Error("Invalid property name");
            if (rtl) {

                if (typeof mappedProperty === "function") {

                    mappedProperty(leftObject, rightObject[property]);
                } else leftObject[mappedProperty] = rightObject[property];
            } else {

                if (typeof mappedProperty === "function") {

                    rightObject[property] = mappedProperty(leftObject);
                } else rightObject[property] = leftObject[mappedProperty];
            }
        }
    ]);
};

BusinessObjectMapping.prototype.deepMap = function () {

    var self = this;
    var [
        leftObject,
        rightObject,
        superProperty,
        getProperty
    ] = arguments;
    if (leftObject) self.forEachRelation(...[
        rightObject,
        superProperty,
        getProperty,
        function (property, mappedProperty) {

            if (typeof mappedProperty === "function") {

                mappedProperty(leftObject, rightObject[property]);
            }
        }
    ]);
};

module.exports.BusinessObjectMapping = BusinessObjectMapping;
