discoveryService.service('getAppInfo', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'getAppInfo';
  this.api = 'luna://com.webos.applicationManager/getAppInfo';
  this.debugApi = './resources/assets/getAppInfo.json';
  this.subscribe = false;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = function(req) {
    if (req) {
      this.param = req;
      this.debugApi = './resources/assets/getAppInfo_' + req.id + '.json';
    }
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    if (this.param.callBackParam) {
      res.callBackParam = this.param.callBackParam;
    }
    if (this.param.callbackEvent) {
      $rootScope.$broadcast(this.param.callbackEvent, res);
    }
  };
});
