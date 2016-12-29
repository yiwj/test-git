app.directive('mainTier1', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'mainTier1Controller',
    //templateUrl: './resources/html/mainTier1.html'
    template: mainTier1Tmpl
  };
});

app.directive('tier1ImageResizeHandler', function() {
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
            //console.log('한번더..');
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
          //console.log('parent element size none!!! reload img resize..');
          setTimeout(img_resize, 10);
        }else{
          img_resize();
        }
      });
      $element.bind('error', function () {
        var defaultImageArray = {
            'PO': './resources/images/thumb/default_tvshow_280x410.png', // Default Post Image
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


app.controller('mainTier1Controller', function($scope, $controller, $element, $rootScope, $timeout, $sce, server, focusManager, keyHandler, marquee, util, adManager, storage, pmLog, device, eventKey, timeOutValue, popupService, watchProcess) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var lastFocus = {};
  var globalResponse = {};
  var destroyInfo = {scope : $scope, element : $element};

  $rootScope.pmLogValue = pmLog.TYPE.MAIN;
  $scope.scopeName = 'featured';
  $scope.tmrContents = null;
  $scope.discoveryData = null;
  $scope.contentsRollingInterval; // data rolling interval
  $scope.numOfAllCols = 5; // total columns number
  $scope.adResColumn = $scope.numOfAllCols-1;
  $scope.focusItem = '';
  $scope.columns = []; // tvshows/movie/app(HOT) columns for rolling
  $scope.columnsTotal = []; // total column data of tvshows/movie/app(HOT)
  $scope.banners = []; // banner data for rolling
  $scope.bannerTotal = []; // total data of banner
  $scope.adType = '';
  $scope.src = ''; //AD Video url (crossdomain error 발생하여 parsing 해야함)
  $scope.adRes = {}; // AD luna call response data
  $scope.appsNew = []; // app(NEW) data for rolling
  $scope.appsNewTotal = []; // total data of app(NEW)
  $scope.appsAD = {}; // additional apps if AD doesn't exist.
  $scope.appsBanners = {}; // additional apps if Banners don't exist.

  /* Boolean Variables*/
  $scope.expand = false;
  $scope.direct = false;
  $scope.showing = false;
  $scope.hiding = false;
  $scope.maskBlock = false;
  $scope.maskHiding = false;
  $scope.showAD = false;
  $scope.showBanner = false;
  $scope.showCategory = false; // category
  $scope.videoAD = false;
  $scope.imageAD = false;

  // 페이지 이동시, hideMain 이벤트가 $timeout의 timer들 때문에
  // 느리게 발생하는 것 같음
  // (angular가 hideMain 이벤트를 발생시키기 전에,
  // $timerout 이벤트를 우선적으로 발생시키는 것으로 추정)
  // $timeout 대신, setTimeout을 사용하려면, 아래 변수를 true로
  var useSetTimeout = true;
  var wheelPrevent = false;
  var wheelPreventDuration = 30;

  //------------------------- main data 설정 관련 method start -------------------------//
  /*
   * main data draw method
   */
  var drawMain = function(e, response) {
    var index, col, obj, cpData;

    e.preventDefault();

    $scope.discoveryData = response;

    /*
     * check main error
     */
    if ($rootScope.isMainError(response)) {
      $scope.direct = true;
      $scope.expand = true;
      $element[0].classList.add('direct', 'expand');
      //$scope.$apply();
      return;
    }

    if (response.contentsRollingInterval) $scope.contentsRollingInterval = response.contentsRollingInterval;

    /*
     * featured page 최초 진입시 controller의 admanager.call()을 하면
     * $broadcast 할수 없으므로 adManager.adResponse에 scope name 으로 AD data 저장
     *
     * 광고 지원여부가 true 이면 광고영역 노출되며 luna call fail 등 error 발생시
     * Default Image 노출
     */
    if (device.adFeatured && device.adProvider) {
      $scope.showAD = true;
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

    col = 0;
    for (index = 0; index < response.contentsList.length; index++) {
      var contentsArr, i, j, columnLength, contentsColumn, categoryType, banners, item_type;

      categoryType = response.contentsList[index].category;          // item category
      title = response.contentsList[index].contentsTitle; //contents title
      contentsColumn = 0;  //화면에 표시할 column 수 (response data 의 arrayNumber)
      if (categoryType != 'banners') contentsColumn = parseInt(response.contentsList[index].column); //banner data column은 따로 받으므로 제외하여 처리
      $scope.columnsTotal[index] = [];
      $scope.columns[index] = [];

      /*
       * column 상단에 아이템 카테고리 노출
       * issue-no : 54231
       *  : tier1일때 무조건 노출로 변경(배유진 J) 
       */
      if(categoryType === 'tvshows' || categoryType === 'movies') {
        $scope.columnsTotal[index].category = title;
        $scope.columns[index].category = title;
      }
      $scope.columnsTotal[index].column = contentsColumn;
      $scope.columns[index].column = contentsColumn;

      contentsArr = response.contentsList[index].contents;
      banners = response.contentsList[index].banners;

      if (banners.length > 0) {
        $scope.showBanner = true;
      }

      columnLength = contentsColumn; //화면에 표시할 item 수
      if (categoryType==='tvshows') {
        item_type = 'TS';
      } else if (categoryType==='movies') {
        item_type = 'MV';
      } else if (categoryType==='appsngames' || categoryType==='appsngameshot' || categoryType==='appsngamesnew') {
        item_type = 'app';
        columnLength = 2;
        if (contentsColumn > 1) columnLength = contentsColumn * columnLength; //화면에 표시할 column이 2 이상일 경우 item 수는 item * column
      }

      for (i = 0; i < contentsArr.length; i++) {
        var currItem = setElement(item_type, categoryType, contentsArr[i]);
        /*
        *  appsngames 일 경우 new 와 hot 구분하여 저장
        */
        if (contentsArr[i].type === 'appsngames' || contentsArr[i].type === 'appsngameshot' || contentsArr[i].type === 'appsngamesnew') {
          if(contentsArr[i].appType === 'HOT') {
            $scope.columnsTotal[index].push(currItem);
            if ($scope.columns[index].length < columnLength) {
              $scope.columns[index].push(currItem);
            }
          } else {
            $scope.appsNewTotal.push(currItem);
          }
        }else{
          $scope.columnsTotal[index].push(currItem);
          if (i < columnLength) {
            $scope.columns[index].push(currItem);
          }
        }

        /*
         *  Binding CP List
         *  [2015.09.15] CP 추가 구현, [2015.09.16] cpInfo함수를 적절히 활용하도록 수정
         */
        if(contentsArr[i].execCpListString) {
          cpData = util.cpInfo(contentsArr[i].execCpListString);
          contentsArr[i].execCpList = cpData;
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

      col += contentsColumn;
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
        $scope.banners[i] = $scope.bannerTotal[i];
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
        $scope.appsNewTotal[i].idx = i;
        $scope.appsNew[i] = $scope.appsNewTotal[i];
      }
    }

    var column_arr, column;
    column_arr = $scope.columns;

    setItemIndex(column_arr, true);

    //header draw start
    $scope.$broadcast('draw');

    var arrTmp = $element[0].getElementsByClassName('item');
    l = arrTmp.length;
    for (i = 0; i < l; i++) {
      obj = arrTmp[i];
      $scope.setMouseEvent(obj);
      obj.removeAttribute('ng-class');
      obj.removeAttribute('ng-repeat');
    }

    var playArr = $element[0].getElementsByClassName('icon-player');
    l = playArr.length;
    for (i = 0; i < l; i++) {
      $scope.setMouseEvent(playArr[i]);
    }

    $element[0].removeAttribute('ng-class');

    $rootScope.pageManager.setTitle(msgLang.title);

    /*
     * 메인 최초 진입 시에
     * 광고가 먼저 로드되는 문제 발생하여
     * 광고 showAD가 늦게 호출 되도록 수정하였으나, 
     * 수정 후 광고가 show되기 까지 빈공간으로 남아있어
     * 데이터가 없는 것처럼 보이는 문제가 발생..
     *  : 광고 데이터 로드 후 광고 play 를 finishdraw 전에 실행하도록 수정
     *  issue no : WOSLQEVENT-52151
     */
    if($scope.videoAD) $rootScope.mainAd.loadVideo();

    if (useSetTimeout)
      $scope.tmrContents = setTimeout(startMasking, $scope.contentsRollingInterval * 1000);
    else
      $scope.tmrContents = $timeout(startMasking, $scope.contentsRollingInterval * 1000);

    /*
     * 매직리모컨 휠로 메인 데이터 롤링을 위한 initailize
     */
    initializeWheelEvent();

    var isDirect = $scope.direct;
    if (!isDirect && !device.currentPage && !device.previousPage &&
      $scope.direct == false && $scope.showing == false) {
      isDirect = true;
    }

    if (isDirect) {
      $scope.$emit('finishDraw', $scope.scopeName);
    } else {
      $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
    }
  };

  var setItemIndex = function(column_arr, isIdxIncluded) {
    var currCol = 0;
    for (i=0; i<column_arr.length; i++) {
      column = $scope.columns[i];
      for (j = 0; j < column.length; j++) {
        if (!column[j]) continue;
        if (column[j]['type'] === 'tvshows' || column[j]['type'] === 'movies') {
          column[j].item = currCol + '-' + 0;
          currCol++;
          if (isIdxIncluded) column[j].idx = j;
        } else if (column[j]['type'] === 'appsngames' || column[j]['type'] === 'appsngameshot' || column[j]['type'] === 'appsngamesnew') {
          if (column.length === 2) {
            column[j].item = currCol + '-' + j;
            if (isIdxIncluded) column[j].idx = j;
          } else if (column.length > 2) {
            // UK[GB], Germany
            // 2-0, 3-0
            // 2-1, 3-1
            /* var colApp = parseInt(currCol + (j / 2)); // 2-0, 2-1, 3-0, 3-1
             var rowApp = parseInt(j % 2); */
            var colApp = parseInt(currCol + (j % 2)); // 2-0, 3-0, 2-1, 3-1

            var rowApp = parseInt(j / 2);
            column[j].item = colApp + '-' + rowApp;
            if (isIdxIncluded) column[j].idx = j;
          }
        }
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

  var insertAdditionalApps = function(item, showAD, showBanners, isBoth) {
    if (showAD && !showBanners) {
      $scope.appsBanners = setElement('app', 'appsngames', item);
      $scope.appsBanners.idx = $scope.columns[$scope.columns.length-1].length; // num of apps elements
    } else if (!showAD && showBanners) {
      $scope.appsAD = setElement('app', 'appsngames', item);
      $scope.appsAD.idx = $scope.columns[$scope.columns.length-1].length; // num of apps elements
    } else if (!showAD && !showBanners) {
      if (!isBoth) {
        // AD
        $scope.appsAD = setElement('app', 'appsngames', item);
        $scope.appsAD.idx = $scope.columns[$scope.columns.length-1].length; // num of apps elements
      } else {
        // Banners
        $scope.appsBanners = setElement('app', 'appsngames', item);
        $scope.appsBanners.idx = $scope.columns[$scope.columns.length-1].length + 1; // num + 1 of apps elements
      }
    }
  };

  var getPerceptualBrightness = function(color) {
    var r = parseInt(color.substring(0,2),16);
    var g = parseInt(color.substring(2,4),16);
    var b = parseInt(color.substring(4.6),16);
    return r*2 + g*3 + b;
  };

  /*
   * Main Data rolling method
   * TODO : wheel up event 시 이전 데이터 loading 작성 
   *           response data 구조가 변경될 예정이므로 변경 후 작성
   */
  var changeItem = function() {
    var tot, i, j, col, last_element, first_type, last_type, cur_idx, next_idx, startIdx, col_len, focus_item, focus_element, items = [
      'tvshows',
      'movies',
      'appsngames',
      'appsngameshot',
      'appsngamesnew'
    ];
    tot = $scope.columnsTotal.length;
    contentData = $scope.columnsTotal;

    for (i=0; i<tot; i++) {
      col = contentData[i];

      if (!$scope.tmrContents && !wheelPrevent) {
        console.log('lastElement Timer error');
        return;
      }
      last_element = angular.element(document.getElementById('column'+i))[0].lastElementChild;

      if (last_element && items.indexOf(last_element.getAttribute('type')) >= 0) {
        var currType = last_element.getAttribute('type');
        cur_idx = parseInt(last_element.getAttribute('idx'));
        next_idx = cur_idx + 1;
        if (next_idx >= col.length) next_idx = 0;

        col_len = $scope.columns[i].length;
        startIdx = 0;
        for (j=startIdx; j<col_len; j++) {
          contentData[i][next_idx].idx = next_idx;
          $scope.columns[i][j] = contentData[i][next_idx];
          next_idx++;
          if (next_idx >= col.length) next_idx = 0;
        }
      }
    }

    if ($scope.banners && $scope.bannerTotal.length > $scope.banners.length) {
      var bannerEl = angular.element(document.querySelectorAll('[type="banners"]'));
      cur_idx = parseInt(bannerEl[bannerEl.length-1].getAttribute('idx'));
      next_idx = cur_idx + 1;
      if (next_idx >= $scope.bannerTotal.length) next_idx = 0;
      var item_idx = 0;
      if($scope.showAD) item_idx = 1;
      for (i=0; i<$scope.banners.length; i++) {
        item_idx = item_idx + i;
        $scope.bannerTotal[next_idx].item = parseInt($scope.numOfAllCols - 1) + '-' + item_idx;
        $scope.banners[i] = $scope.bannerTotal[next_idx];
        next_idx++;
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
        $scope.appsNewTotal[next_idx].idx = next_idx;
        $scope.appsNew[i] = $scope.appsNewTotal[next_idx];
        next_idx++;
        if (next_idx >= $scope.appsNewTotal.length) next_idx = 0;
      }
    }

    var column_arr, column;
    column_arr = $scope.columns;

    setItemIndex(column_arr, false);

    $scope.$apply();

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

    var playArr = $element[0].getElementsByClassName('icon-player');
    l = playArr.length;
    for (i = 0; i < l; i++) {
      $scope.setMouseEvent(playArr[i]);
    }

    focus_item = $scope.focusItem;
    if (focus_item && focus_item.length > 0) {
      focus_element = angular.element(document.querySelectorAll('[item="'+focus_item+'"]'))[0];
      $scope.setFocusItem(focus_item, focus_element);
    }

    //console.log(wheelPrevent);
    if (wheelPrevent) {
      //do nothing
    } else {
      if (useSetTimeout)
        $scope.tmrContents = setTimeout(startMasking, $scope.contentsRollingInterval * 1000);
      else
        $scope.tmrContents = $timeout(startMasking, $scope.contentsRollingInterval * 1000);
    }
  };

  /*
   * 채널 키 업 및 휠 업일 때 이전 데이터로 롤링 적용
   *  issue no : WOSLQEVENT-49475, NCVTDEFECT-849
   */
  var changeItemPrev = function() {
    var tot, i, j, col, last_element, first_type, last_type, cur_idx, next_idx, startIdx, col_len, focus_item, focus_element, items = [
      'tvshows',
      'movies',
      'appsngames',
      'appsngameshot',
      'appsngamesnew'
    ];
    tot = $scope.columnsTotal.length;
    contentData = $scope.columnsTotal;

    for (i=0; i<tot; i++) {
      col = contentData[i];

      if (!$scope.tmrContents && !wheelPrevent) {
        console.log('lastElement Timer error');
        return;
      }
//      first_element = angular.element(document.getElementById('column'+i))[0].firstElementChild;
      first_element = angular.element(document.getElementById('column'+i))[0].children[0];
      if(first_element && first_element.classList.contains('tit-category')) first_element = angular.element(document.getElementById('column'+i))[0].children[1];
      
      if (first_element && items.indexOf(first_element.getAttribute('type')) >= 0) {
        var currType = first_element.getAttribute('type');
        cur_idx = parseInt(first_element.getAttribute('idx'));
        prev_idx = cur_idx - 1;
        if (prev_idx < 0) prev_idx = col.length - 1;

        col_len = $scope.columns[i].length;
        startIdx = 0;
        for (j=col_len - 1; j > -1; j--) {
          contentData[i][prev_idx].idx = prev_idx;
          $scope.columns[i][j] = contentData[i][prev_idx];
          prev_idx--;
          if (prev_idx < 0) prev_idx = col.length - 1;
        }
      }
    }

    if ($scope.banners && $scope.bannerTotal.length > $scope.banners.length) {
      var bannerEl = angular.element(document.querySelectorAll('[type="banners"]'));
      cur_idx = parseInt(bannerEl[0].getAttribute('idx'));
      prev_idx = cur_idx - 1;
      if (prev_idx < 0) prev_idx = $scope.bannerTotal.length - 1;
      var item_idx = 0;
      if($scope.showAD) item_idx = 1;
      for (i=0; i<$scope.banners.length; i++) {
        item_idx = item_idx + i;
        $scope.bannerTotal[prev_idx].item = parseInt($scope.numOfAllCols - 1) + '-' + item_idx;
        $scope.banners[i] = $scope.bannerTotal[prev_idx];
        prev_idx--;
        if (prev_idx < 0) prev_idx = $scope.bannerTotal.length - 1;
      }
    }

    if ($scope.appsNew && $scope.appsNew.length > 0 && $scope.appsNewTotal.length > $scope.appsNew.length) {
      var appsNewEl = document.querySelectorAll('.column-ban .item-main-apps');
      cur_idx = parseInt(appsNewEl[appsNewEl.length-1].getAttribute('idx'));
      prev_idx = cur_idx - 1;
      if (prev_idx < 0) prev_idx = $scope.appsNewTotal.length - 1;
      var item_idx = 0;
      if($scope.appsNew.length == 1) item_idx = 1;
      for (i=0; i<$scope.appsNew.length; i++) {
        item_idx = item_idx + i;
        $scope.appsNewTotal[prev_idx].item = parseInt($scope.numOfAllCols - 1) + '-' + item_idx;
        $scope.appsNewTotal[prev_idx].idx = prev_idx;
        $scope.appsNew[i] = $scope.appsNewTotal[prev_idx];
        prev_idx--;
        if (prev_idx < 0) prev_idx = $scope.appsNewTotal.length - 1;
      }
    }

    var column_arr, column;
    column_arr = $scope.columns;

    setItemIndex(column_arr, false);

    $scope.$apply();

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

    var playArr = $element[0].getElementsByClassName('icon-player');
    l = playArr.length;
    for (i = 0; i < l; i++) {
      $scope.setMouseEvent(playArr[i]);
    }

    focus_item = $scope.focusItem;
    if (focus_item && focus_item.length > 0) {
      focus_element = angular.element(document.querySelectorAll('[item="'+focus_item+'"]'))[0];
      $scope.setFocusItem(focus_item, focus_element);
    }

    //console.log(wheelPrevent);
    if (wheelPrevent) {
      //do nothing
    } else {
      if (useSetTimeout)
        $scope.tmrContents = setTimeout(startMasking, $scope.contentsRollingInterval * 1000);
      else
        $scope.tmrContents = $timeout(startMasking, $scope.contentsRollingInterval * 1000);
    }
  };

  var initializeWheelEvent = function() {
    $element[0].getElementsByClassName('panel-cont')[0].onmousewheel = function(e) {
      //console.log('enter wheel event');
      var recentWheelTime;
      if (wheelPrevent) {
        return;
      }

      /*
      * wheel event로 item change시
      *이전에 설정 된 change item timeout clear 후
      *재설정
      */
      if (useSetTimeout)
        clearTimeout($scope.tmrContents);
      else
        $timeout.cancel($scope.tmrContents);
      $scope.tmrContents = null;

      if (useSetTimeout)
        $scope.tmrContents = setTimeout(startMasking, $scope.contentsRollingInterval * 1000);
      else
        $scope.tmrContents = $timeout(startMasking, $scope.contentsRollingInterval * 1000);

      wheelPrevent = true;
//      console.log('change main item');
      var direction = 'next';
      if(e.wheelDelta > 0) direction = 'prev' ;
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
    if (useSetTimeout)
      clearTimeout($scope.tmrContents);
    else
      $timeout.cancel($scope.tmrContents);
    $scope.tmrContents = null;

    if (useSetTimeout)
      $scope.tmrContents = setTimeout(startMasking, $scope.contentsRollingInterval * 1000);
    else
      $scope.tmrContents = $timeout(startMasking, $scope.contentsRollingInterval * 1000);

    wheelPrevent = true;
    var direction = 'next';
    if(keyCode === keyHandler.CH_UP) direction = 'prev' ;
    startMasking(direction);
  }
  //------------------------- main data 설정 관련 method end -------------------------//


  //------------------------- focus 설정 관련 method start -------------------------//
  /*
   * default focus 설정
   */
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

  /*
   * focus 설정
   */
  $scope.setFocusItem = function(item, element) {
    if (focusElement) {
      focusElement.classList.remove('focus');
    }
    focusElement = element;

    /*
     * tier1 featured 의 경우 data가 rolling 되어
     * parameter의 element가 화면에 없어 focus가 가지 않는 오류가 발생하여
     * item 명 체크하여 element query
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

  /*
   * last focus 로 focus 이동
   */
  $scope.recoverFocus = function() {
    if (lastFocus.item && lastFocus.element)
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  $scope.removeFocus = function(target) {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
    }
  };

  $scope.moveFocusByKey = function(keyCode) {
    var arr, column, index, rect, item;

    if ($scope.focusItem == '') {
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    arr = $scope.focusItem.split('-');
    column = parseInt(arr[0]);
    index = parseInt(arr[1]);
    switch (keyCode) {
      case keyHandler.LEFT:
        if (column == 0) return;
//        item = getItem(column - 1, index);
//        if (!item) {
//          item = getItem(column - 1, 0);
//        }
        for(i=column; i>0; i--) {
          item = getItem(i-1, index);
          if (!item) item = getItem(i-1, 0);
          if(item !== undefined) break;
        }
        break;
      case keyHandler.UP:
        if (index == 0) {
          rect = getCurrItemRect(focusElement);
          $scope.$broadcast('focus', 'header', keyCode, rect);
          return;
        }
        item = getItem(column, index - 1);
        //video 광고일 경우 focus video 광고 영역으로 이동
        if (item.element.classList.contains('item-ad') && $scope.videoAD) {
          $rootScope.$broadcast('focus', 'mainAd', keyCode, rect);
          return;
        }
        break;
      case keyHandler.RIGHT:
        if (column == $scope.numOfAllCols - 1) return;
//        item = getItem(column + 1, index);
//        if (!item) {
//          item = getItem(column + 1, 0);
//        }
        for(i=column; i<$scope.numOfAllCols - 1; i++) {
          item = getItem(i+1, index);
          if(item !== undefined) break;
        }
        //video 광고일 경우 focus video 광고 영역으로 이동
        if (item && item.element.classList.contains('item-ad') && $scope.videoAD) {
          $rootScope.$broadcast('focus', 'mainAd', keyCode, rect);
          return;
        }
        break;
      case keyHandler.DOWN:
        item = getItem(column, index + 1);
        if (!item) {
          return;
        }
        break;
    }

    if (item) {
      $scope.setFocusItem(item.name, item.element);
    }
  };

  var getItem = function(column, index) {
    var element, item = {};
    element = $element[0].querySelector('[item="'+column+"-"+index+'"]');
    if (!element) {
      return;
    }
    item.name = element.getAttribute('item');
    item.element = element;
    return item;
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

  /*
   * focus broadcast event method
   */
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
      var candidateElements = $element[0].querySelectorAll('[item$="-0"]'); // the first line of the contents
      var retVal = findFocusDownItem(currFocusElement, candidateElements);
      $scope.setFocusItem(retVal[0], retVal[1]); // item, element
    } else if (focusManager.getCurrent().target === 'mainAd') {
      var adElItem = $element[0].getElementsByClassName('item-ad')[0].getAttribute('item');
      var col = adElItem.split('-')[0];
      var idx = adElItem.split('-')[1];
      if (keyCode === keyHandler.LEFT) {
        col = col - 1;
        var focusEl = $element[0].querySelector('[item="'+col+'-0"]');
        if(focusEl) $scope.setFocusItem(focusEl.getAttribute('item'), focusEl);
      } else if(keyCode === keyHandler.DOWN) {
        idx = parseInt(idx) + 1;
        var focusEl = $element[0].querySelector('[item="'+col+'-'+idx+'"]');
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
  //------------------------- focus 설정 관련 method end -------------------------//

  //------------------------- 광고 설정 관련 method start -------------------------//
  /*
   * adManager 광고 response 후 broadcast 로 호출하는 함수
   */
  var displayAD = function(e, response, callbackFn) {
    //console.log("maintier1.js displayAD : ", response, callbackFn);
    if(response.type && response.type === 'video') {
      $scope.videoAD = true;
      $scope.imageAD = false;
      $scope.adType = 'videoAd';
      $rootScope.mainAd.showAD(response);
    }else{
      $scope.videoAD = false;
      $scope.imageAD = true;
      $scope.adType = 'imageAd';
      $scope.adRes = response;
      if($scope.adRes.srcUrl.length === 0) $scope.adRes.srcUrl = './resources/images/thumb/default_ad_300X250.png';
    }
    $scope.$digest();
    if (callbackFn) callbackFn();
  };

  /*
   * webkitshowed event 일때 광고 refresh
   */
  var foregroundHandler = function(e) {
    adManager.call('requestContextIndex', '', $scope.scopeName, adCallback);
  };

  /*
   * webkitshowed event시 time delay 문제
   *  : 1. video 광고 element가 상위 element 여서 image 광고를 가리는 문제
   *   2. video 광고 load 후 광고 데이터 scope에 setting에 time delay가 발생하여
   *
   * 가 발생하여 동영상광고와 이미지광고 refresh 정상동작 하지 않아
   * callback으로 처리
   *
   */
  var adCallback = function() {
    console.log('webkitshowed refreshAD callback');
    //console.log('device.param.scope' + device.param.scope);
    //console.log('$scope.videoAD' + $scope.videoAD);
    //console.log('focusManager.getLastFocus().target' + focusManager.getLastFocus().target);
    //console.log('$element[0].getElementsByClassName(item-ad)[0]' +$element[0].getElementsByClassName('item-ad')[0]);
    if(device.param && device.param.scope === 'featured') {
      if ($scope.videoAD) {
        if (!$rootScope.mainAd.show) {
          $rootScope.mainAd.show = true; 
          $rootScope.mainAd.$digest();
          $rootScope.mainAd.loadVideo();
        }
      } else {
        //webkitshow로 광고 refresh 되었을 때 lastfocus item이 동영상 광고일경우 
        //refresh 광고가 이미지 광고이면 이미지 광고로 focus
        if (focusManager.getLastFocus().target === 'mainAd' && $element[0].getElementsByClassName('item-ad')[0]) {
          console.log('focus to image ad!!!!!!!!!');
          $rootScope.mainAd.removeFocus();
          $scope.setFocusItem($element[0].getElementsByClassName('item-ad')[0].getAttribute('item'), $element[0].getElementsByClassName('item-ad')[0]);
        }
      }
    }
  };
  //------------------------- 광고 설정 관련 method end -------------------------//

  //------------------------- main data rolling masking 관련 method start -------------------------//
  var addMaskBlock = function() {
    var columnMask = angular.element(document.querySelectorAll('.main-column'));
    columnMask.addClass('fade-block');
  };

  var removeMaskBlock = function() {
    var columnMask = angular.element(document.querySelectorAll('.main-column'));
    columnMask.removeClass('fade-block');

    wheelPrevent = false;
  };

  var startMasking = function(direction) {
    if (!$scope.tmrContents && !wheelPrevent) {
      return;
    }

    $scope.maskBlock = true;
    $scope.maskHiding = true;
    addMaskBlock();
    if (direction === 'prev') changeItemPrev();
    else changeItem();

    if (useSetTimeout)
      setTimeout(handleTransition, 250);
    else
      $timeout(handleTransition, 250);
  };

  var endMasking = function() {
    if (!$scope.tmrContents && !wheelPrevent) {
      return;
    }

    $scope.maskBlock = false;
    removeMaskBlock();
  };

  var startShowing = function() {
    if (!$scope.tmrContents && !wheelPrevent) {
      return;
    }

    $scope.maskHiding = false;

    if (useSetTimeout)
      setTimeout(handleTransition, 250);
    else
      $timeout(handleTransition, 250);
  };

  var handleTransition = function() {
    if (!$scope.tmrContents && !wheelPrevent) {
      return;
    }

    if ($scope.webkitHidden) return;
    if ($scope.maskHiding) {
      if (useSetTimeout)
        setTimeout(startShowing, 380);
      else
        $timeout(startShowing, 380);
    } else {
      if (useSetTimeout)
        setTimeout(endMasking, 100);
      else
        $timeout(endMasking, 100);
    }
  };
  //------------------------- main data rolling masking 관련 method end -------------------------//

  //------------------------- click event 관련 method start -------------------------//
  $scope.executeAction = function() {
    if (focusManager.blockExecution()) {
      console.log('mainTier1.executeAction, blockExecution is true');
      return;
    }

    var focusObject, type, page, contentId, itemId, itemType, item, inLink;

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      type = focusElement.getAttribute('type');
      itemId = focusElement.getAttribute('item-id');
      itemType = focusElement.getAttribute('item-type');

      if(!$rootScope.isPlayKey) {
        switch (type) {
          case 'tvshows' :
            $rootScope.pmLogValue = pmLog.TYPE.TVSHOWS;
            contentsClick(pmLog.TYPE.TVSHOWS, itemId);
            page = 'detailList';
            item = itemType + '|' + itemId;
            inLink = true;
            break;
          case 'movies' :
            $rootScope.pmLogValue = pmLog.TYPE.MOVIE;
            contentsClick(pmLog.TYPE.MOVIE, itemId);
            page = 'detailList';
            item = itemType + '|' + itemId;
            inLink = true;
            break;
          case 'appsngames':
          case 'appsngameshot':
          case 'appsngamesnew':
            contentsClick(pmLog.TYPE.APPGAME, itemId);
            page = 'detailApp';
            item = itemId;
            inLink = true;
            break;
          case 'banners':
            contentsClick(pmLog.TYPE.THEME, itemId);
            page = 'detailTheme';
            item = itemId;
            break;
          case 'imageAd':
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
            break;
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
        watchProcess.execProcess($scope.$id, item, itemId, 'Main', focusElement.parentElement.getAttribute('type'));
        return;
      } else if($rootScope.isPlayKey && (type === 'tvshows' || type === 'movies') ) {
        $rootScope.isPlayKey = false;
        watchProcess.execProcess($scope.$id, item, itemId, 'Main', focusElement.parentElement.getAttribute('type'));
        return;
      } else {
        $rootScope.isPlayKey = false;
      }

      if (page && page.length > 0) {
        $rootScope.draw({page: page, module: item, inLink: inLink});
      }
    }
  };

  var contentsClick = function(category, id) {
    if (category === pmLog.TYPE.THEME) {
      pmLog.write(pmLog.LOGKEY.PROMOTION_CLICK, {
        theme_id : id,
        contents_category : category
      });
    } else {
      pmLog.write(pmLog.LOGKEY.CONTENTS_CLICK, {
        menu_name : 'Main',
        contents_type : (category === pmLog.TYPE.APPGAME) ? 'Apps' : 'VOD',
        contents_category : category,
        contents_id : id,
        sub_menu_name : '',
        sub_sub_menu_name : ''
      });
    }
  };
  //------------------------- click event 관련 method end -------------------------//

  var hideMain = function(e, page) {
    e.preventDefault();
    if (page != $scope.scopeName) {
      if ($scope.direct == false && $scope.showing == false) {
        if (page == '') {
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
        }
      }
      mainTier1Tmpl = null;
      //$scope.adRes = {};
      var endTime = new Date().getTime();
      console.info('%c [PERFORMANCE]  : Featured LOADING TIME : ' + (endTime - device.startTime) + '   ', 'background-color:green;color:white');
      return;
    }

    if (useSetTimeout)
      clearTimeout($scope.tmrContents);
    else
      $timeout.cancel($scope.tmrContents);
    $scope.tmrContents = null;

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      // $timeout(function() {
        $element.remove();
        $scope.$destroy();
      // }, timeOutValue.DESTROYING);
    });
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
    device.startTime = new Date().getTime();
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
//    $scope.$on('pointerRemoved', );

    if (!device.featuredMainData) {
      if (!device.isLocalJSON) {
        // Server용
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
