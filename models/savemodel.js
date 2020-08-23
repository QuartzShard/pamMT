var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Layout and type constraints of save objects in the database
var saveSchema = new Schema(
    {
        owner:{},
        filename: {
            type:String,
            required: true,
        },
        displayName: {
            type:String,
            required:true,
        },
        dateCreated:{
            type:Date,
            required:true,
        },
        dateModified:{
            type:Date,
            required:true,
        },
    }
); 

//Export the schema
var Save = module.exports = mongoose.model('save', saveSchema);    

//Database methods
/**
 * 
 * @param {Mongoose.ObjectID} UID User's ID
 * @param {String} filename The filename
 * @param {*} callback function(saveEntry) {}
 * Finds a save in the database, or returns undefined if there isn't one.
 */
var findSave=function(UID,filename,dname,callback) {
    Save.findOne({'owner':UID,'filename':filename,'displayName':dname},function(err,saveEntry){
        if (err) throw err;
        return callback(saveEntry);
    })
}
module.exports.findSave = findSave;

/**
 * 
 * @param {String} filename The filename
 * @param {*} callback function(saveEntry) {}
 * Finds a save in the database, or returns undefined if there isn't one.
 */
var findSaveNameOnly=function(filename,callback) {
    Save.find({'displayName':filename},function(err,saveEntries){
        if (err) throw err;
        return callback(saveEntries);
    })
}
module.exports.findSaveNameOnly = findSaveNameOnly;