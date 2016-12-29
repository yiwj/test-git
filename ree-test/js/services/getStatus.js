discoveryService.service('getStatus', function($rootScope, $http, LunaService) {
var callBackParam;

  this.get3DStatus = function(){
    var luna = {
      type : 'getStatus',
      api : 'luna://com.webos.service.tv.display/get3DStatus',
      debugApi : './resources/assets/PLAY_1.json',
      subscribe : true,
      param : {},
      timeout : 20000,
      serviceCallback : function(response) {
        if( response ) {
          $rootScope.$broadcast('get3DStatus', response);
//          return response;
        }
      }
    };
    var lunaService = new LunaService(luna);
    lunaService.call();
  };

  this.getSystemSettingDesc = function(){
    var luna = {
      type : 'getStatus',
      api : 'luna://com.lge.settingsservice/getSystemSettingDesc',
      debugApi : './resources/assets/PLAY_2.json',
      subscribe : true,
      param : {
        "category":"3d",
        "key":"_3dNormalImageView",
        "subscribe":true
      },
      timeout : 20000,
      serviceCallback : function(response) {
        if( response ) {
          $rootScope.$broadcast('getSystemSettingDesc', response);
//          return response;
        }
      }
    };
    var lunaService = new LunaService(luna);
    lunaService.call();
  };

  this.setSystemSettingDesc = function(){
    var luna = {
      type : 'getStatus',
      api : 'luna://com.lge.settingsservice/setSystemSettingDesc',
      debugApi : './resources/assets/PLAY_3.json',
      subscribe : true,
      param : {
        "category":"3d",
        "key":"_3dNormalImageView",
        "ui":{
          "visible":true,
          "displayName":"_3dNormalImageView",
          "active":false,
          "widget":"None"
        }
      },
      timeout : 20000,
      serviceCallback : function(response) {
        if( response ) {
          $rootScope.$broadcast('setSystemSettingDesc', response);
//          return response;
        }
      }
    };
    var lunaService = new LunaService(luna);
    lunaService.call();
  };

  /*
   * TV 3D 여부 확인
   */
  this.set3DEnableOnSignal = function(param){
    var luna = {
      type : 'getStatus',
      api : 'luna://com.webos.service.tv.display/set3DEnableOnSignal',
      debugApi : './resources/assets/PLAY_4',
      param : {},
      timeout : 20000,
      callBackParam : {active3D: param},
      serviceCallback : function(response) {
        if( response ) {
          $rootScope.$broadcast('set3DEnableOnSignal', response);
//          return response;
        }
      }
    };
    var lunaService = new LunaService(luna);
    lunaService.call();
  };

  this.callBackParam = callBackParam;


});
