var app = angular.module('discoveryApp', ['discoveryService', 'discoveryServer', 'discoveryVariable', 'discoveryUtil']);

app.directive('detailSectionHandle', function() {
  return {
    scope: {
    },
    controller: function($scope, $element) {
      var clamp = $scope.clamp = false;

      $scope.updateClamp = function(scope) {
        $element[0].classList.add('more-open');
        if(scope.clamp) {
          scope.clamp = false;
          $element[0].classList.remove('more-open');
        }else{
          scope.clamp = true;
          $element[0].classList.add('more-open');
        }
      };

      this.clampHandle = function(scope) {
        $scope.updateClamp(scope);
      };
    }
  };
});
app.directive('moreButtonHandle', function($document) {
  return{
    require: '^detailSectionHandle',
    replace: true,
    scope: {
    },
    link: function(scope, element, attrs, detailSectionCtrl) {
      scope.clamp = false;
      scope.moreTitle = msgLang.more;
      scope.lessTitle = msgLang.less;
      detailSectionCtrl.clampHandle(scope);
      element.bind('click', function(e) {
        detailSectionCtrl.clampHandle(scope);
      });
      $document.on('keyup', function(e) {
        if(e.keyCode === 13 && element.hasClass('btn-more') && element.hasClass('focus')) {
          if (element.hasClass('scroll-btn-dimmed')) {
            element.removeClass('scroll-btn-dimmed');
            return;
          }
          e.preventDefault();
          detailSectionCtrl.clampHandle(scope);
        }
      });
    },
    templateUrl: './resources/html/moreButton.html'
  };
});

app.filter("nl2br", function($sce) {
  return function(data) {
    if (!data) return data;
    data = data.replace(/\n\r?/g, '<br />');
    return $sce.trustAsHtml(data);
  };
});

app.controller('controller', function($scope, $rootScope, $element, $compile, $document, $timeout, pageManager, resolutionRatio, spaceInfo, powerState, connectionInfo, usbList, pmLog, quickStartPlus,
  deviceService, server, device, config, util, keyHandler, focusManager, marquee, appService, storage, adManager, eventKey, userID, appInstallStatus, packageAppInstallStatus, stubAppInstallList, membership, noticeManager, appLaunch, adultProcess, appClose, getCpList, userAutoSignIn, checkAudioGuidance) {
  var screenX = 0;
  var screenY = 0;
  var saveFocus = {}; // blur시 focus 저장

  $scope.scopeName = 'app';

  var parseQuery = function() {
    if (typeof(deviceQuery) != 'undefined') util.copyObject(device.q, deviceQuery);
    if (typeof(devicePage) != 'undefined') device.page = devicePage;
    if (typeof(deviceTierType) != 'undefined') device.tierType = deviceTierType;

    // not used! 'cause they used response of discoveryv6 api
    /*if (typeof(deviceCountryCode) != 'undefined') device.countryCode = deviceCountryCode;

    if (deviceCountryCode && deviceCountryCode.length > 0) {
      device.tierType = parseInt(getTierType.num(deviceCountryCode));
    }*/

    if (device.q['X-Device-Language']) {
      device.languageCode = device.q['X-Device-Language'].split('-')[0];
    }

    if (device.q['X-Device-Eula']) {
      device.eula = device.q['X-Device-Eula'];
      if (device.eula.indexOf('additionalDataAllowed') > -1 ) {
        device.additionalDataAllowed = true;
      }
    }

    delete deviceQuery;
    delete devicePage;
    delete deviceTierType;
    delete deviceCountryCode;
  };

  var setThumbnailInfo = function(countryCode) {
    if (config.thumbnailTVShows.indexOf(countryCode) >= 0) {
      device.isLandscape.tvshows = true;
    } else {
      device.isLandscape.tvshows = false;
    }
  };

  var getArrayParsingLanchParams = function(pathParam) {
    var pArray, length, pArray2, checkValue;
    // launchParam 체크
    if (pathParam) {
      pArray = pathParam.split('/');
      length = pArray.length;

      // category/TS|MV|APPSGAME/~~ 인 형태의 3depth 이상일 때
      // 3번째 배열부터는 하나의 contents_id로 인식하게 concat
      if (length > 2) {
        for (var i = 3; i < length; i++) {
          pArray[2] = pArray[2] + '/' + pArray[i];
        }
      }
      // 3번째 배열에 합친 거 까지만 추출
      pArray = pArray.slice(0, 3);

      if (length > 2) {
        // myContents 체크
        if (pArray[2]) {
          // 뒤에 스트링을 '/'로 분해
          pArray2 = pArray[2].split('/');
          checkValue = pArray2[pArray2.length - 1];
          if (checkValue && (checkValue === 'TS' || checkValue === 'MS' || checkValue === 'MV')) {
            pArray2.pop(pArray2.length);
            pArray[2] = pArray2.join('/');
            pArray[3] = checkValue;
          }
        }
      }
      length = null;
      checkValue = null;
      pArray2 = null;
    }
    return pArray;
  };

  var parseLaunchParams = function() {
    var param, launchParams, scopeNames, pageNames, detailPageNames, defaultItems;

    scopeNames = {
      'CATCH_UP_TV': 'tvshows',
      'TVSHOW': 'tvshows',
      'MOVIE': 'movies',
      '3D': '3d',
      'PREMIUM': 'premium',
      'APPSGAMES': 'appsngames',
      'GAME_APPS': 'appsngames',
      'MYPAGE': 'myPage',
      'THEME': 'theme',
      'FEATURED': 'featured'
    };
    pageNames = {
      'tvshows': 'list',
      'movies': 'list',
      '3d': 'list3d',
      'premium': 'premiumList',
      'appsngames': 'listApp',
      'myPage': 'myPage'
    };
    detailPageNames = {
      'tvshows': 'detailList',
      'movies': 'detailList',
      '3d': 'detail3d',
      'premium': 'detailApp',
      'appsngames': 'detailApp',
      'myPage': 'myPage',
      'theme': 'detailTheme'
    };
    defaultItems = {
      'tvshows': 'ME2212',
      'movies': 'ME2312',
      '3d': '_top5',
      'premium': 'premium',
      'appsngames': device.appsngamesModule,
      'myPage': ''
    };
    param = {
      scope: 'featured',
      page: 'featured'
    };
    launchParams = {};
    if (typeof PalmSystem === 'object' && window.PalmSystem.launchParams) {
      launchParams = JSON.parse(window.PalmSystem.launchParams);
      // WOSLQEVENT-92512, WOSLQEVENT-92847 : 이슈 대응 확인
      pmLog.write(pmLog.LOGKEY.LAUNCH_PARAM_LOG, {
        launch_param : window.PalmSystem.launchParams
      });
      pmLog.write('relaunch 3', {
        LogPalmSystem : typeof PalmSystem,
        launch_param : window.PalmSystem.launchParams
      });
      // if adult app, check if the user is adult.
      if (launchParams['query'] && launchParams['query'].indexOf('APPSGAMES') > -1
        && launchParams['isAdultApp'] ) {
        // luna-send -f -n 1 "luna://com.webos.service.membership/getValue" '{"key":"/users/adultAuthStatus"}'
        //버튼클릭시 마다 새로 호출하므로 불필요 WOSLQEVENT-51458 이슈처리
//        $timeout(function(){
//          membership.getAdultStatus();
//        }, 100);
        return true;
      }

      //window.PalmSystem.launchParams = ''; // reload시 launchParams 없어짐 : finishDraw로 이동
      if (!launchParams.result) {
        device.isDeepLink = true; // 메인으로 진입 시 > localstorage : guideProcess에서 사용
        $rootScope.drawer.isDrawerLink = true; // if deepLink, initialize page history.
        pmLog.write('relaunch 4',{});
      }
    }

    //패키지 앱에서 비로그인 상태에서 구매 진입시 구매한 앱 있으면 앱 목록 띄우기 위함
    if (launchParams.result && launchParams.result.existItemInPack) {
      var queryArr = getArrayParsingLanchParams(launchParams.query);
      var appId = undefined;
      if (queryArr[2]) {
        appId = queryArr[2];
        $rootScope.$broadcast('existItemInPack', appId);
      }
    }

    if (launchParams.result && !launchParams.result.succeeded) return false;
    pmLog.write('relaunch 5',{});
    if (launchParams.query) {
      if (launchParams.query === "MVPDList") {
        launchParams.query = "category/PREMIUM";
        device.mvpd = true;
      }
      var arr = getArrayParsingLanchParams(launchParams.query);
      pmLog.write('relaunch 6 : ',arr);
      if (arr[0] === 'category') {
        device.fromDeepLink = true;
        arr = arr.slice(1);
        param.scope = scopeNames[arr[0]];
        pmLog.write('relaunch 7 : ',param.scope);
        if (arr.length === 1) {
          param.page = pageNames[param.scope];
          param.module = defaultItems[param.scope];
          pmLog.write('relaunch 8 param.page', {
            parampage : param.page,
            parammodule : param.module
          });
        } else if (arr[0] === 'MYPAGE' && launchParams.categoryCode === '002') {
          pmLog.write('relaunch 9',{});
          if (focusManager && focusManager.getCurrent() &&
            focusManager.getCurrent().scope && focusManager.getCurrent().scope.scopeName) {
            $rootScope.$broadcast(eventKey.SIGNIN_STATUS_CHANGED, launchParams.result);
            param.page = detailPageNames[param.scope];
          } else {
            // 최초 launch
            device.isDeepLink = true;
            param.page = pageNames[param.scope];
            param.loginInfo = launchParams.result;
          }
        } else {
          pmLog.write('relaunch 10',{});
          // mycontents 에서 header 에 노출되는 컨텐츠와 동일한 컨텐츠를 클릭해서 store 진입 시
          if (arr[0] === 'FEATURED') {
            // Main page의 Theme 가 고정된 상태로 실행 ("query":"category/FEATURED/아이디")
            if (arr.length === 2) {
              param.headerItemId = arr[1];
              // My Contents – LG Store 연관 컨텐츠 연동 ("query":"category/FEATURED/itemId/itemType(TS|MS)")
            } else if (arr.length === 3) {
              param.mycontent = {};
              param.mycontent.itemId = decodeURIComponent(arr[1]); // mycontent에서 encoding해서 넘어옴 ㅡㅡ;
              param.mycontent.itemType = arr[2].replace("MS", "MV");
              console.log('mycontent', param.mycontent);
            }
          } else {
            param.page = detailPageNames[arr[0]];
            param.module = arr[1];
            pmLog.write('relaunch 11 param.page', {
              parampage : param.page,
              parammodule : param.module
            });
            // onnow 상세페이지 유입경로 로깅을 위한 조건
            if ((arr[0] === 'CATCH_UP_TV' || arr[0] === 'TVSHOW' || arr[0] === 'MOVIE') && arr.length === 2) {
              if (launchParams.caller && launchParams.caller.id === 'com.webos.app.voice') {
                // search에서 들어옴 "params":{"query": "category/CATCH_UP_TV", "caller" : {"id" : "com.webos.app.voice", "optional" : "검색어"}}}'
                device.onnowLogging = 'SEARCH|' + (launchParams.caller.optional || '');
              }
              if (arr && arr[1]) {
                $rootScope.lastTryAppId = arr[1].split('|')[0].split('.').pop();
                $rootScope.lastTryContentId = arr[1].split('|')[1];
                $rootScope.pageManager.clearHistory();
              }
            }
            pmLog.write('relaunch 12 param.page', {
              parampage : param.page,
              parammodule : param.module
            });
          }
          if(param.page === undefined && param.scope){
            param.page = detailPageNames[param.scope];
          }
          pmLog.write('relaunch 13 ', {
            parampage : param.page,
            detailPageNames : detailPageNames['appsngames']
          });
          if(param.page === detailPageNames['appsngames']) { // 앱 & 게임 상세화면일 경우 inLink:true 설정추가해야함.
            if ($rootScope.player && $rootScope.player.open && !$rootScope.player.isMovie) {
              $rootScope.player.closePlayer();
            }
            param.inLink = true;
            param.scope = scopeNames['APPSGAMES'];

            if (launchParams.appReturn) {
              if (launchParams.appReturn.appId) {
                $rootScope.lastTryAppId = launchParams.appReturn.appId;
              }
              if (launchParams.appReturn.params && launchParams.appReturn.params.contentTarget) {
                $rootScope.lastTryContentId = launchParams.appReturn.params.contentTarget;
              }
              $rootScope.pageManager.clearHistory();
            }
          }
          pmLog.write('relaunch 14 ', {
            parampage : param.page,
            deviceparampage : device.param.page,
            parammodule : param.module,
            deviceparammodule : device.param.module,
            paramheaderItemId : !param.headerItemId,
            parammycontent : !param.mycontent
          });

          // 리턴되는 페이지와 현재 페이지가 동일하다면 screen fresh 이벤트 호출하여 화면만 갱신하며 새로 그리지는 않음.
          if (param.page === device.param.page && param.module === device.param.module && !param.headerItemId && !param.mycontent) {
            // 다른 앱에서 cursor가 빠지는 경우 hover-mode 제거
            if(!window.PalmSystem.cursor.visibility) {
              document.body.classList.remove("hover-mode");
              var scope = focusManager.getLastFocus().scope;
              var target = focusManager.getLastFocus().target;
              var element = focusManager.getLastFocus().element;
              if(scope && target) {
                scope.setFocusItem(target, element);
              } else {
                scope.setDefaultFocus();
              }
            } else {
              document.body.classList.add("hover-mode");
            }
            pmLog.write('relaunch 15',{});
            $rootScope.$broadcast(eventKey.REFRESH_SCREEN);
            return false;
          }
        }
      }
      param.appReturn = launchParams.appReturn;
      param.categoryCode = launchParams.categoryCode;

      // deeplink로 theme 상세페이지 진입할 때 헤더에서 들어가는 경우는 head = 'Y' 아니면 head='N'
      // luna-send -n 1 luna://com.webos.applicationManager/launch '{"id":"com.webos.app.discovery","params":{"query": "category/THEME/아이템아이디", “head”: “Y”}}'
      // mycontents에서 테마 상세페이지로 deeplink시 head:'Y'로, default는 'N'
      param.head = launchParams.head;
      pmLog.write('relaunch 16',{});
      device.param = param;
      console.log(device.param.mycontent);
      return true;

    } else {
      if (device.param.page === 'featured') {
        device.param = param;
        console.log(device.param.mycontent);
        return true;
      }
      pmLog.write('relaunch 17',{});
      return false;
    }

  };

  var disconnectedNetwork = function() {
    /*쿽스타트모드이고 네트워크 끊기지가 처음이면 네트워크 팝업창 띄워주기*/
    if (device.isQuickStartPlusState && device.isQuickStartPlusPowerState) {
      device.isQuickStartPlusPowerState = false;
      return;
    }

    var requestParam = {
      type: 'popup',
      popupTitle: msgLang.alert_adult_3_4,
      popupBut1: msgLang.no,
      popupButAct1: 'closeNetworkPopup',
      popupBut2: msgLang.yes,
      popupButAct2: 'goNetworkSetting',
      popupDesc: msgLang.alert_adult_3_6
      };
    if (!device.isMainError) $rootScope.popupApp.showPopup($rootScope, requestParam);
    //deleteScopeElement();
    return false;
  };

  var relaunchFlag = false;
  var initialize = function() {
    device.startTime = new Date().getTime();
    $rootScope.initializeCountry = initializeCountry;
    $rootScope.isMainError = isMainError;
    $rootScope.draw = draw;
    $rootScope.pageManager = pageManager;
    $rootScope.isBackPressed = false;

    $document[0].addEventListener('webOSRelaunch', function() {
      // console.log('controller.webOSRelaunch');
      relaunchFlag = true;
      $timeout(relaunch, 200);
    });

    //cursor visibility event listerner
    $document[0].addEventListener('cursorStateChange', function(e) {
      //[WOSLQEVENT-107166] 런처 실행 후 LG Store로 들어오지 않으면 해당 이벤트 실행하지 않도록함.
      //포커스가 LG Store 없을때 원하는 이벤트 안타고 싶게 할때는 device.isBlur 변수 사용 가능.
      if(device.isBlur){
        return;
      }
      console.log("cursor state change : " + e.detail.visibility);
      if (focusManager.getCurrent() &&
        focusManager.getCurrent().scope &&
        focusManager.getCurrent().scope.scopeName === 'player') {
        // trailer 버튼 클릭 이후, 이 부분이 호출됨.
        // player가 뜬 상태인데, MovieShowDetail에 setFocusItem이 호출되는 것을 막기 위해
        // console.log('controller.player.cursorStateChange');
        focusManager.getCurrent().scope.onCursorVisibilityChanged(e.detail.visibility);
      } else if (!e.detail.visibility) {
        document.body.classList.remove("hover-mode");
        var scope = focusManager.getLastFocus().scope;
        var target = focusManager.getLastFocus().target;
        var element = focusManager.getLastFocus().element;
        if (scope && target && target !== 'search') {
          //[WOSLQEVENT-117283] visibilityChange 시 광고 FullScreen 일때 setDefaultFocus 처리로 인해 발화 두번 됨
          //해당 부분 주석 하여도 executeAction 에서 setDefaultFocus 처리로 focus 상실 안함 확인.
          //하지만 광고 FullScreen 일때 포커스 상실 하는 이슈 발생 시 이 부분 확인 요.
          if (scope.setFocusItem !== undefined && scope.setFocusItem !== null) {
            // 광고가 fullscreen인 경우
            if (($rootScope.mainAd && $rootScope.mainAd.fullScreen) || ($rootScope.depth2Ad && $rootScope.depth2Ad.fullScreen)) {
              /*scope = ($rootScope.depth2Ad && $rootScope.depth2Ad.fullScreen) ? $rootScope.depth2Ad : $rootScope.mainAd;
              scope.setDefaultFocus();*/
            } else {
              scope.setFocusItem(target, element);
            }
          }
        } else {
          if (scope && scope.setDefaultFocus !== undefined && scope.setDefaultFocus !== null) {
            scope.setDefaultFocus();
          }
        }
      } else {
        document.body.classList.add("hover-mode");
        //2015-11-03  (key 로 drawer 메뉴에 focus 이동 && 마우스 MOVE && setMouseEvent object가 아닐시) toolTip이 안사라지는 현상 수정
        $scope.tooltip.hideTooltip();
      }
    });

    $document[0].addEventListener('webkitvisibilitychange', visibilityChange);

    window.addEventListener("offline", function() {
      console.log("offline 상태입니다.");

      device.isOnline = false;
      disconnectedNetwork();
    });

    var closeNetworkPopup = function() {
      $rootScope.popupApp.hidePopup();
    };

    var goNetworkSetting = function() {
      $rootScope.popupApp.hidePopup();

      var params = {target : 'network'};
      var requestParam = {appId:'com.palm.app.settings', appLaunchParams:params};
      appLaunch.call(requestParam);
    };

    window.addEventListener("online", function() {
      console.log("online 상태입니다.");
      if ($rootScope.popupApp && $rootScope.popupApp.open && $rootScope.popupApp.title === msgLang.alert_adult_3_4) {
        $rootScope.popupApp.hidePopup();
      }
      // WOSLQEVENT-78207,WOSLQEVENT-77750,WOSLQEVENT-78681 이슈
      // TV off/on시에 Store자동 실행되는 이슈
      device.isOnline = true;
      if (!device.isQuickStartPlusState) {
        // 2015.07.13일 추가된 사항이었으나 [WOSLQEVENT-97487] 이슈를 처리하면서 불필요 구문으로 판단하여 relaunch를 주석처리
        //$timeout(relaunch, 200);
      }else{
        //Quick Start plus상태일 때 앱 다운받다가 TV끄고 다시 켠 경우
        //앱 버튼 재설정해줌
        if (device.currentPage === 'detailApp') {
          $scope.$broadcast('drawFinishedBefore');
        //WOSLQEVENT-95365 이슈
        //메인광고 실행 후 network 해제 후 재연결 시 featured로 들어올 때 network 팝업 hide
        }else if (device.currentPage === 'featured' && $rootScope.popupApp && $rootScope.popupApp.title === msgLang.alert_adult_3_4 ) {
          $rootScope.popupApp.hidePopup();
        }
      }
    });

    window.addEventListener("blur", function() {
      console.log('blur');
      //[WOSLQEVENT-107166] 마우스 포인터가 없어졌을때 없어졌다는 걸 저장하는 변수(LG Store로 들어오면 focus에서 해당 값 false로 설정해줌.)
      //blur일때 LG Stroe에서 이벤트 안타도록해야하기때문에 변수 추가
      device.isBlur = true;
      saveFocus = {item : focusManager.getCurrent().target ? focusManager.getCurrent().target : focusManager.getLastFocus().target, element : document.querySelector('.focus') ? document.querySelector('.focus') : focusManager.getLastFocus().element};
      saveFocus.element.classList.remove('focus');
      $rootScope.tooltip.hideTooltip();
    });

    window.addEventListener("focus", function() {
      console.log('focus');
      device.isBlur = false;
      if (relaunchFlag) {
        // console.log('controller.focus, relaunchFlag=true');

        if (util.isAWSServer()) {
          if (focusManager.getCurrent() &&
            focusManager.getCurrent().scope &&
            (focusManager.getCurrent().scope.scopeName === 'mypage') &&
            saveFocus.item) {
            // [WOSLQEVENT-115631] [Service.SDPService.LGStore_My Page] [Always] [Minor] Focus 사라짐
            // relaunch 하기 전/후에 sign-in status가 변경된 경우, 2nd parameter를 undefined로 보내면
            // myPage.js에서 element를 새로 찾도록
            // 재현경로: myPage, sign-off 상태, sign-in filter -> sign-버튼에 focus -> enter ->
            // membership -> back 키 입력 -> lgstore로 복귀
            // console.log('controller.focus, relaunchFlag=true, myPage');
            focusManager.getCurrent().scope.setFocusItem(saveFocus.item);
          }
        }

        relaunchFlag = false;
        return;
      }
      try {
        if(window.PalmSystem && window.PalmSystem.cursor.visibility) {
          document.body.classList.add('hover-mode');
        }else{
          document.body.classList.remove('hover-mode');
        }
        var scope = $scope;
        var currentFocus = focusManager.getCurrent();
        if (currentFocus && currentFocus.scope) {
          scope = currentFocus.scope;
        }
        /*
         * 현재 scope의 focusItem과 저장된 focusItem이 다를경우에만 setfocus
         *  : 각 scope에서 focuselement가 있을 경우 remove focus 후 focus하므로 focus가 사라졌다가 다시 생기는 문제 발생
         */
//        if(saveFocus.item === '' || saveFocus.item === undefined || saveFocus.item === null) {
//          scope.setFocusItem(currentFocus.target, saveFocus.element);
//        }else if(scope.focusItem !== saveFocus.item) {

          if(saveFocus.element && saveFocus.element.getAttribute('item') !== saveFocus.item) {
            saveFocus.element = focusManager.getLastFocus().element;
          }
          if (saveFocus && (saveFocus.item === 'breadcrumb1' || saveFocus.item === 'breadcrumb2')) {
            // blur 이벤트 발생시, 강제로 focus를 remove했기 때문에,
            // focus 이벤트 발생시에도, 강제로 focus를 add 해야 한다.
            // (breadcrumb은 ng-class를 사용하기 때문에)
            saveFocus.element.classList.add('focus');
          }
          // [WOSLQEVENT-72984] Store실행 후 Home키 or changeItem시 Home키 focus사라짐
          if (util.isAWSServer()) {
            if (((scope.scopeName == 'mainAd' || scope.scopeName == 'depth2Ad') &&
              (document.body.classList.contains('hover-mode'))) ||
              (scope.scopeName === 'featured' && document.querySelector('.focus'))) {

              //do nothing
            } else if (util.isAWSServer() && scope.scopeName === 'mypage') {
              scope.setFocusItem(saveFocus.item);
            } else {
              if (document.body.classList && !document.body.classList.contains('hover-mode')){
                scope.setFocusItem(saveFocus.item, saveFocus.element);
              }
            }
          } else {
            if (((scope.scopeName == 'mainAd' || scope.scopeName == 'depth2Ad') && (document.body.classList.contains('hover-mode'))) || scope.scopeName == 'mypage'
              || (scope.scopeName === 'featured' && document.querySelector('.focus'))) {
              //do nothing
            } else {
              if (document.body.classList && !document.body.classList.contains('hover-mode')){
                scope.setFocusItem(saveFocus.item, saveFocus.element);
              }
            }
          }
//        }
          // 런처실행했다 다시 돌아왔을 때 앱상세페이지의 사용가능한 용량 갱신 [WOSLQEVENT-63798]
          if($rootScope.pmLogValue === pmLog.TYPE.APPGAME){
            $rootScope.$broadcast('changeSpaceInfo');
          }
      } catch(e) {}
    });

    $element.on('mousedown', handleMouseDown);
    $element.on('mouseup', handleMouseUp);
    $element.on('mousemove', handleMouseMove);

    $scope.$on(eventKey.FEATURED_MAIN, setFeaturedMain);
    $scope.$on('finishDraw', finishDraw);
    $scope.$on(eventKey.PAGE_MOVE_ERROR, pageMoveError);

    $scope.$on(eventKey.DEVICE_AUTH, setDeviceAuth);
    $scope.$on(eventKey.DATE_FORMAT, setDateFormat);
    $scope.$on(eventKey.ADULT_STATUS_LOADED, setAdultStatusValue);
    $scope.$on('reloadFeatured', reloadFeatured);

    // 공지사항
    $scope.$on(eventKey.NOTICE_LOADED, popupNotice);
    $scope.$on('goNotification', goNotification);
    $scope.$on('closeNoticePopup', closeNoticePopup);

    //network connection error popup button event listener
    $scope.$on(eventKey.NETWORK_ERROR, disconnectedNetwork);
    $scope.$on('closeNetworkPopup', closeNetworkPopup);
    $scope.$on('goNetworkSetting', goNetworkSetting);

    // for PC test - available cp-list
    $scope.$on(eventKey.CP_LIST, function(e, response) {
      device.availableCpList = response;
    });

    // refresh ad
//    $scope.$on('refreshAD', refreshAD);

    // 언어 변경
    $scope.$on(eventKey.CHANGE_LANGUAGE, popupLangChange); // using from httpHeader
    $scope.$on('langChange', langChange);

    // [공통]팝업 닫기
    $scope.$on('closeAppPopup', closePopup);

    // 최근 history 닫기
    $scope.$on(eventKey.LOCALSTORAGE_MYPAGE_LOCALSTORAGE, function(e, response) {
      console.log('recent history delete', JSON.stringify(response));
    });

    // NCVTDEFECT-2596 getHttpHeaderForRequest 에러 시 : 문구는 임의처리 - 에러 대응
    $scope.$on(eventKey.HEADER_ERROR, function(e) {
      drawMainError(msgLang.alert_adult_3_2, msgLang.alert_error_5);
    });

    keyHandler.registerKeyEvent();

    parseQuery();
    parseLaunchParams();
    server.initialize();
    deviceService.requestInitialServices();
    appService.requestInitialAppServices();

    // WOSLQEVENT-77108, WOSLQEVENT-78960
    quickStartPlus.call();

    // lite버젼 체크
    /*var litePlatForm = []; //['W15B', 'W15L', 'W16N', 'W16R'];
    var platform = device.q['X-Device-Platform'];

    if (litePlatForm.indexOf(platform) > -1) {
      device.isLite = true;
    } else {
      device.isLite = false;
    }*/

    // HD 체크
    if (window.innerWidth < 1300) {
      device.isHD = true;
    } else {
      device.isHD = false;
    }

    // rtl 체크
    var chkLanguage = null;
    chkLanguage = device.q['X-Device-Language'];
    chkLanguage = angular.uppercase(chkLanguage);
    var targetLanguage = ['UR-IN', 'HE-IL', 'KU-ARAB-IQ', 'FA-IR'];
    if (chkLanguage && (targetLanguage.indexOf(chkLanguage) !== -1 || chkLanguage.indexOf('AR-') !== -1)) {
      device.isRTL = true;
      angular.element($document[0].getElementsByTagName('body')).addClass('dir-rtl');
    } else {
      device.isRTL = false;
    }

    // NON_LATIN body class추가
    targetLanguage = ['AR', 'BG', 'EL', 'FA', 'HE', 'HI', 'JA', 'KK', 'KO', 'KU', 'MK', 'RU', 'TH', 'UK', 'ZH', 'CS', 'HU', 'LT', 'LV', 'PL', 'RO', 'SR', 'SL', 'TR', 'VI', 'HA'];
    if (chkLanguage && targetLanguage.indexOf(chkLanguage.substr(0, 2)) !== -1 || chkLanguage === 'EN-JP') {
      angular.element($document[0].getElementsByTagName('body')).addClass('locale-non-latin');
    }

    // 관련 국가별 font적용
    targetLanguage = ['JA', 'HK', 'PL', 'ML', 'OR', 'UR', 'AM', 'PA'];
    if ((chkLanguage && targetLanguage.indexOf(chkLanguage.substr(0, 2)) !== -1) || chkLanguage === 'EN-JP') {
      if(chkLanguage === 'EN-JP') {
        $document[0].getElementsByTagName('html')[0].setAttribute('lang', 'ja');
      } else {
        $document[0].getElementsByTagName('html')[0].setAttribute('lang', angular.lowercase(chkLanguage.substr(0, 2)));
      }

    }
  };

  // local PC
  var requestDeviceAuth = function() {
    var params = {
      api : '/discovery2016/device_auth',
      method : 'get',
      apiAppStoreVersion : 'v7.0'
    };
    try {
      server.requestApi(eventKey.DEVICE_AUTH, params);
    } catch (e) {}
  };

  // local PC
  var setDeviceAuth = function(e, response) {
    device.sessionID = response['authentication']['sessionID'];
    setDateFormat();
  };

  var initializeCountry = function(firstRun) {
    if (!firstRun) {
      // 상세 페이지와 2뎁스 mypage이면 화면을 갱신한다.
      // event를 보내서 view를 관리하는 곳에서 처리하도록 할 것
      console.log('MainController initializeCountry(firstRun: ' + firstRun + ')');
      return;
    }

    // local PC (only first)
    if ((window.location.port === '8080' ||  location.href.indexOf('lgappstv.com') !== -1) && !window.PalmSystem) {
      if (!device.isLocalJSON) {
        util.async(requestDeviceAuth);
      } else {
        setDateFormat();
      }
    } else {
      if (!device.isLocalJSON) {
        util.async(requestDateFormat);
      } else {
        setDateFormat();
      }
    }
  };

  var requestDateFormat = function() {
    // dateformat 이관
//    var params = null;
//
//    params = {
//      api : '/discovery2016/account/dateformat',
//      method : 'get',
//      apiAppStoreVersion : 'v7.0'
//    };
//
//    if (!device.isOpenApi) {
//      params.api = '/discoveryv6/account/dateformat';
//      params.apiAppStoreVersion = 'v6.0';
//    }
//
//    try {
      if (!device.isLocalJSON) {
        // Server용
//        server.requestApi(eventKey.DATE_FORMAT, params);
        setDateFormat();
      } else {
        // local json용
        server.requestDateFormat();
      }
//    } catch (e) {}*/
  };

  var setDateFormat = function() {
    setThumbnailInfo(device.q['X-Device-Country']);

    // TV에서 호출함으로 webOS3.0은 user_delete_all 모두 삭제
    /*if (device.isTv && !device.additionalDataAllowed) {
      storage.deleteRecentAll();
    }*/

    if (!device.isLocalJSON) {
      // Server용
      requestCpList();
      requestFeaturedMain();
    } else {
      // local json용
      delete device.featuredMainData;
      draw();
    }
    membership.getAdultStatus();
    connectionInfo.call();
    adManager.call();
    userID.call();
    powerState.call();
    resolutionRatio.call();
    spaceInfo.call();
    usbList.call();
    userAutoSignIn.call();
    checkAudioGuidance.call();
  };

  var requestDiscovery = function() {
    // My Contents – LG Store 연관 컨텐츠 연동 ("query":"category/FEATURED/itemId/itemType(TS|MS)")
    if (device.param.mycontent) {
      var params = {
        api : '/discovery2016/featured_mycontent',
        method : 'post',
        apiAppStoreVersion : 'v7.0',
        tierType : device.tierType,
        payload : {
          item_id : device.param.mycontent.itemId,
          item_type : device.param.mycontent.itemType
        }
      };
      console.log('mycontents  : ', params);
    } else {
      var params = {
        api : '/discovery2016/featured',
        method : 'post',
        apiAppStoreVersion : 'v7.0',
        tierType : device.tierType
      };
    }
    server.requestApi(eventKey.FEATURED_MAIN, params);
    console.log('device.param.mycontent', device.param.mycontent);
    delete device.param.mycontent;
  };

  var requestFeaturedMain = function() {
    util.async(requestDiscovery);
  };

  var setFeaturedMain = function(e, response) {
    /*// test : 데이터 불량
    response['contentsList'][0].contents = null;
    response['contentsList'][1].contents = null;*/

    //2015-11-05 tvshow 또는 movie의 contents List 가 없을 경우 isMainError 팝업
    //if (response === undefined || (response && response['contentsList'][0] === undefined) || (response['contentsList'][0].contents.length === 0) || (response['contentsList'][1] && response['contentsList'][1].contents.length === 0)) {
    if (!response || (response && !response['contentsList'][0])) {
      $rootScope.isMainError(undefined);
      return;
    }

    // for Loop : 불량 contentsList 제거
    var contLen = response['contentsList'].length;
    for (var i=0; i<contLen; i++){
      if (response['contentsList'][i].category === 'tvshows' || response['contentsList'][i].category === 'movies') {
        if (!response['contentsList'][i].contents || (response['contentsList'][i].contents && response['contentsList'][i].contents.length === 0)) {
          response['contentsList'].splice(i, 1);
          i = -1;
          contLen--;
        }
      }
    }
    i = null;
    contLen = null;

    /*
     * tier check
     * : response의 menulist에 premium만 존재하면 tier3 국가로 판단
     * : menulist 중 movie가 존재하지 않으면 tier2로 판단...
     */
    if (response.menuList) {
      if (response.menuList.length === 1 && response.menuList[0].serviceCode === 'premium') {
        device.tierType = 3;
      } else {
        var movieMenu = response.menuList.filter(function (obj) { return ( obj.serviceCode === 'movies' ); });
        var tvshowMenu = response.menuList.filter(function (obj) { return ( obj.serviceCode === 'tvshows' ); });
        if (movieMenu.length === 0 && tvshowMenu.length === 0) device.tierType = 2;
      }
    }
//    if (device.tierType === 1
//      && response['contentsList'][0]['category'] === 'premium'
//      && response['contentsList'].length === 1) {
//      device.tierType = 2;
//    }

    // TODO : 2015.11.10 tier 1.5 체크 (서버에서 1.5 내려주기 전까지) - 20151103일자 variation기준
//    var tmpNation = ['CA', 'CR', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'PA', 'AR', 'CL', 'PY', 'PE', 'UY', 'CO'];
//    if (tmpNation.indexOf(device.q['X-Device-Country']) > -1) {
//      device.tierType = 1.5;
//    }
//    tmpNation = null;

    // 2016.01.05 : cpMetadataFlag가 있고 'Y'이면 tier1.5 (위 TODO는 운영 미반영으로 남겨 둠)
    if (response.cpMetadataFlag && response.cpMetadataFlag === 'Y') {
      device.tierType = 1.5;
    }

    device.featuredMainData = response;
    if (window.PalmSystem && window.PalmSystem.launchParams) {
      // come back
      var launchParams = JSON.parse(window.PalmSystem.launchParams);
      if (launchParams.query) { // WOSLQEVENT-51658, WOSLQEVENT-51451, WOSLQEVENT-50886, WEBOSDEFEC-9033
        var queryArr = getArrayParsingLanchParams(launchParams.query);
        var map = {
          'APPSGAMES': 'detailApp',
          'GAME_APPS': 'detailApp',
          'PREMIUM': 'premiumList',
          'CATCH_UP_TV': 'detailList',
          'TVSHOW': 'detailList',
          'MOVIE': 'detailList',
          'THEME': 'detailTheme',
          'MYPAGE': 'myPage'
        };
        var page = map[queryArr[1]];
        var module = queryArr[2];
        if (page === 'detailApp' && !queryArr[2]) {
          page = 'listApp';
          module = device.appsngamesModule;
        }
        if (page === 'premiumList' && queryArr[2]) { //WOSLQEVENT-50268 이슈처리
          page = 'detailApp';
        }

        if (device.isDeepLink && page === 'myPage' && device.param && device.param.loginInfo) {
          // myPage에 deepLink를 타고 실행되는 경우, device.param 그대로 사용
          $rootScope.draw(device.param);
        } else {
          $rootScope.draw({
            page: page,
            module: module,
            inLink: true,
            head : launchParams.head // theme 상세페이지 진입에 따른 값
          });
        }
        return;
      }
    }
    draw();
  };

  var draw = function(params) {
    // console.log('controller.draw, params=' + JSON.stringify(params));
    if ($rootScope.breadcrumb && $rootScope.breadcrumb.IsRunning()) {
      console.log('controller.draw, already drawing');
      $rootScope.breadcrumb.executeException = true;
      return;
    }
    if ($rootScope.breadcrumb) {
      $rootScope.breadcrumb.setRunning(true);
    }
    if (!params || params.page === 'featured') {
      // 처음 로딩될 때, maintier page div가 중복되어 생성되는 경우가 있음.
      var obj = $rootScope.pageManager.peekHistory();
      // main page에서 main page 호출 시 return
      // Theme page에서 main page로 이동할 때 이전페이지가 featured이지만 현재 Theme page일 경우는 return되지 않도록 조건 추가
      if (obj && obj.page === 'featured' && device.currentPage !== 'detailTheme') {
        console.log('controller.draw, featured is already drawed');
        return;
      }
    }

    var template, directive;

    // param 파싱해서 어떤 페이지 그려야 하는지 파악
    // 팝업, 로딩, 네트워크 팝업 등 처리 <-- PageController의 callPage 참조

    $rootScope.spinner.showSpinner();
    // 영상 실행되고 있는 경우 앱상세페이지 딥링크로 들어왔을 경우
    if (device.isDeepLink) {
      if ($rootScope.depth2Ad && $rootScope.depth2Ad.show) {
        $rootScope.depth2Ad.hideAD();
      }
      if ($rootScope.mainAd && (!params || params.page !== 'featured')) {
        // [WOSLQEVENT-116452] deeplink로 들어왔을 때 앱 상세페이지로 가기 전 에러났을 경우 팝업뜨고 광고 없어지는 현상
        // 기존에 왜 이렇게 했는지 모르겠지만, fullscreen시에만 체크하고 hideAD는 주석처리
        if ($rootScope.mainAd.fullScreen) {
          $rootScope.mainAd.closeFullScreen();
        }
        //$rootScope.mainAd.hideAD();
      }
    }
    // deep Link
    var d_par = device['param'];
    if (d_par['page'] === 'detailList' && (d_par['module'] && d_par['module'].split('|').length !== 3)) {
      // when deepLink, query is like that. {"query":"category/CATCH_UP_TV/com.lge.meta.crawler.cine21.Cine21Crawler|tv_1614"}
      // so d_par['module'].split('|').length is 2.
      // if we draw detailList in our store app, module is like that. 'TS|com.lge.meta.crawler.cine21.Cine21Crawler|tv_1614'
      device.isDeepLink = true;
      if (d_par['scope'] === 'tvshows')  {
        device['param']['module'] = 'TS' + '|' + device['param']['module'];
        device['param']['inLink'] = true;
        if (params) {
          params['module'] = device['param']['module'];
          params['inLink'] = true;
        }
      } else {
        device['param']['module'] = 'MV' + '|' + device['param']['module'];
        device['param']['inLink'] = true;
        if (params) {
          params['module'] = device['param']['module'];
          params['inLink'] = true;
        }
      }
    }
    // deep Link app&game detail
    if (d_par['page'] === 'detailApp') {
      device.isDeepLink = true;
    }

    if (params) {
      // 2016-02-03 헤더/테마 편성 시, 헤더/테마가 고정된 Featured Page로 이동
      // params가 엎어 씌워져 device.param.headerItemId가 사라짐
      if (device.param.headerItemId) {
        params.headerItemId = device.param.headerItemId;
      }
      device.param = params;
      //처음 페이지 로딩을 제외한 페이지 이동 시 광고영역 handling
//      adManager.adBannerMovePageHandler(params);
      if (params.page === 'featured') {
        var endTime = new Date().getTime();
        //[WOSLQEVENT-77013] search에서 컨텐츠 더블클릭하여 상세페이지 진입 후 백하여 메인페이지 이동할때 상단에
        // device.param.module명이 나오는 이슈 수정
        // 11.23 주석처리 : search뿐만 아니라 deepLink진입 시 pageManager의 preTemplate, postTemplate의 짝이
        // 맞지 않아 (<div main-tier1></div>com.lge.meta.crawler.cine21.Cine21Crawler|tv_5730) angular에서
        // 자동으로 태그생성 >> pageManager 수정 (<div main-tier1>com.lge.meta.crawler.cine21.Cine21Crawler|tv_5730</div>)
        /*if (device.param && device.param.module && device.param.module.length > 0) {
          console.log('remove featured - device.param.module : '+device.param.module);
          //device.param.module = '';
        }*/
        console.info('%c [PERFORMANCE]  : Featured AD API Call TIME : ' + (endTime - device.startTime) + '   ', 'background-color:green;color:white');
        adManager.call('requestContextIndex', '', 'featured');
      }
    }

    template = pageManager.getTemplateFromParam(device.param);

    directive = angular.element(template);

    // 2015-12-11 : pc모드 | sdx 결과 값이 없는 경우 서버 api를 다시 호출하고 있으나
    // 시점차이로 $scope.$on(eventKey.CP_LIST) 이벤트 수신이 page draw보다 느려
    // 일부 device에서 아이콘표시 안되고 회색으로 표시되는 현상
    if (!device.availableCpList) {
      $timeout(function() {
        $element.append($compile(directive)($scope));
      }, 300);
    } else {
      $element.append($compile(directive)($scope));
    }

    try {
      window.PalmSystem.stageReady();
    } catch (e) {}
  };

  var relaunch = function() {
    PalmSystem.activate();

    pmLog.write('relaunch 1', {
      launch_param : window.PalmSystem.launchParams
    });
    // 네트웍이 끊겨 있을 때
    if (!device.isOnline) disconnectedNetwork();

    pmLog.write('relaunch 2',{});

    var parseResult = parseLaunchParams();
    // 파싱 결과가 실패면 리턴!

    pmLog.write('relaunch 18 end : ',parseResult);

    if (!parseResult) return;

    // relaunch 상황에서 해야하는 동작 수행
    console.log('relaunch!');

    // 가이드 화면 띄운 상태에서 deepLink 통해 스토어 진입시 가이드 화면 hide 처리
    // WOSLQEVENT-79553 : guide화면 떳을 경우 이후에 deeplink되지 않는 이슈
    if ($rootScope.guide && $rootScope.guide.isViewGuide) $rootScope.guide.hideGuide();

    // MyContents에서 진입 시
    if (device.param.headerItemId || device.param.mycontent) {
      //$rootScope.$broadcast(eventKey.MYCONTENTS_THEME, device.param);
      window.location.reload();
      return;
    }

    // 기존 Store 화면에 떠있는 popup은 내려야함.
    if ($rootScope.popupApp && $rootScope.popupApp.open) {
      // WOSLQEVENT-104341 LGStore내 메뉴 언어 변경 안됨 (deeplink로 LG Store에 진입한 경우에도 "Reload Page" 팝업 hide 시키지 않음)
      if ($rootScope.popupApp.title !== msgLang.popup_reload_title) {
        $rootScope.popupApp.hidePopup();
      }
    }
    if ($rootScope.player.open) {
      // WOSLQEVENT-93044 : audio 출력 hidePopup에서 closePlayer로 변경
      $rootScope.player.closePlayer();
      //return;
    }
    if ($rootScope.rating.open) {
      $rootScope.rating.hidePopup();
      //return;
    }
    if ($rootScope.prerollAd.show) {
      $rootScope.prerollAd.hidePreroll(true);
    }

    /*[WOSLQEVENT-85467] 최초 퓰스크린 영상 광고 중 deeplink 들어오면 영상이 앞에 나오는 현상이 잇어 hideAD 하였으나
    네트워크 해제/연결 시 relaunch 실행 후 광고 영역이 사라지는 이슈로 인해 fullscreen을 close 하는 것으로 대체*/
    if ($rootScope.mainAd.fullScreen) {
      $rootScope.mainAd.closeFullScreen();
    }
    if ($rootScope.depth2Ad.fullScreen) {
      $rootScope.depth2Ad.closeFullScreen();
    }
    pmLog.write('relaunch 19',{});
    var launchParams = window.PalmSystem.launchParams !== '' ? JSON.parse(window.PalmSystem.launchParams) : '';
    if (launchParams['query'] && launchParams['query'].indexOf('APPSGAMES') > -1
      && launchParams['isAdultApp'] ) {
      // do nothing
    } else {
      var map = {
        'tvshows': 'list',
        'movies': 'list',
        'appsngames': 'listApp',
        'premium': 'premiumList',
        'mypage': 'myPage',
        'featured': 'featured'
      };
      var currPage = device.currentPage? map[device.currentPage] : 'noPage';
      pmLog.write('relaunch 20 ', {
        currPage : currPage,
        deviceparam : device.param,
        deviceparampage :  device.param.page
      });
      if (currPage && device.param && currPage === device.param.page) { // In deepLink, if the current page is same as the deepLink page, return.
        if (device.currentPage === 'tvshows' || device.currentPage === 'movies') {
          if (device.currentPage === device.param.scope) return;
        } else {
          pmLog.write('relaunch 21',{});
          return;
        }
      }
      if (device.param.inLink) { // inLink 값이 존재하면
        pmLog.write('relaunch 22',{});
        $rootScope.draw({
          page: device.param.page,
          module: device.param.module,
          inLink: device.param.inLink,
          head : device.param.head // 테마 상세페이지 진입
        });
      } else if (device.param.page && device.param.module) {
        pmLog.write('relaunch 23',{});
        $rootScope.draw({
          page: device.param.page,
          module: device.param.module,
          headerItemId: device.param.headerItemId,
          head : device.param.head // 테마상세페이지 진입
        });
      // featured 추가 : mycontents 테마일 경우 상단 LG Contents Store버튼 클릭 시 아무이동 안됨
      } else if (device.param.page === 'myPage' || device.param.page === 'featured') {
        pmLog.write('relaunch 24',{});
        $rootScope.draw(device.param);
      }
      pmLog.write('relaunch 25',{});
    }

    // 일반적인 relaunch일때는 cursor확인 후, lastfocus로 이동한다.
    if(!window.PalmSystem.cursor.visibility) {
      document.body.classList.remove("hover-mode");
      var scope = focusManager.getLastFocus().scope;
      var target = focusManager.getLastFocus().target;
      var element = focusManager.getLastFocus().element;
      if(scope && target) {
        scope.setFocusItem(target, element);
      } else {
        scope.setDefaultFocus();
      }
    } else {
      document.body.classList.add("hover-mode");
    }
  };
  var finishDraw = function(e, page, delay) {
    $rootScope.isNewPage = true;  //새로운 페이지 진입 Flag

    //console.log('daniel_after', $rootScope.pmLogValue);
    // 페이지 전환 시 마다 drawer의 selected class 삭제
    if (document.querySelector('.drawer-category.selected')) {
      document.querySelector('.drawer-category.selected').classList.remove('selected');
    }
    // 페이지 전환 시 마다 drawer의 selected class 추가
    var drawerName = $rootScope.pmLogValue;
    if (!$rootScope.pmLogValue || $rootScope.pmLogValue === '' || $rootScope.pmLogValue === 'Main') drawerName = 'featured';
    if (drawerName === 'TVShows') drawerName = 'tvshows';
    if (drawerName === 'Movie') drawerName = 'movies';
    if (drawerName === 'AppGame') drawerName = 'appsngames';
    if (drawerName === 'Premium') drawerName = 'premium';
    if (drawerName === 'MyPages') drawerName = 'mypage';
    // 현재 페이지가 premium, tvshow상세, movie상세이고 detailApp상세 페이지로 이동할 때 premium에 selected가 생성되도록 유도
    if (e.targetScope.scopeName === 'detailApp' &&
      (device.currentPage === 'premium' || device.currentPage === 'TVShowDetail' || device.currentPage === 'MovieShowDetail') &&
      focusManager.getPrevious() &&
      focusManager.getPrevious().scope) {
      drawerName = 'premium';
      //TVshow 나 Movies 에서 시청하기버튼을 눌렀을 경우 미설치된 CP 페이지의 selected 적용.
      if (!focusManager.getPrevious().scope.lastFocusItem && focusManager.getLastFocus().scope.cpList) {
        // 시청가능한 CP가 하나인 경우
        if (focusManager.getLastFocus().scope.cpList[0].premium_app_flag !== 'TRUE'){
          drawerName = 'appsngames';
        }
      } else if (focusManager.getLastFocus().scope.cpList &&
        focusManager.getPrevious().scope.lastFocusItem &&
        (focusManager.getPrevious().scope.lastFocusItem.index >= 0) &&
        // 시청가능한 CP가 여러개인 경우
        focusManager.getLastFocus().scope.cpList[focusManager.getPrevious().scope.lastFocusItem.index] &&
        focusManager.getLastFocus().scope.cpList[focusManager.getPrevious().scope.lastFocusItem.index].premium_app_flag !== 'TRUE') {
        drawerName = 'appsngames';
      }
    }
    // DeepLink로 진입한 경우
    if (e.targetScope.detailAppData) {
      if (device.isDeepLink === true && e.targetScope.detailAppData.bPremium === true) {
        drawerName = 'premium';
      } else if (device.isDeepLink === false && device.previousPage === 'detailApp' && e.targetScope.detailAppData.bPremium === true) {
        drawerName = 'premium';
      }
    }
    if (document.getElementsByClassName('drawer-' + drawerName) && document.getElementsByClassName('drawer-' + drawerName) [0]) {
      document.getElementsByClassName('drawer-' + drawerName)[0].classList.add('selected');
    }
    e.stopPropagation();

    // NCVTDEFECT-1523 : mycontent에서 들어올 시 parseLaunchParams에서 reload시
    // parseLaunchParams에서 window.PalmSystem.launchParams = ''; 주석처리 후 finishDraw로 이동
    if (device.isTv) {
      window.PalmSystem.launchParams = '';
    }

    device.previousPage = page;

    if ($rootScope.mainAd && $rootScope.mainAd.show) {
      $timeout(function() {
        $rootScope.mainAd.hideAD();
      }, 50);
    }

    if ($rootScope.depth2Ad && $rootScope.depth2Ad.show) {
      $timeout(function() {
        $rootScope.depth2Ad.hideAD();
      }, 50);
    }

    // Drawer 에서 Click 된 경우면 history를 초기화 한다.
    if ($rootScope.drawer.isDrawerLink) {
      $rootScope.drawer.isDrawerLink = false;
      pageManager.initHistory();
    }

    // 다음 페이지가 로딩이 끝나면 이 정보를 바탕으로 hiding 이벤트 발생
    $rootScope.$broadcast('hiding', device.currentPage);
    // 페이지 전환이 끝나면 광고 호출
    if (device.param && (device.param.scope === 'appsngames' || (device.param.page === 'listApp' && device.param.module === device.appsngamesModule))) { //main 광고 deep link 로 진입인 경우도 체크
      $timeout(function() {
        //광고 호출되기 전에 다른 페이지로 이동 시 다른 페이지에서 광고 호출되는 문제가 있어 페이지 재확인
        if(device.param && (device.param.scope === 'appsngames' || (device.param.page === 'listApp' && device.param.module === device.appsngamesModule))) {
          var endTime = new Date().getTime();
          console.info('%c [PERFORMANCE]  : 2DEPTH AD API Call TIME : ' + (endTime - device.startTime) + '   ', 'background-color:green;color:white');
          adManager.call('requestContextIndex', '', 'appsngames');
        }
      }, 1000);
    }
    if (device.isTv) {
      if(device.param && (device.param.scope === 'featured' || device.param.page === 'featured')) {
        console.log('controller.js $rootScope.mainAd.src : ' + $rootScope.mainAd.src);
        $rootScope.mainAd.finishdraw = true;
        $timeout(function() {
          if($rootScope.mainAd.src !== '' && !$rootScope.mainAd.show) {
            $rootScope.mainAd.show = true;
            //$rootScope.mainAd.$apply();
          }
        }, 1000);
      } else {
        $rootScope.mainAd.finishdraw = false;
      }
    }
    //page title 같이 no-event 타이틀 같은 경우 자동 marquee 적용한다.
    var noEvnetAry = undefined;
    noEvnetAry = document.getElementsByClassName('no-event');
    if (noEvnetAry.length !== 0) {
      for (var i=0;i<noEvnetAry.length;i++) {
        var target = noEvnetAry[i].getElementsByClassName('marquee')[0];
        if (target) {
          target.classList.add('marquee-start');
          marquee.autoPlay(target);
        }
      }
    }
    //RTL모드에서 english only이면 ltr 클래스 추가
    if (device.isRTL) {
      // RTL모드 설정 후 특수문자 출력 제대로 되지 않음.
      // text 클래스가 없어 적용이 안되어 문제발생
      // 상세페이지의 상세정보에 대한 text처리  RTL모드에서 english only이면 ltr 클래스 추가
      util.rtlClassChange('text');
      util.rtlClassChange('synopsis-text');
      //[WOSLQEVENT-104729] RTL국가인경우 평가하기 버튼 위치 변경해줌.(정찬근 책임님께 위치 가이드 받음)
      var textTagAry = undefined;
      textTagAry = document.getElementsByClassName('popup-contextual pop-rating');
        for (var k=0;k<textTagAry.length;k++) {
          var target = textTagAry[k];
          textTagAry[k].style.left  ='19.3rem';
        }
      }

    $rootScope.drawer.decideLineDisplay(page);
    device.currentPage = page;
    device.fromDeepLink = false;

    var broadcastFinishDrawAppsNGames = function () {
      if (page === 'appsngames') {
        $rootScope.$broadcast('finishDrawAppsNGames');
      }
    };

    if (delay) {
      setTimeout(function() {
        $rootScope.spinner.hideSpinner();
        broadcastFinishDrawAppsNGames();
      }, delay);
    } else {
      $rootScope.spinner.hideSpinner();
      broadcastFinishDrawAppsNGames();
    }
    if (device.firstRun) {
      device.firstRun = false;
    }

    //panel Class의 childNode의 개수 (정상일때 cnt == 2)
    var l = document.querySelectorAll('.panels')[0].childNodes;
    var cnt  = 0;
    for (var i = 0 ; i < l.length ; i++) {
      if(l[i].nodeName === "DIV") cnt++;
    }
    pmLog.write(pmLog.LOGKEY.PANEL_NODE_CNT, {
      nodeCount : cnt
    });
  };

  var visibilityChange = function() {
    if (device.isTv) { // pc mode일 때 무한로딩
      if ($document[0].webkitHidden) {
        // Background 로 내려갈때 현재 audultStatus 보존 (MFTEVENTFT-60509) - Start
        device.auth.prevAdultStatus = device.auth.adultStatus;
        // Background 로 내려갈때 현재 audultStatus 보존 (MFTEVENTFT-60509) - End
        //TODO : 앱 상세이면서 딥링크로 들어와서 실행하는 경우에는 스토어를 종료한다.
        if( device.currentPage === 'detailApp' && device.isDeepLink ) {
          console.warn('앱 상세에서 설치 후 딥링크 실행시 스토어를 종료 합니다.!!!!!!!!!!!!!!!!');
          //window.close();
        }
        if(device.isDeepLinkLaunch && device.isDeepLink) {
          var requestParam = {appId: 'com.webos.app.discovery', appCloseParams: ''};
          appClose.call(requestParam);
        }
        /*[WOSLQEVENT-85667]아래와 같이 hide 할 경우 quickstartplus : ON 일 경우 DC off/on 하면 광고영역이 사라지는 문제 발생
         하여 fullscreen 일경우 closefullscreen 으로 대채*/
        if (device.isQuickStartPlusState && device.isQuickStartPlusPowerOff){
          if ($rootScope.mainAd.fullScreen) $rootScope.mainAd.closeFullScreen();
          if ($rootScope.depth2Ad.fullScreen) $rootScope.depth2Ad.closeFullScreen();
          device.isQuickStartPlusPowerOff = false;
        } else {
          // Background로 이동 시 광고 refresh되므로 동영상 광고의 경우 hide 필요
          if($rootScope.mainAd.show) $rootScope.mainAd.hideAD();
          if($rootScope.depth2Ad.show) $rootScope.depth2Ad.hideAD();
        }
        // 동작 멈춤
        $scope.$broadcast('webkitHidden');
      } else {
        //mouse pointer check
        if(window.PalmSystem && window.PalmSystem.cursor.visibility) {
          document.body.classList.add('hover-mode');
        }else{
          document.body.classList.remove('hover-mode');
        }

        // 동작 시작
        $scope.$broadcast('webkitShowed');
        if($rootScope.pmLogValue === pmLog.TYPE.APPGAME){
          $rootScope.$broadcast('changePurchaseInfo');
        }

        //[WOSLQEVENT-110146] popup 의 tooltip 이 남아 있어 tooltip hide 처리
        $scope.tooltip.hideTooltip();

        /*
         * 비디오 광고 full screen에서 wenkithidden 이벤트 발생 시
         * hover mode에서 비디오 광고에 focus가 사라지지 않는 문제가 발생하여
         * 비디오 광고 hover mode를 disable 하는 css style을 삽입하여 focus가 가지 않도록 한 후
         * 비디오 광고에 실재로 focus가 이동하면 해당 css style을 삭제하여 hover mode 정상동작하도록 함
         */
        //------------------------style 삽입 start--------------------------//
        var sheetCount = document.styleSheets.length;
        var lastSheet = document.styleSheets[sheetCount-1];
        var ruleCount;
        if (lastSheet.cssRules) { // Firefox uses 'cssRules'
            ruleCount = lastSheet.cssRules.length;
        }
        else if (lastSheet.rules) { //IE uses 'rules'
            ruleCount = lastSheet.rules.length;
        }
        var newRule = "body.hover-mode .ad-banner:hover, body.hover-mode .ad-banner.ad-banner-main:hover{ background-color: transparent !important; color: inherit !important; border-color:transparent;}";
        lastSheet.insertRule(newRule, ruleCount);
        //------------------------style 삽입 end--------------------------//

        //focus handle
        var scope = focusManager.getLastFocus().scope;
        var target = focusManager.getLastFocus().target;
        var element = focusManager.getLastFocus().element;

        if(scope && target) {
          if (scope.scopeName == 'mainAd' || scope.scopeName == 'depth2Ad' || scope.scopeName == 'mypage') {
            //do nothing
          } else {
            scope.setFocusItem(target, element);
          }
        }

        // 네트웍이 끊겨 있을 때
        if (!device.isOnline) {
          disconnectedNetwork();
          return;
        }
      }
    }
  };

  var handleMouseDown = function(e) {
    e.stopImmediatePropagation();
    if (focusManager.blockExecution()) return;

    focusManager.setMouseTarget($scope.scopeName);
  };

  var handleMouseUp = function(e) {
    e.stopImmediatePropagation();
    if (focusManager.blockExecution()) return;

    focusManager.setMouseTarget('');
    // target과 무관하게 열려있는 것이 있으면 닫는다
    focusManager.runPreExecution();
  };

  var handleMouseMove = function(e) {
    e.stopImmediatePropagation();
    if (focusManager.blockExecution()) return;
    if (screenX === e.screenX && screenY === e.screenY) return;
    screenX = e.screenX;
    screenY = e.screenY;

    marquee.setTarget(null);
    focusManager.setCurrent($scope, '');
  };

  var appendChildCss = function() {
    var css = document.createElement('style');
    css.type = 'text/css';

    var styles = 'html,body,div{margin:0;padding:0;}';
    styles += 'html{overflow:hidden;font-size:15px;background-color:#000000;-webkit-user-select:none;}';
    styles += 'body{overflow:hidden;position:absolute;left:0;top:0;width:1920px;height:1080px;color:#999;}';
    styles += 'div{pointer-events:none;box-sizing:border-box;-webkit-box-sizing:border-box;}';
    styles += 'img{pointer-events:none;}';
    styles += '.blank{pointer-events:auto;}/* focus 가는 엘리먼트 */';
    styles += '.btn{display:inline-block;overflow:hidden;border:0.333rem solid transparent;border-radius:3.333rem;color:#a6a6a6;background-color:#404040;vertical-align:top;}';
    styles += '.btn.blank:active,';
    styles += '.pressed.btn.blank{border-color:#cf0652;color:#a6a6a6;background-color:#4d4d4d;}';
    styles += '.blank.focus{color:#fff;background-color:#cf0652;}';
    styles += '.btn-large{height:5.667rem;padding:0 2.7rem;text-align:center;}';
    styles += '.btn-large > .area-text{font-size:2.4rem;line-height:2.1;}';
    styles += '.btn > .area-text{display:inline-block;max-width:20rem;height:100%;font-family:"Moon Miso Bold", "Miso", "LG Display-Regular";text-transform:uppercase;vertical-align:top;}';
    styles += '.page{position:absolute;left:0;top:10.8rem;width:128rem;height:61.2rem;padding:0 0 0 7.34rem;background-color:inherit;}';
    styles += '.page.panel-main{top:0;height:72rem;}';
    styles += '.main-error{z-index:2;padding:0;text-align:center;}';
    styles += '.popup-main-error{height:100%;padding-top:20.33rem;background-color:#000;position:relative;}';
    styles += '.wrap-main-error{display:-webkit-box;-webkit-box-orient:vertical;-webkit-box-pack:center;width:82.73rem;height:30.87rem;margin:0 auto;border:0.1rem solid #383839;border-left:none;border-right:none;text-align:center;}';
    styles += '.wrap-main-error > .tit{font-size:6.0rem;font-family: "Moon Miso Medium", "Miso", "LG Display-Light";line-height:1.3;color:#fff;text-transform:uppercase;}';
    styles += '.wrap-main-error > .text{margin:1.5rem 0 2rem;font-size:2rem;font-family: "Moon Museo Sans Bold", "LG Display-Regular";line-height:1.15;color:#a6a6a6;}';
    styles += '.wrap-main-error .area-text{max-width:20rem;width:20rem;}';
    styles += '';
    styles += '.dir-rtl{direction:rtl;}';
    styles += '';
    styles += 'html[lang|="ja"] div{font-family:\'LG Display_JP\' !important;}';
    styles += 'html[lang|="hk"] div{font-family:\'LG Display_HK\' !important;}';
    styles += 'html[lang|="pl"] div{font-family:\'LG Display-Light\' !important;}';
    styles += '@media (max-width:1300px){/* hd media Query로 구분 */';
    styles += 'html{font-size:10px;}';
    styles += 'body{width:1280px;height:720px;}';

    if (css.styleSheet) css.styleSheet.cssText = styles;
    else css.appendChild(document.createTextNode(styles));

    document.getElementsByTagName("head")[0].appendChild(css);
  };

  var drawMainError = function (title, subTitle) {
    appendChildCss();
    var requestParam = {
      button: msgLang.ok,
      lgContentStore: msgLang.title,
      title: title,
      subTitle: subTitle
    };
    $rootScope.spinner.hideSpinner();
    $rootScope.popupMain.showPopup($scope, requestParam);
    $scope.$broadcast('drawErorrMainHeader');
    device.isMainError = true;
  };

  var isMainError = function (response) {
    if (globalMainError || device.isMainError) return;
    if (!device.isOnline) {
      pmLog.write(pmLog.LOGKEY.MAIN_ERROR, {
        info: '!device.isOnline',
        response: JSON.stringify(response)
      });

      drawMainError(msgLang.alert_error_8, msgLang.alert_error_8_1);
      return true;
    } else if (response === undefined || response === null || response === '') {
      pmLog.write(pmLog.LOGKEY.MAIN_ERROR, {
        info: 'response data error',
        response: JSON.stringify(response)
      });

      // 메인화면의 컨텐츠들을 가지고 오지 못할 경우
      drawMainError(msgLang.alert_error_4, msgLang.alert_error_4_1);
      return true;
    } else if (response.headList && response.headList.length === 0) {
      pmLog.write(pmLog.LOGKEY.MAIN_ERROR, {
        info: 'response.headList error',
        response: JSON.stringify(response)
      });

      drawMainError(msgLang.alert_error_4, msgLang.nodata);
      return true;
    } else if (response.errorCode && response.errorCode === 'alert_adult_3_2') {
      pmLog.write(pmLog.LOGKEY.MAIN_ERROR, {
        info: 'response.errorCode error',
        response: JSON.stringify(response)
      });

      drawMainError(msgLang.alert_adult_3_2, msgLang.alert_adult_3_5);
      return true;
    }
  };

  var pageMoveError = function(e, errorParam) {
    if (e.stopPropagation) e.stopPropagation();

    $rootScope.spinner.hideSpinner();
    $rootScope.breadcrumb.setRunning(false);

    if (!device.isMainError) $rootScope.popupApp.showPopup($scope, errorParam);
  };

  /**
   * @param {object} response : luna 성인인증 정보 구독하여 리턴되는 정보
   * @description 로그아웃을 하여 성인인증이 만료되었는지 체크하여 팝업 정보 노출후 메인 페이지로 리로딩한다.
   * */
  var setAdultStatusValue = function(e, response) {

    // if adult app, check if the user is adult.
    if (window.PalmSystem === undefined) return; // for PC
    var launchParams = window.PalmSystem.launchParams !== '' ? JSON.parse(window.PalmSystem.launchParams) : '';

    if (launchParams['query'] && launchParams['query'].indexOf('APPSGAMES') > -1
      && launchParams['isAdultApp']  && device.auth.userID) {
      e.preventDefault();

      var userStatus;

      console.log("openAdultContent >> ", response);
      // 정상적으로 조회한 경우에만 값을 설정한다.(광고 서버와 관련한 오류가 발생하여 방어용으로 사용)
      if(response.returnValue) {
        userStatus = response.value === '' ? 'NOT_LOGIN' : '' + response.value;
        appId = response.itemId;
      }

      if (launchParams.result.errorText === 'User Cancel') {
        window.PalmSystem.launchParams = '';
        return;
      }

      appId = getArrayParsingLanchParams(launchParams.query)[2];
      //앱상세 진입시 쓰는 구문으로 보이는데 쓰이지 않으므로 삭제 2015.09.07 예상치 않은 팝업이 종종 발생하기 때문
      //adultProcess.popOrDraw(userStatus, appId);
      return;
    }

    var requestParam;

    if(response.returnValue === true ) {
      // Hidden 상태에서는 Before 값을 변경하지 않음(MFTEVENTFT-60509) - Start
      var beforeAdultStatus = device.auth.adultStatus;
      // Hidden 상태에서는 Before 값을 변경하지 않음(MFTEVENTFT-60509) - End

      //store 가 back으로 내려가 있는 상태에서만 back으로 내려가기 전의 adult status값으로 현재 adult와 비교 (ex : membership 진입 하여 session 변경)
      //foreground 일 경우는 바로 이전의 adult status와 비교 (ex : 300분 성인인증 만료)
      if($document[0].webkitHidden){
        beforeAdultStatus = device.auth.prevAdultStatus;
      }

      device.auth.adultStatus = response.value === '' ? 'NOT_LOGIN' : '' + response.value;
      //성인인증이 해지 되었을경우..
//      if(beforeAdultStatus === 'Verified' && beforeAdultStatus !== device.auth.adultStatus){
//        requestParam = {
//          type: 'popup',
//          popupTitle: msgLang.alert_adult_9,
//          popupBut1: msgLang.ok,
//          popupButAct1 : 'reloadFeatured',
//          popupDesc: msgLang.alert_adult_9_1
//        };
//        $rootScope.popupApp.showPopup($rootScope, requestParam);
//      }
    }else{
      device.auth.adultStatus = 'NOT_LOGIN';
    }
  };

  // 공지사항 팝업
  var popupNotice = function(e, response) {
    // response.noticeList.popupNotice 는 toast
    // actionType가 'com.webos.app.discovery'이 LG Store
    var storeId = 'com.webos.app.discovery';
    if (response.noticeList && response.noticeList.popupNotice && response.noticeList.popupNotice.notice) {
      var len = response.noticeList.popupNotice.notice.length;
      var notice = response.noticeList.popupNotice.notice;
      var storeNotice = {};
      var arrNotice = [];
      var pos = -1;

      for (var i=0; i < len; i++) {
        //if (notice[i].actionType === storeId) {
          storeNotice.title = notice[i].title.split('<br>')[0]; // 제목<br>내용
          storeNotice.description = notice[i].title.split('<br>')[1];
          storeNotice.storageKey = notice[i].title;
          storeNotice.date = notice[i].date;
          arrNotice.push(storeNotice);
          storeNotice = {};
        //}
      }

      // 2개 이상일 경우 정렬(최신)
      arrNotice.sort(function(left, right) {
        return left.date > right.date ? -1 : (left.date < right.date) ? 1 : 0;
      });

      var arLen = arrNotice.length;
      for(i=0; i<arLen; i++) {
        // store에 저장되어 있는지 체크
        if (arrNotice[i].title && !storage.isNoticeRead(arrNotice[i].storageKey)) {
          if (pos === -1) pos = i; // 2015.09.08 UX : 여러개일 경우 실행 기준 최신 1개만 노출 (나머지는 localstorage에 write처리)
        }
      }

      // 공지사항 띄움
      if (pos > -1) {
        var requestParam = {
          type : 'popup',
          popupTitle : arrNotice[pos].title,
          popupDesc : arrNotice[pos].description,
          popupBut1 : msgLang.popup_button_gotonoti,
          popupButAct1 : 'goNotification',
          popupBut2 : msgLang.close,
          popupButAct2 : 'closeNoticePopup'
        };
        if (!device.isMainError) {
          $timeout(function() {
            $rootScope.popupApp.showPopup($rootScope, requestParam);
          }, 400);

          var checkPopupNotice = setInterval(function() {
            if($rootScope.popupApp && $rootScope.popupApp.open && $rootScope.popupApp.title === arrNotice[pos].title) {
              clearInterval(checkPopupNotice);
              var focusElemet = document.querySelectorAll('.wrap-btn-popup')[0];
              if (focusManager.getCurrent().scope && focusManager.getCurrent().scope.scopeName && focusManager.getCurrent().scope.scopeName !== 'popupApp') {
                /*공지사항 외에 다른곳에 포커스 갔을 때*/
                focusManager.setCurrent($rootScope.popupApp, focusElemet.children[focusElemet.children.length-1].getAttribute('item'));
              }
              /*공지사항에 focus class가 없을 때*/
              if(util.isAWSServer()) {
                if (focusManager.getCurrent().scope.scopeName != 'popupApp') {
                  focusManager.setCurrent($rootScope.popupApp, focusElemet.children[focusElemet.children.length - 1].getAttribute('item'));
                }
              }else{
                /*공지사항에 focus class가 없을 때*/
                var popupFocus = false;
                for (i = 0; i < focusElemet.children.length; i++) {
                  if (focusElemet.children[i].querySelector('.focus')) {
                    popupFocus = true;
                    break;
                  }
                }
                if (!popupFocus) {
                  /*버튼 마지막에 focus*/
                  focusElemet.children[focusElemet.children.length - 1].classList.add('focus');
                }
              }
            }
            }, 100);

        }

      }
    }
  };

  // notificatiioncenter app으로 가기
  var goNotification = function() {
    $rootScope.popupApp.hidePopup();
    noticeManager.call();
  };

  // 공지사항 닫기
  var closeNoticePopup = function() {
    $rootScope.popupApp.hidePopup();
  };

  /**
   * @description 메인화면을 리로딩한다.
   * */
  var reloadFeatured = function () {
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();

    // 성인인증 만료 팝업 후 현재 scope이 메인일 경우는 다시 그리지 않음.(중복 element방지)
    if ($rootScope.pmLogValue === pmLog.TYPE.MAIN) return;

    $rootScope.spinner.showSpinner();
    $timeout(function() {
      $rootScope.drawer.isDrawerLink = true;
      $rootScope.draw({page: 'featured', scope: 'featured'});
    }, 200);
  };

  // refresh ad
  var refreshAD = function() {
    console.log("refreshAD : " + $rootScope.mainAd.src);
    if(device.param && device.param.scope === 'featured') {
      $timeout(function() {
        if($rootScope.mainAd.src !== '') {
          $rootScope.mainAd.show = true;
        }
      }, 1000);
    }
  };

  // Lanaguage 변경시에 처리할 function
  var fullLanguageCode ='';
  var popupLangChange = function(e, response) {
    fullLanguageCode = response;

    // WOSLQEVENT-100680 : 언어변경 팝업 시 Back키 눌렀을 경우 재현
    device.isChangedLanguage = true; // close 시 객체 삭제
    requestParam = {
      type: 'popup',
      popupTitle: msgLang.popup_reload_title,
      popupBut1: msgLang.ok,
      popupButAct1 : 'langChange',    // 메인화면을 리로드
      popupDesc: msgLang.popup_reload_content
    };
    //이상의 연구원 요청(UX팀)
    //설정에서 언어/국가 설정 변경한 경우 팝업 제공하지 않고 바로 앱 refresh 하는 것으로 개발 수정 요청
      //if (!device.isMainError) $rootScope.popupApp.showPopup($rootScope, requestParam);
    langChange();
  };

  var langChange = function () {
    var arr, queries = window.location.search.slice(1).split('&');
    var newQueries = "";

    // for TV
    if (queries.length > 0) {
      for (i = 0; i < queries.length; i++) {
        if(i > 0) {
          newQueries += "&";
        }
        arr = queries[i].split('=');
        if (arr[0] == 'q') {
          var deviceHeader = JSON.parse(decodeURIComponent(arr[1]));
          deviceHeader["X-Device-Language"] = fullLanguageCode;
          newQueries += 'q=' + encodeURIComponent(JSON.stringify(deviceHeader));
        } else {
          newQueries += arr[0] + "=" + arr[1];
        }
      }
    }

    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
    fullLanguageCode = null;
    delete device.isChangedLanguage;

    location.href = location.origin + location.pathname + "?" + newQueries;
  };

  var requestCpListToServer = function() {
    var params = {
      api : '/discovery2016/cp-list',
      method : 'post',
      apiAppStoreVersion : 'v7.0'
    };
    server.requestApi(eventKey.CP_LIST, params);
  };

  var requestCpList = function() {
    if (!window.PalmSystem) { // for PC test
      requestCpListToServer();
      return;
    }

    // 2015-12-09 : SDX 호출로 cache처리
    getCpList.call(function(availableCpList) {
      // callback
      // console.log('controller.getCpList, availableCpList=' + JSON.stringify(availableCpList));

      if (availableCpList &&
        availableCpList.app_count &&
        (availableCpList.app_count > 0)) {
        device.availableCpList = availableCpList;
      } else {
        // luna call로 읽어온 cp list가 비어있는 경우
        requestCpListToServer();
      }
    });
  };

  var closePopup = function() {
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
  };

  initialize();
});
