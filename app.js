const express = require("express");
const mysql = require("mysql2");

const app = express();

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'dcoutside'
});

db.connect();

app.get('/', (req, res) => {
  res.sendFile('./index.html');
})

db.end();