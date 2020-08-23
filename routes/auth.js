const { check,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
var express = require('express');
var crypto = require('crypto')
var passport = require('passport');
var nodemailer = require('nodemailer');
var router = express.Router();

router.use(express.urlencoded({ extended: false }));

/*GET Login page */
router.get('/', function(req, res, next) {
    var user = req.user;
    if (user == undefined) {
        return res.render('login',{errors:[null]});
    } else { //prevent acess to login page if logged in
        return res.redirect('/')
    };    
});

/*POST From login page */
router.post('/', [
    check('uname').escape().isLength({min:4}).withMessage('Username must be at least 4 characters').isAlphanumeric().withMessage('Username can\'t contain special characters').trim(),
    check('passwd').escape().isLength({min:8}).withMessage('Password must be at least 8 characters').trim() //Input sanitisation
], function (req,res,next) {
    var err = validationResult(req);
    err = err.array()
    //Get any errors and show them to the user, telling them why login failed
    if (Array.isArray(err) && err.length) {
        var errarray = [];
        for (i in err) {
            errarray.push(err[i]['msg']);
        }
        return res.render('login', {errors:errarray});
    } else {
        var backURL = req.header('Referer') || '/';
        //Attempt to authenticate
        passport.authenticate('local',function(err,user,info) {
            if (err) { return next(err)};
            if (!user) {
                //Tell user why login failed
                return res.render('login',{errors:[info.reason]});
            }
            req.login(user,function(err) {
                //Log in the user
                if (err) {return next(err)};
                return res.redirect(backURL);
            });
        })(req,res,next);
    };
});

/*GET forgot page*/
router.get('/forgot', function(req,res,next){
    var user = req.user;
    if (user == undefined) {
        return res.render('forgot',{errors:[null]});
    } else { //prevent acess to reset page if logged in
        return res.redirect('/')
    }; 
});

/*POST forgot page*/
router.post('/forgot', function(req,res,next){
    //Generate 20 byte random token
    crypto.randomBytes(20, function(err, buf) {
        if (err) return res.render('forgot',{errors:['Internal server error: Can\'t generate token']});
        var token = buf.toString('hex');
        var db = require('../models/db')
        //Find the user who forgot their password
        db.user.checkUserExists(req.body.uname,req.body.email,function(exists,user){
            if (exists) {
                //Send the reset email and update the db accordingly
                resetpass(req,res,user,token)
            } else {
                //Tell the attemped resetter the user doesn't exist
                return res.render('forgot',{errors:["No account by that username/email"]})
            }
        })
        
    })
});

/*GET reset page*/
router.get('/reset/:token', function(req, res, next){
    db = require('../models/db');
    //Find a user with the token in the URL and a valid date in the future
    db.user.findOne({resettoken: req.params.token,tokenexpires: {$gt: Date.now()}}, function(err, user){
        if (err) return res.render('reset',{valid:false,user:null,errors:['Internal server error: Can\'t connect to users database']});
        if (!user) {
            //No such user, do not allow reset
            return res.render('reset',{valid:false,user:null,errors:[null]});
        }
        //token is valid, allow reset
        return res.render('reset',{valid:true,user:user,errors:[null]})
    })
})
router.get('/reset', function(res,res,next) {
    res.redirect('/')
})
/*POST reset page*/
router.post('/reset/:token',
//Validation
[
    check('passwd1').escape().isLength({min:8}).withMessage('Passwords must be at least 8 characters').trim(), //Input sanitisation
    check('passwd2').escape().trim().custom(function(value,{req, loc, path}) {
        if (value !== req.body.passwd1) {
            // throw error if passwords do not match
            throw new Error("Passwords don't match");
        } else {
            return value;
        }
    }).withMessage('Passwords Don\'t match')
], function(req,res,next){
    const errors = validationResult(req);
    db = require('../models/db');
    //Find a user with the token in the URL and a valid date in the future
    db.user.findOne({resettoken: req.params.token,tokenexpires: {$gt: Date.now()}}, function(err, user){
        if (!user) {
            //If the token is no longer valid, or a request was send without a valid token at all
            if (err) return res.render('reset',{valid:false,user:null,errors:['Internal server error: Can\'t connect to users database']});
            if (!errors.isEmpty()){
                var resarray  = [];
                for (i in errors.array()) {
                    resarray.push(errors.array()[i]['msg']);
                }
                return res.render('reset', {valid:false,user:null,errors:resarray});
            } else {
                return res.render('reset',{valid:false,user:null,errors:[null]});
            }
        } else {
            //User is valid, but something's not right
            if (err) return res.render('reset',{valid:true,user:null,errors:['Internal server error: Can\'t connect to users database']});
            if (!errors.isEmpty()){
                var resarray  = [];
                for (i in errors.array()) {
                    resarray.push(errors.array()[i]['msg']);
                }
                return res.render('reset', {valid:true,user:null,errors:resarray});
            }
        }
        //Can only get to this point if valid and no errors have occurred
        db.user.updatePassword(user,req.body.passwd1, function(user){
            //Safe to log user in, allowing site access post-reset
            req.login(user, function(err){
                if (err) return next(err);
                //Email setup
                var smtpTransport = nodemailer.createTransport({
                    host: 'smtp.eu.mailgun.org',
                    port:587,
                    secure:false,
                    //Log in using password stored in environment variable
                    auth:{
                        user:'password-reset@pammt.co.uk',
                        pass:process.env.MAILPASS
                    }
                });
                smtpTransport.verify(function(error, success) {
                    if (error) {
                      console.log(error);
                    } else {
                      console.log("Server is ready to take our messages");
                    }
                  });
                //Contents of the email, and who to send as
                var mailopt = {
                    to: user.email,
                    from: 'password-reset@pammt.co.uk',
                    subject: 'pamMT reset confirmation',
                    text: 'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                //Send it!
                smtpTransport.sendMail(mailopt, function(err) {
                    if (err) return res.render('reset',{valid:true,user:null,errors:['Internal server error: Can\'t send email']});
                    return res.redirect('/')
                })
            })
        })
    })
});
/**
 * 
 * @param {*} req reqest object from POST 
 * @param {*} res response object
 * @param {*} user The user to reset
 * @param {*} token The 20-bit pseudo-random token
 */
var resetpass = function(req,res,user,token) {
    //Assign values to the user, then commit to the database
    user.resettoken = token;
    user.tokenexpires = Date.now() + 3600000 //in 1 hour;
    user.save(function(err){
        if (err) return res.render('forgot',{errors:['Internal server error: Can\'t access database']});
        //Email setup
        var smtpTransport = nodemailer.createTransport({
            host: 'smtp.eu.mailgun.org',
            port:587,
            secure:false,
            //Log in using password stored in environment variable
            auth:{
                user:'password-reset@pammt.co.uk',
                pass:process.env.MAILPASS
            }
        });
        smtpTransport.verify(function(error, success) {
            if (error) {
              console.log(error);
            } else {
              console.log("Server is ready to take our messages");
            }
          });
        //Contents of the email, and who to send as
        var mailopt = {
            to: user.email,
            from: 'password-reset@pammt.co.uk',
            subject: 'pamMT password reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'https://pammt.duckdns.org/login/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        //Send it!
        smtpTransport.sendMail(mailopt, function(err) {
            if (err) {
                console.log(err);
                return res.render('forgot',{errors:['Internal server error: Can\'t send email']});
            }
            return res.render('forgot',{errors:['An email has been sent']})
        })
    });
}

//allow resetpass method to be used elsewhere
router.resetpass = resetpass;
/* Export to the main app */
module.exports = router;
