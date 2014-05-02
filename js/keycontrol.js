/**
 * keycontrol.js
 *
 * version  1.2.0
 *
 * Copyright 2012 tksimsuko.
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 * 
*/
function keycontrol(target, type, metaKeySet, key, callback){
	var kcTarget = target || window;
	var kcType = type || "keydown";
	// metaKey
	var metaKeyProp = getMetaKeyProp(metaKeySet);
    //key
	var keyProp = {
		"enter":13, "capslock":20, "esc":27, "space":32, "pageup":33, "pagedown":34, "end":35, "home":36, "left":37, "up":38, "right":39, "down":40, "printscreen":44, "insert":45, "delete":46, 
		"0":48, "1":49, "2":50, "3":51, "4":52, "5":53, "6":54, "7":55, "8":56, "9":57, 
		"a":65, "b":66, "c":67, "d":68, "e":69, "f":70, "g":71, "h":72, "i":73, "j":74, "k":75, "l":76, "m":77, "n":78, "o":79, "p":80, "q":81, "r":82, "s":83, "t":84, "u":85, "v":86, "w":87, "x":88, "y":89, "z":90, 
		"F1":112, "F2":113, "F3":114, "F4":115, "F5":116, "F6":117, "F7":118, "F8":119, "F9":120, "F10":121, "F11":122, "F12":123, 
		"numlock":144, "scrolllock":145, ",":188, ".":190
	};
	var kcKey = key;

    // callback
    var kcCallback = callback;
    
    //validate
    if((!metaKeySet || metaKeySet.length === 0) && !key){
    	console.error("keycontrol is not binded. key is not setting.");
    	return;
    }
	// バインド
	on();

	return {
		on: on,
		off: off,
		resetKey: function(rbMetaKeyProp, rbKey){
            if(rbMetaKeyProp) metaKeyProp = getMetaKeyProp(rbMetaKeyProp);
            if(rbKey) kcKey = rbKey;
		},
        rebind: function(rbType, rbMetaKeyProp, rbKey, cb){
            // 初期化
			kcType = rbType;
            if(rbMetaKeyProp) metaKeyProp = getMetaKeyProp(rbMetaKeyProp);
            if(rbKey) kcKey = rbKey;
            if(cb) kcCallback = cb;
            off();
            on();
        }
	};

	function keyBind(event){
		var keyCode = keyProp[kcKey];
		if(isKeyPressed(event, metaKeyProp, keyCode)) return kcCallback(event);
	}

	function on(){
		if(kcTarget.addEventListener){
			kcTarget.addEventListener(kcType, keyBind, false);
		}else if(kcTarget.attachEvent){
			kcTarget.attachEvent("on" + kcType, keyBind);
		}
	}
	function off(){
		if(kcTarget.removeEventListener){
			kcTarget.removeEventListener(kcType, keyBind, false);
		}else if(kcTarget.attachEvent){
			kcTarget.detachEvent("on" + kcType, keyBind);
		}
	}
	function getMetaKeyProp(metaKeys){
		var metaKeyProp = {
			alt: false,
			ctrl: false,
			command: false,
			shift: false
		};
		for(var i in metaKeys){
			var metaKey = metaKeys[i];
			metaKeyProp[metaKey] = true;
		}
		return metaKeyProp;
	}
	function isKeyPressed(event, targetMetaKey, targetKey){
		return isMetaKey(event, targetMetaKey) && isKey(event, targetKey);
	}

	// meta key 判定
	// metaProp の状態と完全一致 判定
	// @param event: keyDown event
	// @param targetMetaKey: 対象となるメタキー 必須 以下すべて必須
	//		alt
	//		command
	//		ctrl
	//		shift
	function isMetaKey(event, targetMetaKey){
		if(targetMetaKey.alt !== event.altKey) return false;
		if(targetMetaKey.ctrl !== event.ctrlKey) return false;
		if(targetMetaKey.shift !== event.shiftKey) return false;
		if(targetMetaKey.command !== event.metaKey) return false;
		return true;
	}
	// key 判定
	// @param event: keyDown event
	// @param targetKeyCode  keyCode
	function isKey(event, targetKeyCode){
		var keyCode = event.keyCode;
		if(targetKeyCode && (targetKeyCode !== keyCode)) return false;
		return true;
	}
}