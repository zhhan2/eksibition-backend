var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GoodsSchema = new Schema({
	goodsType: String,
	name: String,
	price: Number,
	expiresIn: String
});

module.exports = mongoose.model('Goods', GoodsSchema);