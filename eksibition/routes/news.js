var express = require('express');
var News = require('../app/models/news');
var randomstring = require("randomstring");
var multipart = require('connect-multiparty');
var fs = require('fs');
var router = express.Router();
var multipartMiddleware = multipart();
var appHelper = require('../helper.js');
var chineseConv = require('chinese-conv');

// push one notofication
router.get('/update/:startTime', function(req, res){
    var startTimeStr = req.params.startTime;
    var startTimeInt = parseInt(startTimeStr);
    News.find({time: {$gt: startTimeInt}}).sort({time: -1}).exec(function(err, newsArray){
        if (err) res.send(err);
        // console.log(newsArray);
        // res.status(200).send(newsArray);
        var resData = new Array();
        for(var i = 0; i < newsArray.length; i++){
            var tmp = {
                newsId: newsArray[i].newsId,
                title: {
                    languages:{
                        "en-US": 0,
                        "zh-Hant": 1,
                        "zh-Hans": 2
                    },
                    content:[newsArray[i].title, newsArray[i].title_zh_t, newsArray[i].title_zh_s]
                },
                time: newsArray[i].time,
                image: newsArray[i].image,
                content: {
                    languages:{
                        "en-US": 0,
                        "zh-Hant": 1,
                        "zh-Hans": 2
                    },
                    content:[newsArray[i].content, newsArray[i].content_zh_t, newsArray[i].content_zh_s]
                }
            };
            resData.push(tmp);
        }
        res.status(200).send(resData);
  });
	// News.find({},function(err, newsArray){
	// 	if (err) res.send(err);
 //        if (newsArray.length == 0) {
 //            res.json({
 //                success : false,
 //                message : 'can not find any news!'
 //            });
 //        } else {
 //        	res.json(newsArray);
 //        }
	// });
});

router.get('/:newsId', function(req, res){
    var id = req.params.newsId;
    News.find({"newsId":id},function(err, newsArray){
    	if (err) res.send(err);
        if (newsArray.length == 0) {
            res.status(481).json({
                success : false,
                message : 'can not find any news!'
            });
        } else {
        	var news = newsArray[0];
        	res.json(news);
        }
    });
});

router.use(appHelper.adminMiddleWare);

router.post('/add', multipartMiddleware, function(req, res){
    var newsId = generateNewsId();
    var title = req.body.title;
    var title_zh = req.body.title_zh;
    if (!title_zh) title_zh = title;
    var title_zh_s = chineseConv.sify(title_zh);
    var title_zh_t = chineseConv.tify(title_zh);
    var content = req.body.content;
    var content_zh = req.body.content_zh;
    if (!content_zh) content_zh = "暫無中文內容。";
    var content_zh_s = chineseConv.sify(content_zh);
    var content_zh_t = chineseConv.tify(content_zh);
    var coverImage = req.files.image;
    var fileName = req.files.image.originalFilename;
    var pushNow = req.body.push_now;
    var date = new Date();
    var timeStamp = date.getTime();
    var timeInt = parseInt(timeStamp);
    var tmp_path = coverImage.path;
    var temp = fileName.split('.');
    var extention = temp[temp.length-1];
    var target_path = '/home/deploy/eksibition_api/eksibition/resources/newsImages/' + newsId + '.' + extention;
    fs.rename(tmp_path, target_path, function(err) {
      if (err) throw err;
      fs.unlink(tmp_path, function() {
        if (err) throw err;
        var news = new News({
            newsId: newsId,
            title: title,
            title_zh_s: title_zh_s,
            title_zh_t: title_zh_t,
            time: timeInt,
            image: '/resources/newsImages/' + newsId + '.' + extention,
            content: content,
            content_zh_s: content_zh_s,
            content_zh_t: content_zh_t
        });
        news.save(function(err){
            if(err) throw err;
            res.redirect("https://elvinjin.com:8081/panel/newsList");
        });
      });
    });
});


router.post('/uploadImage/:imageName', function(req, res){
    var imageName = req.params.imageName;
    console.log(req.body);
    console.log(req.files.uploadFile.size);
    res.json({
        success: true,
        message: "image saved!"
    }); 
});

router.post('/all', function(req, res){
    News.find({},function(err, newsList){
        if(err) throw err;
        var resData = new Array();
        if(newsList.length > 0){
            resData = newsList.sort(sortNews);
        }
        res.send(resData);
    });
});

function generateNewsId(){
    var date = new Date();
    var Id = date.getTime() + randomstring.generate(6);
    return Id;
}

function saveNewsImage(file, name){
    var tmp_path = file.thumbnail.path;
    var target_path = '../resources/newsImage/' + name;
    fs.rename(tmp_path, target_path, function(err) {
      if (err) throw err;
      fs.unlink(tmp_path, function() {
         if (err) throw err;
         return 
      });
    });
}

function sortNews(a, b){
    return b.time - a.time;
}



module.exports = router;
