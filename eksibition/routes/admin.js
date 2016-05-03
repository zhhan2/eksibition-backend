var express = require('express');
var router = express.Router();
var Item = require('../app/models/item');
var AdminUser = require('../app/models/adminUser');
var jwt = require('jsonwebtoken');
var config = require('../config');
var appHelper = require('../helper.js');
var multipart = require('connect-multiparty');
var randomstring = require("randomstring");
var JWTAdminUserId = require('../app/models/JWTAdminUserId');
var multipartMiddleware = multipart();

router.get('/panel',function(req, res){
  res.redirect("https://elvinjin.com:8081/html/panel/login.html");
});

router.post('/signup', multipartMiddleware, function(req, res){
	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;
	if(!name || !email || !password){
		return appHelper.errorResponse(res, 480, 'Information not enough.', 'Cannot signup.');
	}
	AdminUser.findOne({email:email}, function(err, result){
		if(err) throw err;
		if(result){
			return appHelper.errorResponse(res, 481, 'Email used.', 'Cannot signup.');
		}else{
			var id = generateUserId();
			var admin = new AdminUser({
				id: id,
				name: name,
				email: email,
				password: password
			});
			admin.save(function(err){
				if(err) throw err;
				var token = appHelper.getAdminSessionToken(id);
				var resData = appHelper.adminUserInfoWithToken(admin, token);
				res.send(resData);
			});
		}
	});
});

router.post('/login', multipartMiddleware, function(req, res){
	var name = req.body.name;
	var password = req.body.password;
	var loginWithEmail = validateEmail(name);
	if(!name || !password){
		return appHelper.errorResponse(res, 480, 'Information not enough.', 'Cannot login.');
	}
	if(loginWithEmail){
		AdminUser.findOne({email:name, password:password}, function(err, result){
			if(err) throw err;
			if(result){
				var token = appHelper.getAdminSessionToken(result.id);
				// var resData = appHelper.adminUserInfoWithToken(result, token);
				return appHelper.responseWithAdminCookie(req, res, token, result.id, 200, {success: true});
			}else{
				return appHelper.errorResponse(res, 481, 'Invalid email, username or password.', 'Cannot login.');
			}
		});
	}else{
		AdminUser.findOne({name:name, password:password}, function(err, result){
			if(err) throw err;
			if(result){
				var token = appHelper.getAdminSessionToken(result.id);
				// var resData = appHelper.adminUserInfoWithToken(result, token);
				return appHelper.responseWithAdminCookie(req, res, token, result.id, 200, {success: true});
			}else{
				return appHelper.errorResponse(res, 481, 'Invalid email, username or password.', 'Cannot login.');
			}
		});
	}
});

router.post('/check', function(req,res){
	var token = req.body.accessToken;
	var userId = req.body.userId;
	console.log(req.body);
	JWTAdminUserId.findOne({token:token, userId:userId},function(err, result){
		if(result){
			res.send({success:true});
		}else{
			res.send({success:false});
		}
	});
});

router.use(appHelper.adminMiddleWare);

router.post('/count', function(req, res){
	appHelper.getItemUserOrderNewsCount(res);
});

router.post('/recentOrder', function(req, res){
	appHelper.getRecentOrder(res);
});

router.post('/allOrder', function(req, res){
	appHelper.getAllOrder(res);
});

router.post('/orderCountOnMonths', function(req, res){
	appHelper.getOrderCountOnMonths(res);
});


function generateUserId(){
	var date = new Date();
    var userId = date.getTime() + randomstring.generate(7);
    return userId;
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

module.exports = router;