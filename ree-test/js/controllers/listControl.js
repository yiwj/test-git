app.controller('listControl', function($scope, $controller, $element, $attrs, $timeout,
  $rootScope, focusManager, keyHandler, marquee, util, storage, pmLog, device) {
  var requestedAppends = false;
  var listHeight = 0;
  var scrollByKey = false;
  $scope.maxRowCount = 9; //실제 view에 노출되는 row 갯수
  var maxSplitCount = 3; //실제 view에 노출되는 split 갯수
  $scope.itemPerRow = 5; //하나의 row에 들어가는 아이템 갯수
  var visibleRowCount = 5;
  var itemH = device.isHD ? 333 : 500;
  var splitH = device.isHD ? 30 : 45;
  var promotionH = device.isHD ? 233 : 350;
  var firstRowY = device.isHD ? 40 : 60;
  var isHiddenBefore = false;
  var itemBefore = 0;
  $scope.scopeName = '';
  $scope.drawed = false;
  $scope.listData = null;
  $scope.splitCount = 0;
  $scope.itemRowCount = 0;
  $scope.view = {
    s0: false,
    s1: false,
    s2: false,
    r0: false,
    r1: false,
    r2: false,
    r3: false,
    r4: false,
    r5: false,
    r6: false,
    r7: false,
    r8: false
  };
  $scope.row = [];
  $scope.split0 = -1;
  $scope.split1 = -1;
  $scope.split2 = -1;
  $scope.split3 = -1;
  $scope.split4 = -1;
  $scope.row0 = [-1, -1, -1];
  $scope.row1 = [-1, -1, -1];
  $scope.row2 = [-1, -1, -1];
  $scope.row3 = [-1, -1, -1];
  $scope.row4 = [-1, -1, -1];
  $scope.row5 = [-1, -1, -1];
  $scope.row6 = [-1, -1, -1];
  $scope.row7 = [-1, -1, -1];
  $scope.row8 = [-1, -1, -1];
  $scope.hideListContent = false;

  var isPremium = function() {
    return $scope.listtype === 'premium';
  };

  var isAppnGame = function() {
    return $scope.listtype === 'appngame';
  };

  var isMyPage = function() {
    return $scope.isMyPage;
  };

  $scope.getSplits = function() {
    if (isMyPage()) {
      return [0, 1, 2, 3, 4];
    } else {
      return [0, 1, 2];
    }
  };

  $scope.getRows = function() {
    if (isMyPage()) {
      return [0, 1, 2, 3, 4, 5, 6, 7, 8];
    } else {
      return [0, 1, 2, 3, 4];
    }
  };

  $scope.getRowItems = function() {
    var i, arr = [];
    for (i = 0; i < $scope.itemPerRow; i++) arr[i] = i;
    return arr;
  };

  $scope.getItemWidth = function() {
    return 290;
  };

  $scope.getNoDataIconClass = function() {
    return '';
  };

  $scope.getSkinClass = function() {
    // console.log('listControl.getSkinClass');
    if ($scope.listData &&
      ($scope.listData.skinType === 'LANDSCAPE')) {
      return 'item-list-width';
    } else {
      return '';
    }
  };

  var updateList = function() {
    // console.log('listControl.updateList begin, $scope.row.length=' + $scope.row.length);
    var i, j, l, min, max, obj, view, arr, startPos, endPos;

    startPos = device.isHD ? 350 : 550;
    endPos = device.isHD ? 1000 : 1600;
    min = -(startPos) - $scope.scroll.y;
    max = min + endPos;

    // WOSLQEVENT-63082
    // [Service.SDPService.LGStore_Movies] [Always] [Major] 임의의 컨텐츠에서 섬네일(포스터)가 다른 컨텐츠로 바뀌는 현상 발생
    // 안보이는 앞줄/뒷줄까지 업데이트하도록, min/max 값 조정
    // console.log('listControl.updateList, min=' + min + ', max=' + max, ' to min=' + (min - itemH) + ', max=' + (max + itemH));
    min -= itemH;
    max += itemH;

    //console.log("[$scope.scroll.y : "+ $scope.scroll.y +"][min : "+ min +"][max : "+ max +"]");
    l = $scope.row.length;
    for (i = 0; i < l; i++) {
      obj = $scope.row[i];
      // console.log('listControl.updateList each row, i=' + i + ', obj.y=' + obj.y);
      // if ((obj.y + itemH) < min) {
      if (obj.y < min) {
        //console.log('listControl.updateList each row, i=' + i  + ', obj.y=' + obj.y + ', min=' + min + ', obj.y is less than min, continue');
        continue;
      } else {
        //console.log('listControl.updateList each row, i=' + i  + ', obj.y=' + obj.y + ', min=' + min);
      }
      if (obj.y >= max) {
        // console.log('listControl.updateList each row, i=' + i + ', obj.y is greater than max,  after break');
        break;
      }
      if (obj.type == 'split') {
        if ($scope['split' + obj.id] == obj.index) continue;
        $scope['split' + obj.id] = obj.index;
        view = $element[0].getElementsByClassName('split' + obj.id)[0];
        if (!view) break;
        view.innerText = $scope.listData.itemList[obj.index].name;
        view.style.top = obj.y + 'px';
      } else {
        if ($scope['row' + obj.id][0] == obj.index) {
          // console.log('listControl.updateList each row, i=' + i + ', obj.index is same, continue');
          continue;
        }
        view = $element[0].getElementsByClassName('row' + obj.id)[0];
        if (!view) {
          // console.log('listControl.updateList each row, i=' + i + ', view is undefined, break');
          break;
        }

        // console.log('listControl.updateList aaaaaaaaaaaaaaaaaaaaaaaaaaaaa each row, i=' + i + ', set top to obj.y=' + obj.y);
        view.style.top = obj.y + 'px';
        arr = $scope['row' + obj.id];
        // console.log('listControl.updateList each row, i=' + i + ', obj.count=' + obj.count);
        for (j = 0; j < obj.count; j++) {
          // console.log('listControl.updateList each row, i=' + i + ', j=' + j + ', name=' + $scope.listData.itemList[j + obj.index].name);
          arr[j] = j + obj.index;
          view = $element[0].getElementsByClassName('item' + obj.id + '-' + j)[0];
          if (!view) {
            // console.log('listControl.updateList each row, i=' + i + ', j=' + j + ', view is undefined');
            break;
          }
          if (j == (obj.count -1)) {
            view.update($scope.listData.itemList[j + obj.index], true);
          } else {
            view.update($scope.listData.itemList[j + obj.index], false);
          }
        }
        for (; j < $scope.itemPerRow; j++) {
          // console.log('listControl.updateList each row 2, i=' + i + ', j=' + j);
          arr[j] = -1;
          view = $element[0].getElementsByClassName('item' + obj.id + '-' + j)[0];
          if (!view) {
            // console.log('listControl.updateList each row 2, i=' + i + ', j=' + j + ', view is undefined');
            break;
          }
          view.update(null, false);
        }
      }
    }

    $scope.$apply();

    // console.log('listControl.updateList end, $scope.row.length=' + $scope.row.length);
  };

  $scope.initializeList = function(callback) {
    var i, j, l, k, arr, obj, view, lastId;

    k = 0;
    l = $scope.row.length;
    for (i = 0; i < l; i++) {
      obj = $scope.row[i];
      if (obj.type == 'split') {
        $scope['split' + obj.id] = obj.index;
        view = $element[0].getElementsByClassName('split' + obj.id)[0];
        if (!view) break;
        view.innerText = $scope.listData.itemList[obj.index].name;

        if (isMyPage()) {
          var selectedMenu = $scope.$parent.selectedMenu.toString();
        }

        view.style.top = obj.y + 'px';
        k++;
        if (k >= $scope.splitCount || k >= maxSplitCount) break;
      }
    }

    if (isAppnGame()) {
      if (isMyPage())
        $scope.nodata = msgLang.mypage_nodata3;
      else
        $scope.nodata = msgLang.apps_nodata;
    }

    k = 0;
    l = $scope.row.length;
    if ($scope.row.length - $scope.splitCount > $scope.maxRowCount) {
      lastId = $scope.row[($scope.maxRowCount - 1)].index;
    } else if (l > 0) {
      lastId = $scope.row[($scope.row.length - $scope.splitCount - 1)].index;
    }
    for (i = 0; i < l; i++) {
      obj = $scope.row[i];

      var needMouseEvent = false;
      if (isAppnGame()) {
        if (obj.type === 'app' || obj.type === 'promotion')
          needMouseEvent = true;
      } else if (!obj.type) {
        needMouseEvent = true;
      }
      if (needMouseEvent) {
        view = $element[0].getElementsByClassName('row' + obj.id)[0];
        if (!view) break;
        view.style.top = obj.y + 'px';
        if (isAppnGame()) {
          view.setAttribute('data-type', obj.type);
        }
        arr = $scope['row' + obj.id];
        for (j = 0; j < obj.count; j++) {
          arr[j] = j + obj.index;
          view = $element[0].getElementsByClassName('item' + obj.id + '-' + j)[0];
          if (!view) break;
          if (j == (obj.count -1) && (obj.count * obj.id) == (lastId + obj.count - 1)) {
            view.update($scope.listData.itemList[j + obj.index], true);
          } else {
            view.update($scope.listData.itemList[j + obj.index], false);
          }
          $scope.$parent.setMouseEvent(view);
        }
        for (; j < $scope.itemPerRow; j++) {
          arr[j] = -1;
          view = $element[0].getElementsByClassName('item' + obj.id + '-' + j)[0];
          if (!view) break;
          view.update(null, false);
          $scope.$parent.setMouseEvent(view);
        }
        k++;

        if (isMyPage()) {
          if (k >= $scope.itemRowCount) break;
        } else {
          if (isAppnGame()) {
            if (k >= $scope.itemRowCount) break;
          } else {
            if (k >= visibleRowCount) break;
          }
        }
      }
    }

    if(l === 0 && isMyPage() && !$scope.$parent.hideListContent) {
      $scope.$parent.focusToMenu({
            x: 0,
            y: 0,
            width: 0,
            height: 0
          });
    }

    util.async(function() {
      $scope.scrollRefresh(callback);
    });
  };

  $scope.executeAction = function(params) {
    if (focusManager.blockExecution()) {
      // console.log('listControl.executeAction, blockExecution is true');
      return;
    }

    if(params && params.target &&
      params.target.indexOf('item') >= 0 && $rootScope.isPlayKey) {
      return false;
    } else if (params && params.target &&
      params.target.indexOf('item') >= 0) {
      // var item = params.pageElement.getAttribute('item');
      var module;
      if (params.module) {
        module = params.module;
      } else if (params.pageElement) {
        module = params.pageElement.getAttribute('item');
      }
      var itemType = params.focusElement.getAttribute('item-type');
      var itemId = params.focusElement.getAttribute('item-id');
      var item = params.focusElement.getAttribute('item');

      var pageParam = {
        page: params.pageFrom,
        module: module,
        category: $scope.$parent.selectedCategory,
        genre: $scope.$parent.selectedGenre
      };
      $rootScope.pageManager.chgHistory(pageParam);
      $rootScope.pageManager.setParam('scrollY', $scope.scroll.y);
      $rootScope.pageManager.setParam('module', module);
      $rootScope.pageManager.setParam('itemId', itemId);
      $rootScope.pageManager.setParam('item', item);
      if (params.filterList) {
        // [WOSLQEVENT-89900] 방어 코드 2
        $rootScope.pageManager.setParam('filterList', params.filterList);
      }

      if (params.logType) {
        pmLog.write(pmLog.LOGKEY.CONTENTS_CLICK, {
          menu_name : 'List Page',
          contents_type : 'VOD',
          contents_category : params.logType,
          contents_id : itemId,
          sub_menu_name : module,
          sub_sub_menu_name : $scope.$parent.selectedCategory,
          genre: $scope.$parent.selectedGenre
        });
      }

      item = itemType + '|' + itemId;

      $rootScope.draw({
        page: 'detailList',
        module: item,
        inLink: true
      });

      return true;
    } else if (params && params.target &&
      params.target.indexOf('player') !== -1) {
      var itemId = params.focusElement.parentElement.getAttribute('item-id');
      var itemType = params.focusElement.parentElement.getAttribute('item-type');
      var menu = itemType;

      pmLog.write(pmLog.LOGKEY.CONTENTS_PLAY_CLICK, {
        menu_name : 'List Page',
        //sub_menu_name : params.pageElement.getAttribute('item'),
        contents_id : itemId,
        contents_category : $rootScope.pmLogValue
      });

      return false;
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
  };

  $scope.onDraw = function(listData, update, appends) {
    $scope.listData = listData;

    if ($scope.listData &&
      ($scope.listData.skinType === 'LANDSCAPE')) {
      $scope.itemPerRow = 4;
      itemH = 333;
      if (device.isHD) {
        itemH *= 0.667;
      }
    } else {
      // [WOSLQEVENT-117018] Landscape와 Portrait를 섞어서 쓰는 경우를 위해 list 속성 Reset 필요 (FR)
      if (!isAppnGame() && !isMyPage()) {
        $scope.itemPerRow = 5;
        itemH = device.isHD ? 333 : 500;
      }
    }

    $scope.$digest();
    /*$scope.$apply(function() {
      $scope.listData = listData;
    });*/
    listHeight = $scope.updateRow($scope.listData.itemList, appends);

    var obj = $element[0].getElementsByClassName('list-scroller')[0];
    if (obj)
      obj.style.height = listHeight + 'px';
    if (update) {
      if (appends) {
        util.async($scope.scrollRefresh);
        $timeout(function() {
          $rootScope.spinner.hideSpinner();

          if (!isAppnGame()) {
            if (!focusManager.getState('option') && $scope.$parent.recoverFocus) {
              $scope.$parent.recoverFocus();
            }
          }
        }, 100);
      } else {
        util.async(function() {
          $scope.drawed = true;
          $scope.initializeList(function() {
            $scope.$digest();
            if ($scope.$parent && $scope.$parent.setShowAllImage) {
              $scope.$parent.setShowAllImage(true);
            }
          });
          $scope.initializeScroll();
          $scope.restoreScrollPos(true);

          $scope.$parent.setDefaultFocus();
          //$scope.$apply();
        });
        $timeout($rootScope.spinner.hideSpinner, 100);
      }
    } else {
      util.async(function() {
        $scope.drawed = true;
        $scope.initializeList();
        $scope.initializeScroll();
        $scope.restoreScrollPos(true);
        $scope.$parent.onDrawFinished($attrs.name);
      });
    }

    // no data text
    switch ($scope.$parent.scopeName) {
      case 'tvshows':
        $scope.nodata = msgLang.tvShow_nodata;
        break;
      case 'movies':
        $scope.nodata = msgLang.movie_nodata;
        break;
    }

    $element[0].getElementsByClassName('wrap-no-data')[0].style.display = '';

    requestedAppends = false;
  };

  $scope.updateRow = function(itemList, appends) {
    var i, k, l, h, obj;

    if (!appends) {
      $scope.splitCount = 0;
      $scope.itemRowCount = 0;
      $scope.row = [];
      k = 0;
      h = 0;
    } else {
      k = $scope.row.length - 1;
      if ($scope.row[k].type == 'split') {
        h = $scope.row[k].y + splitH;
      } else {
        // 500? or 505?
        // h = $scope.row[k].y + 505;
        h = $scope.row[k].y + itemH;
        if ($scope.row[k].count == $scope.itemPerRow) k++;
      }
    }

    l = itemList ? itemList.length : 0;
    for (i = $scope.listData.startIndex; i < l; i++) {
      obj = itemList[i];
      if(obj.contents_set_id && i === $scope.listData.startIndex) {     // cplist인 경우
        h = device.isHD?120:200;
      }
      if (obj.type == 'split') {
        if (k === 0) {
          h = 15;
        } else {
          h +=50;
        }

        if ($scope.row[k]) k++;
        $scope.row[k] = {
          type: 'split',
          id: ($scope.splitCount) % maxSplitCount,
          y: h,
          index: i,
          count: 1
        };
        obj.id = ($scope.splitCount) % maxSplitCount;
        obj.row = k;
        k++;
        h += splitH;
        $scope.splitCount++;
        if (!isMyPage() && isAppnGame() && obj.firstSplit) {
          obj.name = $scope.$parent.sort;
        } else if (obj.splitType === 'myPage_waiting_update') {
          obj.name = msgLang.myPage_waiting_update;
        } else if (obj.splitType === 'myPage_waiting_otherid') {
          obj.name = msgLang.myPage_waiting_otherid;
        } else if (obj.splitType === 'myPage_apps_001') {

          // 2016-04-07 : tunerless 대응
          var tmpStr = msgLang.myPage_apps_001;
          if (device.q['X-Device-Platform'].toUpperCase() === 'W16T') {
            if (device.q['X-Device-Language'].toUpperCase() === 'EN-GB') {
              tmpStr = tmpStr.replace(/TV/gi, 'monitor');
            } else if (device.q['X-Device-Language'].toUpperCase() === 'TR-TR') {
              tmpStr = 'Bu monitörde yüklü değil';
            }
          }

          obj.name = tmpStr;
          tmpStr = null;
        } else if (obj.splitType === 'myPage_all_installed') {
          // TODO: myPage_all_installed string에서 마침표 제거 필요
          // 임시로, 코드에서 마침표 제거하도록 수정
          if (msgLang.myPage_all_installed.charAt(msgLang.myPage_all_installed.length - 1) === '.') {
            obj.name = msgLang.myPage_all_installed.substring(0, msgLang.myPage_all_installed.length - 1);
          } else {
            obj.name = msgLang.myPage_all_installed;
          }
        }
      } else if (!$scope.row[k]) {
        if (isAppnGame()) {
          $scope.row[k] = {
            type: 'app',
            id: (k - $scope.splitCount) % $scope.maxRowCount,
            y: h,
            index: i,
            count: 1
          };
          if (obj.isPromotion) {
            h += promotionH;
            $scope.row[k].type = 'promotion';
          } else {
            h += itemH;
          }
        } else {
          $scope.row[k] = {
            id: (k - $scope.splitCount) % visibleRowCount,
            y: h,
            index: i,
            count: 1
          };
          // 500? or 505?
          // h += 505;
          h += itemH;
        }
      } else if ($scope.row[k].count < $scope.itemPerRow) {
        $scope.row[k].count++;
        if ($scope.row[k].count == $scope.itemPerRow) k++;
      }
    }

    $scope.itemRowCount = $scope.row.length - $scope.splitCount;

    if (isAppnGame()) {
      if ($scope.itemRowCount > $scope.maxRowCount)
        $scope.itemRowCount = $scope.maxRowCount;
    } else if (!isMyPage()) {
      if ($scope.itemRowCount > visibleRowCount)
        $scope.itemRowCount = visibleRowCount;
    }

    for (var row in $scope.view) { // view row 초기화
      $scope.view[row] = false;
    }

    if ($scope.splitCount > 0) $scope.view.s0 = true;
    if ($scope.splitCount > 1) $scope.view.s1 = true;
    if ($scope.splitCount > 2) $scope.view.s2 = true;
    if ($scope.itemRowCount > 0) $scope.view.r0 = true;
    if ($scope.itemRowCount > 1) $scope.view.r1 = true;
    if ($scope.itemRowCount > 2) $scope.view.r2 = true;
    if ($scope.itemRowCount > 3) $scope.view.r3 = true;
    if ($scope.itemRowCount > 4) $scope.view.r4 = true;
    if ($scope.itemRowCount > 5) $scope.view.r5 = true;
    if ($scope.itemRowCount > 6) $scope.view.r6 = true;
    if ($scope.itemRowCount > 7) $scope.view.r7 = true;
    if ($scope.itemRowCount > 8) $scope.view.r8 = true;

    return h;
  };

  $scope.setFocusItem = function(item, element) {
    $scope.$parent.setFocusItem(item, element);
  };

  $scope.getItemRowColByItemId = function(itemId) {
    var r, c, itemRow, itemClass, indexWithSplit = 0;

    if (isMyPage()) {
      return $scope.getItemRowColByItemId_mypage(itemId);
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

  $scope.getItemRowColByItemId_mypage = function(itemId) {
    var r, c, itemRow, itemClass, indexWithSplit = 0;

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

  $scope.moveFocusByKey = function(focusElement, focusItem, keyCode, isPageUpDownByChKey) {
    var i, l, arr, obj, prev, row, index, item, name, element, hidden, scrollY, rect;

    arr = focusItem.replace('item', '').split('-');
    row = parseInt(arr[0], 10);
    index = parseInt(arr[1], 10);
    switch (keyCode) {
      case keyHandler.LEFT:
        if (index === 0) {
          $scope.$parent.focusToMenu({
            x: 0,
            y: focusElement.parentElement.offsetTop + $scope.scroll.y,
            width: 0,
            height: 0
          });
          return;
        }
        name = 'item' + row + '-' + (index - 1);
        element = $element[0].getElementsByClassName(name)[0];
        break;
      case keyHandler.UP:
        l = $scope.row.length;
        if (isPageUpDownByChKey && isPageUpDownByChKey.index === 0) isHiddenBefore = false; // initialize
        if (isPageUpDownByChKey && isHiddenBefore) item = itemBefore - 3;
        else item = $scope['row' + row][index];
        scrollY = -1;
        for (i = 0; i < l; i++) {
          obj = $scope.row[i];
          if (obj.type == 'split') continue;
          if (obj.index + obj.count > item) {
            if (prev) {
              obj = prev;
              scrollY = obj.y;
              if (scrollY <= firstRowY) scrollY = 0;
            }
            break;
          }
          prev = obj;
        }
        if (scrollY < 0) {
          if ($scope.$parent.focusToHeader && isMyPage()) {
            // my page
            if (isPageUpDownByChKey && isPageUpDownByChKey.isFrom) return;
            $scope.$parent.focusToHeader({x: focusElement.offsetLeft + 395, y: 0, width: 0, height: 0}, keyCode);
          } else {
            if (isPageUpDownByChKey && isPageUpDownByChKey.isFrom) return;
            $rootScope.$broadcast('focus', 'drawer', keyHandler.UP, {x: focusElement.offsetLeft + 395, y: 0, width: 0, height: 0});
            marquee.setTarget(null);
          }
          return;
        }
        if (index >= obj.count) index = obj.count - 1;

        if (isAppnGame()) {
          name = 'item' + ((row + ($scope.maxRowCount -1)) % $scope.maxRowCount) + '-' + index;
        } else {
          name = 'item' + ((row + (visibleRowCount - 1)) % visibleRowCount) + '-' + index;
        }

        element = $element[0].getElementsByClassName(name)[0];
        if (scrollY < -$scope.scroll.y) {
          isHiddenBefore = true;
          itemBefore = item;
          hidden = true;
          scrollY = -scrollY;
        }
        break;
      case keyHandler.RIGHT:
        var toScroll = false;
        if (isAppnGame()) {
          if (index >= 2 || $scope['row' + row][index + 1] === -1) {
            toScroll = true;
          }
        } else {
          if (index >= 4 || $scope['row' + row][index + 1] === -1) {
            toScroll = true;
          }
        }
        if (toScroll) {
          // if scroll is hidden
          if ($scope.scroll &&
            ($scope.scroll.wrapperH >= $scope.scroll.scrollerH)) {
            if (isMyPage()) {
              $scope.$parent.focusToHeader({x: focusElement.offsetLeft + 395, y: 0, width: 0, height: 0}, keyCode);
            }
            return;
          }

          rect = {
            x: 0,
            y: focusElement.parentElement.offsetTop + $scope.scroll.y + 250,
            width: 0,
            height: focusElement.clientHeight
          };
          $scope.$parent.$broadcast('focus', 'scroll', keyCode, rect);
          return;
        }
        name = 'item' + row + '-' + (index + 1);
        element = $element[0].getElementsByClassName(name)[0];
        break;
      case keyHandler.DOWN:
        l = $scope.row.length;
        if (isPageUpDownByChKey && isPageUpDownByChKey.index === 0) isHiddenBefore = false; // initialize
        if (isPageUpDownByChKey && isHiddenBefore) item = itemBefore + 3;
        else item = $scope['row' + row][index];
        scrollY = -1;
        for (i = 0; i < l; i++) {
          obj = $scope.row[i];
          if (obj.type === 'split') continue;
          if (obj.index > item) {
            scrollY = obj.y + itemH;
            break;
          }
        }
        if (scrollY < 0) return;
        if (index >= obj.count) index = obj.count - 1;

        if (isAppnGame()) {
          name = 'item' + ((row + 1) % $scope.maxRowCount) + '-' + index;
        } else {
          name = 'item' + ((row + 1) % visibleRowCount) + '-' + index;
        }

        element = $element[0].getElementsByClassName(name)[0];
        if (scrollY > $scope.scroll.wrapperH - $scope.scroll.y) {
          isHiddenBefore = true;
          itemBefore = item;
          hidden = true;
          scrollY = $scope.scroll.wrapperH - scrollY;
        }
        break;
    }

    if (name && element) {
      $scope.setFocusItem(name, element);
      if (hidden) {
        scrollByKey = true;
        $scope.scroll.scrollTo(0, scrollY, 300, false);
      }
    }
  };

  $scope.restoreScrollPos = function(reset) {
    var scrollY, oldScrollY, param, itemId, result, element, itemHeight;
    var rowIndex, rowYFrom, rowYTo, scrollYFrom, scrollYTo;

    $scope.scrollResetting = true;
    param = $rootScope.pageManager.peekHistory();

    if (param && (param.module === $scope.$parent.selectedMenu)) {
      oldScrollY = $rootScope.pageManager.getParam('scrollY');
      oldScrollY *= -1;

      itemId = $rootScope.pageManager.getParam('itemId');
      itemClass = $rootScope.pageManager.getParam('item');

      $rootScope.pageManager.setParam('itemId', undefined);
      $rootScope.pageManager.setParam('item', undefined);

      if (itemId) {
        if (itemClass) {
          scrollY = oldScrollY;
          if(isMyPage()) {
            $scope.$parent.setDefaultFocusItemClass(itemClass);
          } else {
            $scope.$parent.defaultFocusItemClass = itemClass;
          }

          // scroll을 내리면, 위에 있던 row가 아래로 이동되므로, rowIndex로 계산 불가
          // if (itemClass && itemClass.indexOf('item') >= 0) {
          //   arr = itemClass.replace('item', '').split('-');
          //   rowIndex = parseInt(arr[0], 10);
          // }
        } else {
          result = $scope.getItemRowColByItemId(itemId);
          if (result) {
            if (result.row >= 0) {
              $scope.$parent.defaultFocusItemClass = result.itemClass;
              rowIndex = result.row;
            }
          }
        }

        if ((rowIndex >= 0) && (rowIndex < $scope.row.length)) {
          rowYFrom = $scope.row[rowIndex].y;
        }

        if (rowYFrom !== undefined) {
          rowYTo = rowYFrom + itemH;
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

      if (scrollY) {
        $rootScope.pageManager.setParam('scrollY', undefined);
        $scope.scroll.scrollTo(0, scrollY, 300, true);
        return;
      }
    }

    if ($scope.scroll && reset)
      $scope.scroll.scrollTo(0, 0, 0);
  };

  //////////////////////////////////////////////////////////////////////
  // scroll
  //////////////////////////////////////////////////////////////////////

  $scope.scroll = null;
  $scope.scrollBar = {};
  $scope.scrollResetting = false;
  $scope.STEP_POSITION = 100;

  var previousPosition = 0;
  var maxPosition = 0;

  var move = function(y) {
    // console.log('listControl.move, y=' + y);
    if ($scope.scrollResetting) return;

    var position;
    $scope.scrollBar.move(y, true);

    position = parseInt(y / $scope.STEP_POSITION, 10);
    //console.log("[position : "+ position +"][maxPosition : "+ maxPosition +"][previousPosition : "+ previousPosition +"]");
    if (position > 0) position = 0;
    if (position < maxPosition) position = maxPosition;
    if (previousPosition === position) return;

    if (!isPremium()) {
      if (requestedAppends === false &&
        $scope.listData.total > $scope.listData.loaded &&
        position < maxPosition + 10) {
        requestedAppends = true;
        $scope.$parent.requestDataASync(true);
      }
    }

    previousPosition = position;

    if (focusManager.getCurrent().scope === $scope && scrollByKey === false) {
      $scope.setFocusItem('', null);
      if (isAppnGame()) {
        marquee.setTarget(null);
        focusManager.setCurrent($scope, '');
      }
    }

    if (!isPremium()) {
      util.async(updateList);
    }
  };

  var end = function(y) {
    // console.log('listControl.end, y=' + y);
    $scope.scrollResetting = false;

    $timeout(function() {
      scrollByKey = false;
    }, 100);
  };

  $scope.wheelAction = function(wheelDelta, needNotCheckBlockExecution) {
    var deltaY = $scope.scroll.y + wheelDelta;
    // moonstone patch
    if (deltaY > 0) deltaY = 0; // deltaY = 100;
    else if (deltaY < $scope.scroll.maxScrollY) deltaY = $scope.scroll.maxScrollY; // deltaY = $scope.scroll.maxScrollY - 100;
    if (!$rootScope.spinner.hide) return;
    if ($scope.scroll.wrapperH >= $scope.scroll.scrollerH) return;
    if (!needNotCheckBlockExecution && focusManager.blockExecution()) return;
    if (focusManager.preExecution()) return;
    if (wheelDelta < 0 && $scope.scroll.y > 0) return;
    if (wheelDelta > 0 && $scope.scroll.y < $scope.scroll.maxScrollY) return;
    if ($scope.scrollResetting) return;
    $scope.scroll.scrollTo(0, deltaY, 300);
  };

  $scope.initializeScroll = function() {
    var option = {};
    option.onPositionChange = move;
    option.onScrollEnd = end;
    option.useTransform = false;

    // templateUrl의 최상위 div가 'list-content' 이다.
    var element = $element[0];
    $scope.scroll = new iScroll(element, option);

    element.onmousewheel = function(e) {
      e.preventDefault();
      var wheelDelta, wheelSpeed = 3;
      wheelDelta = device.isHD ? 80 : 120;
      wheelDelta = (e.wheelDelta > 0)  ? wheelDelta : -(wheelDelta);
      wheelDelta = wheelDelta * wheelSpeed;
      $scope.wheelAction(wheelDelta);
    };

    $scope.scrollResetting = false;
  };

  $scope.scrollRefresh = function(callback) {
    var obj = $element[0].getElementsByClassName('list-scroller')[0];
    if (obj)
      obj.style.height = listHeight + 'px';

    if ($scope.scroll) {
      $scope.scroll.refresh();
      $scope.scrollBar.refresh($scope.scroll.wrapperH, $scope.scroll.scrollerH, $scope.scroll.y);
      maxPosition = parseInt(($scope.scroll.wrapperH - $scope.scroll.scrollerH) / $scope.STEP_POSITION, 10);
    }

    if (callback)
      callback();
  };

  $scope.setScrollBarCallback = function(refreshCB, moveCB) {
    $scope.scrollBar.refresh = refreshCB;
    $scope.scrollBar.move = moveCB;
  };

  $scope.scrollPageUp = function() {
    if ($scope.scroll.y > 0) return;
    $scope.scroll.scrollTo(0, -200, 300, true);
  };

  $scope.scrollPageDown = function() {
    if ($scope.scroll.y < $scope.scroll.maxScrollY) return;
    $scope.scroll.scrollTo(0, 200, 300, true);
  };

  $scope.focusFromAD = function(rect) {
    var i, l, arr, index, element;
    $scope.$parent.focusToMenu({
      x: 0,
      y: rect.y,
      width: 0,
      height: 0
    });
  };

  var getLastFocusMenu = function(lastItemMenuFocus) {
    return lastItemMenuFocus.element;
  };

  var getLastFocusContents = function(target, menu, lastItemFocus, arr) {
    var l, element, row, rowH, index, min, y, lastFocusObj, lastFocusObjIndex;
    l = arr.length;
    min = 1080;
    row = -1;
    if (menu && lastItemFocus && lastItemFocus.item) {
      lastFocusObj = lastItemFocus.item.replace('item', '').split('-');
      row = parseInt(lastFocusObj[0], 10);
      lastFocusObjIndex = parseInt(lastFocusObj[1], 10);
      if (isAppnGame()) {
        rowH = itemH;
        if (arr[row].getAttribute('data-type') === 'promotion') rowH = promotionH;
      }
      //menu에서 이전 포커스된 아이템으로 돌아올 경우 스크롤 영역 밖의 아이템에 대한 포커스 기준을 변환한다.
      if ((arr[row].offsetTop + itemH) > ($scope.scroll.wrapperH - $scope.scroll.y)) {
        target = 'next';
      }
    } else {
      for (i = 0; i < l; i++) {
        if (isAppnGame()) {
          rowH = itemH;
        }
        if (target === 'prev') {
          if (isAppnGame()) {
            if (arr[i].getAttribute('data-type') === 'promotion') rowH = promotionH;
            y = arr[i].offsetTop + (rowH - 5) + $scope.scroll.y;
          } else {
            y = arr[i].offsetTop + itemH + $scope.scroll.y;
          }
        } else {
          y = $scope.scroll.wrapperH - (arr[i].offsetTop + $scope.scroll.y);
        }
        if (y < 0) continue;
        if (isAppnGame()) {
          if (target === 'prev') y -= rowH;
        } else {
          if (target === 'prev') y -= itemH;
        }
        if (y < min) {
          min = y;
          row = i;
        }
      }
    }

    if (row === -1) return;

    if(lastFocusObjIndex === undefined) {
      lastFocusObjIndex = 0;
      row = 0;
    }

    if (target === 'prev') {
      if (arr[row].offsetTop < -$scope.scroll.y) {
        index = $scope['row' + row][0];
        l = $scope.row.length;
        for (i = 0; i < l; i++) {
          if ($scope.row[i].index === index) {
            hidden = true;
            scrollY = $scope.row[i].y;
            if (scrollY <= firstRowY) scrollY = 0;
            break;
          }
        }
      }
    } else {
      if (isAppnGame()) {
        rowH = itemH;
        if (arr[row].getAttribute('data-type') === 'promotion') rowH = promotionH;

        if (arr[row].offsetTop + rowH > $scope.scroll.wrapperH - $scope.scroll.y) {
          index = $scope['row' + row][0];
          l = $scope.row.length;
          for (i = 0; i < l; i++) {
            rowH = itemH;
            if ($scope.row[i].type === 'promotion') rowH = promotionH;
            if ($scope.row[i].index === index) {
              hidden = true;
              scrollY = $scope.row[i].y + rowH - $scope.scroll.wrapperH;
              break;
            }
          }
        }
      } else {
        if (arr[row].offsetTop + itemH > $scope.scroll.wrapperH - $scope.scroll.y) {
          index = $scope['row' + row][0];
          l = $scope.row.length;
          for (i = 0; i < l; i++) {
            if ($scope.row[i].index === index) {
              hidden = true;
              scrollY = $scope.row[i].y + itemH - $scope.scroll.wrapperH;
              break;
            }
          }
        }
      }
    }

    if (isAppnGame()) {
      if (arr[row].getAttribute('data-type') === 'promotion') {
        arr = arr[row].getElementsByClassName('item-promotion');
      } else {
        arr = arr[row].getElementsByClassName('item-apps');
      }
    } else {
      arr = arr[row].getElementsByClassName('item-list');
    }
    l = arr.length;
    if (menu) {
      return element = arr[lastFocusObjIndex];
    } else {
      for (i = l - 1; i >= 0; i--) {
        if (arr[i].getAttribute('class').indexOf('ng-hide') === -1) {
          element = arr[i];
          break;
        }
      }
      return element;
    }
  };

  $scope.focusFromMenu = function(target, menu, lastItemFocus) {
    var arr, element, hidden, scrollY;

    if (target === 'header') {
      $scope.$parent.focusToHeader({x: $element[0].clientWidth, y: 0, width: 0, height: 0});
      return;
    }

    arr = $element[0].getElementsByClassName('list-cont');

    element = getLastFocusContents(target, menu, lastItemFocus, arr);

    if (element) {
      $scope.setFocusItem(element.getAttribute('item'), element);
      if (hidden) {
        scrollByKey = true;
        $scope.scroll.scrollTo(0, -scrollY, 300, false);
      }
    }
  };

  $scope.focusFromScroll = function(target, menu, lastItemFocus, lastItemMenuFocus) {
    var i, arr, element, hidden, scrollY;

    if (target === 'header') {
      $scope.$parent.focusToHeader({x: $element[0].clientWidth, y: 0, width: 0, height: 0});
      return;
    }

    arr = $element[0].getElementsByClassName('list-cont');

    // from scroll btn
    if (focusManager.getCurrent().target === 'prev' || focusManager.getCurrent().target === 'next') {
      // only visible items
      var arrNew = [];
      var scrollVTop = parseInt($element[0].getElementsByClassName('list-scroller')[0].style.top.replace('-', '').replace('px', ''));
      var scrollVHeight = $element[0].getElementsByClassName('scroll-v')[0].offsetHeight;
      var scrollVBottom = scrollVTop + scrollVHeight;
      var arrRowHeight = arr[0].offsetHeight;
      for (i = 0; i < arr.length; i++) {
        // check if arr is inside the scroll-v
        var currArrRowTop = parseInt(arr[i].style.top.replace('px', ''));
        if ((currArrRowTop > scrollVTop || currArrRowTop + arrRowHeight > scrollVTop) && currArrRowTop < scrollVBottom) {
          arrNew.push(arr[i]);
        } else {
          // do not push
        }
      }

      // check which is top and which is bottom
      var arrTopIndex = 0;
      var arrTop = 9999;
      var arrBottomIndex = 0;
      var arrBottom = 0;
      for (i = 0; i < arrNew.length; i++) {
        var currTop = parseInt(arrNew[i].style.top.replace('px', ''));
        if (currTop < arrTop) {
          arrTop = currTop;
          arrTopIndex = i;
        }
        if (currTop > arrBottom) {
          arrBottom = currTop;
          arrBottomIndex = i;
        }
      }

      // set Element
      var tmpArr;
      if (target === 'prev') {
        tmpArr = arrNew[arrTopIndex];
      } else if (target === 'next') {
        tmpArr = arrNew[arrBottomIndex];
      }
      // count children.length
      var tmpCount = 0;
      for (i = 0; i < tmpArr.children.length; i++) {
        if (tmpArr.children[i].getAttribute('item-id').length > 0) {
          tmpCount++;
        }
      }
      element = tmpArr.children[tmpCount - 1];

      var tmpArrTop = parseInt(tmpArr.style.top.replace('px', ''));
      if (target === 'prev') {
        scrollY = tmpArrTop;
        if(scrollY < -$scope.scroll.y) {
          hidden = true;
          scrollY = -scrollY;
        }
      } else if (target === 'next') {
        scrollY = tmpArrTop + arrRowHeight;
        if (scrollY > ($scope.scroll.wrapperH - $scope.scroll.y)) {
          hidden = true;
          scrollY = $scope.scroll.wrapperH - scrollY;
        }
      }

    } else {
      // get lastFocus
      if (lastItemMenuFocus && lastItemMenuFocus.isFrom) {
        element = getLastFocusMenu(lastItemMenuFocus);
      } else {
        if (lastItemFocus.isFrom) {
          element = getLastFocusContents(target, menu, lastItemFocus, arr);
        } else {
          // The last focus was scroll btn.
          rect = {x: 0, y: 250, width: 0, height: 100};
          $scope.$parent.$broadcast('focus', 'scroll', keyHandler.RIGHT, rect);
          return;
        }
      }
    }

    if (element) {
      $scope.setFocusItem(element.getAttribute('item'), element);
      if (hidden) {
        scrollByKey = true;
        $scope.scroll.scrollTo(0, scrollY, 300, false);
      }
    }
  };

  $scope.onHide = function() {
    delete $scope.scroll;
    $scope.scrollBar = null;
    $scope.$destroy();
    $element.remove();
  };

  $scope.initialize = function() {
    $scope.$on('initializeScroll', $scope.initializeScroll);
    $scope.listtype = $attrs.listtype;
    if ($attrs.itemperrow) {
      $scope.itemPerRow = parseInt($attrs.itemperrow, 10);
    }
    if ($attrs.itemh) {
      itemH = parseInt($attrs.itemh, 10);
      // HD 대응 코드
      if (device.isHD && isAppnGame()) {
        itemH = 103;
        promotionH = 200;
      } else if (device.isHD && !isPremium() && !isMyPage()) {
        itemH = 333;
      }
    }
    if ($attrs.maxsplitcount) {
      maxSplitCount = parseInt($attrs.maxsplitcount, 10);
    }

    $scope.$parent.onInitialized($attrs.name, $scope);

    $element.bind('transitionend', function (e) {
      e.preventDefault();
      $timeout(function() {
        console.log('listControl.transitionend');
        if ($scope.$parent && $scope.$parent.setShowAllImage) {
          $scope.$parent.setShowAllImage(true);
        }
      }, 1);
    });
  };

  $scope.initialize();
});
