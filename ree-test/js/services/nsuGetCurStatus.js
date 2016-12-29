discoveryService.service('nsuGetCurStatus', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'nsuGetCurStatus';
  this.api = 'luna://com.webos.service.update/getCurStatus';
  this.debugApi = './resources/assets/nsuGetCurStatus.json';
  this.subscribe = true;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = function() {
    lunaService.call();

  };

  this.serviceCallback = function(res) {
    $rootScope.$broadcast('nsuGetCurStatusResulted', res);
  };
});

