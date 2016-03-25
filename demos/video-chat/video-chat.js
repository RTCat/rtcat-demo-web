(function (RTCat, $) {

    // 声明变量
    var session;
    var localStream;
    var mediaList = document.querySelector('#media-list');

    // 从服务器获取token
    // url地址为rtcat-demo-backend服务器地址
    $.ajax({
        url: "http://localhost:8080/tokens/video-chat",
        method: 'GET',
        success: function (resp) {
            var token = resp.uuid;
            initSession(token);
        }
    });

    function initSession(token) {
        session = new RTCat.Session(token);

        session.connect();

        session.on('connected', function (users) {
            console.log('Session connected');
            initStream({video: true, audio: true, data: true, ratio: 1.33}, function (stream) {
                displayStream('self', stream)
            });
        });

        session.on('in', function (token) {
            if (localStream) {
                session.sendTo({to: token, stream: localStream, data: true});
            }
            console.log('someone in');
        });

        session.on('out', function (token) {
            console.log('someone out');
        });

        session.on('remote', function (r_channel) {

            var id = r_channel.getId();
            var token = r_channel.getSender(); //获取对方的token, 方便之后的断线重连

            r_channel.on('stream', function (stream) {
                displayStream(id, stream);
            });

            // 检测对方视频丢包数量, 此方法使用了chrome的内置接口, 在其他浏览器上无效, 因此不可过分依赖此结果
            // 一般调试用, 本demo仅作展示,将丢包数量打印到页面上
            // 更多关于detect_video的用法可参看 https://shishimao.com/docs/web/sdk-reference/#receiver
            // 相关章节
            r_channel.on('detect_video', function (video) {
                screenConsoleLog('channel ' + id + '视频丢包数量:' + video.packetsLost)
            });

            // 检测对方音频丢包数量, 此方法使用了chrome的内置接口, 在其他浏览器上无效, 因此不可过分依赖此结果
            // 一般调试用, 本demo仅作展示,将丢包数量打印到页面上
            // 更多关于detect_audio的用法可参看 https://shishimao.com/docs/web/sdk-reference/#receiver
            r_channel.on('detect_audio', function (video) {
                screenConsoleLog('channel ' + id + '音频丢包数量:' + video.packetsLost)
            });

            //检测到remote channel close事件,
            //使用once方法,只触发一次,防止断线重连时的bug
            r_channel.once('close', function () {
                $('#peer-' + id).parent().remove(); //回收旧播放器

                // 可选:断线重连
                // 你可以通过快速断开和恢复网络连接来模拟断网的情况, 查看重连效果
                // 原理是重新建立p2p的连接, 并发送本地流
                // 此重连尝试将持续直到session disconnect事件触发之后, 用户与实时猫服务器的连接断开
                if (localStream) {
                    session.sendTo({to: token, stream: localStream, data: true});
                }
            });
        });
    }

    // 初始化流
    function initStream(options, callback) {
        localStream = new RTCat.Stream(options);
        localStream.on('access-accepted', function () {
                session.send({stream: localStream, data: true});
                callback(localStream);
            }
        );
        localStream.on('access-failed', function (err) {
            console.log(err);
        });

        localStream.on('play-error', function (err) {
            console.log(err);
        });
        localStream.init();
    }

    // 显示流
    function displayStream(id, stream) {

        // Video container
        var videoContainer = document.createElement("div");
        videoContainer.setAttribute('class', "col-md-3");

        // Video player
        var videoPlayer = document.createElement('div');
        videoPlayer.setAttribute("id", "peer-" + id);
        videoPlayer.setAttribute("class", "video-player");

        videoContainer.appendChild(videoPlayer);
        mediaList.appendChild(videoContainer);

        stream.play("peer-" + id);
    }

    //输出到screen console
    function screenConsoleLog(log) {
        var time = new Date();
        var timeStamp = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() + ":" + time.getMilliseconds();
        $('textarea#console').val(timeStamp + "\t" + log + '\n' + $('textarea#console').val());
    }


}).apply(this, [window.RTCat, jQuery]);
