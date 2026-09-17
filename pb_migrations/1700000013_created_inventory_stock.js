/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_1406054367",
        "help": "",
        "hidden": false,
        "id": "relation521872670",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "item",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2536409462",
        "help": "",
        "hidden": false,
        "id": "relation3146128159",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "branch",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "help": "",
        "hidden": false,
        "id": "number2683508278",
        "max": null,
        "min": null,
        "name": "quantity",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2301119865",
        "help": "",
        "hidden": false,
        "id": "relation385774305",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "updated_by",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      }
    ],
    "id": "pbc_4192604402",
    "indexes": [
      "CREATE UNIQUE INDEX idx_inventory_stock_item_branch ON inventory_stock (item, branch)"
    ],
    "listRule": "@request.auth.id != \"\"",
    "name": "inventory_stock",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"admin\" || branch = @request.auth.staff.branch",
    "viewRule": "@request.auth.id != \"\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4192604402");

  return app.delete(collection);
})
