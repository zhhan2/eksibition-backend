var express = require('express');
var router = express.Router();
var User   = require('./app/models/user');
var config = require('./config'); // get our config file
var jwt = require('jsonwebtoken');
/* GET users listing. */
router.post('/', function(req, res) {

	// find the user
	User.findOne({
		name: req.body.name
	}, function(err, user) {

		if (err) throw err;

		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {

			// check if password matches
			if (user.password != req.body.password) {
				res.json({ success: false, message: 'Authentication failed. Wrong password.' });
			} else {

				// if user is found and password is right
				// create token according to different types of user
				var token;
				if(user.appUser){
					token = jwt.sign(user, config.app_user_secret, {
						expiresInMinutes: 1440 // expires in 24 hours
					});
				}else if(user.museumUser){
					token = jwt.sign(user, config.museum_user_secret, {
						expiresInMinutes: 1440 // expires in 24 hours
					});
				}else if(user.admin){
					token = jwt.sign(user, config.admin_user_secret, {
						expiresInMinutes: 1440 // expires in 24 hours
					});
				}else{
					res.json({
						success: false,
						message: 'unknown user type.'
					});
					return;
				}
				res.json({
					success: true,
					message: 'Enjoy your token!',
					token: token
				});
			}		

		}

	});
});

module.exports = router;
