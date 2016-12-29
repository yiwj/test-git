app.directive('premiumDetail', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'premiumDetailController',
    templateUrl: './resources/html/premiumDetail.html'
  };
});

app.directive('premiumAppImgRecoverable', function() {
  return {
    link: function($scope, $element) {
      $element.bind('error', function(e) {
        $scope.detailData.src = $scope.detailData.iconURL;
        $scope.detailData.iconURL = './resources/images/default_app.png';
      });
    }
  };
});

app.directive('premiumScreenshotRecoverable', function() {
  return {
    link: function($scope, $element) {
      $element.bind('error', function(e) {
        $scope.item.prevSrc = $scope.item.previewURL;
        $scope.item.previewURL = './resources/images/default_app_games_screenshot.png';
      });
    }
  };
});

app.directive('premiumThumbResizable', function() {
  return {
    link: function($scope, $element, util) {
      $element.bind('load', function(e) {
        console.log('thumbResizable');
        var x, y, w, h, parentH, parentW, imgW, imgH, parent_rate, img_rate;
        if ($element[0].getAttribute('src') == 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=') return;
        parentH = this.parentElement.clientHeight;
        parentW = this.parentElement.clientWidth;
        imgW = this.naturalHeight;
        imgH = this.naturalWidth;
        parent_rate = parentW/parentH;
        img_rate = imgW/imgH;
        if(img_rate >= parent_rate) {
          if( parent_rate/img_rate < 0.8 ) {
            $element[0].style.width = 'inherit';
          }else{
            $element[0].style.height = 'inherit';
          }
        }else{
          if( img_rate/parent_rate < 0.8 ) {
            $element[0].style.height = 'inherit';
          }else{
            $element[0].style.width = 'inherit';
          }
        }
      });
    }
  };
});

app.controller('premiumDetailController', function($scope, $controller, $element, $rootScope, server, marquee, focusManager, util, keyHandler, pmLog, timeOutValue, device) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var STEP_POSITION = 100;

  var focusElement = null;
  var lastFocus = {};
  var scroll = null;
  var scrollBar = {};
  var previousPosition = 0;
  var maxPosition = 0;
  var scrollByKey = false;

  $scope.scopeName = '';
  $scope.focusItem = '';
  $scope.detailData = null;
  $scope.isSingleApp = false;
  $scope.useGamePad = false;
  $scope.useInternet = false;
  $scope.use3d = false;
  $scope.useCamera = false;
  $scope.useMagic = false;
  $scope.inApp = false;
  $scope.clamp = false;
  $scope.showMore = false;
  $scope.actionBtnTitle = msgLang.apps_install;
  $scope.updateTitle = msgLang.apps_updated;
  $scope.sizeTitle = msgLang.apps_size;
  $scope.ratingTitle = msgLang.rating;
  $scope.versionTitle = msgLang.apps_version;
  $scope.detailTitle = msgLang._3d_details;
  $scope.inappMsg = msgLang.apps_inapp_1_1;
  $scope.moreTitle = msgLang.more;
  $scope.lessTitle = msgLang.less;
  $scope.sellerTitle = msgLang.sdp_apps_015;
  $scope.screenshotsTitle = msgLang.apps_screenshots;
  $scope.requirementsTitle = msgLang.apps_systemRequirement;
  $scope.capabilityInternet = msgLang.apps_capability_useInternet;
  $scope.capability3D = msgLang.apps_capability_use3d;
  $scope.capabilityMR = msgLang.apps_capability_useMagic;
  $scope.capabilityCamera = msgLang.apps_capability_useCamera;
  $scope.capabilityGamePad = msgLang.apps_capability_useGamePad;
  $scope.type = '';
  $scope.photoHeight = '235px';
  $scope.appSize = '';
  $scope.sizeUnit = '';
  $scope.ageType = '';
  $scope.description = '';
  $scope.direct = false;
  $scope.showing = false;
  $scope.hiding = false;
  $scope.title = '';
  $scope.historyBack = $rootScope.pageManager.getTitle('back');
  $scope.drawed = false;
  $scope.nodata = msgLang.apps_nodata;
  $scope.item_id = '';
  $rootScope.pmLogValue = pmLog.TYPE.PREMIUM;
  $scope.scroll = undefined;

  $scope.setFocusItem = function(item, element) {
    var y;

    if (lastFocus.item == 'back') {
      $rootScope.tooltip.hideTooltip();
    }
    $scope.focusItem = item;

    if (focusElement) {
      if (element === null) {
        if(focusElement.parentElement !== null && focusElement.parentElement !== undefined) {
          focusElement.parentElement.classList.remove('focus');
        }
      }
      focusElement.classList.remove('focus');
    }
    focusElement = element;
    if (focusElement) {
      if (element.parentElement.getAttribute('class').indexOf('focus') === -1) {
        focusElement.classList.add('focus');
      }
    }

    if (item) {
      focusManager.setCurrent($scope, item);
      lastFocus.item = item;
      lastFocus.element = element;
    } else {
      focusManager.setCurrent($scope, '');
    }

    if ($scope.focusItem == 'back') {
      y = focusManager.getState('drawer') ? 262 : 142;
      $rootScope.tooltip.showTooltip(45, y, $scope.historyBack, false);
    }
  };

  $scope.recoverFocus = function() {
    $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  preExecuteBackCallback = function() {
    $scope.setFocusItem('', null);

    obj = $rootScope.pageManager.popHistory();
    $rootScope.draw(obj);
  };

  $scope.executeAction = function() {
    if (focusManager.blockExecution()) {
      console.log('premiumDetail.executeAction, blockExecution is true');
      return;
    }

    var focusObject, target, obj, page, item;

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target == 'back') {
        $rootScope.breadcrumb.executeBack($scope.scopeName);
      } else if (target == 'detail-more') {
        $scope.clamp = !$scope.clamp;
        $scope.$apply();
      }
    }
  };

  var drawPremiumDetail = function(e, response) {
    var i, l, arr;

    e.preventDefault();

    if ($scope.scopeName != '' && $scope.scopeName != response.scopeName) return;

    $scope.detailData = response.premiumDetail;
    $scope.scopeName = response.scopeName;

    $scope.title = response.premiumDetail.name;
    $rootScope.pageManager.setTitle($scope.title);

    if ($scope.detailData.type == 'S') $scope.isSingleApp = true;
    if ($scope.detailData.capability.useGamePad == 'Y') $scope.useGamePad = true;
    if ($scope.detailData.capability.useInternet == 'Y') $scope.useInternet = true;
    if ($scope.detailData.capability.use3d == 'Y') $scope.use3d = true;
    if ($scope.detailData.capability.useCamera == 'Y') $scope.useCamera = true;
    if ($scope.detailData.capability.useMagic == 'Y') $scope.useMagic = true;
    if ($scope.detailData.bItem == 'Y') $scope.inApp = true;

    $scope.type = $scope.detailData.type;

    /* brief info setting */
    $scope.detailData.updateDate = $scope.detailData.updateDate.replace(/-/gi, ".");

    sizeConvert($scope.detailData.appFileList[0].packFileSize+$scope.detailData.appFileList[0].unpackFileSize);
    if ($scope.detailData.ageType == 0) {
      $scope.ageType = msgLang.apps_category01;
    } else {
      $scope.ageType = $scope.detailData.ageType + '+';
    }

    $scope.description = $scope.detailData.description;

    $scope.setMouseEvent($element[0].getElementsByClassName('back')[0]);

    $element[0].removeAttribute('ng-class');

    $scope.$apply();

    util.async(function() {
      initializeDetail();
      initializeScroll();
      $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
    });
  };

  var initializeDetail = function() {
    var actionBtn, moreBtn, i, l;

    elementH = $element[0].getElementsByClassName('detail-detail-content-premium')[0].style.lineHeight.replace('px', '');
    descH = $element[0].getElementsByClassName('detail-detail-content-premium')[0].offsetHeight;
    if (descH > elementH * 3) {
      $scope.clamp = true;
      $scope.showMore = true;
    }
    $scope.$apply();

    actionBtn = $element[0].getElementsByClassName('button')[0];
    $scope.setMouseEvent(actionBtn);

    // 상세정보의 더보기 버튼 처리
    moreBtn = $element[0].getElementsByClassName('detail-more-button')[0];
    $scope.setMouseEvent(moreBtn);

    l= $element[0].getElementsByClassName('detail-screenshot').length;

    for(i = 0; i < l; i++) {
      view = $element[0].getElementsByClassName('detail-screenshot')[i];

      $scope.setMouseEvent(view);
    }

    util.async($scope.scrollRefresh);
  };

  var hideList = function(e, page) {
    e.preventDefault();
    if (page != $scope.scopeName) {
      if ($scope.direct == false && $scope.showing == false) {
        if (page == '') {
          $scope.setDefaultFocus();
          $scope.direct = true;
          $rootScope.breadcrumb.onPageFromDeepLink();
          $scope.$apply();
        } else {
          $scope.setDefaultFocus();
          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, preExecuteBackCallback, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $scope.showing = true;
          });
          $scope.$apply();
        }
      }
      return;
    }

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      // $timeout(function() {
        delete scroll;
        scrollBar = null;
        $element.remove();
        $scope.$destroy();
      // }, timeOutValue.DESTROYING);
    });
  };

  var move = function(y) {
    var position;
    scrollBar.move(y, true);

    position = parseInt(y / STEP_POSITION);
    if (position > 0) position = 0;
    if (position < maxPosition) position = maxPosition;
    if (previousPosition == position) return;

    previousPosition = position;

    if (focusManager.getCurrent().scope == $scope && scrollByKey == false) {
      $scope.setFocusItem('', null);
    }
  };

  var end = function(y) {
    $scope.$broadcast('loadImage');
    $timeout(function() {
      scrollByKey = false;
    }, 100);
  };

  var initializeScroll = function() {
    var option = {};
    option.onPositionChange = move;
    option.onScrollEnd = end;
    option.useTransform = false;

    scroll = new iScroll($element[0].getElementsByClassName('detail-content')[0], option);
    $scope.scroll = scroll;

    $element[0].getElementsByClassName('detail-content')[0].onmousewheel = function(e) {
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
    scroll.scrollTo(0, -200, 300, true);
  };

  $scope.scrollPageDown = function() {
    if (scroll.y < scroll.maxScrollY) return;
    scroll.scrollTo(0, 200, 300, true);
  };

  $scope.scrollRefresh = function() {
    var obj;

    obj = $element[0].getElementsByClassName('detail-scroller')[0];
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
    var target;

    target = $element[0].getElementsByClassName('button')[0];
    if (target)
    {
      $scope.setFocusItem('button', target);
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

  $scope.moveFocusByKey = function(keyCode) {
    var i, name, element, hidden, scrollY, itemNum, button_element;

    if ($scope.focusItem == '') {
      if (util.isAWSServer()) {
        device.isFocusItem = false;
      }
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    if ($scope.focusItem == 'back') {
      moveFocusFromBack(keyCode);
      return;
    }

    switch (keyCode) {
      case keyHandler.LEFT:
        if ($scope.focusItem == 'button') {
          element = $element[0].getElementsByClassName('back')[0];
          $scope.setFocusItem('back', element);
        } else if ($scope.focusItem.indexOf('photo') > -1) {
          itemNum = $scope.focusItem.replace('photo', '');
          name = 'photo' + (parseInt(itemNum) - 1);
          element = angular.element(document.getElementById(name))[0];
          if (element != undefined) {
            $scope.setFocusItem(name, element);
          } else {
            $scope.setFocusItem('button', $element[0].getElementsByClassName('button')[0]);
          }
        } else if ($scope.focusItem == 'detail-more') {
          i = $element[0].getElementsByClassName('detail-screenshot').length;
          if (i > 0) {
            element = $element[0].getElementsByClassName('detail-screenshot')[i-1];
            $scope.setFocusItem(element.getAttribute('item'), element);
          } else {
            $scope.setFocusItem('button', $element[0].getElementsByClassName('button')[0]);
          }
        }
        break;
      case keyHandler.UP:
        if ($scope.focusItem == 'button') {
          $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
        }
        break;
      case keyHandler.RIGHT:
        if ($scope.focusItem == 'button') {
          i = $element[0].getElementsByClassName('detail-screenshot').length;
          if (i > 0) {
            element = $element[0].getElementsByClassName('detail-screenshot')[0];
            $scope.setFocusItem(element.getAttribute('item'), element);
          } else if (scroll.wrapperH < scroll.scrollerH) {
            rect = {
                x: 0,
                y: focusElement.offsetTop + scroll.y,
                width: 0,
                height: focusElement.clientHeight
              };
              $scope.$broadcast('focus', 'scroll', keyCode, rect);
          }
          return;
        } else if ($scope.focusItem.indexOf('photo') > -1) {
          itemNum = $scope.focusItem.replace('photo', '');
          name = 'photo' + (parseInt(itemNum) + 1);
          element = angular.element(document.getElementById(name))[0];
          button_element = angular.element(document.getElementsByClassName('detail-more-button'));

          if (element != undefined) {
            $scope.setFocusItem(name, element);
          } else if (!button_element.hasClass('ng-hide')){
            $scope.setFocusItem(button_element[0].getAttribute('item'), button_element[0]);
          } else if (scroll.wrapperH < scroll.scrollerH) {
            rect = {
                x: 0,
                y: focusElement.offsetTop + scroll.y,
                width: 0,
                height: focusElement.clientHeight
              };
              $scope.$broadcast('focus', 'scroll', keyCode, rect);
          }
          return;
        } else if ($scope.focusItem == 'detail-more') {
          if (scroll.wrapperH < scroll.scrollerH) {
            rect = {
                x: 0,
                y: focusElement.offsetTop + scroll.y,
                width: 0,
                height: focusElement.clientHeight
              };
              $scope.$broadcast('focus', 'scroll', keyCode, rect);
          }
        }
        break;
      case keyHandler.DOWN:
        name = 'item' + (itemNum + 3);
        element = angular.element(document.getElementById(name))[0];
        if(element != undefined) {
          scrollY = element.offsetTop + element.offsetHeight;
          if (scrollY > (scroll.wrapperH - scroll.y)) {
            hidden = true;
            scrollY = scroll.wrapperH - scrollY;
          }
        }
        break;
    }

    if (name && element) {
      if (hidden) {
        scrollByKey = true;
        scroll.scrollTo(0, scrollY, 300, false);
      }
      $scope.setFocusItem(name, element);
    }
  };

  var moveFocusFromBack = function(keyCode) {
    var element;

    switch (keyCode) {
      case keyHandler.UP:
        $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
        break;
      case keyHandler.RIGHT:
        element = $element[0].getElementsByClassName('button')[0];
        $scope.setFocusItem('button', element);
        break;
      case keyHandler.LEFT:
        $scope.executeAction();
        break;
    }
  };

  $scope.focusFromScroll = function(target, menu) {
    var i, element;

    if (target == 'header') {
      $rootScope.$broadcast('focus', 'drawer', null, {x: 0, y: 0, width: 0, height: 0});
      return;
    }

    element = angular.element(document.getElementsByClassName('detail-more-button'));
    i = $element[0].getElementsByClassName('detail-screenshot').length;

    //more 버튼 있을 경우 more 버튼으로 이동
    if (!element.hasClass('ng-hide')){
      $scope.setFocusItem(element[0].getAttribute('item'), element[0]);
    } else if (i > 0) {
      element = $element[0].getElementsByClassName('detail-screenshot')[i-1];
      $scope.setFocusItem(element.getAttribute('item'), element);
    } else {
      element = $element[0].getElementsByClassName('button')[0];
      $scope.setFocusItem('button', element);
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

    element = $element[0].getElementsByClassName('back')[0];
    $scope.setFocusItem('back', element);
  };

  var sizeConvert = function(size) {
    try {
      var bytes = parseInt(size);
      var s = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
      var e = Math.floor(Math.log(bytes)/Math.log(1024));

      if(e == "-Infinity") {
        $scope.sizeUnit = s[0];
        $scope.appSize = '0 ';
      } else {
        $scope.sizeUnit = s[e];
        $scope.appSize = (bytes/Math.pow(1024, Math.floor(e))).toFixed(2);
      }
    } catch(e) {
    }
  };

  $scope.initialize = function() {
    $scope.$on('premiumDetail', drawPremiumDetail);
    $scope.$on('hiding', hideList);
    $scope.$on('focus', focusHandler);

    if($element[0].getAttribute('item')) {
      var item_id = $element[0].getAttribute('item');
      util.async(server.requestPremiumDetail(item_id));
    }
  };

  $scope.initialize();
});