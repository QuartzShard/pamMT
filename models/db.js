var mongoose = require('mongoose'); 
//URL for the database
var mongoDB = 'mongodb://192.168.1.92/pamMT'; 
//Connection setup           
mongoose.connect(mongoDB, { useNewUrlParser: true });
//Create an instance of the db connection
var db = mongoose.createConnection(mongoDB, { useNewUrlParser: true })
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
//Include the models
require('./usermodel')
require('./savemodel')
require('./user-savesmodel')

//export the models
module.exports.user = db.model('user')
module.exports.save = db.model('save')
module.exports.link = db.model('link')
