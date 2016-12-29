app.directive('scroll', function() {
  return {
    restrict: 'A',
    scope: {},
    controller: 'scrollController',
    //templateUrl: './resources/html/scroll.html',
    template: scrollTmpl,
    link: function($scope, $element) {
      $scope.setMouseEvent($element[0].getElementsByClassName('scroll-prev')[0]);
      $scope.setMouseEvent($element[0].getElementsByClassName('scroll-next')[0]);
    }
  };
});

app.controller('scrollController', function($rootScope, $scope, $controller, $element, $timeout, device, focusManager, keyHandler, audioGuidance, util) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var area = null;
  var bar = null;
  var factor = -1;
  var timeout = 1000;
  var timer = null;
  var lastFocus = '';

  $element[0].onmouseup = function(e) {
    console.log("stop scroll!!!!!!!!!");
    device.isScrollBtnPressed = false;
  };

  $scope.scopeName = 'scroll';
  $scope.focusInPrev = false;
  $scope.focusInNext = false;
  $scope.focusItem = '';
  $scope.hide = false;

  $scope.setFocusItem = function (item) {
    $scope.focusItem = item;
    if (item === 'prev') {
      $scope.focusInPrev = true;
      lastFocus = item;
      focusManager.setCurrent($scope, item);
      if ($element[0].querySelector('[item="next"]')) {
        $element[0].querySelector('[item="next"]').classList.remove('focus');
      }
      if (!$element[0].querySelector('[item="prev"]').classList.contains('focus')) {
        $element[0].querySelector('[item="prev"]').classList.add('focus');
      }
    } else if (item === 'next') {
      $scope.focusInNext = true;
      lastFocus = item;
      focusManager.setCurrent($scope, item);
      if ($element[0].querySelector('[item="prev"]')) {
        $element[0].querySelector('[item="prev"]').classList.remove('focus');
      }
      if (!$element[0].querySelector('[item="next"]').classList.contains('focus')) {
        $element[0].querySelector('[item="next"]').classList.add('focus');
      }
    } else {
      $scope.focusInPrev = false;
      $scope.focusInNext = false;
      focusManager.setCurrent($scope, '');
    }
    $scope.$digest();
  };

  $scope.audioGuidance = function (scope, target) {
    if (util.isAWSServer()) {
      //audioGuidance 호출 params
      var params = {
        text: '',
        clear: true,
        duplication: false
      };
    } else {
      //audioGuidance 호출 params
      var params = {
        text: '',
        clear: true
      };
    }

    switch (target){
      case 'prev':
        params.text = msgLang.audio_scroll_up;
        break;
      case 'next':
        params.text = msgLang.audio_scroll_down;
        break;
      case 'up':
        if (util.isAWSServer()) {
          params.text = msgLang.audio_scroll_up_press;
          params.duplication = true;
        } else {
          params.text = 'up';
        }
        break;
      case 'down':
        if (util.isAWSServer()) {
          params.text = msgLang.audio_scroll_down_press;
          params.duplication = true;
        } else {
          params.text = 'down';
        }
        break;
    }

    audioGuidance.call(params);
  };

  $scope.executeAction = function(state) {
    var focusObject, target;
    focusObject = focusManager.getCurrent();

    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target === 'prev') {
        $scope.audioGuidance('', 'up');
        if(state === 'mouseDown') return;
        $scope.$parent.scrollPageUp();
      } else if (target === 'next') {
        $scope.audioGuidance('', 'down');
        if(state === 'mouseDown') return;
        $scope.$parent.scrollPageDown();
      } else if (target === 'back') {
        $scope.$parent.executeAction();
      }
    }
  };

  $scope.decideBtnDisable = function(y, max) {
    //scroll disable 로직 추가
    if (y === undefined) {
      y = 0;
    }
    var prevEl = $element[0].querySelector('[item="prev"]');
    var nextEl = $element[0].querySelector('[item="next"]');
    if (y === 0 || y === '0') {
      nextEl.classList.remove('disabled');
      if (!prevEl.classList.contains('disabled')) {
        prevEl.classList.add('disabled');
      }
    } else if (y === max) {
      prevEl.classList.remove('disabled');
      if (!nextEl.classList.contains('disabled')) {
        nextEl.classList.add('disabled');
      }
    } else {
      if (prevEl.classList.contains('disabled')) {
        prevEl.classList.remove('disabled');
      }
      if (nextEl.classList.contains('disabled')) {
        nextEl.classList.remove('disabled');
      }
    }
  };

  var changeScrollBtnFocus = function(btn) {
    // toggle
    if (btn === 'prev') {
      if (device.isKeyDown) device.isScrollBtnDimmed = true;
      $scope.focusInPrev = false;
      $scope.setFocusItem('next');
    } else if (btn === 'next') {
      if (device.isKeyDown) device.isScrollBtnDimmed = true;
      $scope.focusInNext = false;
      $scope.setFocusItem('prev');
    }
    // the nearest item
    /*
    if (btn === 'prev' || btn === 'next') {
      device.isScrollBtnDimmed = true;
      if ($scope.$parent.focusFromScroll) $scope.$parent.focusFromScroll(lastFocus); // the nearest item
    }
    */
  };

  $scope.resetFocusWhenDisable = function() {
    if ($scope.$parent.scroll.y <= $scope.$parent.scroll.maxScrollY) {
      changeScrollBtnFocus('next');
    } else if ($scope.$parent.scroll.y >= 0) {
      changeScrollBtnFocus('prev');
    }
  };

  $scope.resetFocusCheck = function(scrollchange) {
    var prevEl = $element[0].querySelector('[item="prev"]');
    var nextEl = $element[0].querySelector('[item="next"]');

    $timeout(function(){
      if (!device.isScrollBtnDimmed) {
        if (prevEl && prevEl.classList.contains('disabled') || $scope.$parent.scroll.y >= 0) {
          changeScrollBtnFocus('prev');
        } else if (nextEl && nextEl.classList.contains('disabled') || $scope.$parent.scroll.y <= $scope.$parent.scroll.maxScrollY) {
          changeScrollBtnFocus('next');
        }
      }
    },500);
  };

  $scope.removeFocus = function(target) {
    if (target === 'prev' && $scope.focusInPrev) {
      $scope.focusInPrev = false;
      $scope.$digest();
    } else if (target === 'next' && $scope.focusInNext) {
      $scope.focusInNext = false;
      $scope.$digest();
    }
  };

  $scope.moveFocusByKey = function(keyCode) {
    var rect;

    if ($scope.focusItem === '') {
      $scope.setFocusItem(lastFocus);
      return;
    }

    switch (keyCode) {
      case keyHandler.LEFT:
        if ($scope.$parent.focusFromScroll) $scope.$parent.focusFromScroll(lastFocus);
        break;
      case keyHandler.UP:
        if ($scope.focusInNext && !$element[0].getElementsByClassName('scroll-prev')[0].classList.contains('disabled')) {
          $scope.focusInNext = false;
          $scope.setFocusItem('prev');
        } else {
          if ($scope.$parent.scopeName === 'featured') {
            if ($scope.$parent.expand) {
              console.log('move focus to drawer');
            } else {
              $scope.$parent.$broadcast('focus', 'header', keyCode, null);
            }
          } else {
            if ($scope.$parent.focusFromScroll) $scope.$parent.focusFromScroll('header');
          }
        }
        break;
      case keyHandler.RIGHT:
        if (device.isRTL) {
          if ($scope.$parent &&
            $scope.$parent.scopeName &&
            $scope.$parent.scopeName === 'season') {
            // RTL인 경우, season 팝업의 scroll이 좌측에 있dmau,
            // 이 경우, 아무것도 하지 않아야 한다.
            return;
          }
          $rootScope.$broadcast('focus', 'breadcrumbs', function() {
            // right button이 섵택되었을 때 실행될 callback
            moveFocusFromBack(keyHandler.RIGHT);
          });
        }
        if ($scope.focusInPrev) {
          rect = {x: 0, y: 0, width: 60, height: 60};
        } else {
          rect = {x: 0, y: area.clientHeight + 80, width: 60, height: 60};
        }
        $scope.$parent.$broadcast('focus', 'menu', keyCode, rect);
        break;
      case keyHandler.DOWN:
        if ($scope.focusInPrev && !$element[0].getElementsByClassName('scroll-next')[0].classList.contains('disabled')) {
          $scope.focusInPrev = false;
          $scope.setFocusItem('next');
        } else {
          // bottom right-hand corner of the page
          if ($scope.$parent.focusFromScroll) $scope.$parent.focusFromScroll('next');
        }
        break;
    }
  };

  var refresh = function(wrapperHeight, scrollerHeight, y) {
    var h, b;

    h = wrapperHeight * 0.82; //wrapperHeight - 140;
    if (h != area.clientHeight) {
      area.style.height = 'auto'; //area.style.height = h + 'px';
    }

    b = parseInt(h * wrapperHeight / scrollerHeight);
    if (b < 10) b = 10;

    bar.style.height = b + 'px';

    b = h - b;
    h = scrollerHeight - wrapperHeight;
    if (h == 0) {
      factor = -1;
    } else {
      factor = -b / h;
    }

    if (wrapperHeight >= scrollerHeight) {
      if (!$scope.hide) hideScroll();
    } else {
      if ($scope.hide) showScroll();
    }

    move(y, false);
    //서브메뉴클릭하여 scroll을 이니셜라이즈 안하는경우에는 전에 disable 된것이 남아있으므로 refresh 시에도 disable 버튼 체크 로직 추가
    var scrolly = $scope.$parent.scroll.y;
    var scrollmax = $scope.$parent.scroll.maxScrollY;
    $scope.decideBtnDisable(scrolly, scrollmax);
  };

  var move = function(y, visible) {
    if ($scope.hide) return;
    bar.style.top = parseInt(y * factor) + 'px';
    if (visible) {
      bar.style.opacity = 1;
      bar.style.transitionDuration = '0s';
      $timeout.cancel(timer);
      timer = $timeout(hideBar, timeout);
    }
  };

  var hideBar = function() {
    bar.style.opacity = 0;
    bar.style.transitionDuration = '0.33s';
    timer = null;
  };

  var showScroll = function() {
    $scope.hide = false;
    $element[0].getElementsByClassName('scroll-prev')[0].style.display = null;
    $element[0].getElementsByClassName('scroll-next')[0].style.display = null;
  };

  var hideScroll = function() {
    $scope.hide = true;
    $element[0].getElementsByClassName('scroll-prev')[0].style.display = 'none';
    $element[0].getElementsByClassName('scroll-next')[0].style.display = 'none';
    bar.style.opacity = 0;
    bar.style.transitionDuration = '0s';
  };

  var focusHandler = function(e, target, keyCode, rect) {
    var y;

    if (target != $scope.scopeName) return;
    e.preventDefault();
    if ($element[0].getElementsByClassName('scroll-next')[0].classList.contains('disabled')) {
      $scope.focusInNext = false;
      $scope.setFocusItem('prev');
    } else if ($element[0].getElementsByClassName('scroll-prev')[0].classList.contains('disabled')) {
      $scope.focusInPrev = false;
      $scope.setFocusItem('next');
    } else {
      y = parseInt((area.clientHeight + 140) / 2);
      if (rect.y < y) {
        $scope.focusInNext = false;
        $scope.setFocusItem('prev');
      } else {
        $scope.focusInPrev = false;
        $scope.setFocusItem('next');
      }
    }
  };

  var changeScopeName = function(e, scopeName) {
    $scope.scopeName = scopeName;
  };

  /*
   * RTL mode 일 경우 breadcrumb의 위치만 변경되지 않으므로
   * breadcrumb에서 keyevent로 back 할 때 필요
   */
  var moveFocusFromBack = function(keyCode) {
    var element;

    switch (keyCode) {
      case keyHandler.RIGHT:
        if ($element[0].getElementsByClassName('scroll-next')[0].classList.contains('disabled')) {
          $scope.focusInNext = false;
          $scope.setFocusItem('prev');
        } else if ($element[0].getElementsByClassName('scroll-prev')[0].classList.contains('disabled')) {
          $scope.focusInPrev = false;
          $scope.setFocusItem('next');
        } else {
          $scope.focusInNext = false;
          $scope.setFocusItem('prev');
        }
        break;
    }
  };

  var initialize = function() {
    area = $element[0].getElementsByClassName('scroll-area')[0];
    bar = $element[0].getElementsByClassName('scroll-bar')[0];
    $scope.$parent.setScrollBarCallback(refresh, move);
    $scope.$on('focus', focusHandler);
    $scope.$on('scopeName', changeScopeName);
    var y = $rootScope.pageManager.getParam('scrollY');
    var max = $rootScope.pageManager.getParam('maxScrollY'); // 필요시 각 파일에 setparam 추가
    $scope.decideBtnDisable(y, max);
    $timeout.cancel(timer);
    hideBar();
  };

  initialize();
});
