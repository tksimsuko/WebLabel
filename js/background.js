//storage
var storage = window.localStorage;
var ON_OFF_KEY = "onOffSetting";
var LABEL_STORE_KEY = "labelStore";
var TEMPLATE_SETTING_KEY = "templateSetting";
var COMMAND_SETTING_KEY = "commandSetting";
var SELECT_WIN_ID = "selectedWindowId";

// initialize after install
chrome.runtime.onInstalled.addListener(function(){
	//on off 設定
	if(!storage.getItem(ON_OFF_KEY)){
		storage.setItem(ON_OFF_KEY, "on");
	}

	//template 設定
	if(!storage.getItem(TEMPLATE_SETTING_KEY)){
		storage.setItem(TEMPLATE_SETTING_KEY, JSON.stringify({
			width: "200px",
			height: "100px",
			backgroundColor: "#ffff00",
			borderColor: "#f1c232",
			color: "#000",
			fontSize: "14"
		}));
	}

	//command 設定
	if(!storage.getItem(COMMAND_SETTING_KEY)){
		storage.setItem(COMMAND_SETTING_KEY, JSON.stringify({
			create: "",
			save: ""
		}));
	}
});

//コンテンツスクリプトからリクエストを受け取る
chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		if(!request){
			sendResponse();
			return;
		}

		switch(request.status){
			case "read" :
				var onOff = storage.getItem(ON_OFF_KEY);
				if(onOff === "off"){
					sendResponse();
					return;
				}

				var labelStore = JSON.parse(storage.getItem(LABEL_STORE_KEY));
				if(!labelStore) return; 
				var urlLabels = labelStore[request.url]
				if(urlLabels) sendResponse(urlLabels);
				break;
			case "save" :
				save(request);
				sendResponse({
					isSaved:true
				});
				break;
			case "delete" :
				deleteLabel(request.url, request.id);
				sendResponse();
				break;
			case "getCmd" :
				var cmds = JSON.parse(storage.getItem(COMMAND_SETTING_KEY));
				var template = JSON.parse(storage.getItem(TEMPLATE_SETTING_KEY));
				sendResponse({
					cmds: cmds,
					template: template
				});
				break;
			default : 
				break;
		}
	}
);

//コンテンツスクリプトにリクエストを送る
function sendRequestToPage(data, callback){
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendMessage(tab.id, data, function(response) {
			if(callback) callback(response);
		});
	});
}
//コンテンツスクリプトにリクエストを送る
function sendRequestToPageById(id, data, callback){
	chrome.tabs.sendMessage(id, data, function(response) {
		if(callback) callback(response, chrome.extension.lastError);
	});
}

//private
//publish
function publishTo(url, data, callback){
	chrome.windows.getAll({
		populate:true
	},function(windowArray){
		var winCnt = windowArray.length;
		for(i=0; i<winCnt; i++){
			var win = windowArray[i];
			var tabs = win.tabs;
			var tabsCnt = tabs.length;
			for(j=0; j<tabsCnt; j++){
				var tab = tabs[j];
				if(tab.url == url){
					sendRequestToPageById(tab.id, data, callback);
				}
			}
		}
	});
}
//request to ActiveTab
function requestPopupToPage(data, callback){
	var winId = window.sessionStorage.getItem(SELECT_WIN_ID);
	if(!winId){
		chrome.windows.getCurrent(function(window){
			requestPopupToSelectedWindowPage(window.id, data, callback);
		});
	}else{
		winId = parseInt(winId);
		requestPopupToSelectedWindowPage(winId, data, callback);
	}
}
function requestPopupToSelectedWindowPage(windowId, data, callback){
	chrome.windows.get(windowId, {
		populate:true
	}, function(win){
		var tabs = win.tabs;
		var tabsCnt = tabs.length;
		for(j=0; j<tabsCnt; j++){
			var tab = tabs[j];
			if(tab.active){
				sendRequestToPageById(tab.id, data, callback);
				return;
			}
		}
	});
}

//window focus
chrome.windows.onFocusChanged.addListener(function(windowId){
	if(windowId<0) return;
	chrome.windows.get(windowId, function(win){
		if(win.type == "popup") return;
		window.sessionStorage.setItem(SELECT_WIN_ID, windowId);
	});
	
});

// context menu
chrome.contextMenus.create({
	title: "Add Label",
	contexts: ["all"],
	onclick: function(info, tab){
		createFromContextMenu();
	}
});

// create
function create(callback){
	var templateSetting = JSON.parse(storage.getItem(TEMPLATE_SETTING_KEY));
	requestPopupToPage({
		status:"create",
		templateSetting:templateSetting
	}, callback);
}
function createFromContextMenu(){
	var templateSetting = JSON.parse(storage.getItem(TEMPLATE_SETTING_KEY));
	requestPopupToPage({
		status:"createFromContextMenu",
		templateSetting:templateSetting
	});
}
/*
* url : {id:label}
*/
function save(request){
	var url = request.url;
	var title = request.title;
	var id = request.id;
	var label = request.label;
	var labelStore = JSON.parse(storage.getItem(LABEL_STORE_KEY));

	//new url array insert
	if(!labelStore){
		var labelStore = {};

		var urlLabels = {
			url:url,
			title:title
		};

		var lbls = {};
		lbls[id] = label;
		urlLabels.labels = lbls;
		labelStore[url] = urlLabels;
		storage.setItem(LABEL_STORE_KEY, JSON.stringify(labelStore));
		return;
	}

	
	if(url in labelStore){
		//update urlLabels
		var urlLabels = labelStore[url];
		var lbls = urlLabels.labels;
		lbls[id] = label;
		labelStore[url].labels = lbls;
	}else{
		//add urlLabels
		var urlLabels = {
			url:url,
			title:title
		};
		var lbls = {};
		lbls[id] = label;
		urlLabels.labels = lbls;
		labelStore[url] = urlLabels;
	}
	storage.setItem(LABEL_STORE_KEY, JSON.stringify(labelStore));
}
function deleteUrlLabel(url){
	var labelStore = JSON.parse(storage.getItem(LABEL_STORE_KEY));
	if(labelStore[url]){
		delete labelStore[url];
		storage.setItem(LABEL_STORE_KEY, JSON.stringify(labelStore));
	}
	publishTo(url, {
		status:"delete"
	}, function(response){});
}
function deleteLabel(url, id){
	var labelStore = JSON.parse(storage.getItem(LABEL_STORE_KEY));
	var urlLabels = labelStore[url];

	//update dataStore
	if(urlLabels.labels){
		var labels = urlLabels.labels;
		for(labelId in labels){
			if(labelId == id) {
				delete labels[id];
				if(isEmptyObject(labels)){
					delete labelStore[url];
					if(isEmptyObject(labelStore)){
						storage.removeItem(LABEL_STORE_KEY);
					}else{
						storage.setItem(LABEL_STORE_KEY, JSON.stringify(labelStore));
					}
				}else{
					labelStore[url].labels = labels;
					storage.setItem(LABEL_STORE_KEY, JSON.stringify(labelStore));
				}
			}
		}
	}
}

//util
function isEmptyObject(obj){
	for(i in obj) return false;
	return true;
}