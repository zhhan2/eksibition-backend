var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	id: String, 
	name: String, 
	email: String,
	password: String,
	imageURL: String,
	facebookId: String,
	socialNetwork: String,
	type: String
});

module.exports = mongoose.model('User', UserSchema);