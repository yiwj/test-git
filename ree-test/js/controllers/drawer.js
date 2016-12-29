app.directive('drawer', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'drawerController',
    //templateUrl: './resources/html/drawer.html',
    template: drawerTmpl,
    link: function($scope, $element) {
    }
  };
});

app.controller('drawerController', function($scope, $controller, $element, $rootScope, $timeout, server, focusManager, device, keyHandler, storage, pmLog, eventKey, searchManager, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var lastFocus = {};

  $scope.scopeName = 'drawer';
  $scope.close = true;
  $scope.command = '';
  $scope.focusItem = '';
  $scope.menuLoaded = false;
  $scope.menu = [];
  $scope.isDrawerLink = false;
  $scope.lineDisplay = false;
  $scope.searchLineDisplay = true;
  $scope.lastMenu = 'featured';

  var drawIcon = function(e, response) {
    var i, l, menu, obj;

    e.preventDefault();

    /*
     * tier3 check logic
     *  : response의 menulist에 premium만 존재하면 tier3 국가로 판단
     */
    var closeBtnFlag = true;  //close 버튼 중복 생성 방지 flag 변수
    if ($scope.menu.length > 0 || (response.menuList && response.menuList.length === 1 && response.menuList[0].serviceCode === 'premium')){
      if(response.menuList && response.menuList.length === 1 && response.menuList[0].serviceCode === 'premium' && document.querySelectorAll('[drawer]')[0]){
        // 2015-10-19 : UX팀 문의 변경 사항 - tier3 exit버튼 추가
        //document.querySelectorAll('[drawer]')[0].remove();
        for (i = 0; i < $scope.menu.length; i++) {
          if ($scope.menu[i].name === 'close') closeBtnFlag = false;
        }

        if (closeBtnFlag) {
          $scope.menu.push({
            name: 'close',
            title: msgLang.close,
            index: 0
          });
        }

        $scope.$digest();
        $element[0].removeAttribute('ng-class');

        for (i = 0; i < $scope.menu.length; i++) {
          obj = $element[0].getElementsByClassName('drawer-' + $scope.menu[i].name)[0];
          $scope.setMouseEvent(obj);
        }
      }
      return;
    }

    $scope.menu.push({
      name: 'featured',
      title: msgLang.title,
      index: 0
    });

    // remove 3d
    response.menuList = response.menuList.filter(function (el) {
      return (el.serviceCode !== '3d');
    });

    menu = response.menuList;

    // 불량 menuList 제거 (menuList 데이터는 오지만 contents 값이 없는 경우를 처리하여 drawer 영역을 그리기 위해 menuList filtering)
    var menuListLen = response['menuList'].length;
    var i = 0;
    for (i = 0; i<menuListLen; i++){
      if (response['menuList'][i].serviceCode === 'tvshows' || response['menuList'][i].serviceCode === 'movies') {
        if (!response['contentsList'][i].contents || (response['contentsList'][i].contents && response['contentsList'][i].contents.length === 0)) {
          response['menuList'].splice(i, 1);
          response['contentsList'].splice(i, 1);
          menuListLen--;
          i = -1;
        }
      }
    }
    i = null;
    menuListLen = null;

    // save menuList
    storage.removeMenuList();
    storage.setMenuList(response.menuList);

    // check if mypage is included
    var isMyPageIncluded = false;
    for (i = 0; i < menu.length; i++) {
      if (menu[i].serviceCode === 'mypage') {
        isMyPageIncluded = true;
      }
    }
    if (!isMyPageIncluded) {
      menu.push({
        'menuText':msgLang.myPage_title,
        'serviceCode':'mypage'
      });
    }

    if (device.tierType === 2) {
      // remove tvshows, movies
      menu = menu.filter(function (el) {
        return (el.serviceCode !== 'tvshows' && el.serviceCode !== 'movies');
      });
    }

    l = menu.length;
    for (i = 0; i < l; i++) {
      $scope.menu.push({
        name: menu[i].serviceCode,
        title: menu[i].menuText,
        index: i + 1
      });
    }
    $scope.menu.push({
      name: 'search',
      title: msgLang.search_title,
      index: l + 1
    });

    // close버튼 추가
    $scope.menu.push({
      name: 'close',
      title: msgLang.close,
      index: l + 2
    });

    $scope.$digest();

    $element[0].removeAttribute('ng-class');

    l = l + 3;
    for (i = 0; i < l; i++) {
      obj = $element[0].getElementsByClassName('drawer-' + $scope.menu[i].name)[0];
      $scope.setMouseEvent(obj);
    }


    $scope.menuLoaded = true;
    if ($scope.command == 'click') {
      $scope.command = '';
    }
  };

  $scope.setFocusItem = function(item, element) {
    // check
    if ($rootScope.prerollAd.show) return;

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
    $scope.focusItem = item;

    if (item != '') {
      focusManager.setCurrent($scope, item);
      lastFocus.item = item;
      lastFocus.element = element;

      if (element) {
        // 동그라미 버튼 하단에 툴팁의 화살표가 위치하기 위하여 좌표 조절
        var zoomRatio = device.isHD ? 0.667 : 1;
        var x = 0; y = 0;
        if (item !== 'close') {
          x = element.offsetLeft + 40 * zoomRatio;
          y = element.offsetTop + 88 * zoomRatio;
        } else {
          x = element.offsetLeft + 30 * zoomRatio;
          y = element.offsetTop + 66 * zoomRatio;
        }
        var dirRight = true;

        if (item === 'close') {
          $rootScope.tooltip.hideTooltip();
        } else {
          if ($rootScope.guide && $rootScope.guide.isViewGuide) return; // when the guide is open, do not show tooltip.
          $rootScope.tooltip.showTooltip(x, y, element.getAttribute('title'), dirRight);
        }
        //home키 누르고 다시 LG Store들어왔을 때 포커스 상실하지 않게 위해 추가
        element.classList.add('focus');
      }
    } else {
      $scope.focusItem = '';
      focusManager.setCurrent($scope, '');
      $rootScope.tooltip.hideTooltip();
    }
    $scope.$digest();
  };

  $scope.audioGuidance = function (scope, target) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };

    //close 버튼일 경우 "Exit app"
    if (target === 'close') {
      params.text = msgLang.audio_exit_app;
      params.text += ". ";
      params.text += msgLang.audio_button_button;
    }

    audioGuidance.call(params);
  };

  $scope.executeAction = function() {
    // check
    if ($rootScope.prerollAd.show) return;

    // network disconect 상황 확인
    if(!device.isOnline) {
      $rootScope.$broadcast(eventKey.NETWORK_ERROR);
      return;
    }
    if (focusManager.blockExecution()) {
      console.log('drawer.executeAction, blockExecution is true');
      return;
    }

    var focusObject, target;
    device.startTime = new Date().getTime();
    focusObject = focusManager.getCurrent();

    if (focusObject.target === 'back') {
      $rootScope.breadcrumb.executeBack($scope.scopeName);
      return;
    }

    if (focusObject.target != $scope.focusItem) {
      focusObject.target = $scope.focusItem;
    }
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target != device.currentPage) {
        if (target !== 'search') $scope.isDrawerLink = true;
        $scope.lastMenu = target; //포커스이동을 위한 마지막 메뉴 저장
        if (target == 'featured') {
          menuClickLog(pmLog.TYPE.MAIN);
          $rootScope.draw({page: 'featured', scope: target});
          //$scope.openDrawer(); // featured page - drawer is opened by default value
        } else if (target == 'tvshows') {
          menuClickLog(pmLog.TYPE.TVSHOWS);
          var module;
          if (device.tierType !== 1.5) {
            module = 'ME2212';
          }
          $rootScope.draw({page: 'list', module: module, scope: target});
        } else if (target == 'movies') {
          menuClickLog(pmLog.TYPE.MOVIE);
          var module;
          if (device.tierType !== 1.5) {
            module = 'ME2312';
          }
          $rootScope.draw({page: 'list', module: module, scope: target});
        } else if (target == 'premium') {
          menuClickLog(pmLog.TYPE.PREMIUM);
          $rootScope.draw({page: 'premiumList', module: 'premium', scope: target});
        } else if (target == 'appsngames') {
          menuClickLog(pmLog.TYPE.APPGAME);
          $rootScope.draw({page: 'listApp', module: device.appsngamesModule, scope: target});
          /*} else if (target == 'shortform') {
           $rootScope.draw({page: 'list3d', module: '_top5'}); // Not Yet Implemented*/
        } else if (target == 'mypage') {
          menuClickLog(pmLog.TYPE.MYPAGE);
          $rootScope.draw({page: 'myPage', module: ''});
          $scope.$apply();
        } else if (target == 'search') {
          menuClickLog(pmLog.TYPE.SEARCH);
          //$scope.isDrawerLink = false;
          //$rootScope.draw({page: 'search', scope: target});
          searchManager.call();
          //[WOSLQEVENT-107637] Search 버튼 클릭했을 때 Search버튼에 포커스가 안없어짐.
          //월래 포커스 상실은 Controller Blur에서 없애주지만 예외처리로 여기서 없애줌.
          var saveFocus = document.querySelector('.focus');
          if(saveFocus){
            saveFocus.classList.remove("focus");
          }
          // [WOSLQEVENT-54187] Search와 이중 focus
          $scope.focusItem = '';
          $scope.$digest();
        } else if (target === 'close') {
          if (device.isTv) {
            window.PalmSystem.close('EXIT_TO_LASTAPP'); // drd-102번 부터 가능
          }
        }
//        focusManager.setCurrent($scope, 'drawer'); //search 클릭 시 focus 오류 발생
        $rootScope.tooltip.hideTooltip();
      } else {
//        focusManager.setCurrent($scope, 'drawer'); //search 클릭 시 focus 오류 발생
      }

    }
  };

  $scope.removeFocus = function(target) {
    if (!target) return;
    $scope.focusItem = '';
    $rootScope.tooltip.hideTooltip($scope.scopeName);
    $scope.$digest();
  };

  $scope.moveFocusByKey = function(keyCode) {
    var i, l, index, rect;

    if ($scope.focusItem == '') {
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    index = -1;
    l = $scope.menu.length;
    for (i = 0; i < l; i++) {
      if ($scope.menu[i].name == $scope.focusItem) {
        index = i;
        break;
      }
    }

    if (keyCode == keyHandler.DOWN) {
      if (device.tierType === 3) {
        var tmpItem = $scope.getScopeElement()[0].querySelector('.drawer-close').getAttribute('item');
        var pagePath = 'header';
        if (tmpItem && tmpItem === 'close') {
          rect = {
            x: lastFocus.element.offsetLeft,
            y: 0,
            width: lastFocus.element.clientWidth,
            height: lastFocus.element.clientHeight
          };
          if(device.currentPage ==='detailApp') {
            pagePath ='main';
          }
          $rootScope.$broadcast('focus', pagePath, keyCode, rect);
        }
        return;
      }
      if (index == -1) {
        if (lastFocus.item && lastFocus.element) {
          $scope.setFocusItem(lastFocus.item, lastFocus.element);
        } else {
          focusItem(0);
        }
      } else {
        rect = {
          x: lastFocus.element.offsetLeft,
          y: 0,
          width: lastFocus.element.clientWidth,
          height: lastFocus.element.clientHeight
        };
        //$scope.closeDrawer();  // header 영역을 close 함
        $rootScope.$broadcast('focus', 'main', keyCode, rect);
      }
    } else if (keyCode == keyHandler.RIGHT) {
      if(index >= 0 && index < l - 1) {
        focusItem(index + 1);
      }
    } else if (keyCode == keyHandler.LEFT) {
      if(index > 0) {
        focusItem(index - 1);
      }
    }
  };

  var focusItem = function(index) {
    var item, name;

    item = $scope.menu[index];
    name = item.name;
    $scope.setFocusItem(name, $element[0].getElementsByClassName('drawer-' + name)[0]);
  };

  var focusHandler = function(e, target, option, rect) {
    var i, l, arr;

    if (target != $scope.scopeName) return;
    e.preventDefault();
    arr = $element[0].getElementsByClassName('drawer-category');
    l = 0;
    var minGap = 100000;
    // featured page인 경우 rect에서 가장 가까운 element를 찾는다.
    if ($rootScope.pageManager.peekHistory() && $rootScope.pageManager.peekHistory().page === "featured") {
      for (i = 0; i < arr.length; i++) {
        var centerPos = arr[i].getBoundingClientRect().left + arr[i].getBoundingClientRect().width / 2.0;
        if(Math.abs(centerPos - rect.x) < minGap) {
          minGap = Math.abs(centerPos - rect.x);
          l = i;
        }
      }
    } else {
      var page = device.currentPage;  // Selection current page's drawer.
      if (page == 'TVShowDetail') {
        page = 'tvshows';
      } else if (page == 'MovieShowDetail') {
        page = 'movies';
      } else if (page === 'detailApp') {
        page = 'appsngames';
        /* 앱 상세페이지 이지만 프리미엄인 Cases */
        if (focusManager.getCurrent().scope.detailAppData) {
          if (focusManager.getCurrent().scope.detailAppData.bPremium === true) {
            page = 'premium';
          }
        // 프리미엄 상세페이지에서 drawer로 이동할 때
        } else if (focusManager.getCurrent().scope.scopeName === 'scroll' && focusManager.getCurrent().target === 'prev') {
          if (focusManager.getPrevious().scope.detailAppData && focusManager.getPrevious().scope.detailAppData.bPremium === true) {
            page = 'premium';
          } else if (focusManager.getPrevious().target === 'premium') {
            page = 'premium';
          }
        }
      }

      /*premium appListCount === 0 일 경우 'no apps' 화면을 표출하나
       defaultFocus 할 곳이 없어 drawer에 rect 을 통한 포커스가 가기 때문에 예외적으로 처리*/
      if (option === 'premium') page = 'premium';

      // 포커스가 적용될 아이템 선택
      for (i = 0; i < arr.length; i++) {
        if (arr[i].getAttribute('item') == page) {
          l = i;
        }
      }
    }
    focusItem(l);
  };

  var menuClickLog = function(clickMenu) {
    pmLog.write(pmLog.LOGKEY.DRAWER_MENU_CLICK, {
      menu_name : clickMenu,
      previous_menu_name : $rootScope.pmLogValue
    });
  };

  $scope.decideLineDisplay = function(param) {
    var delay = 0;
    var lineDecide = false;
    var searchLineDecide = true;
    if (param !== 'featured' && param !== 'search') {
      lineDecide = true;
      searchLineDecide = true;
      if (device.currentPage !== 'search') {
        delay = 600;
      }
    } else if (param === 'featured') {
      lineDecide = false;
      searchLineDecide = true;
    } else if (param === 'search') {
      lineDecide = true;
      searchLineDecide = false;
      delay = 600;
    }
    $timeout(function() {
      if (!lineDecide) {
        $element[0].classList.add('main-drawer');
      } else {
        $element[0].classList.remove('main-drawer');
      }

      if (!searchLineDecide) {
        $element[0].classList.add('search-drawer');
      } else {
        $element[0].classList.remove('search-drawer');
      }
    }, delay);
  };

  var initialize = function() {
    $rootScope.drawer = $scope;
    $scope.$on(eventKey.FEATURED_MAIN, drawIcon);
    $scope.$on(eventKey.DISCOVERY_LOADED, drawIcon);
    $scope.$on('focus', focusHandler);
  };

  initialize();
});
