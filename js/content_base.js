//////////////////// event ////////////////////
///// draggable /////
/*prop
 *  dragElement
 *  moveElement
 *  scopeElement
 *  onDragEnd
*/
function draggable(prop){
    var dragElement = prop.dragElement;
    var moveElement = prop.moveElement || dragElement;
    var scopeElement = prop.scopeElement || document;
    var onDragEnd = prop.onDragEnd;

    dragElement.addEventListener("mousedown", function(dragStartEvent){
        var startX = dragStartEvent.clientX;
        var startY = dragStartEvent.clientY;
        var x = (startX - moveElement.offsetLeft);
        var y = (startY - moveElement.offsetTop);

        scopeElement.addEventListener("mousemove", moveHandler, true);
        scopeElement.addEventListener("mouseup", endHandler, true);

        // cancel bubble
        dragStartEvent.stopPropagation();

        // handler
        function moveHandler(event){
            moveElement.style.left = (event.clientX - x) + "px";
            moveElement.style.top = (event.clientY - y) + "px";

            event.stopPropagation();
        }
        function endHandler(event){
            scopeElement.removeEventListener("mousemove", moveHandler, true);
            scopeElement.removeEventListener("mouseup", endHandler, true);
            
            if(onDragEnd){
                onDragEnd(event);
            }
            
            event.stopPropagation();
        }
    });
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
function hoverShowToggle(hoverElement, targetElement){
    hover(hoverElement, targetElement, {display: ""}, {display: "none"});
}

///// show //////
function showToggle(targetElement){
	if(targetElement.style.display === "none"){
		targetElement.style.display = "";
	}else{
		targetElement.style.display = "none";
	}
}

///// utility /////
function dom(prop){
	var name = prop.name;
	var attr = prop.attr;
	var style = prop.style;
	var children = prop.children;

	//generate element
    var element = document.createElement(name);
    applyStyle(element, defaultStyle());
    if(attr){
    	applyAttribute(element, attr);
    }
    if(style){
        applyStyle(element, style);
    }
    if(children){
    	var length = children.length;
    	for(var i=0; i<length; i++){
    		var value = children[i];
    		if(typeof(value) === "object"){
    			element.appendChild(dom(value));	
    		}else{
    			element.appendChild(new Text(value));
    		}
    	}
    }

    return element;
}

function createElement(tagName, styleProp){
    var element = document.createElement(tagName);
   	applyStyle(element, defaultStyle());
    if(styleProp){
        applyStyle(element, styleProp);
    }
    return element
}
function applyAttribute(dom, attrProp){
	for(var i in attrProp){
		var value = attrProp[i];
		if(value === undefined){
			value = "";
		}
		dom.setAttribute(i, value);
	}
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
function applyStyleToArray(array, styleProp){
    if(typeof(array) !== "object"){
        console.error("applyStyleToArray: wrong signature.");
        return;
    }

    var arrayLength = array.length;
    for(var i=0; i<arrayLength; i++){
        applyStyle(array[i], styleProp);
    }
}
function defaultStyle(){
    return {
        webkitBoxSizing: "content-box",
        boxSizing: "content-box",
        margin: 0,
        padding: 0,
        border: "transparent",
        outline: "none",
        color: "#000",
        
        display: "block",
        position: "static",
        float: "none",
        visibility: "visible",
        opacity: 1,
        zIndex: 0,
        
        font: "14px 'Helvetica', 'Arial', 'FreeSans', 'Verdana', 'Tahoma', 'Lucida Sans', 'Lucida Sans Unicode', 'Luxi Sans', sans-serif",
        textAlign: "left",
        verticalAlign: "baseline",
        textDecoration: "none",
        textShadow: "none",
        lineHeight: "14px",
        whiteSpace: "normal",
        wordWrap: "normal",
        
        borderRadius: 0,
        backgroundSize: "auto",
        boxShadow: "none",
        webkitTransform: "none",
        transform: "none",
        transition: "none",
        
        resize: "none",
        cursor: "default"
    };
}
// color propertie
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