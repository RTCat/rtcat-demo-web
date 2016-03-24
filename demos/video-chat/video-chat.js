(function (RTCat, $) {

    // 声明变量
    var session;
    var localStream;
    var mediaList = document.querySelector('#media-list');

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

}).apply(this, [window.RTCat, jQuery]);
