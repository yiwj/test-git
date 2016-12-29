discoveryService.service('restartTV', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'restartTV';
  this.api = 'luna://com.webos.service.tvpower/power/reboot';
  this.debugApi = './resources/assets/reboot.json';
  this.subscribe = false;
  this.param = {reason:'swDownload'};

  this.timeout = 30000;

  var lunaService = new LunaService2(that);

  this.call = function() {
    lunaService.call();
  };

  this.serviceCallback = function(res) {
  };
});