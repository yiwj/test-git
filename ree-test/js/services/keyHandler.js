discoveryService.service('keyHandler', function($rootScope, $document, focusManager, util, $timeout, toast, device, $timeout, eventKey, pmLog) {
  var that = this;

  this.ENTER = 13;
  this.PAUSE = 19;
  this.LEFT = 37;
  this.UP = 38;
  this.RIGHT = 39;
  this.DOWN = 40;
  this.BACK = 461;
  this.ESC = 27;
  this.TV3D = 1015;
  this.PLAY = 415;
  this.STOP = 413;
  this.CH_UP = 33;
  this.CH_DOWN = 34;
  this.durationDelay = 100;
  this.isRunning = false;
  this.previousEvent;

  var uptime = 1000;
  var downtime = 0;
  var executeFlag = true;
  var scrollFocusChange = false;
  var flagMoveDeltaDirection = false;

  this.registerKeyEvent = function() {
    var body = $document[0].body;

    body.onkeydown = handleKeyDown;
    body.onkeyup = handleKeyUp;
  };

  var handleKeyDown = function(e) {
    // console.log('keyHandler.handleKeyDown, keycode=' + e.keyCode);

    if (e.keyCode === 1536) { //e.keyCode == 1536 : mouse pointer 가 나타났을 때 hover 모드
      var scopeName;
      if (focusManager.getCurrent() &&
         focusManager.getCurrent().scope &&
         focusManager.getCurrent().scope.scopeName) {
        scopeName = focusManager.getCurrent().scope.scopeName;
      }
      if (['prerollAd', 'player'].indexOf(scopeName) >= 0) {
        // trailer 재생전에 실행되는 광고 영역에는 hover-mode 추가 않하도록
      } else {
        document.body.classList.add('hover-mode');
      }
    } else if (e.keyCode === 1537) { //e.keyCode == 1537 : mouse pointer 가 사라졌을 때 hover 모드 삭제 후 last focus 로 이동
      document.body.classList.remove('hover-mode');

      if (focusManager.getCurrent().scope &&
        (focusManager.getCurrent().scope.scopeName === 'player' ||
          focusManager.getCurrent().scope.scopeName === 'prerollAd')) {
        // [WOSLQEVENT-39111]
        // movies -> detail -> player -> slide show 에서
        // image 영역으로 mouse 커서를 옮긴 이후, 리모콘 key를 누르면
        // 인식되지 않는 이슈 해결

        if ($rootScope.popupApp.open) {
          // WOSLQEVENT-56513
          // [Service.SDPService.LGStore_Movies] Condition : Movie -> 예고편 재생 -> 재생 완료 -> PLAY MOVIE -> 시청 옵션 팝업 출력 -> 포인터 화면 중앙으로 이동 후 클릭 -> 방향키 입력하여 포인터 Hide 시 Problem : Focus 사라짐 (시청 옵션 팝업에 Focus 생성 되어야 ?..
          $rootScope.popupApp.moveFocusByKey();
        } else  {
          $rootScope.player.recoverFocus(true);
        }
      } else if(focusManager.getCurrent().target === '' &&
        focusManager.getLastFocus().scope &&
        focusManager.getLastFocus().target &&
        focusManager.getLastFocus().element) {
        focusManager.getLastFocus().scope.setFocusItem(focusManager.getLastFocus().target,
          focusManager.getLastFocus().element);
      } else if (focusManager.getCurrent().target === 'prev' || focusManager.getCurrent().target === 'next') {
        // Recover the focus when the mouse pointer was disappeared after the scroll button had been dimmed.
        var currItem = '';
        if (document.querySelector('[item="'+"prev"+'"]').classList.contains('disabled')) currItem = 'next';
        else currItem = 'prev';
        focusManager.getLastFocus().scope.setFocusItem(currItem, document.querySelector('[item="'+currItem+'"]'));
      }
    } else {

      // For the scroll btn. If the scroll btn is pressed(keyDown), in order to keep the scrolling until you release(keyUp), set the global variable (isKeyDown) true.
      if (!device.isKeyDown) device.isKeyDown = true;

      // For the scroll btn. When the scroll btn is dimmed(invisible), do not continue scrolling. 'Cause the opposite scroll btn has the focus.
      if (device.isScrollBtnDimmed && e.keyCode === that.ENTER) {
        e.preventDefault();
        return;
      }

      if(e.keyCode !== that.BACK) {
        document.body.classList.remove('hover-mode');
      }
      //console.log(e);
      downtime = e.timeStamp;
      //scroll 로직 추가
      var focusEl = focusManager.getCurrent();
      var focusScope;
      if (focusEl) {
        focusScope = focusEl.scope;
      }
      if (focusEl.target == 'prev' || focusEl.target == 'next') {
        var flagCurrentDirection = false;
        if (e.keyCode == that.ENTER && !scrollFocusChange) {
          var deltaY, wheelDelta;
          focusEl.scope.executeAction('mouseDown'); //scroll enter key event 시 audioGuidance 호출위해 executeAction() 호출
          moveDelta = device.isHD ? 80 : 120;
          if (focusEl.target == 'next') {
            if (moveDelta > 0) {
              moveDelta = - moveDelta;
              flagCurrentDirection = false;
            }
          } else if (focusEl.target == 'prev') {
            if (moveDelta < 0) {
              moveDelta = - moveDelta;
              flagCurrentDirection = true;
            }
          }
          if (flagMoveDeltaDirection !== flagCurrentDirection) {
            scrollFocusChange = true;
            flagMoveDeltaDirection = flagCurrentDirection;
          } else {
            scrollFocusChange = false;
          }
          deltaY = focusScope.$parent.scroll.y + moveDelta;
          if ((focusScope.$parent.scroll.y <= focusScope.$parent.scroll.maxScrollY && focusEl.target == 'next')
              || (focusScope.$parent.scroll.y >= 0 && focusEl.target == 'prev')) {
            return;
          } else {
            focusEl.scope.resetFocusCheck();
          }
          if (!scrollFocusChange) {
            // moonstone patch
            if (deltaY > 0) deltaY = 0;
            else if (deltaY < focusScope.$parent.scroll.maxScrollY) deltaY = focusScope.$parent.scroll.maxScrollY - 10;
            focusScope.$parent.scroll.scrollTo(0, deltaY, 300);
          }
        }
      }
      switch(e.keyCode) {
        case that.LEFT:
          scrollFocusChange = false;
        case that.UP:
          scrollFocusChange = false;
        case that.RIGHT:
          scrollFocusChange = false;
        case that.DOWN:
          scrollFocusChange = false;
        case that.BACK:
          /* 같은 방향으로의 포커스 이동시 포커스의 속도를 조절하여 dom의 새로 그릴시의 화면에 빈공간이 노출되는 것을 막는다.
           속도는 durationDelay 파라미터 값으로 조정한다.*/
          $timeout(function() {
            if (that.isRunning && this.previousEvent == e.keyCode) return;
            this.previousEvent = e.keyCode;
            moveFocus(e.keyCode);
          }, this.durationDelay);
          break;
      }
    }
  };

  var handleKeyUp = function(e) {
    // console.log('keyHandler.handleKeyUp, keycode=' + e.keyCode);
    // For the scroll btn. If the scroll btn is released(keyUp), in order to stop the scrolling, set the global variable (isKeyDown) false.
    if (device.isKeyDown) device.isKeyDown = false;

    // For the scroll btn. When the scroll btn is dimmed(invisible) and released(keyUp), do not executeAction.
    if (device.isScrollBtnDimmed) {
      if (focusManager.getCurrent().target && $document[0].querySelector('[item="'+focusManager.getCurrent().target+'"]').classList.contains('btn-more')) {
        $document[0].querySelector('[item="'+focusManager.getCurrent().target+'"]').classList.add('scroll-btn-dimmed');
      }
      device.isScrollBtnDimmed = false;
      if (e.keyCode === that.ENTER) return;
    }

    scrollFocusChange = false;
    e.preventDefault();

    if(e.keyCode === that.ENTER) {
      $rootScope.isPlayKey = false;
    }

    switch (e.keyCode) {
      case that.PLAY:
        $rootScope.isPlayKey = true;
        e.keyCode = that.ENTER;

        if (focusManager.getCurrent().scope &&
          (focusManager.getCurrent().scope.scopeName === 'player')) {
          $rootScope.player.executeByKey(e.keyCode);
          break;
        }
      case that.ENTER:
        var focusEl = focusManager.getCurrent();
        var focusScope;
        if (focusEl) {
          focusScope = focusEl.scope;
        }
        if (focusEl.target == 'prev' || focusEl.target == 'next') {
          if(e.keyCode == that.ENTER){
            executeFlag = false;
          }
        }
      case that.BACK:
        executeByKey(e.keyCode);
        break;
      case that.TV3D:
        toast3D();
        break;
      case that.PAUSE:
      case that.STOP:
        if (focusManager.getCurrent().scope &&
          (focusManager.getCurrent().scope.scopeName === 'player')) {
          $rootScope.player.executeByKey(e.keyCode);
        }
        break;
      // local에서 back키 simulation을 위해 ESC를 추가한다.
      case that.ESC:
        if(location.href.indexOf("localhost") != -1 || location.href.indexOf(":8080") != -1) {
          executeByKey(that.BACK);
          break;
        }
    }
    if(e.keyCode === that.CH_DOWN || e.keyCode === that.CH_UP) {
      executeByKey(e.keyCode);
    }

    // WOSLQEVENT-69535 : preRoll 광고 일때 down키로 progress bar show/hide
    if (e.keyCode === that.DOWN && $rootScope.prerollAd.show) {
      $rootScope.prerollAd.progressShowAndHide();
    }
  };

  var executeByKey = function(keyCode) {
    // console.log('keyHandler.executeByKey, keycode=' + e.keyCode);
    var scope, flag;

    scope = focusManager.getCurrent().scope;
    if (scope && scope.scopeName == 'app') scope = focusManager.getPrevious().scope;

    // 예외 처리 begin
    var forceExecute = false;
    if (scope && scope.scopeName === 'player' && keyCode === that.BACK) {
      // player에서 back키는 허용
      forceExecute = true;
    }

    // [WOSLQEVENT-100680] language변경 팝업 시 back일 때 재현됨 : skip처리
    if (keyCode === that.BACK && device.isChangedLanguage) {
      return;
    }

    //[WOSLQEVENT-77232] 메인/앱&게임 비디오 광고 시 PLAY 키 작동 안하도록 조치
    if(scope && (scope.scopeName === 'depth2Ad' || scope.scopeName === 'mainAd') && keyCode === that.PLAY) {
      return;
    }
    // 예외 처리 end

    if (!forceExecute && focusManager.blockExecution(scope.scopeName) && scope.scopeName !== 'popupApp')
      return;

    if (scope.scopeName == 'scroll' && focusManager.preExecution()) {
      focusManager.runPreExecution();
      return;
    }
    if (scope.scopeName == 'drawer') flag = focusManager.getState('drawer');
    focusManager.runPreExecution();

    if (keyCode === that.CH_UP || keyCode === that.CH_DOWN) {
      if (scope.scopeName === 'featured') {
        // console.log('featured channel up & down');
        $rootScope.$broadcast(eventKey.FEATURED_ROLLING, keyCode);
      }
      if (focusManager.getCurrent().target.indexOf('item') > -1) {
        switch (scope.scopeName) {
          case 'tvshows' :
          case 'movies' :
          case 'premium' :
          case 'appsngames' :
          case 'mypage' :
            $rootScope.$broadcast(eventKey.LIST_PAGE_UP_DOWN, keyCode);
            break;
        }
      }
      return;
    }
    if (scope.executeAction) {
      util.async(function() {
        if (keyCode == that.BACK) {
          // season, usb, error popup close
          if ($rootScope.popupApp.open) {
            if ($rootScope.popupApp.title === msgLang.alert_adult_9) {//성인인증 만료 팝업이면 닫을수 없다.타이틀로 체크
            } else {
              $rootScope.popupApp.hidePopup('back');
            }
            return;
          }

          // season popup close
          if(!$rootScope.season.hide) {
            focusManager.setState('season', false);
            $rootScope.season.hide = true;
            $rootScope.season.open = false;
            $rootScope.season.hidePopup();
            return;
          }

          //TODO : 메인전체오류화면 노출시 back키로 store 종료
          if ($rootScope.popupMain.open) {
            window.close();
            return;
          }
          //TODO : My Page-> My App 에서  back key인 경우 "모두업데이트" 버튼 활성화('모두업데이트 기능 미구현됨')
          // guide close
          if ($rootScope.guide && $rootScope.guide.isViewGuide) {
            $rootScope.guide.hideGuide();
            return;
          }
          // 검색영역에서 휴지통 버튼 클릭시
//          if ($rootScope.search.del_mode) {
//            $rootScope.search.deleteRecentsCancel();
//            return;
//          }
          // search drawer close
//          if ($rootScope.search.showing) {
//            $rootScope.search.hideSearchMain();
//            return;
//          }
          /*// drawer close
          if (!$rootScope.drawer.close) {
            $rootScope.drawer.closeDrawer();
            return;
          }*/
          //MY Page 에서 휴지통 버튼 클릭시
          /*if (scope.scopeName == 'mypage' && scope.deleteMode) {
            scope.deleteItemCancel();
            return;
          }*/
          // rating close
          if ($rootScope.rating.open) {
            $rootScope.rating.hidePopup();
            return;
          }
          // list option close
          if ($rootScope.option.open) {
            $rootScope.option.hideOption();
            document.getElementsByClassName('popup-list-option')[0].parentNode.classList.remove('popup-modal-list-option'); // 팝업창 외 포커스 방지 제거
            return;
          }
          //TODO : 광고 동영상 전체 화면 재생중인 경우
          //Player 활성화시
          // if ($rootScope.player.open) {
          //   $rootScope.player.executeByKey(keyCode);
          //   return;
          // }

          var param = $rootScope.pageManager.peekHistory();
          if ((!param || param.page === 'featured') && !$rootScope.mainAd.fullScreen) {
            PalmSystem.platformBack();
            return;
          }

          // preroll show status, hide preroll
          if ($rootScope.prerollAd.show) {
            $rootScope.prerollAd.hidePreroll('notplay');
            // last focus setting - cursor가 없는 경우에만 처리.
            if(!window.PalmSystem.cursor.visibility) {
              var prevScope = $rootScope.prevScope;
              var prevItem = "trailer";
              var prevElement = document.querySelector('[item="trailer"]');
              prevScope.setFocusItem(prevItem, prevElement);
            }
            return;
          }
          // depth2Ad 전체화면시 처리
          if($rootScope.depth2Ad.fullScreen) {
            document.querySelector(".ad-dim").style.visibility = 'hidden';
            document.querySelector("[depth2-ad]").style.visibility = 'hidden';
            setTimeout(function() {
              document.querySelector(".ad-dim").style.visibility = 'visible';
              document.querySelector("[depth2-ad]").style.visibility = 'visible';
            }, 1000);
            $rootScope.depth2Ad.closeFullScreen();
            return;
          }
          // mainAd 전체화면시 처리
          if($rootScope.mainAd.fullScreen) {
            document.querySelector(".ad-dim").style.visibility = 'hidden';
            setTimeout(function() {
              document.querySelector(".ad-dim").style.visibility = 'visible';
            }, 1000);
            $rootScope.mainAd.closeFullScreen();
            return;
          }

          //TODO : 임시적으로 포커스가 back button에 맞추어진 것처럼하여 back button click 효과를 냄.
          // 각 모듈에서 back 관련 func를 선언하여 해당 func를 call해야함.
          focusManager.setCurrent(scope, 'back');
        }
        if (executeFlag) {
          scope.executeAction(flag);
        } else {
          executeFlag = true;
        }
      });
    }
  };

  var moveFocus = function(keyCode) {
    // console.log('keyHandler.moveFocus, keycode=' + keyCode);

    if (device.isRTL) {
      switch(keyCode) {
        case that.LEFT:
          keyCode = that.RIGHT;
          break;
        case that.RIGHT:
          keyCode = that.LEFT;
          break;
      }
    }
    var scope;
    scope = focusManager.getCurrent().scope;
    if (scope && scope.scopeName == 'app') scope = focusManager.getPrevious().scope;

    // 예외 처리 begin
    var forceExecute = false;
    if (scope && scope.scopeName === 'player' &&
      (keyCode === that.BACK || keyCode === that.LEFT || keyCode === that.RIGHT)) {

      if (keyCode === that.BACK && $rootScope.popupApp.open) {
        // popup이 뜬 상태는, 위의 executeByKey 에서 처리됨
      } else {
        // player에서 back키는 허용
        forceExecute = true;
      }
    }
    // 예외 처리 end

    if (!forceExecute && scope && scope.scopeName && focusManager.blockExecution(scope.scopeName)) {
      // console.log('keyHandler.moveFocus, blocked, do nothing, scopeName=' + scope.scopeName);
      var log = 'keyHandler.moveFocus, blocked, do nothing, scopeName=' + scope.scopeName + ', forceExecute : '+forceExecute+
        ' , focusManager.blockExecution(scope.scopeName) : '+focusManager.blockExecution(scope.scopeName) +
        " , focusItem : "+focusManager.getCurrent().scope.focusItem;
      pmLog.write(pmLog.LOGKEY.KEY_HANDLER, {
        msg : log
      });
      return;
    }
    if (scope && scope.moveFocusByKey) {
      that.isRunning = true;
      $timeout(function(){
        scope.moveFocusByKey(keyCode);
        that.isRunning = false;
      }, that.durationDelay);
    }
  };

  var toast3D = function() {
    toast.call({
      msg : msgLang.alert_cantoff3d_1,
      icon : device.icon3D
    });
  };
});