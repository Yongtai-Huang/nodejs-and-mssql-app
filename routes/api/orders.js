'use strict';

const express = require('express');
const router = express.Router();
const API_KEY = require('../../config/settings').API_KEY;
const { sql, poolPromise } = require('../db');

// Order table: get orders of a user by orderFBID
// e.g. http://localhost:3000/api/orders?key=12345&orderFBID=2739799736047038
router.get('/', async (req, res, next) => {
  console.log(req.query);

  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  const order_fbid = req.query.orderFBID;
  if (!order_fbid) {
    res.send(JSON.stringify({ success: false, message: "Missing orderFBID in query"}));
  } 

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('OrderFBID', sql.NVarChar, order_fbid)
      .query('SELECT orderId, orderFBID, orderPhone, orderName, orderAddress, orderStatus,'
        + 'orderDate, restaurantId, transactionId, cod, totalPrice, numOfItem'
        + ' FROM [Order] WHERE orderFBID=@OrderFBID');

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


// Order table: get order detail by orderId
// e.g. http://localhost:3000/api/orders/orderDetail?key=12345&orderId=42
router.get('/orderDetail', async (req, res, next) => {
  console.log(req.query);

  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  const order_id = req.query.orderId;
  if (!order_id) {
    res.send(JSON.stringify({ success: false, message: "Missing orderId in query"}));
  } 

  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('OrderId', sql.Int, order_id)
      .query('SELECT orderId, itemId, quantity, discount, extraPrice, size, addon FROM [OrderDetail] WHERE orderId=@OrderId');

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


// Order table: add order
/* e.g. http://localhost:3000/api/orders
body: {
  key: 12345
  orderFBID: 0204678921183554,
  orderPhone: 12345678,
  orderName: Angel
  orderAddress: 3 Broadway,
  orderDate: 02/03/2019,
  restaurantId: 1,
  transactionId: none,
  cod: 1,
  totalPrice: 100,
  numOfItem: 5
}
*/
router.post('/', async (req, res, next) => {
  console.log(req.body);
  
  if (!req.body.key || req.body.key !== API_KEY) {
    req.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }
  
  if (!req.body.orderFBID) {
    res.send(JSON.stringify({ success: false, message: "Missing orderFBID in body of POST request"}));
  }
    
  const order_phone = req.body.orderPhone;
  const order_name = req.body.orderName;
  const order_address = req.body.orderAddress;
  const order_date = req.body.orderDate;
  const restaurant_id = req.body.restaurantId;
  const transaction_id = req.body.transactionId;
  const cod = req.body.cod;
  const total_price = req.body.totalPrice;
  const num_of_item = req.body.numOfItem;
  const order_fbid = req.body.orderFBID;
  
  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('OrderFBID', sql.NVarChar, order_fbid)
      .input('OrderPhone', sql.NVarChar, order_phone)
      .input('OrderName', sql.NVarChar, order_name)
      .input('OrderAddress', sql.NVarChar, order_address)
      .input('OrderDate', sql.NVarChar, order_date)
      .input('RestaurantId', sql.Int, restaurant_id)
      .input('TransactionId', sql.NVarChar, transaction_id)
      .input('COD', sql.Bit, cod == true ? 1: 0)
      .input('TotalPrice', sql.Float, total_price)
      .input('NumOfItem', sql.Int, num_of_item)
      .query('INSERT INTO [Order]'
        + '(OrderFBID, OrderPhone, OrderName, OrderAddress, OrderStatus, OrderDate, RestaurantId, TransactionId, COD, TotalPrice, NumofItem)'
        + 'VALUES'
        + '(@OrderFBID, @OrderPhone, @OrderName, @OrderAddress, 0, @OrderDate, @RestaurantId, @TransactionId, @COD, @TotalPrice, @NumofItem)'
        + ' SELECT TOP 1 OrderId AS orderNumber FROM [Order] WHERE OrderFBID=@OrderFBID ORDER BY orderNumber DESC'
      );

    console.log(queryResult);

    if (queryResult.recordset.length > 0) {
      res.send(JSON.stringify({ success: true, result: queryResult.recordset }));
    } else {
      res.send(JSON.stringify({ success: false, message: "Empty"}));
    }

  } catch (err) {
    res.status(500);
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});


// Order table: update order
/* e.g. http://localhost:3000/api/orders
body: {
  key: 12345,
  orderId: 45,
  orderDetail: [{"foodAddon": "[{\"extraPrice\":5.0,\"id\":2,\"name\":\"Special Sauce 02\"},{\"extraPrice\":5.0,\"id\":3,\"name\":\"Special Sauce 03\"}]", "foodExtraPrice":14.0, "foodId":39, "foodImage":"http://10.0.2.2:3000/21_mushroom_pizza.jpg", "foodName":"MUSHROOM PIZZA", "foodPrice":25.0, "foodQuantity":2, "foodSize":"Large", "restaurantId":1, "userPhone":"+84988353682" }]
}
*/
router.put('/', async (req, res, next) => {
  console.log(req.body);
  
  if (!req.body.key || req.body.key !== API_KEY) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }
  
  const order_id = req.body.orderId;
  let order_detail;
  try {
    order_detail = JSON.parse(req.body.orderDetail);
  }
  catch (err) {
    res.status(500);
    res.send(JSON.stringify({ success: false, message: err.message }));
  }

  if (!order_id || !order_detail) {
    res.send(JSON.stringify({ success: false, message: "Missing orderId or orderDetail in body of POST request"}));
  }
    
  try {
    const pool = await poolPromise;
    const table = new sql.Table('OrderDetail'); // Create virtual table for bulk insert
    table.create = true;

    table.columns.add('OrderId', sql.Int, {nullable: false, primary: true});
    table.columns.add('ItemId', sql.Int, {nullable: false, primary: true});
    table.columns.add('Quantity', sql.Int, {nullable: true});
    table.columns.add('Price', sql.Float, {nullable: true});
    table.columns.add('Discount', sql.Int, {nullable: true});
    table.columns.add('Size', sql.NVarChar(50), {nullable: true});  // need exactly size in SQLServer Table (real table)
    table.columns.add('Addon', sql.NVarChar(4000), {nullable: true});  // need exactly size in SQLServer Table (real table)
    table.columns.add('ExtraPrice', sql.Float, {nullable: true});

    for (let i = 0; i < order_detail.length; i++) {
      table.rows.add(
        order_id,
        order_detail[i]["foodId"],
        order_detail[i]["foodQuantity"],
        order_detail[i]["foodPrice"],
        order_detail[i]["foodDiscount"],
        order_detail[i]["foodSize"],
        order_detail[i]["foodAddon"],
        parseFloat(order_detail[i]["foodExtraPrice"])
      );
    }

    const request = pool.request();
    request.bulk(table, (err, resultBulk) => {
      if (err) {
        console.log(err);
        res.send(JSON.stringify({ success: false, message: err }));
      } else {
        res.send(JSON.stringify({ success: true, message: "Update successfully" }));
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500);
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});

module.exports = router;