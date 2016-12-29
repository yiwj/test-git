app.directive('mainTier3', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'mainTier3Controller',
//    templateUrl: './resources/html/mainTier3.html'
    template: mainTier3Tmpl
  };
});


app.directive('tier3ImageResizeHandler', function() {
  return {
    link: function($scope, $element) {
      $element.bind('load', function(e) {
        var w, h, parentH, parentW, imgW, imgH;
        parentH = this.parentElement.clientHeight;
        parentW = this.parentElement.clientWidth;
        imgW = this.naturalWidth;
        imgH = this.naturalHeight;

        w = null;
        h = parseInt(imgH * parentW / imgW);
        rate = (h / parentH).toFixed(2);
        if (rate < 0.8) {
          w = parentW;
          h = null;
        } else if (rate > 1.2) {
          h = parentH;
        } else {
          w = parentW;
          h = parentH;
        }
        this.style.width = w + 'px';
        this.style.height = h + 'px';
        this.style.display = 'block';
      });
      $element.bind('error', function () {
        var defaultImageArray = {
            'AG': './resources/images/thumb/default_app.png'            // Default Apps&Games Image
          }
        ;
        var defaultImgType = $element[0].getAttribute('d-img-type');
        if($element[0].src !== defaultImageArray[defaultImgType]) {
          $element[0].src = defaultImageArray[defaultImgType];
          $scope.$digest();
        }
      });
    }
  };
});


app.directive('tier3AppRecoverable', function() {
  return {
    link: function($scope, $element) {

      $element.bind('load', function(e) {
        $element[0].style.display = 'block';
      });
      $element.bind('error', function(e) {
        $scope.item.src = $scope.item.img;
        $scope.item.img = './resources/images/default_app.png';
      });
    }
  };
});

app.controller('mainTier3Controller', function($scope, $controller, $element, $rootScope, $timeout, server, focusManager, keyHandler, marquee, util, pmLog, device, eventKey, timeOutValue, watchProcess, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var lastFocus = {};
  var scrollBar = {};
  var scrollByKey = false;
  var globalResponse = {};
  var destroyInfo = {scope : $scope, element : $element};

  $scope.scopeName = 'featured';
  $scope.focusItem = '';
  $scope.discoveryData = null;
  $scope.listData = null;
  $scope.columns = [];
  $scope.itemsApp = [];
  $scope.expand = false;
  $scope.direct = false;
  $scope.showing = false;
  $scope.hiding = false;
  $scope.numOfAllCols = 5;
  $scope.scroll = undefined;
  $rootScope.pmLogValue = pmLog.TYPE.MAIN;

  $scope.setFocusItem = function(item, element) {
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
      enterSound = msgLang.title;
      $rootScope.isNewPage = false;
    }

    if (scope.scopeName === 'header') {
      switch (target) {
        case 'left' :
          params.text = msgLang.audio_header_button_left;
          break;
        case 'right' :
          params.text = msgLang.audio_header_button_right;
          break;
        case 'more' :
          params.text = scope.current.name;
          params.text += '. ';
          if (util.isAWSServer()) {
            //[WOSLQEVENT-114776] 한국어 임에도 불구하고 " 더 보기 "를 "More"로 읽음.
            params.text += msgLang.audio_button_more;
          }else{
            params.text += 'more';
          }
          break;
      }
      params.text += '. ';
      params.text += msgLang.audio_button_button;
    } else {
      var contentName = null;
      if (element && element.querySelector('.focus .text')) {
        contentName = element.querySelector('.focus .text').innerText;
      } else if ($scope.showAD && target === "4-0") {
        contentName = msgLang.audio_ad_title;
      }

      if (enterSound.length > 0) {
        params.text += enterSound;
        params.text += '. ';
        params.text += contentName;
      } else if (contentName) {
        params.text = contentName;
      } else {
        return;
      }
    }

    audioGuidance.call(params);
  };

  $scope.recoverFocus = function() {
    if (lastFocus.item && lastFocus.element)
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  $scope.executeAction = function() {
    if (focusManager.blockExecution()) {
      console.log('mainTier3.executeAction, blockExecution is true');
      return;
    }

    // btn-cp-play
    if (focusElement && focusElement.classList.contains('btn-cp-play')) {
      pmLog.write(pmLog.LOGKEY.CONTENTS_PLAY_CLICK, {
        menu_name : 'Main',
        contents_id : focusElement.parentElement.getAttribute('item-id'),
        contents_category : focusElement.parentElement.getAttribute('type')
      });
      var itemId = focusElement.parentElement.getAttribute('item-id');
      watchProcess.execProcess($scope.$id, item, itemId);
      return;
    }

    if(focusElement && focusElement.getAttribute('itemid')){
      pmLog.write(pmLog.LOGKEY.CONTENTS_CLICK, {
        menu_name : 'Main',
        contents_type : 'Apps',
        contents_category : pmLog.TYPE.PREMIUM,
        contents_id : focusElement.getAttribute('itemid'),
        sub_menu_name : '',
        sub_sub_menu_name : ''
      });
      $rootScope.draw({
        page: "detailApp",
        module: focusElement.getAttribute('itemid')
      });
    }
  };

  var drawMain = function(e, response) {
    var index, col, obj, arr, l, defaultVal, iconVal, defaultBhColor = 'afafaf';

    e.preventDefault();

    // 다시 갱신하는 경우에 기존에 있는 자료를 업데이트하거나 제거후 다시 추가하도록 수정 필요. 모든 자식 포함
    if ($scope.discoveryData) {
      pmLog.write(pmLog.LOGKEY.FEATURED_LOG, {
        msg: 'mainTier3.drawMain, exit 1'
      });
      return;
    }

    $scope.discoveryData = response;

    // check main error
    if ($rootScope.isMainError(response)) {
      $scope.direct = true;
      $scope.expand = true;
      $element[0].classList.add('direct', 'expand');
      //$scope.$apply();

      pmLog.write(pmLog.LOGKEY.FEATURED_LOG, {
        msg: 'mainTier3.drawMain, exit 2'
      });
      return;
    }

    $scope.listData = response.contentsList[0].contents;

    col = 0;
    var numOfCols = $scope.numOfAllCols;
    for (i = 0; i < numOfCols; i++) {
      $scope.columns[col + i] = [];
    }

    l = $scope.listData.length;
    arr = $scope.listData;
    for (i = 0; i < l; i++) {
      if (/[1-9]/.test($scope.listData[i].price) == false) {
        $scope.listData[i].displayPrice = msgLang.free;
      } else {
        $scope.listData[i].displayPrice = $scope.listData[i].price;
      }

      $scope.columns[col + (i % numOfCols)].push(arr[i]);

      $scope.listData[i].style = {};
      $scope.listData[i].white = false;
      if ($scope.listData[i].iconColor != undefined) {
        $scope.listData[i].style = {'background-color' : $scope.listData[i].iconColor};
        defaultVal = getPerceptualBrightness(defaultBhColor);
        iconVal = getPerceptualBrightness($scope.listData[i].iconColor.replace('#', ''));

        /* background color 에 따라서 text color 변경 적용 */
        if(iconVal > defaultVal) {
          $scope.listData[i].white = true;
        }
      }

      // 0-0, 1-0, 2-0, 3-0, 4-0// col-row
      // 0-1, 1-1, 2-1, 3-1, 4-1
      arr[i].idx = (i%numOfCols) + '-' + parseInt(i/numOfCols); // 0-0, 1-0, 2-0, 3-0, ...
      //arr[i].idx = parseInt(i / 2) + '-' + (i % 2); // 0-0, 0-1, 1-0, 1-1, 2-0, 2-1, ...
      $scope.itemsApp.push(arr[i]);
    }

    $scope.$broadcast('draw');

    arr = $element[0].getElementsByClassName('item');
    l = arr.length;
    for (i = 0; i < l; i++) {
      obj = arr[i];
      $scope.setMouseEvent(obj);
      divItemThumbbgBlackCss(obj);
    }

    $element[0].removeAttribute('ng-class');

    initializeScroll();
    if (!device.isLite) $scope.scrollRefresh();
    else {
      $timeout(function() {
        $scope.scrollRefresh();
      }, 200);
    }

    $rootScope.pageManager.setTitle(msgLang.title);

    if ($scope.direct) {
      $scope.$emit('finishDraw', $scope.scopeName);
    } else {
      $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
    }
  };

  var getPerceptualBrightness = function(color) {
    var r = parseInt(color.substring(0,2),16);
    var g = parseInt(color.substring(2,4),16);
    var b = parseInt(color.substring(4.6),16);
    return r*2 + g*3 + b;
  };

  var initializeScroll = function() {
    var option = {};
    option.onPositionChange = move;
    option.useTransform = false;

    scroll = new iScroll($element[0].getElementsByClassName('main-body')[0], option);
    $scope.scroll = scroll;

    $element[0].getElementsByClassName('main-body')[0].onmousewheel = function(e) {
      var deltaY, wheelSpeed = 3;
      e.preventDefault();
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

  var hideMain = function(e, page) {
    e.preventDefault();
    if (page != $scope.scopeName) {
      if ($scope.direct == false && $scope.showing == false) {
        if (page == '') {
          $timeout(function() { $scope.setDefaultFocus(); }, 300);
          $scope.direct = true;
          $element[0].classList.add('direct');
          $rootScope.breadcrumb.setRunning(false);
          $scope.$apply();//
          $rootScope.header.hideImage = false;

          $timeout(function() {
            $rootScope.breadcrumb.removeDirectClass();
          }, 300);
        } else {
          $timeout(function() { $scope.setDefaultFocus(); }, 300);

          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, undefined, function() {
            // breadcrumb animation이 종료된 이후 호출되는 callback 임
            $rootScope.breadcrumb.showBreadCrumbs(false);
            $scope.showing = true;
            $rootScope.header.hideImage = false;
          });
        }
      }
      return;
    }

    $rootScope.header.hideImage = true;
    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrumb animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      //$scope.$apply();

      // $timeout(function() {
        $element.remove();
        $scope.$destroy();
      // }, timeOutValue.DESTROYING);
    });
  };

  var move = function(y) {
    scrollBar.move(y, true);
  };

  $scope.setDefaultFocus = function() {
    var target;

    target = $element[0].getElementsByClassName('item')[0];
    if (target)
    {
      $scope.setFocusItem(target.getAttribute('item'), target);
    } else {
      $scope.setFocusItem('', null);
    }
  };

  $scope.removeFocus = function(target) {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
    }
  };

  $scope.scrollRefresh = function() {
    if (scroll) {
      scroll.refresh();
      scrollBar.refresh(scroll.wrapperH, scroll.scrollerH, scroll.y);
    }
  };

  $scope.scrollPageUp = function() {
    if (scroll.y > 0) return;
    scroll.scrollTo(0, -200, 300, true);
  };

  $scope.scrollPageDown = function() {
    if (scroll.y < scroll.maxScrollY) return;
    scroll.scrollTo(0, 200, 300, true);
  };

  $scope.setScrollBarCallback = function(refreshCB, moveCB) {
    scrollBar.refresh = refreshCB;
    scrollBar.move = moveCB;
  };

  var getItem = function(column, index) {
    var element, item = {};
    element = $element[0].querySelector('[item="'+column+"-"+index+'"]');
    if (!element) {
      return;
    }
    item.name = element.getAttribute('item');
    item.element = element;
    return item;
  };

  $scope.moveFocusByKey = function(keyCode) {
    var arr, column, index, rect, item;

    if ($scope.focusItem === '') {
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    arr = $scope.focusItem.split('-');
    column = parseInt(arr[0]);
    index = parseInt(arr[1]);
    switch (keyCode) {
      case keyHandler.LEFT:
        if (column === 0) return;
        item = getItem(column-1, index);
        break;
      case keyHandler.UP:
        if (index === 0) {
          rect = getCurrItemRect(focusElement);
          $scope.$broadcast('focus', 'header', keyCode, rect);
          return;
        }
        item = getItem(column, index-1);
        break;
      case keyHandler.RIGHT:
        if ($scope.getScopeElement()[0] && !$scope.getScopeElement()[0].querySelector('[item="' + (column + 1) + '-' + index + '"]')) {
          rect = {
            x: 0,
            y: focusElement.offsetTop + scroll.y,
            width: 0,
            height: focusElement.clientHeight
          };
          // check if scroll exists
          if ($element[0].querySelector('[item="prev"]').style.display !== 'none' &&
            $element[0].querySelector('[item="next"]').style.display !== 'none') {
            $scope.$broadcast('focus', 'scroll', keyCode, rect);
          }
          return;
        }
        item = getItem(column + 1, index);
        break;
      case keyHandler.DOWN:
        item = getItem(column, index + 1);
        if (!item) return;
        break;
    }

    if (item) {
      focusItemAndScrolling(item.element);
    }
  };

  var focusItemAndScrolling = function(element){
    var hidden = false;
    var scrollY = element.offsetTop + element.offsetHeight;
    var scrollYup = element.offsetTop;
    if (scrollY > (scroll.wrapperH - scroll.y)) {
      hidden = true;
      scrollY = scrollY - scroll.wrapperH;
    } else if (scrollYup < -scroll.y) {
      hidden = true;
      scrollY = -(scroll.y + scrollYup)+scroll.y;
      scrollY = -scrollY;
    }
    $scope.setFocusItem(element.getAttribute('item'), element);
    if (hidden) {
      scrollByKey = true;
      scroll.scrollTo(0, -scrollY, 300, false);
    }
  };

  var getNearestRecom = function(fromTarget) {
    var fromTargetLocation = 0;
    var NearestRecom = null;
    var min, element;
    var gap = 0;
    if (fromTarget == 'prev') {
      fromTargetLocation = -scroll.y;
    }else if (fromTarget == 'next'){
      fromTargetLocation = -scroll.y+ $element[0].getElementsByClassName('scroll-area')[0].offsetHeight;
    }
    for (i = 0; i < $element[0].getElementsByClassName('item').length; i++) {
      if (i === 0) {
        element = $element[0].getElementsByClassName('item')[i];
        min = Math.abs(fromTargetLocation - element.offsetTop);
        NearestRecom = element;
      } else if (i % $scope.numOfAllCols === $scope.numOfAllCols - 1) {
        element = $element[0].getElementsByClassName('item')[i];
        gap = Math.abs(fromTargetLocation - element.offsetTop);
        if (gap <= min) {
          min = gap;
          NearestRecom = element;
        }
      }
    }
    return NearestRecom;
  };

  $scope.focusFromScroll = function(target, menu) {
    var hidden;
    var element = null;
    if (target == 'header') {

      return;
    } else if (target == 'prev') {
      element = getNearestRecom('prev');
      focusItemAndScrolling(element);
      return;
    } else if (target == 'next') {
      element = getNearestRecom('next');
      focusItemAndScrolling(element);
      return;
    }
  };

  var getCurrItemRect = function(element) {
    var clientRect, rect;

    clientRect = element.getBoundingClientRect();

    rect = {x: 0, y: 0, width: 0, height: 0};
    rect.x = clientRect['left'];
    rect.y = clientRect['top'];
    rect.width = clientRect['width'];
    rect.height = clientRect['height'];

    return rect;
  };

  var focusHandler = function(e, target, keyCode, rect) {
    if ((target != 'main' ) && (target != 'menu')) return;
    e.preventDefault();
    if (focusManager.getCurrent().target == "left") {
      if ($element[0].getElementsByClassName('item')[0]) {
        focusItemAndScrolling($element[0].getElementsByClassName('item')[0]);
      }
    } else if (focusManager.getCurrent().target === "more" || focusManager.getCurrent().target === "right") {
      // get the nearest item
      var item = focusManager.getCurrent().target;
      var currFocusElement = $element[0].querySelector('[item="'+item+'"]');
      var candidateElements = $element[0].querySelectorAll('[item*="-0"]'); // the first line of the contents
      var retVal = findFocusDownItem(currFocusElement, candidateElements);
      $scope.setFocusItem(retVal[0], retVal[1]); // item, element
    } else {
      if ($element[0].getElementsByClassName('scroll-prev')) {
        $scope.$broadcast('focus', 'scroll', keyCode, {x: 0, y: 0, width: 0, height: 0});
      } else {
        if ($scope.listData.length >= 4) {
          focusItemAndScrolling($element[0].getElementsByClassName('item')[$scope.listData.length-1]);
        } else {
          focusItemAndScrolling($element[0].getElementsByClassName('item')[3]);
        }
      }
    }
  };

  var findFocusUpItem = function(currFocusElement, candidateElements) {
    var retVal = new Array(2);
    var curr_item = null;
    var curr_obj = null;
    var _currFocusItem, _currRect, focus_left, midwidth;
    var gap_left_before = 999;
    _currFocusItem = currFocusElement;
    _currRect = _currFocusItem.getBoundingClientRect();
    midwidth = (_currRect.right - _currRect.left) / 2;
    focus_left = _currRect.left + midwidth;

    var _focusElements = candidateElements;
    //[WOSLQEVENT-116869]우측 Arrow 모양에서 아래로 이동 시 focus 상실 해결
    //item이 하나인 경우 gap_left_before = 999값만 비교 함으로 예외처리 함
    if (_focusElements.length == 1) {
      retVal[0] = _focusElements[0].getAttribute('item');
      retVal[1] = _focusElements[0];
      return retVal;
    }

    for (i = 0; i < _focusElements.length; i++) {
      var thisRect = _focusElements[i].getBoundingClientRect();
      var gap_left = focus_left - (thisRect.left + (thisRect.right - thisRect.left) / 2);

      if (Math.abs(gap_left) < Math.abs(gap_left_before)) {
        curr_obj = _focusElements[i];
        curr_item = _focusElements[i].getAttribute('item');
      }
      gap_left_before = gap_left;

    }

    retVal[0] = curr_item;
    retVal[1] = curr_obj;

    return retVal;
  };

  var findFocusDownItem = function(currFocusElement, candidateElements) {
    return findFocusUpItem(currFocusElement, candidateElements);
  };

  //메인화면에 앱 배경화면이 검정색으로 서버에서 내려온(rgb(0, 0, 0)) 경우는
  //class bg-black추가시켜 회식테두리가 나오게 수정한다.
  //다만 서버에서 배경화면에 안내려올 경우 앱 배경화면이 회색으로 나오기 때문에 따로 처리할 필요가 없다.
  var divItemThumbbgBlackCss = function(obj){
    var divClass = obj.getElementsByClassName('item-thumb')[0];
    if(divClass != undefined){
      if(divClass.className.indexOf('bg-black') === -1){
        if(divClass.style.backgroundColor === 'rgb(0, 0, 0)'){
          divClass.className += ' bg-black';
        }
      }else if(divClass.className.indexOf('bg-black') > 0 && divClass.style.backgroundColor != 'rgb(0, 0, 0)'){
        divClass.className = (divClass.className).replace(/ bg-black/g,'');
      }
    }
  };

  var requestDiscovery = function() {
    var params = {
      api : '/discovery2016/featured',
      method : 'post',
      apiAppStoreVersion : 'v7.0',
      tierType : device.tierType
    };
    server.requestApi(eventKey.DISCOVERY_LOADED, params, destroyInfo);
  };

  var initialize = function() {

    if (device.featuredMainData) { // at the first
      $timeout(function(){
        var e = {preventDefault:function(){}};
        globalResponse = device.featuredMainData;
        drawMain(e, globalResponse);
        delete device.featuredMainData;
      }, timeOutValue.DRAW_MAIN_ON_INIT);
    } else {
      $scope.$on(eventKey.DISCOVERY_LOADED, drawMain);
    }

    $scope.$on('hiding', hideMain);
    $scope.$on('focus', focusHandler);
    $scope.$on(eventKey.RECOVER_FOCUS, $scope.recoverFocus);

    if (!device.featuredMainData) {
      if (!device.isLocalJSON) {
        // Server data용
        util.async(requestDiscovery);
      } else {
        // local json용
        util.async(server.requestDiscovery);
      }
    }

    // 공지사항 가져오기
    if (device.isTv) {
      if (!device.isDeepLink) { // 최초 deeplink가 아닐때 만
        params = {
          api: '/discovery2016/notice',
          method: 'get',
          apiAppStoreVersion: 'v7.0'
        };
        server.requestApi(eventKey.NOTICE_LOADED, params);
      }
    }
    $rootScope.setFocusItem = $scope.setFocusItem;
  };

  initialize();
});
