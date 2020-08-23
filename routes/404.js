var express = require('express');
var router = express.Router();

/* GET 404 page. */
router.get('/', function(req, res, next) {
  var badurl = req.query.url;
  res.status(404)
  res.render('404', {url:badurl});
});

/* Export to the main app */
module.exports = router;
