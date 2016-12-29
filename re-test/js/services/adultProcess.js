discoveryService.service('adultProcess', function($rootScope, membership, device, LunaService2) {
  var key = '/users/adultAuthStatus';
  var appId = '';

  this.getAdultContentsFlag = function(itemAge){
    var isAdultContent = false;
    if(itemAge == undefined || itemAge == '') return isAdultContent;

    if (typeof(itemAge) === 'boolean') {
      isAdultContent = itemAge;
    }else if (itemAge === 'Y' || itemAge === 'N') {
      isAdultContent = itemAge === 'Y';
    }else if (typeof(itemAge) === 'string' && itemAge.toUpperCase() === 'ALL') {
      isAdultContent = false;
    }else{
      isAdultContent = Number(itemAge) >= 18;
    }
    return isAdultContent;
  };

  // check loginsession
  this.getLoginSession = function (itemId) {
    var data;
    var luna = {
      type : 'membership',
      api : 'luna://com.webos.service.membership/getValue',
      debugApi : './resources/assets/requestMembershipService.json',
      subscribe : false,
      param : {key:'/users/loginSession'},
      timeout : 20000,
      serviceCallback : function(response) {
        if ( response ) {
          if (response.value && response.returnValue) {
            device.hasLoginSession = true;
          } else {
            device.hasLoginSession = false;
          }
        } else {
          device.hasLoginSession = false;
        }
        //[QEVENTSIXT-15389]execProcess에서 subscribe : false이므로 그 후에 성인인증값이 변해도 값이 안옴.
        data = {
          key: '/users/adultAuthStatus',
          value: device.auth.adultStatus,
          returnValue : true,
          itemId:itemId
        };
        $rootScope.$broadcast('checkedAdult', data);
      }
    };
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };

  this.openAdultContent = function (e, response) {
    e.preventDefault();

    var userStatus, title, subTitle, requestParam;
    //성인인증 변경 관련 luna 응답만 수행
    if(response.key != key) {
      return;
    }

    //var customParam = responseObj.callBackParam;
    console.log("openAdultContent >> ", response);
    // 정상적으로 조회한 경우에만 값을 설정한다.(광고 서버와 관련한 오류가 발생하여 방어용으로 사용)
    if(response.returnValue) { // distinguish '' from false.
      userStatus = response.value === '' ? 'NOT_LOGIN' : '' + response.value; // if logged in, response.value : 'Verified', 'notVerified', 'needAge', false
      //[WOSLQEVENT-117007] Quick Start Pluse on 상태에서 자동로그인 체크 안한 상태에서 로그인하여
      //power off/on 후에 성인인증값이 지워지지 않아서(device.auth.adultStatus = 'verified';) 로그인이 안된상태이면 성인인증이 안되어있다고 하드코딩해줌.
      if(!device.auth.userID){
        userStatus = 'NOT_LOGIN';
      }
      appId = response.itemId;
    }

    methodPopOrDraw(userStatus, this.appId);

  };

  this.popOrDraw = function(userStatus, appId) {
    methodPopOrDraw(userStatus, appId);
  };

  var methodPopOrDraw = function (userStatus, appId) {
    switch(userStatus) {
      case 'Verified':
        // 인증된 성인
        break;
      case 'notVerified':
        // 인증되지 않은 성인 회원
        console.log("------ NOT_VERIFIED_ADULT");
        title = msgLang.alert_adult_5;
        //TODO 2017문구 msgLang.alert_2017_adult_5
        subTitle = msgLang.alert_2017_adult_5;
        this.key = 'requestAdultAuth';
        break;
      case 'needAge':
        //나이 정보가 없는 경우
        console.log("------ NEED_INFO");
        title = msgLang.alert_adult_2;
        //TODO 2017문구 msgLang.alert_2017_adult_2
        subTitle = msgLang.alert_2017_adult_2;
        this.key = 'requestAddInfo';
        break;
      case 'false':
        // 미성년 회원
        console.log("------ NOT_ADULT");
        title = msgLang.alert_adult_5;
        //TODO 2017문구 msgLang.alert_2017_adult_3
        subTitle = msgLang.alert_2017_adult_3;
        this.key = 'requestAdultAuth';
        break;
      default :
        // Log out 상태.
        console.log("------ NOT LOGIN");
        if (!device.hasLoginSession) {
          title = msgLang.alert_adult_5;
          //TODO 2017문구 msgLang.alert_2017_adult_1
          subTitle = msgLang.alert_2017_adult_1;
          this.key = 'requestAdultAuth';
        } else {
          // error! has loginSession but no adultStatus.
          title = 'ERROR';
          subTitle = '18 : has no adultStatus but has loginSession';
          this.key = 'requestAdultAuth';
        }
        break;
    }

    device.auth.adultStatus = userStatus;
    if(userStatus === 'Verified'){
      // 현재 성인인증을 사용하는 곳이 앱상세에만 있어 앱으로 설정함.
//      $rootScope.draw({
//        page: 'detailApp',
//        module: appId, // this.appId,
//        inLink: true
//      });
    }else{
      if(userStatus === 'false') {
        requestParam = {
          type: 'popup',
          popupTitle: title,
          popupBut1: msgLang.ok,
          popupButAct1 : 'closeAppPopup',
          popupDesc: subTitle
        };
        $rootScope.popupApp.showPopup($rootScope, requestParam);
      } else {
        requestParam = {
          type: 'popup',
          popupTitle: title,
          popupBut1: msgLang.no,
          popupBut2: msgLang.yes,
          popupButAct1 : 'closeAppPopup',
          popupButAct2: 'callMemberShip',
          popupDesc: subTitle
        };
        $rootScope.popupApp.showPopup($rootScope, requestParam);
      }
    }
  };

  var closePopup = function() {
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
    if ($rootScope.isFromMain) {
      $rootScope.isFromMain = false;
      $rootScope.pageManager.popHistory();
    }
  };

  var callMemberShipFromPopup = function(){
    var requestParam;
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
    requestParam = {
      query: this.key,
      returnTo: {
        target: 'luna://com.webos.applicationManager',
        method: 'launch',
        bypass: {
          params: {
            id: 'com.webos.app.discovery',
            query: 'category/APPSGAMES/' + appId,
            isAdultApp: true
          }
        }
      }
    };
    membership.callMembershipPage(requestParam);
  };

  $rootScope.$on('closeAppPopup', closePopup);
  $rootScope.$on('callMemberShip', callMemberShipFromPopup);
  $rootScope.$on('checkedAdult', this.openAdultContent);
});