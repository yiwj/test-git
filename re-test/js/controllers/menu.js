app.directive('menu', function() {
  return {
    restrict: 'A',
    scope: true,
    controller: 'menuController',
    templateUrl: './resources/html/menu.html'
  };
});

app.controller('menuController', function($scope, $controller, $element, $rootScope, focusManager, keyHandler, marquee, util) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var lastFocus = {};

  $scope.scopeName = 'menu';
  $scope.focusItem = '';
  $scope.menu = [];

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
      focusManager.setCurrent($scope, item);
      lastFocus.item = item;
      lastFocus.element = element;
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }
  };

  $scope.executeAction = function() {
    var focusObject, target;

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target == 'tvshows') {
        $rootScope.draw({page: 'list', module: 'ME2212'});
      } else if (target == 'movies') {
        $rootScope.draw({page: 'list', module: 'ME2312'});
      } else if (target == 'premium') {
        $rootScope.draw({page: 'premiumList', module: ''});
      } else if (target == '3d') {
        $rootScope.draw({page: 'list3d', module: '_top5'});
      } else if (target == 'appsngames') {
        $rootScope.draw({page: 'listApp', module: 'ANG001'});
      } else if (target == 'mypage') {
        $rootScope.draw({page: 'myPage', module: ''});
      }
      $scope.setFocusItem('', null);
    }
  };

  var drawMenu = function(e) {
    var i, l, menu, obj, arr;

    e.preventDefault();

    if ($scope.menu.length > 0) return;

    menu = $scope.$parent.discoveryData.menuList;
    l = menu.length;
    for (i = 0; i < l; i++) {
      $scope.menu.push({
        name: menu[i].serviceCode,
        title: menu[i].menuText
      });
    }
    $scope.menu.push({
      name: 'mypage',
      title: msgLang.myPage_title
    });
    $scope.$apply();

    arr = $element[0].getElementsByClassName('menu-item');
    for (i = 0; i <= l; i++) {
      $scope.setMouseEvent(arr[i]);
    }

    obj = $element[0];
    for (i in obj.childNodes) {
      if (obj.childNodes[i].nodeType == document.COMMENT_NODE) {
        obj.removeChild(obj.childNodes[i]);
      }
    }
  };

  $scope.removeFocus = function(target) {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
    }
  };

  var getItemByName = function(name) {
    var i, items, item;

    item = {name: '', element: null};

    items = $element[0].getElementsByClassName('menu-item');
    for (i = 0; i < items.length; i++) {
      if (items[i].getAttribute('item') == name) {
        item.name = name;
        item.element = items[i];
        break;
      }
    }

    return item;
  };

  $scope.moveFocusByKey = function(keyCode) {
    var i, l, index, item, rect;

    if ($scope.focusItem == '') {
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    if (keyCode == keyHandler.RIGHT) return;

    if (keyCode == keyHandler.LEFT) {
      rect = {x: 0, y: focusElement.offsetTop + 102, width: 290, height: 102};
      $scope.$parent.$broadcast('focus', 'scroll', keyCode, rect);
      return;
    }

    index = -1;
    l = $scope.menu.length;
    for (i = 0; i < l; i++) {
      if ($scope.menu[i].name == $scope.focusItem) {
        index = i;
        break;
      }
    }

    if (keyCode == keyHandler.UP) {
      if (index == 0) {
        if ($scope.$parent.expand) {
          console.log('move focus to drawer');
        } else {
          $scope.$parent.$broadcast('focus', 'header', keyCode, null);
        }
        return;
      }
      item = getItemByName($scope.menu[index - 1].name);
      $scope.setFocusItem(item.name, item.element);
    } else if (keyCode == keyHandler.DOWN) {
      if (index >= l - 1) return;
      item = getItemByName($scope.menu[index + 1].name);
      $scope.setFocusItem(item.name, item.element);
    }
  };

  var focusHandler = function(e, target, keyCode, rect) {
    var arr, obj, y;

    if (target != $scope.scopeName) return;
    e.preventDefault();

    arr = $element[0].getElementsByClassName('menu-item');
    obj = arr[0];
    y = obj.offsetTop + obj.clientHeight;
    if (rect.y > y) obj = arr[arr.length - 1];
    $scope.setFocusItem(obj.getAttribute('item'), obj);
  };

  var initialize = function() {
    $scope.$on('draw', drawMenu);
    $scope.$on('focus', focusHandler);
  };

  initialize();
});
