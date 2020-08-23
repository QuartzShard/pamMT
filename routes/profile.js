const { check,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
var express = require('express');
var router = express.Router();
var db = require('../models/db')

//GET profile page if logged in
router.get('/',function(req,res,next){
    var user = req.user;
    if (!user) {
        return res.redirect('/')
    } else {
        res.render('profile',{user:user,errors:[]})
    }
})

//POST username update
router.post('/unameupdate',function(req,res,next){
    if (!user) {
        return res.redirect('/');
    } else {
        var newname = req.body.newname
        db.user.getUserByName(newname, function(err,existing){
            if (err) return res.send("A database error occured")
            if (!existing) {
                user.uname = newname
                user.save(function(user){
                    return res.send("Successfully changed your username!")
                })
            } else {
               return res.send("User already exists!")
            }
       })  
   }
})

//POST password update
router.post('/passwdupdate',[
    check('newPass').escape().isLength({min:8}).withMessage('Passwords must be at least 8 characters').trim()
], function(req,res,next){
    if (!user) {
        return res.redirect('/');
    } else {
        var newPass = req.body.newPass
        db.user.updatePassword(user,newPass,function(user){
            return res.send("Successfully updated your password!")
        })
    }
})

module.exports = router