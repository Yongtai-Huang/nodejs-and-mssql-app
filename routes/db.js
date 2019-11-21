const sql = require('mssql');
const config = {
  user: 'sa',
  password: 'hyt_2010',
  server: 'LENOVOPC',
  database: 'MyRestaurant'
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL');
    return pool;
  }).catch ( err => {
    console.log('Database connection failed! Bad config: ', err);
  });

  module.exports = { sql, poolPromise };