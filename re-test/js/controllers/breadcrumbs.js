app.directive('breadcrumbs', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'breadCrumbsController',
//    templateUrl: './resources/html/breadcrumb.html',
    template: breadcrumbTmpl,
    link: function($scope, $element) {
    }
  };
});

app.controller('breadCrumbsController', function($scope, $controller, $element, $rootScope, $timeout, server, focusManager, device, keyHandler, storage, pmLog, eventKey, timeOutValue, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  $scope.scopeName = 'breadcrumbs';
  $scope.focus1 = false;
  $scope.focus2 = false;

  $scope.stepIndex1 = '01';
  $scope.stepIndex2 = '01';
  $scope.stepIndex = 1;

  $scope.hide = true;
  $scope.focusItem = '';

  $scope.executeException = false;   // 반복실행으로 인한 예외처리 변수

  var focusElement = null;
  var running;
  var newScope, previousScope;
  var pageMoveInOnCompletedCallback;
  var pageMoveOutOnCompletedCallback;

  var BACKWARD_CLASS = 'transition-backward';
  var SHOWING_CLASS = 'showing';
  var HIDING_CLASS = 'hiding';
  var DIRECT_CLASS = 'direct';

  var panelElement;
  var breadcrumbElements;
  var transitionEnded_page = false;
  var transitionEnded_breadcrums = false;

  var onDraw = function(e, response) {
    var i, l, menu, obj;

    e.preventDefault();
  };

  $scope.IsRunning = function() {
    if (running) {
      return true;
    } else if (panelElement) {
      // transitionEnd event가 발생하여도, 이전 page div가 아직 삭제 전일 수도 있다.
      // 실제 page div count를 확인 필요
      var pages = panelElement.getElementsByClassName('page');
      if (pages && (pages.length > 1)) {
        return true;
      }
    }
    return false;
  };

  $scope.setRunning = function(status) {
    // console.log('breadcrumbs.setRunning, status=' + status);
    running = status;

    if (!running) {
      focusManager.setState($scope.scopeName, false);
    }
  };

  var containsShowing = function(elem) {
    if (elem && elem.classList && elem.classList.contains(SHOWING_CLASS)) {
      return true;
    }
    return false;
  };

  var containsHiding = function(elem) {
    if (elem && elem.classList && elem.classList.contains(HIDING_CLASS)) {
      return true;
    }
    return false;
  };

  var containsDirect = function(elem) {
    if (elem && elem.classList && elem.classList.contains(DIRECT_CLASS)) {
      return true;
    }
    return false;
  };

  var addShowing = function(elem) {
    if (elem && elem.classList) {
      elem.classList.add(SHOWING_CLASS);
    }
  };

  var addHiding = function(elem) {
    if (elem && elem.classList) {
      elem.classList.add(HIDING_CLASS);
    }
  };

  var addDirect = function(elem) {
    if (elem && elem.classList) {
      elem.classList.add(DIRECT_CLASS);
    }
  };

  var removeShowing = function(elem) {
    if (elem && elem.classList) {
      elem.classList.remove(SHOWING_CLASS);
    }
  };

  var removeHiding = function(elem) {
    if (elem && elem.classList) {
      elem.classList.remove(HIDING_CLASS);
    }
  };

  var removeDirect = function(elem) {
    if (elem && elem.classList) {
      elem.classList.remove(DIRECT_CLASS);
    }
  };


  $scope.setFocusItem = function(item, element) {
    var i, l, obj;

    $scope.focusItem = item;
    focusElement = element;

    if (item === 'breadcrumb1' || item === 'breadcrumb2') {
      if (item === 'breadcrumb1') {
        $scope.focus1 = true;
        $scope.focus2 = false;
      } else {
        $scope.focus1 = false;
        $scope.focus2 = true;
      }

      focusManager.setCurrent($scope, item);
//      $rootScope.tooltip.showTooltip(50, 93, $rootScope.pageManager.getTitle('back'), true, true);
    } else {
      $scope.focus1 = false;
      $scope.focus2 = false;

//      $rootScope.tooltip.hideTooltip();
      focusManager.setCurrent($scope, '');
    }
    $scope.$digest();
  };

  $scope.audioGuidance = function (scope, target) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };

    params.text = msgLang.audio_breadcrumb_back;
    audioGuidance.call(params);
  };

  play = function(eleCur, eleNew, isBreadcrums) {
    var log = '3 breadcrumbs.play, isBreadcrums=' + isBreadcrums;
    pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});
    transitionEnded_page = false;
    transitionEnded_breadcrums = false;
    prevMoving(eleCur, eleNew, isBreadcrums);
    afterMoving(eleCur, eleNew, isBreadcrums);
    move(eleCur, eleNew, isBreadcrums);
  };

  playCompleted = function(eleNew, isBreadcrums) {
    var log = '5 breadcrumbs.playCompleted, isBreadcrums=' + isBreadcrums;
    pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});
    // [WOSLQEVENT-69862]
    // [Service.SDPService.LGStore_Apps & Games] [Always] [Minor] 좌측 이전페이지
    // 버튼영역에 01 과 02가 겹쳐서 출력 됨
    // 숨겨질 breadcrumb의 위치 double check

    if (breadcrumbElements[0] === eleNew ||
      breadcrumbElements[1] === eleNew) {
      // breadcrumb 이동중

      var showingBreadcrumb, hidingBreadcrumb;
      for (var i = 0 ; i < breadcrumbElements.length ; i++) {
        if (breadcrumbElements[i] === eleNew) {
          showingBreadcrumb = breadcrumbElements[i];
        } else {
          hidingBreadcrumb = breadcrumbElements[i];
        }
      }

      // WOSLQEVENT-77011
      // [Service.SDPService.LGStore_Common Policy] [Always] [Major] 좌측 Breadcrumb 영역에
      // 이전 페이지의 UI가 과도현상 처럼 나타났다가 사라짐
      if (showingBreadcrumb) {
        if (!containsShowing(showingBreadcrumb)) {
          pmLog.write(pmLog.LOGKEY.BREADCRUMB, {
            message : '5 breadcrumbs.playCompleted, showingBreadcrumb does not contain showing'
          });

          addShowing(showingBreadcrumb);
        }
        if (containsHiding(showingBreadcrumb)) {
          pmLog.write(pmLog.LOGKEY.BREADCRUMB, {
            message : '5 breadcrumbs.playCompleted, showingBreadcrumb contains hiding'
          });
          removeHiding(showingBreadcrumb);
        }
      }
      if (hidingBreadcrumb) {
        if (containsHiding(hidingBreadcrumb)) {
          pmLog.write(pmLog.LOGKEY.BREADCRUMB, {
            message : '5 breadcrumbs.playCompleted, hidingBreadcrumb contains hiding'
          });
          // animation이 끝난 이후에는 hiding 가 없어야 함.
          removeHiding(hidingBreadcrumb);
        }
        if (containsShowing(hidingBreadcrumb)) {
          pmLog.write(pmLog.LOGKEY.BREADCRUMB, {
            message : '5 breadcrumbs.playCompleted, hidingBreadcrumb contains showing'
          });
          removeShowing(hidingBreadcrumb);
        }
      }

      if (hidingBreadcrumb && showingBreadcrumb) {
        // 숨겨진 breadcrumb이 보여진 breadcrumb의 오른쪽에 위치해야 함
        if (hidingBreadcrumb.getBoundingClientRect().left <
          showingBreadcrumb.getBoundingClientRect().right) {
          log = '5-1 breadcrumbs.playCompleted, hiding.left < showing.right' +
            ', hidingBreadcrumbRect=' + JSON.stringify(hidingBreadcrumb.getBoundingClientRect()) +
            ', hidingBreadcrumb.style.display=' + hidingBreadcrumb.style.display +
            ', showingBreadcrumbRect=' + JSON.stringify(showingBreadcrumb.getBoundingClientRect()) +
            ', showingBreadcrumb.style.display=' + showingBreadcrumb.style.display;

          pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});

          showingBreadcrumb.style.display = '';
          hidingBreadcrumb.style.display = 'none';

          log = '5-2 breadcrumbs.playCompleted, hiding.left < showing.right' +
            ', hidingBreadcrumbRect=' + JSON.stringify(hidingBreadcrumb.getBoundingClientRect()) +
            ', hidingBreadcrumb.style.display=' + hidingBreadcrumb.style.display +
            ', showingBreadcrumbRect=' + JSON.stringify(showingBreadcrumb.getBoundingClientRect()) +
            ', showingBreadcrumb.style.display=' + showingBreadcrumb.style.display;

          pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});
        } else {
          // 정상
          // console.log('breadcrumbs.playCompleted, hiding.left=' +
          //   hidingBreadcrumb.getBoundingClientRect().left + ', showing.right=' +
          //   showingBreadcrumb.getBoundingClientRect().right);
        }
      } else {
        // showingBreadcrumb 또는 hidingBreadcrumb가 undefined 이다.
        log = '5-3 breadcrumbs.playCompleted' +
          ', showingBreadcrumb=' + (showingBreadcrumb ? '!undefined' : 'undefined') +
          ', hidingBreadcrumb=' + (hidingBreadcrumb ? '!undefined' : 'undefined');

        pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});

        // 이전 breadcrumb이 숨겨지지 않는 현상이 간헐적으로 나타남
        // 애니메이션이 처리되지 않는 현상으로, hiding될 breadcrumb를 display: none 처리
        var shownBreadcrumb = getBreadcrumbElement(true);
        if (shownBreadcrumb) {
          shownBreadcrumb.style.display = '';
          log = '5-4 breadcrumbs.playCompleted, shownBreadcrumb=!undefined';
        } else {
          log = '5-5 breadcrumbs.playCompleted, shownBreadcrumb=undefined';
        }

        pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});

        var hidenBreadcrumb = getBreadcrumbElement(false);
        if (hidenBreadcrumb) {
          hidenBreadcrumb.style.display = 'none';
          log = '5-6 breadcrumbs.playCompleted, hidenBreadcrumb=!undefined';
        } else {
          log = '5-7 breadcrumbs.playCompleted, hidenBreadcrumb=undefined';
        }

        pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});
      }

      // panels-breadcrumbs
      $element[0].setAttribute('style', '');
    }
    if (pageMoveInOnCompletedCallback) {
      pageMoveInOnCompletedCallback();
      pageMoveInOnCompletedCallback = undefined;
    }
    if (pageMoveOutOnCompletedCallback) {
      pageMoveOutOnCompletedCallback();
      pageMoveOutOnCompletedCallback = undefined;
    } else {
      $scope.setRunning(false);
    }

    $rootScope.spinner.hideSpinner();
  };

  prevMoving = function(eleCur, eleNew, isBreadcrums) {
    eleNew.style.webkitTransitionDuration = '';
    $scope.$digest();
  };

  move = function(eleCur, eleNew, isBreadcrums) {
    // if (isBreadcrums)
    //   console.log('3-1 breadcrumbs00.move, isBreadcrums=' + isBreadcrums);

    var timeout = 10;
    if (device.isLite) {
      timeout = 50;
      setTimeout(function(){
        addHiding(eleCur);
      }, 10);

      // 자리이동
      setTimeout(function(){
        addShowing(eleNew);
      }, 50);

    } else {
      // [WOSLQEVENT-77008]애니메이션이 실행되고 변경 될 화면이 나와서
      // 사용자 입자에서 애니메이션이 실행되지 않는 것으로 보이는것으로 간주하여
      // CSS showing 클래스 먼저 추가 후 hidding클래스 추가
      addHiding(eleCur);
      $timeout(function() {
        addShowing(eleNew);
      }, 10);
    }
  };

  afterMoving = function(eleCur, eleNew, isBreadcrums) {
    var transitionEndTimeout;
    var transitionEndCallback = function() {
      var log = '4 breadcrumbs.afterMoving.transitionEndCallback begin, transitionEnded_breadcrums=' + transitionEnded_breadcrums +
          ', transitionEnded_page=' + transitionEnded_page +
          ', transitionEndTimeout=' + transitionEndTimeout +
          ', isBreadcrums=' + isBreadcrums;
      pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});

      // WOSLQEVENT-86651 CSS 애니메이션 이슈로 이미지 잔상이 남는 것을 방지하고자 transition end이벤트 발생 전에 hidden처리
      if (!eleCur.classList.contains('breadcrumb'))
        eleCur.style.display = 'none';

      if (isBreadcrums) {
        if (transitionEnded_breadcrums)
          return;
        transitionEnded_breadcrums = true;
      } else {
        if (transitionEnded_page)
          return;
        transitionEnded_page = true;
      }

      if (transitionEndTimeout) {
        $timeout.cancel(transitionEndTimeout);
        transitionEndTimeout = undefined;
      }

      eleCur.style.webkitTransitionDuration = '0';
      removeShowing(eleCur);
      removeHiding(eleCur);

      playCompleted(eleNew, isBreadcrums);
    };

    if (previousScope === 'featured') {
      // featured에서 이동할 때는, eleNew에서 webkitTransitionEnd 이벤트가 발생안하므로, eleCur를 사용
      var transitionEndCallback0011 = function() {
        // console.log('breadcrumbs0011111111.afterMoving.transitionEndCallback0000000000000, transitionEndTimeout=' + transitionEndTimeout);
        eleCur.removeEventListener('webkitTransitionEnd', transitionEndCallback0011, false);

        if (transitionEndTimeout) {
          transitionEndCallback();
        }
      };
      eleCur.addEventListener('webkitTransitionEnd', transitionEndCallback0011);
    } else {
      var transitionEndCallback0022 = function() {
        // console.log('breadcrumbs0022222222.afterMoving.transitionEndCallback0000000000000, transitionEndTimeout=' + transitionEndTimeout);
        eleNew.removeEventListener('webkitTransitionEnd', transitionEndCallback0022, false);

        if (transitionEndTimeout) {
          transitionEndCallback();
        }
      };
      eleNew.addEventListener('webkitTransitionEnd', transitionEndCallback0022);
    }

    // 예외 처리
    // current element와 new element 모두 webkitTransitionEnd를 타지 않은 경우
    transitionEndTimeout = $timeout(function() {
      var log = '4-0 breadcrumbs.afterMoving.transitionEndCallback.transitionEndTimeout begin';
      pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});

      if (transitionEndTimeout) {
        // console.error('breadcrumbs00.afterMoving, transitionEndTimeout passed');
        transitionEndCallback();
      }
    }, 2000);
  };

  var preExecuteBackCallback;


  $scope.executeAction = function(flag) {
    if(!device.isOnline) {
      $rootScope.$broadcast(eventKey.NETWORK_ERROR);
      return;
    }

    // onnow Logging
    try {
      if ($rootScope.pmLogValue.toUpperCase() === 'TVSHOWS' || $rootScope.pmLogValue.toUpperCase() === 'MOVIES') {
        device.onnowLogging = document.querySelector('.page').getAttribute('item');
        device.onnowLogging = device.onnowLogging.replace(/TS\|/g, '').replace(/MV\|/g,'');
      }
    } catch(e) {}

    var focusObject, target;
    focusObject = focusManager.getCurrent();
    if (focusObject.target != $scope.focusItem) {
      focusObject.target = $scope.focusItem;
    }
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target === 'breadcrumb1' || target === 'breadcrumb2') {
        $scope.executeBack($scope.scopeName);
      }
    }
  };

  var inProgress = false;
  $scope.executeBack = function(scopeName, callback) {
    if (focusManager.blockExecution()) {
      console.log('breadcrumbs.executeBack do nothig, scopeName=' + scopeName);
      return;
    }

    if (inProgress) {
      // console.log('aaaaaaaa 1 breadcrumbs.executeBack, goingBack, inProgress=' + inProgress);
      return;
    } else if ($scope.IsRunning()) {
      // console.log('aaaaaaaa 1 breadcrumbs.executeBack, goingBack, $scope.IsRunning()=' + $scope.IsRunning());
      return;
    }

    inProgress = true;

    if (!scopeName) {
      console.log('breadcrumbs.executeBack, scopeName=undefined');
    }

    focusManager.setState($scope.scopeName, true);
    panelElement.classList.add(BACKWARD_CLASS);
    $rootScope.isBackPressed = true;

    // console.log('aaaaaaaa 1 breadcrumbs.executeBack, goingBack, isRunning=' + $scope.IsRunning());

    var obj;
    var count = $rootScope.pageManager.getHistoryCount();
    if (count > 1) {
      obj = $rootScope.pageManager.getHistory(count - 2);
      if (obj && obj.param) {
        // goingBack는 onPageMoveOut 에서 사용됨
        obj.param.goingBack = true;
        // console.log('aaaaaaaa 2 breadcrumbs.executeBack, goingBack');
      }
    }

    if (callback) {
      // console.log('aaaaaaaa 10 breadcrumbs.executeBack, goingBack');
      callback();
    } else if (preExecuteBackCallback) {
      // console.log('aaaaaaaa 11 breadcrumbs.executeBack, goingBack');
      preExecuteBackCallback();
    } else {
      // console.log('aaaaaaaa 12 breadcrumbs.executeBack, goingBack');
      $scope.setFocusItem('', null);

      obj = $rootScope.pageManager.popHistory();
      $rootScope.draw(obj);
    }
    preExecuteBackCallback = undefined;
    inProgress = false;
  };

  $scope.removeFocus = function(target) {
    keyFocusBackCallback = undefined;

    if (!target)
      return;
    $scope.focusItem = '';
    $scope.focus1 = false;
    $scope.focus2 = false;
    $scope.$apply();
//    $rootScope.tooltip.hideTooltip();
  };

  $scope.moveFocusByKey = function(keyCode) {
    if (device.isRTL) {
      switch(keyCode) {
        case keyHandler.LEFT:
          keyCode = keyHandler.RIGHT;
          break;
        case keyHandler.RIGHT:
          keyCode = keyHandler.LEFT;
          break;
      }
    }
    var i, l, index, rect;

    if ($scope.focusItem === '') {
      var element = getBreadcrumbElement(true);
      if (element) {
        // 2개의 breadcrum중, 현재 보여지는 breadcrum
        var item = element.getAttribute('item');
        $scope.setFocusItem(item, element);
      }
      return;
    }

    if (keyCode === keyHandler.RIGHT) {
      if (keyFocusBackCallback) {
        keyFocusBackCallback();
      } else {
        // mouse로 focus 이동후, 리모콘 key로 이동하는 경우

        rect = breadcrumbElements[0].getBoundingClientRect();
        if (rect.left > breadcrumbElements[1].getBoundingClientRect().left) {
          rect = breadcrumbElements[1].getBoundingClientRect();
        }

        $rootScope.$broadcast('focus', 'main', keyCode, rect);
      }
    } else if (keyCode === keyHandler.LEFT) {
      $scope.executeBack();
    }
  };

  var keyFocusBackCallback;

  var getBreadcrumbElement = function(showing) {
    var element;
    for (var i = 0 ; i < breadcrumbElements.length ; i++) {
      if (showing && containsShowing(breadcrumbElements[i])) {
        element = breadcrumbElements[i];
        break;
      } else if (!showing && !containsShowing(breadcrumbElements[i])) {
        element = breadcrumbElements[i];
        break;
      }
    }
    return element;
  };

  var validateBreadcrumElement = function() {
    for (var i = 0 ; i < breadcrumbElements.length ; i++) {
      // showing hiding 둘 다 없다면 showing 추가
      if (containsShowing(breadcrumbElements[i]) &&
        containsHiding(breadcrumbElements[i])) {
        addShowing(breadcrumbElements[i]);
      }
      // showing hiding 둘 다 있다면 제거
      if (containsShowing(breadcrumbElements[i]) &&
        containsHiding(breadcrumbElements[i])) {
        removeShowing(breadcrumbElements[i]);
        removeHiding(breadcrumbElements[i]);
      }
    }
    $scope.hide = false;
  };

  var focusHandler = function(e, target, callback) {
    var i, l, arr, gap;

    if (target != $scope.scopeName)
      return;

    e.preventDefault();

    var element = getBreadcrumbElement(true);
    if (element) {
      // 2개의 breadcrum중, 현재 보여지는 breadcrum
      var item = element.getAttribute('item');
      $scope.setFocusItem(item, element);

      keyFocusBackCallback = callback;
    }
  };

  updateStepIndex = function (element, backward, reset) {
    // breadcrum index 계산
    if (reset) {
      $scope.stepIndex = 1;
    } else {
      $scope.stepIndex += (backward ? -1 : 1);
      if ($scope.stepIndex < 1)
        $scope.stepIndex = 1;
    }

    // 연속 동작으로 bradcrumb이 이미 동작중인 경우 예외
    if ($scope.executeException){
      $scope.stepIndex = 2;
      $scope.executeException = false;
    }

    // 무작위로 마우스 클릭하는 경우의 예외 처리
    if (!element) {
      console.log('breadcrumbs.updateStepIndex, element=undefined 1');
      element = getBreadcrumbElement(false);
    }
    if (!element) {
      console.log('breadcrumbs.updateStepIndex, element=undefined 2');
      validateBreadcrumElement();
      element = getBreadcrumbElement(false);
    }
    if (!element) {
      console.log('breadcrumbs.updateStepIndex, element=undefined 3');
      element = breadcrumbElements[0];
    }

    var curItem = element.getAttribute('item');
    var newIndex = $rootScope.pageManager.getHistoryCount() - 1;
    if (newIndex < 1) {
      newIndex = 1;
    }

    // 한 자리수이면, 앞에 0을 붙이기
    newIndex = ((newIndex < 10) ? '0' : '') + newIndex;

    if (curItem === 'breadcrumb1') {
      // 현재 선택된 div와 다른 div로
      $scope.stepIndex2 = newIndex;
    } else {
      $scope.stepIndex1 = newIndex;
    }
  };

  $scope.onPageFromDeepLink = function() {
    // deep link 타고 들어온 경우, breadcrumb이 클릭되면 featured로 이동
    var i, oldBreadcrumb, newBreadcrumb;
    for (i = 0 ; i < breadcrumbElements.length ; i++) {
      if (containsShowing(breadcrumbElements[i]))
        oldBreadcrumb = breadcrumbElements[i];
      else
        newBreadcrumb = breadcrumbElements[i];
    }

    updateStepIndex(newBreadcrumb, null, true);
    $scope.hide = false;
    $scope.setRunning(false);

    $timeout(function() {
      $scope.removeDirectClass();
    }, 300);
  };

  $scope.removeDirectClass = function () {
    // direct를 삭제해야 animation이 실행됨
    var pages = document.getElementsByClassName('page');

    // direct page가 있는지 확인
    for (i = 0 ; pages && i < pages.length ; i++) {
      if (pages[i].classList.contains('main-error'))
        continue;

      if (containsDirect(pages[i])) {
        addShowing(pages[i]);
        removeDirect(pages[i]);
      }
    }
  };

  $scope.showBreadCrumbs = function (show) {
    $scope.hide = !show;
  };

  var checkPageCount = function(message, expected) {
    var pages = document.getElementsByClassName('page');
    var count = 0;

    // direct page가 있는지 확인
    for (i = 0 ; i < pages.length ; i++) {
      if (pages[i].classList.contains('main-error'))
        continue;
      count++;
    }

    var pass = (count === expected);
    if (!pass) {
      var log = message + ', count=' + count + ', expected=' + expected;
      pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});
    }

    return pass;
  };

  $scope.onPageMoveIn = function (currentScope, backExecuteCallback, onCompletedCallback) {
    var log = '2 breadcrumbs.onPageMoveIn, going out from \'' + previousScope + '\'' +
        ', going into \'' + currentScope + '\'';
    if (checkPageCount(log, 2)) {
      pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});
    }

    var i, oldBreadcrumb, newBreadcrumb;
    var that = this;

    newScope = currentScope;

    if (newScope === 'featured') {
      // featured로 이동중에는 숨기도록
      for (i = 0 ; i < breadcrumbElements.length ; i++) {
        breadcrumbElements[i].style.display = 'none';
      }
    } else {
      // featured이외 다른 페이지로 이동중에는 보이도록
      for (i = 0 ; i < breadcrumbElements.length ; i++) {
        breadcrumbElements[i].style.display = '';
      }
    }

    // [WOSLQEVENT-101736] [Service.SDPService.LGStore_Apps & Games/Premium] [Always] [Minor]
    // 좌측에 focus 생성 안됨 (click 시 back 동작은 함)
    $rootScope.drawer.decideLineDisplay(currentScope);

    focusManager.setState(currentScope, true);
    preExecuteBackCallback = backExecuteCallback;
    pageMoveInOnCompletedCallback = function() {
      log = '6 breadcrumbs.onPageMoveIn.pageMoveInOnCompletedCallback, running=' + that.IsRunning();
      pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});

      onCompletedCallback();
      // focusManager.setState(previousScope, false);
      focusManager.setState(currentScope, false);
      // focusManager.setState($scope.scopeName, false);
      // $scope.setRunning(false);
    };

    // 숨겨질 breadcrumb과 새로 보여질 breadcrumb을 가져온다
    for (i = 0 ; i < breadcrumbElements.length ; i++) {
      if (containsShowing(breadcrumbElements[i]))
        oldBreadcrumb = breadcrumbElements[i];
      else
        newBreadcrumb = breadcrumbElements[i];
    }

    var pages, oldPage, newPage;
    // featured에서는 direct를 제거한 이후, showing과 hiding을 추가
    if (previousScope === 'featured') {
      // 숨겨질 page와 새로 보여질 page을 가져온다
      pages = document.getElementsByClassName('page');
      for (i = 0 ; i < pages.length ; i++) {
        if (pages[i].classList.contains('main-error'))
          continue;

        if (pages[i].classList.contains('panel-main'))
          oldPage = pages[i];
        else
          newPage = pages[i];
      }

      $scope.removeDirectClass();
    } else {
      // 숨겨질 page와 새로 보여질 page을 가져온다
      pages = document.getElementsByClassName('page');

      // direct page가 있으면 제거
      $scope.removeDirectClass();

      for (i = 0 ; i < pages.length ; i++) {
        if (pages[i].classList.contains('main-error'))
          continue;

        if (containsShowing(pages[i]))
          oldPage = pages[i];
        else
          newPage = pages[i];
      }
    }

    if ($scope.hide) {
      // 방어코드
      // featured이외 다른 페이지로 이동했을 때, breadcrumb 영역이 안보이는 경우가 있음
      for (i = 0 ; i < breadcrumbElements.length ; i++) {
        breadcrumbElements[i].style.display = '';
        pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : 'breadcrumbs.onPageMoveIn, set breadcrumb display to empty'});
      }

      $timeout(function() {
        // 현재 breadcrum이 숨김상태
        // featured에서 타 카타고리로 이동하는 경우
        updateStepIndex(newBreadcrumb, null, true);
        $scope.hide = false;
      }, 200);
    } else {
      // 무작위로 마우스 클릭하는 경우의 예외 처리
      if (!oldBreadcrumb) {
        log = 'breadcrumbs.onPageMoveIn, oldBreadcrumb=undefined 1';
        pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});
        oldBreadcrumb = getBreadcrumbElement(false);
      }
      if (!oldBreadcrumb) {
        log = 'breadcrumbs.onPageMoveIn, oldBreadcrumb=undefined 2';
        pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});
        validateBreadcrumElement();
        oldBreadcrumb = getBreadcrumbElement(false);
      }
      if (!oldBreadcrumb) {
        log = 'breadcrumbs.onPageMoveIn, oldBreadcrumb=undefined 3';
        pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});
        oldBreadcrumb = breadcrumbElements[0];
      }
      if (!newBreadcrumb) {
        if (oldBreadcrumb === breadcrumbElements[0]) {
          newBreadcrumb = breadcrumbElements[1];
        } else {
          newBreadcrumb = breadcrumbElements[0];
        }
      }

      var backward = panelElement.classList.contains(BACKWARD_CLASS);
      updateStepIndex(oldBreadcrumb, backward);

      if (newScope !== 'featured') {
        // featured로 이동하는 경우는 Breadcrumb 이동 필요없음
        play(oldBreadcrumb, newBreadcrumb, true);
      }
    }
    play(oldPage, newPage);
  };

  $scope.onPageMoveOut = function (currentScope, onCompletedCallback) {
    var log = '1 breadcrumbs.onPageMoveOut, going out of ' + currentScope;
    if (checkPageCount(log, 2)) {
      pmLog.write(pmLog.LOGKEY.BREADCRUMB, {message : log});
    }

    previousScope = currentScope;

    if (previousScope === 'featured') {
      for (i = 0 ; i < breadcrumbElements.length ; i++) {
        breadcrumbElements[i].style.display = '';
      }
    }

    focusManager.setState(currentScope, true);

    // var that = this;
    pageMoveOutOnCompletedCallback = function() {
      $timeout(function() {
        // console.log('breadcrumbs.onPageMoveIn.pageMoveOutOnCompletedCallback, running=' + that.IsRunning());
        onCompletedCallback();
        focusManager.setState(previousScope, false);
        $scope.setRunning(false);
      }, timeOutValue.DESTROYING);
    };

    var param = $rootScope.pageManager.peekHistory();
    if (!param.goingBack) {
      // executeBack 에서 추가된 css 속성 제거
      panelElement.classList.remove(BACKWARD_CLASS);
    }

    if (currentScope === 'featured') {
      // featured에서 다른 카타고리로 이동중
      $scope.stepIndex = 0;
      return;
    }

    var categoryChanging = true;
    param.page = param.page ? param.page : '';

    if (currentScope === 'tvshows' || currentScope === 'TVShowDetail') {
      if ((param.page === 'detailList' || param.page === 'list') &&
        (param.module && (param.module.indexOf('|') >= 0))) {
        if (param.module.split('|')[0] === 'TS') {
          categoryChanging = false;
        }
      } else if (param.inLink && param.page === 'detailApp' && param.module) {
        // tvshow의 list에서 play icon을 클릭하여, 넘어가는 경우
        categoryChanging = false;
      }
    } else if (currentScope === 'movies' || currentScope === 'MovieShowDetail') {
      if ((param.page === 'detailList' || param.page === 'list' ) &&
        (param.module && (param.module.indexOf('|') >= 0))) {
        if (param.module.split('|')[0] === 'MV') {
          categoryChanging = false;
        }
      } else if (param.inLink && param.page === 'detailApp' && param.module) {
        // movies의 list에서 play icon을 클릭하여, 넘어가는 경우
        categoryChanging = false;
      }
    } else if (currentScope === 'premium') {
      if (param.page === 'detailApp') {
        categoryChanging = false;
      }
    } else if (currentScope === 'detailApp') {
      if (param.page === 'detailList' || param.page === 'detailApp' ||
        param.page === 'myPage' || param.page === 'detailTheme') {
        categoryChanging = false;
      }
    } else if (currentScope === 'appsngames' || currentScope === 'detailTheme') {
      if (param.page === 'detailApp' || param.page === 'detailTheme') {
        categoryChanging = false;
      }
    } else if (currentScope === 'mypage') {
      if (param.page === 'detailApp') {
        categoryChanging = false;
      }
    }

    if (categoryChanging)
      $scope.stepIndex = 0;
  };

  var initialize = function() {
    $rootScope.breadcrumb = $scope;
    $scope.$on('focus', focusHandler);

    panelElement = document.getElementsByClassName('panels')[0];
    breadcrumbElements = document.getElementsByClassName('breadcrumb');
    for (i = 0; i < breadcrumbElements.length; i++) {
      $scope.setMouseEvent(breadcrumbElements[i]);
    }
  };

  initialize();
});
