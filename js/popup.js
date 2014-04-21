///// storage /////
var storage = window.localStorage;
var LABEL_STORE_KEY = "labelStore";

///// dom cache /////
//label
var labelListCls = "label-list";
var labelTermCls = "label-term";
var labelCountCls = "label-count";
var labelContentCls = "label-content";
var labelTextCls = "label-content-text";
var termContentCls = "label-term-content";
var titleCls = "label-title";
var urlCls = "labels-url";
var actionOnCls = "action-on";
var detailBtnCls = "detail-btn";

var $addLabel = $(".add-label");
var $labelList = $("." + labelListCls);
//action
var urlLabelDeleteCls = "labels-delete-btn";
var $action = $(".action");

var $setting = $(".setting");
var $searchInput = $("#searchLabelInput");
var $searchRemove = $(".searchTextRemove");

///// initialize /////
//render label list 
renderLabelList();
//render count
renderLabelCount();

///// event /////
$addLabel.on("click", function(event){
	create();
});
$setting.on("click", function(event){
	window.open("../html/option.html", "_blank");
});
$searchInput.keyup(function(){
	var $this = $(this);
	var $terms = $("." + labelTermCls);
	var $labelContents = $("." + labelContentCls);
	var $titles = $terms.find("." + titleCls);
	var $urls = $terms.find("." + urlCls);
	var $labels = $("." + labelTextCls);

	var val = $this.val();
	if(!val) {
		$terms.show().next("dd").hide().find("." + labelContentCls).show();
		$("." + detailBtnCls).show().text("+");;
		return;
	}

	var words = val.split(/[ 　]/g);
	var filteredTitle = $titles;
	var filteredUrl = $urls;
	var filteredLabels = $labels;
	for(var i=0; i<words.length; i++){
		var word = words[i];
		if(!word) continue;

		filteredTitle = filteredTitle.filter(":contains('" + word + "')");
		filteredUrl = filteredUrl.filter(":contains('" + word + "')");
		filteredLabels = filteredLabels.filter(":contains('" + word + "')");
	}
	
	$terms.hide();
	filteredTitle.parents("." + labelTermCls).show().find("." + detailBtnCls).hide();
	filteredUrl.parents("." + labelTermCls).show().find("." + detailBtnCls).hide();

	$labelContents.hide();
	filteredLabels.parents("dd").show();

	filteredLabels.parents("." + labelContentCls).show();
	filteredLabels.parents("dd").prev("dt").show().find("." + detailBtnCls).hide();
});
$searchRemove.click(function(){
	$searchInput.val("").keyup();
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
$("." + urlLabelDeleteCls).mouseover(function(){
	$(this).addClass("btn-danger");
}).mouseout(function(){
	$(this).removeClass("btn-danger");
});

//content open
$(document).on("click", "." + labelTermCls, function(event){
	var $term = $(this);
	var $btn = $term.find("."+ detailBtnCls);
	var $content = $term.next("dd");
console.log($content.size());
	if($content.is(":visible")){
		$content.slideUp(10, function(){
			$btn.text("+");
		});
	}else{
		$content.slideDown(10, function(){
			$btn.text("-");
		});
	}
});

///// function /////
//background function
function create(){
	chrome.extension.getBackgroundPage().create(function(response, lastError){
		if(lastError){
			messagebar({
				text: lastError.message,
				during: 5,
				backgroundColor: "firebrick",
				color: "#fff",
				showCloseBtn: true
			});
		}
	});
}
function renderLabelList(){
	var labelStore = JSON.parse(storage.getItem(LABEL_STORE_KEY));
	for(url in labelStore){
		var urlLabels = labelStore[url];
		renderUrlLabels(urlLabels);
	}
	if(!labelStore || isEmptyObject(labelStore)){
		$labelList.append("<h3 class='noData'>no data</h3>");
	}
}

function renderUrlLabels(urlLabels){
	$labelList.append(createUrlLabelsHtml(urlLabels));
}
function createUrlLabelsHtml(urlLabels){
	var url = urlLabels.url;
	var title = urlLabels.title;
	var labels = urlLabels.labels;
	return "<dt class='" + labelTermCls + " fix' url='" + url + "'>" +
							"<div class='" + termContentCls + "'>" +
								"<h5 class='" + titleCls + "''>" + "<span class='" + detailBtnCls + "'>+</span>" + title + "</h5>" +
								"<a class='" + urlCls + "' href='" + url + "' target='_blank'>" + url + "</a>" +
							"</div>" +
							"<button class='" + urlLabelDeleteCls + " btn btn-mini'>delete</button>" +
							"<span class='badge " + labelCountCls + "'></span>" +
						"</dt>" +
						"<dd style='display:none;'>" +
							createLabelHtml(labels) +
						"</dd>"
						;
}
function createLabelHtml(labelList){
	var labelsHtml = "<ul class='urlLabels'>";
	for(id in labelList){
		var label = labelList[id];		
		labelsHtml = labelsHtml + 
						"<li " + 
						"class='" + labelContentCls + "' " + 
						"style='" +
							"background-color:" + label.backgroundColor+ ";" +  
							"border:3px solid " + label.borderColor + ";" + 
							"color:" + label.color + ";" + 
							"font-size:" + label.fontSize + ";" + 
						"'" +  
						">" +
							"<div class='" + labelTextCls + "'>" + (label.content?label.content:" ") + "</div>" +
						"</li>"
						;
	}
	labelsHtml += "</ul>";
	return labelsHtml;
}
function renderLabelCount(){
	$("." + labelTermCls).each(function(){
		var $cntTgt = $(this).find("." + labelCountCls);
		var cnt = $(this).next("dd").find("." + labelContentCls).size();
		$cntTgt.text(cnt);
	});
}

//background function
function deleteUrlLabel(url){
	chrome.extension.getBackgroundPage().deleteUrlLabel(url);
}
function publishTo(url, data, callback){
	chrome.extension.getBackgroundPage().publishTo(url, data, callback);
}
//util
function isEmptyObject(obj){
	for(i in obj) return false;
	return true;
}
