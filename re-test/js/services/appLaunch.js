discoveryService.service('appLaunch', function($rootScope, LunaService2) {
  var that = this;
  this.type = 'appLaunch';
  this.api = 'luna://com.webos.applicationManager/launch';
  this.debugApi = './resources/assets/getAppLaunch.json';
  this.subscribe = false;
  this.lastLaunchId = null;
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
        this.debugApi = './resources/assets/getAppLaunch_' + req.appId + '.json';
      }
      if (req.appLaunchParams) {
        this.param.params = req.appLaunchParams;
      } else {
        if (this.lastLaunchId !== null && (this.lastLaunchId !== this.param.id)) {
          if (this.param.params) {
            delete this.param.params;
          }
        }
      }
    }
    if (req.timeout) this.timeout = req.timeout;
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    // [WEBOSDEFEC-9952] 시청하기 > CP선택 > 해당 컨텐츠 CP 상세화면 후에
    // Store로 복귀 후 프리미엄에서 해당 cp앱 선택 후 launch시 메인으로 가지 않고
    // 기존 deeplink로 이동되는 현상
    $rootScope.lastTryContentId = null;
    $rootScope.lastTryAppId = null;
    this.param = {};
    if (this.param.id) {
      this.lastLaunchId = this.param.id;
    }
    $rootScope.$broadcast('appLaunchResult', res);
  };
});