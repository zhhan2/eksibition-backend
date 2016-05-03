var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemResponseDataSchema = new Schema({
	_id: String,
	beaconUUID: String,
	beaconMajor: String,
	beaconMinor: String,
	coverImage: String,
	author: String,
	country: String,
	soundtrack: String,
	images: Array,
	lat: Number,
	lng: Number,
	introduceTime: Number,
	inExhibition: Boolean,
	viewCount: Number,
	likeCount: Number,
	shareCount: Number,
	isLiked: Boolean,
	title:{
		languages: Object,
		content: Array
	},
	description:{
		languages: Object,
		content: Array
	}
});

module.exports = mongoose.model('ItemResponseData', ItemResponseDataSchema);