var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AdminUserSchema = new Schema({
	id: String, 
	name: String, 
	email: String,
	password: String
});

module.exports = mongoose.model('AdminUser', AdminUserSchema);