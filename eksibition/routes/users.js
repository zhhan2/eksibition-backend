var express = require('express');
var User = require('../app/models/user');
var JWTUserId = require('../app/models/JWTUserId');
var randomstring = require("randomstring");
var fs = require('fs');
var multipart = require('connect-multiparty');
var jwt = require('jsonwebtoken');
var config = require('../config'); // get our config file
var multipartMiddleware = multipart();
var appHelper = require('../helper.js');
var router = express.Router();

/* GET all users */
// router.get('/all', function(req, res) {
// 	User.find({},function(err, userList){
// 		if (err) {
// 			res.status(480).send(err);
// 		}else{
// 			res.status(200).send(userList);	
// 		}
// 	});
// });

router.get('/:id', function(req, res){
	var id = req.params.id;
	User.find({"id": id}, function(err, userList){
		if (err) {
			appHelper.errorResponse(res, 480, 'Internal database error', 'Cannot get user.');
		}else{
			if (userList.length == 0) {
			    appHelper.errorResponse(res, 481, 'Invalid user id.', 'Can not find any matching record.');
			} else {
				res.status(200).send({
					name: userList[0].name,
					email: userList[0].email,
					imageURL: userList[0].imageURL
				});
			}
		}
	});
});

router.post('/register', function(req, res){
	var type = req.body.type;
	if(!type){
		type = "email";
	}
	var email = req.body.email;
	if(!email || email == ""){
		appHelper.errorResponse(res, 480, 'User email required.', 'Can not register.');
	}
	var password = req.body.password;
	if(!password || password == ""){
		appHelper.errorResponse(res, 480, 'User password required.', 'Can not register.');
	}
	var name = req.body.name;
	if (!name) name = email;
	var id = generateUserId();
	var user = appHelper.createUser(id, name, email, password, '', '', '', 'email');
// check if this is a new user
	User.findOne({email: email, type: 'email'}, function(err, result){
		if(err) throw err;
		if(result){
			appHelper.errorResponse(res, 481, 'Email has been used.', 'Can not register.');
		}else{
			// new user
			User.findOne({email:email, type:'both'}, function(err, result){
				if(err) throw err;
				if(result){
					appHelper.errorResponse(res, 481, 'Email has been used.', 'Can not register.');
				}else{
					user.save(function(err){
						if(err){
				    		appHelper.errorResponse(res, 480, 'Internal database error', 'Cannot save user.');
				    	}else{
				    		var token = getSessionToken(user.id);
							var resData = appHelper.userInfoWithToken(user, token);
				    		res.status(200).send(resData);
				    	}
					});
				}
			});
		}
	});
});

router.post('/login', function(req, res){
	var type = req.body.type;
	if(!type){
		appHelper.errorResponse(res, 480, 'Login type required.', 'Cannot login.');
	}
	if(type == "email"){
		var email = req.body.email;
		var password = req.body.password;
		if(!email || !password || email == "" || password == ""){
			appHelper.errorResponse(res, 480, 'Email and password required.', 'Cannot login.');
		}
		User.findOne({email: email, password: password},function(err, result){
			if(err){
				// throw err;
				appHelper.errorResponse(res, 480, 'Internal database error', 'Cannot find user.');
			}
			if(!result){
				appHelper.errorResponse(res, 481, 'Email or password invalid.', 'Cannot login.');
			}else{
				// if(result.password != password){
				// 	res.status(481).send({
				// 		success: false,
				// 		message: "Wrong password."
				// 	});	
				// }else{
					var token = getSessionToken(result.id);
					var resData = appHelper.userInfoWithToken(result, token);
					res.status(200).send(resData);
				// }
			}
		});
	}else if(type == "facebook"){
		var facebookId = req.body.facebookId;
		if(!facebookId){
			return appHelper.errorResponse(res, 480, 'facebookId required.', 'Connot register.');
		}
		var name = req.body.name;
		if(!name) name = '';
		var imageURL = req.body.imageURL;
		if(!imageURL) imageURL = '';
		var email = req.body.email;
		if(!email) email = '';
		var target;
		User.findOne({facebookId: facebookId}, function(err, result){
			if(err){
				appHelper.errorResponse(res, 480, 'Internal database error', 'Cannot find user.');
			}
			if(!result){
				// new user
				var uId = generateUserId();
				var user = appHelper.createUser(uId, name, email, '', imageURL, facebookId, 'facebook', 'facebook');
				target = user;
				user.save(function(err){
					if(err) appHelper.errorResponse(res, 480, 'Internal database error', 'Cannot save user.');
				});
			}else{
				var needToUpdate = false;
				// update user info
				if(name != ''){
					if(name != result.name){
						result.name = name;
						needToUpdate = true;
					}
				}
				if(imageURL != ''){
					if(imageURL != result.imageURL){
						result.imageURL = imageURL;
						needToUpdate = true;
					}
				}
				if(needToUpdate){
					result.save();
				}
				target = result;
			}
			var token = getSessionToken(target.id);
			var resData = appHelper.userInfoWithToken(target, token);
			res.status(200).send(resData);
		});
	}else{
		// unknown login type
		appHelper.errorResponse(res, 480, 'Unknown login type', 'Cannot login.');
		return;
	}
});

router.post('/bind', function(req,res){
	var token = req.body.token;
	var facebookId = req.body.facebookId;
	if(token){
		JWTUserId.findOne({token: token}, function(err, targetToken){
			if(err) throw err;
			if(!targetToken){
				appHelper.errorResponse(res, 480, 'Invalid Token.', 'Cannot operate.');
			}else{ 
            	if(!facebookId || facebookId == ""){
					return appHelper.errorResponse(res, 480, 'facebookId required.', 'Cannot operate.');
				}
            	User.findOne({facebookId:facebookId}, function(err, result){
            		if(result){
            			return appHelper.errorResponse(res, 481, 'facebook account used.', 'Cannot operate.');
            		}else{
            			User.findOne({id:decoded.id}, function(err, targetUser){
	                		targetUser.facebookId = facebookId;
	                		targetUser.type = 'both';
	                		targetUser.save();
	                	});
	                	targetToken.createdAt = new Date();
	                	targetToken.save(function(err){
	                		if (err) throw err;
	                		return res.status(200).send({success: true, message: 'User information updated! Token updated!'});
	                	});
            		}
            	});     
			}
		});
	}else{
		appHelper.errorResponse(res, 480, 'Token required.', 'Cannot operate.');
	}
});

router.post('/logout', function(req, res){
	var token = req.body.token;
	JWTUserId.deleteOne({token:token},function(err,result){
		if (err) throw err;
		res.status(200).send();
	});
});

// router.use(appHelper.adminMiddleWare);

router.post('/all', function(req, res){
	User.find({},function(err, userList){
		if (err) {
			res.status(480).send(err);
		}else{
			// res.status(200).send(userList);	
			var resData = new Array();
			for(var i=0; i<userList.length; i++){
				resData.push(appHelper.userInfo(userList[i]));
			}
			res.send(resData);
		}
	});
});

function generateUserId(){
	var date = new Date();
    var userId = date.getTime() + randomstring.generate(7);
    return userId;
}

function getSessionToken(id){
	var date = new Date();
	var token = randomstring.generate(64);
	var element = new JWTUserId({
		token: token,
		userId: id
	});
	element.save();
	return token;
}

function getTargetPath(originalName){
	var temp = originalName.split('.');
    var extention = temp[temp.length-1];
    var date = new Date();
    var newName = date.getTime() + randomstring.generate(6);
    var targetPath = '/home/deploy/eksibition_api/eksibition/resources/users/' + newName + '.' + extention;
    var location = '/resources/users/' + newName + '.' + extention;
    return [targetPath, location];
}

module.exports = router;
