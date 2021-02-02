var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var booksRouter = require('./routes/books');

const db = require('./models');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/books', booksRouter);

app.use(express.static('public'));

// DB Connection test
db.sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// 404 error handler
app.use((req, res, next) => {
  const error = new Error();
  error.message = 'The page you\'ve requested was not found!'
  error.status = 404;
  res.render('page-not-found', {error: error});
});

// Global error handler
app.use((err, req, res, next) => {
  err.status = err.status || 500;
  err.message = err.message || 'Oops there was an error on the server.';
  console.log(err.status, err.message);
  res.render('error', {error: err});
});

module.exports = app;
