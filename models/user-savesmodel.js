var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Layout and type constraints of save objects in the database
var linkSchema = new Schema(
    {
        user:{
            type:Schema.Types.ObjectId,
            ref: "user"
        },
        saveFile:{
            type:Schema.Types.ObjectId,
            ref:"save"
        },
        authLevel:{
            type:Number,
            required: true,
        },
    }
); 

//Export the schema
var Link = module.exports = mongoose.model('link', linkSchema);    

//Database methods

/**
 * 
 * @param {Mongoose.ObjectID} UID User's ID
 * @param {Mongoose.ObjectID} SID Save ID
 * @param {*} callback function(linkEntry) {}
 */
var findSave=function(UID,SID,callback) {
    Link.findOne({'user':UID,'saveFile':SID},function(err,linkEntry){
        if (err) throw err;
        return callback(linkEntry);
    })
}
module.exports.findSave = findSave;

/**
 * 
 * @param {Mongoose.ObjectID} user The user whose saves to check
 * @param {String} savename The display name of the save
 * @param {*} callback function(saveFile) {}
 * Finds all linked saves for a user, and checks them for the search term
 */
var findSaveByDName=function(user,savename,callback) {
    Link.find({'user':user.id}).populate('saveFile').then((linkres) => {
        var names = []
        for (let i of linkres) {
            names.push(i.saveFile.displayName);
        }
        if (names.includes(savename)){
            return callback(linkres[names.indexOf(savename)].saveFile)
        } else {
            return callback(null)
        }
    })
}
module.exports.findSaveByDName = findSaveByDName;
/**
 * 
 * @param {Mongoose.ObjectID} UID User's ID
 * @param {Mongoose.ObjectID} SID Save ID
 * @param {*} callback function(canAccess, authLevel)
 * Checks if a user can access a given save, and returns a boolean and their authevel
 */
var canAccess=function(UID,SID,callback){
    Link.findOne({'user':UID,'saveFile':SID},function(err,linkEntry){
        if (err) throw err;
        if (!linkEntry) {
            return callback(false, -1)
        } else {
            return callback(true, linkEntry.authLevel)
        }
    })
}
module.exports.canAccess = canAccess