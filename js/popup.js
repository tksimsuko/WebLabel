(function($){
	var LABEL_STORE_KEY = "labelStore";
	var labelListCls = "label-list";
	var labelTermCls = "label-term";
	var labelCountCls = "label-count";
	var labelContentCls = "label-content";
	var labelRightPaneCls = "label-right";
	var urlLabelActionCls = "labels-action";
	var contentOpenCls = "label-content-open";
	var urlLabelDeleteCls = "labels-delete-btn";
	var urlCls = "labels-url";
	var actionOnCls = "action-on";
	var openPageCls = "open-page";
	var $labelList = $("." + labelListCls);
	$(function(){
		var $onOff = $(".onOff");
		var $addLabel = $(".add-label");
		var $searchLabel = $(".search-label");
		var $searchForm = $(".search-form");
		var $searchInput = $("#searchLabelInput");
		var $popup = $(".popup");

		//bind
		//header button
		$onOff.click(function(){
			
		});
		$addLabel.click(function(){
			requestPopupToPage({
				status:"create"
			});
		});
		$searchLabel.click(function(){
			if($searchForm.is(":visible")){
				$searchForm.hide();
			}else{
				$searchForm.show();
			}
		});
		$popup.click(function(){
			var width = $(window).width();
		    var height = $(window).height();

		    var popupWindow = window.open(
			    "/browser/popup.html",
			    "pop",
			    "innerWidth = " + width +
			    ", innerHeight = " + height +
			    ", top = " + window.screenTop +
			    ", left = " + window.screenLeft +
			    ", resizable = 0"
		    );
		    popupWindow.focus();
		});
		//hover
		$("li", ".action").mouseover(function(){
			$(this).addClass(actionOnCls);
		}).mouseout(function(){
			$(this).removeClass(actionOnCls);
		});	

		//render label list 
		renderLabelList();

		//render count
		renderLabelCount();

	});
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
		//open this page button hover
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
			var $content = $(this).parent("dt").next("dd");
			if($content.is(":visible")){
				$content.slideUp("fast");
			}else{
				$content.slideDown("fast");
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
								"<a class='" + contentOpenCls + "' href='javascript:void(0)'>" +
									"<h4>" + title + "</h4>" +
									"<p class='" + urlCls + "'>" + url + "</p>" +
								"</a>" +
								"<div class='" + labelRightPaneCls + "'>" +
									"<span class='badge " + labelCountCls + "'></span>" +
								"</div>" +
								"<div class='" + urlLabelActionCls + "'>" +
									"<button class='" + openPageCls + " btn btn-mini'>open this page</button>" +
									"<button class='" + urlLabelDeleteCls + " btn btn-mini'>delete</button>" +
								"</div>" +
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
							"<div class='" + labelContentCls + "'>" +
								"<p>" + label.content + "</p>" +
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
	function sendRequestToPage(data, callback){
		chrome.extension.getBackgroundPage().sendRequestToPage(data, callback);
	}
	function sendRequestToPageById(id, data, callback){
		chrome.extension.getBackgroundPage().sendRequestToPageById(id, data, callback);
	}
	function deleteUrlLabel(url){
		chrome.extension.getBackgroundPage().deleteUrlLabel(url);
	}
	function publishTo(url, data, callback){
		chrome.extension.getBackgroundPage().publishTo(url, data, callback);
	}
	function requestPopupToPage(data, callback){
		chrome.extension.getBackgroundPage().requestPopupToPage(data, callback);
	}
})(jQuery);