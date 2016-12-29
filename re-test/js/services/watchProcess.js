discoveryService.service('watchProcess', function($rootScope, server, device, eventKey, appService, popupService, pmLog) {
  var key = '/users/adultAuthStatus';
  var appId = '';
  var logMenu = '', logCategory = '';

  this.execProcess = function (scopeId, module, itemId, fromMenu, fromCat, itemType) {
    // fromMenu, fromCat : pmLog용
    logMenu = fromMenu;
    logCategory = fromCat;

    try {
      $rootScope.spinner.showSpinner();

      /*// pmLog
      pmLog.write(pmLog.LOGKEY.CONTENTS_WATCH_CLICK, {
        menu_name : $rootScope.pmLogValue,
        contents_id : itemId,
        contents_category : $rootScope.pmLogValue
      });*/
      // 하종우 선임 요청사항 : featured Main or TV|MV list page에서 호출 시 'exec_full'
      if (!itemType) {
        itemType = 'exec';
      }
      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api : '/discovery2016/item-detail',
          method : 'post',
          apiAppStoreVersion : 'v8.0',
          payload : {
            item_type: 'CONTS',
            item_id : itemId,
            item_detail_type: itemType,         // 'advanced' : get all detail data, 'exec': get exec list
            app_id: 'com.webos.app.discovery',
            z_prev_svc : device.onnowLogging
          },
          gubun : module
        };
        server.requestApi(eventKey.TVMOVIE_EXEC, params, scopeId);
      } else {
        // local json 용
        server['request' + $scope.scopeName](payload, scopeId);
      }

    } catch (e) {
      errorCode = 'watchProcess.001';
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: ' + errorCode
      };

      $rootScope.spinner.hideSpinner();
      $rootScope.popupApp.showPopup($rootScope, requestParam);
    }
    params = null;
  };

  var onExecDataReceived = function(e, response) {
    // console.log('list.onExecDataReceived begin, response=' + JSON.stringify(response));
    e.preventDefault();

    var errorCode;
    if (!response || !response.item ||
      !response.item.item_detail ||
      !response.item.item_detail.exec_list ||
      !response.item.item_detail.exec_list.execs ||
      (response.item.item_detail.exec_list.execs.length < 1)) {
      errorCode = 'watchProcess.002';
    }

    if (errorCode) {
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: ' + errorCode
      };
      $rootScope.popupApp.showPopup($rootScope, requestParam);
      $rootScope.spinner.hideSpinner();
      return;
    }

    if (response.item.item_detail.exec_list.execs.length === 1) {
      // 하나의 CP가 있다면 App 실행
      var checkParams = {
        'item_id': response.item.item_id,
        'appId': response.item.item_detail.exec_list.execs[0].exec_app_id,
        'premiumFlag': response.item.item_detail.exec_list.execs[0].premium_app_flag,
        'launchContentId': response.item.item_detail.exec_list.execs[0].exec_id
      };

      // onnow logging 앱실행정보
      appService.writeServerLog(response.item.item_id, response.item.item_detail.exec_list.execs[0].exec_app_id);

      appService.appCheckLaunch(checkParams);
    } else {
      // 등록된 CP가 없거나, 2개 이상, popup 보여주기
      response.item.item_detail.exec_list.execs.logMenu = logMenu;
      response.item.item_detail.exec_list.execs.logCategory = logCategory;

      // 실행정보 로깅을 위한 item_id추가 (cp가 2개 일 경우 안넘어가 가서 추가)
      response.item.item_detail.exec_list.execs.contents_id = response.item.item_id;
      popupService.watchClick($rootScope, response.item.item_detail.exec_list.execs);
    }
    $rootScope.spinner.hideSpinner();
  };

  var closePopup = function() {
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
  };

  $rootScope.$on('closeAppPopup', closePopup);
  $rootScope.$on(eventKey.TVMOVIE_EXEC, onExecDataReceived);
});
