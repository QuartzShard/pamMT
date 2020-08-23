const port=8080

/*Include all dependency modules*/
var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bcrypt = require('bcrypt');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
/*Include all modules in routes/ */
var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var registerRouter = require('./routes/register');
var notFoundRouter = require('./routes/404')
var profileRouter = require('./routes/profile')
var applicationEndpoint = require('./routes/approute');
var api = require('./routes/api')

/*Initialise application as an express webapp */
var app = express();

/* Initialise view engine (allows res.render over sending static html)*/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
/*Express middleware ordering */
app.use(logger('dev'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'Crypt0gr4ph1c4llyS3cur3S3cr3tK3y!', //Long string to encrypt session cookies
  saveUninitialized: true,
  resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
//Serves public/ to the end user as a static path, allows access to stylesheets
app.use(express.static(path.join(__dirname, 'public'))); 
/*Mount each routing module at desired path from webroot */
/*Must go AFTER and library middleware, ideally the last thing app.use()'d
  before error handling*/
app.use('/', indexRouter);
app.use('/login', authRouter);
app.use('/register', registerRouter);
app.use('/profile', profileRouter);
app.use('/404', notFoundRouter);
app.use('/app', applicationEndpoint);
app.use('/api', api)


/*Initialise passport authentication module*/

var db = require('./models/db') //Include methods from ./models/db as methods of db
passport.use(new localStrategy({
  usernameField:'uname',
  passwordField:'passwd'
},function(username,password,callback){
    db.user.getUserByName(username, function(err, user){
      if (err) throw err;
      if (!user){
        return callback(null, false,{reason:'User does not exist'})
      };
      db.user.checkPasswd(password,user.passwd,function(err,isMatch){
        if (err) throw err;
        if (isMatch){
          return callback(null, user); //Returns the authenticated user to the place that requested
        } else {                       //it, others are self-explanitory.
          return callback(null, false, {reason:'Invalid Password'})
        };
      })
    })
  })
);

passport.serializeUser(function(user, callback) {
  callback(null, user.id); //For sessions storing users, passport backend
});

passport.deserializeUser(function(id, callback) {
  db.user.getUserByID(id, function (err, user) {
    if (err) { return callback(err); } //As above, retrieves user from db
    callback(null, user);
  });
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error',{user:req.user});
});
/*Cheaty redirect for spurious requests*/
app.use(function (req, res, next) { 
  var badurl = req.url;
  return res.status(404).send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/404?url=${badurl}"></head></html>`);
})
/*Causes the app to listen for connections on localhost:8080,
  to which the nginx webserver is configured to forward traffic*/
app.listen(port, function(err){
	if (err) {
    return console.log('something exploded', err);
	};
	console.log(`server is listening on port ${port}`);
});
module.exports = app;
