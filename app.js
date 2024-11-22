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

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
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
    // res.sendFile(__dirname + '/templates/logined.html'); 
    res.render('logined', { name : req.session.name });
  } else {
    // res.sendFile(__dirname + '/templates/index.html');
    res.render('index');
  }
})

app.get('/login', (req, res) => {
  console.log('GET on login');
  if (req.session.islogined) {
    res.send('<script>alert("you already logined!");window.history.back();</script>');
  } else {
    res.render('login');
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
  res.render('write', { name: req.session.name });
})

app.post('/write', (req, res) => {
  console.log('POST on write');
  res.redirect('/')
})

app.get('/post', (req, res) => {
  console.log('GET on post');
  res.render('page')
})

app.get('/register', (req, res) => {
  if (req.session.islogined) {
    res.send('<script>alert("you already logined!");window.history.back();</script>');
  } else {
    res.render('register');
  }
})

app.post('/register', (req, res) => {
  if (req.session.islogined) {
    res.send('<script>alert("you already logined!");window.history.back();</script>');
  } else {
    const data = req.body;
    db.query('SELECT id, name FROM users WHERE name=? AND password=?;', [data.name, data.password], (err, result) => {
      if (err) throw err;
      if (result[0] !== undefined) {
        res.send('<script>alert("user already exists!");window.history.back();</script>');
      } else { 
        db.query("INSERT INTO users(name, password) VALUES (?, ?);", [data.name, data.password], (err, result) => {
          if (err) throw err;
          res.send('<script>alert("register successed!");location.href = "/login";</script>');
        })
      }
    })
  }
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