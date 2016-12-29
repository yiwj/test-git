discoveryService.service('marquee', function(device, focusManager, $timeout) {
  var target = null;
  var width = 0;
  var time = 0;
  var timer = null;

  this.setTarget = function(obj, fromScopeName) {
    // console.log('marquee.setTarget, target=' + target + ', obj=' + obj);

    if (focusManager &&
      focusManager.getCurrent() &&
      focusManager.getCurrent().scope &&
      focusManager.getCurrent().scope.scopeName) {
      var currentScope = focusManager.getCurrent().scope.scopeName;

      if (!obj && fromScopeName === 'drawer' &&
        (currentScope === 'TVShowDetail' || currentScope === 'MovieShowDetail')) {
        // [WOSLQEVENT-85938] tvshow/movies내에서 marquee item간의 이동시,
        // draw의 removeFocus가 여러번 호출되며, marquee를 cancel하는 현상 해결
        return;
      }
    }

    // [WOSLQEVENT-102257] [Service.SDPService.LGStore_TV Show & Movie] [Always] [Minor] marquee 동작 reset 됨
    // 동일한 element내에서, marquee가 재시작되는 현상 해결
    if (target === obj) {
      return;
    }

    clearTimeout(timer);
    if (target) end();
    clearTimeout(timer);

    target = obj;
    if (!target) return;

    width = target.scrollWidth - target.parentElement.clientWidth;
    if (width < 0) return;
    var scrollingTime = 40;
    if(device.isLite) {
      scrollingTime = 50;
    }
    time = Number((width / scrollingTime).toFixed(2));
    if (time < 0.5) time = 0.5;   // if time is too short, set marquee time as 0.5s.

    end();
  };

  this.getTarget = function() {
    return target;
  };

  var start = function() {
    // console.log('marquee.start, target=' + target);
    if (!target) return;

    width = target.scrollWidth - target.parentElement.clientWidth;
    if (width <= 0) return;

    // marquee가 적용된 컨텐츠에 들어갔다 나오면 포커스된 컨텐츠의 marquee가
    // setTarget에서 width와 time 값이 0으로 나오므로 아래처럼 time을 다시 세팅해줌.
    var scrollingTime = 40;
    if(device.isLite) scrollingTime = 50;
    time = width / scrollingTime;

    if(device.isLite) {
      if(device.isRTL && !target.classList.contains('dir-ltr')) {
        target.style.left = '+' + width + 'px';
      } else {
        target.style.left = '-' + width + 'px';
      }
      target.style.transition = 'left ' + time + 's linear';
    } else {
      if(device.isRTL && !target.classList.contains('dir-ltr')) {
        target.style.webkitTransform = 'translateX(+' + width + 'px)';
      } else {
        target.style.webkitTransform = 'translateX(-' + width + 'px)';
      }
      target.style.webkitTransition = '-webkit-transform '+ time +'s linear';
    }

    timer = setTimeout(function() {
      end();
    }, (time + 1) * 1000);
  };

  var end = function() {
    // console.log('marquee.end, target=' + target);
    if (!target) return;

    if(device.isLite) {
      target.style.left = '0px';
      target.style.transition = 'left 0s';
    } else {
      target.style.webkitTransform = 'translateX(0px)';
      target.style.webkitTransition = '-webkit-transform 0s linear';
    }
    timer = setTimeout(start, 700);
  };

  this.autoPlay = function(obj) {
    // console.log('marquee.autoPlay');
    var autoTimer = null;
    var autoWidth = 0;
    var autoTime = 0;
    var autoObj = null;

    var autoStart = function() {
      // console.log('marquee.autoStart');
      if (!autoObj) return;

      autoWidth = autoObj.scrollWidth - autoObj.parentElement.clientWidth;
      if (autoWidth <= 0) return;
      if(device.isLite) {
        if(device.isRTL && !autoObj.classList.contains('dir-ltr')) {
          autoObj.style.left = '+' + autoWidth + 'px';
        } else {
          autoObj.style.left = '-' + autoWidth + 'px';
        }
        autoObj.style.transition = 'left ' + autoTime + 's linear';
      } else {
        if(device.isRTL && !autoObj.classList.contains('dir-ltr')) {
          autoObj.style.webkitTransform = 'translateX(+' + autoWidth + 'px)';
        } else {
          autoObj.style.webkitTransform = 'translateX(-' + autoWidth + 'px)';
        }
        autoObj.style.webkitTransition = '-webkit-transform ' + autoTime + 's linear';
      }
      autoTimer = setTimeout(autoEnd, (autoTime + 1) * 700);
    };
    var autoEnd = function() {
      // console.log('marquee.autoEnd');
      if (!autoObj) return;

      if(device.isLite) {
        autoObj.style.left = '0px';
        autoObj.style.transition = 'left 0s';
      } else {
        autoObj.style.webkitTransform = 'translateX(0px)';
        autoObj.style.webkitTransition = '-webkit-transform 0s linear';
      }
      autoTimer = setTimeout(autoStart, 700);
    };
    if (!obj) return;
    autoObj = obj;
    autoWidth = autoObj.scrollWidth - autoObj.parentElement.clientWidth;
    if (autoWidth <= 0) return;
    autoTime = Number((autoWidth / 50).toFixed(2));
    autoEnd();
  };
});