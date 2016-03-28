# 实时猫Demo - Web

本Demo项目分专题提供了使用实时猫JS SDK实现基本音视频开发的代码集。

## Demo目录

1. 浏览器兼容性检测
2. 简单视频聊天
3. 简单文字聊天
4. 文件传送
5. 屏幕分享
6. 共享白板

## 快速开始

1. 搭建[实时猫Demo项目后台](https://github.com/RTCat/rtcat-demo-backend)
2. 克隆本项目
3. 将demos文件夹下的不同专题(例如video-chat文件夹)放置在服务器上, 如果在电脑上安装了python2或者python3, 
可以通过在专题文件夹(例如video-chat文件夹)中运行`python -m SimpleHTTPServer 8000`或者`python3 -m http.server 8000`
命令在本地运行一个服务器. 也可以使用Apache, Nginx, IIS等自行设置.
4. 当在本地运行了一个服务器之后, 可以用不同的浏览器打开index.html文件, 举例来说,如果本地服务器监听8000端口,
可以通过访问http://localhost:8000来查看.