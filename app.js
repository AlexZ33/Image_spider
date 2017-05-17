var request = require('request');

var cheerio = require('cheerio');

var path = require('path');

var fs = require('fs');

var requrl = 'http://1024.97luhi.info/pw/htm_data/3/1705/635356.html';

console.log('---------------开始抓取页面内容---------------');

request(requrl,function(error, response, body) {

    if (!error && response.statusCode == 200) {


        acquireData(body);

    }

})

function acquireData(data) {

    var $ = cheerio.load(data);

    var meizi = $('#read_tpc img').toArray();


    var len = meizi.length;
    console.log(len);

    for (var i = 0; i < len; i++) {


        var pics_src = meizi[i].attribs.src;

        console.log(pics_src);

       
        imgsrc = pics_src + '';

        

        var filename = parseUrlForFileName(imgsrc); //生成文件名

        downloadImg(imgsrc, filename,
        function() {


        });

    }
   

}

function parseUrlForFileName(address) {

    var filename = path.basename(address);

    return filename;
    console.log('file');

}

var downloadImg = function(uri, filename, callback) {

    request.head(uri,function(err, res, body) {

        console.log('res:' + res);


        //
        console.log('content-type:', res.headers['content-type']); //这里返回图片的类型

        //
        console.log('content-length:', res.headers['content-length']); //图片大小

        if (err) {

            console.log('err:' + err);

            return false;

        }

        
        request(uri).pipe(fs.createWriteStream('images/' + filename)).on('close', callback); //调用request的管道来下载到images文件夹下

    });

};