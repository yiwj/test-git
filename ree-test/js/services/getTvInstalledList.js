discoveryService.service('tvInstalledList', function($rootScope, LunaService2) {
  var self = this;

  /**
   * SUBSCRIBE - install 되있는 앱 가져오기
   */
  self.getList = function(callback){
    var luna = {
      type : 'tvInstalledApp',
      api : 'luna://com.webos.applicationManager/listApps',
      debugApi : './resources/assets/requestMembershipService.json',
      subscribe : false,
      param : {},
      timeout : 20000,
      serviceCallback : function(response) {
        var appIdVerBuff = '';
        if (response) {
          if(response.apps && response.apps.length > 0){
            var j = 0;
            for(var i = 0; i < response.apps.length; i++){
              var installedAppListInfo = response.apps[i];
              if (installedAppListInfo.type != "stub") {
                var idVer = installedAppListInfo.id + "," + installedAppListInfo.version;
                appIdVerBuff = appIdVerBuff + idVer + ";";
              }
            }
          }
        }
        if (callback) {
          callback(appIdVerBuff);
        }
      }
    };
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };

});