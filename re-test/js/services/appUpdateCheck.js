discoveryService.service('appUpdateCheck', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'appUpdateCheck';
  this.api = 'luna://com.webos.service.update/checkUpdate';
  this.debugApi = './resources/assets/appUpdateCheck.json';
  this.subscribe = false;
  this.param = {manual:true};
  this.timeout = 30000;

  var lunaService = new LunaService2(that);

  this.call = function() {
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    $rootScope.$broadcast('appUpdateChecked', res);
  };
});
