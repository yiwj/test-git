app.directive('tooltip', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'tooltipController',
    //templateUrl: './resources/html/tooltip.html'
    template: tooltipTmpl
  };
});

app.controller('tooltipController', function($scope, $rootScope, $element, marquee, device, audioGuidance, util, focusManager) {
  $scope.hide = true;
  $scope.right = true;
  $scope.top = false;
  $scope.title = '';
  $scope.style = {x: '0', y: '2000px'};
  $scope.isSeason = false;

  $scope.showTooltip = function(x, y, title, right, top, isSeason, seasonDate, posFixed) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true,

      // [WOSLQEVENT-113073] Episode 숫자는 다르나 Tooltip내용은 모두 동일하여 1회 발화 후 더 이상 발화안됨
      duplication: isSeason
    };

    params.text = title;
    params.text += '. ';
    params.text += msgLang.audio_button_button;

    //[WOSLQEVENT-113093] tooltip 포커스 상태에서 back key 누를경우 tooltip 발화 두번되는 이슈
    if (util.isAWSServer()) {
      if(device.isTooltipFocusItem){
        audioGuidance.call(params);
      }
      device.isTooltipFocusItem = true;
    } else {
      audioGuidance.call(params);
    }

    // console.log('tooltip.showTooltip, title=' + title);
    $scope.isSeason = isSeason;
    var isErrorTooltip = (focusManager.getCurrent() && focusManager.getCurrent().target && focusManager.getCurrent().target === 'error');

    if($scope.isSeason) {
      $scope.seasonDate = seasonDate;
    }

    var zoomRatio = device.isHD ? 0.667 : 1;
    if (posFixed) {
      // player에서는 HD 여부와 관계없이, 직접 좌표 계산을 한다.
      // 따라서, zoomRatio0이 1이다.
      zoomRatio = 1;
    }

    $scope.title = title;
    $scope.right = right? right: false;
    if (device.isRTL) {
      $scope.right = !$scope.right;
    }
    $scope.top = top;
    $scope.hide = false;
    $scope.$digest();//apply를 해야 width와 height를 받아옴

    if($scope.isSeason && top) {
      if ($scope.right && $scope.top) {
        $scope.style = {
          left: x*zoomRatio + 'px',
          bottom: y*zoomRatio + 'px'
        };
      } else if ($scope.right && !$scope.top) {
        $scope.style = {
          left: x - $element[0].offsetWidth + 'px',
          bottom: y + 'px'
        };
      } else if (!$scope.right && $scope.top) {
        $scope.style = {
          right: x*zoomRatio + 'px',
          bottom: y*zoomRatio + 'px'
        };
      } else {
        $scope.style = {
          left: x + 'px',
          bottom: y + 'px'
        };
      }
    } else if(isErrorTooltip) {
      var errorcodeMarquee = $element[0].querySelector('.no-event .marquee');
      if (!(errorcodeMarquee === undefined)){
        errorcodeMarquee.classList.add('marquee-start');
        marquee.setTarget(errorcodeMarquee);
      }
      if ($scope.right && $scope.top) {
        $scope.style = {
          left: x - $element[0].offsetWidth + 'px',
          top: y + 'px'
        };
      } else if ($scope.right && !$scope.top) {
        $scope.style = {
          left: x - $element[0].offsetWidth + 'px',
          top: y + 'px'
        };
      } else if (!$scope.right && $scope.top) {
        $scope.style = {
          left: x + 'px',
          top: y + 'px'
        };
      } else {
        $scope.style = {
          left: x + 'px',
          top: y + 'px'
        };
      }
    }else {
      if ($scope.right && $scope.top) {
        $scope.style = {
          left: x*zoomRatio + 'px',
          top: y*zoomRatio + 'px'
        };
      } else if ($scope.right && !$scope.top) {
        $scope.style = {
          left: x - $element[0].offsetWidth + 'px',
          top: y + 'px'
        };
      } else if (!$scope.right && $scope.top) {
        $scope.style = {
          right: x*zoomRatio + 'px',
          top: y*zoomRatio + 'px'
        };
      } else {
        $scope.style = {
          left: x + 'px',
          top: y + 'px'
        };
      }
    }
    $scope.$digest();
  };

  $scope.showSeasonTooltip = function(x, y, title, right, top, seasonDate) {
    $scope.showTooltip(x, y, title, right, top, true, seasonDate);

//    var target = $element[0].getElementsByClassName('marquee')[0];
//    if (target) {
//      // season의 episode 버튼의 툴팁의 marquee
//      target.classList.add('marquee-start');
//      marquee.setTarget(target);
//    }
  };

  $scope.customClass = function() {
    var className = '';
    var isErrorTooltip = (focusManager.getCurrent() && focusManager.getCurrent().target && focusManager.getCurrent().target === 'error');
    if($scope.right && $scope.top && isErrorTooltip) {
      className = '';
    } else if ($scope.right && $scope.top) {
      className = 'tooltip-flip';
    } else if ($scope.right && !$scope.top) {
      className = 'tooltip-topR';
    } else if(!$scope.right && $scope.top && isErrorTooltip){
      className = 'tooltip-flip tooltip-popup';
      $element[0].classList.remove("tooltip-multiline2");
    }else if (!$scope.right && $scope.top) {
      className = '';
    } else {
      className = 'tooltip-topL';
    }

    if ($scope.isSeason) {
      // season의 episode 버튼의 툴팁의 text width에 max 값을 주기 위하여
      className += ' tooltip-multiline';
    }

    return className;
  };

  $scope.hideTooltip = function(fromScopeName) {
    // console.log('tooltip.hideTooltip');
    if ($scope.isSeason) {
      // season의 episode 버튼의 툴팁의 marquee
      marquee.setTarget(null, fromScopeName);
    }
    // error code 툴팁의 marquee동작 null 시킴
    if (focusManager.getCurrent() && focusManager.getCurrent().target && focusManager.getCurrent().target === 'error'){
      marquee.setTarget(null);
    }

    $scope.title = '';
    $scope.style = {left: '0', top: '1080px'};
    $scope.hide = true;
    $scope.isSeason = false;

    try {
      $scope.$digest();
    } catch (e) {
      // player에서의 timeUpdate와 같이 background에서 주기적으로
      // $scope.$apply()를 하는 과정에 위의 $scope.$digest()가
      // 동시에 호출되면, exception 발생함
    }
  };

  var initialize = function() {
    $rootScope.tooltip = $scope;
  };

  initialize();
});
