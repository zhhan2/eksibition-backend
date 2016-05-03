var express = require('express');
var Devices = require('../app/models/devices');
var router = express.Router();

// push one notofication
router.post('/', function(req, res){
    if(req.body.deviceToken.length == 73){
        var deviceToken = req.body.deviceToken;
        Devices.find({'token':deviceToken},function(err,deviceArray){
        if (err) res.send(err);
        if (deviceArray.length == 0) {
            var newDevice = new Devices({
                token: deviceToken
            });
            newDevice.save(function(err){
                if(err) throw err;
                res.json({
                  'message' : 'New device registered!'
                });
            });
        }else{
            res.json({
              'message' : 'This device is already registered!'
            });
        }
        });
    }else{
        res.json({
            'message' : 'Invalid token!'
        });
    }
    
});


module.exports = router;
