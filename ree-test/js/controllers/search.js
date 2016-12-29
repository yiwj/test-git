app.directive('search', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'searchController',
    templateUrl: './resources/html/search.html',
    link : function($scope, $element) {
      $element.off('input');
      $element.on('input', function(){
        $timeout(function(){
          $scope.inputStringAction();
        },50);
      });
      $element.on('keydown keypress', function(event){
        if(event.which == 13 && event.keyIdentifier == 'Enter') {
          $scope.inputEnterAction(event);
        }else if(event.which == 40 && event.keyIdentifier == 'Down'){
          if($element[0].querySelector('[item="popular0"]')){
            var searchinput = $element[0].getElementsByClassName('inp-text')[0];
            searchinput.blur();
          }
        }
      });
    }
  };
}]);

app.directive('searchThumbResizable', function() {
  return {
    link: function($scope, $element, util) {
      $element.bind('load', function(e) {
        console.log('thumbResizable');
        var x, y, w, h, parentH, parentW, imgW, imgH, parent_rate, img_rate;
        if ($element[0].getAttribute('src') == 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=') return;
        if (this.parentElement.parentElement.getAttribute('modulename') == 'Apps3Depth') {
          this.parentElement.parentElement.classList.add('search-item-app');
        }
        parentH = this.parentElement.clientHeight;
        parentW = this.parentElement.clientWidth;
        imgW = this.naturalWidth;
        imgH = this.naturalHeight;
        parent_rate = parentW/parentH;
        img_rate = imgW/imgH;
        if(img_rate >= parent_rate) {
          if( parent_rate/img_rate < 0.8 ) {
            $element[0].style.width = 'inherit';
          }else{
            $element[0].style.height = 'inherit';
          }
        }else{
          if( img_rate/parent_rate < 0.8 ) {
            $element[0].style.height = 'inherit';
          }else{
            $element[0].style.width = 'inherit';
          }
        }
        this.style.position = 'inherit';//style 이 틀어져서 임시로 추가
      });
    }
  };
});

app.controller('searchController', function($scope, $controller, $element, $timeout, $rootScope, server, marquee, pageManager, focusManager, util, keyHandler, timeOutValue, storage, pmLog, eventKey, device) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  $scope.scopeName = 'search';

  var focusElement = null;
  var lastFocus = {};
  var previousPosition = 0;
  var maxPosition = 0;
  var requestedAppends = false;
  var listHeight = 0;
  var searchVal = '';

  $scope.showing = false;
  $scope.hiding = false;
  $scope.direct = false;
  $scope.focusItem = '';
  $scope.listData = null;
  $scope.title = '';
  $scope.drawed = false;
  $scope.item_id = '';
  $scope.searchTitle = '';
  $scope.searchPopular = {};
  $scope.searchSuggest = {};
  $scope.recentSearch = [];
  $scope.recentResult = [];
  $scope.showRecent = false;
  $scope.showResult = false;
  $scope.mode = 'default'; //default, suggest
  $scope.input = false;
  $scope.del_mode = false;
  $scope.disableDel = true;
  $rootScope.pmLogValue = pmLog.TYPE.SEARCH;

  $scope.popularkeywords ='';
  $scope.RecentSearches = '';
  $scope.recentResults = '';
  $scope.suggestedKeyword = '';
  $scope.deletebtnText = '';

  var initailizeSearch = function(){
    $scope.input = false;
    $scope.mode = 'default';
    lastFocus = {};
    searchVal = '';
    $element[0].getElementsByClassName('inp-text')[0].value = '';
  };

  //input box string 입력에 대한 행동 정의
  $scope.inputStringAction = function() {
    if ($element[0].getElementsByClassName('inp-text')[0].value != undefined) {
      searchVal = $element[0].getElementsByClassName('inp-text')[0].value;
    }
    if (searchVal == "") {//입력된 스트링이 빈값이 아니라면 suggest 화면으로 갱신
      $scope.input = false;
      $scope.mode = 'default';
      $scope.$apply();
    } else {
      getSearchSuggest();
    }
  };
  //input box enter 입력에 대한 행동 정의
  $scope.inputEnterAction = function(event) {
    var searchinput = $element[0].getElementsByClassName('inp-text')[0];
    if (searchinput.value && searchinput.value!= "" && $scope.mode == "suggest") {
      var moveItem = searchinput.value;
      searchinput.blur();
      //search result page가 back으로 가있고 현재 입력된 검색어와 같다면 search만 숨긴다.
      if (document.querySelector('[search-result=""]')) {
        if (document.querySelector('[search-result=""]').getAttribute('item') == moveItem) {
          return;
        }
      }
      moveSearchResult(moveItem, '');
    }
  };

  $scope.setFocusItem = function(item, element) {
    var y;

    if (lastFocus.item == 'back' || 'delBtn'|| 'cancelBtn') {
      $rootScope.tooltip.hideTooltip();
    }
    $scope.focusItem = item;

    if (focusElement) {
      focusElement.classList.remove('focus');
    }
    focusElement = element;
    if (focusElement) {
      focusElement.classList.add('focus');
    }
    if (item) {
      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
      focusManager.setCurrent($scope, item);
      lastFocus.item = item;
      lastFocus.element = element;
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }

    if ($scope.focusItem == 'back') {
      $rootScope.tooltip.showTooltip(50, 107, $rootScope.pageManager.getTitle('back'), true, true);
    } else if ($scope.focusItem == 'delBtn') {
      $rootScope.tooltip.showTooltip(50, 250, msgLang.delete, false, true);
    } else if ($scope.focusItem == 'cancelBtn') {
      $rootScope.tooltip.showTooltip(50, 250, msgLang.cancel, false, true);
    }
  };

  $scope.recoverFocus = function() {
    if (lastFocus.item && lastFocus.element)
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  $scope.setFilter = function(filter, value) {
    $scope['selected' + filter] = value;
    requestedAppends = false;
    util.async(requestData);
  };

  $scope.executeAction = function() {
    if (focusManager.blockExecution()) {
      console.log('search.executeAction, blockExecution is true');
      return;
    }

    var focusObject, del_check_len, i, del_keyword = [], del_result = [], item, page, itemId;
    var searchinput = $element[0].getElementsByClassName('inp-text')[0];

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      if (focusObject.target == 'back') {
        $rootScope.breadcrumb.executeBack($scope.scopeName, function() {
          //$scope.hideSearchMain();
          $rootScope.$broadcast('focus', 'drawer', null, {x: 0, y: 0, width: 0, height: 0});
          var obj = $rootScope.pageManager.popHistory();
          $rootScope.draw(obj);
        });
      } else if (focusObject.target == 'searchInp') {
        searchinput.focus();
        searchinput.classList.remove('on');
        searchinput.classList.remove('focus');
        initSearchPopular($scope.searchPopular);
      } else if (focusObject.target == 'delBtn') {
        //delete button click
        $scope.del_mode = true;
        $scope.setFocusItem('cancelBtn', $element[0].querySelector('[item="cancelBtn"]'));
      } else if (focusObject.target.indexOf('popular') > -1 || focusObject.target.indexOf('suggest') > -1) {
        //recent search click
        //move to search result
        var search_keyword = focusElement.getElementsByClassName('text')[0].textContent;
        if (focusObject.target.indexOf('popular') > -1) {
          moveSearchResult(search_keyword, 'Popular keyword');
        } else {
          moveSearchResult(search_keyword, 'Suggested Keywords');
        }
        return;
      } else if (focusObject.target.indexOf('recent') > -1) {
        //recent search click
        if ($scope.del_mode) {
          if (focusElement.className.indexOf('check-on') > -1) {
            focusElement.classList.remove('check-on');
          } else {
            focusElement.classList.add('check-on');
          }
        } else {
          //move to search result
          var search_keyword = focusElement.getElementsByClassName('text')[0].textContent;
          moveSearchResult(search_keyword, 'Recent Searches');
          return;
        }
      } else if (focusObject.target.indexOf('result') > -1) {
        //recent result click
        if ($scope.del_mode) {
          if (focusElement.className.indexOf('check-on') > -1) {
            focusElement.classList.remove('check-on');
          } else {
            focusElement.classList.add('check-on');
          }
        } else {
          var contents_id = focusElement.getAttribute('item-id');
          var contents_category = '';
          var keyword = focusElement.getAttribute('storkeyword');
          if (focusElement.getAttribute('modulename') == 'TVShowDetail' || focusElement.getAttribute('modulename') == 'MovieShowDetail') {
            if (focusElement.getAttribute('modulename') == 'TVShowDetail') {
              contents_category = pmLog.TYPE.TVSHOWS;
            } else {
              contents_category = pmLog.TYPE.MOVIE;
            }
            page = 'detailList';
            itemId = focusElement.getAttribute('item-type') + '|' + focusElement.getAttribute('item-id');
          } else if (focusElement.getAttribute('modulename') == 'detailApp') {
            contents_category = pmLog.TYPE.APPGAME;
            itemId = focusElement.getAttribute('item-id');
            page = 'detailApp';
          }
          pmLog.write(pmLog.LOGKEY.SEARCH_CONTENT_CLICK , {
            contents_id : contents_id,
            contents_category : contents_category,
            keyword : keyword
          });

          $rootScope.isFromSearch = true;
          $scope.keyword = focusElement.getAttribute('storkeyword');
          $rootScope.draw({
            page: page,
            module: itemId,
            from : 'search',
            query : $scope.keyword,
            inLink: true
          });
        }
      } else if (focusObject.target == 'cancelBtn') {
        //cancel btn click
        $scope.deleteRecentsCancel();
      } else if (focusObject.target == 'delTextBtn') {
        // delete text button click
        // remove local storage data
        del_check_len = $element[0].getElementsByClassName('check-on').length;
        for (i=0; i < del_check_len; i++) {
          if ($element[0].getElementsByClassName('check-on')[i].getAttribute('item').indexOf('recent') > -1) {
            del_keyword.push($element[0].getElementsByClassName('check-on')[i].getElementsByClassName('text')[0].textContent);
          } else if ($element[0].getElementsByClassName('check-on')[i].getAttribute('item').indexOf('result') > -1) {
            del_result.push($element[0].getElementsByClassName('check-on')[i].getAttribute('item_id'));
          }
          $element[0].getElementsByClassName('check-on')[i].remove();
        }
        storage.removeRecentKeyword(del_keyword);
        storage.removeRecentResult(del_result);
        $scope.del_mode = false;
        var recent_search_result = storage.getRecentSearchResult();
        var recent_search_keyword = storage.getRecentSearchKeyword();
        if (recent_search_result == null || recent_search_result == undefined || recent_search_result == '[]') showResult = false;
        if (recent_search_keyword == null || recent_search_keyword == undefined || recent_search_keyword == '[]') showResult = false;
        $scope.setFocusItem('delBtn', $element[0].querySelector('[item="delBtn"]'));
      }
      del_check_len = $element[0].getElementsByClassName('check-on').length;
      if (parseInt(del_check_len) > 0) {
        $scope.disableDel = false;
      } else {
        $scope.disableDel = true;
      }
    }
    $scope.$apply();
  };

  $scope.deleteRecentsCancel = function() {
    var del_check_len = $element[0].getElementsByClassName('check-on').length;
    for (var i = 0; i < del_check_len; i++) {
      $element[0].getElementsByClassName('check-on')[0].classList.remove('check-on');
    }
    $scope.del_mode = false;
    $scope.setFocusItem('delBtn', $element[0].querySelector('[item="delBtn"]'));
    $scope.$apply();
  };

  $scope.drawSearchMain = function() {
    //message setting
    $scope.popularkeywords = msgLang.search_popularKeyword;
    $scope.RecentSearches = msgLang.search_recentKeyword;
    $scope.recentResults = msgLang.search_recentresults;
    $scope.suggestedKeyword = msgLang.search_suggestedKeywords;
    $scope.deletebtnText = msgLang.delete;

    getSearchTitle();
    getSearchPopular();
    getRecentSearch();
    getRecentResult();

    //set button mouse event
    var del_btn = $element[0].getElementsByClassName('btn-del')[0];
    var cancel_btn = $element[0].getElementsByClassName('btn-cancel')[0];
    var del_text_btn = $element[0].getElementsByClassName('btn-small')[0];
    $scope.setMouseEvent(del_btn);
    $scope.setMouseEvent(cancel_btn);
    $scope.setMouseEvent(del_text_btn);
    $element[0].removeAttribute('ng-class');
    //set title for historyback
    $rootScope.pageManager.setTitle(msgLang.search_title);
    $scope.$emit('finishDraw', $scope.scopeName);
  };

  $scope.hideSearchMain = function() {
    $element[0].getElementsByClassName('inp-text')[0].blur();//입력부분 커서제거
    //$scope.showing = false;
    focusManager.setState('drawer', false);
    //drawer icon close 으로 변경
//    drawer_knob_element = angular.element(document.getElementsByClassName('drawer-knob'))[0];
//    drawer_knob_element.style.backgroundPosition = '21px 10px';
    $timeout(function(){
      initailizeSearch();
    },500); //애니메이션이 0.33s이므로 0.5s 뒤에 initiialize하여 그 과정이 보이지 않도록 한다.
    //$scope.$apply();
  };

  var getSearchTitle = function() {
    if (!device.isLocalJSON) {
      // local IP, Server용
      var params = {
        api: '/rest/sdp/v6.0/search/direction',
        method: 'post',
        payload: {
          version: 'v1',
          service: 'lgstore'
        }
      };
      util.async(server.requestApi(eventKey.SEARCH_TITLE, params));
    } else {
      // localhost, file용
      var payload = {
        version: 'v1',
        service: 'lgstore'
      };
      util.async(server.requestSearchTitle(payload));
    }
  };

  var getSearchPopular = function() {
    if (!device.isLocalJSON) {
      // local IP, Server용
      var params = {
        api: '/rest/sdp/v6.0/search/popular_keyword',
        method: 'post',
        payload: {
          maxresults: '20',
          version: 'v1',
          service: 'lgstore'
        }
      };
      util.async(server.requestApi(eventKey.SEARCH_POPULAR, params));
    } else {
      // localhost, file용
       var payload = {
       maxresults : '20',
       version : 'v1',
       service : 'lgstore'
       };
       util.async(server.requestSearchPopular(payload));
    }
  };

  var getSearchSuggest = function() {
    var re = /[\\]/gi, rs=/[\"]/gi; //api 요청시 특수문자 인식못함
    var input = searchVal.replace(re,'\\\\').replace(rs,'\\\"');

    if (!device.isLocalJSON) {
      // server data용
      var params = {
        api: '/rest/sdp/v6.0/search/auto_keyword',
        method: 'post',
        payload: {
          query: input,
          version: 'v1',
          service: 'lgstore',
          startindex: '1',
          maxresults: '8',
          domain: ['movie', 'tvshow', 'app', 'youtube', '3d', 'premium', 'cp', 'web']
        }
      };
      util.async(server.requestApi(eventKey.SEARCH_SUGGEST, params));
    } else {
      // local json용
      var payload = {
        query: input,
        version: 'v1',
        service: 'lgstore',
        startindex: '1',
        maxresults: '8',
        domain: ['movie', 'tvshow', 'app', 'youtube', '3d', 'premium', 'cp', 'web']
      };
      util.async(server.requestSearchSuggest(payload));
    }
  };

  var getRecentSearch = function() {
    var i, recent_search_keyword = storage.getRecentSearchKeyword();
    if (recent_search_keyword != null && recent_search_keyword != undefined && recent_search_keyword != '[]') {
        var data = JSON.parse(recent_search_keyword).reverse();
        $scope.recentSearch = data;
        $scope.showRecent = true;
        $timeout(function() {
          $scope.$apply();
          l = $element[0].getElementsByClassName('recent-keyword').length;
          for(i = 0; i < l; i++) {
            obj = $element[0].getElementsByClassName('recent-keyword')[i];
            $scope.setMouseEvent(obj);
          }
        });
    }
  };

  var getRecentResult = function() {
    var i, recent_search_result = storage.getRecentSearchResult();
    if (recent_search_result != null && recent_search_result != undefined && recent_search_result != '[]') {
      var data = JSON.parse(recent_search_result).reverse();
        for(i = 0; i<data.length; i++) {
          if (data[i].moduleName === 'TVShowDetail') {
            data[i].item_type = 'TS';
          } else if (data[i].moduleName === 'MovieShowDetail') {
            data[i].item_type = 'MV';
          } else if (data[i].moduleName === 'detailApp') {
            data[i].item_type = 'App';
          }
        }
        $scope.recentResult = data;
        $scope.showResult = true;
        $timeout(function() {
          $scope.$apply();
          //set recent search result mouse event
          l = $element[0].getElementsByClassName('item-recent').length;
          for(i = 0; i < l; i++) {
            obj = $element[0].getElementsByClassName('item-recent')[i];
            $scope.setMouseEvent(obj);
          }
        });
    }
  };

  var setSearchTitle = function(e, data) {
    e.preventDefault();
    var title;

    try{
      if(data != undefined){
        $scope.searchTitle = data.response.results[0].direction;
        //set input box mouse event
        initializeInputBox();
      }else{
      }
    } catch(e){
    }
  };

  var setSearchPopular = function(e, data) {
    e.preventDefault();

    try{
      if(data != undefined){
        initSearchPopular(data);
      }else{
      }
    } catch(e){
    }
  };

  var initSearchPopular = function(data) {
    if ($scope.searchPopular.length != undefined) {
      $scope.searchPopular.sort(function() {return 0.5 - Math.random();});
    } else {
      $scope.searchPopular = data.response.results;
    }
    $scope.$apply();
    //set popular keyword mouse event
    l = $element[0].getElementsByClassName('search-keywords')[0].getElementsByClassName('area-text').length;
    for(i = 0; i < l; i++) {
      obj = $element[0].getElementsByClassName('search-keywords')[0].getElementsByClassName('area-text')[i];
      $scope.setMouseEvent(obj);
    }
  };

  var setSearchSuggest = function(e, data) {
    e.preventDefault();
    try{
      if(data !== undefined && searchVal !== ''){
        if ($scope.searchSuggest != undefined){
          if($scope.searchSuggest.length != undefined){
            $scope.searchSuggest.sort(function() {return 0.5 - Math.random();});
          }
        }
        $scope.searchSuggest = data.response.results;
        $scope.input = true;
        $scope.mode = 'suggest';
        $scope.$apply();
        //set popular keyword mouse event
        l = $element[0].getElementsByClassName('search-keywords')[2].getElementsByClassName('area-text').length
        for(i = 0; i < l; i++) {
          obj = $element[0].getElementsByClassName('search-keywords')[2].getElementsByClassName('area-text')[i];
          $scope.setMouseEvent(obj);
        }
      }else{
      }
    } catch(e){
    }
  };

  var moveSearchResult = function(keyword, keyword_type){
    storage.addRecentKeyword(keyword); //search keyword list의 최상위로 배치하기 위함

    if (keyword_type === 'Suggested Keywords') {
      pmLog.write(pmLog.LOGKEY.SEARCH_AUTO_COMPLETE , {
        keyword : keyword,
        shelf_id : keyword_type
      });
    } else if (keyword_type === '') {
      pmLog.write(pmLog.LOGKEY.SEARCH_ENTER, {
        keyword : keyword
      });
    } else {
      pmLog.write(pmLog.LOGKEY.SEARCH_REQ , {
        keyword : keyword,
        shelf_id : keyword_type
      });
    }
    $rootScope.draw({page: 'searchResult', module: keyword, inLink: true});
  };

  var initializeInputBox = function(){
    var inputbox;
    inputbox = $element[0].getElementsByClassName('inp-text')[0];
    $scope.setMouseEvent(inputbox);
  };

  $scope.setDefaultFocus = function() {
    var item = $element[0].getElementsByClassName('inp-text')[0];
    $scope.setFocusItem('searchInp', item);
    item.focus(); //커서를 인풋박스에 위치
    item.classList.remove('on');
    item.classList.remove('focus');
  };

  $scope.removeFocus = function(target) {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
      $rootScope.tooltip.hideTooltip();
    }
  };

  $scope.moveFocusByKey = function(keyCode) {

    if ($scope.focusItem == '') {
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    if (focusElement) {
      focusManager.setCurrent($scope,focusElement.getAttribute('item'));
    }

    $element[0].getElementsByClassName('inp-text')[0].blur();
    if($scope.mode == 'default'){
      moveFocusDefault(keyCode);
    }else if($scope.mode == 'suggest'){
      moveFocusSuggest(keyCode);
    }
  };

  var moveFocusDefault = function(keyCode){
    var searchinput = $element[0].getElementsByClassName('inp-text')[0];
    var focusTarget = focusManager.getCurrent().target;
    switch (keyCode) {
      case keyHandler.LEFT:
        //popular인 경우
        if (focusTarget.indexOf('popular') != -1 || focusTarget == 'searchInp') {
          $scope.setFocusItem('back', $element[0].querySelector('[item="back"]'));
        } else if (focusTarget == 'cancelBtn') {
          $scope.setFocusItem('delTextBtn', $element[0].querySelector('[item="delTextBtn"]'));
        } else if (focusTarget == 'delTextBtn') {
          $scope.setFocusItem('back', $element[0].querySelector('[item="back"]'));
        //recent인 경우
        } else if (focusTarget.indexOf('recent') != -1 && !$scope.del_mode) {
          var itemNum = parseInt(focusTarget.replace('recent', ''));
          var lastResultNum;
          if ($element[0].getElementsByClassName('search-keywords')[1].getElementsByClassName('area-text').length !== 0) {
            lastRecentNum = $element[0].getElementsByClassName('search-keywords')[1].getElementsByClassName('area-text').length -1;
          } else {
            return;
          }
          if ($element[0].querySelector('[item="popular'+itemNum+'"]')) {
            $scope.setFocusItem('popular'+itemNum, $element[0].querySelector('[item="popular'+itemNum+'"]'));
          } else if ($element[0].querySelector('[item="popular'+lastRecentNum+'"]')) {
            $scope.setFocusItem('popular'+lastRecentNum, $element[0].querySelector('[item="popular'+lastRecentNum+'"]'));
          }
        } else if (focusTarget.indexOf('recent') != -1 && $scope.del_mode) {
          $scope.setFocusItem('back', $element[0].querySelector('[item="back"]'));
        } else if (focusTarget =='delBtn') {
          searchinput.classList.add('on');
          $scope.setFocusItem('searchInp', searchinput);
          //result인 경우
        } else if (focusTarget.indexOf('result') != -1) {
          var itemNum = parseInt(focusTarget.replace('result', ''));
          var lastRecentNum;
          if ($element[0].getElementsByClassName('search-keywords')[1].getElementsByClassName('area-text').length !== 0) {
            lastRecentNum = $element[0].getElementsByClassName('search-keywords')[1].getElementsByClassName('area-text').length -1;
          } else {
            return;
          }
          if (itemNum == 0) {
            if ($element[0].querySelector('[item="recent2"]')) {
              $scope.setFocusItem('recent2', $element[0].querySelector('[item="recent2"]'));
            } else if ($element[0].querySelector('[item="recent'+lastRecentNum+'"]')){
              $scope.setFocusItem('recent'+lastRecentNum, $element[0].querySelector('[item="recent'+lastRecentNum+'"]'));
            }
          } else if (itemNum == 3) {
            if ($element[0].querySelector('[item="recent3"]')) {
              $scope.setFocusItem('recent3', $element[0].querySelector('[item="recent3"]'));
            } else if ($element[0].querySelector('[item="recent'+lastRecentNum+'"]')){
              $scope.setFocusItem('recent'+lastRecentNum, $element[0].querySelector('[item="recent'+lastRecentNum+'"]'));
            }
          } else {
            var nextNum = itemNum - 1;
            if ($element[0].querySelector('[item="result'+nextNum+'"]')) {
              $scope.setFocusItem('result'+nextNum, $element[0].querySelector('[item="result'+nextNum+'"]'));
            }
          }
        }
        break;
      case keyHandler.UP:
        if (focusTarget == 'searchInp') {
          searchinput.classList.remove('on');
          //searchinput.blur();
          if ($scope.del_mode) {
            if ($scope.disableDel) {
              $scope.setFocusItem('cancelBtn', $element[0].querySelector('[item="cancelBtn"]'));
            } else {
              $scope.setFocusItem('delTextBtn', $element[0].querySelector('[item="delTextBtn"]'));
            }
          } else {
            $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
          }
        } else if (focusTarget == 'delBtn' ||focusTarget == 'delTextBtn' ||focusTarget == 'cancelBtn'){
          $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
          //첫번째 아이템 들인 경우
        } else if (focusTarget == 'recent0' ||
            focusTarget == 'popular0' ||
            focusTarget == 'result0'){
          if ($scope.del_mode) {
            if ($scope.disableDel) {
              $scope.setFocusItem('cancelBtn', $element[0].querySelector('[item="cancelBtn"]'));
            } else {
              $scope.setFocusItem('delTextBtn', $element[0].querySelector('[item="delTextBtn"]'));
            }
          } else {
            searchinput.classList.add('on');
            $scope.setFocusItem('searchInp', searchinput);
          }
        //2,3번째 result인 경우
        } else if (focusTarget == 'result1' || focusTarget == 'result2'){
          var delButton = $element[0].querySelector('[item="delBtn"]');
          if ($scope.del_mode) {
            if ($scope.disableDel) {
              $scope.setFocusItem('cancelBtn', $element[0].querySelector('[item="cancelBtn"]'));
            } else {
              $scope.setFocusItem('delTextBtn', $element[0].querySelector('[item="delTextBtn"]'));
            }
          } else if (delButton) {
            $scope.setFocusItem('delBtn', delButton);
          }
        //popularitem인 경우
        } else if (focusTarget.indexOf('popular') != -1) {
          var itemNum = parseInt(focusTarget.replace('popular', ''));
          var nextNum = itemNum - 1;
          if($element[0].querySelector('[item="popular'+nextNum+'"]')){
            $scope.setFocusItem('popular'+nextNum, $element[0].querySelector('[item="popular'+nextNum+'"]'));
          }
        //첫번째 아이템이 아니고 recent인 경우
        } else if (focusTarget.indexOf('recent') != -1) {
          var itemNum = parseInt(focusTarget.replace('recent', ''));
          var nextNum = itemNum - 1;
          if ($element[0].querySelector('[item="recent'+nextNum+'"]')) {
            $scope.setFocusItem('recent'+nextNum, $element[0].querySelector('[item="recent'+nextNum+'"]'));
          }
        //result인 경우
        } else if (focusTarget.indexOf('result') != -1) {
          var itemNum = parseInt(focusTarget.replace('result', ''));
          var nextNum = itemNum - 3;
          if ($element[0].querySelector('[item="result'+nextNum+'"]')) {
            $scope.setFocusItem('result'+nextNum, $element[0].querySelector('[item="result'+nextNum+'"]'));
          }
        }
        break;
      case keyHandler.RIGHT:
        if (focusTarget == 'back') {
          if ($scope.del_mode) {
            $scope.setFocusItem('delTextBtn', $element[0].querySelector('[item="delTextBtn"]'));
          } else {
            $scope.setFocusItem('searchInp', $element[0].querySelector('[item="searchInp"]'));
          }
        //검색 입력부분인 경우
        } else if (focusTarget == 'searchInp') {
          //searchinput.blur();
          var delButton = $element[0].querySelector('[item="delBtn"]');
          if (delButton) {
            $scope.setFocusItem('delBtn', delButton);
          }
        } else if (focusTarget == 'delTextBtn') {
          $scope.setFocusItem('cancelBtn', $element[0].querySelector('[item="cancelBtn"]'));
        //popular인 경우
        } else if (focusTarget.indexOf('popular') != -1) {
          var itemNum = parseInt(focusTarget.replace('popular', ''));
          var lastRecentNum;
          if ($element[0].getElementsByClassName('search-keywords')[1].getElementsByClassName('area-text').length != 0) {
            lastRecentNum = $element[0].getElementsByClassName('search-keywords')[1].getElementsByClassName('area-text').length -1;
          } else {
            return;
          }
          if ($element[0].querySelector('[item="recent'+itemNum+'"]')) {
            $scope.setFocusItem('recent'+itemNum, $element[0].querySelector('[item="recent'+itemNum+'"]'));
          } else if ($element[0].querySelector('[item="recent'+lastRecentNum+'"]')) {
            $scope.setFocusItem('recent'+lastRecentNum, $element[0].querySelector('[item="recent'+lastRecentNum+'"]'));
          }
        //recent인 경우
        } else if (focusTarget.indexOf('recent') != -1) {
          var itemNum = parseInt(focusTarget.replace('recent', ''));
          var lastResultNum;
          if ($element[0].getElementsByClassName('wrap-recent-list')[0].getElementsByClassName('cont-wrap')[0].children.length != 0) {
            lastRecentNum = $element[0].getElementsByClassName('wrap-recent-list')[0].getElementsByClassName('cont-wrap')[0].children.length -1;
          } else {
            return;
          }
          if (itemNum<3) {
            if ($element[0].querySelector('[item="result0"]')) {
              $scope.setFocusItem('result0', $element[0].querySelector('[item="result0"]'));
            }
          } else {
            if ($element[0].querySelector('[item="result3"]')) {
              $scope.setFocusItem('result3', $element[0].querySelector('[item="result3"]'));
            } else {
              $scope.setFocusItem('result0', $element[0].querySelector('[item="result0"]'));
            }
          }
        //result의 경우
        } else if (focusTarget.indexOf('result') != -1) {
          var itemNum = parseInt(focusTarget.replace('result', ''));
          var lastResultNum;
          if (itemNum == 2 || itemNum == 5) {
            return;
          }
          var nextNum = itemNum+1;
          if ($element[0].querySelector('[item="result'+nextNum+'"]')) {
            $scope.setFocusItem('result'+nextNum, $element[0].querySelector('[item="result'+nextNum+'"]'));
          }
        }
        break;
      case keyHandler.DOWN:
        //inputbox인 경우
        if (focusTarget == 'searchInp') {
          var firstItem = $element[0].querySelector('[item="popular0"]');
          if ($scope.del_mode) {
            if ($element[0].querySelector('[item="recent0"]')) {
              firstItem = $element[0].querySelector('[item="recent0"]');
            } else if ($element[0].querySelector('[item="result0"]')) {
              firstItem = $element[0].querySelector('[item="result0"]');
            }
          }
          if (firstItem) {
            $scope.setFocusItem(firstItem.getAttribute('item'), firstItem);
            //searchinput.blur();
          }
        //popular keyword인 경우
        } else if (focusTarget =='delBtn' ||focusTarget == 'delTextBtn' ||focusTarget == 'cancelBtn') {
          if ($element[0].querySelector('[item="result2"]')) {
            $scope.setFocusItem('result2', $element[0].querySelector('[item="result2"]'));
          } else if ($element[0].querySelector('[item="result1"]')) {
            $scope.setFocusItem('result1', $element[0].querySelector('[item="result1"]'));
          } else if ($element[0].querySelector('[item="result0"]')) {
            $scope.setFocusItem('result0', $element[0].querySelector('[item="result0"]'));
          } else if ($element[0].querySelector('[item="recent0"]')) {
            $scope.setFocusItem('recent0', $element[0].querySelector('[item="recent0"]'));
          } else if ($element[0].querySelector('[item="popular0"]')) {
            $scope.setFocusItem('popular0', $element[0].querySelector('[item="popular0"]'));
          }
        } else if (focusTarget.indexOf('popular') != -1) {
          var itemNum = parseInt(focusTarget.replace('popular', ''));
          var nextNum = itemNum + 1;
          if ($element[0].querySelector('[item="popular'+nextNum+'"]')) {
            $scope.setFocusItem('popular'+nextNum, $element[0].querySelector('[item="popular'+nextNum+'"]'));
          }
        //recent keyword인 경우
        } else if (focusTarget.indexOf('recent') != -1) {
          var itemNum = parseInt(focusTarget.replace('recent', ''));
          var nextNum = itemNum + 1;
          if ($element[0].querySelector('[item="recent'+nextNum+'"]')) {
            $scope.setFocusItem('recent'+nextNum, $element[0].querySelector('[item="recent'+nextNum+'"]'));
          }
        //result인 경우
        } else if (focusTarget.indexOf('result') != -1) {
          var itemNum = parseInt(focusTarget.replace('result', ''));
          var nextNum = itemNum + 3;
          if ($element[0].querySelector('[item="result'+nextNum+'"]')) {
            $scope.setFocusItem('result'+nextNum, $element[0].querySelector('[item="result'+nextNum+'"]'));
          }
        }
        break;
    }
  };

  var moveFocusSuggest = function(keyCode){
    var searchinput = $element[0].getElementsByClassName('inp-text')[0];
    var focusTarget = focusManager.getCurrent().target;
    switch (keyCode) {
      case keyHandler.LEFT:
        if (focusTarget == 'searchInp' || focusTarget.indexOf('recent') != -1) {
          $scope.setFocusItem('back', $element[0].querySelector('[item="back"]'));
        }
        break;
      case keyHandler.UP:
        if(focusTarget == 'searchInp'){
          searchinput.classList.remove('on');
          //searchinput.blur();
          $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
        }else if(focusTarget == 'delBtn'){
          $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
          //첫번째 아이템 들인 경우
        }else if(focusTarget == 'suggest0'){
          searchinput.classList.add('on');
          $scope.setFocusItem('searchInp', searchinput);
        }else if(focusTarget.indexOf('suggest') != -1){
          var itemNum = parseInt(focusTarget.replace('suggest', ''));
          var nextNum = itemNum - 1;
          if($element[0].querySelector('[item="suggest'+nextNum+'"]')){
            $scope.setFocusItem('suggest'+nextNum, $element[0].querySelector('[item="suggest'+nextNum+'"]'));
          }
        }
        break;
      case keyHandler.RIGHT:
        if (focusTarget == 'back') {
          $scope.setFocusItem('searchInp', $element[0].querySelector('[item="searchInp"]'));
        }
        break;
      case keyHandler.DOWN:
        //inputbox인 경우
        if(focusTarget == 'searchInp'){
          var firstItem = $element[0].querySelector('[item="suggest0"]');
          if(firstItem){
            $scope.setFocusItem(firstItem.getAttribute('item'), firstItem);
            searchinput.classList.remove('on');
            //searchinput.blur();
          }
        //popular keyword인 경우
        }else if(focusTarget =='delBtn'){
          if($element[0].querySelector('[item="suggest0"]')){
            $scope.setFocusItem('suggest0', $element[0].querySelector('[item="suggest0"]'));
          }
        }else if(focusTarget.indexOf('suggest') != -1){
          var itemNum = parseInt(focusTarget.replace('suggest', ''));
          var nextNum = itemNum + 1;
          if($element[0].querySelector('[item="suggest'+nextNum+'"]')){
            $scope.setFocusItem('suggest'+nextNum, $element[0].querySelector('[item="suggest'+nextNum+'"]'));
          }
        }
        break;
    }
  };

  var focusHandler = function(e, target, keyCode, rect) {
    if (target != 'main') return;
    e.preventDefault();
    //drawer에서부터 온 case
    var searchinput = $element[0].getElementsByClassName('inp-text')[0];
    if($scope.del_mode){
      if($scope.disableDel){
        $scope.setFocusItem('cancelBtn', $element[0].querySelector('[item="cancelBtn"]'));
      }else{
        $scope.setFocusItem('delTextBtn', $element[0].querySelector('[item="delTextBtn"]'));
      }
    }else{
      searchinput.classList.add('on');
      $scope.setFocusItem('searchInp', searchinput);
    }
  };

  $scope.hideSearch = function(e, page) {
    e.preventDefault();
    if (page != $scope.scopeName) {
      if ($scope.direct == false && $scope.showing == false) {
        if (page == '') {
          $scope.direct = true;
          $rootScope.breadcrumb.onPageFromDeepLink();
          $scope.$apply();
          $timeout(function() {
            $scope.setDefaultFocus();
          }, 100)
        } else {
          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, undefined, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $scope.showing = true;
            $scope.$apply();
            $timeout(function() {
              $scope.setDefaultFocus();
            }, 100);
          });
        }
      }
      return;
    }

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      // $timeout(function() {
        $element.remove();
        $scope.$destroy();
      // }, timeOutValue.DESTROYING);
    });
  };

  $scope.initialize = function() {
    //$rootScope.search = $scope;
    $scope.$on(eventKey.SEARCH_TITLE, setSearchTitle);
    $scope.$on(eventKey.SEARCH_POPULAR, setSearchPopular);
    $scope.$on(eventKey.SEARCH_SUGGEST, setSearchSuggest);
    $scope.$on('focus', focusHandler);
    $scope.$on(eventKey.RECOVER_FOCUS, $scope.recoverFocus);
    //$scope.$on('hiding', $scope.hideSearchMain);
    $scope.$on('hiding', $scope.hideSearch);
    $scope.drawSearchMain();
  };

  $scope.initialize();
});
