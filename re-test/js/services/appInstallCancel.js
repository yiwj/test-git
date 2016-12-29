discoveryService.service('appInstallCancel', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'appInstallCancel';
  this.api = 'luna://com.webos.appInstallService/cancel';
  this.debugApi = './resources/assets/getAppInstallCancel.json';
  this.subscribe = false;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = function(req) {
    if (req) {
      this.param = req;
    }
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    $rootScope.$broadcast('appInstallCanceled', res);
  };
});
