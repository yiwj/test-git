app.directive('mainTier1', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'mainTier1Controller',
//    templateUrl: './resources/html/new_mainTier1.html'
    template: mainTier1Tmpl
  };
});

app.directive('errSrc', function(pmLog) {
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function() {
        //console.log('attrs.errSrc :  ', attrs.errSrc);
        pmLog.write(pmLog.LOGKEY.AD_LOG_MAIN, {
          position : 'errSrc',
          attrsSrc : attrs.src,
          attrsErrSrc : attrs.errSrc
        });
        if (attrs.src !== attrs.errSrc && attrs.dImgType === "AD") {
          attrs.$set('src', attrs.errSrc);
        }
      });
    }
  }
});

app.directive('tier1ImageResizeHandler', function(pmLog, $log) {
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
      $element.bind('error', function (e) {
        var defaultImageArray = {
          'PO': './resources/images/thumb/default_tvshow_280x410.png', // Default Post Image
          'AG': './resources/images/thumb/default_app.png',            // Default Apps&Games Image
          'AD': './resources/images/thumb/default_ad_1130x290.png',     // Default
          'TB': './resources/images/thumb/default_video.png'           // 테마베너 초기화 이미지 추가(현재 배너 초기화 이미지가 없음)(현재 배너 초기화 이미지가 없음)
        };
        pmLog.write(pmLog.LOGKEY.AD_LOG_MAIN, {
          position : 'bind_error',
          src : e.target.getAttribute('src')
        });
        var defaultImgType = $element[0].getAttribute('d-img-type');
        if($element[0].src !== defaultImageArray[defaultImgType]) {
          $element[0].src = defaultImageArray[defaultImgType];
          $scope.$digest();
        }
      });
    }
  };
});


app.controller('mainTier1Controller', function($scope, $controller, $element, $rootScope, $timeout, $sce, server, focusManager, keyHandler, marquee, util, adManager, storage, pmLog, device, eventKey, timeOutValue, popupService, watchProcess, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var lastFocus = {};
  var globalResponse = {};
  var destroyInfo = {scope : $scope, element : $element};
  var displayAdFlag = false;
  var displayAdStatus = false;

  $rootScope.pmLogValue = pmLog.TYPE.MAIN;
  $scope.scopeName = 'featured';
  $scope.tmrContents = null;
  $scope.discoveryData = null;
  $scope.contentsRollingInterval = 10; // data rolling interval
  $scope.numOfAllCols = 5; // total columns number
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
    /*// test : 데이터 불량
     if (!device.featuredMainData) {
     response['contentsList'][0].contents = null;
     response['contentsList'][1].contents = null;
     }*/

    // WOSLQEVENT-99260 : 시청정보 미동의 관련 api(/remove1) 호출에러 시 포커스 빠지는 문제
    // 진입에러 뜨고 백에서 메인을 그려서 포커스 안으로 이동 됨.
    if (device.isMainError) {
      pmLog.write(pmLog.LOGKEY.FEATURED_LOG, {
        msg: 'mainTier1.drawMain, exit 1'
      });
      $rootScope.spinner.hideSpinner();
      return false;
    }

    var index, obj, cpData;

    e.preventDefault();

    // for Loop : 불량 contentsList 제거
    var contLen = response['contentsList'].length;
    for (var i=0; i<contLen; i++){
      if (response['contentsList'][i].category === 'tvshows' || response['contentsList'][i].category === 'movies') {
        if (!response['contentsList'][i].contents || (response['contentsList'][i].contents && response['contentsList'][i].contents.length === 0)) {
          response['contentsList'].splice(i, 1);
          i = -1;
          contLen--;
        }
      }
    }
    i = null;
    contLen = null;

    $scope.discoveryData = response;

    //check main error
    if ($rootScope.isMainError(response)) {
      $scope.direct = true;
      $scope.expand = true;
      $element[0].classList.add('direct', 'expand');
      //$scope.$apply();
      pmLog.write(pmLog.LOGKEY.FEATURED_LOG, {
        msg: 'mainTier1.drawMain, exit 2'
      });
      return;
    }

    //메인 RollingInterval 설정
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
      device.adFeatured = false;
    }

    /*
     * 광고가 먼저 로드된 후 화면이 늦게 그려지면
     * 비디오 광고가 재생이 시작된 이후 화면이 뜨는 문제가 발생하여..
     * showAD 위치를 수정함 (15.09.07)
     * issue no : WOSLQEVENT-51729
     */
    if (device.firstRun && $scope.showAD && !displayAdFlag) {
      var tmpAdRes = adManager.adResponse[$scope.scopeName];
      adManager.adResponse[$scope.scopeName] = [];
      if (tmpAdRes) {
        for (var i = 0; i < tmpAdRes.length; i++) {

          if (tmpAdRes[i].type === 'video') {
            $scope.videoAD = true;
            $scope.adType = 'videoAd';
            $rootScope.mainAd.showAD(tmpAdRes[i]);
          } else {
            $scope.adRes = tmpAdRes[i];
            if (!tmpAdRes[i]) $scope.adRes = {};
            if (!tmpAdRes[i].srcUrl) $scope.adRes.srcUrl = {};
            if (tmpAdRes[i].srcUrl.length === 0 || tmpAdRes[i].adContextIndex === undefined) {
              $scope.adRes.srcUrl = './resources/images/thumb/default_ad_1130x290.png';
            }
            $scope.imageAD = true;
            $scope.adType = 'imageAd';
          }
        }
      }
    }

    /*
     * featured page 최초 진입시 controller의 admanager.call()을 하고 lunaError가 발생하였을 경우
     * 해당 lunaError를 broadcast하지 않아 광고 디폴트 페이지가 나오지 않는 현상이 발생하여
     * lunaError를 broadcast하기 전 시점에 flag를 두어 메인 draw 시 디폴트 이미지가 정상적으로 나오도록 처리.
     */
    if(device.adStatusByLunaError) {
      displayDefaultAD();
    }

    /**
     * response 데이터를 $scope.columnsTotal과 $scope.columns 으로 가공
     * $scope.columnsTotal은 rolling되는 전체데이터
     * $scope.columns 은 main에 보여지는 현재데이터
     */
    var columnSum = 0;  //response.contentsList.column 들의 합
    for (index = 0; index < response.contentsList.length; index++) {
      var category, title, showedItemNum, contentsColumn, banners, item_type;
      columnSum = columnSum + parseInt(response.contentsList[index].column);

      //해당 index 배열 선언
      $scope.columnsTotal[index] = [];  //전체 데이터 Array
      $scope.columns[index] = [];       //화면 Rolling 용 Array

      category = response.contentsList[index].category;   //category
      title = response.contentsList[index].contentsTitle; //contentsTitle

      //type(category) 설정
      $scope.columns[index].type = category;

      //column 설정
      if (response.contentsList[index].column) contentsColumn = parseInt(response.contentsList[index].column); //column
      $scope.columnsTotal[index].column = contentsColumn;
      $scope.columns[index].column = contentsColumn;

      //tvshow와 movie만 상단 카테고리 노출
      if (category === 'tvshows' || category === 'movies') {
        $scope.columnsTotal[index].category = title;
        $scope.columns[index].category = title;
      }

      showedItemNum = contentsColumn; //화면에 표시할 item 수

      //item_type 설정
      if (category === 'tvshows') {
        item_type = 'TS';
      } else if (category === 'movies') {
        item_type = 'MV';
      } else if (category === 'appsngames' || category === 'appsngamesnew' || category === 'appsngameshot' || category === 'premium') {
        item_type = 'app';
        if (contentsColumn) showedItemNum = contentsColumn * 2; //app은 1column 당 2개 contents가 들어감
      }

      /*
       * 마지막 contentsList에 bannerlist가 존재할 경우 List Setting
       * 화면에 노출할 item 개수 계산
       * response.headerItemId : deeplink로 들어온 item_id
       * deeplink 로 들어왔을때 headerItemId의 banner가 있을 시 해당 contents를 unshift 함.
       */

      if (!response.contentsList[index + 1]) {
        //마지막 contentsList에 수동 banner 데이터가 1개 이상있으면
        if (response.contentsList[index].banners.length > 0) {
          $scope.banners = response.contentsList[index].banners; //화면에 노출할 배너 데이터(최초 로딩이므로 최상위 데이터 노출)
        }

        var defaultBanners = [
          {"column": "1", "order": "1", "img": "./resources/images/temp/Most_popular.png", "id": "default_hot", "name": "Most_popular", "category": "1"},
          {"column": "1", "order": "2", "img": "./resources/images/temp/Newly_updated.png", "id": "default_new", "name": "Newly_updated", "category": "2"},
          {"column": "1", "order": "3", "img": "./resources/images/temp/Hot_entertainment.png", "id": "default_all_entertainment", "name": "Hot_entertainment", "category": "5"}
        ];

        //수동 banner 데이터가 1개 이하이면 나머지는 자동 banner 로 채운다
        while ($scope.banners.length !== 2) {
          var ranIndex = Math.floor(Math.random() * defaultBanners.length);
          $scope.banners.push(defaultBanners[ranIndex]);
          defaultBanners.splice(ranIndex, 1); //자동 banner 중복 push 방지
        }

        if (response.headerItemId != undefined) {
          for (var i = 0; i < $scope.banners.length; i++) {
            if ($scope.banners[i].id === response.headerItemId) {
              $scope.banners.unshift(angular.copy($scope.banners[i]));
              break;
            }
          }
          $scope.banners.splice(i + 1, 1);  //해당 banner 컨텐츠를 copy 하여 unshift 하였으므로 본래 컨텐츠를 삭제
        }
        $scope.showBanner = true;

        //banner 컨텐츠 우선순위로 sorting
        $scope.banners.sort(function (a, b) {
          return a.order - b.order;
        });

        //banner idx 부여
        for (var i = 0; i < $scope.banners.length; i++) {
          $scope.banners[i].type = 'banners';
          $scope.banners[i].idx = i;
        }

        //화면에 노출할 item 개수 계산
        /*if (columnSum === 5) {
         if ($scope.showBanner) {
         if (category === 'appsngames' || category === 'appsngamesnew' || category === 'appsngameshot' || category === 'premium') {
         showedItemNum = $scope.showAD ? showedItemNum - 2 : showedItemNum - 1;
         } else if (category === 'tvshows' || category === 'movies') {
         showedItemNum = showedItemNum - 1;
         }
         } else {
         if (category === 'appsngames' || category === 'appsngamesnew' || category === 'appsngameshot' || category === 'premium') {
         showedItemNum = $scope.showAD ? showedItemNum - 1 : showedItemNum;
         } else if (category === 'tvshows' || category === 'movies') {
         showedItemNum = $scope.showAD ? showedItemNum - 1 : showedItemNum;
         }
         }
         }*/
      }

      //response.contentsList 데이터 셋팅
      var contentsArr = response.contentsList[index].contents;  //해당 Index 별 Contents Array
      for (i = 0; i < contentsArr.length; i++) {
        if (contentsArr[i].img !== undefined && contentsArr[i].img === '') {
          contentsArr[i].img = 'default-img'; // When the ng-src is empty String(''), Angularjs cannot bind error. ( But html template is src, it can bind error. )
        }
        //item_type, category, price, style, white 속성 Setting
        var currItem = setElement(item_type, category, contentsArr[i]);
        $scope.columnsTotal[index].push(currItem);
        if (i < showedItemNum) {
          $scope.columns[index].push(currItem);
        }
        // Binding CP List
        if (contentsArr[i].execCpListString) {
          cpData = util.cpInfo(contentsArr[i].execCpListString);
          contentsArr[i].execCpList = cpData;
        }
      }

      //columns 와 columnsTotal 데이터 가공
      if (!response.contentsList[index + 1] && columnSum === 5) {  //마지막 데이터 이고 column 데이터가 정상적으로 왔을때
        if (category === 'tvshows' || category === 'movies') {
          //tvshow 또는 movie가 맨 마지막열에 편성되었으나 광고나 배너가 있으면 표시하지 않는다.
          if (showedItemNum === 0) {
            $scope.columnsTotal[index].category = "";
            $scope.columns[index].category = "";
          }
          //Rolling 횟수
          var rollingNum = $scope.columnsTotal[index].length / contentsColumn;
          var tmpColTotalLength = $scope.columnsTotal[index].length;

          /*
           *  1. $scope.columnsTotal 과 $scope.columns 에
           *     광고 또는 배너가 있을시 해당 위치에 type = 'empty'로 splice 해준다.
           *  2. 광고 또는 배너에 column-ban 이라는 class 를 주어 contents 들과 다른 layer를 사용
           *     하도록 하기위해 맨 $scope.columns 마지막에 push 해준다.
           */
          if (($scope.showBanner && $scope.showAD) || ($scope.showBanner && !$scope.showAD) || (!$scope.showBanner && $scope.showAD)) {

            //$scope.columnsTotal[index] 삭제
            $scope.columnsTotal[index].splice(rollingNum * ((contentsColumn - 1)), $scope.columnsTotal[index].length);

            //columns 에 empty 추가
            for (var i = 0; i < contentsColumn; i++) {
              if (i === (contentsColumn - 1)) {
                var item = [];
                item.type = 'empty';
                $scope.columns[index].splice(i, 0, item);
              }
            }

            //columnsTotal 에 empty 추가
            columnsTotalSetting(contentsColumn, tmpColTotalLength, index, 1);

            //광고 있을 때
            if ($scope.showAD) {
              //AD push
              var tmpArr = [];
              tmpArr.type = 'ad';
              $scope.columns[index + 1] = [];  //Array 초기화
              $scope.columns[index + 1].push(tmpArr);
              $scope.columns[index + 1].column = 'ban';
              $scope.columns[index + 1].type = 'banner&ad';
            }

            //배너 있을 때
            if ($scope.showBanner) {
              //Banner push
              if (!$scope.showAD) {
                $scope.columns[index + 1] = [];  //Array 초기화
                $scope.columns[index + 1].column = 'ban';
                $scope.columns[index + 1].type = 'banner&ad';
                if (!$scope.showAD) $scope.columns[index + 1].singleBanner = 'single-theme-banner';
              }
              $scope.columns[index + 1].push($scope.banners[0]);
            }
          }
        } else if (category === 'appsngames' || category === 'appsngamesnew' || category === 'appsngameshot' || category === 'premium') {
          //Rolling 횟수
          var rollingNum = $scope.columnsTotal[index].length / (contentsColumn * 2);
          var tmpColTotalLength = $scope.columnsTotal[index].length;
          //$scope.columns 에 광고와 배너 splice
          if ((contentsColumn * 2) === (showedItemNum + 2)) { //광고와 배너 둘다 있을경우

            //$scope.columnsTotal[index] 삭제
            $scope.columnsTotal[index].splice(rollingNum * ((contentsColumn * 2) - 2 ), $scope.columnsTotal[index].length);

            if (showedItemNum === 0) {  //광고와 배너가 둘다 있는데 showedItemNum 이 0 이면 column 이 1이고 광고와 배너가 모두 편성
              //$scope.columns 에 empty 추가
              var item = [];
              item.type = 'empty';
              $scope.columns[index].push(item);  //AD 추가
              var item = [];
              item.type = 'empty';
              $scope.columns[index].push(item);  //Banner 추가

            } else {
              //$scope.columns 에 empty 추가
              var tmpVal = -1;
              for (var i = 0; i < (contentsColumn * 2); i++) {
                if (i === (contentsColumn - 1)) {
                  var item = [];
                  item.type = 'empty';
                  $scope.columns[index].splice(i, 0, item);
                  tmpVal = i + contentsColumn;
                } else if (i === tmpVal) {
                  var item = [];
                  item.type = 'empty';
                  $scope.columns[index].splice(i, 0, item);
                }
              }
            }

            //$scope.columnsTotal 에 empty 추가
            columnsTotalSetting(contentsColumn, tmpColTotalLength, index, 1);

            //AD push
            var tmpArr = [];
            tmpArr.type = 'ad';
            $scope.columns[index + 1] = [];  //Array 초기화
            $scope.columns[index + 1].push(tmpArr);
            $scope.columns[index + 1].column = 'ban';
            $scope.columns[index + 1].type = 'banner&ad';
            //Banner push
            $scope.columns[index + 1].push($scope.banners[0]);

          } else if ((contentsColumn * 2) === (showedItemNum + 1)) {  // AD와Banner 중 한개만 있을경우
            //$scope.columnsTotal[index] 삭제
            $scope.columnsTotal[index].splice(rollingNum * ((contentsColumn * 2) - 1 ), $scope.columnsTotal[index].length);

            //광고 있을 때
            if ($scope.showAD) {
              //$scope.columns 에 empty 추가
              var item = [];
              item.type = 'empty';
              $scope.columns[index].splice((contentsColumn - 1), 0, item);

              //$scope.columnsTotal 에 empty 추가
              columnsTotalSetting(contentsColumn, tmpColTotalLength, index, 2);

              //AD push
              var tmpArr = [];
              tmpArr.type = 'ad';
              $scope.columns[index + 1] = [];  //Array 초기화
              $scope.columns[index + 1].push(tmpArr);
              $scope.columns[index + 1].column = 'ban';
              $scope.columns[index + 1].type = 'banner&ad';
            }

            //배너 있을 때
            if ($scope.showBanner) {
              //$scope.columns 에 empty 추가
              var tmpVal = contentsColumn + (contentsColumn - 1);
              var item = [];
              item.type = 'empty';
              $scope.columns[index].splice(tmpVal, 0, item);

              //$scope.columnsTotal 에 empty 추가
              columnsTotalSetting(contentsColumn, tmpColTotalLength, index, 3);

              //Banner push
              $scope.columns[index + 1] = [];  //Array 초기화
              $scope.columns[index + 1].column = 'ban';
              $scope.columns[index + 1].type = 'banner&ad';
              $scope.columns[index + 1].singleBanner = 'single-theme-banner';
              $scope.columns[index + 1].push($scope.banners[0]);
            } //배너 있을 때 end
          } //AD와Banner 둘중 한개만 있을경우 else if end
        } //else if end
      } else if (!response.contentsList[index+1] && columnSum !== 5) {  //마지막 데이터 이고 column 데이터가 비정상적으로 왔을때
        //광고 있을 때
        if ($scope.showAD) {
          //AD push
          var tmpArr = [];
          tmpArr.type = 'ad';
          $scope.columns[index + 1] = [];  //Array 초기화
          $scope.columns[index + 1].push(tmpArr);
          $scope.columns[index + 1].column = 'ban';
          $scope.columns[index + 1].type = 'banner&ad';
        }

        //배너 있을 때
        if ($scope.showBanner) {
          //Banner push
          if (!$scope.showAD) {
            $scope.columns[index + 1] = [];  //Array 초기화
            $scope.columns[index + 1].singleBanner = 'single-theme-banner';
          }
          $scope.columns[index + 1].column = 'ban';
          $scope.columns[index + 1].type = 'banner&ad';
          $scope.columns[index + 1].push($scope.banners[0]);
        }
      }
      if ($scope.columns[index].length === 0) {
        $scope.columns.splice(index, 1);
        $scope.columnsTotal.splice(index, 1);
      }
    } //drawMain for문 끝

    var column_arr = $scope.columns;

    //item 과 idx 부여
    setItemIndex(column_arr, true);

    //header draw start
    $scope.$broadcast('draw', $scope.banners);

//    var arrTmp = $element[0].getElementsByClassName('item');
    var arrTmp = $element[0].querySelectorAll('.main-body .item');
    showedItemNum = arrTmp.length;
    for (i = 0; i < showedItemNum; i++) {
      obj = arrTmp[i];
      $scope.setMouseEvent(obj);
      obj.removeAttribute('ng-class');
      obj.removeAttribute('ng-repeat');
      divItemThumbbgBlackCss(obj);
    }

    var playArr = $element[0].getElementsByClassName('icon-code');
    showedItemNum = playArr.length;
    for (i = 0; i < showedItemNum; i++) {
      $scope.setMouseEvent(playArr[i]);
    }

    $element[0].removeAttribute('ng-class');

    $rootScope.pageManager.setTitle(msgLang.title);

    if (useSetTimeout)
      $scope.tmrContents = setTimeout(startMasking, $scope.contentsRollingInterval * 1000);
    else
      $scope.tmrContents = $timeout(startMasking, $scope.contentsRollingInterval * 1000);

    //매직리모컨 휠로 메인 데이터 롤링을 위한 initailize
    initializeWheelEvent();

    //[QEVENTSIXT-6464]광고 배너에 광고 loading 되기 전까지 배너영역에 아무것도 안뜨는 경우 발생 처리
    if(displayAdStatus || !$scope.showAD || $scope.imageAD) {
      $rootScope.$broadcast(eventKey.HEADER_ADSPINNER, false);
    } else {
      if(device.isTv) {
        $rootScope.$broadcast(eventKey.HEADER_ADSPINNER, true);
      }
    }

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

  var setItemIndex = function(column_arr, firstSet) {

    var column = [];
    var itemIdx = 0; //rolling을 위한 아이템별 index 변수
    var col = 0;  //item column 값
    var row = 0;  //item row 값
    //index 변수 설정
    for (var i = 0; i < column_arr.length; i++) {
      column = $scope.columns[i];
      var tmpCol = column_arr[i].column;
      var tmpVal = 0;
      for (var j = 0; j < column.length; j++) {
        if (!column[j]) continue;
        if (column_arr[i].type === "tvshows" || column_arr[i].type === "movies") {
          //itemIdx 부여
          if (firstSet) column[j].idx = itemIdx;
          if (column[j + 1]) {
            itemIdx++;
          } else {
            itemIdx = 0;
          }
          //item값 부여
          column[j].item = col + '-' + row;
          col++;
        } else if (column_arr[i].type === 'appsngames' || column_arr[i].type === 'appsngamesnew' || column_arr[i].type === 'appsngameshot' || column_arr[i].type === 'premium') {
          //itemIdx 부여
          if (firstSet) column[j].idx = itemIdx;
          if (column[j + 1]) {
            itemIdx++;
          } else {
            itemIdx = 0;
          }

          //item값 부여
          tmpCol = column_arr[i].column;
          if (tmpCol > 1) { //2줄 이상이면
            column[j].item = col + '-' + row;
            if (column[j+1]) {
              tmpVal++;
              col++;
              if ((tmpCol) === tmpVal) {
                col = col - tmpCol;
                row++;
              }
            } else {
              col++;
              row = 0;
            }
          } else if (tmpCol === 1) {
            column[j].item = col + '-' + row;
            if (column[j+1]) {
              row++;
            } else {
              col++;
              row = 0;
            }
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

      //background color 에 따라서 text color 변경 적용
      if(iconVal > defaultVal) {
        currItem.white = true;
      }
    }
    return currItem;
  };

  /*
   *  type 1 : onNow와 app이고 배너와 광고가 둘다 있는 경우
   *  type 2 : app이고 광고만 있을경우
   *  type 3 : app이고 배너만 있을경우
   */
  var columnsTotalSetting = function(column, totalLength, index, type) {
    var tmpVal = column;
    var compareVal, increaseVal;
    switch (type) {
      case 1 :
        compareVal = -1;
        increaseVal = column;
        break;
      case 2 :
        compareVal = -1;
        increaseVal = 2 * column;
        break;
      case 3 :
        compareVal = column - 1;
        increaseVal = 2 * column;
        break;
    }

    for (var i = 0; i < totalLength; i++) {
      if (i === tmpVal + compareVal) {
        var item = [];
        item.type = 'empty';
        $scope.columnsTotal[index].splice(i, 0, item);
        tmpVal = tmpVal + increaseVal;
      }
    }
  }

  var getPerceptualBrightness = function(color) {
    var r = parseInt(color.substring(0,2),16);
    var g = parseInt(color.substring(2,4),16);
    var b = parseInt(color.substring(4.6),16);
    return r*2 + g*3 + b;
  };

  /*
   * Main Data rolling method
   * 채널 키 업 및 휠 업일 때 이전 데이터로 롤링 적용
   *  issue no : WOSLQEVENT-49475, NCVTDEFECT-849
   */
  var changeItem = function(direction) {
    if (direction === undefined) direction = 'next'; // default : 'next'
    var i, j, col, last_element, first_element, contentData, first_type, last_type, cur_idx, next_idx, startIdx, col_len, focus_item, focus_element, obj, items = [
      'tvshows',
      'movies',
      'appsngames',
      'appsngameshot',
      'appsngamesnew',
      'banners',
      'empty',
      'premium'
    ];

    contentData = $scope.columnsTotal;

    for (i = 0 ; i < $scope.columnsTotal.length ; i++) {
      col = contentData[i];

      if (!$scope.tmrContents && !wheelPrevent) {
        console.log('lastElement Timer error');
        return;
      }
      last_element = angular.element(document.getElementById('column'+i))[0].lastElementChild;
      first_element = angular.element(document.getElementById('column'+i))[0].children[0];

      if (first_element && first_element.classList.contains('tit-category')) first_element = angular.element(document.getElementById('column'+i))[0].children[1];
      if (last_element && items.indexOf(last_element.getAttribute('type')) >= 0) {
        var currType = last_element.getAttribute('type');
        // check-direction
        if (direction === 'next') {
          cur_idx = parseInt(last_element.getAttribute('idx'));
          next_idx = cur_idx + 1;
          if (next_idx >= col.length) next_idx = 0;

          col_len = $scope.columns[i].length;
          startIdx = 0;
          //if(currType === 'appsngamesnew' && ($scope.showBanner || $scope.showAD)) startIdx = 1;

          //banner index 설정
          if (currType === 'empty') {
            var tmpCol = 0;
            if ($scope.showAD) {
              tmpCol = 1;
            }
            var next_banner_idx = $scope.columns[i+1][tmpCol].idx + 1;
            if (next_banner_idx >= $scope.banners.length) next_banner_idx = 0;
            $scope.columns[i+1][tmpCol] = $scope.banners[next_banner_idx];
          }

          for (j = startIdx; j < col_len; j++) {
            contentData[i][next_idx].idx = next_idx;
            $scope.columns[i][j] = contentData[i][next_idx];
            next_idx++;
            if (next_idx >= col.length) next_idx = 0;
          }
        } else if (direction === 'prev') {
          cur_idx = parseInt(first_element.getAttribute('idx'));

          startIdx = -1;
          /*if((currType === 'appsngamesnew' && ($scope.showBanner || $scope.showAD)) || currType === 'banners') {
           startIdx = 0;
           cur_idx = parseInt(last_element.getAttribute('idx'));
           }*/
          var prev_idx = cur_idx - 1;

          col_len = $scope.columns[i].length;
          if (prev_idx < 0) prev_idx = col.length - 1;
          for (j = col_len - 1; j > startIdx; j--) {
            contentData[i][prev_idx].idx = prev_idx;
            $scope.columns[i][j] = contentData[i][prev_idx];
            prev_idx--;
            if (prev_idx < 0) prev_idx = col.length - 1;
          }

          //banner index 설정
          if (currType === 'empty') {
            var tmpCol = 0;
            if ($scope.showAD) {
              tmpCol = 1;
            }
            var next_banner_idx = $scope.columns[i+1][tmpCol].idx === 0 ? $scope.banners.length - 1 : $scope.columns[i+1][tmpCol].idx - 1;
            $scope.columns[i+1][tmpCol] = $scope.banners[next_banner_idx];
          }
        } // end of check-direction
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
//    arr = $element[0].getElementsByClassName('item');
    arr = $element[0].querySelectorAll('.main-body .item');
    l = arr.length;
    for (i = 0; i < l; i++) {
      obj = arr[i];
      $scope.setMouseEvent(obj);
      obj.removeAttribute('ng-class');
      obj.removeAttribute('ng-repeat');
      divItemThumbbgBlackCss(obj);
    }

    var playArr = $element[0].getElementsByClassName('icon-code');
    l = playArr.length;
    for (i = 0; i < l; i++) {
      $scope.setMouseEvent(playArr[i]);
    }

    /*
     [WOSLQEVENT-112517] Home 과같은 overlay 타입의 앱 활성화 되었을경우 스토어 포커스 안가도록하고
     더불어 audioGuidance 발화도 안되도록 처리
     */
    if (util.isAWSServer()) {
      if(!device.isBlur){
        focus_item = $scope.focusItem;
        if (focus_item && focus_item.length > 0) {
          focus_element = angular.element(document.querySelectorAll('[item="'+focus_item+'"]'))[0];
          $scope.setFocusItem(focus_item, focus_element);
        }
      }
    } else{
      focus_item = $scope.focusItem;
      if (focus_item && focus_item.length > 0) {
        focus_element = angular.element(document.querySelectorAll('[item="'+focus_item+'"]'))[0];
        $scope.setFocusItem(focus_item, focus_element);
      }
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
    $element[0].querySelector('.main-body .panel-cont').onmousewheel = function(e) {
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
     *  wheel event로 item change시
     *  이전에 설정 된 change item timeout clear 후
     *  재설정
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
  };
  //------------------------- main data 설정 관련 method end -------------------------//

  //------------------------- focus 설정 관련 method start -------------------------//

  //default focus 설정
  $scope.setDefaultFocus = function() {
    var target;

//    target = $element[0].getElementsByClassName('item')[0];
    target = $element[0].querySelectorAll('[item="0-0"]')[0];
    if (target)
    {
      var item = target.getAttribute('item');
      $scope.setFocusItem(item, target);
    } else {
      $scope.setFocusItem('', null);
    }
  };

  //focus 설정
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
    //var focusElItem = focusElement ? focusElement.getAttribute('item') : '';
    if (item) {
      //[QEVENTSIXT-14816] blur -> focus 이벤트 사이에 item이 rolling되면 포커스가 사라지는 이슈.
      // 이 로직을 타지않아 주석 처리하고 다른 로직 추가.
      /*if ($scope.focusItem !== item || focusElItem !== item) {
       focusElement = document.querySelectorAll('[item="'+item+'"]')[0];
       }*/
      var beforeFocusElement = document.querySelectorAll('[item="'+item+'"]')[0];
      if(beforeFocusElement !== focusElement){
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

  /*
   * last focus 로 focus 이동
   */
  $scope.recoverFocus = function () {
    if (lastFocus.item && lastFocus.element)
    /*[WOSLQEVENT-107880] 네트워크 해제, 팝업 표출 후 rolling change 되면 이전 focus element와 item은 같으나
     element가 다르기 때문에 focus 가 가지 않아 element 가 다를경우
     setDefaultFocus() 를 타도록 수정*/
      if (lastFocus.element !== $element[0].getElementsByClassName('item')[0]) {
        $scope.setDefaultFocus();
      } else {
        $scope.setFocusItem(lastFocus.item, lastFocus.element);
      }
  };

  $scope.removeFocus = function(target) {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
    }
  };

  $scope.moveFocusByKey = function (keyCode) {
    var arr, column, row, rect, item;
    //[WOSLQEVENT-114169] 팝업창에 초기 포커스가 곧바로 해제
    //공지사항 팝업창이 떴을때 포커스가 피쳐드 화면으로 이동하는걸 방지함.
    if(util.isAWSServer()){
      if($rootScope.popupApp && $rootScope.popupApp.open){
        return;
      }
    }

    if ($scope.focusItem == '') {
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    arr = $scope.focusItem.split('-');  //현재 focus item
    column = parseInt(arr[0]);
    row = parseInt(arr[1]);
    switch (keyCode) {
      case keyHandler.LEFT:
        //1열일경우 return;
        if (column === 0) return;
        for (var i = column; i > 0; i--) {
          item = getItem(i - 1, row);
          if (!item) item = getItem(i - 1, 0);
          if (item !== undefined) break;
        }
        break;
      case keyHandler.UP:
        if (focusElement.getAttribute('item').indexOf('play_btn') !== -1) {
          item = focusElement.getAttribute('item').substring(0, 3);
          $scope.setFocusItem(item, document.querySelector('[item="' + item + '"]'));
          return;
        }
        //1행일경우 header로 Focus 이동
        if (row === 0) {
          rect = getCurrItemRect(focusElement);
          $scope.$broadcast('focus', 'header', keyCode, rect);
          return;
        }

        item = getItem(column, row - 1);
        break;
      case keyHandler.RIGHT:
        //5열 또는 banner 일 경우 return;
        if (column === 4) return;

        item = getItem(column + 1, row);
        for (var i = column; i < $scope.numOfAllCols - 1; i++) {
          item = getItem(i + 1, row);
          if (!item) {
            item = getItem(i + 1, 0);
          }
          if (item !== undefined) break;
        }
        break;
      case keyHandler.DOWN:
        //i 버튼일 경우 return;
        if (focusElement.getAttribute('item').indexOf('play_btn') !== -1) return;

        //포커스된 컨텐츠 내 i 버튼이 있을경우 i 버튼으로 포커스
        if (focusElement.getAttribute('type') === 'movies' || focusElement.getAttribute('type') === 'tvshows') {
          var item = focusElement.getAttribute('item') + "_play_btn";
          $scope.setFocusItem(item, focusElement.querySelector('[item="' + item + '"]'));
          return;
        }
        item = getItem(column, row + 1);

        if (!item) {
          return; //item이 없을경우 return;
        }
        break;
    }

    if (item) {
      $scope.setFocusItem(item.name, item.element);
    }
  };

  var getItem = function(column, row) {
    var element, item = {};
    element = $element[0].querySelector('[item="'+column+"-"+row+'"]');
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
    if (focusManager.getCurrent().target === 'mainImageAD' ) {
      //2015-10-30 RTL 국가 && 'key == DOWN' && 'target == left' 일때 바로 밑 item 으로 Focus 이동을 하지 않아 추가
      if(device.isRTL){
        if ($element[0].getElementsByClassName('item-main').length > 0) {
          $scope.setFocusItem($element[0].getElementsByClassName('item-main')[0].getAttribute('item'), $element[0].getElementsByClassName('item-main')[0]);
        } else {
          if ($element[0].getElementsByClassName('item-main-apps').length > 0) {
            $scope.setFocusItem($element[0].getElementsByClassName('item-main-apps')[0].getAttribute('item'), $element[0].getElementsByClassName('item-main-apps')[0]);
          }
        }
      } else {
        if ($element[0].querySelectorAll('[item="0-0"]')[0]) {
          $scope.setFocusItem($element[0].querySelectorAll('[item="0-0"]')[0].getAttribute('item'), $element[0].querySelectorAll('[item="0-0"]')[0]);
        }
      }
    } else if (focusManager.getCurrent().target === "banners") {
      var item;
      if(focusManager.getCurrent().target){
        item = focusManager.getCurrent().target;
      }

      if(focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus') &&
        focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value &&
        focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value === "0"){

        var focusEl = $element[0].querySelector('[item="3-0"]') ? $element[0].querySelector('[item="3-0"]') : $element[0].querySelectorAll('[item="0-0"]')[0];
        $scope.setFocusItem(focusEl.getAttribute('item'), focusEl);
      } else if(focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus') &&
        focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value &&
        focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value === "1")

        var focusEl = $element[0].querySelector('[item="4-0"]') ? $element[0].querySelector('[item="4-0"]') : $element[0].querySelectorAll('[item="0-0"]')[0];
      $scope.setFocusItem(focusEl.getAttribute('item'), focusEl);
    } else if (focusManager.getCurrent().target === 'mainAd') {
      var focusEl = $element[0].querySelector('[item="0-0"]') ? $element[0].querySelector('[item="0-0"]') : '';
      $scope.setFocusItem(focusEl.getAttribute('item'), focusEl);
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
  //------------------------- focus 설정 관련 method end -------------------------//

  //------------------------- Audio Guidance 관련 start -------------------------//
  $scope.audioGuidance = function (scope, target, element) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true,
      duplication: false
    };
    var enterSound = '';

    //최초 화면 진입 시 나오는 음성
    if ($rootScope.isNewPage) {
      enterSound = msgLang.title;
      $rootScope.isNewPage = false;
    }

    if (scope.scopeName === 'header') {
      switch (target) {
        case 'mainImageAD' :
          params.text = msgLang.audio_ad_title;
          break;
        case 'banners' :
          var item_id;

          try {
            item_id = scope.getScopeElement()[0].querySelector('.focus').attributes['item-id'].value;
          } catch (e) {
            console.log('★★', e.message);
            item_id = undefined;
          }

          // TODO : promotion 서버 연동규격 확정 시 조건절 부여
          // 포커스 된 프로모션 종류에 따른 발화 분기 처리
          if (item_id) {
            for (var i = 0; i < scope.banners.length; i++) {
              if (item_id === scope.banners[i].id) {
                if (scope.banners[i].title) {
                  params.text = scope.banners[i].title;
                  break;
                } else if (scope.banners[i].name) {
                  switch (scope.banners[i].id) {
                    case 'default_hot':
                      params.text = msgLang.promotion_2017_popular || 'Most Popular Apps';
                      break;
                    case 'default_new':
                      params.text = msgLang.promotion_2017_newly || 'Newly Updated Apps';
                      break;
                    case 'default_all_entertainment':
                      params.text = msgLang.promotion_2017_entertainment || 'Hot Entertainment Apps';
                      break;
                    default :
                      params.text = msgLang.guide_12_desc; //msgLang.guide_11;
                      break;
                  }
                }
              }
            }
          }
          break;
      }
      params.duplication = true;
    } else {
      var contentName = null;
      if (element && element.querySelector('.focus .text')) {
        contentName = element.querySelector('.focus .text').innerText;
      } else if (target.indexOf('_play_btn') > -1) {
        contentName = msgLang.audio_2017_button_info || 'more information';
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
  //------------------------- Audio Guidance 관련 end -------------------------//

  //------------------------- 광고 설정 관련 method start -------------------------//
  /*
   * adManager 광고 response 후 broadcast 로 호출하는 함수
   */
  var displayAD = function(e, response, callbackFn) {
    displayAdFlag = true;
    displayAdStatus = true;
    $rootScope.$broadcast(eventKey.HEADER_ADSPINNER, false);

    /*  [QEVENTSIXT-4537]
    requestContextIndex, requestBannerInfo response 는 array 형태이나
    return false 로 인한 default image digest() 시엔 array 형태가 아니어서 default image 노출이 되지 않음
    */
    if (!response.length) {
      if ((!$scope.adRes.srcUrl)) {
        pmLog.write(pmLog.LOGKEY.AD_LOG_MAIN, {
          position: 'displayAD',
          errorDefault: 'error',
          response: JSON.stringify(response)
        });
        $scope.adRes.srcUrl = './resources/images/thumb/default_ad_1130x290.png';
      }
      //spinner사라지게함.
      $rootScope.spinner.hideSpinner();
      $scope.$digest();
      return;
    }

    //flag 변수 초기화
    $scope.videoAD = false;
    $scope.imageAD = false;

    for (var i = 0; i < response.length; i++) {
      if (response[i].type && response[i].type === 'video') {
        $scope.videoAD = true;
        $scope.adType = 'videoAd';
        $rootScope.mainAd.showAD(response[i]);
      } else {
        $scope.imageAD = true;
        $scope.adType = 'imageAd';
        $scope.adRes = response[i];
        if (($scope.adRes.srcUrl && $scope.adRes.srcUrl.length === 0)) {
          pmLog.write(pmLog.LOGKEY.AD_LOG_MAIN, {
            position: 'displayAD',
            errorDefault: 'error',
            response: JSON.stringify(response[i])
          });
          $scope.adRes.srcUrl = './resources/images/thumb/default_ad_1130x290.png';
        }
      }
      $scope.$digest();
      if (callbackFn) callbackFn();
      $rootScope.spinner.hideSpinner();
    }
  };

  /*
   * webkitshowed event 일때 광고 refresh
   */
  var foregroundHandler = function(e) {
    $rootScope.spinner.showSpinner();
    adManager.call('requestContextIndex', '', $scope.scopeName, adCallback);
  };

  var displayDefaultAD = function(e) {
    displayAdStatus = true;
    device.adStatusByLunaError = false;
    $rootScope.$broadcast(eventKey.HEADER_ADSPINNER, false);
    //if  ($scope.adRes.srcUrl.indexOf('/resources/images/thumb/default_ad_300X250.png') !== -1) {
    pmLog.write(pmLog.LOGKEY.AD_LOG_MAIN, {
      position : 'displayDefaultAD',
      errorDefault : 'error',
      response : JSON.stringify($scope.adRes)
    });

    $scope.adRes.srcUrl = './resources/images/thumb/default_ad_1130x290.png';
    if (document.querySelector('[d-img-type="AD"]')) {
      document.querySelector('[d-img-type="AD"]').setAttribute('src', './resources/images/thumb/default_ad_1130x290.png');
      document.querySelector('[d-img-type="AD"]').setAttribute('ng-src', './resources/images/thumb/default_ad_1130x290.png');
    }
    $scope.$apply();
    //}
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
    if (direction === 'prev') changeItem(direction);
    else changeItem('next'); // undefined(At first), 'next'

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

    var focusObject, type, page, contentId, itemId, itemType, itemCategory, item, inLink, singleContentsType;

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      type = focusElement.getAttribute('type');
      itemId = focusElement.getAttribute('item-id');
      itemType = focusElement.getAttribute('item-type');
      itemCategory = focusElement.getAttribute('category');
      if(focusElement.getAttribute('singleContentsType')){
        type = focusElement.getAttribute('singleContentsType');
        if(type === 'tvshows'){
          itemType = 'TS';
        }else if(type === 'movies'){
          itemType = 'MV';
        }
      }

      if(!$rootScope.isPlayKey) {
        switch (type) {
          case 'tvshows' :
            $rootScope.pmLogValue = pmLog.TYPE.TVSHOWS;
            if (focusElement && focusElement.classList.contains('btn-cp-play')) {
              contentsClick(pmLog.TYPE.TVSHOWS, itemId);
            }
            page = 'detailList';
            item = itemType + '|' + itemId;
            inLink = true;
            break;
          case 'movies' :
            $rootScope.pmLogValue = pmLog.TYPE.MOVIE;
            if (focusElement && focusElement.classList.contains('btn-cp-play')) {
              contentsClick(pmLog.TYPE.MOVIE, itemId);
            }
            page = 'detailList';
            item = itemType + '|' + itemId;
            inLink = true;
            break;
          case 'appsngames' :
          case 'appsngameshot' :
          case 'premium' :
          case 'appsngamesnew' :
            contentsClick(pmLog.TYPE.APPGAME, itemId);
            page = 'detailApp';
            item = itemId;
            inLink = true;
            break;
          /*case 'banners' :
            contentsClick(pmLog.TYPE.THEME, itemId);
            page = 'detailTheme';
            item = itemId;
            break;
          case 'imageAd' :
            if (!device.isOnline) {
              $rootScope.$broadcast(eventKey.NETWORK_ERROR);
              return;
            }
            // default image일 때는 클릭 안함
            if ($scope.adRes.srcUrl.indexOf('./resources/images/thumb/default_ad_300X250.png') ===  -1 ) {
              var params = {
                contextIndex: focusElement.getAttribute('adcontextindex'),
                assetId : focusElement.getAttribute('assetId')
              };
              pmLog.write(pmLog.LOGKEY.AD_CLICK, {
                menu_name : pmLog.TYPE.MAIN,
                ad_id : params.assetId
              });
              if (params.contextIndex && params.assetId) {
                $rootScope.isADClick = true;
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
            break;*/
        }
      }
      // FC대응 btn-cp-play css 값이 있어 임시로 cp-play class로 대체(content 영역 클릭시 해당 cp로 이동)
      // btn-cp-play
      if (focusElement && focusElement.classList.contains('cp-play')) {
        pmLog.write(pmLog.LOGKEY.CONTENTS_PLAY_CLICK, {
          menu_name : 'Main',
          contents_id : focusElement.getAttribute('item-id'),
          contents_category : focusElement.getAttribute('type')
        });
        var itemId = focusElement.getAttribute('item-id');
        device.onnowLogging = 'FEATURED';
        watchProcess.execProcess($scope.$id, item, itemId, 'Main', focusElement.getAttribute('type'), 'exec_full');
        return;
      } else if($rootScope.isPlayKey && (type === 'tvshows' || type === 'movies') ) {
        $rootScope.isPlayKey = false;
        device.onnowLogging = 'FEATURED';
        watchProcess.execProcess($scope.$id, item, itemId, 'Main', focusElement.parentElement.getAttribute('type'), 'exec_full');
        return;
      } else {
        $rootScope.isPlayKey = false;
      }

      if (page && page.length > 0) {
        if (page === 'detailList') {
          device.onnowLogging = 'FEATURED';
        }
        if(page === 'detailTheme'){
          //pomotion banner 해당 카테고리 코드
          $rootScope.selectedMenuCode = itemCategory;
          $rootScope.draw({page: 'listApp', module: device.appsngamesModule});
        } else {
          $rootScope.draw({page: page, module: item, inLink: inLink, source: 'com.webos.app.discovery.featured'});
        }
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
            if (device.isDeepLink) {
              // deepLink 시에는 guide Opened 상관없이 표출 안하기때문에 항상 defaultFocus 해야함.
              $scope.setDefaultFocus();
            } else if ($rootScope.guide.isViewGuide) {
              // guide가 표시된 경우는 제외.
            } else {
              $scope.setDefaultFocus();
            }
          }, 300);

          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, undefined, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $rootScope.breadcrumb.showBreadCrumbs(false);
            $scope.showing = true;
            $rootScope.header.hideImage = false;
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

    $rootScope.header.hideImage = true;
    // [WOSLQEVENT-116362] 광고가 늦게 사라져서 페이지 이동 시 잔상이 남는 현상
    $rootScope.mainAd.hideAD();

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      // $timeout(function() {
      $element.remove();
      $scope.$destroy();
      // }, timeOutValue.DESTROYING);
    });
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
    // My Contents – LG Store 연관 컨텐츠 연동 ("query":"category/FEATURED/itemId/itemType(TS|MS)")
    if (device.param.mycontent) {
      var params = {
        api: '/discovery2016/featured_mycontent',
        method: 'post',
        apiAppStoreVersion: 'v8.0',
        tierType: device.tierType,
        payload : {
          item_id : device.param.mycontent.itemId,
          item_type : device.param.mycontent.itemType
        }
      };
    } else {
      var params = {
        api: '/discovery2016/featured',
        method: 'post',
        apiAppStoreVersion: 'v8.0',
        tierType: device.tierType
      };
    }
    server.requestApi(eventKey.DISCOVERY_LOADED, params, destroyInfo);
    delete device.param.mycontent;
  };

  var initialize = function() {
    device.startTime = new Date().getTime();
    if (device.featuredMainData) { // at the first
      $timeout(function(){
        var e = {preventDefault:function(){}};
        globalResponse = device.featuredMainData;
        globalResponse.headerItemId = device.param.module;
        drawMain(e, globalResponse);
        //data test 용
        /*$http.get('../../tv/resources/assets/responseTest.json')
         .success(function(data) {
         data.headerItemId = device.param.module;
         drawMain(e, data);
         });*/
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

    /* 1. 가이드 존재, 공지사항 존재
     * 2. 가이드 존재 안함. 공지사항 존재
     * 3. 가이드 존재, 공지사항 존재 않함
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

    /*
     최초 deepLink 앱 상세 진입 후 메인 페이지 진입 시 guide 화면 표출 되야 하므로
     isDeepLink = false; 처리
     */
    if (device.isDeepLink && (device.previousPage === 'detailApp')) {
      device.isDeepLink = false;
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