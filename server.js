'user strict';

const PORT = 3000;

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const routes = require('./routes/index');

const publicDir = (__dirname + '/public');

app.use(express.static(publicDir));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", routes);

app.listen(PORT, () => {
  console.log("Restaurant api running on port: " + PORT );
});