discoveryService.service('appInstall', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'appInstall';
  this.api = 'luna://com.webos.appInstallService/install';
  this.debugApi = './resources/assets/getAppInstall.json';
  this.subscribe = false;
  this.param = {};
  this.timeout = 20000;

  this.call = function(req) {
    if (req) {
      this.param = req;
      this.debugApi = './resources/assets/getAppInstall_' + req.id + '.json';
    }

    var lunaService = new LunaService2(that);
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    if (this.param.callbackEvent) {
      $rootScope.$broadcast(this.param.callbackEvent, res);
    }
  };
});
