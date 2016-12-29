discoveryService.service('usbList', function($rootScope, LunaService2, app, storageCapacity, pmLog) {
  var that = this;

  this.type = 'usbList';
  this.api = 'luna://com.webos.service.attachedstoragemanager/listDevices';
  this.debugApi = './resources/assets/getUSBListData.json';
  this.subscribe = true;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  this.serviceCallback = function(res) {
    var deviceInfo, response = res;
    app.usbListData = [];//usbList push 동작 전에 한번 초기화 한다.
    if (response) {
      if (response.returnValue) {
        if (response.devices && response.devices.length > 0) {
          for (var i = 0, max = response.devices.length; i < max; i++) {
            deviceInfo = response.devices[i];
            if (deviceInfo.deviceType && deviceInfo.deviceType.toLowerCase() == 'usb') {
              app.usbListData.push(deviceInfo);
            }
          }
        }

        /*	usb 팝업이 떠있을때만 조회해서 갱신해 준다.	*/
        //if ($rootScope.popupApp && !$rootScope.popupApp.hide && app.usbListData.length > 0) {
          this.storageCapacityInit(); // 용량 정보 초기화
          storageCapacity.call('usbStorageCapacityResult');
          $rootScope.$broadcast('usbListUpdated', response.returnValue);  // usb 변경 사항을 broadcasting
        //}
      }
    } else {
      console.error('usb list 조회 실패', response);
    }
  };

  this.storageCapacityInit = function() {
    var usbInfo;
    for (var i = 0; i < app.usbListData.length; i++) {
      usbInfo = app.usbListData[i];
      //usbInfo.capacity = undefined;
      app.usbListData[i] = usbInfo;
      console.log(usbInfo);
    }
  };
});
