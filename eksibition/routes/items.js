var express = require('express');
var router = express.Router();
var Item = require('../app/models/item');
var ItemResponseData = require('../app/models/itemResponseData');
var multipart = require('connect-multiparty');
var jwt = require('jsonwebtoken');
var config = require('../config');
var randomstring = require("randomstring");
var mkdirp = require('mkdirp');
var fs = require('fs');
var appHelper = require('../helper.js');
var chineseConv = require('chinese-conv');
var multipartMiddleware = multipart();
// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
// router.use(function(req, res, next) {

//     // check header or url parameters or post parameters for token
//     var token = req.body.token || req.param('token') || req.headers['x-access-token'];

//     // decode token
//     if (token) {
//         // verifies secret and checks exp
//         jwt.verify(token, config.app_user_secret, function(err, decoded) {          
//             if (err) {
//                 jwt.verify(token, config.museum_user_secret, function(err, decoded) {
//                     if(err){
//                         jwt.verify(token, config.admin_user_secret, function(err, decoded) {
//                             if(err){
//                                 return res.json({ success: false, message: 'Failed to authenticate token.' }); 
//                             }else{
//                                 req.decoded = decoded;  
//                                 next();
//                             }
//                         });
//                     }else{
//                         req.decoded = decoded;  
//                         next();
//                     }
//                 });     
//             } else {
//                 // if everything is good, save to request for use in other routes
//                 req.decoded = decoded;  
//                 next();
//             }
//         });

//     } else {

//         // if there is no token
//         // return an error
//         return res.status(403).send({ 
//             success: false, 
//             message: 'No token provided.'
//         });
        
//     }
    
// });
router.get('/itemList', function(req, res){
    Item.find({"inExhibition": true},function(err, itemList){
        if (err){
            return appHelper.errorResponse(res, 480, 'Internal databse error.', 'Cannot get items.');
        }
        return res.status(200).send(itemList);
    });
});

// router.get('/:_id', function(req, res){
//     var _id = req.params._id;
//     Item.findOne({_id:_id}, function(err, item){
//         if(err){
//             return res.status(480).send(err);
//         }
//         if(item){
//             return res.status(200).send(item);
//         }else{
//             return res.status(481).send({success:false, message:"Invalid Id"});
//         }
//     });
// });

router.get('/all', function(req, res) {
    Item.find({"inExhibition": true},function(err, itemArray){
        var reponseArray = [];
        var deviceId = req.get("deviceId");
        for(var i = 0; i < itemArray.length; i++){
            var item = itemArray[i];
            var isLiked = false;
            var resData = new ItemResponseData();
            resData._id = item._id;
            resData.beaconUUID = item.beaconUUID;
            resData.beaconMajor = item.beaconMajor;
            resData.beaconMinor = item.beaconMinor;
            // resData.title = item.title;
            resData.coverImage = item.coverImage;
            resData.author = item.author;
            resData.country = item.country;
            // resData.description = item.description;
            resData.soundtrack = item.soundtrack;
            resData.images = item.images;
            resData.lat = item.lat;
            resData.lng = item.lng;
            // resData.introduceTime = parseInt(item.introduceTime.getTime());
            resData.inExhibition = item.inExhibition;
            resData.viewCount = item.views.length;
            resData.likeCount = item.likes.length;
            resData.shareCount = item.shareCount;
            resData.title.languages = {
                "en-US" : 0,
                "zh-Hant" : 1,
                "zh-Hans" : 2
            };
            resData.title.content.push(item.title);
            resData.title.content.push(item.title_zh_t);
            resData.title.content.push(item.title_zh_s);
            resData.description.languages = {
                "en-US" : 0,
                "zh-Hant" : 1,
                "zh-Hans" : 2
            };
            resData.description.content.push(item.description);
            resData.description.content.push(item.description_zh_t);
            resData.description.content.push(item.description_zh_s);
            for (var k = 0; k < item.likes.length; k++) {
                if(deviceId == item.likes[k]){
                    isLiked = true;
                    break;
                }
            }
            resData.isLiked = isLiked;
            reponseArray.push(resData);
        }
        for(var i = 0; i < reponseArray.length - 1; i++){
            if(parseInt(reponseArray[i].beaconMinor) > parseInt(reponseArray[i+1].beaconMinor)){
                var tmp = reponseArray[i+1];
                reponseArray[i+1] = reponseArray[i];
                reponseArray[i] = tmp;
            }
        }
        res.json(reponseArray);
    })
});

router.get('/:uuid/:major/:minor', function(req, res) {
    Item.find({"beaconUUID": req.params.uuid, 
        "beaconMajor": req.params.major, 
        "beaconMinor": req.params.minor},
        function(err, itemArray){
            if (err) res.send(err);
            if (itemArray.length == 0) {
                // res.status(481).send({
                //     success : false,
                //     error : 'Can not find any item matching!'
                // });
                appHelper.errorResponse(res, 481, 'No recorde matches.', 'Cannot get item.');
            } else {
            	var item = itemArray[0];
                var deviceId = req.get("deviceId");
               	console.log("deviceId: " + deviceId);
	 	        var isLiked = false;
                var resData = new ItemResponseData();
                resData._id = item._id;
                resData.beaconUUID = item.beaconUUID;
                resData.beaconMajor = item.beaconMajor;
                resData.beaconMinor = item.beaconMinor;
                // resData.title = item.title;
                resData.coverImage = item.coverImage;
                resData.author = item.author;
                resData.country = item.country;
                // resData.description = item.description;
                resData.soundtrack = item.soundtrack;
                resData.images = item.images;
                resData.lat = item.lat;
                resData.lng = item.lng;
                // resData.introduceTime = parseInt(item.introduceTime.getTime());
                resData.inExhibition = item.inExhibition;
                resData.viewCount = item.views.length;
                resData.likeCount = item.likes.length;
                resData.shareCount = item.shareCount;
                resData.title.languages = {
                    "en-US" : 0,
                    "zh-Hant" : 1,
                    "zh-Hans" : 2
                };
                resData.title.content.push(item.title);
                resData.title.content.push(item.title_zh_t);
                resData.title.content.push(item.title_zh_s);
                resData.description.languages = {
                    "en-US" : 0,
                    "zh-Hant" : 1,
                    "zh-Hans" : 2
                };
                resData.description.content.push(item.description);
                resData.description.content.push(item.description_zh_t);
                resData.description.content.push(item.description_zh_s);
                for (var i = 0; i < item.likes.length; i++) {
                    if(deviceId == item.likes[i]){
                        isLiked = true;
                        break;
                    }
                }
                resData.isLiked = isLiked;
                res.json(resData);
            }
    })
});

router.get('/:_id', function(req, res){
    Item.findById(req.params._id, function(err,item){
        if (err) throw err; 
        if(item){
            res.status(200).send(item);
        }else{
            // res.status(481).send({
            //     success: false,
            //     message: "No matching item."
            // });
            appHelper.errorResponse(res, 481, 'No recorde matches.', 'Cannot get item.');
        }
    });
});

router.put('/view', function(req, res){
    var id = req.body._id;
    var deviceId = req.body.deviceId;
    Item.findById(id, function(err,item){
        if (err) throw err; 
        // item.likeCount++;
        var isViewed = false;
        for(var i = 0; i < item.views.length; i++){
            if(item.views[i] == deviceId){
                isViewed = true;
                break;
            }
        }
        if(!isViewed){
            item.views.push(deviceId);
        }
        item.save(function(err){
            if (err) res.send(err);
            res.json({
                'isViewed': true,
                'viewCount': item.views.length
            });
        });
    })
});

router.put('/like', function(req, res){
    var id = req.body._id;
    var deviceId = String(req.body.deviceId);
    Item.findById(id, function(err, item){
        if (err) throw err; 
        // item.likeCount++;
        var isLiked = false;
        var index = 0;
        for(var i = 0; i < item.likes.length; i++) {
            if(item.likes[i] == deviceId){
                isLiked = true;
                index = i;
                break;
            }
        }
        if(!isLiked){
            item.likes.push(deviceId);
            item.save(function(err){
                if (err) console.log(err);
                res.json({
                    'isLiked': true,
                    'likeCount': item.likes.length
                });
            });
        }else{
            // item.like = item.like.slice(0,index+1).concat(item.like.slice(index+1,item.like.length+1));
            if(index == 0){
                item.likes.shift();
            }else if(index == item.likes.length-1){
                item.likes.pop();
            }else{
                item.likes = item.likes.splice(0,index+1).concat(item.likes.splice(index+1,item.likes.length+1));
            }
            item.save(function(err){
                if (err) console.log(err);
                res.json({
                    'isLiked': false,
                    'likeCount': item.likes.length
                });
            });
        }
    });
});

router.put('/share', function(req, res){
    var id = req.body._id;
    Item.findById(id, function(err,item){
        item.shareCount++;
        item.save(function(err){
            if (err) res.send(err);
            res.json({ message: 'Item ' + id + ' share count updated!' });
        });
    })
});

router.use(appHelper.adminMiddleWare);

router.post('/new', multipartMiddleware, function(req, res){
    var title = req.body.title;
    var title_zh = req.body.title_zh;
    if (!title_zh) title_zh = title;
    var author = req.body.author;
    if(!author) author = "unkonwn";
    var lat = req.body.lat;
    var lng = req.body.lng;
    var description = req.body.description;
    var description_zh = req.body.description_zh;
    if (!description_zh) description_zh = "暂无中文描述。";
    var uuid = req.body.uuid;
    var major = req.body.major;
    var minor = req.body.minor;
    var galleryFolderName = parseToFolderName(title);

    // dealing with the files
    var coverImagePath = saveCoverImage(title, req.files.coverImage);
    var galleryPath = saveAlbum(title, req.files.album);
    var soundTrackPath = saveSoundtrack(title, req.files.soundtrack);

    var title_zh_s = chineseConv.sify(title_zh);
    var title_zh_t = chineseConv.tify(title_zh);
    var description_zh_s = chineseConv.sify(description_zh);
    var description_zh_t = chineseConv.tify(description_zh);

    var item = new Item({
        beaconUUID: uuid,
        beaconMajor: major,
        beaconMinor: minor,
        title: title,
        title_zh_s: title_zh_s,
        title_zh_t: title_zh_t,
        coverImage: coverImagePath,
        author: author,
        country: "",
        description: description,
        description_zh_s: description_zh_s,
        description_zh_t: description_zh_t,
        soundtrack: soundTrackPath,
        images: galleryPath,
        lat: lat,
        lng: lng,
        introduceTime: null,
        inExhibition: true,
        views: [],
        likes: [],
        shareCount: 0 
    });
    item.save(function(err){
        if (err) throw err;
        res.redirect("https://elvinjin.com:8081/panel/itemList");
    });
});

router.post('/edit', multipartMiddleware, function(req, res){
    var infoChanged = false;
    var _id = req.body._id;
    var title = req.body.title;
    var author = req.body.author;
    if(!author) author = "unkonwn";
    var lat = req.body.lat;
    var lng = req.body.lng;
    var description = req.body.description;
    var uuid = req.body.uuid;
    var major = req.body.major;
    var minor = req.body.minor;
    var coverImageChanged = false;
    var galleryImageAdded = false;
    var soundtrackChanged = false;
    var galleryImageDelete = new Array();
    if(req.files.coverImage.size > 0){
        coverImageChanged = true;
    }
    console.log(req.files.album);
    if(Object.prototype.toString.call(req.files.album) === '[object Array]'){
        if(req.files.album.length > 0){
            galleryImageAdded = true;
        }
    }else if(req.files.album.size > 0){
        galleryImageAdded = true;
        // console.log(req.files.album);
        var tmp = new Array();
        tmp.push(req.files.album);
        req.files.album = tmp;
    }
    if(req.files.soundtrack){
        soundtrackChanged = true;
        // console.log(req.files.soundtrack);
    }
    galleryImageDelete = getDeleteIndex(req.body.delete);
    console.log("delete index:");
    console.log(galleryImageDelete);
    Item.findById(_id, function(err, item){
        if (err) throw err;
        if(!item){
            appHelper.errorResponse(res, 481, 'No recorde matches.', 'Cannot get item.');
        }else{
            if(item.title != title){
                infoChanged = true;
                item.title = title;
            }
            if(item.author != author){
                infoChanged = true;
                item.author = author;
            }
            if(item.description != description){
                infoChanged = true;
                item.description = description;
            }
            if(item.lat != lat){
                infoChanged = true;
                item.lat = lat;
            }
            if(item.lng != lng){
                infoChanged = true;
                item.lng = lng;
            }
            if(item.beaconUUID != uuid){
                infoChanged = true;
                item.beaconUUID = uuid;
            }
            if(item.beaconMajor != major){
                infoChanged = true;
                item.beaconMajor = major;
            }
            if(item.beaconMinor != minor){
                infoChanged = true;
                item.beaconMinor = minor;
            }
            if(coverImageChanged){
                infoChanged = true;
                // change cover image
                console.log("coverImage changed.");
                deleteFile(item.coverImage);
                item.coverImage = saveCoverImage(item.title, req.files.coverImage);
            }
            var clue = item.images[0];
            for(var i = galleryImageDelete.length - 1; i >= 0; i--){
                infoChanged = true;
                deleteFile(item.images[i]);
                item.images.splice(i,1);
            }
            if(galleryImageAdded){
                infoChanged = true;
                //add gallery image
                var folderName = getAlbumFolderName(clue);
                console.log(folderName);
                var galleryImages = addAlbumImages(folderName, item.title, req.files.album);
                item.images = item.images.concat(galleryImages);
            }
            if(soundtrackChanged){
                infoChanged = true;
                deleteFile(item.soundtrack);
                editSoundtrack(item.soundtrack, req.files.soundtrack);
            }
            if(infoChanged){
                item.save(function(err){
                    if(err){
                        throw err;
                    }else{
                        console.log("Item edited.");
                        res.redirect("https://elvinjin.com:8081/panel/itemList");
                    }
                });
            }else{
                res.redirect("https://elvinjin.com:8081/panel/itemList");
            }
        }
    });
});

module.exports = router;

function parseToFolderName(title){
    var ret = title.replace(/\ /g, "_");
    return ret + "'s_gallery";
}

function paresToFileName(title, number, originalFilename){
    var extension = getExtension(originalFilename);
    var ret = title.replace(/\ /g, "_");
    ret += "_" + randomstring.generate(3) + "_" + number + extension;
    return ret;
}

function getExtension(originalFilename){
    var ret = originalFilename.split('.');
    return '.' + ret[ret.length-1];
}

function saveCoverImage(title, image){
    var newName = paresToFileName(title, 0, image.originalFilename);
    var target_path = '/home/deploy/eksibition_api/eksibition/resources/profileImages/' + newName;
    var tmp_path = image.path;
    fs.rename(tmp_path, target_path, function(err) {
      if (err) throw err;
      fs.unlink(tmp_path, function() {
        if (err) throw err;
      });
    });
    console.log(newName + " added to folder /resources/profileImages");
    return '/resources/profileImages/' + newName;
}

function editSoundtrack(path, soundtrackFile){
    var target_path = '/home/deploy/eksibition_api/eksibition' + path;
    var tmp_path = soundtrackFile.path;
    fs.rename(tmp_path, target_path, function(err) {
      if (err) throw err;
      fs.unlink(tmp_path, function() {
        if (err) throw err;
      });
    });
    console.log("Soundtrack file updated.");
}

function deleteFile(path){
    path = "/home/deploy/eksibition_api/eksibition" + path;
    fs.unlink(path, function(err){
        if (err) throw err;
        console.log(path + " deleted!");
    });
}

function getAlbumFolderName(path){
    var folders = path.split('/');
    return folders[folders.length-2];
}

function saveAlbum(title, images){
    var folderName = parseToFolderName(title);
    mkdirp('/home/deploy/eksibition_api/eksibition/resources/gallery/' + folderName, function(err) { 
        if (err) throw err;
    });
    var ret = [];
    for(i = 0; i < images.length; i++) {
        var newName = paresToFileName(title, i+1, images[i].originalFilename);
        var target_path = '/home/deploy/eksibition_api/eksibition/resources/gallery/' + folderName + '/' + newName;
        var tmp_path = images[i].path;
        console.log("saveAlbum() 001");
        fs.rename(tmp_path, target_path, function(err) {
          if (err) throw err;
          console.log(newName + " added to folder /resources/" + folderName);
          fs.unlink(tmp_path, function() {
            if (err) throw err;
            console.log("saveAlbum() 003");
          });
          console.log("saveAlbum() 004");
        });
        console.log("saveAlbum() 005");
        ret.push('/resources/gallery/' + folderName + '/' + newName);
    }
    return ret;
}

function addAlbumImages(folderName, title, images){
    var ret = [];
    console.log(images);
    for(i = 0; i < images.length; i++) {
        var newName = paresToFileName(title, i+1, images[i].originalFilename);
        var target_path = '/home/deploy/eksibition_api/eksibition/resources/gallery/' + folderName + '/' + newName;
        var tmp_path = images[i].path;
        console.log("saveAlbum() 001");
        fs.rename(tmp_path, target_path, function(err) {
          if (err) throw err;
          console.log(newName + " added to folder /resources/" + folderName);
          fs.unlink(tmp_path, function() {
            if (err) throw err;
            console.log("saveAlbum() 003");
          });
          console.log("saveAlbum() 004");
        });
        console.log("saveAlbum() 005");
        ret.push('/resources/gallery/' + folderName + '/' + newName);
    }
    console.log("addAlbumImages():");
    console.log(ret);
    return ret;
}

function saveSoundtrack(title, soundtrack){
    var newName = paresToFileName(title, '00', soundtrack.originalFilename);
    var target_path = '/home/deploy/eksibition_api/eksibition/resources/audioFiles/' + newName;
    var tmp_path = soundtrack.path;
    fs.rename(tmp_path, target_path, function(err) {
      if (err) throw err;
      fs.unlink(tmp_path, function() {
        if (err) throw err;
      });
    });
    return '/resources/audioFiles/' + newName;
}

function getDeleteIndex(order){
    var ret = new Array();
    var index = 0;
    for(var i = 0; i < order.length; i++){
        if(order[i] == "on"){
            ret.push(index);
        }else{
            index ++;
        }
    }
    return ret;
}
