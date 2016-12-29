discoveryService.service('searchManager', function(LunaService) {
  var that = this;
  this.type = 'launchSearch';
  this.api = 'luna://com.webos.applicationManager/launch';
  this.debugApi = '';
  this.subscribe = false;
  this.param = {
    id : 'com.webos.app.voice',
    params : {
      activateType : 'lgstore',
      launchMode : 'vkb'
    }
  };
  this.timeout = 20000;

  var api = 'luna://com.webos.applicationManager/';
  var lunaService = new LunaService(that);

  this.call = function() {
    //this.api = api + req;
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    console.log('luna called launchSearch : ', this.api);
  };
});
