const LABEL_STORE_KEY = "labelStore";

// dom cache
const labelListCls = "label-list";
const labelTermCls = "label-term";
const labelCountCls = "label-count";
const labelContentCls = "label-content";
const labelTextCls = "label-content-text";
const termContentCls = "label-term-content";
const titleCls = "label-title";
const urlCls = "labels-url";
const detailBtnCls = "detail-btn";
const urlLabelDeleteCls = "labels-delete-btn";

const $addLabel = $(".add-label");
const $labelList = $("." + labelListCls);
const $setting = $(".setting");
const $searchInput = $("#searchLabelInput");
const $searchRemove = $(".searchTextRemove");

// 初期化
(async () => {
	await renderLabelList();
	renderLabelCount();
})();

// イベントバインド
$addLabel.on("click", create);
$setting.on("click", () => {
	window.open("../html/option.html", "_blank");
});
$searchInput.keyup(function () {
	const val = $(this).val();
	const $terms = $("." + labelTermCls);
	const $titles = $terms.find("." + titleCls);
	const $urls = $terms.find("." + urlCls);
	const $labels = $("." + labelTextCls);

	if (!val) {
		$terms.show().next("dd").hide().find("." + labelContentCls).show();
		$("." + detailBtnCls).show().text("+");
		return;
	}

	const words = val.split(/[ 　]/g).filter(Boolean);
	let filteredTitle = $titles, filteredUrl = $urls, filteredLabels = $labels;

	words.forEach(word => {
		filteredTitle = filteredTitle.filter(`:contains('${word}')`);
		filteredUrl = filteredUrl.filter(`:contains('${word}')`);
		filteredLabels = filteredLabels.filter(`:contains('${word}')`);
	});

	$terms.hide();
	filteredTitle.parents("." + labelTermCls).show().find("." + detailBtnCls).hide();
	filteredUrl.parents("." + labelTermCls).show().find("." + detailBtnCls).hide();

	$("." + labelContentCls).hide();
	filteredLabels.parents("dd").show().prev().show().find("." + detailBtnCls).hide();
	filteredLabels.parents("." + labelContentCls).show();
});

$searchRemove.click(function () {
	$searchInput.val("").keyup();
});

$(document).on("click", "." + urlLabelDeleteCls, async function () {
	const $term = $(this).parents("." + labelTermCls);
	const $content = $term.next("dd");
	const url = $term.find("." + urlCls).text();

	await deleteUrlLabel(url);
	await publishTo(url, { status: "deleteUrlLabels" });

	$term.remove();
	$content.remove();
});

$(document).on("mouseenter", "." + urlLabelDeleteCls, function () {
	$(this).addClass("btn-danger");
}).on("mouseleave", "." + urlLabelDeleteCls, function () {
	$(this).removeClass("btn-danger");
});

$(document).on("click", "." + labelTermCls, function () {
	const $term = $(this);
	const $btn = $term.find("." + detailBtnCls);
	const $content = $term.next("dd");
	if ($content.is(":visible")) {
		$content.slideUp(10, () => $btn.text("+"));
	} else {
		$content.slideDown(10, () => $btn.text("-"));
	}
});

// 関数定義
async function create() {
	chrome.runtime.sendMessage({ status: "create" }, function (response) {
		// if (chrome.runtime.lastError) {
		// 	messagebar({
		// 		text: chrome.runtime.lastError.message,
		// 		during: 5,
		// 		backgroundColor: "firebrick",
		// 		color: "#fff",
		// 		showCloseBtn: true
		// 	});
		// }
	});
}

async function renderLabelList() {
	const result = await chrome.storage.local.get([LABEL_STORE_KEY]);
	const labelStore = JSON.parse(result[LABEL_STORE_KEY] || "{}");

	for (const url in labelStore) {
		renderUrlLabels(labelStore[url]);
	}

	if (!labelStore || Object.keys(labelStore).length === 0) {
		$labelList.append("<h3 class='noData'>no data</h3>");
	}
}

function renderUrlLabels(urlLabels) {
	$labelList.append(createUrlLabelsHtml(urlLabels));
}

function createUrlLabelsHtml(urlLabels) {
	const url = urlLabels.url;
	const title = urlLabels.title;
	const labels = urlLabels.labels;

	return `
    <dt class="${labelTermCls} fix" url="${url}">
      <div class="${termContentCls}">
        <h5 class="${titleCls}"><span class="${detailBtnCls}">+</span>${title}</h5>
        <a class="${urlCls}" href="${url}" target="_blank">${url}</a>
      </div>
      <button class="${urlLabelDeleteCls} btn btn-mini">delete</button>
      <span class="badge ${labelCountCls}"></span>
    </dt>
    <dd style="display:none;">
      ${createLabelHtml(labels)}
    </dd>
  `;
}

function createLabelHtml(labelList) {
	let labelsHtml = "<ul class='urlLabels'>";
	for (const id in labelList) {
		const label = labelList[id];
		labelsHtml += `
      <li class="${labelContentCls}" style="
        background-color:${label.backgroundColor};
        border:3px solid ${label.borderColor};
        color:${label.color};
        font-size:${label.fontSize};
      ">
        <div class="${labelTextCls}">${label.content || " "}</div>
      </li>
    `;
	}
	labelsHtml += "</ul>";
	return labelsHtml;
}

function renderLabelCount() {
	$("." + labelTermCls).each(function () {
		const $cntTgt = $(this).find("." + labelCountCls);
		const cnt = $(this).next("dd").find("." + labelContentCls).length;
		$cntTgt.text(cnt);
	});
}

// 背景関数の代替
async function deleteUrlLabel(url) {
	return chrome.runtime.sendMessage({ status: "deleteUrlLabel", url });
}
async function publishTo(url, data) {
	return chrome.runtime.sendMessage({ status: "publishTo", url, data });
}

function isEmptyObject(obj) {
	return Object.keys(obj).length === 0;
}
