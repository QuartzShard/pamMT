var express = require('express');
var fs = require('fs');
var bodyparser = require('body-parser');
var urlencodedparser = bodyparser.urlencoded({extended:false})
var router = express.Router();
var db = require('../models/db')

/*Save POST*/
router.post('/save',urlencodedparser,function(req,res,next){
    var user = req.user;
    if (!user) {
        return res.send(["Access Denied",false,false]);
    }
    var data = JSON.parse(Object.keys(req.body))
    var writestring = JSON.stringify(data.sav);
    var filename = data.fname || user.uname+Date.now()
    var displayName = data.dispName
    fs.writeFile('/home/quartzshard/web/pammt/saves/'+filename,writestring,function(err){
        if (err) throw err;
        db.save.findSave(user.id,filename,displayName,function(saveEntry){
            if (!saveEntry){
                savesEntry = new db.save({'owner':user.id,'filename':filename,'displayName':displayName,'dateCreated':Date.now(),'dateModified':Date.now()})
                savesEntry.save(function(err,saveEntry){
                    link(err,user,saveEntry)
                })
            } else {
                saveEntry.dateModified = Date.now()
                saveEntry.save()
            }
        })
    });
    return res.send(["Simulation Saved",filename,displayName]);

    
})

/*Load GET*/
router.get('/load',urlencodedparser,function(req,res,next){
    var user = req.user;
    if(!user) {
        return res.send('{"denied":true}')
    }
    var filename = req.query.fname
    db.link.findSaveByDName(user, filename, function(saveFile){
        if (!saveFile){
            return res.send('{"denied":true}')
        } else {
            fs.readFile('/home/quartzshard/web/pammt/saves/'+saveFile.filename,function(err,file){
                if (err) throw err;
                file = JSON.parse(file)
                return res.send(JSON.stringify({file:file,filename:saveFile.filename}))
            })
        }
    })
})

/**
 * 
 * @param {*} err Any errors from db operations
 * @param {*} user The user to create the link for
 * @param {*} saveEntry The new save entry
 * Links a new save to the user who created it
 */
var link = function(err,user,saveEntry) {
    if (err) throw err;
    db.link.findSave(user.id,saveEntry.id,function(linkEntry){
        if (!linkEntry) {
            linkEntry = new db.link({'user':user.id,'saveFile':saveEntry.id,'authLevel':0});
            linkEntry.save();
        }
    })
}

module.exports = router