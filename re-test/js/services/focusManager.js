discoveryService.service('focusManager', function($rootScope, device, util) {
  var current = {
    scope: null,
    target: ''
  };
  var previous = {
    scope: null,
    target: ''
  };
  var lastFocus = {
    scope: null,
    target: ''
  };
  var state = {
    loading: true,
    option: false,
    drawer: false,
    popupApp: false,
    popupMain: false,
    rating: false,
    season: false,
    player: false,
    preroll: false
  };
  var mouseTarget = '';

  this.setCurrent = function(scope, target, element) {
    // console.log('focusManager.setCurrent, scopeName=' +
    //   (scope ? scope.scopeName : 'undefined') + ', target=' + target);

    if (current.scope !== scope) {
      previous.scope = current.scope;
      previous.target = current.target;
    }
    if(target) {
      var scopeElement;

      if (scope && device.isFocusItem && scope.audioGuidance && document.hasFocus()) {
        scope.audioGuidance(scope, target, element);
      }

      device.isFocusItem = true;
      lastFocus.scope = scope;
      lastFocus.target = target;
      if (scope.getScopeElement) {
        scopeElement = scope.getScopeElement();
      }
      if (scopeElement) {
        if(scope.scopeName === 'mainAd') {
          lastFocus.element = scopeElement[0].parentNode.querySelector('[item="'+target+'"]');
        } else {
          lastFocus.element = scopeElement[0].querySelector('[item="'+target+'"]');
        }
      } else {
        lastFocus.element = document.querySelector('.focus'); //document.querySelectorAll('[item="'+target+'"]')[0];
      }
    }

    current.scope = scope;
    current.target = target;

    if (previous.scope && previous.target && previous.scope !== current.scope) {
      previous.scope.removeFocus(previous.target);
    }
    if (lastFocus.scope && lastFocus.target && lastFocus.target !== target) {
      lastFocus.scope.removeFocus(lastFocus.target);
    }
  };

  this.getCurrent = function() {
    return current;
  };

  this.getPrevious = function() {
    return previous;
  };

  this.getLastFocus = function() {
    return lastFocus;
  };

  this.setState = function(key, value) {
    state[key] = value;
  };

  this.getState = function(key) {
    return state[key];
  };

  this.setMouseTarget = function(target) {
    mouseTarget = target;
  };

  this.getMouseTarget = function() {
    return mouseTarget;
  };

  this.blockExecution = function(scopeName) {
    if ($rootScope.breadcrumb && $rootScope.breadcrumb.IsRunning()) {
      // page 이동시 webkitTransitionEnd를 타지 않은 경우의 예외 처리 timeout 시간을
      // 2초로 줄였기 때문에, click시 page div가 2개인 순간이 늘어남에 따라,
      // focusManager에서 page div가 2개 이상인 경우를 확인하여, block하도록 해야함.
      console.log('focusManager.blockExecution, breadcrumb.IsRunning');
      return true;
    }
    if ($rootScope.spinner && $rootScope.spinner.isShowing()) {
      console.log('focusManager.blockExecution, spinner.isShowing');
      return true;
    }

    //[WOSLQEVENT-79327] toolTip이 바로 나오지 않는 현상이 있어 drawer scope에 한해 blockExecution 방어 처리
    if ((scopeName === 'popupApp' && state['player'])) {
      // slide가 표시된 상태에서 'service temporarily unavailable' popup이 뜬 경우.
      // OK 버튼이 클릭이 안되기 때문에, 임시로 일단 return false 처리.
      return false;
    }

    // [WOSLQEVENT-96726] [SDPService.LGStore_Movie_LG Store] [Always] [Minor] Guide 화면에서 일반 리모콘으로 네비게이션 key로 Close 버튼 선택이 안됨
    if (scopeName === 'drawer') {
      if (state['guide']) {
        // guide는 fullscreen 이므로, drawer도 block함
        return true;
      } else {
        return false;
      }
    }

    var blocked = false;
    var keys = Object.keys(state);
    for (var i = 0 ; i < keys.length ; i++) {
      var key = keys[i];
      if (key === 'drawer')
        continue;
      if (!state[key]) {
        // false 인 경우
        continue;
      }

      if(scopeName === key) {
        // 같은 scope 이름이면, loading인지만 확인
        blocked = state.loading;
        // console.log('focusManager.blockExecution, state.loading=' + state.loading + ', key=' + key);
      } else if (scopeName === 'postScroll') {
        blocked = state.loading;
        // console.log('focusManager.blockExecution, state.loading=' + state.loading + ', scopeName=' + scopeName);
      } else if (scopeName === 'scroll' &&
        key === 'season' &&
        current &&
        current.scope &&
        (current.scope.scopeName === 'scroll' ||
        current.scope.scopeName === 'season')) {
        // tvshow의 season popup 내 scroll 버튼 클릭을 허용하기 위해
        // console.log('focusManager.blockExecution, allow focus in scroll button inside season popup, current.scope.scopeName=' + current.scope.scopeName +
        //   ', key=' + key);
      } else {
        blocked = state.loading || state[key];
      }

      if (blocked) {
        // 하나라도 block 상태면, 더이상 체크 불필요
        console.log('focusManager.blockExecution, key=' + key + ', blocked=' + blocked);
        break;
      }
    }

    // console.log('focusManager.blockExecution, blocked=' + blocked);
    return blocked;
  };

  this.preExecution = function() {
    if (state.drawer) {
      return true;
    }

    return false;
  };

  this.runPreExecution = function() {
    if (state.drawer) {
      $rootScope.drawer.closeDrawer();
    }
  };
});