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
        "collectionId": "pbc_2536409462",
        "help": "",
        "hidden": false,
        "id": "relation917987535",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "from_branch",
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
        "id": "relation2639533954",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "to_branch",
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
      },
      {
        "help": "",
        "hidden": false,
        "id": "select2063623452",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "draft",
          "dispatched",
          "received"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "date1901059676",
        "max": "",
        "min": "",
        "name": "dispatched_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "help": "",
        "hidden": false,
        "id": "date1833926553",
        "max": "",
        "min": "",
        "name": "received_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      }
    ],
    "id": "pbc_2585311909",
    "indexes": [],
    "listRule": "@request.auth.id != \"\"",
    "name": "transit_sheets",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"admin\" || from_branch = @request.auth.staff.branch || to_branch = @request.auth.staff.branch",
    "viewRule": "@request.auth.id != \"\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2585311909");

  return app.delete(collection);
})
