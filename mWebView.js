let u = navigator.userAgent;
let verPhone = {
    ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), // ios终端
    android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1 // android终端
};

const connectWebViewJavascriptBridge = (callback) => { // android判断WebViewJavascriptBridge 
    if (window.WebViewJavascriptBridge) {
	    callback(WebViewJavascriptBridge)
	} else {
	    document.addEventListener('WebViewJavascriptBridgeReady', function() {
	       callback(WebViewJavascriptBridge)
	    }, false)
	}
}   

const setupWebViewJavascriptBridge = (callback) => { // ios判断WebViewJavascriptBridge 
    if (window.WebViewJavascriptBridge) { 
      return callback(WebViewJavascriptBridge); 
    }
    if (window.WVJBCallbacks) { 
      return window.WVJBCallbacks.push(callback); 
    }
    window.WVJBCallbacks = [callback];
    var WVJBIframe = document.createElement('iframe');
	    WVJBIframe.style.display = 'none';
	    WVJBIframe.src = 'https://__bridge_loaded__';
    document.documentElement.appendChild(WVJBIframe);
    setTimeout(function () { 
      document.documentElement.removeChild(WVJBIframe) 
    }, 0);
}

const jnsApi = () => { // 利用Android来获取Android端的方法的回调数据
	let isAndroid = { 
	    registerHandler: function (type) {  // registerHandler 这个方法是从Android拿到数据给前端回调。
		  return new Promise((resolve, reject) => {
			    connectWebViewJavascriptBridge ((bridge) => {
				    bridge.registerHandler(type, function(data) {
				        let datas = JSON.stringify(data);
				       	resolve(datas)
				    })
				});
		  })
	    },
	    callHandler: function (type, params) { // callHandler 客户端定义一个方法，然后h5把参数数据，发送到客户端数据
            return new Promise((resolve, reject) => {
            	    connectWebViewJavascriptBridge ((bridge) => {
					    bridge.callHandler(type, params,function(data) {
	                        let datas = JSON.stringify(data);
				       			resolve(datas)
					    })
					});
	            })
	    }
	}
	let isIos = { // 利用WebViewJavascriptBridge来是获取ios端的方法的回调数据
		registerHandler: function (type) {
			return new Promise((resolve, reject) => {
				setupWebViewJavascriptBridge ((bridge) => {
				//注册一个方法（方法名是“JS Echo”），客户端进行调用（方法名也是“JS Echo”），responseCallback是回调函数
				    bridge.registerHandler(type, function(data) {
				        let datas = JSON.stringify(data);
						resolve(datas)
				    })
				})
			})
		},
        callHandler: function (type, params) {
        	return new Promise((resolve, reject) => { // registerHandler 这个方法是从ios拿到数据 给前端。
					connectWebViewJavascriptBridge ((bridge) => { 
					    bridge.callHandler(type, params, function(data) {
				            let datas = JSON.stringify(data);
			       			resolve(datas)
					    })
					});
        	})
        }
	}
	return verPhone.android ? isAndroid: isIos;
}

