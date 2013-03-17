/**
 * 严松的个人Chrome插件
 * @Author yss.nelson@gmail.com
 * @Created 2013-03-01
 * @Update:
 *      1. [2013-03-04 improve] 重构代码，提出公用层，增加了提示。
 *      2. [2013-03-07 bugfix] 重复点击定时刷新导致的触发多个定时刷新，并且不能停止的问题。
 *      3. [2013-03-08 bugfix] 每次点右上角的图片，其实都相当于新开一个页面，这样的话，就不能记录上次是否已点击刷新了。这样以来，就直接使用之前加一个clearInterval()，第一次用，会报错哦~
 *      4. [2013-03-16 improve] 使用summary和details，增加动态刷新时执行一段js代码。
 */
// 弹出层是否第一次执行
var POP_STATUS = true;
function showPop(startMsg, endMsg) {
    if (POP_STATUS) {
        POP_STATUS = false;
        exec(function showMsg(startMsg, endMsg) {
            var popId = 'ys-pop',
                pop = document.getElementById(popId);
            if (!pop) {
                var parent = document.createElement('div');
                parent.setAttribute('style', 'position:fixed; z-index:999; top:0; left:0; width:100%; line-height:1.5; text-align:center; font-size:16px; font-weight:bold; color:white;');
                pop = document.createElement('p');
                pop.id = popId;
                pop.setAttribute('style', 'opacity:0; margin:0 auto; min-width:200px; max-width:400px; padding:5px 10px; background:#009499; border:3px solid #3E4040; border-top:none; border-radius:0 0 5px 5px; -webkit-transition:all 1s ease-in;');
                document.body.appendChild(parent);
                parent.appendChild(pop);
            }
            pop.innerHTML = startMsg;
            pop.style.opacity = 1;
            setTimeout(function() {
                endMsg && (pop.innerHTML = endMsg);
                pop.style.opacity = 0;
            }, 3000);
        });
    }
    execFn('showMsg', [startMsg, endMsg]);
    
}
/**
 * 在当前页面执行给定的字符串
 * @param {String|Function|Object|Array} value
 * @param {Boolean} isClose [false]
 */
function exec(value, isClose) {
    if (typeof value === 'function') {
        value = value.toString();
    } else if (typeof value === 'object') {
        value = JSON.stringify(value);
    }

    if (value && typeof value !== 'string') {
        alert('Error params before exec');
    }

    chrome.tabs.executeScript(null, {
        code: value
    });
    // isClose && window.close();
}

/**
 * 执行函数方法
 * @param {String} fnName 函数名
 * @param {Any} args 注明：如果要传数组，则需要这样使用[[1,2,3]]
 * @param {String} assignName 变量名，用于当前函数赋值名
 */
function execFn(fnName, args, assignName) {
    var str = '';
    if (assignName) {
        str = assignName + '=';
    }

    if (args) {
        str += fnName + '(';
        if ($.isArray(args)) {
            str += arrayToArgs(args);
        } else {
            str += stringify(args);
        }
        str += ');';
        console.log(str);
        exec(str);
    }
}

function arrayToArgs(arr) {
    if ($.isArray(arr)) {
        arr = arr.map(function(item) {
            return stringify(item);
        });
        return arr.join(',');
    }
    return '';
}

function stringify(any) {
    if (typeof any === 'function') {
        return any.toString();
    } else {
        if (typeof any === 'undefined') {
            return '""';
        }
        return JSON.stringify(any);
    }
}

$(function() {
    // 用于interval返回值
    var NAME = 'REFRESH',
        isRefreshed = false;
    $(document.forms['refreshForm']).submit(function() {
        if (isRefreshed) {
            showPop('网页已自动刷新中，请勿重复点击，谢谢~');
            return;
        }
        isRefreshed = true;
        exec(function refresh(time, url, script) {
            time = time || 6;
            url = url || window.location.href;
            var doc = document.documentElement,
                height = doc.clientHeight,
                width = doc.clientWidth;

            function run() {
                var frameId = 'ys-refresh-iframe',
                    frame = document.getElementById(frameId);
                if (!frame) {
                    document.body.innerHTML = '<div id="' + frameId + '"></div>';
                    frame = document.getElementById(frameId);
                }
                frame.innerHTML = '<iframe src="' + url +'" height="' + height + '" width="' + width + '" frameborder="0" allowtransparent="true" scrolling="yes" name="refreshFrame"></iframe>';
                script && (frame.firstChild.onload = function() {
                    eval('(window.frames["refreshFrame"].window.' + script + ')');
                })
            }
            run();
            return setInterval(run, time * 1000);
        });
        // exec(NAME + '=refresh(' + (this.time.value.trim() || '') + ',' + this.url.value.trim() + ');');
        // 防止重复点击刷新，但是第一次会报错，因为没有定义那个值。
        exec(NAME + ' && clearInterval(' + NAME + ');');
        execFn('refresh', [this.time.value.trim(), this.url.value.trim(), this.js.value.trim()], NAME);
        showPop('正在自动刷新中...');
        return false;
    });

    $('#stop-refresh').click(function() {
        exec('clearInterval(' + NAME + ');');
        showPop('正在停止自动刷新中...');
        isRefreshed = false;
        return false;
    });
});

$(function() {
    var transcodeForm = document.forms.transcodeForm;
    $(transcodeForm).submit(function() {
        var word = this.gbk.value.trim();
        if (word) {
            this.utf.value = encodeURIComponent(word);
            this.utf.select();
        } else  {
            showPop('请输入中文文字。');
        }
        return false;
    });
    $(transcodeForm.utftogbk).click(function() {
        var word = transcodeForm.utf.value.trim();
        if (word) {
            transcodeForm.gbk.value = decodeURIComponent(word);
            transcodeForm.gbk.select();
        } else  {
            showPop('请输入UTF-8编码后的文字。');
        }
        return false;
    });
});
