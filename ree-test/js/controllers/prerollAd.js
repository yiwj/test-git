app.directive('prerollAd', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'prerollAdController',
    //templateUrl: './resources/html/prerollAd.html'
    template: prerollAdTmpl
  };
});

app.controller('prerollAdController', function($rootScope, $scope, $controller, $element, $rootScope, $sce, $timeout, $compile, focusManager, keyHandler, marquee, adManager, audioGuidance, util) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  $scope.show = false;
  $scope.skipshow = false;
  $scope.src = '';
  $scope.adRes = {};
  $scope.scopeName = 'prerollAd';
  $scope.focus = false;
  $scope.defaultImg = './resources/images/thumb/default_ad_278X157.png';
  $scope.mediaOption = '';

  var callbackAfterPreroll;
  var playTimeIntervalID = '';
  var progressTimout = '';
  var focusElement = null;

  $scope.prerollPlay = function(callback) {
    $rootScope.spinner.showSpinner();
    callbackAfterPreroll = callback;
    adManager.preRollplay(showPreroll);
  };

  var showPreroll = function(prerollData) {
    var subtemplate = angular.element(prerollAdTmplInner);
    $element.append($compile(subtemplate)($scope));

    var second = 0, count = 0;
    //focus가 뒤에 있는 영화페이지로 가는것을 방지
    $scope.setMouseEvent($element[0]);

    focusManager.setCurrent($scope, '');
    focusManager.setState('prerollAd', true);

    //하위 엘리먼트 중복 발생하는 것 방지 위하여 하위 엘리먼트 삭제
//    if (document.querySelectorAll("#prerollvideo source").length > 0) {
//      var child = document.querySelectorAll("#prerollvideo source")[0];
//      child.parentNode.removeChild(child);
//    }

    if (prerollData) {
      var progressEl = $element[0].querySelector('#progress');
      if (progressEl){
        progressEl.classList.add('focus');
      }
      //impressiontracker
      var params = {
        contextIndex: prerollData.contextIndex,
        assetId : prerollData.assets[0].id,
        trackEvent : 'expand',
        from : 'prerollAd'
      };
      /*if (params.contextIndex && params.assetId) {
        adManager.sendImpressionTracker(params);
      }*/
      // mediaOption
      var mediaOptionObj = {
        option: {
          transmission: {
            adInfo: {
              contextIndex: prerollData.contextIndex,
              appId: "com.webos.app.discovery",
              assetId: prerollData.assets[0].id
            }
          }
        }
      };
      $scope.mediaOption = encodeURIComponent(JSON.stringify(mediaOptionObj));

      //source tag 동적 생성
      var sourcetemplate = angular.element(sourceTagTmpl);
      angular.element($element[0].getElementsByTagName('video')[0]).append($compile(sourcetemplate)($scope));
      //focusManager.setState('preroll', false);
      //console.log('preroll data : ' + prerollData.assets[0].contentData);
      //console.log('★duration             : ' + prerollData.assets[0].duration);
      //console.log('★skipDisplayStartTime : ' + prerollData.assets[0].skipButton.skipDisplayStartTime);
      $scope.src = $sce.trustAsResourceUrl(prerollData.assets[0].contentData);
      $scope.$apply();
      $element[0].getElementsByTagName('video')[0].load();

      var skipInvisibleTime = 5;//default 5초
      if (prerollData.assets[0].skipButton) {
        if (prerollData.assets[0].skipButton.skipDisplayStartTime) {
          if (prerollData.assets[0].skipButton.skipDisplayStartTime === -1) {//skipDisplayStartTime = -1  : skip 버튼이 처음부터 끝까지 활성화
            $element[0].querySelector('#skipText').textContent = msgLang.preroll_skipad2;
            skipInvisibleTime = 0;
            $scope.skipshow = true;
            $scope.setDefaultFocus();
          } else if (prerollData.assets[0].skipButton.skipDisplayStartTime === 0) {//skipDisplayStartTime = 0  : skip 버튼이 처음부터 끝까지 노출되지 않음
            $scope.skipshow = false;
          } else {
            skipInvisibleTime = prerollData.assets[0].skipButton.skipDisplayStartTime;
            $scope.skipshow = false;
          }
        } else {
          $scope.skipshow = false;
        }
      }
      //time display
      var $this = undefined;
      var entireTime = undefined;
      var entireMin = undefined;
      var entireSec = undefined;

      var buffer = undefined;
      var currentTime = undefined;
      var currentMin = undefined;
      var currentSec = undefined;

      var buffering = undefined;
      var progressBar = undefined;
      var onceFlag = true;
      playTimeIntervalID = setInterval(function(){
        $this = $element[0].getElementsByTagName('video')[0];
        entireTime = $this.duration;
        entireHour = getIntToZeroStr(parseInt(parseInt(currentTime)/(60*60)),2);
        entireMin = getIntToZeroStr(parseInt(parseInt($this.duration)/60),2);
        entireSec = getIntToZeroStr(parseInt($this.duration)%60,2);

        buffer = $this.buffered.end(0);
        if (currentTime == $this.currentTime && buffering ==(buffer/entireTime).toFixed(2)*100) {
          if ($rootScope.spinner.hide) {
            $rootScope.spinner.showSpinner();
          }
        } else {
          if (!$rootScope.spinner.hide) {
            $rootScope.spinner.hideSpinner();
          }
        }
        currentTime = $this.currentTime;
        currentHour = getIntToZeroStr(parseInt(parseInt(currentTime)/(60*60)),2);
        currentMin = getIntToZeroStr(parseInt(parseInt(currentTime)/60),2);
        currentSec = getIntToZeroStr(parseInt(currentTime)%60,2);

        buffering = (buffer/entireTime).toFixed(2)*100;
        progressBar = (currentTime/entireTime).toFixed(2)*100;

        buffering = 'width:'+ buffering+'%;';
        progressBar = 'width:'+ progressBar+'%;';
        if (isNaN(entireHour)) {
          entireHour = '00';
        }
        if (isNaN(entireMin)) {
          entireMin = '00';
        }
        if (isNaN(entireSec)) {
          entireSec = '00';
        }
        if (isNaN(currentHour)) {
          currentHour = '00';
        }
        if (isNaN(currentMin)) {
          currentMin = '00';
        }
        if (isNaN(currentSec)) {
          currentSec = '00';
        }
        if (currentTime > skipInvisibleTime) {
          //처음부터 노출 안된경우에는 계속 disable 15.09.16 WOSLQEVENT-56489
          if (prerollData.assets[0].skipButton.skipDisplayStartTime !== 0 && onceFlag) {
            $scope.skipshow = true;
            $element[0].querySelector('#skipText').textContent = msgLang.preroll_skipad2;
            $scope.setMouseEvent($element[0].querySelector('#skipbtn'));
            $scope.setDefaultFocus();
            onceFlag = false;
          }
        }
        $element[0].getElementsByClassName('time-play')[0].textContent = currentHour+":"+currentMin+":"+currentSec;
        $element[0].getElementsByClassName('time-remain')[0].textContent = entireHour+":"+entireMin+":"+entireSec;
        $element[0].getElementsByClassName('bar-buffering')[0].setAttribute('style', buffering);
        $element[0].getElementsByClassName('bar-play')[0].setAttribute('style', progressBar);

        $this = null;
        entireTime = null;
        entireMin = null;
        entireSec = null;
        currentTime = null;
        currentMin = null;
        currentSec = null;
        buffer = null;
        buffering = null;
        progressBar = null;
      }, 500);
      $scope.show = true;
      $scope.$apply();
      $scope.progressShowAndHide();
      $element.find('video').bind('ended', function(e) {
        console.log('video end event');
        $scope.hidePreroll();
      });
    } else {
      console.log('preroll is not played');
      $scope.hidePreroll();
    }
    if (!$rootScope.spinner.hide) $rootScope.spinner.hideSpinner();
  };

  $scope.progressShowAndHide = function() {
    var progressEl = $element[0].querySelector('#progress');
    var progressTimeEl = $element[0].querySelector('#progresstime');
    var hidingTime = 5 * 1000;

    if (progressEl.getAttribute('style') != 'display:block;') {
      progressEl.setAttribute('style','display:block;');
      progressTimeEl.setAttribute('style','display:block;');
      progressTimout = $timeout(function() {
        progressEl.setAttribute('style','display:none;');
        progressTimeEl.setAttribute('style','display:none;');
        $timeout.cancel(progressTimout);
        $scope.setDefaultFocus();
      }, hidingTime);
    } else {
      progressEl.setAttribute('style','display:none;');
      progressTimeEl.setAttribute('style','display:none;');
      $timeout.cancel(progressTimout);
      $scope.setDefaultFocus();
    }
  };

  $scope.hidePreroll = function(notplay) {
    console.log('prerollstate false');
    if (!$rootScope.spinner.hide) {
      $rootScope.spinner.hideSpinner();
    }
    $scope.mediaOption = '';
    var progressEl = $element[0].querySelector('#progress');
    if (progressEl){
      progressEl.classList.remove('focus');
    }
    focusManager.setState('prerollAd', false);

    $scope.src = '';
    $scope.show = false;
    $scope.skipshow = false;
    $element[0].getElementsByTagName('video')[0].src = '';
    $element[0].getElementsByClassName('time-play')[0].textContent = "00:00";
    $element[0].getElementsByClassName('bar-buffering')[0].setAttribute('style', 'width:0%;');
    $element[0].getElementsByClassName('bar-play')[0].setAttribute('style', 'width:0%;');
    clearInterval(playTimeIntervalID);
    playTimeIntervalID = '';
    $element.children().remove();
    $scope.$apply();
    if(!notplay){
      callbackAfterPreroll();
    }
    return;
  };

  $scope.setDefaultFocus = function() {
    if (window.PalmSystem && window.PalmSystem.cursor.visibility) {//마우스 포인터가 살아있다면 return
      return;
    }
    if ($scope.skipshow) {
      var targetEl = $element[0].getElementsByClassName('btn-ad-skip')[0];
      if (util.isAWSServer()) {
        if (targetEl && !targetEl.classList.contains('focus')) {
          $scope.setFocusItem(targetEl.getAttribute('item'), targetEl);
        }
      } else {
        $scope.setFocusItem(targetEl.getAttribute('item'), targetEl);
      }
    }
  };

  $scope.setFocusItem = function(item, element) {
    var i, j;
    $scope.focusItem = item;

    if (focusElement) {
      focusElement.classList.remove('focus');
    }
    focusElement = element;
    if (focusElement) {
      focusElement.classList.add('focus');
      $scope.focus = true;
      $scope.$apply();
    }
    if (item) {
      focusManager.setCurrent($scope, item);
    } else {
      focusManager.setCurrent($scope, '');
    }
  };

  $scope.audioGuidance = function (scope, target) {
    //audioGuidance 호출 params
    if (util.isAWSServer()) {
      var params = {
        text: '',
        clear: true,
        duplication: true
      };
    } else {
      var params = {
        text: '',
        clear: true
      };
    }

    if (target === 'skipbtn') {
      //skip ad 이 대문자로 번역되어있어 audioGuidance 발화시 "A","D"로 발화되어 소문자로 변경
      if (util.isAWSServer()) {
        params.text = msgLang.preroll_skipad2.toLowerCase();
      } else {
        params.text = msgLang.preroll_skipad2;
      }
      params.text += '. ';
      params.text += msgLang.audio_button_button;
    }

    audioGuidance.call(params);
  };

  $scope.moveFocusByKey = function(keyCode) {
    switch (keyCode) {
    case keyHandler.LEFT:
      $scope.setDefaultFocus();
      break;
    case keyHandler.UP:
      $scope.setDefaultFocus();
      break;
    case keyHandler.RIGHT:
      $scope.setDefaultFocus();
      break;
    case keyHandler.DOWN:
      $scope.setDefaultFocus();
      break;
    }
  };

  $scope.removeFocus = function(target) {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
      $rootScope.tooltip.hideTooltip();
    }
  };

  $scope.executeAction = function() {
    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target == 'skipbtn') {
        if ($scope.skipshow) {
          $scope.hidePreroll();
        }
      } else {
        $scope.progressShowAndHide();
      }
    }
  };

  var getIntToZeroStr = function (data,strLen){
    if (data === null) return data;

    var str = data + '';
    var zeroStr = '';
    for (var i = 0 ; i < strLen - str.length ; i++) {
      zeroStr += '0';
    }
    return zeroStr+str;
  };

  var initialize = function() {
    $rootScope.prerollAd = $scope;
  };

  initialize();
});