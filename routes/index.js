var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  user=req.user
  if (user == undefined) {
    res.render('index',{user:null});
  } else {
    res.render('index',{user:user});
  }
});

/* GET about page. */
router.get('/about', function(req, res, next) {
  user=req.user
  if (user == undefined) {
    res.render('about',{user:null});
  } else {
    res.render('about',{user:user});
  }
});
/*Log the current user out*/
router.get('/logout', function(req,res,next){
  req.logout();
  res.redirect('/')
})


/* Export to the main app */
module.exports = router;
