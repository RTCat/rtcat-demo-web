(function ($) {

    // 声明变量
    var session;
    var whiteboardContainer = document.querySelector('#whiteboard-container');//白板相关
    var whiteboard;
    var context;
    var users;
    var textarea = null;
    var whiteboardWidth = 1080;
    var whiteboardHeight = 768;
    var penColor = 'black';
    var penSize = 8;
    var penType = 'source-over';
    var lastPos = [];
    var textPos = [];
    var mouseDown = false;

    //初始化画板
    initBoard();

    // 获取token并初始化session
    $.ajax({
        url: "http://localhost:8080/tokens/shared-whiteboard",
        method: 'GET',
        success: function (resp) {
            var token = resp.uuid;
            initSession(token);
        }
    });

    function broadcastMessage(message) {
        users = session.getWits();
        for (var user in users) {
            session.sendMessage(user, JSON.stringify(message));
        }
    }

    /**
     * 处理消息函数
     * @param pkg
     */
    function handleMessages(id, pkg) {
        var pkg = JSON.parse(pkg);
        switch (pkg.type) {
            case 'Whiteboard':
                drawOnMessageReceived(pkg.message);
                break;
            case 'Whiteboard Text':
                addTextOnMessageReceived(pkg.message);
                break;
            case 'Clear Whiteboard':
                clearBoard();
                break;
        }
    }

    /**
     * 初始化白板
     */
    function initBoard() {
        whiteboard = document.createElement('canvas');
        whiteboard.setAttribute('width', whiteboardWidth);
        whiteboard.setAttribute('height', whiteboardHeight);
        whiteboard.setAttribute('class', 'whiteboard');
        whiteboardContainer.appendChild(whiteboard);
        context = whiteboard.getContext("2d");
    }

    /**
     * 画线
     * @param pos
     * @param penType
     * @param penColor
     * @param penSize
     */
    function draw(pos, penType, penColor, penSize) {
        context.beginPath();
        context.globalCompositeOperation = penType;
        context.strokeStyle = penColor;
        context.lineWidth = penSize;
        context.lineCap = 'round';
        context.moveTo(pos[0][0], pos[0][1]);
        context.lineTo(pos[1][0], pos[1][1]);
        context.stroke();
        context.closePath();
    }

    /**
     * 显示文字
     * @param pos
     * @param text
     */
    function addText(pos, text) {
        context.globalCompositeOperation = "source-over";
        context.font = '16px Droid sans';
        context.fillStyle = 'black';
        context.fillText(text, pos[0], pos[1]);
    }

    /**
     * 远程画线
     * @param message
     */
    function drawOnMessageReceived(message) {
        // message -> pos
        draw(message['mouse'], message['penType'], message['penColor'], message['penSize']);
        //draw(pos)
    }

    /**
     * 远程显示文字
     * @param message
     */
    function addTextOnMessageReceived(message) {
        addText(message['mouse'], message['text'])
    }

    /**
     * 获取当前鼠标位置
     * @param e
     * @returns {*[]}
     */
    function getMousePos(e) {
        // 获取当前鼠标[x,y]位置
        var x, y, rect;
        x = e.clientX;
        y = e.clientY;
        rect = whiteboard.getBoundingClientRect();
        x = x - rect.left;
        y = y - rect.top;
        return [x, y]
    }

    /**
     * 清空画板
     */
    function clearBoard() {
        context.clearRect(0, 0, whiteboard.width, whiteboard.height);
    }

    /**
     * 增加textarea
     * @param e
     */
    function addTextarea(e) {
        if (!textarea) {
            textarea = document.createElement('textarea');
            textarea.className = 'whiteboard-textarea';
            textarea.addEventListener('mousedown', mouseDownOnTextarea);
            document.body.appendChild(textarea);
        }
        textPos = getMousePos(e);
        textarea.style.display = 'block'; //显示textarea
        textarea.value = ""; // 清空textarea
        textarea.placeholder = "Type here:";
        textarea.style.top = e.clientY + 'px';
        textarea.style.left = e.clientX + 'px';
        textarea.focus();
        textarea.addEventListener('keypress', checkTextarea);

        function checkTextarea(e) {
            var keyCode = event.hasOwnProperty('which') ? event.which : event.keyCode;
            if (keyCode == 13) {
                e.preventDefault();
                addText(textPos, textarea.value); //在canvas上显示文字
                textarea.style.display = 'none'; //隐藏textarea
                //broadcast message
                var pkg = {
                    type: 'Whiteboard Text',
                    message: {mouse: textPos, text: textarea.value}
                };
                broadcastMessage(pkg);
            }
        }
    }

    /**
     * 拖动textarea
     * @param e
     */
    function mouseDownOnTextarea(e) {
        var x = textarea.offsetLeft - e.clientX,
            y = textarea.offsetTop - e.clientY;

        function drag(e) {
            textarea.style.left = e.clientX + x + 'px';
            textarea.style.top = e.clientY + y + 'px';
        }

        function stopDrag() {
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        }

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    }

    function initSession(token) {
        // 新建Session
        session = new RTCat.Session(token);

        // 连接房间
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

        session.on('message', handleMessages);
    }

    $("a[id^='pen-']").click(function (e) {
        e.preventDefault();
        whiteboard.removeEventListener('click', addTextarea);
        var times = Number($(this).attr('id').substring(4, 5));
        penSize = 4 * times;
    });// change pen size

    $("a[id^='color-']").click(function (e) {
        e.preventDefault();
        whiteboard.removeEventListener('click', addTextarea);
        var color = $(this).attr('id').substring(6);
        penType = "source-over";
        penColor = color;
    }); // change pen colors

    $('#eraser').click(function () {
        whiteboard.removeEventListener('click', addTextarea);
        penType = "destination-out";
        penColor = "rgba(0,0,0,1.0)";
    }); // use eraser

    $('#clear').click(function () {
        whiteboard.removeEventListener('click', addTextarea);
        clearBoard();
        var pkg = {
            type: 'Clear Whiteboard'
        };
        broadcastMessage(pkg);
    }); // clear board

    $('#add-text').click(function () {
        whiteboard.addEventListener('click', addTextarea);
    }); // add text

    whiteboard.onmousemove = function (e) {
        var thisPos = getMousePos(e);
        if (mouseDown) {
            draw([lastPos, thisPos], penType, penColor, penSize);
            var pkg = {
                type: 'Whiteboard',
                message: {mouse: [lastPos, thisPos], penType: penType, penColor: penColor, penSize: penSize}
            };
            broadcastMessage(pkg);
        }
        lastPos = thisPos;
    };

    whiteboard.onmousedown = function (e) {
        mouseDown = true
    };

    whiteboard.onmouseup = function (e) {
        mouseDown = false
    };

    whiteboard.onmouseout = function () {
        mouseDown = false
    };

}).apply(this, [jQuery]);
