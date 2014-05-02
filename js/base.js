//color propertie
function getColor(val){
	if(!val){
		return "";
	}

	if(val.toLowerCase().indexOf("rgb") === 0){
		return rgbTo16(val);
	}

	return val;
}
function rgbTo16(col){
  return "#" + col.match(/\d+/g).map(function(a){return ("0" + parseInt(a).toString(16)).slice(-2)}).join("");
}

///// message /////
function messagebar(prop){
    var text = prop.text;
    var backgroundColor = prop.backgroundColor;
    var color = prop.color;
    var fontSize = prop.fontSize;
    var padding = prop.padding;
    var position = prop.position || "top";
    var during = prop.during || 1;
    var transitionDuration = prop.transitionDuration || 1;
 
    var div = document.createElement("div");
    div.innerText = text;
    div.style.position = "fixed";
    div.style[position] = "0";
    div.style.left = "0";
    div.style.margin = "0";
    div.style.padding = "10px 0";
    div.style.width = "100%";
    div.style.backgroundColor = backgroundColor;
    div.style.fontSize = fontSize;
    div.style.fontFamily =  "'Helvetica Neue',Arial,'Hiragino Kaku Gothic Pro',Meiryo,'MS PGothic',sans-serif";
    div.style.color = color;
    div.style.textAlign = "center";
    div.style.zIndex = 9999;
    div.style.transition = "opacity " + transitionDuration + "s";
    div.style.webkitTransition = "opacity " + transitionDuration + "s";
 
    if(prop.showCloseBtn){
        var btn = document.createElement("span");
        var btnSize = 16;
        var radiusSize = btnSize/2;
        btn.style.position = "absolute";
        btn.style.top = "2px";
        btn.style.right = "2px";
        btn.style.fontSize = "12px";
        btn.style.lineHeight = btnSize + "px";
        btn.style.textAlign = "center";
        btn.style.color = "#fff";
        btn.style.width = btnSize + "px";
        btn.style.height = btnSize + "px";
        btn.style.borderRadius = radiusSize + "px";
        btn.style.webkitBorderRadius = radiusSize + "px";
        btn.style.backgroundColor = "#999";
        btn.style.cursor = "pointer";
        btn.textContent = "×";
        div.appendChild(btn);
 
        btn.addEventListener("click", function(evnet){
            div.remove();
        }, false);
        btn.addEventListener("mouseover", function(evnet){
        	btn.style.backgroundColor = "red";
        });
        btn.addEventListener("mouseout", function(evnet){
        	btn.style.backgroundColor = "#999";
        });
    }
    document.body.appendChild(div);
 
    if(during > 0){
        setTimeout(function(){
            if(div){
                div.style.opacity = "0";
                setTimeout(function(){
                    div.remove();
                }, 1000);
            }
        }, during*1000);
    }
 
}

///// resizable /////
/*prop
 *  resizeElement
 *  scopeElement
 *  syncElement
 *  onResizeEnd
*/
function resizable(prop){
    var resizeElement = prop.resizeElement;
    var scopeElement = prop.scopeElement || document;
    var syncElement = prop.syncElement;
    var onResizeEnd = prop.onResizeEnd;
    var control = prop.control;
    
    var isResizeSE = true;
    var isResizeE = true;
    var isResizeS = true;
    if(control){
        isResizeSE = control.se;
        isResizeE = control.e;
        isResizeS = control.s;
    }

    //control element
    if(isResizeSE){
        var resizeCtrl = createElement("div", {
            position: "absolute",
            right: "0",
            bottom: "0",
            width: "15px",
            height: "15px",
            borderRight: "2px solid #CCC",
            borderBottom: "2px solid #CCC",
            display: "none",
            cursor: "se-resize"
        });
        resizeElement.appendChild(resizeCtrl);
        hover(resizeElement, resizeCtrl,
            {display: "block"},
            {display: "none"}
        );
        bindResizeEvent(resizeCtrl, true, true);
    }

    if(isResizeE){
        var rightCtrl = createElement("div", {
            position: "absolute",
            right: "0",
            top: "0",
            height: "97%",
            borderRight: "5px solid transparent",
            display: "none",
            cursor: "e-resize"
        });
        resizeElement.appendChild(rightCtrl);
        hover(resizeElement, rightCtrl,
            {display: "block"},
            {display: "none"}
        );
        bindResizeEvent(rightCtrl, true, false);
    }

    if(isResizeS){
        var bottomCtrl = createElement("div", {
            position: "absolute",
            left: "0",
            bottom: "0",
            width: "97%",
            borderBottom: "5px solid transparent",
            display: "none",
            cursor: "s-resize"
        });
        resizeElement.appendChild(bottomCtrl);
        hover(resizeElement, bottomCtrl,
            {display: "block"},
            {display: "none"}
        );
        bindResizeEvent(bottomCtrl, false, true);
    }

    function bindResizeEvent(ctrlElement, isMoveX, isMoveY){
        ctrlElement.addEventListener("mousedown", function(dragStartEvent){
            var startX = dragStartEvent.clientX;
            var startY = dragStartEvent.clientY;
            var startWidth = resizeElement.clientWidth;
            var startHeight = resizeElement.clientHeight;
            
            var syncWidth;
            var syncHeight;
            if(syncElement){
                syncWidth = syncElement.clientWidth;
                syncHeight = syncElement.clientHeight;
            }

            scopeElement.addEventListener("mousemove", moveHandler, false);
            scopeElement.addEventListener("mouseup", endHandler, false);
            
            // cancel bubble / preventdefault
            dragStartEvent.stopPropagation();
            dragStartEvent.preventDefault();

            // handler
            function moveHandler(event){
                var diffX = (event.clientX - startX);
                var diffY = (event.clientY - startY);

                if(isMoveX){
                    resizeElement.style.width = (startWidth + diffX) + "px";
                }
                if(isMoveY){
                    resizeElement.style.height = (startHeight + diffY) + "px";
                }
                
                if(syncElement){
                    if(isMoveX){
                        syncElement.style.width = (syncWidth + diffX) + "px";
                    }
                    if(isMoveY){
                        syncElement.style.height = (syncHeight + diffY) + "px";
                    }
                }
                event.stopPropagation();
            }
            function endHandler(event){
                scopeElement.removeEventListener("mousemove", moveHandler, false);
                scopeElement.removeEventListener("mouseup", endHandler, false);
                
                if(onResizeEnd){
                    onResizeEnd(event);
                }
                event.stopPropagation();
            }
        });
    }
}

///// hover /////
function hover(hoverElement, targetElement, onStyle, offStyle){
    var orgStyle = {};
    hoverElement.addEventListener("mouseover", function(event){
        for(var key in onStyle){
            orgStyle[key] = targetElement.style[key];
            targetElement.style[key] = onStyle[key];
        }
    }, false);
    hoverElement.addEventListener("mouseout", function(event){
        var styles;
        if(offStyle){
            styles = offStyle;
        }else{
            styles = orgStyle;
        }
        for(var key in styles){
            targetElement.style[key] = styles[key];
        }
    }, false);
}

function createElement(tagName, styleProp){
    var element = document.createElement(tagName);
    if(styleProp){
        applyStyle(element, styleProp);
    }
    return element
}
function applyStyle(dom, styleProp){
    for(var i in styleProp){
        var value = styleProp[i];
        if(value === undefined){
            value = "";
        }
        dom.style[i] = value;
    }
}