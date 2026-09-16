/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.role = \"admin\" || branch = @request.auth.staff.branch",
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
        "help": "",
        "hidden": false,
        "id": "select1490097517",
        "maxSelect": 1,
        "name": "print_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "custom_text",
          "visiting_card",
          "location_card"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "json4274335913",
        "maxSize": 0,
        "name": "content",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
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
        "cascadeDelete": false,
        "collectionId": "pbc_2301119865",
        "help": "",
        "hidden": false,
        "id": "relation1114567570",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "staff",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      }
    ],
    "id": "pbc_1649620079",
    "indexes": [],
    "listRule": "@request.auth.id != \"\"",
    "name": "custom_prints",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"admin\" || branch = @request.auth.staff.branch",
    "viewRule": "@request.auth.id != \"\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1649620079");

  return app.delete(collection);
})
