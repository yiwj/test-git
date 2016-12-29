app.directive('season', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'seasonController',
    //templateUrl: './resources/html/season.html'
    template: seasonTmpl
  };
});

app.controller('seasonController', function($scope, $controller, $element, $rootScope, server, focusManager, keyHandler, marquee, util, device, membership, billing, appService, storage, popupService, pmLog, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var STEP_POSITION = 100;

  var focusElement = null;
  var lastFocus = {};
  var lastItemFocus = {};
  var scroll = null;
  var scrollBar = {};
  var previousPosition = 0;
  var maxPosition = 0;
  var detailHeight = 0;
  var scrollByKey = false;
  var pageHeight = 0;
  var owner = null;

  $scope.row = [];
  $scope.toBeDelScope = null;
  $scope.scopeName = 'season';
  $scope.focusItem = '';
  $scope.hide = true;
  $scope.open = false;
  $scope.drawed = false;
  $scope.type = '';
  $scope.scroll = undefined;

  $scope.arrowStyle = {};

  $scope.setFocusItem = function(item, element) {
    // console.log('season.setFocusItem, item=' + item);
    var i, j, y;

    if (lastFocus.item == 'back' || lastFocus.item == 'errorCode') {
      $rootScope.tooltip.hideTooltip();
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
      focusManager.setCurrent($scope, item, element);
      lastFocus.item = item;
      lastFocus.element = element;
      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }

    if ($scope.focusItem == 'errorCode') {
      $rootScope.tooltip.showTooltip(1815, 829, $scope.tooltipMsg, true, true);
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
    if ($rootScope.isSeasonNewPage) {
      if (scope.getScopeElement()[0]) {
        var tmpElement = scope.getScopeElement()[0];
        if (tmpElement.querySelector('[select=true] .text') && tmpElement.querySelector('[select=true] .text').innerText.length > 0) {
          enterSound = tmpElement.querySelector('[select=true] .text').innerText;
        }
        $rootScope.isSeasonNewPage = false;
      }
    }

    var contentName = null;
    if (element && element.querySelector('.focus .text')) {
      contentName = element.querySelector('.focus .text').innerText;
    }

    if (enterSound.length > 0) {
      params.text = enterSound;
      params.text += ". ";
      params.text += msgLang.audio_filter_check;

      // [QEVENTSIXT-9261] Season 항목명을 중복으로 발화함
      if (enterSound !== contentName) {
        params.text += ". ";
        params.text += contentName;
      }
    } else if (contentName) {
      // [QEVENTSIXT-9260] checked / unchecked 발화하지 않고, focused item명만 발화함
      params.text = contentName;
      if (element.classList.contains('on')) {
        params.text += ". ";
        params.text += msgLang.audio_filter_check;
      } else {
        params.text += ". ";
        params.text += msgLang.audio_filter_uncheck;
      }
    } else {
      return;
    }

    audioGuidance.call(params);
  };

  $scope.recoverFocus = function() {
    $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  $scope.executeAction = function() {
    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if(target.indexOf('item') >= 0 && target.indexOf('Btn') < 0) {
        // pmlog season
        pmLog.write(pmLog.LOGKEY.OTHER_SEASON_CLICK, {
          menu_name : 'other seasons',
          season : focusElement.innerText, //target,
          contents_id : focusElement.getAttribute('item-id')
        });

        var isSelect = focusElement.getAttribute('select');// 같은 시즌/에피소드 선택 시 해당화면 유지함
        if(isSelect == 'true') {
          $scope.hidePopup();
          return;
        }

        if($scope.type=='episode') {
          $rootScope.pageManager.setParam('preData', $scope.preData);
        }
        owner.isInLink = true;
        owner.direct = false;
        owner.showing = false;
        var menu = $scope.module;
        itemId = menu + '|' + focusElement.getAttribute('item-id');
        owner.toBeGoScope = itemId;
        $rootScope.draw({
          page: 'detailList',
          module: itemId,
          inLink: owner.isInLink
        });
        $scope.hidePopup();
      }
    }
  };


  var updateRow = function() {
    var k, l, obj;

    $scope.splitCount = 0;
    $scope.itemRowCount = 0;
    $scope.row = [];
    k = 0;

    obj = $scope.data;

    if (obj.items && obj.items.length > 0) {
      l = obj.items.length;
      for (var i = 0 ; i < l; i++) {
        $scope.row[i] = {
          type: 'season', id: k, index: i, count: 1, prefix: ('season' + '-' + i)
        };

        // [WOSLQEVENT-104726] 문구의 ...이 좌측에 표시되어 있으나, marquee는 우에서 좌로 동작함
        if (device.isRTL) {
          var englishOnly = false;
          englishOnly = !util.rtlPattern(obj.items[i].name);
          if (englishOnly) {
            obj.items[i].isLTR = true;
          }
        }
      }
    }
  };

  $scope.showSeason = function(scope, param) {
    // console.log('season.showSeason');
    $rootScope.isSeasonNewPage = true;
    var obj, seasonObj, seasonArr, l;
    try {
      owner = scope;
      $scope.$broadcast('scopeName', 'postScroll');// 상세페이지 scroll 로 인한 이중 scroll 생김으로 scopeName 변경하여 포커스 오작동 방지위해

      focusManager.setState('season', true);
      $scope.type = param.type;
      $scope.module = param.module;
      $scope.data = param.data;
      $scope.preData = param.preData;
      $scope.top = param.top;
      $scope.left = param.left;
      $scope.height = param.height;
      var scrollToY;

      $scope.hide = false;
      $scope.$digest();

      // popup 위치 지정
      var drawerH = document.getElementsByClassName('drawer')[0].offsetHeight;
      var seasonH = $element[0].offsetHeight;

      $scope.popStyle = {};

      // 화살표 만큼 오른쪽이로 이동
      if(device.isRTL) {
        $scope.popStyle.left = $scope.left-30 + 'px';
      } else {
        $scope.popStyle.right = $scope.left+30+ 'px';
      }

      if (param.data.items.length < 3) {
        // item이 1개 또는 2개 인 경우, 최상단에 화살표 위치
        $scope.popStyle.top = $scope.top - 15 + 'px';
        $scope.arrowStyle = {};
      } else if (param.data.items.length >= 3) {
        // item이 3개 이상인 경우, 2번째 item에 화살표 위치
        $scope.popStyle.top = $scope.top - $scope.height - 15 + 'px';
        $scope.arrowStyle = {top: '4.3rem'};
      }

      var usingCursor;
      if(window.PalmSystem && window.PalmSystem.cursor.visibility) {
        // [QEVENTSIXT-5965]  seasons 항목 뒤에 ... 붙은 상태로 marquee 동작함
        // 커서로 작동중일 때
        usingCursor = true;
      }

      var elements = $element[0].getElementsByClassName('option-list');
      l = elements.length;
      for (var i = 0; i < l; i++) {
        // mouse event
        $scope.setMouseEvent(elements[i]);

        // set default focus
        if (elements[i].classList.contains('on')) {
          if(!usingCursor) {
            var item = elements[i].getAttribute('item');
            marquee.setTarget(null);
            $scope.setFocusItem(item, elements[i]);
            focusManager.setCurrent($scope, item);
          }

          if (elements[i].offsetTop > 380) {
            // 처음 보이는 영역에 안나타나는 높이임
            scrollToY = elements[i].offsetTop - scroll.wrapperH;
            scrollToY += elements[i].getBoundingClientRect().height;
          }
        }
      }

      if(usingCursor) {
        // 현재 커서가 detailList의 episode 버튼에 있을 것이기 때문에,
        // season에서는 focus item이 없는 상태임.
        $scope.setFocusItem('', null);
        focusManager.setCurrent($scope, '');
      }

      pageHeight = $element[0].getElementsByClassName('pop-opt-cont').offsetHeight;
      updateRow();
      $scope.$digest();

      obj = $element[0].getElementsByClassName('season-scroller')[0];
      obj.style.paddingBottom = '5px';      // [WOSLQEVENT-117852] 가장 아래 list에 포커스가 가 있어도 Text의 아랫부분이 짤림
      obj.style.height = pageHeight + 'px';
      $element[0].removeAttribute('ng-class');
      util.async(function() {
        $scope.open = true;
        $scope.drawed = true;
        initializeScroll();
        restoreScrollPos(undefined, scrollToY);
        $scope.$digest();
      });
      util.async($scope.scrollRefresh);
    } catch(e) {
      focusManager.setState('season', false);
      var errorCode = $scope.scopeName + '.002';
      var popOpts = {popupTitle: msgLang.alert_adult_3_2, popupDesc: msgLang.alert_adult_3_5, errorCodeMsg: errorCode, type: 'error'};
      $rootScope.popupApp.showPopup($scope, popOpts);
    }
  };

  $scope.hidePopup = function(key) {
    focusManager.setState('season', false);

    $scope.open = false;
    $scope.$digest();

    if (owner === null) return;
    owner.recoverFocus($scope.scopeName);

    if ($scope.open === false) {
      $scope.hide = true;
      $scope.$digest();
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
    option.useTransform = true;
    option.onPositionChange = move;

    var scrollH = 0, element = $element[0].getElementsByClassName('wrap-opt-list')[0];
    if($element[0].getElementsByClassName('season-scroller')[0].offsetHeight > $element[0].getElementsByClassName('pop-opt-cont')[0].offsetHeight) {
      scrollH = $element[0].getElementsByClassName('scroll')[0].offsetWidth;
    }
    if(element.style.width != ''
      || element.offsetWidth != element.offsetWidth) {
      element.style.width = '';
      element.style.width = element.offsetWidth - scrollH + 'px';
    } else {
      element.style.width = element.offsetWidth + 'px';
    }
    scroll = new iScroll($element[0].getElementsByClassName('pop-opt-cont')[0], option);
    $scope.scroll = scroll;

    $element[0].getElementsByClassName('pop-opt-cont')[0].onmousewheel = function(e) {
      util.async($scope.scrollRefresh);
      if (scroll.wrapperH >= scroll.scrollerH) return;
      if (focusManager.preExecution()) return;
      if (e.wheelDelta < 0 && scroll.y > 0) return;
      if (e.wheelDelta > 0 && scroll.y < scroll.maxScrollY) return;
      scroll.scrollTo(0, e.wheelDelta * -3, 300, true);
    };
  };

  var getItemPositionByItemId = function(itemClass, itemId) {
    var i, r, c, itemRow, target, indexWithSplit = 0;

    element = $element[0].getElementsByClassName(itemClass);
    if (element && (element.length > 0)) {
      var temp = element[0].getAttribute('item-id');
      if (temp === itemId) {
        return {
          top: element[0].offsetTop,
          bottom: element[0].offsetTop + element[0].offsetHeight
        };
      }
    }
  };

  var restoreScrollPos = function(reset, scrollToY) {
    var scrollY, oldScrollY, param, itemId, result, element, itemHeight;

    var rowYFrom;
    var rowYTo;
    var scrollYFrom;
    var scrollYTo;

    if (scrollToY) {
      scroll.scrollTo(0, scrollToY, 300, true);
      return;
    }

    scrollResetting = true;
    param = $rootScope.pageManager.peekHistory();

    if (param) {
      oldScrollY = $rootScope.pageManager.getParam('scrollY');
      oldScrollY *= -1;

      itemClass = $rootScope.pageManager.getParam('itemClass');
      item_id = $rootScope.pageManager.getParam('item-id');
      if (itemClass) {
        result = getItemPositionByItemId(itemClass, item_id);
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

    obj = $element[0].getElementsByClassName('pop-opt-cont')[0];
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

    if ($scope.defaultFocusItemClass) {
      itemClass = $scope.defaultFocusItemClass;
      $scope.defaultFocusItemClass = '';
    } else {
      itemClass = 'option-list';
    }

    target = $element[0].getElementsByClassName(itemClass)[0];
    if (target) {
      item = target.getAttribute('item');
      marquee.setTarget(null);

      $scope.setFocusItem(item, target);
      focusManager.setCurrent($scope, item);
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

  $scope.moveFocusByKey = function(keyCode) {

    var hidden, name, element, rowIndex;
    var l = $scope.row.length;

    row = parseInt($scope.focusItem.split('-')[2]);

    switch (keyCode) {
      case keyHandler.LEFT:
//        focusManager.setState('season', false);
//        $scope.setFocusItem('', null);
//        $scope.hidePopup();
//
//        $scope.$apply();
        break;
      case keyHandler.UP:
        rowIndex = row - 1;
        if(rowIndex < 0) {
          // $scope.direction에 상관없이 가장 상단에서 up키 눌렀을 때, 시즌이 닫혀야 한다.
          // http://nebula.lgsvl.com/enyojs/strawman/?Moonstone#ContextualPopupSample 샘플 팝업 참조.
          //if($scope.direction == 'top') {
          focusManager.setState('season', false);
          $scope.setFocusItem('', null);
          $scope.hidePopup();

          $scope.$digest();
          //}
          return;
        }
        name = 'item-' + $scope.row[rowIndex].prefix.split('-')[0] + '-' + rowIndex;
        element = $element[0].getElementsByClassName(name)[0];
        // scroll
        scrollY = element.getBoundingClientRect().top - scroll.wrapperOffsetTop - scroll.y;
        if (scrollY < -scroll.y) {
          hidden = true;
          scrollY = -scrollY;
        }
        break;
      case keyHandler.RIGHT:
        if (($element[0].getElementsByClassName('scroll-prev')[0].style.display === 'none') &&
          ($element[0].getElementsByClassName('scroll-next')[0].style.display === 'none')) {
          // [WOSLQEVENT-117280] Audio guidance를 켜놓고 확인해보면 해당 컨텐츠의 Season이
          // 몇개 없어서 contextual 팝업에 scroll이 생성되지 않았으나 Scroll 버튼으로 포커스가 가는 것처럼 발화합니다.
          return;
        }

        rect = {
          x: 0,
          y: focusElement.offsetTop + scroll.y,
          width: 0,
          height: focusElement.clientHeight
        };
        $scope.$broadcast('focus', 'scroll', keyCode, rect);
        return;
        break;
      case keyHandler.DOWN:
        rowIndex = row + 1;
        if(rowIndex > ($scope.row.length - 1)) {
          // $scope.direction에 상관없이 가장 상단에서 up키 눌렀을 때, 시즌이 닫혀야 한다.
          // http://nebula.lgsvl.com/enyojs/strawman/?Moonstone#ContextualPopupSample 샘플 팝업 참조.
          //if($scope.direction == 'bottom') {
          focusManager.setState('season', false);
          $scope.setFocusItem('', null);
          $scope.hidePopup();

          $scope.$digest();
          //}
          return;
        }
        name = 'item-' + $scope.row[rowIndex].prefix.split('-')[0] + '-' + rowIndex;
        element = $element[0].getElementsByClassName(name)[0];
        // scroll
        if (!element) return;
        scrollY = element.getBoundingClientRect().top + element.offsetHeight - scroll.wrapperOffsetTop - scroll.y;
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
  }

  var focusToHeader = function(rect) {
    var mid, element;

    mid = $element[0].clientWidth / 2;
    if(focusElement == null) {
      $scope.focusFromScroll();
      var name = 'item-' + $scope.row[0].prefix.split('-')[0] + '-0';
      var element = $element[0].getElementsByClassName(name)[0];
      $scope.setFocusItem(name, element);
    } else {
      $rootScope.$broadcast('focus', 'drawer', keyHandler.UP, rect);
    }
  };

  $scope.focusFromScroll = function(target, watch) {
    var moveToName, min, element, temp, scrollY, obj, name, gap, elementTop, hidden, watchBtnTop;

    if (target == 'header') {
//      focusToHeader({x: $element[0].clientWidth, y: 0, width: 0, height: 0});
      return;
    }
    min = -scroll.maxScrollY + scroll.wrapperOffsetTop;
    for (var i = 0; i < $scope.row.length; i++) {
      obj = $scope.row[i];

      if (obj.type == 'button') continue;
      //back 버튼에서 돌아올 경우 이전에 포커스된 아이템 컨텐츠로 이동한다.
      if (lastItemFocus.item) {
        name = lastItemFocus.item;
      } else {
        name = 'item-' + obj.prefix.split('-')[0] + '-' + obj.index;
      }

      temp = $element[0].getElementsByClassName(name)[0];
      if (target != 'prev') {
        elementTop = temp.getBoundingClientRect().top + temp.offsetHeight - scroll.wrapperOffsetTop - scroll.y;
        gap = Math.abs(elementTop - (-scroll.y + scroll.wrapperH));
      } else {
        elementTop = temp.getBoundingClientRect().top - scroll.wrapperOffsetTop - scroll.y;
        gap = Math.abs(elementTop - (-scroll.y));
      }

      if (min > gap || watch) {
        min = gap;
        scrollY = elementTop;
        element = temp;
        moveToName = name;
      }
    }
    //watch 버튼에서 이전 포커스된 아이템으로 돌아올 경우 스크롤 영역 밖의 아이템에 대한 포커스 기준을 변환한다.
    if (watch && (scrollY + temp.offsetHeight) > (scroll.wrapperOffsetTop + scroll.wrapperH)) {
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

  var initialize = function() {
    $rootScope.season = $scope;
  };

  initialize();
});

