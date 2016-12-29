discoveryService.service('appClose', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'appClose';
  this.api = 'luna://com.webos.applicationManager/closeByAppId';
  this.debugApi = './resources/assets/getAppClose.json';
  this.subscribe = false;
  this.param = {};
  this.timeout = 20000;


  var lunaService = new LunaService2(that);

  this.call = function(req) {
    if (!req.appId){
      return ;
    }

    if (req) {
      if (req.appId) {
        this.param.id = req.appId;
        this.debugApi = './resources/assets/getAppClose_' + req.appId + '.json';
      }
      if (req.appCloseParams) this.param.params = req.appCloseParams;
    }
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    $rootScope.$broadcast('appCloseResult', res);
  };
});