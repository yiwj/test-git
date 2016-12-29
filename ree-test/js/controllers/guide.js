app.directive('guide', function() {
  return {
    restrict: 'A',
    scope: {},
    controller: 'guideController',
    templateUrl: './resources/html/guide.html'
//    template: guideTmpl
  };
});

app.controller('guideController', function($scope, $controller, $element, $rootScope, focusManager, keyHandler, marquee, $timeout, device, server, eventKey, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  $scope.scopeName = 'guide';
  $scope.focusItem = '';

  // popup show
  $scope.isViewGuide = false;

  var owner = null;
  var focusElement = null;
  var _onCloseCallback;

  $scope.setFocusItem = function(item, element) {
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
      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
      focusManager.setCurrent($scope, item, element);
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

    if ($scope.guide_10) {
      params.text = $scope.guide_10;
      params.text += '. ';
      params.text += $scope.guide_10_desc;
      params.text += '. ';
      params.text += $scope.guide_11;
      params.text += '. ';
      params.text += $scope.guide_11_desc;
      params.text += '. ';
      params.text += $scope.guide_12;
      params.text += '. ';
      params.text += $scope.guide_12_desc;
      params.text += '. ';
      params.text += $scope.guide_13;
    }

    var btnName = null;
    if (element && element.querySelector('.focus .text')) {
      btnName = element.querySelector('.focus .text').innerText;
    }

    if(btnName){
      params.text += '. ';
      params.text += btnName;
      params.text += '. ';
      params.text += msgLang.audio_button_button;
    }

    audioGuidance.call(params);
  };

  $scope.showViewGuide = function(scope, onCloseCallback) {
    $scope.isViewGuide = true;
    owner = scope;
    focusManager.setState('guide', true);
    _onCloseCallback = onCloseCallback;

    $scope.$digest();

    // mouse event
    $scope.setMouseEvent($element[0].getElementsByClassName('guide-close-button')[0]);

    // defalut focus
    $scope.setDefaultFocus('guide-close-button');
  };

  $scope.removeFocus = function(target) {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
      $rootScope.tooltip.hideTooltip();
    }
  };

  $scope.hideGuide = function(key) {
    focusManager.setState('guide', false);

    $scope.isViewGuide = false;
    if(owner && (owner.scopeName === 'mypage' || owner.scopeName === 'featured')) owner.recoverFocus();
    $scope.$digest();

    if (_onCloseCallback) {
      _onCloseCallback();
    }
  };

  $scope.setDefaultFocus = function(itemName) {
    var target, item;

    if(itemName === undefined || itemName === null || itemName === "") {
      target = $element[0].getElementsByClassName('guide-close-button')[0];
    } else {
      target = $element[0].getElementsByClassName(itemName)[0];
    }
    if (target) {
      item = target.getAttribute('item');
      marquee.setTarget(null);

      $scope.setFocusItem(item, target);
      //$scope.setFocusItem() 내 중복으로 주석 처리
      //focusManager.setCurrent($scope, item);
    }
  };

  $scope.executeAction = function() {
    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target == 'close') {
        $scope.setFocusItem('', null);
        $scope.hideGuide();
        if ($rootScope.popupMain.isPopup) {
          $rootScope.popupMain.setDefaultFocus();
        }
        /*가이드 닫은 후 공지사항이 존재할 경우 공지사항을 보여준다.*/
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
      } else {
        owner.getItem(focusElement);

        $scope.setFocusItem('', null);
        $scope.hideGuide();

        $scope.$apply();
      }
    }
  };

  $scope.moveFocusByKey = function(keyCode) {
    $scope.setDefaultFocus();
  };

  var initialize = function() {
    $timeout(function(){
      // NCVTDEFECT-969, WOSLQEVENT-51052 번역문구 이슈
      $scope.guide_10 = msgLang.guide_10;
      $scope.guide_10_desc = msgLang.guide_10_desc;
      $scope.guide_11 = msgLang.guide_11;
      $scope.guide_11_desc = msgLang.guide_11_desc;
      $scope.guide_12 = msgLang.guide_12;
      $scope.guide_12_desc = msgLang.guide_12_desc;
      $scope.guide_13 = msgLang.guide_13;
      $scope.close = msgLang.close;
      $rootScope.guide = $scope;
    }, 200);
  };

  initialize();
});
