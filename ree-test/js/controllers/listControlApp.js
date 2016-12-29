app.directive('listControlApp', function() {
  return {
    restrict: 'A',
    scope: {},
    controller: 'listControlApp',
    template: listControlAppTmpl,
    replace: true,
    link: function ($scope, $element, $attrs) {
      $scope.listtype = $attrs.listtype;
      $scope.isMyPage = $attrs.ismypage;
    }
  };
});

app.controller('listControlApp', function($scope, $controller, $element, $attrs,
  $rootScope, focusManager, keyHandler, marquee, util, storage, pmLog, adultProcess, device) {
  angular.extend(this, $controller('listControl', {
    $scope: $scope,
    $controller: $controller,
    $element: $element,
    $attrs: $attrs,
    $rootScope: $rootScope,
    focusManager: focusManager,
    keyHandler: keyHandler,
    marquee: marquee,
    util: util,
    storage: storage,
    pmLog: pmLog
  }));

  $scope.getRows = function() {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8];
  };

  $scope.getItemWidth = function() {
    return 450;
  };

  $scope.getNoDataIconClass = function() {
    return 'type-appgame';
  };

  $scope.executeAction = function(params) {
    if (focusManager.blockExecution()) {
      console.log('list.executeAction, blockExecution is true');
      return;
    }

    if (params && params.focusElement) {
      var itemId, itemType, itemAge, item, isAdultContent;

      isAdultContent = false;
      itemId = params.focusElement.getAttribute('item-id');
      itemType = params.focusElement.getAttribute('item-type');
      item = params.pageElement.getAttribute('item');
      itemAge = params.focusElement.getAttribute('item-age');

      /* Adult apps are only checked in the depth 3 page.
      if (itemAge ) {
        isAdultContent = adultProcess.getAdultContentsFlag(itemAge);
        if (isAdultContent && device.auth.adultStatus != 'Verified'){
          adultProcess.execProcess(itemId);
          return;
        }
      }
      */

      var pageParam = {page: 'listApp', module: item, category: $scope.$parent.selectedCategory};
      $rootScope.pageManager.chgHistory(pageParam);
      $rootScope.pageManager.setParam('scrollY', $scope.scroll.y);
      $rootScope.pageManager.setParam('module', $scope.$parent.selectedMenu);
      $rootScope.pageManager.setParam('filter', $scope.$parent.selectedFilter);
      $rootScope.pageManager.setParam('item', params.target);
      $rootScope.pageManager.setParam('itemId', itemId);
      $rootScope.pageManager.setParam('itemType', itemType);

      pmLog.write(pmLog.LOGKEY.CONTENTS_CLICK, {
        menu_name : 'List Page',
        contents_type : 'Apps',
        contents_category : $rootScope.pmLogValue,
        contents_id : itemId,
        sub_menu_name : $scope.$parent.selectedMenu,
        sub_sub_menu_name : ($scope.$parent.selectedCategory ? $scope.$parent.selectedCategory : '')
      });

      if (itemType == 'app') {
        $rootScope.draw({
          page: 'detailApp',
          module: itemId,
          inLink: true
        });
      } else {
        $rootScope.draw({
          page: 'detailTheme',
          module: itemId,
          inLink: false
        });
      }
    } else if (focusManager.getCurrent() &&
      focusManager.getCurrent().scope &&
      focusManager.getCurrent().scope.scopeName === 'scroll' &&
      focusManager.getCurrent().scope.$parent === $scope) {
      // WOSLQEVENT-82783
      // [Service.SDPService.LGStore_Common Policy] [Always] [Minor]
      // back key 동작하지 않음
      var target = focusManager.getCurrent().target;
      if (target === 'back') {
        $rootScope.breadcrumb.executeBack($scope.scopeName);
      }
    }

    return true;
  };
});
