app.directive('popupApp', function() {
  return {
    restrict: 'A',
    replace: true,
    scope: {},
    controller: 'popupAppController',
    //templateUrl: './resources/html/popupApp.html'
    template: popupAppTmpl
  };
});

app.controller('popupAppController', function($scope, $controller, $element, $rootScope, $timeout, focusManager, keyHandler, marquee, util, pmLog, eventKey, appService, device, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  //var STEP_POSITION = 20;
  var focusElement = null;
  var owner = null;
  var lastFocus = {};
  var lastFocusIdx = null;
  var scroll = null;
  var scrollBar = {};
  //var maxPosition = 0;
  //var pageHeight = 0;
  var focusBeforeShowPopup = null;

  var logMenu = '', logCategory = ''; // pmLog용
  var popupParams = null;
  var isFirst = false;

  $scope.scopeName = 'popupApp';
  $scope.open = false;
  $scope.hide = true;
  $scope.type = 'popup';
  $scope.selectedDeviceId = '';
  $scope.selectedDriveId = '';
  $scope.selectedAppId = '';
  $scope.usbListData = [];

  $scope.setFocusItem = function(item, element) {
    if (lastFocus.item == 'error') $rootScope.tooltip.hideTooltip();
    //popupapp $element에 없는 item element면 return
    if (element) {
      var elementItem = element.getAttribute('item');
      var elCheck1 = $element[0].querySelector('[item="'+elementItem+'"]');
      if (elCheck1 === undefined || elCheck1 === null) {
        return;
      }
    }
    if (item && item !== 'popup-list') {
      var elCheck2 = $element[0].querySelector('[item="'+item+'"]');
      if (elCheck2 === undefined || elCheck2 === null) {
        return;
      }
    }

    $scope.focusItem = item;
    if (focusElement) {
      focusElement.classList.remove('focus');
    }

    focusElement = element;
    if (focusElement) {
      focusElement.classList.add('focus');
      $scope.lastFocusItem = {
        item: item,
        index: element.getAttribute('index')
      };
    }

    if (item) {
      var marquees = element.getElementsByClassName('marquee');
      if (marquees.length > 0)
        marquee.setTarget(marquees[0]);

      focusManager.setCurrent($scope, item, element);
      lastFocus.item = item;
      lastFocus.element = element;
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }

    if ($scope.focusItem == 'error') {
      var tooltipElement = document.querySelector('.focus').getBoundingClientRect();
      var tooltipBottom = tooltipElement.bottom - tooltipElement.height - 50;
      var tooltipRight =  tooltipElement.right;
      if(device.isRTL){
        tooltipRight = tooltipElement.right - tooltipElement.width;
      }
      if (device.isHD) {
//        $rootScope.tooltip.showTooltip(79, 903, $scope.errorCodeMsg, false, true);
        $rootScope.tooltip.showTooltip(tooltipRight , tooltipBottom, $scope.errorCodeMsg, false, true);
      } else {
//        $rootScope.tooltip.showTooltip(79, (element.getBoundingClientRect().top - element.getBoundingClientRect().height - 10), $scope.errorCodeMsg, false, true);
        tooltipBottom = tooltipBottom -10;
        $rootScope.tooltip.showTooltip(tooltipRight, tooltipBottom, $scope.errorCodeMsg, false, true);
      }
    }
  };

  $scope.audioGuidance = function (scope, target, element) {
    //WOSLQEVENT-116448/116688/116732 foreground app 이 스토어가 아닐 시 발화되지 않도록 처리.
    if (popupParams &&
      popupParams.popupTitle === msgLang.alert_adult_3_4 &&
      popupParams.popupDesc === msgLang.alert_2017_network_1 &&
      device.isBlur) {
      return;
    }

    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };

    if (isFirst) {
      if (popupParams && popupParams.popupTitle) {
        //17년향 팝업에 타이틀이 존재하는 경우
        //공지사항 팝업, CP리스트 팝업, USB 리스트 팝업
        //그외 팝업은 팝업에 타이틀이 존재하지 않음(popup,error)
        if (popupParams && popupParams.type && popupParams.type != 'popup' && popupParams.type != 'error') {
          params.text = popupParams.popupTitle;
        }

        if (popupParams.popupDesc) {
          //[QEVENTSIXT-6480] 타이틀이 없을때는 . 발화하지 않게 수정
          if (popupParams && popupParams.type && popupParams.type != 'popup' && popupParams.type != 'error') {
            params.text += '. ';
          }
          params.text += popupParams.popupDesc;
        }

        if (popupParams.usbDesc) {
          params.text += '. ';
          params.text += popupParams.usbDesc;
        }

        if (popupParams.errorMsg) {
          params.text += '. ';
          params.text += popupParams.errorMsg;
        }
      }

      //type 이 usb 일 경우 selected 되어있는 list 읽어 줌
      //[QEVENTSIXT-17329] USB 팝업을 나왔을 경우 선택된 장치만 읽어주는것이 아니라 모든 장치를 읽어주게 수정
      if (popupParams.type === 'usb' && $scope.usbListData) {
        for (var i = 0; i < $scope.usbListData.length; i++) {
//          if ($scope.selectedDeviceId && $scope.selectedDriveId && $scope.selectedDeviceId === $scope.usbListData[i].deviceId && $scope.selectedDriveId === $scope.usbListData[i].driveId) {
          if(i === 0) {
            params.text += ' ';
          }else if(i != 0) {
            params.text += '. ';
          }
          params.text += 'USB' + $scope.usbListData[i].portNum + ':[' + $scope.usbListData[i].freeSpace + 'Free]' + $scope.usbListData[i].deviceName + '(' + $scope.usbListData[i].partitionInfo + ')';
//          }
        }
      }

      ///2017년 향 popup 버튼 읽어주는 정책변경 (모든 버튼 차례대로 읽고 + focused 버튼)
      //usb, watch 는 dialog 에서 popup 타입 그대로 유지하기로 정해져 분기처리
      var btnList, selector;
      if (popupParams.type === 'usb' || popupParams.type === 'watch') {
        selector = '.wrap-btn-popup .text';
      } else {
        selector = '.wrap-btn-dialog .text';
      }

      if (document.querySelectorAll(selector) && document.querySelectorAll(selector).length > 0 && popupParams.type !== 'watch') {
        btnList = document.querySelectorAll(selector);
        for (var i = 0; i < btnList.length; i++) {
          params.text += '. ';
          params.text += btnList[i].innerText;
        }
      }
    }

    var btnName = null;
    if (element && element.querySelector('.text')) {
      btnName = element.querySelector('.text').innerText;
      //usb 팝업 시 checked or unchecked 발화
      if (element.classList && element.classList.contains('memory-list')) {
        if (element.classList.contains('on')) {
          btnName += ". ";
          btnName += msgLang.audio_filter_check ? msgLang.audio_filter_check : 'checked';
        } else {
          btnName += ". ";
          btnName += msgLang.audio_filter_uncheck ? msgLang.audio_filter_uncheck : 'unchecked';
        }
      }

      if (btnName.length > 0 && element.querySelectorAll('.item-attribute').length > 0) {
        for (var i = 0; i < element.querySelectorAll('.item-attribute').length; i++) {
          btnName += '. ';
          btnName += element.querySelectorAll('.item-attribute')[i].innerText;
        }
      }

      if (btnName.length > 0 && element.querySelector('.item-price') && element.querySelector('.item-price').innerText.length > 0) {
        btnName += '. ';
        btnName += element.querySelector('.item-price').innerText;
      }

      if (btnName && (element.classList.contains('btn-close') || element.classList.contains('btn-popup'))) {
        btnName += '. ';
        btnName += msgLang.audio_button_button;
      }
    }

    if (isFirst) {
      params.text += '. ';
      params.text += btnName;
      isFirst = false;
    } else {
      params.text = btnName;
    }

    audioGuidance.call(params);
  };

  $scope.removeFocus = function() {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
    }
  };

  $scope.showPopup = function(scope, param, onCloseCallback) {
    popupParams = param;

    isFirst = true;
    $scope.hide = false;
    $scope.moveFocusDiable = false;
    var buttonArr, i, l, viewUsbListArray, loopUsbInfo, itemArr, usbItemArr, m, appItemArr, n;
    $rootScope.spinner.hideSpinner();
    owner = scope;
    // popup param setting
    $scope.type = param.type;
    $scope.okTxt = msgLang.ok;

    // pmLog
    pmLog.write(pmLog.LOGKEY.POPUP_LOG, {
      param : JSON.stringify(param)
    });

    if (param.logMenu) logMenu = param.logMenu;
    if (param.logCategory) logCategory = param.logCategory;

    if (param.popupTitle) $scope.title = param.popupTitle;
    if (param.popupDesc) $scope.desc = param.popupDesc;
    if (param.popupBut1) {
      $scope.button1 = param.popupBut1;
    } else {
      $scope.button1 = false;
    }
    if (param.popupBut2) {
      $scope.button2 = param.popupBut2;
    } else {
      $scope.button2 = false;
    }
    if (param.popupBut3) {
      $scope.button3 = param.popupBut3;
    } else {
      $scope.button3 = false;
    }
    if (param.popupButAct1) $scope.butAct1 = param.popupButAct1;
    if (param.popupButAct2) $scope.butAct2 = param.popupButAct2;
    if (param.popupButAct3) $scope.butAct3 = param.popupButAct3;
    if (param.usbDesc) $scope.usbDesc = param.usbDesc; // USB 팝업창과 같은 예외 케이스
    if (param.usbListData) $scope.usbListData = param.usbListData;
    if (param.errorMsg) $scope.errorMsg = param.errorMsg;
    if (param.errorCodeMsg) $scope.errorCodeMsg = param.errorCodeMsg;
    if (param.packageGuide) $scope.packageGuide = param.packageGuide;
    if (param.packageListData) $scope.packageListData = param.packageListData;
    if (param.appLikeYN != undefined) $scope.appLikeYN = param.appLikeYN;
    if (param.type === 'usb') { //usb팝업 리스트
      if(param.selectUsbInfo) {
        var selectedUsbExist = false;
        for(var k = 0; k < $scope.usbListData.length; k++) {
          if ($scope.usbListData[k].deviceId == param.selectUsbInfo.deviceId) //usb사용이력이 있고 그 usb가 현재 꽂혀있다면
            selectedUsbExist = true;
        }
        if (selectedUsbExist) {
          $scope.selectedDeviceId = param.selectUsbInfo.deviceId;
          $scope.selectedDriveId = param.selectUsbInfo.driveId;
        } else { // 사용이력이 있지만 꽂혀있지않으면 처음꺼
          $scope.selectedDeviceId = $scope.usbListData[0].deviceId;
          if ($scope.usbListData[0].subDevices) {
            $scope.selectedDriveId = $scope.usbListData[0].subDevices[0].deviceId;
          }
        }
      } else {//storage 사용 정보가 없었으면 defualt는 처음꺼
        $scope.selectedDeviceId = $scope.usbListData[0].deviceId;
        if ($scope.usbListData[0].subDevices) {
          $scope.selectedDriveId = $scope.usbListData[0].subDevices[0].deviceId;
        }
      }
    }

    if (param.type === 'usb') { //usb 팝업 리스트일때만
      viewUsbListArray = [];
      for(var i = 0; i < $scope.usbListData.length; i++) {
        loopUsbInfo = $scope.usbListData[i];

        //[WOSLQEVENT-117689] 파티션 모두가 노출되지 않는 이슈
        //다수 파티션 나뉘어있는 외부 저장장치일 경우 모든 파티션 용량정보 확인위해 변경
        for(var j = 0; j < loopUsbInfo.subDevices.length; j++){
          var viewUsbInfo = {};
          viewUsbInfo.deviceId    = loopUsbInfo.deviceId;   //  디바이스 아이디
          viewUsbInfo.deviceName    = loopUsbInfo.deviceName; //  디바이스 이름
          viewUsbInfo.driveId     = loopUsbInfo.subDevices[j].deviceId; //  드라이브 아이디
          viewUsbInfo.partitionInfo = loopUsbInfo.subDevices[j].deviceName; //  파티션 정보
          viewUsbInfo.portNum     = loopUsbInfo.portNum;    //  디바이스 포트 번호
          viewUsbInfo.freeSpace   = convertSizeForUSB(loopUsbInfo.subDevices[j].capacity.freeSpace);  //  남은 용량
          viewUsbInfo.totalSpace    = loopUsbInfo.subDevices[j].capacity.totalSpace; //  전체 용량

          viewUsbListArray.push(viewUsbInfo);
        }
      }
      $scope.usbListData = viewUsbListArray;
    }

    //  TV/Movie watch popup
    if(param.contents_id) $scope.contents_id = param.contents_id;
    if(param.items) $scope.items = param.items;
//    if(param.watchSetBtn) $scope.watchSetBtn = param.watchSetBtn;
    if(param.watchClose) $scope.watchClose = param.watchClose;

    $scope.$digest();

    //[QEVENTSIXT-22191]하단 팝업 title marquee 적용
    var popupTitleElement = undefined;
    popupTitleElement = document.querySelectorAll('.no-event .marquee')[1];
    if(popupTitleElement && popupTitleElement !== undefined) {
      marquee.setTarget(popupTitleElement);
      marquee.autoPlay(popupTitleElement);
    }

    document.getElementsByClassName('panels')[0].classList.add('disabled');

//     에러 GUI나오면 수정 필요함.
//    if ($scope.errorMsg && $scope.errorMsg === msgLang.alert_adult_2_3) {
//      if ($element[0].getElementsByClassName('icon-code')) {
//        $element[0].querySelectorAll('.popup-cont')[0].removeChild($element[0].querySelectorAll('.icon-code')[0]);
//      }
//    }

    focusManager.setState('popupApp', true);
    if ($element[0].getElementsByClassName('icon-code')) {
      $scope.setMouseEvent($element[0].getElementsByClassName('icon-code')[0]);
    }
    buttonArr = $element[0].getElementsByClassName('btn-popup');
    l = buttonArr.length;
    //[WOSLQEVENT-75206]성인인증 팝업 Off 되며 Focus 사라짐
    //팝업창에 포커스는 밑에서 처리하는데 Focus(focusOnCloseButton())실행하기전에
    //오류가 나는것으로 판단하여 팝업창이 그려지면 버튼의 이름에 상관없이 첫번째 버튼에 포커스를 주고
    //하단에 focusOnCloseButton()를 타면 포커스 재정비함.
    if (util.isAWSServer()) {
      /*if(scope.scopeName === 'detailApp' && buttonArr != undefined && param.type !== 'usb'){
        $scope.setFocusItem(buttonArr[0].getAttribute('item'), buttonArr[0]);
      }*/
    } else {
      if(scope.scopeName === 'detailApp' && buttonArr != undefined){
        $scope.setFocusItem(buttonArr[0].getAttribute('item'), buttonArr[0]);
      }
    }
    for (i = 0; i < l; i++) {
      $scope.setMouseEvent(buttonArr[i]);
    }

    // watch item list
    if($element[0].getElementsByClassName('item-apps').length > 0 && param.appLikeYN === undefined) {
      itemArr = $element[0].getElementsByClassName('item-apps');
      l = itemArr.length;
      for (i = 0; i < l; i++) {
        $scope.setMouseEvent(itemArr[i]);
      }
    }

    usbItemArr = $element[0].getElementsByClassName('memory-list');
    m = usbItemArr.length;
    for (i = 0; i < m; i++) {
      $scope.setMouseEvent(usbItemArr[i]);
    }

    appItemArr = $element[0].getElementsByClassName('item-apps');
    n = appItemArr.length;
    if ($scope.appLikeYN) {
      for (i = 0; i < n; i++) {
        $scope.setMouseEvent(appItemArr[i]);
      }
    } else {
      if($scope.type === 'package') {
        for (i = 0; i < n; i++) {
          appItemArr[i].classList.remove('blank');
        }
      }
    }
    /*이전 팝업 초기화 - USB팝업에 close한 후에 이전 포커스가 안감*/
    focusBeforeShowPopup = {};
    if (focusManager.getLastFocus() && focusManager.getLastFocus().scope && focusManager.getLastFocus().scope.scopeName !== 'popupApp') {
      focusBeforeShowPopup = {
          scope : focusManager.getLastFocus().scope,
          target : focusManager.getLastFocus().target
      };
    }
    focusOnCloseButton();

    $scope.onCloseCallback = onCloseCallback;

    /*if ($scope.type == 'usb') {
      pageHeight = $element[0].getElementsByClassName('popup-cont')[0].offsetHeight;
      obj = $element[0].getElementsByClassName('popup-usb-list')[0];
      obj.style.height = pageHeight + 'px';
    }*/
    util.async(function() {
      //if ($scope.type == 'usb') initializeScroll();
      if (document.querySelector('.help-guide')) {
        document.querySelector('.help-guide').style.zIndex = 5;
        document.querySelector('.popup-basic').style.zIndex = 10;
      }
      //$scope.$apply();
    });
    $scope.open = true;
  };

 /* var initializeScroll = function() {
    var option = {};
    option.useTransform = false;

    scroll = new iScroll($element[0].getElementsByClassName('popup-cont')[0], option);

    $element[0].getElementsByClassName('popup-cont')[0].onmousewheel = function(e) {
      util.async($scope.scrollRefresh);
      if (scroll.wrapperH >= scroll.scrollerH) return;
      if (focusManager.blockExecution()) return;
      if (focusManager.preExecution()) return;
      if (e.wheelDelta < 0 && scroll.y > 0) return;
      if (e.wheelDelta > 0 && scroll.y < scroll.maxScrollY) return;
      scroll.scrollTo(0, e.wheelDelta * -3, 300, true);
    };
  };

  $scope.scrollPageUp = function() {
    if (scroll.y > 0) return;
    scroll.scrollTo(0, -20, 300, true);
  };

  $scope.scrollPageDown = function() {
    if (scroll.y < scroll.maxScrollY) return;
    scroll.scrollTo(0, 20, 300, true);
  };

  $scope.scrollRefresh = function() {
    var obj;

    obj = $element[0].getElementsByClassName('popup-cont')[0];
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
  };*/

  $scope.hidePopup = function(target) {
    isFirst = false;
      //[QEVENTSIXT-20159] 성인 인증 하라는 팝업 0.5초간 출력후 사라짐
//    $timeout(function() {
      $scope.hide = true;
      $scope.$digest();
//    }, 10);

    if ($scope.onCloseCallback) {
      $scope.onCloseCallback(target);
    }

    document.getElementsByClassName('panels')[0].classList.remove('disabled');
    $scope.moveFocusDiable = true;
    var appItems = $element[0].getElementsByClassName('item-apps');
    var l = undefined;
    if (appItems) {
      l = appItems.length;
    }
    if (l && l>0) {
      for (var i = 0; i < l; i++) {
        appItems[i].classList.add('blank');
      }
    }
    $rootScope.breadcrumb.setRunning(false);
    focusManager.setState('popupApp', false);

    delete scroll;
    scrollBar = null;
    $scope.open = false;
    $scope.setFocusItem('', null);
    $scope.$digest();

    logMenu = null;
    logCategory = null;

    $timeout(function() {
      if (focusBeforeShowPopup && focusBeforeShowPopup.scope) {//마지막 갔던 포커스가 있는경우
        var scope = focusBeforeShowPopup.scope;
        var scopeElement = scope.getScopeElement();
        var item = focusBeforeShowPopup.target;
        var element = undefined;

        if (scope &&
          scope.scopeName === 'player' &&
          scope.recoverFocus) {
          scope.recoverFocus();
        } else if (scopeElement) {//target이 있다
          if (scopeElement === '') { //비어있는 target이면 default
            scope.setDefaultFocus();
          } else if (owner && focusManager.getPrevious() && focusManager.getPrevious().scope && focusManager.getPrevious().scope.scopeName
            && focusManager.getPrevious().scope.scopeName !== owner.scopeName && $scope.type !== "watch") {
            //[QEVENTSIXT-3770]main 페이지에서 썸네일클릭 -> cp list 팝업 -> cp 선택 -> detailapp 이동 후 키 무감 이슈 해결.
            //hidepopup 될 때 cp관련 팝업 시 eventKey.RECOVER_FOCUS 타지않게 예외처리함.
            //[WOSLQEVENT-86911]팝업메세지를 띄운곳과 현재 페이지가 다른 경우 현재 페이지의 이전 포커스로 이동하게 수정
            $rootScope.$broadcast(eventKey.RECOVER_FOCUS);
          } else { //아니면 마지막 포커스로
            element = scopeElement[0].querySelector('[item="' + item + '"]');
            scope.setFocusItem(item, element);
          }
        } else { //없으면 이벤트 broadcast
          if (owner == null || !owner.recoverFocus) {
            $rootScope.$broadcast(eventKey.RECOVER_FOCUS);
          } else {
            owner.recoverFocus();
          }
        }
      } else if (owner == null || !owner.recoverFocus) {
        $rootScope.$broadcast(eventKey.RECOVER_FOCUS);
      } else if (owner && focusManager.getPrevious() && focusManager.getPrevious().scope && focusManager.getPrevious().scope.scopeName
        && focusManager.getPrevious().scope.scopeName !== owner.scopeName) {
        //[WOSLQEVENT-86911]팝업메세지를 띄운곳과 현재 페이지가 다른 경우 현재 페이지의 이전 포커스로 이동하게 수정
        (focusManager.getPrevious().scope).$broadcast(eventKey.RECOVER_FOCUS);
      } else {
        owner.recoverFocus();
      }
      $scope.$digest();

      //[WOSLQEVENT-109222] Network 팝업이 닫히고 0.3초 이내 다른 팝업이 뜰경우 변수 초기화 되어 팝업이 뜸.
      if($scope.hide){
        // $scope변수 초기화
        $scope.butAct1 = null;
        $scope.butAct2 = null;
        $scope.butAct3 = null;
        $scope.usbDesc = null;
        $scope.usbListData = null;
        $scope.errorMsg = null;
        $scope.errorCodeMsg = null;
        $scope.packageGuide = null;
        $scope.packageListData = null;
        $scope.appLikeYN = null;
      }
    }, 300);
  };

  var focusOnCloseButton = function() {
    var element;
    if($scope.type == 'watch') {
      element = $element[0].getElementsByClassName('btn-close')[0];
      $scope.setFocusItem('close', element);
    } else {
      element = $element[0].getElementsByClassName('btn-popup')[0];
      if($scope.type == 'error') {
        $scope.setFocusItem('close', element);
      } else {
        if ($element[0].getElementsByClassName('btn-popup')[2]) {
          element = $element[0].getElementsByClassName('btn-popup')[2];
          $scope.setFocusItem('btn03', element);
        } else {
          if ($element[0].getElementsByClassName('btn-popup')[1]) {
            element = $element[0].getElementsByClassName('btn-popup')[1];
            $scope.setFocusItem('btn02', element);
          } else {
            $scope.setFocusItem('btn01', element);
          }
        }
      }
    }
  };

  /**
   * App 용량 변환
   * Byte 단위로 처리
   */
  var convertSize = function(size) {
    var appSize, appSizeUnit;

    try {
      var bytes = parseInt(size);
      var s = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
      var e = Math.floor(Math.log(bytes)/Math.log(1024));

      if(e == "-Infinity") {
        appSizeUnit = s[0];
        appSize = 0;
      } else {
        appSizeUnit = s[e];
        appSize = (bytes/Math.pow(1024, Math.floor(e))).toFixed(2);
      }

      return appSize + '' + appSizeUnit;
    } catch(e) {}
  };

  /**
   * USB 용량 변환
   * 저장장치는 MB 단위로 처리
   */
  var convertSizeForUSB = function(size){
    var appSize, appSizeUnit;
    var mb = parseInt(size);
    var s = ['MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(mb)/Math.log(1024));

    if(e == "-Infinity") {
      appSizeUnit = s[0];
      appSize = 0;
    } else {
      appSizeUnit = s[e];
      appSize = (mb/Math.pow(1024, Math.floor(e))).toFixed(2);
    }
    return appSize + '' + appSizeUnit;
  }

  $scope.moveFocusByKey = function(keyCode) {
    if ($scope.moveFocusDiable) {
      return;
    }
    if ($scope.focusItem === '') {
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    //팝업 공통 작업으로 인해 분기처리를 하지 않으면 case 추가시 많은 부분을 수정해야 하므로 각 type별로 focus 구현을 분리함.
    switch ($scope.type) {
      case 'watch':
        moveFocusFromWatch(keyCode);
      case 'package':
        moveFocusFromPackage(keyCode);
        break;
      case 'usb':
        moveFocusFromUsb(keyCode);
        break;
      case 'error':
        moveFocusFromError(keyCode);
        break;
      default:
        // UP, DOWN 키 처리
        if (keyCode === keyHandler.UP) {
          keyCode = keyHandler.LEFT;
        } else if (keyCode === keyHandler.DOWN) {
          keyCode = keyHandler.RIGHT;
        }
        moveFocusFromPopup(keyCode);
    }
  };

  var moveFocusFromPopup = function(keyCode) {
    var item, element;

    if (keyCode == keyHandler.LEFT) {
      if ($scope.focusItem == 'btn01') return;
      if ($scope.focusItem == 'btn02'){
        if ($scope.button1) {
          item = 'btn01';
          element = $element[0].getElementsByClassName('btn01')[0];
        } else {
          return;
        }
      } else if ($scope.focusItem == 'btn03'){
        if ($scope.button2) {
          item = 'btn02';
          element = $element[0].getElementsByClassName('btn02')[0];
        } else {
          return;
        }
      }
    } else if (keyCode == keyHandler.RIGHT) {
      if ($scope.focusItem == 'btn03') return;
      if ($scope.focusItem == 'btn02') {
        if ($scope.button3) {
          item = 'btn03';
          element = $element[0].getElementsByClassName('btn03')[0];
        } else {
          return;
        }
      } else if ($scope.focusItem == 'btn01'){
        if ($scope.button2) {
          item = 'btn02';
          element = $element[0].getElementsByClassName('btn02')[0];
        } else {
          return;
        }
      }
    }

    if (item && element) {
      $scope.setFocusItem(item, element);
    } else {
      // 리모콘으로 포커스 없앤 후 사방향키 눌렀을 때
      if (focusManager.getLastFocus().target === 'btn01') {
        item = 'btn01';
        element = $element[0].getElementsByClassName('btn01')[0];
      } else if (focusManager.getLastFocus().target === 'btn02') {
        item = 'btn02';
        element = $element[0].getElementsByClassName('btn02')[0];
      } else if (focusManager.getLastFocus().target === 'btn03') {
        item = 'btn03';
        element = $element[0].getElementsByClassName('btn03')[0];
      }
      $scope.setFocusItem(item, element);
    }
  };

  var moveFocusFromError = function(keyCode) {
    var item, element;

    if (keyCode == keyHandler.LEFT) {
      if ($scope.focusItem == 'close') return;
      element = $element[0].getElementsByClassName('btn-popup')[0];
      item = 'close';
    } else if (keyCode == keyHandler.RIGHT) {
      if ($scope.focusItem == 'error') return;
      element = $element[0].getElementsByClassName('icon-code')[0];
      item = 'error';
    }

    if (item && element) {
      $scope.setFocusItem(item, element);
    }
  };

  var moveFocusFromUsb = function(keyCode) {
    var item, element, scrollY, hidden;
    if (keyCode == keyHandler.LEFT) {
      //if ($scope.focusItem == 'btn01') return;
      //2017년향 GUI변경(버튼 위치 변경)으로 인해 USB 리스트 마지막에 포커스가게 수정
      if ($scope.focusItem == 'btn01'){
        if($scope.usbListData && $scope.usbListData.length > 0){
          item = $scope.usbListData.length - 1;
          element = $element[0].getElementsByClassName('usbList' + item)[0];
          item = 'usbList' + item;
        }
      }
      if ($scope.focusItem == 'btn02'){
        item = 'btn01';
        element = $element[0].getElementsByClassName('btn01')[0];
      }
    } else if (keyCode == keyHandler.RIGHT) {
      if ($scope.focusItem == 'btn02') return;
      //17년향 USB리스트 마지막 리스트에 포커스가 존재하고 오른쪽 키를 눌렀을 경우
      //btn1에 포커스가게 수정
      if($scope.usbListData && $scope.usbListData.length > 0) {
        item = $scope.usbListData.length - 1;
        if ($scope.focusItem == 'usbList' + item) {
          item = 'btn01';
          element = $element[0].getElementsByClassName('btn01')[0];
        }
      }
      if ($scope.focusItem == 'btn01'){
        item = 'btn02';
        element = $element[0].getElementsByClassName('btn02')[0];
      }
    } else if (keyCode == keyHandler.UP) {
      if ($scope.focusItem == 'btn01' || $scope.focusItem == 'btn02') return;
      if ($scope.focusItem == 'usbList0') {
        element = $element[0].getElementsByClassName('btn01')[0];
        item = 'btn01';
      } else {
          item = parseInt($scope.focusItem.replace('usbList', '')) - 1;
          element = $element[0].getElementsByClassName('usbList' + item)[0];
          item = 'usbList' + item;
          /*if (element) scrollY = element.offsetTop;
          if (scrollY < -scroll.y) {
            hidden = true;
            scrollY = -scrollY;
          }*/
      }
    } else if (keyCode == keyHandler.DOWN) {
      if ($scope.focusItem == 'btn01' || $scope.focusItem == 'btn02'){
          item = 'usbList0';
          element = $element[0].getElementsByClassName('usbList0')[0];
          scrollY = 0;
      } else {
        item = parseInt($scope.focusItem.replace('usbList', '')) + 1;
        element = $element[0].getElementsByClassName('usbList'+item)[0];
        item = 'usbList'+item;
        /*if (element) scrollY = element.offsetTop + element.offsetHeight;
        if (scrollY > scroll.wrapperH - scroll.y) {
          hidden = true;
          scrollY = scroll.wrapperH - scrollY;
        }*/
      }
    }

    if (item && element) {
      $scope.setFocusItem(item, element);
      /*if (hidden) {
        scroll.scrollTo(0, scrollY, 300, false);
      }*/
    }
  };

  var moveFocusFromWatch = function(keyCode) {
    var i, j, l, regCnt, rowCnt, itemCnt, curIdx, focusItem, name, element, hidden;

    // 전체 item 및 row 계산
    itemCnt = $element[0].getElementsByClassName('item-apps').length;
    // 현재 위치
    if(focusElement.getAttribute('index')) {
      curIdx = parseInt(focusElement.getAttribute('index'));
    }

    focusItem = $scope.focusItem;
    if (keyCode == keyHandler.UP) {
      if (focusItem === 'close') {
        return;
      } if(curIdx > 2) {
        name = 'popup-list';
        element = $element[0].getElementsByClassName('item-apps')[curIdx - 3];
      } else {
        name = 'close';
        lastFocusIdx = curIdx;
        element = $element[0].getElementsByClassName('btn-close')[0];
      }
    } else if (keyCode == keyHandler.DOWN) {
      if(focusItem == 'close') {
        name = 'popup-list';
        if(lastFocusIdx === null) {
          element = $element[0].getElementsByClassName('item-apps')[itemCnt-1];
        } else {
          element = $element[0].getElementsByClassName('item-apps')[lastFocusIdx];
        }
      } else if(curIdx+3 < itemCnt) {
        name = 'popup-list';
        element = $element[0].getElementsByClassName('item-apps')[curIdx + 3];
      } else {
        return;
      }
    } else if (keyCode == keyHandler.RIGHT) {
      if (focusItem === 'close') {
        return;
//      } else if(focusItem === 'setCp') {
//        name = 'close';
//        element = $element[0].getElementsByClassName('btn-close')[0];
      } else {
        if(itemCnt == curIdx) {
          return;
        } else {
          name = 'popup-list';
          element = $element[0].getElementsByClassName('item-apps')[curIdx + 1];
          if(!element){
            name = 'close';
            lastFocusIdx = curIdx;
            element = $element[0].getElementsByClassName('btn-close')[0];
          }
        }
      }
    } else if (keyCode == keyHandler.LEFT) {
      if(focusItem == 'close') {
        name = 'popup-list';
        element = $element[0].getElementsByClassName('item-apps')[itemCnt-1];
//        name = 'setCp';
//        element = $element[0].getElementsByClassName('btn-setCp')[0];
      } else {
        if(curIdx == 0) {
          return;
        } else {
          name = 'popup-list';
          element = $element[0].getElementsByClassName('item-apps')[curIdx - 1];
        }
      }
    }

    if (name && element) {
      $scope.setFocusItem(name, element);
    }
  }

  var moveFocusFromPackage = function(keyCode) {
    var packageCnt, item, element;
    packageCnt = $scope.packageListData ? $scope.packageListData.length - 1 : 0;
    if (keyCode == keyHandler.LEFT) {
      if ($scope.focusItem == 'btn01' || $scope.focusItem == 'item-package-0') return;
      if ($scope.focusItem == 'btn02'){
        item = 'btn01';
        element = $element[0].getElementsByClassName('btn01')[0];
      } else {
        item = parseInt($scope.focusItem.replace('item-package-', '')) - 1;
        element = $element[0].getElementsByClassName('item-package-'+item)[0];
        item = 'item-package-'+item;
      }
    } else if (keyCode == keyHandler.RIGHT) {
      if ($scope.focusItem == 'btn02' || $scope.focusItem == ('item-package-' + packageCnt)) return;
      if ($scope.focusItem == 'btn01'){
        item = 'btn02';
        element = $element[0].getElementsByClassName('btn02')[0];
      }  else {
        item = parseInt($scope.focusItem.replace('item-package-', '')) + 1;
        element = $element[0].getElementsByClassName('item-package-'+item)[0];
        item = 'item-package-'+item;
      }
    } else if (keyCode == keyHandler.UP) {
      if ($scope.focusItem == 'btn01' || $scope.focusItem == 'btn02') return;
      element = $element[0].getElementsByClassName('btn01')[0];
      item = 'btn01';
    } else if (keyCode == keyHandler.DOWN) {
      if ($scope.focusItem.indexOf('item-package') >= 0 || !$scope.appLikeYN) return;
      if ($scope.focusItem == 'btn01' || $scope.focusItem == 'btn02') {
        item = 'item-package-' + packageCnt;
        element = $element[0].getElementsByClassName('item-package-' + packageCnt)[0];
      }
    }

    if (item && element) {
      $scope.setFocusItem(item, element);
    }
  };

  $scope.executeAction = function() {
    var focusObject, target, usbItemArr, l, usbData, appInfo, checkParams, cpEelemnt;
    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target == 'btn01') {
        owner.$broadcast($scope.butAct1);
      } else if (target == 'btn02') {
        if ($scope.selectedDeviceId && $scope.selectedDriveId) {
          usbData = {
            deviceId : $scope.selectedDeviceId,
            driveId: $scope.selectedDriveId
          };
        }
        owner.$broadcast($scope.butAct2, usbData);
      } else if (target == 'btn03') {
        owner.$broadcast($scope.butAct3);
      } else if (target == 'close') {
        $scope.hidePopup(target);
      } else if (target == 'setCp') {
        // pmLog : CP 클릭 시 pmLog
        pmLog.write(pmLog.LOGKEY.DEFAULT_CP_SETTING_CLICK, {
          menu_name : logMenu,
          contents_id : focusElement.getAttribute('item'),
          contents_category : logCategory
        });

        $rootScope.draw({page: 'myPage', module: '2'});
        $scope.hidePopup(target);
      } else if (target.indexOf('usbList') >= 0) {
        usbItemArr = $element[0].getElementsByClassName('memory-list');
        l = usbItemArr.length;
        for (var i = 0; i < l; i++) {
          usbItemArr[i].classList.remove('on');
        }
        $element[0].getElementsByClassName(target)[0].classList.add('on');
        $scope.selectedDeviceId = $element[0].getElementsByClassName(target)[0].getAttribute('device-id');
        $scope.selectedDriveId = $element[0].getElementsByClassName(target)[0].getAttribute('drive-id');
      } else if (target.indexOf('item-package') >= 0) {
        $scope.selectedAppId = $element[0].getElementsByClassName(target)[0].getAttribute('item-id');
        appInfo = {appId:$scope.selectedAppId};
        owner.$broadcast('appCheckLaunchFromPopup', appInfo);
      } else {
        var appId, premiumAppFlag, execItemId;

        // pmLog : CP 클릭 시 pmLog
        pmLog.write(pmLog.LOGKEY.CP_SELECT, {
          menu_name : logMenu,
          cp_id : focusElement.getAttribute('appid'),
          contents_id : focusElement.getAttribute('item'),
          contents_category : logCategory
        });

        if(target === 'popup-list') {
          target = focusElement.getAttribute('item');
        }
        cpEelemnt = $element[0].getElementsByClassName(target)[0];
        if (!cpEelemnt)
          return;
        appId = cpEelemnt.getAttribute('appid');
        if (!appId)
          return;

        execItemId = cpEelemnt.getAttribute('execItemId');

        // onnow logging 앱실행정보
        appService.writeServerLog($scope.contents_id, appId);

        premiumAppFlag = cpEelemnt.getAttribute('premiumappflag');
        checkParams = {
          'item_id': $scope.contents_id, //execItemId (얘는 실행 cp id인데?),
          "appId": appId,
          "premiumFlag": premiumAppFlag,
          "launchContentId": target
        };
        appService.appCheckLaunch(checkParams);
        $scope.hidePopup();
      }
    }
  };

  var initialize = function() {
    $rootScope.popupApp = $scope;
  };

  initialize();
});