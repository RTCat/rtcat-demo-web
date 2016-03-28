(function ($) {

    // 声明变量
    var session;
    var localStream;
    var sChannels = {}; // Senders Collection
    var files;

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
        for (var i = 0, f; f = files[i]; i++) {
            sendFile(f);
        }
    });

    // Setup the dnd listeners.
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);

    function handleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        files = evt.dataTransfer.files; // FileList object.

        // files is a FileList of File objects. List some properties.
        var output = [];
        for (var i = 0, f; f = files[i]; i++) {
            output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                f.size, ' bytes, last modified: ',
                f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                '</li>');
        }
        document.getElementById('file-list').innerHTML = '<ul>' + output.join('') + '</ul>';
    }

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    // 初始化session
    function initSession(token) {
        // 使用传入的token新建房间
        session = new RTCat.Session(token);

        // 连接房间
        session.connect();

        session.on('connected', function (users) {
            console.log('Session connected');
            // 此处创建流时不必要求video和audio权限
            initStream({video: false, audio: false, data: true});
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

    }

    // 初始化流
    function initStream(options, callback) {
        localStream = new RTCat.Stream(options);
        localStream.on('access-accepted', function () {
            //发送时不必发送流
            session.send({data: true});
        });
        localStream.on('access-failed', function (err) {
            console.log(err);
        });

        localStream.on('play-error', function (err) {
            console.log(err);
        });
        localStream.init();
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
        document.querySelector(".progress-bar").style.width = "100%";
        document.querySelector('#sendFile').disabled = false;
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
