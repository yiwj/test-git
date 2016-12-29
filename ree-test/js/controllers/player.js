/*jshint -W065 */
app.directive('player', function() {
  return {
    restrict: 'A',
    scope: {},
    controller: 'playerController',
    // templateUrl: './resources/html/player.html'
    template: playerTmpl
  };
});

app.controller('playerController', function($scope, $controller, $element, $timeout, $interval, $rootScope, device, focusManager, keyHandler, marquee, util, getStatus, pmLog, appService, popupService, screenSaver, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var area = null;
  var bar = null;
  var factor = -1;
  var timeout = 1000;

  var STEP_POSITION = 100;
  var scroll = null;
  var focusElement = null;
  var lastFocus = {};
  var lastActiveFocus = {};
  var lastThreeBtnsFocusItem = {};
  var scrollBar = {};
  var maxPosition = 0;
  var pageWidth = 0;
  var scrollByKey = false;
  var owner = null;
  var player = null;

  var isSeeking = false; //seek이 되고 있는 상태인지
  $scope.scrollHide = false;

  var _headerTimeout = null;
  var _controlTimeout = null;
  var _sliderTimeout = null;
  var _threeBtnsTimeout = null;
  var _movieLoadingTimeout = null;

  var MOVIE_LOADING_TIMEOUT = 1000 * 60;
  var CONTROL_HIDE_ONCLICK_TIMEOUT = 3000;
  var CONTROL_HIDE_TIMEOUT = 5000;
  var POINTER_TIME_TIMEOUT = 3000;

  $scope.hide = true;
  $scope.open = false;
  $scope.isCpPopup = false;

  $scope.scopeName = 'player';
  $scope.focusItem = '';
  $scope.title = '';

  // toggle
  $scope.playControl = 'pause';
  $scope.isMovie = false;

  // 초기 open 상태
  $scope.controlHide = false;
  $scope.controlOpen = true;
  $scope.headHide = false;
  $scope.headOpen = true;

  $scope.slideHide = true;
  $scope.slideOpen = false;
  $scope.speedHide = true;
  $scope.speedOpen = false;
  $scope.hideTrailerEndButtons = true;

  $scope.trailer = {};
  $scope.initParams = null;
  $scope.trailerData = null;
  $scope.option = null;
  $scope.currentPanelData = '';
  $scope.options = {};
  $scope.scroll = undefined;

  $scope.controlTick = '';
  $scope.controlTickTime = undefined;
  $scope.trailerEndBtn = {};

  var timeClickedOnProgressbar;

  $scope.hideScreenDim = true;

  $scope.getSlideImages = function() {
    if ($scope.trailerData && $scope.trailerData.data && ($scope.trailerData.data.length > 0)) {
      if ($scope.open) {
        return $scope.trailerData.data;
      } else {
        return [$scope.trailerData.data[0]];
      }
    }

    return [];
  };

  $scope.setFocusItem = function(item, element) {
    // console.log('player.setFocusItem, item=' + item);
    if (!$scope.open) {
      return;
    }
    if (item !== 'pointer') {
      hidePointer();
    }

    if (lastFocus.item == 'btnIcon-0' || lastFocus.item == 'btnIcon-4') {
      if ($scope.hideTrailerEndButtons) {
        // hideTrailerEndButtons를 확인하는 이유는,
        // 동영상 재생 끝에 $scope.playFinished가 호출되고, setFocusItem이 호출되면
        // $scope.onTimeUpdate의 $apply와 hideTooltip의 $digest가 동시 실행되어
        // 에러 발생하는 경우가 있기 때문이다
        $rootScope.tooltip.hideTooltip();
      }
    }
    $scope.focusItem = item;

    if (focusElement) {
      focusElement.classList.remove('focus');
    }
    focusElement = element;
    if (focusElement && item != 'imgPoster') {
      focusElement.classList.add('focus');
    }
    if (item && element) {
      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
      focusManager.setCurrent($scope, item, element);
      lastFocus.item = item;
      lastFocus.element = element;
      // item 이 slide list 썸네일 일 경우 timeout cancel 처리함(slide list close 되면 안됨)
      if(!$scope.slideHide && item.indexOf('item-') >= 0) {
        timeoutHelper.sliderListTimeout();
      } else {
        timeoutHelper.restartTimeout(); // 그외 timeout 처리
      }

      if (item === 'btnPlayMovie' || item === 'btnReplayTrailer' || item === 'btnCloseTrailer') {
        // trailer 재생 종료후, 3개의 버튼위에 focus 이동시, reset timer
        timeoutHelper.threeBtnsTimeout();
        lastThreeBtnsFocusItem = item;
      }
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }

    var leftW, topW, name, right, top, progressH = 0;
    if($element[0].getElementsByClassName('player-progress')[0]) {
      progressH = $element[0].getElementsByClassName('player-progress')[0].offsetHeight;
    }

    if (!$scope.controlHide && $scope.slideHide) {
      // control이 hide된 상태에서는 tooltip을 보이면 안됨.
      var temp = $element[0].getElementsByClassName($scope.focusItem)[0];

      var x = 115;
      var y = 907 - progressH;

      if ($scope.focusItem == 'btnIcon-0') {
        name = msgLang.player_tooltip_godetail;
        right = true;
        top = true;

        if (temp) {
          if (device.isRTL) {
            x = $element[0].getElementsByClassName('player')[0].getBoundingClientRect().width -
              temp.getBoundingClientRect().right + temp.getBoundingClientRect().width / 2;
            y = temp.getBoundingClientRect().top - temp.getBoundingClientRect().height + 2;
          } else {
            x = temp.getBoundingClientRect().left + temp.getBoundingClientRect().width / 2;
            y = temp.getBoundingClientRect().top - temp.getBoundingClientRect().height + 2;
            right = true;
          }
        }
        $rootScope.tooltip.showTooltip(x, y, name, right, top, undefined, undefined, true);
      } else if($scope.focusItem == 'btnIcon-4') {
        name = msgLang.player_tooltip_slideshow;
        top = true;

        if (temp) {
          if (device.isRTL) {
            x = temp.getBoundingClientRect().left + temp.getBoundingClientRect().width / 2;
            y = temp.getBoundingClientRect().top - temp.getBoundingClientRect().height + 2;
          } else {
            x = $element[0].getElementsByClassName('player')[0].getBoundingClientRect().width -
              temp.getBoundingClientRect().right + temp.getBoundingClientRect().width / 2;
            y = temp.getBoundingClientRect().top - temp.getBoundingClientRect().height + 2;
            right = false;
          }
        }
        $rootScope.tooltip.showTooltip(x, y, name, right, top, undefined, undefined, true);
      }
    }

    if (lastFocus && (lastFocus.item !== 'imgPoster')) {
      // imgPoster는 메인 div로 실제 focus가 가지 않는다
      lastActiveFocus.item = lastFocus.item;
      lastActiveFocus.element = lastFocus.element;
    }
  };

  $scope.recoverFocus = function(activeFocus) {
    // console.log('player.recoverFocus');
    var name;

    if (activeFocus && lastActiveFocus && lastActiveFocus.item) {
      // [WOSLQEVENT-39111]
      // movies -> detail -> player -> slide show 에서
      // image 영역으로 mouse 커서를 옮긴 이후, 리모콘 key를 누르면
      // 인식되지 않는 이슈 해결
      name = lastActiveFocus.item;
    } else if (lastFocus && lastFocus.item && (lastFocus.item !== 'imgPoster')) {
      name = lastFocus.item;
    } else {
      // Play 버튼에 Focus
      name = 'btnIcon-2';
    }

    if (name) {
      var element = $element[0].getElementsByClassName(name)[0];
      if (element) {
        $scope.setFocusItem(name, element);

        if (name === 'btnIcon-2' && $scope.mouseOnProgressBar) {
          // mouse cursor가 사라지고, Play 버튼에 Focus
          // progress bar에 pointer 숨기기
          $scope.begintTick = videoHelper.makeDurationTime2DisplayTime($scope.currentTime);
          $scope.mouseOnProgressBar = false;
          $scope.$digest();
        }
      } else if (!focusManager.getCurrent() ||
        !focusManager.getCurrent().scope ||
        (focusManager.getCurrent().scope.scopeName !== 'player')) {
        // [WOSLQEVENT-108771] [Key] 해당 키 동작 불 (EXIT, HOME key등은 정상 동작)
        $scope.setFocusItem('', null);
      }
    }
  };

  $scope.audioGuidance = function (scope, target, element) {
    if (!scope || (scope.scopeName !== 'player')) {
      return;
    }

    // console.log('player.audioGuidance begin, target=' + target);

    var params = {};
    var txt;
    switch (target) {
      /*case 'btnIcon-0':
        txt = msgLang.back;
        break;*/
      case 'btnIcon-1':
        txt = msgLang.audio_button_previous ? msgLang.audio_button_previous : 'previous';
        txt += '. ';
        txt += msgLang.audio_button_button || 'button';
        break;
      case 'btnIcon-2':
        if ($scope.playControl === 'play') {
          txt = msgLang.audio_button_play || 'play';
        } else {
          txt = msgLang.audio_button_pause || 'pause';
        }
        txt += '. ';
        txt += msgLang.audio_button_button || 'button';
        break;
      case 'btnIcon-3':
        txt = msgLang.audio_button_next ? msgLang.audio_button_next : 'next';
        txt += '. ';
        txt += msgLang.audio_button_button || 'button';
        break;
      /*case 'btnIcon-4':
        txt = msgLang.player_tooltip_slideshow;
        break;*/
      case 'btnSpeed':
        txt = msgLang.speed;
        txt += '. ';
        txt += msgLang.audio_button_button || 'button';
        break;
      case 'speed-fast':
      case 'speed-0':
        txt = msgLang.speed_fast;
        if(!element) break;
        txt += '. ';
        txt += getCheck(element);
        break;
      case 'speed-medium':
      case 'speed-1':
        txt = msgLang.speed_medium;
        if(!element) break;
        txt += '. ';
        txt += getCheck(element);
        break;
      case 'speed-slow':
      case 'speed-2':
        txt = msgLang.speed_slow;
        if(!element) break;
        txt += '. ';
        txt += getCheck(element);
        break;
      case 'btnClose':
        if (!$scope.slideHide) {
          txt = msgLang.close;
          txt += '. ';
          txt += msgLang.audio_button_button || 'button';
        }
        break;
      case 'btnPlayMovie':
        txt = msgLang.player_button_playmovie;
        if (util.isAWSServer()) {
          txt += '. ';
          txt += msgLang.audio_button_button || 'button';
        }
        break;
      case 'btnReplayTrailer':
        txt = msgLang.player_button_replay;
        if (util.isAWSServer()) {
          txt += '. ';
          txt += msgLang.audio_button_button || 'button';
        }
        break;
      case 'btnCloseTrailer':
        txt = msgLang.close;
        if (util.isAWSServer()) {
          txt += '. ';
          txt += msgLang.audio_button_button || 'button';
        }
        break;
      case 'PlayMovie':
        if (util.isAWSServer()) {
          txt = msgLang.player_button_playmovie;
        }
        break;
      case 'ReplayTrailer':
        if (util.isAWSServer()) {
          txt = msgLang.player_button_replay;
        }
        break;
      case 'Close':
        if (util.isAWSServer()) {
          txt = msgLang.close;
        }
        break;
      case 'scroll-prev':
        if (util.isAWSServer()) {
          txt = msgLang.audio_trailer_left ? msgLang.audio_trailer_left : 'scroll left';
        }
        break;
      case 'scroll-next':
        if (util.isAWSServer()) {
          txt = msgLang.audio_trailer_right ? msgLang.audio_trailer_right : 'scroll right';
        }
        break;
      case 'left':
        if (util.isAWSServer()) {
          txt = msgLang.audio_trailer_left_press ? msgLang.audio_trailer_left_press : 'left';
          params.duplication = true;
        }
        break;
      case 'right':
        if (util.isAWSServer()) {
          txt = msgLang.audio_trailer_right_press ? msgLang.audio_trailer_right_press : 'right';
          params.duplication = true;
        }
        break;
      case 'pause':
        if (util.isAWSServer()) {
          txt = msgLang.audio_button_pause || 'pause';
          params.duplication = true;
        }
        break;
      case 'play':
        if (util.isAWSServer()) {
          txt = msgLang.audio_button_play || 'play';
          params.duplication = true;
        }
        break;
      case 'next':
        if (util.isAWSServer()) {
          txt = msgLang.audio_button_next || 'next';
          params.duplication = true;
        }
        break;
      case 'previous':
        if (util.isAWSServer()) {
          txt = msgLang.audio_button_previous || 'previous';
          params.duplication = true;
        }
        break;
      default :
        if (util.isAWSServer()) {
          if (target && (target.indexOf('item-') === 0) &&
            element && element.classList && element.classList.contains('item-slide')) {
            // slide show에서 image 선택 변경시
            txt = msgLang.tvshow_shelf_photos ? msgLang.tvshow_shelf_photos : 'Photos';
            params.duplication = true;
          }
        }
        break;
    }

    if (txt) {
      //audioGuidance 호출 params
      params.text = txt;
      params.clear = true;

      audioGuidance.call(params);
      // console.log('player.audioGuidance end, target=' + target +
      //   ', params=' + JSON.stringify(params));
    }
  };

  var getCheck = function (element) {
    if (element && element.classList && element.classList.contains('on')) {
      return 'checked';
    } else {
      return 'unchecked';
    }
  };

  $scope.executeAction = function() {
    var focusObject, target, obj, page, item, itemId, index, playBtn = ['btnIcon-0', 'btnIcon-4', 'btnIcon-1', 'btnIcon-2', 'btnIcon-3'];

    focusObject = focusManager.getCurrent();
    // console.log('player.executeAction, focusObject.target=' + focusObject.target);

    if (focusObject.scope == $scope) {
      target = focusObject.target;

      if (!$scope.hideTrailerEndButtons) {
        if (_threeBtnsTimeout) {
          $timeout.cancel(_threeBtnsTimeout);
          _threeBtnsTimeout = null;
        }

        if(target == 'btnPlayMovie') {
          $scope.audioGuidance($scope, 'PlayMovie');
          $scope.hideTrailerEndButtons = true;
          $scope.$apply();
          playMovie();
        } else if(target == 'btnReplayTrailer') {
          $scope.audioGuidance($scope, 'ReplayTrailer');
          $scope.setFocusItem('', null);
          $scope.hideTrailerEndButtons = true;
          $scope.hideScreenDim = true;

          $scope.playControl = 'pause';

          replayMovie();
        } else if(target == 'btnCloseTrailer') {
          $scope.audioGuidance($scope, 'Close');
          // WOSLQEVENT-51607: 팝업만 닫혀야 함
          // ==> 이 이슈는 타임아웃에 의해 팝업이 닫히는 경우, detail page로 가면 안되는 것, 따라서 closePlayer() 복구시킴 (WOSLQEVENT-52473)
          $scope.closePlayer();
          $scope.hideTrailerEndButtons = true;
          $scope.$apply();
        }
      } else if (target !== 'back') {
        if ($scope.controlHide && $scope.slideHide) {
          // slider 또는 control에 focus가 있는 상태에서, timeout으로 hide가 된 이후,
          // 리모콘의 버튼이 눌린 경우는, control을 보여주도록
          selectControlPopup();
          return;
        }

        if(target.indexOf('btnIcon') >= 0) {// control 영역
          if (target == 'btnIcon-0') {// 상세정보 back
            $scope.closePlayer();
          } else if(target == 'btnIcon-2') {// control popup : play or pause button
            $scope.hideScreenDim = true;
            var playPressed;
            if ($scope.isMovie) {
              playPressed = player.paused;
            } else {
              playPressed = ($scope.playControl !== 'pause');
            }

            control.playPause(playPressed);
            timeoutHelper.restartTimeout(true);
          } else if(target == 'btnIcon-3') {// control popup : next button
            // [UX 3.0] UX_2016_webOS_Initial_LG Content Store_v1.2.7_150813.pdf: 65 page
            // video player에서는 control icon이 play/pause만 있다
            $scope.audioGuidance($scope, 'next');
            slideHelper.clearSlideShow();
            slideHelper.nextContent();
            $scope.$apply();
            if($scope.trailer.currentPanelData.type == 'I' &&
              $scope.trailer.slideShow.active) {
              slideHelper.resetSlideSpeed();// slide show start
            }
            timeoutHelper.restartTimeout(true);
          } else if(target == 'btnIcon-1') {// control popup : prev button
            // [UX 3.0] UX_2016_webOS_Initial_LG Content Store_v1.2.7_150813.pdf: 65 page
            // video player에서는 control icon이 play/pause만 있다
            $scope.audioGuidance($scope, 'previous');
            slideHelper.clearSlideShow();
            slideHelper.prevContent();
            $scope.$apply();
            if($scope.trailer.currentPanelData.type == 'I' &&
              $scope.trailer.slideShow.active) {
              slideHelper.resetSlideSpeed();// slide show start
            }
            timeoutHelper.restartTimeout(true);
          } else if(target == 'btnIcon-4') {//slide popup open or hide
            showSlide();
          }
        } else if(target == 'btnClose') {
          closeSlide();
        } else if(target == 'btnSpeed') {// slide popup : speed button
          showSpeed();
        } else if(target.indexOf('item') >= 0) {// slide popup : item 클릭 시
          selectSlideItem(target);
        } else if(target.indexOf('speed') >= 0) {// speed popup : 속도 클릭 시
          selectSpeedOption();
        } else if(target == 'scroll-prev') {// slide popup : scroll prev 클릭 시
          $scope.audioGuidance($scope, 'left');
          $scope.scrollPageUp();
          timeoutHelper.restartTimeout();
        } else if(target == 'scroll-next') {// slide popup : scroll next 클릭 시
          $scope.audioGuidance($scope, 'right');
          $scope.scrollPageDown();
          timeoutHelper.restartTimeout();
        } else if(target == 'imgPoster') {// panel
          selectControlPopup();
        } else if (target === 'pointer') {
          $rootScope.spinner.showSpinner();
          control.progressbarClick();
        }
      } else if (!target && $scope.controlHide) {
        // detailList에서 trailer 버튼을 누룬후, progress bar가 사라진 이후,
        // 리모콘의 ok 버튼을 누른 경우
        selectControlPopup();
      } else if(target === 'back') {
        $scope.closePlayer();
      }
    }
  };

  $scope.executeByKey = function(keyCode) {
    // console.log('player.executeByKey, keyCode=' + keyCode);

    if (keyCode === keyHandler.STOP) {
      // [QEVENTSIXT-1577] 일반리모컨 Stop(■) key 입력 시, back 버튼과 동일하게 detail page로 복귀하도록
      // keyCode = keyHandler.BACK;
      // [QEVENTSIXT-13574][QEVENTSIXT-13557] 일반리모컨 Stop(■) key 입력 시 player 종료
      $scope.headHide = true;
      $scope.headOpen = false;
      $scope.controlHide = true;
      $scope.controlOpen = false;
      $rootScope.tooltip.hideTooltip();
      $scope.setFocusItem('', null);
      $scope.closePlayer();
    } else if (keyCode === keyHandler.BACK) {
      if (!$rootScope.spinner.hide) {
        // 로딩중
        $scope.closePlayer();
      } else if ($scope.slideOpen) {
        // control open, slide open 상태이면,
        // back 키 입력시 slide만 close 하도록
        closeSlide();
      } else if ($scope.speedOpen) {
        showSpeed();
      } else if($scope.isCpPopup) {   // cp 선택 popup이 있는 상태에서
          $scope.hideTrailerEndButtons = false;
          $scope.isCpPopup = false;
          timeoutHelper.threeBtnsTimeout();
          $scope.$apply();
          return;
      } else {
        $scope.closePlayer();
      }
    } else if (keyCode === keyHandler.PLAY || keyCode === keyHandler.PAUSE) {
      if ($scope.isMovie && !$scope.videoEndTime) {
        console.log('player.executeByKey, video not loaded yet, do nothing');
        return;
      }
      if ($scope.controlHide && $scope.slideHide) {
        // slider 또는 control에 focus가 있는 상태에서, timeout으로 hide가 된 이후,
        // 리모콘의 버튼이 눌린 경우는, control을 보여주도록
        selectControlPopup();
      }

      if (keyCode === keyHandler.PLAY && $scope.playControl !== 'pause') {
        // 현재 멈춤 상태
        control.playPause(true);
      } else if (keyCode === keyHandler.PAUSE && $scope.playControl !== 'play') {
        // 현재 재생중 상태
        control.playPause(false);
      }

      timeoutHelper.restartTimeout();
    }
  };

  var playMovie = function() {
    if (!$scope.itemId || !$scope.execList0 || !$scope.execList0.execs ||
      ($scope.execList0.execs.length < 1)) {
      $scope.closePlayer();
      return;
    }

    $rootScope.spinner.showSpinner();
    $scope.setFocusItem('', null);

    // pmLog
    pmLog.write(pmLog.LOGKEY.CONTENTS_WATCH_CLICK, {
      menu_name : $rootScope.pmLogValue,
      contents_id : $scope.itemId,
      contents_category : $rootScope.pmLogValue
    });

    $rootScope.spinner.hideSpinner();

    if ($scope.execList0.execs.length === 1) {
      // 하나의 CP가 있다면 바로 App 실행
      var checkParams = {
        'item_id': $scope.itemId,
        'appId': $scope.execList0.execs[0].exec_app_id,
        'premiumFlag': $scope.execList0.execs[0].premium_app_flag,
        'launchContentId': $scope.execList0.execs[0].exec_id
      };
      appService.appCheckLaunch(checkParams, function() {
        // item이 선택되었을 때 호출되는 callback
        $scope.hideTrailerEndButtons = true;
        if ($scope.onPageMoveCallback) {
          $scope.onPageMoveCallback();
        }
        $scope.closePlayer();
      });
    } else {
      // 등록된 CP가 없거나, 2개 이상, popup 보여주기
      $scope.isCpPopup = true;
      popupService.watchClick($scope, $scope.execList0.execs, function(target) {
        if (target === 'close' || target === 'back') {
          // 3개 버튼있는 원상태로 복귀, timer 재시작
          $scope.hideTrailerEndButtons = false;
          $scope.isCpPopup = false;
          timeoutHelper.threeBtnsTimeout();
          $scope.$apply();
          return;
        }

        // item이 선택되었을 때 호출되는 callback
        $scope.hideTrailerEndButtons = true;
        $scope.isCpPopup = false;
        if ($scope.onPageMoveCallback) {
          $scope.onPageMoveCallback();
        }
        $scope.closePlayer();
      });
    }
  };

  var replayMovie = function() {
    //시간값 초기화
    $scope.playCont = 0;// progressbar mouseMove 시 변경되었던 progrssbar 값 초기화
    $scope.begintTick = '00:00:00';
    $scope.endTick = '00:00:00';
    // $scope.controlTick = '00:00:00';
    $scope.mouseOnProgressBar = false;
    $scope.playing = '0';
    // $scope.videoEndTime = 0;

    $rootScope.spinner.showSpinner();
    player.play();
  };

  // 외부 호출을 위해 $scope func.로 변경
  $scope.closePlayer = function() {
    device.isPlayer = false;
    $scope.execList0 = undefined;
    $scope.onPageMoveCallback = undefined;
    $scope.setFocusItem('', null);
    $scope.hidePopup();
    $rootScope.spinner.hideSpinner();

    // player 초기화
    $element[0].getElementsByClassName('movie-player')[0].src = '';
    $element[0].getElementsByClassName('player_thumb')[0].setAttribute('style', 'display: block;');
    $scope.hideTrailerEndButtons = true;

    $scope.$apply();

    screenSaver.unBlock();
  };

  var drawTrailer = function() {

    if($scope.isApp === true) {
      $scope.trailer = {
        idx: $scope.initParams.idx,
        currentPanelData: $scope.currentPanelData,
        itemSize: $scope.trailerData.data.length,
        slideShow: {
          speedTime: {
            fast: 3000,
            medium: 6000,
            slow: 9000
          },
          speedMap: {
            fast: msgLang.speed_fast,
            medium: msgLang.speed_medium,
            slow: msgLang.speed_slow
          },
          nameMap: {
            fast : {name : msgLang.speed_fast, idx : 0},
            medium : {name : msgLang.speed_medium , idx : 1},
            slow : {name : msgLang.speed_slow, idx : 2}
          },
          currentSpeed: 'medium',//default speed
          active: true,//slideshow status
          slideInterval: null
        },
        labelData: {
          speed: msgLang.speed,     // 대문자 확인
          close: msgLang.close
        }
      };
    } else {
      $scope.trailer = {
        idx: $scope.initParams.idx,
        currentPanelData: $scope.currentPanelData,
        itemSize: $scope.trailerData.data.length,
        slideShow: {
          speedTime: {
            fast: 3000,
            medium: 6000,
            slow: 9000
          },
          speedMap: {
            fast: msgLang.speed_fast,
            medium: msgLang.speed_medium,
            slow: msgLang.speed_slow
          },
          nameMap: {
            fast : {name : msgLang.speed_fast, idx : 0},
            medium : {name : msgLang.speed_medium , idx : 1},
            slow : {name : msgLang.speed_slow, idx : 2}
          },
          currentSpeed: 'medium',//default speed
          active: true,//slideshow status
          slideInterval: null
        },
        labelData: {
          speed: msgLang.speed,     // 대문자 확인
          close: msgLang.close
        }
      };
    }

    // time out
    timeoutHelper.headerTimeout();
    timeoutHelper.controlTimeout();

    // scroll size 계산위해 slide open
    $scope.slideOpen = true;
    $scope.slideHide = false;
    $scope.$apply();

    // slide list size
    var width = $element[0].getElementsByClassName('item-slide')[0].offsetWidth;
    var left = $element[0].getElementsByClassName('item-slide')[0].offsetLeft;
    $scope.itemWidth = width + left;
    $scope.slide = {};
    $scope.slide.width = (width + left)* $scope.trailerData.data.length + 'px';
    $scope.$apply();

    initializeScroll();
    $scope.scrollRefresh();

    // default 상태는 slide close
    $scope.slideHide = true;
    $scope.slideOpen = false;
    $scope.$apply();

    setPanel($scope.trailer.idx);
    if($scope.trailer.currentPanelData.type === 'I') {
      slideHelper.resetSlideSpeed();// slide show start
    }
    $scope.$apply();
  };

  var scrollButtonDown = false;

  var onButtonMouseDown = function(e) {
    // console.log('player.onButtonMouseDown');
    e.stopPropagation();
    scrollButtonDown = true;
    e.currentTarget.classList.add('pressed');
  };

  var onButtonMouseUp = function(e) {
    var item = e.currentTarget.getAttribute('item');

    // console.log('player.onButtonMouseUp, item=' + item);
    e.stopPropagation();
    scrollButtonDown = false;
    e.currentTarget.classList.remove('pressed');

    if (e.currentTarget.classList.contains('scroll-prev')) {
      $scope.scrollPageUp();
      timeoutHelper.sliderListTimeout();
    } else if (e.currentTarget.classList.contains('scroll-next')) {
      $scope.scrollPageDown();
      timeoutHelper.sliderListTimeout();
    } else if (e.currentTarget.classList.contains('icon-player')) {
      $scope.executeAction();
    } else if (item.indexOf('btn') === 0) {
      $scope.executeAction();
    }
  };

  var onButtonMouseEnter = function(e) {
    // console.log('player.onButtonMouseEnter');
    e.stopPropagation();

    if (scrollButtonDown)
      e.currentTarget.classList.add('pressed');

    var item = e.target.getAttribute('item');
    $scope.setFocusItem(item, e.target);
  };

  var onButtonMouseLeave = function(e) {
    // console.log('player.onButtonMouseLeave');
    e.stopPropagation();
    e.currentTarget.classList.remove('pressed');
    scrollButtonDown = false;

    $scope.setFocusItem('', null);
  };

  var initMouseEvents = function() {
    // console.log('player.initMouseEvents');
    var element;
    $scope.setMouseEvent($element[0].getElementsByClassName('player_thumb')[0]);

    var controlLength = $element[0].getElementsByClassName('icon-player').length;
    for(var i = 0; i < controlLength; i++) {
      element = $element[0].getElementsByClassName('icon-player')[i];
      $scope.setMouseEvent(element);

      // hover-mode를 제거후, button이 눌렸을 때의 효과처리를 위해
      element.onmouseenter = onButtonMouseEnter;
      element.onmouseleave = onButtonMouseLeave;
      element.onmousedown = onButtonMouseDown;
      element.onmouseup = onButtonMouseUp;
    }

    var btnLength = $element[0].getElementsByClassName('btn').length;
    for(i = 0; i < btnLength; i++) {
      element = $element[0].getElementsByClassName('btn')[i];
      $scope.setMouseEvent(element);

      // hover-mode를 제거후, button이 눌렸을 때의 효과처리를 위해
      element.onmouseenter = onButtonMouseEnter;
      element.onmouseleave = onButtonMouseLeave;
      element.onmousedown = onButtonMouseDown;
      element.onmouseup = onButtonMouseUp;
    }

    var speedLength = $element[0].getElementsByClassName('option-list').length;
    for(i = 0; i < speedLength; i++) {
      $scope.setMouseEvent($element[0].getElementsByClassName('option-list')[i]);
    }

    var slideLength = $element[0].getElementsByClassName('item-slide').length;
    for(i = 0; i < slideLength; i++) {
      $scope.setMouseEvent($element[0].getElementsByClassName('item-slide')[i]);
    }

    if($element[0].getElementsByClassName('scroll-prev').length > 0) {
      var scrollPrev = $element[0].getElementsByClassName('scroll-prev')[0];
      $scope.setMouseEvent(scrollPrev);
      scrollPrev.onmouseenter = onButtonMouseEnter;
      scrollPrev.onmouseleave = onButtonMouseLeave;
      scrollPrev.onmousedown = onButtonMouseDown;
      scrollPrev.onmouseup = onButtonMouseUp;
    }
    if($element[0].getElementsByClassName('scroll-next').length > 0) {
      var scrollNext = $element[0].getElementsByClassName('scroll-next')[0];
      $scope.setMouseEvent(scrollNext);
      scrollNext.onmouseenter = onButtonMouseEnter;
      scrollNext.onmouseleave = onButtonMouseLeave;
      scrollNext.onmousedown = onButtonMouseDown;
      scrollNext.onmouseup = onButtonMouseUp;
    }

    var idx = $scope.initParams.idx;
  };

  // panel : image or movie 재생
  var setPanel = function(idx) {
    if(!$rootScope.spinner.hide && focusManager.getState('loading')) {
      $rootScope.spinner.hideSpinner();
    }

    $scope.trailer.currentPanelData = $scope.trailerData.data[idx];
    $scope.trailer.idx = parseInt(idx);

    if(!$scope.trailer.slideShow.active) {
      slideHelper.clearSlideShow();
    }

    //type: 'V' video, 'I' image
    if($scope.trailer.currentPanelData.type === 'V') {
      $scope.trailer.slideShow.active = false;
      slideHelper.clearSlideShow();// slide show stop

      $scope.isMovie = true;
      //시간값 초기화
      $scope.playCont = 0;// progressbar mouseMove 시 변경되었던 progrssbar 값 초기화
      $scope.begintTick = '00:00:00';
      $scope.endTick = '00:00:00';
      // $scope.controlTick = '00:00:00';
      $scope.mouseOnProgressBar = false;
      $scope.playing = '0';
      $scope.videoEndTime = 0;

      $rootScope.spinner.showSpinner();
      $element[0].getElementsByClassName('movie-player')[0].src = $scope.trailerData.data[idx].url;
      $element[0].getElementsByClassName('movie-player')[0].isPlayControl = false;

    } else if($scope.trailer.currentPanelData.type === 'I') {// 이미지일 경우 progressbar hide 및 동영상 url '' 처리
      $scope.isMovie = false;
      $element[0].getElementsByClassName('movie-player')[0].src = '';
    }
  };

  var showSlide = function() {
    var name;

    // 간헐적으로, slide open button의 tooltip이 남아있는 경우가 있음
    $rootScope.tooltip.hideTooltip();

    if($scope.slideHide) {
      // slide 보이기
      // focus
      name = 'item-' + $scope.trailer.idx;
      element = $element[0].getElementsByClassName('item-' + $scope.trailer.idx)[0];
      $scope.setFocusItem(name, element);

      var targetPos = $scope.itemWidth * ($scope.trailer.idx);// 현재 선택된 item의 위치 계산
      if(targetPos < -scroll.maxScrollX) {
        scroll.scrollTo(targetPos + scroll.x, 0, 100, true);
      } else {
        if(scroll.x > scroll.maxScrollX) {
          scroll.scrollTo(-scroll.maxScrollX + scroll.x, 0, 100, true);
        }
      }
      hideBar();

      $timeout(function() {
        if(!$scope.headHide) {// header close
          $scope.headOpen = false;
          $scope.headHide = true;
        }
        if(!$scope.controlHide) {
          $scope.controlOpen = false; // control close
          $scope.controlHide = true; // control close
        }
        $scope.slideHide = false;
        $scope.$apply();

        // 간헐적으로, slide open button의 tooltip이 남아있는 경우가 있음
        $rootScope.tooltip.hideTooltip();
      }, 300);

      util.async(function() {
        $scope.slideOpen = true;
        $scope.$apply();
        initMouseEvents();
        timeoutHelper.restartTimeout();
      });
    } else {
      // slide 숨기기
      $scope.slideHide = true;
      $scope.slideOpen = false;
      $scope.$apply();

      // focus
      name = 'btnIcon-4';
      element = $element[0].getElementsByClassName('btnIcon-4')[0];
      $scope.setFocusItem(name, element);
    }
  };

  var closeSlide = function() {
    if(!$scope.speedHide) {
      $scope.speedHide = true;
      $scope.speedOpen = false;
      $scope.$apply();
      initMouseEvents();
    }
    // slide open
    $scope.controlHide = false;
    util.async(function() {
      $scope.controlOpen = true;
      $scope.$apply();
      initMouseEvents();

      if(!window.PalmSystem.cursor.visibility) {
        // focus
        var name = 'btnIcon-4';
        element = $element[0].getElementsByClassName('btnIcon-4')[0];
        $scope.setFocusItem(name, element);
        timeoutHelper.restartTimeout();
      } else {
        lastActiveFocus = {};
        lastFocus = {};
      }
    });
    $scope.slideHide = true;
    $scope.slideOpen = false;
    $scope.$apply();
  };

  var showSpeed = function() {
    var name;
    if($scope.speedHide) {
      $scope.speedHide = false;
      util.async(function() {
        $scope.speedOpen = true;
        initMouseEvents();

        // focus
        name = 'speed-' + $scope.trailer.slideShow.nameMap[$scope.trailer.slideShow.currentSpeed].idx;
        element = $element[0].getElementsByClassName(name)[0];
        $scope.setFocusItem(name, element);
        $scope.$apply();
      });
    } else {
      $scope.speedHide = true;
      $scope.speedOpen = false;
      $scope.$apply();
      // focus
      name = 'btnSpeed';
      element = $element[0].getElementsByClassName('btnSpeed')[0];
      $scope.setFocusItem(name, element);
    }
    timeoutHelper.restartTimeout();
  };

  var selectSlideItem = function(target) {
    var idx = target.split('-')[1];
    if(!$scope.trailer.slideShow.active) {// 슬라이드쇼 재생중이지 않은 상태라면
      $scope.trailer.slideShow.active = true;
      $scope.playControl = 'pause';
      if($scope.trailerData.data[idx].type === 'I') {
        slideHelper.resetSlideSpeed(); // image 경우에만 슬라이드쇼 진행
      } else {
        slideHelper.clearSlideShow();
        player.pause();
        $scope.currentTime = 0;
        isPlayControl = true;
      }
    } else {
      $scope.trailer.slideShow.currentSpeed = 'medium';// 썸네일 클릭시 슬라이드쇼 speed reset
      slideHelper.setSlideSpeed(true);
      timeoutHelper.restartTimeout();
    }

    $scope.trailer.slideShow.currentSpeed = 'medium';// 썸네일 클릭시 슬라이드쇼 speed reset
    $scope.$apply();
    setPanel(idx);
    $scope.$apply();

    // [QEVENTSIXT-5184] speed 버튼에 포커스가 이동 됨.
    // 아래는 코멘트 처리
    // slideHelper.setSlideSpeed();
    timeoutHelper.restartTimeout();
  };

  var selectSpeedOption = function() {
    if (!$scope.speedOpen || $scope.slideHide) {
      // control이 숨겨진 상태
      selectControlPopup();
    }

    if(!$scope.speedHide) {
      $scope.speedHide = true;
      $scope.speedOpen = false;
    }
    var curSpeed = focusElement.getAttribute('item').split('-')[1];
    $scope.trailer.slideShow.currentSpeed = curSpeed;
    $scope.$apply();
    slideHelper.setSlideSpeed();
    timeoutHelper.restartTimeout();
  };

  var selectControlPopup = function() {
    // console.log('player.selectControlPopup, $scope.controlHide=' + $scope.controlHide + ', $scope.headHide=' + $scope.headHide + ', $scope.slideHide=' + $scope.slideHide);
    if(($scope.controlHide || $scope.headHide) && $scope.slideHide) {
      $scope.headHide = false;
      $scope.controlHide = false;
      $scope.mouseOnProgressBar = false;
      util.async(function() {
        $scope.headOpen = true;
        $scope.controlOpen = true;
        $scope.$apply();
        initMouseEvents();
        timeoutHelper.restartTimeout();

        if(!window.PalmSystem.cursor.visibility) {
          // Play 버튼에 Focus
          var name = 'btnIcon-2';
          var element = $element[0].getElementsByClassName('btnIcon-2')[0];
          $scope.setFocusItem(name, element);
        }
      });
    } else {
      $scope.headHide = true;
      $scope.controlHide = true;
      $scope.headOpen = false;
      $scope.controlOpen = false;

      $rootScope.tooltip.hideTooltip();

      $scope.$apply();
    }
    if(!$scope.slideHide) {
      // speed popup close
      $scope.speedHide = true;
      $scope.speedOpen = false;
      // slide popup close
      $scope.slideHide = true;
      $scope.slideOpen = false;
      $scope.$apply();
    }
  };

  var closeControlPopup = function(showThreeButtons) {
    // console.log('player.closeControlPopup');
    $scope.headHide = true;
    $scope.controlHide = true;
    $scope.headOpen = false;
    $scope.controlOpen = false;

    $rootScope.tooltip.hideTooltip();

    if (showThreeButtons) {
      $scope.hideTrailerEndButtons = false;
    }

    // $scope.$apply();
  };

  // slide show control
  var slideHelper = {
    setSlideSpeed : function(isFocus) {// 선택된 속도로 슬라이드쇼 실행
      // console.log('player.slideHelper.setSlideSpeed');
      slideHelper.clearSlideShow();
      // focus
      var name = 'btnSpeed';
      element = $element[0].getElementsByClassName('btnSpeed')[0];
      if(!isFocus) {
        $scope.setFocusItem(name, element);
      }

      if($scope.trailer.slideShow.active) {
        if($scope.trailer.currentPanelData.type === 'I') {
          slideHelper.resetSlideSpeed();
        }
      }
    },

    resetSlideSpeed : function() {// 슬라이드쇼 실행
      // console.log('player.slideHelper.resetSlideSpeed');
      if ($scope.trailer.slideShow.active) {
        $scope.trailer.slideShow.slideInterval = $interval(function () {
          if (!$scope.trailer.slideShow.active) {
            return;
          }
          screenSaver.block();
          slideHelper.nextContent();
        }, $scope.trailer.slideShow.speedTime[$scope.trailer.slideShow.currentSpeed]);
      }
    },

    clearSlideShow : function() {// 슬라이드쇼 cancel
      // console.log('player.slideHelper.clearSlideShow');
      if ($scope.trailer.slideShow.slideInterval) {
        $interval.cancel($scope.trailer.slideShow.slideInterval);
        $scope.trailer.slideShow.slideInterval = undefined;
        screenSaver.unBlock();
      }
    },

    nextContent : function(e) {// 다음 content 재생
      var idx = $scope.trailer.idx, itemSize = $scope.trailer.itemSize;
      idx = (idx == (itemSize - 1))? 0 : ++idx;
      setPanel(idx);
    },

    prevContent : function(e) {// 이전 content 재생
      var idx = $scope.trailer.idx, itemSize = $scope.trailer.itemSize;
      idx = (idx === 0)? (itemSize - 1) : --idx;
      if($scope.trailer.currentPanelData.type === 'V') {
        if(parseInt($scope.currentTime, 10) <= 5) {
          setPanel(idx);
        } else {
          $element[0].getElementsByClassName('movie-player')[0].isPlayControl = true;
          $scope.currentTime = 0;
          $scope.playing = 0;
        }
      } else {
        setPanel(idx);
      }
    }
  };

  var timeoutHelper = {// header, control, slide, slideshow popup timeout
    headerTimeout : function() {
      // console.log('player.headerTimeout, outter, timeout in ' + CONTROL_HIDE_TIMEOUT + ' seconds.');
      $timeout.cancel(_headerTimeout);
      _headerTimeout = $timeout(function() {
        // console.log('player.headerTimeout, inner');
        $scope.headHide = true;
        $scope.headOpen = false;
        $scope.$apply();
      }, CONTROL_HIDE_TIMEOUT);
    },

    controlTimeout: function(clicked) {
      var timeout = CONTROL_HIDE_TIMEOUT;
      if (clicked) {
        timeout = CONTROL_HIDE_ONCLICK_TIMEOUT;
      }

      if (util.isAWSServer()) {
        // UX_2016_webOS_Initial_LG Content Store_v1.4.7_160601.pdf
        // 3. Audio guidance On 한 경우 Progress bar timeout 5초에서 10초로 변경
        if (device.isAudioGuidance) {
          timeout *= 2;
        }
      }

      // console.log('player.controlTimeout, outter, clicked=' + clicked +
      //   ' , timeout in ' + timeout +' seconds.');
      $timeout.cancel(_controlTimeout);
      _controlTimeout = $timeout(function() {
        // console.log('player.controlTimeout, inner');
        $rootScope.tooltip.hideTooltip();
        $scope.controlHide = true;
        $scope.controlOpen = false;
        $scope.$apply();
      }, timeout);
    },

    sliderListTimeout : function() {
      // console.log('player.sliderListTimeout, outter, timeout in ' + CONTROL_HIDE_TIMEOUT + ' seconds.');
      $timeout.cancel(_sliderTimeout);
      _sliderTimeout = $timeout(function() {
        // console.log('player.sliderListTimeout, inner');
        $scope.slideHide = true;
        $scope.slideOpen = false;
        $scope.$apply();
      }, CONTROL_HIDE_TIMEOUT);
    },

    threeBtnsTimeout : function() {
      if (_threeBtnsTimeout) {
        $timeout.cancel(_threeBtnsTimeout);
      }
      if ($scope.hideTrailerEndButtons) {
        // 버튼들이 이미 없어짐
        return;
      }
      _threeBtnsTimeout = $timeout(function() {
        if ($scope.hideTrailerEndButtons) {
          // 버튼들이 이미 없어짐
          return;
        }
        $scope.closePlayer();
      }, CONTROL_HIDE_TIMEOUT * 2);
    },

    restartTimeout: function(clicked) {
      // console.log('player.restartTimeout, clicked=' + clicked);
      if ($scope.headOpen) {
        timeoutHelper.headerTimeout();
      }
      if($scope.controlOpen) {
        timeoutHelper.controlTimeout(clicked);
      }
      if($scope.slideOpen) {
        timeoutHelper.sliderListTimeout();
      }
    },

    cancelAll : function() {
      if (_headerTimeout) {
        $timeout.cancel(_headerTimeout);
        _headerTimeout = null;
      }

      if (_controlTimeout) {
        $timeout.cancel(_controlTimeout);
        _controlTimeout = null;
      }

      if (_sliderTimeout) {
        $timeout.cancel(_sliderTimeout);
        _sliderTimeout = null;
      }

      if (_threeBtnsTimeout) {
        $timeout.cancel(_threeBtnsTimeout);
        _threeBtnsTimeout = null;
      }

      if (_movieLoadingTimeout) {
        $timeout.cancel(_movieLoadingTimeout);
        _movieLoadingTimeout = null;
      }
    }
  };

  var videoHelper = {
      makeDurationTime2DisplayTime : function(duration) {
        var intvalue = Math.floor(duration);
        if (intvalue < 0) {
          intvalue = 0;
        }
        var min = Math.floor(intvalue / 60);
        var sec = Math.floor(intvalue - 60 * min);
        var h = '00';
        if((min / 60) > 1) {
          h = Math.floor(min / 60);
          h = (h < 10)? '0' + h : h;
          min = min % 60;
        }
        if(min < 10) {
          min = '0' + min;
        }
        return h + ':' + min + ':' + ((sec < 10)? '0' + sec : sec);
    }
  };

  var showPointer = function (posX, barWidth) {
    // console.log('player.showPointer, posX=' + posX +
    //   ', barWidth=' + barWidth);
    var elmnts = $element[0].getElementsByClassName('empty-pointer');

    elmnts[0].style.left = null;

    var ptWidth = elmnts[0].offsetWidth;
    if (!ptWidth) {
      // 최초로 그려지기 전에는 ptWidth값이 비어있음
      ptWidth = 30;
    }

    var pointerLeft = parseInt(posX) - ptWidth / 2;

    // console.log('player.showPointer 1, posX=' + posX + ', pointerLeft=' + pointerLeft +
    //   ', ptWidth=' + ptWidth);

    elmnts[0].style.left = pointerLeft + 'px';
    elmnts[0].style.display = null;

    showPointerTime(pointerLeft, barWidth);

    // UX_2016_webOS_Initial_LG Content Store_v1.4.7_160601.pdf
    // 2. Progress bar가 노출된 상태에서 상방향키 인가하여 progress bar에서 포커스 위치할 경우
    // <”jump to”> + 해당 시간 으로 audio guidance 적용
    if (util.isAWSServer()) {
      if (device.isAudioGuidance &&
        $scope.controlTick &&
        ($scope.controlTick.split(':').length === 3)) {
        var speech = msgLang.audio_trailer_jump || 'jump to';
        speech += '. ';
        speech += $scope.controlTick;

        var params = {
          text: speech,
          clear: true,
          duplication: true
        };
        audioGuidance.call(params);
      }
    }
  };

  var hidePointer = function () {
    // console.log('player.hidePointer');
    var elements = $element[0].getElementsByClassName('empty-pointer');
    if (elements && elements.length > 0) {
      elements[0].style.display = 'none';
    }
    hidePointerTime();
  };

  var showPointerTime = function (pointerLeft, barWidth) {
    var elmts = $element[0].getElementsByClassName('current-time');
    if (!elmts || elmts.length < 1) {
      return;
    }

    var txtWidth = elmts[0].offsetWidth;
    if (!txtWidth) {
      // 최초로 그려지기 전에는 txtWidth값이 비어있음
      txtWidth = 75;
    }

    var txtLeft = pointerLeft;

    // 오른쪽에 txt 위치 (txtWidth의 반만큼 이동)
    txtLeft += txtWidth;
    if ((txtLeft + (txtWidth * 2)) >= barWidth) {
      // 왼쪽에 txt 위치
      txtLeft = pointerLeft;
      txtLeft -= (txtWidth + txtWidth/2);
    }

    // console.log('player.showPointerTime 1, pointerLeft=' + pointerLeft +
    //   ', txtWidth=' + txtWidth +
    //   ', txtLeft=' + txtLeft);

    elmts[0].style.left = txtLeft + 'px';
    elmts[0].style.display = null;
  };

  var hidePointerTime = function() {
    // console.log('player.hidePointerTime');
    var elements = $element[0].getElementsByClassName('current-time');
    if (elements && elements.length > 0) {
      elements[0].style.display = 'none';
    }
  };

  /* progressbar control */
  $scope.onMouseLeave = function ($event) {
    // console.log('player.onMouseLeave');
    if(!$rootScope.spinner.hide) {
      return;
    }
    $scope.mouseOnProgressBar = false;
    $scope.controlTick = '';
    hidePointer();
  };

  $scope.onMouseMove = function ($event) {
    // console.log('player.onMouseMove');
    if (!$scope.mouseOnProgressBar && timeClickedOnProgressbar) {
      timeClickedOnProgressbar = undefined;

      if (Math.floor($scope.currentTime) === Math.floor(timeClickedOnProgressbar)) {
        // progress bar에서 다른 시간이 선택된 상태에서, 아직 로딩중임
        return;
      }
    }

    $scope.mouseOnProgressBar = true;

    if(!$rootScope.spinner.hide) {
      return;
    }

    var elementProgress = $element[0].getElementsByClassName('player-progress')[0];
    var progressBarX = $event.x - elementProgress.getBoundingClientRect().left;
    var barWidth = elementProgress.offsetWidth;
    var timeOnCursor = ($scope.videoEndTime * (parseInt(progressBarX))) / barWidth;

    $scope.controlTickTime = timeOnCursor;
    $scope.controlTick = videoHelper.makeDurationTime2DisplayTime(timeOnCursor);

    // console.log('player.onMouseMove, bar_offsetWidth=' + barWidth +
    //   ', bar_boundingClientRect_width=' + elementProgress.getBoundingClientRect().width);

    showPointer(progressBarX, elementProgress.getBoundingClientRect().width);

    // progress bar에서 포인터 이동중에는 timer를 재시작하도록
    if($scope.controlOpen) {
      timeoutHelper.controlTimeout();
    }
  };

  $scope.onMouseDown = function ($event) {
    // console.log('player.onMouseDown');
    $event.stopPropagation();

    control.progressbarClick();
    timeoutHelper.restartTimeout();
  };

  /* 재생 종료 후 호출 */
  $scope.playFinished = function() {
    // console.log('player.playFinished');
    $rootScope.spinner.hideSpinner();

    if ($scope.fromTrailerBtn) {
      $scope.playControl = 'play';

      // 동영상 재생 부분을 검정으로
      $scope.hideScreenDim = false;
      closeControlPopup(true);

      // default focus
      var name = 'btnPlayMovie';
      lastThreeBtnsFocusItem = name;
      element = $element[0].getElementsByClassName(name)[0];
      $scope.setFocusItem(name, element);

      timeoutHelper.threeBtnsTimeout();
    } else {
      $scope.isMovie = false;
      $scope.trailer.slideShow.active = true;
      $element[0].getElementsByClassName('movie-player')[0].src = '';// player src 초기화
      slideHelper.nextContent();// 다음 content show
      if($scope.trailer.currentPanelData.type === 'I' && $scope.trailer.slideShow.active) {
        slideHelper.resetSlideSpeed();// 이미지라면 슬라이드쇼 재실행
      }
    }
  };

  /* 재생 control */
  var control = {
    playPause : function(playPressed) {
      if(isSeeking) {
        //연속적인 seek을 누르는 상황을 막기위함
        return;
      }

      if (playPressed) {
        // 재생하기
        $scope.trailer.slideShow.active = true;
        $scope.playControl = 'pause';
        $scope.audioGuidance($scope, 'play');
      } else {
        // 멈추기
        $scope.trailer.slideShow.active = false;
        $scope.playControl = 'play';
        $scope.audioGuidance($scope, 'pause');
      }

      $scope.$apply();

      if($scope.trailer.currentPanelData.type === 'V') {
        if(player.paused) {
          player.play();
        } else {
          player.pause();
        }
      } else {
        if($scope.trailer.slideShow.active) {
          slideHelper.resetSlideSpeed();
        } else {
          slideHelper.clearSlideShow();
        }
      }
    },

    progressbarClick : function() {
      // progrss width : 동영상 전체 시간 = x : 현재위치재생시간
      var tooltipLeft = $element[0].getElementsByClassName('empty-pointer')[0].offsetLeft;
      var tooltipWidth = $element[0].getElementsByClassName('empty-pointer')[0].offsetWidth;
      var progressbarWidth = $element[0].getElementsByClassName('player-progress')[0].offsetWidth;
      var rate = ((tooltipLeft + tooltipWidth) / progressbarWidth);
      $element[0].getElementsByClassName('movie-player')[0].isPlayControl = true;// moviePlayer 에서 지정된 위치로의 재생위해

      var controlTickTime = $scope.controlTickTime;
      if (!controlTickTime) {
        var barWidth = $element[0].getElementsByClassName('player-progress')[0].offsetWidth;
        var pointerLeft = parseInt($element[0].getElementsByClassName('empty-pointer')[0].style.left, 10);
        controlTickTime = ($scope.videoEndTime * pointerLeft) / barWidth;
      }

      // console.log('player.progressbarClick 0, controlTickTime=' + controlTickTime);
      $scope.currentTime = controlTickTime;
      $scope.playing = parseInt(((tooltipLeft + tooltipWidth) / progressbarWidth) * 100);
      if ($scope.focusItem !== 'pointer') {
        $scope.mouseOnProgressBar = false;
      } else {
      }
      timeClickedOnProgressbar = controlTickTime;
      $scope.begintTick = videoHelper.makeDurationTime2DisplayTime(controlTickTime);

      if ($scope.currentTime >= $scope.videoEndTime) {
        // console.log('player.progressbarClick 3, finish play');
        $scope.playFinished();
      } else {
        if (util.isAWSServer()) {
          // UX_2016_webOS_Initial_LG Content Store_v1.4.7_160601.pdf
          // 플레이어에 포커스 후 [확인]키 인가 시, <현재 시간>으로 발화해주는 것도 포함
          if (device.isAudioGuidance &&
            $scope.controlTick &&
            ($scope.controlTick.split(':').length === 3)) {
            var params = {
              text: $scope.controlTick,
              clear: true,
              duplication: true
            };
            audioGuidance.call(params);
          }
        }
      }

      timeoutHelper.restartTimeout(true);
      //console.log('player.progressbarClick 3, $scope.begintTick=' + $scope.begintTick + ', controlTickTime=' + controlTickTime);
    }
  };

  var moveFocusByKeyOnTrailerEndButtons = function(keyCode) {
    var focusMap = [{
      'from': 'btnPlayMovie',
      'to': {
        'up': {'doNothing': true},
        'down': {'item': 'btnReplayTrailer'}
      }
    }, {
      'from': 'btnReplayTrailer',
      'to': {
        'up': {'item': 'btnPlayMovie'},
        'down': {'item': 'btnCloseTrailer'}
      }
    }, {
      'from': 'btnCloseTrailer',
      'to': {
        'up': {'item': 'btnReplayTrailer'},
        'down': {'doNothing': true}
      }
    }];

    for (i = 0; i < focusMap.length; i++) {
      if (focusMap[i].from === focusItem) {
        var name;
        switch (keyCode) {
          case keyHandler.LEFT:
            if (focusMap[i].to.left) {
              if (focusMap[i].to.left.doNothing)
                return true;
              name = focusMap[i].to.left.item;
            }
            break;
          case keyHandler.RIGHT:
            if (focusMap[i].to.right) {
              if (focusMap[i].to.right.doNothing)
                return true;
              name = focusMap[i].to.right.item;
            }
            break;
          case keyHandler.UP:
            if (focusMap[i].to.up) {
              if (focusMap[i].to.up.doNothing)
                return true;
              name = focusMap[i].to.up.item;
            }
            break;
          case keyHandler.DOWN:
            if (focusMap[i].to.down) {
              if (focusMap[i].to.down.doNothing)
                return true;
              name = focusMap[i].to.down.item;
            }
            break;
        }

        if (name) {
          element = $element[0].getElementsByClassName(name)[0];
          $scope.setFocusItem(name, element);
          return true;
        }
      }
    }
    return false;
  };

  $scope.moveFocusByKey = function(keyCode) {
    // console.log('player.moveFocusByKey, keyCode=' + keyCode);
    focusItem = $scope.focusItem;

    if (keyCode === keyHandler.BACK) {
      $scope.executeByKey(keyCode);
      return;
    }

    if (!$scope.hideTrailerEndButtons) {
      // trailer 재생 종료후, 3개의 버튼이 표시된 상태

      if (!moveFocusByKeyOnTrailerEndButtons(keyCode)) {
        // 이전 focus
        var name, element;
        if (lastThreeBtnsFocusItem) {
          name = lastThreeBtnsFocusItem;
        }
        if (!name) {
          // default focus
          name = 'btnPlayMovie';
        }
        if (!element) {
          element = $element[0].getElementsByClassName(name)[0];
        }

        $scope.setFocusItem(name, element);
      }

      return;
    }

    if($scope.controlOpen) {
      moveFocusFromControl(keyCode);
    } else if($scope.slideOpen) {
      if($scope.speedOpen &&
        ((focusItem.indexOf('speed') >= 0) || (focusItem === 'btnSpeed'))) {
        moveFocusFromSpeed(keyCode);
      } else {
        moveFocusFromSlide(keyCode);
      }
    } else {
      moveFocusFromDefault(keyCode);
    }
  };

  var moveFocusFromDefault = function (keyCode) {
    // console.log('player.moveFocusFromDefault, keyCode=' + keyCode);
    var curIdx, itemCnt, focusItem, itemName, scrollX, hidden, name, element;
    if (keyCode === keyHandler.UP || keyCode === keyHandler.DOWN) {
      if($scope.controlHide) {
        $scope.controlHide = false;
        $scope.controlOpen = true;
        $scope.$apply();
        timeoutHelper.restartTimeout();

        // focus
        name = 'btnIcon-2';
        element = $element[0].getElementsByClassName('btnIcon-2')[0];
      } else {
        $scope.controlHide = true;
        $scope.controlOpen = false;
        $scope.$apply();
      }
    } else if (keyCode == keyHandler.RIGHT) {
      if($scope.trailer.currentPanelData.type === 'V') {
        // 동영상일 경우 10초 앞으로
        if (($scope.currentTime + 10) < $scope.videoEndTime) {
          //var tempVal = Math.pow(10, -1);     // 10초 단위로 이동
          $scope.currentTime += 10; //Math.ceil(($scope.currentTime+1)*tempVal)/tempVal;
        } else {
          $scope.currentTime = $scope.videoEndTime;
          $scope.playFinished();
        }

        $element[0].getElementsByClassName('movie-player')[0].isPlayControl = true;
      } else if($scope.trailer.currentPanelData.type == 'I') {
        // slide timer 재시작
        slideHelper.clearSlideShow();
        slideHelper.resetSlideSpeed();
        slideHelper.nextContent();
        $scope.$apply();
      }
    } else if (keyCode == keyHandler.LEFT) {
      if($scope.trailer.currentPanelData.type === 'V') {
        // 동영상일 경우 10초 뒤로
        if (($scope.currentTime - 10) >= 0) {
          //var tempVal = Math.pow(10, -1);       // 10초 단위로 이동
          $scope.currentTime -= 10; //Math.floor(($scope.currentTime-1)*tempVal)/tempVal;
        } else {
          $scope.currentTime = 0;
        }
        $element[0].getElementsByClassName('movie-player')[0].isPlayControl = true;
      } else if($scope.trailer.currentPanelData.type == 'I') {
        // slide timer 재시작
        slideHelper.clearSlideShow();
        slideHelper.resetSlideSpeed();
        slideHelper.prevContent();
        $scope.$apply();
      }
    }

    if (name && element) {
      $scope.setFocusItem(name, element);
    }
  };

  var moveFocusFromSpeed = function(keyCode) {
    var curIdx, itemCnt, focusItem, itemName, scrollX, hidden, name, element;
    focusItem = $scope.focusItem;
    if(focusItem.split('-').length > 1) {
      curIdx = parseInt(focusItem.split('-')[1]);
    }
    itemName = 'speed';
    itemCnt = $element[0].getElementsByClassName('option-list').length;

    if (keyCode == keyHandler.UP) {
      if ((curIdx === undefined) && (focusItem === 'btnSpeed')) {
        // [WOSLQEVENT-96903] [Service.SDPService.LGStore_TV Show & Movie] [Always] [Minor] [UI] 포커스 다시 안올라감
        // btnSpeed에서 위로 올라갈 때
        curIdx = itemCnt;
      }
      if(curIdx - 1 < 0) return;
      name = itemName + '-' + (curIdx - 1);
      element = $element[0].getElementsByClassName(itemName  + '-' + (curIdx - 1))[0];
    } else if (keyCode == keyHandler.DOWN) {
      if(curIdx + 1 >= itemCnt) {
        name = 'btnSpeed';
        element = $element[0].getElementsByClassName('btnSpeed')[0];
      } else {
        name = itemName  + '-' + (curIdx + 1);
        element = $element[0].getElementsByClassName(itemName  + '-' + (curIdx + 1))[0];
      }
    } else if (keyCode == keyHandler.RIGHT) {
    } else if (keyCode == keyHandler.LEFT) {
    }

    if (name && element) {
      $scope.setFocusItem(name, element);
      timeoutHelper.restartTimeout();
    }
  };

  var selectImageFromSlide = function(index, moveLeft) {
    // console.log('player.selectImageFromSlide, index=' + index + ', moveLeft=' + moveLeft);
    var name, element, hidden;
    var outOfRange = false;

    if($scope.focusItem.indexOf('item-') >= 0) {
      element = $element[0].getElementsByClassName($scope.focusItem)[0];
    }

    if (element && element.getBoundingClientRect().right < 0) {
      outOfRange = true;
    } else if (element && (scroll.wrapperW < element.getBoundingClientRect().left)) {
      outOfRange = true;
    } else {
      name = 'item-' + (index);
      element = $element[0].getElementsByClassName(name)[0];

      if (element) {
        if (moveLeft) {
          scrollX = element.getBoundingClientRect().left - scroll.wrapperOffsetLeft - scroll.x;
          if (scrollX < -scroll.x) {
            hidden = true;
            scrollX = -scrollX;
          }
        } else {
          scrollX = element.getBoundingClientRect().left + element.offsetWidth - scroll.wrapperOffsetLeft - scroll.x;
          if (scrollX > scroll.wrapperW - scroll.x) {
            hidden = true;
            scrollX = scroll.wrapperW - scrollX;
          }
        }
      }
    }

    if (outOfRange) {
      var i, name0, element0;
      if (element && element.getBoundingClientRect().left < 0) {
        // 왼쪽에
        for (i = 0 ; i < $scope.trailer.itemSize ; i++) {
          name0 = 'item-' + (i);
          element0 = $element[0].getElementsByClassName(name0)[0];
          if (element0.getBoundingClientRect().left > 0) {
            $scope.setFocusItem(name0, element0);
            return;
          }
        }
      } else {
        // 오른쪽에
        for (i = $scope.trailer.itemSize - 1 ; i > 0 ; i--) {
          name0 = 'item-' + (i);
          element0 = $element[0].getElementsByClassName(name0)[0];
          if (element0.getBoundingClientRect().right < scroll.wrapperW) {
            $scope.setFocusItem(name0, element0);
            return;
          }
        }
      }
    }

    if (name && element) {
      $scope.setFocusItem(name, element);
      timeoutHelper.restartTimeout();
      if (hidden) {
        scrollByKey = true;
        scroll.scrollTo(scrollX, 0, 300, false);
        move(scrollX, true);
      }
    }
  };

  var moveFocusFromSlide = function(keyCode) {
    var curIdx, itemCnt, focusItem, itemName, scrollX, hidden, name, element;
    focusItem = $scope.focusItem;
    // console.log('player.moveFocusFromSlide, focusItem=' + focusItem + ', keyCode=' + keyCode);

    // keyHandler.moveFocus 에서 바뀐 것을, 원복
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

    if(focusItem.split('-').length > 1) {
      curIdx = parseInt(focusItem.split('-')[1]);
    }
    if(focusItem.indexOf('item') >= 0) {
      itemName = 'item';
      itemCnt = $element[0].getElementsByClassName('item-slide').length;
    } else if(focusItem === 'imgPoster' &&
      ((keyCode == keyHandler.RIGHT) || (keyCode == keyHandler.LEFT))) {
      // preview 이미지에 focus가 있는 경우
      curIdx = $scope.trailer.idx;
      if ((curIdx < 0) || (curIdx >= $scope.trailer.itemSize)) {
        curIdx = 0;
      }
      selectImageFromSlide(curIdx);
      return;
    } else {
      // button focus
    }

    if (keyCode == keyHandler.UP) {
      if(!$scope.speedOpen && focusItem == 'btnSpeed') {
        return;
      } else if($scope.speedOpen && focusItem == 'btnSpeed') {// speed popup option
        name = 'speed-' + ($element[0].getElementsByClassName('option-list').length - 1);
        element = $element[0].getElementsByClassName(name)[0];
      } else if(itemName == 'item') {// slide popup : list item → button
        $scope.focusFromItem();
      } else if(focusItem == 'scroll-prev' || focusItem == 'scroll-next'){// scroll → item
        $scope.focusFromScroll(focusItem);
      }
    } else if (keyCode == keyHandler.DOWN) {
      if(focusItem == 'btnSpeed' || focusItem == 'btnClose') {// button → slide list item
        $scope.focusFromScroll('button');
      } else if($scope.scrollHide) {
        return;
      } else if(itemName == 'item') {// slide list item → scroll 영역
        $scope.focusToScroll();
      }
    } else if (keyCode == keyHandler.RIGHT) {
      if(focusItem == 'btnSpeed') {// speed button → close button
        name = 'btnClose';
        element = $element[0].getElementsByClassName(name)[0];
        $scope.setFocusItem(name, element);
      } else if(focusItem == 'scroll-prev') {
        name = 'scroll-next';
        element = $element[0].getElementsByClassName('scroll-next')[0];
        $scope.setFocusItem(name, element);
      } else if(focusItem == 'btnClose' || focusItem == 'scroll-next') {
        return;
      } else {
        if(curIdx + 1 >= itemCnt) {
          return;
        }
        selectImageFromSlide(curIdx + 1, false);
      }
    } else if (keyCode == keyHandler.LEFT) {
      if(focusItem == 'btnClose') {// speed button → close button
        name = 'btnSpeed';
        element = $element[0].getElementsByClassName(name)[0];
        $scope.setFocusItem(name, element);
      } else if(focusItem == 'scroll-next') {
        name = 'scroll-prev';
        element = $element[0].getElementsByClassName(name)[0];
        $scope.setFocusItem(name, element);
      } else if(focusItem == 'btnSpeed' || focusItem == 'scroll-prev') {
        return;
      } else {// slide list 영역
        selectImageFromSlide(curIdx - 1, true);
      }
    }
  };

  var moveFocusFromControl = function(keyCode) {
    // console.log('player.moveFocusFromControl, keyCode=' + keyCode);
    var curIdx, itemCnt, focusItem, itemName, scrollX, hidden, name, element;
    var elementProgress, barWidth, oneSecondWidth, pointerTime, pointerLeft;

    focusItem = $scope.focusItem;
    if (!focusItem) {
      // 현재 아무것도 선택되지 않은 상태
      var target = $element[0].getElementsByClassName('btnIcon-2')[0];
      if (target) {
        var item = target.getAttribute('item');
        $scope.setFocusItem(item, target);
      }
      return;
    } else if(focusItem === 'imgPoster') {
      curIdx = 2;
    } else if(focusItem.split('-').length > 1) {
      curIdx = parseInt(focusItem.split('-')[1]);
    }
    itemName = 'btnIcon';
    itemCnt = $element[0].getElementsByClassName('icon-player').length;

    // keyHandler.moveFocus 에서 바뀐 것을, 원복
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

    if (keyCode == keyHandler.UP) {
      if ($scope.isMovie && focusItem === 'btnIcon-2') {
        // show progress bar pointer and move focus to
        name = 'pointer';
        element = $element[0].getElementsByClassName('empty-pointer')[0];

        elementBar = $element[0].getElementsByClassName('bar-play')[0];
        pointerLeft = elementBar.getBoundingClientRect().width;

        elementProgress = $element[0].getElementsByClassName('player-progress')[0];
        barWidth = elementProgress.getBoundingClientRect().width;

        $scope.controlTickTime = ($scope.videoEndTime * pointerLeft) / barWidth;
        $scope.controlTick = videoHelper.makeDurationTime2DisplayTime($scope.controlTickTime);
        $scope.mouseOnProgressBar = true;

        showPointer(pointerLeft, barWidth);
      } else {
        // hide control
        $rootScope.tooltip.hideTooltip();
        $scope.controlHide = true;
        $scope.controlOpen = false;
        $scope.$apply();
      }
    } else if (keyCode == keyHandler.DOWN) {
      if (focusItem === 'pointer') {
        name = 'btnIcon-2';
        element = $element[0].getElementsByClassName('btnIcon-2')[0];
        $scope.controlTick = videoHelper.makeDurationTime2DisplayTime($scope.currentTime);

        hidePointer();
      } else {
        // hide control
        $rootScope.tooltip.hideTooltip();
        $scope.controlHide = true;
        $scope.controlOpen = false;
        $scope.$apply();
      }
    } else if (keyCode == keyHandler.RIGHT) {
      if (focusItem === 'pointer') {
        console.log('player.moveFocusFromControl, 우측으로 10초 이동');
        // pointer를 우측으로 10초 이동

        elementProgress = $element[0].getElementsByClassName('player-progress')[0];
        barWidth = elementProgress.getBoundingClientRect().width;
        oneSecondWidth = elementProgress.getBoundingClientRect().width / $scope.videoEndTime;

        if ($scope.mouseOnProgressBar && $scope.controlTickTime) {
          pointerTime = $scope.controlTickTime;
        } else {
          pointerLeft = parseInt($element[0].getElementsByClassName('empty-pointer')[0].style.left, 10);
          pointerTime = $scope.videoEndTime * pointerLeft / elementProgress.getBoundingClientRect().width;
          pointerTime = Math.ceil(pointerTime);
        }

        // 바로 이전의 10초 단위 위치 찾기
        pointerTime = parseInt(pointerTime / 10, 10) * 10;

        // 10초 추가
        pointerTime += 10;
        pointerLeft = pointerTime * oneSecondWidth;

        if (pointerTime > $scope.videoEndTime || pointerLeft > barWidth) {
          pointerLeft = barWidth;
          pointerTime = $scope.videoEndTime;
        }

        $scope.controlTickTime = pointerTime;
        $scope.controlTick = videoHelper.makeDurationTime2DisplayTime($scope.controlTickTime);
        $scope.mouseOnProgressBar = true;

        showPointer(pointerLeft, barWidth);

        timeoutHelper.restartTimeout();
        return;
      }

      if (device.isRTL) {
        if ((curIdx - 1) < 0) {
          // back 버튼이 가장 오른쪽 버튼
          return;
        }
      } else {
        if (curIdx > 3) {
          // slide show 버튼이 가장 오른쪽 버튼
          return;
        }
      }

      if ($scope.isMovie) {
        // UX 3.0, trailer인 경우 btnIcon-1, btnIcon-3 버튼 숨겨짐
        if (!device.isRTL && curIdx === 2) {
          return;
        } else if (curIdx === 0) {
          curIdx = 1;
        }
      }

      curIdx++;
      if (device.isRTL) {
        if (curIdx === 4) {
          // forward -> back
          curIdx = 0;
        } else if (curIdx > 4) {
          // slide show -> backward
          curIdx = 1;
        } else if ($scope.isMovie && (curIdx === 3)) {
          // isMovie, play -> back
          curIdx = 0;
        }
      }

      name = itemName  + '-' + (curIdx);
      element = $element[0].getElementsByClassName(itemName  + '-' + curIdx)[0];
    } else if (keyCode == keyHandler.LEFT) {
      if (focusItem === 'pointer') {
        console.log('player.moveFocusFromControl, 좌측으로 10초 이동');
        // pointer를 좌측으로 10초 이동

        elementProgress = $element[0].getElementsByClassName('player-progress')[0];
        barWidth = elementProgress.getBoundingClientRect().width;
        oneSecondWidth = elementProgress.getBoundingClientRect().width / $scope.videoEndTime;

        if ($scope.mouseOnProgressBar && $scope.controlTickTime) {
          pointerTime = $scope.controlTickTime;
        } else {
          pointerLeft = parseInt($element[0].getElementsByClassName('empty-pointer')[0].style.left, 10);
          pointerTime = $scope.videoEndTime * pointerLeft / elementProgress.getBoundingClientRect().width;
        }

        // 바로 이후의 10초 단위 위치 찾기
        pointerTime = Math.ceil(pointerTime + (10 - 1));
        pointerTime = parseInt(pointerTime / 10, 10) * 10;

        // 10초 이전
        pointerTime -= 10;
        pointerLeft = pointerTime * oneSecondWidth;

        if (pointerTime < 0 || pointerLeft < 0) {
          pointerTime = 0;
          pointerLeft = 0;
        }

        $scope.controlTickTime = pointerTime;
        $scope.controlTick = videoHelper.makeDurationTime2DisplayTime($scope.controlTickTime);
        $scope.mouseOnProgressBar = true;

        showPointer(pointerLeft, barWidth);

        // console.log('player, controlTickTime=' + $scope.controlTickTime +
        //   ', controlTick=' + $scope.controlTick +
        //   ', pointerTime=' + pointerTime);

        timeoutHelper.restartTimeout();
        return;
      }

      if (device.isRTL) {
        if (curIdx > 3)
          return;
      } else {
        if ((curIdx - 1) < 0)
          return;
      }

      if ($scope.isMovie) {
        // UX 3.0, trailer인 경우 btnIcon-1, btnIcon-3 버튼 숨겨짐
        if (curIdx === 2) {
          curIdx = 1;
        }
      }

      curIdx--;
      if (device.isRTL) {
        if ($scope.isMovie && curIdx < 0) {
          // back -> play
          curIdx = 2;
        } else if (curIdx < 0) {
          // back -> forward
          curIdx = 3;
        } else if (curIdx === 0) {
          // backward -> slide show
          curIdx = 4;
        }
      }

      name = itemName  + '-' + curIdx;
      element = $element[0].getElementsByClassName(itemName  + '-' + curIdx)[0];
    } else if (keyCode == keyHandler.BACK) {
      // control이 표시된 상태면, 숨기기
      $scope.executeByKey(keyCode);
      return;
    }

    if (name && element) {
      $scope.setFocusItem(name, element);
      timeoutHelper.restartTimeout();
    }
  };

  $scope.focusFromItem = function() {
    var name, element, i, btn, l, btnLeft, min, gap, itemLeft = focusElement.getBoundingClientRect().left + (focusElement.getBoundingClientRect().width /2);
    l = $element[0].getElementsByClassName('btn-large').length;
    for(i = 0; i < l; i++) {
      btn = $element[0].getElementsByClassName('btn-large')[i];
      btnLeft = btn.getBoundingClientRect().left + (btn.getBoundingClientRect().width /2);
      gap = Math.abs(itemLeft - btnLeft);
      if(typeof min == 'undefined') {
        min = gap;
        name = btn.getAttribute('item');
        element = btn;
        break;
      } else if (min > gap) {
        min = gap;
        name = btn.getAttribute('item');
        element = btn;
        break;
      }
    }
    $scope.setFocusItem(name, element);
  };

  $scope.focusFromScroll = function(target) {
    var elementLeft, scrollX, min, gap, moveToName, hidden, name, element;

    min = Math.abs(scroll.maxScrollX);

    var length = $element[0].getElementsByClassName('item-slide').length;
    for (var i = 0; i < length; i++) {
      obj = $scope.trailerData.data[i];

      name = 'item-' + i;

      temp = $element[0].getElementsByClassName(name)[0];
      if(target == 'button') {
        elementLeft = temp.getBoundingClientRect().left - focusElement.offsetLeft - scroll.wrapperOffsetLeft - scroll.x;
        gap = Math.abs(elementLeft - (-scroll.x));
      } else if (target != 'scroll-prev') {
        elementLeft = temp.getBoundingClientRect().left + temp.offsetWidth - scroll.wrapperOffsetLeft - scroll.x;
        gap = Math.abs(elementLeft - (-scroll.x + scroll.wrapperW));
      } else {
        elementLeft = temp.getBoundingClientRect().left - scroll.wrapperOffsetLeft - scroll.x;
        gap = Math.abs(elementLeft - (-scroll.x));
      }

      if (min >= gap) {
        min = gap;
        scrollX = elementLeft;
        element = temp;
        moveToName = name;
      }
    }

    if (target == 'scroll-prev') {
      if (scrollX < -scroll.x) {
        hidden = true;
        scrollX = -scrollX;
      }
    } else {
      if (scrollX > scroll.wrapperW - scroll.x) {
        hidden = true;
        scrollX = scroll.wrapperW - scrollX;
      }
    }

    if (element) {
      $scope.setFocusItem(element.getAttribute('item'), element);
      if (hidden) {
        scrollByKey = true;
        scroll.scrollTo(scrollX, 0, 300, false);
      }
    }
  };

  $scope.focusToScroll = function() {
    var x = focusElement.offsetLeft + scroll.x;

    var name, element;
    var areaX = parseInt((area.clientWidth + 140) / 2);
    if (x < areaX) {
      name = 'scroll-prev';
      element = $element[0].getElementsByClassName('scroll-prev')[0];
    } else {
      name = 'scroll-next';
      element = $element[0].getElementsByClassName('scroll-next')[0];
    }
    $scope.setFocusItem(name, element);
  };

  $scope.getImgPosterUrl = function() {
    var url;
    if($scope.trailerData &&
      $scope.trailerData.data &&
      $scope.trailerData.data.length > 0 &&
      $scope.trailer.idx < $scope.trailerData.data.length &&
      $scope.trailerData.data[$scope.trailer.idx].type === 'I') {
      url = $scope.trailerData.data[$scope.trailer.idx].url;
    }
    return url;
  };

  $scope.initPlay = function(scope, initParams, data, fromTrailerBtn, itemId, execList, onPageMoveCallback) {
    // console.log('player.initPlay');
    owner = scope;

    lastFocus = {};
    lastActiveFocus = {};
    focusManager.setCurrent($scope, '');
    focusManager.setState('player', true);
    $scope.initParams = initParams;
    $scope.trailerData = data;

    $scope.trailer.idx = $scope.initParams.idx;
    if($scope.trailerData &&
      $scope.trailerData.data &&
      $scope.trailerData.data.length > 0 &&
      $scope.trailer.idx < $scope.trailerData.data.length &&
      $scope.trailerData.data[$scope.trailer.idx].type === 'I') {
      // closePlayer에서 강제로 image url을 제거한 이후, 재진입시 동일한 url이면
      // angular에서 html에 반영하지 않기 때문에
      var url = $scope.trailerData.data[$scope.trailer.idx].url;
      $element[0].getElementsByClassName('player_thumb')[0].setAttribute('style', 'display: block; background-image: url(' + url + ');');
    }

    if(fromTrailerBtn === 'detailApp') {
      $scope.isApp = true;
      $scope.fromTrailerBtn = false;
    } else {
      $scope.fromTrailerBtn = fromTrailerBtn;
    }
    $scope.itemId = itemId;
    $scope.execList0 = execList;
    $scope.onPageMoveCallback = onPageMoveCallback;

    $scope.hideScreenDim = true;
    $scope.hideTrailerEndButtons = true;
    $scope.hide = false;
    $scope.$parent.drawer.hide = true;// drawer hide
    $scope.mouseOnProgressBar = false;

    $scope.begintTick = '';
    $scope.endTick = '';

    hidePointer();

    $scope.$apply();

    util.async(function() {
      // header, control default open
      $scope.headHide = false;
      $scope.headOpen = true;
      $scope.controlHide = false;
      $scope.controlOpen = true;

      // 동영상일 경우 프로그래스바 width가 포인터 icon 정중앙에 위치하도록 icon size 계산
      if($element[0].getElementsByClassName('empty-pointer').length > 0) {
        $scope.iconWidth = (($element[0].getElementsByClassName('empty-pointer')[0].offsetWidth / 2) / $element[0].getElementsByClassName('player-progress')[0].offsetWidth) * 100;
      }
      $scope.open = true;
      $scope.$apply();
      // mouse event
      initMouseEvents();

      if(!window.PalmSystem.cursor.visibility) {
        target = $element[0].getElementsByClassName('btnIcon-2')[0];
        if (target) {
          item = target.getAttribute('item');
          $scope.setFocusItem(item, target);
        }
      }
    });

    drawTrailer();

    if ($scope.isMovie) {
      // 초기화
      if (_movieLoadingTimeout) {
        $timeout.cancel(_movieLoadingTimeout);
        _movieLoadingTimeout = null;
      }

      // loading timer 설정
      _movieLoadingTimeout = $timeout(function() {
        if (!$scope.currentTime) {
          timeoutHelper.cancelAll();
          // 아직 시작 안되었으면, error popup 보여주고 닫기

          // 뒤 늦게 시작되지 않도록 pause 시킴
          player.pause();

          var errorCode = 'playProcess.001';
          var requestParam = {
            type: 'error',
            popupTitle: msgLang.alert_adult_3_2,
            errorMsg: msgLang.alert_adult_3_5,
            errorCodeMsg: 'ERROR CODE: ' + errorCode
          };

          var closeCallback = function() {
            $rootScope.spinner.hideSpinner();
            $scope.closePlayer();
          };

          focusManager.setState('player', false);
          $rootScope.popupApp.showPopup($rootScope, requestParam, closeCallback);
        }

        _movieLoadingTimeout = null;
      }, MOVIE_LOADING_TIMEOUT);
    }

    // 예고편 플레이 후 국가에 맞는 언어로 BtnName 출력 (WOSLQEVENT-65603)
    $scope.trailerEndBtn = {
      playMovie : msgLang.player_button_playmovie,
      replayTrailer : msgLang.player_button_replay,
      close : msgLang.close
    };

    if (initParams.isTvShow) {
      $scope.trailerEndBtn.playMovie = msgLang.player_button_playtvshow;
    }
  };

  var focusHandler = function(e, target, keyCode, rect) {
    if (target != 'main') return;
    e.preventDefault();

    focusToHeader(rect);
  };

  $scope.hidePopup = function(key) {
    focusManager.setState('player', false);

    // 동영상 재생 stop
    $scope.playControl = 'pause';

    if($scope.trailer &&
      $scope.trailer.currentPanelData &&
      $scope.trailer.currentPanelData.type === 'V') {
      player.pause();
      $scope.currentTime = 0;
      $scope.playing = 0;
      $scope.playCont = 0;
      isPlayControl = true;
    }

    timeoutHelper.cancelAll();
    if ($scope.trailer &&
      $scope.trailer.slideShow &&
      $scope.trailer.slideShow.slideInterval) {
      $interval.cancel($scope.trailer.slideShow.slideInterval);
      $scope.trailer.slideShow.slideInterval = undefined;
    }

    slideHelper.clearSlideShow();
    $rootScope.spinner.hideSpinner();

    $scope.open = false;
    $scope.$apply();

    $timeout(function() {
      if (owner === null) return;
      owner.recoverFocus();
    }, 200);

    $timeout(function() {
      if ($scope.open === false) {
        $scope.$parent.drawer.hide = false;// drawer show
        $scope.hide = true;
        $scope.$apply();
      }
    }, 400);
  };

  var end = function(y) {
    $timeout(function() {
      scrollByKey = false;
    }, 100);
  };

  var onmousewheel = function(e) {
    e.preventDefault();

    var deltaX, wheelDelta, wheelSpeed = 3;
    wheelDelta = device.isHD ? 80 : 120;
    wheelDelta = (e.wheelDelta > 0)  ? wheelDelta : -(wheelDelta);

    deltaX = $scope.scroll.x + (wheelDelta * wheelSpeed);
    // moonstone patch
    if (deltaX > 0) deltaX = 0; // deltaX = 100;
    else if (deltaX < $scope.scroll.maxScrollX) deltaX = $scope.scroll.maxScrollX; // deltaX = $scope.scroll.maxScrollX - 100;
    if (!$rootScope.spinner.hide) return;
    if ($scope.scroll.wrapperW >= $scope.scroll.scrollerW) return;
    if (e.wheelDelta < 0 && $scope.scroll.x > 0) return;
    if (e.wheelDelta > 0 && $scope.scroll.x < $scope.scroll.maxScrollX) return;
    $scope.scroll.scrollTo(deltaX, 0, 300);
    move(deltaX, true);

    if(!$scope.slideHide) {
      timeoutHelper.sliderListTimeout();
    }
  };

  var initializeScroll = function() {
    var option = {};
    option.onScrollEnd = end;
    option.useTransform = false;

    var element = $element[0].getElementsByClassName('player-slide-cont')[0];
    scroll = new iScroll(element, option);
    $scope.scroll = scroll;

    var elementScroll = $element[0].getElementsByClassName('scroll-h')[0];

    element.onmousewheel = onmousewheel;
    elementScroll.onmousewheel = onmousewheel;
  };

  $scope.scrollPageUp = function() {
    // console.log('player.scrollPageUp');
    if (scroll.x >= 0) return;
    var width, moveW;
    var scrollW = $element[0].getElementsByClassName('player-slide-cont')[0].offsetWidth;
    if((scroll.x + scrollW) >= 0) {//최상단 page에 focus item 있는 경우
      width = scroll.x;
      moveW = 0;
    } else {// 선택된 아이템 위치에서 페이지 up
      moveW = scroll.x + scrollW;
      width = -scrollW;
    }
    scroll.scrollTo(width, 0, 1600, true);
    move(moveW, true);
  };

  $scope.scrollPageDown = function() {
    // console.log('player.scrollPageDown');
    if (scroll.x <= scroll.maxScrollX) return;
    var scrollW = $element[0].getElementsByClassName('player-slide-cont')[0].offsetWidth;
    var width = scroll.wrapperW;// 선택된 아이템 위치에서 페이지 down
    var moveW = scroll.x - scroll.wrapperW;
    if(-scroll.x + scroll.wrapperW > Math.abs(scroll.maxScrollX)) {// 최하단 page에 focus item 있는 경우
      width = scroll.x - scroll.maxScrollX;
      moveW = scroll.maxScrollX;
    }
    scroll.scrollTo(width, 0, 1600, true);
    move(moveW, true);
  };

  $scope.scrollRefresh = function() {
    var obj;

    obj = $element[0].getElementsByClassName('player-slide-cont')[0];
    pageWidth = $element[0].getElementsByClassName('player-slide-cont')[0].offsetWidth;
    obj.style.width = pageWidth + 'px';
    if (scroll) {
      scroll.refresh();
      scrollBar.refresh(scroll.wrapperW, scroll.scrollerW, scroll.x);
      maxPosition = parseInt((scroll.wrapperW - scroll.scrollerW) / STEP_POSITION);
    }
  };

  var refresh = function(wrapperWidth, scrollerWidth, x) {
    var w, b;

    w = wrapperWidth - 140;
    if (w !== area.clientWidth) {
      area.style.width = w + 'px';
    }

    b = parseInt(w * wrapperWidth / scrollerWidth);
    if (b < 10) b = 10;

    bar.style.width = b + 'px';

    b = w - b;
    w = scrollerWidth - wrapperWidth;
    if (w === 0) {
      factor = -1;
    } else {
      factor = -b / w;
    }

    if (wrapperWidth >= scrollerWidth) {
      if (!$scope.scrollHide) hideScroll();
    } else {
      if ($scope.scrollHide) showScroll();
    }

    move(x, false);
  };

  var move = function(x, visible) {
    var position, moveScroll;

    position = parseInt(x / STEP_POSITION);
    if (position > 0) position = 0;
    if (position < maxPosition) position = maxPosition;

    if ($scope.scrollHide) return;

    bar.style.left = parseInt(x * factor) + 5 + 'px';
    if (visible) {
      bar.style.opacity = 1;
      bar.style.transitionDuration = '0s';
      $timeout.cancel(timer);
      timer = $timeout(hideBar, timeout);
    }
  };

  var hideBar = function() {
    bar.style.opacity = 0;
    bar.style.transitionDuration = '0.33s';
    timer = null;
  };

  $scope.setScrollBarCallback = function(refreshCB, moveCB) {
    scrollBar.refresh = refreshCB;
    scrollBar.move = moveCB;
  };

  var showScroll = function() {
    $scope.scrollHide = false;
    $element[0].getElementsByClassName('scroll-prev')[0].style.display = null;
    $element[0].getElementsByClassName('scroll-next')[0].style.display = null;
  };

  var hideScroll = function() {
    $scope.scrollHide = true;
    $element[0].getElementsByClassName('scroll-prev')[0].style.display = 'none';
    $element[0].getElementsByClassName('scroll-next')[0].style.display = 'none';
    bar.style.opacity = 0;
    bar.style.transitionDuration = '0s';
  };

  $scope.setDefaultFocus = function() {
    var target;

    target = $element[0].getElementsByClassName('btnIcon-0')[0];
    if (target) {
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
      $rootScope.tooltip.hideTooltip();
    }
  };

  $scope.onCursorVisibilityChanged = function(visible) {
    // console.log('player.onCursorVisibilityChanged, visible=' + visible);
    if (visible) {
      // mouse로 player를 띄운 직후, 리모콘의 scroll를 돌려서, mouse cursor가 생기는 경우
      $scope.setFocusItem('', null);
      initMouseEvents();
    } else {
      // mouse cursor가 있는 상태에서, 리모콘의 4방향 버튼을 클릭한 경우
      $scope.recoverFocus();
    }
    timeoutHelper.restartTimeout();
  };

  var initialize = function() {
    $rootScope.player = $scope;

    area = $element[0].getElementsByClassName('scroll-area')[0];
    bar = $element[0].getElementsByClassName('scroll-bar')[0];
    player = $element[0].getElementsByClassName('movie-player')[0];

    $scope.setScrollBarCallback(refresh, move);
  };

  initialize();
});

app.directive('moviePlayer', function ($window, $timeout) {
  return {
    scope: {
      videoCurrentTime: '=videoCurrentTime',
      controlTick: '=controlTick',
      videoEndTime: '=videoEndTime',
      begintTick: '=begintTick',
      endTick: '=endTick',
      playing: '=playing',
      playCont: '=playCont'
    },
    lastVideoTime: undefined,
    bufferingTimer: undefined,
    timeToMove: undefined,
    lastDisplayTime: undefined,

    controller: function ($scope, $element) {
      $scope.onTimeUpdate = function () {
        var that = this;
        if (this.lastVideoTime && !this.bufferingTimer) {
          this.bufferingTimer = setTimeout(function() {
            that.bufferingTimer = undefined;
            if ($scope.$parent.open &&
              $scope.$parent.playControl !== 'play' &&
              $element[0].currentTime === that.lastVideoTime) {
              // console.log('player.onTimeUpdate, buffering');
              $scope.$root.spinner.showSpinner();
            } else {
              $scope.$root.spinner.hideSpinner();
            }
          }, 1000);
        }
        if (this.lastVideoTime && ($element[0].currentTime !== this.lastVideoTime)) {
          // console.log('player.onTimeUpdate, no buffering');
          $scope.$root.spinner.hideSpinner();
        }
        this.lastVideoTime = $element[0].currentTime;

        if(!$scope.$root.spinner.hide && $element[0].currentTime > 0) {
          $scope.$root.spinner.hideSpinner();
        }
        var currTime = $element[0].currentTime;
        var duration = $element[0].duration;

        if (currTime - $scope.begintTick > 0.5 || $scope.begintTick - currTime > 0.5) {
          $element[0].currentTime = $scope.begintTick;
        }

        // $scope.$apply(function () {
        $timeout(function () {
          var displayTime = true;
          if(!isNaN($element[0].currentTime)) {
            // [WOSLQEVENT-99983]
            // [Service.SDPService.LGStore_TV Show & Movie] [Often] [Minor] 영상 재생되는 순간
            // progress bar의 숫자가 1초전으로 이동했다가 재생됨
            var diff = Math.abs(Math.floor($element[0].currentTime) - Math.floor(that.lastDisplayTime));

            if (diff >= 2 && !that.timeToMove) {
              // progress bar에서 다른 위치로 이동중
              // 이동하는 target time을 저장하기
              that.timeToMove = Math.floor($scope.videoCurrentTime);
            }

            if (that.timeToMove) {
              var diff2 = Math.abs($element[0].currentTime - that.timeToMove);
              if (diff2 < 1) {
                // 이동하는 target time과 실제 재생 시간의 차이가 1초 이하인 경우는 표시않하도록
                displayTime = false;
              } else {
                that.timeToMove = undefined;
              }
            }

            $scope.videoCurrentTime = $element[0].currentTime;
          }
          if(!isNaN($element[0].duration))$scope.videoEndTime = $element[0].duration;

          if(displayTime && $scope.begintTick == $scope.controlTick) {
            if(!$scope.$parent.mouseOnProgressBar && !isNaN($element[0].currentTime)) {
              $scope.controlTick = makeDurationTime2DisplayTime($element[0].currentTime);
            }
            if(!isNaN(currTime) && !isNaN(duration)) {
              $scope.playCont = parseFloat((currTime / duration) * 100);
            }
          }
          if(displayTime && !isNaN($element[0].currentTime)) {
            $scope.begintTick = makeDurationTime2DisplayTime($element[0].currentTime);
            that.lastDisplayTime = $element[0].currentTime;
          }
          if(!isNaN($element[0].duration))
            $scope.endTick = makeDurationTime2DisplayTime($element[0].duration);
          if(displayTime && !isNaN(currTime) && !isNaN(duration))
            $scope.playing = parseFloat((currTime / duration) * 100);
        });
      };

      var makeDurationTime2DisplayTime = function(duration) {
        var intvalue = Math.floor(duration);
        if (intvalue < 0) {
          intvalue = 0;
        }
        var min = Math.floor(intvalue / 60);
        var sec = Math.floor(intvalue - 60 * min);
        var h = '00';
        if((min / 60) > 1) {
          h = Math.floor(min / 60);
          h = (h < 10)? '0' + h : h;
          min = min % 60;
        }
        if(min < 10) {
          min = '0' + min;
        }
        return h + ':' + min + ':' + ((sec < 10)? '0' + sec : sec);
      };
    },

    link: function (scope, elm) {
      scope.$watch('videoCurrentTime', function (newVal) {
        if (elm[0].ended) {
          if (elm[0].currentTime !== newVal) {
            elm[0].currentTime = newVal;
            elm[0].play();
          } else {
            scope.$parent.playFinished();
          }
        }
        if(elm[0].isPlayControl) {// progressbar click 시 해당 지점으로의 이동
          elm[0].isPlayControl = false;
          scope.$root.spinner.showSpinner({audioGuidanceForce: true});
          elm[0].currentTime = newVal;
        }
      });
      // Otherwise keep any model syncing here.
      elm.bind('timeupdate', scope.onTimeUpdate);
    }
  };
});

app.directive('playerThumbResizable', function(device) {
  var defaultDetailImg = '';
  return {
    link: function($scope, $element) {
      $element.bind('error', function (e) {
        if($element.hasClass('thumb-poster')) {
          defaultDetailImg = './resources/images/default_cast.png';
        }
        if($element[0].src !== defaultDetailImg) {
          $element[0].src = defaultDetailImg;
        }
      });

      $element.bind('load', function(e) {
        var image_resize_func = function() {
          // imageResize.js에서 복사
          var w, h, areaW, areaH, imgW, imgH, rate;

          // App Item Image Size Setting

          // slider안의 각 이미지 칸 크기
          // 일반 : 140 * 104
          // 라이트 : 93 * 69

          areaW = device.isHD ? 93 : 140;
          areaH = device.isHD ? 69 : 104;
          imgW = $element[0].naturalWidth;
          imgH = $element[0].naturalHeight;
          w = null;
          h = parseInt(imgH * areaW / imgW);
          rate = (h / areaH).toFixed(2);
          if (rate < 0.8) {
            w = areaW;
            h = null;
          } else if (rate > 1.2) {
            h = areaH;
          } else {
            w = areaW;
            h = areaH;
          }

          if (!w && !h) {
            w = $element[0].style.width;
            h = $element[0].style.height;
          }

          $element[0].style.width = w + 'px';
          $element[0].style.height = h + 'px';
        };

        if ($element.hasClass('thumb-img')) {
          if (device.isLite) {
            //image_resize_func();
            //WOSLQEVENT-51735 이슈처리 타임아웃 50 추가
            setTimeout(image_resize_func, 300);
            return;
          } else {
            setTimeout(image_resize_func, 10);
            return;
          }
        }
      });
    }
  };
});