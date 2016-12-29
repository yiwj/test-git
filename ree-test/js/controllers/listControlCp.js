app.directive('listControlCp', function() {
  return {
    restrict: 'A',
    scope: {},
    controller: 'listControlCp',
//    templateUrl: './resources/html/listControlCp.html',
    template: listControlCpTmpl,
    replace: true,
    link: function ($scope, $element, $attrs) {
      $scope.listtype = $attrs.listtype;
      $scope.isMyPage = $attrs.ismypage;
    }
  };
});

app.controller('listControlCp', function($scope, $controller, $element, $attrs, server, eventKey, device,
  $rootScope, focusManager, keyHandler, marquee, util, storage, pmLog) {
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
    console.log('listControlCp.executeAction');

    if (focusManager.blockExecution()) {
      console.log('listControlCp.executeAction, blockExecution is true');
      return;
    }

    var appId = 'com.webos.app.discovery';

    item = params.target;
    var objs = $element[0].getElementsByClassName('item-apps');
    var delObj;
    for (var i = 0 ; i < objs.length ; i++) {
      if(objs[i].classList.contains('check-on')) {
        delObj = objs[i].getAttribute('item');
        objs[i].classList.remove('check-on');

        if(!device.isLocalJSON) {
          var execId = objs[i].getAttribute('item-id');
          var params = {
            api : '/discovery2016/user/cp/unregister',
            method : 'post',
            params : {
              app_id: appId,
              exec_id: execId
            }
          };
          server.requestApi(eventKey.UNREGIST_CP, params);
        }
        // unregister 후 아래 if문을 타게 되어 다시 register가 되기 때문에 break로 for문을 탈출한다.
      }
    }

    for (var i = 0 ; i < objs.length ; i++) {
      if (objs[i].getAttribute('item') === item && delObj !== item) {
        objs[i].classList.add('check-on');

        if(!device.isLocalJSON) {
          var execId = objs[i].getAttribute('item-id');
          var params = {
            api : '/discovery2016/user/cp/register',
            method : 'post',
            params : {
              app_id: appId,
              exec_id: execId
            }
          };
          server.requestApi(eventKey.REGIST_CP, params);
        }
        break;
      }
    }
  };

  $scope.restoreScrollPos = function(reset) {
    var module, scrollY, oldScrollY, param, itemId, result, element, itemHeight;

    var rowYFrom;
    var rowYTo;
    var scrollYFrom;
    var scrollYTo;

    $scope.scrollResetting = true;
    param = $rootScope.pageManager.peekHistory();
    module = param.module;

    if (!module)
      module = '1';

    if (module === $scope.$parent.selectedMenu) {
      oldScrollY = $rootScope.pageManager.getParam('scrollY');
      oldScrollY *= -1;

      itemClass = $rootScope.pageManager.getParam('item');
      itemId = $rootScope.pageManager.getParam('itemId');
      if (itemId) {
        result = $scope.getItemRowColByItemId(itemClass, itemId);
        if (result) {
          if (result.row >= 0) {
            $scope.$parent.defaultFocusItemClass = result.itemClass;
            rowYFrom = $scope.row[result.row].y;
            element = $element[0].getElementsByClassName(result.itemClass)[0];
            if (element) {
              rowYTo = rowYFrom + element.offsetHeight;
            }
          }

          if (rowYFrom !== undefined) {
            scrollYFrom = oldScrollY;
            scrollYTo = scrollYFrom + $scope.scroll.wrapperH;

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
        $scope.scroll.scrollTo(0, scrollY, 300, true);
        return;
      }
    }

    if (reset)
      $scope.scroll.scrollTo(0, 0, 0);
  };

  $scope.getItemRowColByItemId = function(itemClass, itemId) {
    var i, r, c, itemRow, target, indexWithSplit = 0;

    element = $element[0].getElementsByClassName(itemClass);
    if (element && (element.length > 0)) {
      var temp = element[0].getAttribute('item-id');
      if (temp === itemId) {
        var arr = itemClass.replace('item', '').split('-');
        if (arr && (arr.length > 0)) {
          r = parseInt(arr[0], 10);
          c = parseInt(arr[1], 10);

          var rowWithSplit = 0;
          for (i = 0 ; i < $scope.row.length ; i++) {
            if ($scope.row[i].type === 'split')
              continue;

            if (rowWithSplit === r) {
              return {row: i, col: c, itemClass: itemClass};
            }

            rowWithSplit++;
          }
        }
      }
    }

    for (r = 0, itemRow = 0 ; r < $scope.maxRowCount ; r++) {
      // $scope.listData.itemList에 split도 있기 때문
      if (indexWithSplit < $scope.listData.itemList.length &&
        $scope.listData.itemList[indexWithSplit].type === 'split') {
        indexWithSplit++;
        continue;
      }

      for (c = 0 ; c < $scope.itemPerRow ; c++) {
        if (indexWithSplit >= $scope.listData.itemList.length) {
          // no more
          r = $scope.maxRowCount;
          c = $scope.itemPerRow;
          break;
        }

        // row가 itemPerRow 개수보다 작은 개수의 item들을 가진 경우
        if ($scope.listData.itemList[indexWithSplit].type === 'split') {
          indexWithSplit++;
          r++;
          // split은 row 전체이므로
          break;
        }

        var itemId0 = $scope.listData.itemList[indexWithSplit].id;

        if (itemId === itemId0) {
          // App & Game
          itemClass = 'item' + itemRow.toString() + '-' + c.toString();
          return {row: r, col: c, itemClass: itemClass};
        }

        if (itemId0 && itemId0.indexOf('|') >= 0) {
          itemId0 = itemId0.split('|')[1];
          if (itemId === itemId0) {
            // 2_MOVIE
            itemClass = 'item' + itemRow.toString() + '-' + c.toString();
            return {row: r, col: c, itemClass: itemClass};
          }
        }

        indexWithSplit++;
      }
      itemRow++;
    }
  };

});
