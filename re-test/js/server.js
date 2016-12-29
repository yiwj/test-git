var discoveryServer = angular.module('discoveryServer', ['discoveryVariable', 'discoveryUtil']);

discoveryServer.service('server', function($rootScope, device, headers, util, eventKey, authentication, $timeout, pmLog) {
  var handler = {};
  var thread;
  var cacheData = {
    discoveryLoaded : {requestTime : 0, responseTime : 0, responseData : {}},
    featuredMain : {requestTime : 0, responseTime : 0, responseData : {}},
    listLoadedME2212 : {requestTime : 0, responseTime : 0, responseData : {}},
    listLoadedME2312 : {requestTime : 0, responseTime : 0, responseData : {}},
    premiumListLoadedall : {requestTime : 0, responseTime : 0, responseData : {}},
//    appListLoaded0001004 : {requestTime : 0, responseTime : 0, responseData : {}},
//    appMenuLoaded : {requestTime : 0, responseTime : 0, responseData : {}},
    myPageLoaded : {requestTime : 0, responseTime : 0, responseData : {}}
  };
  var appsCategoryId = '', appsType = '', tvshowMenuCode = '', filterCategory = '';
  var timeoutCallbacks = {};
  var handleMessage = function(e) {
    var command = e.data.cmd;
    var params = e.data.params;

    if (!command || !handler[command]) {
      console.log('Worker Command Error: ', e.data);
      return;
    }

    handler[command].apply(this, params);
  };

  var retryCount = 0;
  var scope, element;

  var isDeviceOnline = function() {
    // online 점검
    if (!device.isOnline) {
      $rootScope.breadcrumb.setRunning(false);
      if (device.isQuickStartPlusState && device.isQuickStartPlusPowerState) {
        // At first, in quickStartPlus, do not show network error popup.
        return true;
      }
      $rootScope.$broadcast(eventKey.NETWORK_ERROR);

      if (element && scope) {
        $rootScope.pageManager.popHistory();
        element.remove();
        scope.$destroy();
      }
      return false;
    }
    return true;
  };

  this.initialize = function() {
    thread = new Worker("./resources/js/thread.js");

    thread.addEventListener('message', handleMessage, false);

    if (window.location.host.indexOf('lgappstv.com') < 0 && window.PalmSystem === undefined) {
      thread.postMessage({cmd: 'setHost', params: [window.location.protocol, window.location.host, eventKey]});
    } else if(window.location.port === "8080" && window.PalmSystem){ //로컬서버를 이용하고 티비에 마운트한 경우 테스트를 위해 qt2를 host로 설정
      thread.postMessage({cmd: 'setHost', params: ['http:', 'qt2-kr.lgrecommends.lgappstv.com/2016/api', eventKey]});
    } else {
      //thread.postMessage({cmd: 'setHost', params: ['http:', 'qt2-kr.lgrecommends.lgappstv.com/2016/api']});
      thread.postMessage({cmd: 'setHost', params: ['http:', '', eventKey]});
    }
  };

  this.requestMyPageMenu = function(rank, category) {
    var params = {};

    // online 점검
    if(!isDeviceOnline()) return false;

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];
    params['TierType'] = device.tierType;

    thread.postMessage({cmd: 'MyPageMenu', params: [rank, category, params]});
  };

  handler.MyPageMenu = function(data) {
    $rootScope.$broadcast('myPageMenuLoaded', data);
  };

  // @TODO : 선호 CP List 호출 , api 완료될때까지 local json 호출
  handler.MyPage = function(data) {
    // online 점검
    if(!isDeviceOnline()) return false;
    $rootScope.$broadcast("myPageLoaded", data);
  };

  // @TODO : 선호 CP List 호출 , api 완료될때까지 local json 호출
  this.requestCpList = function(apiID, payload) {
    var params = {};

    // online 점검
    if(!isDeviceOnline()) return false;

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'MyPageCpList', params: [apiID, params, payload]});
  };

  /**
   * @description 서버호출 api gateway
   * @param eventId 서버데이터 수신 후 broadcast할 event명 (호출페이지 내)
   * @param payload 서버호출을 위한 params ( thread내부에서 처리할 extra데이터 포함)
   */
  this.requestApi = function(eventId, payload, destoryInfo, timeoutErrorCallback) {
    pmLog.write(pmLog.LOGKEY.SERVER, {
      msg: 'requestApi',
      eventId: eventId
    });

    if (destoryInfo) {
      element = destoryInfo.element ? destoryInfo.element : '';
      scope = destoryInfo.scope ? destoryInfo.scope : '';
    } else {
      element = '';
      scope = '';
    }

    // online 점검
    if(!isDeviceOnline()) return false;

    // rest test용
//    device.q['HOST'] = 'qt2-US.lgtvsdp.com';

    var headerInfo = {}, deviceInfo = {};
    var currHost = device.q['HOST'].split('.')[0];
    var openApi = '';
    if (currHost.indexOf('qt') > -1 && currHost.indexOf('qt3') === -1 && currHost.indexOf('qt4') === -1) {
      openApi = 'http://' + currHost + '.tvsdp.lgeapi.com';
    } else {
      openApi = 'https://' + currHost + '.tvsdp.lgeapi.com';
    }

    // 2015-10-21 : chrome브라우져로 국가변경 시 데이터 확인
    if ((window.location.port === '8080' ||  location.href.indexOf('lgappstv.com') !== -1) && !window.PalmSystem) {
      try {
        if (isNaN(Number(location.hostname.split('.')[0]))) {
          currHost = location.hostname.split('.')[0];
          if (currHost.indexOf('qt') > -1 && currHost.indexOf('qt3') === -1 && currHost.indexOf('qt4') === -1) {
            openApi = 'http://' + currHost + '.tvsdp.lgeapi.com';
          } else {
            openApi = 'https://' + currHost + '.tvsdp.lgeapi.com';
            device.localPCHeaderObj['X-Device-FCK'] =  '121';
          }
        }
      } catch(e) {}
    }

    var apiUrl = {
      api : '/2016/api',
      apiSearch : '/2016/search',
      q2Sadf : 'http://qt2-kr.lgrecommends.lgappstv.com',
      openApi : openApi
    };
    var apiReqUrl = '';
    // 60 sec 캐싱 11/13일 김나래 대리님으로 부터 1시간 캐싱처리
    var gubun = '';
    try {
      if (eventId === eventKey.LIST_TVMOVIE) {
        tvshowMenuCode = (payload.api).substring(payload.api.lastIndexOf('/') + 1);
        if (payload.payload && payload.payload.FILTER_CATEGORY) {
          filterCategory = payload.payload.FILTER_CATEGORY;
        } else {
          filterCategory = '';
        }
        gubun = eventId + tvshowMenuCode + (filterCategory || '');
      } else if (eventId === eventKey.LIST_APPGAME) {
        appsCategoryId = payload.params.category_id || '';
        appsType = payload.params.rank_type || '';
        gubun = eventId + appsCategoryId + appsType;
      } else if (eventId === eventKey.LIST_PREMIUM) {
        gubun = eventId + payload.params.app_attr;
        filterCategory = payload.params.app_attr;
      } else if (eventId === eventKey.FEATURED_MAIN) {
        gubun = eventKey.DISCOVERY_LOADED;
      } else {
        gubun = eventId;
      }
    } catch(e) {}
    if ((gubun !== 'myPageLoaded') && angular.isDefined(cacheData[gubun]) && !device.param.mycontent) {
      // 'myPageLoaded'인 경우는 건너 띄기 (Filter option 변경된 경우 새로 api 호출 필요)
      if (cacheData[gubun].requestTime && (new Date()) - cacheData[gubun].responseTime < 60 * 60 * 1000) {
        $rootScope.$broadcast(eventId, cacheData[gubun].responseData);
        return;
      }
      cacheData[gubun].requestTime = new Date();
    }

    if (payload.api.indexOf('/search') !== -1 ) {
      apiReqUrl = apiUrl.apiSearch;
    } else {
      apiReqUrl = apiUrl.api;
    }

    if(device.isOpenApi){
      // openAPI begins
      var api_version = payload['apiAppStoreVersion'] ? payload['apiAppStoreVersion'].substring(1) : '7.0';

      var queryString = '';
      var addUrl = payload['addUrl'] ? encodeURIComponent(payload['addUrl']): '';
      var method = payload['method'].toUpperCase();
      if (method === 'GET') {
        if (payload['params'] || payload['payload']) {
          queryString = addUrl + '?';
          var payObj = payload['params'] ? payload['params'] : payload['payload'] ;
          for ( var p in payObj) {
            if (payObj.hasOwnProperty(p)) {
              queryString += p;
              queryString += '=';
              queryString += encodeURIComponent(payObj[p]);
              queryString += '&';
            }
          }
          queryString = queryString.substring(0, queryString.length-1);
        }
      }
      apiReqUrl = apiUrl.openApi + '/lgstore/' + api_version + payload['api'] + queryString;
      // end of openAPI
    } else {
      // 로컬 아이피 접속이면서 port가 8080인 경우
      if ( window.location.hostname != 'localhost' && location.port === '8080' ) {
        apiReqUrl = apiUrl.q2Sadf + apiReqUrl; // sadf2
      }
    }

    angular.copy(device, deviceInfo.info);
    angular.copy(headers, headerInfo);
    headerInfo['X-Authentication'] = device.q['X-Authentication'];

    // local PC
    if ((window.location.port === '8080' ||  location.href.indexOf('lgappstv.com') !== -1) && !window.PalmSystem) {
      headerInfo = device.localPCHeaderObj;
      headerInfo['X-Authentication'] = device.sessionID;

      // 2015-10-21 : chrome브라우져로 국가변경 시 데이터 확인
      try {
        var hostName = location.hostname;
        if (isNaN(Number(hostName.split('.')[0]))) {
          headerInfo['HOST'] = hostName.split('.')[0] + '.' + device.q['HOST'].substring(device.q['HOST'].indexOf('.') + 1);
          if (hostName.split('.')[0].indexOf('-') > -1) {
            hostName = hostName.split('.')[0].substring(hostName.split('.')[0].indexOf('-') + 1);
          } else if (hostName.split('.')[0].indexOf('qt') === -1) {
            hostName = hostName.split('.')[0];
          }
          headerInfo['X-Device-Country-Group'] = hostName;
          headerInfo['X-Device-Country'] = hostName;
        }
      } catch(e) {}
    }

    // payload 추가사항
    // 해상도
    payload.resolutionRatio = device.resolutionRatio;
    payload.isLite = device.isLite;

    // 광고지원여부
    payload.adBannerProviderFlag = device.adProvider;

    // 현재시간
    payload.currentTime = (new Date()).toString();

    // Store 시작시간?
    payload.storeInitTime = device.initTime;

    // API Version (apps에서 사용)
    if (!payload.apiAppStoreVersion) payload.apiAppStoreVersion = 'v8.0';

    // 초기화 루나상태값??

    // device 정보 (deviceInfo, deviceProp - 2015년향 기준)
    // TODO : 불필요한 파라미터를 네트워크상으로 보낼 필요가 없기 때문에 로깅이 필요한 속성의 경우만 아래에 추가
    // deviceInfo
    deviceInfo.info = {};
    deviceInfo.info = {isOpenApi : device.isOpenApi};
    deviceInfo.prop = {};

    payload.headers = headerInfo;
    payload.deviceInfo = deviceInfo.info;
    payload.deviceProp = deviceInfo.prop;

    // rest test용 : line 129의 device.q['HOST']도 수정
//    payload.headers['HOST'] = 'qt2-GB.lgtvsdp.com';
//    payload.headers['X-Device-Language'] = 'en-GB';
//    payload.headers['X-Device-FW-Version'] = '00.00.00';
//    payload.headers['X-Device-ContentsQA-Flag'] = 'Y';
//    payload.headers['X-Device-Netcast-Platform-Version'] = '3.1.0';
//    payload.headers['X-Device-Country-Group'] = 'EU';
//    payload.headers['X-Device-Type'] = 'T01';
//    payload.headers['X-Device-FCK'] = '158';
//    payload.headers['X-Device-SDK-VERSION'] = '3.1.0';
//    payload.headers['X-Device-Locale'] = 'en-GB';
//    payload.headers['X-Device-Remote-Flag'] = 'N';
//    payload.headers['X-Device-Country'] = 'GB';
//    payload.headers['X-Device-Eula'] = 'generalTermsAllowed,networkAllowed';
//    payload.headers['X-Device-Model'] = 'HE_DTV_W16K_AFADABAA';
//    payload.headers['X-Device-ID'] = 'X4xhXgiZ2egrQd0Py+U39/kIQ9J5Viz+9VNHvrfR7q2VMO+SNy31Bli/vXbx8zfgNl9/D2lavsaVHeXq+jtVV065UDyi6ViUTrNrxPWd3a1RKB2Ok1oEvKtQveixzU2E';
//    payload.headers['X-Device-Eco-Info'] = '1';
//    payload.headers['X-Device-Platform'] = 'W16K';
//    payload.headers['X-Device-Product'] = 'webOSTV 3.0';
//    payload.headers['X-Device-Publish-Flag'] = 'N';
//    payload.headers['X-Device-Sales-Model'] = '65UH770V-ZA';

    // 부가정보 분리 (thread에 서비스 주입이나 angular method가 먹지않아 여기서 분리작업 진행)
    var extra = {};
    angular.copy(payload, extra);

    delete payload.gubun;
    delete payload.category;
    delete payload.item;
    delete payload.scope;
    delete payload.freeAppScopeId;

    if (scope) extra.scopeId = scope.$id;

    if (timeoutErrorCallback) {
      // [WOSLQEVENT-97897] [SDPService.LGStore_Movies_Page] [Once] [Minor] 해당 content의 상세페이지로 전환되지 않고 계속 Spinner만 돌아감
      // debug로 천천히 실행하다보면, 아래의 thread.postMessage 호출 이후,
      // 응답이 안오는 경우
      var timer = setTimeout(function() {
        if (timeoutCallbacks[eventId]) {
          if (timeoutCallbacks[eventId].callback) {
            timeoutCallbacks[eventId].callback();
          }
          delete timeoutCallbacks[eventId];
        }
      }, 35 * 1000);

      timeoutCallbacks[eventId] = {
        timer: timer,
        callback: timeoutErrorCallback
      };
    }

    thread.postMessage({cmd: 'executeApi', params: [eventId, apiReqUrl, payload, extra]});
  };

  /**
   * @description web worker에서 api호출 후 각 페이지 caller에게 broadcast해 줌
   * @param event
   * @param data
   */
  handler.responseData = function(event, data) {
    // console.log('server.responseData, event=' + event);

    if (timeoutCallbacks[event] && timeoutCallbacks[event].timer) {
      // [WOSLQEVENT-97897] [SDPService.LGStore_Movies_Page] [Once] [Minor] 해당 content의 상세페이지로 전환되지 않고 계속 Spinner만 돌아감
      clearTimeout(timeoutCallbacks[event].timer);
      delete timeoutCallbacks[event];
    }

    // online 점검
    if(!isDeviceOnline()) return false;

    // 60 sec 캐싱
    var gubun = '';
    var i, j;
    try {
      if (data.scopeName === 'tvshows' || data.scopeName === 'movies') {
        gubun = event + tvshowMenuCode + (filterCategory || '');

        // cpList를 device.availableCpList의 순서로 정렬
        if (data.itemList) {
          for (i = 0 ; i < data.itemList.length ; i++) {
            if (!data.itemList[i].execCpList ||
              (data.itemList[i].execCpList.length < 1))
              continue;

            data.itemList[i].execCpList = util.cpSortAsArray(data.itemList[i].execCpList);
          }
        }

      } else if (data.scopeName === 'appsngames' && event === eventKey.LIST_APPGAME) {
        gubun = event + appsCategoryId + appsType;
      } else if (data.scopeName === 'premium') {
        gubun = event + filterCategory;
      } else if (data.scopeName === 'featured' && event === eventKey.FEATURED_MAIN) {
        gubun = eventKey.DISCOVERY_LOADED;

        // cpList를 device.availableCpList의 순서로 정렬
        if (data.contentsList) {
          for (i = 0 ; i < data.contentsList.length ; i++) {
            if (!data.contentsList[i].contents)
              continue;

            for (j = 0 ; j < data.contentsList[i].contents.length ; j++) {
              if (!data.contentsList[i].contents[j].execCpListString)
                continue;
              data.contentsList[i].contents[j].execCpListString = util.cpSortAsString(data.contentsList[i].contents[j].execCpListString);
            }
          }
        }
      } else if (data.scopeName === 'MovieShowDetail' || data.scopeName === 'TVShowDetail') {
        gubun = event;
        // cpList를 device.availableCpList의 순서로 정렬
        if (data.listDetail &&
          data.listDetail.item_detail &&
          data.listDetail.item_detail.exec_list.execs) {
          data.listDetail.item_detail.exec_list.execs = util.cpSortAsObject(data.listDetail.item_detail.exec_list.execs, 'item_id');
        }
      } else {
        gubun = event;
      }
    } catch(e) {}
    if ((gubun !== 'myPageLoaded') && angular.isDefined(cacheData[gubun])) {
      // 'myPageLoaded'인 경우는 건너 띄기 (Filter option 변경된 경우 새로 api 호출 필요)
      cacheData[gubun].responseTime = new Date();
      angular.copy(data, cacheData[gubun].responseData);
    }

    // event별 broadcast할 필요가 없는 예외 케이스 기술
    if (event === eventKey.DATE_FORMAT) {
//      if (device.q['X-Device-Country'].toUpperCase() === 'RU') {
//        device.dateformat = 'DD-MM-YYYY';
//      } else {
        device.dateformat = data;
        device.updatedateformat = data;
//      }
//      $rootScope.$broadcast(event, data);
    } else if (event === eventKey.LOCALSTORAGE_MYPAGE_LOCALSTORAGE) {
      console.log("svr movie, 3D, TVShow, history deleted  :::", data);
    } else {
      $rootScope.$broadcast(event, data);
    }

    // null 처리 (api호출 시 이벤트가 둘 이상일 경우 순서 없음으로 인한 timeout)
    $timeout(function(){
      appsCategoryId = null;
      appsType = null;
      tvshowMenuCode = null;
      filterCategory = null;
    }, 1 * 1000);
  };

  handler.log = function(event, caller, msg) {
    pmLog.write(pmLog.LOGKEY.SERVER, {
      event: event,
      caller: caller,
      msg: msg
    });
  };

  handler.errorHandler = function(event, data) {
    var errorCode = '';
    var tmpJson = '';

    // error객체가 아래서 data.error도 쓰이고 data.errorCode도 쓰이네..
    if (data.error) {
      errorCode = data.error;
    } else if (data.errorCode) {
      errorCode = data.errorCode;
    }

    try {
      tmpJson = JSON.stringify(data) ? JSON.stringify(data).substr(0, 500) : 'none';
      pmLog.write(pmLog.LOGKEY.ERROR_HANDLER, {
        event: event,
        data: tmpJson
      });
    } catch(e) {
      pmLog.write(pmLog.LOGKEY.ERROR_HANDLER, {
        event: event,
        data: 'parsing error'
      });
    }
    tmpJson = null;

    if (timeoutCallbacks[event] && timeoutCallbacks[event].timer) {
      // [WOSLQEVENT-97897] [SDPService.LGStore_Movies_Page] [Once] [Minor] 해당 content의 상세페이지로 전환되지 않고 계속 Spinner만 돌아감
      clearTimeout(timeoutCallbacks[event].timer);
      delete timeoutCallbacks[event];
    }

    // 에러 발생 시 null 처리
    $timeout(function(){
      appsCategoryId = null;
      appsType = null;
      tvshowMenuCode = null;
      filterCategory = null;
    }, 1 * 1000);

    $rootScope.breadcrumb.setRunning(false);
    //console.error('EVENT:' + event + ' ::: ERROR:' + errorCode);
    // 처음 로딩 시 (앱 실행 후)
    /*if (device.firstRun && (event === eventKey.DISCOVERY_LOADED || event === eventKey.FEATURED_MAIN
      || event === eventKey.DATE_FORMAT || event === eventKey.DEVICE_AUTH || event === eventKey.CP_LIST)) {*/
    // WOSLQEVENT-51658 대응 : deeplink로 앱이 launch 될 시 deeplink된 페이지에서 에러의 경우 페이지를 지워지는 에러
    if (device.firstRun && event !== eventKey.NOTICE_LOADED) {
      data.errorCode = 'alert_adult_3_2';
      device.firstRun = false;
      $rootScope.isMainError(data);
      return false;
    // 공지사항 에러 시는 console error만 출력 (메인 컨텐츠는 로딩이 되었는데, 공지사항만 에러인 경우)
    /*} else if (event === eventKey.NOTICE_LOADED) {
      console.error('공지사항 에러', data.error);
      return false;*/
    //appngame 상세페이지에서 view와 관련없는 apicall에서 http.responseText 값이 없음 에러일경우
    } else if (event === eventKey.INSTALLABLE_APPGAME || event === eventKey.CHECK_UPDATE_APPGAME || event === eventKey.SMALL_UPDATE_LOADED_APPGAME) {
      console.log('appngame installable, checkupdate thread error');
      data.eventName = event;
      $rootScope.$broadcast('fromThreadError', data);
      return false;
    } else if (event === eventKey.ON_WRITE_SERVER_LOG_RECEIVED) {
      // '/discovery/item/GAMESAPPS/Update' api error
      // 내부 로그 저장용 api 이므로, 별도 popup 띄우지 않도록
      return false;
    }

    // error 처리
    $rootScope.$broadcast(eventKey.PAGE_MOVE_ERROR, {
      type : 'error',
      popupTitle : msgLang.alert_adult_3_2,
      errorMsg : msgLang.alert_adult_3_5,
      errorCodeMsg: 'ERROR CODE: {EVENT : ' + event + ', ' + errorCode + '}' //'ERROR CODE : REST.400' // or LIB.400
    });

    // 에러시 불필요한 dom과 scope 생성되는 것 삭제처리
    if (element && scope) {
      // [WOSLQEVENT-75251] history가 2개인 경우 메인 진입 에러 시에 pop을 해서 lancher가 띄워지는 에러
      $rootScope.drawer.isDrawerLink = false; // controller에서 타서 history가 초기화 됨.
      if (!$rootScope.isBackPressed) {
        $rootScope.pageManager.popHistory(true);
        // main인 경우 history가 지워지니 다시 복구
        if (scope.scopeName === 'featured') {
          $rootScope.pageManager.setPreHistory();
        }
      } else {
        $rootScope.isBackPressed = false;
        $rootScope.pageManager.setPreHistory();
      }
      element.remove();
      scope.$destroy();
    }

    return false;
  };

  handler.retryApiCall = function(event, data) {
    pmLog.write(pmLog.LOGKEY.SERVER, {
      msg: 'retryApiCall',
      event: event
    });

    if (timeoutCallbacks[event] && timeoutCallbacks[event].timer) {
      // [WOSLQEVENT-97897] [SDPService.LGStore_Movies_Page] [Once] [Minor] 해당 content의 상세페이지로 전환되지 않고 계속 Spinner만 돌아감
      clearTimeout(timeoutCallbacks[event].timer);
    }

    var retry;
    if (retryCount > 1){// retry 횟수 1번
      retry = 'stop';
      retryCount = 0;
    }
    var callback = function () {
      if (data.request && data.request.headers) {
        //device 인증 값 교체
        data.request.headers['X-Authentication'] = device.q['X-Authentication'];
      }

      // [WOSLQEVENT-97897] [SDPService.LGStore_Movies_Page] [Once] [Minor] 해당 content의 상세페이지로 전환되지 않고 계속 Spinner만 돌아감
      if (timeoutCallbacks && timeoutCallbacks[event] && timeoutCallbacks[event].callback) {
        var timer = setTimeout(function() {
          if (timeoutCallbacks[event]) {
            if (timeoutCallbacks[event].callback) {
              timeoutCallbacks[event].callback();
            }
            delete timeoutCallbacks[event];
          }
        }, 35 * 1000);

        timeoutCallbacks[event].timer = timer;
      }

      thread.postMessage({cmd: 'executeApi', params: [data.eventId, data.callUrl, data.request, data.extra, retry]});
    };
    authentication.update(callback);
    retryCount++;
  };
});
