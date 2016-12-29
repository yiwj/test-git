app.directive('premiumList', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'premiumListController',
//    templateUrl: './resources/html/premiumList.html'
    template: premiumListTmpl
  };
});

/*app.directive('appRecoverable', function() {
  return {
    link: function($scope, $element) {
      $element.bind('error', function() {
        $scope.item.src = $scope.item.iconURL;
        $scope.item.iconURL = './resources/images/default_app.png';
      });
    }
  };
});*/

app.controller('premiumListController', function($scope, $controller, $element, $rootScope, $timeout, server, marquee, focusManager, util, keyHandler, storage, pmLog, eventKey, device, timeOutValue, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var lastFocus = {};
  var lastItemFocus = {};
  var requestedAppends = false;
  var destroyInfo = {scope : $scope, element : $element};

  $scope.toBeDelScope = null;
  $scope.scopeName = '';
  $scope.focusItem = '';
  $scope.defaultFocusItem_Id = '';
  $scope.listData = null;
  $scope.direct = false;
  $scope.showing = false;
  $scope.hiding = false;
  $scope.title = '';
  $scope.historyBack = $rootScope.pageManager.getTitle('back');
  $scope.nodata = msgLang.apps_nodata;
  $scope.item_id = '';
  $rootScope.pmLogValue = pmLog.TYPE.PREMIUM;
  $scope.showFilter = false;
  $scope.isUpdate = false;
  $scope.selectedOption = 'all';
  $scope.subTitle = '';
  //15년도 Lg store 기준 filter 옵션 하드코딩
  $scope.filterOptionData = [
    {
      "key":"FILTER_CATEGORY",
      "values":[
        {
          "name":"전체",
          "code":"001",
          "selected":"TRUE"
        },
        {
          "name":"앱방식 셋톱TV",
          "code":"002",
          "selected":"FALSE"
        }
      ]
    }
  ];
  $scope._ctrls = {
    'premiumList' : {initialized: false, drawed: false}
  };

  $scope.setLastItemFocus = function(isFrom) {
    lastItemFocus.isFrom = isFrom;
  };

  /**
   * Recover focus
   * 초기화 시 생성되는 포커스 이벤트 리스너
   */
  $scope.recoverFocus = function() {
    if (lastFocus.item && lastFocus.element)
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  /**
   * Setting focus
   * @param item      : 선택된 div 의 item
   * @param element   : 선택된 객체의 div
   */
  $scope.setFocusItem = function(item, element) {
    /* toolTip 을 숨김*/
    if (lastFocus.item == 'back' || lastFocus.item == 'option') {
      $rootScope.tooltip.hideTooltip();
    }
    $scope.focusItem = item;

    /* 포커스 제거*/
    if (focusElement) {
      focusElement.classList.remove('focus');
    }

    /* 선택된 객체의 div class 에 포커스 삽입*/
    focusElement = element;
    if (focusElement) {
      focusElement.classList.add('focus');
    }

    /* marquee, focusManager, lastFocus 설정*/
    if (item) {
      if (item != 'back') {
        marquee.setTarget(element.getElementsByClassName('marquee')[0]);
      }
      focusManager.setCurrent($scope, item, element);
      lastFocus.item = item;
      lastFocus.element = element;
    /* 선택된 객체가 없는 경우(예외나 잘못된 객체)*/
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }

    /* 선택된 객체가 back 인 경우*/
    if ($scope.focusItem == 'back') {
      $rootScope.tooltip.showTooltip(50, 107, $rootScope.pageManager.getTitle('back'), true, true);
    /* 선택된 객체가 option 인 경우*/
    } else if ($scope.focusItem == 'option') {
      if (device.isRTL) {
        $rootScope.tooltip.showTooltip(145, 138, msgLang.listOption, false, true);
      } else {
        $rootScope.tooltip.showTooltip(48, 138, msgLang.listOption, false, true);
      }

    } else if ($scope.focusItem != null && $scope.focusItem.indexOf('item') >= 0) {
      //이전에 포커스된 아이템으로 이동
      lastItemFocus.item = lastFocus.item;
      lastItemFocus.element = lastFocus.element;
      lastItemFocus.isFrom = true;
      var premiumListcheck = $element[0].getElementsByClassName('item-premium')
      if (!$scope.listData || $scope.listData.premiumAppList === null || $scope.listData.appCount === 0) {
        if ($scope.showFilter) {
          var element = $element.parent()[0].getElementsByClassName('btn-list-option')[0];
          $scope.setFocusItem(element.getAttribute('item'), element);
        } else {
          var rect = {x: 2000, y: 0, width: 0, height: 0};
          $rootScope.$broadcast('focus', 'drawer', null, rect);
        }
      }
    }
  };

  $scope.audioGuidance = function (scope, target, element) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };

    if(scope === 'nodata'){
      params.clear = false;
      params.text = msgLang.apps_nodata;
      audioGuidance.call(params);
      return;
    }

    var enterSound = '';

    //최초 화면 진입 시 나오는 음성
    if ($rootScope.isNewPage) {
      if (scope.getScopeElement()[0]) {
        var tmpElement = scope.getScopeElement()[0];
        if (tmpElement.querySelector('.panel-header .text') && tmpElement.querySelector('.panel-header .text').innerText.length > 0) {
          enterSound = tmpElement.querySelector('.panel-header .text').innerText;
        }
      }
      $rootScope.isNewPage = false;
    }

    var contentName = null;
    if (element && element.querySelector('.focus .text')) {
      contentName = element.querySelector('.focus .text').innerText;
    }

    if (enterSound.length > 0) {
      params.text += enterSound;
      params.text += '. ';
      params.text += contentName;
    } else if (contentName) {
      params.text = contentName;
    } else {
      return;
    }

    audioGuidance.call(params);
  };

  /**
   * 필터 설정
   * @param filter  :   "Category"
   * @param value   :   001은 All, 002는 Visual Set-Top
   */
  $scope.setFilter = function(filter, value) {
    /* All을 선택한 경우*/
    if (value == '001') {
      $scope.selectedOption = 'all';
      pmLog.write(pmLog.LOGKEY.OPTION_CHANGED, {
        category_name : pmLog.TYPE.PREMIUM,
        option_type : 'category',
        filter_id : 'all'
      });

    /* Visual Set-Top을 선택한 경우*/
    } else {
      $scope.selectedOption = 'mvpd';
      pmLog.write(pmLog.LOGKEY.OPTION_CHANGED, {
        category_name : pmLog.TYPE.PREMIUM,
        option_type : 'category',
        filter_id : 'virtual Set-Top'
      });
    }

    /* 필터 팝업에 선택된 필터앞에 체크 표시*/
    var obj = $scope.filterOptionData[0].values;
    for (var i = 0 ; i < obj.length ; i++) {
      if (obj[i].code == value) {
        obj[i].selected = 'TRUE';
      } else {
        obj[i].selected = 'FALSE';
      }
    }

    /* 업데이트 flag변수 변경과 동기화*/
    $scope.isUpdate = true;
    $scope.requestDataASync(false);

    /* panel focus disabled remove*/
    document.getElementsByClassName('popup-list-option')[0].parentNode.classList.remove('popup-modal-list-option'); // 팝업창 외 포커스 방지 제거

    /* initialize lastItemFocus */
    lastItemFocus = {};
  };

  /**
   * 데이터 동기/비동기 요청
   */
  $scope.requestDataASync = function(append) {
    util.async(function() {
      requestData(append);
    });
  };

  /**
   * 데이터 요청
   */
  var requestData = function(append) {
    console.log('premium.requestData begin');
    var errorCode;
    requestedAppends = append;
    try {
      if (!device.isLocalJSON) {
        // server data용
        if (device.mvpd) {
          $scope.selectedOption = 'mvpd';
          var obj = $scope.filterOptionData[0].values;
          for (var i = 0 ; i < obj.length ; i++) {
            if (obj[i].code == '002') {
              obj[i].selected = 'TRUE';
            } else {
              obj[i].selected = 'FALSE';
            }
          }
          device.mvpd = undefined;
        }
        var params = {
          api : '/discovery/premiumapplist',
          apiAppStoreVersion : 'v8.0',
          method : 'get',
          params : {
            callback : 'response',
            app_attr: $scope.selectedOption
          }
        };
        server.requestApi(eventKey.LIST_PREMIUM, params, destroyInfo);
      } else {
        // local json용
        server.requestPremiumList();
      }
    } catch (e) {
      errorCode = "Premium2Depth.400"; // api 통신 에러
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러 발생
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);
    }
    console.log('premium.requestData end');
  };

  /**
   * 실행 액션
   */
  $scope.executeAction = function() {
    var focusObject, target, obj, item, element, item_id, targets = [
       'ME2210',
       'ME2212',
       'ME2220',
       'ME2312',
       'ME2314',
       'ME2310',
       'ME2320'
     ];

    /* Block 예외처리*/
    if (focusManager.blockExecution()) {
      console.log('premium.executeAction, blockExecution is true');
      return;
    }

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;  // target : 포커스된 대상의 타겟명
      /* back 버튼을 선택한 경우*/
      if (target == 'back') {
        $rootScope.breadcrumb.executeBack($scope.scopeName, function() {
          $scope.setFocusItem('', null);

          obj = $rootScope.pageManager.popHistory();
          $rootScope.draw(obj);
        });
      /* option 버튼을 선택한 경우*/
      } else if (target === 'option') {
        if ($rootScope.option.hide) {
          $rootScope.option.showOption($scope, $scope.filterOptionData);
          document.getElementsByClassName('popup-list-option')[0].parentNode.classList.add('popup-modal-list-option'); // 팝업창 외 포커스 방지
        }
      /* 같은 객체를 선택한 경우*/
      } else if (targets.indexOf(target) >= 0) {
        item = $element[0].getAttribute('item');
        if (item != target) {
          $element[0].setAttribute('item', target);
          $scope.requestDataASync(false);
        }
      /* back 버튼과 option 버튼을 제외한 객체를 선택한 경우*/
      } else {
        element = angular.element(document.getElementById(target))[0];  // 선택된 프리미엄 컨텐츠의 div
        var keys = Object.keys($scope._ctrls);  // keys : 'premiumList'
        for (var i = 0 ; i < keys.length ; i++) {
          var key = keys[i];
          var result = $scope._ctrls[key].scope.executeAction({
            focusElement: element,
            logType: pmLog.TYPE.PREMIUM
          });
          if (result === true) {
            return;
          }
        }
      }
    }
  };

  /**
   * listControl.js에서 list를 초기화
   */
  $scope.onInitialized = function(name, scope) {
    $scope._ctrls[name].scope = scope;
    $scope._ctrls[name].initialized = true;
    $scope._ctrls[name].drawed = false;

    var allFinished = true;
    Object.keys($scope._ctrls).forEach(function(name) {
      if ($scope._ctrls[name].initialized === false) {
        allFinished = false;
      }
    });

    if (allFinished) {
      $scope.requestDataASync(false);
    }
  };

  /**
   * 화면 출력
   */
  var onDraw = function(e, response) {
    //response.appCount = 0;  //프리미엄 컨텐츠가 없는 경우 테스트
    e.preventDefault();

    if ($scope.scopeName != '' && $scope.scopeName != response.scopeName) {
      // drawer에서 다른 menu가 선택되었을때
      return;
    }

    /* 필터 출력*/
    // 2016-03-23 변재방 대리님으로 부터 3.0에서 spec out되었다고 해서 주석처리
    /*if (device.q['X-Device-Country'] == 'KR') { //한국인 경우에만 filteroption 하드코딩 적용
      if (device.q['X-Device-Language'] != 'ko-KR') { //메뉴언어가 한국이 아니면 영어로 하드코딩
        var obj = $scope.filterOptionData[0].values;
        for (var i = 0 ; i < obj.length ; i++) {
          if (i == 0) {
            obj[i].name = 'All';
          } else {
            obj[i].name = 'Virtual Set-Top';
          }
        }
      }
      $scope.setSubTitle(); // 부제목 출력
      $scope.showFilter = true;
    }*/

    /* response가 없는 경우*/
    if (response == undefined || response == null || response == '') {
      //TODO : loggingApi.log({errorCode : errorCode,responseData : data});
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생한 경우
      errorCode = "Premium2Depth.001"; // no data
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);

    /* response가 있는 경우*/
    } else {
      if (response.appCount === 0 ) { // appCount가 0이면 리스트화면에 '앱 목록이 없음'이 출력되도록 사전 설정
        response.premiumAppList = null;
      }
      $scope.listData = response;
      $scope.scopeName = response.scopeName;
      $scope.title = storage.getHeadTitle('premium');
      $rootScope.pageManager.setTitle($scope.title);
      $scope.$apply();
      if ($scope.showFilter) { // 필터옵션 버튼에 마우스 이벤트 추가
        $scope.setMouseEvent($element[0].getElementsByClassName('btn-list-option')[0]);
      }
      $element[0].removeAttribute('ng-class');
      // premium 목록을 화면에 출력
      Object.keys($scope._ctrls).forEach(function(name) {
        $scope._ctrls[name].scope.onDraw($scope.listData, requestedAppends);
      });

      requestedAppends = false;
    }
  };

  /**
   * 부제목 설정 : All, Virtual Set-Top
   */
  $scope.setSubTitle = function() {
    var obj = $scope.filterOptionData[0].values;
    for (var i = 0 ; i < obj.length ; i++) {
      if (obj[i].selected == 'TRUE') {  // 필터 option에서 선택된 이름 가져오기
        $scope.subTitle = obj[i].name;
      }
    }
  };

  /**
   * 화면 출력 마무리
   */
  $scope.onDrawFinished = function(name) {
    console.log('premium.onDrawFinished');
    $scope._ctrls[name].drawed = true;

    var allFinished = true;
    Object.keys($scope._ctrls).forEach(function(name) {
      if ($scope._ctrls[name].drawed === false) {
        allFinished = false;
      }
    });

    if (allFinished) {
      $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
    }
  };

  /**
   * 페이지 이동시 list 처리
   */
  var hideList = function(e, page) {
    e.preventDefault();
    if (page != $scope.scopeName) {
      if ($scope.direct == false && $scope.showing == false) {
        if (page == '') {
          $scope.setDefaultFocus();
          $scope.direct = true;
          $element[0].classList.add('direct');
          $rootScope.breadcrumb.onPageFromDeepLink();
          $timeout(function() {
            $scope.setShowAllImage(true);
          }, timeOutValue.SHOWING);
          //$scope.$apply();
        } else {
          $scope.setDefaultFocus();
          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, undefined, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $scope.showing = true;
            $scope.setShowAllImage(true);
          });
          //$scope.$apply();
        }
      }
      premiumListTmpl = null;
      return;
    } else if ($scope.isUpdate) {
      $scope.isUpdate = false;
      $scope.setDefaultFocus();
//      $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, undefined, function() {
//        // breadcrum animation이 종료된 이후 호출되는 callback 임
//        $scope.showing = true;
//      });
      //$scope.$apply();
      return;
    }

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      // $timeout(function() {
        Object.keys($scope._ctrls).forEach(function(name) {
          $scope._ctrls[name].scope.onHide();
        });

        $element.remove();
        $scope.$destroy();
      // }, timeOutValue.DESTROYING);
    });
  };

  /**
   * 포커스 초기화
   */
  $scope.setDefaultFocus = function() {
    var i, arr, itemId, temp, target;

    if (focusManager.getState('option') == true) return;

    /* 필터 Option을 선택한 경우*/
    if(lastFocus.element) {
      target =lastFocus.element;
    /* 상세페이지를 갔다온 경우*/
    } else if ($scope.defaultFocusItem_Id) {
      itemId = $scope.defaultFocusItem_Id;
      $scope.defaultFocusItem_Id = '';

      arr = $element[0].getElementsByClassName('item-premium');
      for (i = 0 ; i < arr.length ; i++) {
        temp = arr[i].getAttribute("id");
        if (itemId === temp) {
          target = arr[i];
          break;
        }
      }
    /* 프리미엄 첫 화면일 경우*/
    } else {
      target = $element[0].getElementsByClassName('item-premium')[0];
    }

    if (target)
    {
      item = target.getAttribute('item');
      $scope.setFocusItem(item, target);
    } else {
      //$scope.setFocusItem('', null);
      if ($scope.showFilter) {
        var element = $element.parent()[0].getElementsByClassName('btn-list-option')[0];
        $scope.setFocusItem(element.getAttribute('item'), element);
      } else {
        if($scope.listData.appCount === 0){
          $rootScope.$broadcast('focus', 'drawer', 'premium');
          $scope.audioGuidance('nodata');
          return;
        }
        var rect = {x: 2000, y: 0, width: 0, height: 0};
        $rootScope.$broadcast('focus', 'drawer', null, rect);
      }
    }
  };

  /**
   * 포커스 제거
   */
  $scope.removeFocus = function() {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus'); // 이전 포커스 삭제
      focusElement = null;                    // 포커스 엘리먼트 초기화
      $rootScope.tooltip.hideTooltip();       // 이전 툴팁 삭제
    }
  };

  /**
   * 4방향키로 포커스 이동
   */
  $scope.moveFocusByKey = function(keyCode, isPageUpDownByChKey) {
    var i, name, element, hidden, scrollY, itemNum, widthSum, listWidth, rect;
    /* 이전 포커스가 option 일 경우*/
    if ($scope.focusItem === 'option') {
      switch (keyCode) {
        case keyHandler.UP:
          var rect = {x: 2000, y: 0, width: 0, height: 0};
          $rootScope.$broadcast('focus', 'drawer', null, rect);
        break;
        case keyHandler.RIGHT:
          if(device.isRTL) {
            $scope.focusToBack();
          }
        break;
        case keyHandler.DOWN:
          if (lastItemFocus && lastFocus.element) {
            // option -> lastItemFocus
            $scope._ctrls['premiumList'].scope.focusFromScroll('prev', true, lastItemFocus);
          } else {
            // not used !!!
            if ($element[0].querySelector('[item="prev"]').style.display !== 'none' &&
              $element[0].querySelector('[item="next"]').style.display !== 'none') {
              var rect = {x: 0, y: 0, width: 0, height: 0};
              $scope.$broadcast('focus', 'scroll', keyCode, rect);
            } else {
              var keys = Object.keys($scope._ctrls);
              for (i = 0 ; i < keys.length ; i++) {
                var key = keys[i];
                var result = $scope._ctrls[key].scope.moveFocusByKey(focusElement, $scope.focusItem, keyCode);
                if (result === true) {
                  return;
                }
              }
            }
          }
        break;
        case keyHandler.LEFT:
          if(!device.isRTL) {
            $scope.focusToBack();
          }
        break;
      }
     return;
     /* 이전 포커스가 없는 경우(첫 페이지 시작)*/
    } else if ($scope.focusItem === '') {
      if (util.isAWSServer()) {
        device.isFocusItem = false;
      }
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }
    /* item 외 다른 곳에 이전 포커스가 적용된 경우*/
    if ($scope.focusItem.indexOf('item') !== 0) {
      switch ($scope.focusItem) {
        case 'back':
          moveFocusFromBack(keyCode);
          break;
      }
      return;
    }

    var keys = Object.keys($scope._ctrls);
    for (i = 0 ; i < keys.length ; i++) {
      var key = keys[i];
      var result = $scope._ctrls[key].scope.moveFocusByKey(focusElement, $scope.focusItem, keyCode, isPageUpDownByChKey);
      if (result === true) {
        return;
      }
    }
  };

  var pageUpDownByChKey = function(e, keyCode) {
    e.preventDefault();
    if (keyCode === keyHandler.CH_DOWN) keyCode = keyHandler.DOWN;
    if (keyCode === keyHandler.CH_UP) keyCode = keyHandler.UP;
    var isPageUpDownByChKey = {};
    isPageUpDownByChKey.index = 0;
    isPageUpDownByChKey.isFrom = true;
    for (var i=0; i<4; i++) {
      isPageUpDownByChKey.index = i;
      $scope.moveFocusByKey(keyCode, isPageUpDownByChKey);
    }
  };

  /* breadcrumb 로 포커스*/
  $scope.focusToBack = function() {
    $rootScope.$broadcast('focus', 'breadcrumbs', function() {
      // right button이 섵택되었을 때 실행될 callback
      moveFocusFromBack(keyHandler.RIGHT);
    });
  };

  /* breadcrumb 에서 포커스 이동*/
  var moveFocusFromBack = function(keyCode) {
    var element, item;

    switch (keyCode) {
      case keyHandler.UP:
        $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
        break;
      case keyHandler.RIGHT:
        if ($scope._ctrls['premiumList'] && $scope._ctrls['premiumList'].scope &&
            $element[0].querySelector('[item="prev"]').style.display !== 'none' &&
            $element[0].querySelector('[item="next"]').style.display !== 'none') {
          $scope._ctrls['premiumList'].scope.focusFromScroll('prev', true, lastItemFocus);
        } else {
          $scope.setDefaultFocus();
        }
        break;
      case keyHandler.DOWN:
        element = $element[0].getElementsByClassName('item-premium')[0];
        item = element.getAttribute('item');
        $scope.setFocusItem(item, element);
        break;
      case keyHandler.LEFT:
        $scope.executeAction();
        break;
    }
  };

  var focusHandler = function(e, target, keycode, rect) {
    var element, gap, selected;

    if (target != 'main') return;
    e.preventDefault();

    if ((keycode === keyHandler.RIGHT) && rect && (rect.left <= 0)) {
      // from breadcrumbs
      moveFocusFromBack(keycode);
      return;
    }

    /* 상단메뉴에서 Option으로 포커스 이동되도록 유도*/
    if ($element.parent()[0] && $scope.showFilter) {
      element = $element.parent()[0].getElementsByClassName('btn-list-option')[0];
      $scope.setFocusItem(element.getAttribute('item'), element);
    } else if ($scope._ctrls['premiumList'] && $scope._ctrls['premiumList'].scope) {
      $scope._ctrls['premiumList'].scope.focusFromScroll('prev', true, lastItemFocus);
    } else {
      $scope.setDefaultFocus();
    }
    /*
    if ($scope._ctrls['premiumList'] && $scope._ctrls['premiumList'].scope) {
      $scope._ctrls['premiumList'].scope.focusFromScroll('prev', true, lastItemFocus);
      return;
    }
    arr = $element[0].getElementsByClassName('item-premium');
    if (arr) {
      selected = arr[0];
      var firstMenuLocation = {
        x : arr[0].offsetLeft + arr[0].offsetWidth/2,
        y : arr[0].offsetTop + arr[0].offsetHeight/2
      };
      var gap = Math.abs(rect.x*rect.x - firstMenuLocation.x*firstMenuLocation.x) + Math.abs(rect.y*rect.y - firstMenuLocation.y*firstMenuLocation.y);
      for (i = 0; i < arr.length; i++) {
        var location = {
            x : arr[i].offsetLeft + arr[i].offsetWidth/2,
            y : arr[i].offsetTop + arr[i].offsetHeight/2
          };
        if(gap > Math.abs(rect.x*rect.x - location.x*location.x) + Math.abs(rect.y*rect.y - location.y*location.y)){
          gap = Math.abs(rect.x*rect.x - location.x*location.x) + Math.abs(rect.y*rect.y - location.y*location.y);
          selected = arr[i];
        }
      }
      $scope.setFocusItem(selected.getAttribute('item'),selected);
    } else {
      $scope.setDefaultFocus();
    }
    */
  };

  ///////////////////////////////////////////////////////////////////////////
  var showAllImage = false;

  $scope.getShowAllImage = function() {
    return showAllImage;
  };

  $scope.setShowAllImage = function(show) {
    showAllImage = show;

    if (show) {
      $scope.$broadcast('lazyImage');
    }
  };
  ///////////////////////////////////////////////////////////////////////////

  /**
   * Premium 초기화
   */
  $scope.initialize = function() {
    console.log('premium.initialize');

    $scope.$on(eventKey.LIST_PREMIUM, onDraw);
    $scope.$on('hiding', hideList);
    $scope.$on('focus', focusHandler);
    $scope.$on(eventKey.RECOVER_FOCUS, $scope.recoverFocus);
    $scope.$on(eventKey.LIST_PAGE_UP_DOWN, pageUpDownByChKey);
  };

  $scope.initialize();
});
