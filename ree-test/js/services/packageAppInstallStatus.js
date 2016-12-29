discoveryService.service('packageAppInstallStatus', function($rootScope, LunaService2, app, eventKey, membership) {
  var that = this;

  this.type = 'packageAppInstallStatus';
  this.api = 'luna://com.webos.appInstallService/group/status';
  this.debugApi = './resources/assets/getAppInstallGroupStatus.json';
  this.subscribe = true;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  this.serviceCallback = function(res) {
    var response = res;
    if( response ) {
      if( response.status )  {
        if( response.status.groups && response.status.groups.length > 0 ) {
          for(var i=0; i<response.status.groups.length; i++) {
            var packageAppStatus = response.status.groups.length[i];
            packageAppStatusProcess(packageAppStatus);
          }
        }
      } else if( response.members )  {
        packageAppStatusProcess(response);
      }
    } else {
      console.log('AppGroupStatus error', response);
      // TODO : Error Logging
    }
  };

  var packageAppStatusProcess = function(packageAppStatusInfo) {
    var packInstIdValue, packInstAppsArray, packCompleteCount, groupIdIdx, l, m, obj, requestParam;
    try {
      packInstIdValue		= packageAppStatusInfo.id;
      packInstAppsArray	= packageAppStatusInfo.members;
      packCompleteCount = 0;
      l = packInstAppsArray.length;
      for(var i=0; i < l; i++) {
        obj = packInstAppsArray[i];
        if(app.appStatusCheckArray.indexOf(obj.statusValue) >= 0) {
          packCompleteCount++;
        }
      }

      groupIdIdx = app.packageAppStatusIdList.indexOf(packInstIdValue);

      if( packCompleteCount == l ) {
        /*	packageApp 모두 완료	*/
        delete app.packageAppStatusList[packInstIdValue];
        if( groupIdIdx != -1 ) {
          app.packageAppStatusIdList.splice(groupIdIdx, 1);
        }
      } else {
        app.packageAppStatusList[packInstIdValue] = packageAppStatusInfo;
        if( groupIdIdx == -1 ) {
          app.appStatusIdList.push(packInstIdValue);
        }
        app.packageAppStatusIdList.push(packInstIdValue);
      }

      m = packageAppStatusInfo.members.length;
      for( i=0; i < m; i++ ) {
        if( packageAppStatusInfo.members[i].statusValue == -16 ) {
          //loggingApi.log({'loggingType':'appInstallAuthFail', packageAppStatusInfo:packageAppStatusInfo});
          //TODO : 	설치시 인증 401오류가 발생하면 ABSOLUTE_LOGIN 요청한다.
          //storeLib.callMembershipPage( GLOBAL_CONSTANT.MEMBERSHIP_PAGE.ABSOLUTE_LOGIN, {moduleName:PageController.pageParam.moduleName, itemId:PageController.pageParam.itemId, categoryCode:PageController.pageParam.categoryCode});
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
                  query:'category/APPSGAMES/' + packInstIdValue
                }
              }
            }};
          membership.callMembershipPage(requestParam);
          return ;
        }
      }
      $rootScope.$broadcast(eventKey.PACKAGE_STATUS_UPDATE, packageAppStatusInfo);
    } catch(e) {
      console.error(e);
    }
  };
});
