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


app.controller('mainTier2Controller', function($scope, $controller, $element, $rootScope, $timeout, server, focusManager, keyHandler, marquee, util, storage, adManager, pmLog, device, eventKey, timeOutValue, watchProcess, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var lastFocus = {};
  var globalResponse = {};
  var isRollingEnd = false;
  var destroyInfo = {scope : $scope, element : $element};
  var preventRolling = false; // Main CP 갯수에 따른 롤링 유무 flag

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
  $scope.appsAll = []; // itemsAppTotal + appsNewTotal
  $scope.prevRollingDirection = 'next'; // default : 'next'

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
  $scope.videoAD = false;
  $scope.imageAD = false;

  var wheelPrevent = false;

  $scope.setFocusItem = function(item, element) {
    if (focusElement) {
      focusElement.classList.remove('focus');
    }
    focusElement = element;

    if(item === 'imageAd') item = '4-0';
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
      focusManager.setCurrent($scope, item, element);
      lastFocus.item = item;
      lastFocus.element = element;
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }
    $scope.focusItem = item;
  };

  $scope.audioGuidance = function (scope, target, element) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };
    var enterSound = '';

    //최초 화면 진입 시 나오는 음성
    if ($rootScope.isNewPage) {
      enterSound = msgLang.title;
      $rootScope.isNewPage = false;
    }

    if (scope.scopeName === 'header') {
      switch (target) {
        case 'left' :
          params.text = msgLang.audio_header_button_left;
          break;
        case 'right' :
          params.text = msgLang.audio_header_button_right;
          break;
        case 'more' :
          params.text = scope.current.name;
          params.text += '. ';
          if (util.isAWSServer()) {
            //[WOSLQEVENT-114776] 한국어 임에도 불구하고 " 더 보기 "를 "More"로 읽음.
            params.text += msgLang.audio_button_more;
          }else{
            params.text += 'more';
          }
          break;
      }
      params.text += '. ';
      params.text += msgLang.audio_button_button;
    } else {
      var contentName = null;
      if (element && element.querySelector('.focus .text')) {
        contentName = element.querySelector('.focus .text').innerText;
      } else if ($scope.showAD && target === "4-0") {
        contentName = msgLang.audio_ad_title;
      }

      if (enterSound.length > 0) {
        params.text += enterSound;
        params.text += '. ';
        params.text += contentName;
      } else if (contentName) {
        params.text = contentName;
      } else {
        return;
      }
    }

    audioGuidance.call(params);
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

      if(focusElement.getAttribute('singleContentsType')) {
        type = focusElement.getAttribute('singleContentsType');
      }

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
        // default image일 때는 클릭 안함
        if ($scope.adRes.srcUrl.indexOf('/resources/images/thumb/default_ad_300X250.png') ===  -1 ) {
          var params = {
            contextIndex: focusElement.getAttribute('adcontextindex'),
            assetId: focusElement.getAttribute('assetId')
          };
          pmLog.write(pmLog.LOGKEY.AD_CLICK, {
            menu_name: pmLog.TYPE.MAIN,
            ad_id: params.assetId
          });
          if (params.contextIndex && params.assetId) {
            adManager.adBannerClick(params);
            // WOSLQEVENT-57733 : 광고 클릭 후 3초 spinner
            $rootScope.spinner.showSpinner();
            $timeout(function() {
              $rootScope.spinner.hideSpinner();
            }, 3 * 1000);
          }
        } else {
          // 2015-10-13 UX팀 배유진 주임 : 내부적으로 광고서버 호출 : 있으면 replace
          adManager.call('requestContextIndex', '', $scope.scopeName, adCallback);
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
    var index, col, obj, cloneItem;

    e.preventDefault();

    // 다시 갱신하는 경우에 기존에 있는 자료를 업데이트하거나 제거후 다시 추가하도록 수정 필요. 모든 자식 포함
    if ($scope.discoveryData) {
      pmLog.write(pmLog.LOGKEY.FEATURED_LOG, {
        msg: 'mainTier2.drawMain, exit 1'
      });
      return;
    }

    /*
     * featured page 최초 진입시 controller의 admanager.call()을 하면
     * $broadcast 할수 없으므로 adManager.adResponse에 scope name 으로 AD data 저장
     *
     * 광고 지원여부가 true 이면 광고영역 노출되며 luna call fail 등 error 발생시
     * Default Image 노출
     */
    if (device.adFeatured && device.adProvider) {
      $scope.showAD = true;
      device.adFeatured = false;
    }

    /*
     * 광고가 먼저 로드된 후 화면이 늦게 그려지면
     * 비디오 광고가 재생이 시작된 이후 화면이 뜨는 문제가 발생하여..
     * showAD 위치를 수정함 (15.09.07)
     * issue no : WOSLQEVENT-51729
     */
    if (device.firstRun && $scope.showAD) {
      $scope.adRes = adManager.adResponse[$scope.scopeName];
      adManager.adResponse[$scope.scopeName] = {};
      if (!$scope.adRes) $scope.adRes = {};
      if (!$scope.adRes.srcUrl) $scope.adRes.srcUrl = {};
      if ($scope.adRes.srcUrl.length === 0 || $scope.adRes.adContextIndex === undefined ) {
        $scope.adRes.srcUrl = './resources/images/thumb/default_ad_300X250.png';

      }
      if($scope.adRes.type === 'video') {
        $scope.videoAD = true;
        $rootScope.mainAd.showAD($scope.adRes);
      }else{
        $scope.imageAD = true;
        $scope.adType = 'imageAd';
      }
    }

    $scope.discoveryData = response;

    // check main error
    if ($rootScope.isMainError(response)) {
      $scope.direct = true;
      $scope.expand = true;
      $element[0].classList.add('direct', 'expand');
      //$scope.$apply();

      pmLog.write(pmLog.LOGKEY.FEATURED_LOG, {
        msg: 'mainTier2.drawMain, exit 2'
      });
      return;
    }

    if (response.contentsRollingInterval) $scope.rollingInterval = response.contentsRollingInterval;

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

    /*
     * appsngamesnew category data에 bannerlist가 존재할 경우
     * 화면에 노출할 배너 순서
     * response.headerItemId : deeplink로 들어온 item_id
     */
    for (index = 0; index < response.contentsList.length; index++) {
      var banners;
      banners = response.contentsList[index].banners;

      if (response.headerItemId != undefined) {
        for (i = 0; i < banners.length; i++) {
          if (banners[i].id === response.headerItemId) {
            banners.unshift(angular.copy(banners[i]));
            break;
          }
        }
        banners.splice(i+1,1);
      }

      if (banners.length > 0) {
        for (i = 0; i<banners.length; i++) {
          banners[i].item_type = item_type;
          banners[i].type = 'banners';
          banners[i].idx = $scope.bannerTotal.length;
          $scope.bannerTotal.push(banners[i]);
        }
      }

      /*
       *  화면에 노출할 배너 Data Setting
       *  item_idx : 아이템 노출 갯수에 따른 index(ex>0-0)
       *  length : 화면에 노출할 item 갯수
       */
      var item_idx = 0, length = 1;
      if ($scope.showAD) item_idx = 1;
      if ($scope.bannerTotal.length > 0) {
        $scope.showBanner = true;
        for (i=0; i<length; i++) {
          item_idx = item_idx + i;
          $scope.bannerTotal[i].item = parseInt($scope.numOfAllCols - 1) + '-' + item_idx;
          cloneItem = angular.copy($scope.bannerTotal[i]);
          $scope.banners[i] = cloneItem;
        }
      }

      if (response.contentsList[index].category === 'appsngames' || response.contentsList[index].category === 'premium') {

        item_type = 'app';
        t = response.contentsList[index].category;
        arr = response.contentsList[index].contents;

        l = (arr.length > numOfContents) ? numOfContents : arr.length; //화면에 표시할 item 수

        var countTotal = 0, countNew = 0, columnNewLength = 2, maxContents = 0;
        if ($scope.showBanner && $scope.showAD) {
          columnNewLength = 0;
        } else if ($scope.showBanner || $scope.showAD) {
          columnNewLength = 1;
        }


        maxContents = 8 + columnNewLength;
        // [WOSLQEVENT-73313] 메인 CP 갯수가 한페이지 이하일땐 rolling 을 하지 않도록 조치
        if (response.contentsList[index].contents.length <= maxContents) preventRolling = true;

        for (i=0; i<arr.length; i++) {
          var currItem = setElement(item_type, t, arr[i]);
          // separates the two division. left columns & 5th column.
          var isItemsAppTotal = false;
          var lastColumnIndex = $scope.numOfAllCols * 2 - 1; // 9, 18, 27, ...
          if (columnNewLength === 0) isItemsAppTotal = true;
          if (columnNewLength === 1 && (i+1) % lastColumnIndex !== 0 ) isItemsAppTotal = true;
          if (columnNewLength === 2) {
            lastColumnIndex = $scope.numOfAllCols * 2; // 9, 10, 19, 20, 29, 30, ...
            if ((i+1) % lastColumnIndex !== 0 && (i+1) % lastColumnIndex !== 9)
              isItemsAppTotal = true;
            // if there is no AD, no banner, and the number of items are 5~8, or 15~18, or 25~28, etc.
            // move(copy) the last item to the last column.
            // 10m+1, 10m+2, 10m+3, 10m+4, 5th(last) column
            // 10m+5, 10m+6, 10m+7, 10m+8 (m = 0, 1, 2, ..., n-1)
            if (i === arr.length - 1) {
              var numOfOnePageItems = $scope.numOfAllCols * 2; // 10
              var lastPageIndex = parseInt(arr.length / numOfOnePageItems); // 0, 1, 2, ...
              var checkNum = lastPageIndex * numOfOnePageItems;
              if (arr.length > checkNum+4 && arr.length < checkNum+9) isItemsAppTotal = false;
            }
          }
          if (isItemsAppTotal) {
            currItem.idx = countTotal;
            cloneItem = angular.copy(currItem);
            $scope.itemsAppTotal.push(cloneItem);
            $scope.appsAll.push(cloneItem);
            if (i < l) {
              arr[i].item = (i%numOfCols) + '-' + parseInt(i/numOfCols);
              $scope.itemsApp.push(arr[i]);
            }
            countTotal++;
          } else {
            // 5th column
            currItem.idx = countNew;
            cloneItem = angular.copy(currItem);
            $scope.appsNewTotal.push(cloneItem);
            $scope.appsAll.push(cloneItem);
            countNew++;
          }
        }
      }
    }

    /*
     *  화면에 노출할 app(NEW) Data Setting
     *  item_idx : 아이템 노출 갯수에 따른 index(ex>0-0)
     *  length : 화면에 노출할 item 갯수
     */
    length = 2; // the number of items in the last(5th) column [appsNew]
    item_idx = 0;
    if ($scope.showBanner && $scope.showAD) {
      length = 0; // both the ad and the banners, there is no appsNew.
    } else if ($scope.showBanner || $scope.showAD) {
      item_idx = 1; // 0 th index is the ad[or the banners], so the index of appsNew is 1.
      length = 1; // either the ad or the banners, there is one appsNew.
    }
    if ($scope.appsNewTotal.length > 0 && length > 0) {
      if ($scope.appsNewTotal.length === 1) length = 1;
      for (i=0; i<length; i++) {
        item_idx = item_idx + i;
        $scope.appsNewTotal[i].item = parseInt($scope.numOfAllCols - 1) + '-' + item_idx;
        cloneItem = angular.copy($scope.appsNewTotal[i]);
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
      divItemThumbbgBlackCss(obj);
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

    if (preventRolling) return;

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
    var isHiddenIncluded = false;
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
          isHiddenIncluded = true;
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
        isHiddenIncluded = (tot % col_len !== 0);
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

    if ($scope.appsNew && $scope.appsNewTotal.length === 1) {
      // toggle show/hide
      if ($scope.appsNew[0].type !== 'anything') $scope.appsNew[0].type = 'anything';
      else $scope.appsNew[0].type = $scope.itemsApp[0].type;

    } else if ($scope.appsNew && $scope.appsNew.length > 0 && !$scope.showBanner && !$scope.showAD) {
      // there is no ad and no bannners
      // idx. 5th[last] column, if the number of pages is n, there are 3 possible cases.
      // [0,1], [2,3], [4,5], ... , [2m,2m+1] (m = 0, 1, 2, ..., n-1)
      // [0,1], [2,3], [4,5], ... , [2m,x] ( x means there is no item. )
      // [0,1], [2,3], [4,5], ... , [x,x]
      cur_idx = $scope.appsNew[0].idx;
      var numOfOnePageItems = $scope.numOfAllCols * 2; // 10
      var numOfAppsNewTotal = $scope.appsNewTotal.length;
      var lastPageIndex = parseInt($scope.appsAll.length / numOfOnePageItems); // 0, 1, 2, ...
      var indexAfterRolling;
      // $scope.appsNew[0].type is 'premium'. if it is not 'premium', it is hidden item.
      // for example, if $scope.appsNew[0].type is is 'anything', it is hidden item.
      if (cur_idx === 0 && $scope.appsNew[0].type !== 'anything') {
        // first(index 0) page
        indexAfterRolling = (direction === 'prev') ? lastPageIndex * 2 + 0 : cur_idx + 2 + 0;
      } else if ($scope.appsNew[0].type === 'anything' || cur_idx === lastPageIndex * 2) {
        // last page
        indexAfterRolling = (direction === 'prev') ? lastPageIndex * 2 - 2 + 0 : 0;
      } else {
        indexAfterRolling = (direction === 'prev') ? cur_idx - 2 + 0 : cur_idx + 2 + 0;
      }

      for (i=0; i<$scope.appsNew.length; i++) { // $scope.appsNew.length is 2, 'cause there is no ad and no banners.
        var tmpIdx = indexAfterRolling + i;
        if ($scope.appsNewTotal[tmpIdx]) {
          $scope.appsNewTotal[tmpIdx].item = parseInt($scope.numOfAllCols - 1) + '-' + i; // 4-0, 4-1
          angular.copy( $scope.appsNewTotal[tmpIdx], $scope.appsNew[i]);
        } else {
          $scope.appsNew[i].type = 'anything';
        }
      }
      $scope.prevRollingDirection = direction;
    } else if ($scope.appsNew && $scope.appsNew.length > 0 && $scope.appsNewTotal.length >= $scope.appsNew.length) {
      var appsNewEl = document.querySelectorAll('.column-ban .item-main-apps');
      cur_idx = parseInt(appsNewEl[appsNewEl.length-1].getAttribute('idx'));
      if (isHiddenIncluded || ($scope.appsNew[0].type === 'anything' && $scope.prevRollingDirection !== direction) ) {
        // If the next rolling page[prev/next direction] includes hidden items.
        // Or if the current page includes hidden items and the rolling direction is different from the previous rolling direction.
        prev_idx = next_idx = cur_idx;
      } else {
        prev_idx = cur_idx - 1;
        next_idx = cur_idx + 1;
        if (prev_idx < 0) prev_idx = $scope.appsNewTotal.length - 1;
        if (next_idx >= $scope.appsNewTotal.length) next_idx = 0;
      }
      var item_idx = 0;
      if($scope.appsNew.length == 1) item_idx = 1;
      for (i=0; i<$scope.appsNew.length; i++) {
        item_idx = item_idx + i;
        $scope.appsNewTotal[next_idx].item = parseInt($scope.numOfAllCols - 1) + '-' + item_idx;
//        $scope.appsNew[i] = $scope.appsNewTotal[next_idx];
        if (direction === 'prev') angular.copy( $scope.appsNewTotal[prev_idx], $scope.appsNew[i]);
        else if (direction === 'next') angular.copy( $scope.appsNewTotal[next_idx], $scope.appsNew[i]);
        if (isHiddenIncluded) $scope.appsNew[i].type = 'anything';
        prev_idx--;
        next_idx++;
        if (prev_idx < 0) prev_idx = $scope.appsNewTotal.length - 1;
        if (next_idx >= $scope.appsNewTotal.length) next_idx = 0;
      }
      $scope.prevRollingDirection = direction;
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
    //한단에 변경된 앱리스트(arr)을 가지고 오지 못하므로 추가함.
    $scope.$digest();

    var arr, l;
    arr = $element[0].getElementsByClassName('item');
    l = arr.length;
    for (i = 0; i < l; i++) {
      obj = arr[i];
      $scope.setMouseEvent(obj);
      obj.removeAttribute('ng-class');
      obj.removeAttribute('ng-repeat');
      divItemThumbbgBlackCss(obj);
    }

    // After rolling, check if the current focus item is hidden.
    if (focusManager.getCurrent().target.indexOf('-') > -1) {
      var currFocusItem = focusManager.getCurrent().target;
      var nextFocusItem = '', nextFocusElement= '';
      for (i = 0; i < $scope.itemsApp.length; i++) {
        if ($scope.itemsApp[i].type !== 'anything') nextFocusItem = $scope.itemsApp[i].item;
        if ($scope.itemsApp[i].item === currFocusItem || i === $scope.itemsApp.length - 1) {
          if ($scope.itemsApp[i].type === 'anything') {
            // If the current focus item is hidden, set the last shown item focus.
            nextFocusElement = $element[0].querySelector('[item="'+nextFocusItem+'"]');
            $scope.setFocusItem(nextFocusItem, nextFocusElement);
          }
          break;
        }
      }
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
    $scope.discoveryData.contentsList[0].contents = $scope.appsAll; // initialize the order of items
    if (page != $scope.scopeName) {
      if ($scope.direct === false && $scope.showing === false) {
        if (page === '') {
          $timeout(function() {
            if (!util.parseBoolean(storage.getGuideOpenedFlag()) ||
              $rootScope.guide.isViewGuide) {
              // guide가 표시된 경우
            } else {
              // guide가 표시된 경우는 제외
              $scope.setDefaultFocus();
            }
          }, 300);
          $scope.direct = true;
          $element[0].classList.add('direct');
          $rootScope.breadcrumb.setRunning(false);
          //$scope.$apply();
          $rootScope.header.hideImage = false;

          $timeout(function() {
            $rootScope.breadcrumb.removeDirectClass();
          }, 300);
        } else {
          $timeout(function() {
            if ($rootScope.guide.isViewGuide) {
              // guide가 표시된 경우
            } else {
              // guide가 표시된 경우는 제외
              $scope.setDefaultFocus();
            }
          }, 300);

          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, undefined, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $rootScope.breadcrumb.showBreadCrumbs(false);
            $scope.showing = true;
            $rootScope.header.hideImage = false;
          });
        }
        /*
         * 메인 최초 진입 시에
         * 광고가 먼저 로드되는 문제 발생하여
         * 광고 showAD가 늦게 호출 되도록 수정하였으나,
         * 수정 후 광고가 show되기 까지 빈공간으로 남아있어
         * 데이터가 없는 것처럼 보이는 문제가 발생..
         *  : 광고 데이터 로드 후 광고 play 를 finishdraw 전에 실행하도록 수정
         *  issue no : WOSLQEVENT-52151
         */
        if($scope.videoAD) {
          if (device.isLite) {
            $timeout(function() {
              $rootScope.mainAd.loadVideo();
            }, 100);
          } else {
            $rootScope.mainAd.loadVideo();
          }
          $scope.adType = 'videoAd';
        }
      }
      mainTier2Tmpl = null;
      return;
    }

    $timeout.cancel($scope.tmrContents);
    $scope.tmrContents = null;

    $rootScope.header.hideImage = true;
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

    if(util.isAWSServer()){
      if($rootScope.popupApp && $rootScope.popupApp.open){
        return;
      }
    }

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
        //마지막 column 이고 비디오 광고가 true 일 때
        if(column === 4 && $scope.videoAD){
          $rootScope.$broadcast('focus', 'mainAd');
          return;
        }
        item = getItem(column, index-1);
        break;
      case keyHandler.RIGHT:
        if (column >= $scope.columns.length - 1) {
          return;
        }
        //마지막 column 이고 비디오 광고가 true 일 때
        if(column === 3 && index === 0 && $scope.videoAD){
          $rootScope.$broadcast('focus', 'mainAd');
          return;
        }
        for (var i = column; i < $scope.columns.length - 1; i++) {
          item = getItem(i + 1, index);
          if (item !== undefined) break;
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
      if (focusManager.getCurrent().target === 'right') {
        if ($scope.showAD) {
          if ($scope.adType === 'videoAd') {
            $rootScope.$broadcast('focus', 'mainAd', keyCode, rect);
            return;
          }
          if ($scope.adType === 'imageAd') {
            retVal[0] = 'imageAd', retVal[1] = $element[0].querySelector('.item-ad');
          }
        }
      }
      $scope.setFocusItem(retVal[0], retVal[1]); // item, element
    } else if (focusManager.getCurrent().target === "mainAd") {
      var adElItem = $element[0].getElementsByClassName('item-ad')[0].getAttribute('item');
      var col = adElItem.split('-')[0];
      var idx = adElItem.split('-')[1];
      if (adElItem === 'imageAd') {
        col = 4, idx = 0;
      }
      if (keyCode === keyHandler.LEFT) {
        col = col - 1;
        var focusEl = $element[0].querySelector('[item="'+col+'-0"]');
        if(focusEl) $scope.setFocusItem(focusEl.getAttribute('item'), focusEl);
      } else if(keyCode === keyHandler.DOWN) {
        //배너가 있을경우 배너로 Focus
        if ($scope.showBanner) {
          var element = $element[0].querySelector('.theme-banner');
          $scope.setFocusItem(element.getAttribute('item'), element);
          return;
        }

        idx = parseInt(idx) + 1;
        var focusEl = $element[0].querySelector('[item="'+col+'-'+idx+'"]');
        if (!focusEl || focusEl.classList.contains('ng-hide')) {
          return;
        }
        if(focusEl) $scope.setFocusItem(focusEl.getAttribute('item'), focusEl);
      } else if(keyCode === keyHandler.UP) {
        $scope.$broadcast('focus', 'header', keyCode, rect);
      }

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
    //[WOSLQEVENT-116869]우측 Arrow 모양에서 아래로 이동 시 focus 상실 해결
    //item이 하나인 경우 gap_left_before = 999값만 비교 함으로 예외처리 함
    if (_focusElements.length == 1) {
      retVal[0] = _focusElements[0].getAttribute('item');
      retVal[1] = _focusElements[0];
      return retVal;
    }

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

  var displayAD = function (e, response) {
    if (response.type && response.type === 'video') {
      $scope.videoAD = true;
      $scope.imageAD = false;
      $scope.adType = 'videoAd';
      $rootScope.mainAd.showAD(response);
    } else {
      $scope.videoAD = false;
      $scope.imageAD = true;
      $scope.adRes = adManager.adResponse[$scope.scopeName];
      if ($scope.adRes.srcUrl.length === 0) $scope.adRes.srcUrl = './resources/images/thumb/default_ad_300X250.png';
    }
    $scope.$digest();
    $rootScope.spinner.hideSpinner();
  };

  var foregroundHandler = function(e) {
    $rootScope.spinner.showSpinner();
    //광고 종료로 인한 foreground로 올라올 시 광고 refresh
    adManager.call('requestContextIndex', '', $scope.scopeName);
  };

  var displayDefaultAD = function(e) {
    //if  ($scope.adRes.srcUrl.indexOf('/resources/images/thumb/default_ad_300X250.png') !== -1) {
    $scope.adRes.srcUrl = './resources/images/thumb/default_ad_300X250.png';
    if (document.querySelector('[d-img-type="AD"]')) {
      document.querySelector('[d-img-type="AD"]').setAttribute('src', './resources/images/thumb/default_ad_300X250.png');
      document.querySelector('[d-img-type="AD"]').setAttribute('ng-src', './resources/images/thumb/default_ad_300X250.png');
    }
    $scope.$apply();
    //}
  };

  //메인화면에 앱 배경화면이 검정색으로 서버에서 내려온(rgb(0, 0, 0)) 경우는
  //class bg-black추가시켜 회식테두리가 나오게 수정한다.
  //다만 서버에서 배경화면에 안내려올 경우 앱 배경화면이 회색으로 나오기 때문에 따로 처리할 필요가 없다.
  var divItemThumbbgBlackCss = function(obj){
    var divClass = obj.getElementsByClassName('item-thumb')[0];
    if(divClass != undefined){
      if(divClass.className.indexOf('bg-black') === -1){
        if(divClass.style.backgroundColor === 'rgb(0, 0, 0)'){
          divClass.className += ' bg-black';
        }
      }else if(divClass.className.indexOf('bg-black') > 0 && divClass.style.backgroundColor != 'rgb(0, 0, 0)'){
        divClass.className = (divClass.className).replace(/ bg-black/g,'');
      }
    }
  };

  var requestDiscovery = function() {
    var params = {
      api : '/discovery2016/featured',
      method : 'post',
      apiAppStoreVersion : 'v8.0',
      tierType : device.tierType
    };
    server.requestApi(eventKey.DISCOVERY_LOADED, params, destroyInfo);
  };

  var initialize = function() {

    if (device.featuredMainData) { // at the first
      $timeout(function(){
        var e = {preventDefault:function(){}};
        globalResponse = device.featuredMainData;
        globalResponse.headerItemId = device.param.module;
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
    $scope.$on('lunaError', displayDefaultAD);

    if (!device.featuredMainData) {
      if (!device.isLocalJSON) {
        // Server data용
        util.async(requestDiscovery);
      } else {
        // local json용
        util.async(server.requestDiscovery);
      }
    }

    /* 1. 가이드 존재, 공지사항 존재
     * 2. 가이드 존재 안함. 공지사항 존재
     * 3. 가이드 존재, 공지사항 존재 않함.
     2번 케이스 - 가이드존재하지 않을 경우 공지사항만 실행
     가이드뜨고나면 storage.getGuideOpenedFlag()변경되므로 공지사항 먼저 확인*/
    if(device.isTv && util.parseBoolean(storage.getGuideOpenedFlag())) {
      // 공지사항 가져오기
      if (device.isTv) {
        if (!device.isDeepLink) { // 최초 deeplink가 아닐때 만
          params = {
            api: '/discovery2016/notice',
            method: 'get',
            apiAppStoreVersion: 'v8.0'
          };
          server.requestApi(eventKey.NOTICE_LOADED, params);
        }
      }
    }
    //[WOSLQEVENT-85487]가이드 화면 나올때 닫기버튼에 포커스 가게 수정
    if (!util.parseBoolean(storage.getGuideOpenedFlag())) {
      $timeout(function(){
        storage.guideProcess($scope, function() {
          // callback on guide close
          $scope.setDefaultFocus();
        });
      }, 600);
    }

    $rootScope.setFocusItem = $scope.setFocusItem;

  };

  initialize();
});
