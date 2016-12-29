discoveryService.service('popupService', function($rootScope, billing, eventKey) {

  this.watchClick = function(scope, data, onCloseCallback) {
    try {
      if (data != undefined) {
        if (data.length == undefined){// array로 안들어오는 경우 어레이로 고쳐줌 데이터 하나일경우 어레이로 안들어옴
          var toarray = data;
          data = [];
          data.push(toarray);
        }
        scope.execList = {
          popupTitle : msgLang.alert_openwith_1,
          popupDesc : msgLang.alert_openwith_1_1,
//          watchSetBtn : 'PREFERRED APP SETTING',// TODO 임시
          watchClose : msgLang.close,
          items : [],
          contents_id : data.contents_id || ''
        };

        for ( var i = 0; i < data.length; i++) {
          scope.execList.items[i] = {};
          scope.execList.items[i].execItemId = data[i].item_id;
          scope.execList.items[i].execId = data[i].exec_id;
          scope.execList.items[i].execAppId = data[i].exec_app_id;
          scope.execList.items[i].execAppName = data[i].exec_app_name;
          scope.execList.items[i].execContsName = data[i].cp_conts_name;
          scope.execList.items[i].execImgUrl = data[i].img_url_cp;
          scope.execList.items[i].premiumAppFlag = data[i].premium_app_flag;
          scope.execList.items[i].execPrice = data[i].price_disp;

          var addInfoDispArr = [];
          var len = data[i].add_info_disp.split(',').length;
          if(data[i].add_info_disp != null && data[i].add_info_disp != "") {
            for(var j = 0; j < len; j++) {
              var addInfoDisp = data[i].add_info_disp.split(',')[j];
              if(addInfoDisp == 'HD' || addInfoDisp == 'HD+' || addInfoDisp == 'UHD' || addInfoDisp == 'HDX' || addInfoDisp == 'SD' || addInfoDisp == 'FHD' || addInfoDisp == 'SUBSCRIPTION') {
                addInfoDispArr.push(addInfoDisp);
              } else {// 한국의 경우 '정액제' 등의 정보가 price_disp 로 오지 않고 add_info_disp 정보로 호출되기에 별도 처리
                scope.execList.items[i].execPrice = data[i].add_info_disp;
              }
            }
            scope.execList.items[i].addInfoDisp = addInfoDispArr;
          }

          scope.refreshflag = true;
        }
      } else {
        var errorCode = scope.errorCode + '.001.02';
        var popOpts = {popupTitle: msgLang.alert_adult_3_2, popupDesc: msgLang.alert_adult_3_5, errorCode: errorCode, type: 'error'};
        $rootScope.popupApp.showPopup(scope, popOpts);
      }
      if(scope.refreshflag == true){
        scope.execList.logMenu = data.logMenu; // pmLog용
        scope.execList.logCategory = data.logCategory; // pmLog용
        this.cppopupOn(scope, scope.execList, onCloseCallback);
      }
    } catch (e) {
      var errorCode = scope.errorCode + '.002';
      var popOpts = {popupTitle: msgLang.alert_adult_3_2, popupDesc: msgLang.alert_adult_3_5, errorCode: errorCode, type: 'error'};
      $rootScope.popupApp.showPopup(scope, popOpts);
    }
  };

  this.cppopupOn = function (scope, data, onCloseCallback) {
    data.type = 'watch';
    scope.CpdataHandleOrNotflag = false;
    $rootScope.popupApp.showPopup(scope, data, onCloseCallback);
  };

});