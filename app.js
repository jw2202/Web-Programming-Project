const express = require("express");
const session = require("express-session")
const mysql = require("mysql2");
const MySQLStore = require("express-mysql-session")(session);
const app = express();

const options = {
  host: '127.0.0.1',
  user: 'root',
  password: 'RootRoot123!@',
  database: 'dcoutside',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}
const db = mysql.createConnection(options);
var sessionstore = new MySQLStore(options)

const PORT = 3000;

db.connect((err) => { 
  if (err) throw err; 
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname))
app.use(session({
  secret:"Th1s_i5-My_5ecRet_-",
  resave:false,
  saveUninitialized:true,
  store: sessionstore
}))

app.get('/', (req, res) => {
  console.log(req.session);
  if (req.session.islogined) {
    res.sendFile(__dirname + '/templates/logined.html'); 
  } else {
    res.sendFile(__dirname + '/templates/index.html');
  }
})

app.get('/login', (req, res) => {
  console.log('GET on login');
  if (req.session.islogined) {
    res.send('<script>alert("you already logined!");window.history.back();</script>');
  } else {
    res.sendFile(__dirname + '/templates/login.html');
  }
})

app.post('/login', (req, res) => {
  console.log(req.body);
  if (req.session.islogined) {
    res.send('<script>alert("you already logined!");window.history.back();</script>');
  } else {
    const data = req.body;
    db.query('SELECT id, name FROM users WHERE name=? AND password=?;', [data.name, data.password], (err, result) => {
      if (err) throw err;
      if (result[0] !== undefined) {
        req.session.id = result[0].id;
        req.session.name = result[0].name;
        req.session.islogined = true;
        req.session.save(() => {
          res.redirect('/');
        });
      } else { 
        res.send('<script>alert("user not found!");window.history.back();</script>');
      }
    })
  }
})

app.get('/write', (req, res) => {
  console.log('GET on write');
  res.sendFile(__dirname + '/templates/write.html');
})

app.post('/write', (req, res) => {
  console.log('POST on write');
  res.send('a');
})

app.get('/post', (req, res) => {
  console.log('GET on post');
  res.send('a');
})

app.get('/register', (req, res) => {
  console.log('GET on register');
  res.send('a');
})

app.post('/register', (req, res) => {
  console.log('POST on register');
  res.send('a');
})

app.get('/logout', (req, res) => {
  console.log('GET on logout');
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect('/');
  })
})

app.listen(3000, ()=>{
  console.log(`server is running on ${PORT}`);
})

process.on('SIGINT', () => {
  console.log('Closing MySQL pool...');
  db.end(err => {
      if (err) {
          console.error('Error while closing MySQL pool:', err);
      } else {
          console.log('MySQL pool closed');
      }
      process.exit(err ? 1 : 0);
  });
});