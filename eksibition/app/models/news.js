var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NewsSchema = new Schema({
	newsId: String,
	title: String,
	title_zh_s: String,
	title_zh_t: String,
	time: Number,
	image: String,
	content: String,
	content_zh_s: String,
	content_zh_t: String
});

module.exports = mongoose.model('News', NewsSchema);