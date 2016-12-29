discoveryService.service('userID', function($rootScope, LunaService2, device, eventKey, membership) {
  var that = this;

  this.type = 'userID';
  this.api = 'luna://com.webos.service.membership/getValue';
  this.debugApi = './resources/assets/getUserID.json';
  this.subscribe = true;
  this.param = {key: '/users/userid'};
  this.callback = undefined;
  this.timeout = 10000;

  var lunaService = new LunaService2(that);

  this.call = function(callback) {
    this.callback = callback;
    lunaService.call();
  };

  this.serviceCallback = function(response) {
    var callBackCheckUserId;
    if (response.returnValue) {
      device.auth.userID = response.value ? response.value.trim() : '';
      callBackCheckUserId = device.auth.userID;

      if (response.loginSession) {
        device.auth.loginSession = response.loginSession;
      }
      //로그인하거나 로그아웃하면 성인앱 Parental control창이 떠야한다.
      device.isAdultSettingPopup = false;
      // logout 시
      if (!device.auth.userID) {
        device.auth.adultStatus = 'NOT_LOGIN';
      }

      //mypage Sign-In ID spec out, [QEVENTSIXT-20005]팝업 문제 처리
      /*$rootScope.$broadcast(eventKey.SIGNIN_STATUS_CHANGED, {
        userId: response.value
      });*/
    } else {
      callBackCheckUserId = 'failed'; // LUNA failed (ex: timeout)
    }

    if (this.callback) {
      this.callback(callBackCheckUserId);
    }
    //[WOSLQEVENT-95510] 계정 LogOut/In 했을 시 callback 실행 되어. callback 초기화.
    this.callback = undefined;
  };
});