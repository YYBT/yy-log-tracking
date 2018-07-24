(function (window, document) {
    // 用户名
    const useridstring = 'userid'
    // 唯一id名
    const lutrackidstring = 'lutrackid'
    // 事件名
    const eventNamestring = 'eventName'
    // 本地保存全局数据
    const luregisterPagestring = 'luregisterPage'

    function createHttpRequest() {
        if (window.ActiveXObject) {
            return new ActiveXObject("Microsoft.XMLHTTP");
        } else if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        }
    }

    function AliLogTracker(host, project, logstore) {
        this.uri_ = 'https://' + project + '.' + host + '/logstores/' + logstore + '/track?APIVersion=0.6.0';
        this.params_ = new Array();
        this.httpRequest_ = createHttpRequest();
        this.getLutrackid()
        localStorage.removeItem(luregisterPagestring)
    }
    AliLogTracker.prototype = {

        push: function (key, value) {
            if (!key || !value) {
                return;
            }
            this.params_.push(key);
            this.params_.push(value);
        },
        logger: function () {
            var url = this.uri_;
            var k = 0;
            while (this.params_.length > 0) {
                if (k % 2 == 0) {
                    url += '&' + encodeURIComponent(this.params_.shift());
                } else {
                    url += '=' + encodeURIComponent(this.params_.shift());
                }
                ++k;
            }
            try {
                this.httpRequest_.open("GET", url, true);
                this.httpRequest_.send(null);
            } catch (ex) {
                if (window && window.console && typeof window.console.log === 'function') {
                    console.log("Failed to log to ali log service because of this exception:\n" + ex);
                    console.log("Failed log data:", url);
                }
            }

        },
        //设置cookie
        setCookie(c_name, value, expiredays) {
            var exdate = new Date()
            exdate.setDate(exdate.getDate() + expiredays)
            document.cookie = c_name + "=" + escape(value) +
                ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString())
        },
        //取回cookie
        getCookie(c_name) {
            if (document.cookie.length > 0) {
                c_start = document.cookie.indexOf(c_name + "=")
                if (c_start != -1) {
                    c_start = c_start + c_name.length + 1
                    c_end = document.cookie.indexOf(";", c_start)
                    if (c_end == -1) c_end = document.cookie.length
                    return unescape(document.cookie.substring(c_start, c_end))
                }
            }
            return ""
        },
        //判断浏览器的版本 判断是否是微信浏览器
        is_weixin() {
            var ua = navigator.userAgent.toLowerCase();
            if (ua.match(/MicroMessenger/i) == "micromessenger") {
                return true;
            } else {
                return false;
            }
        },
        // 获取全局数据
        getlocalStorage() {
            var obj = {}
            if (localStorage[luregisterPagestring]) {
                obj = JSON.parse(localStorage[luregisterPagestring])
            }
            return obj
        },
        // 设置全局数据
        setlocalStorage(obj) {
            localStorage[luregisterPagestring] = JSON.stringify(obj)
        },
        // 打开调试
        openlog(flog) {
            this.openlog = flog
        },
        // 重置唯一id
        resetLutrackid() {
            var id = Number(Math.random().toString().substr(3, 5) + Date.now()).toString(36)
            localStorage.lutrackid = id
        },
        //生成唯一id
        getLutrackid() {
            var id = null
            if(this.is_weixin()){
                if (this.getCookie(lutrackidstring)) {
                    id = this.getCookie(lutrackidstring)
                } else {
                    id = Number(Math.random().toString().substr(3, 5) + Date.now())
                    this.setCookie(lutrackidstring,id,365)
                }
            }else{
                if (localStorage.lutrackid) {
                    id = localStorage.lutrackid
                } else {
                    id = Number(Math.random().toString().substr(3, 5) + Date.now())
                    localStorage.lutrackid = id
                }
            }
            return id;
        },
        //注册全局参数
        registerPage: function (obj) {
            obj[lutrackidstring] = this.getLutrackid()
            obj[useridstring] = this.userid
            this.setlocalStorage(obj)
        },
        // 注册用户id 绑定用户系统里的id
        registerUserid: function (userid) {

            var obj = this.getlocalStorage()
            obj[useridstring] = userid
            this.userid = userid
            this.setlocalStorage(obj)
        },
        // 发送数据
        pushObj: function (eventName, obj) {
            this.push(eventNamestring, eventName)
            var keys = Object.keys(obj)
            for (var i = 0; i <= keys.length; i++) {
                this.push(keys[i], obj[keys[i]])
            }

            var localStorage = this.getlocalStorage()
            var localkeys = Object.keys(localStorage)
            for (var j = 0; j <= localkeys.length; j++) {
                this.push(localkeys[j], localStorage[localkeys[j]])
            }

            if (this.openlog) {
                console.log(this.params_)
            }
            this.logger()
        },
        // 发送数据
        pushJson: function (eventName, obj) {
            obj['eventName'] = eventName
            this.push('event', JSON.stringify(obj))
            var localStorage = this.getlocalStorage()
            var localkeys = Object.keys(localStorage)
            for (var j = 0; j <= localkeys.length; j++) {
                this.push(localkeys[j], localStorage[localkeys[j]])
            }

            if (this.openlog) {
                console.log(this.params_)
            }
            this.logger()
        }
    };
    window.Tracker = AliLogTracker;
})(window, document);