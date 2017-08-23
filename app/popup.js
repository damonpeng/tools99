/**
 * Tools 99, 99 means a lot
 */
const APP_NAME = 'Tools99',
	APP_VERSION = '1.0.0';

let Page;

let APP = (function(){
	const DB_NAME = 'DB__'+ APP_NAME,
		DB_VERSION = 1,
		TABLE_NAME = 'TB__'+ APP_NAME;

	let I = {},
		DB;

	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	DB = (function(){
		let D = function(dbName, onsuccess, options){
			let openRequest;

			!options && (options = {});
			openRequest = indexedDB.open(dbName, options.dbVersion||1);

			openRequest.onsuccess = e => {
				this.dbHandler = e.target.result;
				onsuccess && onsuccess(this.dbHandler);
			};
			openRequest.onerror = e => {
				console.log("Database error: " + e.target.error.code +'-'+ e.target.error.message);
			};
			openRequest.onblocked = options.onblocked || function(){};
			openRequest.onupgradeneeded = e => {
				this.dbHandler = e.target.result;
				// can only create db here
				options.onupgradeneeded && options.onupgradeneeded(this.dbHandler);
			};

			this.dbName = dbName;

			return this;
		};

		D.prototype.deleteDatabase = function() {
			return indexedDB.deleteDatabase(this.dbName);
		};

		D.prototype.createTable = function(tableName, params, callback) {
			let request = this.dbHandler.createObjectStore(tableName, params);

			request.transaction.oncomplete = callback || function(){};
		};

		D.prototype.transaction = function(tableName, mode, onsuccess, onerror, opts) {
			let request = this.dbHandler.transaction([tableName], mode);

			request = request.objectStore(tableName);

			!opts && (opts = {});

			request.oncomplete = onsuccess;
			request.onerror = onerror || function(){}; 
			request.onabort = opts.onabort || function(){};

			return request;
		};

		D.prototype.insert = function(tableName, data, onsuccess, onerror, opts) {
			let request = this.transaction(tableName, 'readwrite')
							.add(data);

			request.onsuccess = (e) => {
				onsuccess(e.target.result);
			};
			request.onerror = onerror || function(){};

			return request;
		};

		D.prototype.update = function(tableName, data, onsuccess, onerror, opts) {
			let request = this.transaction(tableName, 'readwrite')
							.put(data);

			request.onsuccess = (e) => {
				onsuccess(e.target.result);
			};;
			request.onerror = onerror || function(){};

			return request;
		};

		D.prototype.remove = function(tableName, key, onsuccess, onerror, opts) {
			let request = this.transaction(tableName, 'readwrite')
						.delete(key);

			request.onsuccess = (e) => {console.log('suc', e)
				onsuccess(e.target.result);
			};
			request.onerror = onerror || function(){console.log('err', arguments)};

			return request;
		}

		D.prototype.get = function(tableName, key, onsuccess, onerror, opts) {
			let request = this.transaction(tableName, 'readonly')
						.get(key);

			request.onsuccess = (e) => {
				onsuccess(e.target.result);
			};
			request.onerror = onerror || function(){};

			return request;
		};

		D.prototype.list = function(tableName, onsuccess, onerror, opts) {
			let request = this.transaction(tableName, 'readonly')
						.openCursor();

				var result = [];
			request.onsuccess = (e) => {
				let res = e.target.result;

				if(res) {
					result.push(res.value);
					res.continue();
				} else {
					onsuccess(result);
				}
			};

		};

		return D;
	})();

	// Storage Engine based on IndexedDB
	let DBInstance,
		handlerQueue = [];
	I.storage = (function(){
		let IS = {};

		IS.init = function(callback) {
			if (DBInstance) {
				if (DBInstance.dbHandler) { 
					callback(DBInstance.dbHandler);
				} else {
					handlerQueue.push(callback);
				}
			} else {
				handlerQueue.push(callback);

				DBInstance = new DB(DB_NAME, function(idb){
					handlerQueue.forEach((v, i) => {
						v(DBInstance.dbHandler);
					});
				}, {
					dbVersion:DB_VERSION,
					onupgradeneeded: (dbHandler) => {
						if(!dbHandler.objectStoreNames.contains(TABLE_NAME)) {
							DBInstance.createTable(TABLE_NAME, {keyPath: 'name'});
						}
					}
				});
			}
		};

		IS.get = function(key, callback, onerror) {
			IS.init(function(){
				DBInstance.get(TABLE_NAME, key, callback, onerror);
			});
		};

		IS.list = function(callback, onerror) {
			IS.init(function(){
				DBInstance.list(TABLE_NAME, callback, onerror);
			});
		};

		IS.insert = function(data, callback, onerror) {
			IS.init(function(){
				DBInstance.insert(TABLE_NAME, data, callback, onerror);
			});
		};

		IS.update = function(data, callback, onerror) {
			IS.init(function(){
				DBInstance.update(TABLE_NAME, data, callback, onerror);
			});
		};

		IS.remove = function(key, callback, onerror) {
			IS.init(function(){
				DBInstance.remove(TABLE_NAME, key, callback, onerror);
			});
		};

		return IS;
	})();

	I.util = (function(){
		let IU = {};

		IU.tidyXssCode = function(string) {
			return string.toString().replace(/[<>\'\"&']/g, '');
		};

		IU.getCurrentTab = function(callback) {
			// Query filter to be passed to chrome.tabs.query - see
			// https://developer.chrome.com/extensions/tabs#method-query
			let queryInfo = {
				active: true,
				currentWindow: true
			};

			chrome.tabs.query({
				active: true,
				currentWindow: true
			}, function(tabs) {
				callback(tabs[0].url, tabs[0]);
			});
		};

		IU.getRemoteData = function (url, callback, onError) {
			let x = new XMLHttpRequest();

			x.open('GET', url);
			x.responseType = 'json';
			x.onload = function() {
				let response = x.response;
				if (!response) {
					onError && onError(false, 'No response data.');
					return;
				}
				callback(response);
			};
			x.onerror = function() {
				onError && onError(false, 'Network error.');
			};
			x.send();
		};

		return IU;
	})();

	// example data
	function initDB() {
		let data, loginData;

		data = [];

// 		data.push({
// 			group: 'Autofill login info',
// 			name: `${v.name} ${v.email}`,
// 			type: 'script',
// 			content: `document.getElementById('email').value='${v.email}';
// document.getElementById('password').value='${v.password}';`
// 		});

		let hasInserted = false;
		for (let i=0,l=data.length; i<l; i++) {
			I.storage.get(data[i].name, (function(dataItem) {
				return function(res){
					if (!res) {
						I.storage.insert(dataItem, function() {
							console.log(dataItem.name +' insert success');
							hasInserted = true;
						});
					}
				};
			})(data[i]));
		}

		setTimeout(() => {
			hasInserted && location.reload();
		}, 200);
	}

	//// page logic ////
	I.hashHistory = (function(){
		let historyQueue = [];
		let H = {};

		H.push = function(page) {
			historyQueue.push(page);
		};

		H.pop = function() {
			return historyQueue.pop();
		};

		H.back = function() {
			let page = historyQueue.slice(-1);

			page.length && I.route(page[0]);
		};

		H.list = function() {
			return historyQueue;
		};

		return H;
	})();

	//// page route ////
	let urlHash = {
		get: function (name) {
			let hashList = location.hash.substring(1).split('&'),
				result = '';

			if (hashList.length > 0) {
				let hashParams = {};
				hashList.forEach((v, i) => {
					let item = v.split('='),
						key = item[0],
						// tidy xss code
						value = decodeURIComponent(I.util.tidyXssCode(item[1] || ''));

					key & (hashParams[key] = value);

					if (name && key==name) {
						result = value;
					}
				});

				!name && (result = hashParams);
			}

			return result;
		},

		set: function (params) {
			if (params) {
				let hashParams = urlHash.get() || {},
					hashListNew = [];
				
				for (var name in params) {
					hashParams[name] = params[name];
				}
				for (var k in hashParams) {
					hashListNew.push(k +'='+ encodeURIComponent(hashParams[k]));
				}
				location.hash = '#'+ hashListNew.join('&')
			}
		}
	};
	

	IPRendered = {};
	I.route = function(page, params) {
		let urlPageName = urlHash.get('page');

		!params && (params= {});
		params.page = page;
		urlHash.set(params);

		// the same hash won't trigger hashChange event, so manual trigger it
		if (page == urlPageName) {
			gotoPage(page);
		}
	};

	I.relaunch = function(page) {
		if (IPRendered[page] === true) {
			$(`#page-${page}`).html('');
			IPRendered[page] = false;
			IP[page].onRelaunch && IP[page].onRelaunch.call(IP[page], urlHash.get()||null);
		}
	};

	function gotoPage(page) {
		if (typeof page !== 'string') {
			page = urlHash.get('page');
		}
		!page && (page = 'default');

		if (IP[page]) {
			let hashList = I.hashHistory.list();
			let lastPageName = hashList[hashList.length-1];

			if (page == 'back') {
				I.hashHistory.pop();
				page = 'default';
				if (hashList.length<1) {
					I.hashHistory.push('default');
				}
			} else {
				I.hashHistory.push(page);
			}

			// console.log(111, lastPageName, page, hashList)

			if (lastPageName) {
				$(`#page-${lastPageName}`).fadeOut('fast', function(){
					$(this).addClass('hide');
					$(`#page-${page}`).fadeIn('fast').removeClass('hide');
				});
			} else {
				$(`#page-${page}`).fadeIn('fast').removeClass('hide');
			}

			// avoid render it duplicated, only trigger onShow when it's rendered already.
			let hashParams = urlHash.get() || null;
			if (IPRendered[page] !== true) {
				IP[page].onLoad && IP[page].onLoad.call(IP[page], hashParams);
				IPRendered[page] = true;
			} else {
				IP[page].onShow && IP[page].onShow.call(IP[page], hashParams);
			}
		} else {
			throw 'undefined page.';
		}
	}

	function bindPageEvents() {
		window.onhashchange = gotoPage;
	}

	// inject page logic
	let IP = I.page = {};
	Page = function(pages) {
		document.addEventListener('DOMContentLoaded', function() {
			let pagesContainer = $('#pages');
			for (let pageName in pages) {
				pages[pageName].setData = function(data) {
					!pages[pageName].data && (pages[pageName].data = {});
					for (let k in data) {
						pages[pageName].data[k] = data[k];
					}
				};
				IP[pageName] = pages[pageName];
				// init dom container
				pagesContainer.append(`<section id="page-${pageName}" class="page hide"></section>`);
			}

			// default route
			I.route(urlHash.get('page')||'default');
		});
	};

	function initAnalytics() {
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

		ga('create', 'UA-104619296-1', 'auto');
		ga('send', 'pageview');
	}

	// main entrance
	I.onLoad = function() {
		bindPageEvents();

		initDB();

		APP.onLaunch && APP.onLaunch();

		initAnalytics();
	};

	return I;
})();

// can override by page.js
APP.onLaunch = null;

// init
document.addEventListener('DOMContentLoaded', function() {
	APP.onLoad();
});
