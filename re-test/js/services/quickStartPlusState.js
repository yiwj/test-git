discoveryService.service('quickStartPlus', function($rootScope, LunaService2, device) {
  var that = this;

  // [WOSLQEVENT-70989] quickstart+ on/off 상태 체크
  this.type = 'quickStartPlus';
  this.api = 'luna://com.webos.settingsservice/getSystemSettings';
  this.subscribe = true;
  this.param = {category : "option", keys: ["quickStartMode"]};
  this.timeout = 5000;

  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  this.serviceCallback = function(response) {
    if (response.returnValue) {
      if (response.settings && response.settings.quickStartMode && response.settings.quickStartMode === 'on') {
       device.isQuickStartPlusState = true;
      } else {
        device.isQuickStartPlusState = false;
      }
    }
  };
});