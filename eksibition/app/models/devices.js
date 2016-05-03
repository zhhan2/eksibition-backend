var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var devicesSchema = new Schema({
	token: String
});

module.exports = mongoose.model('Devices', devicesSchema);