'use strict';

const express = require('express');
const router = express.Router();
const randomstring = require('randomstring');
const API_KEY = require('../../config/settings').API_KEY;
const { sql, poolPromise } = require('../db');

// Generate fbid for adding new user
const generateFbid = async () => {
  let num = '';
  let existing = false;

  do {
    num = randomstring.generate({
      length: 16,
      charset: 'numeric'
    });

    try {
      const pool = await poolPromise;
      const queryResult = await pool.request()
        .input('fbid', sql.NVarChar, num)
        .query('SELECT fbid FROM [User] where fbid=@fbid');
  
      if (queryResult.recordset.length > 0) {
        existing = true;
      }
    } catch (err) {
      console.log(err.message);
    }
  } while (existing);

  return num;
}

// User table: get user by fbid
// e.g. http://localhost:3000/api/users?key=12345&fbid=2739799736047038
router.get('/', async (req, res, next) => {
  if (!req.query.key || req.query.key !== API_KEY ) {
    res.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }

  const fbid = req.query.fbid;
  if (!fbid) {
    res.send(JSON.stringify({ success: false, message: "Missing fbid in query" }));
  }
  
  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('fbid', sql.NVarChar, fbid)
      .query('SELECT userPhone, name, address, fbid FROM [User] where fbid=@fbid');

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


// User table: add new user
/* e.g. http://localhost:3000/api/users
  body: {
    key: 12345,
    userPhone: 123456789,
    userName: Monder,
    userAddress: 1 Abc
  }
*/
router.post('/', async (req, res, next) => {
  if (!req.body.key || req.body.key !== API_KEY) {
    req.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }
  
  const fbid = await generateFbid();
  const user_phone = req.body.userPhone;
  const user_name = req.body.userName;
  const user_address = req.body.userAddress;
  
  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('UserPhone', sql.NVarChar, user_phone)
      .input('UserName', sql.NVarChar, user_name)
      .input('UserAddress', sql.NVarChar, user_address)
      .input('FBID', sql.NVarChar, fbid)
      .query('INSERT INTO [User] (FBID, UserPhone, Name, Address) OUTPUT Inserted.FBID, Inserted.UserPhone, Inserted.Name, Inserted.Address'
        + ' VALUES(@FBID, @UserPhone, @UserName, @UserAddress)'
      );

    if (queryResult.rowsAffected) {
      res.send(JSON.stringify({ success: true, message: "Success"}));
    } else {
      res.send(JSON.stringify({ success: false, message: "Failed"}));
    }

  } catch (err) {
    res.status(500);
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});

// User table: update user
/* e.g. http://localhost:3000/api/users
  body: {
    key: 12345,
    userPhone: 123456789,
    userName: Tony,
    userAddress: 1 Abc
    fbid: you fbid
  }
*/
router.put('/', async (req, res, next) => {
  if (!req.body.key || req.body.key !== API_KEY) {
    req.send(JSON.stringify({ success: false, message: "Missing or wrong API key" }));
  }
  
  if (!req.body.fbid) {
    res.send(JSON.stringify({ success: false, message: "Missing fbid in body of POST request"}));
  }
  
  const fbid = req.body.fbid;
  const user_phone = req.body.userPhone;
  const user_name = req.body.userName;
  const user_address = req.body.userAddress;
  
  try {
    const pool = await poolPromise;

    const queryResult = await pool.request()
      .input('UserPhone', sql.NVarChar, user_phone)
      .input('UserName', sql.NVarChar, user_name)
      .input('UserAddress', sql.NVarChar, user_address)
      .input('FBID', sql.NVarChar, fbid)
      .query('IF EXISTS (SELECT * FROM [User] WHERE FBID=@FBID)'
        + ' UPDATE [User] SET Name=@UserName, Address=@UserAddress WHERE FBID=@FBID'
        + ' ELSE'
        + ' INSERT INTO [User] (FBID, UserPhone, Name, Address) OUTPUT Inserted.FBID, Inserted.UserPhone, Inserted.Name, Inserted.Address'
        + ' VALUES(@FBID, @UserPhone, @UserName, @UserAddress)'
      );

    if (queryResult.rowsAffected) {
      res.send(JSON.stringify({ success: true, message: "Success"}));
    } else {
      res.send(JSON.stringify({ success: false, message: "Failed"}));
    }

  } catch (err) {
    res.status(500);
    res.send(JSON.stringify({ success: false, message: err.message }));
  }
});

module.exports = router;