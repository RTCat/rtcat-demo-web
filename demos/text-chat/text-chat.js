(function ($) {

    // 声明变量
    var session;
    var users;

    // 获取token并初始化session
    $.ajax({
        url: "http://localhost:8080/tokens/text-chat",
        method: 'GET',
        success: function (resp) {
            var token = resp.uuid;
            initSession(token);
        }
    });

    // 发送消息
    $("#message-field").keypress(function (event) {
        if (event.which == 13) {
            event.preventDefault();
            $('#send').click();
        }
    });
    $('#send').click(function () {
        var message = $('#message-field').val();
        if (message) {
            sendMessage({
                message: message,
                sender: $('#username').val() || '佚名'
            })
        }
    });

    function initSession(token) {

        session = new RTCat.Session(token);

        session.connect();

        session.on('connected', function (users) {
            console.log('Session connected');
        });

        session.on('in', function (token) {
            console.log('Someone in ' + token);
        });

        session.on('out', function (token) {
            console.log('Someone out ' + token);
        });

        session.on('message', function (token, pkg) {
            console.log('Message received from ' + token);
            var pkg = JSON.parse(pkg);
            displayMessage(pkg.sender, pkg.message)
        });

    }

    // 发送消息
    function sendMessage(pkg) {
        // display the sent message
        displayMessage("我", pkg.message);
        users = session.getWits();
        for (var user in users) {
            session.sendMessage(user, JSON.stringify(pkg));
        }
        // reset message field content
        $("#message-field").val("");
    }

    // 显示消息
    function displayMessage(user, message) {
        // create a message node and insert it in div#messages_container node
        var container = document.querySelector("#messages-container");
        var textNode = document.createTextNode(user + " > " + message);
        var node = document.createElement("div");
        node.className = "message";
        node.appendChild(textNode);
        container.appendChild(node);
        // scroll to bottom to always display the last message
        container.scrollTop = container.scrollHeight;
    }

}).apply(this, [jQuery]);
