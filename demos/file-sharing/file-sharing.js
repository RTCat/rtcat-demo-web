(function ($) {

    // 声明变量
    var session;
    var localStream;
    var sChannels = {}; // Senders Collection
    var fileToSent;

    // 获取token并初始化session
    $.ajax({
        url: "http://localhost:8080/tokens/file-sharing",
        method: 'GET',
        success: function (resp) {
            var token = resp.uuid;
            initSession(token);
        }
    });

    // 触发发送文件
    $('#sendFile').click(function () {
        if (fileToSent) {
            sendFile(fileToSent);
        }
    });

    // Setup the file input listeners.
    $('#file').change(function () {
        fileToSent = $('#file')[0].files[0];
        $('#file-list').html('<ul><li>' + fileToSent.name + '</li></ul>');
    });

    // 初始化session
    function initSession(token) {
        // 使用传入的token新建房间
        session = new RTCat.Session(token);

        session.on('connected', function (users) {
            console.log('Session connected');
            session.send({data: true});
        });

        session.on('in', function (token) {
            //发送时不必发送流
            session.sendTo({to: token, data: true});
            console.log('someone in');
        });

        session.on('out', function (token) {
            console.log('someone out');
        });

        session.on('remote', function (r_channel) {
            var id = r_channel.getId();
            r_channel.on('file', function (file) {
                handleFile(file);
            });
            r_channel.on('close', function () {
                console.log("rChannels中移除: " + id)
            });
        });

        session.on('local', function (s_channel) {
            var id = s_channel.getId();
            sChannels[id] = s_channel;
            console.log('sChannels中加入：' + id);
            console.log(sChannels);

            s_channel.on('file_sending', function (file, percent) {
                fileSending(percent);
            });

            s_channel.on('file_sent', function () {
                fileSent();
            });

            s_channel.on('close', function () {
                delete sChannels[id];
                console.log('sChannels中移除：' + id);
                console.log(sChannels);
            });
        });

        // 连接房间
        session.connect();

    }

    // 发送文件
    function sendFile(file) {
        for (var channel in sChannels) {
            sChannels[channel].sendFile(file);
        }
    }

    // 文件发送中
    function fileSending(percent) {
        document.querySelector('#sendFile').disabled = true;
        document.querySelector('.progress').setAttribute("class", "progress");
        document.querySelector(".progress-bar").style.width = Number(percent) * 100 + "%";
        console.log(percent);
    }

    // 文件发送完毕
    function fileSent() {
        $('#file-list').html('<ul><li>' + fileToSent.name + ' 发送成功</li></ul>');
        document.querySelector(".progress-bar").style.width = "100%";
        document.querySelector(".progress").setAttribute("class", "progress hidden");
        document.querySelector('#sendFile').disabled = false;
        fileToSent = null;
    }

    // 处理接收的文件
    function handleFile(file) {
        var fileNode;
        var pattern = new RegExp("image");
        var result = pattern.test(String(file.blobUrl));
        if (result === true) {
            fileNode = document.createElement("img");
            fileNode.width = 100;
            fileNode.height = 100;
            fileNode.src = file.blobUrl;
        } else {
            fileNode = document.createElement("a");
            fileNode.href = file.blobUrl;
            fileNode.target = "_blank";
            fileNode.innerText = file.name;
        }

        document.querySelector("#result_zone").appendChild(fileNode);
    }

}).apply(this, [jQuery]);
