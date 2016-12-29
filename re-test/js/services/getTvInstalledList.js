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
                //2017년향 Binary ID 추가(앱 업데이트 확인할때 필요 없으면 0값)
                //권오룡 주임님과 합의함.(값이 없으면 0으로 설정)
                var idVer ='';
                if (!installedAppListInfo.binId){
                  idVer = installedAppListInfo.id + ",0," + installedAppListInfo.version;
                }else{
                  idVer = installedAppListInfo.id + "," + installedAppListInfo.binId + "," + installedAppListInfo.version;
                }
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