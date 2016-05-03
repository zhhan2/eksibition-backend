var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('../config');

var resourcesMiddleware = function(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.param('token') || req.headers['x-access-token'];

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, config.app_user_secret, function(err, decoded) {          
            if (err) {
                jwt.verify(token, config.museum_user_secret, function(err, decoded) {
                    if(err){
                        jwt.verify(token, config.admin_user_secret, function(err, decoded) {
                            if(err){
                                return res.json({ success: false, message: 'Failed to authenticate token.' }); 
                            }else{
                                req.decoded = decoded;  
                                next();
                            }
                        });
                    }else{
                        req.decoded = decoded;  
                        next();
                    }
                });     
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;  
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({ 
            success: false, 
            message: 'No token provided.'
        });
        
    }
    
}