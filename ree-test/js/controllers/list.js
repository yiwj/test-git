app.directive('list', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'listController',
   // templateUrl: './resources/html/list.html'
    template: listTmpl
  };
});

app.controller('listController', function($scope, $controller, $element, $rootScope, $timeout, server, focusManager, keyHandler, marquee, util, storage, popupService, pmLog, eventKey, device, timeOutValue, adManager, watchProcess, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var lastFocus = {};
  var lastItemFocus = {};
  var lastItemMenuFocus = {};
  var requestedAppends = false;
  var destroyInfo = {scope : $scope, element : $element};
  var isFirst = false;
  var targetMenu;

  $scope.toBeDelScope = null;
  $scope.scopeName = '';
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
  $scope.focusedMenu = '';
  $scope.selectedGenre = '';
  $scope.selectedOrder = '';
  $scope.selectedCategory = '';
  $scope.nodata = '';
  $scope._ctrls = {
    'tvshowsList' : {initialized: false, drawed: false}
  };

  $scope.setFocusItem = function(item, element) {
    var y;

    if (lastFocus.item == 'back') {
      $rootScope.tooltip.hideTooltip();
    }
    $scope.focusItem = item;

    if (focusElement) {
      focusElement.classList.remove('focus');
    }
    focusElement = element;
    if (focusElement) {
      focusElement.classList.add('focus');
    }
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
      $rootScope.tooltip.showTooltip(50, 107, $rootScope.pageManager.getTitle('back'), true, true);
    } else if ($scope.focusItem !== null && $scope.focusItem.indexOf('item') >= 0) {
      //이전에 포커스된 아이템 컨텐츠를 저장하여 back 버튼에서 돌아올 경우 이전에 포커스된 아이템 컨텐츠로 이동한다.
      lastItemFocus.item = lastFocus.item;
      lastItemFocus.element = lastFocus.element;
      lastItemFocus.isFrom = true;
      lastItemMenuFocus.isFrom = false;

      var cpBadge = element.getElementsByClassName('img-badge_wrap')[0];
      var badge = element.getElementsByClassName('item-badge')[0];

    } else if ($scope.focusItem !== null && $scope.focusItem.length > 0) { // $scope.focusItem.indexOf('ME') >= 0
      // menu -> drawer -> menu (in order to come back)
      if ($scope.focusItem !== 'player') {
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
    var enterSound = '';
    var textElement;

    //최초 화면 진입 시 나오는 음성
    if ($rootScope.isNewPage) {
      if (scope.getScopeElement()[0]) {
        var tmpElement = scope.getScopeElement()[0];
        textElement = tmpElement.querySelector('.panel-header .text');
        if (textElement &&
          textElement.innerText &&
          textElement.innerText.length > 0) {
          enterSound = textElement.innerText;
        }
        textElement = tmpElement.querySelector('.panel-header .sub-title');
        if (textElement &&
          textElement.innerText &&
          textElement.innerText.length > 0) {
          enterSound += ". ";
          enterSound += textElement.innerText;
        }
        textElement = tmpElement.querySelector('.panel-header .sub-sub-title');
        if (textElement &&
          textElement.innerText &&
          textElement.innerText.length > 0) {
          enterSound += ". ";
          enterSound += textElement.innerText;
        }
      }
      $rootScope.isNewPage = false;
    }

    //[WOSLQEVENT-113071] 장르 선택 후 default focus 로 "전체" 선택 시 발화 안됨
    //정확한 원인 알수 없으나 innerText 값을 가져오지 못합. 하여 setTimout 처리
    var contentName = null;
    if (util.isAWSServer()) {
      if (element && element.querySelector('.focus .text')) {
        setTimeout(function () {
          var textElement = element.querySelector('.focus .text');
          contentName = textElement.innerText;
          if (enterSound.length > 0) {
            params.text = enterSound;
            params.text += ". ";
            params.text += contentName;
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
                if($scope.listData.total === 0) {   // nodata 발화
                  params.text += ". ";
                  params.text += $scope.nodata;
                }
              } else if (!accordionCat) {
                params.text += ". ";
                params.text += msgLang.audio_filter_uncheck ? msgLang.audio_filter_uncheck : 'unchecked';
              }
            } else if ((contentName === msgLang.tvshow_badge_youmaylike) &&
              element.classList &&
              element.classList.contains('item', 'item-list')) {
              // [WOSLQEVENT-115452][WOSLQEVENT-115455] You may like 된 동영상 오디오 가디언스 확인시 음성 미출력
              // badge 인 경우, title을 별도로 읽어야 함
              var title = element.innerText.trim();
              if (title.indexOf(msgLang.tvshow_badge_youmaylike) === 0) {
                // 카타고리 변경 직후, default focus 된 이후에는 item의 innerText안에
                // 시작부분에 badge가 있다.
                title = title.substring(msgLang.tvshow_badge_youmaylike.length);
              }

              params.text += ". ";
              params.text += title;
            }
          }

          audioGuidance.call(params);
        }, 0);
      }
    } else {
      if (element && element.querySelector('.focus .text')) {
        contentName = element.querySelector('.focus .text').innerText;
      }

      if (enterSound.length > 0) {
        params.text = enterSound;
        params.text += ". ";
        params.text += contentName;
      } else if (contentName) {
        params.text = contentName;
      } else {
        return;
      }
      audioGuidance.call(params);
    }
  };

  $scope.recoverFocus = function() {
    if (lastFocus.item && lastFocus.element)
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  $scope.setFilter = function(filter, value) {
    $scope.direct = true;
    $scope['selected' + filter] = value;
    $scope.requestDataASync(false);
  };

  var unfoldMenu = function(target) {
    var obj;
    for (var i = 0; i < $element[0].getElementsByClassName('menu-depth-drawer').length; i ++) {
      obj = $element[0].getElementsByClassName('menu-depth-drawer')[i];
      if (obj.getAttribute('item') == target && typeof $scope.listData.filterList[0] != 'undefined') {
        $scope.$digest();
        obj.style.height = (obj.children[0].clientHeight * obj.children.length) + 'px';
      } else {
        obj.style.height = 0;
      }
    }
  };

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

  $scope.executeAction = function(submenu) {
    device.prevListData = $scope.listData;

    if (focusManager.blockExecution()) {
      console.log('list.executeAction, blockExecution is true');
      return;
    }

    isFirst = false;

    var focusObject, target, obj, page, item, itemId, payload;

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      var logType = '';
      device.startTime = new Date().getTime();

      // WOSLQEVENT-54940 : focus가 아닌 mouse event의 코드를 직접 받아서 처리
      if(submenu && submenu.length > 0 && submenu.indexOf('submenu') >= 0) {
        target = submenu;
      } else {
        target = focusObject.target;
      }

      if($rootScope.drawer.lastMenu == 'tvshows') {
        logType = pmLog.TYPE.TVSHOWS;
      } else if($rootScope.drawer.lastMenu == 'movies') {
        logType = pmLog.TYPE.MOVIE;
      } else {
        logType = $rootScope.pmLogValue;
      }

      var keys = Object.keys($scope._ctrls);
      for (var i = 0 ; i < keys.length ; i++) {
        var key = keys[i];
        if (!$scope._ctrls[key].scope)
          continue;

        var result = $scope._ctrls[key].scope.executeAction({
          pageFrom: 'list',
          pageElement: $element[0],
          focusElement: focusElement,
          target: target,
          logType: logType,
          filterList: $scope.listData ? $scope.listData.filterList : undefined
        });

        if (result === true) {
          return;
        }
      }

      if (target == 'back') {
        $rootScope.breadcrumb.executeBack($scope.scopeName, function() {
          $scope.setFocusItem('', null);

          obj = $rootScope.pageManager.popHistory();
          $rootScope.draw(obj);
        });
      } else if ((target.indexOf('ME') >= 0) || (target.indexOf('CP') >= 0)) {
        item = $element[0].getAttribute('item');

        if (item != target) {
          // onDraw로 이동
          /*pmLog.write(pmLog.LOGKEY.SECOND_MENU_CLICK, {
            menu_name : logType,
            sub_menu_name : target,
            sub_sub_menu_name : ''
          });*/
          $scope.selectedCategory = '';
          $scope.selectedOrder = '';
          lastItemFocus = {};
          $element[0].setAttribute('item', target);
          $scope.focusedMenu = target;
          targetMenu = target;
          setSelectedMenu($scope.listData.menuList, target); // set selected menu!
          $scope.direct = true;
          $scope.requestDataASync(false);
        }
        $scope.$apply(function(){
          $scope.focusedMenu = $scope.focusedMenu != target ? target : '';
        });
        $scope.setMenu(target);
      } else if (target.indexOf('submenu') >= 0) {
        var filter;
        var category = focusElement.getAttribute("item-catg");
        var code = target.replace('submenu', '');
        lastItemFocus = {};
        switch (category) {//TODO api 재구조화 예정 : menu_list 하의 sub_menu 클릭시
        case 'FILTER_GENRE':
          filter = 'Genre';
          break;
        case 'FILTER_CATEGORY':
          filter = 'Category';
          break;
        case 'FILTER_ORDER':
          filter = 'Order';
          break;
        case 'FILTER_SORTER':
          filter = 'Sorter';
          break;
        case 'FILTER_FILTER':
          filter = 'Filter';
          break;
        }
        $scope.setFilter(filter, code);
        // onDraw로 이동
        /*pmLog.write(pmLog.LOGKEY.SECOND_MENU_CLICK, {
          menu_name : logType,
          sub_menu_name : focusElement.parentElement.getAttribute('item'),
          sub_sub_menu_name : (code === '-1' ? 'All' : code)
        });*/
      } else if (target == 'player' || $rootScope.isPlayKey) {
        item = focusElement.getAttribute("item-id");
        module = item.split('|')[0];
        if($rootScope.drawer.lastMenu == 'movies') {
          module = 'MV';
        } else if($rootScope.drawer.lastMenu == 'tvshows') {
          module = 'TS';
        }
        $rootScope.isPlayKey = false;
        watchProcess.execProcess($scope.$id, module, item, 'List Page', $rootScope.pmLogValue);
//      } else if (target == 'option') {
//        $scope.setFocusItem('', null);
//        $rootScope.option.showOption($scope, $scope.listData.filterList);
      }
    }
  };

  var updateFilter = function(filterList) {
    var i, k, l, obj, old;

    old = {};
    old.genre = $scope.selectedGenre;
    old.order = $scope.selectedOrder;
    old.category = $scope.selectedCategory;

    $scope.sort = '';
    $scope.selectedGenre = '';
    $scope.selectedOrder = '';
    $scope.selectedCategory = '';

    if (filterList) {
      l = filterList.length;
      for (i = 0; i < l; i++) {
        obj = filterList[i];
        if (obj.key == 'FILTER_CATEGORY') {
          for (k = 0; k < obj.values.length; k++) {
            if (obj.values[k].selected == 'TRUE') {
              $scope.sort = obj.values[k].name;
              $scope.selectedCategory = obj.values[k].code;
              break;
            }
          }
        } else if (obj.key == 'FILTER_GENRE') {
          for (k = 0; k < obj.values.length; k++) {
            if (obj.values[k].selected == 'TRUE') {
              $scope.sort = obj.values[k].name + $scope.sort;
              $scope.selectedGenre = obj.values[k].code;
              $scope.selectedCategory = obj.values[k].code;  // submenu select를 위해 추가.
              break;
            }
          }
        } else if (obj.key == 'FILTER_ORDER') {
          for (k = 0; k < obj.values.length; k++) {
            if (obj.values[k].selected == 'TRUE') {
//              $scope.sort = $scope.sort + ', ' + obj.values[k].name;
              $scope.selectedOrder = obj.values[k].code;
              break;
            }
          }
        }
      }
    }

    if (old.genre == $scope.selectedGenre && old.order == $scope.selectedOrder && old.category == $scope.selectedCategory) return true;

    return false;
  };

  var findSelectedMenu = function(menuList) {
    var i, l, obj;
    l = menuList.length;
    for (i = 0; i < l; i++) {
      obj = menuList[i];
      if (obj.selected == 'TRUE') {
        $scope.subtitle = obj.name;
        $scope.selectedMenu = obj.code;
        $scope.focusedMenu = obj.code;
        return;
      }
    }
  };

  var setSelectedMenu = function(menuList, code) {
    var i, l, obj;
    l = menuList.length;
    for (i = 0; i < l; i++) {
      obj = menuList[i];
      if (obj.code === code) {
        obj.selected = 'TRUE';
      } else {
        obj.selected = 'FALSE';
      }
    }
  };

  $scope.requestDataASync = function(append) {
    util.async(function() {
      requestData(append);
    });
  };

  var requestMenu = function(type) {
    var cat;
    if (type === 'tvshows') {
      cat = 'TS';
    } else {
      // movies
      cat = 'MV';
    }

    var params = {
      api : '/discovery2016/category/' + cat,
      apiAppStoreVersion: 'v7.0',
      method : 'post',
      gubun : cat
    };
    try {
      server.requestApi(eventKey.MENU_LOADED, params, (isFirst ? destroyInfo : {}));
    } catch (e) {
      moduleName = $scope.findModuelName();
      errorCode = moduleName + ".600";
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer 이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);
    }
  };

  var onMenuLoaded = function(e, response) {
    e.preventDefault();

    console.log('list.onMenuLoaded, response=' + JSON.stringify(response));

    if (response && response.menuList) {
      for (var i = 0 ; i < response.menuList.length ; i++) {
        if (response.menuList[i].selected === 'TRUE') {
          $element[0].setAttribute('item', response.menuList[i].code);
          break;
        }
      }
    }

    requestData();
  };

  var requestData = function(append) {
    // console.log('list.requestData, append=' + append);

    requestedAppends = append;

    var item, payload, errorCode, moduleName, map = {
      'ME2212': 'TVShowRecommended',
      'ME2220': 'TVShowList',
      'ME2214': 'TVShowList',
      'ME2312': 'MovieRecommended',
      'ME2314': 'MovieList',
      'ME2320': 'MovieList'
    };
    $rootScope.spinner.showSpinner();

    if (!$scope.selectedCategory) {
      var category = $rootScope.pageManager.getCategory();
      if (category) {
        $scope.selectedCategory = category;
      }
    }
    if (!$scope.selectedGenre) {
      var genre = $rootScope.pageManager.getGenre();
      if (genre) {
        $scope.selectedGenre = genre;
      }
    }

    item = $element[0].getAttribute('item');

    // console.log('list.requestData, item=' + item);
    if (!item) {
      // device.tierType: 1.5
      // need to get default menu
      requestMenu($rootScope.drawer.lastMenu);
      return;
    }

    targetMenu = item;

    if(device.tierType === 1.5) {
      payload = {index: 1, max: 100, tier : 'TIER' + device.tierType};
    } else {
      payload = {index: 1, max: 100};
    }

    if (item == 'ME2212' || item == 'ME2312') {
      if ($scope.selectedCategory != -1 && $scope.selectedCategory != '' && item === $scope.selectedMenu) {
        payload['FILTER_CATEGORY'] = $scope.selectedCategory;
      }
    } else if (item == 'ME2214' || item == 'ME2314') {
      if (append) {
        payload.index = $scope.listData.loaded + 1;
      }
      if ($scope.selectedCategory != -1 && $scope.selectedCategory != '' && item === $scope.selectedMenu) {
        payload['FILTER_CATEGORY'] = $scope.selectedCategory;
      }
    } else if (item == 'ME2320' || item == 'ME2220') {
      if (append) {
        payload.index = $scope.listData.loaded + 1;
      }

      payload['FILTER_ORDER'] = 'PD';   // 최신순 정렬

      if ($scope.selectedGenre != '') {
        payload['FILTER_GENRE'] = $scope.selectedGenre;
      }
    } else if ($scope.selectedCategory != -1 && $scope.selectedCategory != '' && item === $scope.selectedMenu) {
      payload['FILTER_CATEGORY'] = $scope.selectedCategory;
    } else if (!item) {
      // item is not found.
      return;
    }

    // 2016-01-05 onnow Logging
    device.onnowLogging = 'MENU|' + item;

    var gubun = ($rootScope.drawer.lastMenu == 'movies') ? 'MV' : 'TS';
    var params = {
      api : '/discovery2016/category/' + gubun + '/' +  item,
      apiAppStoreVersion: 'v7.0',
      method : 'post',
      payload : payload,
      gubun : gubun
    };
    try {
      if (!device.isLocalJSON) {
        // Server data용
        server.requestApi(eventKey.LIST_TVMOVIE, params, (isFirst ? destroyInfo : {}));
      } else {
        // local json용
        server['request' + map[item]](item, payload);
      }
    } catch (e) {
      moduleName = $scope.findModuelName();
      errorCode = moduleName + ".400"; // API 통신 에러
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer 이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);
    }
  };

  $scope.setDefaultFocus = function() {
    var itemClass, target;

//    if (focusManager.getState('option') == true) return;

    if ($scope.defaultFocusItemClass) {
      itemClass = $scope.defaultFocusItemClass;
      $scope.defaultFocusItemClass = '';
    } else if($scope.listData.itemList.length === 0) {
      itemClass = 'menu-list';
    } else {
      itemClass = 'item-list';
    }

    // menu click시 해당 메뉴에 포커스
    if (isFirst) {
      target = $element[0].getElementsByClassName(itemClass)[0];
      isFirst = false;
    } else {
      target = $element[0].getElementsByClassName('on')[0];
    }

    if (target) {
      item = target.getAttribute('item');
      $scope.setFocusItem(item, target);
    } else {
      $scope.setFocusItem('', null);
    }
  };

  $scope.removeFocus = function(target) {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
      $rootScope.tooltip.hideTooltip();
    }
  };

  $scope.moveFocusByKey = function(keyCode, isPageUpDownByChKey) {
    var i, l, arr, obj, prev, row, index, item, name, element, hidden, scrollY, rect;

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
//        case 'option':
//          moveFocusFromOption(keyCode);
//          break;
        default:
          moveFocusFromMenu(keyCode);
      }
      return;
    }

    var keys = Object.keys($scope._ctrls);
    for (i = 0 ; i < keys.length ; i++) {
      var key = keys[i];

      var result = $scope._ctrls[key].scope.moveFocusByKey(focusElement,
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
    $scope.moveFocusByKey(keyCode, isPageUpDownByChKey);
  };

  var moveFocusFromBack = function(keyCode) {
    var element;

    switch (keyCode) {
      case keyHandler.LEFT:
        $scope.executeAction();
        break;
      case keyHandler.RIGHT:
        $scope.focusToMenu({x: 0, y: 0, width: 0, height: 0});
        break;
    }
  };

//  var moveFocusFromOption = function(keyCode) {
//    var element;
//
//    switch (keyCode) {
//      case keyHandler.LEFT:
//        element = $element[0].getElementsByClassName('panel-back')[0];
//        $scope.setFocusItem('back', element);
//        break;
//      case keyHandler.UP:
//        $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 1840, y: 0, width: 0, height: 0});
//        break;
//      case keyHandler.DOWN:
//        $scope.$broadcast('focus', 'scroll', keyCode, {x: 0, y: 0, width: 0, height: 0});
//        break;
//    }
//  };

  var moveFocusFromMenu = function(keyCode) {
    var i, l, arr, index, element, moved = false;

    switch (keyCode) {
      case keyHandler.LEFT:

        if (device.isRTL) { // RTL : accordion menu -> right button
          return;
        }

        $rootScope.$broadcast('focus', 'breadcrumbs', function() {
          // right button이 섵택되었을 때 실행될 callback
          moveFocusFromBack(keyHandler.RIGHT);
        });
        moved = true;
        break;
      case keyHandler.UP:
        arr = $element[0].getElementsByClassName('left-menu');
        l = arr.length;
        for (i = 0; i < l; i++) {
          if (arr[i].getAttribute('item') == $scope.focusItem) {
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
        if ($scope._ctrls['tvshowsList'] && $scope._ctrls['tvshowsList'].scope) {
          $scope._ctrls['tvshowsList'].scope.focusFromMenu('prev', true, lastItemFocus); // focus from menu
          moved = true;
        }
        break;
      case keyHandler.DOWN:
        arr = $element[0].getElementsByClassName('left-menu');
        l = arr.length;
        for (i = 0; i < l; i++) {
          if (arr[i].getAttribute('item') == $scope.focusItem) {
            index = i;
            break;
          }
        }
        if (index < l - 1) {
          element = arr[index + 1];
          if (element) $scope.setFocusItem(element.getAttribute('item'), element);
          moved = true;
        }
        break;
    }
    return moved;
  };

  $scope.focusToHeader = function(rect) {
    if (focusManager.getCurrent().target === 'prev') lastItemFocus.isFrom = false; // scroll button. prev -> drawer (-> prev)
    if (focusManager.getCurrent().target === 'next') {
      $scope._ctrls['tvshowsList'].scope.focusFromScroll('prev', true, lastItemFocus, lastItemMenuFocus);
      return;
    }

    $rootScope.$broadcast('focus', 'drawer', keyHandler.UP, rect);
    /*var mid, element;

    mid = $element[0].clientWidth / 2;
    if ($scope.sort && rect.x > mid) {
      element = $element[0].getElementsByClassName('option-button')[0];
      $scope.setFocusItem('option', element);
    } else {
      element = $element[0].getElementsByClassName('Math.floor')[0];
      $scope.setFocusItem('back', element);
    }*/
  };

  $scope.focusToMenu = function(rect) {
    if (lastItemMenuFocus && lastItemMenuFocus.element) {
      element = lastItemMenuFocus.element;
    } else {
      var i, l, arr, element;

      arr = $element[0].getElementsByClassName('on');
      l = arr.length;
      element = arr[l - 1];
      for (i = 0; i < l; i++) {
        if (rect.y < arr[i].offsetTop + arr[i].clientHeight) {
          element = arr[i];
          break;
        }
      }

      if(!angular.element(element).hasClass('blank')) {
        element = element.children[0];
      }
    }

    $scope.setFocusItem(element.getAttribute('item'), element);
  };

  var focusHandler = function(e, target, keyCode, rect) {
    if (target != 'main') return;

    if ((keyCode === keyHandler.RIGHT) && rect && (rect.left <= 0)) {
      // from breadcrumbs
      $scope.focusToMenu({x: 0, y: 0, width: 0, height: 0});
      return;
    }

    if ($scope._ctrls['tvshowsList'] && $scope._ctrls['tvshowsList'].scope) {
      $scope._ctrls['tvshowsList'].scope.focusFromScroll('prev', true, lastItemFocus, lastItemMenuFocus);
    } else {
      $scope.setDefaultFocus();
    }
  };

  $scope.findModuelName = function() {
    var item, moduleName, map = {
      'ME2212': 'Tvshow2Depth',
      'ME2220': 'Tvshow2Depth',
      'ME2214': 'Tvshow2Depth',
      'ME2312': 'Movie2Depth',
      'ME2314': 'Movie2Depth',
      'ME2320': 'Movie2Depth'
    };

    item = $element[0].getAttribute('item');
    moduleName = map[item];
    return moduleName;
  };

  $scope.onInitialized = function(name, scope) {
    $scope._ctrls[name].scope = scope;
    $scope._ctrls[name].initialized = true;
    $scope._ctrls[name].drawed = false;

    var allFinished = true;
    Object.keys($scope._ctrls).forEach(function(name) {
      if ($scope._ctrls[name].initialized === false) {
        allFinished = false;
      }
    });

    if (allFinished) {
      $scope.requestDataASync(false);
    }
  };

  $scope.onDrawFinished = function(name) {
    // console.log('list.onDrawFinished');
    $scope._ctrls[name].drawed = true;

    var allFinished = true;
    Object.keys($scope._ctrls).forEach(function(name) {
      if ($scope._ctrls[name].drawed === false) {
        allFinished = false;
      }
    });

    if (allFinished) {
      $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
    }
  };

  var onDraw = function(e, response) {
    e.preventDefault();

    // from back
    var backFromDetailList = false;
    if ($rootScope.pageManager.getParam('backFromDetailList')) {
      // [WOSLQEVENT-89900] 방어 코드 1
      backFromDetailList = true;
    }

    if (backFromDetailList || device.isBreadcrumbsClicked) {
      response = device.prevListData;
      response.startIndex = 0;
      //$scope.listData.loaded = response.itemList.length;
      $rootScope.pageManager.setParam('backFromDetailList', false);
      device.isBreadcrumbsClicked = false;
      backFromDetailList = true;
    }

    if ($rootScope.pageManager.getParam('filterList')) {
      // [WOSLQEVENT-89900] 방어 코드 2
      backFromDetailList = true;

      if (response) {
        response.filterList = $rootScope.pageManager.getParam('filterList');
        $rootScope.pageManager.setParam('filterList', undefined);
      }
    }

    if (!response) {
      $rootScope.spinner.hideSpinner();
      return;
    }

    Object.keys($scope._ctrls).forEach(function(name) {
      $scope._ctrls[name].drawed = false;
    });

    var moduleName = $scope.findModuelName();
    if (($scope.scopeName !== '') && ($scope.scopeName !== response.scopeName)) {
      // drawer에서 다른 menu가 선택되었을 때
      return;
    }
    if (requestedAppends && response.startIndex === 0) {
      // scroll을 최하단으로 내렸을 때
      $rootScope.spinner.hideSpinner();
      return;
    }

    // cache된 data가 수정되어서 deep copy 수행
    var responseData = {};
    angular.copy(response, responseData);

    if (!responseData.itemList || !responseData.filterList) {
      errorCode = moduleName + ".001"; // No data
      //TODO : loggingApi.log({'logLevel' : GLOBAL_CONSTANT.LOG_LEVEL.ERROR
      //        errorCode : errorCode,responseDataData : responseData});
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId();
      // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가
      // 발생한 scope로 수정
      $rootScope.pageManager.movePageError(errorCode, $scope);
      return;
    }

    // option filter 부분을 하드코딩으로 menu list 하에 setting함
    $scope.tmpE = e;
    $scope.tmpData = null;
    $scope.tmpData = responseData;
    var i, j, idx = 0, name, menuList = [];
    var tempFilter, cpData;

    if (responseData.menuList) {
      for (i = 0 ; i < responseData.menuList.length ; i++) {
        // 서버 데이터 정리되면 다시 코딩 예정
        if(responseData.menuList[i].code == 'ME2212' ||
          responseData.menuList[i].code == 'ME2312' ||
          responseData.menuList[i].code == 'ME2214' ||
          responseData.menuList[i].code == 'ME2314') {
          if(device.tierType === '1.5' &&
            responseData.menuList[i].selected &&
            responseData.filterList.length > 0) {
            responseData.menuList[i].length = responseData.filterList.length;
          } else {
            // console.log('list.onDraw, responseData.menuList[i].code=' + responseData.menuList[i].code);
            if (!backFromDetailList) {
              if(responseData.menuList[i].code === 'ME2312' &&
                (targetMenu === 'ME2312' || !targetMenu)) {
                responseData.filterList = {};
              } else if(responseData.menuList[i].code === 'ME2314' && targetMenu === 'ME2314') {
                responseData.filterList = {};
              }
            }
            responseData.menuList[i].length = 0;
          }
          menuList[idx] = responseData.menuList[i];
          idx++;
        } else if(responseData.menuList[i].code == 'ME2220' || responseData.menuList[i].code == 'ME2320') {
          if(responseData.filterList.length === 2 && responseData.filterList[0].key === 'FILTER_ORDER') {
            // 서버에서 정렬 필터 데이터를 받는데 필요없으므로, 항상 [0]을 사용하도록 순서를 변경
            tempFilter = responseData.filterList[0];
            responseData.filterList[0] = responseData.filterList[1];
            responseData.filterList[1] = tempFilter;
          }

          responseData.menuList[i].length = 8;
          menuList[idx] = responseData.menuList[i];
          idx++;
        } else {
          responseData.menuList[i].length = 0;
          menuList[i] = responseData.menuList[i];
          idx++;
        }
  //      } else {
      }
    }

    responseData.menuList = [];
    for(i = 0; i < menuList.length; i++) {
      responseData.menuList[i] = menuList[i];
    }

    if (requestedAppends && $scope.listData.itemList && (responseData.itemList.length === 0)) {
      // At the bottom, return!
      $rootScope.spinner.hideSpinner();
      return;
    }

    // exec cp list 재구조화 : 20150901
    for(i=0; i<responseData.itemList.length;i++) {
      if(responseData.itemList[i].execCpList &&
        (responseData.itemList[i].execCpList.length > 0) &&
        !responseData.itemList[i].execCpList[0].iconUrl) {
        for(j=0; j<responseData.itemList[i].execCpList.length; j++) {
          cpData = util.cpInfo(responseData.itemList[i].execCpList[j]);
          responseData.itemList[i].execCpList[j] = cpData;
        }
      }
      if (responseData.itemList[i].img !== undefined && responseData.itemList[i].img === '') {
        responseData.itemList[i].img = 'default-img'; // When the ng-src is empty String(''), Angularjs cannot bind error. ( But html template is src, it can bind error. )
      }
    }

    var append = updateFilter(responseData.filterList) && requestedAppends;
    if ($scope.listData) {
      if (append && responseData.startIndex > 0) {
        $scope.listData.itemList = $scope.listData.itemList.concat(responseData.itemList);
      } else {
        $scope.listData.itemList = responseData.itemList;
        $scope.listData.filterList = responseData.filterList;
      }
      $scope.listData.total = responseData.total;
      $scope.listData.loaded = $scope.listData.itemList.length;
      $scope.listData.startIndex = responseData.startIndex;
      update = true;
    } else {
      $scope.listData = responseData;
      $scope.scopeName = responseData.scopeName;
      switch ($scope.scopeName) {
        case 'tvshows':
          $scope.title = storage.getHeadTitle('tvshows');
          $scope.nodata = msgLang.tvShow_nodata;
          $rootScope.pmLogValue = pmLog.TYPE.TVSHOWS;
          break;
        case 'movies':
          $scope.title = storage.getHeadTitle('movies');
          $scope.nodata = msgLang.movie_nodata;
          $rootScope.pmLogValue = pmLog.TYPE.MOVIE;
          break;
      }
      $rootScope.pageManager.setTitle($scope.title);
      update = false;
    }

    findSelectedMenu(responseData.menuList);

    $scope.listData.skinType = responseData.skinType;
    $scope.setMenu($scope.selectedMenu);// 메뉴 리스트 fadeIn 처리(API 재구조화 이후 executeAction 처리 예정)

    /* AD show */
    // if(device.adFeatured && device.adProvider) $rootScope.depth2Ad.showAD();

    $scope.$digest();

    if (!update) {
      arr = $element[0].getElementsByClassName('menu-list');
      l = arr.length;
      for (i = 0; i < l; i++) {
        if(angular.element(arr[i]).hasClass('blank')) {
          $scope.setMouseEvent(arr[i]);
        }
      }
      subArr = $element[0].getElementsByClassName('menu-depth-header');
      k = subArr.length;
      for (i = 0; i < k; i++) {
        $scope.setMouseEvent(subArr[i]);
      }
      playArr = $element[0].getElementsByClassName('icon-player');
      l = playArr.length;
      for (i = 0; i < l; i++) {
        $scope.setMouseEvent(playArr[i]);
      }

      $element[0].removeAttribute('ng-class');
    }
    // menu click 후 submenu category
    if($element[0].getElementsByClassName('menu-list-depth').length > 0){
      depthArr = $element[0].getElementsByClassName('menu-list-depth');
      l = depthArr.length;
      for (i = 0; i < l; i++) {
        $scope.setMouseEvent(depthArr[i]);
      }
    }

    Object.keys($scope._ctrls).forEach(function(name) {
      $scope._ctrls[name].scope.onDraw($scope.listData, update, requestedAppends);
    });

    requestedAppends = false;

    // 장르 클릭 시 로깅되지 않는 이슈 (executeAction에 있는 것 주석처리) - 첫 로딩시 제외
    if (!isFirst) {
      pmLog.write(pmLog.LOGKEY.SECOND_MENU_CLICK, {
          menu_name : $rootScope.pmLogValue,
          sub_menu_name : $scope.selectedMenu,
          sub_sub_menu_name : $scope.selectedCategory || ''
      });
    }
  };

  /* AD 광고
  var displayAD = function(e) {
    e.preventDefault();
    var adRes = adManager.adResponse[adManager.curModule];
//    $rootScope.depth2Ad.adRes = adRes;
    $rootScope.depth2Ad.showAD(adRes);
  };
   */

  var hideList = function(e, page) {
    e.preventDefault();

    if (page != $scope.scopeName) {
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

          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, undefined, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $scope.showing = true;
            $scope.setShowAllImage(true);
          });
        }
      }
      var endTime = new Date().getTime();
      console.info('%c [PERFORMANCE]  : 2Depth ' + $scope.findModuelName() + ' LOADING TIME : ' + (endTime - device.startTime) + '   ', 'background-color:green;color:white');
      return;
    }

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      // $timeout(function() {
        Object.keys($scope._ctrls).forEach(function(name) {
          $scope._ctrls[name].scope.onHide();
        });

        $element.remove();
        $scope.$destroy();
      // }, timeOutValue.DESTROYING);
    });
  };

  ///////////////////////////////////////////////////////////////////////////
  var showAllImage = false;

  $scope.getShowAllImage = function() {
    return showAllImage;
  };

  $scope.setShowAllImage = function(show) {
    // console.log('list.setShowAllImage, show=' + show);
    showAllImage = show;

    if (show) {
      $scope.$broadcast('lazyImage');
    }
  };
  ///////////////////////////////////////////////////////////////////////////

  $scope.initialize = function() {
    $scope.$on(eventKey.LIST_TVMOVIE, onDraw);
    $scope.$on(eventKey.MENU_LOADED, onMenuLoaded);
    $scope.$on('hiding', hideList);
    $scope.$on('focus', focusHandler);
    $scope.$on(eventKey.RECOVER_FOCUS, $scope.recoverFocus);
//    $scope.$on(eventKey.DEPTH2_AD_LOADED, displayAD);
    $scope.$on(eventKey.LIST_PAGE_UP_DOWN, pageUpDownByChKey);
    isFirst = true;
  };

  $scope.initialize();
});
