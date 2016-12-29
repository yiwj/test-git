app.directive('header', function() {
  return {
    restrict: 'A',
    scope: true,
    replace: true,
    controller: 'headerController',
    //templateUrl: './resources/html/header.html',
    template: headerTmpl,
    link: function($scope, $element) {
      var obj;
      obj = $element[0].getElementsByClassName('thumb-img')[0];
      obj.addEventListener('load', $scope.getHeaderHandler('load'));
      obj.addEventListener('error', $scope.getHeaderHandler('error'));
    }
  };
});

app.directive('bannerImageHandler', function(pmLog, $log) {
  return {
    link: function($scope, $element) {
      $element.bind('load', function(e) {
        var img_resize = function() {
          var parentH, parentW;
          parentH = $element[0].parentElement.parentElement.clientHeight;
          parentW = $element[0].parentElement.parentElement.clientWidth;

          $element[0].style.width = parentW + 'px';
          $element[0].style.height = parentH + 'px';
          $element[0].style.display = 'block';
        };

        if(this.parentElement.clientHeight === 0) {
          //console.log('parent element size none!!! reload img resize..');
          setTimeout(img_resize, 10);
        }else{
          img_resize();
        }
      });
    }
  };
});

app.controller('headerController', function($scope, $controller, $rootScope, $element, $timeout, util, device, headers, focusManager, keyHandler, marquee, pmLog, audioGuidance, adManager) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var timer = null;
  var focusElement = null;
  var zoomRatio = device.isHD ? 0.667 : 1;

  $scope.scopeName = 'header';
  $scope.tierType = device.tierType;
  $scope.title = '';
  $scope.more = '';
  $scope.focusInMore = false;
  $scope.focusInRight = false;
  $scope.focusInLeft = false;
  $scope.rollingInterval = 5;
  $scope.index = -1;
  $scope.length = 0;
  $scope.current = {
    style: {display: 'none'},
    src: '',
    genre: '',
    name: '',
    desc: ''
  };
  $scope.maskHiding = false;
  $scope.maskStyle = {display: 'none'};
  $scope.hideImage = true;
  $scope.webkitHidden = false;
  $scope.rollingDirection = true; // right rolling
  $scope.maskBlock = false;
  $scope.banners = [];
  $scope.adSpinner = false;

  var destroy = function() {
    $timeout.cancel(timer);
  };

  var drawHeader = function(e, banners) {
    e.preventDefault();
    $scope.isAd = device.adProvider;
    $scope.banners = banners;

    // [QEVENTSIXT-17304] 시점체크를 위한 로깅
    pmLog.write(pmLog.LOGKEY.ISAD_CHECK, {
      key : 'headerAD',
      isAd : $scope.isAd
    });
    try {
      $scope.rollingInterval = $scope.discoveryData.headRollingInterval;

      // remove 3d
      $scope.discoveryData.headList = $scope.discoveryData.headList.filter(function (el) {
        return (el.category !== '3d');
      });

      if ($scope.tierType === 2) {
        // remove tvshows, movies
        $scope.discoveryData.headList = $scope.discoveryData.headList.filter(function (el) {
          return (el.category !== 'tvshows' && el.category !== 'movies');
        });
      }

      // [WOSLQEVENT-97333] [SDPService.LGStore_LG Store.Search] [Always] [Minor] "Unavailable Content" 팝업 발생
      // id가 없는 데이터는 삭제하도록
      $scope.discoveryData.headList = $scope.discoveryData.headList.filter(function (el) {
        return el.id;
      });

      /*
       * mycontents 에서 header에 노출되는 컨텐츠와 동일한 컨텐츠를 클릭해서 store 진입 시
       * 해당 컨텐츠를 최상위에 노출
       */
      var changeOrder = function (position) {
        if (position === 0) return;
        var obj = $scope.discoveryData.headList[position];
        $scope.discoveryData.headList.splice(position, 1);
        $scope.discoveryData.headList.unshift(obj);
      };

      if (device.param.headerItemId) {
        for(var i in $scope.discoveryData.headList) {
          if ($scope.discoveryData.headList[i].id === device.param.headerItemId) {
            changeOrder(i);
          }
        }
      } else {
        var headLength = $scope.discoveryData.headList.length;
        var randNum = Math.floor((Math.random() * headLength) + 0); // return a random number between 0 and (headLength-1).
        changeOrder(randNum);
      }

      $scope.length = $scope.discoveryData.headList.length;
    } catch (e) {}

    $scope.title = msgLang.title;
    //if(device.tierType == 3) $scope.title = msgLang.premium;

    if ($scope.length > 0) {
      $scope.more = msgLang.more;

      $scope.current.style.display = null;
      changeImage();

      if ($scope.length > 1) {
        //timer = setTimeout(startMasking, $scope.rollingInterval * 1000);
      }
    }

    // WOSLQEVENT-100076 RTL모드 설정 후 특수문자 출력 제대로 되지 않음.
    // header영역에서 text 클래스가 없어 적용이 안되어 문제발생
    // header영역에서 header-item index로  element를 접근하여 text내용이 영어인 경우 dir-lir 클래스를 추가 하도록 함
    if (device.isRTL) {
      var textTagAry = undefined;
      textTagAry = document.querySelectorAll('.header-item div');
      if (textTagAry.length !== 0) {
        for (var k=0;k<textTagAry.length;k++) {
          var target = textTagAry[k];
          var englishOnly = false;
          if (target.textContent !== ''){
            englishOnly = !util.rtlPattern(target.textContent);
          }
          if (englishOnly) {
            target.classList.add('dir-ltr');
          }
        }
      }
    }

    //directive 의 link 속성에 넣으면 banners 가 draw 되기 이전에 setMouseEvent 를 등록하게됨
    //하여 header draw 한 후에 setMouseEvent 등록하도록 이동
    var obj, arr, l, i;
    arr = $element[0].querySelectorAll('.main-header .item');
    l = arr.length;
    for (i = 0; i < l; i++) {
      obj = arr[i];
      $scope.setMouseEvent(obj);
      obj.removeAttribute('ng-class');
      obj.removeAttribute('ng-repeat');
    }

    $scope.$apply();
  };

  var getDescription = function(obj) {
    var price;
    if (obj.description) return obj.description;

    if (obj.price) {
      price = parseInt(obj.price.replace(/[^0-9.,]/g, ''));
    }

    if (isNaN(price) || price == 0) {
      price = msgLang.free;
    } else {
      price = obj.price;
    }

    if (obj.genreName) {
      return obj.genreName + ' | ' + price;
    } else {
      return price;
    }
  };
  var drawErorrMainHeader = function(){
    $scope.title = msgLang.title;
    $scope.$apply();
  };

  var startMasking = function(direction) {
//    $scope.maskStyle.display = 'block';
    $scope.maskBlock = true;
    $scope.$apply();

    timer = $timeout(function(){
      startHiding(direction);
    }, 1);
  };

  var endMasking = function() {
    $scope.maskBlock = false;
//    $scope.maskStyle.display = 'none';
    // WOSLQEVENT-100076 RTL모드 설정 후 특수문자 출력 제대로 되지 않음.
    // header영역에서 text 클래스가 없어 적용이 안되어 문제발생
    // header영역에서 수동으로 rolling 할 때 text 내용이 '영어 ->rtl' 또는 'rtl ->영어' 로 바뀌는 경우 dir-ltr 클래스를 추가하거나 제거 하기위해 사용
    if (device.isRTL) {
      var textTagAry = undefined;
      textTagAry = document.querySelectorAll('.header-item div');
      if (textTagAry.length !== 0) {
        for (var k=0;k<textTagAry.length;k++) {
          var target = textTagAry[k];
          var englishOnly = false;
          if (target.textContent !== ''){
            englishOnly = !util.rtlPattern(target.textContent);
          }
          if (englishOnly) {
            target.classList.add('dir-ltr');
          }else{
            target.classList.remove('dir-ltr');
          }
        }
      }
    }

    $scope.$apply();
    //timer = setTimeout(startMasking, $scope.rollingInterval * 1000);
  };

  var startHiding = function(direction) {
    $scope.maskHiding = true;
//    $scope.maskStyle['background-color'] = 'rgba(0, 0, 0, 1)';
    $scope.$apply();

    timer = $timeout(function(){
      handleTransition(direction);
    }, 350);
  };

  var startShowing = function() {
    $scope.maskHiding = false;
//    $scope.maskStyle['background-color'] = 'rgba(0, 0, 0, 0)';
    $scope.$apply();

    timer = $timeout(handleTransition, 350);
  };

  var changeImage = function(direction) {
    var obj, category;

    if($scope.rollingDirection){
      $scope.index = ($scope.index + 1) % $scope.length;
    }else{
      if($scope.index == 0){
        $scope.index = $scope.length -1;
      }else{
        $scope.index = $scope.index - 1;
      }
    }
    obj = $scope.discoveryData.headList[$scope.index];
    $scope.current.src = obj.image;
    $scope.current.genre = obj.categoryText;
    $scope.current.name = obj.title;
    //[WEBOSDEFEC-13601] headmanual이면 무조건 Description 보이게 수정
    $scope.current.desc = getDescription(obj);
    $scope.current.category = obj.category;
    $scope.current.id = obj.id;
    if (obj.category === 'headmanual') {
      $scope.current.singleContent = obj.singleContent;
      if($scope.current.singleContent === 'Y'){
        $scope.current.conts_type = obj.conts_type;
      }
    }
    $scope.$apply();

    if (direction) headerAudioGuidance(obj.title, direction);

    //for test
//    if($scope.current.category === 'tvshows') {
//      obj.bgHexCode = '#394950';
//    } else if($scope.current.category === 'movies') {
//      obj.bgHexCode = '#143940';
//    } else if($scope.current.category === 'premium') {
//      obj.bgHexCode = '#402A13';
//    } else if($scope.current.category === 'appsngames') {
//      obj.bgHexCode = '#253851';
//    }


    if(obj.bgHexCode) {
      document.getElementsByClassName('main-body')[0].style.backgroundColor = obj.bgHexCode;
      document.querySelector('.main-header .header-banner').style.background = obj.bgHexCode;
      document.querySelector('.main-header .header-banner').style.opacity = 0.6;
    }else{
      document.getElementsByClassName('main-body')[0].style.backgroundColor = '';
    }

    if ($scope.current.category) {
      category = $scope.current.category.toLowerCase();
      if (category === 'tvshows') {
        category = pmLog.TYPE.TVSHOWS;
      } else if (category === 'movies') {
        category = pmLog.TYPE.MOVIE;
      } else if (category === 'premium') {
        category = pmLog.TYPE.PREMIUM;
      } else if (category === 'appsngames') {
        cateory = pmLog.TYPE.APPGAME;
      } // TODO theme 데이터 category 확인 후 추가
    }

    if (!device.adProvider) {
      pmLog.write(pmLog.LOGKEY.IMAGE_HEADER_IMPRESSION, {
        contents_id : $scope.current.id,
        contents_category : (category && category.trim() === 'headmanual' ? pmLog.TYPE.PROMOTION : category)
      });
    }
  };

  var showImage = function() {
    // 애니메이션 이슈로 $rootScope.header로 각 mainTier에서 show|hide
//    $scope.hideImage = false;
//    $scope.$apply();
  };

  var hideImage = function() {
    $scope.hideImage = true;
    $scope.$apply();
  };

  var stopAnimation = function(e) {
    e.preventDefault();
    $timeout.cancel(timer);
    $scope.webkitHidden = true;
    $scope.hideImage = false;
    $scope.maskHiding = false;
//    $scope.maskStyle['background-color'] = 'rgba(0, 0, 0, 0)';
  };

  var startAnimation = function(e) {
    e.preventDefault();
    $timeout.cancel(timer);
    $scope.webkitHidden = false;
//    $scope.maskStyle.display = 'none';
    $scope.$apply();
    if ($scope.length > 1) {
      //timer = setTimeout(startMasking, $scope.rollingInterval * 1000);
    }
  };

  //mainAD Spinner 처리
  var mainAdSpinner = function(e, flag) {
    $scope.adSpinner = flag;
    // 메인 광고 Spinner에 따른 화면 처리
    if($scope.adSpinner) {
      if(document.querySelector('.item-main-banner .item-thumb')) {
        document.querySelector('.item-main-banner').classList.remove('blank');
        document.querySelector('.item-main-banner .item-thumb').style.display = 'none';
      }
    } else {
      if (document.querySelector('.item-main-banner .item-thumb')) {
      document.querySelector('.item-main-banner').classList.add('blank');
      document.querySelector('.item-main-banner .item-thumb').style.display = 'block';
      }
    }
    $scope.$apply();
  };

  $scope.setFocusItem = function(item, element) {
    $scope.focusItem = item;
    if (focusElement) {
      focusElement.classList.remove('focus');
    }
    focusElement = element;
//    if (focusElement) {
//      focusElement.classList.add('focus');
//    }

    var focusElItem = focusElement ? focusElement.getAttribute('item') : '';
    if (item) {
      //focusElement 의 item attribute가 parameter의 item과 다를경우 item으로 focusElement query
      if (focusElItem !== item) {
        focusElement = document.querySelectorAll('[item="'+item+'"]')[0];
      }
      focusElement.classList.add('focus');
      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
      focusManager.setCurrent($scope, item);
      /*if (item === 'more') $scope.focusInMore = true;
      if (item === 'right') $scope.focusInRight = true;
      if (item === 'left') $scope.focusInLeft = true;*/
    } else {
      /*$scope.focusInMore = false;
      $scope.focusInRight = false;
      $scope.focusInLeft = false;*/
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }
    $scope.$apply();
  };

  //header 부분 audioGuidance 는 mainTier 에서 관리 하므로 따로 function 제작하여 처리
  var headerAudioGuidance = function(title, direction){
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };

    params.text = title;

    switch (direction){
      case 'left':
        params.text += '. ';
        params.text += msgLang.audio_header_button_left;
        params.text += '. ';
        params.text += msgLang.audio_button_button;
        break;

      case 'right':
        params.text += '. ';
        params.text += msgLang.audio_header_button_right;
        params.text += '. ';
        params.text += msgLang.audio_button_button;
        break;

      default :
        break;
    }

    audioGuidance.call(params);
  };

  $scope.executeAction = function() {
    var i, j, l, arr, filer, focusObject, target, head, itemCategory;

    if ($scope.$parent.expand) return;

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (focusElement.getAttribute('category')) {
        itemCategory = focusElement.getAttribute('category');
      }
      var page = '', item_id = '';
      if (target == 'more') {

      } else if ((target == 'right' || target == 'left') && !$scope.maskHiding) {
        if (target == 'right') {
          $scope.rollingDirection = true;
          pmLog.write(pmLog.LOGKEY.IMAGE_HEADER_NAVI_CLICK, {
            direction : 'right'
          });
        } else {
          $scope.rollingDirection = false;
          pmLog.write(pmLog.LOGKEY.IMAGE_HEADER_NAVI_CLICK, {
            direction : 'left'
          });
        }
        destroy();
        startMasking(target);
      } else if (target === 'banners'){
        $rootScope.selectedMenuCode = itemCategory;

        //엔터테이먼트 일경우 하위 카테고리 flag 변수를 통해 설정
        if (itemCategory === '5') {
          device.isEntertainment = true;
        }

        $rootScope.draw({page: 'listApp', module: device.appsngamesModule});
      } else if (target === 'mainImageAD'){
        if(!$scope.isAd){
          switch ($scope.current.category) {
            case 'tvshows' :
              device.onnowLogging = 'FEATURED|' + $scope.current.id;
              contentClickLog($scope.current.id, pmLog.TYPE.TVSHOWS);
              page = "detailList";
              item_id = 'TS' + '|' + $scope.current.id;
              break;
            case 'movies' :
              device.onnowLogging = 'FEATURED|' + $scope.current.id;
              contentClickLog($scope.current.id, pmLog.TYPE.MOVIE);
              page = "detailList";
              item_id = 'MV' + '|' + $scope.current.id;
              device.onnowLogging = 'FEATURED|' + $scope.current.id;
              break;
            case 'premium' :
              contentClickLog($scope.current.id, pmLog.TYPE.PREMIUM);
              page = 'detailApp'; //page = 'premiumDetail';
              item_id = $scope.current.id;
              break;
            case 'appsngames' :
              contentClickLog($scope.current.id, pmLog.TYPE.APPGAME);
              page = 'detailApp';
              item_id = $scope.current.id;
              break;
            case 'headmanual' :
              contentClickLog($scope.current.id, pmLog.TYPE.PROMOTION);
              if ($scope.current.singleContent === 'N') {
                page = 'detailTheme';
                item_id = $scope.current.id;
                head = ($scope.current.singleContent === 'Y' ? 'N' : 'Y');
              } else if ($scope.current.singleContent === 'Y') {
                switch ($scope.current.conts_type) {
                  case 'tvshows' :
                    //contentClickLog($scope.current.id, pmLog.TYPE.TVSHOWS);
                    page = "detailList";
                    item_id = 'TS' + '|' + $scope.current.id;
                    break;
                  case 'movies' :
                    //contentClickLog($scope.current.id, pmLog.TYPE.MOVIE);
                    page = "detailList";
                    item_id = 'MV' + '|' + $scope.current.id;
                    break;
                  case 'premium' :
                    //contentClickLog($scope.current.id, pmLog.TYPE.PREMIUM);
                    page = 'detailApp'; //page = 'premiumDetail';
                    item_id = $scope.current.id;
                    break;
                  case 'appsngames' :
                    //contentClickLog($scope.current.id, pmLog.TYPE.APPGAME);
                    page = 'detailApp';
                    item_id = $scope.current.id;
                    break;
                }
                break;
              }
          }
          $rootScope.draw({
            page: page,
            module: item_id,
            inLink: true,
            head : head
          });
          return;
        }

        if (!device.isOnline) {
          $rootScope.$broadcast(eventKey.NETWORK_ERROR);
          return;
        }
        // default image일 때는 클릭 안함
        if ($scope.adRes.srcUrl.indexOf('./resources/images/thumb/default_ad_1130x290.png') ===  -1 ) {
          var params = {
            contextIndex: focusElement.getAttribute('adcontextindex'),
            assetId : focusElement.getAttribute('assetId')
          };

          pmLog.write(pmLog.LOGKEY.AD_CLICK, {
            menu_name : pmLog.TYPE.MAIN,
            ad_id : params.assetId,
            type : $rootScope.mainAd.videoAD && $rootScope.mainAd.imageAD ? 'companion' : 'banner_only'
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
      }
    }
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
    if(device.param && device.param.scope === 'header') {
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

  var contentClickLog = function(id, category) {
    pmLog.write(pmLog.LOGKEY.IMAGE_HEADER_MORE_CLICK, {
      contents_id : id,
      contents_category : category
    });
  };

  var handleTransition = function(direction) {
    if ($scope.webkitHidden) return;
    if ($scope.maskHiding) {
      changeImage(direction);
      timer = $timeout(startShowing, 100);
    } else {
      timer = $timeout(endMasking, 1);
    }
  };

  $scope.getHeaderHandler = function(type) {
    if (type == 'load') {
      return showImage;
    } else if (type == 'error') {
      return hideImage;
    }
  };

  $scope.removeFocus = function(target) {
/*    if ( (target == 'more' && $scope.focusInMore) ||
      (target == 'right' && $scope.focusInRight) ||
      (target == 'left' && $scope.focusInLeft) ){
      $scope.focusInMore = false;
      $scope.focusInRight = false;
      $scope.focusInLeft = false;
      $scope.$apply();
    }*/
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
    }
  };

  $scope.moveFocusByKey = function(keyCode, rectan) {
    var rect;

    if ($element[0].querySelectorAll('.focus').length === 0) {
      if (!focusManager.getCurrent().scope) {
        if ($rootScope.mainAd.show) {
          $rootScope.$broadcast('focus', 'mainAd');
        } else {
          $scope.setFocusItem('mainImageAD', $element[0].querySelector('.item-main-banner'));
        }
        return;
      }

      if (focusManager.getCurrent().scope.scopeName == 'menu') {
        $rootScope.$broadcast('focus', 'mainAd');
      } else if (focusManager.getCurrent().scope.scopeName == 'featured') {
        if (device.isRTL){
          if (rectan) {
            moveFocusToNearest(rectan); // 메인광고, promotion
            if (rectan.x > parseInt(700 * zoomRatio)) {
              moveFocusByAdSpinner(keyCode, 'featured');  //광고 Spinner 활성화 시 main 영역에서 draw 영역으로 점프
            }
          } else {
            if ($rootScope.mainAd.show) {
              $rootScope.$broadcast('focus', 'mainAd');
            } else {
              $scope.setFocusItem('mainImageAD', $element[0].querySelector('.item-main-banner'));
            }
          }
        } else {
          if (rectan) {
            moveFocusToNearest(rectan); // 메인광고, promotion
            if (rectan.x < parseInt(1000 * zoomRatio)) {
              moveFocusByAdSpinner(keyCode, 'featured');  //광고 Spinner 활성화 시 main 영역에서 draw 영역으로 점프
            }
          } else {
            if ($rootScope.mainAd.show) {
              $rootScope.$broadcast('focus', 'mainAd');
            } else {
              $scope.setFocusItem('mainImageAD', $element[0].querySelector('.item-main-banner'));
            }
          }
        }
      } else if (focusManager.getCurrent().scope.scopeName == 'mainAd') {
        if (device.isRTL && keyCode === keyHandler.RIGHT) {
          var focusEl = $element[0].querySelectorAll('[item="banners"]') ? $element[0].querySelectorAll('[item="banners"]')[0] : $element[0].querySelectorAll('[item="mainImageAD"]')[0];
          $scope.setFocusItem('banners', focusEl);
        }else{
          $scope.setFocusItem('mainImageAD', $element[0].querySelector('.item-main-banner'));
        }
      } else {
        moveFocusToNearest(rectan); // 메인광고, promotion
        if (rectan.x < parseInt(1000 * zoomRatio)) {
          moveFocusByAdSpinner(keyCode, 'drawer');  //광고 Spinner 활성화 시 draw 영역에서 main 영역으로 점프
        }
      }
      return;
    }

    if (keyCode == keyHandler.UP) {
      if (device.tierType === 3) {
        if (focusElement.getAttribute('item') && (focusElement.getAttribute('item') === 'right' || focusElement.getAttribute('item') === 'left' || focusElement.getAttribute('item') === 'more')) {
          if (focusElement){
            rect = {
              x: focusElement.offsetLeft,
              y: focusElement.offsetTop,
              width: focusElement.offsetWidth,
              height: focusElement.offsetHeight
            };
          }
          $rootScope.$broadcast('focus', 'drawer', keyCode, rect);
        } else {
          moveFocusToNearest(rectan); // left, more, right
        }
        return;
      }
      if (focusElement !== null && focusElement.getAttribute('item')
          && focusElement.getAttribute('item') === 'banners') {
        // [QEVENTSIXT-4413] 근접한 곳으로 이동하게 처리
        if (device.isRTL) {
          if (focusElement.getAttribute('idx') && focusElement.getAttribute('idx') === "1") {
            rect = {x : parseInt(0 * zoomRatio), y : parseInt(300 * zoomRatio)};
          } else {
            rect = {x: parseInt(700 * zoomRatio), y: parseInt(300 * zoomRatio)};
          }
        } else {
          if (focusElement.getAttribute('idx') && focusElement.getAttribute('idx') === "1") {
            rect = {x : parseInt(2000 * zoomRatio), y : parseInt(300 * zoomRatio)};
          } else {
            rect = {x: parseInt(1200 * zoomRatio), y: parseInt(300 * zoomRatio)};
          }
        }
      } else {
        if (device.isRTL) {
          if (focusElement){
            rect = {x : parseInt(2000 * zoomRatio), y : parseInt(300 * zoomRatio)};
          } else {
            rect = {x : parseInt(1000 * zoomRatio), y : parseInt(300 * zoomRatio)};
          }
        } else {
          if (focusElement){
            rect = {
              x: focusElement.offsetLeft,
              y: focusElement.offsetTop,
              width: focusElement.offsetWidth,
              height: focusElement.offsetHeight
            };
          } else {
            rect = {x : parseInt(1000 * zoomRatio), y : parseInt(300 * zoomRatio)};
          }
        }
      }
      $rootScope.$broadcast('focus', 'drawer', keyCode, rect);
    } else if (keyCode == keyHandler.DOWN) {
      rect = {x: 0, y: 0, width: 0, height: 0};
      $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
      /*if(focusManager.getCurrent().target == "mainAD"){
        $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
      } else { // more, right
        $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
      }*/
    } else if (keyCode == keyHandler.LEFT) {
      if (focusManager.getCurrent().target == 'mainImageAD') {
        $rootScope.$broadcast('focus', 'mainAd');
      } else if (focusManager.getCurrent().target == 'banners') {
        if (focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus') &&
          focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value &&
          focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value === "0") {
          if (device.isRTL && $rootScope.mainAd && $rootScope.mainAd.show) {
            $rootScope.$broadcast('focus', 'mainAd');
          } else {
            if (!$scope.adSpinner) {  // 광고 Spinner 동작 시 광고 영역으로 이동 불가
              var focusEl = $element[0].querySelector('[item="mainImageAD"]') ? $element[0].querySelector('[item="mainImageAD"]') : '';
              $scope.setFocusItem('mainImageAD', focusEl);
            }
          }
        } else if (focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus') &&
          focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value &&
          focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value === "1") {

          var focusEl = $element[0].querySelectorAll('[item="banners"]') ? $element[0].querySelectorAll('[item="banners"]')[0] : $element[0].querySelectorAll('[item="mainImageAD"]')[0];
          $scope.setFocusItem('banners', focusEl);
        }
      }
    } else if (keyCode == keyHandler.RIGHT) {
      if (focusManager.getCurrent().target == 'mainImageAD') {
        if (device.isRTL && $scope.videoAD) {
          $rootScope.$broadcast('focus', 'mainAd');
        } else {
          var focusEl = $element[0].querySelectorAll('[item="banners"]') ? $element[0].querySelectorAll('[item="banners"]')[0] : $element[0].querySelectorAll('[item="mainImageAD"]')[0];
          $scope.setFocusItem('banners', focusEl);
        }
      } else if (focusManager.getCurrent().target == 'banners') {
        if (focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus') &&
          focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value &&
          focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value === "0") {

          var focusEl = $element[0].querySelectorAll('[item="banners"]') ? $element[0].querySelectorAll('[item="banners"]')[1] : '';
          $scope.setFocusItem('banners', focusEl);
        } else if (focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus') &&
          focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value &&
          focusManager.getCurrent().scope.getScopeElement()[0].querySelector('.focus').attributes.idx.value === "1") {

          return;
        }
      }
    }
  };

  var moveFocusToNearest = function(rectan) {
    if (device.isRTL){
      if (rectan.x > parseInt(700 * zoomRatio)) {
        //광고 포커스
        if ($rootScope.mainAd.show) {
          $rootScope.$broadcast('focus', 'mainAd');
        } else {
          $scope.setFocusItem('mainImageAD', $element[0].querySelector('.item-main-banner'));
        }
      } else if (rectan.x < parseInt(390 * zoomRatio)) {
        //Promotion(좌) 포커스
        $scope.setFocusItem('banners', $element[0].querySelector('[type="banners"][idx="1"]'));
      } else {
        //Promotion(우) 포커스
        $scope.setFocusItem('banners', $element[0].querySelector('[type="banners"][idx="0"]'));
      }
    } else {
      if (rectan.x < parseInt(1000 * zoomRatio)) {
        //광고 포커스
        if ($rootScope.mainAd.show) {
          $rootScope.$broadcast('focus', 'mainAd');
        } else {
          $scope.setFocusItem('mainImageAD', $element[0].querySelector('.item-main-banner'));
        }
      } else if (rectan.x > parseInt(1500 * zoomRatio)) {
        //Promotion(좌) 포커스
        $scope.setFocusItem('banners', $element[0].querySelector('[type="banners"][idx="1"]'));
      } else {
        //Promotion(우) 포커스
        $scope.setFocusItem('banners', $element[0].querySelector('[type="banners"][idx="0"]'));
      }
    }

  };

  var moveFocusByAdSpinner = function(keyCode, location) {  //광고 Spinner에 의한 Focus 제어
    if(!$scope.adSpinner) {
      return;
    } else if(location === 'featured') {
      var rect = {
        x: focusElement.offsetLeft,
        y: focusElement.offsetTop,
        width: focusElement.offsetWidth,
        height: focusElement.offsetHeight
      };
      $rootScope.$broadcast('focus', 'drawer', keyCode, rect);
    } else if (location === 'drawer') {
      rect = {x: 0, y: 0, width: 0, height: 0};
      $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
    } else {
      return;
    }
  };

  var focusHandler = function(e, target, keyCode, rect) {
    if (target != $scope.scopeName) return;
    e.preventDefault();

    $scope.moveFocusByKey(keyCode, rect);
  };

  var initialize = function() {
    $rootScope.header = $scope;
    $scope.$on('$destroy', destroy);
    $scope.$on('draw', drawHeader);
    $scope.$on('drawErorrMainHeader', drawErorrMainHeader);
    $scope.$on('focus', focusHandler);
    $scope.$on('webkitHidden', stopAnimation);
    $scope.$on('webkitShowed', startAnimation);
    $scope.$on('mainAdSpinner', mainAdSpinner);
  };

  initialize();
});
