app.directive('appDetail', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'appDetailController',
    template: detailAppTmpl
  };
});

app.controller('appDetailController', function($scope, $controller, $element, $rootScope, $timeout, server, focusManager, keyHandler, marquee, util, device, app, getAppInfo, getAppPurchase, appLaunch, getInstallCapacity, appInstall, appInstallCancel, nsuUpdateStatus, membership, toast, appUpdateCheck, storageCapacity, usbList, storage, appService, billing, getPackageInstallCapacity, packageAppInstall, pmLog, eventKey, timeOutValue, adultProcess, spaceInfo, userID, appClose, audioGuidance, util, nsuGetCurStatus, restartTV) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var STEP_POSITION = 100;

  var focusElement = null;
  var lastFocus = {};
  var lastItemFocus = {};
  var lastItemMenuFocus = {}; // install
  var scroll = null;
  var scrollBar = {};
  var maxPosition = 0;
  var pageHeight = 0;
  var scrollByKey = false;
  var destroyInfo = {scope : $scope, element : $element};
  var isFirst = false;
  // en-US일 경우 msgLang예외 적용
  var msgEnUS1 = 'This app is installable only in internal memory, Try again after deleting unnecessary files in TV internal memory.';
  var msgEnUS2 = 'Storage Selection';
  var tempCurrHost = device.q['HOST'].split('.')[0];
  var shelfName = null;
  var shelfFlag = false;
  var isRunningApp = false;
  var isButtonSetting = false;
  var useRatingBtn = true;

  $scope.toBeDelScope = null;
  $scope.toBeGoScope = null;
  $scope.scopeName = 'detailApp';
  $scope.focusItem = '';
  $scope.defaultFocusItemClass = '';
  $scope.actBtntxt = '';
  $scope.progressPercent = 0;
  $scope.direct = false;
  $scope.showing = false;
  $scope.hiding = false;
  $scope.spinner = false;
  $scope.sort = '';
  $scope.rate = false;
  $scope.row = [];
  $scope.drawed = false;
  $scope.recommendData = null;
  $scope.detailAppData = null;
  $scope.packageData = null;
  $scope.packageAppList = [];
  $scope.fromPopUp = false;
  $scope.appPriceTxt = msgLang.apps_price;
  $scope.eventDateTxt = msgLang.apps_event;
  $scope.updateTxt = msgLang.apps_updated;
  $scope.sizeTxt = msgLang.apps_size;
  $scope.versionTxt = msgLang.apps_version;
  $scope.rateTxt = msgLang.rating;
  //TODO 번역이 완료되면 수정해야함.
  $scope.sellerEmailTxt = msgLang.apps_label_contactseller.replace(": [CONTACT SELLER]","");
  $scope.sellerNameTxt = msgLang.sdp_apps_015;
  $scope.cate01Txt = msgLang.apps_category01;
  $scope.detailsTxt = msgLang._3d_details;
  $scope.sellerTxt = msgLang.sdp_apps_015;
  $scope.availableStorageTxt = msgLang.apps_label_storage;
  $scope.ratingsTxt = msgLang.ratings;
  $scope.apps_inapp_1_1Txt = msgLang.apps_inapp_1_1;
  $scope.moreTxt = msgLang.more;
  $scope.closeTxt = msgLang.less;
  $scope.screenshotsTxt = msgLang.apps_screenshots;
  $scope.systemRequireTxt = msgLang.apps_systemRequirement;
  $scope.capabilityInternetTxt = msgLang.apps_capability_useInternet;
  $scope.capability3dTxt = msgLang.apps_capability_use3d;
  $scope.capabilityMagicTxt = msgLang.apps_capability_useMagic;
  $scope.capabilityCameraTxt = msgLang.apps_capability_useCamera;
  $scope.capabilityGamePadTxt = msgLang.apps_capability_useGamePad;
  $scope.packageDescTxt = msgLang.apps_desc_package;
  $scope.packageTitle = msgLang.apps_applist;
  $scope.closeTxt = msgLang.less;
  $scope.ratingTxt = msgLang.rateThis;
  $scope.rateText = msgLang.alert_rate_1;
  $scope.okTxt = msgLang.ok;
  $scope.cancelTxt = msgLang.cancel;
  $scope.useCapability = false;
  $scope.useGamePad = false;
  $scope.useInternet = false;
  $scope.use3d = false;
  $scope.useCamera = false;
  $scope.useMagic = false;
  $scope.useDescMore = false;
  $scope.useScreenShot = false;
  $scope.useSingleApp = false;
  $scope.usePackageApp = false;
  $scope.useProgressbar = false;
  $scope.countryCode = device.countryCode;
  $scope.languageCode = device.languageCode;
  $scope.appStatusList = app.appStatusList;
  $scope.packageAppStatusList = app.packageAppStatusList;
  $scope.usbListData = app.usbListData;
  $scope.appId = undefined;                     //app 아이디
  $scope.installCheckType = undefined;          //install 체크 타입
  $scope.updateCheckType = undefined;           //update 체크 타입
  $scope.bPurchased = undefined;                //결제 여부
  $scope.launchContentId = undefined;           //실행시 컨텐츠 아이디
  $scope.appLaunchParams = undefined;           //앱 실행 파라미터
  $scope.isFirst = false;                       //딥링크로 처음 진입
  $scope.isRunAct = false;                      //실행 여부
  $scope.isDeepLink = false;                    //딥링크 여부
  $scope.isDestroy = false;
  $scope.isNsuChecked = false;                  //nsu 체크 진행여부
  $scope.isAutoUpdate = false;                  //자동 업데이트
  $scope.isEvnet = false;
  $scope.isLogin = device.auth.userID ? true : false;
  $scope.spaceTotalSize = device.spaceTotalSize;
  $scope.spaceAvailableSize = parseInt(device.spaceFreeSize.split(' '));
  $scope.isAdult = false;
  $scope.useRating = true;
  $scope.isInLink = $rootScope.pageManager.getLink();
  $scope.historyBack = $rootScope.pageManager.getTitle('back');
  /*  패키지 앱별 인스톨 여부 체크 배열 */
  $scope.installedCheckArray = undefined;
  $scope.installedAppIdArray = undefined;
  $scope.installedAppIdJson = undefined;
  $scope.enableButton = true;
  $rootScope.pmLogValue = pmLog.TYPE.APPGAME;
  $scope.packageAppIndex = 0;
  $scope.scroll = undefined;
  $scope.moveFlagDuringButtonSet = false;

  $scope.usbStatus = '';
  $scope.isRatingRes = false;               //[WOSLQEVENT-82869] 앱평가하고 서버단에서 응답이 늦게 올 경우 대비해 평가하기 응답 Flag 추가

  $scope.onMouseUp = function() {
    if (!$rootScope.rating.inPopup) {
      $rootScope.rating.hidePopup();
    }
  };
  // updateInstallStatus 함수 안에 방어코드를 위한 전역변수
  $scope.preScopeId = 0;
  $scope.nextScopeId = 0;

  $scope.setFocusItem = function(item, element) {
    //[WOSLQEVENT-110153] Search 클릭하여 앱상세로 들어올 경우 device.currentPage 값을 설정안해주므로
    //deeplink로 들어오고 device.param.page가 앱상세일경우 포커스주게함.
    if(device.param.page === 'detailApp' && device.param.inLink) {
      device.currentPage = 'detailApp';
    }
    //[WOSLQEVENT-110200] 평가하기 포커스 상태에서 App 삭제 후 store 진입 시 disabled 된 평가하기 버튼에 focus 있을경우 return;
    if (item === 'rating' && element.classList.contains('disabled')) return;
    if(device.currentPage !== 'detailApp') {
      if (device.currentPage !== 'appsngames') return;    // 앱상세에 처음 진입할 때 DOWNLOADING/INSTALLING/ 상태에서 appsngames 로 들어오기 때문에 조건 추가
    }
    //평가하기에 포커스되어 있고, 이미 평가한 팝업이 떠있는 상태이면 포커스 이동을 하지 않는다.
    if (item !='rating' && lastFocus.item === 'rating' && $rootScope.rating.alreadyRating && $rootScope.rating.open && !$rootScope.rating.hide) {
      return;
    }
    // 팝업창이 떠있는 상태이면 포커스 이동을 하지 않는다.
    if (!$rootScope.popupApp.hide) return;
    // 인스톨 버튼이 disable 상태이면 포커스 이동을 하지 않는다.
    if (item == 'button' && !$scope.enableButton) return;
    //detailapp $element에 없는 item element면 return
    if (element) {
      var elementItem = element.getAttribute('item');
      var elCheck1 = $element[0].querySelector('[item="'+elementItem+'"]');
      if (elCheck1 === undefined || elCheck1 === null) {
        return;
      }
    }
    if (item) {
      var elCheck2 = $element[0].querySelector('[item="'+item+'"]');
      if (elCheck2 === undefined || elCheck2 === null) {
        return;
      }
    }

    if (lastFocus.item === 'back') $rootScope.tooltip.hideTooltip();

    $scope.focusItem = item;

    if (focusElement) focusElement.classList.remove('focus');

    //2016.03.07 [WOSLQEVENT-104101] LG Store -> PACKAGE TEST 2(패키지 앱) -> 설치 완료 -> Launcher 에서 멤버앱 삭제 -> Back 키 입력하여 LG Store 복귀시 Focus사라짐
    //패키지 앱 일때 앱록목에 포커스준후에 앱 삭제하고 LG Store 복귀하면 포커스가 없어짐.
    //element 를 정상적으로 가지고 오나 화면에 포커줄 element 인지 인식을 못함.
    if( item ) element = elCheck1;

    focusElement = element;
    if (focusElement) focusElement.classList.add('focus');

    if (item && element) {
      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
      focusManager.setCurrent($scope, item, element);

      lastFocus.item = item;
      lastFocus.element = element;
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }

    if ($scope.focusItem && $scope.focusItem === 'back') {
      $scope.historyBack = $rootScope.pageManager.getTitle('back');
      $rootScope.tooltip.showTooltip(50, 107, $rootScope.pageManager.getTitle('back'), true, true);
    } else if ($scope.focusItem && $scope.focusItem.indexOf('item') >= 0) {
      //이전에 포커스된 아이템 컨텐츠를 저장하여 back 버튼에서 돌아올 경우 이전에 포커스된 아이템 컨텐츠로 이동한다.
      lastItemFocus.item = lastFocus.item;
      lastItemFocus.element = lastFocus.element;
      lastItemFocus.isFrom = true;
      lastItemMenuFocus.isFrom = false;
    } else if ($scope.focusItem && $scope.focusItem === 'button') {
      // install -> rating -> install (in order to come back)
      lastItemMenuFocus.item = lastFocus.item;
      lastItemMenuFocus.element = lastFocus.element;
      lastItemMenuFocus.isFrom = true;
    }
  };

  $scope.audioGuidance = function (scope, target, element) {
    //audioGuidance 호출 params
    if (!element) return;  //여러곳에서 setCurrent를 많이 호출해서 막음.
    if (util.isAWSServer()) {
      //audioGuidance 호출 params
      var params = {
        text: '',
        clear: true,
        duplication: false
      };
    } else {
      //audioGuidance 호출 params
      var params = {
        text: '',
        clear: true
      };
    }
    var enterSound = '';

    if (element && (element.innerText === msgLang.more || element.innerText === msgLang.less)) {
      params.text = element.innerText;  //'more' or 'less'

      //shelf name
      if (element.parentElement && element.parentElement.querySelector('.sec-title.detail-title') && element.parentElement.querySelector('.sec-title.detail-title').innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector('.sec-title.detail-title').innerText;
      }
      //category
      if (element.parentElement && element.parentElement.querySelector("[ng-bind='detailAppData.categoryName']") && element.parentElement.querySelector("[ng-bind='detailAppData.categoryName']").innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector("[ng-bind='detailAppData.categoryName']").innerText;
        //[WOSLQEVENT-121904] In-app Item 인 경우 별점표시가 안되어있어 오디오 발화 안되어야함.
        if (!scope.detailAppData.bItem) {
          //별점
          if ($scope.detailAppData.evaluationAverage >= 0 && !$scope.detailAppData.bPremium) {
            params.text += '. ';
            if($scope.detailAppData.evaluationAverage == 0){
              params.text += 0;
            } else{
              params.text += ($scope.detailAppData.evaluationAverage / 2).toFixed(1);
            }
            params.text += ' stars';
          }
        }
      }
      //ratings : number
      if (element.parentElement && element.parentElement.querySelector(".synopsis-grade-num") && element.parentElement.querySelector(".synopsis-grade-num").innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector(".synopsis-grade-num").innerText;
      }
      //seller
      if (element.parentElement && element.parentElement.querySelector("[ng-if='detailAppData.sellerName']") && element.parentElement.querySelector("[ng-if='detailAppData.sellerName']").innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector("[ng-if='detailAppData.sellerName']").innerText;
      }
      //contact seller
      if (element.parentElement && element.parentElement.querySelector("[ng-if='detailAppData.sellerEmail']") && element.parentElement.querySelector("[ng-if='detailAppData.sellerEmail']").innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector("[ng-if='detailAppData.sellerEmail']").innerText;
      }
      //description
      if (element.parentElement && element.parentElement.querySelector(".synopsis-text.app-detail-text") && element.parentElement.querySelector(".synopsis-text.app-detail-text").innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector(".synopsis-text.app-detail-text").innerText;
      }
    } else if (target === 'btnState') {
      params.text = element;
      isRunningApp = true;
    }

    if (params.text.length > 0) {
      //[WOSLQEVENT-118771]재평가 가능하게 바뀌어 해당 부분 필요없음음
      //이미 평가완료한 경우 rate this button 으로 focus 됨
      //하여 popup 문구를 다 읽고 focus button 을 읽도록 clear = false;
      /*if ($rootScope.rating.alreadyRating || isRunningApp) {
       params.clear = false;
       }*/

      audioGuidance.call(params);
      return;
    }

    //최초 화면 진입 시 나오는 음성
    if ($rootScope.isNewPage) {
      if (scope.getScopeElement()[0]) {
        var tmpElement = scope.getScopeElement()[0];
        if (tmpElement.querySelector('.panel-header .text') && tmpElement.querySelector('.panel-header .text').innerText.length > 0) {
          enterSound = tmpElement.querySelector('.panel-header .text').innerText;
        }
        //최초 진입 시 details Text 읽어주기
        if (enterSound.length > 0) {
          //shelf name
          if (element.parentElement.parentElement.querySelector("[ng-bind='detailsTxt']") && element.parentElement.parentElement.querySelector("[ng-bind='detailsTxt']").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.querySelector("[ng-bind='detailsTxt']").innerText;
          }
          //category
          if (element.parentElement.parentElement.querySelector("[ng-bind='detailAppData.categoryName']") && element.parentElement.parentElement.querySelector("[ng-bind='detailAppData.categoryName']").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.querySelector("[ng-bind='detailAppData.categoryName']").innerText;
            //[WOSLQEVENT-121904] In-app Item 인 경우 별점표시가 안되어있어 오디오 발화 안되어야함.
            if (!scope.detailAppData.bItem) {
              //별점
              if ($scope.detailAppData.evaluationAverage >= 0 && !$scope.detailAppData.bPremium) {
                enterSound += '. ';
                if($scope.detailAppData.evaluationAverage == 0){
                  enterSound += 0;
                } else{
                  enterSound += ($scope.detailAppData.evaluationAverage / 2).toFixed(1);
                }
                enterSound += ' stars';
              }
            }
          }
          //ratings : number
          if (element.parentElement.parentElement.querySelector(".synopsis-grade-num") && element.parentElement.parentElement.querySelector(".synopsis-grade-num").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.querySelector(".synopsis-grade-num").innerText;
          }
          //seller
          if (element.parentElement.parentElement.querySelector("[ng-if='detailAppData.sellerName']") && element.parentElement.parentElement.querySelector("[ng-if='detailAppData.sellerName']").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.querySelector("[ng-if='detailAppData.sellerName']").innerText;
          }
          //contact seller
          if (element.parentElement.parentElement.querySelector("[ng-if='detailAppData.sellerEmail']") && element.parentElement.parentElement.querySelector("[ng-if='detailAppData.sellerEmail']").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.querySelector("[ng-if='detailAppData.sellerEmail']").innerText;
          }
          //description
          if (element.parentElement.parentElement.querySelector(".synopsis-text.app-detail-text") && element.parentElement.parentElement.querySelector(".synopsis-text.app-detail-text").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.querySelector(".synopsis-text.app-detail-text").innerText;
          }
        }
        $rootScope.isNewPage = false;
      }
    }

    if (util.isAWSServer()) {
      shelfName = null;
      if (element && element.classList.contains('focus') && !element.classList.contains('btn')) {
        if (element.parentElement.parentElement.querySelector('.sec-title.detail-title') && element.parentElement.parentElement.querySelector('.sec-title.detail-title').innerText.length > 0) {
          shelfName = element.parentElement.parentElement.querySelector('.sec-title.detail-title').innerText;
          shelfFlag = true;
        }
      }
    } else {
      var tmpShelfName = null;
      if (element && (element.parentElement.querySelector('[class*=item-preview].focus') || element.parentElement.querySelector('[class*=item-recomm].focus'))) {
        if (element.parentElement.parentElement.querySelector('.sec-title.detail-title') && element.parentElement.parentElement.querySelector('.sec-title.detail-title').innerText.length > 0) {
          tmpShelfName = element.parentElement.parentElement.querySelector('.sec-title.detail-title').innerText;
        }
        if (tmpShelfName !== shelfName) {
          shelfName = tmpShelfName;
          shelfFlag = true;
        }
      } else {
        shelfName = '';
      }
    }

    var itemName = null;
    if (element && element.querySelector('.focus .text')) {
      if (shelfFlag) {
        itemName = shelfName;
        shelfFlag = false;
      }

      if (itemName) {
        itemName += '. ';
        itemName += element.querySelector('.focus .text').innerText;
      } else {
        itemName = element.querySelector('.focus .text').innerText;
      }

      if (itemName && element.classList.contains('btn')) {
        itemName += '. ';
        itemName += msgLang.audio_button_button;
      }
    } else if (shelfFlag) {
      itemName = shelfName;
      shelfFlag = false;
      if (util.isAWSServer()) {
        params.duplication = true;
      }
    }

    if (enterSound.length > 0) {
      params.text = enterSound;
      params.text += ". ";
      params.text += itemName;
    } else if (itemName) {
      params.text = itemName;
    } else {
      return;
    }

    //[WOSLQEVENT-118771]재평가 가능하게 바뀌어 해당 부분 필요없음음
    //이미 평가완료한 경우 rate this button 으로 focus 됨
    //하여 popup 문구를 다 읽고 focus button 을 읽도록 clear = false;
    /*if ($rootScope.rating.alreadyRating || isRunningApp) {
     params.clear = false;
     }*/
    audioGuidance.call(params);
  };

  $scope.recoverFocus = function() {
    if (lastFocus.item && lastFocus.element){
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
    } else {
      $scope.setDefaultFocus();
    }
  };

  preExecuteBackCallback = function() {
    $scope.setFocusItem('', null);
    marquee.setTarget(null);
//    focusManager.setCurrent($scope, '');  //[WOSLQEVENT-59194] 앱 상세에서 앱 리스트로 이동 시(back키) 포커스 상실
    obj = $rootScope.pageManager.popHistory();
    if (obj.page === 'listApp') device.isBreadcrumbsClicked = true;
    $scope.toBeGoScope = obj.module;
    $rootScope.draw(obj);
  };

  var doRateAction = function () {
    var didPurchase, didInstall, dataClickAct, requestParam;
    $scope.setFocusItem('', null);
    //초기화
    didPurchase = true;
    didInstall = true;
    dataClickAct = $element[0].getElementsByClassName('btn-large')[0].getAttribute('data-click-act');
    //유료 app일 경우
    if($scope.detailAppData.price > 0) {
      if($scope.detailAppData.bPurchased === 'N' || !$scope.detailAppData.bPurchased) {
        didPurchase = false;
        didInstall = false;
      }else {
        didPurchase = true;
        didInstall = true;
      }
    //무료 app일 경우
    }else {
      didPurchase = true; //무료 앱 같은 경우 구매할 필요가 없으므로 didPurchase를 true로 설정.
    }
    // 평가하기 버튼은 무조건 구매/설치가 되어야 평가하기를 할 수 있다.(기구매일 경우도 설치를 꼭 해야지 평가 가능)
    if (dataClickAct !== 'launch') {
      didInstall = false;
    }
    // 구매 후 평가 가능
    if (!didPurchase) {
      requestParam = {
        type: 'popup',
        popupTitle: msgLang.alert_rate_5,
        popupBut1: msgLang.ok,
        popupButAct1 : 'closeAppPopup',
        popupDesc: msgLang.alert_adult_2_4
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    // 설치 후 평가 가능
    } else if (!didInstall) {
      requestParam = {
        type: 'popup',
        popupTitle: msgLang.alert_rate_5,
        popupBut1: msgLang.ok,
        popupButAct1 : 'closeAppPopup',
        popupDesc: msgLang.alert_adult_2_5
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    // 평가하기 팝업
    } else {
      requestParam = {
        appId: $scope.detailAppData.id,
        bPurchased: $scope.detailAppData.bPurchased,
        price: $scope.detailAppData.price
      };
      $rootScope.rating.showRating($scope, requestParam);
    }
  };

  var lunaFailedPopup = function() {
    var errorCode = 'LUNA FAILED'; // Luna failed (ex: timeout)
    var errorParam = {
      type: 'error',
      popupTitle: msgLang.alert_adult_3_2,
      errorMsg: msgLang.alert_adult_3_5,
      errorCodeMsg: 'ERROR CODE: ' + errorCode
    };
    $rootScope.popupApp.showPopup($scope, errorParam);
  };

  $scope.executeAction = function() {
    device.hasLaunchParamsResult = false;
    if (focusManager.blockExecution()) {
      console.log('detailApp.executeAction, blockExecution is true');
      return;
    }
    // 앱상세 진입중 버벅거림으로 인해 진입이 늦어질 때 blockExecution으로 처리가 안되는 경우가 있어 추가함.[WOSLQEVENT-109394]
    if ($rootScope.breadcrumb.IsRunning()) {
      console.log('detailApp.executeAction, Bradcrumb is running..');
      return;
    }

    isFirst = false;

    var focusObject, target, obj, item, itemId, itemAge, isAdultContent, index, dataClickAct, errorCode, requestParam, viewPayAppInfoArray, shelfID, moreBtn = ['item-recommBtn0-0', 'item-recommBtn1-0', 'item-recommBtn2-0', 'item-descBtn-0', 'item-previewBtn-0', 'item-packageBtn-0'];

    try {
      focusObject = focusManager.getCurrent();
      if (focusObject.scope == $scope) {
        device.startTime = new Date().getTime();
        target = focusObject.target;
        if (target.split('-')[1]) shelfID  = target.split('-')[1].replace(/Btn/gi,'');
        // 네트워크 접속 여부 검사 [WOSLQEVENT-64818]
        if(!device.isOnline) {
          requestParam = {id: $scope.detailAppData.id, callbackEvent: 'installAndUpdateChecked'};
          getAppInfo.call(requestParam);
          return;
        }

        if (target == 'back') {
          $rootScope.breadcrumb.executeBack($scope.scopeName);
        } else if (moreBtn.indexOf(target) >= 0) {
          if (target.indexOf('recomm') >= 0){
            index = target.substr(-3, 1);
            //          $scope.isMore = !$scope.isMore;
            toggleApp(index);
          } else if(target =='item-descBtn-0') {
            $scope.$digest();
            $scope.scrollRefresh();
          } else if (target =='item-previewBtn-0') {
            //          $scope.isPreview = !$scope.isPreview;
            togglePreview();
          } else if (target =='item-packageBtn-0') {
            //          $scope.isMorePackage = !$scope.isMorePackage;
            togglePackage();
          }
          shelfMoreClick(shelfID);
        } else if (target == 'rating') {
          //이미 평가한뒤에 평가하기 팝업이 떠있는 상태이면 팝업창을 닫는다.
          if ($rootScope.rating.alreadyRating && $rootScope.rating.open && !$rootScope.rating.hide) {
            $rootScope.rating.hidePopup();
            return;
          }
          doRateAction();
          /**
           * 비 로그인 평가하기 허용
           *
          if(device.auth.userID ? true : false) {
            doRateAction();
          } else {
            //Login되어 있지 않을시 membership App 호출
            var countLoigin = false;
            $rootScope.spinner.showSpinner(); // wait for luna response
            userID.call(function(callBackCheckUserId) {
              $rootScope.spinner.hideSpinner(); // remove the spinner
              if (callBackCheckUserId === 'failed') { // Luna failed (ex: timeout)
                lunaFailedPopup();
                return;
              }
              if (device.auth.userID) {
                doRateAction();
              } else if (!countLoigin) {
                requestParam = {
                  query: 'requestLogin',
                  params:{
                  },
                  returnTo:{
                    target:'luna://com.webos.applicationManager',
                    method:'launch',
                    bypass:{
                      params:{
                        id:'com.webos.app.discovery',
                        query:'category/APPSGAMES/' + $scope.appId
                      }
                    }
                  }};
                membership.callMembershipPage(requestParam);
                countLoigin = true;
              }
            });
          }
           */
        } else if ( target.indexOf('item') >= 0) {
          itemId = focusElement.getAttribute('item-id');
          itemAge = focusElement.getAttribute('item-age');
          if (target.indexOf('preview') >= 0 ) {
            device.isPlayer = true;
            trailer(target);
          } else {
            isAdultContent = false;
//            if (itemAge) {
//              isAdultContent = adultProcess.getAdultContentsFlag(itemAge);
//              if (isAdultContent && device.auth.adultStatus != 'Verified'){
//                adultProcess.execProcess(itemId);
//                return;
//              }
//            }
            $rootScope.pageManager.setParam('scrollY', scroll.y);
            $rootScope.pageManager.setParam('itemClass', target);
            $rootScope.pageManager.setParam('item-id', itemId);
            $scope.toBeGoScope = itemId;
            $rootScope.draw({
              page: 'detailApp', module: itemId, inLink: $scope.isInLink
            });
          }
          shelfContentClick(shelfID, itemId);
        }else if (target == 'button') {
          try {
            if ($scope.spinner) {
              console.warn('로딩중');
              //return;
            }
            dataClickAct = focusElement.getAttribute('data-click-act');

            // pm log
            pmLog.write(pmLog.LOGKEY.APP_LAUNCH_CLICK, {
              contents_id : $element[0].getAttribute('item'),
              menu_name : $scope.detailAppData.bPremium ? pmLog.TYPE.PREMIUM : pmLog.TYPE.APPGAME,
              event_type : dataClickAct
            });
            $rootScope.spinner.showSpinner(); // wait for server(api) response and luna response
            requestCheckAppPurchase();
          } catch(e) {
            //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
            removeSpinner();
            errorCode = 'executeAction';
            console.log("## ERROR CODE : " +  errorCode);
            errorCode = 'executeAction : ' + errorCode;
            requestParam = {
              type: 'error',
              popupTitle: msgLang.alert_adult_3_2,
              errorMsg: msgLang.alert_adult_3_5,
              errorCodeMsg: 'ERROR CODE: '+errorCode
            };
            $rootScope.popupApp.showPopup($scope, requestParam);
          }
        }
      } else if (focusObject.scope.scopeName === 'scroll' &&
        focusObject.scope.$parent === $scope) {
        // WOSLQEVENT-82783
        // [Service.SDPService.LGStore_Common Policy] [Always] [Minor]
        // back key 동작하지 않음
        target = focusObject.target;
        if (target === 'back') {
          $rootScope.breadcrumb.executeBack($scope.scopeName);
        }
      }
    } catch(e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      errorCode = 'App3depth.111';
      console.log("## ERROR CODE : " +  errorCode);
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  var shelfMoreClick = function(shelfId) {
    // pmlog : more button
    pmLog.write(pmLog.LOGKEY.THIRD_SHELF_MORE, {
      menu_name : $rootScope.pmLogValue,
      shelf_id : shelfId
    });
  };

  var shelfContentClick = function(shelfID, shelfContentsID) {
    // pmlog : contents(추천, 스크린샷)
    pmLog.write(pmLog.LOGKEY.THIRD_SHELF_CLICK, {
      menu_name : $rootScope.pmLogValue,
      shelf_id : shelfID,
      contents_id : $scope.appId,
      shelf_contents_id : shelfContentsID,
      shelf_contents_category : $rootScope.pmLogValue
    });
  };

  var drawAppPackage = function(e, response) {
    var obj, l, appArr, m;

    e.preventDefault();
    try {
      if ($scope.$id != response.scopeId) {
        return;
      }
      if (response.appPackageList && response.appPackageList.appList) {
        $scope.packageData = response.appPackageList.appList;
        l = $scope.packageData.length;
        for (var i = 0; i < l; i++) {
          obj = $scope.packageData[i];
          if (obj.event == 'Y') {
            obj.dpPrice1 = obj.eventPrice == 0 ? msgLang.free : obj.displayEventPrice;
            obj.dpPrice2 = obj.displayPrice;
          } else {
            obj.dpPrice1 = obj.price == 0 ? msgLang.free : obj.displayEventPrice;
          }
        }
        updateRow();
      }
      $scope.$digest();
      $scope.scrollRefresh();
      //app list event regist.
      appArr = $element[0].getElementsByClassName('packapp');
      m = appArr.length;
      for (i = 0; i < m; i++) {
        $scope.setMouseEvent(appArr[i]);
      }
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      var errorCode = $scope.errorCode + '.005'; //draw package
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  } ;
  var drawRecommend = function(e, response) {
    var obj, l, appArr, m, buttonArr, n;

    e.preventDefault();
    try {
      if ($scope.$id != response.scopeId) {
        return;
      }
      if (response.appRecommend && response.appRecommend.rcmdCategoryList) {
        $scope.recommendData = response.appRecommend;
        l = $scope.recommendData.rcmdCategoryList.length;
        for (var i = 0; i < l; i++) {
          obj = $scope.recommendData.rcmdCategoryList[i];
          for (var j = 0; j < obj.rcmdAppCount; j++) {
            obj.appList[j].showApp = j <= 5;
            if (obj.appList[j].event == 'Y') {
              obj.appList[j].dpPrice1 = obj.appList[j].eventPrice == 0 ? msgLang.free : obj.appList[j].displayEventPrice;
              obj.appList[j].dpPrice2 = obj.appList[j].displayPrice;
            } else {
              obj.appList[j].dpPrice1 = obj.appList[j].price == 0 ? msgLang.free : obj.appList[j].displayEventPrice;
            }
          }
        }
        updateRow();
      }
      $scope.$digest();
      $scope.scrollRefresh();
      // recommend app list event regist.
      appArr = $element[0].getElementsByClassName('item-apps');
      m = appArr.length;
      for (i = 0; i < m; i++) {
        $scope.setMouseEvent(appArr[i]);
      }
      // detail more button event regist.
      buttonArr = $element[0].getElementsByClassName('btn-more');
      n = buttonArr.length;
      for (i = 0; i < n; i++) {
        $scope.setMouseEvent(buttonArr[i]);
      }
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      var errorCode = $scope.errorCode + '.004';//draw recommend
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  var drawDetail = function(e, response) {
    var obj, l, errorCode;

    e.preventDefault();

    try {
      /* 유효성 검사 ==========================*/
      /*DeepLink 검증*/
      if (device.fromDeepLink) {
        $scope.isDeepLink = true;
      } else {
        $scope.isDeepLink = false;
      }
      if (device.isDeepLink && (device.previousPage === 'detailApp')) { //이전 페이지가 앱상세인 경우의 딥링크
        $scope.toBeGoScope = true;
        device.isDeepLink = false;
      }

      if ($scope.scopeName != '' && $scope.scopeName != response.scopeName) return;

      //[WOSLQEVENT-93328] 일시적 장애 (ERROR CODE : INSTALL IMPOSSIBLE APP) 팝업 출력됨 (Package앱에서 구성Package 상세화면으로 진입할때 $scope.detailAppData 재설정)
      if (response.appDetail) $scope.detailAppData = response.appDetail.app;

      if ($scope.$id != response.scopeId) { // scope id를 비교하여 중복 호출을 방지함.
        // 이전 scope이 destroy 되기 전이므로 해당 이벤트가 중복호출되어 이전에 생성된 scope에서는 삭제 대상의 scope을 draw가 완료되기 전의 마지막 scope으로 정한다.
        //$scope.toBeDelScope = $rootScope.pageManager.findLastScopeId();
        return;
      }

      if (response.appDetail.error) {
        // 에러 발생시 새로 생성된 마지막 scope을 삭제 대상 scope로 한다.
        $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId();
        errorCode = genErrorCode(response.appDetail.error.code); //'001'
        $rootScope.pageManager.movePageError(errorCode, $scope, $element);
      } else if (response.appDetail.app) {

        // 메인에서 바로 진입 시 성인체크 (메인에서 ageType이 없음)
//        if (device.auth.adultStatus !== 'Verified' && response.appDetail.app.adultYN === 'Y') {
//          adultProcess.execProcess(response.appDetail.app.id, 'main');
//          $rootScope.isFromMain = true;
//          $rootScope.spinner.hideSpinner();
//          $rootScope.breadcrumb.setRunning(false);
//          destroyScope();
//          $rootScope.pageManager.popHistory();
//          return;
//        }

        $scope.scopeName = response.scopeName;
        //data setting
        //TODO : API 가 수정되면 수정해야함.
        $scope.detailAppData.sellerName = $scope.detailAppData.sellerName;
        if ($scope.detailAppData.supportAddress) {
          $scope.detailAppData.sellerEmail = $scope.detailAppData.supportAddress;
        } else {
          $scope.detailAppData.sellerEmail = false;
        }
        $scope.useGamePad = $scope.detailAppData.capability.useGamePad == 'Y';
        $scope.useInternet = $scope.detailAppData.capability.useInternet == 'Y';
        $scope.use3d = $scope.detailAppData.capability.use3d == 'Y';
        $scope.useCamera = $scope.detailAppData.capability.useCamera == 'Y';
        $scope.useMagic = $scope.detailAppData.capability.useMagic == 'Y';
        if ($scope.useGamePad || $scope.useInternet || $scope.use3d || $scope.useCamera || $scope.useMagic) $scope.useCapability = true;
        $scope.useScreenShot = $scope.detailAppData.appPreviewCount > 0;
        $scope.useSingleApp = $scope.detailAppData.type == 'S';
        $scope.usePackageApp = $scope.detailAppData.type == 'P';
        $scope.isAdult = $scope.detailAppData.adultYN == 'Y';
        $scope.detailAppData.ageTypeTxt = msgLang.apps_category01;
        $rootScope.pageManager.setTitle($scope.detailAppData.name);
        /*  넷플릭스일때만 상세에서 컬러 지운다.  */
        $scope.detailAppData._saveIconColor = $scope.detailAppData.iconColor;
        //앱상세 및 프리미엄 상세화면에서 만약에 배경색(iconColor)이 서버에서 안나오고
        // 배경색이 검정색이면  bg-black클래스 추가함.
        if($scope.detailAppData.iconColor === '#000000'){
          $element[0].getElementsByClassName('detail-apps-brief')[0].getElementsByClassName('item-thumb')[0].className += ' bg-black';
        }
        if ($scope.detailAppData.id == 'netflix') $scope.detailAppData.iconColor = '';
        /* 이벤트 날짜 정보 설정 */
        $scope.detailAppData.eventDate = $scope.detailAppData.eventStartDate && $scope.detailAppData.eventEndDate ? true : false;
        /*  inapp 관련 분기 */
        $scope.detailAppData.bItem = $scope.detailAppData.bItem == 'Y';
        if (!$scope.detailAppData.bItem) {
          /*  평가 버튼 show  */
          $scope.useRating = true;
        }
        if ($scope.detailAppData.ageType != '0') $scope.detailAppData.ageTypeTxt = $scope.detailAppData.ageType + '+';
        /* 이벤트 가격 정보 설정 */
        if ($scope.detailAppData.event == 'Y') {
          $scope.detailAppData.dpPrice1 = $scope.detailAppData.eventPrice == 0 ? msgLang.free : $scope.detailAppData.displayEventPrice;
          $scope.detailAppData.dpPrice2 = $scope.detailAppData.displayPrice;
          $scope.isEvent = true;
        }

        /* 패키지 앱목록 */
        if (response.appDetail.app.appList) {
          $scope.packageData = response.appDetail.app.appList;
        }

        if ($scope.detailAppData.bPremium) {
          $scope.useRating = false;
          updateRow();
        } else {
          // 평가하기 버튼/ 별점/평가수 정보 노출
          $scope.useRating = true;
        }
        // 스크린샷 노출 수 조정
        obj = $scope.detailAppData.appPreviewList;
        l = (obj) ? obj.length: 0; // if obj is not undefined...
        $scope.detailAppData.trailerList = [];// Trailer 데이타 초기화
        for (var i = 0; i < l; i++) {
          obj[i].showPreview = (i <= 2);
          $scope.detailAppData.trailerList[i] = {
            thumb: obj[i].previewURL, url: obj[i].previewURL, type: 'I'
          };
        }
        $scope.trailerdata = {data: $scope.detailAppData.trailerList, title: $scope.detailAppData.name};
        /* mypage에서 사용할 데이타 저장  */
        storage.addRecentData({
          serviceType: ($scope.detailAppData.bPremium ? storage.MYPAGE.RECENTHISTORYPREMIUM : storage.MYPAGE.RECENTHISTORYAPPNGAME),
          itemId: $scope.detailAppData.id,
          itemName: $scope.detailAppData.name,
          itemImg: $scope.detailAppData.iconURL,
          ageType: $scope.detailAppData.ageType,
          iconColor: $scope.detailAppData._saveIconColor,
          categoryName: $scope.detailAppData.categoryName
        });

        /* search에서 넘어오는 경우 스토리지에 저장
         * 검색영역에서 클릭시에 해당 파라미터를 세팅하여 pagemanager에 저장해야 쓸 수 있음.*/
        if (storage.isFromSearch($element)) {
          storage.addRecentResult({
            item_age: $scope.detailAppData.ageType,
            item_id: $scope.detailAppData.id,
            keyword: $element.attr('query'),
            moduleName: $scope.scopeName,
            thumbnail: $scope.detailAppData.iconURL,
            title: $scope.detailAppData.name
          });
        }
        pageHeight = $element[0].getElementsByClassName('panel-body').offsetHeight;
        updateRow();
        obj = $element[0].getElementsByClassName('detail-scroller')[0];
        obj.style.height = pageHeight + 'px';
        $element[0].removeAttribute('ng-class');
        //앱 크기 표시 WOSLQEVENT-54281 2015.09.14 callback이 늦게 오는 경우 표시 안되어서 drawdetail로 옮김
        if (!$scope.usePackageApp) {
          var packTotalSize = $scope.detailAppData.appFileList[0].packFileSize;
          var unPackTotalSize = $scope.detailAppData.appFileList[0].unpackFileSize;
          var requestParam = {'id':$scope.detailAppData.id, 'size':packTotalSize, 'uncompressedSize':unPackTotalSize};
          //앱 크기 갱신 WOSLQEVENT-39060 2015.09.10
          getInstallCapacity.getRequiredAppSize(requestParam, function(respon) {
            if(respon) {
              convertSize(respon);
            } else {
              convertSize(packTotalSize?packTotalSize:0 + unPackTotalSize?unPackTotalSize:0);
            }
            util.async(function() {
              $scope.drawed = true;
              initializeScroll();
              restoreScrollPos();
              $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
            });
          });
        } else {
          util.async(function() {
            $scope.drawed = true;
            initializeScroll();
            restoreScrollPos();
            $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
          });
        }

      } else {
        $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
        errorCode = genErrorCode('Invalid Data');
        $rootScope.pageManager.movePageError(errorCode, $scope, $element);
      }
    } catch (e) {
      // 페이지 이동중 에러 발생, 생성중인 page를 삭제하기
      destroyScope();

      if($scope.isDeeplink){
        errorParam = {
          type: 'popup',
          popupTitle: msgLang.alert_adult_3_3,
          popupDesc: msgLang.alert_error_4_1,
          popupBut1: msgLang.ok,
          popupButAct1 : 'closeAppPopup'
        };
        $rootScope.popupApp.showPopup($rootScope, errorParam);
      } else {
        //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
        removeSpinner();
        var errorCode = $scope.errorCode + '.003'; //drawdetail
        requestParam = {
          type: 'error',
          popupTitle: msgLang.alert_adult_3_2,
          errorMsg: msgLang.alert_adult_3_5,
          errorCodeMsg: 'ERROR CODE: '+errorCode
        };
        $rootScope.popupApp.showPopup($scope, requestParam);
      }
    }
  };

  var trailer = function(target) {
    var requestParam, previewIndex = parseInt(target.split('-')[2]);

    try {
      var initParams = {
        playerType: 'Trailer', is3DContent: false, idx: previewIndex
      };
      $rootScope.player.initPlay($scope, initParams, $scope.trailerdata, 'detailApp');
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      var errorCode = $scope.errorCode + '.002';
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  var updateRow = function() {
    var k, l, obj;

    $scope.splitCount = 0;
    $scope.itemRowCount = 0;
    $scope.row = [];
    k = 0;

    // 상세보기의 더보기 버튼 row
    if ($scope.useDescMore) {
      $scope.row[k] = {
        type: 'button', id: k, index: 0, count: 1, prefix: 'descBtn'
      };
      $scope.row[k].itemPerRow = 1;
      k ++;
    }

    if ($scope.row[k]) k++;
    if ($scope.usePackageApp && $scope.packageData != null) {
      l = $scope.packageData.length;
      // 패키지앱의 row
      for (var i = 0; i < l; i++) {
        obj = $scope.packageData[i];
        if ($scope.row[k] == null) {
          $scope.row[k] = {
            type: 'package', id: k, index: i, count: 1, prefix: 'package'
          };
          $scope.row[k].itemPerRow = 2;
        } else if ($scope.row[k].count < 2) {
          $scope.row[k].count++;
          if ($scope.row[k].count == 2) k++;
        }
      }
    }

    if ($scope.row[k]) k++;
    // 스크린샷의 더보기 버튼 row
    if ($scope.useScreenShot) {
      l = $scope.detailAppData.appPreviewList.length;
      if (l > 3) {
        $scope.row[k] = {
          type: 'button', id: k, index: 0, count: 1, prefix: 'previewBtn'
        };
        $scope.row[k].itemPerRow = 1;
        k ++;
      }
      // 스크린샷의 row
      for (i = 0; i < l; i++) {
        obj = $scope.detailAppData.appPreviewList[i];
        if (obj.showPreview) {
          if ($scope.row[k] == null) {
            $scope.row[k] = {
              type: 'preview', id: k, index: i, count: 1, prefix: 'preview'
            };
            $scope.row[k].itemPerRow = 3;
          } else if ($scope.row[k].count < 3) {
            $scope.row[k].count++;
            if ($scope.row[k].count == 3) k++;
          }
        }
      }
    }

    if ($scope.row[k]) k++;

    // 추천앱 더보기 버튼과 추천앱 리스트 row
    if ($scope.recommendData) {
      l = $scope.recommendData.rcmdCategoryList.length;
      for (i = 0 ; i < l; i++) {
        obj = $scope.recommendData.rcmdCategoryList[i];
        if (obj.rcmdAppCount > 6) {
          $scope.row[k] = {
            type: 'button', id: k, index: 0, count: 1, prefix: ('recommBtn' + i)
          };
          $scope.row[k].itemPerRow = 1;
          k ++;
        }
        for (var j = 0; j < obj.rcmdAppCount; j++) {
          if (obj.appList[j].showApp) {
            if ($scope.row[k] == null) {
              $scope.row[k] = {
                type: 'recomm', id: k, index: j, count: 1, prefix: ('recomm' + i)
              };
              $scope.row[k].itemPerRow = 2;
            } else if ($scope.row[k].count < 2) {
              $scope.row[k].count++;
              if ($scope.row[k].count == 2) k++;
            }
          }
        }
        if ($scope.row[k]) k++;
      }
    }
  };

  var sshotResize = function() {
    var sshotObj = document.querySelectorAll('.screenshot');
    if (sshotObj.length > 0) {
      var w, h, areaW, areaH, imgW, imgH, rate;
      areaW = sshotObj[0].clientWidth;
      areaH = sshotObj[0].clientHeight;
      for (var i = 0; i < sshotObj.length; i++) {
        imgW = sshotObj[i].querySelector('.thumb-img').naturalWidth;
        imgH = sshotObj[i].querySelector('.thumb-img').naturalHeight;
        w = null;
        h = parseInt(imgH * areaW / imgW);
        rate = (h / areaH).toFixed(2);
        if (rate < 0.8) {
          w = areaW;
          h = null;
        } else if (rate > 1.2) {
          h = areaH;
        } else {
          w = areaW;
          h = areaH;
        }
        if (!w && !h) {
          w = imgW;
          h = imgH;
        }
        sshotObj[i].querySelector('.thumb-img').style.width = w + 'px';
        sshotObj[i].querySelector('.thumb-img').style.height = h + 'px';
        sshotObj[i].querySelector('.thumb-img').style.opacity = 1;
      }
      $scope.$digest();
    }
  };

  var initializeDetailBefore = function() {
    var currentAppStatus, requestParam;
    try {
      $scope.$digest();
      sshotResize();

      //패키지 앱인경우 applist저장
      if ($scope.usePackageApp) {
        $scope.packageAppList = $scope.detailAppData.appList;
      }
      if ($scope.usePackageApp) {
        requestAppPackage();
        $scope.packageAppIndex = 0;
        packageStatusCheck(); //패키지앱의 결제 상태 확인.
      } else {
        /* 현재 설치/제거 중인지 체크 */
        /* 이석준주임님 가이드 : simplestats : 다운로드중일때 화면 그리기 위해서 UI를 위해서 -install,download,unpacking
        *  state : 코드값을 세분화환 내용(device팀에서 내부적으로 쓰기 위해서 만든 값) */
        currentAppStatus = $scope.appStatusList[$scope.detailAppData.id];
        if (currentAppStatus) {
          console.log('#### currentAppStatus.statusValue : ' + currentAppStatus.statusValue);
          if (currentAppStatus.details.paused === true) {
            setProgressVisible(true);
            if (currentAppStatus.details.simpleStatus === 'download') {
              setActionButtonEnable(true);
              setActionButton('cancel');
              pmLog.write(pmLog.LOGKEY.STUB_APP, { key : 'initializeDetail- ( 1 )' });
            } else if (currentAppStatus.details.simpleStatus === 'install') {
              setActionButtonEnable(false);
              setActionButton('installing');
              pmLog.write(pmLog.LOGKEY.STUB_APP, { key : 'initializeDetail- ( 2 )' });
            }
            installProcessDelegator(currentAppStatus);

          } else if (currentAppStatus.details.simpleStatus === 'download') {
            if(util.isAWSServer()){
              if(currentAppStatus.details.state === 'download failed') {
                setProgressVisible(false);
                getAppInfo.call(requestParam);
                requestDetailDataSmall(); //구매정보가 갱신되어야 하므로 호출
              }else{
                installProcessDelegator(currentAppStatus);
                //setActionButtonEnable(true);  // 상세페이지 진입시 스크롤 변동현상으로 주석처리 [WOSLQEVENT-97442]
                setActionButton('cancel');
                setProgressVisible(true);
              }
            }else{
              installProcessDelegator(currentAppStatus);
              //setActionButtonEnable(true);  // 상세페이지 진입시 스크롤 변동현상으로 주석처리 [WOSLQEVENT-97442]
              setActionButton('cancel');
              setProgressVisible(true);
            }

            pmLog.write(pmLog.LOGKEY.STUB_APP, { key : 'initializeDetail- ( 3 )' });
          } else if (currentAppStatus.details.simpleStatus === 'install') {
            if (currentAppStatus.statusValue === 30) {
              //[WOSLQEVENT-109414] 앱 업데이트나 설치가 안료될 경우 프로그래스바가 안없어지는 경우가 있어서 방어 코드 삽입
              if($element[0].getElementsByClassName('progress-bar').length > 0) {
                $element[0].getElementsByClassName('progress-apps')[0].style.visibility ='hidden';
              }
              requestParam = {id: $scope.detailAppData.id, callbackEvent: 'installAndUpdateChecked'};
              getAppInfo.call(requestParam);
              pmLog.write(pmLog.LOGKEY.STUB_APP, { key : 'initializeDetail- ( 4 )' });
            } else if (currentAppStatus.statusValue === 13) {
              // installing인 경우 버튼세팅 [WOSLQEVENT-98625] 2016.01.29
              setProgressVisible(false);
              setActionButtonEnable(false);
              setActionButton('installing');
              installProcessDelegator(currentAppStatus);
              pmLog.write(pmLog.LOGKEY.STUB_APP, { key : 'initializeDetail- ( 5 )' });
            } else {
              setProgressVisible(true);
              //setActionButtonEnable(false); // 상세페이지 진입시 스크롤 변동현상으로 주석처리 [WOSLQEVENT-97442]
              setActionButton('installing');
              installProcessDelegator(currentAppStatus);
              pmLog.write(pmLog.LOGKEY.STUB_APP, { key : 'initializeDetail- ( 6 )' });
            }
          } else {
            /*  삭제 중인 상태  */
            switch (currentAppStatus.statusValue) {
              case 32:case 33:case 34:
              case 259:case 260:case 261:
              case 38:case 40:
              case 18:case 19:
              case 21:
                setActionButton('cancel');
                setActionButtonEnable(false);
                installProcessDelegator(currentAppStatus);
                break;
              case 22: //22 : Cancel 버튼 눌렀을 경우-Network Disconnect Case
                $scope.progressPercent = 0;
                setProgressVisible(false);
                $scope.spinner = false;
                if (device.isOnline) {
                  requestParam = {id: $scope.detailAppData.id, callbackEvent: 'installAndUpdateChecked'};
                  getAppInfo.call(requestParam);
                }
                break;
              case 31:  // 설치된 앱을 삭제한 경우 getAppInfo.call 로 버튼 세팅 처리.
                requestParam = {id: $scope.detailAppData.id, callbackEvent: 'installAndUpdateChecked'};
                getAppInfo.call(requestParam);
                break;
              default:
                setActionButton('cancel');
                setActionButtonEnable(false);
                installProcessDelegator(currentAppStatus);
                break;
            }
          }
        } else {
          /* 설치 여부 판단해서 act 버튼 셋팅 */
          requestParam = {id: $scope.detailAppData.id, callbackEvent: 'installAndUpdateChecked'};
          getAppInfo.call(requestParam);
        }
      }
    } catch(e) {
      console.log(e);
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      errorCode = 'initializeDetailBefore';
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);
    }
  }

  var initializeDetail = function() {
    var preveiwLength, elementH, descH, previewArr, errorCode;

    initializeDetailBefore();

    try {
      // 추천앱 정보 호출
      if (!$scope.detailAppData.bPremium) requestRecommend();
      $scope.$digest();
      // 상세정보의 더보기 버튼 처리
      var delay = 0;
      if (device.isLite) {
        delay = 100;
      }
      $timeout(function() {//lite에 높이가 늦게 먹는경우가 있어 timeout
        elementH = window.getComputedStyle($element[0].getElementsByClassName('app-detail-text')[0]).lineHeight.replace('px','');
        descH = $element[0].getElementsByClassName('app-detail-text')[0].offsetHeight - 10;
        if (descH > elementH * 3) {
          $scope.useDescMore = true;
          updateRow(); // 상세정보의 더보기 버튼의 row 생성을 위해 호출
          // more button event register.
          $scope.$digest();
        }
        moreArr = document.getElementsByClassName('btn-more');
        for (var i = 0; i < moreArr.length; i++) {
          $scope.setMouseEvent(moreArr[i]);
        }
      }, delay);
      //elementH = $element[0].getElementsByClassName('app-detail-text')[0].style.lineHeight.replace('px', '');

      // preview image event regist.
      previewArr = $element[0].getElementsByClassName('item-trailer-apps');
      preveiwLength = previewArr.length;
      for (var i = 0; i < preveiwLength; i++) {
        $scope.setMouseEvent(previewArr[i]);
      }

      // rate button event regist.
      $scope.setMouseEvent($element[0].getElementsByClassName('btn-small')[0]);
      // install button event regist.
      $scope.setMouseEvent($element[0].getElementsByClassName('btn-large')[0]);
      // applist evnet regist
      if ($scope.packageData !== null) {
        var appArr = $element[0].getElementsByClassName('packapp');
        if (appArr !== undefined) {
          var m = appArr.length;
          for (i = 0; i < m; i++) {
            $scope.setMouseEvent(appArr[i]);
          }
        }
      }
      util.async($scope.scrollRefresh);
    } catch (e) {
      console.log(e);
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      errorCode = 'initializeDetail';
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);
    }
  };

  var hideList = function(e, page) {
    e.preventDefault();

    try {
      if ($rootScope.depth2Ad) { //AD show중에는 hide가 안 적용되어 timeout으로 처리
        $timeout(function() {
          $rootScope.depth2Ad.hideAD();
        }, 500);
      }

      $scope.isInLink = $rootScope.pageManager.getLink();
      if ($scope.toBeGoScope) {
        $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
          $scope.hiding = true;
          destroyScope();
        });
        return;
      }
      if ((page != $scope.scopeName || $scope.isInLink) && !$scope.showing) {
        if (($scope.direct == false && $scope.showing == false)) {
          if (page == '') {
            $scope.$broadcast('drawFinished');
            $scope.setDefaultFocus();
            $scope.direct = true;
            $scope.toBeGoScope = true;
            $element[0].classList.add('direct');
            $rootScope.breadcrumb.onPageFromDeepLink();
            $timeout(function() {
              $scope.setShowAllImage(true);
            }, timeOutValue.SHOWING);
          } else {
            $scope.$broadcast('drawFinished');
            //[WOSLQEVENT-113068][WOSLQEVENT-113105] 상세페이지 진입 시 setFocusItem이 중복 호출 되어
            //audioGuidance 역시 중복 호출 되어 불필요한 setFocus 주석처리
            if(util.isAWSServer()){
              //do nothing
            } else {
              $scope.setDefaultFocus();
            }
            $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, preExecuteBackCallback, function() {
              // breadcrum animation이 종료된 이후 호출되는 callback 임
              $scope.showing = true;
              $scope.setShowAllImage(true);
            });
          }
        }
        // pmLog value 체크
        if (document.querySelector('.selected') && document.querySelector('.selected').getAttribute('item') === 'appsngames') {
          $rootScope.pmLogValue = pmLog.TYPE.APPGAME
        } else {
          $rootScope.pmLogValue = pmLog.TYPE.PREMIUM
        }
        var endTime = new Date().getTime();
        console.info('%c [PERFORMANCE]  : 3Depth LOADING TIME : ' + (endTime - device.startTime) + '   ', 'background-color:green;color:white');
        return;
      }

      $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
        // breadcrum animation이 종료된 이후 호출되는 callback 임
        $scope.hiding = true;
        // $timeout(function() {
        destroyScope();
        // }, timeOutValue.DESTROYING);
      });

      // detailApp 페이지에서 나가면 DeepLink로 들어왔던 content 정보를 초기화
      if (page === 'detailApp') {
        $rootScope.lastTryContentId = null;
        $rootScope.lastTryAppId = null;
      }
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      var errorCode = $scope.errorCode + '.006';//hidelist
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }

  };

  var requestData = function() {
    var appId, payload, errorCode, scopeId, flag;

    $rootScope.spinner.showSpinner();

    appId = $element[0].getAttribute('item');
    $scope.appId = appId;
    scopeId = $scope.$id;
    payload = {app_id: appId};
    flag = 'insert';

    try {
      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api : '/discovery/item/GAMESAPPS/Detail',
          apiAppStoreVersion: 'v7.0',
          method : 'get',
          params : payload
        };
        server.requestApi(eventKey.DETAIL_LOADED_APPGAME, params, destroyInfo);
      } else {
        // local json 용
        server.requestAppNGameDetail(payload, scopeId, flag);
      }
    } catch (e) {
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      errorCode = genErrorCode('ajax Fail');
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);
    }
  };

  var requestRecommend = function() {
    var appId, payload, scopeId;

    appId = $element[0].getAttribute('item');
    payload = {app_id: appId};
    scopeId = $scope.$id;
    try {
      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api : '/discovery/item/GAMESAPPS/Recommend',
          apiAppStoreVersion: 'v7.0',
          method : 'get',
          params : payload,
          freeAppScopeId: scopeId
        };
        server.requestApi(eventKey.RECOMMEND_APPGAME, params);
      } else {
        // local json 용
        server.requestAppNGameRecommended(payload);
      }
    } catch (e) {}
  };

  var requestAppPackage = function() {
    var appId, payload;

    appId = $element[0].getAttribute('item');
    payload = {app_id: appId};
    scopeId = $scope.$id;
    try {
      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api: '/purchase/app',
          apiAppStoreVersion: 'v7.0',
          method: 'get',
          params: payload,
          freeAppScopeId: scopeId
        };
        server.requestApi(eventKey.PACKAGE_APPGAME, params);
      } else {
        // local json 용
        server.requestAppPackageList(payload);
      }
    } catch (e) {}
  };

  var move = function(y) {
    scrollBar.move(y, true);
    if (focusManager.getCurrent().scope == $scope && scrollByKey == false) {
      //$scope.setFocusItem('', null); // focus issue
    }
  };

  var initializeScroll = function() {
    var option = {};
    option.useTransform = false;
    option.onPositionChange = move;

    scroll = new iScroll($element[0].getElementsByClassName('panel-body')[0], option);
    $scope.scroll = scroll;

    $element[0].getElementsByClassName('panel-body')[0].onmousewheel = function(e) {
      var deltaY, wheelDelta = 120, wheelSpeed = 3;

      e.preventDefault();
      util.async($scope.scrollRefresh);
      wheelDelta = (e.wheelDelta > 0)  ? wheelDelta : -(wheelDelta);
      deltaY = scroll.y + (wheelDelta * wheelSpeed);
      // moonstone patch
      if (deltaY > 0) deltaY = 0; // deltaY = 100;
      else if (deltaY < scroll.maxScrollY) deltaY = scroll.maxScrollY; // deltaY = scroll.maxScrollY - 100;
      if (!$rootScope.spinner.hide) return;
      if (scroll.wrapperH >= scroll.scrollerH) return;
      if (focusManager.blockExecution()) return;
      if (focusManager.preExecution()) return;
      if (e.wheelDelta < 0 && scroll.y > 0) return;
      if (e.wheelDelta > 0 && scroll.y < scroll.maxScrollY) return;
      scroll.scrollTo(0, deltaY, 300);
    };
  };

  var getItemPositionByItemId = function(itemClass, itemId) {
    var element, temp;

    element = $element[0].getElementsByClassName(itemClass);
    if (element && (element.length > 0)) {
      temp = element[0].getAttribute('item-id');
      if (temp === itemId) {
        return {
          top: element[0].offsetTop,
          bottom: element[0].offsetTop + element[0].offsetHeight
        };
      }
    }
  };

  var restoreScrollPos = function(reset) {
    var scrollY, oldScrollY, param, result, itemClass, itemId;

    var rowYFrom;
    var rowYTo;
    var scrollYFrom;
    var scrollYTo;

    param = $rootScope.pageManager.peekHistory();
    if (param) {
      oldScrollY = $rootScope.pageManager.getParam('scrollY');
      oldScrollY *= -1;

      itemClass = $rootScope.pageManager.getParam('itemClass');
      itemId = $rootScope.pageManager.getParam('item-id');
      if (itemClass) {
        result = getItemPositionByItemId(itemClass, itemId);
        if (result) {
          if (result && result.top && result.bottom) {
            $scope.defaultFocusItemClass = itemClass;
            rowYFrom = result.top;
            rowYTo = result.bottom;
          }
          $scope.defaultFocusItemClass = itemClass;
          if (rowYFrom !== undefined) {
            scrollYFrom = oldScrollY;
            scrollYTo = scrollYFrom + scroll.wrapperH;

            if (rowYFrom < scrollYFrom) {
              // 상단이 위에 숨겨진 경우
              scrollY = rowYFrom;
            } else if (rowYTo > scrollYTo) {
              // 하단이 아래에 숨겨진 경우
              scrollY = oldScrollY + (rowYTo - scrollYTo);
            } else {
              scrollY = oldScrollY;
            }
          }
        }
      }

      if (scrollY) {
        $rootScope.pageManager.setParam('scrollY', undefined);
        scroll.scrollTo(0, scrollY, 300, true);
        return;
      }
    }

    if (scroll && reset)
      scroll.scrollTo(0, 0, 0);
  };

  $scope.scrollPageUp = function() {
    if (scroll.y > 0) return;
    scroll.scrollTo(0, -200, 300, true);
  };

  $scope.scrollPageDown = function() {
    if (scroll.y < scroll.maxScrollY) return;
    scroll.scrollTo(0, 200, 300, true);
  };

  $scope.scrollRefresh = function() {
    var obj;

    obj = $element[0].getElementsByClassName('detail-scroller')[0];
    obj.style.height = pageHeight + 'px';
    if (scroll) {
      scroll.refresh();
      scrollBar.refresh(scroll.wrapperH, scroll.scrollerH, scroll.y);
      maxPosition = parseInt((scroll.wrapperH - scroll.scrollerH) / STEP_POSITION);
    }
  };

  $scope.setScrollBarCallback = function(refreshCB, moveCB) {
    scrollBar.refresh = refreshCB;
    scrollBar.move = moveCB;
  };

  $scope.setDefaultFocus = function() {
    var target, item, itemClass;

    if (!$rootScope.popupApp.hide) { //팝업창이 떠있는 상태이면 디폴트 포커스 하지 않음
      return;
    }
    if (!$scope.enableButton) { // 버튼이 disable 상태일 경우 다른곳으로 focus 이동시킴
      itemClass = 'item-' + $scope.row[0].prefix + '-0';
      if (itemClass == 'item-descBtn-0') itemClass = 'item-' + $scope.row[1].prefix + '-0';
    } else {
      // 설치 버튼을 default focus로 처리
      itemClass = 'btn-large';
    }

    target = $element[0].getElementsByClassName(itemClass)[0];
    if (target) {
      item = target.getAttribute('item');
      if (device.currentPage === 'premium') {
        // Premium 페이지에서 상세로 진입할 때 초기 포커스 떄문에 appsngames 페이지에서 진입한 것처럼 page 세팅.
        device.currentPage = 'appsngames';
      }
      $scope.setFocusItem(item, target);
      marquee.setTarget(target.getElementsByClassName('marquee')[0]);
      focusManager.setCurrent($scope, item);
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }
  };

  $scope.removeFocus = function() {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
    }
  };

  $scope.moveFocusByKey = function(keyCode) {
    var cursorStat = window.PalmSystem ? window.PalmSystem.cursor.getCursorState() : true;
    if (($scope.useProgressbar || !$scope.enableButton) && !cursorStat.visibilty) { // 설치중이거나 버튼이 disable 상태일 경우 버튼 들어오면 flag true, cursor visibilty는 false일떄 [WOSLQEVENT-65353]
      $scope.moveFlagDuringButtonSet = true;
    } else {
      $scope.moveFlagDuringButtonSet = false;
    }
    var arr, obj, row, rowIndex, index, item, name, element, hidden, scrollY, rect, prefix, remainCnt, type, tempEl;
    //평가하기에 포커스되어 있고, 이미 평가한 팝업이 떠있는 상태이면 포커스 이동을 하지 않는다.
    if (lastFocus.item == 'rating' && $rootScope.rating.alreadyRating && $rootScope.rating.open && !$rootScope.rating.hide) {
      if ($rootScope.rating.alreadyRating) {
        $rootScope.rating.hidePopup();
      }
      return;
    }
    if ($scope.moveFocusDiable) {
      return;
    }
    if ($scope.focusItem == '') {
      if (util.isAWSServer()) {
        if(focusManager.getLastFocus().scope.scopeName !== "drawer"){
          device.isFocusItem = false;
        }
      }
      if (lastItemFocus && !lastItemFocus.isFrom && Object.keys(lastItemFocus).length > 0) {
        // The last focus was scroll btn.
        rect = {x: 0, y: 250, width: 0, height: 100};
        $scope.$parent.$broadcast('focus', 'scroll', keyHandler.RIGHT, rect);
        return false;
      }
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    if ($scope.focusItem.indexOf('item') != 0) {
      switch ($scope.focusItem) {
        case 'back':
          moveFocusFromBack(keyCode);
          break;
        case 'rating':
          moveFocusFromRating(keyCode);
          break;
        default:
          moveFocusFromInstall(keyCode);
      }
      return;
    }

    arr = $scope.focusItem.replace('item-', '').split('-');
    index = parseInt(arr[1]);
    for (var i=0; i < $scope.row.length; i++) {
      obj = $scope.row[i];
      if (arr[0] == obj.prefix && index >= obj.index && index < (obj.index + obj.count)) {
        row = obj.id;
        rowIndex = obj.index;
        prefix = obj.prefix;
        type = obj.type;
        remainCnt = (obj.index + obj.count - 1) - index;
        break;
      }
    }

    switch (keyCode) {
      case keyHandler.LEFT:
        if (index == rowIndex) {
          if (!$scope.enableButton) { // 버튼이 disabled 상태이면
            $rootScope.$broadcast('focus', 'breadcrumbs', function() {
              // right button이 섵택되었을 때 실행될 callback
              moveFocusFromBack(keyHandler.RIGHT);
            });
          } else {
            focusToInstall();
          }
          return;
        }
        name = 'item-' + prefix + '-' + (index - 1);
        element = $element[0].getElementsByClassName(name)[0];
        scrollY = -1;
        break;
      case keyHandler.UP:
        if (row == 0) { // 첫번째 row이면 header로 이동
          if ($scope.useRating && useRatingBtn) {
            element = $element[0].getElementsByClassName('btn-small')[0];
            $scope.setFocusItem('rating', element);
          } else {
            focusToHeader({x: focusElement.offsetLeft + 395, y: 0, width: 0, height: 0});
          }
          return;
        }

        if ((index > ($scope.row[row - 1].count + $scope.row[row - 1].index)) || type == 'button') {
          index = ($scope.row[row - 1].count + $scope.row[row - 1].index) - 1;
        } else {
          index = $scope.row[row - 1].index;
        }

        name = 'item-' + $scope.row[row - 1].prefix + '-' + index;
        element = $element[0].getElementsByClassName(name)[0];
        if (!element) return;

        scrollY = element.getBoundingClientRect().top - scroll.wrapperOffsetTop - scroll.y;
        if (row > 1 && $scope.row[row - 1].type != 'button' && $scope.row[row - 2].type == 'button') {  // next focus item 이 버튼이면 하위 아이템으로 스크롤되게 한다.
          tempEl = $element[0].getElementsByClassName('item-' + $scope.row[row - 2].prefix + '-0')[0];
          if (tempEl) {
            scrollY = tempEl.getBoundingClientRect().top - scroll.wrapperOffsetTop - scroll.y;
          }
        }
        if (scrollY < -scroll.y) {
          hidden = true;
          scrollY = -scrollY;
        }
        break;
      case keyHandler.RIGHT:
        if (remainCnt == 0) {
          rect = {
            x: 0,
            y: focusElement.getBoundingClientRect().top - scroll.wrapperOffsetTop + 250,
            width: 0,
            height: focusElement.clientHeight
          };
          $scope.$broadcast('focus', 'scroll', keyCode, rect);
          return;
        }
        name = 'item-' + prefix + '-' + (index + 1);
        element = $element[0].getElementsByClassName(name)[0];
        scrollY = -1;
        break;
      case keyHandler.DOWN:
        if ($scope.row[row+1] == null ) {
          return;
        }

        if ($scope.row[row+1].type !== $scope.row[row].type) {
          index = (index+1)%$scope.row[row].itemPerRow - 1;
          if (index<0) {
            index = $scope.row[row].itemPerRow - 1;
          }
          if ($scope.row[row+1].itemPerRow<index) {
            index = 0;
          }
          if ($scope.row[row].type == 'button') {
            index = $scope.row[row+1].count - 1;
          }
          if ($scope.row[row+1].type == 'button') {
            index = 0;
          }
        } else {
          if ((index + $scope.row[row+1].count) <= $scope.row[row + 1].index) {
            index = $scope.row[row + 1].index;
          } else {
            index = ($scope.row[row + 1].count + $scope.row[row + 1].index) - 1;
          }
        }

        name = 'item-' + $scope.row[row + 1].prefix + '-' + index;
        element = $element[0].getElementsByClassName(name)[0];
        if (!element) return;

        scrollY = element.getBoundingClientRect().top + element.offsetHeight - scroll.wrapperOffsetTop - scroll.y;
        if ($scope.row[row + 1].type == 'button') {  // next focus item 이 버튼이면 하위 아이템으로 스크롤되게 한다.
          tempEl = $element[0].getElementsByClassName('item-' + $scope.row[row + 2].prefix + '-0')[0];
          if (tempEl) {
            scrollY = tempEl.getBoundingClientRect().top + tempEl.offsetHeight - scroll.wrapperOffsetTop - scroll.y;
          }
        }
        if (scrollY > scroll.wrapperH - scroll.y) {
          hidden = true;
          scrollY = scroll.wrapperH - scrollY;
        }
        break;
    }

    if (name && element) {
      $scope.setFocusItem(name, element);
      if (hidden) {
        scrollByKey = true;
        scroll.scrollTo(0, scrollY, 300, false);
      }
    }
  };

  var moveFocusFromBack = function(keyCode) {
    switch (keyCode) {
      case keyHandler.LEFT:
        $scope.executeAction();
        break;
      case keyHandler.RIGHT:
        if (!device.isRTL) {
          focusToInstall();
        } else {
          $scope.focusFromScroll('prev', true);
        }
        break;
    }
  };

  var moveFocusFromRating = function(keyCode) {
    switch (keyCode) {
      case keyHandler.UP:
        $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 1840, y: 0, width: 0, height: 0});
        break;
      case keyHandler.DOWN:
        $scope.focusFromScroll('prev', true);
        break;
    }
  };

  var moveFocusFromInstall = function(keyCode) {
    var element;

    switch (keyCode) {
      case keyHandler.LEFT:
        if (!device.isRTL) {
          $rootScope.$broadcast('focus', 'breadcrumbs', function() {
            // right button이 섵택되었을 때 실행될 callback
            moveFocusFromBack(keyHandler.RIGHT);
          });
        }
        break;
      case keyHandler.UP:
        if ($scope.useRating && useRatingBtn) {
          element = $element[0].getElementsByClassName('btn-small')[0];
          $scope.setFocusItem('rating', element);
        } else {
          // 상세페이지가 Premium 인 경우
          if ($scope.detailAppData.bPremium) {
            $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 2000, y: 100, width: 0, height: 0});
          // 상세페이지가 App&Game 인 경우
          } else {
            $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 1840, y: 0, width: 0, height: 0});
          }
        }
        break;
      case keyHandler.RIGHT:
        $scope.focusFromScroll('prev', true, true); // target, install, installRight
        break;
      case keyHandler.DOWN:
        break;
    }
  };

  var focusToHeader = function() {
    var element;

    element = $element[0].getElementsByClassName('btn-small')[0];
    if (element !== undefined) {
      if(useRatingBtn){
        $scope.setFocusItem('rating', element);
        return;
      }
    }
    $rootScope.$broadcast('focus', 'drawer', null, {x: 1840, y: 0, width: 0, height: 0});
  };

  var focusToInstall = function() {
    var element;

    if (!$scope.enableButton) { // 버튼이 disabled 일 경우 다른곳으로
      element = $element[0].getElementsByClassName('item-preview-0')[0];
    } else {
      element = $element[0].getElementsByClassName('btn-large')[0];
    }
    $scope.setFocusItem(element.getAttribute('item'), element);
  };

  var getNearContentsElement = function(target, install, installRight) {
    var moveToName, min, element, temp, scrollY, obj, name, gap, elementTop, hidden, installBtnTop;
    var returnArr = {};

    min = -scroll.maxScrollY + scroll.wrapperOffsetTop;
    installBtnTop = 0;
    for (var i = 0; i < $scope.row.length; i++) {
      obj = $scope.row[i];

      if (!install) {
        name = 'item-' + obj.prefix + '-' + (obj.index + obj.count -1);
      } else {
        if (obj.type == 'button') continue;
        //back 버튼에서 돌아올 경우 이전에 포커스된 아이템 컨텐츠로 이동한다.
        if (lastItemFocus.item) {
          if (!lastItemFocus.isFrom && focusManager.getCurrent().target !== 'prev' && focusManager.getCurrent().target !== 'next') {
            // The last focus was scroll btn.
            rect = {x: 0, y: 250, width: 0, height: 100};
            $scope.$parent.$broadcast('focus', 'scroll', keyHandler.RIGHT, rect);
            return false;
          }
          name = lastItemFocus.item;
        } else {
          if (name) continue;
          name = 'item-' + obj.prefix + '-' + obj.index;
        }
        installBtnTop = 358;
      }

      temp = $element[0].getElementsByClassName(name)[0];
      if (target != 'prev') {
        elementTop = temp.getBoundingClientRect().top + temp.offsetHeight - scroll.wrapperOffsetTop - scroll.y;
        gap = Math.abs(elementTop - (-scroll.y + scroll.wrapperH));
      } else {
        elementTop = temp.getBoundingClientRect().top - scroll.wrapperOffsetTop - scroll.y;
        gap = Math.abs(elementTop - (-scroll.y - installBtnTop));
      }

      if (min > gap || install) {
        min = gap;
        scrollY = elementTop;
        element = temp;
        moveToName = name;
      }
      if ($scope.row.length === 1) {
        element = temp; // only one row
      }
    }

    //back 버튼에서 이전 포커스된 아이템으로 돌아올 경우 스크롤 영역 밖의 아이템에 대한 포커스 기준을 변환한다.
    if (element && install && (scrollY + element.offsetHeight) > (scroll.wrapperOffsetTop + scroll.wrapperH)) {
      target = 'next';
      scrollY += element.offsetHeight;
    }
    if (target == 'prev') {
      if (scrollY < -scroll.y) {
        hidden = true;
        scrollY = -scrollY;
      } else if(scrollY + element.offsetHeight > scroll.wrapperH - scroll.y) {// scroll 기준 아래로 맞춤
        hidden = true;
        scrollY = scroll.y - (scroll.y - scroll.wrapperH + scrollY + element.offsetHeight);
      }
    } else {
      if (scrollY > scroll.wrapperH - scroll.y) {
        hidden = true;
        scrollY = scroll.wrapperH - scrollY;
      }
    }

    // install -> rating -> install
    if (!installRight && lastItemMenuFocus && lastItemMenuFocus.isFrom) {
      // NOT install keyHandler.RIGHT && lastItemMenuFocus && lastItemMenuFocus.isFrom
      element = lastItemMenuFocus.element;
    }

    returnArr.element = element;
    returnArr.hidden = hidden;
    returnArr.scrollY = scrollY;

    return returnArr;
  };

  $scope.focusFromScroll = function(target, install, installRight) {
    var element, scrollY, hidden;
    var arrElement;

    if (target == 'header') {
      if (focusManager.getCurrent().target === 'prev') lastItemFocus.isFrom = false;
      if (focusManager.getCurrent().target === 'next') {
        element = getNearContentsElement('prev').element;
        $scope.setFocusItem(element.getAttribute('item'), element);
        return;
      }
      focusToHeader({x: $element[0].clientWidth, y: 0, width: 0, height: 0});
      return;
    }

    arrElement = getNearContentsElement(target, install, installRight);
    if (!arrElement) return;
    element = arrElement.element;
    hidden = arrElement.hidden;
    scrollY = arrElement.scrollY;

    if (element) {
      $scope.setFocusItem(element.getAttribute('item'), element);
      if (hidden) {
        scrollByKey = true;
        scroll.scrollTo(0, scrollY, 300, false);
      }
    }
  };

  var focusHandler = function(e, target, keyCode, rect) {
    if (target != 'main') return;
    e.preventDefault();

    if ((keyCode === keyHandler.RIGHT) && rect && (rect.left <= 0)) {
      // from breadcrumbs
      moveFocusFromBack(keyCode);
      return;
    }

    var element;
    element = $element[0].getElementsByClassName('btn-small')[0];
    if (element && useRatingBtn) {
      focusToHeader(rect);
    } else {
      $scope.moveFocusByKey(keyCode);
    }
  };

  var toggleApp = function(index) {
    var obj, l, m, appArr;

    obj = $scope.recommendData.rcmdCategoryList[index].appList;
    l = obj.length;
    for (var i = 0; i < l; i++) {
      if (i > 5) {
        obj[i].showApp = !obj[i].showApp;
      } else {
        obj[i].showApp = true;
      }
    }
    updateRow();
    $scope.$digest();
    $scope.scrollRefresh();
    // recommend app list event regist.
    appArr = $element[0].getElementsByClassName('item-apps');
    m = appArr.length;
    for (i = 0; i < m; i++) {
      $scope.setMouseEvent(appArr[i]);
    }
  };

  var togglePreview = function() {
    var obj, l,m , previewArr;

    obj = $scope.detailAppData.appPreviewList;
    l = obj.length;
    for (var i = 0; i < l; i++) {
      if (i > 2) {
        obj[i].showPreview = !obj[i].showPreview;
      } else {
        obj[i].showPreview = true;
      }
    }
    updateRow();
    $scope.$digest();
    sshotResize();
    $scope.scrollRefresh();
    // preview image event regist.
    previewArr = $element[0].getElementsByClassName('item-trailer-apps');
    m = previewArr.length;
    for (i = 0; i < m; i++) {
      $scope.setMouseEvent(previewArr[i]);
    }
  };

  var togglePackage = function() {
    var obj, l,m , packageArr;

    obj = $scope.packageData;
    l = obj.length;
    for (var i = 0; i < l; i++) {
      if (i > 1) {
        obj[i].showApp = !obj[i].showApp;
      } else {
        obj[i].showApp = true;
      }
    }
    updateRow();
    $scope.$digest();
    $scope.scrollRefresh();
    // package app event regist.
    packageArr = $element[0].getElementsByClassName('item-apps');
    m = packageArr.length;
    for (i = 0; i < m; i++) {
      $scope.setMouseEvent(packageArr[i]);
    }
  };

  var convertSize = function(size) {
    try {
      var bytes = parseInt(size);
      var s = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
      var e = Math.floor(Math.log(bytes)/Math.log(1024));

      if(e == "-Infinity") {
        $scope.detailAppData.appSizeUnit = s[0];
        $scope.detailAppData.appSize = 0;
      } else {
        $scope.detailAppData.appSizeUnit = s[e];
        $scope.detailAppData.appSize = (bytes/Math.pow(1024, Math.floor(e))).toFixed(2);
      }
    } catch(e) {}
  };

  var setActionButtonEnable = function(flag, isAudio) {
    //[WOSLQEVENT-79511] Photo player 내에서 일반리모컨 포커스 사라짐, back key 입력되지 않음
    if (!flag && device.isPlayer) {
      console.log("When current scope is player, do not set focus in detailApp");
      return;
    }

    if (!flag && scroll) {
      //[WOSLQEVENT-117927] 업데이트/설치 실행 시 $scope.focusFromScroll 내에서
      //setFocusItem() 을 호출하여 필요없는 음성발화가 진행되어 업데이트/설치 시에는
      //$scope.focusFromScroll('prev', true); 타지 않도록 조치.
      if(isAudio !== 'noAudio') $scope.focusFromScroll('prev', true);
      $scope.enableButton = false;
      if (angular.element($element[0].getElementsByClassName('btn-large')[0]).hasClass('focus')) {
        $scope.setDefaultFocus();
      }
    } else {
      $scope.enableButton = true;
    }
    if (!flag) {
      $element[0].getElementsByClassName('btn-large')[0].classList.add('disabled');
    } else {
      $element[0].getElementsByClassName('btn-large')[0].classList.remove('disabled');
    }
  };

  var installProcessDelegator = function(appStatusInfo) {
    var errorCode, requestParam;
    try {
      // vaildation 확인 (install 이후 발생되는 팝업에 대한 방어코드 강화 [WOSLQEVENT-59225])
      if ($rootScope.breadcrumb.IsRunning()) return;
      //[WOSLQEVENT-109613]  LG Store -> 앱 설치중 -> 평가하기 클릭 -> 평가 불가 팝업 출력 -> 앱 설치 완료 -> 바로 실행 버튼으로 변경시
      //버튼 위 Progress bar 남아 있음 : 앱 다운로드 받는 도중에 포커스가 팝업창으로 갈 경우도 있으므로 scopeName으로 비교함.
      if ($scope.scopeName !== "detailApp") return;
      if (!$scope ||!$scope.detailAppData || !appStatusInfo) return;
      if ($scope.detailAppData.id === undefined || !$scope.detailAppData.id === null) return;
      if (appStatusInfo.id !== $scope.detailAppData.id) return;
      if (!appStatusInfo.statusValue) return;

      requestParam = {id: $scope.detailAppData.id, callbackEvent: 'installAndUpdateChecked'};
      $scope.isLogin = device.auth.userID ? true : false;
      /*M2보드 같은 경우 맴버쉽에 로그인하는데 시간이 오래 걸리므로
       자동로그인되어 있고 퀵스타트보드일때는 로그인되어 있는 걸로 간주*/
//      if(!$scope.isLogin && device.auth.userAutoSignIn && device.isQuickStartPlusState){
//        $scope.isLogin = true;
//      }

      switch(appStatusInfo.statusValue) {
        /* START DOWNLOAD (다운로드 시작) */
        case 262:
          // [WOSLQEVENT-117674]QuickStart+ 상태에서 usb 앱설치 download 중 TV Off/On 후 상태값을 초기하기 위해 사용
          device.isQuickStartPlusAdultStatusUsb = false;
        // 멤버십 로그인 시 처리하는 부분이 Spec out되면서 일단 주석처리
//          if(device.auth.userAutoSignIn && device.isQuickStartPlusState && !$scope.detailAppData.bPremium){
//            setActionButton('install');
//            setActionButtonEnable(true);
//            setProgressVisible(false);
//            break;
//          }
//          setActionButtonEnable(true);s
        case 263:case 264:
        //$scope.progressPercent = appStatusInfo.statusValue - 260;
        // [WOSLQEVENT-117674]QuickStart+ 상태에서 usb 앱설치 download 중 TV Off/On 후 상태값을 초기하기 위해 사용
        device.isQuickStartPlusAdultStatusUsb = false;
        $scope.progressPercent = 1;
        break;
        case 6: case 7:
        //$scope.progressPercent = appStatusInfo.statusValue;
        $scope.progressPercent = 1;
        break;

        /* DOWNLOADING (다운로드 중 프로그래스바 변경) */
        case 8:
          //[WOSLQEVENT-91325] 버튼 UI Install로 나오지만 설치 되고 있으며, Install UI 버튼 동작 시 USB에 설치 하시겠습니까 팝업 발생.
          //TV Device간 LG Store간에 로그인 정보 동기화 문제로 TV에서 다운로드중이라고 8번 정보를 주면 로그인 되어 있다고 간주함.
//          if(!$scope.isLogin && !$scope.detailAppData.bPremium){
//            setActionButton('install');
//            setActionButtonEnable(true);
//            setProgressVisible(false);
//            break;
//          }
          setActionButton('cancel');
          if (appStatusInfo.details && appStatusInfo.details.progress) {
            if (appStatusInfo.details.progress !== 0 ) {
              $scope.progressPercent = appStatusInfo.details.progress;
            }
          }
          break;

        /*  DOWN COMPLETE 100% (다운로드 완료) */
        case 10:
          if (appStatusInfo.details && appStatusInfo.details.progress) {
            $scope.progressPercent = appStatusInfo.details.progress;
          }
          console.log('['+new Date().getTime()+'] DOWN COMPLETE~~');
          break;

        /* START INSTALL (인스톨 시작) */
        case 268:
          console.log('['+new Date().getTime()+'] INSTALL START~~');

          //AudioGuidance update/install 중
          if (appStatusInfo.details.update) {
            $scope.audioGuidance('', 'btnState', msgLang.apps_update);
          } else {
            $scope.audioGuidance('', 'btnState', msgLang.apps_toast_10);
          }

          setActionButtonEnable(false, 'noAudio');
          $timeout(function() {
            setActionButton('installing');  //DOWN COMPLETE 시 install 시작되면 action button dim 처리
          }, 100);
          break;
        case 269:case 270:
        break;
        case 35:case 36:case 37: // app parsing 81~83
        // $scope.progressPercent = appStatusInfo.statusValue + 46; // 2015.05.13 // 2015향 소스에서 주석 처리됨.
        break;
        case 32:case 33:case 34: // app closing 84~86
        // $scope.progressPercent = appStatusInfo.statusValue + 52; // 2015.05.13 // 2015향 소스에서 주석 처리됨.
        break;
        case 11:case 12:case 13: // install ready 87~89
        // $scope.progressPercent = appStatusInfo.statusValue + 76;  // 2015.05.13 // 2015향 소스에서 주석 처리됨.
        break;
        case 17: // install 90
          // $scope.progressPercent = appStatusInfo.statusValue + 73; // 2015.05.13 // 2015향 소스에서 주석 처리됨.
          break;
        case 27:case 28:case 29: // install 91~93
        // $scope.progressPercent = appStatusInfo.statusValue + 64; // 2015.05.13 // 2015향 소스에서 주석 처리됨.
        break;
        case 256:case 257:case 258: // install RO 94~96
        // $scope.progressPercent = appStatusInfo.statusValue - 162;  // 2015.05.13 // 2015향 소스에서 주석 처리됨.
//        if(!$scope.isLogin && !$scope.detailAppData.bPremium){
//          setActionButton('install');
//          setActionButtonEnable(true);
//          setProgressVisible(false);
//          break;
//        }
        break;
        case 265:case 266:case 267: // post INSTALL 97~99
        // $scope.progressPercent = appStatusInfo.statusValue - 168;  // 2015.05.13 // 2015향 소스에서 주석 처리됨.
        break;

        /* INSTALL DONE (설치 완료) */
        case 30:
          //[WOSLQEVENT-109614] 이상희 연구원 요청으로 평가하기 버튼 앱 미설치시 disabled 처리
          if($scope.useRating) {
            useRatingBtn = true;
            if (util.isAWSServer()) {
              if (document.querySelectorAll('[item="rating"]').length > 0) {
                for (var i = 0; i < document.querySelectorAll('[item="rating"]').length; i++) {
                  document.querySelectorAll('[item="rating"]')[i].classList.remove('disabled');
                }
              }
            } else {
              document.querySelector('[item="rating"]').classList.remove('disabled');
            }
          }
          //[WOSLQEVENT-109251] 앱 업데이트나 설치가 안료될 경우 프로그래스바가 안없어지는 경우가 있어서 방어 코드 삽입
          if($element[0].getElementsByClassName('progress-bar').length > 0) {
            $element[0].getElementsByClassName('progress-apps')[0].style.visibility ='hidden';
          }
          /* 실행 버튼으로만 바꿔준다. 앱 리스트 모니터링에서 처리해준다.*/
          $scope.spinner = false;
          setProgressVisible(false);
          requestDetailDataSmall(); //구매정보가 갱신되어야 하므로 호출
          /* Stub App 자동 업데이트 시 앱설치가 완료가 되면 버튼을 UPDATE로 세팅 */
          if (appStatusInfo.details && appStatusInfo.details.type === 'stub') {
            setActionButtonEnable(true);
            setActionButton('update');
            pmLog.write(pmLog.LOGKEY.STUB_APP, { key : 'Delegator - ( 30 ) Stub App Auto Update Done...' });
            break;
          }
          if ($scope.usbListData.length > 0) {
            getAppInfo.call(requestParam);
          }
          //requestDetailData(); 설치만 완료되는거이므로 다시 상세데이터를 불러올 필요가 없다.
          //spaceInfo.update(updateSpaceInfo);
          break;

        /* DOWNLOAD FAILED (다운로드 실패) */
        case 23:
          //$scope.spinner = true;
          setProgressVisible(false);
          getAppInfo.call(requestParam);
          requestDetailDataSmall(); //구매정보가 갱신되어야 하므로 호출
          //requestDetailData(); 설치 관련 이므로 상세 데이터를 다시 부를 필요가 없다.
          break;
        case 24:  //  install failed
        case 22:  //  22 : Cancel 버튼 눌렀을 경우-Network Disconnect Case
          // [WOSLQEVENT-117674]QuickStart+ 상태에서 usb 앱설치 download 중 TV Off/On 후 progress bar 사라지는 현상
          // 시중 30% usb가 tv Off/On Network Disconnect로 인식(홍순원 주임 전달 받은 사항)하여 22번이 떨어져 예외처리함.
          if (device.isQuickStartPlusState && $scope.appStatusList && $scope.appStatusList[$scope.detailAppData.id] && device.isQuickStartPlusAdultStatusUsb){
            device.isQuickStartPlusAdultStatusUsb = false;
            quickstartUsbState = true;
          }else{
            setProgressVisible(false);
            $scope.progressPercent = 0;
            $scope.spinner = false;// [WOSLQEVENT-68943]
            //spinner값이 기본으로 안나오게 설정
            if (device.isOnline) {
              //$scope.spinner = true;
              getAppInfo.call(requestParam);
              $scope.spinner = false;
            }
          }
          break;
        case 25: // 25 : 삭제 실패(다시 버튼 갱신)
        case 26:
          //$scope.spinner = true;
          setProgressVisible(false);
          $scope.progressPercent = 0;
          getAppInfo.call(requestParam);
          //spaceInfo.update(updateSpaceInfo);
          break;
        case 31: // 삭제완료 / 현재 앱 상세 페이지면 갱신한다. / 앱 리스트 모니터링에서 처리해준다.
          //[WOSLQEVENT-109614] 이상희 연구원 요청으로 평가하기 버튼 앱 미설치시 disabled 처리
          if($scope.useRating){
            useRatingBtn = false;
            if(util.isAWSServer()) {
              if (document.querySelectorAll('[item="rating"]').length > 0) {
                for (var i = 0; i < document.querySelectorAll('[item="rating"]').length; i++) {
                  document.querySelectorAll('[item="rating"]')[i].classList.add('disabled');
                }
              }
            } else {
              document.querySelector('[item="rating"]').classList.add('disabled');
            }
          }
          //$scope.spinner = true;
          setProgressVisible(false);
          getAppInfo.call(requestParam);
          requestDetailDataSmall(); //구매정보가 갱신되어야 하므로 호출
          //requestDetailData();
          break;

        /* START DELETE (삭제 시작) */
        case 41:
          //$scope.spinner = true;
          setProgressVisible(false);
          setActionButtonEnable(false); //setActionButtonEnable(true);
          break;
        default:
          console.info("## UNKNOWN CALLBACK STATUS.", appStatusInfo);
      }
      $scope.$digest();

    } catch(e) {
      // install 이후 발생되는 팝업에 대한 방어코드 [WOSLQEVENT-59225]
      if(!$scope || !$scope.getScopeElement()) return;
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      errorCode = 'installProcessDelegator';
      console.error("## ERROR CODE : " +  errorCode);
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  /**
   * 패키지 앱 설치 프로세스 델리게이트
   */
  var packageInstallProcessDelegator = function(e, packageAppStatusInfo) {
    var singleAppStatus, completeCount = 0;

    try {

      //[WOSLQEVENT-114162] [Sometimes] Temporarily Problem 팝업 출력
      //화면이동할때 $scope.detailAppData 데이터가 존재하지 않아 에러팝업창이 뜸
      if (util.isAWSServer()) {
        if (!$scope.detailAppData) {
          return;
        }
      }
      if (packageAppStatusInfo.id !== $scope.detailAppData.id) return;
      for(var i = 0; i < packageAppStatusInfo.members.length; i++) {
        singleAppStatus = packageAppStatusInfo.members[i];

        if( [31, 22, 23, 24, 30].indexOf(singleAppStatus.statusValue) >= 0 ) {
          completeCount++;
        }
      }
      if( completeCount == packageAppStatusInfo.members.length ) {
        /*  설치던 실패던 완료  */
        $scope.packageAppIndex = 0;
        packageStatusCheck();
      } else {
        /*  설치 진행 중 */
        setActionButtonEnable(false);
        setActionButton('installing');
      }
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      var errorCode = $scope.errorCode + '.008'; //패키지앱 프로그레스바
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  var packAppListPop = function(e, response) {
    if (!$scope || !$scope.detailAppData || (response !== $scope.detailAppData.id)) { //이벤트받은아이디가 다르면 return;
      return;
    }

    viewPayAppInfoArray = [];

    for(var i=0; i<$scope.packageAppList.length; i++) {
      var appInfo = $scope.packageAppList[i];
      if( appInfo.bPurchased == 'Y' ) {
        viewPayAppInfoArray.push(appInfo);
      }
    }
    if( viewPayAppInfoArray.length > 0 && $scope.usePackageApp) { //패키지 구매/설치 목록 앱 팝업 띄우기
      /*var viewData = {};
       viewData.viewPayAppInfoArray = viewPayAppInfoArray;*/
      requestParam = {
        type: 'package',
        popupTitle: msgLang.apps_package_title_01,
        popupBut1: msgLang.no,
        popupBut2: msgLang.yes,
        popupButAct1 : 'closeAppPopup',
        popupButAct2: 'appPurchaseFromPopup',
        packageGuide: msgLang.apps_package_content_01,
        packageListData: viewPayAppInfoArray,
        appLikeYN: false
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  }

  var setProgressVisible = function(showHideType) {
    $scope.progressPercent = 0;
    $scope.useProgressbar = showHideType;
    $scope.$digest();
  };

  var setActionButton = function(actType, displayPayAmount, payAmount) {
    var curButton = $element[0].getElementsByClassName('btn-large')[0].getAttribute('data-click-act');
    //2015.09.14 WOSLQEVENT-54941 버튼이 launch에서 installing으로 바뀌는 경우는 실제적으로 없으므로 return,이미 같은버튼으로 또 setting하는경우도 return
    if(curButton === 'launch' && actType === 'installing' ||  curButton === actType) {
      $scope.spinner = false;
      $scope.$digest();
      return;
    }
    var cancelMsg, errorCode, requestParam;

    $element[0].getElementsByClassName('btn-large')[0].removeAttribute('style'); // installing 때 변경된 버튼색상 제거(gray -> red)
    $scope.enableButton = true;
    if( actType == 'launch' ) {
      /*  실행  */
      $scope.actBtntxt = msgLang.apps_launch;
      $scope.spinner = false;
    } else if( actType == 'pay' ) {
      /* 결제 */
      if( payAmount == 0 ) {
        /* 결제 금액이 0원인 경우에는 install로 바꿔준다. */
        actType = 'install';
        $scope.actBtntxt = msgLang.apps_install;
        $scope.spinner = false;
      } else {
        //[WOSLQEVENT-104323] 구매시 Install > 가격($100) > Install 로 버튼 변경 issue(결제가 된 앱이면  가격버튼설정 타지않게 예외처리)
        if($scope.detailAppData.bPurchased == "Y") {
          actType = 'install';
          $scope.actBtntxt = msgLang.apps_install;
          $scope.spinner = false;
        } else {
          $scope.actBtntxt = displayPayAmount;
        }
      }
      $scope.spinner = false;
    } else if( actType == 'update' ) {
      /* 업데이트 */
      $scope.actBtntxt = msgLang.apps_update;
      $scope.spinner = false;
    } else if( actType == 'install' ) {
      /* 인스톨  */
      $scope.actBtntxt = msgLang.apps_install;
      $scope.spinner = false;
    }  else if( actType == 'installing' ) {
      /* 인스톨중 */
      $element[0].getElementsByClassName('btn-large')[0].style.backgroundColor = "#404040"; // 버튼색상 삽입(red -> gray)
      $scope.actBtntxt = msgLang.apps_toast_10;
      setProgressVisible(false);
      $scope.spinner = true;
      $scope.progressPercent = 0;
      $scope.enableButton = false;
    } else if( actType == 'cancel' ) {
      /*  취소  */
      cancelMsg = msgLang.cancel;
      if( $scope.languageCode == 'tr' ) cancelMsg = util.turkishToUpper(msgLang.cancel);

      $scope.actBtntxt = cancelMsg;
      $scope.spinner = false;
    } else {
      $scope.actBtntxt = '';
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      errorCode = genErrorCode('Invalid Data');
      console.log("## ERROR CODE : " +  errorCode);
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
    $element[0].getElementsByClassName('btn-large')[0].setAttribute('data-click-act', actType);
    $scope.$digest();

    //[WOSLQEVENT-79511] Photo player 내에서 일반리모컨 포커스 사라짐, back key 입력되지 않음
    if (device.isPlayer) {
      console.log("When current scope is player, do not set focus in detailApp");
      return;
    }

    // packageApp을 구매한 경우 포커스 상실되는 버그 수정 [WOSLQEVENT-106888] 2016.04.05
    //[WOSLQEVENT-114163] Focus 사라짐( 패키지앱에서 hover mode에서 진입해서 사방향키 입력시 포커스 상실됨)
    if (util.isAWSServer()) {
      if ($scope.enableButton) { //버튼 불가 상태도 아닐때
        if (!$scope.moveFlagDuringButtonSet){
          var cursorStat = JSON.parse(PalmSystem.cursor.getCursorState());
          if (!cursorStat.visibilty || cursorStat.visibilty === false) { //커서비지빌리티는 없어야 한다.
            $scope.setDefaultFocus();
          }
        }
      }
    }else{
      if ($scope.enableButton && !$scope.usePackageApp) { //버튼 불가 상태도 아닐때
        if (!$scope.moveFlagDuringButtonSet){
          var cursorStat = JSON.parse(PalmSystem.cursor.getCursorState());
          if (!cursorStat.visibilty || cursorStat.visibilty === false) { //커서비지빌리티는 없어야 한다.
            $scope.setDefaultFocus();
          }
        }
      }
    }
    isButtonSetting = true;
  };

  /**
   * 패키지앱의 상태를 체크한다.
   */
  var packageStatusCheck = function() {
    var requestParam;

    //$scope.spinner = true;
    requestParam = {appId: $scope.detailAppData.id, event: eventKey.PACKAGE_STATUS_RESULT};
    billing.getPurchasedAppinfo(requestParam);
  };

  var installAndUpdateCheck = function(e, response) {
    var checkResult, deviceId, driveId, folderPath, usbInfo, installedTarget, requestParam;
    try {
      setActionButtonEnable(true);
      checkResult = response;
      if( checkResult.returnValue === true && checkResult.appInfo && $scope.detailAppData) {
        useRatingBtn = true;
        if ($scope.detailAppData.id !== checkResult.appInfo.id) {//app id가 다르면 return
          return;
        }
        // 설치 되어 있음, 업데이트 체크
        //페이지 리로드 팝업이면 닫지 않는다. 문구로 구분 WOSLQEVENT-53250 2015.09.11
        if (!$rootScope.popupApp.hide && $rootScope.popupApp.title !== msgLang.alert_adult_7) $rootScope.popupApp.hidePopup();  //usb 팝업 리스트가 열려 있으면 닫는다

        $scope.detailAppData.appInfo = checkResult.appInfo;
        /* stub앱 체크 */
        $scope.detailAppData.isStub = $scope.detailAppData.appInfo.type == 'stub';

        /* 설치된 경로 셋팅  */
        folderPath = checkResult.appInfo.folderPath;
        for(var i = 0; i < $scope.usbListData.length; i++) {
          usbInfo = $scope.usbListData[i];
          if( folderPath.indexOf(usbInfo.deviceUri) == 0 ) {
            deviceId  = usbInfo.deviceId;
            driveId   = usbInfo.subDevices[0].deviceId;
            break;
          }
        }

        installedTarget = {};
        if( deviceId === undefined ) {
          installedTarget.deviceId  = 'INTERNAL_STORAGE';
        } else {
          installedTarget.deviceId= deviceId;
          installedTarget.driveId = driveId;
        }
        $scope.detailAppData.installedTarget = installedTarget;

        /*  업데이트 체크 */
        requestCheckUpdate($scope.detailAppData.id, checkResult.appInfo.version);
      } else {
        /*설치 안되어 있음
         미설치, 인스톨 가능 여부 판단.*/
        //[WOSLQEVENT-109614] 이상희 연구원 요청으로 평가하기 버튼 앱 미설치시 disabled 처리
        if($scope.useRating){
          useRatingBtn = false;
          if (util.isAWSServer()) {
            if (document.querySelectorAll('[item="rating"]').length > 0) {
              for (var i = 0; i < document.querySelectorAll('[item="rating"]').length; i++) {
                document.querySelectorAll('[item="rating"]')[i].classList.add('disabled');
              }
            }
          } else {
            document.querySelector('[item="rating"]').classList.add('disabled');
          }
        }
        if (device.q['X-Device-Language'] === 'en-US') { // en-US일경우 문구 예외 적용
          if (!$rootScope.popupApp.hide && ($rootScope.popupApp.title === msgEnUS2)) {//저장장치 팝업일때만
            showUsbListPopup();
          }
        } else {
          if (!$rootScope.popupApp.hide && ($rootScope.popupApp.title === msgLang.apps_install_16)) {//저장장치 팝업일때만
            if (!device.hasLaunchParamsResult) { // not from membership
              showUsbListPopup();
            }
          }
        }

        // QuickStart plus이며 앱다운로드중에 TV를 off/on 하고서 앱상세로 진입하면 다운로드 중이므로 버튼을 cancel로 출력
        if (device.isQuickStartPlusState && $scope.appStatusList && $scope.appStatusList[$scope.detailAppData.id] && $scope.appStatusList[$scope.detailAppData.id].details.state === 'install') {
          setActionButton('cancel');
          setActionButtonEnable(true);
          console.log('### QuickStart mode + isDownloading apps  => setActionButton(\'cancel\')');
        } else if (device.isQuickStartPlusState && $scope.appStatusList && $scope.appStatusList[$scope.detailAppData.id] && $scope.appStatusList[$scope.detailAppData.id].details.state === 'download failed') {
          setProgressVisible(false);
          setActionButton('install');
          console.log('### QuickStart mode + isDownloading apps  => setActionButton(\'install\') // download failed....');
        } else {
          /*[WOSLQEVENT-86612] 앱설치가 안되어 있고 로그인이 안된 상태에서는 install 상태여부 확인하지 않는다.*/
//          if ((tempCurrHost.indexOf('qt') > -1)) {
            if (!isFreeAppCheck()) {
              if ($scope.detailAppData.event == 'Y') {
                setActionButton('pay', $scope.detailAppData.displayEventPrice, $scope.detailAppData.eventPrice);
              } else {
                setActionButton('pay', $scope.detailAppData.displayPrice, $scope.detailAppData.price);
              }
            } else {
              setActionButton('install');
            }
            console.log('#### QA server + Non-login status or Login status');
//          } else {
//            if (device.auth.userID === "" && (isFreeAppCheck() || $scope.detailAppData.bPremium === true)) {
//              /*로그인안되어 있고 무료앱,프리미엄앱인 경우*/
//              setActionButton('install');
//              return;
//            } else if (device.auth.userID === "" && !isFreeAppCheck()) {
//              /*로그인안되어 있고 유료앱인 경우*/
//              if ($scope.detailAppData.event == 'Y') {
//                setActionButton('pay', $scope.detailAppData.displayEventPrice, $scope.detailAppData.eventPrice);
//              } else {
//                setActionButton('pay', $scope.detailAppData.displayPrice, $scope.detailAppData.price);
//              }
//              return;
//            }
//            console.log('#### Non-QA server + Non-login status');
//          }
        }
        requestInstallable();
      }
    } catch(e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();errorCode = 'installAndUpdateCheck';
      console.log("## ERROR CODE : " +  errorCode);
      if ($scope.spinner && device.currentPage === 'detailApp') {//버튼설정이 안되있고 앱 상세페이지라면 popup
        requestParam = {
          type: 'error',
          popupTitle: msgLang.alert_adult_3_2,
          errorMsg: msgLang.alert_adult_3_5,
          errorCodeMsg: 'ERROR CODE: '+errorCode
        };
        $rootScope.popupApp.showPopup($scope, requestParam);
      }
    }
  };

  /*  인스톨 가능 여부 요청. */
  var requestInstallable = function() {
    var stubFlag, payload, scopeId;
    if ($scope.detailAppData.isStub === true) {
      stubFlag = 'Y';
    } else {
      stubFlag = 'N';
    }
    payload = {
      app_id: $scope.detailAppData.id,
      stub: stubFlag
    };
    scopeId = $scope.$id;
    try {
      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api: '/discovery/item/GAMESAPPS/Install',
          apiAppStoreVersion: 'v7.0',
          method: 'get',
          params: payload,
          freeAppScopeId : scopeId
        };
        server.requestApi(eventKey.INSTALLABLE_APPGAME, params, (isFirst ? destroyInfo : {}));
      } else {
        // local json 용
        server.requestAppInstallable(payload);
      }
    } catch (e) {}
  };

  // 인스톨 상태 업데이트
  var updateInstallStatus = function(e, response) {
    // NSU 문제로 인해 PM log 추가하여 확인중..(2016.04.22)
    pmLog.write(pmLog.LOGKEY.NSU_RESPONSE_LOG, {
      serverAPI : '/app/install (A.001) - requestInstallable',
      response : JSON.stringify(response)
    });

    // 포커스 누락을 막습니다.(방어코드 : 이전 페이지 scope가 나중에 요청될 경우 포커스처리를 막습니다.)
    $scope.nextScopeId = response.scopeId;
    if($scope.nextScopeId < $scope.preScopeId){
      return;
    }
    $scope.preScopeId = $scope.nextScopeId;

    var errorCode, appInstallData, requestParam;
    try {
      if ($scope.$id != response.scopeId) {
        return;
      }
      appInstallData = response.appInstallData;
      if (appInstallData.error) {
        /**
         * code
         * ERR.401 : Unuthorized 인증 실패
         * A.001.01 : 잘못된 앱 아이디(Wrong App Id)
         * A.001.02 : 앱 결제 정보가 없음(App Purchase Info is not existed)
         * A.001.03 : App이 해당 Device에서 실행되지 않음(Device H/W do not support execution of this App)
         * A.001.04 : SU로 update 할 수 있는 SDK Version이 App이 필요로 하는 SDK Version보다 낮아 App을 실행 할 수 없음(Device S/W do not support execution of this App)
         * A.001.05 : MR을 해야만 App이 정상 실행됨.(NSU Update Required)
         * A.001.09 : 싱글 앱 이외의 타입에 대한 요청인 경우, package, collection 등..(Invalid App Type)
         */
        if (appInstallData.error.code == 'A.001.02') {
          /*  결제 해야 함 */
          $scope.bPurchased = false;
          if ($scope.detailAppData.event == 'Y') {
            setActionButton('pay', $scope.detailAppData.displayEventPrice, $scope.detailAppData.eventPrice);
          } else {
            setActionButton('pay', $scope.detailAppData.displayPrice, $scope.detailAppData.price);
          }
        } else if (appInstallData.error.code == 'A.001.05') {
          /*  MR을 해야만 App이 정상 실행됨.(NSU Update Required) */
          $scope.installCheckType = 'FYY';
          setActionButton('install');
        } else if (appInstallData.error.code == 'ERR.401') {
          /*  로그인이 안된경우는 로그인 해야 함, 로그인 후 인증 정보를 가지고 결제 여부 판단해서 설치 버튼이나 금액 버튼 보여줌  */
          if ($scope.detailAppData.event == 'Y') {
            setActionButton('pay', $scope.detailAppData.displayEventPrice, $scope.detailAppData.eventPrice);
          } else {
            setActionButton('pay', $scope.detailAppData.displayPrice, $scope.detailAppData.price);
          }
        } else {
          /*  설치 불가능 한 앱  */
          // 2015.09.08 (07.21에 잘못 수정한것을 바로잡음)설치 불가능한앱은 팝업 띄우고 버튼세팅하지 않는다. ex)internal 서버에러
          //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
          $scope.spinner = true;    // 버튼에 Text가 들어가 있지 않으므로 Spinner를 활성화 (설치 불가능 알림 A.001.04) [WOSLQEVENT-91184]
          if (device.currentPage === 'detailApp') {
            errorCode = appInstallData.error.code;
            console.log("## ERROR CODE : " +  errorCode);
            requestParam = {
              type: 'error',
              popupTitle: msgLang.alert_adult_3_2,
              errorMsg: msgLang.alert_adult_3_5,
              errorCodeMsg: 'ERROR CODE: '+errorCode
            };
            $rootScope.popupApp.showPopup($scope, requestParam);
            $scope.spinner = false;
            $scope.$digest();
          }
        }
      } else if (appInstallData.appFile) {
        /*  설치 가능 */
        $scope.detailAppData.appFile = appInstallData.appFile;
        setActionButton('install');
      } else {
        //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
        removeSpinner();
        errorCode = 'updateInstallStatus Invalid Data';
        console.log("## ERROR CODE : " +  errorCode);
        if ($scope.spinner && device.currentPage === 'detailApp') {//버튼설정이 안되있고 앱 상세페이지라면 popup
          requestParam = {
            type: 'error',
            popupTitle: msgLang.alert_adult_3_2,
            errorMsg: msgLang.alert_adult_3_5,
            errorCodeMsg: 'ERROR CODE: '+errorCode
          };
          $rootScope.popupApp.showPopup($scope, requestParam);
        }
      }
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      errorCode = 'updateInstallStatus';
      console.log("## ERROR CODE : " +  errorCode);
      if ($scope.spinner && device.currentPage === 'detailApp') {//버튼설정이 안되있고 앱 상세페이지라면 popup
        requestParam = {
          type: 'error',
          popupTitle: msgLang.alert_adult_3_2,
          errorMsg: msgLang.alert_adult_3_5,
          errorCodeMsg: 'ERROR CODE: '+errorCode
        };
        $rootScope.popupApp.showPopup($scope, requestParam);
      }
    }
  };

  /* 업데이트 요청 */
  var requestCheckUpdate = function(appId, currInstalledVersion, flag) {
    var payload, scopeId, scope = 'detailApp';

    if (flag) scope = flag;
    payload = {
      app_info: appId + ',' + currInstalledVersion + ';'
    };
    scopeId = $scope.$id;
    try {
      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api: '/discovery/item/GAMESAPPS/Update',
          apiAppStoreVersion: 'v7.0',
          //method: 'get', // sadf2
          method: 'post', // openAPI
          payload: payload,
          scope : flag,
          freeAppScopeId : scopeId
        };
        server.requestApi(eventKey.CHECK_UPDATE_APPGAME, params);
      } else {
        // local json 용
        server.requestAppCheckUpdate(payload, scope);
      }
    } catch (e) {}
  };

  /* 업데이트 상태 반영 */
  var checkUpdate = function(e, response) {
    var appUpdateInfo, dataClickAct, errorCode, requestParam;

    // NSU 문제로 인해 PM log 추가하여 확인중..(2016.04.22)
    pmLog.write(pmLog.LOGKEY.NSU_RESPONSE_LOG, {
      serverAPI : '/app/update (A.009) - checkUpdate',
      response : JSON.stringify(response)
    });

    // 포커스 누락을 막습니다.(방어코드 : 이전 페이지 scope가 나중에 요청될 경우 포커스처리를 막습니다.)
    $scope.nextScopeId = response.scopeId;
    if($scope.nextScopeId < $scope.preScopeId){
      return;
    }
    $scope.preScopeId = $scope.nextScopeId;

    try {
      if ($scope.$id != response.scopeId) {
        return;
      }
      /*  stub앱이면 무조건 update  */
//      if ($scope.detailAppData.isStub) {
//        setActionButton('update');
//      } else {
      if (response.error) {
        if (response.responseStatus === 406 && response.error.code.match(/^[A]{1}.[0-9]{3}.[0-9]{2}$/) != null) {
          if (response.error.code == 'A.009.05') {
            $scope.updateCheckType = 'FYY';
            setActionButton('launch');
          } else {
            setActionButton('launch'); //업데이트 조회 실패(실행으로 처리)
          }
        } else {
          setActionButton('launch'); //업데이트 조회 실패(실행으로 처리)
        }
      } else {
        appUpdateInfo = response.appUpdateList;
        /* Condition : TV 설치여부 O, 업데이트할 내역 X */
        if (appUpdateInfo.appCount == 0) {
          setActionButton('launch'); //업데이트 버전 없음
        } else {
          if (appUpdateInfo.appUpdateCheck && appUpdateInfo.appUpdateCheck.length > 0) {
            if (appUpdateInfo.appUpdateCheck[0].errorCode) {
              setActionButton('launch'); // 오류(실행으로 처리)
            } else {
              if (appUpdateInfo.appUpdateCheck[0].bPurchased == true) {
                $scope.bPurchased = appUpdateInfo.appUpdateCheck[0].bPurchased;
              } else {
                $scope.bPurchased = false;
              }
              /**
               * 결제 정보가 없더라도 update 버튼으로 보여준다.
               * 클릭시에 프리미엄, stub은 바로 업데이트
               * 일반 앱에서 무료앱은 로그인되어 있는경우는 바로 업데이트 가능.
               * 일반 앱에서 유료앱은 bPurchased 정보가 있는 경우에만 업데이트 가능하고 그렇지 않은 경우에는 멤버쉽으로 보낸다.
               * appUpdateAct에서 다시 체크하기때문에 우선 update로 보여준다.
               */
              //updateYN = 'K'인경우 강제 update 테스트를 위한 앱이므로 K -> F로 바꾼다
              if (appUpdateInfo.appUpdateCheck[0].updateYN == 'K') {
                appUpdateInfo.appUpdateCheck[0].updateYN = 'F';
              }
              $scope.updateCheckType = appUpdateInfo.appUpdateCheck[0].updateYN + appUpdateInfo.appUpdateCheck[0].prohibitYN + appUpdateInfo.appUpdateCheck[0].nsuYN;
              setActionButton('update');
            }
          } else {
            setActionButton('launch'); //실제 업데이트 할 앱 정보가 없음.
          }
        }
      }
      setActionButtonEnable(true);
//      }
      dataClickAct = $element[0].getElementsByClassName('btn-large')[0].getAttribute('data-click-act');
      if ($scope.isAutoUpdate === true && dataClickAct == 'update') {
        /*  자동 업데이트 한다. */
        //appUpdateAct();
        console.debug('자동 업데이트 타는 조건 입니다.');
      }
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      errorCode = 'checkUpdate';
      console.log("## ERROR CODE : " +  errorCode);
      if ($scope.spinner && device.currentPage === 'detailApp') {//버튼설정이 안되있고 앱 상세페이지라면 popup
        requestParam = {
          type: 'error',
          popupTitle: msgLang.alert_adult_3_2,
          errorMsg: msgLang.alert_adult_3_5,
          errorCodeMsg: 'ERROR CODE: '+errorCode
        };
        $rootScope.popupApp.showPopup($scope, requestParam);
      }
    }
  };

  /* 이벤트 무료 앱은 구매 처리 진행 후 설치 가능 (결제 진행이라 싱크방식으로 호출) */
  var requestEventFreePurchase = function() {
    var purchaseResult, scopeId, payload = {
      app_id: $scope.detailAppData.id,
      pay_amt: 0
      //customParam: $scope.detailAppData   internal server에러 떠서 막음
    };
    scopeId = $scope.$id;
    try {
      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api: '/purchase/appPurchase',
          apiAppStoreVersion: 'v7.0',
          method: 'post',
          params: payload,
          freeAppScopeId: scopeId
        };
        server.requestApi(eventKey.EVENT_FREE_PURCHASE_APPGAME, params);
      } else {
        // local json 용
        purchaseResult = server.requestEventFreeAppPurchase(payload);
      }
      return purchaseResult;
    } catch (e) {}
  };

  var purchaseStatusUpdate = function(e, response) {
    var purchaseResult, errorCode, requestParam;

    if ($scope.$id != response.scopeId) {
      return;
    }
    purchaseResult= response;
    if( purchaseResult.purchaseResult && purchaseResult.purchaseResult.purchaseResult && purchaseResult.purchaseResult.purchaseResult.result == 'Y' ) {
      $scope.usePackageApp ? installPackageCapacityStart() : installCapacityStart(); // 패키지앱과 싱글앱을 구분하여 인스톨 프로세스 진행
    } else if( purchaseResult.purchaseResult.error && purchaseResult.purchaseResult.error.code === 'A.017.110') {//이미 구매한 상태
      $scope.usePackageApp ? installPackageCapacityStart() : installCapacityStart(); // 패키지앱과 싱글앱을 구분하여 인스톨 프로세스 진행
    } else {
      console.log('purchase Result Error', purchaseResult);
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      errorCode = genErrorCode('Purchase Fail');
      console.log("## ERROR CODE : " +  errorCode);
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  /* 인스톨 시작 */
  var installCapacityStart = function() {
    var requestParam, packTotalSize, unPackTotalSize;

    packTotalSize = $scope.detailAppData.appFileList[0].packFileSize;
    unPackTotalSize = $scope.detailAppData.appFileList[0].unpackFileSize;

    requestParam = {'id':$scope.detailAppData.id, 'size':packTotalSize, 'uncompressedSize':unPackTotalSize, 'freeupSpace':true};
    getInstallCapacity.call(requestParam);
  };

  /* 인스톨 시작 */
  var installPackageCapacityStart = function() {
    var requestParam, packTotalSize, unPackTotalSize, membersParam = [];

    packTotalSize = 0;
    unPackTotalSize = 0;
    for (var i = 0; i < $scope.detailAppData.appList.length; i++) {
      if ($scope.installedAppIdJson[$scope.detailAppData.appList[i].id] == 'installed') {
        continue;
      }
      membersParam.push($scope.detailAppData.appList[i].id);
      packTotalSize += $scope.detailAppData.appList[i].appFileList[0].packFileSize;
      unPackTotalSize += $scope.detailAppData.appList[i].appFileList[0].unpackFileSize;
    }
    requestParam = {'id':$scope.detailAppData.id, members:membersParam, 'size':packTotalSize, 'uncompressedSize':unPackTotalSize, 'freeupSpace':true};
    getPackageInstallCapacity.call(requestParam);
  };

  /*  인스톨 시작 - installTarget : 내부 메모리인지 외장 usb인지 타켓 지정해야 한다. */
  var installStart = function(installTarget) {
    var requestParam, packTotalSize, unPackTotalSize, membersParam = [];

    if ($scope.usePackageApp) {
      packTotalSize = 0;
      unPackTotalSize = 0;
      for (var i = 0; i < $scope.detailAppData.appList.length; i++) {
        if ($scope.installedAppIdJson[$scope.detailAppData.appList[i].id] == 'installed') {
          continue;
        }
        membersParam.push($scope.detailAppData.appList[i].id);
        packTotalSize += $scope.detailAppData.appList[i].appFileList[0].packFileSize;
        unPackTotalSize += $scope.detailAppData.appList[i].appFileList[0].unpackFileSize;
      }

      requestParam = {
        'id': $scope.detailAppData.id,
        'members': membersParam,
        'subscribe': false,
        'silence': false,
        'target': installTarget,
        'callbackEvent': 'appInstallResult'
      };
      packageAppInstall.call(requestParam);
    } else {
      requestParam = {
        'id': $scope.detailAppData.id,
        'subscribe': false,
        'silence': false,
        'target': installTarget,
        'callbackEvent': 'appInstallResult'
      };
      appInstall.call(requestParam);
    }
  };

  /**
   * usb 리스트 팝업
   */
  var showUsbListPopup = function(isRefresh) {
    /*USB가 꼽히거나 뽑히면 app.usbListData와 scope.usbListData와 동기화 시켜줌*/
    $scope.usbListData = app.usbListData;
    var errorCode, requestParam;
    try {
      if( $scope.usbListData && $scope.usbListData.length == 0 ) {
        if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
        console.log('usb 리스트 없음.');
        return false;
      }

      if( isRefresh === true ) {
        showUsbListPopupReal(isRefresh);
      } else {
        usbList.storageCapacityInit();
        storageCapacity.call('showUsbListPopup');
      }
    } catch(e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      errorCode = 'showUsbListPopup';
      console.log("## ERROR CODE : " +  errorCode);
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  /**
   * 실제 usb 팝업을 노출 한다.
   */
  var showUsbListPopupReal = function(isRefresh) {
    var requestParam, selectUSBData, selectUSBInfo;

    if (isRefresh === true) {
      /* 갱신일때 팝업이 없으면 다시 보여주지 않는다.  */
      if ($rootScope.popupApp.hide || ($scope.usbListData && $rootScope.popupApp.usbListData.length == 0)) {
        return false;
      }
    }

    //기존에 사용하던 usb 있으면 기본 선택 해준다.
    selectUSBData = storage.getAppsDefaultUsb();

    if( selectUSBData ) {
      selectUSBInfo = JSON.parse(selectUSBData);
    }
    requestParam = {
      type: 'usb',
      popupTitle: ((device.q['X-Device-Language'] === 'en-US') ? msgEnUS2 : msgLang.apps_install_16), // en-US일 경우 예외 처리
      popupBut1: msgLang.cancel,
      popupBut2: msgLang.ok,
      popupButAct1 : 'closeAppPopup',
      popupButAct2: 'usbInstallStartFromPopup',
      usbDesc: msgLang.apps_install_2_1,
      usbListData: $scope.usbListData,
      selectUsbInfo: selectUSBInfo
    };
    if (!device.hasLaunchParamsResult) {  // not from membership
      $rootScope.popupApp.showPopup($scope, requestParam);
    }

    //[WOSLQEVENT-91182] K2Lp보드에서만 USB에 앱설치시 팝업창에 포커스가 안가(재현불가,포커스가 앱설치 화면에 가 있음(INSTALL))
    // 팝업창 생성 후 포커스가 팝업창에 없을 경우 다시 팝업창에 포커스 생성해줌.
    if ($rootScope.popupApp && !$rootScope.popupApp.hide &&
      focusManager.getCurrent().scope && focusManager.getCurrent().scope.scopeName && focusManager.getCurrent().scope.scopeName !== 'popupApp') {
      var buttonArr = document.getElementsByClassName('btn-popup');
      var index = buttonArr.length;
      if(index != undefined && index>0){
        index = index -1;
        $rootScope.popupApp.setFocusItem(buttonArr[index].getAttribute('item'), buttonArr[index]);
      }
    }
  };

  /**
   * 앱 업데이트 실행
   */
  var appUpdateAct = function() {
    var requestParam;

    // 2015.05.13 // 2015향 소스에서 주석 처리됨. // if ($scope.bPurchased === true || $scope.detailAppData.bPremium === true || $scope.detailAppData.isStub === true) {
    // 2015.09.10 정책 변경으로 무료앱인 경우에도 바로 업데이트 시작 WOSLQEVENT-48578
    if( $scope.bPurchased === true || $scope.detailAppData.bPremium === true || isFreeAppCheck()) {
      requestParam = {'id': $scope.detailAppData.id, 'subscribe': false, 'silence': false, 'target': $scope.detailAppData.installedTarget, 'callbackEvent': 'appInstallResult'};
      appInstall.call(requestParam);
    } else {
      /*  구매 하지 않고 프리미엄앱도 아니고 stub앱도 아닌경우 */
//      if ((tempCurrHost.indexOf('qt') > -1)) {
        requestParam = {'id': $scope.detailAppData.id, 'subscribe': false, 'silence': false, 'target': $scope.detailAppData.installedTarget, 'callbackEvent': 'appInstallResult'};
        appInstall.call(requestParam);
//      } else {
//        if (!(device.auth.userID ? true : false)) {
//          $scope.toBeGoScope = $scope.detailAppData.id;
//          requestParam = {
//            query: 'requestLogin',
//            returnTo: {
//              target: 'luna://com.webos.applicationManager',
//              method: 'launch',
//              bypass: {
//                params: {
//                  id: 'com.webos.app.discovery', query: 'category/APPSGAMES/' + $scope.detailAppData.id
//                }
//              }
//            }
//          };
//          //requestParam = {query: 'requestLogin'};
//          membership.callMembershipPage(requestParam);
//        } else {
//          /*  로그인 되어 있을때 무료 앱은 업데이트 가능  */
//          if (isFreeAppCheck()) {
//            requestParam = {'id': $scope.detailAppData.id, 'subscribe': false, 'silence': false, 'target': $scope.detailAppData.installedTarget, 'callbackEvent': 'appInstallResult'};
//            appInstall.call(requestParam);
//          } else {
//            /* 구매한앱 아니라고 팝업 보여준다. */
//            requestParam = {
//              popupTitle: msgLang.apps_install_10,
//              popupBut1: msgLang.no,
//              popupBut2: msgLang.yes,
//              popupButAct1 : 'closeAppPopup',
//              popupButAct2: 'callMemberShipFromPopup',  //멤버쉽 관리로 이동(로그인 화면 아님.)
//              popupDesc: msgLang.apps_popup_update_01_2
//            };
//            $rootScope.popupApp.showPopup($scope, requestParam);
//          }
//        }
//      }
    }
  };

  /* 무료 앱인지 체크 */
  var isFreeAppCheck = function() {
    // 이벤트이면서 이벤트 가격이 0원이면 무료
    if ($scope.detailAppData.event == 'Y' && $scope.detailAppData.eventPrice == 0 || $scope.detailAppData.price == 0) {
      return true;
    } else {
      return false; // 유료앱
    }
  };

  /* 멤버쉽 결제 요청 */
  var appPurchase = function() {
    var requestParam;

    requestParam = {
      appId: $scope.detailAppData.id
    };

    // popup 있으면 close (FC : membership이동 후 back키로 왔을 때 닫혀 있어야 함.)
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
    $scope.setDefaultFocus();

    getAppPurchase.call(requestParam);
  };

  /*  에러코드 생성 */
  var genErrorCode = function(errorCodeVal) {
    var errorCode = '', genCode;
    if( errorCodeVal === 'ERR.401' ) {
      errorCode = '401';
    } else if( errorCodeVal === 'noData' || errorCodeVal === 'A.014.01' ) {
      errorCode = '001';
    } else if( errorCodeVal === 'Invalid Script' ) {
      errorCode = '002';
    } else if( errorCodeVal === 'ajax Fail' ) {
      errorCode = '400';
    } else if( errorCodeVal === 'Invalid Request' ) {
      errorCode = '602';
    } else if( errorCodeVal === 'Invalid Data' ) {
      errorCode = '603';
    } else if( errorCodeVal === 'Purchase Fail' ) {
      errorCode = '604';
    } else {
      errorCode = errorCodeVal;
    }

    genCode = 'Apps3Depth.'+errorCode;
    return genCode;
  };

  var appPurchaseResult = function(e, response) {
    /**
     * 결제 후 딥링크로 다시 돌아오기 때문에 따로 해줄건 없다.
     */
    console.info('memberShip purchase', response);
  };

  var appLaunchResult = function(e, response) {
    var launchResult;

    launchResult = response;
    if( launchResult.returnValue === true ) {
      /*  TODO :  앱 상세에서 실행하는 경우에 실행 했다고 셋팅
       if( HistoryBack.currentHistoryObject.moduleName == storeModules.Apps3Depth.getModuleName() ) {
       console.log('isRunAct 셋팅 true');
       storeModules.Apps3Depth.setIsRunAct(true);
       }*/
      if ($scope.isDeepLink) {//딥링크로 들어와서 실행을 한 것이라면 store를 종료한다.
//        var requestParam = {appId: 'com.webos.app.discovery', appCloseParams: ''};
//        appClose.call(requestParam);
        device.isDeepLinkLaunch = true;
      }
    } else {
      console.log('response.errorCode : ' + response.errorCode);
      if( launchResult.errorCode === -306 ) {
        /**
         * 핀코드 취소시 팝업 안띄우도록 아무 동작 안한다.
         * 메시지는 Pin is not matched 이지만 취소 선택한 상태이다.
         */
        console.log('pin cancel');
      } else if(launchResult.errorCode === -305) {
        /**
         * 핀코드 입력 3번 실패 후 아무동작 안함
         * 팝업도 안 띄운다.
         */
        console.log('failed to validate pincode');
      } else {
        /*  앱 실행 실패 팝업 띄운다.appLaunchFail  */
        console.error('App launch Fail', launchResult);

        if( launchResult.errorText == 'User canceled' ) {
          console.info('사용자 취소로 팝업 띄우지 않는다.');
        }
      }
    }
  };

  /**
   * InstallCapacityResult(설치 허용 결과) 반환값 처리
   * @param response : true 이거나 false
   */
  var installCapacityResult = function(e, response) {
    var errorCode, capacityResult, requestParam;
    try {
      capacityResult = response;
      console.info('queryInstallCapacity', capacityResult);
      pmLog.write(pmLog.LOGKEY.DETAILAPP_GETINSTALLGETCAPACITYRESULT, {menu_name : pmLog.TYPE.APPGAME, response : JSON.stringify(response)});

      /*  설치가 가능한 경우*/
      if (capacityResult.returnValue === true) {
        // 성인앱이고 팝업을 통해 들어오지 않은 경우
        if ($scope.isAdult && !$scope.fromPopUp) {
          requestParam = {
            type: 'popup',
            popupTitle: msgLang.apps_popup_adult_01_2,
            popupBut1: msgLang.ok,
            popupButAct1 : 'installStartFromPopup',
            popupDesc: msgLang.alert_adult_2_6
          };
          $rootScope.popupApp.showPopup($scope, requestParam);
        // 성인앱이 아닌 경우
        } else {
          $scope.fromPopUp = false; //인스톨까지 들어왔다면 다시 frompopup 값 false로 초기화
          installStart({deviceId: 'INTERNAL_STORAGE'});
        }
      /* 설치가 불가능한 경우(용량 부족으로 USB 리스트를 출력)*/
      } else {
        // 내부 메모리에만 설치 가능한 앱
        if ($scope.detailAppData && $scope.detailAppData.appFile && $scope.detailAppData.appFile.internalInstOnly) {

          // 2016-04-07 : tunerless 대응
          var tmpStr = msgLang.apps_popup_01_1;
          if (device.q['X-Device-Platform'].toUpperCase() === 'W16T') {
            if (device.q['X-Device-Language'].toUpperCase() === 'EN-GB') {
              tmpStr = tmpStr.replace(/TV/gi, 'monitor');
            } else if (device.q['X-Device-Language'].toUpperCase() === 'TR-TR') {
              tmpStr = 'Bu uygulama yalnızca dahili hafızaya yüklenebilir. Monitörün dahili hafızasından gereksiz dosyaları sildikten sonra tekrar deneyin.';
            }
          }

          requestParam = {
            type: 'popup',
            popupTitle: msgLang.apps_popup_01,
            popupBut1: msgLang.ok,
            popupButAct1 : 'closeAppPopup',
            popupDesc: ((device.q['X-Device-Language'] === 'en-US') ? msgEnUS1 : tmpStr) // en-US일 경우 예외 처리
          };
          $rootScope.popupApp.showPopup($scope, requestParam);
          tmpStr = null;
        } else {
          // 외부 저장소(USB)가 있는 경우
          if ($scope.usbListData && $scope.usbListData.length > 0) {  // 성인 앱은 잠금 알림 팝업 보여주고 설치 진행
            if ($scope.isAdult) {
              requestParam = {
                type: 'popup',
                popupTitle: msgLang.apps_popup_adult_01_2,
                popupBut1: msgLang.ok,
                popupButAct1 : 'showUsbListFromPopup',
                popupDesc: msgLang.alert_adult_2_6
              };
              $rootScope.popupApp.showPopup($scope, requestParam);
            } else {
              showUsbListPopup(); // 외부 저장소(USB) 목록 팝업 출력
            }
          // 외부 저장소(USB)가 없는 경우(용량X, 외부저장소X) 토스트 메시지 출력
          } else {
            // 토스트 출력(저장 공간이 부족합니다. 불필요한 파일을 삭제하거나 다른 USB 장치를 연결하세요.)
            toast.call({
              msg:msgLang.apps_toast_15+' '+msgLang.apps_toast_16,
              persistent:true,
              noaction:false,
              onclckParam:{appId:'com.webos.app.discovery', params:{query:'category/GAME_APPS/'+$scope.detailAppData.id}}
            });

            $rootScope.$broadcast(eventKey.MYPAGE_APP_INSTALL_FAIL, {errorCode: 'USB_NO_SPACE'});

            // 내부 저장소 초과이며 다중 앱 설치 중 간혹 USB가 있음에도 인식하지 않을 경우 팝업 출력
            //if ($scope.usbListData && $scope.usbListData.length > 0) {
            //  showUsbListPopup();
            //}
          }
        }
      }
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      errorCode = 'installCapacityResult';
      console.log("## ERROR CODE : " + errorCode);
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  var appInstallStatusUpdate = function(e, response) {
    var installResult, requestParam;
    installResult = response;
    try {
      if( installResult.returnValue == true ) {
        /*  설치 요청 성공, 프로그래스바, act 버튼 변경 */
        if ($scope.usePackageApp) {
          setActionButtonEnable(false);
          setActionButton('installing');
        } else {
          setProgressVisible(true);
          console.log('--setActionButton(cancel)--6');
          setActionButton('cancel');
        }
        $scope.$digest();
      } else {
        /*  설치 요청 실패  */
        if( installResult.errorCode === -10 ) {
          /*  다른 tv에서 사용했던 usb로 설치 못한다. */

          // 2016-04-07 : tunerless 대응
          var tmpStr = msgLang.apps_install_17_1 + ' ' + msgLang.apps_install_17_2;
          if (device.q['X-Device-Platform'].toUpperCase() === 'W16T') {
            if (device.q['X-Device-Language'].toUpperCase() === 'EN-GB') {
              tmpStr = tmpStr.replace(/TV/gi, 'monitor');
            } else if (device.q['X-Device-Language'].toUpperCase() === 'TR-TR') {
              tmpStr = 'Başka monitörden yüklenen uygulamalar var. USB aygıtını biçimlendirin ve farklı bir monitörde yüklü olan uygulamaları silin.';
            }
          }

          requestParam = {
            type: 'popup',
            popupTitle: msgLang.apps_install_17_3,
            popupBut1: msgLang.ok,
            popupButAct1 : 'closeAppPopup',
            popupDesc: tmpStr
          };
          $rootScope.popupApp.hidePopup();//현재 usb팝업을 하이드하고 새로운 팝업을 띄우는데 show된것이 hide 되는경우가 있으므로 timeout
          $timeout(function() {
            $rootScope.popupApp.showPopup($scope, requestParam);
            tmpStr = null;
          }, 500);
        } else if( installResult.errorCode === -17 ) {
          console.log('현재 설치 중인 패키지앱이다.(중복 요청 무시)');
        } else {
          toast.call({msg:msgLang.apps_install_14_3+'<br />'+msgLang.apps_install_14_4});
        }
      }
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      var errorCode = $scope.errorCode + '.009'; //appInstallStatusUpdate
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  var appInstallCancelResult = function(e, response) {
    var requestParam;
    console.info('Install Cancel', response);
    //[WOSLQEVENT-118765] app 설치 될 떄 installing 문구가 dimmed 처리 안됨 이슈 처리
    // dowonload가 거의 완료 될 시 cancle 버튼을 눌러 취소하면 response.errorCode : -5 ,  response.errorText : "connot cancel in current state"을 받으면서
    // installing상태에서 setActionButtonEnable(true);되지 않게 예외처리함
    if(response.errorCode !== -5){
      setProgressVisible(false);
      setActionButtonEnable(true);
    }
    //$scope.spinner = true;
    // 인스톨 Cancel 시 Delegator code Number 22 에서 처리해 줌. (관련 이슈 : [WOSLQEVENT-98628] 2016.01.28)
    //requestParam = {id: $scope.detailAppData.id, callbackEvent: 'installAndUpdateChecked'};
    //getAppInfo.call(requestParam);
  };

  var appStatusChangeUpdate = function(e, response) {
    if ($scope.usePackageApp) return;
    installProcessDelegator(response);
  };

  var softwareUpdateRequiredPopup = function () {
    requestParam = {
      type: 'popup',
      popupTitle: msgLang.alert_adult_3_1,
      popupBut1: msgLang.no,
      popupBut2: msgLang.yes,
      popupButAct1 : 'closeAppPopup',
      popupButAct2: 'appUpdateFromPopup',
      popupDesc: msgLang.apps_install_12_1
    };
    $rootScope.popupApp.showPopup($scope, requestParam);
  };

  var nsuUpdateStatusResult = function(e, response) {
    var requestParam;

    console.debug('isNSURunning response', response);
    if (response.returnValue === true) {
      /* 진행중 팝업 보여준다. */
      requestParam = {
        type: 'popup',
        popupTitle: msgLang.apps_install_15,
        popupBut1: msgLang.ok,
        popupButAct1 : 'closeAppPopup',
        popupDesc: msgLang.apps_install_15_1
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    } else {
      /* 업데이트 요청  팝업 */
      softwareUpdateRequiredPopup();
    }
  };

  var nsuGetCurStatusResult = function(e, response) {
    var requestParam;
    requestParam = {
      type: 'popup',
      popupTitle: msgLang.apps_install_15,
      popupBut1: msgLang.ok,
      popupButAct1: 'closeAppPopup',
      popupDesc: msgLang.apps_install_15_1
    };

    console.debug('nsuGetCurStatus response', response);

    if (response.returnValue === true && response.status) {
      /*SU 업데이트가 필요하고 아직 SU업데이트를 하지 않는 상태 - checkUpdate 버젼 체크
       * SU 업데이트 완료 후 TV on/off 후 상태*/
      if(response.status === 'idle') {
        /* 업데이트 요청  팝업 */
        softwareUpdateRequiredPopup();
      }else if(response.status === 'in progress') {
        /* 진행중 팝업 보여준다. */
        $rootScope.popupApp.showPopup($scope, requestParam);
      }else if (response.status === 'completed') {
        /* SU가반드시필요한앱을업데이트하기위해서TV Off/on 동작을해야하는경우 */
        requestParam.popupDesc =  msgLang.alert_2017_su_reboot_1 + msgLang.alert_2017_su_reboot_2 + msgLang.alert_2017_su_reboot_3 ||
          'To update this app, the latest version of the software is required. Update will be applied when you restart your TV. Do you want to restart the TV now?';
        requestParam.popupBut1 = msgLang.no;
        requestParam.popupButAct1 = 'closeAppPopup'; //TV Restart
        requestParam.popupBut2 = msgLang.ok;
        requestParam.popupButAct2 = 'restartTVFromNSU';
        $rootScope.popupApp.showPopup($scope, requestParam);
      }
    }else{
      console.debug('nsuGetCurStatus response Error', response);
    }
  };

  var restartTVFromNSU = function() {
    if (!$rootScope.popupApp.hide) {
      $rootScope.popupApp.hidePopup();
    }
    restartTV.call();
  };

  var closePopup = function() {
    if (!$rootScope.popupApp.hide) {
      // popup message 초기화
      $scope.popupTitle = '';
      $scope.errorMsg = '';
      $rootScope.popupApp.hidePopup();
    }
  };

  var installFromPopup = function() {
    $scope.fromPopUp = true;
    //용량체크부터 인스톨 프로세스 다시시작(단 위 플래그를 통해 팝업을 다시띄우는 것은 막는다)
    $scope.usePackageApp ? installPackageCapacityStart() : installCapacityStart();
    //installStart({deviceId: 'INTERNAL_STORAGE'});
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
  };

  var showUsbListFromPopup = function() {
    showUsbListPopup();
  };

  var launchAppFromPopup = function() {
    var requestParam;

    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
    if ($scope.detailAppData.id !== $rootScope.lastTryAppId) {
      $scope.appLaunchParams = undefined;
    }
    requestParam = {appId: $scope.detailAppData.id, appLaunchParams: $scope.appLaunchParams};
    appLaunch.call(requestParam);
  };

  var suUpdateFromPopup = function() {
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
//    nsuUpdateStatus.call();
    nsuGetCurStatus.call();
  };

  var updateAppFromPopup = function() {
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
    appUpdateAct();
  };

  var callMemberShipFromPopup = function() {
    var requestParam;

    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
    $scope.toBeGoScope = $scope.detailAppData.id;
    requestParam = {
      query: 'requestPersonalInfo',
      returnTo: {
        target: 'luna://com.webos.applicationManager',
        method: 'launch',
        bypass: {
          params: {
            id: 'com.webos.app.discovery', query: 'category/APPSGAMES/' + $scope.detailAppData.id
          }
        }
      }
    };
    //requestParam = {query: 'requestPersonalInfo'};
    membership.callMembershipPage(requestParam);
  };

  var usbPopupListUpdate = function() {
    /**
     * 앱 상세 화면에서 usb 리스트 팝업이 떠 있다면 갱신한다.
     */
    $scope.usbListData = app.usbListData;
    if( $scope.usbListData.length == 0 ) {
      if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
    } else {
      if( !$rootScope.popupApp.hide && $scope.usbListData.length > 0 ) {
        showUsbListPopup(true);
      }
    }
  };

  var appUpdateCheckResult = function(e, response) {
    $scope.spinner = false;
    $scope.isNsuChecked = false;
    $scope.$digest();
    console.debug('SU Update req', response);
    if (response.returnValue == true) {
      /**
       * flagUpdate 이 버전을 찾았을시에 true
       * 버전을 못찾으면 false
       * 버전을 못찾았을시에만 메시지 띄워준다.
       */
      if (response.flagUpdate === false) {
        toast.call({msg: msgLang.apps_toast_18});
        //TODO :
        // loggingApi.log({errorCode:self.genErrorCode('SUUnableUpdate'), responseData:inResponse.data, pageParams:self.pageParams, logLevel : GLOBAL_CONSTANT.LOG_LEVEL.ERROR});
      }
      if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
    } else {
      console.error('response 데이타 없음');
      if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
    }
  };

  var appUpdateFromPopup = function() {
    //$scope.spinner = true;
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup(); // 요청 후 응답 오기까지 최대 30초까지 걸릴수 있다. 먼저 닫아줌.
    appUpdateCheck.call();
    $scope.isNsuChecked = true;
  };

  var usbInstallStartFromPopup = function(e, response) {
    if( !response || !response.deviceId || !response.driveId ) {
      return false;
    }
    storage.setAppsDefaultUsb(JSON.stringify({deviceId: response.deviceId, driveId: response.driveId}));
    installStart({deviceId: response.deviceId, driveId: response.driveId});
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
  };

  var packageBillingStatus = function(e, response) {
    var currentPackageAppStatus, requestParam, appInfo;

    try {
      if( response.app && response.app.bPurchased == 'Y' ) {
        $scope.bPurchased = true; // 결제완료.
      } else {
        $scope.bPurchased = false; // 미결제.
      }

      /**
       * 현재 설치/제거 중인지 체크
       */
      currentPackageAppStatus = $scope.packageAppStatusList[$scope.detailAppData.id];
      if(currentPackageAppStatus) {
        /*  진행 중인 Package App */
        console.log('currentPackageAppStatus', currentPackageAppStatus);
        packageInstallProcessDelegator('', currentPackageAppStatus);
      } else {
        /**
         * 설치 여부 체크
         */
        /*체크 배열 초기화*/
        $scope.installedCheckArray = [];
        $scope.installedAppIdArray = [];
        $scope.installedAppIdJson = {};
        if ($scope.packageAppList.length > 0) {
          appInfo = $scope.packageAppList[$scope.packageAppIndex];
          if (appInfo) {
            requestParam = {id: appInfo.id, callbackEvent: 'packageInstalledChecked'};
            getAppInfo.call(requestParam);
          }
          $scope.packageAppIndex ++;
        }
      }
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      var errorCode = $scope.errorCode + '.007';//빌링 스태터스
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  /**
   * 패키지 앱 설치 확인
   */
  var packageInstallCheck = function(e, response) {
    var errorCode, requestParam, appInfo;

    try {
      if (response.returnValue === true && response.appInfo) {
        /*  설치  */
        $scope.installedCheckArray.push('Y');
        $scope.installedAppIdArray.push(response.appInfo.id);
        $scope.installedAppIdJson[response.appInfo.id] = 'installed';
      } else {
        /*  미설치 */
        $scope.installedCheckArray.push('N');
      }
      console.log('installedCheckArray[' + $scope.installedCheckArray.length + '] packageAppList[' + $scope.packageAppList.length + ']');
      /*  모두 체크 완료  */
      var isAllInstalled = true;
      if($scope.installedCheckArray && $scope.installedCheckArray.length) {
        for (var i=0; i<$scope.installedCheckArray.length; i++) {
          if($scope.installedCheckArray[i] === 'N') {
            isAllInstalled = false;
          }
        }
      }
      if ($scope.installedCheckArray.length == $scope.packageAppList.length) {
        $scope.spinner = false;
        setActionButtonEnable(true);
        if ($scope.installedAppIdArray.length == $scope.installedCheckArray.length && isAllInstalled) {
          /*  모두 설치 완료  */
          setActionButton('launch');
          //$scope.setDefaultFocus();
          //var element = $element[0].getElementsByClassName('btn-large')[0];
          var element = $element[0].getElementsByClassName('focus')[0];
          if(util.isAWSServer()){
            if(element){
              var item = element.getAttribute('item');
              if (item === 'item-package-0') {
                $scope.setDefaultFocus();
              } else {
                $scope.setFocusItem(item, element);
              }
            }else{
              if(focusManager.getLastFocus().target === 'rating'){
                $scope.setFocusItem(focusManager.getLastFocus().target, focusManager.getLastFocus().element);
              }else{
                $scope.setDefaultFocus();
              }
            }
          }else{
            var item = element.getAttribute('item');
            if (item === 'item-package-0') {
              $scope.setDefaultFocus();
            } else {
              $scope.setFocusItem(item, element);
            }
          }
        } else {
          /*  미설치 */
          if ($scope.detailAppData.event == 'Y' && $scope.detailAppData.eventPrice == 0) {
            /*  이벤트 이면서 0원  */
            setActionButton('pay', $scope.detailAppData.displayEventPrice, $scope.detailAppData.eventPrice);
          } else if ($scope.detailAppData.price == 0) {
            /*  그냥 0원 */
            setActionButton('pay', $scope.detailAppData.displayPrice, $scope.detailAppData.price);
          } else {
            /*  유료는 결제 정보 체크  */
            if ($scope.bPurchased === true) {
              setActionButton('install');
            } else if ($scope.bPurchased === false) {
              if ($scope.detailAppData.event == 'Y') {
                setActionButton('pay', $scope.detailAppData.displayEventPrice, $scope.detailAppData.eventPrice);
              } else {
                setActionButton('pay', $scope.detailAppData.displayPrice, $scope.detailAppData.price);
              }
            }
          }
        }
      }
      if ($scope.packageAppList.length > $scope.packageAppIndex) {
        appInfo = $scope.packageAppList[$scope.packageAppIndex];
        requestParam = {id: appInfo.id, callbackEvent: 'packageInstalledChecked'};
        getAppInfo.call(requestParam);
        $scope.packageAppIndex ++;
      }
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      errorCode = 'packageInstallCheck';
      console.log("## ERROR CODE : " + errorCode);
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  var appCheckLaunchFromPopup = function(e, response) {
    if (!response) return;
    if (!$rootScope.popupApp.hide) $rootScope.popupApp.hidePopup();
    $scope.toBeGoScope = response.appId;
    appService.appCheckLaunch(response);
  };

  var ratingComplete = function(e, resonse) {
    var requestParam;
    /*평가하기 버튼 클릭 전 평가수*/
    var updateDetailTimeCount = 0;
    $rootScope.rating.hidePopup();
    $scope.isRatingRes = false;
    requestDetailData();
    //만약 포커스가 존재 안할시에 평가하기 버튼에 포커스줌
    if(!document.body.classList.contains('hover-mode') && $element[0].getElementsByClassName('focus')[0] ===  undefined){
      $scope.setFocusItem('rating',$element[0].getElementsByClassName('btn-small')[0]);
    }
    if(resonse.rateResult && resonse.rateResult.serverResult == 'Y') {
      //[WOSLQEVENT-86911]서버에서 데이터가 늦게와서 팝업메세지를 띄운곳과 현재 페이지가 다른 경우 팝업에 포커스가 가게 수정
      //팝업의 Close가 닫힐 수 있게 type:error로 변경함.
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_rate_2_2,
        popupBut1: msgLang.ok,
        errorMsg: msgLang.alert_adult_2_3
      };
      /*[WOSLQEVENT-82869] 평가는 완료되었으나, 서버단에서 앱상세정보의 앱평가점수 및 평가수가 변경되기전에
       앱상세정보를 조회하여 앱상세정보가 반영안되는 로직 수정 , 10초후에도 앱상세정보가 변경이 안되면 에러메세지 뜸게함.*/
      var updateDetailTime = setInterval(function() {
        updateDetailTimeCount ++;
        if (updateDetailTimeCount === 10) {
          clearInterval(updateDetailTime);
          //에러팝업창뜸
          errorCode = 'ratingComplete';
          //$rootScope.pageManager.movePageError(errorCode, $scope, $element);
          requestParam = {
            type: 'error',
            popupTitle: msgLang.alert_adult_3_2,
            errorMsg: msgLang.alert_adult_3_5,
            errorCodeMsg: 'ERROR CODE: '+errorCode
          };
          $rootScope.popupApp.showPopup($scope, requestParam);
        }
        if ($scope.isRatingRes) {
          //[WOSLQEVENT-113515] 이상희 연구원 요청
          //평가완료 팝업창 뜨기전에 평가하기 버튼 다시 누른 경우 이전에 평가한 별점에 대한 평가완료 팝업 제공하지 않도록 구현
          if(util.isAWSServer() && ($rootScope.popupApp.open || $rootScope.rating.open)) {
            //nothing
          }else{
            $rootScope.popupApp.showPopup($scope, requestParam);
          }
          clearInterval(updateDetailTime);
        }else{
          requestDetailData();
        }
      }, 1000);
    }else {
      console.error('rating.js Rating.Apps.setScore setScore error', JSON.stringify(resonse));
    }
  };

  var requestDetailData = function() {
    var payload, appId, flag, errorCode, scopeId;

    //2015.09.21 방어코드 추가 id값이 null [WOSLQEVENT-59224]
    if(!$scope || !$scope.detailAppData || !$scope.detailAppData.id){ return; }
    if($scope.detailAppData.id === null){return;}
    $scope.isRatingRes = true;
    appId = $scope.detailAppData.id;
    flag = 'update';
    payload = {app_id: appId};
    scopeId = $scope.$id;

    //페이지 리로드 팝업이면 닫지 않는다. 문구로 구분 WOSLQEVENT-53250 2015.09.11
    if (!$rootScope.popupApp.hide && $rootScope.popupApp.title !== msgLang.alert_adult_7) $rootScope.popupApp.hidePopup();

    try {
      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api : '/discovery/item/GAMESAPPS/Detail',
          apiAppStoreVersion: 'v7.0',
          method : 'get',
          params : payload
        };
        server.requestApi(eventKey.UPDATE_LOADED_APPGAME, params);
      } else {
        // local json 용
        server.requestAppNGameDetail(payload, scopeId, flag);
      }
    } catch (e) {
      //$scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      errorCode = 'requestDetailData';
      //$rootScope.pageManager.movePageError(errorCode, $scope, $element);
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  var requestDetailDataSmall = function() {
    var payload, appId, flag, errorCode, scopeId;

    appId = $scope.detailAppData.id;
    flag = 'update';
    payload = {app_id: appId};
    scopeId = $scope.$id;

    //페이지 리로드 팝업이면 닫지 않는다. 문구로 구분 WOSLQEVENT-53250 2015.09.11
    if (!$rootScope.popupApp.hide && $rootScope.popupApp.title !== msgLang.alert_adult_7) $rootScope.popupApp.hidePopup();

    try {
      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api : '/discovery/item/GAMESAPPS/Detail',
          apiAppStoreVersion: 'v7.0',
          method : 'get',
          params : payload
        };
        server.requestApi(eventKey.SMALL_UPDATE_LOADED_APPGAME, params);
      } else {
        // local json 용
        server.requestAppNGameDetail(payload, scopeId, flag);
      }
    } catch (e) {
      //$scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      errorCode = 'requestDetailDataSmall';
      //$rootScope.pageManager.movePageError(errorCode, $scope, $element);
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  var updateDetailInfo = function(e, response) {
    try {
      if ($scope.detailAppData  &&response.appDetail.app) {
        //$scope.detailAppData = response.appDetail.app
        $scope.detailAppData.evaluationYN = response.appDetail.app.evaluationYN;
        $scope.detailAppData.evaluationPoint = response.appDetail.app.evaluationPoint;
        $scope.detailAppData.evaluationCount = response.appDetail.app.evaluationCount;
        $scope.detailAppData.evaluationAverage = response.appDetail.app.evaluationAverage;
        $scope.detailAppData.bPurchased = response.appDetail.app.bPurchased;
        /*  넷플릭스일때만 상세에서 컬러 지운다.  */
        $scope.detailAppData._saveIconColor = response.appDetail.app.iconColor;
        if( $scope.detailAppData.id == 'netflix' ) {
          $scope.detailAppData.iconColor = '';
        }
        if (response.appDetail.app.appList) $scope.packageData = response.appDetail.app.appList;

        //패키지앱인경우 앱리스트 저장
        if ($scope.usePackageApp) {
          $scope.packageAppList = response.appDetail.app.appList;
        }
        // 인스톨 버튼 설정 처리
//        if ((!$scope.detailAppData.bPurchased || $scope.detailAppData.bPurchased !== 'Y')
//            && ($scope.detailAppData.price && $scope.detailAppData.price !== 0)){
//          if ($scope.detailAppData.event == 'Y') {
//            setActionButton('pay', $scope.detailAppData.displayEventPrice, $scope.detailAppData.eventPrice);
//          } else {
//            setActionButton('pay', $scope.detailAppData.displayPrice, $scope.detailAppData.price);
//          }
//        } else
        if ($scope.usePackageApp) {
          requestAppPackage();
          $scope.packageAppIndex = 0; //패키지앱 결제상태 확인 전 appindex초기화
          packageStatusCheck(); //패키지앱의 결제 상태 확인.
        } else {
          //update detail info에서는 할 필요 없음 convertSize($scope.detailAppData.appFileList[0].packFileSize + $scope.detailAppData.appFileList[0].unpackFileSize);
          /* 현재 설치/제거 중인지 체크 */
          currentAppStatus = $scope.appStatusList[$scope.detailAppData.id];
          if (currentAppStatus) {
            if (currentAppStatus.details.paused === true) {
              setProgressVisible(true);
              if (currentAppStatus.details.simpleStatus === 'download') {
                setActionButtonEnable(true);
                console.log('--setActionButton(cancel)--7');
                setActionButton('cancel');
              } else if (currentAppStatus.details.simpleStatus === 'install') {
                var curButton = $element[0].getElementsByClassName('btn-large')[0].getAttribute('data-click-act');
                //WOSLQEVENT-54941 버튼이 launch에서 installing으로 바뀌는 경우는 실제적으로 없으므로 return
                if(curButton !== 'launch') {
                  setActionButtonEnable(false);
                  setActionButton('installing');
                }
              }
              console.log('--setActionButton(cancel)--8');
              setActionButton('cancel');
              installProcessDelegator(currentAppStatus);
            } else if (currentAppStatus.details.simpleStatus === 'download') {
              console.log('---currentAppStatus.details.simpleStatus is download --- $scope.usbStatus : '+$scope.usbStatus);
              if ($scope.usbStatus === 'added' || $scope.usbStatus === 'removed' || $scope.usbStatus === 'updated' ) {
                // do noting
              } else {
                setProgressVisible(true);
                setActionButtonEnable(true);
                console.log('--setActionButton(cancel)--9');
                setActionButton('cancel');
                installProcessDelegator(currentAppStatus);
              }
            } else if (currentAppStatus.details.simpleStatus === 'install') {
              var curButton = $element[0].getElementsByClassName('btn-large')[0].getAttribute('data-click-act');
              //WOSLQEVENT-54941 버튼이 launch에서 installing으로 바뀌는 경우는 실제적으로 없으므로 return
              if(curButton !== 'launch') {
                setProgressVisible(true);
                setActionButtonEnable(false);
                setActionButton('installing');
                installProcessDelegator(currentAppStatus);
              }
            } else {
              /*  삭제 중인 상태  */
              switch (currentAppStatus.statusValue) {
                case 32: case 33: case 34: case 259: case 260: case 261: case 38: case 40: case 18: case 19: case 21:
                console.log('--setActionButton(cancel)--10--' + currentAppStatus.statusValue);
                setActionButton('cancel');
                setActionButtonEnable(false);
                installProcessDelegator(currentAppStatus);
                break;
                case 31:
                  // when delete completed, do not setActionButton() func
                  setActionButtonEnable(false);
                  installProcessDelegator(currentAppStatus);
                  break;
                case 22:
                  // installProcessDelegator 함수에서 버튼세팅해줌
                  setActionButtonEnable(false);
                  installProcessDelegator(currentAppStatus);
                  break;
                default:
                  console.log('--setActionButton(cancel)--11--' + currentAppStatus.statusValue);
                  setActionButton('cancel');
                  setActionButtonEnable(false);
                  installProcessDelegator(currentAppStatus);
                  break;
              }
            }
          } else {
            /* 설치 여부 판단해서 act 버튼 셋팅 */
            //spinner값이 기본으로 안나오게 설정
            $scope.spinner = false;
            if(device.isOnline) {  // [WOSLQEVENT-68943] 네트워크를 off/on하고 바로 들어온 경우를 위한 방어코드
              //$scope.spinner = true;
            }
            requestParam = {id: $scope.detailAppData.id, callbackEvent: 'installAndUpdateChecked'};
            getAppInfo.call(requestParam);
          }
        }
      } else {
        updateDetailInfoError(response);
      }
    } catch (e) {
      updateDetailInfoError(response);
    }
  };

  var updateDetailInfoError = function(response) {
    //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
    removeSpinner();
    var errorCode = $scope.errorCode + '.010';//updateDetail Info
    requestParam = {
      type: 'error',
      popupTitle: msgLang.alert_adult_3_2,
      errorMsg: msgLang.alert_adult_3_5,
      errorCodeMsg: 'ERROR CODE: '+errorCode
    };
    $rootScope.popupApp.showPopup($scope, requestParam);
  }

  var updateSmallDetailInfo = function(e, response) { //여기서는 버튼 정보 갱신 안함.
    try {
      if ($scope.detailAppData && response.appDetail.app) {
        //$scope.detailAppData = response.appDetail.app
        $scope.detailAppData.evaluationYN = response.appDetail.app.evaluationYN;
        $scope.detailAppData.evaluationPoint = response.appDetail.app.evaluationPoint;
        $scope.detailAppData.evaluationCount = response.appDetail.app.evaluationCount;
        $scope.detailAppData.evaluationAverage = response.appDetail.app.evaluationAverage;
        $scope.detailAppData.bPurchased = response.appDetail.app.bPurchased;
        /*  넷플릭스일때만 상세에서 컬러 지운다.  */
        $scope.detailAppData._saveIconColor = response.appDetail.app.iconColor;
        if($scope.detailAppData.id == 'netflix' || $scope.detailAppData.id == 'Netflix') $scope.detailAppData.iconColor = '';
        if (response.appDetail.app.appList) $scope.packageData = response.appDetail.app.appList;
      }
    } catch (e) {
      //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
      removeSpinner();
      var errorCode = $scope.errorCode + '.010';//updateDetail Info
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  var installedAppsChange = function() {
    spaceInfo.update(updateSpaceInfo);
  };

  var updateSpaceInfo = function() {
    pmLog.write(pmLog.LOGKEY.SPACE_LOG, {
      key : 'updateSpaceInfo_1',
      totalSize : device.spaceTotalSize,
      freeSize : device.spaceFreeSize,
      usedSize : device.spaceUsedSize
    });
    $scope.spaceAvailableSize = parseInt(device.spaceFreeSize.split(' '));
    pmLog.write(pmLog.LOGKEY.SPACE_LOG, {
      key : 'updateSpaceInfo_2',
      totalSize : device.spaceTotalSize,
      freeSize : device.spaceFreeSize,
      usedSize : device.spaceUsedSize
    });
    if($scope.spaceAvailableSize < 0) { //[WOSLQEVENT-62424] 음수 표기 방지
      $scope.spaceAvailableSize = 0;
    }
    pmLog.write(pmLog.LOGKEY.SPACE_LOG, {
      key : 'updateSpaceInfo_3',
      totalSize : device.spaceTotalSize,
      freeSize : device.spaceFreeSize,
      usedSize : device.spaceUsedSize
    });
    $scope.spaceAvailableSize += " ";
    //[WOSLQEVENT-68943]설치했던 App Detail page 출력되면서 무한로딩(Launcher에 App 설치된 상태)
    //[WOSLQEVENT-74977]thumbnail 무한로딩 발생
    //Q-Start+ On 에서 DC Power Off/On 한 후에 앱 상세페이지 올 경우 spinner가 발생함.
    //Q-Start+ On에서 진입할 경우 이전 spinner의 값을 가지고 있을것으로 생각되어 해당 spinner 상태값 변경(true->false)
    //DC Power Off/On에서 최근상태로 진입할 경우 용량체크만 하고 다른 이벤트 발생하지 않아 해당 소스 수정.
    if (device.isQuickStartPlusState) {
      $scope.spinner = false;
    }
    $scope.$digest();
  };

  var destroyScope = function() {
    delete scroll;
    scrollBar = null;
    $element.remove();
    $scope.$destroy();
  };

  var networkDisconnect = function() {
    console.debug('Apps3Depts networkDisconnect');

    /*  설치 진행 중이면 설치중 프로그래스바 없애준다.  */
    if( $element.hasClass('install') ) {
      console.log('설치 중 프로그래스바 없애준다.');
      $scope.useProgressbar = false;
      $scope.progressPercent = 0;
    }
  };

  var networkConnect = function() {
    refreshScreen();
  };

  /**
   * 외부에서 act 버튼 갱신 하는 함수
   * 또는, 유료앱 결제시 앱상세화면 갱신
   */
  var refreshScreen = function(e, paramObj) {
    //refresh 하려는 페이지가 아닐 경우 비갱신
    if (util.isAWSServer()) {
      //[WOSLQEVENT-112674] 바로 실행 버튼 유지됨( 패키지 앱에 대한 경우 빠져있음)
      if (paramObj && paramObj.app && $scope.appId !== paramObj.app.id && !$scope.detailAppData && !$scope.detailAppData.appList) {
        //패키지 앱이 아닐경우
        console.log('[REFRESH ACTING-MSG] This page don\'t need to refresh....');
        return;
      }else if (paramObj && paramObj.app && $scope.appId !== paramObj.app.id && $scope.detailAppData.appList) {
        //패키지 앱일 경우
        var tmpAppIdFlag = false;
        //[WOSLQEVENT-112675] package앱일 경우 앱 아이디 비교
        for (var i = 0; i < $scope.detailAppData.appList.length; i++) {
          if (paramObj.app.id === $scope.detailAppData.appList[i].id) {
            tmpAppIdFlag = true;
          }
        }
        if(!tmpAppIdFlag){
          return;
        }
      }
    }else{
      if (paramObj && paramObj.app && $scope.appId !== paramObj.app.id) {
        console.log('[REFRESH ACTING-MSG] This page don\'t need to refresh....');
        return;
      }
    }

    //Rating팝업이 열려있을 경우. logout되었다면 닫아줌.
    //[WOSLQEVENT-111788] 평가하기 팝업 중 refreshScreen 시 팝업이 안닫히는 경우가 있어
    // && !(device.auth.userID ? true : false) 해당 조건 삭제
    if (util.isAWSServer()) {
      if($rootScope.rating.open) {
        $rootScope.rating.hidePopup();
      }
    } else {
      if($rootScope.rating.open && !(device.auth.userID ? true : false)) {
        $rootScope.rating.hidePopup();
      }
    }
    // 로그인 정보 갱신
    $scope.isLogin = device.auth.userID ? true : false;
    $scope.usbStatus = ''; // default : empty String
    if (!util.isAWSServer()) {
      if (paramObj && paramObj.change) {
        switch (paramObj.change) {
          // App 설치/업데이트 완료 시
          case 'added':
          case 'updated':
            if (paramObj.app && ($scope.detailAppData.id === paramObj.app.id)) {
              $scope.usbStatus = paramObj;
              //[WOSLQEVENT-109628] 앱 업데이트 및 설치 완료시 프로그래바가 보이므로 존재한다면 삭제해줌.
              setProgressVisible(false);
              setActionButtonEnable(true);
              setActionButton('launch');
              removeSpinner();
            }
            break;
          case 'removed':
            // App 삭제 시
            // [WOSLQEVENT-101772] Install 버튼 비활성화 됨
            if (paramObj.app && ($scope.detailAppData.id === paramObj.app.id)) {
              $scope.usbStatus = paramObj;
              setActionButtonEnable(true);
              setActionButton('install');
              removeSpinner();
            }
            //Package앱일때 설치 후 하나라도 앱 삭제하면 버튼이 Install로 보여야함.
            if ($scope.detailAppData.appList != undefined) {
              for (var i = 0; i < $scope.detailAppData.appList.length; i++) {
                if (paramObj.app.id === $scope.detailAppData.appList[i].id) {
                  //Package앱일때 삭제되었으면 $scope.installedAppIdJson 객체에 삭제된 정보 넣어줌
                  //안넣어주면 Package앱 삭제하고 용량계산할때 메모리 없다고 나옴.
                  $scope.installedAppIdJson[$scope.detailAppData.appList[i].id] = "";
                  $scope.usbStatus = paramObj;
                  setActionButtonEnable(true);
                  setActionButton('install');
                  removeSpinner();
                }
              }
            }
            break;
        }
        requestDetailDataSmall();
      } else {
        requestDetailData();
      }
    }else{
      if (paramObj && paramObj.change) {
        switch (paramObj.change) {
          // App 설치/업데이트 완료 시
          case 'added':
          case 'updated':
            if (paramObj.app && ($scope.detailAppData.id === paramObj.app.id) && $scope.detailAppData.appList === undefined) {
              $scope.usbStatus = paramObj;
              //[WOSLQEVENT-109628] 앱 업데이트 및 설치 완료시 프로그래바가 보이므로 존재한다면 삭제해줌.
              setProgressVisible(false);
              setActionButtonEnable(true);
              setActionButton('launch');
              removeSpinner();
            } else if (paramObj.app && $scope.detailAppData.appList != undefined && tmpAppIdFlag) {
              //[WOSLQEVENT-113520] 이미 패키앱이 설치라는 버튼이 있을 경우 해당 로직 타게 수정
              //패키지 앱이 추가된 경우 launch로 바뀔수 있는 경우수가 있음.
              if($scope.actBtntxt === msgLang.apps_install) {
                //[WOSLQEVENT-112675] Package Test 2 -> 앱 목록에서 멤버 앱 선택 -> 앱 설치 -> Back 키 입력 -> 앱 설치 완료시 설치 버튼 유지됨
                // 패키지 앱 안에 앱 각각 설치하고 패키지 앱 화면에 들어온 경우(패키지앱 설치여부 재 확인하여 버튼 변경해줌)
                var requestParam = {id: $scope.detailAppData.appList[0].id, callbackEvent: 'packageInstalledChecked'};
                $scope.packageAppIndex = 0;
                $scope.installedCheckArray = [];
                $scope.installedAppIdArray = [];
                $scope.installedAppIdJson = {};
                getAppInfo.call(requestParam);
              }
            }
            break;
          case 'removed':
            // App 삭제 시
            // [WOSLQEVENT-101772] Install 버튼 비활성화 됨
            if (paramObj.app && ($scope.detailAppData.id === paramObj.app.id)) {
              $scope.usbStatus = paramObj;
              setActionButtonEnable(true);
              setActionButton('install');
              removeSpinner();
            }
            //Package앱일때 설치 후 하나라도 앱 삭제하면 버튼이 Install로 보여야함.
            if ($scope.detailAppData.appList != undefined) {
              for (var i = 0; i < $scope.detailAppData.appList.length; i++) {
                if (paramObj.app.id === $scope.detailAppData.appList[i].id) {
                  //Package앱일때 삭제되었으면 $scope.installedAppIdJson 객체에 삭제된 정보 넣어줌
                  //안넣어주면 Package앱 삭제하고 용량계산할때 메모리 없다고 나옴.
                  $scope.installedAppIdJson[$scope.detailAppData.appList[i].id] = "";
                  $scope.usbStatus = paramObj;
                  setActionButtonEnable(true);
                  setActionButton('install');
                  removeSpinner();
                }
              }
            }
            break;
        }
        requestDetailDataSmall();
      } else {
        requestDetailData();
      }

    }
  };

  var changeLoginStatus = function() {
    //$scope.spinner = true;
    //getAppinfo.call이 updateinfo의 버튼세팅로직에 추가 되었으므로 삭제
//    requestParam = {id: $scope.detailAppData.id, callbackEvent: 'installAndUpdateChecked'};
//    getAppInfo.call(requestParam);
    $timeout(function() {
      requestDetailData();
    }, 500);
  };
  ///////////////////////////////////////////////////////////////////////////
  var showAllImage = false;

  $scope.getShowAllImage = function() {
    return showAllImage;
  };

  $scope.setShowAllImage = function(show) {
    // console.log('detailApp.setShowAllImage, show=' + show);
    showAllImage = show;

    if (show) {
      $scope.$broadcast('lazyImage');
    }
  };

  //[WOSLQEVENT-75212] 가끔씩 일시적 장애 팝업이 출력되며 무한로딩 발생
  //  에러날때 spinner가 존재한다면 없애줌
  var removeSpinner = function() {
    if($element[0].getElementsByClassName('spinner')[0] != undefined){
      $element[0].getElementsByClassName('spinner')[0].style.visibility = 'hidden';
    }
  };

  //App 구매 가능 여부 확인 요청(로그인이 안되어있어서 구동 가능)
  //권오룡주임님
  // purchasable 값의 의미는 설치가능여부가 아니고 구매가능여부입니다.
  // 해당 앱을 구매했으면(bPurchased가 Y이면) purchasable 값은 N이 됩니다.
  // 설치 불가능한 경우에는 A.021.26과 같은 에러코드가 리턴이 됩니다.
  // 200 OK가 떨어지면 설치 가능한 경우라고 보시면 될 것 같습니다.
  var requestCheckAppPurchase = function() {
    var payload, purposeType;
    purposeType = null;
    scopeId = $scope.$id;
    payload = {
      app_id: $scope.detailAppData.id,
      purpose_type: purposeType
    };
    try {
      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api: '/discovery2016/apppurchase/checkapppurchase',
          apiAppStoreVersion: 'v7.0',
          method: 'get',
          params: payload,
          freeAppScopeId: scopeId
        };
        server.requestApi(eventKey.PURCHASABLE_APP, params);
      } else {
        // local json 용
        server.requestAppPurchasable(payload);
      }
    } catch (e) {}
  };

  var doInstallAction = function () {
    //    if (device.auth.userID ? true : false) {
//    if ((tempCurrHost.indexOf('qt') > -1) || (device.auth.userID ? true : false)) {
      /*  로그인 */
      if ($scope.installCheckType == 'FYY') {
        /*  MR을 해야만 App 이 정상 실행됨.(NSU Update Required)  */
//        nsuUpdateStatus.call();
        nsuGetCurStatus.call();
      } else {
        /*  이벤트 이면서 결제 내역이 없는데 0원 앱일때는 결제 태운다 */
        if ($scope.detailAppData.event == 'Y' && $scope.bPurchased === false) {
          requestEventFreePurchase();
        } else {
          $scope.usePackageApp ? installPackageCapacityStart() : installCapacityStart(); // 패키지앱과 싱글앱을 구분하여 인스톨 프로세스 진행
        }
      }
//    }
  };

  var appInstallPosspossibleResult = function(e, response) {
    // NSU 문제로 인해 PM log 추가하여 확인중..(2016.04.22)
    pmLog.write(pmLog.LOGKEY.NSU_RESPONSE_LOG, {
      serverAPI : '/app/checkapppurchase (A.021) - appInstallPosspossibleResult',
      response : JSON.stringify(response)
    });

    // response 가 없는 경우에 키무감과 무한로딩 현상이 발생하여 예외처리 [NCVTDEFECT-2446]
    if (!response || !response.appDetail || response.appDetail === '') {
      removeSpinner();
      var errorCode = 'Event : purchasableApp, Error : There is no response.';
      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: '+errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }

    console.log('response.appDetail : '+JSON.stringify(response.appDetail));
    //무료인 앱 경우 install에서 설치가능여부 확인하므로 유료인경우만 해당 로직 체크하게 수정
    //무료앱같은 경우 install에 예외처리가 다 구현되어있으므로 해당 로직 안타게 수정
    if (response.httpStatus && response.httpStatus != 200 && $scope.detailAppData.price > 0) {
      //앱설치가 불가능한 경우
      //구매가능여부에서 에러가 떨어질때
      //A.021.01	Wrong App ID (appId = null)
      //A.021.02	Invalid Purpose type
      //A.021.03	User Not Found 해당 사용자가 존재하지 않습니다.
      //A.021.06	Inappropriate age for using this App.
      //A.021.24	App Info Not Found (존재하지 않는 appId일 경우)
      //A.021.26	Device H/W do not support execution of this App
      //A.021.27	Device S/W do not support execution of this App NSU Update를 수행해도, App 실행 불가
      //A.021.28	NSU Update Required - NSU Update를 수행하면, App실행 가능
      //A.021.29	Special Care User - Special Care로 설정되어 있는 사용자는 구매 금지
      //[WOSLQEVENT-84172],[WOSLQEVENT-84567],[WOSLQEVENT-84389]NSU Update 수행할 수 있게 수정
      //유료앱이고 NSU Update가 필요하면 해당 로직 타게 수정
      $rootScope.spinner.hideSpinner(); // remove the spinner
      var errorCode = response.appDetail.error.code;
      removeSpinner();

      if (errorCode === 'A.021.28' ) {
//        nsuUpdateStatus.call();
        nsuGetCurStatus.call();
        return;
      }

      requestParam = {
        type: 'error',
        popupTitle: msgLang.alert_adult_3_2,
        errorMsg: msgLang.alert_adult_3_5,
        errorCodeMsg: 'ERROR CODE: ' + errorCode
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    } else {
      //[WOSLQEVENT-104046] QuickStartPlus모드에서 DC off후에 성인인증 내역은 없어져야한다.
      //하지만 membership에서 getAdultStatus(subscribe : true)에서 성인인증내역을 자동으로 가지고와서 강제적으로 해당 값 설정해줌.
      if (device.isQuickStartPlusAdultStatus) {
        device.auth.adultStatus === 'notVerified';
        //한번 성인인증 후에 DC off할때까지 성인인증 내역 가지고 가게함.
        device.isQuickStartPlusAdultStatus = false;
      }
      /*설치, 업데이트, 구매 전 성인체크*/
      var dataClickAct = $element[0].getElementsByClassName('btn-large')[0].getAttribute('data-click-act');

      //if (($scope.detailAppData.bPremium !== true || $scope.detailAppData.isStub !== true) && dataClickAct !== 'launch') {
      if (($scope.detailAppData.bPremium === false || $scope.detailAppData.isStub === false) && dataClickAct !== 'launch') {
        membership.actionAfterGetAdultStatus(function(callBackAdultStatus) {
          $rootScope.spinner.hideSpinner(); // remove the spinner
          if (callBackAdultStatus === 'failed') { // Luna failed (ex: timeout)
            lunaFailedPopup();
            return;
          }
          //[WOSLQEVENT-117007] Quick Start Pluse on 상태에서 자동로그인 체크 안한 상태에서 로그인하여
          //power off/on 후에 성인인증값이 지워지지 않아서(device.auth.adultStatus = 'verified';) 로그인이 안된상태이면 성인인증이 안되어있다고 하드코딩해줌.
          if(!device.auth.userID){
            device.auth.adultStatus = 'notVerified';
          }
          if (dataClickAct === 'install' || dataClickAct === 'update' || dataClickAct === 'pay') {
            if (device.auth.adultStatus !== 'Verified' && $scope.detailAppData.adultYN === 'Y') {
              isAdultContent = adultProcess.getAdultContentsFlag($scope.detailAppData.ageType);
              if (isAdultContent && device.auth.adultStatus != 'Verified'){
                // check membership loginSession
                adultProcess.getLoginSession($element[0].getAttribute('item'));
                //adultProcess.execProcess($element[0].getAttribute('item')); // in getLoginSession func, does execProcess !!!
                return;
              }
            }
          }
        });
      } else {
        $rootScope.spinner.hideSpinner();
      }

      if (dataClickAct == 'install') {
        /*  설치  */
        if ($scope.detailAppData.bPremium === true || $scope.detailAppData.isStub === true) {
          /*  프리미엄과 stub앱은 바로 설치 진행 */
          $scope.usePackageApp ? installPackageCapacityStart() : installCapacityStart(); // 패키지앱과 싱글앱을 구분하여 인스톨 프로세스 진행
        } else {
          /*  로그인 여부에 따라 진행 */
          var countLoigin = false;
          $rootScope.spinner.showSpinner(); // wait for luna response

//          if ((tempCurrHost.indexOf('qt') > -1)) {
            doInstallAction();
//          } else {
//            userID.call(function(callBackCheckUserId) {
//              $rootScope.spinner.hideSpinner(); // remove the spinner
//              if (callBackCheckUserId === 'failed') { // Luna failed (ex: timeout)
//                lunaFailedPopup();
//                return;
//              }
//              if (device.auth.userID) {
//                doInstallAction();
//              } else if (!countLoigin) {
//                $scope.toBeGoScope = $scope.detailAppData.id;
//                var requestParam = {
//                  query: 'requestLogin',
//                  returnTo: {
//                    target: 'luna://com.webos.applicationManager',
//                    method: 'launch',
//                    bypass: {
//                      params: {
//                        id: 'com.webos.app.discovery', query: 'category/APPSGAMES/' + $scope.detailAppData.id
//                      }
//                    }
//                  }
//                };
//                // [WOSLQEVENT-93056] : 이슈 모호함으로 인한 로깅
//                try {
//                  pmLog.write(pmLog.LOGKEY.NSU_LOG, {
//                    nsu : JSON.stringify(requestParam)
//                  });
//                }catch(e) {}
//                //requestParam = {query: 'requestLogin'};
//                membership.callMembershipPage(requestParam);
//                countLoigin = true;
//              }
//            });
//          }
        }
      } else if (dataClickAct == 'update') {
        /*  업데이트  */
        if ($scope.detailAppData.bPremium === true || $scope.detailAppData.isStub === true) {
          /*  stub앱과 프리미엄앱은 무조건 업데이트 한다. */
          if ($scope.updateCheckType == 'YYY' || $scope.updateCheckType == 'AYY' || $scope.updateCheckType == 'FNY' || $scope.updateCheckType == 'FYY') {
            /*  SU를 하지 않으면 App 업데이트 되지 않음 */
//            nsuUpdateStatus.call();
            nsuGetCurStatus.call();
          } else if ($scope.updateCheckType == 'YNY' || $scope.updateCheckType == 'ANY') {
            /*  SU를 하지 않아도 기존 설치된 App 실행 가능 */
//            nsuUpdateStatus.call();
            nsuGetCurStatus.call();
//            softwareUpdateRequiredPopup();
          } else {
            appUpdateAct();
          }
        } else {
          if ($scope.updateCheckType == 'YYN' || $scope.updateCheckType == 'AYN' || $scope.updateCheckType == 'FNN' || $scope.updateCheckType == 'FYN' || $scope.updateCheckType == 'NYN') {
            /*  강제 업데이트(User 가 강제 업데이트를 하지 않는 경우, 기존 설치된 App은 실행되지 않음.) */
            requestParam = {
              type: 'popup',
              popupTitle: msgLang.apps_install_4_5,
              popupBut1: msgLang.cancel,
              popupBut2: msgLang.apps_update,
              popupButAct1 : 'closeAppPopup',
              popupButAct2: 'updateAppFromPopup',
              popupDesc: msgLang.apps_install_4_7 + " " + msgLang.apps_install_4_8
            };
            $rootScope.popupApp.showPopup($scope, requestParam);
          } else if ($scope.updateCheckType == 'YYY' || $scope.updateCheckType == 'AYY' || $scope.updateCheckType == 'FNY' || $scope.updateCheckType == 'FYY') {
            /*  SU를 하지 않으면 App 업데이트 되지 않음 */
//            nsuUpdateStatus.call();
            nsuGetCurStatus.call();
          } else if ($scope.updateCheckType == 'YNY' || $scope.updateCheckType == 'ANY') {
            /*  SU를 하지 않아도 기존 설치된 App 실행 가능 */
//            softwareUpdateRequiredPopup();
//            nsuUpdateStatus.call();
            nsuGetCurStatus.call();
          } else if ($scope.updateCheckType == 'YNN' || $scope.updateCheckType == 'ANN') {
            /*  실행 하던지 업데이트 하던지 */
            requestParam = {
              type: 'popup',
              popupTitle: msgLang.apps_install_4_4,
              popupBut1: msgLang.apps_update,
              popupBut2: msgLang.apps_launch,
              popupBut3: msgLang.close,
              popupButAct1 : 'updateAppFromPopup',
              popupButAct2 : 'launchAppFromPopup',
              popupButAct3 : 'closeAppPopup',
              popupDesc: msgLang.apps_install_4_6
            };
            $rootScope.popupApp.showPopup($scope, requestParam);
          } else {
            /*TODO :
             loggingApi.log({logType : 'updateFail', updateCheckType : updateCheckType, 'detailAppData':self.detailAppData, pageParams:self.pageParams, logLevel : GLOBAL_CONSTANT.LOG_LEVEL.ERROR});*/
          }
        }
      } else if (dataClickAct == 'cancel') {
        /*  설치 및 제거중 취소 */
        requestParam = {id: $scope.detailAppData.id};
        appInstallCancel.call(requestParam);
      } else if (dataClickAct == 'pay') {
        viewPayAppInfoArray = [];

        for(var i=0; i<$scope.packageAppList.length; i++) {
          var appInfo = $scope.packageAppList[i];
          if( appInfo.bPurchased == 'Y' ) {
            viewPayAppInfoArray.push(appInfo);
          }
        }

        if( viewPayAppInfoArray.length > 0 && $scope.usePackageApp) { // 패키지 앱 구매 프로세스 처리
          /*var viewData = {};
           viewData.viewPayAppInfoArray = viewPayAppInfoArray;*/
          requestParam = {
            type: 'package',
            popupTitle: msgLang.apps_package_title_01,
            popupBut1: msgLang.no,
            popupBut2: msgLang.yes,
            popupButAct1 : 'closeAppPopup',
            popupButAct2: 'appPurchaseFromPopup',
            packageGuide: msgLang.apps_package_content_01,
            packageListData: viewPayAppInfoArray,
            appLikeYN: false
          };
          $rootScope.popupApp.showPopup($scope, requestParam);
        } else {
          if (device.auth.adultStatus !== 'Verified' && $scope.detailAppData.adultYN === 'Y') {
            return;
          }
          /* 결제(멤버쉽 이동) */
          appPurchase();
        }
      } else if (dataClickAct == 'launch') { // 실행
        if ($scope.usePackageApp) {
          console.log('appLaunch : ' + $scope.installedAppIdArray[0]);
          requestParam = {
            type: 'package',
            popupTitle: msgLang.apps_install_7,
            popupBut1: msgLang.close,
            popupButAct1 : 'closeAppPopup',
            packageGuide: msgLang.apps_install_7_1,
            packageListData: $scope.detailAppData.appList,
            appLikeYN: true
          };
          $rootScope.popupApp.showPopup($scope, requestParam);
        } else {
          if($rootScope.lastTryAppId && $rootScope.lastTryContentId){
            var requestParam = {id: $scope.detailAppData.id, callbackEvent: 'appLaunchParamsSet'};
            getAppInfo.call(requestParam);    // 현재 페이지의 앱이 설치된 경우의 정보를 호출하여 실행정보를 가져온다.
          } else {
            // app 실행 시 pin code 입력과 같은 바로 실행되지 않는 경우 발생하므로 timeout 을 주지 않아야 timeout error 발생하지 않음
            requestParam = {appId: $scope.detailAppData.id, appLaunchParams: undefined, timeout: -1};
            appLaunch.call(requestParam);
          }
        }
      } else {
        console.error('clickActButton dataClickAct[' + dataClickAct + ']');
      }
    }
  };

  // Luna Callback Event : APP Launch Param Setting
  var appLaunchParamsSet = function (e, response){
    /* launchContentId가 존재 하며 실행 deeplinkingParams이 존재하면 앱 실행 파라미터 셋팅한다.
     * cp app에서 설치로 넘어온 경우도 마찬가지*/
    if ($rootScope.lastTryAppId === $scope.detailAppData.id) {
      $scope.launchContentId = $rootScope.lastTryContentId;
    }

    if( $scope.launchContentId && response.appInfo.deeplinkingParams ) {
      $scope.appLaunchParams = JSON.parse(response.appInfo.deeplinkingParams.split("$CONTENTID").join($scope.launchContentId));
    } else {
      $scope.appLaunchParams = undefined;
    }

    // app 실행 시 pin code 입력과 같은 바로 실행되지 않는 경우 발생하므로 timeout 을 주지 않아야 timeout error 발생하지 않음
    var requestParam = {appId: $scope.detailAppData.id, appLaunchParams: $scope.appLaunchParams, timeout: -1};
    appLaunch.call(requestParam);
  }

  //[WOSLQEVENT-80173]USB를 꼽으면 앱상태에 따라서 버튼 수정해줌
  //Install Button으로 변경 안됨.(Back Key 입력 후 재 진입 하면 변경됨)
  var usbListUpdated = function (e, response){
//    if(response != undefined){
//      requestParam = {id: $scope.detailAppData.id, callbackEvent: 'installAndUpdateChecked'};
//      getAppInfo.call(requestParam);
//    }
  };
  ///////////////////////////////////////////////////////////////////////////

  var fromThreadErrorHAndle = function(e, response) {
    if (response.scopeId === undefined && response.extra && response.extra.freeAppScopeId){
      response.scopeId = response.extra.freeAppScopeId;
    }
    if (response.eventName === eventKey.INSTALLABLE_APPGAME) {
      console.log('installable 에러');
      updateInstallStatus(e, response);
    } else if (response.eventName === eventKey.CHECK_UPDATE_APPGAME) {
      console.log('check update 에러');
      checkUpdate(e, response);
    }
  };

  var changePurchaseInfo = function() {
    if($scope.detailAppData.bPurchased == 'Y') {
      //[WOSLQEVENT-112092] "설치" 버튼으로 표시됨
      //구매했더라도 설치되어있는지 재확인한다.
      if(util.isAWSServer()) {
        var requestParam = {id: $scope.detailAppData.id, callbackEvent: 'installAndUpdateChecked'};
        getAppInfo.call(requestParam);
      }else{
        setActionButton('install');
      }
    }
  };


  $scope.initialize = function() {
    // 같은 scope으로 화면전환이 일어날 경우 이전에 생성된 scope 정보를 저장한다.
    for(var childScope = $scope.$parent.$$childHead; childScope; childScope = childScope.$$nextSibling) {
      if (childScope.scopeName == $scope.scopeName && childScope.$id < $scope.$id) {
        $scope.toBeDelScope = childScope.appId;
      }
    }

    setDateFormat();

    //여유용량 정보 갱신
    spaceInfo.update(updateSpaceInfo);
    /*Draw 관련 이벤트*/
    $scope.$on(eventKey.DETAIL_LOADED_APPGAME, drawDetail);
    $scope.$on(eventKey.RECOMMEND_APPGAME, drawRecommend);
    $scope.$on(eventKey.PACKAGE_APPGAME, drawAppPackage); // 'appPackageLoaded'
    if (window.PalmSystem) $scope.$on(eventKey.INSTALLABLE_APPGAME, updateInstallStatus);
    $scope.$on('hiding', hideList);
    $scope.$on('focus', focusHandler);
    $scope.$on(eventKey.RECOVER_FOCUS, $scope.recoverFocus);
    $scope.$on('drawFinishedBefore', initializeDetailBefore);
    $scope.$on('drawFinished', initializeDetail);
    /*thread에서 error발생시 view와 관련없는 app상세페이지 처리 관련*/
    $scope.$on('fromThreadError', fromThreadErrorHAndle);
    /*Package App 관련 이벤트*/
    $scope.$on(eventKey.PACKAGE_STATUS_RESULT, packageBillingStatus);
    $scope.$on('packageInstalledChecked', packageInstallCheck);
    $scope.$on(eventKey.PACKAGE_STATUS_UPDATE, packageInstallProcessDelegator);
    $scope.$on('existItemInPack', packAppListPop); //비로그인 상태에서 구매버튼 클릭 시 로그인한 아이디에 패키지 앱 구매목록 있을경우 callback
    /*Action Button 관련 이벤트*/
    $scope.$on(eventKey.EVENT_FREE_PURCHASE_APPGAME, purchaseStatusUpdate);
    $scope.$on(eventKey.CHECK_UPDATE_APPGAME, checkUpdate); // API Callback Event : APP Update Check
    $scope.$on('installAndUpdateChecked', installAndUpdateCheck); // Luna Callback Event : APP Install/Update Check
    $scope.$on('appLaunchParamsSet', appLaunchParamsSet); // Luna Callback Event : APP Launch Param Setting
    $scope.$on('appLaunchResult', appLaunchResult);  //Luna Callback Event : APP Launch Result
    $scope.$on('appPurchaseResult', appPurchaseResult); // API Callback Event : APP Purchase Result, 추후 삭제 예정
    $scope.$on('installCapacityResult', installCapacityResult); // Luna Callback Event : APP Install Capacity Result
    $scope.$on('appInstallResult', appInstallStatusUpdate); //  Luna Callback Event : APP Install Result
    $scope.$on('appStatusChanged', appStatusChangeUpdate); //  Luna Callback Event : APP Install Status Change Result
    $scope.$on('appInstallCanceled', appInstallCancelResult); //  Luna Callback Event : APP Install Cancel Result
    $scope.$on('nsuUpdateStatusResulted', nsuUpdateStatusResult); //  Luna Callback Event : NSU Update Status Result
    $scope.$on('appUpdateChecked', appUpdateCheckResult);  //  Luna Callback Event : APP Update Check Result
    $scope.$on('usbStorageCapacityResult', usbPopupListUpdate); //  Luna Callback Event : APP Storage Capacity From USB List  Result
    $scope.$on('showUsbListPopup', showUsbListPopupReal); //  Luna Callback Event : APP Storage Capacity Result
    $scope.$on('changeLoginStatus', changeLoginStatus);
    $scope.$on('changeSpaceInfo', installedAppsChange);
    $scope.$on('changePurchaseInfo', changePurchaseInfo);   // visibility 가 변할 때 구매했으면 INSTALL로 버튼을 세팅해 준다.
    $scope.$on(eventKey.PURCHASABLE_APP, appInstallPosspossibleResult); //앱지불(pay)버튼을 클릭하면 설치가능여부 확인
    /*Popup 관련 이벤트*/
    $scope.$on('closeAppPopup', closePopup);
    $scope.$on('installStartFromPopup', installFromPopup);
    $scope.$on('showUsbListFromPopup', showUsbListFromPopup);
    $scope.$on('launchAppFromPopup', launchAppFromPopup);
    $scope.$on('suUpdateFromPopup', suUpdateFromPopup);
    $scope.$on('updateAppFromPopup', updateAppFromPopup);
    $scope.$on('callMemberShipFromPopup', callMemberShipFromPopup);
    $scope.$on('appUpdateFromPopup', appUpdateFromPopup);
    $scope.$on('usbInstallStartFromPopup', usbInstallStartFromPopup);
    $scope.$on('appCheckLaunchFromPopup', appCheckLaunchFromPopup);
    $scope.$on('appPurchaseFromPopup', appPurchase);
    /*Rating Popup 관련 이벤트*/
    $scope.$on(eventKey.RATED_APPGAME, ratingComplete);
    $scope.$on('updateRateInfo', requestDetailData);
    $scope.$on(eventKey.UPDATE_LOADED_APPGAME, updateDetailInfo);
    $scope.$on(eventKey.SMALL_UPDATE_LOADED_APPGAME, updateSmallDetailInfo);
    /*launcher 관련 이벤트*/
    $scope.$on(eventKey.REFRESH_SCREEN, refreshScreen);
    /*USB 관련 이벤트*/
    $scope.$on('usbListUpdated', usbListUpdated);
    $scope.$on('nsuGetCurStatusResulted', nsuGetCurStatusResult);     //nsu 업데이트 진행상태 체크하는 로직
    $scope.$on('restartTVFromNSU', restartTVFromNSU);                 //  Luna TV Restart
    util.async(requestData);
  };

  var setDateFormat = function() {
    //local dateformat data
    var local_format = {
      "sbp": "MM/DD/YYYY",
      "ksh": "YYYY/MM/DD",
      "nyn": "YYYY/MM/DD",
      "ps": "YYYY/MM/DD",
      "pt": "DD/MM/YYYY",
      "luo": "YYYY/MM/DD",
      "fil": "MM/DD/YYYY",
      "mgh": "MM/DD/YYYY",
      "luy": "YYYY/MM/DD",
      "mgo": "YYYY/MM/DD",
      "bas": "DD/MM/YYYY",
      "ssy": "YYYY/MM/DD",
      "teo": "YYYY/MM/DD",
      "aa": "YYYY/MM/DD",
      "af": "YYYY/MM/DD",
      "brx": "YYYY/MM/DD",
      "ak": "YYYY/MM/DD",
      "am": "MM/DD/YYYY",
      "kde": "YYYY/MM/DD",
      "ar": "DD/MM/YYYY",
      "as": "YYYY/MM/DD",
      "en_us": "MM/DD/YYYY",
      "en_jp": "MM/DD/YYYY",
      "en_tw": "MM/DD/YYYY",
      "en_gb": "DD/MM/YYYY",
      "az": "YYYY/MM/DD",
      "rm": "YYYY/MM/DD",
      "rn": "DD/MM/YYYY",
      "ro": "DD/MM/YYYY",
      "be": "DD/MM/YYYY",
      "ru": "DD/MM/YYYY",
      "bg": "DD/MM/YYYY",
      "rw": "YYYY/MM/DD",
      "kea": "DD/MM/YYYY",
      "bm": "DD/MM/YYYY",
      "bn": "DD/MM/YYYY",
      "bo": "YYYY/MM/DD",
      "twq": "DD/MM/YYYY",
      "br": "YYYY/MM/DD",
      "bs": "DD/MM/YYYY",
      "xog": "YYYY/MM/DD",
      "default": "DD/MM/YYYY",
      "se": "YYYY/MM/DD",
      "sg": "YYYY/MM/DD",
      "si": "YYYY/MM/DD",
      "seh": "YYYY/MM/DD",
      "sk": "DD/MM/YYYY",
      "sl": "DD/MM/YYYY",
      "sn": "YYYY/MM/DD",
      "so": "YYYY/MM/DD",
      "ca": "MM/DD/YYYY",
      "sq": "YYYY/MM/DD",
      "sr": "DD/MM/YYYY",
      "ses": "YYYY/MM/DD",
      "ss": "YYYY/MM/DD",
      "st": "YYYY/MM/DD",
      "sv": "YYYY/MM/DD",
      "sw": "DD/MM/YYYY",
      "ta": "DD/MM/YYYY",
      "asa": "DD/MM/YYYY",
      "yav": "DD/MM/YYYY",
      "cs": "DD/MM/YYYY",
      "te": "DD/MM/YYYY",
      "tg": "YYYY/MM/DD",
      "th": "DD/MM/YYYY",
      "ti": "YYYY/MM/DD",
      "cy": "DD/MM/YYYY",
      "en_ca": "DD/MM/YYYY",
      "tn": "YYYY/MM/DD",
      "dyo": "DD/MM/YYYY",
      "to": "YYYY/MM/DD",
      "da": "DD/MM/YYYY",
      "swc": "DD/MM/YYYY",
      "tr": "DD/MM/YYYY",
      "ts": "YYYY/MM/DD",
      "vai_latn_lr": "MM/DD/YYYY",
      "de": "DD/MM/YYYY",
      "cgg": "DD/MM/YYYY",
      "ast": "YYYY/MM/DD",
      "nmg": "DD/MM/YYYY",
      "bem": "DD/MM/YYYY",
      "tig": "YYYY/MM/DD",
      "bez": "DD/MM/YYYY",
      "dz": "YYYY/MM/DD",
      "uk": "DD/MM/YYYY",
      "ur": "DD/MM/YYYY",
      "dje": "DD/MM/YYYY",
      "haw": "YYYY/MM/DD",
      "ee": "MM/DD/YYYY",
      "uz": "YYYY/MM/DD",
      "tzm": "YYYY/MM/DD",
      "el": "DD/MM/YYYY",
      "nnh": "YYYY/DD/MM",
      "eo": "YYYY/MM/DD",
      "chr": "MM/DD/YYYY",
      "es": "DD/MM/YYYY",
      "et": "DD/MM/YYYY",
      "ve": "YYYY/MM/DD",
      "eu": "YYYY/MM/DD",
      "vi": "DD/MM/YYYY",
      "zh_mo": "DD/MM/YYYY",
      "khq": "YYYY/MM/DD",
      "shi": "YYYY/MM/DD",
      "vo": "YYYY/MM/DD",
      "fa": "YYYY/MM/DD",
      "ff": "YYYY/MM/DD",
      "fi": "DD/MM/YYYY",
      "ar_tn": "YYYY/MM/DD",
      "rwk": "YYYY/MM/DD",
      "fo": "YYYY/MM/DD",
      "fr": "DD/MM/YYYY",
      "jgo": "MM/DD/YYYY",
      "zh_hant_mo": "DD/MM/YYYY",
      "ga": "DD/MM/YYYY",
      "wae": "YYYY/MM/DD",
      "gd": "YYYY/MM/DD",
      "wal": "YYYY/MM/DD",
      "gl": "DD/MM/YYYY",
      "ar_dz": "YYYY/MM/DD",
      "gu": "DD/MM/YYYY",
      "gv": "YYYY/MM/DD",
      "xh": "YYYY/MM/DD",
      "byn": "YYYY/MM/DD",
      "ha": "DD/MM/YYYY",
      "zxx": "DD/MM/YYYY",
      "he": "DD/MM/YYYY",
      "hi": "DD/MM/YYYY",
      "agq": "DD/MM/YYYY",
      "gsw": "YYYY/MM/DD",
      "hr": "DD/MM/YYYY",
      "kkj": "YYYY/MM/DD",
      "hu": "YYYY/MM/DD",
      "hy": "YYYY/MM/DD",
      "yo": "YYYY/MM/DD",
      "ia": "YYYY/MM/DD",
      "id": "DD/MM/YYYY",
      "ig": "YYYY/MM/DD",
      "naq": "YYYY/MM/DD",
      "vai": "YYYY/MM/DD",
      "ii": "YYYY/MM/DD",
      "is": "DD/MM/YYYY",
      "it": "DD/MM/YYYY",
      "kln": "YYYY/MM/DD",
      "zh": "YYYY/MM/DD",
      "zh_hans_mo": "DD/MM/YYYY",
      "ja": "YYYY/MM/DD",
      "zu": "MM/DD/YYYY",
      "nso": "YYYY/MM/DD",
      "guz": "YYYY/MM/DD",
      "zh_hk": "DD/MM/YYYY",
      "ka": "YYYY/MM/DD",
      "ki": "YYYY/MM/DD",
      "mas": "YYYY/MM/DD",
      "kk": "YYYY/MM/DD",
      "kl": "YYYY/MM/DD",
      "km": "DD/MM/YYYY",
      "kn": "DD/MM/YYYY",
      "ko": "YYYY/MM/DD",
      "ks": "YYYY/MM/DD",
      "ku": "DD/MM/YYYY",
      "kw": "YYYY/MM/DD",
      "ky": "YYYY/MM/DD",
      "zh_hant_hk": "DD/MM/YYYY",
      "ebu": "DD/MM/YYYY",
      "lg": "YYYY/MM/DD",
      "jmc": "YYYY/MM/DD",
      "fur": "YYYY/MM/DD",
      "ln": "DD/MM/YYYY",
      "lo": "YYYY/MM/DD",
      "cop": "DD/MM/YYYY",
      "kok": "YYYY/MM/DD",
      "lt": "YYYY/MM/DD",
      "lu": "DD/MM/YYYY",
      "lv": "DD/MM/YYYY",
      "nus": "DD/MM/YYYY",
      "vun": "YYYY/MM/DD",
      "lag": "YYYY/MM/DD",
      "dav": "DD/MM/YYYY",
      "mg": "YYYY/MM/DD",
      "mk": "DD/MM/YYYY",
      "ml": "YYYY/MM/DD",
      "mn": "MM/DD/YYYY",
      "mr": "DD/MM/YYYY",
      "ms": "DD/MM/YYYY",
      "mt": "YYYY/MM/DD",
      "my": "YYYY/MM/DD",
      "ms_bn": "DD/MM/YYYY",
      "nb": "DD/MM/YYYY",
      "nd": "YYYY/MM/DD",
      "ne": "YYYY/MM/DD",
      "mua": "DD/MM/YYYY",
      "nl": "DD/MM/YYYY",
      "en_za": "YYYY/MM/DD",
      "nn": "DD/MM/YYYY",
      "no": "DD/MM/YYYY",
      "nr": "YYYY/MM/DD",
      "rof": "YYYY/MM/DD",
      "kab": "YYYY/MM/DD",
      "zh_tw": "YYYY/MM/DD",
      "zh_hans_hk": "DD/MM/YYYY",
      "kam": "YYYY/MM/DD",
      "mer": "YYYY/MM/DD",
      "sah": "YYYY/MM/DD",
      "om": "YYYY/MM/DD",
      "saq": "YYYY/MM/DD",
      "or": "DD/MM/YYYY",
      "os": "YYYY/MM/DD",
      "mfe": "YYYY/MM/DD",
      "ar_ma": "YYYY/MM/DD",
      "dua": "DD/MM/YYYY",
      "pa": "YYYY/MM/DD",
      "zh_hant_tw": "YYYY/MM/DD",
      "ksb": "YYYY/MM/DD",
      "ewo": "DD/MM/YYYY",
      "pl": "DD/MM/YYYY",
      "ksf": "DD/MM/YYYY",
      "en": "DD/MM/YYYY"
    };

    //header language 추출
    var language = device.q['X-Device-Language'].replace(/-/gi, '_').toLowerCase();

    if (local_format[language]) {
      device.dateformat = local_format[language];
    } else {
      device.dateformat = local_format['default'];
    }

    // dateformat 이관
    // dateformat api 호출 안하고 내부적으로 처리하도록 변경
    /*var params = null;

    params = {
      api : '/discovery2016/account/dateformat',
      method : 'get',
      apiAppStoreVersion : 'v7.0'
    };

    if (!device.isOpenApi) {
      params.api = '/discoveryv6/account/dateformat';
      params.apiAppStoreVersion = 'v6.0';
    }

    if (!device.isLocalJSON) {
      // Server용
      server.requestApi(eventKey.DATE_FORMAT, params);
    }*/
  };

  $scope.initialize();
});
