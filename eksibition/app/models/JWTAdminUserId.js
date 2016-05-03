var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var JWTAdminSchema = new Schema({
	token: String, 
	userId: String,
	createdAt: {
		type: Date,
		expires: 60*60*24*30,
		default: Date.now
	}
});

module.exports = mongoose.model('JWTAdminUserId', JWTAdminSchema);