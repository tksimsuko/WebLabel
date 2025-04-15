///// message /////
//ブラウザアクションからのりクエストを受け取る
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request){
            switch(request.status){
                case "create" :
                    renderDefaultLabel(request.templateSetting);
                    break;
                case "createFromContextMenu" : 
                    renderLabelFromContextMenu(request.templateSetting);
                    break;
                case "deleteUrlLabels" :
                    deleteAllUrlLabels();
                    break;
                default :
                    break;
            }
        }
    }
);

//バックグラウンドへりクエストを送る
function sendRequest(data, callback){
    chrome.runtime.sendMessage(data, function(response) {
        if(response){
            if(callback) callback(response);
        }
    });
}

///// document ready後 初期化 /////
(function(){
    sendRequest({
        status:"read",
        url:location.href
    }, function(response){
        //render label
        var labels = response.labels;
        for(labelId in labels){
            var label = labels[labelId];
            var $label = initLabel({
                id: labelId,
                top:label.top,
                left:label.left,
                width:label.width,
                height:label.height,
                backgroundColor:label.backgroundColor,
                borderColor:label.borderColor,
                fontSize:label.fontSize,
                color:label.color,
                content:label.content
            });
        }
    });
    sendRequest({
        status: "getCmd"
    }, function(data){
        if(!data || !data.cmds){
            return;
        }

        bindKeyControl(data);
    });
})();

///// Label作成 /////
var labelCls = "wl-label";
var labelIdCls = "wl-label-id";
var actionCls = "wl-action";
var actionMenuCls = "wl-action-menu";
var actionMessageCls = "wl-action-message";
var settingActionCls = "wl-setting-action";
var actionListCls = "wl-action-list";
var bgColorId = "wl-bgColor";
var borderColorId = "wl-borderColor";
var colorId = "wl-color";
var fontSizeInputCls = "wl-font-size-input";
var deleteActionCls = "wl-delete-action"
var textFormCls = "wl-text-form";
function initLabel(props){
    //generate
    var $label = generateLabelElement(props);
    document.body.appendChild($label);

    ///// dom cache /////
    var $labelId = $label.querySelector("." + labelIdCls);
    var $textForm = $label.querySelector("." + textFormCls);
    var $action = $label.querySelector("." + actionCls);
    var $setting = $label.querySelector("." + settingActionCls);
    var $delete = $label.querySelector("." + deleteActionCls);
    //setting
    var $actionList = $label.querySelector("." + actionListCls);
    var $bgColorInput = $label.querySelector("." + bgColorId);
    var $borderColorInput = $label.querySelector("." + borderColorId);
    var $colorInput = $label.querySelector("." + colorId);
    var $fontSizeInput = $label.querySelector("." + fontSizeInputCls);

    //value
    var labelId = props.id || generateId();
    $labelId.textContent = labelId;
    if(props.content){
        $textForm.value = props.content;
    }
    $bgColorInput.value = getColor(props.backgroundColor);
    $borderColorInput.value = getColor(props.borderColor);
    $colorInput.value = getColor(props.color);
    $fontSizeInput.value = props.fontSize;

    /////  bind /////
    //resize draggable
    var labelX = $label.style.left;
    var labelY = $label.style.top;
    draggable({
        dragElement: $action,
        moveElement: $label,
        onDragEnd: function(event){
            var top = parseInt($label.style.top.replace("px", ""));
            if(top < 0){
                applyStyle($label, {"top": 0});
            }
            if(labelX != $label.style.left || labelY != $label.style.top){
                saveLabel($label);
                labelX = $label.style.left;
                labelY = $label.style.top;
            }
        }
    });
    resizable({
        resizeElement: $label,
        onResizeEnd: function(event){
            saveLabel($label);
        }
    });

    //hover event bind
    hoverShowToggle($label, $setting);
    hoverShowToggle($label, $delete);
    hover($delete, $delete, {
        color: "red",
        opacity: 1
    });


    //setting
    $setting.addEventListener("click", function(event){
        showToggle($actionList);
        return false;
    });
    //delete
    $delete.addEventListener("click", function(event){
        $label.remove();

        var id = getLabelId($label);
        sendRequest({
            status:"delete",
            url:location.href,
            id:id
        });
        return false;
    });

    //textarea event
    $textForm.addEventListener("change", function(event){
        saveLabel($label);
    });
    $textForm.addEventListener("click", function(event){
        //stop bubbling
        return false;
    });

    //change
    $bgColorInput.addEventListener("change", function(event){
        applyStyle($textForm, {
            backgroundColor: $bgColorInput.value
        });
        saveLabel($label);
    });
    $borderColorInput.addEventListener("change", function(event){
        applyStyle($label, {
            borderColor: $borderColorInput.value
        });
        applyStyle($action, {
            backgroundColor: $borderColorInput.value
        });
        saveLabel($label);
    });
    $colorInput.addEventListener("change", function(event){
        applyStyle($label, {
            color: $colorInput.value
        });
        applyStyle($textForm, {
            color: $colorInput.value
        });
        saveLabel($label);
    });
    $fontSizeInput.addEventListener("change", function(event){
        var fontSize = parseInt($fontSizeInput.value);
        applyStyle($textForm, {
            fontSize: fontSize + "px",
            lineHeight: (fontSize + 2) + "px"
        });
        saveLabel($label);
    });

    //private
    function generateLabelElement(props){
        var labelProp = {
            name: "div",
            attr: {class: labelCls},
            style: {
                position:"absolute",
                borderRight:"2px solid",
                borderBottom:"2px solid",
                borderLeft:"2px solid",
                zIndex:9999,
                top:props.top,
                left:props.left,
                width:props.width,
                height:props.height,
                borderColor:props.borderColor,
                boxShadow: "rgba(113, 135, 164, 0.65098) 0px 0px 2px 1px",
                webkitBoxShadow: "rgba(113, 135, 164, 0.65098) 0px 0px 2px 1px"
            },
            children: [
                {
                    name: "span",
                    attr: {class: labelIdCls},
                    style: {
                        display: "none"
                    }
                },
                {
                    name: "div",
                    attr: {class: actionCls},
                    style: {
                        position: "absolute",
                        width: "100%",
                        height: "16px",
                        lineHeight: "16px",
                        padding: "5px 0",
                        cursor: "move",
                        webkitUserSelect: "none",
                        userSelect: "none",
                        backgroundColor: props.borderColor,
                        color: props.color
                    },
                    children: [
                        generateLabelMenuProp(props),
                        {
                            name: "a",
                            attr: {
                                class: deleteActionCls,
                                href: "javascript:void(0)"
                            },
                            style: {
                                float: "right",
                                color: "#555",
                                background: "transparent",
                                width: "16px",
                                lineHeight: "16px",
                                textAlign: "center",
                                textDecoration: "none",
                                fontSize: "16px",
                                opacity: 0.7,
                                cursor: "pointer",
                                display: "none"
                            },
                            children: [
                                "×"
                            ]
                        },
                        {
                            name: "span",
                            attr: {class: actionMessageCls},
                            style: {
                                float: "right",
                                paddingRight: "10px",
                                fontSize: "12px",
                                opacity: "0.8"
                            }
                        }
                    ]
                },
                {
                    name: "textarea",
                    attr: {
                        class: textFormCls,
                        spellcheck: false
                    },
                    style: {
                        webkitBoxSizing: "border-box",
                        boxSizing: "border-box",
                        width: "100%",
                        height: "100%",
                        resize: "none",
                        overflow: "hidden",
                        borderTop: "27px solid transparent",
                        padding: "5px",
                        backgroundColor:props.backgroundColor,
                        lineHeight: (parseInt(props.fontSize) + 2) + "px",
                        fontSize: props.fontSize + "px",
                        color: props.color
                    }
                }
            ]
        };
        return dom(labelProp);
    }
    function generateLabelMenuProp(props){
        return {
            name: "div",
            attr: {class: actionMenuCls},
            style: {
                float: "left",
                marginLeft: "5px"
            },
            children: [
                {
                    name: "a",
                    attr: {
                        class: settingActionCls,
                        href: "javascript:void(0)"
                    },
                    style: {
                        display: "none"
                    },
                    children: [
                        {
                            name: "img",
                            attr: {
                                src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAABTUlEQVQ4jZXTPy+kURQG8J9Z4++sakuqTUgUii3EhkgUsp1IVlQUEgVijO19Co1PsCQaK3QUIxIaGsVK0Ir4AAqNKN7zco0ZiSe5ybnPec7z3nvOfZs0xipGI65i/QMt6MAcSrHfTnJ5/DU07XmikBT/RSu2sISexKAHi5FrxWbUvGAW8xH3YwLFJF8Mrj/285hJDbqwh96EK2EoVinh+0LbBV+CfMS3ONYlfmIDD+jGGq5xizHc4zh3XMUBztEia9B+3DVHW3BtoTmPmgrseosRlL1HBcM13G4BTzVkU53iRngq4Eg255M43hl+1bnCuNdrnkRNNXUr43fEQ7JOl7ES8WDkprBce5R6YyziR6z0TdQd4zRuZJ0dkDXrSja2u9BNohn/0YnvuMhdO/APC+G+hNPkq6eyp7wfmh01Tzk3+fTP9BH+4DBWpZHoGWo4PfJ75dXLAAAAAElFTkSuQmCC",
                                width: "14px",
                                height: "14px"
                            },
                            style: {
                                display: "inline",
                                marginTop: "2px",
                                cursor: "pointer"
                            }
                        }
                    ]
                },
                {
                    name: "ul",
                    attr: {
                        class: actionListCls
                    },
                    style: {
                        display: "none",
                        position: "absolute",
                        top: "0",
                        left: "-89px",
                        listStyle: "none",
                        width: "75px",
                        padding: "5px",
                        background: "#fff",
                        border: "1px solid #999"
                    },
                    children: generateLabelFormProp()
                }
            ]
        };
    }
    function generateLabelFormProp(){
        return [
            {
                name: "li",
                style: {
                    marginBottom: "10px",
                    fontSize: "12px",
                    fontWeight: "bold"
                },
                children: [
                    "background",
                    {
                        name: "input",
                        attr: {
                            class: bgColorId,
                            type: "color"
                        },
                        style: {
                            cursor: "pointer",
                            marginLeft: "20px",
                            width: "40px",
                            height: "25px"
                        }
                    }
                ]
            },
            {
                name: "li",
                style: {
                    marginBottom: "10px",
                    fontSize: "12px",
                    fontWeight: "bold"
                },
                children: [
                    "border",
                    {
                        name: "input",
                        attr: {
                            class: borderColorId,
                            type: "color"
                        },
                        style: {
                            cursor: "pointer",
                            marginLeft: "20px",
                            width: "40px",
                            height: "25px"
                        }
                    }
                ]
            },
            {
                name: "li",
                style: {
                    marginBottom: "10px",
                    fontSize: "12px",
                    fontWeight: "bold"
                },
                children: [
                    "font color",
                    {
                        name: "input",
                        attr: {
                            class: colorId,
                            type: "color"
                        },
                        style: {
                            cursor: "pointer",
                            marginLeft: "20px",
                            width: "40px",
                            height: "25px"
                        }
                    }
                ]
            },
            {
                name: "li",
                style: {
                    fontSize: "12px",
                    fontWeight: "bold"
                },
                children: [
                    "font size",
                    {
                        name: "input",
                        attr: {
                            type: "number",
                            class: fontSizeInputCls,
                            max: "99",
                            min: "8"
                        },
                        style: {
                            cursor: "pointer",
                            margin: "5px 0 5px 20px",
                            padding: "5px",
                            width: "40px",
                            background: "#eee",
                            textAlign: "center"
                        }
                    }
                ]
            }
        ]
    }

    return $label;
}

// マウスカーソルの位置を保持
var mouse_position = {};
window.addEventListener("contextmenu", function(event){
    mouse_position.left = event.x + window.scrollX;
    mouse_position.top = event.y + window.scrollY;
});
function renderLabelFromContextMenu(props){
    var $label = initLabel({
        top:mouse_position.top + "px",
        left:mouse_position.left + "px",
        width:props.width,
        height:props.height,
        backgroundColor:props.backgroundColor,
        borderColor:props.borderColor,
        fontSize:props.fontSize,
        color:props.color
    });

    //textarea focus
    var $textForm = $label.querySelector("." + textFormCls);
    $textForm.focus();
    $textForm.select();
}
function renderDefaultLabel(props){
    var $label = initLabel({
        top:(window.scrollY + (window.innerHeight*(1/4))) + "px",
        left:(window.scrollX + (window.innerWidth/2 - 100)) + "px",
        width:props.width,
        height:props.height,
        backgroundColor:props.backgroundColor,
        borderColor:props.borderColor,
        fontSize:props.fontSize,
        color:props.color
    });

    //textarea focus
    var $textForm = $label.querySelector("." + textFormCls);
    $textForm.focus();
    $textForm.select();
}


///// save /////
function saveLabel($label){
    //id
    var id = getLabelId($label);

    //dom cache
    var $message = $label.querySelector("." + actionMessageCls);
    var $textForm = $label.querySelector("." + textFormCls);

    //insert
    //update
    sendRequest({
        status:"save",
        url:location.href,
        title:document.title,
        id:id,
        label:{
            top:$label.style.top,
            left:$label.style.left,
            width:$label.clientWidth + "px",
            height:$label.clientHeight + "px",
            backgroundColor:$textForm.style.backgroundColor,
            borderColor:$label.style.borderColor,
            fontSize:$textForm.style.fontSize.replace("px", ""),
            color:$textForm.style.color,
            content:$textForm.value
        }
    }, function(response){
        if(response && response.isSaved){
            $message.textContent = "saved";
            setTimeout(function(){
                $message.textContent = "";
            }, 2000);
        }else{
            $message.textContent = "network error. It cannot saved.";
        }
    });
}

function bindKeyControl(data){
    var cmds = data.cmds;
    var template = data.template;

    var create = cmds.create;
    if(create && (create.meta.length > 0 || create.key)){
        keycontrol(window, "keydown", create.meta, create.key, function(event){
            renderDefaultLabel(template);
        });
    }
    var save = cmds.save;
    if(save && (save.meta.length > 0 || save.key)){
        keycontrol(window, "keydown", save.meta, save.key, function(event){
            saveAllLabels();
        });
    }
}
function generateId(){
    return new Date().getTime() + "";
}
function getLabelId($label){
    return $label.querySelector("." + labelIdCls).textContent;
}
function deleteAllUrlLabels(){
    var nodes = document.querySelectorAll("." + labelCls);
    var nLen = nodes.length;
    for(var i=0; i<nLen; i++){
        nodes[i].remove();
    }
}
function saveAllLabels(){
    var nodes = document.querySelectorAll("." + labelCls);
    var nLen = nodes.length;
    for(var i=0; i<nLen; i++){
        saveLabel(nodes[i]);
    }
}

