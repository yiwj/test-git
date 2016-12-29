app.directive('popupMain', function() {
  return {
    restrict: 'A',
    replace: true,
    scope: {},
    controller: 'popupMainController',
    //templateUrl: './resources/html/popupMain.html'
    template: popupMainTmpl
  };
});

app.controller('popupMainController', function($scope, $controller, $element, $rootScope, $timeout, focusManager, keyHandler, marquee, util, appClose, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  $scope.scopeName = 'popupMain';
  $scope.focusItem = '';
  $scope.drawed = false;
  $scope.appCloseParams = undefined;
  $scope.hide = true;

  // popup show
  $scope.isPopup = false;

  var owner = null;
  var focusElement = null;

  $scope.setFocusItem = function(item, element) {
    var i, j;

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
      focusManager.setCurrent($scope, item);
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }
  };

  $scope.showPopup = function(scope, popOpts) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: false
    };

    if(popOpts && popOpts.lgContentStore){
      params.text = popOpts.lgContentStore;

      if(popOpts.title){
        params.text += '. ';
        params.text += popOpts.title;
      }

      if(popOpts.subTitle){
        params.text += '. ';
        params.text += popOpts.subTitle;
      }

      if(popOpts.button){
        params.text += '. ';
        params.text += msgLang.ok;
        params.text += '. ';
        params.text += msgLang.audio_button_button;
      }
    }

    audioGuidance.call(params);

    $scope.popOpts = popOpts;
    $scope.isPopup = true;

    $scope.hide = false;
    $scope.showing = true;
    $scope.$apply();

    if (document.querySelectorAll('[drawer]')[0]) document.querySelectorAll('[drawer]')[0].remove();
    $scope.setMouseEvent($element[0].getElementsByClassName('button')[0]);

    util.async(function() {
      $scope.setDefaultFocus();
      $scope.open = true;
      $scope.$apply();
    });
  };

  $scope.hidePopup = function(key) {
    focusManager.setState('popup', false);

    $scope.isViewPopup = false;
    $scope.isPopup = false;
    $scope.isContinueWatching = false;

    $scope.open = false;
    $scope.$apply();

    $timeout(function() {
      if (owner === null) return;
      owner.recoverFocus();
    }, 300);

    $timeout(function() {
      if ($scope.open === false) {
        $scope.hide = true;
        $scope.$apply();
      }
    }, 1000);
  };

  $scope.executeAction = function() {
    var focusObject;
    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      if (focusObject.target === 'ok') {
        console.log('good-bye');
        requestParam = {appId: 'com.webos.app.discovery', appCloseParams: ''};
        appClose.call(requestParam);
      }
    }
  };

  $scope.setDefaultFocus = function() {
    var target;

    target = $element[0].getElementsByClassName('button')[0];
    if (target) {
      item = target.getAttribute('item');
      $scope.setFocusItem(item, target);
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

  $scope.moveFocusByKey = function(keyCode) {
    $scope.setDefaultFocus();
  };

  var initialize = function() {
    $rootScope.popupMain = $scope;
  };

  initialize();
});
