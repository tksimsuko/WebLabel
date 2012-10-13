///// message /////
//ブラウザアクションからのりクエストを受け取る
chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request){
            switch(request.status){
                case "create" :
                    renderDefaultLabel(request.templateSetting);
                    break;
                case "createFromContextMenu" : 
                    renderLabelFromContextMenu(request);
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

//ブラウザアクションへりクエストを送る
function sendRequestToPopup(data, callback){
    chrome.extension.sendMessage(data, function(response) {
        if(response){
            if(callback) callback(response);
        }
    });
}

///// document ready後 初期化 /////
$(function(){
    sendRequestToPopup({
        status:"read",
        url:location.href
    }, function(response){
        //render label
        var labels = response.labels;
        for(labelId in labels){
            var label = labels[labelId];
            var $label = initLabel({
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

            $.data($label.get(0), "id", labelId);
        }
    });
});

///// Label作成 /////
var labelCls = "wl-label";
var actionCls = "wl-action";
var actionMenuCls = "wl-action-menu";
var actionMessageCls = "wl-action-message";
var settingActionCls = "wl-setting-action";
var saveCls = "wl-save-action"
var actionListCls = "wl-action-list";
var bgColorActionCls = "wl-bgColor-action";
var bgColorId = "wl_bgColor";
var borderColorActionCls = "wl-borderColor-action";
var borderColorId = "wl_borderColor";
var colorCls = "wl-color-action";
var colorId = "wl_color";
var fontSizeCls = "wl-font-size-action";
var fontSizeSelectCls = "wl-font-size-select";
var deleteActionCls = "wl-delete-action"
var textFormCls = "wl-text-form";
function initLabel(props){
    //html
    var labelHtml = "<div class='" + labelCls + "'>" +
                        "<div class='" + actionCls + "'>" +
                            "<div class='" + actionMenuCls + "'>" +
                                "<a class='" + settingActionCls + "' href='javascript:void(0)'>▼</a>" +
                                "<a class='" + saveCls + "' href='javascript:void(0)'>save</a>" +
                                "<ul class='" + actionListCls + "'>" +
                                    "<li><p class='" + bgColorActionCls + "' >bacground color<span id='" + bgColorId + "' ></span></p></li>" +
                                    "<li><p class='" + borderColorActionCls + "' >border color<span id='" + borderColorId + "' ></p></span></li>" +
                                    "<li><p class='" + colorCls + "' >color<span id='" + colorId + "'></span></p></li>" +
                                    "<li>" +
                                        "<p class='" + fontSizeCls + "' >font size</p>" +
                                        " <select class='" + fontSizeSelectCls + "''>" + 
                                            "<option>12</option>" + 
                                            "<option>14</option>" + 
                                            "<option>16</option>" + 
                                            "<option>18</option>" + 
                                            "<option>20</option>" + 
                                            "<option>22</option>" + 
                                            "<option>24</option>" + 
                                        "</select>" +
                                    "</li>" +
                                "</ul>" +
                            "</div>" +
                            "<a class='" + deleteActionCls + " href='javascript:void(0)'>&times;</a>" +
                            "<span class='" + actionMessageCls + "'></span>" + 
                        "</div>" +
                        "<textarea class='" + textFormCls + "'></textarea>" +
                    "</div>"
                    ;
    var $label = $(labelHtml);
    //style
    $label.css({
        position:"absolute",
        zIndex:9999,
        top:props.top,
        left:props.left,
        width:props.width,
        height:props.height,
        borderRight:"5px solid",
        borderBottom:"5px solid",
        borderLeft:"5px solid",
        borderColor:props.borderColor,
        backgroundColor:props.backgroundColor
    });

    //append
    $("body").append($label);
    var $textForm = $("." + textFormCls, $label);
    var $action = $("." + actionCls, $label);
    var $setting = $("." + settingActionCls, $label);
    var $delete = $("." + deleteActionCls, $label);
    var $save = $("." + saveCls, $label);
    var $actions = $("." + settingActionCls + ",." + deleteActionCls + ",." + saveCls, $label);
    var $actionList = $("." + actionListCls, $label);
    var $bgClrAct = $("." + bgColorActionCls, $label);
    var $borderClrAct = $("." + borderColorActionCls, $label);
    var $clrAct = $("." + colorCls, $label);
    var $fontSize = $("." + fontSizeCls, $label).next("select");

    //style
    $action.css({
        backgroundColor:props.borderColor,
        color:props.color
    });
    $textForm.css({
        fontSize:props.fontSize + "px",
        color:props.color
    });
    $setting.css({
        backgroundColor:props.backgroundColor,
        color:props.color
    });
    $save.css({
        backgroundColor:props.backgroundColor,
        color:props.color
    });

    /////  bind /////
    //resize draggable
    $label.draggable({
        stop:function(){
            if($label.position().top < 0){
                $label.css("top", 0);
            }
            saveLabel($label);
        }
    }).resizable({
        stop:function(){
            saveLabel($label);
        }
    }).click(function(){
        if($label.position().top < 0)
            $label.css("top", 0);
    });

    //resize control
    var $resizeControl = $(".ui-resizable-se", $label);
    $resizeControl.hide();

    //actions
    $actions.hide();
    $actionList.hide();
    //hover event bind
    bindHoverAction();
    bindClickAction();

    //save
    $save.click(function(){
        saveLabel($label);
    });

    //delete
    $delete.click(function(){
        var id = $.data($label.get(0), "id");
        if(!id) $label.remove();
        sendRequestToPopup({
            status:"delete",
            url:location.href,
            id:id
        }, function(response){
            if(response && response.isDeleted){
                $label.remove();
            }else{
                alert("network error. It cannot deleted.");
            }
        });
        return false;
    });

    //textarea event
    $textForm.change(function(){
        saveLabel($label);
    }).click(function(){
        //stop bubbling
        return false;
    });

    ///// content insert /////
    if(props.content) $textForm.val(props.content);

    ///// display animation /////
    var left = parseInt($label.css("left").replace("px", ""));
    $label.css({
        left:(left+10) + "px"
    });
    $label.animate({
        left:left + "px"
    }, "fast");

    //private
    function bindHoverAction(){
        $label.mouseover(function(){
            $setting.show();
            $delete.show();
            $save.show();
            $resizeControl.show();
        }).mouseout(function(){
            $setting.hide();
            $delete.hide();
            $save.hide();
            $resizeControl.hide();
        });
    }
    function bindClickAction(){
        //setting
        $setting.click(function(){
            if($actionList.is(":hidden")){
                $actionList.slideDown();

                var bgClr = $label.css("background-color");
                $("span", $bgClrAct).css("background-color", bgClr);
                var borderClr = $label.css("border-color");
                $("span", $borderClrAct).css("background-color", borderClr);
                var clr = $textForm.css("color");
                $("span", $clrAct).css("background-color", clr);
                var size = parseInt($textForm.css("font-size").replace("px", ""));
                $fontSize.children("option:contains('" + size + "')").attr("selected", "selected");
            }else{
                $actionList.hide(); 
            }
            return false;
        });
        $("span", $bgClrAct).simpleColorPicker({
            onChangeColor: function(color) {
                $label.css("background-color", color);
                $setting.css("background-color", color);
                $save.css("background-color", color);
                $(this).css("background-color", color);
                saveLabel($label);
            }
        });
        $("span", $borderClrAct).simpleColorPicker({
            onChangeColor: function(color) {
                $label.css("border-color", color);
                $action.css("background-color", color);
                var borderClr = $label.css("border-color");
                $(this).css("background-color", borderClr);
                saveLabel($label);
            }
        });
        $("span", $clrAct).simpleColorPicker({
            onChangeColor: function(color) {
                $("textarea", $label).css("color", color);
                $setting.css("color", color);
                $save.css("color", color);
                var clr = $textForm.css("color");
                $(this).css("background-color", clr);
                saveLabel($label);
            }
        });
        $fontSize.change(function(){
            var size = $(this).val();
            $textForm.css("font-size", size + "px");
            saveLabel($label);
        });
    }

    return $label;
}

// マウスカーソルの位置を保持
var mouse_position = {};
$(window).bind("contextmenu", function(){
    mouse_position.left = event.x + window.scrollX;
    mouse_position.top = event.y + window.scrollY;
});
function renderLabelFromContextMenu(props){
    initLabel({
        top:mouse_position.top,
        left:mouse_position.left,
        width:"200px",
        height:"100px",
        backgroundColor:props.templateSetting.backgroundColor,
        borderColor:props.templateSetting.borderColor,
        fontSize:props.templateSetting.fontSize,
        color:props.templateSetting.color
    });
}
function renderDefaultLabel(props){
    initLabel({
        top:(window.scrollY + ($(window).height()*(1/4))),
        left:(window.scrollX + ($(window).width()/2 - 100)),
        width:"200px",
        height:"100px",
        backgroundColor:props.backgroundColor,
        borderColor:props.borderColor,
        fontSize:props.fontSize,
        color:props.color
    });
}


///// save /////
function saveLabel(label){
    //id
    var id = $.data(label.get(0), "id");
    if(!id) id =  generateId();

    //labelにidをキャッシュ
    $.data(label.get(0), "id", id);

    //text form
    var $textForm = $("." + textFormCls, label);

    //message
    var $message = $("." + actionMessageCls, label);
    $message.text("saving…");

    //insert
    //update
    sendRequestToPopup({
        status:"save",
        url:location.href,
        title:document.title,
        id:id,
        label:{
            top:label.css("top"),
            left:label.css("left"),
            width:label.outerWidth(true) + "px",
            height:label.outerHeight(true) + "px",
            backgroundColor:label.css("background-color"),
            borderColor:label.css("border-color"),
            fontSize:$textForm.css("font-size").replace("px", ""),
            color:$textForm.css("color"),
            content:$textForm.val()
        }
    }, function(response){
        if(response && response.isSaved){
            $message.text("saved");
            setTimeout(function(){
                $message.text("");
            }, 2000);
        }else{
            $message.text("network error. It cannot saved.");
        }
    });
}
function generateId(){
    return new Date().getTime() + "";
}
function deleteAllUrlLabels(){
    $(".wl-label").remove();
}
