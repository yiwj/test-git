app.directive('appList', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'appListController',
    template: listAppTmpl
  };
});

app.controller('appListController', function($scope, $controller, $element, $rootScope, $timeout, server, focusManager, keyHandler, marquee, util, storage, pmLog, eventKey, device, timeOutValue, adManager, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var lastFocus = {};
  var lastItemFocus = {};
  var lastItemMenuFocus = {};
  var requestedAppends = false;
  var destroyInfo = {scope : $scope, element : $element};
  var isFirst = false;

  $scope.toBeDelScope = null;
  $scope.scopeName = 'appsngames';
  $scope.focusItem = '';
  $scope.defaultFocusItemClass = '';
  $scope.listData = null;
  $scope.direct = false;
  $scope.showing = false;
  $scope.hiding = false;
  $scope.title = '';
  $scope.historyBack = $rootScope.pageManager.getTitle('back');
  $scope.subtitle = '';
  $scope.sort = '';
  $scope.selectedMenu = '';
  $scope.prevMenu = '';
  $scope.focusedMenu = '';
  $scope.selectedCategory = '';
  $scope.isAWSServerFlag = util.isAWSServer();
  $rootScope.pmLogValue = pmLog.TYPE.APPGAME;
  var _ctrls = {
    'appngameList' : {initialized: false, drawed: false}
  };

  $scope.setFocusItem = function(item, element) {
    if (lastFocus.item === 'back' || lastFocus.item === 'option') $rootScope.tooltip.hideTooltip();

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

    if ($scope.focusItem === 'back') {
      $scope.historyBack = $rootScope.pageManager.getTitle('back');
      $rootScope.tooltip.showTooltip(parseInt(element.getClientRects()[0].width/2), parseInt(element.getClientRects()[0].top/2) + 20, $scope.historyBack, true, true);
    } else if ($scope.focusItem && $scope.focusItem.indexOf('item') >= 0) {
      //이전에 포커스된 아이템 컨텐츠를 저장하여 back 버튼에서 돌아올 경우 이전에 포커스된 아이템 컨텐츠로 이동한다.
      lastItemFocus.item = lastFocus.item;
      lastItemFocus.element = lastFocus.element;
      lastItemFocus.isFrom = true;
      lastItemMenuFocus.isFrom = false;
    } else if ($scope.focusItem && $scope.focusItem.length > 0) {
      // menu -> drawer -> menu (in order to come back)
      lastItemMenuFocus.item = lastFocus.item;
      lastItemMenuFocus.element = lastFocus.element;
      lastItemMenuFocus.isFrom = true;
    }
  };

  $scope.audioGuidance = function (scope, target, element) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };
    var enterSound = '';

    //최초 화면 진입 시 나오는 음성
    if ($rootScope.isNewPage) {
      if (scope.getScopeElement()[0]) {
        var tmpElement = scope.getScopeElement()[0];
        if (tmpElement.querySelector('.panel-header .text') && tmpElement.querySelector('.panel-header .text').innerText.length > 0) {
          enterSound = tmpElement.querySelector('.panel-header .text').innerText;
        }
        if (tmpElement.querySelector('.panel-header .sub-title') && tmpElement.querySelector('.panel-header .sub-title').innerText.length > 0) {
          enterSound += ". ";
          enterSound += tmpElement.querySelector('.panel-header .sub-title').innerText;
        }
        if (tmpElement.querySelector('.panel-header .sub-sub-title') && tmpElement.querySelector('.panel-header .sub-sub-title').innerText.length > 0) {
          enterSound += ". ";
          enterSound += tmpElement.querySelector('.panel-header .sub-sub-title').innerText;
        }
      }
      $rootScope.isNewPage = false;
    }

    var contentName = null;
    var textElement;
    if (element) {
      if (util.isAWSServer()) {
        //[WOSLQEVENT-114385] appList 중 badge 가 있을 경우 해당 badge text 를 읽어주는 현상이 있어
        //selector 수정하여 item title text를 읽어주도록 수정
        if (element.querySelector('.text') && element.querySelector('.text').parentElement.classList.contains('badge-text')) {
          textElement = element.querySelector('.item-tit .text');
        } else {
          textElement = element.querySelector('.focus .text');
        }
      } else {
        textElement = element.querySelector('.focus .text');
      }
    }
    if (textElement) {
      contentName = textElement.innerText;
    }

    if (enterSound.length > 0) {
      params.text = enterSound;
      if (util.isAWSServer()) {
        if(contentName){
          params.text += ". ";
          params.text += contentName;
        }
      } else {
        params.text += ". ";
        params.text += contentName;
      }
    } else if (contentName) {
      params.text = contentName;
    } else {
      return;
    }

    if (util.isAWSServer()) {
      if (textElement &&
        textElement.parentElement &&
        textElement.parentElement.classList &&
        textElement.parentElement.classList.contains('menu-text') &&
        textElement.parentElement.parentElement) {

        var accordionCat;
        if (textElement.parentElement.parentElement.getElementsByClassName('icon-depth').length > 0) {
          // [WOSLQEVENT-115559]
          // accordion 카테고리의 경우는 포커스/확인 키인가하면 카테고리명만 읽어주고,
          // 카테고리 명 옆 왼쪽에 빨간점 있으면 체크여부까지 읽어주는 것으로 적용
          accordionCat = true;
        }

        // [WOSLQEVENT-113782] 각 카테고리명 발화 후 뒤에 checked / unchecked 발화
        if (textElement.parentElement.parentElement.classList &&
          textElement.parentElement.parentElement.classList.contains('on')) {
          params.text += ". ";
          params.text += msgLang.audio_filter_check ? msgLang.audio_filter_check : 'checked';
        } else if (!accordionCat) {
          params.text += ". ";
          params.text += msgLang.audio_filter_uncheck ? msgLang.audio_filter_uncheck : 'unchecked';
        }
      }
    }

    audioGuidance.call(params);
  };

  $scope.recoverFocus = function() {
    if (lastFocus.item && lastFocus.element)
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  $scope.setFilter = function(filter, value) {
    $scope['selected' + filter] = value;
    $scope.requestMenuASync();
  };

  var unfoldMenu = function(target) {
    var obj;
    for (var i = 0; i < $element[0].getElementsByClassName('menu-depth-drawer').length; i ++) {
      obj = $element[0].getElementsByClassName('menu-depth-drawer')[i];
      if (obj.getAttribute('item') === target) {
        obj.style.height = (obj.children[0].clientHeight * obj.children.length) + 'px';
      } else {
        obj.style.height = '';
      }
    }
  };

  /**
   * @param {string} target : 클릭한 메뉴 정보
   * @description 클릭한 메뉴의 하위 메뉴에 대한 펼침 동작 및 다른 메뉴의 닫힘 동작을 처리한다.
   * */
   $scope.setMenu = function(target) {
    if (!device.isLite) {
      unfoldMenu(target);
    } else {
      // The lite version has no animation!
      $timeout(function() {
        unfoldMenu(target);
      }, 200);
    }
  };

  var clickSubMenu = function(target) {
    var pageParam = {page: 'listApp', module: $scope.focusedMenu, category: target};
    $element[0].setAttribute('item', $scope.focusedMenu);
    $scope.selectedCategory = target;
    for (var i = 0; i < $scope.listData.menuList.length; i++) {
      if ($scope.listData.menuList[i].code === $scope.focusedMenu) {
        $scope.listData.menuList[i].selected = 'TRUE';
      } else {
        $scope.listData.menuList[i].selected = 'FALSE';
      }
    }

    for (var i = 0; i < $scope.listData.filterList[0].values.length; i++) {
      if ($scope.listData.filterList[0].values[i].code === target) {
        $scope.listData.filterList[0].values[i].selected = 'TRUE';
        $scope.sort = $scope.listData.filterList[0].values[i].name;
      } else {
        $scope.listData.filterList[0].values[i].selected = 'FALSE';
      }
    }
    $rootScope.pageManager.chgHistory(pageParam);
    $scope.direct = true;
    $scope.requestDataASync(false);
  };

  $scope.executeAction = function() {
    if (focusManager.blockExecution()) {
      console.log('listApp.executeAction, blockExecution is true');
      return;
    }
    isFirst = false;

    var focusObject, target, obj, item, pageParam, menu, subMenu;

    device.prevListData = $scope.listData;

    // 메뉴 코드 설정
    menu = [];
    for (var i = 0; i < $scope.listData.menuList.length; i++) {
      menu[i] = $scope.listData.menuList[i].code;
    }

    // 필터 코드 설정
    subMenu = [];
    for (var i = 0; i < $scope.listData.filterList[0].values.length; i++) {
      subMenu[i] = $scope.listData.filterList[0].values[i].code;
    }
    focusObject = focusManager.getCurrent();
    if (focusObject.scope === $scope) {
      target = focusObject.target;
      device.startTime = new Date().getTime();
      if (target === 'back') {
        $rootScope.breadcrumb.executeBack($scope.scopeName, function() {
          $scope.setFocusItem('', null);
          marquee.setTarget(null);
          focusManager.setCurrent($scope, '');

          obj = $rootScope.pageManager.popHistory();
          $rootScope.draw(obj);
        });
      } else if (menu.indexOf(target) >= 0) {
        var prevFocusedMenu = $scope.focusedMenu; // get the previous focused menu
        item = $element[0].getAttribute('item');
        lastItemFocus = {};
        //$scope.focusedMenu = target;
        $scope.$apply(function(){
          //[WOSLQEVENT-118370]checked icon 상태에서 클릭 시 checked icon 이슈 해결
          //이전 target 같을 경우 $scope.focusedMenu가 '' 값을 set 문제, 전체메뉴가 아닌 경우에만 '' 값을 set 하지 않게 분기 처리
          if (target === '5'){
            $scope.focusedMenu = $scope.focusedMenu !== target ? target : '';
          }else{
            $scope.focusedMenu = $scope.focusedMenu !== target ? target : target;
          }
        });
        $scope.setMenu(target);

        // default : 1st subMenu
        if (target !== prevFocusedMenu && subMenu.length > 0) {
          if (prevFocusedMenu !== '' || target !== $scope.prevMenu) {
            clickSubMenu(subMenu[0]);
          }
        }

        $scope.prevMenu = target;

      } else if (subMenu.indexOf(target) >= 0) {
        item = $element[0].getAttribute('item');
        lastItemFocus = {};

        if ((item === $scope.focusedMenu && target !== $scope.selectedCategory) || (item !== $scope.focusedMenu)) {
          // onDraw로 이동
          /*pmLog.write(pmLog.LOGKEY.SECOND_MENU_CLICK, {
            menu_name : pmLog.TYPE.APPGAME,
            sub_menu_name : item,
            sub_sub_menu_name : target
          });*/
          clickSubMenu(target);
        }
      } else if (target === 'option') {
        if ($rootScope.option.hide) {
          $scope.setFocusItem('', null);
          $rootScope.option.showOption($scope, $scope.listData.filterList);
        }
      } else if ( target.indexOf('item') >= 0) {
        var keys = Object.keys(_ctrls);
        for (var i = 0 ; i < keys.length ; i++) {
          var key = keys[i];

          var result = _ctrls[key].scope.executeAction({
            pageElement: $element[0],
            focusElement: focusElement,
            target: target,
            logType: pmLog.TYPE.APPGAME
          });
          if (result === true) {
            return;
          }
        }
      }
    }
  };

  $scope.onInitialized = function(name, scope) {
    _ctrls[name].scope = scope;
    _ctrls[name].initialized = true;
    _ctrls[name].drawed = false;

    var allFinished = true;
    Object.keys(_ctrls).forEach(function(name) {
      if (_ctrls[name].initialized === false) {
        allFinished = false;
      }
    });

    if (allFinished) {
      $scope.requestMenuASync();
    }
  };

  var onDraw = function(e, response) {
    var i, l, m, menuArr, submenuArr, append, update, errorCode;

    e.preventDefault();

    // from back
    if (device.isBreadcrumbsClicked) {
      response = device.prevListData;
      response.startIndex = 0;
      $scope.listData.loaded = response.itemList.length;
      device.isBreadcrumbsClicked = false;
    }

    if ($scope.scopeName != '' && $scope.scopeName != response.scopeName) {
      errorCode = "Apps2Depth.400";
      // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId();
      if ($scope.listData) {
        var errorParam = {
          type: 'error',
          popupTitle: msgLang.alert_adult_3_2,
          errorMsg: msgLang.alert_adult_3_5,
          errorCodeMsg: 'ERROR CODE: '+errorCode
        };
        $rootScope.popupApp.showPopup($scope, errorParam);
      } else {
        $rootScope.pageManager.movePageError(errorCode, $scope, $element);
      }
    }
    if (requestedAppends && response.startIndex === 0) {
      // scroll을 최하단으로 내렸을 때
      $rootScope.spinner.hideSpinner();
      return;
    }

    //append = updateFilter($scope.listData.filterList) && requestedAppends;
    append = requestedAppends;
    if ($scope.listData.itemList) {

      // At the bottom, return!
      if (append && response.itemList.length === 0) {
        $rootScope.spinner.hideSpinner();
        return;
      }

      if (append && response.startIndex > 0) {
        $scope.listData.itemList = $scope.listData.itemList.concat(response.itemList);
      } else {
        $scope.listData.itemList = response.itemList;
      }
      $scope.listData.total = response.total;
      $scope.listData.loaded = $scope.listData.itemList.length;
      $scope.listData.startIndex = response.startIndex;
      $scope.scopeName = response.scopeName;

      update = true;
    } else {
      $scope.listData.itemList = response.itemList;
      $scope.listData.startIndex = response.startIndex;
      $scope.scopeName = response.scopeName;
      $scope.listData.total = response.total;
      $scope.title = storage.getHeadTitle('appsngames');
      $rootScope.pageManager.setTitle($scope.title);

      update = false;
    }

    findSelectedMenu($scope.listData.menuList);
    $scope.$digest();

    if (update) {
      // menu&filter/data api구분으로 인해 update시에도 메뉴에 대한 setMouseEvent를 다시 해야함.
      menuArr = $element[0].getElementsByClassName('menu-depth');
      l = menuArr.length;
      for (i = 0; i < l; i++) {
        $scope.setMouseEvent(menuArr[i]);
      }
      submenuArr = $element[0].getElementsByClassName('menu-list-depth');
      m = submenuArr.length;
      for (i = 0; i < m; i++) {
        $scope.setMouseEvent(submenuArr[i]);
      }
    } else {
      menuArr = $element[0].getElementsByClassName('menu-depth');
      l = menuArr.length;
      for (i = 0; i < l; i++) {
        $scope.setMouseEvent(menuArr[i]);
      }
      submenuArr = $element[0].getElementsByClassName('menu-list-depth');
      m = submenuArr.length;
      for (i = 0; i < m; i++) {
        $scope.setMouseEvent(submenuArr[i]);
      }

      $element[0].removeAttribute('ng-class');
    }

    Object.keys(_ctrls).forEach(function(name) {
      _ctrls[name].scope.onDraw($scope.listData, update, requestedAppends);
    });

    requestedAppends = false;

    // 첫 로딩 시와 장르 클릭 시 로깅되지 않는 이슈 (executeAction에 있는 것 주석처리)
    if (!isFirst) {
      pmLog.write(pmLog.LOGKEY.SECOND_MENU_CLICK, {
        menu_name : $rootScope.pmLogValue,
        sub_menu_name : $scope.selectedMenu,
        sub_sub_menu_name : $scope.selectedMenu === '5' ? $scope.selectedCategory + '' : ''
      });
    }
  };

  $scope.onDrawFinished = function(name) {
    _ctrls[name].drawed = true;

    var allFinished = true;
    Object.keys(_ctrls).forEach(function(name) {
      if (_ctrls[name].drawed === false) {
        allFinished = false;
      }
    });
    if (allFinished) {
      $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
    }

    var currMenu = findSelectedMenu($scope.listData.menuList);
    if (!currMenu) {
      // 1st menu
      var target = $element[0].querySelector('.panel-menu .menu-list .blank').getAttribute('item');
      $scope.setMenu(target);
    }
  };

  var finishDrawAppsNGames = function() {
    $timeout(function() {
      // [WOSLQEVENT-88103], iscroll issue. so wheel a little once more.
      var controlScope = _ctrls['appngameList'].scope;
      controlScope.wheelAction(-1, true);
    }, 100);
  };

  var updateFilter = function(filterList) {
    var i, k, obj, old;

    old = {};
    old.category = $scope.selectedCategory;

    $scope.selectedCategory = '';

    if (filterList) {
      i = filterList.length;
      if (i > 0) {
        obj = filterList[0];
        if (obj.key === 'FILTER_CATEGORY') {
          for (k = 0; k < obj.values.length; k++) {
            if (obj.values[k].selected === 'TRUE') {
              $scope.sort = obj.values[k].name;
              $scope.selectedCategory = obj.values[k].code;
              break;
            }
          }
          // default - 1st sort
          if ($scope.sort === '') {
            $scope.sort = obj.values[0].name;
            $scope.selectedCategory = obj.values[0].code;
          }
        }
      }
    }

    return old.category == $scope.selectedCategory;
  };

  var findSelectedMenu = function(menuList) {
    var i, l, obj;
    if(!menuList) return;
    l = menuList.length;
    for (i = 0; i < l; i++) {
      obj = menuList[i];
      if (obj.selected === 'TRUE') {
        $scope.subtitle = obj.name;
        $scope.selectedMenu = obj.code;
        $scope.focusedMenu = obj.code;
        return true;
      }
    }

    // default (if there is no selected 'TRUE')
    obj = menuList[0];
    $scope.subtitle = obj.name;
    $scope.selectedMenu = obj.code;
    $scope.focusedMenu = obj.code;
    $scope.sort = $scope.listData.filterList[0].values[0].name;
    $scope.selectedCategory = $scope.listData.filterList[0].values[0].code;
    return false;
  };

  var hideList = function(e, page) {
    e.preventDefault();

    if (page !== $scope.scopeName) {
      if ($scope.direct === false && $scope.showing === false) {
        if (page === '') {
          $scope.setDefaultFocus();
          $scope.setMenu($element[0].getAttribute('item'));
          $scope.direct = true;
          /*$scope.$apply(function(){
            $scope.direct = true;
          });*/
          $element[0].classList.add('direct');
          $rootScope.breadcrumb.onPageFromDeepLink();
          $timeout(function() {
            $scope.setShowAllImage(true);
          }, timeOutValue.SHOWING);
        } else {
          $scope.setDefaultFocus();
          $scope.setMenu($element[0].getAttribute('item'));
          /*$scope.$apply(function(){
            $scope.showing = true;
          });*/
          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, undefined, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $scope.showing = true;
            $scope.setShowAllImage(true);
          });
        }
      }
      var endTime = new Date().getTime();
      console.info('%c [PERFORMANCE]  : 2Depth App & Game LOADING TIME : ' + (endTime - device.startTime) + '   ', 'background-color:green;color:white');
      return;
    }

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      // $timeout(function() {
        Object.keys(_ctrls).forEach(function(name) {
          _ctrls[name].scope.onHide();
        });

        $element.remove();
        $scope.$destroy();
      // }, timeOutValue.DESTROYING);
    });
  };

  $scope.requestMenuASync = function() {
    requestedAppends = false;
    util.async(requestMenu);
  };

  var requestMenu = function() {
    var item, errorCode;
    var defaultCategory = '000100';
    if ($scope.selectedCategory === '') {
      if ($rootScope.pageManager.getCategory) {
        $scope.selectedCategory = $rootScope.pageManager.getCategory();
      } else {
        $scope.selectedCategory = defaultCategory;
      }
    }

    item = $element[0].getAttribute('item');
    try {

      if (!device.isLocalJSON) {
        // server data용
        var params = {
          api: '/discovery/category/GAMESAPPS',
          method: 'get',
          apiAppStoreVersion : 'v7.0',
          item: item,
          category: $scope.selectedCategory
        };
        server.requestApi(eventKey.MENU_APPGAME, params, (isFirst ? destroyInfo : {}));
      } else {
        // local json용
        server.requestAppNGameMenu(item, $scope.selectedCategory);
      }
    } catch (e) {
      errorCode = "Apps2Depth.400";
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      if ($scope.listData) {
        var errorParam = {
          type: 'error',
          popupTitle: msgLang.alert_adult_3_2,
          errorMsg: msgLang.alert_adult_3_5,
          errorCodeMsg: 'ERROR CODE: '+errorCode
        };
        $rootScope.popupApp.showPopup($scope, errorParam);
      } else {
        $rootScope.pageManager.movePageError(errorCode, $scope, $element);
      }
    }
  };

  var onMenuLoaded = function(e, response) {
    var errorCode;

    if (response.menuList === undefined) {
      errorCode = "Apps2Depth.400";
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      if ($scope.listData) {
        var errorParam = {
          type: 'error',
          popupTitle: msgLang.alert_adult_3_2,
          errorMsg: msgLang.alert_adult_3_5,
          errorCodeMsg: 'ERROR CODE: '+errorCode
        };
        $rootScope.popupApp.showPopup($scope, errorParam);
      } else {
        $rootScope.pageManager.movePageError(errorCode, $scope, $element);
      }
    } else {
      if ($scope.listData) {
        $scope.listData.menuList = response.menuList;
        $scope.listData.filterList = response.filterList;
      } else {
        $scope.listData = response;
      }
      updateFilter($scope.listData.filterList);
      requestData(false);
    }
  };

  $scope.requestDataASync = function(append) {
    util.async(function() {
      requestData(append);
    });
  };

  var requestData = function(append) {
    var item, itemPrefix, defaultCategoryId, payload, errorCode;

    requestedAppends = append;

    findSelectedMenu($scope.listData.menuList);
    $rootScope.spinner.showSpinner();
    item = $element[0].getAttribute('item');
    //[WOSLQEVENT-111866] SU 유도 앱 존재하지 않음
    //처음 app&games 진입했을때 Top Free(4) / All(000100) 로 요청이 들어옴.
    //device.appsngamesModule 값이 4로 설정되있어서 리스트 카테고리를 잘못 요청함.
    if($scope.selectedMenu){
      item = $scope.selectedMenu;
    }
    itemPrefix = 'ANG00';  // TODO : 로컬 개발이 끝나면 삭제 예정
    defaultCategoryId = '000100';
    payload = {index: 0, max: 96};
    payload['RANK_TYPE'] = item;
    item = itemPrefix + item;  // TODO : 로컬 개발이 끝나면 삭제 예정

    if (requestedAppends) payload.index = $scope.listData.loaded; // modified!!! $scope.listData.loaded + 1;
    if ($scope.selectedCategory === '') $scope.selectedCategory = defaultCategoryId;
    payload['FILTER_CATEGORY'] = $scope.selectedCategory;
    //[WOSLQEVENT-120728][QEVENTSIXT-12090] All - Game category에 진입하여 확인시 해당 App 없음
    //API호출하는 start_idx 값이 잘못설정되어있었음.(side effect로 인해 새로운 변수 선언)
    if(payload['index'] === 0) {
      payload['start_idx'] = payload['index']+1;
    }else {
      payload['start_idx'] = payload['index'];
    }
    try {
      if (!device.isLocalJSON) {
        // server data용
        var params = {
          api : '/discovery/item/GAMESAPPS',
          method : 'get',
          apiAppStoreVersion : 'v7.0',
          params : {
            callback : 'response',
            category_id : payload['FILTER_CATEGORY'],
            item_cnt : payload['max'],
            rank_type : payload['RANK_TYPE'],
            start_idx : payload['start_idx'],
            index : payload['index']
          }
        };
        server.requestApi(eventKey.LIST_APPGAME, params, (isFirst ? destroyInfo : {}));
      } else {
        // local json용
        server.requestAppNGameList(item, payload);
      }
    } catch (e) {
      errorCode = "Apps2Depth.400";
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      var errorParam;
      if ($scope.listData) {
        errorParam = {
          type: 'error',
          popupTitle: msgLang.alert_adult_3_2,
          errorMsg: msgLang.alert_adult_3_5,
          errorCodeMsg: 'ERROR CODE: '+errorCode
        };
        $rootScope.popupApp.showPopup($scope, errorParam);
      } else {
        if (requestedAppends) { //스크롤 이동으로인한 append중 통신에러인 경우 팝업만 띄움
          errorCode = "Apps2Depth.401";
          errorParam = {
              type: 'error',
              popupTitle: msgLang.alert_adult_3_2,
              errorMsg: msgLang.alert_adult_3_5,
              errorCodeMsg: 'ERROR CODE: '+errorCode
            };
            $rootScope.popupApp.showPopup($scope, errorParam);
        } else {
          /**movePageError에서는 페이지 이동간에 에러가 났을경우 전 스코프를 지운다(이전 페이지가 사라짐).
           * 하지만 스크롤 동작중 데이터가 append되는 것은 페이지 이동이 아니므로 팝업만
           * 띄우고 현상태 유지한다. 만약 스크롤이동 중 에러가 나서 movepageError를 호출하면 현재페이지가 지워진다.**/
          $rootScope.pageManager.movePageError(errorCode, $scope, $element);
        }
      }
    }
  };

  $scope.setDefaultFocusItemClass = function(className) {
    $scope.defaultFocusItemClass = className;
  };

  $scope.setDefaultFocus = function() {
    var target, item, itemClass;

    if (focusManager.getState('option') === true) return;

    if ($scope.defaultFocusItemClass) {
      itemClass = $scope.defaultFocusItemClass;
      $scope.defaultFocusItemClass = '';

      target = $element[0].getElementsByClassName(itemClass)[0];
    }

    if (!target) {
      target = $element[0].getElementsByClassName('item-promotion')[0] ?
        $element[0].getElementsByClassName('item-promotion')[0] :
        $element[0].getElementsByClassName('item-apps')[0];
    }
    // menu click시 해당 메뉴에 포커스
    if (!isFirst) {
      target = $element[0].getElementsByClassName('on')[0];
    } else {
      isFirst = false;
    }

    if (target) {
      item = target.getAttribute('item');
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

  $scope.moveFocusByKey = function(keyCode, isPageUpDownByChKey) {
    var i;
    if ($scope.focusItem === '') {
      if (util.isAWSServer()) {
        device.isFocusItem = false;
      }
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    if ($scope.focusItem.indexOf('item') !== 0) {
      switch ($scope.focusItem) {
        case 'back':
          moveFocusFromBack(keyCode);
          break;
        default:
          moveFocusFromMenu(keyCode);
      }
      return;
    }

    var keys = Object.keys(_ctrls);
    for (i = 0 ; i < keys.length ; i++) {
      var key = keys[i];

      var result = _ctrls[key].scope.moveFocusByKey(focusElement,
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
    switch (keyCode) {
      case keyHandler.LEFT:
        $scope.executeAction();
        break;
      case keyHandler.RIGHT:
        $scope.focusToMenu({x: 0, y: 0, width: 0, height: 0});
        break;
    }
  };

  var moveFocusFromMenu = function(keyCode) {
    var i, l, arr, index, element;

    switch (keyCode) {
      case keyHandler.LEFT:

        if (device.isRTL) { // RTL : accordion menu -> right button
          return;
        }

        $rootScope.$broadcast('focus', 'breadcrumbs', function() {
          // right button이 섵택되었을 때 실행될 callback
          moveFocusFromBack(keyHandler.RIGHT);
        });
        break;
      case keyHandler.UP:
        arr = $element[0].getElementsByClassName('app-left-menu');
        l = arr.length;
        for (i = 0; i < l; i++) {
          if (arr[i].getAttribute('item') === $scope.focusItem) {
            index = i;
            break;
          }
        }
        if (index === 0) {
          $scope.focusToHeader();
          break;
        }
        element = arr[index - 1];
        if (element) $scope.setFocusItem(element.getAttribute('item'), element);

        break;
      case keyHandler.RIGHT:
        if (_ctrls['appngameList'] && _ctrls['appngameList'].scope) {
          _ctrls['appngameList'].scope.focusFromMenu('prev', true, lastItemFocus); // focus from menu
        }
        break;
      case keyHandler.DOWN:
        arr = $element[0].getElementsByClassName('app-left-menu');
        l = arr.length;
        for (i = 0; i < l; i++) {
          if (arr[i].getAttribute('item') === $scope.focusItem) {
            index = i;
            break;
          }
        }
        var adElement = angular.element(document.getElementsByClassName('ad-banner')[0]);
        if(index + 1 === l && !adElement.hasClass('ng-hide')) { //마지막 메뉴일 경우 광고 영역으로 focus 이동
          focusTo2DepthAD();
        } else {
          element = arr[index + 1];
          if (element) $scope.setFocusItem(element.getAttribute('item'), element);
          break;
        }
    }
  };

  $scope.focusToHeader = function(rect) {
    if (focusManager.getCurrent().target === 'prev') lastItemFocus.isFrom = false;
    if (focusManager.getCurrent().target === 'next') {
      _ctrls['appngameList'].scope.focusFromScroll('prev', true, lastItemFocus, lastItemMenuFocus);
      return;
    }

    $rootScope.$broadcast('focus', 'drawer', keyHandler.UP, rect);
  };

  $scope.focusToMenu = function(rect) {
    if (device.isDepth2AdFocused) {
      device.isDepth2AdFocused = false;
      marquee.setTarget(null);
      focusTo2DepthAD();
    } else if (lastItemMenuFocus && lastItemMenuFocus.element) {
      element = lastItemMenuFocus.element;
      $scope.setFocusItem(element.getAttribute('item'), element);
    } else {
      var i, l, arr, element;

      arr = $element[0].getElementsByClassName('on');
      l = arr.length;
      if (l === 0) {
        // 1st menu
        element = document.querySelector('.panel-menu .menu-list .blank');
        $scope.setFocusItem(element.getAttribute('item'), element);
        return;
      }
      element = arr[l - 1];
      for (i = 0; i < l; i++) {
        if (rect.y < arr[i].offsetTop + arr[i].clientHeight) {
          element = arr[i];
          break;
        }
      }

      var adElement = angular.element(document.getElementsByClassName('ad-banner')[0]);
      if (element) {
        if($scope.focusItem && $scope.focusItem.indexOf('item') >= 0 && rect.y > element.offsetTop + element.clientHeight && !adElement.hasClass('ng-hide')) {
          focusTo2DepthAD();
        } else {
          $scope.setFocusItem(element.getAttribute('item'), element);
        }
      } else {
        // 1st menu
        element = document.querySelector('.panel-menu .menu-list .blank');
        $scope.setFocusItem(element.getAttribute('item'), element);
      }
    }
  };

  var focusTo2DepthAD = function(rect) {
    $rootScope.$broadcast('focus', 'depth2Ad', rect);
  };

  var focusHandler = function(e, target, keyCode, rect) {
    e.preventDefault();
    if (target !== 'main') return;

    if ((keyCode === keyHandler.RIGHT) && rect && (rect.left <= 0)) {
      // from breadcrumbs
      moveFocusFromBack(keyCode);
      return;
    }

    if (_ctrls['appngameList'] && _ctrls['appngameList'].scope) {
      if($element[0].getElementsByClassName('panel-body')[0].offsetLeft > rect.x) {
        if(keyCode === keyHandler.UP) _ctrls['appngameList'].scope.focusFromAD(rect);
        else _ctrls['appngameList'].scope.focusFromScroll('prev', true, lastItemFocus); // depth2Ad -> keyHandler.RIGHT
      } else {
        _ctrls['appngameList'].scope.focusFromScroll('prev', true, lastItemFocus, lastItemMenuFocus);
      }
    } else {
      $scope.setDefaultFocus();
    }
  };

  var displayAD = function(e) {
    e.preventDefault();
    var adRes = adManager.adResponse[adManager.curModule];
    //    $rootScope.depth2Ad.adRes = adRes;
//    console.log('device.param ::::::::::::::::' + JSON.stringify(device.param));
    if(device.param && (device.param.scope === 'appsngames' || (device.param.page === 'listApp' && device.param.module === device.appsngamesModule))) {
      $rootScope.depth2Ad.showAD(adRes);
    }
    $rootScope.spinner.hideSpinner();
  };

  /*
   * webkitshowed event 일때 광고 refresh
   */
  var foregroundHandler = function(e) {
  	adManager.call('requestContextIndex', '', 'appsngames');
  };

  ///////////////////////////////////////////////////////////////////////////
  var showAllImage = false;

  $scope.getShowAllImage = function() {
    return showAllImage;
  };

  $scope.setShowAllImage = function(show) {
    // console.log('listApp.setShowAllImage, show=' + show);
    showAllImage = show;

    if (show) {
      $scope.$broadcast('lazyImage');
    }
  };
  ///////////////////////////////////////////////////////////////////////////

  $scope.initialize = function() {
    $scope.$on(eventKey.LIST_APPGAME, onDraw);
    $scope.$on(eventKey.MENU_APPGAME, onMenuLoaded);
    $scope.$on('hiding', hideList);
    $scope.$on('focus', focusHandler);
    $scope.$on(eventKey.RECOVER_FOCUS, $scope.recoverFocus);
    $scope.$on(eventKey.DEPTH2_AD_LOADED, displayAD);
    $scope.$on('webkitShowed', foregroundHandler);
    $scope.$on(eventKey.LIST_PAGE_UP_DOWN, pageUpDownByChKey);
    $scope.$on('finishDrawAppsNGames' , finishDrawAppsNGames);
    isFirst = true;
  };

  $scope.initialize();
});
