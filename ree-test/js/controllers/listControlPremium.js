app.directive('listControlPremium', function($compile) {
  return {
    restrict: 'A',
    scope: {},
    controller: 'listControlPremium',
//    templateUrl: './resources/html/listControlPremium.html',
    template: listControlPremiumTmpl,
    replace: true,
    link: function ($scope, $element, $attrs) {
      $scope.listtype = $attrs.listtype;
      $scope.isMyPage = $attrs.ismypage;
    }
  };
});

app.controller('listControlPremium', function($scope, $controller, $element, $attrs,
  $rootScope, $timeout, focusManager, keyHandler, marquee, util, storage, pmLog, device) {
  angular.extend(this, $controller('listControl', {
    $scope: $scope,
    $controller: $controller,
    $element: $element,
    $attrs: $attrs,
    $rootScope: $rootScope,
    focusManager: focusManager,
    keyHandler: keyHandler,
    marquee: marquee,
    util: util,
    storage: storage,
    pmLog: pmLog
  }));

  $scope.visibleNoDataMsg = false;

  var getPerceptualBrightness = function(color) {
    var r = parseInt(color.substring(0,2),16);
    var g = parseInt(color.substring(2,4),16);
    var b = parseInt(color.substring(4.6),16);
    return r*2 + g*3 + b;
  };

  $scope.getPremiumListContentClass = function() {
    var className;
    if ($scope.isMyPage) {
      className = 'list-content';
    } else {
      className = 'premium-list-content';
    }
    return className;
  };

  $scope.getPremiumListScrollBarClass = function() {
    var className;
    if ($scope.isMyPage) {
      className = 'scroll scroll-v list-scroll-bar';
    } else {
      className = 'scroll scroll-v premium-list-scroll-bar';
    }
    return className;
  };

  $scope.getPremiumSplits = function() {
    if (!$scope.listData) {
      // data가 읽혀지기 전
      return [];
    }

    var indexArray = [];
    for (var i = 0 ; $scope.listData.itemList && (i < $scope.listData.itemList.length) ; i++) {
      indexArray.push(i);
    }
    return indexArray;
  };

  $scope.getPremiumCountBySplit = function(split) {
    var count = 0;
    for (var i = 0 ; $scope.listData.itemList && (i < $scope.listData.itemList.length) ; i++) {
      if (i >= split)
        break;
      count += $scope.listData.itemList[i].apps.length;
    }
    return count;
  };

  $scope.getPremiumSplitDate = function(split) {
    var date = $scope.listData.itemList[split].date;
    if($scope.$parent.selectedMenu.indexOf('2_') >= 0) {
      date = util.getSvrLocaleDate(date);
    }
    return date;
  };

  $scope.getPremium = function(split) {
    return $scope.listData.itemList? $scope.listData.itemList[split].apps : [];
  };

  $scope.executeAction = function(params) {
    console.log('listControlPremium.executeAction');
    if (focusManager.blockExecution()) {
      console.log('listControlPremium.executeAction, blockExecution is true');
      return;
    }

    if (params) {
      id = params.focusElement.getAttribute("id");
      item_id = params.focusElement.getAttribute("item-id");

      if (id && item_id) {
        var pageFrom;
        if ($scope.isMyPage) {
          pageFrom = 'myPage';

          // for left menu
          $rootScope.pageManager.setParam('module', params.module);
        } else {
          pageFrom = 'premiumList';
        }
        $rootScope.pageManager.setParam('page', pageFrom);
        $rootScope.pageManager.setParam('scrollY', $scope.scroll.y);
        $rootScope.pageManager.setParam('id', id);
        $rootScope.pageManager.setParam('item_id', item_id);

        pmLog.write(pmLog.LOGKEY.CONTENTS_CLICK, {
          menu_name : 'List Page',
          contents_type : 'Apps',
          contents_category : pmLog.TYPE.PREMIUM,
          contents_id : item_id,
          sub_menu_name : '',
          sub_sub_menu_name : ''
        });

        $rootScope.draw({page: 'detailApp', module: item_id});
      } else {
        console.error('listControlPremium.executeAction, id or item_id is undefined.');
      }
    } else if (focusManager.getCurrent() &&
      focusManager.getCurrent().scope &&
      focusManager.getCurrent().scope.scopeName === 'scroll' &&
      focusManager.getCurrent().scope.$parent === $scope) {
      // WOSLQEVENT-82783
      // [Service.SDPService.LGStore_Common Policy] [Always] [Minor]
      // back key 동작하지 않음
      var target = focusManager.getCurrent().target;
      if (target === 'back') {
        $rootScope.breadcrumb.executeBack($scope.scopeName);
      }
    }
  };

  $scope.onDraw = function(listData, update, appends) {
    console.log('listControlPremium.onDraw begin');

    $scope.listData = listData;

    // if there is not premiumAppList.
    if ($scope.listData.appCount === 0 ){
      $scope.visibleNoDataMsg = true;
      $scope.nodata = msgLang.apps_nodata;
      className = 'type-premium';
    // if there is premiumAppList.
    } else if ($scope.listData.premiumAppList) { // cache issue  // (!$scope.listData.itemList && $scope.listData.premiumAppList)
      // when called from premium.js
      $scope.listData.itemList = $scope.listData.premiumAppList;
      $scope.splitCount = $scope.listData.itemList.length;
      if ($scope.splitCount > 0) $scope.view.s0 = true;
      if ($scope.splitCount > 1) $scope.view.s1 = true;
      if ($scope.splitCount > 2) $scope.view.s2 = true;
      if ($scope.splitCount > 3) $scope.view.s3 = true;
      if ($scope.splitCount > 4) $scope.view.s4 = true;
      $scope.visibleNoDataMsg = false;
      $scope.$apply();
    }


    if (update) {
      if (appends) {
        util.async($scope.scrollRefresh);

        $timeout(function() {
          $scope.$broadcast('loadImage');
          $rootScope.spinner.hideSpinner();
        }, 1000);
      } else {
        util.async(function() {
          $scope.drawed = true;
          $scope.initializeList();
          $scope.initializeScroll();
          $scope.restoreScrollPos(true);

          $scope.$parent.setDefaultFocus();
          $scope.$apply();
        });

        $timeout($rootScope.spinner.hideSpinner, 1000);
      }
    } else {
      util.async(function() {
        $scope.drawed = true;
        $scope.initializeList();
        $scope.initializeScroll();
        $scope.restoreScrollPos(true);

        if (!update) {
          $scope.$parent.onDrawFinished($attrs.name);
        }
      });
    }

    requestedAppends = false;

    console.log('listControlPremium.onDraw end');
  };

  $scope.moveFocusByKey = function(focusElement, focusItem, keyCode, isPageUpDownByChKey) {
    var i, name, element, hidden, scrollY, itemNum, widthSum, listWidth, rect;

    itemPerRow = $scope.isMyPage ? 2 : 3;
    var arr = focusItem.replace('item', '').split('-');
    var splitIndex = parseInt(arr[0]);
    itemNum = parseInt(arr[1]);

    var col = itemNum % itemPerRow;

    widthSum = 0;
    listWidth = focusElement.parentElement.parentElement.offsetWidth;

    switch (keyCode) {
      case keyHandler.LEFT:
        if ((itemNum%itemPerRow) == 0) {
          if ($scope.isMyPage) {
            $scope.$parent.focusToMenu({
              x: 0,
              y: focusElement.parentElement.offsetTop + $scope.scroll.y,
              width: 0,
              height: 0
            });
          } else {
            if (!device.isRTL) {
              $scope.$parent.focusToBack();
            }
          }
          break;
        }
        name = 'item' + splitIndex + '-' + (itemNum - 1);
        element = angular.element(document.getElementById(name))[0];
        break;
      case keyHandler.UP:
        for(i=0; i<=itemNum; i++) {
          widthSum += focusElement.offsetWidth;
        }
        if(widthSum < listWidth) {
          $scope.$parent.focusToBack();
          break;
        }
        name = 'item' + splitIndex + '-' + (itemNum - itemPerRow);
        element = angular.element(document.getElementById(name))[0];

        if(!element && (splitIndex > 0)) {
          // select from next split
          var nthRow = ($scope.listData.itemList[splitIndex - 1].apps.length + itemPerRow - 1) / itemPerRow;

          // element at same column in the last row
          name = 'item' + (splitIndex - 1) + '-' + ((nthRow - 1) * itemPerRow + col);
          element = angular.element(document.getElementById(name))[0];
        }

        if(element !== undefined) {
          scrollY = element.offsetTop;
          if(scrollY < -$scope.scroll.y) {
            hidden = true;
            scrollY = -scrollY;
          }
        } else { //맨 위 row
          //$scope.$parent.focusToBack();
          if (isPageUpDownByChKey && isPageUpDownByChKey.isFrom) return;
          if ($scope.$parent.showFilter) {
            var element = $element.parent()[0].getElementsByClassName('btn-list-option')[0];
            $scope.setFocusItem(element.getAttribute('item'), element);
            return;
          } else {
            rect = {
              x: focusElement.offsetLeft,
              y: focusElement.offsetTop,
              width: focusElement.offsetWidth,
              height: focusElement.offsetHeight
            };
            $rootScope.$broadcast('focus', 'drawer', keyCode, rect);
          }
        }

        break;
      case keyHandler.RIGHT:
        if(itemNum % itemPerRow == (itemPerRow - 1) ||
          itemNum == $scope.listData.appCount - 1) {
          if($scope.scroll.wrapperH < $scope.scroll.scrollerH) {
            rect = {
                x: 0,
                y: focusElement.offsetTop + $scope.scroll.y,
                width: 0,
                height: focusElement.clientHeight
              };
              $scope.$parent.$broadcast('focus', 'scroll', keyCode, rect);
          } else if(device.isRTL) {
            $scope.$parent.focusToBack();
          }
          return;
        }
        name = 'item' + splitIndex + '-' + (itemNum + 1);
        element = angular.element(document.getElementById(name))[0];
        break;
      case keyHandler.DOWN:
        name = 'item' + splitIndex + '-' + (itemNum + itemPerRow);
        element = angular.element(document.getElementById(name))[0];
        if (arr[0] === 'option') {
          if ($element[0].querySelectorAll('.item-premium').length > itemPerRow) {
            name = $element[0].querySelectorAll('.item-premium')[2].getAttribute('item');
            element = $element[0].querySelectorAll('.item-premium')[2];
          } else {
            var length = $element[0].querySelectorAll('.item-premium').length;
            if (length === 0) { //아이템이 없는 경우 return
              return;
            }
            name = $element[0].querySelectorAll('.item-premium')[length-1].getAttribute('item');
            element = $element[0].querySelectorAll('.item-premium')[length-1];
          }
        }

        if(!element && (parseInt(arr[1]) < $scope.splitCount)) {
          // select from next split
          name = 'item' + (splitIndex) + '-' + (itemNum + col);
          element = angular.element(document.getElementById(name))[0];
          //만약 element값을 잘못가지고 온 경우 그 전에 값을 선택해줌(element 재확인 로직 추가)
          // 해당 소스 coㅣ변수값 계산에대한 의문이 드나 다른 소스와 영향도때문에 방어로직으로 수정
          if(element === undefined) {
            name = 'item' + (splitIndex) + '-' + (itemNum + col-1);
            element = angular.element(document.getElementById(name))[0];
          }
        }

        if(element !== undefined) {
          scrollY = element.offsetTop + element.offsetHeight;
          if (scrollY > ($scope.scroll.wrapperH - $scope.scroll.y)) {
            hidden = true;
            scrollY = $scope.scroll.wrapperH - scrollY;
          }
        }
        break;
    }

    if (name && element) {
      if (hidden) {
        scrollByKey = true;
        $scope.scroll.scrollTo(0, scrollY, 300, false);
      }
      $scope.setFocusItem(name, element);
    }
  };

  $scope.initializeList = function() {
    if ($scope.isMyPage) {
      var i, l, j, k, splitTop, itemId, appList, iconColor, defaultVal, iconVal, defaultBhColor = 'afafaf';

      splitTop = -26;
      for (i = 0; i < $scope.listData.itemList.length; i++) {
        view = $element[0].getElementsByClassName('split' + i)[0];
        view.style.top = splitTop + 'px';

        var lineCount = Math.ceil($scope.listData.itemList[i].apps.length / 2);
        splitTop += (lineCount * 200);
      }

      defaultVal = getPerceptualBrightness(defaultBhColor);
      l= $element[0].getElementsByClassName('premium-item').length;

      for(i = 0; i < l; i++) {
        iconColor = undefined;

        view = $element[0].getElementsByClassName('premium-item')[i];

        itemId = view.getAttribute('item-id');

        for (j = 0 ; !iconColor && (j < $scope.listData.itemList.length) ; j++) {
          appList = $scope.listData.itemList[j].apps;

          for (k = 0 ; k < appList.length ; k++) {
            if (appList[k].id === itemId) {
              iconColor = appList[k].iconColor;
              break;
            }
          }
        }

        if (iconColor) {
          view.style.background = iconColor;
          iconVal = getPerceptualBrightness(iconColor.replace('#', ''));

          /* background color 에 따라서 text color 변경 적용 */
          if(iconVal > defaultVal) {
            $element[0].getElementsByClassName('premium-item')[i].getElementsByClassName('premium-item-title')[0].className += ' app_style2';
            $element[0].getElementsByClassName('premium-item')[i].getElementsByClassName('app-info')[0].className += ' app_style2';
          }
        }

        $scope.$parent.setMouseEvent(view);
      }

      util.async($scope.scrollRefresh);
    } else {
      var i, l, view, iconColor, defaultVal, iconVal, defaultBhColor = 'afafaf';

      l= $element[0].getElementsByClassName('item-premium').length;

      if ($scope.listData.appCount > 0) {
        for(i = 0; i < l; i++) {
          view = $element[0].getElementsByClassName('item-premium')[i];

          iconColor = $scope.listData.premiumAppList[i].iconColor;
          view.style.background = iconColor;

          defaultVal = getPerceptualBrightness(defaultBhColor);
          if (iconColor) {
            iconVal = getPerceptualBrightness(iconColor.replace('#', ''));
            /* background color 에 따라서 text color 변경 적용 */
            if(iconVal > defaultVal) {
              $element[0].getElementsByClassName('item-premium')[i].className += ' item-white';
            }
          }
          $scope.$parent.setMouseEvent(view);
        }
      }
      util.async($scope.scrollRefresh);
    }
  };

  $scope.getItemPositionByItemId = function(param) {
    var i, id, item_id, tempId, tempItem_Id, element;
    id = param.id;
    item_id = param.item_id;

    // 'id'을 사용하여 item을 우선 찾아본다.
    // (동일한 'item-id' 값을 가진 item이 여러개인 경우를 대비)
    arr = $element[0].getElementsByClassName('item-premium');
    for (i = 0 ; i < arr.length ; i++) {
      element = arr[i];
      tempId = element.getAttribute("id");
      tempItem_Id = element.getAttribute("item-id");

      if ((tempId === id) && (tempItem_Id === item_id)) {
        return {
          top: element.offsetTop,
          bottom: element.offsetTop + element.offsetHeight,
          item_id: element.getAttribute("id")
        };
      }
    }

    l= $element[0].getElementsByClassName('item-premium').length;
    obj = $element[0].getElementsByClassName('item-premium');

    for(i = 0; i < l; i++) {
      element = $element[0].getElementsByClassName('item-premium')[i];

      tempItem_Id = element.getAttribute("item-id");
      if (tempItem_Id === item_id) {
        return {
          top: element.offsetTop,
          bottom: element.offsetTop + element.offsetHeight,
          item_id: element.getAttribute("id")
        };
      }
    }
  };

  $scope.restoreScrollPos = function(reset) {
    console.log('listControlPremium.restoreScrollPos, reset=' + reset);
    var scrollY, oldScrollY, scrollYFrom, scrollYTo, param, id, item_id, result;

    $scope.scrollResetting = true;

    oldScrollY = $rootScope.pageManager.getParam('scrollY');
    id = $rootScope.pageManager.getParam('id');
    item_id = $rootScope.pageManager.getParam('item_id');
    $scope.$parent.defaultFocusItem_Id = id;

    if (oldScrollY !== undefined) {
      oldScrollY *= -1;
      if (item_id) {
        param = $rootScope.pageManager.peekHistory();
        result = $scope.getItemPositionByItemId(param);
        if (result && result.top && result.bottom) {
          $scope.$parent.defaultFocusItem_Id = result.item_id;

          if (result.top !== undefined) {
            scrollYFrom = oldScrollY;
            scrollYTo = scrollYFrom + $scope.scroll.wrapperH;

            if (result.top < scrollYFrom) {
              // 상단이 위에 숨겨진 경우
              scrollY = result.top;
            } else if (result.bottom > scrollYTo) {
              // 하단이 아래에 숨겨진 경우
              scrollY = oldScrollY + (result.bottom - scrollYTo);
            } else {
              scrollY = oldScrollY;
            }
          }
        }
      }
    }

    if (scrollY) {
      $rootScope.pageManager.setParam('scrollY', undefined);
      $scope.scroll.scrollTo(0, scrollY, 300, true);
      return;
    }

    if ($scope.scroll && reset)
      $scope.scroll.scrollTo(0, 0, 0);
  };

  var getNearContentsElement = function(target) {
    var selected, rect, element;
    var arr = $element[0].getElementsByClassName('item-premium');
    if (arr[0]) {
      selected = arr[0];
      var firstMenuLocation = {
        x : arr[0].offsetLeft + arr[0].offsetWidth/2,
        y : arr[0].offsetTop + arr[0].offsetHeight/2
      };
      //prev {1200, 0}
      //next {1200, 700}
      if (target == 'prev') {
        rect = {x : 1200, y : 0};
      } else {
        rect = {x : 1200, y : 700};
      }
      var gap = Math.abs(rect.x*rect.x - firstMenuLocation.x*firstMenuLocation.x) + Math.abs(rect.y*rect.y - firstMenuLocation.y*firstMenuLocation.y);
      for (i = 0; i < arr.length; i++) {
        var location = {
          x : arr[i].offsetLeft + arr[i].offsetWidth/2,
          y : arr[i].offsetTop + arr[i].offsetHeight/2 + $scope.scroll.y
        };
        if(gap > Math.abs(rect.x*rect.x - location.x*location.x) + Math.abs(rect.y*rect.y - location.y*location.y)){
          gap = Math.abs(rect.x*rect.x - location.x*location.x) + Math.abs(rect.y*rect.y - location.y*location.y);
          selected = arr[i];
        }
      }
    }
    //element = $element[0].getElementsByClassName('item-premium')[0];
    element = selected;
    return element;
  };

  $scope.focusFromScroll = function(target, back, lastItemFocus) {
    var element, hidden, scrollY, rect;

    if (target == 'header') {
      if ($scope.$parent.showFilter) {
        if (focusManager.getCurrent().target === 'prev') $scope.$parent.setLastItemFocus(false);
        else if (focusManager.getCurrent().target === 'next') {
          element = getNearContentsElement('prev');
          $scope.setFocusItem(element.getAttribute('item'), element);
          return;
        }
        element = $element.parent()[0].getElementsByClassName('btn-list-option')[0];
        $scope.setFocusItem(element.getAttribute('item'), element);
      } else {
        rect = {x: 2000, y: 0, width: 0, height: 0};
        $rootScope.$broadcast('focus', 'drawer', null, rect);
      }
      return;
    }
    if (back && lastItemFocus.item) {
      if (lastItemFocus.isFrom) element = lastItemFocus.element;
      else {
        // The last focus was scroll btn.
        rect = {x: 0, y: 250, width: 0, height: 100};
        $scope.$parent.$broadcast('focus', 'scroll', keyHandler.RIGHT, rect);
        return;
      }
      //back에서 이전 포커스된 아이템으로 돌아올 경우 스크롤 영역 밖의 아이템에 대한 포커스 기준을 변환한다.
      if ((element.offsetTop + element.offsetHeight) > ($scope.scroll.wrapperH - $scope.scroll.y)) {
        target = 'next';
      }
    } else {
      element = getNearContentsElement(target);
    }
    if (element) {
      if (target == 'prev') {
        scrollY = element.offsetTop;
        if(scrollY < -$scope.scroll.y) {
          hidden = true;
          scrollY = -scrollY;
        }
      } else {
        scrollY = element.offsetTop + element.offsetHeight;
        if (scrollY > ($scope.scroll.wrapperH - $scope.scroll.y)) {
          hidden = true;
          scrollY = $scope.scroll.wrapperH - scrollY;
        }
      }
      $scope.setFocusItem(element.getAttribute('item'), element);
      if (hidden) {
        scrollByKey = true;
        $scope.scroll.scrollTo(0, scrollY, 300, false);
      }
    }
  };
});
