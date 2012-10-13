(function($){
	//storage key
	var LABEL_STORE_KEY = "labelStore";
	var ON_OFF_KEY = "onOffSetting";
	var TEMPLATE_SETTING_KEY = "templateSetting";
	
	//label
	var labelListCls = "label-list";
	var labelTermCls = "label-term";
	var labelCountCls = "label-count";
	var labelContentCls = "label-content";
	var termContentCls = "label-term-content";
	var titleCls = "label-title";
	var urlCls = "labels-url";
	var actionOnCls = "action-on";
	var openPageCls = "open-page";
	var $labelList = $("." + labelListCls);
	//action
	var urlLabelActionCls = "labels-action";
	var contentOpenCls = "label-content-open";
	var urlLabelDeleteCls = "labels-delete-btn";
	var $action = $(".action");
	var $setting = $(".setting");
	var $settingForm = $(".settingForm");
	var $closeForm = $(".closeForm");
	var $onOff = $(".onOff");
	var $onOffImg = $(".onOffImg");
	var $addLabel = $(".add-label");
	var $searchInput = $("#searchLabelInput");
	var $searchRemove = $(".searchTextRemove");
	var $popup = $(".popup");
	//template
	var bgColorId = "backgroundColor";
	var borderColorId = "borderColor";
	var colorId = "color";
	var fontSizeId = "fontSize";
	var $bgColor = $("#" + bgColorId);
	var $borderColor = $("#" + borderColorId);
	var $color = $("#" + colorId);
	var $fontSize = $("#" + fontSizeId);
	var defaultTmpSetting = {
	    "backgroundColor": "rgb(255, 255, 0)",
	    "borderColor": "rgb(241, 194, 50)",
	    "color": "rgb(0, 0, 0)",
	    "fontSize": "14"
	};

	//初期化
	chrome.windows.getCurrent(function(win){
		if(win.type == "popup"){
			$popup.hide();
		}
		$("body").width($(window).width());
		$(window).resize(function(){
			$("body").width($(this).width());
		});
	});

	///// 設定初期化 /////
	(function(){
		//on off 設定
		var onOff = window.localStorage.getItem(ON_OFF_KEY);
		if(!onOff) window.localStorage.setItem(ON_OFF_KEY, "on");
		//template 設定
		var templateSetting = window.localStorage.getItem(TEMPLATE_SETTING_KEY);
		if(!templateSetting) window.localStorage.setItem(TEMPLATE_SETTING_KEY, JSON.stringify(defaultTmpSetting));
	})();

	///// 初期化 /////
	$(function(){
		//bind
		//header button
		$setting.click(function(){
			if($settingForm.is(":hidden")){
				$settingForm.slideDown(200);
			}else{
				$settingForm.slideUp(200);
			}
		});
		$closeForm.click(function(){
			$settingForm.slideUp(200);
		});

		$onOff.click(function(){
			if($onOff.hasClass("on")){
				window.localStorage.setItem(ON_OFF_KEY, "off");
				$onOff.removeClass("on");
				$onOffImg.css("margin-left", "-53px");
			}else{
				window.localStorage.setItem(ON_OFF_KEY, "on");
				$onOff.addClass("on");
				$onOffImg.css("margin-left", "0");
			}
		});
		$addLabel.click(function(){
			create();
		});
		$popup.click(function(){
			var width = $(window).width();
		    var height = $(window).height();

		    var popupWindow = window.open(
			    "/browser/popup.html",
			    "pop",
			    "innerWidth = " + (width + 15) +
			    ", innerHeight = " + height +
			    ", top = " + window.screenTop +
			    ", left = " + window.screenLeft +
			    ", resizable = no"
		    );
		});
		$searchInput.keyup(function(){
			var $this = $(this);
			var $terms = $("." + labelTermCls);
			var $titles = $terms.find("." + titleCls);
			var $urls = $terms.find("." + urlCls);

			var val = $this.val();
			if(!val) {
				$terms.show();
				return;
			}

			var words = val.split(/[ 　]/g);
			var filteredTitle = $titles;
			var filteredUrl = $urls;
			for(var i=0; i<words.length; i++){
				var word = words[i];
				if(!word) continue;

				filteredTitle = filteredTitle.filter(":contains('" + word + "')");
				filteredUrl = filteredUrl.filter(":contains('" + word + "')");
			}
			
			$terms.hide();
			filteredTitle.parents(".label-term").show();
			filteredUrl.parents(".label-term").show();
		});
		$searchRemove.click(function(){
			$searchInput.val("").keyup();
		});

		//hover
		// template selected
		$("#backgroundColor, #borderColor, #color").simpleColorPicker({
            onChangeColor: function(color) {
                $(this).css("background-color", color);
                storeTemplateSetting();
            }
        });
        $("#fontSize").change(function(){
        	storeTemplateSetting();
        });

        // init on off onOffSetting
        initOnOffSetting();

        // init template templateSetting
        initTemplateSetting();

		//render label list 
		renderLabelList();

		//render count
		renderLabelCount();
	});
	//bind label event
	$.event.add(window, "load", function(){
		//open url
		$("." + openPageCls).click(function(){
			var url = $(this).parents("." + labelTermCls).find("." + urlCls).text();
			chrome.tabs.create({
				url:url
			});
		});
		//delete urlLabel
		$("." + urlLabelDeleteCls).click(function(){
			var $term = $(this).parents("." + labelTermCls);
			var $content = $term.next("dd");
			var url = $term.find("." + urlCls).text();
			deleteUrlLabel(url);
			publishTo(url, {
				status:"deleteUrlLabels"
			});
			$term.remove();
			$content.remove();
		});
		//term action button
		$("." + contentOpenCls).mouseover(function(){
			$(this).addClass("btn-primary");
		}).mouseout(function(){
			$(this).removeClass("btn-primary");
		});
		$("." + openPageCls).mouseover(function(){
			$(this).addClass("btn-primary");
		}).mouseout(function(){
			$(this).removeClass("btn-primary");
		});
		$("." + urlLabelDeleteCls).mouseover(function(){
			$(this).addClass("btn-danger");
		}).mouseout(function(){
			$(this).removeClass("btn-danger");
		});

		//content open
		$("." + contentOpenCls).click(function(){
			var $btn = $(this);
			var $content = $btn.parents("dt").next("dd");
			if($content.is(":visible")){
				$content.slideUp("fast", function(){
					$btn.text("show details");
				});
			}else{
				$content.slideDown("fast", function(){
					$btn.text("hide details");
				});
			}
		});
	});

	function renderLabelList(){
		var labelStore = JSON.parse(window.localStorage.getItem(LABEL_STORE_KEY));
		for(url in labelStore){
			var urlLabels = labelStore[url];
			renderUrlLabels(urlLabels);
		}
	}
	function renderUrlLabels(urlLabels){
		var url = urlLabels.url;
		var title = urlLabels.title;
		var labels = urlLabels.labels;
		var urlLabelsHtml = "<dt class='" + labelTermCls + " fix'>" +
								"<div class='" + termContentCls + "'>" +
									"<h5 class='" + titleCls + "''>" + title + "</h5>" +
									"<p class='" + urlCls + "'>" + url + "</p>" +
								"</div>" +
								"<div class='" + urlLabelActionCls + "'>" +
									"<button class='" + contentOpenCls + " btn btn-mini'>show details</button>" +
									"<button class='" + openPageCls + " btn btn-mini'" + ">open this page</button>" + 
									"<button class='" + urlLabelDeleteCls + " btn btn-mini'>delete</button>" +
								"</div>" +
								"<span class='badge " + labelCountCls + "'></span>" +
							"</dt>" +
							"<dd class='hide'>" +
								createLabelHtml(labels) +
							"</dd>"
							;
		$labelList.append(urlLabelsHtml);
	}
	function createLabelHtml(labelList){
		var labelsHtml = "";
		for(id in labelList){
			var label = labelList[id];		
			labelsHtml = labelsHtml + 
							"<div " + 
							"class='" + labelContentCls + "' " + 
							"style='" +
								"background-color:" + label.backgroundColor+ ";" +  
								"border:3px solid " + label.borderColor + ";" + 
								"color:" + label.color + ";" + 
								"font-size:" + label.fontSize + ";" + 
							"'" +  
							">" +
								"<p>" + (label.content?label.content:" ") + "</p>" +
							"</div>"
							;
		}
		return labelsHtml;
	}
	function renderLabelCount(){
		$("." + labelTermCls).each(function(){
			var $cntTgt = $(this).find("." + labelCountCls);
			var cnt = $(this).next("dd").children("." + labelContentCls).size();
			$cntTgt.text(cnt);
		});
	}
	function storeTemplateSetting(){
		var templateSetting = {};
        templateSetting.backgroundColor = $bgColor.css("background-color");
        templateSetting.borderColor = $borderColor.css("background-color");
        templateSetting.color = $color.css("background-color");
        templateSetting.fontSize = $fontSize.val();

        window.localStorage.setItem(TEMPLATE_SETTING_KEY, JSON.stringify(templateSetting));
	}
	function initOnOffSetting(){
		var onOffSetting = window.localStorage.getItem(ON_OFF_KEY);
		if(onOffSetting === "on"){
			$onOff.addClass("on");
			$onOffImg.css("margin-left", "0");
		}else{
			$onOff.removeClass("on");
			$onOffImg.css("margin-left", "-53px");
		}
	}
	function initTemplateSetting(){
		var templateSetting = JSON.parse(window.localStorage.getItem(TEMPLATE_SETTING_KEY));
		$bgColor.css("background-color", templateSetting.backgroundColor);
		$borderColor.css("background-color", templateSetting.borderColor);
		$color.css("background-color", templateSetting.color);
		$fontSize.val(templateSetting.fontSize);
	}

	//background function
	function create(){
		chrome.extension.getBackgroundPage().create();
	}
	function deleteUrlLabel(url){
		chrome.extension.getBackgroundPage().deleteUrlLabel(url);
	}
	function publishTo(url, data, callback){
		chrome.extension.getBackgroundPage().publishTo(url, data, callback);
	}
	
})(jQuery);