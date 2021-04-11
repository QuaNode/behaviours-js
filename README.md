# behaviours-js
Behaviours framework written in JavaScript implementing [Behaviour-first-design](https://github.com/ahmedragab/Behaviour-first-design/wiki) and queue-map architecture.

## Installation

```
npm install behaviours-js
```

## Usage

```js
var ( BusinessController, BehaviourConstructor, ModelEntity, QueryExpression, ComparisonOperators } = require('behaviours');
var define = require('define-js');

// 1: define data controller
var ModelController = function () {
    self.removeObjects = function (queryExprs, entity, callback) {
        // do remove
    };
    self.newObjects = function (objsAttributes, entity, callback) {
        // do add new
    };
    self.getObjects = function (queryExprs, entity, callback) {
        // do select
    };
    self.save = function (callback, oldSession) {
        // do select
    };
};
ModelController.defineEntity = function (name, attributes) {
    // define entity
    return entity;
};
ModelController.prototype.constructor = ModelController;

// 2: define data entity
var Schema = {
  id: Number
}
var EntityConstructor = ModelController.defineEntity('entity name', Schema);
var Entity = define(function (init) {
    return function (features, query, aggregate) {
        init.apply(this, [{
            constructor: EntityConstructor,
            attributes: Schema
        }]).self();
    };
}).extend(ModelEntity).parameters({
    constructor: EntityConstructor,
    attributes: Schema
});
ModelEntity.registerModelEntity({
    entity: Entity,
    entityName: 'entity name'
});

// 3: define behaviour
var MyBehaviour = define(function (init) {
    return function () {
        var self = init.apply(this, arguments).self();
        var goal = null;
        var error = null;
        self.begin('ErrorHandling', function (key, businessController, operation) {
            operation.error(function (e) {
                return error || e;
            }).apply();
        });
        // validate self.inputObjects
        self.begin('Query', function (key, businessController, operation) {
            operation.query([new QueryExpression({
                fieldName: 'id',
                comparisonOperator: ComparisonOperators.EQUAL,
                fieldValue: self.inputObjects.id
            })]).entity(new Entity({
                readonly: true
            })).callback(function (models, e) {
                if (e) error = e;
                goal = models;
            }).apply();
        }).begin('ModelObjectMapping', function (key, businessController, operation) {
            operation.callback(function (output) {
                output.goal = goal;
            }).apply();
        });
    };
}).extend(BehaviourConstructor).parameters({
    type: 1
});
var behaviour = new MyBehaviour({
    name: 'behaviour name',
    type: 1, // 0: the behaviour will read data from external service
             // 1: it will read data from internal db
             // 2: it will write data to external service
             // 3: it will write data to internal db
    priority: 0,
    inputObjects: {} // an object of inputs
});

// 3: execute the behaviour
var businessController = new BusinessController({
    modelController: new ModelController(),
    ModelEntity: ModelEntity,
    QueryExpression: QueryExpression,
    ComparisonOperators: ComparisonOperators,
    operationCallback: function (data, operationType, operationSubtype) {
      // logic to be executed on all behaviours per operation
    }
});
var cancel = businessController.runBehaviour(behaviour, function (property, superProperty) {
  // data mapping logic for output
}, function(output, error) {
  // the output / the goal of behaviour 
);

// call cancel() to cancel execution

```

