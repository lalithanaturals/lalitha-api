/// <reference path="../pb_data/types.d.ts" />
// Seeds real reference data (branches + the Stock-transfer inventory catalog)
// captured from the original static HTML apps, so a fresh install/demo has the
// same look as the old GitHub Pages sites instead of empty lists. Six duplicate
// item codes present in the original hardcoded catalog were dropped (see
// lalitha-backend/README.md) since `code` is unique per inventory_items row.
migrate((app) => {
  const branchesCollection = app.findCollectionByNameOrId("branches");
  const branches = [
    { name: "Gajuwaka", is_active: true },
    { name: "Kurmannapalem", is_active: true },
    { name: "Gajuwaka Packing", is_active: true },
    { name: "Kurmannapalem Packing", is_active: true },
  ];
  for (const b of branches) {
    const record = new Record(branchesCollection);
    record.set("name", b.name);
    record.set("is_active", b.is_active);
    app.save(record);
  }

  const categoriesCollection = app.findCollectionByNameOrId("inventory_categories");
  const categoryIds = {};
  const categoryNames = [
    "Groceries",
    "Karam",
    "Flours",
    "Millets",
    "Ravva",
    "Dry Fruits",
    "Spices",
  ];
  for (const name of categoryNames) {
    const record = new Record(categoriesCollection);
    record.set("name", name);
    app.save(record);
    categoryIds[name] = record.id;
  }

  const itemsCollection = app.findCollectionByNameOrId("inventory_items");
  const items = [
    { category: "Groceries", name: "White Peas", code: "1503", uom: "250g", min_limit: 10 },
    { category: "Groceries", name: "Samia", code: "1602", uom: "250g", min_limit: 10 },
    { category: "Groceries", name: "Small Sagubiyam", code: "1585", uom: "250g", min_limit: 10 },
    { category: "Groceries", name: "Sugar Candy", code: "1327", uom: "250g", min_limit: 10 },
    { category: "Groceries", name: "Soya Beans", code: "1325", uom: "250g", min_limit: 8 },
    { category: "Groceries", name: "Dry Chilli", code: "1584", uom: "100g", min_limit: 8 },
    { category: "Groceries", name: "Urad Dal", code: "1249", uom: "500g", min_limit: 10 },
    { category: "Groceries", name: "Urad Dal", code: "1278", uom: "1kg", min_limit: 8 },
    { category: "Groceries", name: "Groundnuts", code: "1498", uom: "500g", min_limit: 10 },
    { category: "Groceries", name: "Groundnuts", code: "1499", uom: "1kg", min_limit: 10 },
    { category: "Groceries", name: "Sugar", code: "1489", uom: "500g", min_limit: 10 },
    { category: "Groceries", name: "Sugar", code: "1252", uom: "1kg", min_limit: 10 },
    { category: "Groceries", name: "Skinned Urad Dal", code: "1496", uom: "500g", min_limit: 10 },
    { category: "Groceries", name: "Skinned Urad Dal", code: "1497", uom: "1kg", min_limit: 8 },
    { category: "Groceries", name: "Moong Dal", code: "1251", uom: "500g", min_limit: 10 },
    { category: "Groceries", name: "Moong Dal", code: "1250", uom: "1kg", min_limit: 8 },
    { category: "Groceries", name: "Chana Dal", code: "1245", uom: "500g", min_limit: 10 },
    { category: "Groceries", name: "Chana Dal", code: "1244", uom: "1kg", min_limit: 8 },
    { category: "Groceries", name: "Toor Dal", code: "1468", uom: "500g", min_limit: 10 },
    { category: "Groceries", name: "Toor Dal", code: "1243", uom: "1kg", min_limit: 8 },
    { category: "Groceries", name: "Ragi Whole", code: "1791", uom: "500g", min_limit: 10 },
    { category: "Groceries", name: "Ragi Whole", code: "1256", uom: "1kg", min_limit: 10 },
    { category: "Groceries", name: "Bajra Whole", code: "1262", uom: "500g", min_limit: 8 },
    { category: "Groceries", name: "Bajra Whole", code: "1261", uom: "1kg", min_limit: 8 },
    { category: "Groceries", name: "White Jowar Whole", code: "1258", uom: "500g", min_limit: 10 },
    { category: "Groceries", name: "White Jowar Whole", code: "1257", uom: "1kg", min_limit: 8 },
    { category: "Groceries", name: "Yellow Jowar Whole", code: "1260", uom: "500g", min_limit: 10 },
    { category: "Groceries", name: "Yellow Jowar Whole", code: "1259", uom: "1kg", min_limit: 8 },
    { category: "Groceries", name: "Roasted Bengal Gram", code: "1247", uom: "500g", min_limit: 8 },
    { category: "Groceries", name: "Roasted Bengal Gram", code: "1246", uom: "1kg", min_limit: 8 },
    { category: "Groceries", name: "Wheat Whole", code: "1709", uom: "500g", min_limit: 8 },
    { category: "Groceries", name: "Wheat Whole", code: "1263", uom: "1kg", min_limit: 8 },
    { category: "Groceries", name: "White Sesame Seeds", code: "1330", uom: "500g", min_limit: 8 },
    { category: "Groceries", name: "White Sesame Seeds", code: "1329", uom: "1kg", min_limit: 8 },
    { category: "Groceries", name: "Crystal Salt", code: "1516", uom: "1kg", min_limit: 10 },
    { category: "Groceries", name: "Thamrind", code: "1436", uom: "500g", min_limit: 8 },
    { category: "Groceries", name: "Patha Ballem", code: "1734", uom: "500g", min_limit: 8 },
    { category: "Groceries", name: "White Horsegram", code: "1268", uom: "500g", min_limit: 6 },
    { category: "Groceries", name: "Black Horsegram", code: "1267", uom: "500g", min_limit: 6 },
    { category: "Groceries", name: "Bobbarlu", code: "1266", uom: "500g", min_limit: 6 },
    { category: "Groceries", name: "Green Moong Sprouts", code: "1269", uom: "500g", min_limit: 6 },
    { category: "Groceries", name: "Green Moong Split", code: "1606", uom: "500g", min_limit: 6 },
    { category: "Groceries", name: "Brown Chana", code: "1502", uom: "500g", min_limit: 8 },
    { category: "Groceries", name: "Kabuli Chana", code: "1501", uom: "500g", min_limit: 8 },
    { category: "Groceries", name: "Masoor Dal", code: "1509", uom: "500g", min_limit: 8 },
    { category: "Groceries", name: "Red Rajma", code: "1508", uom: "500g", min_limit: 8 },
    { category: "Groceries", name: "White Rajma", code: "1507", uom: "500g", min_limit: 8 },
    { category: "Karam", name: "Kura Karam", code: "1154", uom: "250g", min_limit: 8 },
    { category: "Karam", name: "Kura Karam", code: "1153", uom: "500g", min_limit: 6 },
    { category: "Karam", name: "Kura Karam", code: "1152", uom: "1kg", min_limit: 4 },
    { category: "Karam", name: "Masala Karam", code: "1150", uom: "250g", min_limit: 8 },
    { category: "Karam", name: "Masala Karam", code: "1149", uom: "500g", min_limit: 6 },
    { category: "Karam", name: "Masala Karam", code: "1148", uom: "1kg", min_limit: 4 },
    { category: "Karam", name: "Plane Karam", code: "1382", uom: "250g", min_limit: 8 },
    { category: "Karam", name: "Plane Karam", code: "1381", uom: "500g", min_limit: 6 },
    { category: "Karam", name: "Plane Karam", code: "1380", uom: "1kg", min_limit: 4 },
    { category: "Flours", name: "7 Grain Atta", code: "1028", uom: "1kg", min_limit: 15 },
    { category: "Flours", name: "Atta", code: "1025", uom: "1kg", min_limit: 15 },
    { category: "Flours", name: "Ambali Mix", code: "1030", uom: "1kg", min_limit: 15 },
    { category: "Flours", name: "Ragi Flour", code: "1027", uom: "500g", min_limit: 10 },
    { category: "Flours", name: "Ragi Flour", code: "1026", uom: "1kg", min_limit: 15 },
    { category: "Flours", name: "Besan Flour", code: "1175", uom: "500g", min_limit: 10 },
    { category: "Flours", name: "Jower Flour", code: "1029", uom: "500g", min_limit: 10 },
    { category: "Millets", name: "Foxtail Millet", code: "1418", uom: "500g", min_limit: 6 },
    { category: "Millets", name: "Browntop Millet", code: "1420", uom: "500g", min_limit: 6 },
    { category: "Millets", name: "Barnyard Millet", code: "1423", uom: "500g", min_limit: 6 },
    { category: "Millets", name: "Kodo Millet", code: "1422", uom: "500g", min_limit: 6 },
    { category: "Millets", name: "Little Millet", code: "1426", uom: "500g", min_limit: 6 },
    { category: "Ravva", name: "Wheat Ravva", code: "1513", uom: "500g", min_limit: 10 },
    { category: "Ravva", name: "Wheat Ravva", code: "1512", uom: "1kg", min_limit: 4 },
    { category: "Ravva", name: "Bombay Ravva", code: "1477", uom: "500g", min_limit: 10 },
    { category: "Ravva", name: "Bombay Ravva", code: "1476", uom: "1kg", min_limit: 4 },
    { category: "Ravva", name: "Idly Ravva", code: "1778", uom: "500g", min_limit: 10 },
    { category: "Ravva", name: "Idly Ravva", code: "1242", uom: "1kg", min_limit: 4 },
    { category: "Ravva", name: "Bansi Ravva", code: "1471", uom: "500g", min_limit: 10 },
    { category: "Ravva", name: "Rice Ravva", code: "1579", uom: "500g", min_limit: 10 },
    { category: "Ravva", name: "Rice Ravva", code: "1574", uom: "1kg", min_limit: 4 },
    { category: "Dry Fruits", name: "Cashew", code: "1255", uom: "250g", min_limit: 8 },
    { category: "Dry Fruits", name: "Cashew", code: "1254", uom: "500g", min_limit: 6 },
    { category: "Dry Fruits", name: "Cashew", code: "1253", uom: "1kg", min_limit: 4 },
    { category: "Dry Fruits", name: "J.H Cashew", code: "1434", uom: "250g", min_limit: 8 },
    { category: "Dry Fruits", name: "J.H Cashew", code: "1433", uom: "500g", min_limit: 8 },
    { category: "Dry Fruits", name: "J.H Cashew", code: "1812", uom: "1kg", min_limit: 4 },
    { category: "Dry Fruits", name: "Moto Badam", code: "1240", uom: "100g", min_limit: 10 },
    { category: "Dry Fruits", name: "Moto Badam", code: "1214", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Moto Badam", code: "1213", uom: "500g", min_limit: 4 },
    { category: "Dry Fruits", name: "Moto Badam", code: "1212", uom: "1kg", min_limit: 4 },
    { category: "Dry Fruits", name: "Yellow Dry Dates", code: "1215", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Yellow Dry Dates", code: "1216", uom: "500g", min_limit: 4 },
    { category: "Dry Fruits", name: "Black Dry Dates", code: "1218", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Black Kismiss", code: "1237", uom: "100g", min_limit: 10 },
    { category: "Dry Fruits", name: "Black Kismiss", code: "1238", uom: "250g", min_limit: 8 },
    { category: "Dry Fruits", name: "Walnuts", code: "1469", uom: "100g", min_limit: 10 },
    { category: "Dry Fruits", name: "Walnuts", code: "1286", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Watermelon Seeds", code: "1228", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Watermelon Seeds", code: "1229", uom: "100g", min_limit: 10 },
    { category: "Dry Fruits", name: "Pumpkin Seeds", code: "1230", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Pumpkin Seeds", code: "1231", uom: "100g", min_limit: 10 },
    { category: "Dry Fruits", name: "Sunflower Seeds", code: "1232", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Sunflower Seeds", code: "1233", uom: "100g", min_limit: 10 },
    { category: "Dry Fruits", name: "Anjeer", code: "1226", uom: "100g", min_limit: 10 },
    { category: "Dry Fruits", name: "Anjeer", code: "1225", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Green Kismiss", code: "1465", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Green Kismiss (alt)", code: "1221", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Yellow Kismiss", code: "1219", uom: "100g", min_limit: 10 },
    { category: "Dry Fruits", name: "Yellow Kismiss", code: "1220", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Dry Grapes", code: "1815", uom: "100g", min_limit: 10 },
    { category: "Dry Fruits", name: "Dry Grapes", code: "1371", uom: "250g", min_limit: 8 },
    { category: "Dry Fruits", name: "Plain Pista", code: "1235", uom: "250g", min_limit: 8 },
    { category: "Dry Fruits", name: "Plain Pista", code: "1234", uom: "100g", min_limit: 8 },
    { category: "Dry Fruits", name: "Skin Cashew", code: "1222", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Salted Pista", code: "1223", uom: "250g", min_limit: 10 },
    { category: "Dry Fruits", name: "Cherry", code: "1236", uom: "100g", min_limit: 10 },
    { category: "Dry Fruits", name: "Dry Kiwi", code: "1227", uom: "100g", min_limit: 10 },
    { category: "Dry Fruits", name: "Dry Mango", code: "1290", uom: "100g", min_limit: 10 },
    { category: "Spices", name: "Coriander", code: "1667", uom: "100g", min_limit: 8 },
    { category: "Spices", name: "Coriander", code: "1808", uom: "250g", min_limit: 4 },
    { category: "Spices", name: "Jeera", code: "1360", uom: "50g", min_limit: 10 },
    { category: "Spices", name: "Pacha Kapuram", code: "1674", uom: "10g", min_limit: 10 },
    { category: "Spices", name: "Vammu Puvvu", code: "1675", uom: "10g", min_limit: 10 },
    { category: "Spices", name: "Green Sounf", code: "1368", uom: "100g", min_limit: 10 },
    { category: "Spices", name: "Fenugreek", code: "1356", uom: "100g", min_limit: 10 },
    { category: "Spices", name: "Poppy Seeds", code: "1495", uom: "100g", min_limit: 10 },
    { category: "Spices", name: "Cinnamon Flat", code: "1352", uom: "50g", min_limit: 8 },
    { category: "Spices", name: "Cinnamon Roll", code: "1353", uom: "50g", min_limit: 8 },
    { category: "Spices", name: "Ajwain", code: "1345", uom: "50g", min_limit: 10 },
    { category: "Spices", name: "Shajeera", code: "1367", uom: "50g", min_limit: 8 },
    { category: "Spices", name: "Dry Ginger", code: "1355", uom: "50g", min_limit: 6 },
    { category: "Spices", name: "Black Elachi", code: "1349", uom: "50g", min_limit: 10 },
    { category: "Spices", name: "Marati Mogga Big", code: "1362", uom: "50g", min_limit: 10 },
    { category: "Spices", name: "Marati Mogga Small", code: "1363", uom: "50g", min_limit: 10 },
    { category: "Spices", name: "Salted Amla", code: "1350", uom: "25g", min_limit: 10 },
    { category: "Spices", name: "Black Pepper", code: "1364", uom: "50g", min_limit: 10 },
    { category: "Spices", name: "Cardamom / Elachi", code: "1351", uom: "25g", min_limit: 10 },
    { category: "Spices", name: "Star Anise", code: "1369", uom: "25g", min_limit: 10 },
    { category: "Spices", name: "Javithri", code: "1359", uom: "20g", min_limit: 10 },
    { category: "Spices", name: "Cloves", code: "1354", uom: "25g", min_limit: 10 },
    { category: "Spices", name: "Kasurimethi", code: "1361", uom: "25g", min_limit: 10 },
    { category: "Spices", name: "Bay Leaf", code: "1346", uom: "20g", min_limit: 10 },
    { category: "Spices", name: "Jaifal With Shell", code: "1357", uom: "20g", min_limit: 10 },
    { category: "Spices", name: "Jaifal Without Shell", code: "1358", uom: "20g", min_limit: 10 },
  ];
  for (const it of items) {
    const record = new Record(itemsCollection);
    record.set("category", categoryIds[it.category]);
    record.set("name", it.name);
    record.set("code", it.code);
    record.set("uom", it.uom);
    record.set("min_limit", it.min_limit);
    app.save(record);
  }
}, (app) => {
  for (const name of ["Groceries", "Karam", "Flours", "Millets", "Ravva", "Dry Fruits", "Spices"]) {
    const category = app.findFirstRecordByFilter("inventory_categories", "name = {:name}", { name });
    for (const item of app.findRecordsByFilter("inventory_items", "category = {:cat}", "", 0, 0, { cat: category.id })) {
      app.delete(item);
    }
    app.delete(category);
  }
  for (const name of ["Gajuwaka", "Kurmannapalem", "Gajuwaka Packing", "Kurmannapalem Packing"]) {
    app.delete(app.findFirstRecordByFilter("branches", "name = {:name}", { name }));
  }
})
