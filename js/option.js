const ON_OFF_KEY = "onOffSetting";
const TEMPLATE_SETTING_KEY = "templateSetting";
const COMMAND_SETTING_KEY = "commandSetting";

const $on = document.getElementById("on");
const $onInput = $on.querySelector("input");
const $off = document.getElementById("off");
const $offInput = $off.querySelector("input");
const $bgColor = document.getElementById("backgroundColor");
const $borderColor = document.getElementById("borderColor");
const $color = document.getElementById("color");
const $fontSize = document.getElementById("fontSize");
const $width = document.getElementById("width");
const $height = document.getElementById("height");
const $previewLabel = document.querySelector(".previewLabel");
const $createCommand = document.getElementById("createCommand");
const $saveCommand = document.getElementById("saveCommand");
const $deleteCreateCmd = document.querySelector(".deleteCreateCmd");
const $deleteSaveCmd = document.querySelector(".deleteSaveCmd");

// 初期化
(async () => {
  await initOnOffSetting();
  await initTemplateSetting();
  await initCommandSetting();
  applyTemplateSetting();
})();

// bind on/off
$on.addEventListener("click", async () => {
  await chrome.storage.local.set({ [ON_OFF_KEY]: "on" });
  changeOn();
});
$off.addEventListener("click", async () => {
  await chrome.storage.local.set({ [ON_OFF_KEY]: "off" });
  changeOff();
});

// bind template inputs
[$bgColor, $borderColor, $color, $fontSize, $width, $height].forEach($el => {
  $el.addEventListener("change", async () => {
    await storeTemplateSetting();
    applyTemplateSetting();
  });
});

// resizable
resizable({
  resizeElement: $previewLabel,
  onResizeEnd: async () => {
    const width = $previewLabel.style.width;
    const height = $previewLabel.style.height;
    const result = await chrome.storage.local.get([TEMPLATE_SETTING_KEY]);
    const template = JSON.parse(result[TEMPLATE_SETTING_KEY] || "{}");
    template.width = width;
    template.height = height;
    await chrome.storage.local.set({ [TEMPLATE_SETTING_KEY]: JSON.stringify(template) });
    $width.value = parseInt(width);
    $height.value = parseInt(height);
  }
});

// bind command input
$createCommand.addEventListener("keyup", async () => {
  const cmds = await getCommandSetting();
  cmds.create = $createCommand.cmd;
  await setCommandSetting(cmds);
});
$saveCommand.addEventListener("keyup", async () => {
  const cmds = await getCommandSetting();
  cmds.save = $saveCommand.cmd;
  await setCommandSetting(cmds);
});
$deleteCreateCmd.addEventListener("click", async () => {
  $createCommand.value = "";
  $createCommand.cmd = "";
  const cmds = await getCommandSetting();
  cmds.create = "";
  await setCommandSetting(cmds);
});
$deleteSaveCmd.addEventListener("click", async () => {
  $saveCommand.value = "";
  $saveCommand.cmd = "";
  const cmds = await getCommandSetting();
  cmds.save = "";
  await setCommandSetting(cmds);
});

bindKeyCommandSetting($createCommand);
bindKeyCommandSetting($saveCommand);

async function initOnOffSetting() {
  const result = await chrome.storage.local.get([ON_OFF_KEY]);
  const onOffSetting = result[ON_OFF_KEY];
  if (onOffSetting === "on") changeOn();
  else if (onOffSetting === "off") changeOff();
}

async function initTemplateSetting() {
  const result = await chrome.storage.local.get([TEMPLATE_SETTING_KEY]);
  const template = JSON.parse(result[TEMPLATE_SETTING_KEY] || "{}");
  $bgColor.value = getColor(template.backgroundColor);
  $borderColor.value = getColor(template.borderColor);
  $color.value = getColor(template.color);
  $fontSize.value = template.fontSize;
  $width.value = parseInt((template.width || "200px"));
  $height.value = parseInt((template.height || "100px"));
}

async function storeTemplateSetting() {
  const template = {
    backgroundColor: $bgColor.value,
    borderColor: $borderColor.value,
    color: $color.value,
    fontSize: $fontSize.value,
    width: $width.value + "px",
    height: $height.value + "px"
  };
  await chrome.storage.local.set({ [TEMPLATE_SETTING_KEY]: JSON.stringify(template) });
}

async function applyTemplateSetting() {
  const result = await chrome.storage.local.get([TEMPLATE_SETTING_KEY]);
  const template = JSON.parse(result[TEMPLATE_SETTING_KEY] || "{}");
  $previewLabel.style.backgroundColor = getColor(template.backgroundColor);
  $previewLabel.style.borderColor = getColor(template.borderColor);
  $previewLabel.style.color = getColor(template.color);
  $previewLabel.style.fontSize = template.fontSize + "px";
  $previewLabel.style.width = template.width || "200px";
  $previewLabel.style.height = template.height || "100px";
}

async function initCommandSetting() {
  const result = await chrome.storage.local.get([COMMAND_SETTING_KEY]);
  const setting = JSON.parse(result[COMMAND_SETTING_KEY] || "{}");
  $createCommand.value = generateCommandString(setting.create);
  $createCommand.cmd = setting.create;
  $saveCommand.value = generateCommandString(setting.save);
  $saveCommand.cmd = setting.save;
}

async function getCommandSetting() {
  const result = await chrome.storage.local.get([COMMAND_SETTING_KEY]);
  return JSON.parse(result[COMMAND_SETTING_KEY] || "{}");
}

async function setCommandSetting(cmds) {
  await chrome.storage.local.set({ [COMMAND_SETTING_KEY]: JSON.stringify(cmds) });
}

function changeOn() {
  $onInput.checked = true;
  $on.style.background = "gold";
  $offInput.checked = false;
  $off.style.background = "#ccc";
  chrome.action.setBadgeText({ text: "" });
}

function changeOff() {
  $onInput.checked = false;
  $on.style.background = "#ccc";
  $offInput.checked = true;
  $off.style.background = "firebrick";
  chrome.action.setBadgeText({ text: "off" });
  chrome.action.setBadgeBackgroundColor({ color: "firebrick" });
}

function bindKeyCommandSetting(element) {
  element.addEventListener("keydown", function (event) {
    if (event.which === 9) return;

    const keys = [];
    if (event.altKey) keys.push("alt");
    if (event.ctrlKey) keys.push("ctrl");
    if (event.metaKey) keys.push("command");
    if (event.shiftKey) keys.push("shift");

    const keyProp = {
      13: "enter", 20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown",
      35: "end", 36: "home", 37: "left", 38: "up", 39: "right", 40: "down",
      44: "printscreen", 45: "insert", 46: "delete",
      48: "0", 49: "1", 50: "2", 51: "3", 52: "4", 53: "5", 54: "6", 55: "7", 56: "8", 57: "9",
      65: "a", 66: "b", 67: "c", 68: "d", 69: "e", 70: "f", 71: "g", 72: "h", 73: "i", 74: "j",
      75: "k", 76: "l", 77: "m", 78: "n", 79: "o", 80: "p", 81: "q", 82: "r", 83: "s", 84: "t",
      85: "u", 86: "v", 87: "w", 88: "x", 89: "y", 90: "z",
      112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6",
      118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12"
    };

    const cmd = {
      meta: keys,
      key: keyProp[event.which] || ""
    };

    element.value = generateCommandString(cmd);
    element.cmd = cmd;
    event.preventDefault();
    return false;
  });
}

function generateCommandString(cmd) {
  if (!cmd) return "";
  let value = cmd.meta?.join(" + ") || "";
  if (cmd.key) {
    if (value) value += " + ";
    value += cmd.key;
  }
  return value;
}

function getColor(color) {
  return color || "#000000";
}
