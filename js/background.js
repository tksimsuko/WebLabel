const ON_OFF_KEY = "onOffSetting";
const LABEL_STORE_KEY = "labelStore";
const TEMPLATE_SETTING_KEY = "templateSetting";
const COMMAND_SETTING_KEY = "commandSetting";
const SELECT_WIN_ID = "selectedWindowId";

// 初回インストール時
chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.local.get([ON_OFF_KEY, TEMPLATE_SETTING_KEY, COMMAND_SETTING_KEY], (result) => {
		if (!result[ON_OFF_KEY]) {
			chrome.storage.local.set({ [ON_OFF_KEY]: "on" });
		}

		if (!result[TEMPLATE_SETTING_KEY]) {
			chrome.storage.local.set({
				[TEMPLATE_SETTING_KEY]: JSON.stringify({
					width: "200px",
					height: "100px",
					backgroundColor: "#ffff00",
					borderColor: "#f1c232",
					color: "#000",
					fontSize: "14"
				})
			});
		}

		if (!result[COMMAND_SETTING_KEY]) {
			chrome.storage.local.set({
				[COMMAND_SETTING_KEY]: JSON.stringify({
					create: "",
					save: ""
				})
			});
		}
	});
});

// メッセージ処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (!request) {
		sendResponse();
		return;
	}

	switch (request.status) {
		case "read":
			chrome.storage.local.get([ON_OFF_KEY, LABEL_STORE_KEY], (result) => {
				if (result[ON_OFF_KEY] === "off") {
					sendResponse();
					return;
				}
				const labelStore = JSON.parse(result[LABEL_STORE_KEY] || "{}");
				sendResponse(labelStore[request.url] || null);
			});
			break;

		case "save":
			save(request, () => sendResponse({ isSaved: true }));
			break;

		case "delete":
			deleteLabel(request.url, request.id, () => sendResponse());
			break;

		case "getCmd":
			chrome.storage.local.get([COMMAND_SETTING_KEY, TEMPLATE_SETTING_KEY], (result) => {
				sendResponse({
					cmds: JSON.parse(result[COMMAND_SETTING_KEY] || "{}"),
					template: JSON.parse(result[TEMPLATE_SETTING_KEY] || "{}")
				});
			});
			break;
		case "create":
			create(sendResponse);
			break;
		case "deleteUrlLabel":
			deleteUrlLabel(request.url, () => sendResponse());
			break;
		
		case "publishTo":
			publishTo(request.url, request.data, () => sendResponse());
			break;
	}

	return true;
});

// Context Menu
chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "add-label",
		title: "Add Label",
		contexts: ["all"]
	});
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "add-label") {
		createFromContextMenu();
	}
});

// Utility
function save(request, callback) {
	chrome.storage.local.get([LABEL_STORE_KEY], (result) => {
		const store = JSON.parse(result[LABEL_STORE_KEY] || "{}");
		const { url, id, label, title } = request;

		if (!store[url]) {
			store[url] = { url, title, labels: {} };
		}

		store[url].labels[id] = label;

		chrome.storage.local.set({ [LABEL_STORE_KEY]: JSON.stringify(store) }, callback);
	});
}

function deleteLabel(url, id, callback) {
	chrome.storage.local.get([LABEL_STORE_KEY], (result) => {
		let store = JSON.parse(result[LABEL_STORE_KEY] || "{}");
		const urlLabels = store[url];

		if (urlLabels?.labels?.[id]) {
			delete urlLabels.labels[id];

			if (isEmptyObject(urlLabels.labels)) {
				delete store[url];
			} else {
				store[url].labels = urlLabels.labels;
			}

			const finalStore = isEmptyObject(store) ? null : JSON.stringify(store);

			if (finalStore === null) {
				chrome.storage.local.remove([LABEL_STORE_KEY], callback);
			} else {
				chrome.storage.local.set({ [LABEL_STORE_KEY]: finalStore }, callback);
			}
		} else {
			callback();
		}
	});
}

function isEmptyObject(obj) {
	return Object.keys(obj).length === 0;
}

function sendRequestToPageById(id, data, callback) {
	chrome.tabs.sendMessage(id, data, response => {
		if (callback) callback(response);
	});
}

function publishTo(url, data, callback) {
	chrome.windows.getAll({ populate: true }, windows => {
		for (const win of windows) {
			for (const tab of win.tabs) {
				if (tab.url === url) {
					sendRequestToPageById(tab.id, data, callback);
				}
			}
		}
	});
}

function requestPopupToPage(data, callback) {
	chrome.storage.local.get([SELECT_WIN_ID], (result) => {
		const winId = parseInt(result[SELECT_WIN_ID], 10);
		if (winId) {
			requestPopupToSelectedWindowPage(winId, data, callback);
		} else {
			chrome.windows.getCurrent(win => {
				requestPopupToSelectedWindowPage(win.id, data, callback);
			});
		}
	});
}

function requestPopupToSelectedWindowPage(windowId, data, callback) {
	chrome.windows.get(windowId, { populate: true }, win => {
		for (const tab of win.tabs) {
			if (tab.active) {
				sendRequestToPageById(tab.id, data, callback);
				return;
			}
		}
	});
}

function create(callback) {
	chrome.storage.local.get([TEMPLATE_SETTING_KEY], (result) => {
		const template = JSON.parse(result[TEMPLATE_SETTING_KEY] || "{}");
		requestPopupToPage({ status: "create", templateSetting: template }, callback);
	});
}

function createFromContextMenu() {
	chrome.storage.local.get([TEMPLATE_SETTING_KEY], (result) => {
		const template = JSON.parse(result[TEMPLATE_SETTING_KEY] || "{}");
		requestPopupToPage({ status: "createFromContextMenu", templateSetting: template });
	});
}

// フォーカスされたウィンドウを保存
chrome.windows.onFocusChanged.addListener(windowId => {
	if (windowId < 0) return;
	chrome.windows.get(windowId, win => {
		if (win.type !== "popup") {
			chrome.storage.local.set({ [SELECT_WIN_ID]: String(windowId) });
		}
	});
});
function deleteUrlLabel(url, callback) {
	chrome.storage.local.get([LABEL_STORE_KEY], (result) => {
		let store = JSON.parse(result[LABEL_STORE_KEY] || "{}");

		if (store[url]) {
			delete store[url];
			if (isEmptyObject(store)) {
				chrome.storage.local.remove([LABEL_STORE_KEY], callback);
			} else {
				chrome.storage.local.set({ [LABEL_STORE_KEY]: JSON.stringify(store) }, callback);
			}
		} else {
			callback?.();
		}
	});
}

