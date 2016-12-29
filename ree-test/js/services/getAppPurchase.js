discoveryService.service('getAppPurchase', function($rootScope, LunaService2) {
  var that = this;

  this.type = 'getAppPurchase';
  this.api = 'luna://com.webos.applicationManager/launch';
  this.debugApi = './resources/assets/getAppPurchase.json';
  this.subscribe = false;
  this.param = {
    id: 'com.webos.app.membership',
    params: {
      query: "purchase",
      returnTo: {
        target: "luna://com.webos.applicationManager", method: "launch", bypass: {
          params: {
            id: 'com.webos.app.discovery'
          }
        }
      }
    }
  };
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = function(req) {
    if (req) {
      this.param.params.params = req;
      this.param.params.returnTo.bypass.params.query = 'category/GAME_APPS/' + req.appId;
    }
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    $rootScope.$broadcast('appPurchaseResult', res);
  };

});
