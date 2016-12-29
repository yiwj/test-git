app.controller('viewController', function($scope, $element, $rootScope, $timeout, focusManager, device, marquee, util) {
  $scope.setMouseEvent = function(obj, upDown) {
    if (!obj) return;
    obj.onmousedown = itemMouseDown;
    obj.onmouseup = itemMouseUp;
    if (upDown) return;
    //obj.onmouseenter = itemMouseEnter;
    obj.onmouseover = itemMouseEnter;
    obj.onmouseleave = itemMouseLeave;
    obj.onmousemove = itemMouseMove;
  };

  $scope.getScopeElement = function() {
    if ($element) {
      return $element;
    } else {
      return false;
    }
  };

  var scrollUpDownPlayTime = 0;
  var scrollMouseDownTimer;
  var scrollMouseMoveTimer;
  var scrollScope = undefined;
  var scrollMoving = false;
  var moveDelta = device.isHD ? 60 : 90; //40 : 60;
  var scrollBtnPrevDimmed = false;
  var scrollBtnNextDimmed = false;

  var panelBodyObj = $element[0].getElementsByClassName('panel-body')[0];
  if (panelBodyObj) {
    panelBodyObj.onmouseup = function(e) {
      // when the mouse cursor is inside of the panel body and there is no item.
      device.isScrollBtnPressed = false;
    };
  }

  document.body.onmouseup = function(e) {
    // when the mouse cursor is outside of all focus elements.
    device.isScrollBtnPressed = false;
    itemMouseUp(e); // tooltip issue. When you clicked the drawer icon, and move the mouse pointer to somewhere[not item], and release[onmouseup]!
  };

  var stopScroll = function() {
    device.isScrollBtnPressed = false;
    clearInterval(scrollMouseDownTimer); clearInterval(scrollMouseMoveTimer);
    scrollMouseDownTimer =  scrollMouseMoveTimer = undefined;
    scrollMoving = false;
    scrollUpDownPlayTime = 0;
    $element[0].querySelector('[item="prev"]').classList.remove('pressed');
    $element[0].querySelector('[item="next"]').classList.remove('pressed');
  };

  var scrollBtnSetInterval = function(focusEl, focusScope, e, from) {
    if (!device.isScrollBtnPressed) {
      stopScroll();
      return;
    } else if (focusScope.$parent.scroll.y < focusScope.$parent.scroll.maxScrollY) {
      // bottom
      device.isScrollBtnPressed = false;
      scrollBtnNextDimmed = true;
      stopScroll();
      return;
    } else if (focusScope.$parent.scroll.y > 0) {
      // top
      device.isScrollBtnPressed = false;
      scrollBtnPrevDimmed = true;
      stopScroll();
      return;
    }
    //console.log('~~scrollBtnSetInterval~~', from);
    scrollUpDownPlayTime++;
    var deltaY, wheelDelta;
    if (focusEl.target === 'next') {
      if (focusScope.$parent.scroll.y <= focusScope.$parent.scroll.maxScrollY) {
        $timeout(function(){
          if (scrollScope && scrollScope.resetFocusWhenDisable) {
            scrollScope.resetFocusWhenDisable();
          }
        },300);
        itemMouseUp(e);
        return;
      }
      if (moveDelta > 0) {
        moveDelta = - moveDelta;
      }
    } else if (focusEl.target === 'prev') {
      if (focusScope.$parent.scroll.y >= 0) {
        $timeout(function(){
          if (scrollScope.resetFocusWhenDisable) {
            scrollScope.resetFocusWhenDisable();
          }
        },300);
        itemMouseUp(e);
        return;
      }
      if (moveDelta < 0) {
        moveDelta = - moveDelta;
      }
    }
    focusScope.$parent.scroll.refresh();
    deltaY = focusScope.$parent.scroll.y + moveDelta;
    // moonstone patch
    if (deltaY > 0) deltaY = 0;
    else if (deltaY < focusScope.$parent.scroll.maxScrollY) deltaY = focusScope.$parent.scroll.maxScrollY - 10;
    scrollBtnPrevDimmed = false;
    scrollBtnNextDimmed = false;
    focusScope.$parent.scroll.scrollTo(0, deltaY, 300);
  };

  var itemMouseDown = function(e) {
    e.stopPropagation();
    if(focusManager.blockExecution($scope.scopeName)) {
      return;
    }

    if(e.target.classList.contains('scroll-next') || e.target.classList.contains('scroll-prev')){
      $scope.executeAction('mouseDown');
    }

    focusManager.setMouseTarget($scope.scopeName + '/' + e.target.getAttribute('item'));
    //scroll 로직 추가
    var focusEl = focusManager.getCurrent();
    var focusScope;
    if (focusEl) {
      focusScope = focusEl.scope;
    }

    if ((focusEl.target === 'prev' || focusEl.target === 'next') && !scrollMoving && (scrollMouseDownTimer === undefined)) {
      stopScroll(); // initialize
      scrollScope = focusEl.scope;
      scrollMoving = true;
      device.isScrollBtnPressed = true;
      $element[0].querySelector('[item="'+focusEl.target+'"]').classList.add('pressed');
      scrollMouseDownTimer = setInterval(function () {
        if (scrollBtnPrevDimmed && focusEl.target === 'prev') return;
        if (scrollBtnNextDimmed && focusEl.target === 'next') return;
        scrollBtnSetInterval(focusEl, focusScope, e, 'Down');
      }, 25);
    }
  };

  var itemMouseUp = function(e) {
//    document.body.classList.remove('hover-mode');
    device.isScrollBtnPressed = false;
    var target, flag, focusTemp;
    e.stopPropagation();

    if(focusManager.blockExecution($scope.scopeName) && $scope.scopeName !== 'popupApp') {
      return;
    }

    //audioGuidanc 작업 중 click 시 setFocusItem 이 한번씩 더 되는 문제로 해당 부분 주석처리
    //[WOSLQEVENT-34110][WOSLQEVENT-33024] focus 이슈로 클릭 시 focu 가 가도록 처리
    if(document.body.classList.contains('hover-mode') && $scope.setFocusItem) {
     $scope.setFocusItem(e.target.getAttribute('item'), e.target);
    }

    target = focusManager.getMouseTarget();
    focusManager.setMouseTarget('');
    if ($scope.scopeName == 'scroll' && focusManager.preExecution()) {
      focusManager.runPreExecution();
      return;
    }
    if ($scope.scopeName == 'drawer') flag = focusManager.getState('drawer');
    focusManager.runPreExecution();
    //scroll 로직 추가
    var focusEl = focusManager.getCurrent();
    if (focusEl.target === 'prev' || focusEl.target === 'next') {
      if (scrollScope) {
        $timeout(function(){
          if (scrollScope.resetFocusWhenDisable) {
            //scrollScope.resetFocusWhenDisable();    // 스크롤이 마지막에 닿았을 경우 포커스가 다른 방향으로 이동
          }
        });
      }
      if (scrollUpDownPlayTime > 1) { // 5 -> 1// 0.3초 이상 누르고 있었다면 executeaction은 실행하지 않음
        scrollUpDownPlayTime = 0;
        return;
      } else { //아니면 executeAction도 실행
        scrollUpDownPlayTime = 0;
      }
    }
    if ((target === 'app'|| target === '') && e.target.classList.contains('btn-more')) {
      return; //타깃이 more-less 버튼인데 포커스는 안가있다면 버튼 클릭 이벤트가 안되도록 한다.
    }

    if (target === '' || target === 'app' || target === $scope.scopeName + '/' + e.target.getAttribute('item')) {
      util.async(function() {
        if(target.indexOf('submenu') >= 0) {
          $scope.executeAction(e.target.getAttribute('item'));
        } else {
          $scope.executeAction(flag);
        }
      });
    }
  };

  var itemMouseEnter = function(e) {

    var focusEl = focusManager.getCurrent();
    if ((focusEl.target === 'prev' || focusEl.target === 'next') && device.isScrollBtnPressed) {
      return;
    }

    var item, target;
    //clearInterval(scrollMouseDownTimer); clearInterval(scrollMouseMoveTimer);
    e.stopPropagation();

    var scopeName = focusEl.scope.scopeName;

    if (['prerollAd', 'player'].indexOf(scopeName) >= 0) {
      // trailer 재생전에 실행되는 광고 영역에는 hover-mode 추가 않하도록
    } else {
      document.body.classList.add('hover-mode');
    }

    //cp 선택 버튼 mouse over 일 경우 상위 element cp-hover 추가 해야 poster div에 focus가 중복으로 들어가지 않음
    if(this.classList.contains('btn-cp-play')) this.parentElement.classList.add('cp-hover');

    if(focusManager.blockExecution($scope.scopeName)) {
      return;
    }

    item = e.target.getAttribute('item');
    target = focusManager.getMouseTarget();
    if (target == '' || target == 'app'|| target == $scope.scopeName + '/' + item) {
      $scope.setFocusItem(item, e.target);
    }
  };

  var itemMouseLeave = function(e) {

    var focusEl = focusManager.getCurrent();

    var scopeName = focusEl.scope.scopeName;
    if (['prerollAd', 'player'].indexOf(scopeName) >= 0) {
      // trailer 재생전에 실행되는 광고 영역에는 hover-mode 추가 않하도록
      return;
    }

    if ((focusEl.target === 'prev' || focusEl.target === 'next') && device.isScrollBtnPressed) {
      // stop scroll & remove focus [enyo]
      device.isScrollBtnPressed = false;
      stopScroll();
      $element[0].querySelector('[item="'+focusEl.target+'"]').classList.remove('pressed');
      return;
    }

//    if($rootScope.popupApp.hide) document.body.classList.add('hover-mode');
//    else document.body.classList.remove('hover-mode');

    //cp 선택 버튼 mouse leave 일 경우 상위 element cp-hover 제거 해야 poster div에 focus가 들어감
    if(this.classList.contains('btn-cp-play') && this.parentElement.classList.contains('cp-hover')) this.parentElement.classList.remove('cp-hover');

    e.stopPropagation();
    if (focusManager.blockExecution($scope.scopeName)) return;
    if (scrollScope && scrollScope.resetFocusWhenDisable) {
      $timeout(function(){
        scrollScope.resetFocusWhenDisable();
      });
    } else {
      $scope.setFocusItem('', null);
    }
  };

  var itemMouseMove = function(e) {
    var focusEl = focusManager.getCurrent();
    var focusScope;
    if (focusEl) {
      focusScope = focusEl.scope;
    }
    if ((focusEl.target === 'prev' || focusEl.target === 'next') && !scrollMoving && device.isScrollBtnPressed) {
      scrollMoving = true;

      scrollMouseMoveTimer = setInterval(function () {
        scrollBtnSetInterval(focusEl, focusScope, e, 'Move');
      }, 25);

    }

    var item;
    e.stopPropagation();
    if(focusManager.blockExecution($scope.scopeName)) {
      // return 예외 처리
      return;
    }

    item = e.target.getAttribute('item');
    if ((focusManager.getMouseTarget() == '' || focusManager.getMouseTarget() == 'app') && $scope.focusItem != item) {
      $scope.setFocusItem(item, e.target);
    }
  };
});