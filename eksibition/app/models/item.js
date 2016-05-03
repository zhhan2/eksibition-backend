var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemSchema = new Schema({
	beaconUUID: String,
	beaconMajor: String,
	beaconMinor: String,
	title: String, 
	coverImage: String,
	author: String,
	country: String,
	description: String,
	soundtrack: String,
	images: Array,
	lat: Number,
	lng: Number,
	introduceTime: Date,
	inExhibition: Boolean,
	views: [String],
	likes: [String],
	shareCount: Number,
	title_zh_t: String,
	title_zh_s: String,
	description_zh_t: String,
	description_zh_s: String
});

module.exports = mongoose.model('Item', ItemSchema);