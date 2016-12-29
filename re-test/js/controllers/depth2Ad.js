app.directive('depth2Ad', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'depth2AdController',
    //templateUrl: './resources/html/depth2Ad.html'
    template: depth2AdTmpl
  };
});

app.controller('depth2AdController', function($scope, $controller, $element, $rootScope, $sce, $timeout, $compile, focusManager, keyHandler, marquee, adManager, device, pmLog, audioGuidance, util) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  $scope.scopeName = 'depth2Ad';
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
  $scope.isHD = device.isHD;

  this.playTimeIntervalID = '';

  var focusElement = null;
  var destroyInfo = {scope : $scope, element : $element};

  /*
  angular.element(window).on('keydown', function(e) {
    // backspace && Full Screen
    if (e.keyCode === 461 && angular.element(document.querySelector('.player-thumb')).length > 0) {
      $timeout(closeFullScreen, 100);
    }
  });
  */

  $scope.showAD = function(response) {
    $element.children().remove();
    var subtemplate = angular.element(depth2AdSubTmpl);
    $element.append($compile(subtemplate)($scope));
    $scope.adRes = response[0];
    $scope.fullScreen = false;

    // mediaOption
    var mediaOptionObj =  {
      option: {
        transmission: {
          adInfo: {
            contextIndex: response[0].adContextIndex,
            appId: "com.webos.app.discovery",
            assetId: response[0].assetId
          }
        }
      }
    };
    $scope.mediaOption = encodeURIComponent(JSON.stringify(mediaOptionObj));

    if ($scope.show) {
      switch (response[0]['type']) {
        case 'video' :
          //source tag 동적 생성
          var sourcetemplate = angular.element(sourceTagTmpl);
          angular.element($element[0].getElementsByTagName('video')[0]).append($compile(sourcetemplate)($scope));
          if(!$element[0].classList.contains("item-video")) {
            $element[0].classList.add("item-video");
          }
          if(!$element[0].classList.contains("blank")) {
            $element[0].classList.add("blank");
          }
          //source tag 생성 후 src 값 설정한 다음 video load()
          $scope.src = $sce.trustAsResourceUrl(response[0].srcUrl);
          $scope.$digest();
          $element[0].getElementsByTagName('video')[0].load();
          $scope.showVideoPlayer = true;
          break;
        case 'image' :
          // ToDo
          $scope.src = $sce.trustAsResourceUrl(response[0].srcUrl);
          $element[0].getElementsByClassName('thumb-img')[0].style.display = 'block';
          $element[0].getElementsByTagName('video')[0].style.display = 'none';
          $scope.showImagePlayer = true;
          break;
      }
    } else {
      $scope.show = true;
      if (this.$root.$$phase != '$digest') $scope.$apply();

      switch (response[0]['type']) {
        case 'video' :
          //source tag 동적 생성
          var sourcetemplate = angular.element(sourceTagTmpl);
          angular.element($element[0].getElementsByTagName('video')[0]).append($compile(sourcetemplate)($scope));
          if(!$element[0].classList.contains("item-video")) {
            $element[0].classList.add("item-video");
          }
          if(!$element[0].classList.contains("blank")) {
            $element[0].classList.add("blank");
          }
          //source tag 생성 후 src 값 설정한 다음 video load()
          $scope.src = $sce.trustAsResourceUrl(response[0].srcUrl);
          $scope.$digest();
          $element[0].getElementsByTagName('video')[0].load();
          $element[0].getElementsByTagName('video')[0].pause();
          //[WEBOSDEFEC-13186] listApp에서 광고 풀스크린 이후  back키 연속2회시 광고영역 style.visibility이 hidden된 값을 listApp다시 진입할 때  visible로 설정
          document.querySelector("[depth2-ad]").style.visibility = 'visible';
          if (device.isHD) {
            document.querySelector("[depth2-ad]").style.width ='21.4rem';
          }
          //[WOSLQEVENT-75537] M2 보드 화면 보여주는 속도가 느린 문제로 load(), pause(), 1초 후 play()
//          if(device.q["X-Device-Platform"] === "W16R"){
            // [WOSLQEVENT-108845] 음성이 먼저 나온다하여 위 주석 막고 모두 1초후에 플레이
            setTimeout(function () {
              $element[0].getElementsByTagName('video')[0].play();
            }, 1000);
//          } else {
//            $element[0].getElementsByTagName('video')[0].play();
//          }

          $scope.showVideoPlayer = true;
          break;
        case 'image' :
          $scope.src = $sce.trustAsResourceUrl(response[0].srcUrl);
          $element[0].getElementsByTagName('video')[0].style.display = 'none';
          $scope.showImagePlayer = true;
          break;
      }

      var adElement = $element[0];
      $scope.setMouseEvent(adElement);
      var fullSrnCloseBtn = $element[0].getElementsByClassName('popup-close-button')[0];
      $scope.setMouseEvent(fullSrnCloseBtn);
    }
  };

  $scope.hideAD = function() {
    //fullscreen에서 hidead 할 경우
    if($scope.fullScreen) {
      $scope.closeFullScreen();
    }
    $scope.src = '';
    $scope.show = false;
    $scope.removeFocus();
    if($element[0].getElementsByTagName('video').length > 0) {
      $element[0].getElementsByTagName('video')[0].src = '';
    }
    if($element[0].getElementsByClassName('thumb-img').length > 0) {
      $element[0].getElementsByClassName('thumb-img')[0].style.display = 'none';
    }
    $scope.mediaOption = '';
    $scope.$apply();
    $element.children().remove();
    clearInterval(self.playTimeIntervalID);
  };

  $scope.setFocusItem = function(item, element) {
    var i, j;

    $scope.focusItem = item;

//    if (focusElement) {
//      angular.element(focusElement).removeClass('focus');
//      $scope.focus = false;
//      $scope.$apply();
//    }
    focusElement = element;
//    if (focusElement) {
//      angular.element(focusElement).addClass('focus');
//      $scope.focus = true;
//      $scope.$apply();
//    }
    if (item) {
      if(util.isAWSServer()){
        //do nothing
      } else {
        focusManager.setCurrent($scope, item);
      }
      if(item === 'depth2Ad') {
        if(util.isAWSServer()){
          focusManager.setCurrent($scope, item);
        }
        device.isDepth2AdFocused = true;
        $scope.adFocus = true;
        $scope.closeFocus = false;
        if(!$scope.fullScreen) {

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
              if (lastRule.selectorText.indexOf('ad-banner:hover') > -1) {
                lastSheet.removeRule();
              }
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
        }else if(item === 'depth2Ad' && !focusElement) {
          var currItem = 'close';
          element = $element[0].querySelector('[item="'+currItem+'"]');
          focusElement = element;
          $scope.closeFocus = true;
          angular.element(element).addClass('focus');
          focusManager.setCurrent($scope, item);
        }
      }
      if(item === 'close') {
        $scope.closeFocus = true;
        angular.element(element).addClass('focus');
        focusManager.setCurrent($scope, item);
      }
    } else {
      $scope.adFocus = false;
      $scope.closeFocus = false;
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }
    $scope.$digest();
  };

  $scope.audioGuidance = function (scope, target, element) {
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
    var name,element, hidden, scrollY;

//    if ($scope.focusItem === '') {
//      $scope.setFocusItem(lastFocus.item, lastFocus.element);
//      return;
//    }

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
        //[QEVENTSIXT-22153] RTL언어 설정 시 메뉴 제일 좌측 breadcrumb로 focus 이동함 처리.
        if (!device.isRTL){
          if ($scope.fullScreen) {
            $scope.setDefaultFocus();
          } else {
            device.isDepth2AdFocused = false;
            $rootScope.$broadcast('focus', 'breadcrumbs', function() {
              // right button이 섵택되었을 때 실행될 callback
              var currItem = 'depth2Ad';
              var currElement = document.querySelector('[item="'+currItem+'"]');
              $scope.setFocusItem(currItem, currElement);
            });
          }
        }
        break;
      case keyHandler.UP:
        if ($scope.fullScreen) {
          $scope.setDefaultFocus();
        } else {
          device.isDepth2AdFocused = false;
          $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
        }
        break;
      case keyHandler.RIGHT:
        if ($scope.fullScreen) {
          $scope.setDefaultFocus();
        } else {
          $scope.$parent.$broadcast('focus', 'main', keyCode, rect);
        }
        break;
      case keyHandler.DOWN:
        //name = 'banner';
        //element = angular.element(document.querySelector('.ad-inset-ban'));
        if(util.isAWSServer()){
          if ($scope.fullScreen) {
            $scope.setDefaultFocus();
          }
        } else {
          $scope.setDefaultFocus();
        }
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
      // backkey 처리
      if(target === 'back') {
        $rootScope.breadcrumb.executeBack($scope.scopeName, function() {
          $scope.setFocusItem('', null);
          marquee.setTarget(null);
          focusManager.setCurrent($scope, '');

          obj = $rootScope.pageManager.popHistory();
          $rootScope.draw(obj);
        });
        return;
      }
      var currFocusEl = angular.element(focusElement);
      if (currFocusEl.hasClass('item-video') && currFocusEl.hasClass('ad-banner')) {

        var params = {
          contextIndex: focusElement.getAttribute('adcontextindex'),
          assetId : focusElement.getAttribute('assetId'),
          trackEvent : 'expand',
          from : 'depth2Ad'
        };
        pmLog.write(pmLog.LOGKEY.AD_CLICK, {
          menu_name : pmLog.TYPE.APPGAME,
          ad_id : params.assetId
        });
        if (params.contextIndex && params.assetId) {
          adManager.sendImpressionTracker(params);
        }

        //banner video play 중 광고 click 시 전체화면으로 전환
        if ($element[0].getElementsByTagName('video')[0].readyState <= 2) return;
        //2015.09.25 full screen 전환시 광고 잔상 dim 처리
        $element[0].classList.remove('blank');
        $element[0].children[0].style.visibility = 'hidden';
        $element[0].style.visibility = 'hidden';
        if (device.isHD) {
          $element[0].style.width ='';
        }
        currFocusEl.removeClass('ad-banner');
        currFocusEl.addClass('ad-player');
        focusElement.querySelector('#videothumb').classList.add('player-thumb');
        focusElement.querySelector('#videothumb').classList.remove('thumb');

        // [WOSLQEVENT-105613] : 저 사양에서 과도현상
        var tmpTime = 0;
//        if(device.q["X-Device-Platform"] === "W16K") {
//          tmpTime = 1800;
//        } else {
          tmpTime = 1000;
//        }
        var displayLater = setTimeout(function() {
          $element[0].children[0].style.visibility = 'visible';
          $element[0].style.visibility = 'visible';
          $element[0].classList.add('blank');
          clearTimeout(displayLater);
        }, tmpTime);
        if ($scope.showVideoPlayer) {
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

        } else if ($scope.showImagePlayer) {
          $element[0].getElementsByClassName('img-close')[0].style.display = 'block';
          //$element[0].getElementsByClassName('btn-ad-more')[0].style.display = 'block';
          $scope.fullScreen = true;
        }

        //[WOSLQEVENT-117283] hover-mode 일때 발화가 두번 되는 이유로 focus 안가도록 조치
        if(!document.body.classList.contains('hover-mode')){
          $scope.setDefaultFocus();
        }
      } else if (currFocusEl.hasClass('btn-pop-close')) {
        document.querySelector("[depth2-ad]").querySelector(".ad-dim").style.visibility = 'hidden';
        document.querySelector("[depth2-ad]").style.visibility = 'hidden';
        if (device.isHD) {
          document.querySelector("[depth2-ad]").style.width ='21.4rem';
        }
        setTimeout(function() {
          document.querySelector("[depth2-ad]").querySelector(".ad-dim").style.visibility = 'visible';
          document.querySelector("[depth2-ad]").style.visibility = 'visible';
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
        $scope.closeFullScreen();
      } else {
        //전체화면에서 닫기 버튼 이외 영역 클릭 시
        if($element[0].classList.contains('ad-player')) {
          return;
        }
        //banner video play end 일 경우 광고 click 시 replay
        if ($scope.src.valueOf().length > 0) {
          $element.find('source').remove();
          $element.find('video').append($compile(sourceTagTmpl)($scope));
//          angular.element($element[0].getElementsByClassName('thumb')).append($compile(videoTagTmpl)($scope));
          $scope.$digest();
//          $element[0].getElementsByClassName('thumb-img')[0].style.display = 'none';
//          $element[0].getElementsByTagName('video')[0].style.display = 'block';
          //$element[0].getElementsByTagName('video')[0].currentTime = 0;
//          $element[0].getElementsByTagName('video')[0].play();
          $element[0].getElementsByClassName('icon-player')[0].style.display = 'none';
          $element[0].getElementsByClassName('bg-icon')[0].style.display = 'none';
          // [WOSLQEVENT-108745] 1초 늦게 영상이 보여진다고 하네, 나원!!
          $element[0].getElementsByTagName('video')[0].load();
          $element[0].getElementsByTagName('video')[0].pause();
          if(focusElement.classList){
            focusElement.classList.add('item-video');
          }
          $timeout(function(){
            $element[0].getElementsByTagName('video')[0].play();
          }, 1000)
        } else {
          var adInfo = adManager.adResponse[adManager.curModule];
          this.showAD(adInfo);
        }
      }
    }
  };
  $scope.closeFullScreen = function () {
    //fullscreen close button click 시
    $scope.fullScreen = false;
    $element[0].getElementsByClassName('info-time')[0].style.display = 'none';
    $element[0].getElementsByClassName('info-time')[0].getElementsByClassName('time-text')[0].textContent = '';
    $element[0].getElementsByClassName('ad-inset-ban')[0].style.display = 'none';
    $element[0].getElementsByClassName('img-close')[0].style.display = 'none';
    $element[0].getElementsByClassName('btn-ad-more')[0].style.display = 'none';
    $element[0].querySelector('#videothumb').classList.remove('player-thumb');
    $element[0].querySelector('#videothumb').classList.add('thumb');
    $element[0].classList.remove('ad-player');
    $element[0].classList.add('ad-banner');

    /*
    //[WOSLQEVENT-77539] 화면 축소시 Chip 마다 영상이 나오는 시간이 달라 K2LP 면 2초 후 setFocus 하도록 조치. 추후 이슈 발생시 시간 조정 요. **Chip에 따른 타이밍 맞추기가 어려워 CSS로 조치
    var focusDelay = 1050;
    if (device.q["X-Device-Platform"] === "W16P") {
      focusDelay = 2000;
    }
    setTimeout(function () {
      $scope.setFocusItem('depth2Ad', $element[0]);
    }, focusDelay);
    */
    //[WOSLQEVENT-118366] 팝업내용 읽는중 Sponsored ad 문구 출력됨 이슈 처리
    // 광고 full screen 시 네트워크 해제 시 네트워크 팝업 창이 뜨고 광고 full screen 종료 후에 focus가 ad sponsor로 가서 ad sponsor발화하여
    // 광고 full screen 종료 시 네트워크 팝업창이 있으면 ad sponsor로 focus가지않게 처리 함
    if ($rootScope.popupApp && $rootScope.popupApp.open && $rootScope.popupApp.title === msgLang.alert_adult_3_4) {
      console.log('Network popup show');
    }else{
      $scope.setFocusItem('depth2Ad', $element[0]);
    }

//    $element[0].classList.add('focus');
    if ($scope.showVideoPlayer) {
      clearInterval(self.playTimeIntervalID);
    }
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

//    target = $element[0];

    if (target) {
      $scope.setFocusItem(target, $element[0]);
    }
  };

  var initialize = function() {
    $rootScope.depth2Ad = $scope;
    $scope.$on('focus', focusHandler);
  };

  initialize();
});