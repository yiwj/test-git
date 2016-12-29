discoveryService.service('appInstallStatus', function($rootScope, LunaService2, app, membership) {
  var that = this;

  this.type = 'appInstallStatus';
  this.api = 'luna://com.webos.appInstallService/status';
  this.debugApi = './resources/assets/getAppInstallStatus.json';
  this.subscribe = true;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  this.serviceCallback = function(res) {
    var response = res;
    if( response ) {
      if( response.status && response.status.apps && response.status.apps.length > 0 ) {
        for(var i=0, max=response.status.apps.length; i< max; i++) {
          appStatusProcess(response.status.apps[i]);
        }
      } else {
        if( response.id && response.details ) {
          appStatusProcess(response);
        }
      }
    }
  };

  var appStatusProcess = function(appStatusInfo) {
    var appIdValue, appStatusValue, appIdIdx;
    appIdValue		= appStatusInfo.id;
    appStatusValue	= Number(appStatusInfo.statusValue);
    if (app.appStatusIdList) appIdIdx		= app.appStatusIdList.indexOf(appIdValue);

    //console.debug('appStatusInfo appIdValue['+appIdValue+'] appStatusValue['+appStatusValue+']');
    if(app.appStatusCheckArray && appStatusValue in app.appStatusCheckArray ) {
      delete app.appStatusList[appIdValue];

      if( appIdIdx != -1 ) {
        app.appStatusIdList.splice(appIdIdx, 1);
      }
    } else {
      app.appStatusList[appIdValue] = appStatusInfo;
      if( appIdIdx == -1 ) {
        app.appStatusIdList.push(appIdValue);
      }
    }

    /*	설치시 인증 401오류가 발생하면 ABSOLUTE_LOGIN 요청한다.	*/
    if( appStatusInfo.details.errorCode == -16 ) {
      requestParam = {
          query: 'requestAbsoluteLogin',
          params:{
          },
          returnTo:{
            target:'luna://com.webos.applicationManager',
            method:'launch',
            bypass:{
              params:{
                id:'com.webos.app.discovery',
                query:'category/APPSGAMES/' + appIdValue
              }
            }
          }};
        membership.callMembershipPage(requestParam);
        return ;
    }
    $rootScope.$broadcast('appStatusChanged', appStatusInfo);
  };
});
