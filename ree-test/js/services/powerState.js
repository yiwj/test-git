discoveryService.service('powerState', function($rootScope, LunaService2, device) {
  var that = this;

  this.type = 'powerState';
  this.api = 'luna://com.webos.service.tvpower/power/getPowerState';
  this.debugApi = './resources/assets/getPowerState.json';
  this.subscribe = true;
  this.param = {};
  this.timeout = 5000;

  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  this.serviceCallback = function(response) {
    if (response.returnValue) {
      device.powerState = response.state;
      console.log("PowerState : "+  JSON.stringify(response));
      if (response.processing && (response.processing === 'Request Power Off' || response.processing === 'Prepare Suspend')) {
        //QuickStart+ 이고 DC off 한 후에 DC on 하면 네트워크 끊기지가 처음이면 네트워크 팝업창 안 띄워주기 (관련 소스 controller.js)
        device.isQuickStartPlusPowerState = true;
        device.isQuickStartPlusPowerOff = true;
        //[WOSLQEVENT-104046] QuickStartPlus모드에서 DC off 한 후에 DC on 하면 성인인증 내역이 구분하는 변수(관련 소스 detailapp.js)
        device.isQuickStartPlusAdultStatus = true;
        // [WOSLQEVENT-117674]QuickStart+ 상태에서 usb 앱설치 download 중 TV Off/On 후 상태를 알기 위해 사용(관련 소스 detailapp.js)
        device.isQuickStartPlusAdultStatusUsb = true;
        // 자동로그인 체크 해제 시, QuickStart+ 상태면 TV Off/On 후 로그인 세션을 초기화함.
        // 2016.03.08 김해
        if (device.auth.userAutoSignIn === false) {
          device.auth.userID = '';
        }
      }
    }
  };
});