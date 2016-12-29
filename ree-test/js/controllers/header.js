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
      $scope.setMouseEvent($element[0].getElementsByClassName('btn-small')[0]);
      $scope.setMouseEvent($element[0].getElementsByClassName('btn-main-prev')[0]);
      $scope.setMouseEvent($element[0].getElementsByClassName('btn-main-next')[0]);
      obj = $element[0].getElementsByClassName('thumb-img')[0];
      obj.addEventListener('load', $scope.getHeaderHandler('load'));
      obj.addEventListener('error', $scope.getHeaderHandler('error'));
    }
  };
});

app.controller('headerController', function($scope, $controller, $rootScope, $element, $timeout, util, device, headers, focusManager, keyHandler, marquee, pmLog, audioGuidance) {
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
    desc: '',
    headLink: ''
  };
  $scope.maskHiding = false;
  $scope.maskStyle = {display: 'none'};
  $scope.hideImage = true;
  $scope.webkitHidden = false;
  $scope.rollingDirection = true; // right rolling
  $scope.maskBlock = false;

  var destroy = function() {
    $timeout.cancel(timer);
  };

  var drawHeader = function(e) {
    e.preventDefault();

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
        $scope.current.headLink = obj.headLink;
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

    pmLog.write(pmLog.LOGKEY.IMAGE_HEADER_IMPRESSION, {
      contents_id : (category && category.trim() === 'headmanual' ? $scope.current.headLink : $scope.current.id),
      contents_category : (category && category.trim() === 'headmanual' ? pmLog.TYPE.PROMOTION : category)
    });
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
      if (item === 'more') $scope.focusInMore = true;
      if (item === 'right') $scope.focusInRight = true;
      if (item === 'left') $scope.focusInLeft = true;
    } else {
      $scope.focusInMore = false;
      $scope.focusInRight = false;
      $scope.focusInLeft = false;
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }
//    if (item == 'more') {
//      $scope.focusInMore = true;
//      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
//      focusManager.setCurrent($scope, item);
//    } else if (item == 'right') {
//      $scope.focusInRight = true;
//      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
//      focusManager.setCurrent($scope, item);
//    } else if (item == 'left') {
//      $scope.focusInLeft = true;
//      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
//      focusManager.setCurrent($scope, item);
//    } else {
//      $scope.focusInMore = false;
//      $scope.focusInRight = false;
//      $scope.focusInLeft = false;
//      marquee.setTarget(null);
//      focusManager.setCurrent($scope, '');
//    }
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
    var i, j, l, arr, filer, focusObject, target, head;

    if ($scope.$parent.expand) return;

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      var page = '', item_id = '';
      if (target == 'more') {
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
            if ($scope.current.singleContent === 'N') {
              contentClickLog($scope.current.id, pmLog.TYPE.PROMOTION);
              page = 'detailTheme';
              item_id = $scope.current.id;
              head = ($scope.current.singleContent === 'Y' ? 'N' : 'Y');
            } else if ($scope.current.singleContent === 'Y') {
              contentClickLog($scope.current.headLink, pmLog.TYPE.PROMOTION);
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
    if ( (target == 'more' && $scope.focusInMore) ||
      (target == 'right' && $scope.focusInRight) ||
      (target == 'left' && $scope.focusInLeft) ){
      $scope.focusInMore = false;
      $scope.focusInRight = false;
      $scope.focusInLeft = false;
      $scope.$apply();
    }
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
    }
  };

  $scope.moveFocusByKey = function(keyCode, rectan) {
    var rect;
    /**[WOSLQEVENT-78682] Header 영역 RTL 국가 일때 IR 좌우키 반대로 동작.
     * keyHandler에서 RTL국가일때 좌우 키코드를 변경 하여 처리
     * Header 영역을 제외한 곳은 문제 없으나
     * Header 부분은 좌우 키코드 변경에 대한 처리가 없음*/
    if (device.isRTL) {
      switch(keyCode) {
        case keyHandler.LEFT:
          keyCode = keyHandler.RIGHT;
          break;
        case keyHandler.RIGHT:
          keyCode = keyHandler.LEFT;
          break;
      }
    }

    if ($scope.focusInMore == false
      && $scope.focusInRight== false
      && $scope.focusInLeft== false) {
      if(!focusManager.getCurrent().scope){
        $scope.setFocusItem('more', $element[0]);
        return;
      }
      if(focusManager.getCurrent().scope.scopeName == 'menu'){
        $scope.setFocusItem('more', $element[0].getElementsByClassName('btn-small')[0]);
      }else if(focusManager.getCurrent().scope.scopeName == 'featured'){
        if (rectan) {
          moveFocusToNearest(rectan); // left, more, right
        } else {
          $scope.setFocusItem('left', $element[0].getElementsByClassName('btn-main-prev')[0]);
        }
      }else{
        moveFocusToNearest(rectan); // left, more, right
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
      if (focusElement != null && focusElement.getAttribute('item')
          && focusElement.getAttribute('item') == 'more') {
        rect = {x : parseInt(1000 * zoomRatio), y : parseInt(300 * zoomRatio)};
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
      $rootScope.$broadcast('focus', 'drawer', keyCode, rect);
    } else if (keyCode == keyHandler.DOWN) {
      rect = {x: 0, y: 0, width: 0, height: 0};
      if(focusManager.getCurrent().target == "left"){
        $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
      } else { // more, right
        $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
      }
    } else if (keyCode == keyHandler.LEFT) {
      if(focusManager.getCurrent().target == "more"){
        $scope.setFocusItem('left', $element[0].getElementsByClassName('btn-main-prev')[0]);
      }else if(focusManager.getCurrent().target == "right"){
        $scope.setFocusItem('more', $element[0].getElementsByClassName('btn-small')[0]);
      }
    } else if (keyCode == keyHandler.RIGHT) {
      if(focusManager.getCurrent().target == "more"){
        $scope.setFocusItem('right', $element[0].getElementsByClassName('btn-main-next')[0]);
      }else if(focusManager.getCurrent().target == "left"){
        $scope.setFocusItem('more', $element[0].getElementsByClassName('btn-small')[0]);
      }
    }
  };

  var moveFocusToNearest = function(rectan) {
    // left, more, right
    if (rectan.x < parseInt(600 * zoomRatio)) {
      $scope.setFocusItem('left', $element[0].getElementsByClassName('btn-main-prev')[0]);
    } else if (rectan.x > parseInt(1300 * zoomRatio)) {
      $scope.setFocusItem('right', $element[0].getElementsByClassName('btn-main-next')[0]);
    } else {
      $scope.setFocusItem('more', $element[0].getElementsByClassName('btn-small')[0]);
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
  };

  initialize();
});
