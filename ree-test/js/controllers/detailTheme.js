app.directive('themeDetail', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'themeController',
    //templateUrl: './resources/html/theme.html'
    template: themeTmpl
  };
});

app.controller('themeController', function($scope, $controller, $element, $rootScope, $timeout, server, marquee, focusManager, util, device, keyHandler, pmLog, eventKey, timeOutValue, appService, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var STEP_POSITION = 100;

  var focusElement = null;
  var lastFocus = {};
  var lastItemFocus = {};
  var scroll = null;
  var scrollBar = {};
  var previousPosition = 0;
  var maxPosition = 0;
  var scrollByKey = false;
  var destroyInfo = {scope : $scope, element : $element};
  var execFl = false;
  var shelfName = null;
  var shelfFlag = false;

  $scope.scopeName = 'detailTheme';
  $scope.focusItem = '';
  $scope.toBeDelScope = null;
  $scope.defaultFocusItemClass = '';
  $scope.direct = false;
  $scope.showing = false;
  $scope.hiding = false;
  $scope.title = '';
  $scope.historyBack = $rootScope.pageManager.getTitle('back');
  $scope.subtitle = '';
  $scope.sort = '';
  $scope.selectedMenu = '';
  $scope.itemRowCount = 0;
  $scope.drawed = false;
  $scope.isInLink = $rootScope.pageManager.getLink();
  $scope.themeData = {};
  $scope.recomData = {};
  $scope.trailerData = {};
  $scope.packageData = {};
  $scope.labelData = {};
  $scope.isFree = true;
  $scope.isBR = false;
  $scope.detailsTxt = msgLang._3d_details;
  $scope.useDescMore = false;
  $scope.isDesc = true;
  $scope.scroll = undefined;
  $rootScope.pmLogValue = pmLog.TYPE.THEME;

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

    if ($scope.focusItem == 'back') {
      $rootScope.tooltip.showTooltip(50, 107, $rootScope.pageManager.getTitle('back'), true, true);
    } else if ($scope.focusItem.indexOf('item') >= 0) {
      //이전에 포커스된 아이템 컨텐츠를 저장하여 back 버튼에서 돌아올 경우 이전에 포커스된 아이템 컨텐츠로 이동한다.
      lastItemFocus.item = lastFocus.item;
      lastItemFocus.element = lastFocus.element;
    }
  };

  $scope.audioGuidance = function (scope, target, element) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };
    var enterSound = '';

    if (element && (element.innerText === msgLang.more || element.innerText === msgLang.less)) {
      params.text = element.innerText;  //'more' or 'less'

      //shelf name
      if (element.parentElement.querySelector("[ng-bind='detailsTxt']") && element.parentElement.querySelector("[ng-bind='detailsTxt']").innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector("[ng-bind='detailsTxt']").innerText;
      }
      //synopsis
      if (element.parentElement.querySelector('.synopsis-text.app-detail-text') && element.parentElement.querySelector('.synopsis-text.app-detail-text').innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector('.synopsis-text.app-detail-text').innerText;
      }
    }

    if (params.text.length > 0) {
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
          if (element.parentElement.parentElement.parentElement.querySelector("[ng-bind='detailsTxt']") &&
            element.parentElement.parentElement.parentElement.querySelector("[ng-bind='detailsTxt']").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.parentElement.querySelector("[ng-bind='detailsTxt']").innerText;
          }
          //synopsis
          if (element.parentElement.parentElement.parentElement.querySelector('.synopsis-text.app-detail-text') &&
            element.parentElement.parentElement.parentElement.querySelector('.synopsis-text.app-detail-text').innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.parentElement.querySelector('.synopsis-text.app-detail-text').innerText;
          }
        }
        $rootScope.isNewPage = false;
      }
    }

    var tmpShelfName = null;
    if (element && element.classList.contains('item')) {
      if (element.parentElement.parentElement.querySelector("[ng-bind='themeCategory.categoryTitle']") && element.parentElement.parentElement.querySelector("[ng-bind='themeCategory.categoryTitle']").innerText.length > 0) {
        tmpShelfName = element.parentElement.parentElement.querySelector("[ng-bind='themeCategory.categoryTitle']").innerText;
      }
      if (tmpShelfName !== shelfName) {
        shelfName = tmpShelfName;
        shelfFlag = true;
      }
    } else {
      shelfName = '';
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
    } else if (shelfFlag) {
      itemName = shelfName;
      shelfFlag = false;
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

    audioGuidance.call(params);
  };

  $scope.recoverFocus = function() {
    if (lastFocus.item && lastFocus.element)
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  preExecuteBackCallback = function() {
    $scope.hiding = true;
    $scope.setFocusItem('', null);
    marquee.setTarget(null);
    focusManager.setCurrent($scope, '');

    obj = $rootScope.pageManager.popHistory();
    $rootScope.draw(obj);
  };

  $scope.executeAction = function() {
    if (focusManager.blockExecution()) {
      console.log('detailTheme.executeAction, blockExecution is true');
      return;
    }

    var focusObject, target, obj, page, itemId;

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target == 'back') {
        $rootScope.breadcrumb.executeBack($scope.scopeName);
      } else if (target.indexOf('item-') >= 0) {

        $rootScope.pageManager.setParam('scrollY', scroll.y);
        $rootScope.pageManager.setParam('itemClass', target);
        $rootScope.pageManager.setParam('item-id', itemId);

        itemId = focusElement.getAttribute('item-id');
        var tmpThemeData = $scope.themeData;
        var contentType = focusElement.getAttribute('conts-type');
        var tmpStr = '';

        if (contentType !== "TS" && contentType !== "MV") {
          if (target.indexOf('appsngames') >= 0) {
            page = 'detailApp';
            try {
              if (focusElement.parentElement && focusElement.parentElement.previousElementSibling) {
                tmpStr = focusElement.parentElement.previousElementSibling.innerText;
              }
              pmLog.write(pmLog.LOGKEY.THIRD_SHELF_CLICK, {
                menu_name : pmLog.TYPE.PROMOTION,
                shelf_id : tmpStr,
                contents_id : $element[0].getAttribute('item'),
                shelf_contents_id : itemId,
                shelf_contents_category : pmLog.TYPE.APPGAME
              });
            } catch(e) {}
          } else { // ?? 올수 있나요?
            page = 'detailList';
            itemId = focusElement.getAttribute('conts-type') + '|' + itemId;
          }
          $rootScope.draw({
            page: page,
            module: itemId,
            inLink: true
          });
          execFl = false;
        } else {
          try {
            if (focusElement.parentElement && focusElement.parentElement.previousElementSibling) {
              tmpStr = focusElement.parentElement.previousElementSibling.innerText;
            }
            pmLog.write(pmLog.LOGKEY.THIRD_SHELF_CLICK, {
              menu_name : pmLog.TYPE.PROMOTION,
              shelf_id : tmpStr,
              contents_id : $element[0].getAttribute('item'),
              shelf_contents_id : itemId,
              shelf_contents_category : (contentType === 'TS' ? pmLog.TYPE.TVSHOWS : pmLog.TYPE.MOVIE)
            });
          } catch (e) {}
          tmpStr = null;
          if (tmpThemeData.cpName && tmpThemeData.cpInfo) {
            var params = {
              api: '/discovery2016/item-detail',
              method: 'post',
              apiAppStoreVersion: 'v7.0',
              payload: {
                item_type: 'CONTS',
                item_id: itemId,
                item_detail_type: 'advanced',         // 'advanced' : get all detail data, 'exec': get exec list
                app_id: 'com.webos.app.discovery', // 2016-01-15 로깅 수정요청으로 fix // $element[0].getAttribute('source')
                z_prev_svc: device.onnowLogging
              },
              gubun: contentType
            };
            server.requestApi(eventKey.DETAIL_TVMOVIE, params, destroyInfo);
            execFl = true;
          } else {
            if (target.indexOf('appsngames') >= 0) {
              page = 'detailApp';
            } else {
              page = 'detailList';
              itemId = focusElement.getAttribute('conts-type') + '|' + itemId;
            }
            $rootScope.draw({
              page: page,
              module: itemId,
              inLink: true
            });
            execFl = false;
          }
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
  };

  var drawDetail = function(e, response) {
    var pageHeight, obj, errorCode;
    if ($scope.scopeName != '' && $scope.scopeName != response.scopeName) return;

    if (response.themePage == undefined || response.themePage.themeId == undefined) {
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      errorCode = 'Theme3Depth.400';
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);
    } else {
      $scope.themeData = response.themePage;
      $rootScope.pageManager.setTitle($scope.themeData.themeTitle);
      pageHeight = $element[0].getElementsByClassName('panel-body').offsetHeight;
      $scope.$apply();
      obj = $element[0].getElementsByClassName('detail-scroller')[0];
      obj.style.height = pageHeight + 'px';
      $element[0].removeAttribute('ng-class');
      updateRow();
      //테마상세페이지에서 이미지가 존재하지 않을 경우 html에서 에러나게 수정(방어코드)
      //추가적으로 데이터변경이 필요한 경우 setData함수를 통해 수정
      setData();
      util.async(function() {
        $scope.drawed = true;
        initializeScroll();
        restoreScrollPos();
        $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
      });
    }
  };

  var setData = function() {
    var l, m, obj, objtemp;

    if ($scope.themeData.Category) {
      l = $scope.themeData.Category.length;

      // 패키지앱의 row
      for (var i = 0; i < l; i++) {
        obj = $scope.themeData.Category[i];
        if (obj.contentsCategory == 'movies') {
          m = obj.contents.movieList.length;
          objtemp = obj.contents.movieList;
        } else if (obj.contentsCategory == 'tvshows') {
          m = obj.contents.vodList.length;
          objtemp = obj.contents.vodList;
        }
        for (var j = 0; j < m; j++) {
          if(!objtemp[j].item_img){
            objtemp[j].item_img = (objtemp[j].item_img !=='') ? objtemp[j].item_img :'no image';
          }

          var s = parseFloat(objtemp[j].score);
          if (!isNaN(s) && (s > 0)) {
            objtemp[j].hideScore = false;
            objtemp[j].scoreStyle = {width: parseInt(objtemp[j].score * 10) + '%'};
          } else {
            objtemp[j].hideScore = true;
          }
        }
      }
    }
  };

  var updateRow = function() {
    var k, l, m, obj, maxRow;

    $scope.row = [];
    k = 0;

    // 상세보기의 더보기 버튼 row
    if ($scope.useDescMore) {
      $scope.row[k] = {
        type: 'button', id: k, index: 0, count: 1, prefix: 'descBtn'
      };
      k ++;
    }

    if ($scope.row[k]) k++;
    // 패키지앱의 더보기 버튼 row
    if ($scope.themeData.Category) {
      l = $scope.themeData.Category.length;

      // 패키지앱의 row
      for (var i = 0; i < l; i++) {
        obj = $scope.themeData.Category[i];
        if (obj.contentsCategory == 'appsngames') {
          maxRow = 2;
          var appList = obj.contents.appList.rankTypeList[0].appList;
          m = appList ? appList.length: 0;
        } else if (obj.contentsCategory == 'movies') {
          maxRow = 6;
          m = obj.contents.movieList.length;
        } else if (obj.contentsCategory == 'tvshows') {
          maxRow = 6;
          m = obj.contents.vodList.length;
        }
        for (var j = 0; j < m; j++) {
          if ($scope.row[k] == null) {
            $scope.row[k] = {
              type: 'row', id: k, index: j, count: 1, prefix: (obj.contentsCategory + i)
            };
          } else if ($scope.row[k].count < maxRow) {
            $scope.row[k].count++;
            if ($scope.row[k].count == maxRow) k++;
          }
        }
        if($scope.row[k] != null) k++;
      }
    }
  };

  var initializeDetail = function() {
    var i, m, n, appArr, movArr, btnView, elementH, descH;

    // 상세정보의 더보기 버튼 처리
    if ($element[0].getElementsByClassName('app-detail-text')[0]) {
      //elementH = $element[0].getElementsByClassName('app-detail-text')[0].style.lineHeight.replace('px', '');
      elementH = window.getComputedStyle($element[0].getElementsByClassName('app-detail-text')[0]).lineHeight.replace('px','');
      descH = $element[0].getElementsByClassName('app-detail-text')[0].offsetHeight - 10;
      if (descH > elementH * 3) {
        $scope.useDescMore = true;
        $scope.isDesc = false;
        updateRow(); // 상세정보의 더보기 버튼의 row 생성을 위해 호출
      }
    }

    // button group
    if ($element[0].getElementsByClassName('btn-more')) {
      for (i = 0; i < $element[0].getElementsByClassName('btn-more').length; i++) {
        btnView = $element[0].getElementsByClassName('btn-more')[i];
        $scope.setMouseEvent(btnView);
      }
    }

    // apps list event regist.
    appArr = $element[0].getElementsByClassName('item-apps');
    m = appArr.length;
    for (i = 0; i < m; i++) {
      $scope.setMouseEvent(appArr[i]);
    }

    // tvshows/movies list event register.
    movArr = $element[0].getElementsByClassName('item-detail2'); // 'item-list'
    n = movArr.length;
    for (i = 0; i < n; i++) {
      $scope.setMouseEvent(movArr[i]);
    }

    $scope.$digest();
    util.async($scope.scrollRefresh);
  };

  var hideList = function(e, page) {
    e.preventDefault();

    if ($scope.toBeGoScope) {
      $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
        $scope.hiding = true;
        destroyScope();
      });
    }

    $scope.isInLink = $rootScope.pageManager.getLink('back');
    if ((page != $scope.scopeName || $scope.isInLink) && !$scope.showing) {
      if ($scope.direct == false && $scope.showing == false) {
        if (page == '') {
          $scope.$broadcast('drawFinished');
          $scope.setDefaultFocus();
          $scope.direct = true;
          $scope.toBeGoScope = true;
          $element[0].classList.add('direct');
          $rootScope.breadcrumb.onPageFromDeepLink();
          $timeout(function() {
            $scope.setShowAllImage(true);
            $scope.$broadcast('lazyImage');
          }, 100);
//          $scope.$apply();
        } else {
          $scope.$broadcast('drawFinished');
          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, preExecuteBackCallback, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $scope.setDefaultFocus();
            $scope.showing = true;
            $scope.setShowAllImage(true);
            $scope.$broadcast('lazyImage');
            // $scope.$apply();
          });
        }
      }
      return;
    }

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      // $timeout(function() {
        destroyScope();
      // }, timeOutValue.DESTROYING);
    });
  };

  var requestData = function() {
    var appId, payload, errorCode, head;

    head =  $element[0].getAttribute('head');
    appId = $element[0].getAttribute('item');

    payload = {
      addUrl: appId,
      params: {
        head: head
      }
    };

    try {
      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api : '/discovery2016/themepage/',
          method : 'get',
          apiAppStoreVersion : 'v7.0',
          params : {
            head : head
          },
          addUrl : appId
        };
        server.requestApi(eventKey.THEME_LOADED, params, destroyInfo);
      } else {
        // local json 용
        server.requestTheme(payload);
      }
    } catch (e) {
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      errorCode = 'Theme3Depth.001';
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);
    }
  };

  var move = function(y) {
    scrollBar.move(y, true);
    if (focusManager.getCurrent().scope == $scope && scrollByKey == false) {
      $scope.setFocusItem('', null);
    }
  };

  var initializeScroll = function() {
    var option = {};
    option.onPositionChange = move;
    option.useTransform = false;

    scroll = new iScroll($element[0].getElementsByClassName('panel-body')[0], option);
    $scope.scroll = scroll;

    $element[0].getElementsByClassName('panel-body')[0].onmousewheel = function(e) {
      var deltaY, wheelSpeed = 3;

      e.preventDefault();
      util.async($scope.scrollRefresh);
      deltaY = scroll.y + (e.wheelDelta * wheelSpeed);
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

  $scope.scrollPageUp = function() {
    if (scroll.y > 0) return;
    scroll.scrollTo(0, -200, 300, true);
  };

  $scope.scrollPageDown = function() {
    if (scroll.y < scroll.maxScrollY) return;
    scroll.scrollTo(0, 200, 300, true);
  };

  $scope.scrollRefresh = function() {
    // scroll.scrollerH : ng-show시 0 (removed)
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
    var scrollY, oldScrollY, param, result, itemClass, itemId, rowYFrom, rowYTo, scrollYFrom, scrollYTo;

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

  var destroyScope = function() {
    delete scroll;
    scrollBar = null;
    $element.remove();
    $scope.$destroy();
  };

  $scope.setDefaultFocus = function() {
    var target, item, itemClass;

    if ($scope.defaultFocusItemClass) {
      itemClass = $scope.defaultFocusItemClass;
      $scope.defaultFocusItemClass = '';
    } else {
      if ($scope.row[0]) itemClass = $scope.row[0].type == 'row' ? 'item-' + $scope.row[0].prefix + '-0' : 'item-' + $scope.row[1].prefix + '-0';
    }

    if (itemClass) target = $element[0].getElementsByClassName(itemClass)[0];
    else target = document.getElementsByClassName('breadcrumb')[0];

    if (target) {
      item = target.getAttribute('item');
      $scope.setFocusItem(item, target);
    } else {
      $scope.setFocusItem('', null);
    }
  };

  $scope.removeFocus = function() {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
      $rootScope.tooltip.hideTooltip();
    }
  };

  $scope.moveFocusByKey = function(keyCode) {
    var arr, obj, row, rowIndex, index, item, name, element, hidden, scrollY, rect, prefix, remainCnt, type, tempEl;

    if ($scope.focusItem == '') {
      if (util.isAWSServer()) {
        device.isFocusItem = false;
      }
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    if ($scope.focusItem.indexOf('item') != 0) {
      switch ($scope.focusItem) {
        case 'back':
          moveFocusFromBack(keyCode);
          break;
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
          $rootScope.$broadcast('focus', 'breadcrumbs', function() {
            // right button이 섵택되었을 때 실행될 callback
            moveFocusFromBack(keyHandler.RIGHT);
          });
          return;
        }
        name = 'item-' + prefix + '-' + (index - 1);
        element = $element[0].getElementsByClassName(name)[0];
        scrollY = -1;
        break;
      case keyHandler.UP:
        if (row == 0) { // 첫번째 row이면 drawer 이동
          $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
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
          // row의 남은 컨텐츠가 없고(remainCnt=0) 스크롤의 버튼이 모두 display:non인 경우 오른쪽 이동 불가 처리
          if (document.getElementsByClassName('scroll-prev')[0].style.cssText === 'display: none;'
            && document.getElementsByClassName('scroll-next')[0].style.cssText === 'display: none;') return;
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
        if ($scope.row[row+1] == null ) return;

        if ((index + $scope.row[row+1].count) <= $scope.row[row + 1].index) {
          index = $scope.row[row + 1].index;
        } else {
          index = ($scope.row[row + 1].count + $scope.row[row + 1].index) - 1;
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
        //이전 상품으로 이동해야함.
        $scope.focusFromScroll('prev', true);
        break;
    }
  };

  $scope.focusFromScroll = function(target, back) {
    var moveToName, min, element, temp, scrollY, obj, name, gap, elementTop, hidden, backBtnTop;

    if (target == 'header') {
      $rootScope.$broadcast('focus', 'breadcrumbs', function() {
        // right button이 섵택되었을 때 실행될 callback
        moveFocusFromBack(keyHandler.RIGHT);
      });
      return;
    }
    min = -scroll.maxScrollY + scroll.wrapperOffsetTop;
    backBtnTop = 0;
    for (var i = 0; i < $scope.row.length; i++) {
      obj = $scope.row[i];

      if (!back) {
        name = 'item-' + obj.prefix + '-' + (obj.index + obj.count -1);
      } else {
        if (obj.type == 'button') continue;
        //back 버튼에서 돌아올 경우 이전에 포커스된 아이템 컨텐츠로 이동한다.
        if (lastItemFocus.item) {
          name = lastItemFocus.item;
        } else {
          if (i > 0) continue;
          name = 'item-' + obj.prefix + '-' + obj.index;
        }
        backBtnTop = 220;
      }

      temp = $element[0].getElementsByClassName(name)[0];
      if (target != 'prev') {
        elementTop = temp.getBoundingClientRect().top + temp.offsetHeight - scroll.wrapperOffsetTop - scroll.y;
        gap = Math.abs(elementTop - (-scroll.y + scroll.wrapperH));
      } else {
        elementTop = temp.getBoundingClientRect().top - scroll.wrapperOffsetTop - scroll.y;
        gap = Math.abs(elementTop - (-scroll.y - backBtnTop));
      }

      if (min > gap || back) {
        min = gap;
        scrollY = elementTop;
        element = temp;
        moveToName = name;
      }
    }

    //back 버튼에서 이전 포커스된 아이템으로 돌아올 경우 스크롤 영역 밖의 아이템에 대한 포커스 기준을 변환한다.
    if (back && (scrollY + element.offsetHeight) > (scroll.wrapperOffsetTop + scroll.wrapperH)) {
      target = 'next';
      scrollY += element.offsetHeight;
    }
    if (target == 'prev') {
      if (scrollY < -scroll.y) {
        hidden = true;
        scrollY = -scrollY;
      }
    } else {
      if (scrollY > scroll.wrapperH - scroll.y) {
        hidden = true;
        scrollY = scroll.wrapperH - scrollY;
      }
    }

    if (element) {
      $scope.setFocusItem(element.getAttribute('item'), element);
      if (hidden) {
        scrollByKey = true;
        scroll.scrollTo(0, scrollY, 300, false);
      }
    }
  };

  var focusHandler = function(e, target) {
    var element;

    if (target != 'main') return;
    e.preventDefault();

    $scope.focusFromScroll('prev', true);
  };

  ///////////////////////////////////////////////////////////////////////////
  var showAllImage = false;

  $scope.getShowAllImage = function() {
    return showAllImage;
  };

  $scope.setShowAllImage = function(show) {
    showAllImage = show;
  };
  ///////////////////////////////////////////////////////////////////////////

  var execThemeProcess = function(e, response) {
    if (!execFl) return;

    //themeData.cpName과 해당 contents의 cpList 를 비교하여 cp를 실행
    for(var i = 0 ; i < response.listDetail.item_detail.exec_list.execs.length ; i++){
      if ($scope.themeData.cpName === response.listDetail.item_detail.exec_list.execs[i].exec_app_id) {
        var checkParams = {
          'item_id': response.listDetail.item_id,
          'appId': response.listDetail.item_detail.exec_list.execs[i].exec_app_id,
          'premiumFlag': response.listDetail.item_detail.exec_list.execs[i].premium_app_flag,
          'launchContentId': response.listDetail.item_detail.exec_list.execs[i].exec_id
        };

        // onnow logging 앱실행정보
        appService.writeServerLog(response.listDetail.item_id, response.listDetail.item_detail.exec_list.execs[0].exec_app_id);

        appService.appCheckLaunch(checkParams);
        break;
      }
    }
  }

  $scope.initialize = function() {
    // initialize data
    $scope.$on(eventKey.THEME_LOADED, drawDetail); // 기본 상세정보
    $scope.$on('drawFinished', initializeDetail);
    $scope.$on('hiding', hideList);
    $scope.$on('focus', focusHandler);
    $scope.$on(eventKey.RECOVER_FOCUS, $scope.recoverFocus);
    $scope.$on(eventKey.DETAIL_TVMOVIE, execThemeProcess);  //해당 컨텐츠 실행
    util.async(requestData);
  };

  $scope.initialize();
});
