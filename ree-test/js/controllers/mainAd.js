app.directive('mainAd', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'mainAdController',
    //templateUrl: './resources/html/mainAd.html'
    template: mainAdTmpl
  };
});

app.controller('mainAdController', function($scope, $controller, $element, $rootScope, $sce, $timeout, $compile, focusManager, keyHandler, marquee, adManager, device, audioGuidance, util) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  $scope.scopeName = 'mainAd';
  $scope.show = false;
  $scope.adFocus = false;
  $scope.closeFocus = false;
  $scope.src = '';
  $scope.adRes = {};
  $scope.focus = false;
  $scope.defaultImg = './resources/images/thumb/default_ad_278X157.png';
  $scope.bannerImg = './resources/images/thumb/ad/278X157.png';
  $scope.showVideoPlayer = false;
  $scope.showImagePlayer = false;
  $scope.fullScreen = false;
  $scope.mediaOption = '';
  $scope.finishdraw = false;

  this.playTimeIntervalID = '';

  var focusElement = null;
  var destroyInfo = {scope : $scope, element : $element};

  $scope.showAD = function(response) {
    console.log("mainAd.js showAD : ", response, $scope.finishdraw);
    $element.children().remove(); //하위 엘리먼트 중복 발생하는 것 방지 위하여 하위 엘리먼트 삭제
    var subtemplate = angular.element(mainAdSubTmpl);
    $element.append($compile(subtemplate)($scope));
    $scope.$digest();
    $scope.adRes = response;

    //console.log('showAD mainsuntemplate append : ')
    //console.log($element[0]);

    // mediaOption
    var mediaOptionObj =  {
      option: {
        transmission: {
          adInfo: {
            contextIndex: response.adContextIndex,
            appId: "com.webos.app.discovery",
            assetId: response.assetId
          }
        }
      }
    };
    $scope.mediaOption = encodeURIComponent(JSON.stringify(mediaOptionObj));

    //source tag 동적 생성
    var sourcetemplate = angular.element(sourceTagTmpl);
    angular.element($element[0].getElementsByTagName('video')[0]).append($compile(sourcetemplate)($scope));
    if(!$element[0].classList.contains("item-video")) {
      $element[0].classList.add("item-video");
    }
    //source tag 생성 후 src 값 설정한 다음 video load()
    $scope.src = $sce.trustAsResourceUrl(response.srcUrl);
    $scope.$digest();
//    $element[0].getElementsByTagName('video')[0].pause();

    //console.log('showAD sourcetagtamplate append : ');
    //console.log($element[0]);
    //$element[0].getElementsByTagName('video')[0].load();

    var adElement = $element[0];
    $scope.setMouseEvent(adElement);
    var fullSrnCloseBtn = $element[0].getElementsByClassName('popup-close-button')[0];
    $scope.setMouseEvent(fullSrnCloseBtn);

    //finishdraw method가 먼저 load 될 경우
    if($scope.finishdraw && !$scope.show) {
      console.log("finishdraw가 먼저탐");
      $scope.show = true;
      $scope.finishdraw = false;
      $scope.$digest();
      $scope.loadVideo();
    }
  };

  /*
   * 광고가 먼저 로드되는 문제 발생하여
   * 광고 show를 delay 하였을 때 
   * 광고가 show되기 까지 빈공간으로 남아있어
   * 데이터가 없는 것처럼 보이는 문제가 발생..
   *  : 광고 데이터 로드 후 광고 play 를 finishdraw 전에 실행하도록 수정
   *  issue no : WOSLQEVENT-52151
   */
  $scope.loadVideo = function() {
    console.log('call loadVideo!!');
    if($element[0].getElementsByTagName('video')[0].paused) {
      $element[0].getElementsByTagName('video')[0].load();
      $element[0].getElementsByTagName('video')[0].pause();

      //[WOSLQEVENT-75537] M2 보드 화면 보여주는 속도가 느린 문제로 load(), pause(), 1초 후 play()
      if(device.q["X-Device-Platform"] === "W16R"){
        setTimeout(function () {
          $element[0].getElementsByTagName('video')[0].play();
        }, 1000);
      } else {
        $element[0].getElementsByTagName('video')[0].play();
      }
    }
  };

  $scope.hideAD = function() {
    //fullscreen에서 hidead 할 경우
    if($scope.fullScreen) {
      $scope.closeFullScreen();
    }
    $scope.src = '';
    $scope.show = false;
    $scope.mediaOption = '';
    $scope.$apply();
    $element.children().remove();
    clearInterval(self.playTimeIntervalID);
  };

  $scope.setFocusItem = function(item, element) {
    //console.log("!!!!!!!!!!!main ad set focus!!!!!!!!!!!!!");
    var i, j;

    $scope.focusItem = item;
    focusElement = element;
    if (item) {
      if(util.isAWSServer()){
        //do nothing
      } else {
        focusManager.setCurrent($scope, item);
      }
      if(item === 'mainAd') {
        if(util.isAWSServer()){
          focusManager.setCurrent($scope, item);
        }
        $scope.adFocus = true;
        $scope.closeFocus = false;

        /*
         * 비디오 광고 full screen에서 wenkithidden 이벤트 발생 시
         * hover mode에서 비디오 광고에 focus가 사라지지 않는 문제가 발생하여
         * 비디오 광고 hover mode를 disable 하는 css style을 삽입하여 focus가 가지 않도록 한 후
         * 비디오 광고에 실재로 focus가 이동하면 해당 css style을 삭제하여 hover mode 정상동작하도록 함
         */
        //------------------------style 삭제 start--------------------------//
        if (element) {
          //console.log('depth2ad element', element);
          if (!document.body.classList.contains('hover-mode')) {
            element.classList.add('focus');
          }
          var sheetCount = document.styleSheets.length;
          var lastSheet = document.styleSheets[sheetCount-1];
          if(lastSheet.rules) {
            var lastRule = lastSheet.rules[lastSheet.rules.length-1];
            //console.log(lastRule);
            if (lastRule.selectorText.indexOf('ad-banner:hover') > -1) {
              lastSheet.removeRule();
            }
            //console.log(lastSheet.rules[lastSheet.rules.length-1]);
          }
          if(lastSheet.cssRules) {
            var lastCssRule = lastSheet.cssRules[lastSheet.cssRules.length-1];
            //console.log(lastCssRule);
            if (lastCssRule.selectorText.indexOf('ad-banner:hover') > -1) {
              lastSheet.deleteRule(lastSheet.cssRules.length-1);
            }
            //console.log(lastSheet.cssRules[lastSheet.cssRules.length-1]);
          }
        }
        //------------------------style 삭제 end--------------------------//
      }
      if (util.isAWSServer()) {
        if (item === 'close') {
          $scope.closeFocus = true;
          angular.element(element).addClass('focus');
          focusManager.setCurrent($scope, item);
        }
      } else {
        if (item === 'close') $scope.closeFocus = true;
      }
    } else {
      $scope.adFocus = false;
      $scope.closeFocus = false;
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }
    $scope.$digest();
  };

  $scope.audioGuidance = function (scope, target) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };

    if (target === 'close') {
      params.text = msgLang.audio_ad_exit;
      if(util.isAWSServer()){
        params.text += ". ";
        params.text += msgLang.audio_button_button;
        params.duplication = true;
      }
    } else {
      if(util.isAWSServer()){
        if(!$scope.fullScreen){
          params.text = msgLang.audio_ad_title;
        }
      }else{
        params.text = msgLang.audio_ad_title;
      }
    }

    audioGuidance.call(params);
  };

  $scope.removeFocus = function(target) {
    if (!target)
      return;
    
    $scope.focusItem = '';
    $scope.adFocus = false;
    $scope.closeFocus = false;
    $scope.$digest();
  };

  $scope.moveFocusByKey = function(keyCode) {
    // full screen일때는 key 이동이 없다.
    if($scope.fullScreen) {
      $scope.setDefaultFocus();
      return;
    }

    var name,element, hidden, scrollY;

    if (focusElement){
      rect = {
        x: focusElement.offsetLeft,
        y: focusElement.offsetTop,
        width: focusElement.offsetWidth,
        height: focusElement.offsetHeight
      };
    }
    switch (keyCode) {
      case keyHandler.LEFT:
//        $scope.setDefaultFocus();
        $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
        break;
      case keyHandler.UP:
        $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
        break;
      case keyHandler.RIGHT:
//        $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
        break;
      case keyHandler.DOWN:
        $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
        //name = 'banner';
        //element = angular.element(document.querySelector('.ad-inset-ban'));
//        $scope.setDefaultFocus();
        break;
    }

    if (name && element) {
      if (hidden) {
        scrollByKey = true;
        scroll.scrollTo(0, scrollY, 300, false);
      }
      $scope.setFocusItem(name, element);
    }
  };

  $scope.setDefaultFocus = function() {
    var target;

    target = angular.element(document.querySelector('.item-video .btn-pop-close'));
    if (!$scope.showVideoPlayer && $scope.showImagePlayer) {
      target = angular.element(document.querySelector('.img-close'));
    }

    if (target) {
      $scope.setFocusItem('close', target);
    } else {
      $scope.setFocusItem('', null);
    }
  };

  $scope.executeAction = function() {
    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      var currFocusEl = angular.element(focusElement);
      if (currFocusEl.hasClass('item-video') && currFocusEl.hasClass('ad-banner')) {
        //banner video play 중 광고 click 시 전체화면으로 전환
        if ($element[0].getElementsByTagName('video')[0].readyState <= 2) return;
        //2015.09.25 full screen 전환시 광고 잔상 dim 처리
        $element[0].classList.remove('blank');
        $element[0].children[0].style.visibility = 'hidden';
        currFocusEl.removeClass('ad-banner');
        currFocusEl.addClass('ad-player');
        focusElement.querySelector('#mainvideothumb').classList.add('player-thumb');
        focusElement.querySelector('#mainvideothumb').classList.remove('thumb');
        var displayLater = setTimeout(function() {
          $element[0].children[0].style.visibility = 'visible';
          $element[0].classList.add('blank');
          clearTimeout(displayLater);
        }, 1000);
//        if ($scope.showVideoPlayer) {
          $element[0].getElementsByClassName('info-time')[0].style.display = 'block';
          //$element[0].getElementsByClassName('ad-inset-ban')[0].style.display = 'block';
          $scope.fullScreen = true;

          self.playTimeIntervalID = setInterval(function(){
            var $this = $element[0].getElementsByTagName('video')[0];
            var rmTime = $this.duration - $this.currentTime;
            var min = getIntToZeroStr(parseInt(parseInt(rmTime)/60),2);
            var sec = getIntToZeroStr(parseInt(rmTime)%60,2);
            $element[0].getElementsByClassName('info-time')[0].getElementsByClassName('time-text')[0].textContent = min+":"+sec;

            // [WOSLQEVENT-73141] 가끔씩 ended event가 타지 않음
            if (min === '00' && sec === '00') {
              $scope.closeFullScreen();
              $element[0].classList.remove('item-video');
              $element[0].getElementsByClassName('icon-player')[0].style.display = 'block';
              $element[0].getElementsByClassName('bg-icon')[0].style.display = 'block';
            }
            $this = null;
            rmTime = null;
            min = null;
            sec = null;
          }, 500);

          // 광고서버 전달
          adManager.sendImpressionTracker({
            contextIndex : $scope.adRes.adContextIndex,
            appId : "com.webos.app.discovery",
            assetId : $scope.adRes.assetId,
            trackEvent : 'expand',
            from : 'mainAd'
          });

//        }

        //[WOSLQEVENT-117283] hover-mode 일때 발화가 두번 되는 이유로 focus 안가도록 조치
        if(!document.body.classList.contains('hover-mode')){
          $scope.setDefaultFocus();
        }
      } else if (currFocusEl.hasClass('btn-pop-close')) {
        document.querySelector("[main-ad]").querySelector(".ad-dim").style.visibility = 'hidden';
        setTimeout(function() {
          document.querySelector("[main-ad]").querySelector(".ad-dim").style.visibility = 'visible';
        }, 1000);
        $scope.closeFullScreen();
      } else if (currFocusEl.hasClass('ad-inset-ban')) {
        // ToDo : click Banner
        console.log('you clicked banner img');
      } else if (currFocusEl.hasClass('btn-ad-more')) {
        // ToDo : click More
        console.log('you clicked more');
        // info-time 영역 over시 x버튼에 focus가 가는데 클릭 시 x버튼과 같은 액션일어나게 처리
      } else if (currFocusEl.hasClass('info-time')) {
        console.log('batman');
        $scope.closeFullScreen();
      } else {
        //전체화면에서 닫기 버튼 이외 영역 클릭 시
        if($element[0].classList.contains('ad-player')) {
          return;
        }
        //banner video play end 일 경우 광고 click 시 replay
        if ($scope.src.valueOf().length > 0) {
          $element.find('source').remove();
          var sourcetemplate = angular.element(sourceTagTmpl);
          $element.find('video').append($compile(sourcetemplate)($scope));
//          angular.element($element[0].getElementsByClassName('thumb')[0]).append($compile(videoTagTmpl)($scope));
//          $scope.src = $sce.trustAsResourceUrl($scope.adRes.srcUrl);
          $scope.$digest();
//          $element[0].getElementsByClassName('thumb-img')[0].style.display = 'none';
//          $element[0].getElementsByTagName('video')[0].style.display = 'block';
//          $element[0].getElementsByTagName('video')[0].play();
          $element[0].getElementsByClassName('icon-player')[0].style.display = 'none';
          $element[0].getElementsByClassName('bg-icon')[0].style.display = 'none';
          $element[0].getElementsByTagName('video')[0].load();
          focusElement.classList.add('item-video');
        } else {
          var adInfo = adManager.adResponse[adManager.curModule];
          this.showAD(adInfo);
        }
      }
    }
  };

  $scope.closeFullScreen = function () {
    console.log("closefullscreen");
    //fullscreen close button click 시
    $scope.fullScreen = false;
    $element[0].getElementsByClassName('info-time')[0].style.display = 'none';
    $element[0].getElementsByClassName('info-time')[0].getElementsByClassName('time-text')[0].textContent = '';
    $element[0].getElementsByClassName('ad-inset-ban')[0].style.display = 'none';
    $element[0].getElementsByClassName('img-close')[0].style.display = 'none';
    $element[0].getElementsByClassName('btn-ad-more')[0].style.display = 'none';
    $element[0].querySelector('#mainvideothumb').classList.remove('player-thumb');
    $element[0].querySelector('#mainvideothumb').classList.add('thumb');
    $element[0].classList.remove('ad-player');
    $element[0].classList.add('ad-banner');
    //[WOSLQEVENT-118366] 팝업내용 읽는중 Sponsored ad 문구 출력됨 이슈 처리
    // 광고 full screen 시 네트워크 해제 시 네트워크 팝업 창이 뜨고 광고 full screen 종료 후에 focus가 ad sponsor로 가서 ad sponsor발화하여
    // 광고 full screen 종료 시 네트워크 팝업창이 있으면 ad sponsor로 focus가지않게 처리 함
    if ($rootScope.popupApp && $rootScope.popupApp.open && $rootScope.popupApp.title === msgLang.alert_adult_3_4) {
      console.log('Network popup show');
    }else{
      $scope.setFocusItem('mainAd', $element[0]);
    }

    clearInterval(self.playTimeIntervalID);
  };

  var getIntToZeroStr = function (data,strLen){
    if(data === null) return data;

    var str = data+'';
    var zeroStr = '';
    for(var i=0;i<strLen-str.length;i++){
      zeroStr += '0';
    }
    return zeroStr+str;
  };

  var focusHandler = function(e, target) {
    var i, l, arr, gap;

    if (target != $scope.scopeName)
      return;

    e.preventDefault();

    if (target) {
      $scope.setFocusItem(target, $element[0]);
    }
  };

  var initialize = function() {
    $rootScope.mainAd = $scope;
    $scope.$on('focus', focusHandler);
  };

  initialize();
});