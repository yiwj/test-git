discoveryService.service('adManager', function($rootScope, $http, LunaService2, device, util, eventKey, pmLog) {
  var that = this;
  var apiDomain = 'luna://com.webos.service.admanager/';
  var debugApiDomain = './resources/assets/';
  var apiList = [
    'requestContextIndex',
    'requestBannerInfo',
    'requestRollAndBannerInfo',
    'requestAssetClickInfo',
    'sendImpressionTracker',
    'requestPreRollInfo'
  ];

  this.type = 'adManager';
  this.api = '';
  this.debugApi = '';
  this.subscribe = false;
  this.param = {};
  this.responseParam = {};
  this.timeout = 10000;
  this.adResponse = [];
  this.curModule = '';
  this.detailAppAppId = '';

  var lunaService = new LunaService2(that);
  var elapseTime = null;

  this.call = function(api, param, scope, callbackFn, appId) {
//    console.log("adManager.js call() : ", api, param, scope, callbackFn);
    elapseTime = new Date();
    if (api == null) api = apiList[0];
    if (apiList.indexOf(api) < 0) return;
    if (param) {
      this.param = param;
    } else {
      this.param = {};
    }

    this.api = apiDomain + api;
    this.debugApi = debugApiDomain + api + '.json';
    this.callBackParam = {};
    this.callBackParam.api = this.api;
    if (scope) {
      this.callBackParam.scope = scope;
    } else {
      this.callBackParam.scope = device.param.scope;
    }
    if (callbackFn) this.callBackParam.callbackFn = callbackFn;
    //2017년향 앱상세화면 광고 파라미터 추가
    if(scope === 'detailApp'){
      that.detailAppAppId = appId;
    }


//    console.log("this.callBackParam : ", this.callBackParam);
    lunaService.call();
  };

  this.serviceCallback = function(response) {
    var api, scope, param, slotNames;

    slotNames = {
      featured: 'Portal/Discovery@Main',
//      featured: 'Portal/Companion@Main',  //17년향 TV가 없을 경우 사용되는 slotName
      tvshows: 'Portal/CatchUp@Main',
      movies: 'Portal/Movie@Main',
//      premium: 'Portal/GameApp@Main',
      appsngames: 'Portal/GameApp@Main',
      detailApp: 'Portal/AppDownload@Main'
    };

    api = response.api ? response.api : this.callBackParam.api;
    scope = response.scope ? response.scope : this.callBackParam.scope;
    if (scope === "header") scope = "featured";
    callbackFn = response.callbackFn ? response.callbackFn : this.callBackParam.callbackFn;

//    console.log("adManager.js serviceCallback api : " + api);
//    console.log("adManager.js serviceCallback response : " , response);
    if (api == apiDomain + apiList[0]) { // requestContextIndex

      // 광고 안들어오는 이슈와 서버쪽에서는 받았다는 의견 때문에 로깅처리함
      pmLog.write(pmLog.LOGKEY.AD_LOG, {
        elapseTime : new Date() - elapseTime,
        api : api,
        returnValue : response.returnValue,
        response : JSON.stringify(response)
      });

      if (response.returnValue && !globalMainError) {
        device.adFeatured = true;
        device.adProvider = true;
        device.adDetailApp = true;

         param = {
           contextIndex: response.contextIndex,
           appId: 'com.webos.app.discovery',
           width: 1280,
           height: 720,
           extendParam: ''
        };

        if (scope == 'featured') {
          util.async(function() {
            param.slotName = slotNames[scope];
            param.width = 970;
            param.height = 250;
            that.call(apiList[1], param, scope, callbackFn);
          });
        } else if(scope == 'detailApp'){
          util.async(function() {
            param.slotName = slotNames[scope];
            param.downloadAppId = that.detailAppAppId;
            that.call(apiList[5], param, scope, callbackFn, that.detailAppAppId);
          });
        }else if (slotNames[scope]) {
          util.async(function() {
            param.slotName = slotNames[scope];
            that.call(apiList[2], param, scope, callbackFn);
          });
        }
      } else {
        device.adFeatured = false;
        device.adProvider = false;
        device.adDetailApp = false;
        $rootScope.spinner.hideSpinner();
      }
    } else if (api == apiDomain + apiList[1]) { // requestBannerInfo(메인광고 배너 정보 호출(이미지 배너))
      // response.returnValue = false; //for test
      that.callbackBannerInfo(response);
    } else if (api == apiDomain + apiList[2]) {
      that.callbackBannerInfo(response);
    }else if (api == apiDomain + apiList[5]) {
      that.callbackBannerInfo(response);
    }
  };

  this.adBannerClick = function(params){
    var luna = {
      type : this.type,
      api : 'luna://com.webos.service.admanager/requestAssetClickInfo',
      //subscribe : false,
      param : {"contextIndex":params.contextIndex,"appId":"com.webos.app.discovery","assetId":params.assetId},
      serviceCallback : function(response) {

        // 광고 안들어오는 이슈와 서버쪽에서는 받았다는 의견 때문에 로깅처리함
        pmLog.write(pmLog.LOGKEY.AD_LOG, {
          api : 'luna://com.webos.service.admanager/requestAssetClickInfo',
          params : JSON.stringify(params),
          response : JSON.stringify(response)
        });

        if( response ) {
          if(response.returnValue) {
            console.log('banner data load success.');
          }else{
            console.log('banner data load fail.');
          }
        }
      }
    };
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };

  this.sendImpressionTracker = function(params){
    var luna = {
      type : this.type,
      api : 'luna://com.webos.service.admanager/sendImpressionTracker',
      //subscribe : false,
      param : {"contextIndex":params.contextIndex,"appId":"com.webos.app.discovery","assetId":params.assetId,"trackingEvent": params.trackEvent},
      serviceCallback : function(response) {

        // 광고 안들어오는 이슈와 서버쪽에서는 받았다는 의견 때문에 로깅처리함
        pmLog.write(pmLog.LOGKEY.AD_LOG, {
          api : 'luna://com.webos.service.admanager/sendImpressionTracker',
          params : JSON.stringify(params),
          response : JSON.stringify(response)
        });

        if( response ) {
          if(response.returnValue) {
            console.log(params.from + ' : sendImpressionTracker success.');
          }else{
            console.log(params.from + ' : sendImpressionTracker fail.');
          }
        }
      }
    };
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };

  /*
   * requestBannerInfo callback
   */
  this.callbackBannerInfo = function(response) {
    var adContextIndex = response.contextIndex;
    var callbackFn = response.callbackFn ? response.callbackFn : this.callBackParam.callbackFn;
    var apiLog = 'luna://com.webos.service.admanager/requestBannerInfo';
    this.curModule = response.scope ? response.scope : this.callBackParam.scope;
    if(this.curModule === 'detailApp'){
      apiLog = 'luna://com.webos.service.admanager/requestPreRollInfo';
    }
    // 광고 안들어오는 이슈와 서버쪽에서는 받았다는 의견 때문에 로깅처리함
    pmLog.write(pmLog.LOGKEY.AD_LOG, {
      elapseTime : new Date() - elapseTime,
      api : apiLog,
      contextIndex : adContextIndex,
      curModule : this.curModule,
      returnValue : response.returnValue,
      response : JSON.stringify(response)
    });

    if (response.returnValue) {
      var tmpArr = [];
      //2017년향 광고 response.assets 는 Array
      for (var i = 0; i < response.assets.length; i++) {
        var assets = response.assets;
        var assetId = assets[i]['id'];
        var contentData = assets[i]['contentData'];
        var type = assets[i]['type']; // image/video
        var autoPlay = assets[i]['autoPlay'] ? true : false;

        /*
         * featured page 최초 진입시 controller의 admanager.call()을 하면
         * $broadcast 할수 없으므로 adManager.adResponse에 scope name 으로 AD data 저장
         */
        if (!contentData.match("http://")) {
          contentData = "file://" + contentData;
        }
        tmpArr.push({
          "srcUrl": contentData,
          "adContextIndex": adContextIndex,
          "assetId": assetId,
          "type": type,
          "autoPlay": autoPlay
        });
      }
      this.adResponse[this.curModule] = tmpArr;
//      if(this.callBackParam.callbackFn) this.adResponse[this.callBackParam.scope].callbackFn = this.callBackParam.callbackFn;
      if (this.curModule === 'featured') {
        var endTime = new Date().getTime();
        console.info('%c [PERFORMANCE]  : Featured AD API Response TIME : ' + (endTime - device.startTime) + '   ', 'background-color:green;color:white');
        console.log('adurl' + contentData);

        $rootScope.mainAd.imageAD = false;
        $rootScope.mainAd.videoAD = false;
        for (var i = 0; i < this.adResponse[this.curModule].length; i++) {
          if (this.adResponse[this.curModule][i].type === 'image') {
            $rootScope.mainAd.imageAD = true;
          } else if (this.adResponse[this.curModule][i].type === 'video') {
            $rootScope.mainAd.videoAD = true;
            if(this.adResponse[this.curModule][i].autoPlay){
              $rootScope.mainAd.autoPlay = true;
            }else{
              $rootScope.mainAd.autoPlay = false;
            }
          }

          // 광고 안들어오는 이슈와 서버쪽에서는 받았다는 의견 때문에 로깅처리함
          pmLog.write(pmLog.LOGKEY.AD_LOG_MAIN, {
            adResponse: JSON.stringify(this.adResponse[this.curModule][i])
          });
        }
        $rootScope.$broadcast(eventKey.AD_LOADED, this.adResponse[this.curModule], callbackFn);
      } else if (this.curModule === 'tvshows' || this.curModule === 'movies' || this.curModule === 'appsngames') {
        $rootScope.$broadcast(eventKey.DEPTH2_AD_LOADED);
      } else if (this.curModule === 'detailApp') {
        $rootScope.$broadcast(eventKey.DEPTH3_AD_LOADED);
      }else {
        $rootScope.spinner.hideSpinner();
      }
    } else {
      //광고 컨텐츠가 없을 경우 Default Image 출력 (2015년도 기준으로 작성하려면 수정필요)
      // 2015.09.01 변경사항
      // 광고영역 삭제(미표시) :  1) 광고 서버가 Off 되어 있거나, 2) 광고가 등록되어 있지 않는 경우 3) 오류로 인해 광고가 보여지지 않는 경우
      // 기타 정상적인 케이스인데 오류(ex, returnValue가 정상인데, src에 url이 없는 경우?)는 페이지내에서 defaultImage처리(featured Main)
      if(this.curModule === 'featured') {
        this.adResponse[this.curModule] = {
          "srcUrl":"./resources/images/thumb/default_ad_1130x290.png"
        };
        $rootScope.$broadcast(eventKey.AD_LOADED, this.adResponse[this.curModule]);
      }else{
        $rootScope.spinner.hideSpinner();
      }
    }
  };

  this.preRollplay = function(callback) {
    var luna = {
      type : 'adManager',
      api : 'luna://com.webos.service.admanager/requestContextIndex',
      debugApi : './resources/assets/requestContextIndex.json',
      //subscribe : false,
      param : {},
      timeout : 20000,
      serviceCallback : function(response) {
        // 광고 안들어오는 이슈와 서버쪽에서는 받았다는 의견 때문에 로깅처리함
        pmLog.write(pmLog.LOGKEY.AD_LOG, {
          api : 'luna://com.webos.service.admanager/requestContextIndex : from preRoll',
          response : JSON.stringify(response)
        });

        if( response && response.returnValue) {
          var contextIndex = response.contextIndex;
          requestPreroll(contextIndex, callback);
        } else {//contextIndex를 못 받아올 경우는 바로 callback(player) 실행
          if(callback) {
            callback();
          }
        }
      }
    };
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };

  var requestPreroll = function(contextIndex, callback) {
    var luna = {
      type : 'adManager',
      api : 'luna://com.webos.service.admanager/requestPreRollInfo',
      debugApi : './resources/assets/requestContextIndex.json',
      subscribe : false,
      param : {
        contextIndex: contextIndex,
        slotName:"Portal/MoviePreroll@Main",
        appId: 'com.webos.app.discovery',
        width: 1280,
        height: 720
      },
      timeout : 20000,
      serviceCallback : function(response) {

        // 광고 안들어오는 이슈와 서버쪽에서는 받았다는 의견 때문에 로깅처리함
        pmLog.write(pmLog.LOGKEY.AD_LOG, {
          api : 'luna://com.webos.service.admanager/requestPreRollInfo',
          response : JSON.stringify(response)
        });

        if( response && response.returnValue) {
          if(callback) {
            if (response['assets'][0]['contentData'].match("/mnt/")) {
              response['assets'][0]['contentData'] = "file://" + response['assets'][0]['contentData'];
            }
            callback(response);
          }
        } else {//contextIndex를 못 받아올 경우는 바로 callback(player) 실행
          if(callback) {
            callback();
          }
        }
      }
    };
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };
});