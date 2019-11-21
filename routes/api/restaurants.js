'use strict';

const express = require('express');
const router = express.Router();
const API_KEY = require('../../config/settings').API_KEY;
const { sql, poolPromise } = require('../db');

// Restaurant table: get all restaurants
// e.g. http://localhost:3000/api/restaurants?key=12345
router.get('/', async (req, res, next) => {
  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .query('SELECT id, name, address, phone, lat, lng, userOwner, image, paymentUrl FROM [Restaurant]');

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

// Restaurant table: get restaurant by restaurantId
// e.g. http://localhost:3000/api/restaurants/restaurantById?key=12345&restaurantId=2
router.get('/restaurantById', async (req, res, next) => {
  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  const restaurant_id = req.query.restaurantId;
  if (!restaurant_id) {
    res.send(JSON.stringify({ success: false, message: "Missing restaurant id in query"}));
  }

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('RestaurantId', sql.Int, restaurant_id)
      .query('SELECT id, name, address, phone, lat, lng, userOwner, image, paymentUrl FROM [Restaurant] WHERE id=@RestaurantId');

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

// Restaurant table: get nearby restaurants (by lat, lng, and distance)
// e.g. http://localhost:3000/api/restaurants/nearbyRestaurants?key=12345&lat=30.32000&lng=-81.485&distance=5
router.get('/nearbyRestaurants', async (req, res, next) => {
  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  const user_lat = parseFloat(req.query.lat);
  const user_lng = parseFloat(req.query.lng);
  const distance = parseFloat(req.query.distance);


  if (user_lat == Number.NaN || user_lng == Number.NaN || distance == Number.NaN) {
    res.send(JSON.stringify({ success: false, message: "Missing latitude, longitude or distance in query"}));
  }

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('lat', sql.Float, user_lat)
      .input('lng', sql.Float, user_lng)
      .input('distance', sql.Float, distance)
      .query('SELECT * FROM (SELECT id, name, address, phone, lat, lng, userOwner, image, paymentUrl,'
        + 'ROUND(111.045 * DEGREES(ACOS(COS(RADIANS(@lat)) * COS(RADIANS(lat))'
        + '* COS(RADIANS(lng) - RADIANS(@lng)) + SIN(RADIANS(@lat))'
        + '* SIN(RADIANS(lat)))), 2) AS distance_in_km FROM [Restaurant]) tempTable'
        + ' WHERE distance_in_km < @distance');

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


// Restaurant_Menu and Menu tables: get the menus of a restaurant by restaurantId
// e.g. http://localhost:3000/api/restaurants/menu?key=12345&restaurantId=1
router.get('/menu', async (req, res, next) => {
  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  const restaurant_id = req.query.restaurantId;
  if (!restaurant_id) {
    res.send(JSON.stringify({ success: false, message: "Missing restaurant id in query"}));
  } 

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('RestaurantId', sql.Int, restaurant_id)
      .query('SELECT id, name, description, image FROM [Menu] WHERE id IN'
        + '(SELECT menuId FROM [Restaurant_Menu] WHERE restaurantId=@RestaurantId)');

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

module.exports = router;