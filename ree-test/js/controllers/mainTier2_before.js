app.directive('mainTier2', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'mainTier2Controller',
//    templateUrl: './resources/html/mainTier2.html'
    template: mainTier2Tmpl
  };
});


app.directive('tier2ImageResizeHandler', function() {
  return {
    link: function($scope, $element) {
      $element.bind('load', function(e) {
        var img_resize = function() {
          var w, h, parentH, parentW, imgW, imgH;
          parentH = $element[0].parentElement.clientHeight;
          parentW = $element[0].parentElement.clientWidth;
          imgW = $element[0].naturalWidth;
          imgH = $element[0].naturalHeight;

          if (parentH === 0) {
            setTimeout(img_resize, 10);
            return;
          }

          w = null;
          h = parseInt(imgH * parentW / imgW);
          rate = (h / parentH).toFixed(2);
          if (rate < 0.8) {
            w = parentW;
            h = null;
          } else if (rate > 1.2) {
            h = parentH;
          } else {
            w = parentW;
            h = parentH;
          }
          $element[0].style.width = w + 'px';
          $element[0].style.height = h + 'px';
          $element[0].style.display = 'block';
        };

        if(this.parentElement.clientHeight === 0) {
          setTimeout(img_resize, 10);
        }else{
          img_resize();
        }
      });
      $element.bind('error', function () {
        var defaultImageArray = {
            'AG': './resources/images/thumb/default_app.png',            // Default Apps&Games Image
            'AD': './resources/images/thumb/default_ad_300X250.png',     // Default
            'TB': './resources/images/thumb/default_video.png'           // 테마베너 초기화 이미지 추가(현재 배너 초기화 이미지가 없음)(현재 배너 초기화 이미지가 없음)
          }
        ;
        var defaultImgType = $element[0].getAttribute('d-img-type');
        if($element[0].src !== defaultImageArray[defaultImgType]) {
          $element[0].src = defaultImageArray[defaultImgType];
          $scope.$digest();
        }
      });
    }
  };
});


app.controller('mainTier2Controller', function($scope, $controller, $element, $rootScope, $timeout, server, focusManager, keyHandler, marquee, util, storage, adManager, pmLog, device, eventKey, timeOutValue, watchProcess) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var lastFocus = {};
  var globalResponse = {};
  var isRollingEnd = false;
  var destroyInfo = {scope : $scope, element : $element};

  $scope.tmrContents = null;
  $scope.rollingInterval = 10; // data rolling interval
  $scope.scopeName = 'featured';
  $scope.focusItem = '';
  $scope.discoveryData = null;
  $scope.columns = [];
  $scope.itemsApp = [];
  $scope.itemsAppTotal = [];
  $scope.banners = []; // banner data for rolling
  $scope.bannerTotal = []; // total data of banner
  $scope.appsNew = []; // app(NEW) data for rolling
  $scope.appsNewTotal = []; // total data of app(NEW)

  $scope.expand = false;
  $scope.direct = false;
  $scope.showing = false;
  $scope.hiding = false;
  $scope.maskBlock = false;
  $scope.maskHiding = false;
  $scope.adRes = {};
  $scope.numOfAllCols = 5;
  $scope.adResColumn = $scope.numOfAllCols-1;
  $scope.numOfPremiumCols = parseInt($scope.numOfAllCols - 1);
  $scope.adResIndex = $scope.numOfPremiumCols + '-0';
  $scope.showAD = false;
  $scope.showBanner = false;
  $rootScope.pmLogValue = pmLog.TYPE.MAIN;

  var wheelPrevent = false;

  $scope.setFocusItem = function(item, element) {
    if (focusElement) {
      focusElement.classList.remove('focus');
    }
    focusElement = element;

    /*
     * home에서 featured로 back할 경우 data가 rolling 되어 현재 element에 focus class 추가되지 않는 문제 발생
     * parameter로 넘어온 element의 item과 item이 다를 경우 item 으로 element query 하여 focus 추가
     */
    var focusElItem = focusElement ? focusElement.getAttribute('item') : '';
    if (item) {
      if ($scope.focusItem !== item || focusElItem !== item) {
        focusElement = document.querySelectorAll('[item="'+item+'"]')[0];
      }
      focusElement.classList.add('focus');
      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
      focusManager.setCurrent($scope, item);
      lastFocus.item = item;
      lastFocus.element = element;
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }
    $scope.focusItem = item;
  };

  $scope.recoverFocus = function() {
    if (lastFocus.item && lastFocus.element)
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  $scope.executeAction = function() {
    if (focusManager.blockExecution()) {
      console.log('mainTier2.executeAction, blockExecution is true');
      return;
    }

    var focusObject;

    focusObject = focusManager.getCurrent();
    if (focusObject.scope === $scope) {
      var type, contentId, page = '', item_id = '';
      type = focusElement.getAttribute('type');
      itemId = focusElement.getAttribute('item-id');
      itemType = focusElement.getAttribute('item-type');

      if (type === 'appsngames' || type === 'premium') {
        pmLog.write(pmLog.LOGKEY.CONTENTS_CLICK, {
          menu_name : 'Main',
          contents_type : 'Apps',
          contents_category : (type === 'premium' ? pmLog.TYPE.PREMIUM : pmLog.TYPE.APPGAME),
          contents_id : itemId,
          sub_menu_name : '',
          sub_sub_menu_name : ''
        });
        page = 'detailApp';
        item = itemId;
      } else if (type === 'banners') {
        pmLog.write(pmLog.LOGKEY.PROMOTION_CLICK, {
          theme_id : itemId
        });
        page = 'detailTheme';
        item = itemId;
      } else if (type === 'ad') {
        if (!device.isOnline) {
          $rootScope.$broadcast(eventKey.NETWORK_ERROR);
          return;
        }
        var params = {
          contextIndex: focusElement.getAttribute('adcontextindex'),
          assetId : focusElement.getAttribute('assetId')
        };
        pmLog.write(pmLog.LOGKEY.AD_CLICK, {
          menu_name : pmLog.TYPE.MAIN,
          ad_id : params.assetId
        });
        if (params.contextIndex && params.assetId) {
          adManager.adBannerClick(params);
        }
      }

      // btn-cp-play
      if (focusElement && focusElement.classList.contains('btn-cp-play')) {
        pmLog.write(pmLog.LOGKEY.CONTENTS_PLAY_CLICK, {
          menu_name : 'Main',
          contents_id : focusElement.parentElement.getAttribute('item-id'),
          contents_category : focusElement.parentElement.getAttribute('type')
        });
        var itemId = focusElement.parentElement.getAttribute('item-id');
        watchProcess.execProcess($scope.$id, item, itemId);
        return;
      }

      if (page && page.length > 0) {
        $rootScope.draw({page: page, module: item, inLink:true});
      }
    }
  };

  var setElement = function(item_type, type, currItem) {
    var defaultBhColor = 'afafaf';
    currItem.item_type = item_type;
    currItem.type = type;
    if (currItem.price) {
      if (/[1-9]/.test(currItem.price) == false) {
        currItem.displayPrice = msgLang.free;
      } else {
        currItem.displayPrice = currItem.price;
      }
    }
    currItem.style = {};
    currItem.white = false;
    if (currItem.iconColor != undefined) {
      currItem.style = {'background-color' : currItem.iconColor};
      var defaultVal = getPerceptualBrightness(defaultBhColor);
      var iconVal = getPerceptualBrightness(currItem.iconColor.replace('#', ''));

      /* background color 에 따라서 text color 변경 적용 */
      if(iconVal > defaultVal) {
        currItem.white = true;
      }
    }
    return currItem;
  };

  var getPerceptualBrightness = function(color) {
    var r = parseInt(color.substring(0,2),16);
    var g = parseInt(color.substring(2,4),16);
    var b = parseInt(color.substring(4.6),16);
    return r*2 + g*3 + b;
  };

  var drawMain = function(e, response) {
    var index, col, obj;

    e.preventDefault();

    // 다시 갱신하는 경우에 기존에 있는 자료를 업데이트하거나 제거후 다시 추가하도록 수정 필요. 모든 자식 포함
    if ($scope.discoveryData) return;

    $scope.discoveryData = response;

    // check main error
    if ($rootScope.isMainError(response)) {
      $scope.direct = true;
      $scope.expand = true;
      $element[0].classList.add('direct', 'expand');
      //$scope.$apply();
      return;
    }

    if (device.adFeatured && device.adProvider) {
      $scope.showAD = true;
      $scope.adRes = adManager.adResponse[$scope.scopeName];
      if (!$scope.adRes) $scope.adRes = {};
      if (!$scope.adRes.srcUrl) $scope.adRes.srcUrl = {};
      if($scope.adRes.srcUrl.length === 0) $scope.adRes.srcUrl = './resources/images/thumb/default_ad_300X250.png';
    }

    col = 0;
    var item_type, t, arr, i, l, numOfAllCols, numOfCols, numOfContents;

    numOfAllCols = $scope.numOfAllCols;
    for (i = 0; i < numOfAllCols; i++) {
      $scope.columns[col + i] = [];
    }

    numOfCols = $scope.numOfAllCols - 1; // 4
    numOfContents = ($scope.numOfAllCols - 1) * 2; // 8
    for (index = 0; index < response.contentsList.length; index++) {
      var banners;
      banners = response.contentsList[index].banners;
      /*
       * response data가 미정이므로 2015년도 기준 data의 category 가 appsngames이거나 premium인 경우만 처리
       * TODO: data format이 정해지면 수정 필요
       */
      if (response.contentsList[index].category === 'appsngames' || response.contentsList[index].category === 'premium') {

        item_type = 'app';
        t = response.contentsList[index].category;
        arr = response.contentsList[index].contents;

        l = (arr.length > numOfContents) ? numOfContents : arr.length; //화면에 표시할 item 수

        for (i=0; i<arr.length; i++) {
          var currItem = setElement(item_type, t, arr[i]);
          currItem.idx = i;
          var cloneItem = angular.copy(currItem);
          /*
           * apps HOT/NEW 중복 방지 위한 임시코드
           * TODO: response data의 HOT/NEW 구분되어지면 수정 필요
           */
          if(i < arr.length-2) {
            $scope.itemsAppTotal.push(cloneItem);
            if (i < l) {
              arr[i].item = (i%numOfCols) + '-' + parseInt(i/numOfCols);
              $scope.itemsApp.push(arr[i]);
            }
          } else {
            $scope.appsNewTotal.push(cloneItem);
          }
        }
      }

      if (banners.length > 0) {
        for (i = 0; i<banners.length; i++) {
          banners[i].item_type = item_type;
          banners[i].type = 'banners';
          banners[i].idx = $scope.bannerTotal.length;
          $scope.bannerTotal.push(banners[i]);
        }
      }
    }

    /*
     *  화면에 노출할 배너 Data Setting
     *  item_idx : 아이템 노출 갯수에 따른 index(ex>0-0)
     *  length : 화면에 노출할 item 갯수
     */
    var col_len, item_idx = 0, length = 1;
    if($scope.showAD) item_idx = 1;
    if ($scope.bannerTotal.length > 0) {
      $scope.showBanner = true;
      for (i=0; i<length; i++) {
        item_idx = item_idx + i;
        $scope.bannerTotal[i].item = parseInt($scope.numOfAllCols - 1) + '-' + item_idx;
        var cloneItem = angular.copy($scope.bannerTotal[i]);
        $scope.banners[i] = cloneItem;
      }
    }

    /*
     *  화면에 노출할 app(NEW) Data Setting
     *  item_idx : 아이템 노출 갯수에 따른 index(ex>0-0)
     *  length : 화면에 노출할 item 갯수
     */
    length = 2;
    item_idx = 0;
    if ($scope.showBanner && $scope.showAD) {
      length = 0;
    } else if ($scope.showBanner || $scope.showAD) {
      item_idx = 1;
      length = 1;
    }
    if ($scope.appsNewTotal.length > 0 && length > 0) {
      for (i=0; i<length; i++) {
        item_idx = item_idx + i;
        $scope.appsNewTotal[i].item = parseInt($scope.numOfAllCols - 1) + '-' + item_idx;
        var cloneItem = angular.copy($scope.appsNewTotal[i]);
        $scope.appsNew[i] = cloneItem;
      }
    }

    $scope.$broadcast('draw');

    arr = $element[0].getElementsByClassName('item');
    l = arr.length;
    for (i = 0; i < l; i++) {
      obj = arr[i];
      $scope.setMouseEvent(obj);
      obj.removeAttribute('ng-class');
      obj.removeAttribute('ng-repeat');
    }

    obj = $element[0].getElementsByClassName('main-body')[0];
    for (i in obj.childNodes) {
      if (obj.childNodes[i].nodeType === document.COMMENT_NODE) {
        obj.removeChild(obj.childNodes[i]);
      }
    }

    arr = $element[0].getElementsByClassName('main-column');
    l = arr.length;
    for (index = 0; index < l; index++) {
      obj = arr[index];
      for (i in obj.childNodes) {
        if (obj.childNodes[i].nodeType === document.COMMENT_NODE) {
          obj.removeChild(obj.childNodes[i]);
        }
      }
    }

    $element[0].removeAttribute('ng-class');

    $rootScope.pageManager.setTitle(msgLang.title);

    $scope.tmrContents = $timeout(startMasking, $scope.rollingInterval * 1000);

    initializeWheelEvent();

    if ($scope.direct) {
      $scope.$emit('finishDraw', $scope.scopeName);
    } else {
      $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
    }
  };

  var startMasking = function(direction) {
    $scope.maskBlock = true;
    $scope.maskHiding = true;
    addMaskBlock();
    changeItem(direction);
    $timeout(handleTransition, 250);
  };

  var endMasking = function() {
    $scope.maskBlock = false;
    removeMaskBlock();
  };

  var startShowing = function() {
    $scope.maskHiding = false;
    $timeout(handleTransition, 250);
  };

  var addMaskBlock = function() {
    var columnMask = angular.element(document.querySelectorAll('.main-column'));
    columnMask.addClass('fade-block');
  };

  var removeMaskBlock = function() {
    var columnMask = angular.element(document.querySelectorAll('.main-column'));
    columnMask.removeClass('fade-block');

    wheelPrevent = false;
  };

  var handleTransition = function() {
    if ($scope.webkitHidden) return;
    if ($scope.maskHiding) {
      $timeout(startShowing, 380);
    } else {
      $timeout(endMasking, 100);
    }
  };

  /*
   * Main Data rolling method
   *           response data 구조가 변경될 예정
   */
  var changeItem = function(direction) {
    if (direction === undefined) direction = 'next'; // default : 'next'
    var tot, i, j, tempBannerData, numOfCols, numOfContents, col, first_element, last_element, first_type, last_type, cur_idx, prev_idx, next_idx, startIdx, col_len, focus_item, focus_element;
    tot = $scope.itemsAppTotal.length; //전체 아이템 length
    contentData = $scope.itemsAppTotal;

    numOfCols = $scope.numOfAllCols - 1; // 4
    numOfContents = ($scope.numOfAllCols - 1) * 2; // 8

    var el = document.querySelectorAll('.main-column')[0].getElementsByClassName('item-main-apps');
    if (direction === 'next') {
      last_element = el[el.length-1];
      // check if the last_element is not hidden.
      for(i=el.length; i>0; i--) {
        last_element = el[i-1];
        if(!last_element.classList.contains('ng-hide')) break;
      }
    } else if (direction === 'prev') {
      first_element = el[0];
    }

    if (last_element) {
      var currType = last_element.getAttribute('type');
      cur_idx = parseInt(last_element.getAttribute('idx'));
      next_idx = cur_idx + 1;
      if (next_idx >= tot) next_idx = 0;
      if (isRollingEnd) {
        next_idx = 0;
        isRollingEnd = false;
      }

      col_len = $scope.itemsApp.length; //화면에 보여지는 아이템 length
      startIdx = 0;
      //$scope.itemsApp = [];
      for (j=startIdx; j<col_len; j++) {
        if(contentData[next_idx]) {
          contentData[next_idx].item = (j%numOfCols) + '-' + parseInt(j/numOfCols);
          //$scope.itemsApp.push(contentData[next_idx]);
          angular.copy(contentData[next_idx], $scope.itemsApp[j]);
        } else {
          $scope.itemsApp[j].type = 'anything';
          isRollingEnd = true;
        }
        next_idx++;
      }
    }

    if (first_element) {
      cur_idx = parseInt(first_element.getAttribute('idx'));
      prev_idx = cur_idx - 1;
      col_len = $scope.itemsApp.length; //화면에 보여지는 아이템 length
      if (prev_idx < 0) {
        // count all items (hidden included)
        var isHiddenIncluded = (tot % col_len !== 0);
        if (isHiddenIncluded) tot = col_len * (parseInt(tot / col_len) + 1);
        prev_idx = tot - 1;
      }
      if (isRollingEnd) {
        isRollingEnd = false;
        // do nothing
      }

      for (j=col_len - 1; j > -1; j--) {
        if(contentData[prev_idx]) {
          contentData[prev_idx].item = (j%numOfCols) + '-' + parseInt(j/numOfCols);
          angular.copy(contentData[prev_idx], $scope.itemsApp[j]);
        } else {
          $scope.itemsApp[j].type = 'anything';
          isRollingEnd = true;
        }
        prev_idx--;
      }
    }

    if ($scope.banners && $scope.bannerTotal.length > $scope.banners.length) {
      var bannerEl = angular.element(document.querySelectorAll('[type="banners"]'));
      if (direction === 'prev') cur_idx = parseInt(bannerEl[0].getAttribute('idx'));
      else if (direction === 'next') cur_idx = parseInt(bannerEl[bannerEl.length-1].getAttribute('idx'));
      prev_idx = cur_idx - 1;
      next_idx = cur_idx + 1;
      if (prev_idx < 0) prev_idx = $scope.bannerTotal.length - 1;
      if (next_idx >= $scope.bannerTotal.length) next_idx = 0;
      item_idx = 0;
      if($scope.showAD) item_idx = 1;
      for (i=0; i<$scope.banners.length; i++) {
        item_idx = item_idx + i;
        $scope.bannerTotal[prev_idx].item = $scope.bannerTotal[next_idx].item = parseInt($scope.numOfAllCols - 1) + '-' + item_idx;
//        $scope.banners[i] = $scope.bannerTotal[next_idx];
        if (direction === 'prev') angular.copy($scope.bannerTotal[prev_idx], $scope.banners[i]);
        else if (direction === 'next') angular.copy($scope.bannerTotal[next_idx], $scope.banners[i]);
        prev_idx--;
        next_idx++;
        if (prev_idx < 0) prev_idx = $scope.bannerTotal.length - 1;
        if (next_idx >= $scope.bannerTotal.length) next_idx = 0;
      }
    }

    if ($scope.appsNew && $scope.appsNew.length > 0 && $scope.appsNewTotal.length > $scope.appsNew.length) {
      var appsNewEl = document.querySelectorAll('.column-ban .item-main-apps');
      cur_idx = parseInt(appsNewEl[appsNewEl.length-1].getAttribute('idx'));
      next_idx = cur_idx + 1;
      if (next_idx >= $scope.appsNewTotal.length) next_idx = 0;
      var item_idx = 0;
      if($scope.appsNew.length == 1) item_idx = 1;
      for (i=0; i<$scope.appsNew.length; i++) {
        item_idx = item_idx + i;
        $scope.appsNewTotal[next_idx].item = parseInt($scope.numOfAllCols - 1) + '-' + item_idx;
//        $scope.appsNew[i] = $scope.appsNewTotal[next_idx];
        angular.copy( $scope.appsNewTotal[next_idx], $scope.appsNew[i]);
        next_idx++;
        if (next_idx >= $scope.appsNewTotal.length) next_idx = 0;
      }
    }

    /*
     * RTL mode 일 경우 text check 하여 rtl 언어가 아니면
     * dir-ltr 추가
     */
    if (device.isRTL) {
      var textTagAry = undefined;
      textTagAry = document.getElementsByClassName('text');
      if (textTagAry.length !== 0) {
        for (var k=0;k<textTagAry.length;k++) {
          var target = textTagAry[k];
          var englishOnly = false;
          englishOnly = !util.rtlPattern(target.textContent);
          if (englishOnly) {
            target.classList.add('dir-ltr');
          }
        }
      }
    }

    var arr, l;
    arr = $element[0].getElementsByClassName('item');
    l = arr.length;
    for (i = 0; i < l; i++) {
      obj = arr[i];
      $scope.setMouseEvent(obj);
      obj.removeAttribute('ng-class');
      obj.removeAttribute('ng-repeat');
    }

//    focus_item = $scope.focusItem;
//    if (focus_item && focus_item.length > 0) {
//      focus_element = angular.element(document.querySelectorAll('[item="'+focus_item+'"]'))[0];
//      $scope.setFocusItem(focus_item, focus_element);
//    }

    if (wheelPrevent) {
      //do nothing
    } else {
      $scope.tmrContents = $timeout(startMasking, $scope.rollingInterval * 1000);
    }
  };

  var hideMain = function(e, page) {
    e.preventDefault();
    if (page != $scope.scopeName) {
      if ($scope.direct === false && $scope.showing === false) {
        if (page === '') {
          $scope.setDefaultFocus();
          $scope.direct = true;
          $element[0].classList.add('direct');
          $rootScope.breadcrumb.setRunning(false);
          //$scope.$apply();

          $timeout(function() {
            $rootScope.breadcrumb.removeDirectClass();
          }, 300);
        } else {
          $scope.setDefaultFocus();
          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, undefined, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $rootScope.breadcrumb.showBreadCrumbs(false);
            $scope.showing = true;
          });
          //$scope.$apply();
        }
      }
      mainTier2Tmpl = null;
      return;
    }

    $timeout.cancel($scope.tmrContents);
    $scope.tmrContents = null;

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      //$scope.$apply();

      // $timeout(function() {
        $element.remove();
        $scope.$destroy();
      // }, timeOutValue.DESTROYING);
    });
  };

  var initializeWheelEvent = function() {
    // 데이터 빈 영역에 서 휠이벤트 발생하지 않으므로 pointer event를 setting 해줌
    $element[0].getElementsByClassName('panel-cont')[0].style.pointerEvents = "auto";
    $element[0].getElementsByClassName('panel-cont')[0].onmousewheel = function(e) {
      console.log('enter wheel event');
      var recentWheelTime;
      if (wheelPrevent) {
        return;
      }

      /*
       * wheel event로 item change시
      *이전에 설정 된 change item timeout clear 후
      *재설정
      */
      $timeout.cancel($scope.tmrContents);
      $scope.tmrContents = null;

      $scope.tmrContents = $timeout(startMasking, $scope.rollingInterval * 1000);

      wheelPrevent = true;
      var direction = (e.wheelDelta > 0) ? 'prev' : 'next';
      startMasking(direction);
    };
  };

  /*
   * WOSLQEVENT-49475 이슈대응
   *  : 채널키로 데이터 롤링 구현
   */
  var rollingByChKey = function(e, keyCode) {
    e.preventDefault();
    if (wheelPrevent) {
      return;
    }

    /*
     * wheel event로 item change시
    *이전에 설정 된 change item timeout clear 후
    *재설정
    */
    $timeout.cancel($scope.tmrContents);
    $scope.tmrContents = null;

    $scope.tmrContents = $timeout(startMasking, $scope.rollingInterval * 1000);

    wheelPrevent = true;
    var direction = (keyCode === keyHandler.CH_UP) ? 'prev' : 'next';
    startMasking(direction);
  };

  var move = function(y) {
    // 위치에 따라서 header를 줄이거나 늘리는 동작 수행
    if (y > -500) {
      if ($scope.expand === true && y >= 0) {
        $scope.expand = false;
        $scope.$apply();
      } else if ($scope.expand === false && y < 0) {
        $scope.expand = true;
        $scope.$apply();
      }
    }
  };

  $scope.setDefaultFocus = function() {
    var target;

    target = $element[0].getElementsByClassName('item')[0];
    if (target)
    {
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

  $scope.scrollRefresh = function() {
    // do nothing
  };

  var getItem = function(column, index) {
    var element, item = {};
    element = $element[0].querySelector('[item="'+column+"-"+index+'"]');
    if (!element || element.classList.contains('ng-hide')) {
      return;
    }
    item.name = element.getAttribute('item');
    item.element = element;
    return item;
  };

  $scope.moveFocusByKey = function(keyCode) {
    var arr, column, index, rect, item;

    if ($scope.focusItem === '') {
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    arr = $scope.focusItem.split('-');
    column = parseInt(arr[0]);
    index = parseInt(arr[1]);
    switch (keyCode) {
      case keyHandler.LEFT:
        if (column === 0) return;
        for(i=column; i>0; i--) {
          item = getItem(i-1, index);
          if(item !== undefined) break;
        }
        break;
//        item = getItem(column-1, index);
//        break;
      case keyHandler.UP:
        if (index === 0) {
          rect = getCurrItemRect(focusElement);
          $scope.$broadcast('focus', 'header', keyCode, rect);
          return;
        }
        item = getItem(column, index-1);
        break;
      case keyHandler.RIGHT:
        if (column >= $scope.columns.length - 1) {
          return;
        }
        for(i=column; i<$scope.columns.length - 1; i++) {
          item = getItem(i+1, index);
          if(item !== undefined) break;
        }
        break;
      case keyHandler.DOWN:
        item = getItem(column, index+1);
        break;
    }

    if (item) {
      $scope.setFocusItem(item.name, item.element);
      if (item.hidden) {}
    }
  };

  var getCurrItemRect = function(element) {
    var clientRect, rect;

    clientRect = element.getBoundingClientRect();

    rect = {x: 0, y: 0, width: 0, height: 0};
    rect.x = clientRect['left'];
    rect.y = clientRect['top'];
    rect.width = clientRect['width'];
    rect.height = clientRect['height'];

    return rect;
  };

  var focusHandler = function(e, target, keyCode, rect) {
    if (target != 'main') return;
    e.preventDefault();
    if (focusManager.getCurrent().target === "left") {
      if ($element[0].getElementsByClassName('item')[0]) {
        $scope.setFocusItem($element[0].getElementsByClassName('item')[0].getAttribute('item'), $element[0].getElementsByClassName('item')[0]);
      }
    } else if (focusManager.getCurrent().target === "more" || focusManager.getCurrent().target === "right") {
      // get the nearest item
      var item = focusManager.getCurrent().target;
      var currFocusElement = $element[0].querySelector('[item="'+item+'"]');
      var candidateElements = $element[0].querySelectorAll('[item*="-0"]'); // the first line of the contents
      var retVal = findFocusDownItem(currFocusElement, candidateElements);
      $scope.setFocusItem(retVal[0], retVal[1]); // item, element
    } else {
      $scope.$broadcast('focus', 'header', keyCode, rect);
    }
  };

  var findFocusUpItem = function(currFocusElement, candidateElements) {
    var retVal = new Array(2);
    var curr_item = null;
    var curr_obj = null;
    var _currFocusItem, _currRect, focus_left, midwidth;
    var gap_left_before = 999;
    _currFocusItem = currFocusElement;
    _currRect = _currFocusItem.getBoundingClientRect();
    midwidth = (_currRect.right - _currRect.left) / 2;
    focus_left = _currRect.left + midwidth;

    var _focusElements = candidateElements;
    for (i = 0; i < _focusElements.length; i++) {
      var thisRect = _focusElements[i].getBoundingClientRect();
      var gap_left = focus_left - (thisRect.left + (thisRect.right - thisRect.left) / 2);

      if (Math.abs(gap_left) < Math.abs(gap_left_before)) {
        curr_obj = _focusElements[i];
        curr_item = _focusElements[i].getAttribute('item');
      }
      gap_left_before = gap_left;

    }

    retVal[0] = curr_item;
    retVal[1] = curr_obj;

    return retVal;
  };

  var findFocusDownItem = function(currFocusElement, candidateElements) {
    return findFocusUpItem(currFocusElement, candidateElements);
  };

  var displayAD = function() {
    $scope.adRes = adManager.adResponse[$scope.scopeName];
    if($scope.adRes.srcUrl.length === 0) $scope.adRes.srcUrl = './resources/images/thumb/default_ad_300X250.png';
    $scope.$digest();
  };

  var foregroundHandler = function(e) {
    //광고 종료로 인한 foreground로 올라올 시 광고 refresh
    adManager.call('requestContextIndex', '', $scope.scopeName);
  };

  var requestDiscovery = function() {
    var params = {
      api : '/discovery2016/featured',
      method : 'post',
      apiAppStoreVersion : 'v7.0',
      tierType : device.tierType
    };
    server.requestApi(eventKey.DISCOVERY_LOADED, params, destroyInfo);
  };

  var initialize = function() {

    if (device.featuredMainData) { // at the first
      $timeout(function(){
        var e = {preventDefault:function(){}};
        globalResponse = device.featuredMainData;
        drawMain(e, globalResponse);
        delete device.featuredMainData;
      }, timeOutValue.DRAW_MAIN_ON_INIT);
    } else {
      $scope.$on(eventKey.DISCOVERY_LOADED, drawMain);
    }

    $scope.$on('hiding', hideMain);
    $scope.$on('focus', focusHandler);
    $scope.$on(eventKey.RECOVER_FOCUS, $scope.recoverFocus);
    $scope.$on(eventKey.AD_LOADED, displayAD);
    $scope.$on('webkitShowed', foregroundHandler);
    $scope.$on(eventKey.FEATURED_ROLLING, rollingByChKey);

    if (!device.featuredMainData) {
      if (!device.isLocalJSON) {
        // Server data용
        util.async(requestDiscovery);
      } else {
        // local json용
        util.async(server.requestDiscovery);
      }
    }

    // 공지사항 가져오기
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

    $rootScope.setFocusItem = $scope.setFocusItem;

    $timeout(function(){
      storage.guideProcess($scope);
    }, 600);
  };

  initialize();
});
