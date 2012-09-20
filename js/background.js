var LABEL_STORE_KEY = "labelStore";
var SELECT_WIN_ID = "selectedWindowId";

//コンテンツスクリプトからリクエストを受け取る
chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		if(request){
			switch(request.status){
				case "read" :
					var labelStore = JSON.parse(window.localStorage.getItem(LABEL_STORE_KEY));
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
					sendResponse({
						isDeleted:true
					});
				default : 
					break;
			}
		}
	}
);

//コンテンツスクリプトにリクエストを送る
function sendRequestToPage(data, callback){
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendRequest(tab.id, data, function(response) {
			if(callback) callback(response);
		});
	});
}
//コンテンツスクリプトにリクエストを送る
function sendRequestToPageById(id, data, callback){
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendRequest(id, data, function(response) {
			if(callback) callback(response);
		});
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
	var winId = parseInt(window.sessionStorage.getItem(SELECT_WIN_ID));
	chrome.windows.get(winId, {
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
	
})
/*
* url : {id:label}
*/
function save(request){
	var url = request.url;
	var title = request.title;
	var id = request.id;
	var label = request.label;
	var labelStore = JSON.parse(window.localStorage.getItem(LABEL_STORE_KEY));

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

		window.localStorage.setItem(LABEL_STORE_KEY, JSON.stringify(labelStore));
		return;
	}

	
	if(url in labelStore){
		//update urlLabels
		var lbls = labelStore[url].labels;
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
	window.localStorage.setItem(LABEL_STORE_KEY, JSON.stringify(labelStore));
}
function deleteUrlLabel(url){
	var labelStore = JSON.parse(window.localStorage.getItem(LABEL_STORE_KEY));
	if(labelStore[url]){
		delete labelStore[url];
		window.localStorage.setItem(LABEL_STORE_KEY, JSON.stringify(labelStore));
	}
	publishTo(url, {
		status:"delete"
	}, function(response){});
}
function deleteLabel(url, id){
	var labelStore = JSON.parse(window.localStorage.getItem(LABEL_STORE_KEY));
	var urlLabels = labelStore[url];
	if(urlLabels.labels){
		var labels = urlLabels.labels;
		for(labelId in labels){
			if(labelId == id) {
				delete labels[id];
				if(isEmptyObject(labels)){
					delete labelStore[url];
					if(isEmptyObject(labelStore)){
						window.localStorage.removeItem(LABEL_STORE_KEY);
					}else{
						window.localStorage.setItem(LABEL_STORE_KEY, JSON.stringify(labelStore));
					}
				}else{
					labelStore[url].labels = labels;
					window.localStorage.setItem(LABEL_STORE_KEY, JSON.stringify(labelStore));
				}
				return;
			}
		}
	}
}
function isEmptyObject(obj){
	for(i in obj) return false;
	return true;
}