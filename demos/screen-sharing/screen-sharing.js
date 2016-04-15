(function ($) {

    // 声明变量
    var session;
    var localStream;
    var mediaList = document.querySelector('#media-list');

    // 获取token并初始化session
    $.ajax({
        url: "http://localhost:8080/tokens/screen-sharing",
        method: 'GET',
        success: function (resp) {
            var token = resp.uuid;
            initSession(token);
        }
    });

    $("#share-screen").click(function () {
        initStream();
    });

    // 初始化流
    function initStream() {
        localStream = new RTCat.Stream({screen: 'kopddpjmdlllnpkpcphndjiaohbakkjb'});
        localStream.on('access-accepted', function () {
                session.send({stream: localStream, data: true});
                displayStream('self', localStream);
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
        videoContainer.setAttribute('class', "col-md-6");

        // Video player
        var videoPlayer = document.createElement('div');
        videoPlayer.setAttribute("id", "peer-" + id);
        videoPlayer.setAttribute("class", "video-player");

        videoContainer.appendChild(videoPlayer);
        mediaList.appendChild(videoContainer);

        stream.play("peer-" + id, {width: 530, height: 400});
    }

    function initSession(token) {
        session = new RTCat.Session(token);

        session.connect();

        session.on('connected', function (users) {
            console.log('Session connected');
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

            //使用once方法,只触发一次,防止断线重连时的bug
            r_channel.once('close', function () {

                console.log('remote channel close');

                $('#peer-' + id).parent().remove();

                // 可选:断线重连
                // 你可以通过快速断开和恢复网络连接来模拟断网的情况, 查看重连效果
                // 原理是当有localStream时,说明是分享屏幕者连接断开,此时重新建立p2p连接,发送本地流即可,
                // 当没有localStream时,说明是观众连接断开了, 此时不仅需要重新建立p2p连接, 而且需要告知屏幕
                // 分享方重新发一遍流给自己
                // 此demo为方便, 不做这方面的展示, 有兴趣的读者可自行尝试
                // 此重连尝试将持续直到session disconnect事件触发之后, 用户与实时猫服务器的连接断开
                if (localStream) {
                    session.sendTo({to: token, stream: localStream, data: true});
                }
            });
        });

    }

}).apply(this, [jQuery]);