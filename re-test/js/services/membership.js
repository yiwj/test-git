discoveryService.service('membership', function($rootScope, LunaService2, eventKey, device) {
  var self = this;

  this.callback = undefined;

  var currentId = null; // ID that is currently logged in
  var adultAuthFlag = null; // adult authentication status

  /**
   * SUBSCRIBE - get userid
   */
  self.getUserId = function(){
    var luna = {
      type : 'membership',
      api : 'luna://com.webos.service.membership/getValue',
      debugApi : './resources/assets/requestMembershipService.json',
      subscribe : false,
      param : {key:'/users/userid'},
      timeout : 10000,
      serviceCallback : function(response) {
        console.log('membership.getUserId response = ' + response);
        if( response ) {
         if(response.value && response.returnValue){
          currentId = response.value;
          return response.value;
         }
        }
      }
    };
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };

  self.getAdultStatus = function(){
    var luna = {
      type : 'membership',
      api : 'luna://com.webos.service.membership/getValue',
      debugApi : './resources/assets/requestMembershipService.json',
      subscribe : true,
      param : {'key':'/users/adultAuthStatus'},
      timeout : 10000,
      serviceCallback : function(response) {
        console.log('membership.getAdultStatus response = ' + response);
        if( response ) {
          device.auth.prevAdultStatus = device.auth.adultStatus;
          device.auth.adultStatus = response.value;
          if ($rootScope.popupApp && $rootScope.popupApp.open) {
            //WOSLQEVENT-105689 Deep link 로 LG Store 진입 후 언어 확인 결과 팝업은 영어로 출력되나 youtube 상세페이지 화면은 일본어로 출력
            //mebership에서 언어 설정 후 store 재 진입시 pagg reload popup이 사라지는 현상을 막기 위한 방어코드
            if ($rootScope.popupApp.title !== msgLang.popup_reload_title) {
              $rootScope.popupApp.hidePopup(); // hidePopup
            }
          }
          $rootScope.$broadcast(eventKey.ADULT_STATUS_LOADED, response);
        }
      }
    };
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };

  /**
   * SUBSCRIBE - 성인인증 상태 가져오기
   * @return value
   * '',            // 로그인을 하지 않은 상태
     'needAge',     // 나이 정보 등 추가 정보 입력이 필요한 상태
     'false',       // 미성년 사용자
     'notVerified', // 성인(인증시간 만료로 재인증이 필요한 상태)
     'Verified'     // 성인(인증상태)
   */

  /**
   * SUBSCRIBE - 멤버쉽 페이지 호출
   * @'retunTo' object는 lgstore가 relaunch 될때 사용하기 위함(PalmSystem.launchParams 에 담기게 됨)
   * 1. 성인인증 페이지 오픈시
   *    'query' : 'requestAdultAuth'
  {
    "reqService":"luna://com.webos.service.membership/open",
    "params":{
      "query":"requestAdultAuth",
      "params":{
      },
      "returnTo":{
        "target":"luna://com.webos.applicationManager",
        "method":"launch",
        "bypass":{
          "params":{
            "id":"com.webos.app.discovery",
            "query":"category/APPSGAMES/89098089098",
            "callPageParam":{
              "pageType":1,
              "moduleName":"Apps2Depth",
              "category_id":"000100",
              "rankType":"5",
              "isMoveFlag":false,
              "isSuccessFlag":true,
              "title":"앱 & 게임",
              "isHistoryBackFlag":false
            }
          }
        }
      }
    }
  }

  * 2. app 구매시
 {
  "id":"com.webos.app.membership",
  "params":{
    "query":"purchase",
    "params":{
      "appId":"item1209-1"
    },
    "returnTo":{
      "target":"luna://com.webos.applicationManager",
      "method":"launch",
      "bypass":{
        "params":{
          "id":"com.webos.app.discovery",
          "query":"category/GAME_APPS/item1209-1"
        }
      }
    }
  }
}

 paramSetting 예시
   var paramSetting = {
        "query":"requestAdultAuth",
        "params":{
        },
        "returnTo":{
          "target":"luna://com.webos.applicationManager",
          "method":"launch",
          "bypass":{
            "params":{
              "id":"com.webos.app.discovery",
              "query":"category/APPSGAMES/banner.test.app",
            }
          }
        }}
 paramSetting.query 값들
    'requestAdultAuth'    //성인인증
    'requestAddInfo'      //추가정보
    'requestLogin'        //로그인
    'purchase'            //구매
    'requestPersonalInfo' //개인정보
    'requestAbsoluteLogin'//강제로그인
 paramSetting.returnTo.bypass.params.query 값들
    "category/(페이지)/(아이템)"
    --controller.js의 parseLaunchParams 참조
    page와 item의 구분은 '/' 로 합니다.
  **/

  self.callMembershipPage = function(paramSetting){
    var luna = {
      type : 'membership',
      api : 'luna://com.webos.service.membership/open',
      debugApi : './resources/assets/requestMembershipService.json',
      subscribe : false,
      param : {},
      timeout : 20000,
      serviceCallback : function(response) {
        if( response ) {
          console.log(response);
        }
      }
    };
    if(paramSetting){
      luna.param = paramSetting;
    }
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };
});

discoveryService.service('adultAuthStatusProcess', function($rootScope, LunaService2, device, eventKey) {
  var that = this;

  this.type = 'membership';
  this.api = 'luna://com.webos.service.membership/getValue';
  this.debugApi = './resources/assets/getUserID.json';
  this.subscribe = true;
  this.param = {key: '/users/adultAuthStatus'};
  this.callback = undefined;
  this.timeout = 10000;

  var lunaService = new LunaService2(that);

  this.call = function(callback) {
    this.callback = callback;
    lunaService.call();
  };

  this.serviceCallback = function(response) {
    console.log('adultStatusProcess.getAdultStatus response = ' + response);
    if( response ) {
      device.auth.prevAdultStatus = device.auth.adultStatus;
      device.auth.adultStatus = response.value;
      if ($rootScope.popupApp && $rootScope.popupApp.open) {
        //WOSLQEVENT-105689 Deep link 로 LG Store 진입 후 언어 확인 결과 팝업은 영어로 출력되나 youtube 상세페이지 화면은 일본어로 출력
        //mebership에서 언어 설정 후 store 재 진입시 pagg reload popup이 사라지는 현상을 막기 위한 방어코드
        if ($rootScope.popupApp.title !== msgLang.popup_reload_title) {
          $rootScope.popupApp.hidePopup(); // hidePopup
        }
      }
      $rootScope.$broadcast(eventKey.ADULT_STATUS_LOADED, response);
    }
  };
});