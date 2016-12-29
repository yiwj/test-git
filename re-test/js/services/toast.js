discoveryService.service('toast', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'toast';
  this.api = 'luna://com.webos.notification/createToast';
  this.debugApi = './resources/assets/toast.json';
  this.subscribe = false;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = function(req) {
    if( !req['msg'] ) req['msg'] = 'NO MESSAGE';
    if( !req['icon'] ) req['icon'] = '/usr/palm/applications/com.webos.app.discovery/lgstore_80x80.png';
    if( req['noaction'] === undefined ) req['noaction'] = true;

    this.param = {
      sourceId: "com.webos.app.discovery",
      message: req['msg'],
      onclick: req['onclckParam'],
      iconUrl: req['icon'],
      noaction: req['noaction'],
      persistent: req['persistent'],
      stale: req['stale'],
      callBackEvt: req['callbackEvent']
    };
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    if (this.param.callBackEvt) {
      $rootScope.$broadcast(this.param.callBackEvt, res);
    }
  };
});
