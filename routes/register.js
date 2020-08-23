const { check,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
var express = require('express');
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var router = express.Router();

router.use(express.urlencoded({ extended: false }));

/*GET Register page */
router.get('/', function(req, res, next) {
    res.render('register',{errors:[null]});
  });
/*POST From Register page */
router.post('/', 
//Validation steps
[
    check('uname').escape().isLength({min:4}).withMessage('Username must be at least 4 characters').isAlphanumeric().withMessage('Username should not contain special characters').trim(),
    check('email').escape().isEmail().withMessage('Must be a valid email').normalizeEmail().trim(),
    check('passwd1').escape().isLength({min:8}).withMessage('Passwords must be at least 8 characters').trim(), //Input sanitisation
    check('passwd2').escape().trim().custom(function(value,{req, loc, path}) {
        if (value !== req.body.passwd1) {
            // throw error if passwords do not match
            throw new Error("Passwords don't match");
        } else {
            return value;
        }
    }).withMessage('Passwords Don\'t match')
    ], function(req,res,next) {
        const errors = validationResult(req);
        var uname = req.body.uname;
        var passwd = req.body.passwd1;
        var email = req.body.email;
        //If something's not right
        if (!errors.isEmpty()){
            var resarray  = [];
            for (i in errors.array()) {
                resarray.push(errors.array()[i]['msg']);
            }
            return res.render('register', {errors:resarray});
        } else {
            //Construct a new user from the usermodel
            var db = require('../models/db')
            var newuser = new db.user({'uname':uname, 'email':email,'passwd':passwd});
            db.user.createUser(newuser, function (err){
                if (err) return res.render('register',{errors:[err]});
                return res.redirect('/login');
            });           
        };
    });

/* Export to the main app */
module.exports = router;