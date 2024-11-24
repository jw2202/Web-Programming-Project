const e = require("express");
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
  secret : "Th1s_i5-My_5ecRet_-",
  resave : false,
  saveUninitialized : true,
  store : sessionstore
}))

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} ${JSON.stringify(req.session)}`);
  next();
})

app.get('/', (req, res) => {
  db.query('SELECT * FROM posts;', (err, results) => {
    if (err) throw err;
    res.render('index', {
      logined_text : req.session.islogined ? `logined as: ${req.session.name}` : '', 
      actions : req.session.islogined ? '<a href="/logout" class="back-button">로그아웃</a>\n<a href="/write" class="back-button">글 작성</a>' : '<a href="/login" class="back-button">로그인</a>\n<a href="/register" class="back-button">회원가입</a>',
      posts : results.reverse()
    })
  })
})

app.get('/login', (req, res) => {
  if (req.session.islogined) {
    res.send('<script>alert("you already logined!");window.history.back();</script>');
  } else {
    res.render('login');
  }
})

app.post('/login', (req, res) => {
  if (req.session.islogined) {
    res.send('<script>alert("you already logined!");window.history.back();</script>');
  } else {
    const data = req.body;
    db.query('SELECT id, name FROM users WHERE name=? AND password=?;', [data.name, data.password], (err, result) => {
      if (err) throw err;
      if (result[0] !== undefined) {
        req.session._id = result[0].id;
        req.session.name = result[0].name;
        req.session.islogined = true;
        req.session.save(() => {
          res.redirect('/');
        })
      } else { 
        res.send('<script>alert("user not found!");window.history.back();</script>');
      }
    })
  }
})

app.get('/write', (req, res) => {
  if (req.session.islogined) {
    res.render('write', { logined_text: `logined as: ${req.session.name}` });
  } else {
    res.send('<script>alert("login first!");location.href = "/login";</script>');
  }
})

app.post('/write', (req, res) => {
  if (req.session.islogined) {
    const data = req.body;
    db.query("INSERT INTO posts(author, time, title, content) VALUES (?, now(), ?, ?);", [req.session.name, data.title, data.content], (err, result) => {
      if (err) throw err;
      res.redirect('/');
    })
  } else {
    res.send('<script>alert("login first!");location.href = "/login";</script>');
  }
})

app.get('/post', (req, res) => {
  const { id } = req.query;
  db.query("SELECT id, author, time, title, content FROM posts WHERE id=?", [id], (err, result) => {
    if (err) throw err;
    if (result[0] === undefined) {
      res.send('<script>alert("unavailable post!");window.history.back();</script>');
    } else {
      res.render('page', { logined_text: req.session.islogined ? `logined as: ${req.session.name}` : '', 
        post: result[0] })
    }
  })
})

app.get('/delete', (req, res) => {
  if (req.session.islogined) {
    const { id } = req.query;
    db.query("SELECT author FROM posts WHERE id=?", [id], (err, result) => {
      if (err) throw err;
      if (result[0] === undefined) {
        res.send('<script>alert("unavailable post!");window.history.back();</>');
      }
      if (result[0].author === req.session.name){
        db.query("DELETE FROM posts WHERE id=?", [id], (err, result) => {
          if (err) throw err;
          res.redirect('/');
        })
      } else {
        res.send('<script>alert("this post is not yours!");window.history.back();</script>');
      }
    })
  } else {
    res.send('<script>alert("login first!");location.href = "/login";</script>');
  }
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
    if (data.name.length > 20) {
      res.send('<script>alert("id must be shorter than 21 bytes!");window.history.back();</script>');
    } else if (data.password.length > 20) {
      res.send('<script>alert("password must be shorter than 21 bytes!");window.history.back();</script>');
    } else {
      db.query('SELECT id, name FROM users WHERE name=?;', [data.name], (err, result) => {
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
  }
})

app.get('/logout', (req, res) => {
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