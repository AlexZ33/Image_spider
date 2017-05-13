# Image_spider
 nodejs实现的简易图片爬虫 
 之前写过简单的爬取页面课程目录的爬虫  [戳这里](http://jxdxsw.com/2016/03/07/node_http_crawler/)

今天写一个图片爬虫 


##基本思路
在我们想要批量爬取资源的站点，通过审查代码和观察url请求来找出一些规律，不同网站复杂程度各不相同，通常爬图片这种算比较简单的，

- 分析规律，构造请求的页面地址，nodejs模块request模拟请求页面数据（简单静态页复杂些的可能还需要模拟ajax请求截取数据），

- 利用cheerio模块从请求的页面数据中解析出我们需要的资源地址(类jquery 操作dom的库)，

- 最后就是简单的批量下载了（瞬间发送大量的请求可能会被站点和谐掉，所以一次性爬取的量很大的时候注意async限制异步并发的请求量，并发控制要视不同站点区别对待，这里暂时没做）
## 教程 ##
###1.创建工程
创建文件夹 

    mkdir image_spider && cd image_spider 

创建依赖文件package.json

     npm init

下载模块

    npm install async cheerios colors request --save-dev

`fs`和`path`模块均为nodejs自带，主要是下面两个，一个是`request`模块和`cheerio`模块，附带一个`colors`模块。

![图片描述][1]

简单来说，`request`模块是用来请求网页的，`cheerio`是对请求来的网页进行解析的，也就是从html中解析出来图片的src地址

####用request来获取这个页面的html
![图片描述][2]

body返回的是请求页面的HTML，
然后我们该使用cheerio模块来解析这个页面，也就是`analysisData()`函数做的事情

###2.创建index.js

```
vim index.js
```
按`esc` 然后输入`:wq` 保存退出
###3.编写index.js

```
const fs = require('fs');
const path =require('path');
const request =require('request');
const cheerio =require('cheerio');
const colors = require('colors');
const packagejson = require('./package.json');
console.log("版本" + packagejson.version.cyan)

//测试站点  如jandan.net/ooxx/page-1000

var urltxt = 'http://jandan.net/ooxx/page-',
    startpage = 1200,//起始页
    endpage = 1300,
    sourcedir = 'images',//资源保存的更目录名
    picdir = sourcedir + '' +startpage + '_' + endpage +'/',
    creatdir = './' +picdir;


//----------------------------------------
//创建 图片保存目录
//fs.mkdir 这里有个隐患，直接使用 对存在的 文件夹创建时会报错 ，在不存在的一级目录下创建二级目录也会报错，待封装fs.mkdir后修改
//-----------------

fs.mkdir(creatdir, function(err) {
	if (err) {throw err};
	//let newsourcesrc = '目录' + creatdir +'创建成功';console.log(newsourcesrc.cyan);
});

//----------
//爬取指定范围页
//------------

console.log('---------------开始抓取页面内容---------------'.cyan);
for (var i = startpage; i < endpage; i++) {
	var requrl =urltxt + i;

	request(requrl, function (error, response, body) {
		if(!error && response.statusCode == 200) {
			//console.log(body);//返回请求页面的HTML
			analysisData(body);//采集主函数
		};
	})

	//数据解析抓取主函数
	function analysisData(ourdata) {
		var $ =cheerio.load(ourdata);
		var pic = $('.text .view_img_link').toArray();//将所有的img放到一个数组中
		var thispage = "当前页" + pic.length + "张";
		console.log(thispage.rainbow);

		console.time("----创建当前页下载任务计时----");


		//用循环读出数组中每个src地址
		for (var i = 0; i < pic.length; i++) {
			//indexof筛选src是否带前缀http，此处取的是查看原图<a>的href，若$('.text img')则将herf改为src,其他站点类推
			var pics_src = pic[i].attribs.href;
			

			if (pics_src.indexOf('http') > 0 ) {
				var imgsrc = pics_src;

			}else {
				var imgsrc = 'http:' + pics_src;
			};

			console.log(imgsrc.green); //输出地址
			

			var filename = parseUrlForFileName(imgsrc); //生成文件名

			downloadImg(imgsrc, filename, function() {
				console.log(filename.cyan + 'done');
			});
		}

		console.timeEnd("----创建当前页下载任务计时----");
	}
  

  //图片命名
	function  parseUrlForFileName(address) {
		var filename = path.basename(address);
		return filename;
	}


  // --------------------------------------
    // 下载保存
    // NodeJs path API http://nodejs.org/api/path.html#path_path_basename_p_ext
    // request.head==》》fs模块createWriteStream写入到指定目录
    // 爬取资源较大时 用async来限制一下异步的并发，由于node并发连接数太多可能会被和谐
  // --------------------------------------
   var downloadImg = function(uri, filename, callback) {
   	request.head(uri, function(err, res, body) {
   		console.log('content-type:', res.header['content-type']);//返回图片的类型
   		console.log('content-length:', res.header['content-length']);//图片大小
   	if (err) {
   		console.log('err: '+ err);
      return false;
   	}
	   	console.log('请求：' + res);
	   	request(uri).pipe(fs.createWriteStream( picdir + filename)).on('close', function() {
	   		console.log(filename.cyan + "保存成功");//request的流数据pipe保存到 picdir文件夹下
   	  });
   	});
   };
};
```
通过审查页面元素我们可以看出，这些妹子图都是放在 class="text" 下的 img 标签中
![图片描述][3]
![图片描述][4]

可以看到我们拿到了此页面中所有图的地址，最后一步就是下载这些图了，你不能是一个一个复制这些地址，然后粘贴到浏览器中右键另存为吧，首先，我们要先解析这些图片的文件名，解析文件名很简单，调用path模块中的basename方法就可以得到URL中的文件名
![图片描述][5]

![图片描述][6]
![图片描述][7]

现在我们有了图片的地址和图片的名字，就可以下载了，在这里我们调用的是request模块的head方法来下载，请求到图片再调用fs文件系统模块中的createWriteStream来下载到本地目录

![图片描述][8]

有的网站是有反爬机制的，并不是每个网站都可以爬,下次我们聊聊反爬虫机制

###推送到github
![图片描述][9]
github仓库
--
[戳这里](https://github.com/AlexZ33/Image_spider)

用法
--

本爬虫在windows,linux,安卓（安装模拟器Termux搭建node环境，操作流程同pc）平台都通用。
安装nodejs、git等环境步骤这里就不重复了。

拷贝本目录
```
git clone 
```

安装相关依赖，切到clone的目录下安装依赖在运行(推荐用cnpm install)，具体爬虫参数修改看注释，如有错请指正
```
cd images_spider
cnpm install 
```
## 爬虫跑起来 index.js
```
node index
```
**参考链接**
> [cheerio 官网](https://www.npmjs.com/package/cheerio)
> [request 官网](https://github.com/request/request)
> [通读cheerio API](https://cnodejs.org/topic/5203a71844e76d216a727d2e)
> [NodeJs path API ](https://nodejs.org/api/path.html#path_path_basename_p_ext)
> [NodeJs妹子图爬虫](http://blog.csdn.net/dufufd/article/details/54629365)
> [Node.js 爬虫爬取 58 同城租房信息](https://segmentfault.com/a/1190000009181428)


  [1]: /img/bVNC0O
  [2]: /img/bVNC1A
  [3]: /img/bVNDeY
  [4]: /img/bVNDds
  [5]: /img/bVNDg2
  [6]: /img/bVNDhE
  [7]: /img/bVNDhK
  [8]: /img/bVNDhO
  [9]: /img/bVNDgW
