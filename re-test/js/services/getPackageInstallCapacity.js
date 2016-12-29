discoveryService.service('getPackageInstallCapacity', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'getPackageInstallCapacity';
  this.api = 'luna://com.webos.appInstallService/group/queryInstallCapacity';
  this.debugApi = './resources/assets/getInstallCapacity.json';
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
    $rootScope.$broadcast('installCapacityResult', res);
  };
});
