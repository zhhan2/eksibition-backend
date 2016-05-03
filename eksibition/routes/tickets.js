var express = require('express');
var router = express.Router();
var config = require('../config');
var jwt = require('jsonwebtoken');
var Customer = require('../app/models/customer');
var Goods = require('../app/models/goods');
var Order = require('../app/models/order');
var randomstring = require("randomstring");
var createTemplate = require("passbook");
var jsonfile = require('jsonfile');
var fs = require('fs');
var stripe = require("stripe")(config.stripe_key);
var moment = require("moment");
var appHelper = require('../helper.js');



router.post('/generatePass', function(req, res){
	var ticketId = req.body.ticketId;
	Order.find({"ticketId":ticketId}, function(err, orderArray){
		if(err) res.send(err);
		if(orderArray.length == 0){
            res.status(481).send({
                success : false,
                message : 'Can not find any order matching this ticket Id!'
            });
        }else{
        	var order = orderArray[0];
        	var valid = order.valid;
        	if(valid){
        		var description = "Eksibition Single Pass";
        		var validFrom = moment(order.generateDateObject);
        		console.log(validFrom.format("YYYY-MM-DDThh:mmZ"));
				var passJson = {
				  "formatVersion" : 1,
				  "passTypeIdentifier" : "pass.com.elvinjin.Eksibition",
				  "serialNumber" : ticketId,
				  "teamIdentifier" : "HP634A2CZK",
				  "barcode" : {
				    "message" : ticketId,
				    "format" : "PKBarcodeFormatQR",
				    "messageEncoding" : "iso-8859-1"
				  },
				  "organizationName" : "Eksibition Team",
				  "description" : "CUHK Museum 1-Day Pass",
				  "foregroundColor" : "rgb(255, 255, 255)",
				  "backgroundColor" : "rgb(60, 65, 76)",
				  "labelColor": "rgb(177, 189, 213)",
				  "eventTicket" : {
				    "headerFields" : [
				      {
				        "dateStyle" : "PKDateStyleMedium",
				        "key" : "valid_from",
				        "label" : "Valid From",
				        "value" : validFrom.format("YYYY-MM-DDThh:mmZ")
				      }
				    ],
				    "primaryFields" : [
				      {
				        "key" : "event",
				        "label" : "EVENT",
				        "value" : "Paintings by CUHK Students"
				      }
				    ],
				    "secondaryFields" : [
				        {
				          "key" : "loc",
				          "label" : "LOCATION",
				          "value" : "SHB 611, CUHK"
				        }, 
				        {
				          "key" : "ticket_type",
				          "label" : "Ticket Type",
				          "value" : "1-Day Pass"
				        },
				        {
				            "isRelative" : true,
				            "key" : "doors-open",
				            "label" : "Doors Open",
				            "timeStyle" : "PKDateStyleShort",
				            "value" : "2015-12-10T09:30+08:00"
				        }
				      ]
				    }
				};
				console.log("pass template json: " + passJson);
				// passJson.serialNumber = ticketId;
				var template = createTemplate("eventTicket",passJson);
				template.keys("/home/deploy/eksibition_api/eksibition/data/pass/certificate", "qazwsx123");
				template.loadImagesFrom("/home/deploy/eksibition_api/eksibition/data/pass/resources");
				var pass = template.createPass({
					serialNumber:  ticketId,
					description:   description
				});
				var fileName = ticketId + ".pkpass";
				var file = fs.createWriteStream(fileName);
				pass.on("error", function(error) {
				  console.error(error);
				  process.exit(1);
				});
				pass.pipe(file);
				pass.render(res, function(error) {
				    if (error)
				      console.error(error);
				  	fs.unlink(fileName, function(err){
				  		if(err) throw err;
				  	});
				});
        	}
        }
	});
});

router.post('/redeem', function(req, res){
    var ticketId = req.body.ticketId; 
    console.log("ticketId:" + ticketId);
    if (ticketId) {
        Order.find({"ticketId":ticketId},function(err,orderArray){
        	if (err) res.send(err);
        	if(orderArray.length == 0){
                res.status(481).send({
                    success : false,
                    error : 'Can not find any order matching this ticket Id!'
                });
            }else{
            	var order = orderArray[0];
            	var valid = order.valid;
            	if(valid){
            		var date = new Date();
            		order.redeemedDateObject = date;
            		order.redeemedDate = parseInt(date.getTime());
            		order.valid = false;
            		order.save(function (err){if (err) res.send(err);});
            		res.status(200).send({
	                    email: order.email,
						amount: order.amount,
						purchaser: order.purchaser,
						generateDate: order.generateDate,
						redeemedDate: order.redeemedDate,
						ticketId: order.ticketId,
						type: order.type,
						valid: order.valid,
						userId: order.userId
                	});
            	}else{
            		res.status(480).send({
            			error: "This ticket is already redeemed!",
	                    redeemedTime : order.redeemedDate
                	});
            	}
            }
        });

    } else {
       // if there is no token
        // return an error
        return res.status(403).send({ 
            success: false, 
            message: 'No ticket id provided.'
        });
        
    }
});



// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
router.use(appHelper.userMiddleWare);

router.post('/pay', function(request, res){

	var stripeToken = request.body.stripe_token;
	var amount = request.body.amount;
	var description = request.body.description;
	var idempotencyKey = "sdsd";
	var contact = request.body.contact;
	var email = contact.email;
	var phone = contact.phone;
	var userId = request.body.userId;
	var quantity = request.body.quantity;
	var name = contact.first_name + " " + contact.last_name;
console.log(request.body);
	stripe.charges.create({
		  amount: amount, // amount in cents, again
		  currency: "usd",
		  source: stripeToken,
		  description: "Charges from " + email + ".",
		  receipt_email: email
		},function(err, charge) {
		  if (err) {
		    // The card has been declined
		    res.send(err);
		  }else{
		  	var ticketArray = [];
		  	for (var i = 0; i < quantity; i++){
		  		var token = generateTicketId(email, amount, userId, name, "single-pass");
		  		ticketArray.push(token);
		  	}
			res.status(200).json(ticketArray);
		  }
		});
});

router.get('/getTicketId', function(req, res){
	var ticket = generateTicketId("test@email.com", 2000, "thisisauserId", "test name", "single-pass");
	res.send(ticket);
});



router.get('/orderHistory/:userId', function(req, res){
	var userId = req.params.userId;
	if(!userId || userId == ''){
		var emptyArray = new Array();
		return res.send(emptyArray);
	}
	Order.find({"userId":userId},function(err,orderArray){
    	if (err) res.send(err);
    	res.json(orderArray.sort(sortOrders));
    
    });
});

module.exports = router;

function createNewCustomer(stripeToken, email){
	var ret;
	stripe.customers.create({
	  source: stripeToken,
	  email: email
	}).then(function(customer) {
		saveCustomerInfoToDB(customer.id, email);
		ret = customer.id;
	});
	return ret;
}

function saveCustomerInfoToDB(Id, email){
	var customerInfo = new Customer();
	customerInfo.customerId = customerId;
	customerInfo.customerEmail = email;
	customerInfo.save(function(err){
	  	if(err) throw err;
  	});
}

function generateTicketId(email, amount, userId, name, type){
	var date = new Date();
	var ticketId = date.getTime() + randomstring.generate(6);
	var order = new Order({
		email: email,
		amount: amount,
		purchaser: name,
		generateDateObject: date,
		generateDate: parseInt(date.getTime()),
		ticketId: ticketId,
		type: type,
		valid: true,
		userId: userId
	});
	order.save(function(err){
		if(err) throw err;
	});
	return order;
}

function sortOrders(a, b){
	return b.generateDate - a.generateDate;
}
