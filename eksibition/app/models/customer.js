var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CustomerSchema = new Schema({
	customerID: String,
	customerEmail: String
});

module.exports = mongoose.model('Customer', CustomerSchema);