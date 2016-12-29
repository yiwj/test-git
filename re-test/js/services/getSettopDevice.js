discoveryService.service('getSettopDevice', function($rootScope, LunaService2, device) {
  var that = this;
  this.type = 'getSettopDevice';
  this.api = 'luna://com.webos.service.config/getConfigs';
  this.debugApi = '';
  this.subscribe = false;
  this.param = {configNames: ["tv.hw.atsc30legacybox"]};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = function() {
    console.log('getSettopDevice.call();!!!');
    lunaService.call();
  };

  this.serviceCallback = function(response) {
    if (response.returnValue && response.configs['tv.hw.atsc30legacybox'] === 'ATSC30_LEGACYBOX_SUPPORT') {
      device.useSettopBox = true;
    }
//    console.log('★★device.useSettopBox', device.useSettopBox);
  };
});