discoveryService.service('httpHeader', function($rootScope, $http, $timeout, LunaService2, device, headers, authentication, util, eventKey) {
  var that = this;

  this.type = 'httpHeader';
  this.api = 'luna://com.webos.service.sdx/getHttpHeaderForServiceRequest';
  this.debugApi = './resources/assets/getHttpHeaderForServiceRequest.json';
  this.subscribe = true;
  this.param = {};
  this.timeout = 20000;
  this.retry = 0;
  var initialize = false;
  //initializecountry를 처음 서비스 실행될때만 타도록하기위함, subscribe로 바꾸면서 추가

  /**
   * 루나 서비스 객체 저장
   */
  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  /**
   * 서비스 콜백 요청
   */
  this.serviceCallback = function(response) {
    try {
      if (!response['X-Device-ID']) {
        console.error('httpHeader service failed');
        if (this.retry < 5){
          this.call();
          this.retry++;
        } else {
          // NCVTDEFECT-2596 대응
          if (device.firstRun) {
            $rootScope.$broadcast(eventKey.HEADER_ERROR);
          }
        }
        return;
      }

      //var languageCode = response['X-Device-Language'].split('-')[0];

      if (device.q['X-Device-Language'] != response['X-Device-Language']) {
        //device.languageCode = languageCode;
        if (!device.firstRun) {
          $rootScope.$broadcast(eventKey.CHANGE_LANGUAGE, response['X-Device-Language']);
        }
        console.log('Reload different language code: ' + device.q['X-Device-Language']);
      }

      device.countryCode = response['X-Device-Country'];

      if (response['X-Device-Eula'] != device.eula) {
        device.eula = response['X-Device-Eula'];
        if (response['X-Device-Eula'].indexOf('additionalDataAllowed') > -1) {
          device.additionalDataAllowed = true;
        } else {
          device.additionalDataAllowed = false;

          // ?? 이슈에서 언어 문제가 제기된 경우라면 현재 구현을 유지해야 함
        }
      }

      // FIXME : 개발 용
      if (response['X-Device-FCK'] == '-1' && location.port === '8080' && window.location.hostname != 'localhost') {
        response['X-Device-FCK'] = '156';
        response['X-Device-Platform'] = 'W16M';
      }

      if (!response['X-Login-Session']) {
        device.auth.userID = '';
        device.auth.loginSession = '';
        response['X-Login-Session'] = '';
      } else {
        device.auth.loginSession = response['X-Login-Session'];
      }

      delete response['returnValue'];
      delete response['header'];
      delete response['Accept'];
      util.copyObject(device.q, response);

      /**Tv에서 Header 정보 세팅시 밑의 정보를 삭제하면 header 정보가 부족하여
       * Api 호출시 internal 500 error발생**/
      if(!window.PalmSystem){//tv가 아닌 경우에만
        delete response['X-Device-ContentsQA-Flag'];
        delete response['X-Device-Eula'];
        delete response['X-Device-FCK'];
        delete response['X-Device-FW-Version'];
        delete response['X-Device-Remote-Flag'];
        delete response['X-Device-SDK-VERSION'];
        delete response['X-Device-Sales-Model'];
        delete response['X-Login-Session'];
      }
      util.copyObject(headers, response);

      delete headers['X-Authentication'];

      //detailapp에서 사용하는 changeLoginstatus는 로그인세션의 영향을 받으므로userid가 아닌 http 로그인세션 콜백으로 받는다.
      device.hasLaunchParamsResult = true; // from membership
      //mypage Sign-In ID spec out, [QEVENTSIXT-20005]팝업 문제로 인한 주석처리
      //$rootScope.$broadcast('changeLoginStatus');
      if (device.firstRun) {
        if (!response['X-Authentication']) {
          authentication.call();
        } else {
          //device.firstRun = false;
          // 화면 그리는 함수 시작(featuredOnload);
          // event를 보내서 view를 관리하는 곳에서 처리하도록 할 것
          if (!initialize) {
            $rootScope.initializeCountry(true);
            initialize = true;
          }
        }
      } else if (!document.webkitHidden) {
        // 상세 페이지와 2뎁스 mypage이면 화면을 갱신한다.
        // event를 보내서 view를 관리하는 곳에서 처리하도록 할 것
        if (!initialize) {
          $rootScope.initializeCountry(false);
          initialize = true;
        }
      }
    } catch(e) {
      if (device.firstRun) {
        $rootScope.$broadcast(eventKey.HEADER_ERROR);
      }
    }
  };
});
