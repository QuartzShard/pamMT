var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
const saltRounds = 3; //Increase for more security 

//Layout and type constraints of user objects in the database
var userSchema = new Schema(
    {
        uname: {
            type:String,
            required:true,
        },
        email:{
            type: String, 
        },
        passwd: {
            type: String,
            required:true 
        },
        resettoken: {
            type: String,
            default: null,
        },
        tokenexpires: {
            type: Date,
            default: null,
        }

    }
); 

//Export the schema
var User = module.exports = mongoose.model('user', userSchema);    

//Database methods

/**
 * 
 * @param {string} username Username of the user to search for
 * @param {*} callback function(err, user) {}
 * Finds a user by their username
 */
var getUserByName = function(username,callback) {
    var query = {'uname':username};
    User.findOne(query,callback);
};
module.exports.getUserByName = getUserByName

/**
 * 
 * @param {string} useremail Email of the user to search for
 * @param {*} callback function(err, user) {}
 * Finds a user by their associated email
 */
var getUserByEmail = function(useremail,callback) {
    var query = {'email':useremail};
    User.findOne(query,callback);
};
module.exports.getUserByEmail = getUserByEmail

/**
 * 
 * @param {MongooseObjectID} UID The users UUID
 * @param {*} callback function(err,user) {}
 * Finds a user by their internal unique ID
 */
var getUserByID = function(UID,callback){
    User.findById(UID,callback);
};
module.exports.getUserByID = getUserByID

/**
 * 
 * @param {string} password The password received in the POST request
 * @param {string} hash The hash of the password from the database
 * @param {*} callback function(err, isMatch) {}
 * Checks a given password against the hash to authenticate the user
 */
var checkPasswd = function(password,hash,callback){
    bcrypt.compare(password,hash,function(err,isMatch){
        if (err) throw err;
        callback(null, isMatch);
    })
};
module.exports.checkPasswd = checkPasswd

/**
 * 
 * @param {string} username The user's username
 * @param {string} email The user's email
 * @param {*} callback function(exists, user) {}
 * Checks a user exists, and returns them if they do
 */
var checkUserExists = function(username, email, callback){
    User.getUserByName(username, function(err,user){
        if (err) throw err;
        if (!user) {
            User.getUserByEmail(email, function(err, user){
                if (err) throw err;
                if (!user) {
                    return callback(false,null)
                } else {
                    return callback(true,user);
                }
            });
        } else {
            return callback(true,user);
        };
    })  
}
module.exports.checkUserExists = checkUserExists

/**
 * 
 * @param {db.user} newUser The new user to commit to the db
 * @param {*} callback function(err) {}
 * Creates a new user, and stores their information in the database
 */
var createUser = function(newUser, callback) {
    User.checkUserExists(newUser.uname,newUser.email,function(exists){
        if (!exists){
            bcrypt.genSalt(saltRounds, function(err, salt){
                if (err) throw err;
                bcrypt.hash(newUser.passwd, salt, function(err, hash) {
                    if (err) throw err;
                    newUser.passwd = hash;
                    newUser.save(callback);
                })
            });  
        } else {
            return callback('User already exists');
        }
    })            
};
module.exports.createUser = createUser

/**
 * 
 * @param {db.user} user - The user object from the db, not a uname
 * @param {string} newpass - The new password
 * Updates a user's password, storing a new hash in the db
 */
var updatePassword = function(user, newpass, callback) {
    bcrypt.genSalt(saltRounds, function(err, salt){
        if (err) throw err;
        bcrypt.hash(newpass, salt, function(err, hash) {
            if (err) throw err;
            user.passwd = hash;
            user.resettoken = null;
            user.tokenexpires = null;
            //logger.log('regis',`PassHash added! ${hash}`);
            user.save(callback(user));
        });
    });
}
module.exports.updatePassword = updatePassword

