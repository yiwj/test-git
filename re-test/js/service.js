var discoveryService = angular.module('discoveryService', []);

discoveryService.service('deviceService', function($rootScope, httpHeader, powerState, connectionInfo, connectionStatus) {
  this.requestInitialServices = function() {
    httpHeader.call();
    //powerState.call();
    //connectionInfo.call();
    //spaceInfo.call();
    //adManager.call();
    //resolutionRatio.call();
    //userID.call();
    //membership.getAdultStatus();
  };

  this.checkConnection = function() {
    connectionStatus.call();
  };

  var errorCallback = function(event, type) {
    console.log(type + ' service error');
  };

  $rootScope.$on('serviceError', errorCallback);
});

discoveryService.service('appService', function($rootScope, appInstallStatus, packageAppInstallStatus, stubAppInstallList, getAppInfo, appLaunch, server, app, appInstall, toast, device, eventKey) {
  var appId, itemId, launchContentId, appLaunchParams;

  this.requestInitialAppServices = function() {
    appInstallStatus.call();
    packageAppInstallStatus.call();
    stubAppInstallList.call();
  };

  /** 앱체크후 실행
   *  @usage : checkParams = {"appId":"pooq","premiumFlag":true,"launchContentId":"M_1003099100000100000"};
   *           appService.appCheckLaunch(checkParams);
   */
  this.appCheckLaunch = function(checkParams, onCloseCallback) {
    var requestParam;
    console.debug('appCheckLaunch checkParams', checkParams);
    if( !checkParams || !checkParams.appId ) {
      /* TODO : 에러 팝업 완료후 수정해야 함.
       loggingApi.log({errorCode:'LIB.002', checkParams:checkParams, logLevel:GLOBAL_CONSTANT.LOG_LEVEL.ERROR}); */
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE : LIB.002'
      };
      $rootScope.popupApp.showPopup($rootScope, requestParam, onCloseCallback);
      return ;
    }
    requestParam = {
      id: checkParams.appId,
      callBackParam: checkParams,
      callbackEvent: 'installAndUpdateCheckFromOthers'
    };
    getAppInfo.call(requestParam);
    $rootScope.spinner.hideSpinner();

    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  /**
   * 호출처 : detailList.js, PopupService.js에서 호출 (service.js내에서 호출하는 부분 주석)
   * @param itemId
   * @param z_exec_info
   */
  this.writeServerLog = function (itemId, z_exec_info) {
    try {
      // 시청정보 약관 동의 시만 데이터 쌓음
      if (device.additionalDataAllowed) {
          if (!device.isLocalJSON) {

            if (itemId &&
              (itemId.indexOf('TS|') === 0 || itemId.indexOf('MV|') === 0)) {
              itemId = itemId.substring('TS|'.length);
            }
            //var appId = device.currentPage === 'featured' ? 'com.webos.app.discovery.featured' : 'com.webos.app.discovery';

            // server data 용
            var params = {
              api: '/discovery2016/stat/CONTS',
              method: 'post',
              apiAppStoreVersion: 'v8.0',
              payload: {
                item_id: itemId, // 실행한 컨텐츠의 item_id (예, com.lge.meta.crawler.cine21.Cine21Crawler|41064)
                z_exec_type: 'EXEC_CONTS', // 실행 타입, 컨텐츠 실행의 경우 ‘EXEC_CONTS’
                z_exec_info: z_exec_info, // 실행한 CP의 app id (exec_list 응답 값 내 exec_app_id 필드 값)
                app_id: 'com.webos.app.discovery', // 해당 API를 요청한 클라이언트의 고유 ID,
                // 2016.01.15 이원우 책임 요청사항 (appid는 com.webos.app.discovery로 통일)
                z_prev_svc: device.onnowLogging
              }
            };
            server.requestApi(eventKey.ON_WRITE_SERVER_LOG_RECEIVED, params);
          }
      }
    } catch (e) {
    }
    params = null;
  };

  var onWriteServerLogReceived = function(e, response) {
    // console.log('onWriteServerLogReceived, response=' + JSON.stringify(response));
  };

  var appLaunchCall = function(itemId, appId, appLaunchParams) {
    var requestParam;
    if( !appId ) {
      //TODO :
      /*loggingApi.log({errorCode:'LIB.003', appId:appId, appLaunchParams:appLaunchParams, logLevel:GLOBAL_CONSTANT.LOG_LEVEL.ERROR});*/
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE : LIB.003'
      };
      $rootScope.popupApp.showPopup($rootScope, requestParam);
      return ;
    }

    /*	현재 페이지 저장	*/
    //TODO :
    // db8Module.lastPage.currentPageSave();

    //writeServerLog(itemId, appId);

    requestParam = {appId: appId, appLaunchParams: appLaunchParams};
    appLaunch.call(requestParam);
  };

  /**
   * myApps에서 업데이트 요청
   * 설치 진행 중인 앱은 패스한다.
   * 용량 체크는 하지 않는다.
   * @usage appService.myAppsUpdate('앱 아이디');
   */
  this.myAppsUpdate = function(appId) {
    var currentAppStatus, requestParam;
    if (!appId || appId.length == 0) {
      console.error('앱 아이디가 없습니다. appId[' + appId + ']');
      return false;
    }
    /* 현재 설치/제거 중인지 체크 */
    currentAppStatus = app.appStatusList[appId];
    if (currentAppStatus) {
      return false;
    }
    requestParam = {id: appId, callbackEvent: 'installAndUpdateFromMyApp'};
    getAppInfo.call(requestParam);
    return true;
  };

  var errorCallback = function(event, type) {
    console.log(type + ' service error');
  };

  var installAndUpdateCheckFromOthers = function(e, response) {
    var checkResult, reqCheckParams;
    try {
      checkResult = response;
      reqCheckParams = checkResult.callBackParam;
      appId = reqCheckParams.appId;
      $rootScope.lastTryAppId = appId;
      $rootScope.lastTryContentId = reqCheckParams.launchContentId;
      if( checkResult && checkResult.returnValue === true && checkResult.appInfo ) {
        /*	설치(업데이트 체크)	*/
        itemId = reqCheckParams.item_id;
        launchContentId = reqCheckParams.launchContentId;
        appLaunchParams = undefined;
        if( reqCheckParams.launchContentId && checkResult.appInfo.deeplinkingParams ) {
          appLaunchParams = JSON.parse(checkResult.appInfo.deeplinkingParams.split("$CONTENTID").join(launchContentId));
        }
        //2017년향 Binary ID 추가(앱 업데이트 확인할때 필요 없으면 0값)
        //권오룡 주임님과 합의함.(값이 없으면 0으로 설정)
        if(!checkResult.appInfo.binId){
          checkResult.appInfo.binId = 0;
        }
        requestCheckUpdate(appId, checkResult.appInfo.binId ,checkResult.appInfo.version, 'others');
      } else {
        /*	미설치(상세 이동)	*/
        $rootScope.draw({page: 'detailApp', module: appId, inLink: true});
      }
    } catch(e) {
      //TODO :
      // Util.dumpError({errorCode:'LIB.001', errObj:e, responseObj:responseObj});
    }
  };

  var requestCheckUpdate = function(appId, binId, currInstalledVersion, flag) {
    var payload, scope;
    if (flag) scope = flag;
    payload = {
      app_info: appId + ',' + binId + ','+ currInstalledVersion + ';'
    };

    try {
      if (!device.isLocalJSON) {
        var method = device.isOpenApi ? 'post' : 'get';
        // server data 용
        var params = {
          api : '/discovery/item/GAMESAPPS/Update',
          apiAppStoreVersion : 'v8.0',
          method: method,
          payload : payload,
          scope : flag
        };
        server.requestApi(eventKey.CHECK_UPDATE_APPGAME, params);
      } else {
        // local json 용
        server.requestAppCheckUpdate(payload, scope);
      }
    } catch (e) {}
  };

  var othersAppCheckUpdate = function(e, response) {
    var appUpdateInfo;

    if (response.scopeName != 'others') return;
    if( response.error ) {
      /*	앱 업데이트 정보 조회 실패	*/
      if( response.responseStatus === 406 && response.error.code.match(/^[A]{1}.[0-9]{3}.[0-9]{2}$/) != null ) {
        if( response.error.code == 'A.009.05' ) {
          $rootScope.draw({page: 'detailApp', module: appId, inLink: true});
        } else {
          appLaunchCall(itemId, appId, appLaunchParams); // 앱실행
        }
      } else {
        appLaunchCall(itemId, appId, appLaunchParams); // 앱실행
      }
    } else {
      appUpdateInfo = response.appUpdateList;

      if( appUpdateInfo.appCount == 0 ) {
        /*	업데이트 할거 없음(실행)	*/
        appLaunchCall(itemId, appId, appLaunchParams); // 앱실행
      } else {
        if( appUpdateInfo.appUpdateCheck && appUpdateInfo.appUpdateCheck.length > 0 ) {
          /*	상세 페이지로 이동	*/
          if( appUpdateInfo.appUpdateCheck[0].errorCode ) {
            /*	오류(실행으로 처리)	*/
            appLaunchCall(itemId, appId, appLaunchParams); // 앱실행
          } else {
            $rootScope.draw({page: 'detailApp', module: appId, inLink: true});
          }
        } else {
          /*	실제 업데이트 할 앱 정보가 없음.	*/
          appLaunchCall(itemId, appId, appLaunchParams); // 앱실행
        }
      }
    }
  };

  var installAndUpdateFromMyApp = function(e, response) {
    var requestParam, folderPath, usbInfo, deviceId, driveId, installedTarget;
    if (response.returnValue === true && response.appInfo) {
      /*	설치된 경로 셋팅	*/
      folderPath = response.appInfo.folderPath;
      for (var i = 0; i < app.usbListData.length; i++) {
        usbInfo = app.usbListData[i];
        if (folderPath.indexOf(usbInfo.deviceUri) == 0) {
          deviceId = usbInfo.deviceId;
          driveId = usbInfo.subDevices[0].deviceId;
          break;
        }
      }
      installedTarget = {};
      if (deviceId === undefined) {
        installedTarget.deviceId = 'INTERNAL_STORAGE';
      } else {
        installedTarget.deviceId = deviceId;
        installedTarget.driveId = driveId;
      }
      console.log('installedTarget', installedTarget);
      requestParam = {'id': response.appId, 'subscribe': false, 'silence': false, 'target': installedTarget, 'callbackEvent': 'appInstallResultFromMyApp'};
      appInstall.call(requestParam);
    } else {
      console.error('myAppsUpdate 설치되지 않은 앱 요청[' + appId + ']');
      /*loggingApi.log({errorCode:self.genErrorCode('invaildRequest'), errorType:'myAppsUpdateError', errorMsg:'설치되지 않은 앱 요청', requestData:'appId['+appId+']', pageParams:self.pageParams, logLevel : GLOBAL_CONSTANT.LOG_LEVEL.ERROR});*/
      toast.call({msg:msgLang.apps_toast_8});
    }
  };

  var appInstallStatusUpdate = function(e, response) {
    var requestParam;

    if (response.returnValue == true) {
      /*	업데이트 요청 성공	*/
      return true;
    } else {
      /*	업데이트 요청 실패	*/
      if (response.errorCode === -10) {
        /*다른 tv에서 사용했던 usb로 설치 못한다.	*/

        // 2016-04-07 : tunerless 대응
//      var tmpStr = msgLang.apps_install_17_1 + ' ' + msgLang.apps_install_17_2;
        var tmpStr = msgLang.apps_install_17_4 + ' ' + msgLang.apps_install_17_5;
        if (device.q['X-Device-Platform'].toUpperCase() === 'W16T') {
          if (device.q['X-Device-Language'].toUpperCase() === 'EN-GB') {
            tmpStr = tmpStr.replace(/TV/gi, 'monitor');
          } else if (device.q['X-Device-Language'].toUpperCase() === 'TR-TR') {
            tmpStr = 'Başka monitörden yüklenen uygulamalar var. USB aygıtını biçimlendirin ve farklı bir monitörde yüklü olan uygulamaları silin.';
          }
        }

        requestParam = {
          type: 'popup',
          popupTitle: msgLang.apps_install_17_3,
          popupBut1: msgLang.ok,
          popupButAct1 : 'closeAppPopup',
          popupDesc: tmpStr
        };
        $rootScope.popupApp.showPopup($rootScope, requestParam);
        tmpStr = null;
      } else {
        /*실패 팝업	*/
        toast.call({msg:msgLang.apps_install_14_3+'<br />'+msgLang.apps_install_14_4});
      }
    }
  };

  $rootScope.$on('serviceError', errorCallback);
  $rootScope.$on('installAndUpdateCheckFromOthers', installAndUpdateCheckFromOthers);
  $rootScope.$on(eventKey.CHECK_UPDATE_APPGAME, othersAppCheckUpdate); // API Callback Event : APP Update Check
  $rootScope.$on('installAndUpdateFromMyApp', installAndUpdateFromMyApp);
  $rootScope.$on('appInstallResultFromMyApp', appInstallStatusUpdate); //  Luna Callback Event : APP Install Result
  $rootScope.$on(eventKey.ON_WRITE_SERVER_LOG_RECEIVED, onWriteServerLogReceived);
});

discoveryService.factory('LunaService', function($rootScope, $http, util) {
  return function(that) {
    var timeout = that.timeout ? that.timeout : 5000;
    var timeouted = false;
    var timeoutTimer = null;
    var working = false;
    var responseParam;

    this.call = function() {
      /*if (working == true) {
        return;
      }*/
      var serviceCallback = function(response) {
//        if (timeouted) {
//          return;
//        }

        var res;

        //console.log(response);

//        clearTimeout(timeoutTimer);
//        timeoutTimer = null;

        if (that.subscribe == false) {
          working = false;
        }

        if (typeof response == 'object') {
          res = response;
        } else {
          try {
            if (response) {
              res = JSON.parse(response);
            } else {
              res = {returnValue: false};
            }
          } catch (e) {
            res = {returnValue: false};
          }
        }
        util.copyObject(res, responseParam);

        that.serviceCallback(res);
      };

      var errorCallback = function(response, errorCode) {

//        clearTimeout(timeoutTimer);
//        timeoutTimer = null;

        $rootScope.$broadcast('serviceError', that.type, responseParam);
      };

//      var timeoutCallback = function() {
//        timeouted = true;
//        timeoutTimer = null;
//
//        $rootScope.$broadcast('serviceError', that.type, responseParam);
//      };

      that.param.subscribe = that.subscribe;
      working = true;
      responseParam = that.responseParam;

      if (window.PalmServiceBridge) {
        var bridge = new PalmServiceBridge();
        bridge.onservicecallback = serviceCallback;
        bridge.call(that.api, JSON.stringify(that.param));
      } else {
        var promise = $http.get(that.debugApi);
        promise.success(serviceCallback);
        promise.error(errorCallback);
      }
//      if (!that.subscribe) {
//        timeoutTimer = setTimeout(timeoutCallback, timeout);
//      }
    };

  };
});

discoveryService.factory('LunaService2', function($rootScope, $http, util, device) {
  return function(that) {

    this.call = function() {
      that.param.subscribe = that.subscribe;
      var lunaParamHttpHeader = {
          reqService : that.api
          , params : that.param
          , responseHandler : function (obj){
            console.log(obj.response.data);
            if(obj.response&&obj.response.data){
              if(obj.callBackParam) util.copyObject(obj.response.data, obj.callBackParam);
              that.serviceCallback(obj.response.data);
            }
          }
          , callBackParam : that.callBackParam
        };
      if (that.timeout) {
        lunaParamHttpHeader.timeOutMilSec = that.timeout;
      }
      storeLib.lunaServiceProcess(lunaParamHttpHeader);
    };
    var isLunaFailDone = false;
    var storeLib = {
        bridges : {index:0}
        /*  서비스 아이디 배열  */
        , serviceIdArray : []
        /**
         * @usage storeLib.clearService(serviceId)
         */
        , clearService: function (serviceId) {
          console.log(serviceId+' is not subscribe. clearService!');
          if(this.bridges[serviceId].cancel !== undefined) {
            this.bridges[serviceId].cancel();
          }
          var indexNum = this.serviceIdArray.indexOf(serviceId);
          this.serviceIdArray.splice(indexNum ,1);
          //this.serviceIdArray.remove(serviceId);
          delete this.bridges[serviceId];
        }
        /**
         * 현재 실행중인 루나 명령어
         * @usage storeLib.currentLunaService()
         */
        , currentLunaService : function() {
          $(this.serviceIdArray).each(function(idx, value) {
            var lunaObj = storeLib.bridges[value];
            console.log(idx + ' : id['+lunaObj.id+'] reqService['+lunaObj['X-service']+'] key['+lunaObj['X-params']['key']+'] subscribe['+lunaObj['X-params']['subscribe']+']');
          });
        }
        /**
         * @param lunaParam
         *  param reqService    서비스 이름(필수)
         *  param params      파라미터(옵션)
         *  param timeOutMilSec   타임아웃 설정(milSec)(옵션)
         *  param responseHandler 응답 callback(옵션)
         *  param callBackParam   응답시에 받을 파라미터(옵션)
         *
         * @usage storeLib.lunaServiceProcess(lunaParam)
         *
         * @return
         *  responseObj
         *    sender
         *    response
         *    bridges
         *    callBackParam
         */
        , lunaServiceProcess : function(lunaParam) {
          try {
            var id = undefined;
            var localJSON = function(response) {
              var response = {
                data: response
              };
              if (lunaParam.responseHandler !== undefined) lunaParam.responseHandler({
                sender: this, response: response, bridges: undefined, callBackParam: undefined
              });
            };
            if( device.isTv) {
              if( lunaParam.params === undefined ) {
                lunaParam.params = {};
              }

              var reqService = lunaParam.reqService;
              id = reqService.substring(reqService.lastIndexOf('/')+1, reqService.length) + '-' + this.bridges["index"]++;

              /**
               * 기본 5초로 타임아웃 설정
               */
              var timeOutMilSec = 5000;
              if( lunaParam.timeOutMilSec ) {
                timeOutMilSec = lunaParam.timeOutMilSec;
              }

              var newPalmBridges = new PalmServiceBridge();
              newPalmBridges.onservicecallback = function(responseObject) {
                var callBackPalmBridges = this;

                var xTimeOutID = callBackPalmBridges['X-timeOutID'];
                if( xTimeOutID ) {
                  console.log('luna clearTimeout', xTimeOutID);
                  window.clearTimeout(xTimeOutID);
                  callBackPalmBridges['X-timeOutID'] = undefined;
                }

                var xStartTimeStamp = callBackPalmBridges['X-startTimeStamp'];
                if( xStartTimeStamp ) {
                  var processTimeSec = (new Date().getTime()) - xStartTimeStamp;
                  console.debug('luna['+callBackPalmBridges['X-service']+']['+JSON.stringify(callBackPalmBridges['X-params'])+']['+processTimeSec+' milSec]');
                  /*  한번만 출력하기 위해서 삭제한다.. */
                  callBackPalmBridges['X-startTimeStamp'] = undefined;
                }

                var response = {};
                try {
                  if( responseObject ) {
                    response.data = JSON.parse(responseObject);
                  } else {
                    response.data = {returnValue:false, error:"responseData is null", responseObject:responseObject};
                  }
                } catch(e) {
                  console.error(e);
                  response.data = {returnValue:false, error:"responseData parse error", responseObject:responseObject, errorObj:e};
                }
                if( callBackPalmBridges.responseHandler !== undefined ) {
                  callBackPalmBridges.responseHandler({
                    sender : storeLib
                    , response : response
                    , bridges : callBackPalmBridges
                    , callBackParam : callBackPalmBridges['X-callBackParam']
                  });
                } else {
                  console.info('luna callback responseHandler is null');
                }

                /**
                 * subscribe가 아닌 PalmServiceBridge인 경우 클리어 함
                 */
                if(callBackPalmBridges.subscribe!==true) storeLib.clearService(callBackPalmBridges.id);


                /**
                 * 오류시 로깅한다.
                 */
                if( response.data.returnValue !== true ) {
                  var loggingFlag = true;
                  var checkService = callBackPalmBridges['X-service'];
                  if( response.data.returnValue === undefined
                    && ( 'luna://com.webos.appInstallService/status' == checkService
                      || 'luna://com.webos.appInstallService/group/status' == checkService
                      || 'luna://com.webos.service.sdx/getHttpHeaderForServiceRequest' == checkService
                    )
                  ) {
                    /**
                     * appInstallService/status, appInstallService/group/status 는 자체적으로 판단.
                     * getHttpHeaderForServiceRequest도 마찬가지
                     * returnValue가 안넘어 오는 경우도 있음
                     */
                    loggingFlag = false;
                  } else if( 'luna://com.webos.appInstallService/queryInstallCapacity' == checkService
                    || 'luna://com.webos.service.admanager/sendImpressionTracker' == checkService
                    || 'luna://com.webos.applicationManager/getAppInfo' == checkService
                  ) {
                    /*  false 인 경우도 정상  */
                    loggingFlag = false;
                  } else if( !device.isLite && checkService.indexOf('luna://com.palm.tempdb') == 0 ) {
                    /*  lite 아니면서 tempDB 오류는 무시 */
                    loggingFlag = false;
                  }

                  if( loggingFlag === true ) {
                    console.error('LunaFail', response.data);
                   /* if ($rootScope.isADClick && (checkService.indexOf('requestContextIndex') > -1 || checkService.indexOf('requestAssetClickInfo') > -1 ) && !isLunaFailDone) {
                      $rootScope.isADClick = false;
                      var requestParam = {
                        type: 'popup',
                        popupTitle: msgLang.alert_adult_3_2,
                        popupBut1: msgLang.ok,
                        popupButAct1 : 'closeAppPopup',
                        popupDesc: msgLang.alert_adult_3_5
                      };
                      $rootScope.popupApp.showPopup($rootScope, requestParam);
                      $rootScope.$broadcast('webkitShowed');
                      isLunaFailDone = true;
                    }*/
                    // WOSLQEVENT-106441 : audioguidance side effect
                    if (checkService.indexOf('luna://com.webos.service.admanager') > -1) {
                      device.adStatusByLunaError = true;
                      $rootScope.$broadcast('lunaError');
                    }
                  }
                }
              };
              // 생성 된 PalmServiceBridge에 아래의 값을 저장시킨 뒤 luna service API를 호출한다.
              newPalmBridges.id = id;
              newPalmBridges.subscribe = lunaParam.params.subscribe;
              newPalmBridges['X-startTimeStamp'] = new Date().getTime();
              newPalmBridges['X-service'] = lunaParam.reqService;
              newPalmBridges['X-params'] = lunaParam.params;
              newPalmBridges['X-callBackParam'] = lunaParam.callBackParam;
              newPalmBridges.responseHandler = lunaParam.responseHandler;
              this.bridges[id] = newPalmBridges;

              /*  서비스 아이디 저장  */
              this.serviceIdArray.push(id);

              /**
               * 타임 아웃 설정
               */
              var timeOutID = undefined;
              if( !isNaN(timeOutMilSec) && timeOutMilSec > 0 ) {
                timeOutID = setTimeout(function(timeOutPalmBridges) {
                  var xStartTimeStamp = timeOutPalmBridges['X-startTimeStamp'];
                  var processTimeSec = (new Date().getTime()) - xStartTimeStamp;
                  timeOutPalmBridges.cancel();
                  console.error('luna TimeOut['+processTimeSec+' milSec] ['+timeOutPalmBridges['X-service']+']['+JSON.stringify(timeOutPalmBridges['X-params'])+']');
                  var response = {
                    data: { returnValue:false, errorMsg:'This Luna['+timeOutPalmBridges['X-service']+'] is TimeOut.', error:'TimeOut' }
                  };
                  if( timeOutPalmBridges.responseHandler !== undefined ) {
                    timeOutPalmBridges.responseHandler({
                      sender : storeLib
                      , response : response
                      , bridges : timeOutPalmBridges
                      , callBackParam : timeOutPalmBridges['X-callBackParam']
                    });
                  } else {
                    console.error('luna TimeOut responseHandler is null');
                    // WOSLQEVENT-106441 : audioguidance side effect
                    if (checkService.indexOf('luna://com.webos.service.admanager') > -1) {
                      device.adStatusByLunaError = true;
                      $rootScope.$broadcast('lunaError');
                    }
                  }

                }, timeOutMilSec, newPalmBridges);
                newPalmBridges['X-timeOutID'] = timeOutID;
              }
              newPalmBridges.call(lunaParam.reqService, JSON.stringify(lunaParam.params));

            } else {
              if (that.debugApi) {
                var promise = $http.get(that.debugApi);
                promise.success(localJSON);
                promise.error(localJSON);
              }
            }
            return id;
          } catch (e) {
            console.log('lunaservice2에러');
            console.log(e);
//            var errorCode = 'Luna2.200';
//            requestParam = {
//              type: 'error',
//              popupTitle: msgLang.alert_adult_3_2,
//              errorMsg: msgLang.alert_adult_3_5,
//              errorCodeMsg: 'ERROR CODE: '+errorCode
//            };
//            $rootScope.popupApp.showPopup($rootScope, requestParam);
          }
        }
      };
  };
});