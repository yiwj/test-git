discoveryService.service('adManager', function($rootScope, $http, LunaService2, device, util, eventKey, pmLog) {
  var that = this;
  var apiDomain = 'luna://com.webos.service.admanager/';
  var debugApiDomain = './resources/assets/';
  var apiList = [
    'requestContextIndex',
    'requestBannerInfo',
    'requestRollAndBannerInfo',
    'requestAssetClickInfo',
    'sendImpressionTracker'
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

  var lunaService = new LunaService2(that);

  this.call = function(api, param, scope, callbackFn) {
//    console.log("adManager.js call() : ", api, param, scope, callbackFn);
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

//    console.log("this.callBackParam : ", this.callBackParam);
    lunaService.call();
  };

  this.serviceCallback = function(response) {
    var api, scope, param, slotNames;

    slotNames = {
      featured: 'Portal/Discovery@Main',
      tvshows: 'Portal/CatchUp@Main',
      movies: 'Portal/Movie@Main',
      premium: 'Portal/GameApp@Main',
      appsngames: 'Portal/GameApp@Main'
    };

    api = response.api ? response.api : this.callBackParam.api;
    scope = response.scope ? response.scope : this.callBackParam.scope;
    callbackFn = response.callbackFn ? response.callbackFn : this.callBackParam.callbackFn;

//    console.log("adManager.js serviceCallback api : " + api);
//    console.log("adManager.js serviceCallback response : " , response);
    if (api == apiDomain + apiList[0]) { // requestContextIndex

      // 광고 안들어오는 이슈와 서버쪽에서는 받았다는 의견 때문에 로깅처리함
      pmLog.write(pmLog.LOGKEY.AD_LOG, {
        api : api,
        returnValue : response.returnValue,
        response : JSON.stringify(response)
      });

      if (response.returnValue && !globalMainError) {
        device.adFeatured = true;
        device.adProvider = true;
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
            param.width = 300;
            param.height = 250;
            that.call(apiList[1], param, scope, callbackFn);
          });
        } else if (slotNames[scope]) {
          util.async(function() {
            param.slotName = slotNames[scope];
            that.call(apiList[2], param, scope, callbackFn);
          });
        }
      } else {
        device.adFeatured = false;
        device.adProvider = false;
        $rootScope.spinner.hideSpinner();
      }
    } else if (api == apiDomain + apiList[1]) { // requestBannerInfo(메인광고 배너 정보 호출(이미지 배너))
      // response.returnValue = false; //for test
      that.callbackBannerInfo(response);
    } else if (api == apiDomain + apiList[2]) {
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
    this.curModule = response.scope ? response.scope : this.callBackParam.scope;

    // 광고 안들어오는 이슈와 서버쪽에서는 받았다는 의견 때문에 로깅처리함
    pmLog.write(pmLog.LOGKEY.AD_LOG, {
      api : 'luna://com.webos.service.admanager/requestBannerInfo',
      contextIndex : adContextIndex,
      curModule : this.curModule,
      returnValue : response.returnValue,
      response : JSON.stringify(response)
    });

    if (response.returnValue) {
      var assets = response.assets;
      var assetId = assets[0]['id'];
      var contentData = assets[0]['contentData'];
      var type = assets[0]['type']; // image/video
      var callbackFn = response.callbackFn ? response.callbackFn : this.callBackParam.callbackFn; 

      //메인 이미지 광고 로드시 creativeView event 광고서버 전달
      //if (this.curModule === 'featured' && type === 'image') {
        // 16.08.19 권오림 주임 메일
        // 에러 문의를 했으나, '배너의 이미지광고일 때 creativeView 트래킹 이벤트는 서비스에서 보내주고,
        // 앱에서는 보내지 않는다'라고하여 이미지광고에 대한 creativeView 트래킹 이벤트 삭제
          /*that.sendImpressionTracker({
            contextIndex : adContextIndex,
            assetId : assetId,
            // expand는 광고동영상 전체화면 전환시에만 전송
            //trackEvent : (type === 'image' ? 'creativeView' : 'expand'),
            trackEvent: 'creativeView',
            from : 'main'
          });*/
      //}
      /*
       * featured page 최초 진입시 controller의 admanager.call()을 하면
       * $broadcast 할수 없으므로 adManager.adResponse에 scope name 으로 AD data 저장
       */
      if (contentData.match("http://")) {
        this.adResponse[this.curModule] = {
          "srcUrl":contentData,
          "adContextIndex":adContextIndex,
          "assetId":assetId,
          "type":type
        };
      } else { //mnt에 저장된 로컬 파일
        this.adResponse[this.curModule] = {
          "srcUrl":"file://"+contentData,
          "adContextIndex":adContextIndex,
          "assetId":assetId,
          "type":type
        };
      }
//      if(this.callBackParam.callbackFn) this.adResponse[this.callBackParam.scope].callbackFn = this.callBackParam.callbackFn;
      if(this.curModule == 'featured') {
        var endTime = new Date().getTime();
        console.info('%c [PERFORMANCE]  : Featured AD API Response TIME : ' + (endTime - device.startTime) + '   ', 'background-color:green;color:white');
        console.log('adurl' + contentData);

        // 광고 안들어오는 이슈와 서버쪽에서는 받았다는 의견 때문에 로깅처리함
        pmLog.write(pmLog.LOGKEY.AD_LOG_MAIN, {
          adResponse : JSON.stringify(this.adResponse[this.curModule])
        });

        $rootScope.$broadcast(eventKey.AD_LOADED, this.adResponse[this.curModule], callbackFn);
      }else if(this.curModule == 'tvshows' || this.curModule == 'movies'  || this.curModule == 'appsngames') {
        $rootScope.$broadcast(eventKey.DEPTH2_AD_LOADED);
      }else{
        $rootScope.spinner.hideSpinner();
      }
    } else {
      //광고 컨텐츠가 없을 경우 Default Image 출력 (2015년도 기준으로 작성하려면 수정필요)
      // 2015.09.01 변경사항
      // 광고영역 삭제(미표시) :  1) 광고 서버가 Off 되어 있거나, 2) 광고가 등록되어 있지 않는 경우 3) 오류로 인해 광고가 보여지지 않는 경우
      // 기타 정상적인 케이스인데 오류(ex, returnValue가 정상인데, src에 url이 없는 경우?)는 페이지내에서 defaultImage처리(featured Main)
      if(this.curModule == 'featured') {
        this.adResponse[this.curModule] = {
          "srcUrl":"./resources/images/thumb/default_ad_300X250.png"
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