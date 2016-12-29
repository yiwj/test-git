discoveryService.service('stubAppInstallList', function($rootScope, LunaService2, app, eventKey) {
  var that = this;

  this.type = 'stubAppInstallList';
  this.api = 'luna://com.webos.applicationManager/listApps';
  this.debugApi = './resources/assets/getStubAppInstallList.json';
  this.subscribe = true;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  this.serviceCallback = function(res) {
    var requestParam, response = res;
    if (response.returnValue !== true) {
      /*	목록 조회 실패	*/
      console.error('StubList fail', response);
    } else if( response.returnValue === true ) {
      $rootScope.$broadcast('changeSpaceInfo');
      if (response.change) {
        try {
          console.debug('Stub listApps change', response);
          var isMypageCall = false;
          if ($rootScope.pageManager.getParam('page') == 'myPage' && $rootScope.spinner.hide == false) {
            /*	이동 중이면서 mypage로 가는 경우는 호출해준다.	*/
            console.debug('~~~~~앱 추가시 이동 중 이면서 mypage로 가는 중..');
            isMypageCall = true;
            if (response.change == 'added') {
              $rootScope.$broadcast(eventKey.MYPAGE_APP_INSTALL_SUCCESS, response.app.id);
            } else if (response.change == 'removed') {
              $rootScope.$broadcast(eventKey.MYPAGE_APP_DELETE_SUCCESS, response.app.id);
            } else if (response.change == 'updated') {
              $rootScope.$broadcast(eventKey.MYPAGE_APP_UPDATE_SUCCESS, response.app.id);
            } else {
              /* TODO : 	오류
              loggingApi.log({
                logType: 'luna', service: 'luna://com.webos.applicationManager/listApps', responseObj: responseObj
              }); */
            }
          }
          if ($rootScope.pageManager.getParam('page') == 'detailApp') {
            //var responseParam = {'launchContentId': response.app.id};
            //$rootScope.$broadcast(eventKey.REFRESH_SCREEN, responseParam);
            var params = '';
            //if (response.change) params = response.change; // 'added', 'removed', 'updated'
            if (response.change) params = response;
            $rootScope.$broadcast(eventKey.REFRESH_SCREEN, params);
          } else if ($rootScope.pageManager.getParam('page') == 'myPage') {
            if (isMypageCall === true) {
              /*	이미 위에서 mypage 호출했다.	*/
              console.debug('Already isMypageCall~~~~~~~~~~~~~~~~');
            } else {
              if (response.change == 'added') {
                $rootScope.$broadcast(eventKey.MYPAGE_APP_INSTALL_SUCCESS, response.app.id);
              } else if (response.change == 'removed') {
                $rootScope.$broadcast(eventKey.MYPAGE_APP_DELETE_SUCCESS, response.app.id);
              } else if (response.change == 'updated') {
                $rootScope.$broadcast(eventKey.MYPAGE_APP_UPDATE_SUCCESS, response.app.id);
              } else {
                /* TODO : 	오류
                 loggingApi.log({
                 logType: 'luna', service: 'luna://com.webos.applicationManager/listApps', responseObj: responseObj
                 }); */
              }
            }
          }
        } catch (e) {
          console.log('ERROR CODE : StubAppList.001');
//          requestParam = {
//            type: 'error',
//            popupTitle: msgLang.alert_adult_3_2,
//            errorMsg: msgLang.alert_adult_3_5,
//            errorCodeMsg: 'ERROR CODE : StubAppList.001'
//          };
//          $rootScope.popupApp.showPopup($rootScope, requestParam);
        }
      }
    }
  };
});
