var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OrderSchema = new Schema({
	email: String,
	amount: Number,
	purchaser: String,
	generateDate: Number,
	redeemedDate: Number,
	generateDateObject: Date,
	redeemedDateObject: Date,
	ticketId: String,
	type: String,
	valid: Boolean,
	userId: String
});

module.exports = mongoose.model('Order', OrderSchema);