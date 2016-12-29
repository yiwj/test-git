discoveryService.service('nsuUpdateStatus', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'nsuUpdateStatus';
  this.api = 'luna://com.webos.service.update/isNSURunning';
  this.debugApi = './resources/assets/getIsNSURunning.json';
  this.subscribe = false;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = function() {
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    $rootScope.$broadcast('nsuUpdateStatusResulted', res);
  };
});
