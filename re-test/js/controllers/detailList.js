app.directive('listDetail', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'listDetailController',
    // templateUrl: './resources/html/detailList.html'
    template: detailListTmpl
  };
});

app.controller('listDetailController', function($scope, $controller, $element, $rootScope, $timeout, server, focusManager, keyHandler, marquee, util, device, membership, appService, storage, popupService, pmLog, eventKey, timeOutValue, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var STEP_POSITION = 100;

  var focusElement = null;
  var lastFocus = {};
  var lastItemFocus = {};
  var lastItemMenuFocus = {}; // watch or trailer
  var scroll = null;
  var scrollBar = {};
  var previousPosition = 0;
  var maxPosition = 0;
  var scrollByKey = false;
  var pageHeight = 0;
  var destroyInfo = {scope : $scope, element : $element};
  var shelfName = null;
  var shelfFlag = false;
  var isFirstToMoreBtn = false;               //첫 진입 시 실행버튼에서 more버튼 이동 가능 여부

  $scope.recommColCount = 6;
  $scope.row = [];
  $scope.cpList = [];
  $scope.cpFullList = [];
  $scope.toBeDelScope = null;
  $scope.toBeGoScope = null;
  $scope.drawed = false;
  $scope.useEpisodeMore = true;
  $scope.useDescMore = false;
  $scope.scopeName = '';
  $scope.module = '';
  $scope.focusItem = '';
  $scope.defaultFocusItemClass = '';
  $scope.detailData = null;
  $scope.direct = false;
  $scope.showing = false;
  $scope.hiding = false;
  $scope.popupTitle = '';
  $scope.historyBack = $rootScope.pageManager.getTitle('back');
  $scope.posterURL = '';
  $scope.posterStyle = device.isHD ? 'width:240px;' : 'max-height:517px;width:360px;';
  $scope.buttonTitle = '';
  $scope.refreshflag = true;
  $scope.isInLink = $rootScope.pageManager.getLink();
  $scope.itemId = null;
  $scope.isSubTitle = false;

  $scope.photoData = null;
  $scope.recommendData = null;

  // 더보기 버튼 toogle
  $scope.moreTxt = msgLang.more;
  $scope.closeTxt = msgLang.less;
  $scope.isDesc = true;
  $scope.isPhoto = false;
  $scope.isRecommend = false;
  $scope.isEpisode = false;

  $scope.isRunningTime = true;
  $scope.isYearData = true;
  $scope.isPhotoData = true;
  $scope.isRecommendData = true;
  $scope.isSeasonData = true;
  $scope.isEpisodeData = true;
  $scope.isRating = true;
  $scope.isScore = true;
  $scope.isLogin = device.auth.userID ? true : false;
  $scope.isAdPlayer = false;
  $scope.isBrazil = false;
  $scope.scroll = undefined;
  $scope.showTooltipOnScrollEnd = false;

  $scope.labelData = {
    watchBtn : msgLang.movie_watch,
    trailorBtn : msgLang.tvshow_button_trailer,
    availableIn : msgLang.tvshow_shelf_available,
    detailTitle : msgLang._3d_details,  // check
    gradeTitle : msgLang.sdp_tv_021,
    yearTitle : msgLang.search_specialkeyword_releaseDate,      // check
    runningTitle : msgLang.movie_runningTime,
    runningUnit : msgLang.min,
    episodeUnit : msgLang.tvShow_episode,
    detailNoData : msgLang.alert_adult_4_2,
    recommendTitle : msgLang.movie_recommendation_1,
    directorRole : msgLang._3d_director,
    photoTitle : msgLang.tvshow_shelf_photos ? msgLang.tvshow_shelf_photos : 'Photos',
    seasonEpisode : msgLang.tvshow_shelf_season
  };

  var prevMarquee;

  $scope.isWatchable = function() {
    if ($scope.detailData &&
      $scope.detailData.item_detail &&
      $scope.detailData.item_detail.exec_list &&
      $scope.detailData.item_detail.exec_list.execs &&
      $scope.detailData.item_detail.exec_list.execs.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  $scope.getSkinClass = function() {
    // console.log('detailList.getSkinClass');
    if ($scope.detailData &&
      ($scope.detailData.skinType === 'LANDSCAPE')) {
      return 'item-detail-width';
    } else {
      return '';
    }
  };

  $scope.setFocusItem = function(item, element, scrollToIsCalled) {
    // var currentScope = focusManager.getCurrent().scope.scopeName;
    // console.log('detailList.setFocusItem, currentScope=' + currentScope + ', item=' + item +
    //   ', element=' + element);

    //[QEVENTSIXT-15278]처음 상세화면 사방향키 진입을 제외한 실행버튼에서 more버튼으로 포커스 이동 가능 상태 False로 설정
    if (isFirstToMoreBtn) {
      isFirstToMoreBtn = false;
    }

    if ($rootScope.prerollAd && $rootScope.prerollAd.show) {
      // [WOSLQEVENT-114555] trailer 재생 전, prerollAd 실행시,
      // 매직 리모콘 커서와 사방향키를 번갈아 사용하면, back키 무감 현상 해결
      // console.log('detailList.setFocusItem, prerollAd.show');
      return;
    }

    var y;

    if (lastFocus.item === 'back' || lastFocus.item === 'popup' ||
      (lastItemFocus && lastItemFocus.item &&
        lastItemFocus.item.indexOf('item-episodeBtn-') >= 0) &&
        (lastItemFocus.item !== item)) {
      // 예, episode button에서 타 버튼으로 focus 이동시
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

    // save previous marquee
    if (!prevMarquee) {
      prevMarquee = marquee.getTarget();
    }

    if (item) {
      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
      focusManager.setCurrent($scope, item, element);
      lastFocus.item = item;
      lastFocus.element = element;
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }

    if ($scope.focusItem === 'back') {
      $rootScope.tooltip.showTooltip(50, 107, $rootScope.pageManager.getTitle('back'), true, true);
    } else if ($scope.focusItem !== null && $scope.focusItem.indexOf('item') >= 0) {
      //이전에 포커스된 아이템 컨텐츠를 저장하여 back 버튼에서 돌아올 경우 이전에 포커스된 아이템 컨텐츠로 이동한다.
      lastItemFocus.item = lastFocus.item;
      lastItemFocus.element = lastFocus.element;
      lastItemFocus.isFrom = true;
      lastItemMenuFocus.isFrom = false;

      if (!scrollToIsCalled && item.indexOf('item-episodeBtn-') >= 0) {
        showSeasonTooltip(item, element);
      }
    } else if ($scope.focusItem !== null && ($scope.focusItem === 'watch' || $scope.focusItem === 'trailer') ) {
      lastItemMenuFocus.item = lastFocus.item;
      lastItemMenuFocus.element = lastFocus.element;
      lastItemMenuFocus.isFrom = true;
    }

    if (!item && lastItemFocus && lastItemFocus.item &&
      (lastItemFocus.item.indexOf('item-episodeBtn-') >= 0)) {
      // episode 버튼에서 focus가 없어진 경우, hide tooltip
      $rootScope.tooltip.hideTooltip();

      if (prevMarquee) {
        // episode 버튼에 marquee가 시작되기 전에,
        // marquee가 되고 있던 element를 다시 marquee 시작. 예) title
        marquee.setTarget(prevMarquee);
        prevMarquee = undefined;
      }
    }
  };

  $scope.audioGuidance = function (scope, target, element) {
    //audioGuidance 호출 params
    //season episode 버튼은 tooltip 만 읽어 주므로 return;
    if (element && element.parentElement.querySelector("[class*=item-episodeBtn].focus")) return;

    if (util.isAWSServer()) {
      //audioGuidance 호출 params
      var params = {
        text: '',
        clear: true,
        duplication: false
      };
    } else {
      //audioGuidance 호출 params
      var params = {
        text: '',
        clear: true
      };
    }
    var enterSound = '';

    if (element && (element.innerText === msgLang.more || element.innerText === msgLang.less)) {
      params.text = element.innerText;  //'more' or 'less'

      //shelf name
      if (element.parentElement.querySelector('.sec-title.detail-title') && element.parentElement.querySelector('.sec-title.detail-title').innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector('.sec-title.detail-title').innerText;
      }
      //genre
      if (element.parentElement.querySelector("[ng-bind='detail.genre']") && element.parentElement.querySelector("[ng-bind='detail.genre']").innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector("[ng-bind='detail.genre']").innerText;
        if (util.isAWSServer()) {
          //별점
          if ($scope.isScore) {
            params.text += '. ';
            if($scope.detailData.item_rated_score == 0){
              params.text += 0;
            } else{
              params.text += ($scope.detailData.item_rated_score / 2).toFixed(1);
            }
            params.text += ' stars';
          }
        }
      }
      //director
      if (element.parentElement.querySelector("[ng-bind='director']") && element.parentElement.querySelector("[ng-bind='director']").innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector("[ng-bind='director']").innerText;
      }
      //actors
      if (element.parentElement.querySelector("[ng-bind='actors']") && element.parentElement.querySelector("[ng-bind='actors']").innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector("[ng-bind='actors']").innerText;
      }
      //synopsis
      if (element.parentElement.querySelector("[ng-bind='detail.content']") && element.parentElement.querySelector("[ng-bind='detail.content']").innerText.length > 0) {
        params.text += '. ';
        params.text += element.parentElement.querySelector("[ng-bind='detail.content']").innerText;
      }
    }

    if (params.text.length > 0) {
      audioGuidance.call(params);
      return;
    }

    //최초 화면 진입 시 나오는 음성
    if ($rootScope.isNewPage) {
      if (scope.getScopeElement()[0]) {
        var tmpElement = scope.getScopeElement()[0];
        if (tmpElement.querySelector('.panel-header .text') && tmpElement.querySelector('.panel-header .text').innerText.length > 0) {
          enterSound = tmpElement.querySelector('.panel-header .text').innerText;
        }
        //최초 진입 시 details Text 읽어주기
        if (enterSound.length > 0) {
          //shelf name
          if (element && element.parentElement.parentElement && element.parentElement.parentElement.querySelector("[ng-bind='labelData.detailTitle']") && element.parentElement.parentElement.querySelector("[ng-bind='labelData.detailTitle']").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.querySelector("[ng-bind='labelData.detailTitle']").innerText;
          }
          //genre
          if (element && element.parentElement.parentElement && element.parentElement.parentElement.querySelector("[ng-bind='detail.genre']") && element.parentElement.parentElement.querySelector("[ng-bind='detail.genre']").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.querySelector("[ng-bind='detail.genre']").innerText;
            if (util.isAWSServer()) {
              //별점
              if ($scope.isScore) {
                enterSound += '. ';
                if($scope.detailData.item_rated_score == 0){
                  enterSound += 0;
                } else{
                  enterSound += ($scope.detailData.item_rated_score / 2).toFixed(1);
                }
                enterSound += ' stars';
              }
            }
          }
          //director
          if (element && element.parentElement.parentElement && element.parentElement.parentElement.querySelector("[ng-bind='director']") && element.parentElement.parentElement.querySelector("[ng-bind='director']").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.querySelector("[ng-bind='director']").innerText;
          }
          //actors
          if (element && element.parentElement.parentElement && element.parentElement.parentElement.querySelector("[ng-bind='actors']") && element.parentElement.parentElement.querySelector("[ng-bind='actors']").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.querySelector("[ng-bind='actors']").innerText;
          }
          //synopsis
          if (element && element.parentElement.parentElement && element.parentElement.parentElement.querySelector("[ng-bind='detail.content']") && element.parentElement.parentElement.querySelector("[ng-bind='detail.content']").innerText.length > 0) {
            enterSound += '. ';
            enterSound += element.parentElement.parentElement.querySelector("[ng-bind='detail.content']").innerText;
          }
        }
        $rootScope.isNewPage = false;
      }
    }

    if (util.isAWSServer()) {
      shelfName = null;
      if (element && (element.querySelector("[class*=item-recommend]") || element.querySelector("[class*=detail-photo-poster]"))) {
        if (element.parentElement.parentElement.querySelector('.sec-title.detail-title') && element.parentElement.parentElement.querySelector('.sec-title.detail-title').innerText.length > 0) {
          shelfName = element.parentElement.parentElement.querySelector('.sec-title.detail-title').innerText;
          shelfFlag = true;
        }
      }
    } else {
      var tmpShelfName = null;
      if (element && (element.querySelector("[class*=item-recommend]") || element.querySelector("[class*=detail-photo-poster]"))) {
        if (element.parentElement.parentElement.querySelector('.sec-title.detail-title') && element.parentElement.parentElement.querySelector('.sec-title.detail-title').innerText.length > 0) {
          tmpShelfName = element.parentElement.parentElement.querySelector('.sec-title.detail-title').innerText;
        }
        if (tmpShelfName !== shelfName) {
          shelfName = tmpShelfName;
          shelfFlag = true;
        }
      } else {
        shelfName = '';
      }
    }

    var itemName = null;
    if (element && element.querySelector('.focus .text')) {
      if (shelfFlag) {
        itemName = shelfName;
        shelfFlag = false;
      }

      if (itemName) {
        itemName += '. ';
        itemName += element.querySelector('.focus .text').innerText;
      } else {
        itemName = element.querySelector('.focus .text').innerText;
      }

      if (itemName.length > 0 && element.classList.contains('btn')) {
        itemName += '. ';
        itemName += msgLang.audio_button_button;
      }
    } else if (shelfFlag) {
      itemName = shelfName;
      shelfFlag = false;
      if (util.isAWSServer()) {
        params.duplication = true;
      }
    }

    if (enterSound.length > 0) {
      params.text = enterSound;
      params.text += ". ";
      params.text += itemName;
    } else if (itemName) {
      params.text = itemName;
    } else {
      return;
    }

    audioGuidance.call(params);
  };

  showSeasonTooltip = function(item, element) {
    // console.log('detailList.showSeasonTooltip, item=' + item);

    if (!$scope.episode || !$scope.episode.items) {
      console.log('detailList.showSeasonTooltip, do nothing');
      return;
    }

    var index = item.indexOf('item-episodeBtn-');
    if (index < 0) {
      return;
    }
    index = item.substring(index + 'item-episodeBtn-'.length);

    var x = element.getClientRects()[0].left;
    var y = element.getClientRects()[0].top;

    x += parseInt(element.getClientRects()[0].width/2 - 3);

    var episodeItem = $scope.episode.items[parseInt(index)];
    if (!episodeItem) {
      // console.error('detailList.showSeasonTooltip, episodeItem=undefined, items=' +
      //   JSON.stringify($scope.episode.items));
      return;
    }
    var tooltip = episodeItem.episodeName;

    var right;
    var top = true;
    var zoomRatio = device.isHD ? 0.667 : 1;

    if (element.getClientRects()[0].top < 400 || device.isHD) {
      // button위에는 공간이 부족함. tooltip을 아래 방향으로
      top = false;
      y -= (38 * zoomRatio);
    } else {
      y = (y * -1) + (1088 * zoomRatio);
    }

    if (top) {
      if ((index % 5) > 2) {
        // right = false;
        right = device.isRTL ? true : false;

        var panelsWidth;
        panelsWidth = document.getElementsByClassName('panels')[0].getClientRects()[0].width;
        x = panelsWidth - element.getClientRects()[0].right;
        x += parseInt(element.getClientRects()[0].width / 2 + 3);
      } else {
        right = device.isRTL ? false : true;
      }
    } else {
      if ((index % 5) > 2) {
        right = true;
//        right = device.isRTL ? false : true;
      } else {
        right = false;
//        right = device.isRTL ? true : false;
      }

      y += 130 * zoomRatio;
    }

    $rootScope.tooltip.showSeasonTooltip(x, y, tooltip, right, top, episodeItem.episodeDate);
  };

  $scope.recoverFocus = function(fromScope) {
    if (fromScope === 'season' && window.PalmSystem && window.PalmSystem.cursor.visibility) {
      // 현재 커서가 season popup에 있을 것이기 때문에,
      // focus item이 없는 상태임.
      $scope.setFocusItem('', null);
      return;
    }

    if (lastFocus && lastFocus.item && lastFocus.element){
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
    } else {
      $scope.setDefaultFocus();
    }
  };

  preExecuteBackCallback = function() {
    $scope.setFocusItem('', null);
    marquee.setTarget(null);
    focusManager.setCurrent($scope, '');
    obj = $rootScope.pageManager.popHistory();

    // [WOSLQEVENT-89900] 방어 코드 1
    // [Service.SDPService.LGStore_Common Policy] [Often] [Minor] All picker 는 열려있으나 카테고리 리스트 출력되지 않음
    obj.backFromDetailList = true;

    // console.log('0 detailList.preExecuteBackCallback, page obj=' + JSON.stringify(obj));

    if (obj.page === 'list') {
      device.isBreadcrumbsClicked = true;
    }

    if (!$scope.isInLink) {
      $scope.hiding = true;
    } else {
      // 같은 controller 에서 이동하므로 기 생성된 scope을 초기화한다.
      $scope.hiding = true;
      if(obj.module == 'TS') {
        obj.module = 'ME2212';
      } else if (obj.module == 'MV') {
        obj.module = 'ME2312';
      }
    }
    $scope.toBeGoScope = obj.module;
    $rootScope.draw(obj);
  };

  $scope.executeAction = function() {
    if (focusManager.blockExecution()) {
      console.log('detailList.executeAction, blockExecution is true');
      return;
    }

    var focusObject, target, obj, item, itemType, itemId, moreBtn = [
      'item-descBtn-0',
      'item-photoBtn-0',
      'item-recommendBtn-0',
      'item-seasonBtn-0',
      'item-episodeMore-0'
    ];

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target == 'back') {
        // 2016-01-15 onnow Logging
        device.onnowLogging = 'CONTS|' + ($scope.detailData.item_id || '');
        $rootScope.breadcrumb.executeBack($scope.scopeName);
      } else if (target == 'watch') {
        onWatchButtonClick();
      } else if(target == 'trailer') {
        // player 실행
        trailer(0, $scope.isAdPlayer);
      } else if (moreBtn.indexOf(target) >= 0) {
        var shelfID = target.split('-')[1].replace(/Btn/gi,'');
        if (target =='item-photoBtn-0') {
          togglePhoto();
          scroll.scrollTo(0, scroll.maxScrollY, 300);
          $scope.audioGuidance(focusObject.scope, target, lastFocus.element);
          return;
        } else if(target =='item-episodeMore-0') {
          toggleEpisodeMore();
          $scope.moveFocusByKey(keyHandler.UP);
          $scope.moveFocusByKey(keyHandler.DOWN);
          $scope.audioGuidance(focusObject.scope, target, lastFocus.element);
        } else if(target =='item-descBtn-0') {
          $scope.$digest();
          // QEVENTSIXT-13606 more/less 버튼 위치 이동에 따른 스크롤 위치 조정
          $scope.moveFocusByKey(keyHandler.DOWN);
          $scope.moveFocusByKey(keyHandler.UP);
          $scope.audioGuidance(focusObject.scope, target, lastFocus.element);
        } else if (target =='item-recommendBtn-0') {
          toggleRecommend();
          // QEVENTSIXT-13606 more/less 버튼 위치 이동에 따른 스크롤 위치 조정
          $scope.moveFocusByKey(keyHandler.UP);
          $scope.moveFocusByKey(keyHandler.DOWN);
          $scope.audioGuidance(focusObject.scope, target, lastFocus.element);
        } else if (target =='item-episodeBtn-0' || target =='item-seasonBtn-0') {
          var data, preData;
          if (target =='item-episodeBtn-0') {
            $scope.type = 'episode';
            data = $scope.episode;
            // episode data는 descripiton 정보등 기본 정보만 response 되며 episode, season 정보등이 오지 않기에 현재 data를 pageMager set 후
            // preData가 있는 경우 setData()에서 호출하여 사용한다.
            preData =  $scope.detailData;
          } else if (target =='item-seasonBtn-0') {
            $scope.type = 'season';
            data = $scope.season;
          }
          if(!$rootScope.season.hide) {// season close
            focusManager.setState('season', false);
            $rootScope.season.hide = true;
            $rootScope.season.open = false;
            $scope.$digest();
          } else {
            // season open
            var element = $element[0].getElementsByClassName('btn-'+$scope.type)[0];
            var top = element.getBoundingClientRect().top;//버튼 상위 높이
            var left = element.getBoundingClientRect().left;
            if(device.isRTL) {
              var ratio = device.isHD?0.667:1;
              left -= (493*ratio);
            }
            var height = element.getBoundingClientRect().height;//버튼 height : 시즌 팝업 버튼 바로 아래 위치 위해
            var param = {
              top: top,
              left: left,
              height: height,
              type: $scope.type,
              module: $scope.module,
              data: data,
              preData: preData
            };

            focusManager.setState('season', true);
            $rootScope.season.hide = false;
            $rootScope.season.open = true;
            $scope.$digest();
            $rootScope.season.showSeason($scope, param);
          }
        }
        //pmLog
        shelfMoreClick(shelfID);
      } else if(target.indexOf('item-episodeBtn-') >= 0) {
        $scope.isInLink = true;
        $scope.direct = false;
        $scope.showing = false;
        itemId = focusElement.getAttribute('item-id');
        if (itemId === $scope.detail.itemId) {
          // 현재 episode와 동일함
          return;
        }

        var menu = $element[0].getAttribute('item').split('|')[0];
        itemId = menu + '|' + itemId;
        $scope.toBeGoScope = itemId;
        $rootScope.pageManager.setParam('preData', $scope.detailData);
        $rootScope.pageManager.setParam('changingEpisode', true);

        $rootScope.draw({
          page: 'detailList',
          module: itemId,
          inLink: $scope.isInLink
        });
      } else if(target.indexOf('item') >= 0 && target.indexOf('Btn') < 0) {
        itemType = focusElement.getAttribute('item-type');
        itemId = focusElement.getAttribute('item-id');

        if(itemType == 'recommend') {
          // 2016-01-15 onnow Logging
          device.onnowLogging = 'CONTS|' + ($scope.detailData.item_id || '');

          $scope.isInLink = true;
          $scope.direct = false;
          $scope.showing = false;
          var menu = $element[0].getAttribute('item').split('|')[0];
          itemId = menu + '|' + itemId;
          $scope.toBeGoScope = itemId;
          $rootScope.draw({
            page: 'detailList',
            module: itemId,
            inLink: $scope.isInLink
          });
        } else if(itemType  == 'photo') {
          var isTrailer = false;
//          if(focusElement.querySelector('.icon-player')) {// 광고 재생 조건
//            isTrailer = true;
//          }
          trailer(focusElement.getAttribute('item').split('-')[2], isTrailer);
        }

        // pmlog
        shelfContentClick(itemType, itemId);
      }
    } else if (focusObject.scope.scopeName === 'scroll' &&
      focusObject.scope.$parent === $scope) {
      // WOSLQEVENT-82783
      // [Service.SDPService.LGStore_Common Policy] [Always] [Minor]
      // back key 동작하지 않음
      target = focusObject.target;
      if (target === 'back') {
        $rootScope.breadcrumb.executeBack($scope.scopeName);
      }
    }
  };

  var onWatchButtonClick = function() {
    $rootScope.spinner.showSpinner();
    $scope.setFocusItem('', null);

    // pmLog
    pmLog.write(pmLog.LOGKEY.CONTENTS_PLAY_CLICK, {
      menu_name : 'Detail Page',
      contents_id : $scope.detailData.item_id,
//      contents_category : $rootScope.pmLogValue
      contents_cateogry : $scope.module === 'MV' ? 'movies' : 'tvshows'
    });

    $scope.toBeGoScope = $scope.detailData.item_id;

    if (!$scope.detailData.item_detail ||
      !$scope.detailData.item_detail.exec_list ||
      !$scope.detailData.item_detail.exec_list.execs ||
      ($scope.detailData.item_detail.exec_list.execs.length < 1)) {
      return;
    }

    if ($scope.detailData.item_detail.exec_list.execs.length === 1) {
      // 하나의 CP가 있다면 App 실행
      var checkParams = {
        'item_id': $scope.itemId,
        'appId': $scope.detailData.item_detail.exec_list.execs[0].exec_app_id,
        'premiumFlag': $scope.detailData.item_detail.exec_list.execs[0].premium_app_flag,
        'launchContentId': $scope.detailData.item_detail.exec_list.execs[0].exec_id
      };
      appService.appCheckLaunch(checkParams);
      // pmLog : CP 클릭 시 pmLog
      pmLog.write(pmLog.LOGKEY.CP_SELECT, {
        menu_name : 'Detail Page',
        cp_id : $scope.cpList[0].exec_app_id,
        contents_id : $scope.cpList[0].exec_id,
        contents_category : $scope.module === 'MV' ? 'movies' : 'tvshows' //$rootScope.pmLogValue
      });

      // onnow logging 앱실행정보
      appService.writeServerLog($scope.itemId, $scope.cpList[0].exec_app_id);

    } else {
      $rootScope.spinner.hideSpinner();

      // 등록된 CP가 없거나, 2개 이상, popup 보여주기
      $scope.detailData.item_detail.exec_list.execs.logMenu = 'Detail Page';
      $scope.detailData.item_detail.exec_list.execs.logCategory = ($scope.module === 'MV' ? 'movies' : 'tvshows'); //$rootScope.pmLogValue;

      // 실행정보 로깅을 위한 item_id추가 (cp가 2개 일 경우 안넘어가 가서 추가)
      $scope.detailData.item_detail.exec_list.execs.contents_id = $scope.itemId;
      popupService.watchClick($scope, $scope.detailData.item_detail.exec_list.execs);
    }
  };

  var shelfMoreClick = function(shelfId) {
    // pmlog : more button
    pmLog.write(pmLog.LOGKEY.THIRD_SHELF_MORE, {
      menu_name : $scope.module === 'MV' ? 'movies' : 'tvshows', //$rootScope.pmLogValue,
      shelf_id : shelfId
    });
  };

  var shelfContentClick = function(shelfId, shelfContentId) {
    // pmlog : contents(추천, 스크린샷)
    pmLog.write(pmLog.LOGKEY.THIRD_SHELF_CLICK, {
      menu_name : $scope.module === 'MV' ? 'movies' : 'tvshows', //$rootScope.pmLogValue,
      shelf_id : shelfId,
      contents_id : $scope.detailData.item_id,
      shelf_contents_id : shelfContentId,
      shelf_contents_category : $scope.module === 'MV' ? 'movies' : 'tvshows' //$rootScope.pmLogValue,
    });
  };

  var drawDetail = function(e, response) {
    var obj, errorCode;

    if (device.isDeepLink && (device.previousPage === 'MovieShowDetail' || device.previousPage === 'TVShowDetail')) {
      $scope.toBeGoScope = true;
      device.isDeepLink = false;
    }

    try {
      e.preventDefault();

      if ($scope.scopeName != '' && $scope.scopeName != response.scopeName) return;
      // scope id를 비교하여 중복 호출을 방지함.
      if ($scope.$id != response.scopeId) {
        // 이전 scope이 destroy 되기 전이므로 해당 이벤트가 중복호출되어 이전에 생성된 scope에서는 삭제 대상의 scope을 draw가 완료되기 전의 마지막 scope으로 정한다.
        //$scope.toBeDelScope = $rootScope.pageManager.findLastScopeId();
        return;
      }
      if (response == null || response.listDetail == null || response.listDetail == undefined) {
        // 에러 발생시 새로 생성된 마지막 scope을 삭제 대상 scope로 한다.
        errorCode = "Tvshow3Depth.002";
        $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId();
        $rootScope.pageManager.movePageError(errorCode, $scope, $element);
        return;
      }

      $scope.detailData = response.listDetail;
      $scope.scopeName = response.scopeName;

      // 가로형일 경우에만 H가 붙고, 세로형이면 V가 붙도록 되어 있음.
      // 예) 가로형 "H300X169"
      if ($scope.detailData &&
        $scope.detailData.item_img_size &&
        $scope.detailData.item_img_size.substr(0, 1) === 'H') {
        // LANDSCAPE
        $scope.detailData.skinType = 'LANDSCAPE';
        $scope.recommColCount = 3;
      } else {
        $scope.detailData.skinType = 'PORTRAIT';
        $scope.recommColCount = 6;
      }

      $rootScope.pageManager.setTitle($scope.title);
      // data setting
      setData();
      util.async(function() {
        // episode 선택이 more 버튼으로 가려져있으면, 펼치기
        for(var i = 0; i < $scope.episode.items.length; i++) {
          if ($scope.episode.items[i].isSelect) {
            if (i >= 5) {
              // episode 선택이 more 버튼으로 가려져있으면, 펼치기
              // show all episode buttons
              for(var j = 0; j < $scope.episode.items.length; j++) {
                $scope.episode.items[j].showEpisode = true;
              }

              elements = $element[0].getElementsByClassName('item-episodeMore-0');
              elements[0].click();
            }
            break;
          }
        }

        $scope.drawed = true;
        initializeScroll();
        restoreScrollPos();
        $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
      });
      pageHeight = $element[0].getElementsByClassName('panel-body').offsetHeight;
      updateRow();
      $scope.$digest();
      obj = $element[0].getElementsByClassName('detail-scroller')[0];
      obj.style.height = pageHeight + 'px';
      $element[0].removeAttribute('ng-class');
    } catch (e) {
      // 페이지 이동중 에러 발생, 생성중인 page를 삭제하기
      destroyScope();

      // 에러 발생시 새로 생성된 마지막 scope을 삭제 대상 scope로 한다.
      errorCode = $scope.scopeName + ".002";
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId();
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);
    }
  };


  var updateRow = function() {
    var i, k, l, obj;

    $scope.splitCount = 0;
    $scope.itemRowCount = 0;
    $scope.row = [];
    k = 0;

    // season 버튼 row
    if ($scope.isSeasonData) {
      $scope.row[k] = {
        type: 'button', id: k, index: 0, count: 1, prefix: 'seasonBtn', movableByKey: true
      };
      k ++;
    }

    // episode 버튼 row
    if ($scope.isEpisodeData) {

      l = $scope.episode.items.length;

      for (i = 0 ; i < l; i++) {
        if (!$scope.episode.items[i].showEpisode)
          continue;

        if (i > 0 && $scope.row[k] && $scope.row[k].type === 'episodeBtn' &&
          $scope.row[k].count >= 5) {
          // 최대 5개 이상이면, 다음 줄로
          k++;
        }

        if (!$scope.row[k]) {
          $scope.row[k] = {
            type: 'episodeBtn', id: k, index: i, count: 1, prefix: ('episodeBtn' + '-' + i)
          };
        } else if ($scope.row[k].count < 5) {
          // k row에 item 갯수 증가
          $scope.row[k].count++;
        }
      }
      k++;

      if (l > 5) {
        $scope.row[k] = {
          type: 'button', id: k, index: 0, count: 1, prefix: 'episodeMore'
        };
        k ++;
      } else {
        $scope.useEpisodeMore = false;
      }
    }

    obj = $scope.detailData.item_detail;

    // 상세 정보의 더보기 버튼 row
    if ($scope.useDescMore) {
      $scope.row[k] = {
        type: 'button', id: k, index: 0, count: 1, prefix: 'descBtn'
      };
      k ++;
    }

    if ($scope.row[k]) k++;

    // 추천 더보기 버튼 과 추천 리스트 row
    if (obj.tab_vod && obj.tab_vod.items.length > 0) {
      l = obj.tab_vod.items.length;

      for (i = 0 ; i < l; i++) {
        if ($scope.recommend.items[i].showRecommend) {
          if ($scope.row[k] == null) {
            $scope.row[k] = {
              type: 'recommend', id: k, index: i, count: 1, prefix: ('recommend' + '-' + i)
            };
          } else if ($scope.row[k].count < $scope.recommColCount) {
            $scope.row[k].count++;
            if ($scope.row[k].count == $scope.recommColCount) k++;
          }
        }
      }

      if ($scope.row[k]) k++;

      if (l > $scope.recommColCount) {
        $scope.row[k] = {
          type: 'button', id: k, index: 0, count: 1, prefix: ('recommendBtn')
        };
        k ++;
      }
    }

    if ($scope.row[k]) k++;

    // 예고 더보기 버튼 과 예고 리스트 row
    if ($scope.photo && $scope.photo.items.length > 0) {
      l = $scope.photo.items.length;

      for (i = 0 ; i < l; i++) {
        if ($scope.photo.items[i].showPhoto) {
          if ($scope.row[k] == null) {
            $scope.row[k] = {
              type: 'photo', id: k, index: i, count: 1, prefix: ('photo' + '-' + i)
            };
          } else if ($scope.row[k].count < 4) {
            $scope.row[k].count++;
            if ($scope.row[k].count == 4) k++;
          }
        }
      }

      if ($scope.row[k]) k++;

      if (l > 4) {
        $scope.row[k] = {
          type: 'button', id: k, index: 0, count: 1, prefix: ('photoBtn')
        };
        k ++;
      }
    }
    // console.log('detailList.updateRow, $scope.row=' + JSON.stringify($scope.row));

    $scope.$digest();
  };

  var setData =  function() {
    var history;
    var n = $rootScope.pageManager.getHistoryCount();
    if ((n - 2) >= 0) {
      history = $rootScope.pageManager.getHistory(n - 2);
    }

    if (focusManager.getCurrent() &&
      focusManager.getCurrent().target &&
      (focusManager.getCurrent().target.indexOf('item-episodeBtn-') >= 0)) {
      // console.log('detailList.setData, a-1');
      // episode 선택 시 season, episode, recommend data를 서버에서 return 하지 않으므로
      if (history &&
        history.param &&
        history.param.preData) {
        // 이전 페이지에서 episode data를 복사해옴
        $rootScope.pageManager.setParam('preData', history.param.preData);
      }
    } else if (history &&
      history.param &&
      history.param.changingEpisode) {
      // console.log('detailList.setData, b-1');
      // [SVCERROR-724] [추천][3등급][TV 다시보기_상세화면] 시즌&에피소드 항목 미노출
      // episode 버튼을 클릭한 이후, 페이지 전환이 이루어 지기 전에, focus가 이동된 경우임.
      // 이전 페이지에서 episode data를 복사해옴
      $rootScope.pageManager.setParam('preData', history.param.preData);
      $rootScope.pageManager.setParam('changingEpisode', undefined);
    } else {
      // console.log('detailList.setData, b-2');
    }

    var defaultImg = $scope.module === 'MV'?'./resources/images/thumb/default_movie_280x410.png':'./resources/images/thumb/default_tvshow_280x410.png';

    $scope.posterURL = ($scope.detailData.item_img !== '') ? $scope.detailData.item_img : defaultImg;

    var rating = $scope.detailData.item_rating_disp;
    if(!rating || rating == '') {
      $scope.isRating = false;
    }

    $scope.isBrazil = device.countryCode === 'BR'?true:false

    $scope.grade = {
      content : $scope.detailData.item_rating_disp
    };
    if($scope.detailData.conts_make_year == null || $scope.detailData.conts_make_year == '') {
      $scope.isYearData = false;
    }
    $scope.year = {
      content : $scope.detailData.conts_make_year
    };
    var runningTime = $scope.detailData.conts_duration;
    if(runningTime && runningTime != '0') {
      $scope.runningTime = {
        content : runningTime
      };
    } else {
      $scope.isRunningTime = false;
    }

    var s = parseFloat($scope.detailData.item_rated_score);
    if (!isNaN(s) && (s > 0)) {
      $scope.isScore = true;
    } else {
      $scope.isScore = false;
    }

    $scope.detail = {
      genre : $scope.detailData.item_genre_disp,
      score : $scope.detailData.item_rated_score,
      content : $scope.detailData.item_desc,
      itemId : $scope.detailData.item_id
    };

    $scope.director = null;
    $scope.actors = null;

    var director = '', actor = '';
    var tab_cast = $scope.detailData.item_detail.tab_cast;
    if (tab_cast && tab_cast.items && (tab_cast.items.length > 0)) {
      for (var i = 0; i < tab_cast.items.length; i ++) {
        if (tab_cast.items[i].person_role_type == 'DIRECTOR') {
          if (director && (director.length > 0)) {
            director += ', ';
          }
          director += tab_cast.items[i].item_name;
        } else if (tab_cast.items[i].person_role_type == 'ACTOR') {
          if (actor && (actor.length > 0)) {
            actor += ', ';
          }
          actor += tab_cast.items[i].item_name;
        }
      }
    }
    if (director && (director.length > 0)) {
      $scope.director = '[' + $scope.labelData.directorRole + ']' + director;
    }
    if (actor && (actor.length > 0)) {
      $scope.actors = actor;
    }

    if(!$scope.detail.genre &&
      !$scope.detail.score &&
      !$scope.detail.content &&
      !$scope.director &&
      !$scope.actors) {
      // 상세 정보 하나도 없을 경우에 문구 표시
      $scope.detail.content = $scope.detail.noData;
    }

    // season
    $scope.season = {
      items : []
    };
    if($rootScope.pageManager.getParam('preData') &&
      $rootScope.pageManager.getParam('preData').item_detail) {
      $scope.detailData.item_detail.season_list = $rootScope.pageManager.getParam('preData').item_detail.season_list;
    }
    $scope.selSeasonName = null;
    var season = $scope.detailData.item_detail.season_list;
    if (season && season.items.length != 0) {
      for (var i = 0; i < season.items.length; i++) {
        $scope.season.items[i] = {};
        if ('TRUE' === season.items[i]['@selected']) {
          // WOSLQEVENT-65469
          if (season.items[i].conts_epsd_name && season.items[i].conts_epsd_name.length > 0)
            $scope.selSeasonName = season.items[i].conts_epsd_name;
          else
            $scope.selSeasonName = season.items[i].item_name;
          $scope.season.items[i].isSelect = true;
        } else {
          $scope.season.items[i].isSelect = false;
        }
        $scope.season.items[i].id = season.items[i].item_id;
        // WOSLQEVENT-65469
        if (season.items[i].conts_epsd_name && season.items[i].conts_epsd_name.length > 0)
          $scope.season.items[i].name = season.items[i].conts_epsd_name;
        else
          $scope.season.items[i].name = season.items[i].item_name;
      }
    } else {
      $scope.isSeasonData = false;
    }

    // title, subTitle Setting
    var tmpDetailData = $scope.detailData;
    if (season && season.items.length != 0) {
      // WOSLQEVENT-65469
      // [Service.SDPService.LGStore_TV Shows] [Always] [Minor] 동일한 시즌 중복으로 존재함(포커스 시 출력되는 소제목도 동일)
      if (tmpDetailData.conts_epsd_name && tmpDetailData.conts_epsd_name.length > 0) {
        $scope.title = tmpDetailData.conts_epsd_name;
      } else {
        for (var i = 0; i < season.items.length; i++) {
          if (season.items[i]["@selected"] === "TRUE") {
            $scope.title = season.items[i].item_name;
            break;
          }
        }
        $scope.subTitle = tmpDetailData.item_name;
        $scope.isSubTitle = true;
      }
    } else {
      $scope.isSubTitle = false;
      $scope.title = tmpDetailData.item_name;
    }
    tmpDetailData = null;

    // episode
    $scope.episode = {
      unit : $scope.labelData.episodeUnit,
      items : []
    };
    $scope.selEpisodeName = null;
    if($rootScope.pageManager.getParam('preData') &&
      $rootScope.pageManager.getParam('preData').item_detail) {
      $scope.detailData.item_detail.tab_episode = $rootScope.pageManager.getParam('preData').item_detail.tab_episode;
    }
    var episode = $scope.detailData.item_detail.tab_episode;
    if (episode && episode.items.length != 0) {
      $scope.isEpisodeData = true;
      for(var i = 0; i < episode.items.length; i ++) {
        $scope.episode.items[i] = {};
        if ($scope.detailData.item_id === episode.items[i].item_id) {
          // WOSLQEVENT-65469
          if (episode.items[i].conts_epsd_name && episode.items[i].conts_epsd_name.length > 0)
            $scope.selEpisodeName = episode.items[i].conts_epsd_name;
          else
            $scope.selEpisodeName = episode.items[i].item_name;
          $scope.episode.items[i].isSelect = true;
        } else {
          $scope.episode.items[i].isSelect = false;
        }
        $scope.episode.items[i].id = episode.items[i].item_id;
        // WOSLQEVENT-65469
        if (episode.items[i].conts_epsd_name && episode.items[i].conts_epsd_name.length > 0)
          $scope.episode.items[i].name = episode.items[i].conts_epsd_name;
        else
          $scope.episode.items[i].name = episode.items[i].item_name;

        $scope.episode.items[i].episodeDate = episode.items[i].conts_release_date;
        $scope.episode.items[i].episodeName = episode.items[i].conts_epsd_real_name;

        // 5개만 보여주고, 나머지는 more 버튼에 가리지
        $scope.episode.items[i].showEpisode = i > 4 ? false : true;
      }
    } else {
      $scope.isEpisodeData = false;
    }

    // console.log('detailList.setData, $scope.episode.items=' + JSON.stringify($scope.episode.items));

    $scope.photo = {
      items : []
    };
    $scope.tnpdataList = [];

    var trailers = $scope.detailData.item_detail.tab_clip;
    $scope.trailerVideo = undefined;
    if(trailers && trailers.items && (trailers.items.length > 0)) {
      // UX 3.0 적용 begin
      // (trailer data중 첫번째 data를 대표 trailer로 사용, 나머지는 버림)
      var pictureData = [];
      for(var i = 0; i < trailers.items.length; i ++) {
        if (('CLIP_VIDEO' === trailers.items[i]['@type'])) {
          if (!$scope.trailerVideo) {
            $scope.trailerVideo = {
              thumb : trailers.items[i].item_img,
              url : trailers.items[i].item_id,
              type : 'V'
            };

            $scope.isAdPlayer = true;
          }
          continue;
        }

        pictureData.push(trailers.items[i]);
      }

      $scope.detailData.item_detail.tab_clip.items = pictureData;
      trailers = $scope.detailData.item_detail.tab_clip;

      // UX 3.0 적용 end
      for(var i = 0; i < trailers.items.length; i ++) {
        $scope.photo.items[i] = {};
        $scope.photo.items[i].id = trailers.items[i].item_id;
        // photo ITEM 노출 수 조정
        $scope.photo.items[i].showPhoto = i > 3 ? false : true;
        $scope.photo.items[i].img = (trailers.items[i].item_img !== '') ? trailers.items[i].item_img : defaultImg;
        // WOSLQEVENT-65469
        if (trailers.items[i].conts_epsd_name && trailers.items[i].conts_epsd_name.length > 0)
          $scope.photo.items[i].trailer = trailers.items[i].conts_epsd_name;
        else
          $scope.photo.items[i].trailer = trailers.items[i].item_name;

        // trailer play data setting
        $scope.photo.items[i].type = false;
        $scope.tnpdataList[i] = {
          thumb : trailers.items[i].item_img,
          url : trailers.items[i].item_id,
          type : 'I'
        };

        // Image인 경우만 URL을 ""로 감싸준다.
        var url = $scope.tnpdataList[i].url;
        //if(!url.startsWith('"')) {
        if(url.substring(0,1) !== '"') {
          url = '"' + url;
        }
        //if(!url.endsWith('"')) {
        if(url.substring(url.length - 1, url.length) !== '"') {
          url = url + '"';
        }
        $scope.tnpdataList[i].url = url;

        if (i >= 49)
          break;
      }
      $scope.photoData = trailers.items;
    } else {
      $scope.isPhotoData = false;
    }

    $scope.trailerdata = {data : $scope.tnpdataList, title : $scope.title};

    setCpList();

    // 추천
    $scope.recommend = {
      items : []
    };
    if($rootScope.pageManager.getParam('preData') &&
      $rootScope.pageManager.getParam('preData').item_detail) {
      $scope.detailData.item_detail.tab_vod = $rootScope.pageManager.getParam('preData').item_detail.tab_vod;
    }
    var recommends = $scope.detailData.item_detail.tab_vod;
    if(recommends && recommends.items.length != 0) {
      for(var i = 0; i < recommends.items.length; i ++) {
        $scope.recommend.items[i] = {};
        $scope.recommend.items[i].id = recommends.items[i].item_id;
        $scope.recommend.items[i].content_id = recommends.items[i].item_id;
        // 추천 ITEM 노출 수 조정
        $scope.recommend.items[i].showRecommend = i >= $scope.recommColCount ? false : true;
        $scope.recommend.items[i].img = (recommends.items[i].item_img !== '') ? recommends.items[i].item_img : defaultImg;
        // WOSLQEVENT-65469
        if (recommends.items[i].conts_epsd_name && recommends.items[i].conts_epsd_name.length > 0)
          $scope.recommend.items[i].title = recommends.items[i].conts_epsd_name;
        else
          $scope.recommend.items[i].title = recommends.items[i].item_name;
      }
      $scope.recommendData = recommends.items;
    } else {
      $scope.isRecommendData = false;
    }

    //search를 통해 왔을 경우 local storage에 저장
    if(storage.isFromSearch($element)) {
      storage.addRecentResult({
        item_id : $scope.detailData.item_id,
        keyword : $element.attr('query'),
        mappingflag : 'Y', // TODO 매핑 비매핑 Servier call 후 세팅
        moduleName : $scope.scopeName,
        thumbnail : $scope.detailData.item_img,
        title : $scope.title
      });
    }
  };

  var setCpList = function() {
    var cp = {}, flag = 0;
    var itemId1, itemId2;

    if($scope.detailData && $scope.detailData.item_detail) {
      if(!$scope.detailData.item_detail.exec_list) {
        $scope.cpFullList = $scope.detailData.item_detail.exec_full_list.execs;
        return;
      } else {
        $scope.cpList = $scope.detailData.item_detail.exec_list.execs;
      }
    } else {
      return;
    }

    for(var i=0; i<$scope.detailData.item_detail.exec_full_list.execs.length;i++) {
      flag = 0;
      cp = $scope.detailData.item_detail.exec_full_list.execs[i];

      for(var j=0; j<$scope.cpList.length;j++) {
        itemId1 = $scope.cpList[j].item_id

        if(cp.item_id.indexOf('|') > 0) {
          itemId2 = cp.item_id.substring(0,cp.item_id.indexOf('|'));
        } else {
          itemId2 = cp.item_id;
        }

        if(itemId1.substring(0,itemId1.indexOf('|')) === itemId2) {
          flag++;
          break;
        }
      }

      if(flag === 0) {
        $scope.cpFullList.push(cp);
      }
    }
  }


  var initializeDetail = function() {
    var l, m, n, elementH, descH, buttonSeason, seasonArr, episodeArr, buttonArr, photoArr;

    $scope.$digest();

    // 상세정보의 더보기 버튼 처리
    //elementH = $element[0].getElementsByClassName('synopsis-text')[0].style.lineHeight.replace('px', '');
    elementH = window.getComputedStyle(document.getElementsByClassName('synopsis-text')[0]).lineHeight.replace('px','');
    descH = $element[0].getElementsByClassName('synopsis-text')[0].offsetHeight - 10;
    if (descH >= elementH * 3) {
      $scope.useDescMore = true;
      //$scope.isDesc = false;
      updateRow(); // 상세정보의 더보기 버튼의 row 생성을 위해 호출
    }

    // recommend.
    episodeArr = $element[0].getElementsByClassName('item-detail');
    l = episodeArr.length;
    for (var i = 0; i < l; i++) {
      $scope.setMouseEvent(episodeArr[i]);
    }
    buttonSeason = $element[0].getElementsByClassName('detail-season-button');
    $scope.setMouseEvent(buttonSeason[0]);

    // photo.
    photoArr = $element[0].getElementsByClassName('item-trailer');
    m = photoArr.length;
    for (var i = 0; i < m; i++) {
      $scope.setMouseEvent(photoArr[i]);
    }

    // detail more button event regist.
    moreArr = $element[0].getElementsByClassName('btn-more');
    n = moreArr.length;
    for (var i = 0; i < n; i++) {
      $scope.setMouseEvent(moreArr[i]);
    }

    // button : watch, season, episode.
    buttonArr = $element[0].getElementsByClassName('btn');
    n = buttonArr.length;
    for (var i = 0; i < n; i++) {
      $scope.setMouseEvent(buttonArr[i]);
    }

    util.async($scope.scrollRefresh);
  };

  var trailer = function(idx, isTrailer) {
    try {
      document.body.classList.remove('hover-mode');

      var initParams = {
        playerType : 'Trailer',
        is3DContent : false,
        idx : idx
      };

      if ($scope.itemId.indexOf('TS|') === 0) {
        initParams.isTvShow = true;
      }

      if (isTrailer && $scope.trailerVideo) {
        if (util.isAWSServer()) {
          // UX_2016_webOS_Initial_LG Content Store_v1.4.7_160601.pdf
          // 1. Video player 진입 시 : <content title> + <focused item>
          if ($scope.trailerdata.title) {
            var params = {
              text: $scope.trailerdata.title + '. ' + msgLang.tvshow_button_trailer,
              clear: true,
              duplication: false
            };
            audioGuidance.call(params);
          }
        }

        // trailer button을 통해 호출된 경우에는 첫 동영상만 재생
        var tempData = {
          title: $scope.trailerdata.title,
          data: [$scope.trailerVideo]
        };

        $rootScope.prerollAd.prerollPlay(tempData, function() {
          trailerPmLog();
          $rootScope.player.initPlay($scope, initParams, tempData,
            isTrailer, $scope.detailData.item_id,
            $scope.detailData.item_detail.exec_list, function() {
              // player에서 page 이동이 되었을 때 호출되는 callback
              $scope.toBeGoScope = $scope.detailData.item_id;
            });
        });
      } else {
        if ($scope.trailerdata.data && $scope.trailerdata.data[0].type === 'V') trailerPmLog();
        $rootScope.player.initPlay($scope, initParams, $scope.trailerdata);
      }
    } catch (e) {
      var errorCode = $scope.scopeName + '.002';
      var popOpts = {popupTitle: msgLang.alert_error_2, popupDesc: msgLang.alert_error_2_1, errorCodeMsg: errorCode, type: 'error'};
      $rootScope.popupApp.showPopup($scope, popOpts);
    }
  };

  // trailer pmLog
  var trailerPmLog = function() {
    pmLog.write(pmLog.LOGKEY.TRAILER_WATCH_CLICK, {
      menu_name : $scope.module === 'MV' ? 'movies' : 'tvshows', //$rootScope.pmLogValue,
      contents_id : $element[0].getAttribute('item'),
      contents_category : $scope.module === 'MV' ? 'movies' : 'tvshows' //$rootScope.pmLogValue,
    });
  };

  var hideDetail = function(e, page) {
    e.preventDefault();

    if ($scope.toBeGoScope) {
      // 다른 이벤트 발생시를 생각 못함 고로 여기다가 하면 안됨
      $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
        $scope.hiding = true;
        destroyScope();
      });
      return;
    }
    $scope.isInLink = $rootScope.pageManager.getLink();

    if ((page != $scope.scopeName || $scope.isInLink) && !$scope.showing) {
      if (($scope.direct == false && $scope.showing == false)) {
        if (page == '') {
          $scope.$broadcast('drawFinished');
          $scope.setDefaultFocus();
          isFirstToMoreBtn = true;
          $scope.direct = true;
          $scope.toBeGoScope = true;
          $element[0].classList.add('direct');
          $rootScope.breadcrumb.onPageFromDeepLink();
          $timeout(function() {
            $scope.setShowAllImage(true);
          }, timeOutValue.SHOWING);
        } else {
          $scope.$broadcast('drawFinished');

          $scope.setDefaultFocus();
          isFirstToMoreBtn = true;
          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, preExecuteBackCallback, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $scope.showing = true;
            $scope.setShowAllImage(true);
          });
        }
      }
      var endTime = new Date().getTime();
      console.info('%c [PERFORMANCE]  : 3Depth LOADING TIME : ' + (endTime - device.startTime) + '   ', 'background-color:green;color:white');
      return;
    }

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      // $timeout(function() {
        destroyScope();
      // }, timeOutValue.DESTROYING);
    });
  };

  var requestData = function() {
    var item, scopeId, module, payload, errorCode, map = {
      'TS': 'TVShowDetail',
      'MV': 'MovieShowDetail'
    };

    try {
      item =  $element[0].getAttribute('item');
      module = item.split('|')[0];

      // pmLogValue값 세팅
      if (module && module.indexOf('MV') !== -1) {
        $rootScope.pmLogValue = pmLog.TYPE.MOVIE;
      } else {
        $rootScope.pmLogValue = pmLog.TYPE.TVSHOWS;
      }

      if(item.indexOf('ME23') >= 0) {
        module = 'MV';
      } else if(item.indexOf('ME22') >= 0) {
        module = 'TS';
      }

      $scope.module = module;
      payload = item.substring(item.indexOf('|') + 1);
      scopeId = $scope.$id;

      if (!device.isLocalJSON) {
        // server data 용
        var params = {
          api : '/discovery2016/item-detail',
          method : 'post',
          apiAppStoreVersion : 'v8.0',
          payload : {
            item_type: 'CONTS',
            item_id : payload,
            item_detail_type: 'advanced',         // 'advanced' : get all detail data, 'exec': get exec list
            app_id: 'com.webos.app.discovery', // 2016-01-15 로깅 수정요청으로 fix // $element[0].getAttribute('source')
            z_prev_svc : device.onnowLogging
          },
          gubun : module
        };
        server.requestApi(eventKey.DETAIL_TVMOVIE, params, destroyInfo, function() {
          // timeout callback
          // [WOSLQEVENT-97897] [SDPService.LGStore_Movies_Page] [Once] [Minor] 해당 content의 상세페이지로 전환되지 않고 계속 Spinner만 돌아감
          if ($scope.detailData) {
            return;
          }
          // 수신된 데이터가 없는 경우
          $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
          errorCode = $scope.scopeName + '.010';
          $rootScope.pageManager.movePageError(errorCode, $scope, $element);
        });
      } else {
        // local json 용
        server['request' + $scope.scopeName](payload, scopeId);
      }
    } catch (e) {
      $scope.toBeDelScope = $rootScope.pageManager.findLastScopeId(); // drawer이전에 에러가 발생하였을 경우 삭제해야할 scope target을 에러가 발생한 scope로 수정
      errorCode = $scope.scopeName + '.001';
      $rootScope.pageManager.movePageError(errorCode, $scope, $element);
    }
    params = null;
  };

  var move = function(y) {
    // console.log('detailList.move, y=' + y);
    var position;
    scrollBar.move(y, true);

    position = parseInt(y / STEP_POSITION);
    if (position > 0) position = 0;
    if (position < maxPosition) position = maxPosition;
    if (previousPosition == position) return;

    previousPosition = position;

    if (focusManager.getCurrent().scope == $scope && scrollByKey == false) {
      $scope.setFocusItem('', null);
    }
  };

  var onScrollEnd = function(y) {
    // console.log('detailList.onScrollEnd, y=' + y);

    if ($scope.showTooltipOnScrollEnd) {
      $scope.showTooltipOnScrollEnd = false;
      showSeasonTooltip($scope.focusItem, focusElement);
    }
  };

  var initializeScroll = function() {
    var option = {};
    option.useTransform = false;
    option.onPositionChange = move;
    option.onScrollEnd = onScrollEnd;

    scroll = new iScroll($element[0].getElementsByClassName('panel-body')[0], option);
    $scope.scroll = scroll;

    $element[0].getElementsByClassName('panel-body')[0].onmousewheel = function(e) {
      var deltaY, wheelSpeed = 3;

      e.preventDefault();
      util.async($scope.scrollRefresh);
      deltaY = scroll.y + (e.wheelDelta * wheelSpeed);
      // moonstone patch
      if (deltaY > 0) deltaY = 0; // deltaY = 100;
      else if (deltaY < scroll.maxScrollY) deltaY = scroll.maxScrollY; // deltaY = scroll.maxScrollY - 100;
      if (!$rootScope.spinner.hide) return;
      if (scroll.wrapperH >= scroll.scrollerH) return;
      if (focusManager.blockExecution()) return;
      if (focusManager.preExecution()) return;
      if (e.wheelDelta < 0 && scroll.y > 0) return;
      if (e.wheelDelta > 0 && scroll.y < scroll.maxScrollY) return;
      scroll.scrollTo(0, deltaY, 300);
    };
  };

  var getItemPositionByItemId = function(itemClass, itemId) {
    var i, r, c, itemRow, target, indexWithSplit = 0;

    element = $element[0].getElementsByClassName(itemClass);
    if (element && (element.length > 0)) {
      var temp = element[0].getAttribute('item-id');
      if (temp === itemId) {
        return {
          top: element[0].offsetTop,
          bottom: element[0].offsetTop + element[0].offsetHeight
        };
      }
    }
  };

  var restoreScrollPos = function(reset) {
    var scrollY, oldScrollY, param, result;

    var rowYFrom;
    var rowYTo;
    var scrollYFrom;
    var scrollYTo;

    scrollResetting = true;
    param = $rootScope.pageManager.peekHistory();

    if (param) {
      oldScrollY = $rootScope.pageManager.getParam('scrollY');
      oldScrollY *= -1;

      itemClass = $rootScope.pageManager.getParam('itemClass');
      item_id = $rootScope.pageManager.getParam('item-id');
      if (itemClass) {
        result = getItemPositionByItemId(itemClass, item_id);
        if (result) {
          if (result && result.top && result.bottom) {
            $scope.defaultFocusItemClass = itemClass;
            rowYFrom = result.top;
            rowYTo = result.bottom;
          }

          $scope.defaultFocusItemClass = itemClass;

          if (rowYFrom !== undefined) {
            scrollYFrom = oldScrollY;
            scrollYTo = scrollYFrom + scroll.wrapperH;

            if (rowYFrom < scrollYFrom) {
              // 상단이 위에 숨겨진 경우
              scrollY = rowYFrom;
            } else if (rowYTo > scrollYTo) {
              // 하단이 아래에 숨겨진 경우
              scrollY = oldScrollY + (rowYTo - scrollYTo);
            } else {
              scrollY = oldScrollY;
            }
          }
        }
      }

      if (scrollY) {
        $rootScope.pageManager.setParam('scrollY', undefined);
        scroll.scrollTo(0, scrollY, 300, true);
        return;
      }
    }

    if (scroll && reset)
      scroll.scrollTo(0, 0, 0);
  };

  $scope.scrollPageUp = function() {
    if (scroll.y > 0) return;
    scroll.scrollTo(0, -200, 300, true);
  };

  $scope.scrollPageDown = function() {
    if (scroll.y < scroll.maxScrollY) return;
    scroll.scrollTo(0, 200, 300, true);
  };

  $scope.scrollRefresh = function() {
    var obj;

    obj = $element[0].getElementsByClassName('panel-body')[0];
    obj.style.height = pageHeight + 'px';
    if (scroll) {
      scroll.refresh();
      scrollBar.refresh(scroll.wrapperH, scroll.scrollerH, scroll.y);
      maxPosition = parseInt((scroll.wrapperH - scroll.scrollerH) / STEP_POSITION);
    }
  };

  $scope.setScrollBarCallback = function(refreshCB, moveCB) {
    scrollBar.refresh = refreshCB;
    scrollBar.move = moveCB;
  };

  $scope.setDefaultFocus = function() {
    var target, item, itemClass;

    if (focusManager.getState('popup') == true) return;

    if ($scope.defaultFocusItemClass) {
      itemClass = $scope.defaultFocusItemClass;
      $scope.defaultFocusItemClass = '';
    } else {
      if($scope.isWatchable()) {
        itemClass = 'btn-large';
      } else {
        itemClass = focusManager.getCurrent().target;
      }
    }

    target = $element[0].getElementsByClassName(itemClass)[0];
    if (target) {
      item = target.getAttribute('item');
      marquee.setTarget(null);

      $scope.setFocusItem(item, target);
      focusManager.setCurrent($scope, item);
    }
  };

  $scope.removeFocus = function() {
    $scope.focusItem = '';
    if (focusElement) {
      focusElement.classList.remove('focus');
      focusElement = null;
      $rootScope.tooltip.hideTooltip();
    }
  };


  $scope.moveFocusByKey = function(keyCode) {
    var name, element, hidden, scrollY, rect;

    marquee.setTarget(null);

    if ($scope.focusItem == '') {
      if (util.isAWSServer()) {
        device.isFocusItem = false;
        device.isTooltipFocusItem = false;
      }
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }
    if ($scope.focusItem.indexOf('item') != 0) {
      switch ($scope.focusItem) {
        case 'back':
          moveFocusFromBack(keyCode);
          break;
        default:
          moveFocusFromWatch(keyCode);
      }
      return;
    }

    var item = null;
    var index = 0;
    var row = 0;
    var columnCount = 0;
    var leftIndex = 0;
    var rightIndex = 0;

    item = $scope.focusItem.split('-')[1];
    index = parseInt($scope.focusItem.split('-')[2]);

    if(item == 'episodeBtn') {
      columnCount = 5;
    } else if(item == 'recommend') {
      // var columnCount = 6;
      columnCount = $scope.recommColCount;
      // row = parseInt($scope.focusItem.split('-')[2] / columnCount);
    } else if(item == 'photo') {
      columnCount = 4;
      // row = parseInt($scope.focusItem.split('-')[2] / columnCount);
    } else if(!$rootScope.season.hide && item == $scope.type + 'Btn') {
      switch(keyCode) {
        case keyHandler.LEFT:
          break;
        case keyHandler.RIGHT:
          // focus popup 오른쪽으로 이동됨
          $rootScope.season.setDefaultFocus();
          break;
        case keyHandler.UP:
          break;
        case keyHandler.DOWN:
          break;
      }
      return;
    }
    if(columnCount) {
      row = parseInt($scope.focusItem.split('-')[2] / columnCount, 10);
      var leftIndex = index % columnCount;
      var rightIndex = index % columnCount;
    }

    var l = $scope.row.length;
    var itemId;
    var rowIndex;

    for (var i = 0; i < l; i++) {
      if($scope.row[i].prefix.split('-')[0] == item &&
        $scope.row[i].index == row * columnCount) {
        name = 'item-' + $scope.row[i].prefix.split('-')[0] + '-' + $scope.row[i].index;
        element = $element[0].getElementsByClassName(name)[0];
        rowIndex = i;
      }
    }

    switch (keyCode) {
      case keyHandler.LEFT:
        if(leftIndex == 0 || index == 0) {
          if (lastItemMenuFocus && lastItemMenuFocus.element) {
            name = lastItemMenuFocus.item;
            element = lastItemMenuFocus.element;
          } else {
            name = 'watch';
            element = $element[0].getElementsByClassName('btn-large')[0];
          }
        } else {
          name = 'item-'+ item + '-' + (index - 1);
          element = $element[0].getElementsByClassName(name)[0];
        }
        scrollY = -1;
        break;
      case keyHandler.UP:
        if(rowIndex == 0) {
          focusToHeader({x: focusElement.offsetLeft + 395, y: 0, width: 0, height: 0});
          return;
        } else {
          rowIndex = rowIndex - 1;
          if($scope.row[rowIndex].count <= leftIndex) {
            if($scope.row[rowIndex].count == 1) {
              leftIndex = 0;
            } else {
              leftIndex = $scope.row[rowIndex].count - 1;
            }
          }
          if($scope.row[rowIndex + 1].type == 'button') {
            name = $scope.focusFromButton($scope.row[rowIndex]);
          } else if ($scope.row[rowIndex].prefix.split('-').length > 1) {
            var preIndex = parseInt($scope.row[rowIndex].prefix.split('-')[1]) + leftIndex;//up 동일 lfet위치 이동
            name = 'item-' + $scope.row[rowIndex].prefix.split('-')[0] + '-' + preIndex;
          } else {
            name = 'item-' + $scope.row[rowIndex].prefix.split('-')[0] + '-' + leftIndex;//그 외 경우
          }
          element = $element[0].getElementsByClassName(name)[0];

//          if(rowIndex == 0) {
//            if(scroll.y < 0) {
//              hidden = true;
//              scrollY = 0;
//            }
//          } else {
            scrollY = element.getBoundingClientRect().top - scroll.wrapperOffsetTop - scroll.y;
//            if(typeof $scope.row[rowIndex - 1] != 'undefined') {
//              if ($scope.row[rowIndex].type != 'button' && $scope.row[rowIndex - 1].type == 'button') {
//                tempEl = $element[0].getElementsByClassName('item-' + $scope.row[rowIndex - 1].prefix.split('-')[0] + '-0')[0];
//                if (tempEl) {
//                  scrollY = tempEl.getBoundingClientRect().top - scroll.wrapperOffsetTop - scroll.y;
//                }
//              }
//            }
            if (scrollY < -scroll.y) {
              hidden = true;
              scrollY = -scrollY;
            }
//          }
        }
        break;
      case keyHandler.RIGHT:
        if(columnCount == 0 ||
          rightIndex >= (columnCount - 1) ||
          $scope.row[rowIndex].count -1  == rightIndex) {
          // 가장 오른쪽의 item이다.
          if (scroll.maxScrollY) {
            // scroll이 존재하는 경우
            rect = {
              x: 0,
              y: focusElement.parentElement.offsetTop + scroll.y + 250,
              width: 0,
              height: focusElement.clientHeight
            };
            $scope.$broadcast('focus', 'scroll', keyCode, rect);
          }
          return;
        }
        name = 'item-'+ item + '-' + (index + 1);
        element = $element[0].getElementsByClassName(name)[0];
        scrollY = -1;
        break;
      case keyHandler.DOWN:
        rowIndex = rowIndex + 1;
        if($scope.row[rowIndex] == null) {
          return;
        }
        if($scope.row[rowIndex].count <= leftIndex) {
          if($scope.row[rowIndex].count == 1) {
            leftIndex = 0;// button
          } else {
            leftIndex = $scope.row[rowIndex].count - 1;// next item or next 카테고리
          }
        }
        if($scope.row[rowIndex - 1].type == 'button' && $scope.row[rowIndex].type == 'button') {
          name = 'item-' + $scope.row[rowIndex].prefix.split('-')[0] + '-' + leftIndex;
        } else if($scope.row[rowIndex - 1].type == 'button') {
          name = $scope.focusFromButton($scope.row[rowIndex]);
        } else if ($scope.row[rowIndex].prefix.split('-').length > 1) {
          var preIndex = parseInt($scope.row[rowIndex].prefix.split('-')[1]) + leftIndex;//down 동일 lfet위치 이동
          name = 'item-' + $scope.row[rowIndex].prefix.split('-')[0] + '-' + preIndex;
        } else {
          name = 'item-' + $scope.row[rowIndex].prefix.split('-')[0] + '-' + leftIndex;//그 외 경우
        }
        element = $element[0].getElementsByClassName(name)[0];

        if (!element) return;

        scrollY = element.getBoundingClientRect().top + element.offsetHeight - scroll.wrapperOffsetTop - scroll.y;
//        if ($scope.row[rowIndex] != null && $scope.row[rowIndex].type == 'button') { // next focus item 이 버튼이면 하위 아이템으로 스크롤되게 한다.
//          tempEl = $element[0].getElementsByClassName('item-' + $scope.row[rowIndex + 1].prefix.split('-')[0] + '-0')[0];
//          if (tempEl) {
//            scrollY = tempEl.getBoundingClientRect().top + tempEl.offsetHeight - scroll.wrapperOffsetTop - scroll.y;
//          }
//        }

        if(rowIndex === $scope.row.length-1) {
          scrollY += 130;
        }
        if (scrollY > scroll.wrapperH - scroll.y) {
          hidden = true;
          scrollY = scroll.wrapperH - scrollY;
        }
        break;
    }
    if (name && element) {
      var scrollToIsCalled;
      if (hidden) {
        scrollByKey = true;
        $scope.showTooltipOnScrollEnd = true;
        scroll.scrollTo(0, scrollY, 300, false);
        scrollToIsCalled = true;
      }
      $scope.setFocusItem(name, element, scrollToIsCalled);
    }
  };

  var moveFocusFromBack = function(keyCode) {
    var element;

    switch (keyCode) {
      case keyHandler.UP:
//        $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});// back button right 방향으로만 움직임
        break;
      case keyHandler.LEFT:
        $scope.executeAction();
        break;
      case keyHandler.RIGHT:
        var name = '';
        if (lastItemMenuFocus && lastItemMenuFocus.element) {
          name = lastItemMenuFocus.item;
          element = lastItemMenuFocus.element;
        } else {
          name = 'watch';
          element = $element[0].getElementsByClassName('btn-large')[0];
        }
        $scope.setFocusItem(name, element);
        focusManager.setCurrent($scope, name);
        break;
    }
  };

  var moveFocusFromWatch = function(keyCode) {
    var element;
    $scope.scrollRefresh();

    var btnLength = $element[0].getElementsByClassName('btn-large').length;
    switch (keyCode) {
      case keyHandler.LEFT:
        $rootScope.$broadcast('focus', 'breadcrumbs', function() {
          // right button이 섵택되었을 때 실행될 callback
          moveFocusFromBack(keyHandler.RIGHT);
        });
        break;
      case keyHandler.UP:
        if(btnLength > 1 && $scope.focusItem == 'trailer') {
          element = $element[0].getElementsByClassName('btn-large')[0];
          $scope.setFocusItem('watch', element);
          break;
        }
        $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
        break;
      case keyHandler.RIGHT:
        //[QEVENTSIXT-13278]처음 상세화면 사방향키 진입 시 실행버튼에서 more버튼으로 포커스 이동
        if(isFirstToMoreBtn && $element[0].querySelector('[item="prev"]').classList.contains('disabled') && !$scope.isSeasonData && !$scope.isEpisodeData) {
          var element = $element[0].querySelectorAll('.btn-more')[0];
          if(element && $element[0].querySelector('[item="item-descBtn-0"]') && element === $element[0].querySelector('[item="item-descBtn-0"]')) {
            $scope.setFocusItem('item-descBtn-0', element);
            break;
          }
        }
        $scope.focusFromScroll('prev', true);
        break;
      case keyHandler.DOWN:
        if(btnLength > 1 && $scope.focusItem == 'watch' && $scope.isAdPlayer) {
          element = $element[0].getElementsByClassName('btn-large')[btnLength - 1];
          $scope.setFocusItem('trailer', element);
        }
        break;
    }
  };

  $scope.focusFromButton = function(target) {
    // console.log('detailList.focusFromButton, target=' + target);
    var min, preTarget, element, temp, obj, name, gap, elementLeft, hidden;

    preTarget = focusElement.getBoundingClientRect().left + (focusElement.getBoundingClientRect().width / 2);
    for (var i = 0; i < target.count; i++) {
      if(target.type == 'button') {
        name = 'item-' + target.prefix + '-' + (target.index + i);
      } else {
        name = 'item-' + target.type + '-' + (target.index + i);
      }
      temp = $element[0].getElementsByClassName(name)[0];
      elementLeft = temp.getBoundingClientRect().left + temp.getBoundingClientRect().width;
      gap = Math.abs(elementLeft - preTarget);
      if(typeof min == "undefined") {
        min = gap;
      }

      if (min >= gap) {
        min = gap;
        element = temp;
      }
    }
    if (element) {
      return element.getAttribute('item');
    }
  };

  var getNearContentsElement = function(target, watch) {
    // console.log('detailList.getNearContentsElement, target=' + target + ', watch=' + watch);
    var moveToName, min, element, temp, scrollY, obj, name, gap, elementTop, hidden;
    var returnArr = {};

    min = -scroll.maxScrollY + scroll.wrapperOffsetTop;
    for (var i = 0; i < $scope.row.length; i++) {
      obj = $scope.row[i];

      if (focusManager.getCurrent().target === 'prev' || focusManager.getCurrent().target === 'next') {
        // check all rows!!!
      } else {
        if (obj.type == 'button' && !obj.movableByKey)
          continue;
      }

      //back 버튼에서 돌아올 경우 이전에 포커스된 아이템 컨텐츠로 이동한다.
      if (lastItemFocus.item) {// scroll 영역에서 아이템 컨텐츠 이동 정책 확인
        if (!lastItemFocus.isFrom && focusManager.getCurrent().target !== 'prev' && focusManager.getCurrent().target !== 'next') {
          // The last focus was scroll btn.
          rect = {x: 0, y: 250, width: 0, height: 100};
          $scope.$parent.$broadcast('focus', 'scroll', keyHandler.RIGHT, rect);
          return false;
        }
        name = lastItemFocus.item;
      } else {
        if (name) {
          // 이미 찾아졌으므로
          continue;
        }
        name = 'item-' + obj.prefix.split('-')[0] + '-' + obj.index;
      }

      if (focusManager.getCurrent().target === 'prev' || focusManager.getCurrent().target === 'next') {
        name = 'item-' + obj.prefix.split('-')[0] + '-' + (obj.index + obj.count - 1); // the nearest item
      }

      temp = $element[0].getElementsByClassName(name)[0];
      if (target != 'prev') {
        elementTop = temp.getBoundingClientRect().top + temp.offsetHeight - scroll.wrapperOffsetTop - scroll.y;
        gap = Math.abs(elementTop - (-scroll.y + scroll.wrapperH));
      } else {
        elementTop = temp.getBoundingClientRect().top - scroll.wrapperOffsetTop - scroll.y;
        gap = Math.abs(elementTop - (-scroll.y));
      }

      if (min > gap || watch) {
        min = gap;
        scrollY = elementTop;
        element = temp;
        moveToName = name;
      }
      if ($scope.row.length === 1) {
        element = temp; // only one row
      }
    }

    //watch 버튼에서 이전 포커스된 아이템으로 돌아올 경우 스크롤 영역 밖의 아이템에 대한 포커스 기준을 변환한다.
    if (watch && (scrollY + temp.offsetHeight) > (scroll.wrapperOffsetTop + scroll.wrapperH)) {
      target = 'next';
      scrollY += element.offsetHeight;
    }

    if (target == 'prev') {
      if (scrollY < -scroll.y) {// scroll 기준 위로 맞춤
        hidden = true;
        scrollY = -scrollY;
      } else if(scrollY + element.offsetHeight > scroll.wrapperH - scroll.y) {// scroll 기준 아래로 맞춤
        hidden = true;
        scrollY = scroll.y - (scroll.y - scroll.wrapperH + scrollY + element.offsetHeight);
      }
    } else {
      if (scrollY > scroll.wrapperH - scroll.y) {
        hidden = true;
        scrollY = scroll.wrapperH - scrollY;
      }
    }

    // watch -> drawer -> watch
    if (!watch && lastItemMenuFocus && lastItemMenuFocus.isFrom) {
      // NOT watch keyHandler.RIGHT && lastItemMenuFocus && lastItemMenuFocus.isFrom
      element = lastItemMenuFocus.element;
    }

    returnArr.element = element;
    returnArr.hidden = hidden;
    returnArr.scrollY = scrollY;

    return returnArr;
  };

  $scope.focusFromScroll = function(target, watch) {
    // console.log('detailList.focusFromScroll, target=' + target + ', watch=' + watch);
    var element, scrollY, hidden;
    var arrElement;

    if (target == 'header') {
      if (focusManager.getCurrent().target === 'prev') lastItemFocus.isFrom = false;
      if (focusManager.getCurrent().target === 'next') {
        element = getNearContentsElement('prev').element;
        $scope.setFocusItem(element.getAttribute('item'), element);
        return;
      }
      focusToHeader({x: $element[0].clientWidth, y: 0, width: 0, height: 0});
      return;
    }

    arrElement = getNearContentsElement(target, watch);
    if (!arrElement) return;
    element = arrElement.element;
    hidden = arrElement.hidden;
    scrollY = arrElement.scrollY;

    if (element) {
      $scope.setFocusItem(element.getAttribute('item'), element);
      if (hidden) {
        scrollByKey = true;
        scroll.scrollTo(0, scrollY, 300, false);
      }
    }
  };

  var focusToHeader = function(rect) {
    var mid, element;

    if(focusManager.getCurrent().target == 'prev' || focusElement != null) {// focus scroll or detail page
      $rootScope.$broadcast('focus', 'drawer', keyHandler.UP, rect);
    } else {
      $scope.focusFromScroll('prev', false);
    }
  };

  var focusHandler = function(e, target, keyCode, rect) {
    if (target != 'main') return;
    e.preventDefault();

    if ((keyCode === keyHandler.RIGHT) && rect && (rect.left <= 0)) {
      // from breadcrumbs
      moveFocusFromBack(keyCode);
      return;
    }

    focusToHeader(rect);
  };

  var toggleEpisodeMore = function() {
    var obj, l;
    obj = $scope.episode.items;
    l = obj.length;
     $scope.isEpisode = !$scope.isEpisode;
    for (var i = 0; i < l; i++) {
      if (i > 4) {
        obj[i].showEpisode = !obj[i].showEpisode;
      } else {
        obj[i].showEpisode = true;
      }
    }
    updateRow();
    $scope.scrollRefresh();
  };

  var togglePhoto = function() {
    var obj, l, m , photoArr;
    obj = $scope.photo.items;
    l = obj.length;
    for (var i = 0; i < l; i++) {
      if (i > 3) {
        obj[i].showPhoto = !obj[i].showPhoto;
      } else {
        obj[i].showPhoto = true;
      }
    }
    updateRow();
    $scope.scrollRefresh();
    photoArr = $element[0].getElementsByClassName('item-trailer');
    m = photoArr.length;
    for (i = 0; i < m; i++) {
      $scope.setMouseEvent(photoArr[i]);
    }
  };

  var toggleRecommend = function() {
    var obj, l, m , recommendArr;
    obj = $scope.recommend.items;
    l = obj.length;
    for (var i = 0; i < l; i++) {
      if (i >= $scope.recommColCount) {
        obj[i].showRecommend = !obj[i].showRecommend;
      } else {
        obj[i].showRecommend = true;
      }
    }
    updateRow();
    $scope.scrollRefresh();
    recommendArr = $element[0].getElementsByClassName('item-detail');
    m = recommendArr.length;
    for (i = 0; i < m; i++) {
      $scope.setMouseEvent(recommendArr[i]);
    }

    //RTL모드에서 english only이면 ltr 클래스 추가
    if (device.isRTL) {
      // 접혀있던 메뉴가 펼쳐진 경우
      // 상세페이지의 상세정보에 대한 text처리  RTL모드에서 english only이면 ltr 클래스 추가
      util.rtlClassChange('text');
      util.rtlClassChange('synopsis-text');
    }

    $scope.$broadcast('drawFinished', $scope);
  };

  var destroyScope = function() {
    delete scroll;
    scrollBar = null;
    $element.remove();
    $scope.$destroy();
  };

  ///////////////////////////////////////////////////////////////////////////
  var showAllImage = false;

  $scope.getShowAllImage = function() {
    return showAllImage;
  };

  $scope.setShowAllImage = function(show) {
    // console.log('detailList.setShowAllImage, show=' + show);
    showAllImage = show;

    if (show) {
      $scope.$broadcast('lazyImage');
    }
  };
  ///////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////
  // 시즌 및 회차 팝업을 닫기 위한 click event listener
  $scope.processClick = function(e) {
    console.log(e);
    if(!$rootScope.season.hide) {
      e.preventDefault();
      focusManager.setState('season', false);
      $rootScope.season.hide = true;
      $rootScope.season.open = false;
      $rootScope.season.hidePopup();
      $scope.$digest();
    }
  };
  ///////////////////////////////////////////////////////////////////////////

  $scope.initialize = function() {
    var catchScope, item, map = {
      'TS': 'TVShowDetail',
      'MV': 'MovieShowDetail'
    };

    item = $element[0].getAttribute('item').split('|')[0];
    $scope.scopeName = map[item];
    $scope.itemId = $element[0].getAttribute('item');
    // 같은 scope으로 화면전환이 일어날 경우 이전에 생성된 scope 정보를 저장한다.
    //for(var childScope = $scope.$parent.$$childHead; childScope; childScope = childScope.$$nextSibling) {
    catchScope = false;
    for(var childScope = $scope.$parent.$$childTail; childScope; childScope = childScope.$$prevSibling) {
      if (childScope.scopeName == $scope.scopeName && childScope.$id < $scope.$id && !catchScope) {
        $scope.toBeDelScope = childScope.itemId;
        catchScope = true;
      }
    }

    $rootScope.prevScope = $scope;
    $rootScope.prevElement = $element;

    $scope.$on(eventKey.DETAIL_TVMOVIE, drawDetail);
    $scope.$on('hiding', hideDetail);
    $scope.$on('focus', focusHandler);
    $scope.$on(eventKey.RECOVER_FOCUS, $scope.recoverFocus);
    $scope.$on('drawFinished', initializeDetail);
    $element.on('click', $scope.processClick);

    /*scope destroy 이벤트*/
    $scope.$on('$destroy', destroyScope);

    if (device.isDeepLink) {
      $rootScope.pageManager.setParam('preData', undefined);
    }

    util.async(requestData);

    var pageId = 'detailList' + '-' + $scope.$id;
    $element[0].setAttribute('id', pageId);
  };

  $scope.initialize();
});
