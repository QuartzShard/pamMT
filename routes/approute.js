var express = require('express');
var router = express.Router();

/* GET app page. */
router.get('/', function(req, res, next) {
    user=req.user
    if (user == undefined) {
      res.render('app',{user:{uname:'guest'}});
    }else {
      res.render('app',{user:user});
    }
  });

/* Export to the main app */
module.exports = router;
