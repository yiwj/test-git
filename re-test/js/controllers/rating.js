app.directive('rating', function() {
  return {
    restrict: 'A', scope: {}, replace: true, controller: 'ratingController', template: ratingTmpl //Url: './resources/html/rating.html'
  };
});
app.controller('ratingController', function($scope, $controller, $element, $rootScope, $timeout, focusManager, keyHandler, marquee, util, billing, device, server, eventKey, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var owner = null;
  var lastFocus = {};

  $scope.scopeName = 'rating';
  $scope.starList = [{point: true}, {point: true}, {point: true}, {point: false}, {point: false}];
  $scope.open = false;
  $scope.hide = true;
  $scope.type = 'popup';
  $scope.starValue = 3;
  $scope.ratio = 20;
  $scope.viewRatio = 10;
  $scope.store = 0;
  $scope.isLogin = device.auth.userID ? true : false;
  $scope.checksum = {
    isSameDevice: false    //구매한 컨텐츠가 동일 device인지 판단 flag
    , didPurchase: true    //구매한 컨텐츠 flag
    , didPlay: true        //시청 이력이 있는지 flag
    , didInstall: true     //앱설치 이력이 있는지 flag
  };
  $scope.appId = '';
  $scope.bPurchased = '';
  $scope.price = '';
  $scope.inPopup = false;
  $scope.button1 = true;
  $scope.button2 = true;
  $scope.recoverFlag = false;
  $scope.isRateNewPage = false;

  $scope.onMouseEnter = function(event){
    $scope.inPopup = true;
  };

  $scope.onMouseLeave = function(event){
    $scope.inPopup = false;
  };

  $scope.setFocusItem = function(item, element) {
    $scope.focusItem = item;
    if (focusElement) {
      focusElement.classList.remove('focus');
    }
    focusElement = element;
    if (focusElement) {
      focusElement.classList.add('focus');
      $scope.lastFocusItem = {
        item: item, index: element.getAttribute('index')
      };
    }
    if (item) {
      focusManager.setCurrent($scope, item, element);
      lastFocus.item = item;
      lastFocus.element = element;
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }
  };

  $scope.audioGuidance = function (scope, target, element) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };

    var starValue = '';
    var enterSound = '';
    var itemName = '';
    var ratingAudio = msgLang.audio_2017_rating;

    //이미 평가 완료한 경우
    if (target === 'alreadyRate') {
      if ($scope.title) {
        enterSound = $scope.title;
        if (getStarsValue(element, 'on')) {
          starValue = getStarsValue(element, 'on');
          enterSound += '. ';
          enterSound += starValue;
        }
      }
      if (enterSound.length > 0) {
        params.text = enterSound;
      }

      audioGuidance.call(params);
      return;
    }

    //최초 화면 진입 시 나오는 음성
    if ($scope.isRateNewPage) {
      if ($scope.title) {
        enterSound = $scope.title;
        if(getStarsValue(element, 'on')){
          starValue = getStarsValue(element, 'on');
          enterSound += '. ';
          enterSound += ratingAudio.replace('[SCORE]', starValue);
          //[QEVENTSIXT-11084] <Rate this content>+<%n star>까지 발화하고 마지막에 <rating> 발화 하지 않음
//          enterSound += ' '+ msgLang.rating;
        }
        $scope.isRateNewPage = false;
      }
    }else{
      if(element && element.classList.contains('btn-popup')){
        if(element.querySelector('.text') && element.querySelector('.text').innerText.length > 0){
          itemName = element.querySelector('.text').innerText;
          itemName += '. ';
          itemName += msgLang.audio_button_button;
        }
      }else{
        itemName = getStarsValue(element, 'focus');
        //[QEVENTSIXT-9269] 버튼명 뒤에 "rating" 추가 발화함 <"OK button"> + <"rating">
        //[QEVENTSIXT-25889] <%n rating> 으로 발화 됨.
        itemName = ratingAudio.replace('[SCORE]',itemName);
      }
    }

    if (enterSound.length > 0) {
      params.text = enterSound;
    } else if (itemName) {
      params.text = itemName;

    } else {
      return;
    }
    audioGuidance.call(params);
  };

  //rating 시 star value 가져오기
  var getStarsValue = function(element, valueType) {
    var tmpClass = '.btn-score.';
    tmpClass = tmpClass.concat(valueType);
    if (element && Array.prototype.pop.call(element.parentElement.querySelectorAll(tmpClass)).attributes[3].value) {
      var tmpStarValue = Array.prototype.pop.call(element.parentElement.querySelectorAll(tmpClass)).attributes[3].value;
      switch (tmpStarValue){
        case "star0":
          tmpStarValue = "1";
          break;
        case "star1":
          tmpStarValue = "2";
          break;
        case "star2":
          tmpStarValue = "3";
          break;
        case "star3":
          tmpStarValue = "4";
          break;
        case "star4":
          tmpStarValue = "5";
          break;
      }
    }

    return tmpStarValue;
  };

  $scope.removeFocus = function() {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
    }
  };

  $scope.setDefaultFocus = function() {
    var target, item;

    if (focusManager.getState('rating') == true) return;

    target = $element[0].getElementsByClassName('btn-score')[2];
    if (target) {
      item = target.getAttribute('item');
      $scope.setFocusItem(item, target);
    } else {
      $scope.setFocusItem('', null);
    }
  };

  /**
   * @param {object} scope : 평가하기를 호출한 scope
   * @param {object} param : 구매여부, 가격 등의 평가하기의 유효성 체크를 위한 parameter
   * @description 평가 이력에 따라 평가하기 팝업창을 보여주며 무료앱일 경우에는 설치 정보가 없으면 구매정보가 존재하지 않아 set score를 할 경우.
   *               에러가 발생한다. 무료앱이더라도 [평가하기]를 진행하려면 무조건 설치되어야 한다.
   * */
  $scope.showRating = function(scope, param) {
    $scope.isRateNewPage = true;
    var buttonArr, l, requestParam, scoreArr, m;
    owner = scope;
    if (owner) {
      owner.moveFocusDiable = true;
    }
    $scope.appId = param.appId;
    $scope.bPurchased = param.bPurchased;
    $scope.price = param.price;
    $scope.alreadyRating = false;
    $scope.recoverFlag = false;

    //유료 app일 경우
    if($scope.price > 0) {
      //구매하지 않은 경우
      if($scope.bPurchased === 'N' || !$scope.bPurchased) {
        $scope.checksum.didPurchase = false;
        $scope.checksum.didInstall = false;
      }else { // 구매한 경우
        $scope.checksum.didPurchase = true;
        $scope.checksum.didInstall = true;
      }
      //무료 app일 경우
    }else {
      // 무료앱은 설치시에 0원으로 구매처리하므로 구매하지 않은 앱은 미설치를 의미함.
      if($scope.bPurchased === 'N' || !$scope.bPurchased) {
//        $scope.checksum.didInstall = false;
      }
    }

    if(scope.actBtntxt !== msgLang.apps_launch && scope.actBtntxt !== msgLang.apps_update) {
      $scope.checksum.didInstall = false;
    }

    if(isValid($scope.checksum)) {
      requestParam = {
        appId : $scope.appId,
        event : eventKey.PURCHASE_INFO //'purchaseInfoLoaded'
      };
      billing.getPurchasedAppinfo(requestParam);
    }
    $scope.$digest();

    buttonArr = $element[0].getElementsByClassName('btn-small');
    l = buttonArr.length;
    for (var i = 0; i < l; i++) {
      $scope.setMouseEvent(buttonArr[i]);
    }

    scoreArr = $element[0].getElementsByClassName('btn-score');
    m = scoreArr.length;
    for (i = 0; i < m; i++) {
      $scope.setMouseEvent(scoreArr[i]);
    }

  };

  $scope.hidePopup = function() {
    if (!$scope.open) {
      return;
    }
    focusManager.setState('rating', false);
    $scope.open = false;
    $scope.setFocusItem('', null);
    $timeout(function() {
      if (owner === null) return;
      if (!$scope.recoverFlag) {
        owner.recoverFocus();
      }
      $scope.recoverFlag = true;
      if (owner) {
        owner.moveFocusDiable = false;
      }
    }, 300);
    $timeout(function() {
      if ($scope.open === false) {
        $scope.hide = true;
        $scope.$digest();
      }
    }, 100);
  };

  /**
   * @param {object} ratingData : 평가하기 화면을 구성하기 위한 라벨 및 평점 설정 정보
   * @description 평가하기 팝업창의 평점 및 라벨 정보룰 설정한다.
   * */
  $scope.setRatingInfo = function(ratingData) {
    // dimmed 된 class 초기화
    $element[0].getElementsByClassName('pop-rating')[0].classList.remove('pop-rating-end');
    if (ratingData.class) {
      $element[0].getElementsByClassName('pop-rating')[0].classList.add(ratingData.class);
    }
    if (ratingData.title) {
      $scope.title = ratingData.title;
    }
    if (ratingData.ratio) {
      $scope.store = parseInt(ratingData.ratio / 10);
      for (var i = 0; i < 5; i++) {
        if (i <= ((ratingData.ratio / 20) - 1)) {
          if (!('on' in $element[0].getElementsByClassName('btn-score')[i].classList)) {
            $element[0].getElementsByClassName('btn-score')[i].classList.add('on');
          }
        } else {
          $element[0].getElementsByClassName('btn-score')[i].classList.remove('on');
        }
      }
    }

    if($scope.alreadyRating) $scope.audioGuidance('', 'alreadyRate', $element[0]);

    util.async(function() {
      if(util.isAWSServer()) {
        if(!$rootScope.popupApp.open && !$rootScope.rating.open){
          //[WOSLQEVENT-113515] 이상희 연구원 요청
          //평가완료 팝업창 뜨기전에 평가하기 버튼 다시 누른 경우 이전에 평가한 별점에 대한 평가완료 팝업 제공하지 않도록 구현
          $scope.open = true;
          $scope.hide = false;
          $scope.$digest();
        }
      }else{
        $scope.open = true;
        $scope.hide = false;
        $scope.$digest();
      }
    });
  };

  $scope.moveFocusByKey = function(keyCode) {
    var element, item;

    if (keyCode == keyHandler.LEFT) {
      if ($scope.focusItem == 'btn01' || $scope.focusItem == 'star0') return;
      if ($scope.focusItem == 'btn02') {
        item = 'btn01';
        element = $element[0].getElementsByClassName('btn01')[0];
      } else if ($scope.focusItem.indexOf('star') >= 0) {
        item = parseInt($scope.focusItem.replace('star', '')) - 1;
        element = $element[0].getElementsByClassName('star' + item)[0];
        item = 'star' + item;
      }
    } else if (keyCode == keyHandler.RIGHT) {
      if ($scope.focusItem == 'btn02' || $scope.focusItem == ('star4')) return;
      if ($scope.focusItem == 'btn01') {
        item = 'btn02';
        element = $element[0].getElementsByClassName('btn02')[0];
      } else if ($scope.focusItem.indexOf('star') >= 0) {
        item = parseInt($scope.focusItem.replace('star', '')) + 1;
        element = $element[0].getElementsByClassName('star' + item)[0];
        item = 'star' + item;
      }
    } else if (keyCode == keyHandler.DOWN) {
      if ($scope.focusItem == 'btn01' || $scope.focusItem == 'btn02') return;
      if ($scope.focusItem == 'star0' || $scope.focusItem == 'star1' || $scope.focusItem == 'star2') {
        element = $element[0].getElementsByClassName('btn01')[0];
        item = 'btn01';
      } else if ($scope.focusItem == 'star3' || $scope.focusItem == 'star4') {
        element = $element[0].getElementsByClassName('btn02')[0];
        item = 'btn02';
      }
    } else if (keyCode == keyHandler.UP) {
      if ($scope.focusItem.indexOf('star') >= 0) return;
      if ($scope.focusItem == 'btn01') {
        item = 'star0';
        element = $element[0].getElementsByClassName('star0')[0];
      } else if ($scope.focusItem == 'btn02') {
        item = 'star3';
        element = $element[0].getElementsByClassName('star3')[0];
      }
    }
    if (item && element) {
      $scope.setFocusItem(item, element);
    }
  };

  $scope.executeAction = function() {
    var focusObject, target, currentRatio, requestParam, payload, errorCode;

    $scope.isLogin = device.auth.userID ? true : false;
    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target == 'btn01') {
        $scope.hidePopup();
      } else if (target == 'btn02') {
//        if($scope.isLogin) {
          payload = {
            app_id: $scope.appId,
            evaluation_point: $scope.store
          };
          try {
            if (!device.isLocalJSON) {
              // server data 용
              var params = {
                api : '/discovery/rating/GAMESAPPS',
                apiAppStoreVersion : 'v8.0',
                method : 'post',
                payload : payload
              };
              server.requestApi(eventKey.RATED_APPGAME, params); // 완료 처리는 앱 상세화면에서 함.
            } else {
              // local json 용
              server.requestAppNGameRating(payload);
            }
          } catch (e) {
            errorCode = "Rating.400";
            requestParam = {
              type: 'error',
              popupTitle: msgLang.alert_adult_3_2,
              errorMsg: msgLang.alert_adult_3_5,
              errorCodeMsg: 'ERROR CODE: '+errorCode
            };
            $rootScope.popupApp.showPopup($scope, requestParam);
          }
//        }else {
//          console.error('rating.js Rating.Apps.setScore 로그인 필요');
//        }
      } else if (target.indexOf('star') >= 0) {
        currentRatio = parseInt(target.replace('star', '')) + 1;
        requestParam = {
          ratio: currentRatio * $scope.ratio
        };
        $scope.setRatingInfo(requestParam);
      }
    }
  };

  /**
   * @param {object} ratingData : 평가 이력 정보
   * @description 평가 이력의 유무에 따라 화면 구성 정보를 설정한다.
   * */
  var initializeRating = function(ratingData) {
    var requestParam;

    //button visable
    $scope.alreadyRating = false;
    $scope.button1 = msgLang.cancel;
    $scope.button2 = msgLang.ok;

    if($rootScope.popupApp.open || $rootScope.rating.open) {
      return;
    }
    /*********평가 이력이 없을 경우 point '-1' 문자열**************************/
    if(ratingData.point == '-1') {

      if(util.isAWSServer() && ratingData.evaluationPoint) {
        tmpPoint = $scope.viewRatio * parseInt(ratingData.evaluationPoint, 10)
      }else{
        tmpPoint = $scope.starValue * $scope.ratio;
      }
      requestParam = {
        title: msgLang.alert_rate_1,
        ratio: tmpPoint // (3 * 20) default
      };
      $scope.setRatingInfo(requestParam);

      //Focus주기 가운데별
      //$scope.setDefaultFocus();
      for (var i= 4; i > -1; i--) {
        if (angular.element($element[0].getElementsByClassName('btn-score')[i]).hasClass('on')) {
          var tempElement =  $element[0].getElementsByClassName('btn-score')[i];
          var tempItem = ($element[0].getElementsByClassName('btn-score')[i]).getAttribute("item");
          $scope.setFocusItem(tempItem, tempElement);
          break;
        }
      }

      /*********평가 이력이 있는 경우 point '-1' 이 아닌 문자열**************************/
    }else {
      //button hidden
      $scope.alreadyRating = true;
      requestParam = {
        title: msgLang.alert_rate_4, //You already rated this content.
        ratio: $scope.viewRatio * parseInt(ratingData.point, 10),    // (10 * xx)
        class: 'pop-rating-end'     // dimmed 처리하는 class
      };
      $scope.setRatingInfo(requestParam);
      $timeout(function() {
        if (owner === null) return;
        focusManager.setState('rating', false);
        owner.recoverFocus();
      }, 100);
    }
    $scope.$digest();
    //initialize rating 후 포커스 setstate 변경
    focusManager.setState('rating', true);
  };

  /**
   * @param {object} chkObj : 구매여부, 설치 여부 정보
   * @description 구매/설치 한 앱인지 유효성를 한다.
   * */
  var isValid = function(chkObj) {
    var valid = true;

    if (!chkObj.didPurchase) {
      //구매후 평가 가능
      console.error('구매후 평가가능.');
      valid = false;
    } else if (!chkObj.didInstall) {
      //설치를 하지 않았음으로 별점 저장이 불가하다는 팝업 메시지 출력
      console.error('설치 하지 않아 별점 저장 불가');
      valid = false;
    }
    return valid;
  };

  /**
   * @param {object} response : billing 의 구매일 정보 조회 리턴 정보
   * @description 앱의 평가 이력 유무를 결정한다.
   * */
  var purchaseInfo = function(e, response) {
    var ratingData;
    if (response.app) {
      //Apps n games는 구매정보에 rating score정보가 포함된다.
      /**
       * evaluationYN: 평가되었는지 'N', 'Y'
       * evaluationPoint: 평가 point
       * */


    if(util.isAWSServer()){
      ratingData = {
        point: '-1',
        evaluationPoint :  response.app.evaluationPoint
      };
    }else{
      ratingData = {
        point: (response.app.evaluationYN === 'N') ? '-1' : response.app.evaluationPoint
      };
    }
      initializeRating(ratingData);
    } else {
      console.log('error getPurchasedAppInfo', response);
    }
  };

  var initialize = function() {
    $rootScope.rating = $scope;
    $scope.$on(eventKey.PURCHASE_INFO, purchaseInfo);
    $element.on('click', function(e) {
      var popupArea = $element[0].getElementsByClassName('pop-rating')[0];
      var x = popupArea.offsetLeft;
      var y = popupArea.offsetTop;
      var width = popupArea.offsetWidth;
      var height = popupArea.offsetHeight;
      if (((x < e.x) && (e.x <x+width)) && ((y < e.y) && (e.y< y+height))) {//팝업영역 밖이면 팝업 닫음
        return;
      } else {
        $scope.hidePopup();
      }
    });

  };

  initialize();
});