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

    $timeout.cancel(timer);
    if (target) end();
    $timeout.cancel(timer);

  target = obj;
  if (!target) {
    this.setTarget2(target);
    return;
  }

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

    timer = $timeout(function() {
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
    timer = $timeout(start, 700);
  };

  var target2 = null;
  var width2 = 0;
  var time2 = 0;
  var timer2 = null;

  this.setTarget2 = function(obj) {
    // console.log('_marquee.setTarget, target=' + target + ', obj=' + obj);

    // [WOSLQEVENT-102257] [Service.SDPService.LGStore_TV Show & Movie] [Always] [Minor] marquee 동작 reset 됨
    // 동일한 element내에서, marquee가 재시작되는 현상 해결
    if (target2 === obj) {
      return;
    }

    clearTimeout(timer2);
    if (target2) end2();
    clearTimeout(timer2);

    target2 = obj;
    if (!target2) return;

    width2 = target2.scrollWidth - target2.parentElement.clientWidth;
    if (width2 < 0) return;
    var scrollingTime = 40;
    if(device.isLite) {
      scrollingTime = 50;
    }
    time2 = Number((width2 / scrollingTime).toFixed(2));
    if (time2 < 0.5) time2 = 0.5;   // if time is too short, set marquee time as 0.5s.

    end2();
  };

  this.getTarget2 = function() {
    return target2;
  };

  var start2 = function() {
    if (!target2) return;

    width2 = target2.scrollWidth - target2.parentElement.clientWidth;
    if (width2 <= 0) return;

    // marquee가 적용된 컨텐츠에 들어갔다 나오면 포커스된 컨텐츠의 marquee가
    // setTarget에서 width와 time 값이 0으로 나오므로 아래처럼 time을 다시 세팅해줌.
    var scrollingTime = 40;
    if(device.isLite) scrollingTime = 50;
    time2 = width2 / scrollingTime;

    if(device.isLite) {
      if(device.isRTL && !target2.classList.contains('dir-ltr')) {
        target2.style.left = '+' + width2 + 'px';
      } else {
        target2.style.left = '-' + width2 + 'px';
      }
      target2.style.transition = 'left ' + time2 + 's linear';
    } else {
      if(device.isRTL && !target2.classList.contains('dir-ltr')) {
        target2.style.webkitTransform = 'translateX(+' + width2 + 'px)';
      } else {
        target2.style.webkitTransform = 'translateX(-' + width2 + 'px)';
      }
      target2.style.webkitTransition = '-webkit-transform '+ time2 +'s linear';
    }

    timer2 = setTimeout(function() {
      end2();
    }, (time2 + 1) * 1000);
  };

  var end2 = function() {
    if (!target2) return;

    if(device.isLite) {
      target2.style.left = '0px';
      target2.style.transition = 'left 0s';
    } else {
      target2.style.webkitTransform = 'translateX(0px)';
      target2.style.webkitTransition = '-webkit-transform 0s linear';
    }
    timer2 = setTimeout(start2, 700);
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

  var arrayTarget = [];
  var arrayWidth = 0;
  var arrayTime = [];
  var arrayTimer = null;

  this.resetMarqueeTarget = function() {
    arrayTarget = [];
    arrayWidth = 0;
    arrayTime = [];
    arrayTimer = null;

    if(document.querySelector('[item="'+focusManager.getCurrent().target+'"]')) {
      var lastMarquee = document.querySelector('[item="' + focusManager.getCurrent().target + '"]').querySelectorAll('.marquee');
      if (focusManager.getCurrent() && focusManager.getCurrent().target) {
        for (var i = 0; i < lastMarquee.length; i ++) {
          lastMarquee[i].style.transform = 'none';
        }
      }
    }
  };

  this.setArrayTarget = function(obj, fromScopeName) {
    if (!obj) return;
    var idx = -1;
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
//    if (target === obj) {
//      return;
//    }
    for (var i = 0; i < arrayTarget.length; i++) {
      if(arrayTarget[i] === obj){
        obj.toString() === arrayTarget[i].toString();
        idx = i;
      }
    }

    if(arrayTarget.length > 0 && idx != -1){
      return;
    }
    clearTimeout(arrayTimer);
    if (arrayTarget[idx]) arrayEnd();
    clearTimeout(arrayTimer);

//    target = obj;
    if(arrayTarget.length === 0 || idx === -1){
      arrayTarget.push(obj);
    }

    if(idx === -1 && arrayTarget.length === 1){
      idx = 0;
    }else{
      idx = arrayTarget.length -1;
    }

    arrayWidth = arrayTarget[idx].scrollWidth - arrayTarget[idx].parentElement.clientWidth;
    if (arrayWidth < 0) return;
    var scrollingTime = 40;
    if(device.isLite) {
      scrollingTime = 50;
    }
    arrayTime.push(Number((arrayWidth / scrollingTime).toFixed(2)));

    // if time is too short, set marquee time as 0.5s.
    if (arrayTime[idx] < 0.5) {
      arrayTime[idx] = 0.5;
    }
    arrayEnd(obj);
  };

  var arrayStart = function(obj) {
    var idx = -1;
    for (var i = 0; i < arrayTarget.length; i++) {
      if(arrayTarget[i] === obj){
        obj.toString() === arrayTarget[i].toString();
        idx = i;
      }
    }

    if (!arrayTarget[idx]) return;

    arrayWidth = arrayTarget[idx].scrollWidth - arrayTarget[idx].parentElement.clientWidth;
    if (arrayWidth <= 0) return;

    // marquee가 적용된 컨텐츠에 들어갔다 나오면 포커스된 컨텐츠의 marquee가
    // setTarget에서 width와 time 값이 0으로 나오므로 아래처럼 time을 다시 세팅해줌.
    var scrollingTime = 40;
    if(device.isLite) scrollingTime = 50;
    arrayTime[idx] = arrayWidth / scrollingTime + 0.5;
    if(device.isLite) {
      if(device.isRTL && !arrayTarget[idx].classList.contains('dir-ltr')) {
        arrayTarget[idx].style.left = '+' + arrayWidth + 'px';
      } else {
        arrayTarget[idx].style.left = '-' + arrayWidth + 'px';
      }
      arrayTarget[idx].style.transition = 'left ' + arrayTime[idx] + 's linear';
    } else {
      if(device.isRTL && !arrayTarget[idx].classList.contains('dir-ltr')) {
        arrayTarget[idx].style.webkitTransform = 'translateX(+' + arrayWidth + 'px)';
      } else {
        arrayTarget[idx].style.webkitTransform = 'translateX(-' + arrayWidth + 'px)';
      }
      arrayTarget[idx].style.webkitTransition = '-webkit-transform '+ arrayTime[idx] +'s linear';
    }

    arrayTimer = setTimeout(function() {arrayEnd(obj); }, (arrayTime[idx] + 1) * 1000);
  };

  var arrayEnd = function(obj) {
    var idx = -1;
    for (var i = 0; i < arrayTarget.length; i++) {
      if(arrayTarget[i] === obj){
        obj.toString() === arrayTarget[i].toString()
        idx = i;
      }
    }
    if (!arrayTarget[idx]) return;

    if(device.isLite) {
      arrayTarget[idx].style.left = '0px';
      arrayTarget[idx].style.transition = 'left 0s';
    } else {
      arrayTarget[idx].style.webkitTransform = 'translateX(0px)';
      arrayTarget[idx].style.webkitTransition = '-webkit-transform 0s linear';
    }
    arrayTimer = setTimeout(arrayStart(obj), 700);
  };
});