app.directive('myPage', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'myPageController',
    // templateUrl: './resources/html/myPage.html'
    template: mypageTmpl
  };
});

app.controller('myPageController', function($scope, $controller, $element, $rootScope, $timeout, server, focusManager, membership, device, app, getAppInfo, keyHandler, marquee, util, storage, pmLog, appInstall, tvInstalledList, eventKey, timeOutValue, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var lastFocus = {};
  var lastItemFocus = {};
  var lastItemMenuFocus= {};
  var requestedAppends = false;
  var removeOptionSelection = false;
  var isInitMenu = true;
  var lastLogInCheck;
  var isFirst = false;
  var splitName = null;
  var splitItemCnt = {};
  var itemList = null;

  var destroyInfo = {scope : $scope, element : $element};
  $scope.scopeName = '';
  $scope.toBeDelScope = null;
  $scope.focusItem = '';
  $scope.defaultFocusItemClass = '';
  $scope.listData = null;
  $scope.direct = false;
  $scope.showing = false;
  $scope.hiding = false;
  $scope.hideListContent = false;
  $scope.title = '';
  $scope.historyBack = $rootScope.pageManager.getTitle('back');
  $scope.subtitle = '';
  $scope.subtitle2 = '';
  $scope.selectedMenu = '';
  $scope.showSubMenu = false;
  $scope.selectedFilter = '';
  $scope.nodata = msgLang.mypage_nodata3;
  $scope.signin_text = msgLang.myPage_apps_008;
  $scope.signin_btn = msgLang.myPage_apps_004;
  $rootScope.pmLogValue = pmLog.TYPE.MYPAGE;

  var _ctrls = {
    'myappList' : {initialized: false, drawed: false, active: false},
    'cpList' : {initialized: false, drawed: false, active: false}
  };

  $scope.loginCheck = function() {
    var result = false;
    if (device.auth.userID && device.auth.loginSession) {
      result = true;
    }
    lastLogInCheck = result;
    return result;
  };

  $scope.isUpdateAvailable = false;
  var appsInstallingUpdate = [];

  var setAppInstallStatus = function(appId, started) {
    if (started) {
      // 업데이트 시작
      appsInstallingUpdate.push(appId);
    } else {
      // 설치가 완료되거나 실패한 경우
      var i = appsInstallingUpdate.indexOf(appId);
      if (i >= 0)
        appsInstallingUpdate.splice(i, 1);
    }
  };

  $scope.isUpdating = function() {
    // update 중인 app의 개수 확인
    return appsInstallingUpdate.length !== 0;
  };

  var resetUpdateAllButon = function(showNotAvailablePopup) {
    if (!showNotAvailablePopup && (appsInstallingUpdate.length > 0)) {
      var apps = getAppsToUpdate($scope.listData.itemList);
      for (i = 0 ; i < apps.length ; i++) {
        app = apps[i];
        if (!app.bSvcAvailable) {
          showNotAvailablePopup = true;
          break;
        }
      }
    }

    // update all 버튼을 다시 활성화
    appsInstallingUpdate.length = 0;
    $scope.$digest();

    if (showNotAvailablePopup) {
      // Seller lounge 에서 삭제 및 비전시 된 앱이 있는 경우,
      var requestParam = {
        type: 'popup',
        popupTitle: msgLang.mypage_popup_01,
        popupBut1: msgLang.ok,
        popupButAct1 : 'closeAppPopup',
        popupDesc: msgLang.mypage_popup_01_desc
      };
      $rootScope.popupApp.showPopup($scope, requestParam);
    }
  };

  var isListEmpty = function() {
    if (!$scope.listData.itemList ||
      ($scope.listData.itemList.length < 1))
      return true;
    else
      return false;
  };

  var onDataChanged = function() {
    if (!$scope.listData || !$scope.listData.itemList ||
      ($scope.listData.itemList.length < 1)) {
      $scope.isUpdateAvailable = false;
    }

    var found = false;
    var updateSplitFound = false;
    for (var i = 0 ; $scope.listData.itemList && (i < $scope.listData.itemList.length) ; i++) {
      var obj = $scope.listData.itemList[i];
      if (obj.type === 'split') {
        if (obj.splitType === 'myPage_waiting_update') {
          updateSplitFound = true;
        } else {
          updateSplitFound = false;
        }
      } else if (updateSplitFound && obj.id) {
        found = true;
        break;
      }
    }

    $scope.isUpdateAvailable = found;
  };

  $scope.listItemType = function() {
    if ($scope.selectedMenu === '' ||
      $scope.selectedMenu === '1' ||
      $scope.selectedMenu === '2') {
      return 'list-app';
    }
  };

  $scope.getSelectedMenu = function() {
    var menu;

    if ($scope.selectedMenu) {
      menu = $scope.selectedMenu;
    } else {
      var item = $element[0].getAttribute('item');
      if (item) {
        // detail로 진입한 이후, Back을 한 경우
        menu = item;
      } else {
        menu = '1';
      }
    }
    return menu;
  };

  var listItemTypeClass = function() {
    var itemClass;
    switch ($scope.getSelectedMenu()) {
      case "1":
      case "2":
        // My Apps
        // Preferred CP
        itemClass = 'item-apps';
        break;
    }
    return itemClass;
  };

  $scope.setShowSubMenu = function(menuType) {
    if(menuType == 'menu-depth') {
      isInitMenu = false;
      $scope.showSubMenu = !$scope.showSubMenu;
    }
  };

  $scope.isShowSubMenu = function(subId) {
    if(subId) {
      return $scope.showSubMenu;
    } else {
      return true;
    }
  };

  $scope.getSubClassName = function(subId) {
    if(subId) {
      return 'menu-list-depth';
    } else {
      return 'menu-list';
    }
  };

  $scope.getSubClassName2 = function(menuType) {
    if($scope.selectedMenu.indexOf('2_') >= 0 && isInitMenu) {
      $scope.showSubMenu = true;
    }

    if(menuType == 'menu-depth' && $scope.showSubMenu) {
      return 'depth-open';
    } else {
      return '';
    }
  };

  $scope.getMenuName = function(menuName) {
    switch (menuName) {
      case 'My Apps':
        return msgLang.myPage_apps_005;
      case 'Preferred App Setting':
        return msgLang.mypage_submenu03;
      case 'Payment Inquiry':
        return msgLang.mypage_submenu06;
      case 'Guide':
        return msgLang.myPage_apps_011;
      default:
        return menuName;
    }
  };

  $scope.setFocusItem = function(item, element) {
    // var currentScope;
    // if (focusManager.getCurrent() &&
    //   focusManager.getCurrent().scope) {
    //   currentScope = focusManager.getCurrent().scope.scopeName;
    // }
    // console.log('myPage.setFocusItem, currentScope=' + currentScope + ', item=' + item +
    //   ', element=' + element);

    var y;

    if (util.isAWSServer()) {
      // [WOSLQEVENT-114696] LG Store -> 마이 페이지 -> 정렬옵션 : 로그인 아이디 ->
      // 앱목록 이동 -> LG Membership -> 로그아웃 -> LG Store 복귀시, Focus 사라짐
      // app switch-in 시, saveFocus 때문에, empty list에 뒤늦게 item0-0 item에 focus 지정하려함
      // [WOSLQEVENT-113538] Focus 사라짐
      if ($scope.selectedFilter === '002') {
        if ($scope.hideListContent &&
          item &&
          (item.indexOf('item') === 0)) {
          // sign in 상태에서, background에서 sign out 상태로 변경되고, LGStore로 app switch-in 시
          // console.log('myPage.setFocusItem, SignIn-ID filter, empty list, no item to focus');
          return;
        } else if (!$scope.hideListContent &&
          (item === 'signin')) {
          // sign out 상태에서, background에서 sign in 상태로 변경되고, LGStore로 app switch-in 시
          // console.log('myPage.setFocusItem, SignIn-ID filter, non-empty list, no signin button to focus');
          return;
        }
      }

      if (util.isAWSServer()) {
        if (!element) {
          // [WOSLQEVENT-115631] [Service.SDPService.LGStore_My Page] [Always] [Minor] Focus 사라짐
          // relaunch 하기 전/후에 sign-in status가 변경된 경우, 2nd parameter를 undefined로 보내면
          // myPage.js에서 element를 새로 찾도록

          // focusItemClass[ITEM] = CLASS_NAME
          var focusItemClass = {
            'signin':     'signin-button',
            'updateall':  'btn-update-all',
            'option':     'btn-list-option',
            '1':          'mypage-menu',
            '2':          'mypage-menu',
            '3':          'mypage-menu',
            '4':          'mypage-menu'
          };

          if (focusItemClass[item]) {
            var elements = $element[0].getElementsByClassName(focusItemClass[item]);
            // 동일한 class name으로 다른 item 값들이 존재하기 때문
            for (var i = 0 ; i < elements.length ; i++) {
              if (elements[i].getAttribute('item') === item) {
                element = elements[i];
                break;
              }
            }
          }

          if (!element) {
            // list item 인 경우. 예) item1-0
            // home key를 눌러서 하단 navigation bar가 나온후, 다시 home key를 눌러서 복귀한 경우
            element = $element[0].getElementsByClassName(item)[0];
          }

          if (!element) {
            // console.log('myPage.setFocusItem, element is still empty.');
          }
        }
      }
    }

    if (lastFocus.item == 'back' ||
      lastFocus.item == 'option')
      $rootScope.tooltip.hideTooltip();

    $scope.focusItem = item;

    if (focusElement) focusElement.classList.remove('focus');

    focusElement = element;
    if (focusElement) focusElement.classList.add('focus');

    if (item) {
      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
      focusManager.setCurrent($scope, item, element);
      lastFocus.item = item;
      lastFocus.element = element;
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }

    if (!$scope.focusItem) {
      return;
    }

    if ($scope.focusItem == 'back') {
      $scope.historyBack = $rootScope.pageManager.getTitle('back');
      $rootScope.tooltip.showTooltip(50, 107, $rootScope.pageManager.getTitle('back'), true, true);
    } else if ($scope.focusItem == 'option') {
      var right = false;
      var leftMargin = 0;
      if(device.isRTL) {
        leftMargin = 90;
      }
      $rootScope.tooltip.showTooltip(48+leftMargin, 135, msgLang.listOption, right, true);
    } else if ($scope.focusItem && ($scope.focusItem.indexOf('item') >= 0)) {
      //이전에 포커스된 아이템 컨텐츠를 저장하여 back 버튼에서 돌아올 경우
      // 이전에 포커스된 아이템 컨텐츠로 이동한다.
      lastItemFocus.item = lastFocus.item;
      lastItemFocus.element = lastFocus.element;
      lastItemFocus.isFrom = true;
      lastItemMenuFocus.isFrom = false;
    } else if ($scope.focusItem && $scope.focusItem.length > 0) {
      // menu -> option -> menu (in order to come back)
      if ($scope.focusItem !== 'updateall' && $scope.focusItem !== 'option' && $scope.focusItem !== 'signin') {
        lastItemMenuFocus.item = lastFocus.item;
        lastItemMenuFocus.element = lastFocus.element;
        lastItemMenuFocus.isFrom = true;
      }
    }
  };

  $scope.audioGuidance = function (scope, target, element) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };


    if ($scope.listData.itemList !== itemList) {
      itemList = $scope.listData.itemList;

      //deprecated
      //최초 진입 시 아이템 갯수 정보 object 가공
      /*var tmpCnt = 0;
      var tmpVal = null;
      if (itemList) {
        splitItemCnt = {};
        for (var i = 0; i < itemList.length; i++) {
          if (itemList[i].type === 'split' && itemList[i].name) {
            splitItemCnt[itemList[i].name] = tmpCnt;
            tmpVal = itemList[i].name;
          } else {
            tmpCnt++;
            if (itemList[i + 1] === undefined || itemList[i + 1].type === 'split') {
              splitItemCnt[tmpVal] = tmpCnt;
              tmpCnt = 0;
            }
          }
        }
      }*/
    }

    //sort & filter 포커스 시 별도 처리
    if (target === 'option') {
      return;
    } else if (target === 'signin') {
      if(element && element.parentElement.querySelector('[ng-bind=signin_text]').innerText.length > 0){
        params.text = element.parentElement.querySelector('[ng-bind=signin_text]').innerText;
      }
      if (element && element.querySelector('.focus .text') && params.text.length > 0) {
        params.text += '. ';
        params.text += element.querySelector('.focus .text').innerText;
      }else if(element && element.querySelector('.focus .text') && params.text.length < 1){
        params.text = element.querySelector('.focus .text').innerText;
      }
    } else {
      var enterSound = '';
      var isNewShelf = true;

      //최초 화면 진입 시 나오는 음성
      if ($rootScope.isNewPage) {
        if (scope.getScopeElement()[0]) {
          var tmpElement = scope.getScopeElement()[0];
          if (tmpElement.querySelector('.panel-header .text') && tmpElement.querySelector('.panel-header .text').innerText.length > 0) {
            enterSound = tmpElement.querySelector('.panel-header .text').innerText;
          }
        }
        $rootScope.isNewPage = false;
      }

      //contentName setting
      var contentName = null;
      if (element && element.querySelector('.focus .text')) {
        contentName = element.querySelector('.focus .text').innerText;
      }

      //shelfName setting
      var tmpSplitName = null;
      if (contentName && itemList && element && element.classList.contains('item')) {
        for (var i = 0; 0 < itemList.length; i++) {
          if (itemList[i] && itemList[i].type === 'split') {
            tmpSplitName = itemList[i].name;
          } else if (itemList[i].name.trim() === contentName.trim()) {
            if (splitName !== tmpSplitName) {
              splitName = tmpSplitName;
              break;
            } else {
              isNewShelf = false;
              break;
            }
          }
        }
      } else {
        isNewShelf = false;
      }

      if (isNewShelf) {
        if (enterSound.length > 0) {
          params.text = enterSound;
          params.text += ". ";
          params.text += splitName;
          //deprecated
          /*params.text += ". ";
          params.text += splitItemCnt[splitName];
          params.text += ". ";
          params.text += "items";*/
          params.text += ". ";
          params.text += contentName;
        } else {
          params.text = splitName;
          //deprecated
          /*params.text += ". ";
          params.text += splitItemCnt[splitName];
          params.text += ". ";
          params.text += "items";*/
          params.text += ". ";
          params.text += contentName;
        }
      } else {
        params.text = contentName;
      }
    }

    //button은 button 추가
    if(element && element.classList.contains('btn') && params.text.length > 0){
      params.text += '. ';
      params.text += msgLang.audio_button_button;
    }

    audioGuidance.call(params);
  };

  $scope.recoverFocus = function() {
    // console.log('myPage.recoverFocus begin');
    if ($rootScope.guide && $rootScope.guide.isViewGuide) {
      $rootScope.guide.setDefaultFocus();
      return;
    }

    if (lastFocus.item && lastFocus.element)
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  $scope.setFilter = function(filter, value) {
    // console.log('myPage.setFilter, filter=' + filter + ', value=' + value);
    $scope.direct = true;
    $scope['selected' + filter] = value;
    requestedAppends = false;
    util.async(requestMenu);
  };

  $scope.executeAction = function() {
    if (focusManager.blockExecution()) {
      console.log('myPage.executeAction, blockExecution is true');
      return;
    }

    isFirst = false;

    var i, j, errorCode, focusObject, arr, target, element, obj, page, item, itemId, requestParam, subMenu = ['1', '2', '3', '4'];

    focusObject = focusManager.getCurrent();

    // console.log('myPage.executeAction, currentScope=' + focusManager.getCurrent().scope.scopeName +
    //   ', target=' + focusObject.target);

    if (focusObject.scope == $scope) {
      target = focusObject.target;

      if (target == 'back') {
        $rootScope.breadcrumb.executeBack($scope.scopeName, function() {
          $scope.setFocusItem('', null);
          marquee.setTarget(null);
          focusManager.setCurrent($scope, '');

          obj = $rootScope.pageManager.popHistory();
          $rootScope.draw(obj);
        });
      } else if (target == '3') {   // purcharse inquery
        requestParam = {query: 'requestPaymentInquiry'};
        membership.callMembershipPage(requestParam);
      } else if (target == '4') {  // guide page
        // [WOSLQEVENT-91595] guide이미지가 늦게뜨는 현상으로 겹쳐 보이는 현상(클릭 시 dim처리)
        $element[0].style.display = 'none';
        $rootScope.guide.showViewGuide($scope, function() {
          // callback on guide close
          // WOSLQEVENT-113538, WOSLQEVENT-113537
          // guide가 뜬 상태에서, sign in status가 변경되면, menu와 list item이 새로 그려진다.
          if (lastFocus.item === '4') {
            // 따라서, 기존에 lastFocus가 menu-guide이었다면,
            // item을 새로 가져와야 한다.
            item = '4';
            target = $element[0].getElementsByClassName('menu-guide')[0];
            if (target) {
              $scope.setFocusItem(item, target);
            }
          }
        });
        // [WOSLQEVENT-91595] guide이미지가 늦게뜨는 현상으로 겹쳐 보이는 현상(1초 후 복구)
        $timeout(function() {
          $element[0].style.display = '';
        }, 1000);
      } else if (subMenu.indexOf(target) >= 0) {
        $scope.direct = true;
        removeOptionSelection = true;
        item = $element[0].getAttribute('item');

        // pmLog (submenu click)
        myPageMenuContentsLog(target);

        if (item.indexOf(target) < 0) {
          $element[0].setAttribute('item', target);
          $scope.selectedFilter = '';
          requestedAppends = false;

          $scope.selectedMenu = target;

          Object.keys(_ctrls).forEach(function(name) {
            _ctrls[name].active = false;
            _ctrls[name].initialized = false;
          });

          switch (target) {
            case "1":
              // My Apps
              _ctrls['myappList'].active = true;
              // enable filter & update button
              $element[0].getElementsByClassName("btn-list-option")[0].style.display = "";
              $element[0].getElementsByClassName("btn-update-all")[0].style.display = "";
              break;
            case "2":
              _ctrls['cpList'].active = true;
              $element[0].getElementsByClassName("btn-list-option")[0].style.display = "none";
              $element[0].getElementsByClassName("btn-update-all")[0].style.display = "none";
              break;
          }

          $scope.$digest();
        }
      } else if (target == 'option') {
        if ($rootScope.option.hide) {
          $scope.setFocusItem('', null);
          $rootScope.option.showOption($scope, $scope.listData.filterList, removeOptionSelection);
          document.getElementsByClassName('popup-list-option')[0].parentNode.classList.add('popup-modal-list-option'); // 팝업창 외 포커스 방지
          removeOptionSelection = false;
        }
      } else if (target == 'updateall') {
        // UX_2016_webOS_Initial_LG Content Store_v1.2.0_150605.pdf: page 39
        // Waiting for update shelf에 premium앱, 무료 앱만 존재할 경우, 로그인 없이 업데이트 가능
        // 만약, 유료 앱이 존재할 경우 Alert popup 제공함. (로그인 필요)

        // 임시로 focus를 option으로 이동
        moveFocusToItem('btn-list-option', 'option', keyHandler.RIGHT);

        var notAvailable = false;
        var paidAppExists = false;
        var apps = getAppsToUpdate($scope.listData.itemList);
        for (i = 0 ; i < apps.length ; i++) {
          app = apps[i];
          if (app.bPremium) {
            continue;
          } else if (!app.bSvcAvailable) {
            notAvailable = true;
            continue;
          }

          if (!isFreeAppCheck(app)){
            paidAppExists = true;
            break;
          }
        }

        if (!$scope.loginCheck()) {
          if (!paidAppExists) {
            // // [UX_2016_webOS_Initial_LG Content Store_v1.2.0_150605.pdf: 42 page]
            // 프리미엄 앱, 무료 앱만 Waiting for update에 존재할 시에는 해당 팝업 띄우지 않음.
            appUpdateAct();
          } else {
            // 유료 앱이 존재할 경우 Alert popup 제공함. (로그인 필요)
            requestParam = {
              type: 'popup',
              popupTitle: msgLang.mypage_popup_02,
              popupBut1: msgLang.no,
              popupBut2: msgLang.yes,
              popupButAct1 : 'closeAppPopup',
              popupButAct2: 'callLogInPageFromPopup',  //멤버쉽 관리로 이동(로그인 화면 아님.)
              popupDesc: msgLang.mypage_popup_02_desc2
            };
            $rootScope.popupApp.showPopup($scope, requestParam);
          }
        } else {
          var appsOtherId = getAppsToUpdateOtherId($scope.listData.itemList);

          if (appsOtherId.length > 0) {
            requestParam = {
              type: 'popup',
              popupTitle: msgLang.mypage_popup_03,
              popupBut1: msgLang.cancel,
              popupBut2: msgLang.ok,
              popupButAct1 : 'closeAppPopup',
              popupButAct2: 'updateAppFromPopup',
              popupDesc: msgLang.mypage_popup_03_desc
            };
            $rootScope.popupApp.showPopup($scope, requestParam);
          } else if (paidAppExists) {
            requestParam = {
              type: 'popup',
              popupTitle: msgLang.mypage_popup_03,
              popupBut1: msgLang.cancel,
              popupBut2: msgLang.apps_update,
              popupButAct1 : 'closeAppPopup',
              popupButAct2: 'updateAppFromPopup',
              popupDesc: msgLang.mypage_popup_03_desc2
            };
            $rootScope.popupApp.showPopup($scope, requestParam);
          } else {
            // // [UX_2016_webOS_Initial_LG Content Store_v1.2.0_150605.pdf: 42 page]
            // 프리미엄 앱, 무료 앱만 Waiting for update에 존재할 시에는 해당 팝업 띄우지 않음.
            appUpdateAct();
          }
        }
      } else if (target == 'signin') {
        console.log('signin button is selected');

        if (!$scope.loginCheck()) {
          //Login되어 있지 않을시 membership App 호출
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
                  query:'category/MYPAGE/1',
                  categoryCode:'002'
                }
              }
            }};
          membership.callMembershipPage(requestParam);
        }
      } else if (target.indexOf('item') >= 0) {
        item = $element[0].getAttribute('item');
        itemId = focusElement.getAttribute('item-id');

        // pmLog (contents click)
        myPageMenuContentsLog(item, itemId);

        var keys = Object.keys(_ctrls);
        for (i = 0 ; i < keys.length ; i++) {
          var key = keys[i];
          if (!_ctrls[key].active)
            continue;

          var result = _ctrls[key].scope.executeAction({
            pageElement: $element[0],
            focusElement: focusElement,
            target: target,
            pageFrom: 'myPage',
            module: item
          });
          console.log('myPage.executeAction, result=' + result);

          if (result === true) {
            return;
          }
        }
      }
    }
  };

  var myPageMenuContentsLog = function(menu, itemId) {
    var subName = '';
    if (menu === '1') subName = 'My Apps';
    else if (menu === '2') subName = 'Preffered App Setting';
    // TODO : menu 늘어날 시 추가

    if (!itemId) {
      pmLog.write(pmLog.LOGKEY.SECOND_MENU_CLICK, {
        menu_name : pmLog.TYPE.MYPAGE,
        sub_menu_name : subName
      });
    } else {
      // listControlApp.js에서 남김 (apps 공통)
      /*pmLog.write(pmLog.LOGKEY.CONTENTS_CLICK, {
        menu_name : 'List Page',
        contents_type : 'Apps',
        contents_category : pmLog.TYPE.MYPAGE,
        contents_id : itemId,
        sub_menu_name : subName,
        sub_sub_menu_name : ''
      });*/
    }
  };

  function copyAppObj(dst, src){
    dst.name = src.name;
    dst.id = src.id;
    dst.img = src.iconURL;
    dst.bFree = src.bFree;
    dst.bInstalled = src.bInstalled;
    dst.bPremium = src.bPremium;
    dst.bPurchased = src.bPurchased;
    dst.bSvcAvailable = src.bSvcAvailable;
    dst.installedDate = src.installedDate;
    dst.nsuYN = src.nsuYN;
    dst.prohibitYN = src.prohibitYN;
    dst.purchaseDate = src.purchaseDate;
    dst.updateYN = src.updateYN;
    dst.iconColor = src.iconColor;
  }

  function parseCpList(dst, src) {
    var i;

    for(i=0; i<src.length; i++) {
      dst[i] = {};
      dst[i].contents_set_id = src[i].contents_set_id;
      dst[i].id = src[i].contents_set_id+'|'+src[i].app_id;
      dst[i].name = src[i].app_name;
      dst[i].img = src[i].app_icon_url;
      dst[i].iconColor = src[i].app_icon_color;
      dst[i].selected = src[i]['@selected'];
      dst[i].type = 'app';
    }
  }

  function parseMyAppList(dst, src) {
    var i, l, k, j, updateCheckApps = [], noUpdatecheckApps = [];

    try {
      l = src.length;
      k = dst.length;
      j = 0;

      for (i = 0; i < l; i++) {
        if (src[i].bInstalled === false)
          continue;

        // CP 강제 업데이트인 경우는 updateYN 값이 "F" - 2016.03.14 [SVCERROR-626]
        if(src[i].updateYN === 'Y' || src[i].updateYN === 'F'){
          updateCheckApps.push(src[i]);
        } else if (src[i].updateYN === 'N'){
          noUpdatecheckApps.push(src[i]);
        }
      }

      if (updateCheckApps.length > 0){
        // split 추가
        dst[j + k] = {};
        dst[j + k].type = 'split';
        dst[j + k].splitType = 'myPage_waiting_update';
        dst[j + k].firstSplit = (k === dst.length);
        j++;

        for (i = 0; i < updateCheckApps.length; i++, j++) {
          obj = updateCheckApps[i];
          dst[j + k] = {};
          copyAppObj(dst[j + k], obj);
          dst[j + k].type = 'app';
        }
      }

      if (noUpdatecheckApps.length > 0){
        // split 추가
        dst[j + k] = {};
        dst[j + k].type = 'split';
        dst[j + k].splitType = 'myPage_all_installed';
        dst[j + k].firstSplit = (k === dst.length);
        j++;

        for (i = 0; i < noUpdatecheckApps.length; i++, j++) {
          obj = noUpdatecheckApps[i];
          dst[j + k] = {};
          copyAppObj(dst[j + k], obj);
          dst[j + k].type = 'app';
        }
      }
    } catch (e) {}
  }

  function parseMyAppListSignIn(dst, src) {
    var i, l, k, j, obj, updateCheckApps = [], updateAppsOtherId = [],
      purchasNoinstallApps = [], noUpdatecheckApps = [];

    try {
      l = src.length;
      k = dst.length;
      j = 0;

      var testCount = 0;

      for (i = 0; i < l; i++) {
        if (src[i].bPremium) {
          // [WOSLQEVENT-46295]
          // SignIn-ID 필터 설정시 프리미엄 앱은 표시되지 않아야 함
          continue;
        }
        if(src[i].bPurchased === true && src[i].bInstalled === true && src[i].updateYN === 'Y'){
          updateCheckApps.push(src[i]);
        }else if(src[i].bPurchased === false && src[i].bInstalled === true){
          // install되었으나, 현재 로그인 아이디로 구매한 것이 아님
          // 'Waiting for update > Need to sign in with other ID' splitter 내부에 들어갈 것들

          // [UX_2016_webOS_Initial_LG Content Store_v1.2.0_150605.pdf: 38 page]
          // "해당 ID로 로그인 하여 설치/구매한 무료 유료 앱"이라 명시되어 아래는 comment 처리함.
          updateAppsOtherId.push(src[i]);
        }else if(src[i].bPurchased === true && src[i].bInstalled === false){
          purchasNoinstallApps.push(src[i]);
        }else if(src[i].bPurchased === true && src[i].bInstalled === true){
          noUpdatecheckApps.push(src[i]);
        }
      }

      firstTime = false;

      if (updateCheckApps.length > 0){
        // split 추가
        dst[j + k] = {};
        dst[j + k].type = 'split';
        dst[j + k].name = msgLang.myPage_waiting_update;
        dst[j + k].splitType = 'myPage_waiting_update';
        dst[j + k].firstSplit = (k === dst.length);
        j++;

        for (i = 0; i < updateCheckApps.length; i++, j++) {
          obj = updateCheckApps[i];
          dst[j + k] = {};
          copyAppObj(dst[j + k], obj);
          dst[j + k].type = 'app';
        }
      }

      if (updateAppsOtherId.length > 0){
        // split 추가
        dst[j + k] = {};
        dst[j + k].type = 'split';
        dst[j + k].name = msgLang.myPage_waiting_otherid;
        dst[j + k].splitType = 'myPage_waiting_otherid';
        dst[j + k].firstSplit = (k === dst.length);
        j++;

        for (i = 0; i < updateAppsOtherId.length; i++, j++) {
          obj = updateAppsOtherId[i];
          dst[j + k] = {};
          copyAppObj(dst[j + k], obj);
          dst[j + k].type = 'app';
        }
      }

      if (purchasNoinstallApps.length > 0){

        // 2016-04-07 : tunerless 대응
        var tmpStr = msgLang.myPage_apps_001;
        if (device.q['X-Device-Platform'].toUpperCase() === 'W16T') {
          if (device.q['X-Device-Language'].toUpperCase() === 'EN-GB') {
            tmpStr = tmpStr.replace(/TV/gi, 'monitor');
          } else if (device.q['X-Device-Language'].toUpperCase() === 'TR-TR') {
            tmpStr = 'Bu monitörde yüklü değil';
          }
        }

        // split 추가
        dst[j + k] = {};
        dst[j + k].type = 'split';
        dst[j + k].name = tmpStr;
        dst[j + k].splitType = 'myPage_apps_001';
        dst[j + k].firstSplit = (k === dst.length);
        j++;
        tmpStr = null;
        for (i = 0; i < purchasNoinstallApps.length; i++, j++) {
          obj = purchasNoinstallApps[i];
          dst[j + k] = {};
          copyAppObj(dst[j + k], obj);
          dst[j + k].type = 'app';
        }
      }

      if (noUpdatecheckApps.length > 0){
        // split 추가
        dst[j + k] = {};
        dst[j + k].type = 'split';

        // TODO: myPage_all_installed string에서 마침표 제거 필요
        // 임시로, 코드에서 마침표 제거하도록 수정
        if (msgLang.myPage_all_installed.charAt(msgLang.myPage_all_installed.length - 1) === '.') {
          dst[j + k].name = msgLang.myPage_all_installed.substring(0, msgLang.myPage_all_installed.length - 1);
        } else {
          dst[j + k].name = msgLang.myPage_all_installed;
        }

        dst[j + k].splitType = 'myPage_all_installed';
        dst[j + k].firstSplit = (k === dst.length);
        j++;

        for (i = 0; i < noUpdatecheckApps.length; i++, j++) {
          obj = noUpdatecheckApps[i];
          dst[j + k] = {};
          copyAppObj(dst[j + k], obj);
          dst[j + k].type = 'app';
        }
      }
    } catch (e) {}
  }

  var lastDataReceived;

  var onDataReceived = function(e, response) {
    // console.log('myPage.onDataReceived');
    e.preventDefault();

    if (!response.scope || !response.jsonObj) {
      onDraw(response);
      return;
    }

    var result = {
      scopeName: response.scope,
      menuList: [],
      itemList: [],
      filterList: []
    };

    lastDataReceived = response;

    if (response.jsonObj.appUpdateList) {
      if ($scope.selectedFilter !== '000100' && $scope.loginCheck() === true) {
        // 'sign-in'
        parseMyAppListSignIn(result.itemList, response.jsonObj.appUpdateList.appUpdateCheck);
      } else {
        // 'all'
        parseMyAppList(result.itemList, response.jsonObj.appUpdateList.appUpdateCheck);
      }
      result.total = parseInt(response.jsonObj.appUpdateList.appCount, 10);
    } else if(response.jsonObj.appInfo) {
      parseCpList(result.itemList, response.jsonObj.appInfo);
      result.total = parseInt(response.jsonObj.app_count, 10);
    } else {
      result.total = 0;
    }

    result.startIndex = 0;

    onDraw(result);
  };

  var onMenuChanged = function() {
    if ($scope.selectedMenu === '1') {
      // 'My Apps' menu가 선택된 경우.
      if ($scope.selectedFilter === '002') {
        lastItemMenuFocus = {};

        if (!($rootScope.guide && $rootScope.guide.isViewGuide)) {
          // guide가 보여진 경우 제외
          moveFocusToItem('btn-list-option', 'option', keyHandler.RIGHT);
        }

        // 'Sign-in' option이 선택된 경우.
        if ($scope.loginCheck()) {
          $scope.hideListContent = false;
        } else {
          // hide list contect
          // show sign-in div
          $scope.hideListContent = true;

          if (!($rootScope.guide && $rootScope.guide.isViewGuide)) {
            // guide가 보여진 경우 제외
            moveFocusFromMap($scope.focusItem, keyHandler.DOWN);
          }
        }
      } else {
        $scope.hideListContent = false;
      }
      document.getElementsByClassName('popup-list-option')[0].parentNode.classList.remove('popup-modal-list-option'); // 팝업창 외 포커스 방지 제거
    } else {
      $scope.hideListContent = false;
    }

    // [WOSLQEVENT-75188] quick start off/on 이후, timeout이후 login check를
    // 한번 더 하도록 수정
    $timeout(function() {
      var hideListContent2 = false;

      if ($scope.selectedMenu === '1') {
        // 'My Apps' menu가 선택된 경우.
        if ($scope.selectedFilter === '002') {
          if ($scope.loginCheck()) {
            hideListContent2 = false;
          } else {
            hideListContent2 = true;
          }
        } else {
          hideListContent2 = false;
        }
      } else {
        hideListContent2 = false;
      }

      if (hideListContent2 !== $scope.hideListContent) {
        $scope.hideListContent = hideListContent2;
        if($scope.hideListContent === true) {
          moveFocusFromMap($scope.focusItem, keyHandler.DOWN);
        }
        $scope.$apply();
      }
    }, 500);
  };

  var setMouseEvents = function() {
    arr = $element[0].getElementsByClassName('mypage-menu');
    l = arr.length;
    for (i = 0; i < l; i++) {
      $scope.setMouseEvent(arr[i]);
    }

    $scope.setMouseEvent($element[0].getElementsByClassName('updateall')[0]);
    $scope.setMouseEvent($element[0].getElementsByClassName('signin-button')[0]);

    arr = $element[0].getElementsByClassName('btn-list-option');
    if (arr.length > 0) {
      $scope.setMouseEvent(arr[0]);
    }

    arr = $element[0].getElementsByClassName('btn-update-all');
    if (arr.length > 0) {
      $scope.setMouseEvent(arr[0]);
    }
  };

  var onDraw = function(response) {
    // console.log('myPage.onDraw');
    var update;

    // reset drawed flag of each ctrls
    Object.keys(_ctrls).forEach(function(name) {
      _ctrls[name].drawed = false;
    });

    if ($scope.scopeName !== '' && $scope.scopeName !== response.scopeName) {
      // drawer에서 다른 menu가 선택되었을 때
      if (!$rootScope.spinner.hide)
        $rootScope.spinner.hideSpinner();
      return;
    }

    if (requestedAppends && response.startIndex === 0) {
      // scroll을 최하단으로 내렸을 때
      if (!$rootScope.spinner.hide)
        $rootScope.spinner.hideSpinner();
      return;
    }

    var append = updateFilter($scope.listData.filterList, response.total) && requestedAppends;

    if ($scope.listData.itemList) {
      if (append && response.startIndex > 0) {
        $scope.listData.itemList = $scope.listData.itemList.concat(response.itemList);
      } else {
        $scope.listData.itemList = response.itemList;
        lastItemFocus = {};
      }
      $scope.listData.total = response.total;
      $scope.listData.loaded = $scope.listData.itemList.length;
      $scope.listData.startIndex = response.startIndex;
      update = true;
    } else {
      $scope.listData.itemList = response.itemList;
      $scope.listData.startIndex = response.startIndex;
      $scope.scopeName = response.scopeName;
      $scope.listData.total = response.total;
      $scope.title = msgLang.myPage_title;
      $scope.updateall = msgLang.myPage_apps_002;

      $scope.signin_text = msgLang.myPage_apps_008;
      $scope.signin_btn = msgLang.myPage_apps_004;

      $rootScope.pageManager.setTitle($scope.title);
      update = false;
    }

    // 'Update All' 버튼의 활성화/비활성화를 위해
    onDataChanged();
    findSelectedMenu(response.menuList);
    onMenuChanged();

    $scope.$digest();

    setMouseEvents();

    if (!update) {
      $element[0].removeAttribute('ng-class');
    }

    Object.keys(_ctrls).forEach(function(name) {
      if (!_ctrls[name].active)
        return;
      _ctrls[name].scope.onDraw($scope.listData, update, requestedAppends);
    });

    requestedAppends = false;
  };

  var updateTitle2 = function(count, filterName) {
    if (count === undefined && $scope.listData) {
      count = $scope.listData.total;
    }

    if ($scope.selectedMenu !== '1') {
      // 'Recent History' subMenu
      // 'Purchase History' subMenu
      if (!count) {
        count = 0;
      }
      $scope.subtitle2 = count + ' ' + msgLang.myPage_apps_010;
      $scope.showLoginId = false;
    } else if ($scope.selectedFilter === '002') {
      // My Apps with 'sign-in' option
      if ($scope.loginCheck()) {
        $scope.showLoginId = true;
        $scope.subtitle_loginid = '(' + device.auth.userID + ')';
      } else {
        $scope.showLoginId = false;
      }

      $scope.subtitle2 = msgLang.myPage_apps_003;
    } else if (filterName) {
      $scope.subtitle2 = filterName;
      $scope.showLoginId = false;
    } else if ($scope.listData.filterList && ($scope.listData.filterList.length > 0)) {
      var obj = $scope.listData.filterList[0];
      if (obj.key == 'FILTER_FILTER') {
        for (k = 0; k < obj.values.length; k++) {
          if (obj.values[k].selected == 'TRUE') {
            if ($scope.selectedFilter === obj.values[k].code) {
              $scope.subtitle2 = obj.values[k].name;
              break;
            }
          }
        }
      }
    } else {
      $scope.subtitle2 = '';
    }

    if (!$scope.showLoginId) {
      $scope.subtitle_loginid = '';
    }
  };

  var updateFilter = function(filterList, count) {
    var i, k, obj, old;

    old = {};
    old.category = $scope.selectedFilter;

    $scope.selectedFilter = '';

    if (filterList) {
      i = filterList.length;
      if (i > 0) {
        obj = filterList[0];
        if (obj.key == 'FILTER_FILTER') {
          for (k = 0; k < obj.values.length; k++) {
            if (obj.values[k].selected == 'TRUE') {
              $scope.selectedFilter = obj.values[k].code;
              updateTitle2(count, obj.values[k].name);
              break;
            }
          }
        }
      }
    }

    return old.category == $scope.selectedFilter;
  };

  var findSelectedFilter = function(filterList) {
    var i, l, obj;
    var param = $rootScope.pageManager.peekHistory();
    if (param && param.filter) {
      // detail에 진입후, back이 눌린 경우
      $scope.selectedFilter = param.filter;
      $rootScope.pageManager.setParam('filter', undefined);

      if(!filterList) return;
      l = filterList[0].values.length;

      for (i = 0; i < l; i++) {
        obj = filterList[0].values[i];
        if (obj.code === $scope.selectedFilter)
          obj.selected = 'TRUE';
        else
          obj.selected = 'FALSE';
      }
    } else {
      if(!filterList) return;
      l = filterList[0].values.length;
      for (i = 0; i < l; i++) {
        obj = filterList[0].values[i];
        if (obj.selected == 'TRUE') {
          $scope.selectedFilter = obj.code;
          return;
        }
      }
    }
  };

  var findSelectedMenu = function(menuList) {
    var i, l, obj;
    if(!menuList) return;
    l = menuList.length;
    for (i = 0; i < l; i++) {
      obj = menuList[i];
      if (obj.selected == 'TRUE') {
        $scope.subtitle = $scope.getMenuName(obj.name);
        $scope.selectedMenu = obj.code;
        return;
      }
    }
  };

  var hideList = function(e, page) {
    e.preventDefault();
    if (page != $scope.scopeName) {
      if ($scope.direct === false && $scope.showing === false) {
        if (!page) {
          $scope.setDefaultFocus();
          $scope.direct = true;
          $element[0].classList.add('direct');
          $rootScope.breadcrumb.onPageFromDeepLink();
          //$scope.$apply();
          $timeout(function() {
            $scope.setShowAllImage(true);
          }, timeOutValue.SHOWING);
        } else {
          $scope.setDefaultFocus();
          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, undefined, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $scope.showing = true;
            $scope.setShowAllImage(true);
          });

          //$scope.$apply();
        }
      }
      return;
    }

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      // $timeout(function() {
        Object.keys(_ctrls).forEach(function(name) {
          if (!_ctrls[name].active)
            return;
          _ctrls[name].active = false;
          _ctrls[name].initialized = false;
          _ctrls[name].scope.onHide();
        });

        $element.remove();
        $scope.$destroy();
      // }, timeOutValue.DESTROYING);
    });
  };

  var getServiceType = function() {
    var serviceType;

    // 서버 에서 최신 기록 조회
    if ($scope.selectedMenu === '2_TS') {
      serviceType = 'RECENTTS';
    } else if ($scope.selectedMenu === '2_MOVIE') {
      serviceType = 'RECENTMOVIE';

    // Local 저장소에서 recent History 조회 (3d spec out)
    } else if ($scope.selectedMenu === '2_PREMIUM') {
      serviceType = storage.MYPAGE.RECENTHISTORYPREMIUM;
    } else {
      serviceType = storage.MYPAGE.RECENTHISTORYAPPNGAME;
    }

    return serviceType;
  };

  var requestMenu = function() {
    // console.log('myPage.requestMenu');
    var item, errorCode;
    var defaultFilter = '000100';
    if ($scope.selectedFilter === '') {
      $scope.selectedFilter = defaultFilter;
    }

    item = $element[0].getAttribute('item');
    if(item.length === 0) {
      item = '1';   // set default item
    }

    try {
      if(device.isOnline) {
        server.requestMyPageMenu(item, $scope.selectedFilter);
      }
    } catch (e) {
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      errorCode = "MYPage_submenudata failed_error"; // API error
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);
    }
  };

  var usbListUpdated = function(returnValue) {
    var s = $scope;
    var p =$rootScope.pageManager.getTitle();
    if(p === 'My Page' && $scope.selectedMenu === '1') {
      console.log(p + ':usbListUpdated : '+returnValue);
      _ctrls['myappList'].active = true;
      $scope.requestDataASync(false);
    }
  };

  var onMenuLoaded = function(e, response) {
    if (response) {
      if (response.filterList && response.filterList.length > 0) {
        var srcMenu = response.filterList[0].values;
        angular.forEach(srcMenu, function(value, index) {
          if (value.code === '000100') {
            value.name = msgLang.all;
          } else if (value.code === '002') {
            value.name = msgLang.myPage_apps_003;
          }
        });
      }
      if ($scope.listData) {
        $scope.listData.menuList = response.menuList;
        $scope.listData.filterList = response.filterList;
      } else {
        $scope.listData = response;
      }
    }

    for (var i = 0 ; i < $scope.listData.filterList.length ; i++) {
      $scope.listData.filterList[i].key = 'FILTER_FILTER';
    }

    findSelectedMenu($scope.listData.menuList);

    Object.keys(_ctrls).forEach(function(name) {
      _ctrls[name].active = false;
      _ctrls[name].initialized = false;
    });

    switch ($scope.selectedMenu) {
      case "1":
        // My Apps
        _ctrls['myappList'].active = true;
        break;
     case "2":
        _ctrls['cpList'].active = true;
        break;
    }

    if ($scope.selectedFilter === '002' && !$scope.loginCheck()) {
      // 로그인되지 않은 경우는, requestData를 호출할 필요없음.
      // show log-in button
      onMenuChanged();
      updateTitle2();
      $scope.$digest();

      setMouseEvents();
      return;
    }

    requestData(false);
  };

  $scope.requestDataASync = function(append) {
    util.async(function() {
      requestData(append);
    });
  };

  var requestData = function(append) {
    // console.log('myPage.requestData');
    var item, itemPrefix, payload, errorCode;

    requestedAppends = append;

    findSelectedFilter($scope.listData.filterList);
    findSelectedMenu($scope.listData.menuList);
    $rootScope.spinner.showSpinner();

    if ($scope.selectedMenu == '1' && window.PalmSystem) {
      tvInstalledList.getList(tvInstalledListcallback);
    } else {
      tvInstalledListcallback();
    }
  };

  var tvInstalledListcallback = function(appinfo) {
    var params, inPayLoad = null;
    if (!device.isTv) {
      appinfo = 'com.webos.app.today,1.0.0;com.webos.app.livetv,1.0.0;com.webos.app.tvguide,1.0.0;com.webos.app.browser,2.0.0;com.webos.app.tvuserguide,1.0.1;com.webos.app.connectionwizard,1.0.0;com.webos.app.smartshare,1.0.0;com.webos.app.scheduler,1.0.0;com.webos.app.miracast,1.0.0;com.webos.app.capturetv,1.0.0;com.webos.app.camera,1.0.0;com.webos.app.discovery,1.0.35;com.webos.app.notificationcenter,1.0.0;com.palm.app.settings,4.0.1;com.lge.app.viewster,1.0.0;com.palm.app.enyo2sampler,2.5.4-pre.2;com.webos.app.erossampler,1.0.0;com.webos.app.adapp,1.0.0;com.webos.app.brandshop,1.0.2;com.webos.app.facebooklogin,1.1.3;com.webos.app.membership,1.2.0;com.palm.app.bugreport,1.3.0;com.palm.app.firstuse,4.0.0;com.webos.app.acrcard,1.0.7;com.webos.app.acrcomponent,1.0.7;com.webos.app.acrhdmi1,1.0.7;com.webos.app.acrhdmi2,1.0.7;com.webos.app.acrhdmi3,1.0.7;com.webos.app.acrhdmi4,1.0.7;com.webos.app.acroverlay,1.0.7;com.webos.app.cameragallery,1.0.0;com.webos.app.channeledit,1.5.0;com.webos.app.channelsetting,1.0.0;com.webos.app.cheeringtv,1.0.13;com.webos.app.container,1.13.1;com.webos.app.customersupport,0.0.1;com.webos.app.dvrpopup,1.0.0;com.webos.app.externalinput.av1,1.0.0;com.webos.app.externalinput.av2,1.0.0;com.webos.app.externalinput.component,1.0.0;com.webos.app.externalinput.scart,1.0.0;com.webos.app.hdmi1,1.0.0;com.webos.app.hdmi2,1.0.0;com.webos.app.hdmi3,1.0.0;com.webos.app.hdmi4,1.0.0;com.webos.app.inputcommon,1.0.0;com.webos.app.inputmgr,1.5.0;com.webos.app.installation,1.0.0;com.webos.app.livemenuplayer-inav1,1.0.0;com.webos.app.livemenuplayer-inav2,1.0.0;com.webos.app.livemenuplayer-incomponent,1.0.0;com.webos.app.livemenuplayer-inhdmi1,1.0.0;com.webos.app.livemenuplayer-inhdmi2,1.0.0;com.webos.app.livemenuplayer-inhdmi3,1.0.0;com.webos.app.livemenuplayer-inhdmi4,1.0.0;com.webos.app.livemenuplayer-inscart,1.0.0;com.webos.app.livemenuplayer-intv,1.0.0;com.webos.app.livezoom-inhdmi1,1.0.0;com.webos.app.livezoom-inhdmi2,1.0.0;com.webos.app.livezoom-inhdmi3,1.0.0;com.webos.app.livezoom-inhdmi4,1.0.0;com.webos.app.livezoom-intv,1.0.0;com.webos.app.mvpdwin,1.0.2;com.webos.app.remotesetting,1.0.0;com.webos.app.screensaver,1.0.0;com.webos.app.softwareupdate,1.3.0;com.webos.app.store-demo,1.0.0;com.webos.app.tvhotkey,1.0.0;com.webos.app.tvsimpleviewer,1.0.0;com.webos.app.tvtutorial,1.0.0;com.webos.app.voice,1.0.0;com.webos.app.webapphost,1.0.0;naver,1.7.2;';
    }
    if (appinfo) {
      if (!device.auth.userID || !device.auth.loginSession) {
        // [WOSLQEVENT-113531] [Service.SDPService.LGStore_Apps & Games/Premium] [Always] [Major] 무한로딩 발생
        // sign in in membership -> myPage -> sign in option -> go to item detail -> switch to membership app and sign out -> back go LGStore -> back to my page
        console.log('myPage.tvInstalledListcallback, userID or loginSession is empty');

        // httpHeader에서 callback이 아직 호출되지 않아 비어있는 경우.
        // login status changed callback을 기다리도록
        pmLog.write(pmLog.LOGKEY.SECOND_MENU_CLICK, {
          menu_name : pmLog.TYPE.MYPAGE,
          message : 'In tvInstalledListcallback, userID or loginSession is empty'
        });

        // All option으로 server 호출 진행
        $scope.selectedFilter = '000100';
      }

      if ($scope.selectedFilter !== '000100') {
        inPayLoad = {
          app_info : appinfo,
          type : 'signin'
        };
      } else {
        inPayLoad = {
          app_info : appinfo,
          type : 'all'
        };
      }
    }

    if($scope.selectedMenu == '1') {
      // My Apps
      try {
        if (!device.isLocalJSON) {
          // server data 용
          params = {
            api : '/discovery/mypage/myapps',
            method : 'post',
            apiAppStoreVersion : 'v7.0',
            payload : inPayLoad
          };
          server.requestApi(eventKey.MYPAGE_LOADED, params, (isFirst ? destroyInfo : {}));
        } else {
          // local json 용
          server.requestMyPage(item, inPayLoad);
        }
      } catch (e) {
        $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
        errorCode = "Mypage.400"; // API error
        $rootScope.pageManager.movePageError(errorCode, $scope, $element);
      }
    } else if($scope.selectedMenu == '2') {
      // My Apps
      try {
        if (!device.isLocalJSON) {
          // server data 용
          params = {
            api : '/discovery2016/cp-list',
            method : 'post',
            apiAppStoreVersion : 'v7.0',
            payload : inPayLoad
          };
          server.requestApi(eventKey.MYPAGE_LOADED, params, (isFirst ? destroyInfo : {}));
        } else {
          // local json 용
          server.requestCpList('CP');
        }
      } catch (e) {
        $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
        errorCode = "Mypage.401"; // API error
        $rootScope.pageManager.movePageError(errorCode, $scope, $element);
      }
    }
  };

  var isScrollDisplayed = function() {
    var arr = $element[0].getElementsByClassName('scroll-prev');
    if ((arr.length > 0) && (arr[0].style.display !== 'none'))
      return true;
    else
      return false;
  };

  $scope.setDefaultFocusItemClass = function(className) {
    if ($scope.selectedFilter === '002' && !$scope.loginCheck()) {
      $scope.defaultFocusItemClass = 'signin-button';
    } else {
      $scope.defaultFocusItemClass = className;
    }
  };

  $scope.setDefaultFocus = function() {
    // console.log('myPage.setDefaultFocus begin');

    //가이드 화면에서 langChange 시 myPage로 포커스 이동 방지
    // luna-send -n 1 luna://com.webos.applicationManager/launch '{"id":"com.webos.app.discovery","caller_id":"com.webos.surfacemanager","automatic_by_mm":"false","automatic_by_user":"false","check_update":"true","launch_hidden":"false","preload_mode":"empty","keep_alive":"false","show_splash":"true","params":{"query":"category/MYPAGE"}}'
    // when first launch with query "category/MYPAGE", there is no focusManager.getCurrent().scope !!!
    if (focusManager && focusManager.getCurrent() && focusManager.getCurrent().scope &&
      focusManager.getCurrent().scope.butAct1 &&
      focusManager.getCurrent().scope.butAct1 === 'langChange' &&
      focusManager.getCurrent().target &&
      focusManager.getCurrent().target === 'btn01')
      return;

    if ($rootScope.guide && $rootScope.guide.isViewGuide) {
      // WOSLQEVENT-113537
      // [Service.SDPService.LGStore_My Page] [Always] [Minor] OK 버튼에 Focus 사라지거나, OK 버튼 선택시 아무 동작 없음
      return;
    }

    var itemClass, target, item;

    if (focusManager.getState('option') === true)
      return;

    if ($scope.defaultFocusItemClass) {
      itemClass = $scope.defaultFocusItemClass;
      $scope.defaultFocusItemClass = '';
    } else {
      itemClass = listItemTypeClass();
    }

    // menu click시 해당 메뉴에 포커스
    if (isFirst || itemClass === 'item-apps') {
      target = $element[0].getElementsByClassName(itemClass)[0];
      isFirst = false;
    } else {
      target = $element[0].getElementsByClassName('on')[0];
    }

    if (target) {
      item = target.getAttribute('item');
      $scope.setFocusItem(item, target);
      marquee.setTarget(target.getElementsByClassName('marquee')[0]);
      focusManager.setCurrent($scope, item);
    } else {
      marquee.setTarget(null);
      // target이 없는 경우, 기존 포커스 유지
      //focusManager.setCurrent($scope, '');
      $scope.focusToMenu({x: 0, y: 0, width: 0, height: 0});
    }
    // console.log('myPage.setDefaultFocus end');
  };

  $scope.removeFocus = function() {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
    }
  };

  $scope.moveFocusByKey = function(keyCode, isPageUpDownByChKey) {
    var name, element, hidden, scrollY, result, keys, key, i;

    if (!$scope.focusItem) {
      if (util.isAWSServer()) {
        device.isFocusItem = false;
      }
      if (!lastFocus.item || !lastFocus.element) {
        // my page에 진입하자마자 (list가 비어있는 경우)
        $scope.focusToMenu({x: 0, y: 0, width: 0, height: 0});
      } else {
        $scope.setFocusItem(lastFocus.item, lastFocus.element);
      }
      return;
    }

    if (moveFocusFromMap($scope.focusItem, keyCode)) {
      return;
    }

    if ($scope.focusItem && $scope.focusItem.indexOf('item') !== 0) {
      switch ($scope.focusItem) {
        case 'back':
          moveFocusFromBack(keyCode);
          break;
        case 'btn-update-all':
        case 'btn-list-option':
          if (!moveFocusFromOption(keyCode) && (keyCode === keyHandler.DOWN)) {
            keys = Object.keys(_ctrls);
            for (i = 0 ; i < keys.length ; i++) {
              key = keys[i];
              if (!_ctrls[key].active)
                continue;

              _ctrls[key].scope.focusFromScroll('prev', true, lastItemFocus);
              break;
            }
          }
          break;
        default:
          moveFocusFromMenu(keyCode);
      }
      return;
    }

    if (util.isAWSServer()) {
      if (!focusElement) {
        $scope.recoverFocus();
        return;
      }
    }

    keys = Object.keys(_ctrls);
    for (i = 0 ; i < keys.length ; i++) {
      key = keys[i];
      if (!_ctrls[key].active)
        continue;

      result = _ctrls[key].scope.moveFocusByKey(focusElement,
        $scope.focusItem,
        keyCode, isPageUpDownByChKey);
      if (result === true) {
        return;
      }
    }
  };

  var pageUpDownByChKey = function(e, keyCode) {
    e.preventDefault();
    if (keyCode === keyHandler.CH_DOWN) keyCode = keyHandler.DOWN;
    if (keyCode === keyHandler.CH_UP) keyCode = keyHandler.UP;
    var isPageUpDownByChKey = {};
    isPageUpDownByChKey.index = 0;
    isPageUpDownByChKey.isFrom = true;
    for (var i=0; i<4; i++) {
      isPageUpDownByChKey.index = i;
      $scope.moveFocusByKey(keyCode, isPageUpDownByChKey);
    }
  };

  var moveFocusFromBack = function(keyCode) {
    var element, arr;

    switch (keyCode) {
      case keyHandler.UP:
        $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
        break;
      case keyHandler.LEFT:
        $scope.executeAction();
        break;
      case keyHandler.RIGHT:
        $scope.focusToMenu({x: 0, y: 0, width: 0, height: 0});
        break;
      case keyHandler.DOWN:
        $scope.focusToMenu({x: 0, y: 0, width: 0, height: 0});
        break;
    }
  };

  var moveFocusFromOption = function(keyCode) {
    var element, moved = false;

    switch (keyCode) {
      case keyHandler.LEFT:
        $rootScope.$broadcast('focus', 'breadcrumbs', function() {
          // right button이 섵택되었을 때 실행될 callback
          moveFocusFromBack(keyHandler.RIGHT);
        });
        moved = true;
        break;
      case keyHandler.UP:
        $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 1840, y: 0, width: 0, height: 0});
        moved = true;
        break;
      case keyHandler.DOWN:
        if (isScrollDisplayed()) {
          $scope.$broadcast('focus', 'scroll', keyCode, {x: 0, y: 0, width: 0, height: 0});
          moved = true;
        }
        break;
    }
    return moved;
  };

  var moveFocusToItem = function(className, item, keyCode) {
    var element;

    if (item === 'drawer') {
      $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 1840, y: 0, width: 0, height: 0});
    } else if (item === 'content') {
      var keys = Object.keys(_ctrls);
      for (var i = 0 ; i < keys.length ; i++) {
        var key = keys[i];
        if (!_ctrls[key].active)
          continue;

        if (!lastItemFocus.item && !isListEmpty()) {
          // WOSLQEVENT-113538, WOSLQEVENT-113537
          // guide가 뜬 상태에서, sign in status가 변경되면, menu와 list item이 새로 그려진다.
          var itemClass, target;

          if ($scope.defaultFocusItemClass) {
            itemClass = $scope.defaultFocusItemClass;
          } else {
            itemClass = listItemTypeClass();
          }

          target = $element[0].getElementsByClassName(itemClass)[0];
          if (target) {
            lastItemFocus = {
              item: target.getAttribute('item'),
              element: target,
              isFrom: true
            };
          }
        }

        _ctrls[key].scope.focusFromScroll('prev', true, lastItemFocus);
        break;
      }
    } else if (item === 'menu') {
      $scope.focusToMenu({x: 0, y: 0, width: 0, height: 0});
    } else {
      element = $element[0].getElementsByClassName(className)[0];
      if (focusManager.getCurrent().target === 'updateall' || focusManager.getCurrent().target === 'option') {
        element = $element[0].querySelector('[item="'+item+'"]'); // menu or contents
      }
      $scope.setFocusItem(item, element);
    }

    return true;
  };

  var moveFocusFromMap = function(currentItem, keyCode) {
    var i;

    var focusMap = [
    {
      'from': 'option',
      'to': {
        'left': {'valid': $scope.hideListContent, 'class': 'signin-button', 'item': 'signin'},
        'down': {'valid': $scope.hideListContent, 'class': 'signin-button', 'item': 'signin'}
      }
    }, {
      'from': 'option',
      'to': {
        'left': {
          'valid': $scope.isUpdateAvailable && !$scope.isUpdating() && !$scope.hideListContent,
          'class': 'btn-update-all',
          'item': 'updateall'
        },
        'up': {'item': 'drawer'},
        'down': {'valid': !isListEmpty() && !$scope.hideListContent, 'item': 'content'},
        'right': {'class': 'btn-list-option', 'item': 'option'}
      }
    }, {
      'from': 'signin',
      'to': {
        'left': {'valid': $scope.hideListContent, 'item': 'menu'},
        'up': {'class': 'btn-list-option', 'item': 'option'},
        'right': {'class': 'btn-list-option', 'item': 'option'}
      }
    }, {
      'from': 'option',
      'to': {
        'left': {'valid': isListEmpty(), 'item': 'menu'},
        'down': {'valid': isListEmpty(), 'item': 'menu'}
      }
    }, {
      'from': 'option',
      'to': {
        'left': {'valid': !$scope.isUpdateAvailable || $scope.isUpdating(),'item': 'content'}
      }
    }, {
      'from': 'updateall',
      'to': {
        'left': {'valid': isListEmpty(), 'item': 'menu'},
        'right': {'class': 'btn-list-option', 'item': 'option'},
        'up': {'item': 'drawer'},
        'down': {
          'valid': $scope.hideListContent,
          'class': 'signin-button',
          'item': 'signin'
        }
      }
    }, {
      'from': 'updateall',
      'to': {
        'left': {'valid': !isListEmpty(), 'item': 'content'},
        'down': {'item': 'content'}
      }
    }, {
      'from': '1',
      'to': {
        'right': {'valid': $scope.hideListContent, 'class': 'signin-button', 'item': 'signin'}
      }
    }, {
      'from': '2',
      'to': {'right': {'valid': $scope.hideListContent, 'class': 'signin-button', 'item': 'signin'}
      }
    }, {
      'from': '3',
      'to': {
        'right': {'valid': $scope.hideListContent, 'class': 'signin-button', 'item': 'signin'}
      }
    }, {
      'from': '4',
      'to': {
        'right': {'valid': $scope.hideListContent, 'class': 'signin-button', 'item': 'signin'}
      }
    }, {
      'from': '1',
      'to': {
        'up': {
          'valid': $scope.isUpdateAvailable && !$scope.isUpdating() && $scope.selectedMenu === '1' && !$scope.hideListContent,
          'class': 'btn-update-all',
          'item': 'updateall'
        },
        'right': {'valid': !isListEmpty(), 'item': 'content'}
      }
    }, {
      'from': '2',
      'to': {'right': {'valid': !isListEmpty() && !$scope.hideListContent, 'item': 'content'}
      }
    }, {
      'from': '3',
      'to': {'right': {'valid': !isListEmpty(),'item': 'content'}
      }
    }, {
      'from': '4',
      'to': {'right': {'valid': !isListEmpty(),'item': 'content'}
      }
    }, {
      'from': '1',
      'to': {
        'up': {
          'valid': (!$scope.isUpdateAvailable || $scope.isUpdating()) && $scope.selectedMenu === '1',
          'class': 'btn-list-option',
          'item': 'option'
        },
        'right': {'valid': isListEmpty(), 'class': 'btn-list-option', 'item': 'option'}
      }
    }, {
      'from': '2',
      'to': {
        'right': {'valid': isListEmpty(), 'class': 'btn-list-option', 'item': 'option'}
      }
    }, {
      'from': '3',
      'to': {
        'right': {'valid': isListEmpty(), 'class': 'btn-list-option', 'item': 'option'}
      }
    }, {
      'from': '4',
      'to': {
        'right': {'valid': isListEmpty(), 'class': 'btn-list-option', 'item': 'option'}
      }
    }];

    for (i = 0; i < focusMap.length; i++) {
      if (focusMap[i].from === currentItem) {
        switch (keyCode) {
          case keyHandler.LEFT:
            if (focusMap[i].to.left &&
              (focusMap[i].to.left.valid === undefined ||
              (focusMap[i].to.left.valid !== undefined && focusMap[i].to.left.valid))) {
              if (moveFocusToItem(focusMap[i].to.left.class, focusMap[i].to.left.item, keyCode)) {
                console.log('myPage.moveFocusFromMap return true, focusMap=' + JSON.stringify(focusMap[i].to));
                return true;
              }
            }
            break;
          case keyHandler.RIGHT:
            if (focusMap[i].to.right &&
              (focusMap[i].to.right.valid === undefined ||
              (focusMap[i].to.right.valid !== undefined && focusMap[i].to.right.valid))) {
              if (moveFocusToItem(focusMap[i].to.right.class, focusMap[i].to.right.item, keyCode)) {
                // console.log('myPage.moveFocusFromMap return true, focusMap=' + JSON.stringify(focusMap[i].to));
                return true;
              }
            }
            break;
          case keyHandler.UP:
            if (focusMap[i].to.up &&
              (focusMap[i].to.up.valid === undefined ||
              (focusMap[i].to.up.valid !== undefined && focusMap[i].to.up.valid))) {
              if (focusMap[i].to.up.item === 'updateall' || focusMap[i].to.up.item === 'option') {
                // menu or contents
                lastItemMenuFocus.item = currentItem;
                lastItemMenuFocus.element = $element[0].querySelector('[item="'+currentItem+'"]');
                lastItemMenuFocus.isFrom = true;
              }
              if (moveFocusToItem(focusMap[i].to.up.class, focusMap[i].to.up.item, keyCode)) {
                // console.log('myPage.moveFocusFromMap return true, focusMap=' + JSON.stringify(focusMap[i].to));
                return true;
              }
            }
            break;
          case keyHandler.DOWN:
            if (focusMap[i].to.down &&
              (focusMap[i].to.down.valid === undefined ||
              (focusMap[i].to.down.valid !== undefined && focusMap[i].to.down.valid))) {
              if (focusManager.getCurrent().target === 'updateall' || focusManager.getCurrent().target === 'option') {
                // menu or contents
                if (lastItemMenuFocus.isFrom) {
                  moveFocusToItem(focusMap[i].to.down.class, lastItemMenuFocus.item, keyCode);
                  return true;
                }
              }
              if (moveFocusToItem(focusMap[i].to.down.class, focusMap[i].to.down.item, keyCode)) {
                // console.log('myPage.moveFocusFromMap return true, focusMap=' + JSON.stringify(focusMap[i].to));
                return true;
              }
            }
            break;
        }
      }
    }
    return false;
  };

  var moveFocusFromMenu = function(keyCode) {
    var i, j, l, arr, index, element;

    switch (keyCode) {
      case keyHandler.LEFT:
        $rootScope.$broadcast('focus', 'breadcrumbs', function() {
          // right button이 섵택되었을 때 실행될 callback
          moveFocusFromBack(keyHandler.RIGHT);
        });
        break;
      case keyHandler.UP:
        arr = $element[0].getElementsByClassName('mypage-menu');
        l = arr.length;
        for (i = 0; i < l; i++) {
          if (arr[i].getAttribute('item') == $scope.focusItem) {
            index = i;
            break;
          }
        }
        if (index === undefined)
          return;
        if (index === 0) {
          if ($scope.selectedMenu === '1') {    // my apps인 경우
            arr = $element[0].getElementsByClassName('btn-list-option');
            if (arr.length > 0) {
              $scope.setFocusItem('option', arr[0]);
            } else {
              arr = $element[0].getElementsByClassName('btn-update-all');
              if (arr.length > 0) {
                $scope.setFocusItem('updateall', arr[0]);
              }
            }
          } else {  // default contents app 인 경우
            $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 1840, y: 0, width: 0, height: 0});
          }
        } else {
          j = 0;
          element = '';
          while(element === '') {
            j++;
            element = arr[index - j];
            if(element.classList[2] && element.classList[2] == 'ng-hide') {
              element = '';
            } else {
              break;
            }
          }
          $scope.setFocusItem(element.getAttribute('item'), element);
        }
        break;
      case keyHandler.RIGHT:
        if (isListEmpty()) {
          $scope.focusToHeader();
        } else {
          // list로 focus 이동
          var keys = Object.keys(_ctrls);
          for (i = 0 ; i < keys.length ; i++) {
            var key = keys[i];
            if (!_ctrls[key].active)
              continue;

            _ctrls[key].scope.focusFromScroll('prev', true, lastItemFocus);
            break;
          }
        }

        break;
      case keyHandler.DOWN:
        arr = $element[0].getElementsByClassName('mypage-menu');
        l = arr.length;
        for (i = 0; i < l; i++) {
          if (arr[i].getAttribute('item') == $scope.focusItem) {
            index = i;
            break;
          }
        }
        if (index < l - 1) {
          j = 0;
          element = '';
          while(element === '') {
            j++;
            element = arr[index + j];
            if(element.classList[2] && element.classList[2] == 'ng-hide') {
              element = '';
            } else {
              break;
            }
          }
          $scope.setFocusItem(element.getAttribute('item'), element);
        }
        break;
    }
  };

  $scope.focusToBack = function() {
    $rootScope.$broadcast('focus', 'breadcrumbs', function() {
      // right button이 섵택되었을 때 실행될 callback
      moveFocusFromBack(keyHandler.RIGHT);
    });
  };

  $scope.focusToHeader = function(rect, keyCode) {
    // default contents app인 경우
    // UP : 상단 header가 없으므로 menu로 가야한다.
    // Down : 하단 list 혹은 menu로 가야한다.
    if($scope.selectedMenu === "2") {
      if(keyCode === keyHandler.UP) {
        moveFocusToItem('', 'drawer', keyHandler.UP);
      } else {
        $scope.moveFocusByKey(keyHandler.DOWN);
      }
    } else {
      var arr;

      if (focusManager.getCurrent().target === 'prev') lastItemFocus.isFrom = false;
      if (focusManager.getCurrent().target === 'next') {
        _ctrls['myappList'].scope.focusFromScroll('prev', true, lastItemFocus);
        return;
      }

      if (focusManager.getCurrent().target.indexOf('item') > -1) {
        // menu or contents
        lastItemMenuFocus.isFrom = false; // contents -> option
      }

      if ($scope.isUpdateAvailable && !$scope.hideListContent && !$scope.isUpdating()) {    // disabled 상태와 똑같은 조건이어야 함
        arr = $element[0].getElementsByClassName('btn-update-all');
        $scope.setFocusItem('updateall', arr[0]);
      } else {
        arr = $element[0].getElementsByClassName('btn-list-option');
        $scope.setFocusItem('option', arr[0]);
      }
    }
  };

  $scope.focusToMenu = function(rect) {
    var element;
    if (lastItemMenuFocus && lastItemMenuFocus.element && lastItemMenuFocus.item !== 'signin' && lastItemMenuFocus.element.baseURI) {
      element = lastItemMenuFocus.element;
    } else {
      var i, l, arr;

      arr = $element[0].getElementsByClassName('on');
      l = arr.length;
      element = arr[l - 1];
      for (i = 0; i < l; i++) {
        if (rect.y < arr[i].offsetTop + arr[i].clientHeight - 140) {
          element = arr[i];
          break;
        }
      }
    }

    $scope.setFocusItem(element.getAttribute('item'), element);
  };

  var focusHandler = function(e, target, keyCode, rect) {
    if (target != 'main') return;
    e.preventDefault();

    if ((keyCode === keyHandler.RIGHT) && rect && (rect.left <= 0)) {
      // from breadcrumbs
      moveFocusFromBack(keyCode);
      return;
    }

    $scope.focusToHeader(rect, keyCode);
  };

  // popup 관리는 나중에 통합하여야 함.
  var closePopup = function() {
    $rootScope.popupApp.hidePopup();
  };

  var callLogInPageFromPopup = function() {
    $rootScope.popupApp.hidePopup();
    var requestParam = {query: 'requestLogin'};
    membership.callMembershipPage(requestParam);
  };

  var callMemberShipFromPopup = function() {
    var requestParam;

    $rootScope.popupApp.hidePopup();
    requestParam = {query: 'requestPersonalInfo'};
    membership.callMembershipPage(requestParam);
  };

  var updateAppFromPopup = function() {
    $rootScope.popupApp.hidePopup();
    appUpdateAct();
  };

  var getAppsFromListBySplit = function(itemList, splitType) {
    var i, apps = [], inUpdateSplit = false;
    for (i = 0 ; i < itemList.length ; i++) {
      var item = itemList[i];
      if (item.type === 'split' && item.splitType === splitType) {
        inUpdateSplit = true;
        continue;
      } else if (item.type === 'split' && inUpdateSplit) {
        // end of 'update' split, no more
        break;
      }

      if (inUpdateSplit) {
        apps.push(item);
      }
    }

    return apps;
  };

  var getAppsToUpdate = function(itemList) {
    return getAppsFromListBySplit(itemList, 'myPage_waiting_update');
  };

  var getAppsToUpdateOtherId = function(itemList) {
    return getAppsFromListBySplit(itemList, 'myPage_waiting_otherid');
  };

  /* 무료 앱인지 체크 */
  var isFreeAppCheck = function(app) {
    if (app.updateYN && app.bFree) {
      return true;
    }

    if ((app.event === 'Y' && parseInt(app.eventPrice) === 0) || (parseInt(app.price) === 0)) {
      // 이벤트이면서 이벤트 가격이 0원이면 무료
      return true;
    } else {
      // 유료앱
      return false;
    }
  };

  /**
   * 앱 업데이트 실행
   */
  var appUpdateAct = function() {
    // TODO: appNgames와 공통화 시켜야 함
    var i, app, apps, more, install, notAvailable, requestParam;

    apps = getAppsToUpdate($scope.listData.itemList);
    notAvailable = false;
    more = false;

    for (i = 0 ; i < apps.length ; i++) {
      app = apps[i];

      install = false;

      if (!app.bSvcAvailable) {
        // Seller lounge 에서 삭제 및 비전시 된 앱
        notAvailable = true;
        continue;
      }

      if (app.bPurchased === true || app.bPremium === true || app.isStub === true) {
        /* 구매 했거나, 프리미엄앱이거나, stub앱인 경우 */
        install = true;
      } else if (isFreeAppCheck(app)) {
        // UX_2016_webOS_Initial_LG Content Store_v1.2.0_150605.pdf: page 38
        // 프리미엄, 무료 앱 : 로그인 없이 가능
        install = true;
      }

      if (install) {
        setAppInstallStatus(app.id, true);

        // 각 app의 install target부터 확인하고, callback에서 update 실행
        requestParam = {
          id: app.id,
          callbackEvent: 'installAndUpdateChecked2'
        };
        getAppInfo.call(requestParam);
      } else {
        /* 구매 하지 않고 프리미엄앱도 아니고 stub앱도 아닌경우 */
        more = true;
      }
    }

    if (apps.length > 0) {
      // update all 버튼 처리
      $scope.$digest();
    }

    if (more) {
      /*  구매 하지 않고 프리미엄앱도 아니고 stub앱도 아닌경우 */
      if (!$scope.loginCheck()) {
        requestParam = {query: 'requestLogin'};
        membership.callMembershipPage(requestParam);
      } else {
        /* 구매한앱 아니라고 팝업 보여준다. */
        requestParam = {
          type: 'popup',
          popupTitle: msgLang.apps_install_10,
          popupBut1: msgLang.no,
          popupBut2: msgLang.yes,
          popupButAct1 : 'closeAppPopup',
          popupButAct2: 'callMemberShipFromPopup',  //멤버쉽 관리로 이동(로그인 화면 아님.)
          popupDesc: msgLang.apps_popup_update_01_2
        };
        $rootScope.popupApp.showPopup($scope, requestParam);
      }
    } else if (notAvailable && (apps.length === 1)) {
      // Seller lounge 에서 삭제 및 비전시 된 앱만 있는 경우,
      // getAppInfo.call를 호출하지 않았기 때문에 여기서 popup 보여주도록

      // update all 버튼을 다시 활성화
      resetUpdateAllButon(true);
    }
  };
  // popup 관리는 나중에 통합하여야 함.

  var installAndUpdateCheck = function(e, response) {
    var deviceId, driveId, folderPath, usbInfo, installedTarget, requestParam;
    try {
      if(!response.returnValue || !response.appInfo) {
        console.error('myPage.installAndUpdateCheck, invalid return value');
        // // update all 버튼을 다시 활성화
        resetUpdateAllButon();
        return;
      }

      /* 설치된 경로 셋팅  */
      folderPath = response.appInfo.folderPath;
      for(var i = 0; app.usbListData && (i < app.usbListData.length); i++) {
        usbInfo = app.usbListData[i];
        if(folderPath.indexOf(usbInfo.deviceUri) == 0) {
          deviceId  = usbInfo.deviceId;
          driveId   = usbInfo.subDevices[0].deviceId;
          break;
        }
      }
      installedTarget = {};
      if(deviceId === undefined) {
        installedTarget.deviceId  = 'INTERNAL_STORAGE';
      } else {
        installedTarget.deviceId= deviceId;
        installedTarget.driveId = driveId;
      }

      requestParam = {'id': response.appInfo.id,
        'subscribe': false,
        'silence': false,
        'target': installedTarget,
        'callbackEvent': 'appInstallResult'};
      appInstall.call(requestParam);
    } catch(e) {
      console.error('myPage.installAndUpdateCheck, exception=' + e);

      var errorCode = 'installAndUpdateCheck';
      console.log("## ERROR CODE : " +  errorCode);
      if ($scope.spinner && device.currentPage === 'myPage') {//버튼설정이 안되있고 앱 상세페이지라면 popup
        requestParam = {
          type: 'error',
          popupTitle: msgLang.alert_adult_3_2,
          errorMsg: msgLang.alert_adult_3_5,
          errorCodeMsg: 'ERROR CODE: '+errorCode
        };
        $rootScope.popupApp.showPopup($scope, requestParam);
      }

      // update all 버튼을 다시 활성화
      resetUpdateAllButon();
    }
  };

  var appInstallStatusUpdate = function(e, response) {
    console.log('myPage.appInstallStatusUpdate, response=' + JSON.stringify(response));
    var installResult, requestParam, i;
    installResult = response;
    if( installResult.returnValue === true ) {
      /*  설치 요청 성공, 프로그래스바, act 버튼 변경 */
      // onAppUpdated에서 처리 (appInstallStatusUpdate에서는 appId를 알 수 없음.)
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
        $rootScope.popupApp.showPopup($scope, requestParam);
        tmpStr = null;
        setAppInstallStatus(appId, false);
      } else if( installResult.errorCode === -17 ) {
        console.log('현재 설치 중인 패키지앱이다.(중복 요청 무시)');
      } else if( installResult.errorCode === -3 ) {
        // [WOSLQEVENT-38383] updateAll 버튼을 다시 활성화
        // usb 용량 부족 에러 발생
        //
        // 위 에러 발생시, 로그 샘플
        // user.err appinstalld [] AppInstallD TASK_ERROR {"app_id":"com.3827031.168353.2",
        // "error_code":-3,"error_text":"There is no available space to install App"}
        appsInstallingUpdate.length = 0;
        $scope.$digest();
      } else {
        //TODO :
        // if ($scope.usePackageApp) loggingApi.log({installFail:"luna://com.webos.appInstallService/group/install",
        // installResult:installResult, detailAppData:$scope.detailAppData, pageParams:self.pageParams});
        // toast.call({msg:msgLang.apps_install_14_3+'<br />'+msgLang.apps_install_14_4});

        setAppInstallStatus(appId, false);
      }
    }
  };

  var appStatusChangeUpdate = function(e, response) {
    try {
      if (!response)
        return;

      switch(response.statusValue) {
        case 24:  //  install failed
        case 23:  //  download failed (다운로드 실패시 버튼 갱신)
          // [WOSLQEVENT-38383] updateAll 버튼을 다시 활성화
          // usb 용량 부족 에러 발생
          //
          // user.warning appinstalld [] AppInstallD STATUS_UNKNOWN {"status":23} prepareCurrentStatus failed

          // if (response.id) {
          //   setAppInstallStatus(response.id, false);
          // } else {
          //  appsInstallingUpdate.length = 0;
          // }
          //$scope.$digest();

          // update all 버튼을 다시 활성화
          resetUpdateAllButon();
          break;
      }
    } catch(e) {
    }
  };

  var onAppUpdated = function(e, appId) {
    if (!lastDataReceived)
      return;

    var result = {
      scopeName: lastDataReceived.scope,
      menuList: [],
      itemList: [],
      filterList: []
    };

    for (var i = 0 ; i < lastDataReceived.jsonObj.appUpdateList.appUpdateCheck.length ; i++) {
      if (lastDataReceived.jsonObj.appUpdateList.appUpdateCheck[i].id === appId) {
        lastDataReceived.jsonObj.appUpdateList.appUpdateCheck[i].updateYN = 'N';
        break;
      }
    }

    if ($scope.selectedFilter !== '000100' && $scope.loginCheck() === true) {
      // 'sign-in'
      parseMyAppListSignIn(result.itemList, lastDataReceived.jsonObj.appUpdateList.appUpdateCheck);
    } else {
      // 'all'
      parseMyAppList(result.itemList, lastDataReceived.jsonObj.appUpdateList.appUpdateCheck);
    }

    result.total = parseInt(lastDataReceived.jsonObj.appUpdateList.appCount, 10);
    result.startIndex = 0;

    setAppInstallStatus(appId, false);

    onDraw(result);
  };

  $scope.onInitialized = function(name, scope) {
    console.log('myPage.onInitialized, name=' + name);
    _ctrls[name].scope = scope;
    _ctrls[name].active = true;
    _ctrls[name].initialized = true;
    _ctrls[name].drawed = false;

    var allFinished = true;
    Object.keys(_ctrls).forEach(function(name) {
      if (!_ctrls[name].active)
        return;
      if (_ctrls[name].initialized === false) {
        allFinished = false;
      }
    });

    if (allFinished) {
      util.async(requestMenu);
    }
  };

  $scope.onDrawFinished = function(name) {
    // console.log('myPage.onDrawFinished begin');
    _ctrls[name].drawed = true;

    var allFinished = true;
    Object.keys(_ctrls).forEach(function(name) {
      if (!_ctrls[name].active)
        return;
      if (_ctrls[name].drawed === false) {
        allFinished = false;
      }
    });

    if (allFinished) {
      $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
    }

    //hideList() 에서 setDefaultFocus 호출 후 재 호출로 인해 포커스가 두번 감.
    //$scope.setDefaultFocus();

    // console.log('myPage.onDrawFinished end');
  };

  var onSignInStatusChanged = function(e, response) {
    // console.log('myPage.onSignInStatusChanged');
    var loggedIn = false;
    if (device.auth.userID && device.auth.loginSession) {
      loggedIn = true;
    }

    var dataLoaded = false;
    if ($scope.listData && ($scope.listData.total > 0)) {
      dataLoaded = true;
    }

    if (dataLoaded && (lastLogInCheck === loggedIn)) {
      // no change
      console.log('myPage.onSignInStatusChanged end, no change, loggedIn=' + loggedIn);
      return;
    }

    $rootScope.option.hideOption();

    updateTitle2();
    requestMenu();
  };

  var onAppInstalled = function(e, appId) {
    requestMenu();
  };

  var onAppInstallFailed = function(e, errorCode) {
    if (errorCode === 'USB_NO_SPACE') {
      // appUpdateAct -> appInstall -...-> installCapacityResult에서 검증하는 과정에서
      // usb 용량 부족 에러 발생
      appsInstallingUpdate.length = 0;
      $scope.$digest();
    }
  };

  var onAppDeleted = function(e, appId) {
    requestMenu();
  };

  ///////////////////////////////////////////////////////////////////////////
  var showAllImage = false;

  $scope.getShowAllImage = function() {
    return showAllImage;
  };

  $scope.setShowAllImage = function(show) {
    // console.log('myPage.setShowAllImage, show=' + show);
    showAllImage = show;

    if (show) {
      $scope.$broadcast('lazyImage');
    }
  };
  ///////////////////////////////////////////////////////////////////////////

  $scope.initialize = function() {
    // console.log('myPage.initialize, app.usbListData=' + JSON.stringify(app.usbListData));

    if (device.isDeepLink && device.param && device.param.loginInfo) {
      // console.log('myPage.initialize, deeplink');

      device.isDeepLink = false;

      $scope['selectedFilter'] = device.param.categoryCode;
      device.auth.userID = device.param.loginInfo.userId;
      device.auth.loginSession = device.param.loginInfo.loginSession;
    }

    $scope.$on(eventKey.MYPAGE_LOADED, onDataReceived);
    $scope.$on(eventKey.MYPAGE_MENU_LOADED, onMenuLoaded);
    $scope.$on('usbListUpdated', usbListUpdated);
    $scope.$on('hiding', hideList);
    $scope.$on('focus', focusHandler);
    $scope.$on(eventKey.RECOVER_FOCUS, $scope.recoverFocus);

    /*Popup 관련 이벤트*/
    // popup 관리는 나중에 통합하여야 함.
    $scope.$on('closeAppPopup', closePopup);
    $scope.$on('updateAppFromPopup', updateAppFromPopup);
    $scope.$on('callMemberShipFromPopup', callMemberShipFromPopup);
    $scope.$on('callLogInPageFromPopup', callLogInPageFromPopup);

    $scope.$on('appInstallResult', appInstallStatusUpdate);
    $scope.$on('appStatusChanged', appStatusChangeUpdate); //  Luna Callback Event : APP Install Status Change Result
    $scope.$on('installAndUpdateChecked2', installAndUpdateCheck); // Luna Callback Event : APP Install/Update Check
    $scope.$on(eventKey.MYPAGE_APP_UPDATE_SUCCESS, onAppUpdated);
    $scope.$on(eventKey.MYPAGE_APP_INSTALL_SUCCESS, onAppInstalled);
    $scope.$on(eventKey.MYPAGE_APP_DELETE_SUCCESS, onAppDeleted);
    $scope.$on(eventKey.MYPAGE_APP_INSTALL_FAIL, onAppInstallFailed);
    $scope.$on(eventKey.SIGNIN_STATUS_CHANGED, onSignInStatusChanged);
    $scope.$on('changeLoginStatus', onSignInStatusChanged);
    $scope.$on(eventKey.LIST_PAGE_UP_DOWN, pageUpDownByChKey);

    isFirst = true;
  };

  $scope.initialize();
});
