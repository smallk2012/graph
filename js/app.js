var myDate = new Date();
var yy = myDate.getFullYear(); //获取完整的年份(4位,1970-????)
var mm = myDate.getMonth(); //获取当前月份(0-11,0代表1月)
var dd = myDate.getDate(); //获取当前日(1-31)
var hh = myDate.getHours(); //获取当前小时数(0-23)

var localKey = "yingzaiqidian" + yy + mm + dd + hh;

function compare(val1, val2) {
	// 转换为拼音
	val1 = Pinyin.getFullChars(val1).toLowerCase();
	val2 = Pinyin.getFullChars(val2).toLowerCase();

	// 获取较长的拼音的长度
	var length = val1.length > val2.length ? val1.length : val2.length;

	// 依次比较字母的unicode码，相等时返回0，小于时返回-1，大于时返回1
	for(var i = 0; i < length; i++) {
		var differ = val1.charCodeAt(i) - val2.charCodeAt(i);
		if(differ == 0) {
			continue;
		} else {
			if(val1.charAt(i) == '_') {
				return -1;
			}
			return differ;
		}
	}
	if(i == length) {
		return val1.length - val2.length;
	}
}

var vm = new Vue({
	el: '#app',
	data: {
		isok: false,
		local: '',
		searchKey: '',
		pageKey: '',
		dialog: false,
		cIndex: -1,
		ahttp: '',
		https: [],
		catalog: []
	},
	computed: {
		pages: function() {
			var ar = [];
			for(var m = 0; m < this.catalog.length; m++) {
				ar.push(this.catalog[m].page);
			}

			return ar;
		},
		links: function() {
			var ar = this.cIndex > -1 ? this.catalog[this.cIndex].links : [];
			return ar;
		},
		requests: function() {
			var ar = this.cIndex > -1 ? this.catalog[this.cIndex].requests : [];
			return ar;
		},
		options: function() {
			var ar = [];
			for(var m = 0; m < this.pages.length; m++) {
				var bl = false;

				for(var n = 0; n < this.links.length; n++) {
					if(this.pages[m] == this.links[n].page) {
						bl = true;
						break;
					}
				}
				//本页不计入
				if(this.cIndex >= 0 && this.catalog[this.cIndex].page == this.pages[m]) {
					bl = true;
				}
				if(!bl) {

					var page = this.pages[m].toUpperCase();

					if(this.searchKey) {
						if(page.indexOf(this.searchKey.toUpperCase()) != -1) {
							ar.push({
								page: this.pages[m],
								label: ''
							});
						}

					} else {
						ar.push({
							page: this.pages[m],
							label: ''
						});
					}
				}
			}

			return ar;
		}
	},
	created: function() {
		this.local = window.localStorage.getItem(localKey) || "[]";
		this.catalog = JSON.parse(this.local);
		var ar = [];
		for(var m = 0; m < this.catalog.length; m++) {
			for(var n = 0; n < this.catalog[m].requests.length; n++) {
				var req = this.catalog[m].requests[n];
				var bl = false;
				for(var i = 0; i < ar.length; i++) {
					if(ar[i] == req) {
						bl = true;
						break;
					}
				}
				if(!bl) {
					ar.push(req);
				}
			}
		}
		this.https = ar;
	},
	methods: {
		onEnter: function(page) {
			var self = this;
			if(self.dialog) return;
			self.dialog = true;
			if(self.pageKey) {
				Showbo.Msg.confirm("是否添加页面?<br/>[生成后无法删除,需要保存后手动删除]", function(msg) {
					self.dialog = false;
					if(msg == 'yes') {
						self.pageKey = '';
						self.catalog.push({
							page: page,
							links: [],
							requests: []
						});
					}
				});
			}
			else{
				Showbo.Msg.show({buttons:{yes:'确认'},msg:"添加页面不能为空",title:'提示',fn:function(){
					self.dialog = false;
				}});
			}
		},
		selCatalog: function(item, index) {
			this.cIndex = index;
			window.localStorage.setItem(localKey, JSON.stringify(this.catalog));
		},
		delRequest: function(index) {
			this.requests.splice(index, 1);
		},
		delLinks: function() {
			this.catalog[this.cIndex].links = [];
		},
		delLink: function(index) {
			this.links.splice(index, 1);
		},
		delOption: function(index) {
			var item = this.options.splice(index, 1)[0];
			this.links.push(item);
		},
		addReq: function(item) {
			if(item == '') {
				Showbo.Msg.alert("添加接口不能为空");
			} else {
				this.cIndex > -1 && this.catalog[this.cIndex].requests.push(item);
				var ar = [];

				if(this.https.length == 0) {
					ar.push(item);
				} else {
					var bl = false;
					for(var m = 0; m < this.https.length; m++) {
						if(this.https[m] == item) {
							bl = true;
						}
					}
					if(!bl) {
						ar.push(item);
					}
				}
				if(ar.length) {
					this.https = this.https.concat(ar);
				}
			}
		},
		graph: function() {
			wData = this.catalog;
			this.isok = true;
			downloadFile(document.getElementById('download'), '交互数据', JSON.stringify(this.catalog))
			$("#scene").attr("src", "drag.html?r=" + Math.random());
		},
		sava: function() {
			this.isok = false;
		}
	}
});
var wData = null;

function setIframe(h) {
	$("#scene").css({
		height: h + 'px'
	})
}

function downloadFile(aLink, fileName, content) {
	aLink.download = fileName;
	aLink.href = "data:text/plain," + content;
}
$(function() {
	//阻止浏览器默认行。 
	$(document).on({
		dragleave: function(e) {
			e.preventDefault();
		},
		drop: function(e) {
			e.preventDefault();
		},
		dragenter: function(e) {
			e.preventDefault();
		},
		dragover: function(e) {
			e.preventDefault();
		}
	});

	var box = document.getElementById('droparea');
	box.addEventListener("drop", function(e) {
		e.preventDefault();
		var fileList = e.dataTransfer.files;
		if(fileList.length == 0) {
			return false;
		}
		window.localStorage.setItem(localKey, '[]');
		if(fileList[0].name.indexOf('.txt') != -1) {
			var reader = new FileReader();
			reader.onload = function(e) {
				//this.result.toString()
				if(vm) {
					vm.cIndex = -1;
					vm.catalog = JSON.parse(this.result.toString());
				}
			}
			//读取文件内容
			reader.readAsText(fileList[0]);
		} else {
			var fileAr = [];
			var suffix = fileList[0].name.split('.')[1];
			for(var m = 0; m < fileList.length; m++) {
				if(fileList[m].type.indexOf(suffix) != -1) {
					var fileName = fileList[m].name;
					fileName = fileName.substring(0, fileName.lastIndexOf('.'));
					fileAr.push(fileName);
				}
			}
			if(vm) {
				fileAr.sort(compare);
				var ar = [];
				for(var n = 0; n < fileAr.length; n++) {
					ar.push({
						page: fileAr[n],
						links: [],
						requests: []
					});
				}

				vm.cIndex = -1;
				vm.catalog = ar;
			}
		}
	}, false);
});