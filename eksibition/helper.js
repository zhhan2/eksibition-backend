var User = require('./app/models/user');
var AdminUser = require('./app/models/adminUser');
var JWTUserId = require('./app/models/JWTUserId');
var JWTAdminUserId = require('./app/models/JWTAdminUserId');
var Item = require('./app/models/item');
var News = require('./app/models/news');
var Order = require('./app/models/order');
var randomstring = require("randomstring");
var Cookies = require( "cookies" );
var moment = require('moment');

exports.errorResponse = function(res, code, title, message){
	res.writeHead(code, title);
	res.write(message);
	res.end();
}

exports.userInfoWithToken = function(user, token){
	var ret = {
		userId: user.id,
		name: user.name,
		email: user.email,
		facebookId: user.facebookId,
		imageURL: user.imageURL,
		type: user.type,
		token: token
	};
	return ret;
}

exports.userInfo = function(user){
	var ret = {
		id: user.id,
		name: user.name,
		email: user.email==''?'Not Provided.':user.email
	}
	return ret;
}

exports.adminUserInfoWithToken = function(adminUser, token){
	var ret = {
		id: adminUser.id,
		name: adminUser.name,
		email: adminUser.email,
		token: token
	};
	return ret;
}

exports.createUser = function(id, name, email, password, imageURL, facebookId, socialNetwork, type){
	var ret = new User({
		id: id, 
		name: name, 
		email: email,
		password: password,
		imageURL: imageURL,
		facebookId: facebookId,
		socialNetwork: socialNetwork,
		type: type
	});
	return ret;
}

exports.generateUserId = function(){
	var date = new Date();
    var userId = date.getTime() + randomstring.generate(7);
    return userId;
}

exports.getAdminSessionToken = function(id){
	var date = new Date();
	var token = randomstring.generate(64);
	var element = new JWTAdminUserId({
		token: token,
		userId: id
	});
	element.save();
	return token;
}

exports.getItemUserOrderNewsCount = function(res){
	var itemCount, userCount, orderCount, newsCount;
	Item.find().count(function(err, count){
		if(err) throw err;
		itemCount = count;
		User.find().count(function(err, count){
			if(err) throw err;
			userCount = count;
			Order.find().count(function(err, count){
				if(err) throw err;
				orderCount = count;
				News.find().count(function(err, count){
					if(err) throw err;
					newsCount = count;
					res.send({
						item: itemCount,
						user: userCount,
						order: orderCount,
						news: newsCount
					});
				});
			});
		});
	});	
}

exports.getRecentOrder = function(res){
	Order.find({}).sort({generateDate: -1}).exec(function(err, orderList){
		if(err) throw err;
		var resData = new Array();
		if(orderList.length > 0){
        	var bound = orderList.length>5?5:orderList.length;
        	for(var i = 0; i < bound; i++){
    			resData.push({
    				name: orderList[i].purchaser,
    				email: orderList[i].email,
    				ticketId: orderList[i].ticketId,
    				generateDate: orderList[i].generateDateObject,
    				redeemedData: orderList[i].redeemedDateObject
    			});
    		}
		}
		res.send(resData);
	});
}

exports.getAllOrder = function(res){
	Order.find({}).sort({generateDate: -1}).exec(function(err, orderList){
		if(err) throw err;
		var resData = new Array();
		if(orderList.length > 0){
        	// var bound = orderList.length>5?5:orderList.length;
        	for(var i = 0; i < orderList.length; i++){
    			resData.push({
    				name: orderList[i].purchaser,
    				email: orderList[i].email,
    				date: orderList[i].generateDateObject,
    				ticketId: orderList[i].ticketId
    			});
    		}
		}
		res.send(resData);
	});
}

exports.getOrderCountOnMonths = function(res){
	var now = new Date();
	var target = moment(now);
	target.subtract(4, 'month');
	target = target.startOf('month');
	target = target.toDate();
	var genCount = [0, 0, 0, 0, 0];
	var redCount = [0, 0, 0, 0, 0];
	var months = new Array();
	for(var i = 4; i >= 0; i--){
		var tmp = moment(now);
		tmp = tmp.subtract(i, 'month');
		months.push(tmp.toDate().getMonth());
	}
	Order.find({generateDateObject: {$gt:target}},function(err, orderList){
		if(err) throw err;
		var resData = new Array();
		if(orderList.length > 0){
        	for(var i = 0; i < orderList.length; i++){
        		var redDuration = -1;
    			var genDuration = now.getMonth() - orderList[i].generateDateObject.getMonth();
    			if(orderList[i].redeemedDateObject){
    				var redDuration = now.getMonth() - orderList[i].redeemedDateObject.getMonth();
    			}
    			// if(genDuration <= 4) genCount[i]++;
    			// if(redDuration <= 4) redCount[i]++;
    			if(genDuration <= 4 && genDuration >= 0){
    				genCount[4-genDuration]++;
    			}else{
    				if(12+genDuration <= 4 && 12+genDuration>=0) genCount[12+genDuration]++;
    			}
    			if(redDuration <= 4 && redDuration >= 0){
    				redCount[4-redDuration]++;
    			}else{
    				if(12+redDuration <= 4 && 12+redDuration>=0) genCount[12+redDuration]++;
    			}
    		}
    		res.send({
    			months: months,
    			purchased: [genCount[0],genCount[1],genCount[2],genCount[3],genCount[4]],
    			redeemed: [redCount[0],redCount[1],redCount[2],redCount[3],redCount[4]]
    		});
		}else{
			res.send({
				months: [],
    			purchased: [],
    			redeemed: []
			});
		}
	});
}

exports.userMiddleWare = function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.accessToken || req.get('accessToken');
    var id = req.body.userId || req.get('userId');
    console.log("token: " + token);
    if(!token || !id){
    	return exports.errorResponse(res, 480, 'Token and userId Required.', 'Cannot operate.');
    }else{
    	JWTUserId.findOne({token:token, userId:id},function(err, result){
        	if(err) throw err;
        	if(result){
        		next();
        	}else{
        		return exports.errorResponse(res, 481, 'Token expired.', 'Cannot operate.');
        	}
        });
    } 
}

exports.adminMiddleWare = function(req, res, next) {
	var cookies = new Cookies(req, res, {});
    var token = cookies.get('eksibition-admin-access-token');
    var id = cookies.get('eksibition-admin-id');
	if(!token || !id){
    	return res.redirect("https://elvinjin.com:8081/panel/login");
    }else{
    	JWTAdminUserId.findOne({token:token, userId:id},function(err, result){
        	if(err) throw err;
        	if(result){
        		next();
        	}else{
        		return res.redirect("https://elvinjin.com:8081/panel/login");
        	}
        });
    } 
}

exports.responseWithCookie = function(res, names, values, count, code, message){
	var cookieArray = new Array();
	for(var i = 0; i < count; i++){
		cookieArray.push(names[i] + "=" + values[i]);
	}
	res.writeHead(code, {
     'Set-Cookie': cookieArray,
     'Content-Type': 'application/json'
 	});
 	res.end(JSON.stringify(message));
}

exports.responseWithAdminCookie = function (req, res, token, id, code, message){
	var cookies = new Cookies( req, res, {} );
	cookies.set("eksibition-admin-access-token", token, {domain: "elvinjin.com", secure: true});
	cookies.set("eksibition-admin-id", id, {domain: "elvinjin.com", secure: true});
	res.writeHead(code,{'Content-Type': 'application/json'});
	res.end(JSON.stringify(message));
}