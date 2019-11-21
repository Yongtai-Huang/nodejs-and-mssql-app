'use strict';

const express = require('express');
const router = express.Router();
const API_KEY = require('../../config/settings').API_KEY;
const { sql, poolPromise } = require('../db');

// Menu_Food and Food table: get the foods on a manu by menuId
// e.g. http://localhost:3000/api/foods/food?key=12345&menuId=1
router.get('/food', async (req, res, next) => {
  console.log(req.query);
  console.log(API_KEY);

  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  const menu_id = req.query.menuId;
  if (!menu_id) {
    res.send(JSON.stringify({ success: false, message: "Missing menu id in query"}));
  } 

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('MenuId', sql.Int, menu_id)
      .query('SELECT id, name, description, image, price, isAddon, discount FROM [Food] WHERE id IN'
        + '(SELECT foodId FROM [Menu_Food] WHERE menuId=@MenuId)');

    if (queryResult.recordset.length > 0) {
      res.send(JSON.stringify({ success: true, result: queryResult.recordset }));
    } else {
      res.send(JSON.stringify({ success: false, message: "Empty" }));
    }
  } catch (err) {
    res.status(500);
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});

// Food table: get a food by foodId
// e.g. http://localhost:3000/api/foods/foodById?key=12345&foodId=2
router.get('/foodById', async (req, res, next) => {
  console.log(req.query);

  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  const food_id = req.query.foodId;
  if (!food_id) {
    res.send(JSON.stringify({ success: false, message: "Missing food id in query"}));
  } 

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('FoodId', sql.Int, food_id)
      .query('SELECT id, name, description, image, price, isAddon, discount FROM [Food] WHERE id=@FoodId');

    if (queryResult.recordset.length > 0) {
      res.send(JSON.stringify({ success: true, result: queryResult.recordset }));
    } else {
      res.send(JSON.stringify({ success: false, message: "Empty" }));
    }
  } catch (err) {
    res.status(500);
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});

// Food table: search foods by name
// e.g. http://localhost:3000/api/foods/searchFood?key=12345&foodName=pizza
router.get('/searchFood', async (req, res, next) => {
  console.log(req.query);

  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "missing or wrong API key" }));
  }

  const search_name = req.query.foodName;
  if (!search_name) {
    res.send(JSON.stringify({ success: false, message: "Missing naem in food search"}));
  } 

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('SearchName', sql.NVarChar, '%'+search_name+'%')
      .query('SELECT id, name, description, image, price, isAddon, discount FROM [Food] WHERE name LIKE @SearchName');

    if (queryResult.recordset.length > 0) {
      res.send(JSON.stringify({ success: true, result: queryResult.recordset }));
    } else {
      res.send(JSON.stringify({ success: false, message: "Empty" }));
    }
  } catch (err) {
    res.status(500);  // Internal server errror
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});

// Food_Size and Size table: get the sizes of a food by foodId
// e.g. http://localhost:3000/api/foods/size?key=12345&foodId=39
router.get('/size', async (req, res, next) => {
  console.log(req.query);

  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "missing or wrong API key" }));
  }

  const food_id = req.query.foodId;
  if (!food_id) {
    res.send(JSON.stringify({ success: false, message: "Missing food id in query"}));
  } 

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('FoodId', sql.Int, food_id)
      .query('SELECT id, description, extraPrice FROM [Size] WHERE id IN'
        + '(SELECT sizeId FROM [Food_Size] WHERE foodId=@FoodId)');

    if (queryResult.recordset.length > 0) {
      res.send(JSON.stringify({ success: true, result: queryResult.recordset }));
    } else {
      res.send(JSON.stringify({ success: false, message: "Empty" }));
    }
  } catch (err) {
    res.status(500);  // Internal server errror
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});

// Food_Addon and Addon tables: get the addons of a food by foodId
// e.g. http://localhost:3000/api/foods/addon?key=12345&foodId=39
router.get('/addon', async (req, res, next) => {
  console.log(req.query);

  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "missing or wrong API key" }));
  }

  const food_id = req.query.foodId;
  if (!food_id) {
    res.send(JSON.stringify({ success: false, message: "Missing food id in query"}));
  } 

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('FoodId', sql.Int, food_id)
      .query('SELECT id, description, extraPrice FROM [Addon] WHERE id IN'
        + '(SELECT addonId FROM [Food_Addon] WHERE foodId=@FoodId)');

    if (queryResult.recordset.length > 0) {
      res.send(JSON.stringify({ success: true, result: queryResult.recordset }));
    } else {
      res.send(JSON.stringify({ success: false, message: "Empty" }));
    }
  } catch (err) {
    res.status(500);  // Internal server errror
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});

// Favorite table: get favorite food
// e.g. http://localhost:3000/api/foods/favorite?key=12345&fbid=2739799736047038
router.get('/favorite', async (req, res, next) => {
  console.log(req.query);

  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  const fbid = req.query.fbid;
  if (!fbid) {
    res.send(JSON.stringify({ success: false, message: "Missing fbid in query"}));
  } 

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('fbid', sql.NVarChar, fbid)
      .query('SELECT fbid, foodId, restaurantId, restaurantName, foodName, foodImage, price'
        + ' FROM [Favorite] WHERE fbid=@fbid');

    if (queryResult.recordset.length > 0) {
      res.send(JSON.stringify({ success: true, result: queryResult.recordset }));
    } else {
      res.send(JSON.stringify({ success: false, message: "Empty" }));
    }
  } catch (err) {
    res.status(500);  // Internal server errror
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});


// Favorite table: get favorite foods of a restaurant
// e.g. http://localhost:3000/api/foods/favoriteByRestaurant?key=12345&fbid=2739799736047038&restaurantId=1
router.get('/favoriteByRestaurant', async (req, res, next) => {
  console.log(req.query);

  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  const fbid = req.query.fbid;
  const restaurant_id = req.query.restaurantId;

  if (!fbid) {
    res.send(JSON.stringify({ success: false, message: "Missing fbid in query"}));
  }

  if (!restaurant_id) {
    res.send(JSON.stringify({ success: false, message: "Missing restaurantId in query"}));
  } 

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('fbid', sql.NVarChar, fbid)
      .input('RestaurantId', sql.Int, restaurant_id)
      .query('SELECT fbid, foodId, restaurantId, restaurantName, foodName, foodImage, price'
        + ' FROM [Favorite] WHERE fbid=@fbid AND restaurantId=@RestaurantId');

    if (queryResult.recordset.length > 0) {
      res.send(JSON.stringify({ success: true, result: queryResult.recordset }));
    } else {
      res.send(JSON.stringify({ success: false, message: "Empty" }));
    }
  } catch (err) {
    res.status(500);
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});


// favorite table: favorite food
/* e.g. http://localhost:3000/api/foods/favorite
  body: {
    key: 12345
    foodId: 39
    restaurantId: 1
    restaurantName: Restaurant A
    foodImage: AudioBuffer
    price: 12
    fbid: 2739799736047038
  }
*/
router.post('/favorite', async (req, res, next) => {
  console.log(req.body);
  
  if (!req.body.key || req.body.key !== API_KEY) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  if (!req.body.fbid) {
    res.send(JSON.stringify({ success: false, message: "Missing fbid in body of post"}));
  }
  
  const fbid = req.body.fbid;
  const food_id = req.body.foodId;
  const restaurant_id =req.body.restaurantId;
  const restaurant_name = req.body.restaurantName;
  const food_name = req.body.foodName;
  const food_image = req.body.foodImage;
  const price = req.body.price;

  try {
    const pool = await poolPromise;
    const queryResult = await pool.request()
      .input('FBID', sql.NVarChar, fbid)
      .input('FoodId', sql.Int, food_id)
      .input('RestaurantId', sql.Int, restaurant_id)
      .input('RestaurantName', sql.NVarChar, restaurant_name)
      .input('FoodName', sql.NVarChar, food_name)
      .input('FoodImage', sql.NVarChar, food_image)
      .input('Price', sql.Float, price)
      .query('INSERT INTO [Favorite]'
        + '(FBID, FoodId, RestaurantId, RestaurantName, FoodName, FoodImage, Price)'
        + 'VALUEs'
        + '(@FBID, @FoodId, @RestaurantId, @RestaurantName, @FoodName, @FoodImage, @Price)' );
    
      res.send(JSON.stringify({ success: true, message: "Success" }));

  } catch (err) {
    res.status(500);
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});

// favorite table: cancel favorite
// http://localhost:3000/api/foods/favorite?key=12345&fbid=2739799736047038&foodId=39&restaurantId=1
router.delete('/favorite', async (req, res, next) => {
  console.log(req.query);
  
  if (!req.query.key || req.query.key !== API_KEY) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  if (!req.query.fbid) {
    res.send(JSON.stringify({ success: false, message: "Missing fbid in query"}));
  }
  
  const fbid = req.query.fbid;
  const food_id = req.query.foodId;
  const restaurant_id =req.query.restaurantId;

  try {
    const pool = await poolPromise;
    const queryResult = await pool.request()
      .input('FBID', sql.NVarChar, fbid)
      .input('FoodId', sql.Int, food_id)
      .input('RestaurantId', sql.Int, restaurant_id)
      .query('DELETE FROM [Favorite] WHERE FBID=@FBID AND FoodId=@FoodId AND RestaurantId=@RestaurantId');
    
      res.send(JSON.stringify({ success: true, message: "Success" }));

  } catch (err) {
    res.status(500);
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});

module.exports = router;