
//storage
var storage = window.localStorage;
var ON_OFF_KEY = "onOffSetting";
var TEMPLATE_SETTING_KEY = "templateSetting";
var COMMAND_SETTING_KEY = "commandSetting";

//setting
var $onOff = document.getElementById("onOff");
var $on = document.getElementById("on");
var $onInput = $on.querySelector("input");
var $off = document.getElementById("off");
var $offInput = $off.querySelector("input");

//template
var $bgColor = document.getElementById("backgroundColor");
var $borderColor = document.getElementById("borderColor");
var $color = document.getElementById("color");
var $fontSize = document.getElementById("fontSize");
var $width = document.getElementById("width");
var $height = document.getElementById("height");
var $previewLabel = document.querySelector(".previewLabel");

//command
var $createCommand = document.getElementById("createCommand");
var $saveCommand = document.getElementById("saveCommand");
var $deleteCreateCmd = document.querySelector(".deleteCreateCmd");
var $deleteSaveCmd = document.querySelector(".deleteSaveCmd");


///// 設定初期化 /////
// init on off onOffSetting
initOnOffSetting();
// init template templateSetting
initTemplateSetting();
// init command setting
initCommandSetting();
//init preview label
applyTemplateSetting();

// //bind
$on.addEventListener("click", function(event){
	storage.setItem(ON_OFF_KEY, "on");
	changeOn();
}, false);
$off.addEventListener("click", function(event){
	storage.setItem(ON_OFF_KEY, "off");
	changeOff();
});
$bgColor.addEventListener("change", function(event){
	storeTemplateSetting();
	applyTemplateSetting();
});
$borderColor.addEventListener("change", function(event){
	storeTemplateSetting();
	applyTemplateSetting();
});
$color.addEventListener("change", function(event){
	storeTemplateSetting();
	applyTemplateSetting();
});
$fontSize.addEventListener("change", function(event){
	storeTemplateSetting();
	applyTemplateSetting();
});
$width.addEventListener("change", function(event){
	storeTemplateSetting();
	applyTemplateSetting();
});
$height.addEventListener("change", function(event){
	storeTemplateSetting();
	applyTemplateSetting();
});
resizable({
	resizeElement: $previewLabel,
	onResizeEnd: function(event){
		var width = $previewLabel.style.width;
		var height = $previewLabel.style.height;

		var templateSetting = JSON.parse(storage.getItem(TEMPLATE_SETTING_KEY));
		templateSetting.width = width;
		templateSetting.height = height;
		storage.setItem(TEMPLATE_SETTING_KEY, JSON.stringify(templateSetting));

		$width.value = parseInt(width.replace("px", ""));
		$height.value = parseInt(height.replace("px", ""));
	}
});

$createCommand.addEventListener("keyup", function(event){
	var cmds = getCommandSetting();
	cmds.create = this.cmd;
	setCommandSetting(cmds);
});
$saveCommand.addEventListener("keyup", function(event){
	var cmds = getCommandSetting();
	cmds.save = this.cmd;
	setCommandSetting(cmds);
});
$deleteCreateCmd.addEventListener("click", function(event){
	$createCommand.value = "";
	$createCommand.cmd = "";

	var cmds = getCommandSetting();
	cmds.create = "";
	setCommandSetting(cmds);
});
$deleteSaveCmd.addEventListener("click", function(event){
	$saveCommand.value = "";
	$saveCommand.cmd = "";

	var cmds = getCommandSetting();
	cmds.save = "";
	setCommandSetting(cmds);
});
bindKeyCommandSetting($createCommand);
bindKeyCommandSetting($saveCommand);


function initTemplateSetting(){
	var templateSetting = JSON.parse(storage.getItem(TEMPLATE_SETTING_KEY));
	$bgColor.value = getColor(templateSetting.backgroundColor);
	$borderColor.value = getColor(templateSetting.borderColor);
	$color.value = getColor(templateSetting.color);
	$fontSize.value = templateSetting.fontSize;

	var width = templateSetting.width || "200px";
	var height = templateSetting.height || "100px";
	$width.value = parseInt(width.replace("px", ""));
	$height.value = parseInt(height.replace("px", ""));
}
function initCommandSetting(){
	var commandSetting = JSON.parse(storage.getItem(COMMAND_SETTING_KEY));
	var createCommand = commandSetting.create;
	$createCommand.value = generateCommandString(createCommand);
	var saveCommand = commandSetting.save;
	$saveCommand.value =  generateCommandString(saveCommand);
}
function initOnOffSetting(){
	var onOffSetting = storage.getItem(ON_OFF_KEY);
	if(onOffSetting === "on"){
		changeOn();
	}else if(onOffSetting === "off"){
		changeOff();
	}
}
function storeTemplateSetting(){
	var templateSetting = {};
    templateSetting.backgroundColor = $bgColor.value;
    templateSetting.borderColor = $borderColor.value;
    templateSetting.color = $color.value;
    templateSetting.fontSize = $fontSize.value;
    templateSetting.width = $width.value + "px";
    templateSetting.height = $height.value + "px";

    storage.setItem(TEMPLATE_SETTING_KEY, JSON.stringify(templateSetting));
}
function getCommandSetting(){
	return JSON.parse(storage.getItem(COMMAND_SETTING_KEY));
}
function setCommandSetting(cmds){
	storage.setItem(COMMAND_SETTING_KEY, JSON.stringify(cmds));
}
function applyTemplateSetting(){
	var templateSetting = JSON.parse(storage.getItem(TEMPLATE_SETTING_KEY));
	$previewLabel.style.backgroundColor = getColor(templateSetting.backgroundColor);
	$previewLabel.style.borderColor = getColor(templateSetting.borderColor);
	$previewLabel.style.color = getColor(templateSetting.color);
	$previewLabel.style.fontSize = templateSetting.fontSize + "px";
	$previewLabel.style.width = templateSetting.width || "200px";
	$previewLabel.style.height = templateSetting.height || "100px";
}
function changeOn(){
	$onInput.setAttribute("checked", "checked");
	$on.style.background = "gold";
	$offInput.removeAttribute("checked");
	$off.style.background = "#ccc";

	chrome.browserAction.setBadgeText({text: ""});
}
function changeOff(){
	$onInput.removeAttribute("checked");
	$on.style.background = "#ccc";
	$offInput.setAttribute("checked", "checked");
	$off.style.background = "firebrick";

	chrome.browserAction.setBadgeText({text: "off"});
	chrome.browserAction.setBadgeBackgroundColor({color: "firebrick"});	
}

function bindKeyCommandSetting(element){
	element.addEventListener("keydown", function(event){
		var which = event.which;
		if(which === 9){
			return;
		}

		var keys = [];
		if(event.altKey){
			keys.push("alt");
		}
		if(event.ctrlKey){
			keys.push("ctrl");
		}
		if(event.metaKey){
			keys.push("command");
		}
		if(event.shiftKey){
			keys.push("shift");
		}
		
		//key
		var keyProp = {
			13:"enter", 20:"capslock", 27:"esc", 32:"space", 33:"pageup", 34:"pagedown", 35:"end", 36:"home", 37:"left", 38:"up", 39:"right", 40:"down", 44:"printscreen", 45:"insert", 46:"delete", 
			48:"0", 49:"1", 50:"2", 51:"3", 52:"4", 53:"5", 54:"6", 55:"7", 56:"8", 57:"9", 
			65:"a", 66:"b", 67:"c", 68:"d", 69:"e", 70:"f", 71:"g", 72:"h", 73:"i", 74:"j", 75:"k", 76:"l", 77:"m", 78:"n", 79:"o", 80:"p", 81:"q", 82:"r", 83:"s", 84:"t", 85:"u", 86:"v", 87:"w", 88:"x", 89:"y", 90:"z", 
			96:"0", 97:"1", 98:"2", 99:"3", 100:"4", 101:"5", 102:"6", 103:"7", 104:"8", 105:"9", 
			112:"F1", 113:"F2", 114:"F3", 115:"F4", 116:"F5", 117:"F6", 118:"F7", 119:"F8", 120:"F9", 121:"F10", 122:"F11", 123:"F12", 
			144:"numlock", 145:"scrolllock" ,188:",", 190:"."
		};
		var keyValue = keyProp[which] || "";
		
		var cmd = {
			meta: keys,
			key: keyValue
		};

		element.value = generateCommandString(cmd);
		element.cmd = cmd;

		event.preventDefault();
		return false;
	});
}

function generateCommandString(cmd){
	if(!cmd){
		return "";
	}

	var value = "";
	var keys = cmd.meta;
	var lastIndex = keys.length - 1;
	for(var i in keys){
		value += keys[i];
		if(i != lastIndex){
			value = value + " + ";
		}
	}

	if(cmd.key){
		var keyValue = cmd.key;
		if(keyValue && keys.length > 0){
			value += " + ";
		}
		value += keyValue;
	}
	return value;
}
