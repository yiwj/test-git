var handler = {};
var host = '';
var eventKey;

var handleMessage = function(e) {
  var command = e.data.cmd;
  var params = e.data.params;

  if (!command || !handler[command]) {
    self.postMessage({cmd: 'error', params: ['Invalid Command']});
    return;
  }

  handler[command](params);
};

self.addEventListener("message", handleMessage, false);

handler.setHost = function(args) {
  host = args[0] + '//' + args[1];
  eventKey = args[2];
};

handler.dateformat = function(args) {
  var http = new XMLHttpRequest();
  var request = {};

  request.method = 'get';
  request.api = '/discovery2016/account/dateformat';
  request.headers = args[0];
  request.deviceInfo = {};

  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/dateformat.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var obj = JSON.parse(http.responseText);
        if (obj && obj.dateformat && obj.dateformat.format) {
          self.postMessage({cmd: 'dateformat', params: [obj.dateformat.format]});
        }
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.discovery = function(args) {
  var http = new XMLHttpRequest();
  var tierType = '1', request = {};

  request.method = 'post';
  request.api = '/discoveryv6';
  request.headers = args[0];
  request.deviceInfo = {};

  if (args.length > 1) {
    tierType = args[1];
  }

  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/discoveryv6_tier' + tierType+ '.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  http.onreadystatechange = function() {
    // readyState가 0으로 떨어지는 경우에는 오류임
    // Luna로 network 연결을 다시 확인하고, 연결인 경우 재실행
    if (http.readyState == 4) {
      if (http.status == 0 || http.status == 200) {
        if (http.responseText) {
          var jsonObj = JSON.parse(http.responseText);
          var result = {
            contentsList: [],
            headRollingInterval: 30,
            headList: [],
            menuList: []
          };
          var temp, arr, obj, i, j;

          if (jsonObj.lgrecommendations) {
            try {
              temp = jsonObj.lgrecommendations.contentsList;
              for (i = 0; i < temp.length; i++) {
                obj = result.contentsList[i] = {};
                obj.column = temp[i].arrayNumber;
                obj.category = temp[i].contentsCategory;
                obj.contents = [];
                obj.banners = [];

                try {
                  arr = temp[i].contents.promotionBannerList;
                  for (j = 0; j < arr.length; j++) {
                    obj = result.contentsList[i].banners[j] = {};
                    obj.column = arr[j].promotionBanner.arrayLocation;
                    obj.order = arr[j].promotionBanner.order;
                    obj.img = arr[j].promotionBanner.bannerImage;
                    obj.id = arr[j].promotionBanner.bannerLink;
                    obj.name = arr[j].promotionBanner.bannerName;
                  }
                } catch (e) {}

                if (temp[i].contentsCategory == 'tvshows') {
                  try {
                    arr = temp[i].contents.vodList;
                    for (j = 0; j < arr.length; j++) {
                      obj = result.contentsList[i].contents[j] = {};
                      obj.id = arr[j].item_id;
                      obj.img = arr[j].item_img;
                      obj.size = arr[j].item_img_size;
                      obj.name = arr[j].item_name;
                    }
                  } catch (e) {}
                } else if (temp[i].contentsCategory == 'movies') {
                  try {
                    arr = temp[i].contents.movieList;
                    for (j = 0; j < arr.length; j++) {
                      obj = result.contentsList[i].contents[j] = {};
                      obj.id = arr[j].item_id;
                      obj.img = arr[j].item_img;
                      obj.size = arr[j].item_img_size;
                      obj.name = arr[j].item_name;
                    }
                  } catch (e) {}
                } else if (temp[i].contentsCategory == 'appsngames') {
                  arr = temp[i].contents.appList.rankTypeList[0].appList;
                  for (j = 0; j < arr.length; j++) {
                    obj = result.contentsList[i].contents[j] = {};
                    obj.id = arr[j].id;
                    obj.img = arr[j].iconURL;
                    obj.name = arr[j].name;
                    obj.categoryName = arr[j].categoryName;
                    obj.price = arr[j].displayPrice;
                    obj.iconColor = undefined;
                    if (arr[j].iconColor) {
                      obj.iconColor = arr[j].iconColor;
                    }
                  }
                } else if (temp[i].contentsCategory == 'premium') {
                  // tier2
                  arr = temp[i].contents.cpList.rankTypeList[0].appList;
                  for (j = 0; j < arr.length; j++) {
                    obj = result.contentsList[i].contents[j] = {};
                    obj.id = arr[j].id;
                    obj.img = arr[j].iconURL;
                    obj.name = arr[j].name;
                    obj.categoryName = arr[j].categoryName;
                    obj.price = arr[j].displayPrice;
                    if (arr[j].iconColor) {
                      obj.iconColor = arr[j].iconColor;
                    }
                  }
                }
              }
            } catch (e) {}

            if (jsonObj.lgrecommendations.headRollingInterval) {
              result.headRollingInterval = jsonObj.lgrecommendations.headRollingInterval;
            }

            try {
              temp = jsonObj.lgrecommendations.headList;
              for (i = 0; i < temp.length; i++) {
                result.headList[i] = {};
                result.headList[i].category = temp[i].contentsCategory;
                result.headList[i].categoryText = temp[i].contentsCategoryText;
                result.headList[i].title = temp[i].headTitle;
                result.headList[i].genreId = temp[i].genreId;
                result.headList[i].image = getGenreImage(parseInt(temp[i].genreId));

                if (temp[i].contentsCategory == 'tvshows' || temp[i].contentsCategory == 'movies') {
                  result.headList[i].description = temp[i].description.replace(/\n/g, ' ').substr(0, 150);

                  try {
                    result.headList[i].id = temp[i].contents.vodList[0].item_id;
                  } catch (e) {}

                } else if (temp[i].contentsCategory == 'premium') {
                  result.headList[i].genreName = temp[i].genreName;
                  result.headList[i].price = temp[i].price;

                  try {
                    result.headList[i].id = temp[i].contents.premiumList.rankTypeList[0].appList[0].id;
                  } catch (e) {}

                } else if (temp[i].contentsCategory == 'appsngames') {
                  result.headList[i].genreName = temp[i].genreName;
                  result.headList[i].price = temp[i].price;

                  try {
                    result.headList[i].id = temp[i].contents.appList.rankTypeList[0].appList[0].id;
                  } catch (e) {}
                } else if (temp[i].contentsCategory == 'mypage') {
                  result.headList[i].genreName = temp[i].genreName;
                  result.headList[i].price = temp[i].price;

                  try {
                    result.headList[i].id = temp[i].contents.appList.rankTypeList[0].appList[0].id;
                  } catch (e) {}
                }
              }
            } catch (e) {}

            try {
              temp = jsonObj.lgrecommendations.menuList;
              for (i = 0; i < temp.length; i++) {
                result.menuList[i] = {};
                result.menuList[i].menuText = temp[i].menuText;
                result.menuList[i].serviceCode = temp[i].serviceCode;
              }
            } catch (e) {}
          }

          self.postMessage({cmd: 'discovery', params: [result]});
        }
      } else {
        result = {
          error : true,
          errorCode: 'alert_adult_3_2'
        };
        self.postMessage({cmd: 'discovery', params: [result]});
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.TVShowRecommended = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];

  request.method = 'post';
  request.api = '/discovery/category/TS/' + apiID;
  request.headers = args[1];
  request.deviceInfo = {};

  return requestList('tvshows', 'TVShowRecommended', apiID, request);
};

handler.TVShowList = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];

  request.method = 'post';
  request.api = '/discovery/category/TS/' + apiID;
  request.headers = args[1];
  request.deviceInfo = {};
  if (args[2]) request.payload = args[2];

  return requestList('tvshows', 'TVShowList', apiID, request);
};

handler.TVShowDetail = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];
  var scopeId = args[2];
  request.deviceInfo = {};

  request.method = 'post';
  request.api = '/discovery/item/CONTS';
  request.headers = args[1];
  request.payload = {item_id : apiID};

  //TODO 임시용
  apiID = apiID.split('|')[1];
  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/TEDE_'+apiID+'.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  http.onreadystatechange = function() {
    // readyState가 0으로 떨어지는 경우에는 오류임
    // Luna로 network 연결을 다시 확인하고, 연결인 경우 재실행
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          scopeName: 'TVShowDetail',
          TVShowDetail: [],
          scopeId: scopeId
        };
        var temp, arr, obj, i, j;

        if (jsonObj.item) {
          try {
            result.listDetail = jsonObj.item;
          } catch (e) {}
        }
        self.postMessage({cmd: 'TVShowDetail', params: [result]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.MovieRecommended = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];

  request.method = 'post';
  request.api = '/discovery/category/MV/' + apiID;
  request.headers = args[1];
  request.deviceInfo = {};

  return requestList('movies', 'MovieRecommended', apiID, request);
};

handler.MovieList = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];

  request.method = 'post';
  request.api = '/discovery/category/MV/' + apiID;
  request.headers = args[1];
  request.deviceInfo = {};
  if (args[2]) request.payload = args[2];

  return requestList('movies', 'MovieList', apiID, request);
};

handler.MovieShowDetail = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];
  var scopeId = args[2];

  request.method = 'post';
  request.api = '/discovery/item/CONTS';
  request.headers = args[1];
  request.deviceInfo = {};
  request.payload = {item_id : apiID};

  //TODO 임시용
  apiID = apiID.split('|')[1];
  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/MEDE_'+apiID+'.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  http.onreadystatechange = function() {
    // readyState가 0으로 떨어지는 경우에는 오류임
    // Luna로 network 연결을 다시 확인하고, 연결인 경우 재실행
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          scopeName: 'MovieShowDetail',
          TVShowDetail: [],
          scopeId: scopeId
        };
        var temp, arr, obj, i, j;

        if (jsonObj.item) {
          try {
            result.listDetail = jsonObj.item;
          } catch (e) {}
        }
        self.postMessage({cmd: 'MovieShowDetail', params: [result]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.PremiumList = function(args) {
  var http = new XMLHttpRequest();
  var request = {};

  request.method = 'get';
  request.api = '/discovery/premiumapplist';
  request.headers = args[0];
  request.deviceInfo = {};

  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/PREMIUM.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  http.onreadystatechange = function() {
    // readyState가 0으로 떨어지는 경우에는 오류임
    // Luna로 network 연결을 다시 확인하고, 연결인 경우 재실행
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          scopeName: 'premium',
          premiumAppList: []
        };
        var temp, arr, obj, i, j;

        if (jsonObj.premiumAppList) {
          try {
            temp = jsonObj.premiumAppList.appList;
            for (i = 0; i < temp.length; i++) {
              result.premiumAppList[i] = {};
              result.premiumAppList[i].id = temp[i].id;
              result.premiumAppList[i].name = temp[i].name;
              result.premiumAppList[i].categoryName = temp[i].categoryName;
              result.premiumAppList[i].iconURL = temp[i].iconURL;
              result.premiumAppList[i].iconColor = temp[i].iconColor;
            }
            result.appCount = parseInt(jsonObj.premiumAppList.appCount);
          } catch (e) {}
        }
        self.postMessage({cmd: 'PremiumList', params: [result]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.PremiumDetail = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var appID = args[0];
  var fileName = appID.replace(/\./gi,'');

  request.method = 'post';
  request.api = '/discovery/item/GAMESAPPS/Detail';
  request.headers = args[1];
  request.deviceInfo = {};
  request.params = {app_id : appID};

  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/PREMIUM_'+fileName+'.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  http.onreadystatechange = function() {
    // readyState가 0으로 떨어지는 경우에는 오류임
    // Luna로 network 연결을 다시 확인하고, 연결인 경우 재실행
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          scopeName: 'premiumDetail',
          premiumDetail: []
        };
        var temp, arr, obj, i, j;

        if (jsonObj.app) {
          try {
            result.premiumDetail = jsonObj.app;
          } catch (e) {}
        }
        self.postMessage({cmd: 'PremiumDetail', params: [result]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.ThreedList = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];
  var addList = '';

  request.method = 'get';
  request.api = '/threedzone/rest/nc34/getCategoryList';
  request.headers = args[1];

  if (args[2]) request.params = args[2];

  if (host.indexOf('lgappstv.com') < 0) {
    if (request.params) {
      if (typeof request.params.filters != 'number') {
        request.params.filters = request.params.filters.replace(/FILTER/g, '');
        request.params.sort = request.params.sort.replace(/SORTER/g, '');
      }

      if(request.params.page_number > 0) {
        addList = request.params.page_number + '';
      }

      if (apiID === '_shortfilm') {
        apiID = '3D' + apiID + request.params.tag + '_' + request.params.filters + addList;
      } else if (apiID === '_top5') {
        apiID = '3D' + apiID;
      } else {
        apiID = '3D' + apiID + '_' + request.params.sort + '_' + request.params.filters + addList;
      }
      host = '../../resources/assets/' + apiID + '.json';
    }
  }

  http.open(request.method, host, true);
  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function () {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        self.postMessage({cmd: 'ThreedList', params: [jsonObj]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.ThreedDetail = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];
  var addList = '';
  var suffix = ''; // mockup data용

  request.method = 'get';
  request.headers = args[1];

  if (args[2]) request.params = args[2];

  request.api = request.params.api; // 호출 URL 지정

  if (host.indexOf('lgappstv.com') < 0) {
    if (request.params) {
      if(request.params.suffix) suffix = '_' + request.params.suffix;

      apiID = '3D_' + request.params.video_id + suffix;
      host = '../../resources/assets/' + apiID + '.json';
    }
  }

  http.open(request.method, host, true);
  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function () {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var arr = [];
        arr.push(request.params.event);
        arr.push(jsonObj);
        self.postMessage({cmd: 'ThreedDetail', params: arr});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.ThreedData = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];

  request.method = 'post';
  request.api = '/discovery/category/Threed/' + apiID;
  request.headers = args[1];

  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/'+apiID+'.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  http.onreadystatechange = function() {
    // readyState가 0으로 떨어지는 경우에는 오류임
    // Luna로 network 연결을 다시 확인하고, 연결인 경우 재실행
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var arr = [];
        arr.push(jsonObj);
        self.postMessage({cmd: 'ThreedData', params: arr});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.AppNGameList = function(args) {
  var request = {};
  var apiID = args[0];
  request.method = 'get';
  request.api = '/discovery/item/GAMESAPPS';
  request.headers = args[1];
  request.deviceInfo = {};
  if (args[2]) {
    //request.payload = args[2];
    request.params = {};
    request.params.category_id = args[2].FILTER_CATEGORY;
    request.params.item_cnt = args[2].max;
    request.params.rank_type = args[2].RANK_TYPE;
    request.params.start_idx = args[2].index + 1;
    request.params.index = args[2].index;
  }
  return requestList('appsngames', 'AppNGameList', apiID, request);
};

handler.AppNGameMenu = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var rank = args[0].replace('ANG00', '');
  var category = args[1];
  request.method = 'get';
  request.api = '/discovery/category/GAMESAPPS';
  request.headers = args[2];
  request.deviceInfo = {};
  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/AGMenu.json', true);
  } else {
    http.open('POST', host, true);
  }
  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var result = {
          menuList: [], filterList: []
        };
        try {
          var jsonObj = JSON.parse(http.responseText);
          parseAppMenuList(result.menuList, jsonObj.appstoreApps.rankTypeList, rank, 0);
          parseAppFilterList(result.filterList, jsonObj.appstoreApps.categoryList, category);
        } catch (e) {}
        self.postMessage({cmd: 'AppNGameMenu', params: [result]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.AppNGameDetail = function(args) {
  var apiID, scopeId, flag, http = new XMLHttpRequest();
  var request = {};
  request.method = 'get';
  request.api = '/discovery/item/GAMESAPPS/Detail';
  request.headers = args[0];
  //request.payload = args[1];
  request.params = args[1];
  request.deviceInfo = {};
  scopeId = args[2];
  flag = args[3];
  if (host.indexOf('lgappstv.com') < 0) {
    apiID = 'AGD_';
    if (request.params && request.params['app_id']) apiID += request.params['app_id'];

    http.open('GET', '../../resources/assets/' + apiID + '.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        try {
          var jsonObj = JSON.parse(http.responseText);
          var result = {
            scopeName: 'detailApp', scopeId: scopeId, appDetail: [], target: flag
          };
          result.appDetail = jsonObj;
          self.postMessage({cmd: 'AppNGameDetail', params: [result]});
        } catch(e) {}
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.AppNGameRecommended = function(args) {
  var apiID, http = new XMLHttpRequest();
  var request = {};
  request.method = 'get';
  request.api = '/discovery/item/GAMESAPPS/Recommend';
  request.apiAppStoreVersion = 'v7.0';
  request.headers = args[0];
  request.params = args[1];
  request.deviceInfo = {};
  if (host.indexOf('lgappstv.com') < 0) {
    apiID = 'AGDR_';
    if (request.params && request.params['app_id']) apiID += request.params['app_id'];

    http.open('GET', '../../resources/assets/' + apiID + '.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        try {
          var jsonObj = JSON.parse(http.responseText);
          var result = {
            scopeName: 'detailApp', appRecommend: []
          };
          result.appRecommend = jsonObj.recommendedApp;
          self.postMessage({cmd: 'AppNGameRecommended', params: [result]});
        } catch(e) {}
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.AppPackageList = function(args) {
  var apiID, http = new XMLHttpRequest();
  var request = {};
  request.method = 'get';
  request.api = '/purchase/app';
  request.apiAppStoreVersion = 'v7.0';
  request.headers = args[0];
  request.params = args[1];
  request.deviceInfo = {};
  if (host.indexOf('lgappstv.com') < 0) {
    apiID = 'AGDP_';
    if (request.params && request.params['app_id']) apiID += request.params['app_id'];

    http.open('GET', '../../resources/assets/' + apiID + '.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        try {
          var jsonObj = JSON.parse(http.responseText);
          var result = {
            scopeName: 'detailApp', appPackageList: []
          };
          result.appPackageList = jsonObj.app;
          self.postMessage({cmd: 'AppPackageList', params: [result]});
        } catch(e) {}
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.AppInstallable = function(args) {
  var apiID, http = new XMLHttpRequest();
  var request = {};
  request.method = 'get';
  request.api = '/discovery/item/GAMESAPPS/Install';
  request.apiAppStoreVersion = 'v7.0';
  request.headers = args[0];
  request.params = args[1];
  request.deviceInfo = {};
  if (host.indexOf('lgappstv.com') < 0) {
    apiID = 'AI_';
    if (request.params && request.params['app_id']) apiID += request.params['app_id'];

    http.open('GET', '../../resources/assets/' + apiID + '.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        try {
          var jsonObj = JSON.parse(http.responseText);
          var result = {
            scopeName: 'detailApp', appInstallData: []
          };
          result.appInstallData = jsonObj;
          self.postMessage({cmd: 'AppInstallable', params: [result]});
        } catch(e) {}
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.AppCheckUpdate = function(args) {
  var scope, apiID, http = new XMLHttpRequest(), appInfo;
  var request = {};
  request.method = 'get';
  request.api = '/discovery/item/GAMESAPPS/Update';
  request.apiAppStoreVersion = 'v7.0';
  request.headers = args[0];
  request.payload = args[1];
  request.deviceInfo = {};
  scope = args[2];
  if (host.indexOf('lgappstv.com') < 0) {
    apiID = 'AU_';
    if (request.payload && request.payload['app_info']) {
      appInfo = request.payload['app_info'].split(',');
      if (appInfo[0]) apiID += appInfo[0];
    }
    http.open('GET', '../../resources/assets/' + apiID + '.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        try {
          var jsonObj = JSON.parse(http.responseText);
          var result = {
            scopeName: scope, appUpdateList: []
          };
          result.appUpdateList = jsonObj.appUpdateList;
          self.postMessage({cmd: 'AppCheckUpdate', params: [result]});
        } catch(e) {}
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.EventFreeAppPurchase = function(args) {
  var apiID, http = new XMLHttpRequest();
  var request = {};
  request.method = 'post';
  request.api = '/purchase/appPurchase';
  request.apiAppStoreVersion = 'v7.0';
  request.headers = args[0];
  request.payload = args[1];
  if (host.indexOf('lgappstv.com') < 0) {
    apiID = 'AP_';
    if (request.payload && request.payload['app_id']) apiID += request.payload['app_id'];

    http.open('GET', '../../resources/assets/' + apiID + '.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          scopeName: 'detailApp',
          purchaseResult: []
        };
        result.purchaseResult = jsonObj;
        self.postMessage({cmd: 'EventFreeAppPurchase', params: [result]});
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.Actor = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var itemID = args[0];
  var fileName = itemID.replace('.','');

  request.method = 'post';
  request.api = '/discovery/item/PERSON';
  request.headers = args[1];
  request.deviceInfo = {};
  request.payload = {item_id : itemID};

  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/actor_'+fileName+'.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  http.onreadystatechange = function() {
    if (http.readyState === 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          scopeName: 'actor',
          actor: []
        };

        if (jsonObj.item) {
          try {
            result.actor = jsonObj.item;
          } catch (e) {}
        }
        self.postMessage({cmd: 'Actor', params: [result]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

function parseMenuList(dst, src) {
  var i, l;

  try {
    l = src.length;
    for (i = 0; i < l; i++) {
      dst[i] = {};
      dst[i].selected = src[i]['@selected'];
      dst[i].name = src[i].name;
      dst[i].code = src[i].code;
    }
  } catch (e) {}
}

function parseItemList(dst, src) {
  var i, l;

  try {
    l = src.length;
    for (i = 0; i < l; i++) {
      dst[i] = {};
      if (src[i]['@type'] == 'SPLIT') {
        dst[i].type = 'split';
        dst[i].name = src[i].item_name;
      } else {
        dst[i].name = src[i].item_name;
        dst[i].id = src[i].item_id;
        dst[i].img = src[i].item_img;
        dst[i].contsType = src[i].conts_type;
        if (src[i].item_rated_score) dst[i].score = src[i].item_rated_score;
      }
    }
  } catch (e) {}
}

function parseFilterList(dst, src) {
  var i, j, l, m, arr;

  try {
    l = src.length;
    for (i = 0; i < l; i++) {
      dst[i] = {};
      dst[i].key = src[i].key;
      dst[i].values = [];
      arr = src[i].values;
      m = arr.length;
      for (j = 0; j < m; j++) {
        dst[i].values[j] = {};
        dst[i].values[j].selected = arr[j]['@selected'];
        dst[i].values[j].code = arr[j].code;
        dst[i].values[j].name = arr[j].name;
      }
    }
  } catch (e) {}
}

function parseAppMenuList(dst, src, rank, tierType) {
  var i, l, k=-1;
  try {
    l = src.length;
    for (i = 0; i < l; i++) {
      if(tierType < 2 || src[i].tierType >= tierType) {
        k++;
        dst[k] = {};
        dst[k].selected = src[i]['@selected'];
        dst[k].name = src[i].name;

        if(src[i].menuType) {
          dst[k].menuType = src[i].menuType;
        } else {
          dst[k].menuType = '';
        }

        if(src[i].subId) {
          dst[k].subId = src[i].subId;

          dst[k].code = src[i].id.toString() + '_' + src[i].subId.toString();
        } else {
          dst[k].code = src[i].id.toString();
        }

        if (dst[k].code == rank) {
          dst[k].selected = 'TRUE';
        } else {
          dst[k].selected = 'FALSE';
        }
      }
    }
  } catch (e) {}
}

function parseAppList(dst, src, index) {
  var i, l, k;
  try {
    l = src.length;
    k = dst.length;
    // 스크롤시 아이템을 추가할 경우가 아니면 첫번째 shelter 생성
    if (index == 0 && l > 0) {
      dst[k] = {};
      dst[k].type = 'split';
      dst[k].name = '';
      dst[k].firstSplit = true;
      dst[k].showPromotion = false;
      k = k + 1;
    }
    for (i = 0; i < l; i++) {
      dst[i + k] = {};
      dst[i + k].type = 'app';
      dst[i + k].name = src[i].name;
      dst[i + k].id = src[i].id;
      dst[i + k].img = src[i].iconURL;
      dst[i + k].iconColor = src[i].iconColor;
      dst[i + k].categoryName = src[i].categoryName;
      dst[i + k].categoryId = src[i].categoryId;
      dst[i + k].currencyCode = src[i].currencyCode;
      dst[i + k].price = src[i].price;
      dst[i + k].displayPrice = src[i].displayPrice;
      dst[i + k].event = src[i].event;
      dst[i + k].eventPrice = src[i].eventPrice;
      dst[i + k].displayEventPrice = src[i].displayEventPrice;
      dst[i + k].evaluationAverage = src[i].evaluationAverage;
      dst[i + k].ageType = src[i].ageType;
      dst[i + k].isPromotion = false;
    }
  } catch (e) {}
}

function parseMyPagePremiumList(dst, src) {
  var i, l, splitDate = '', yyyymmdd, obj;

  // @TODO src가 날짜별로 정렬
  src = sortByKey(src, 'item_last_use_date');

  try {
    l = -1;
    for (i = 0; i < src.length; i++) {
      yyyymmdd = src[i].item_last_use_date.substring(0, 8);
      if(splitDate != yyyymmdd) {
        splitDate = yyyymmdd;

        l++;
        dst[l] = {};
        dst[l].date = splitDate;
        dst[l].apps = [];
      }

      obj = {};
      obj = {
        name: src[i].item_name,
        id: src[i].item_id,
        img: src[i].item_img,

        categoryName: src[i].categoryName,
        iconURL: src[i].iconURL,
        iconColor: src[i].iconColor
      };
      if (src[i].item_rated_score)
        obj.score = src[i].item_rated_score;

      dst[l].apps.push(obj);
    }
  } catch (e) {}
}

function parsePromotionList(dst, src) {
  var i, j, k, l, m;
  try {
    l = src.length;
    k = 0;
    for (i = 0; i < l; i++) {
      dst[k] = {};
      dst[k].type = 'split';
      dst[k].name = src[i].promotionName;
      m = src[i].promotionAppCount;
      k++;
      for (j = 0; j < m; j++) {
        dst[k] = {};
        dst[k].img = src[i].promotionAppList[j].bannerURL;
        dst[k].id = src[i].promotionAppList[j].id;
        dst[k].type = src[i].promotionAppList[j].type;
        dst[k].isPromotion = true;
        k++;
      }
    }
  } catch (e) {}
}

function parseAppFilterList(dst, src, category) {
  var i, l;
  try {
    l = src.length;
    dst[0] = {};
    dst[0].key = 'FILTER_CATEGORY';
    dst[0].values = [];
    for (i = 0; i < l; i++) {
      dst[0].values[i] = {};
      dst[0].values[i].name = src[i].name;
      dst[0].values[i].code = src[i].id;
      if (src[i].id == category) {
        dst[0].values[i].selected = 'TRUE';
      } else {
        dst[0].values[i].selected = 'FALSE';
      }
    }
  } catch (e) {}
}

function toArrayList(dst, jsonObj) {
  var obj, i=0, j=0;

  while(jsonObj[i]) {
    obj = jsonObj[i];
    dst[j] = {};
    dst[j].item_name = obj.itemName;
    dst[j].item_id = obj.itemId;
    dst[j].item_img = obj.itemImg;
    dst[j].category_name = obj.categoryName;
    dst[j].item_last_use_date = obj.item_last_use_date;

    dst[j].categoryName = obj.categoryName;
    dst[j].iconURL = obj.iconURL;
    dst[j].iconColor = obj.iconColor;

    i++;
    j++;
  }

  return i;
}

function requestList(scope, command, apiID, request) {
  var startIndex, http = new XMLHttpRequest();
  if (host.indexOf('lgappstv.com') < 0) {
    switch (scope) {
      case 'tvshows':
        apiID = 'TS' + apiID;
        break;
      case 'movies':
        apiID = 'MV' + apiID;
        break;
      case 'appsngames':
        apiID = 'AG' + apiID;
        //app&game의 경우 startIndex를 api에서 넘겨오지 않으므로, 최초 요청시에 데이타로 대체?
        startIndex = request.payload ? (request.payload.index > 0 ? request.payload.index : 0) : 0;
        break;
      case 'mypage':
        apiID = '' + apiID;
        //pc local서버용
        if (apiID == '0-0') {
          apiID = 'MP001000100';
        } else if(apiID =='CP') {
          apiID = 'MP002000100';
        }
        //mypage의 경우 startIndex를 api에서 넘겨오지 않으므로, 최초 요청시에 데이타로 대체?
        startIndex = request.payload ? (request.payload.index > 0 ? request.payload.index : 0) : 0;
        break;
    }
    if (request.payload) {
      if (request.payload['FILTER_FILTER']) {
        apiID += request.payload['FILTER_FILTER'];
      } else if (request.payload['FILTER_CATEGORY']) {
        apiID += request.payload['FILTER_CATEGORY'];
      } else if (request.payload['FILTER_ORDER'] && request.payload['FILTER_GENRE']) {
        apiID += request.payload['FILTER_ORDER'];
        apiID += request.payload['FILTER_GENRE'];
      }

      if (scope == 'appsngames' && startIndex > 0) apiID += startIndex;

      // submenu인 경우
      if(scope == 'mypage') {
        if (request.payload.index > 0) {
          if(request.payload.index == 1) {
            apiID = apiID + '_' + 'TS';
          } else if(request.payload.index == 2) {
            apiID = apiID + '_' + 'MOVIE';
          } else {
            apiID += request.payload.index;
          }
        }
      }
    }
    http.open('GET', '../../resources/assets/' + apiID + '.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var result = {
          scopeName: scope,
          menuList: [],
          itemList: [],
          filterList: []
        };

        var tempObj = {itemList: []};

        try {
          var jsonObj = JSON.parse(http.responseText);
          if (result.scopeName == 'appsngames') {
            if (!request.payload) {
              request.payload = request.params;
              startIndex = request.params.index;
            }
            if (jsonObj.rankType.promotionCount > 0) {
              parsePromotionList(result.itemList, jsonObj.rankType.promotionList);
            }
            parseAppList(result.itemList, jsonObj.rankType.appList, request.params.index);
            result.total = parseInt(jsonObj.rankType.totalAppCount);
            result.startIndex = startIndex;
          } else if (result.scopeName == 'mypage') {
            result.scope = scope;
            result.jsonObj = jsonObj;
          } else {
            result.total = parseInt(jsonObj.item_list['@total_item_cnt']);
            result.startIndex = parseInt(jsonObj.item_list['@start_index']) - 1;
            result.skinType = jsonObj.item_list['@skin_type'];
            parseMenuList(result.menuList, jsonObj.menu_list.menus);
            parseItemList(result.itemList, jsonObj.item_list.items);
            parseFilterList(result.filterList, jsonObj.filter_list.filters);
          }
        } catch (e) {}

        self.postMessage({cmd: command, params: [result]});
      }
    }
  };

  http.send(JSON.stringify(request));
}

var codeList = {
  '100': 100, // apps&games
  '200': 200, // premium
  '1': 26, // ETC 기타
  '2': 19, // Drama 드라마
  '3': 17, // Melodrama Romance 멜로·로맨스
  '4': 26, // SF  SF
  '5': 15, // Current Affairs/Documentary 시사/다큐
  '6': 4, // Action 액션
  '7': 14, // Animation 애니메이션
  '8': 8, // Fantasy  판타지
  '9': 12, // Adventure 어드벤처
  '10': 13, // Mystery  미스터리
  '11': 11, // Western  서부
  '12': 3, // Musical 뮤지컬
  '13': 4, // Noir  느와르
  '14': 4, // Crime 범죄
  '15': 4, // Martial Arts  무협
  '16': 25, // War  전쟁
  '17': 2, // Comedy  코미디
  '18': 3, // Music 뮤직
  '19': 9, // Biography 전기
  '20': 5, // Omnibus 옴니버스
  '21': 5, // Short Film  단편 영화
  '22': 1, // Family  가족
  '23': 21, // Sport  스포츠
  '24': 5, // Experimental Film and Video 실험영화
  '25': 19, // TV Series  TV 시리즈
  '26': 10, // 3D 3D
  '27': 5, // Silent film 무성 영화
  '28': 5, // Black and white films 흑백 영화
  '29': 16, // Adult  성인
  '30': 17, // Melodrama Romance  멜로·로맨스
  '31': 7, // CBlockbuster  블록버스터
  '32': 16, // Queer  퀴어
  '33': 9, // History and Narrative 역사·서사
  '34': 9, // Period drama  시대극
  '35': 13, // Thriller 스릴러
  '36': 13, // Detective  추리
  '37': 1, // Sitcom  시트콤
  '38': 4, // Spy 스파이
  '39': 22, // Schooldays 학원물
  '40': 13, // Horror 호러
  '41': 24, // Natural disasters  자연재해
  '42': 5, // Film  필름
  '43': 9, // History 역사
  '44': 5, // Independent Film  인디영화
  '45': 15, // International  국제
  '46': 14, // Kids 어린이
  '47': 20, // Lifestyle  생활
  '48': 6, // Promotion Content 프로모션
  '49': 19, // Reality TV 리얼리티
  '50': 23, // Science Fiction  과학
  '51': 17, // Emotional Romance  감성로맨스
  '52': 2, // Romantic Comedy 로맨틱 코메디
  '53': 2, // Black Comedy  블랙코미디
  '54': 16, // Erotic 에로
  '55': 16, // Erotic Drama 에로틱드라마
  '56': 18, // Recreation Entertainment 오락/연예
  '57': 20, // Hobby/Leisure  취미/레저
  '58': 22, // Education  교육
  '59': 15, // News 뉴스
  '60': 15, // Culture/Information  교양/정보
  '61': 6, // Shopping  홈쇼핑
  '62': 18, // talk show & Entertainment  토크쇼/예능
  '64': 15 // Mockumentary  페이크 다큐
};
var imageList = {
  '100': ['app'],
  '200': ['premiumapp'],
  '1': ['01'],
  '2': ['02_a','02_b','02_c'],
  '3': ['03'],
  '4': ['04_a', '04_b'],
  '5': ['05'],
  '6': ['06'],
  '7': ['07_a','07_b','07_c'],
  '8': ['08_a','08_b'],
  '9': ['09_a','09_b'],
  '10': ['10'],
  '11': ['11'],
  '12': ['12'],
  '13': ['13_a','13_b'],
  '14': ['14_a','14_b'],
  '15': ['15_a','15_b'],
  '16': ['16'],
  '17': ['17_a','17_b'],
  '18': ['18_a','18_b','18_c','18_d','18_e'],
  '19': ['19_a','19_b','19_c','19_d','19_e'],
  '20': ['20'],
  '21': ['21'],
  '22': ['22_a','22_b'],
  '23': ['23_a','23_b'],
  '24': ['24'],
  '25': ['25'],
  '26': ['26_a','26_b','26_c','26_d','26_e','26_f','26_g','26_h']
};

var getGenreImage = function(genreId) {
  var prefix = 'https://qt2-kr.lgrecommends.lgappstv.com/gi-image/genreimage/genre_';
  var postfix = '.png';
  var arr, str;

  arr = imageList[codeList[genreId]];
  str = arr[0];
  arr.push(arr.shift());

  return prefix + str + postfix;
};

handler.SearchList = function(args) {
  var http = new XMLHttpRequest();
  var request = {};

  request.method = 'post';
  request.api = '/premiumapplist';
  request.headers = args[1];
  request.deviceInfo = {};

  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/PREMIUM.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  http.onreadystatechange = function() {
    // readyState가 0으로 떨어지는 경우에는 오류임
    // Luna로 network 연결을 다시 확인하고, 연결인 경우 재실행
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          scopeName: 'searchList',
          premiumAppList: []
        };
        var temp, arr, obj, i, j;

        if (jsonObj.premiumAppList) {
          try {
            temp = jsonObj.premiumAppList.appList;
            for (i = 0; i < temp.length; i++) {
              result.premiumAppList[i] = {};
              result.premiumAppList[i].id = temp[i].id;
              result.premiumAppList[i].name = temp[i].name;
              result.premiumAppList[i].categoryName = temp[i].categoryName;
              result.premiumAppList[i].iconURL = temp[i].iconURL;
              result.premiumAppList[i].iconColor = temp[i].iconColor;
            }
            result.appCount = parseInt(jsonObj.premiumAppList.appCount);
          } catch (e) {}
        }
        self.postMessage({cmd: 'SearchList', params: [result]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.MyPage = function(args) {
  var request = {};
  var apiID = args[0];
  request.method = 'post';
  request.api = '/discovery/mypage/myapps';
  request.headers = args[1];
  request.apiAppStoreVersion = 'v6.0';
  request.deviceInfo = {};
  if (host.indexOf('lgappstv.com') < 0) request.apiLocal = apiID;
  if (args[2]) request.payload = args[2];
  return requestList('mypage', 'MyPage', apiID, request);
};

handler.MyPageMenu = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var rank = args[0].replace('MP00', '');
  var category = args[1];
  request.method = 'get';
  request.api = '/discovery/category/myPageMenu';
  request.headers = args[2];
  request.deviceInfo = {};
//  if (host.indexOf('lgappstv.com') < 0) {
//    http.open('GET', '../../resources/assets/MyPageMenu.json', true);
//  } else {
//    http.open('POST', host, true);
//  }
  http.open('GET', '../../resources/assets/MyPageMenu.json', true);
  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          menuList: [], filterList: []
        };
        try {
          parseAppMenuList(result.menuList, jsonObj.appstoreApps.rankTypeList, rank, args[2].TierType);
          parseAppFilterList(result.filterList, jsonObj.appstoreApps.categoryList, category);
        } catch (e) {}
        self.postMessage({cmd: 'MyPageMenu', params: [result]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.MyPageCpList = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];

  request.method = 'post';
  request.api = '/discovery2016/cp-list';
  request.apiAppStoreVersion = 'v6.0';
  request.headers = args[1];
  request.deviceInfo = {};
  if (host.indexOf('lgappstv.com') < 0) request.apiLocal = apiID;
  if (args[2]) request.payload = args[2];

  return requestList('mypage', 'MyPage', apiID, request);
};

handler.MyPageRecentData = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];

  request.method = 'post';
  request.api = '/discovery/mypage/recentHistory/' + apiID;
  request.apiAppStoreVersion = 'v6.0';
  request.headers = args[1];
  request.deviceInfo = {};
  if (host.indexOf('lgappstv.com') < 0) request.apiLocal = apiID;
  if (args[2]) request.payload = args[2];

  return requestList('mypage', 'MyPage', apiID, request);
};

handler.deleteRecentHistory = function(args) {
  var i, payload, deleteItems;
  deleteItems = '';
  payload = args[1];

  for (i = 0 ; i < payload.length ; i++) {
    if (i > 0) {
      deleteItems += '♬';
    }
    deleteItems += 'CONTS' + '|' + payload[i];
  }

  var scope = 'mypage';
  var http = new XMLHttpRequest();
  var request = {deviceInfo: {}};
  request.method = 'post';
  request.api = '/discovery/mypage/recentHistory/deleteItems';
  request.headers = args[0];
  request.deviceInfo = {};
  request.payload = {
    "delete_items": deleteItems
  };

  if (host.indexOf('lgappstv.com') < 0) {
    // do nothing.
    self.postMessage({cmd: 'onRecentDataDeleted', params: []});
    return;
  } else {
    http.open('POST', host, true);
  }
  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var result = JSON.parse(http.responseText);
        self.postMessage({cmd: 'onRecentDataDeleted', params: [result]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.BillInfo = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];

  request.headers = args[1];
  request.deviceInfo = {};

  if (args[2]) request.params = args[2];

  request.method = request.params.method;
  request.api = request.params.api; // 호출 URL 지정

  if (host.indexOf('lgappstv.com') < 0) {
    if (request.params) {
      /* TODO : 앱&게임 평가하기 테스트를 위해 주석처리함. 테스트후 삭제해야함.
       if (apiID.indexOf('.') === -1) {
       host = '../../resources/assets/3DBILL_' + apiID + '.json';
       } else {
       host = '../../resources/assets/AGBILL_' + apiID + '.json';
       }*/
      host = '../../resources/assets/AGBILL_' + apiID + '.json';
    }
  }

  http.open(request.method, host, true);
  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function () {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var arr = [];
        arr.push(request.params.event);
        arr.push(jsonObj);
        self.postMessage({cmd: 'BillInfo', params: arr});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.LocalStorage = function(args) {
  var http = new XMLHttpRequest();
  var request = {};

  request.headers = args[0];
  request.deviceInfo = {};

  if (args[1]) request.params = args[1];

  request.method = request.params.method;
  request.api = request.params.api; // 호출 URL 지정

  if (host.indexOf('lgappstv.com') < 0) {
    if (request.params) {
      // local
      console.log('pc...');
    }
  }
  http.open(request.method, host, true);
  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function () {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var arr = [];
        arr.push(request.params.event);
        arr.push(jsonObj);
        self.postMessage({cmd: 'LocalStorage', params: arr});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.AppNGameRating = function(args) {
  var apiID, http = new XMLHttpRequest();
  var request = {};
  request.method = 'post';
  request.api = '/discovery/rating/GAMESAPPS';
  request.apiAppStoreVersion = 'v7.0';
  request.headers = args[0];
  request.payload = args[1];
  request.deviceInfo = {};
  if (host.indexOf('lgappstv.com') < 0) {
    apiID = 'AR_';
    if (request.payload && request.payload['app_id']) apiID += request.payload['app_id'];
    //TODO : 로컬테트스를 위해 임시로 json 파일명 정의함. 개발 완료후 삭제해야함.
    apiID = 'AR_default';
    http.open('GET', '../../resources/assets/' + apiID + '.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          scopeName: 'detailApp',
          rateResult: []
        };
        result.rateResult = jsonObj;
        self.postMessage({cmd: 'AppNGameRating', params: [result]});
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.SearchOption = function(args) {
  var http = new XMLHttpRequest();
  var request = {};

  request.method = 'post';
  request.api = '/rest/sdp/v6.0/search/condition';
  request.headers = args[0];
  request.deviceInfo = {};

  if (args[1]) {
    request.payload = args[1];
  }
  var host = args[2];
  //var host = 'http://qt2-kr.lgrecommends.lgappstv.com/2015/search'+'?'+new Date().getTime();

  if (host.indexOf('lgappstv.com') < 0) {
    if (request.payload) {
      host = '../../resources/assets/search_option.json';
    }
  }

  http.open(request.method, host, true);
  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function () {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        self.postMessage({cmd: 'SearchOption', params: [jsonObj]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.SearchResult = function(args) {
  var http = new XMLHttpRequest();
  var request = {};

  request.method = 'post';
  request.api = '/rest/sdp/v6.0/search/retrieval';
  request.headers = args[0];
  request.deviceInfo = {};

  if (args[1]) {
    request.payload = args[1];
  }
  var host = args[2];
  //var host = 'http://qt2-kr.lgrecommends.lgappstv.com/2015/search'+'?'+new Date().getTime();

  if (host.indexOf('lgappstv.com') < 0) {
    if (request.payload) {
      if(request.payload.domain.length > 1) {
        host = '../../resources/assets/search_result_' + request.payload.query + '.json';
      } else {
        if(request.payload.sortby[0] != undefined && request.payload.sortby[0] != ''
          && request.payload.filterby.genre_code == '' && request.payload.filterby.price_code == '') {
          host = '../../resources/assets/search_result_' + request.payload.query + '_' + request.payload.domain[0] + '_' +request.payload.sortby[0] + '.json';
        }else{
          host = '../../resources/assets/search_result_' + request.payload.query + '_' + request.payload.domain[0] + '.json';
        }
      }
    }
  }

  http.open(request.method, host, true);
  http.setRequestHeader('Content-Type', 'text/html;charset=utf-8');//한글로 입력된 keyword가 깨져서 요청되므로 추가
  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function () {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          scopeName: request.payload.domain.length > 1 ? 'searchResult' : 'searchMore',
          title: request.payload.query,
          searchResult: []
        };
        if (jsonObj.response) {
          try {
            result.searchResult = jsonObj.response;
          } catch (e) {}
        }
        self.postMessage({cmd: 'SearchResult', params: [result]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.ContentData = function(args) {
  var http = new XMLHttpRequest();
  var request = {};

  request.method = 'post';
  request.api = '/nonMapping/itemDetail';
  request.headers = args[0];

  if (args[1]) request.params = args[1];

  if (host.indexOf('lgappstv.com') < 0) {
    if (request.params) {
      // TODO Tier2 비매핑 데이터? (확인)
      host = '../../resources/assets/search_content_data.json';
    }
  }

  http.open(request.method, host, true);
  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function () {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        self.postMessage({cmd: 'ContentData', params: [jsonObj]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.searchTitle = function(args) {
  var apiID, http = new XMLHttpRequest();
  var request = {};
  request.method = 'post';
  request.api = '/rest/sdp/v6.0/search/direction';
  request.headers = args[0];
  request.payload = args[1];
  request.deviceInfo = {};
  var host = args[2];
  //var host = 'http://qt2-kr.lgrecommends.lgappstv.com/2015/search'+'?'+new Date().getTime();

  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/search_title.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        self.postMessage({cmd: 'SearchTitle', params: [jsonObj]});
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.searchPopular = function(args) {
  var apiID, http = new XMLHttpRequest();
  var request = {};
  request.method = 'post';
  request.api = '/rest/sdp/v6.0/search/popular_keyword';
  request.headers = args[0];
  request.payload = args[1];
  request.deviceInfo = {};
  var host = args[2];
  //var host = 'http://qt2-kr.lgrecommends.lgappstv.com/2015/search'+'?'+new Date().getTime();

  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/search_popular.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        self.postMessage({cmd: 'SearchPopular', params: [jsonObj]});
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.searchSuggest = function(args) {
  var apiID, http = new XMLHttpRequest();
  var request = {};
  request.method = 'post';
  request.api = '/rest/sdp/v6.0/search/auto_keyword';
  request.headers = args[0];
  request.payload = args[1];
  request.deviceInfo = {};
  var host = args[2];
  //var host = 'http://qt2-kr.lgrecommends.lgappstv.com/2015/search'+'?'+new Date().getTime();

  if (host.indexOf('lgappstv.com') < 0) {
    http.open('GET', '../../resources/assets/search_suggested.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        self.postMessage({cmd: 'SearchSuggest', params: [jsonObj]});
      }
    }
  };

  http.send(JSON.stringify(request));
};

handler.theme = function(args) {
  var apiID, http = new XMLHttpRequest();
  var request = {};

  request.method = 'get';
  request.api = '/discovery6/themepage/';
  request.headers = args[0];
  request.addUrl = args[1].addUrl;
  request.payload = args[1].params;

  if (host.indexOf('lgappstv.com') < 0) {
    apiID = 'TH_';
    if (request.addUrl) apiID += request.addUrl;
    http.open('GET', '../../resources/assets/' + apiID + '.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          scopeName: 'detailTheme',
          themePage: []
        };
        result.themePage = jsonObj.themepage;
        self.postMessage({cmd: 'theme', params: [result]});
      }
    }
  };

  http.send(JSON.stringify(request));
};

/**
 * 주어진 Data Array 를 해당 Key 중심으로 정렬 한다
 * array : 정렬 대상 key : data 에서 정렬이 필요한 Key data.key 형식 사용한다
 * @description Data를 날짜순으로 정렬
 */
function sortByKey(array, key) {
  return array.sort(function(a, b) {
    var x = a[key];
    var y = b[key];
    return ((x > y) ? -1 : ((x < y) ? 1 : 0));
  });
}