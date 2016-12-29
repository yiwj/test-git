discoveryService.service('getInstallCapacity', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'getInstallCapacity';
  this.api = 'luna://com.webos.appInstallService/queryInstallCapacity';
  this.debugApi = './resources/assets/getInstallCapacity.json';
  this.subscribe = false;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = function(req) {
    if (req) {
      this.param = req;
      //this.debugApi = './resources/assets/getInstallCapacity_' + req.appId + '.json';
    }
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    $rootScope.$broadcast('installCapacityResult', res);
  };

  this.getRequiredAppSize = function(req, callback){
    var luna = {
      type : 'getInstallCapacity',
      api : 'luna://com.webos.appInstallService/queryInstallCapacity',
      debugApi : './resources/assets/getInstallCapacity.json',
      subscribe : false,
      param : req,
      timeout : 20000,
      serviceCallback : function(response) {
        if(response && response.requiredSize) {
          callback(response.requiredSize);
        } else {
          callback(undefined);
        }
      }
    };
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };
});
