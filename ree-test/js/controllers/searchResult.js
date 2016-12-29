app.directive('searchResult', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    controller: 'searchResultController',
    templateUrl: './resources/html/searchResult.html'
  };
});

app.directive('defaultSearchResultImage', function(device) {
  return {
    link: function($scope, $element) {
      $element.bind('error', function (e) {
        $scope.item.thumb = './resources/images/default_app.png';
      });

      $element.bind('load', function(e) {
        var x, y, w, h, dstW, dstH;
        var zoomRatio = device.isHD ? 0.667 : 1;

        dstW = parseInt(283 * zoomRatio);
        if ($element.hasClass('item-list') || $element.hasClass('item-premium')) {
          dstH = parseInt(424 * zoomRatio); // tvshows, movies, premium
        } else if ($element.hasClass('item-youtube') || $element.hasClass('item-apps')){
          dstH = parseInt(212 * zoomRatio); // youbue, app
        }

        x = 0;
        y = 0;

        var imgH = this.naturalHeight;
        var imgW = this.naturalWidth;

        h = parseInt(imgH * dstW / imgW);
        if (h >= dstH) {
          h = dstH;
          w = parseInt(imgW * dstH / imgH);
          if (w < dstW) {
            x = parseInt((dstW - w) / 2);
          } else {
            x = 0;
          }
          y = 0;
        } else {
          w = dstW;
          y = parseInt((dstH - h) / 2);
          x = 0;
        }

        $element[0].style.width = w + 'px';
        $element[0].style.height = h + 'px';
        $element[0].style.left = x + 'px';
        $element[0].style.top = y + 'px';
      });
    }
  };
});

app.controller('searchResultController', function($scope, $controller, $element, $rootScope, $timeout, server, marquee, focusManager, util, keyHandler, storage, appLaunch, device, pageManager, popupService, pmLog, eventKey, timeOutValue) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var STEP_POSITION = 100;
  var resolutionRatio = device.resolutionRatio;

  var focusElement = null;
  var lastFocus = {};
  var lastItemFocus = {};
  var scroll = null;
  var scrollBar = {};
  var previousPosition = 0;
  var maxPosition = 0;
  var scrollByKey = false;

  // TODO $scope할당여부
  var sortCode = '';
  var priceCode = '';
  var genreCode = '';
  var arrDomains = [];

  var onceCheckShowCategoryTitle = false;

  $scope.itemId = null;
  $scope.toBeDelScope = null;
  $scope.toBeGoScope = null;
  $scope.scopeName = '';
  $scope.focusItem = '';
  $scope.direct = false;
  $scope.showing = false;
  $scope.hiding = false;
  $scope.title = '';
  $scope.subTitle = '';
  $scope.categoryTitle = '';
  $scope.showCategoryTitle = false;

  $scope.section = null;
  $scope.webSearch = '';
  $scope.historyBack = $rootScope.pageManager.getTitle('back');
  $scope.drawed = false;
  $scope.nodata = msgLang.search_noresult_3 + ' ' + msgLang.search_noresult_3_1;
  $scope.noResult = false;
  $scope.maxContents = 6;
  $scope.moreTitle = msgLang.more;
  $scope.item_id = '';
  $scope.itemRowCountCol = null;
  $scope.itemRowHasSpecialKeyword = null;
  $scope.filterOptionData = [];

  $scope.sort = false;
  $scope.code = '';
  $scope.category = '';
  $scope.keyword = '';
  $scope.webUrl = '';
  $scope.isInLink = $rootScope.pageManager.getLink();
  $rootScope.pmLogValue = pmLog.TYPE.SEARCHRESULT;

  $scope.setFocusItem = function(item, element) {
    var y;

    if (lastFocus.item === 'back' || lastFocus.item === 'option') {
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

    if ($scope.focusItem === 'back') {
      $rootScope.tooltip.showTooltip(50, 107, $rootScope.pageManager.getTitle('back'), true, true);
    } else if ($scope.focusItem === 'option') {
      $rootScope.tooltip.showTooltip(1835, 185, msgLang.listOption, true);
    } else if ($scope.focusItem !== null && $scope.focusItem.indexOf('-') >= 0) {
      //이전에 포커스된 아이템 컨텐츠를 저장하여 back 버튼에서 돌아올 경우 이전에 포커스된 아이템 컨텐츠로 이동한다.
      lastItemFocus.item = lastFocus.item;
      lastItemFocus.element = lastFocus.element;
    }
  };

  $scope.recoverFocus = function() {
    if (lastFocus.item && lastFocus.element)
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
  };

  $scope.setFilter = function(filter, value) {
    var clickedOptionKey = 'FILTER_ORDER';
    if (filter == 'Order') {
      sortCode = value;
      clickedOptionKey = 'FILTER_ORDER';
    } else if (filter == 'Filter') {
      priceCode = value;
      clickedOptionKey = 'FILTER_FILTER';
    } else if (filter == 'Category') {
      genreCode = value;
      clickedOptionKey = 'FILTER_CATEGORY';
    }
    //setting selected option in listoption view
    for (i = 0; i < $scope.filterOptionData.length; i++) {
      if ($scope.filterOptionData[i].key == clickedOptionKey) {
        for (j = 0; j < $scope.filterOptionData[i].values.length; j++) {
          delete($scope.filterOptionData[i].values[j].selected);
          if ($scope.filterOptionData[i].values[j].code == value) {
            $scope.filterOptionData[i].values[j].selected = "TRUE";
          }
        }
      }
    }
    /*pmlog*/
    var pmlogVar = {
      keyword : $scope.keyword
    };
    if (filter == 'Order') {
      pmlogVar.option_type = 'Sort';
      pmlogVar.sort_id = value;
    } else {
      pmlogVar.option_type = 'Filter';
      pmlogVar.filter_id = value;
    }
    pmLog.write(pmLog.LOGKEY.SEARCH_RESULT_OPTION_CHANGE, pmlogVar);
    util.async(requestData);
  };

  $scope.executeAction = function() {
    if (focusManager.blockExecution()) {
      console.log('searchResult.executeAction, blockExecution is true');
      return;
    }

    var focusObject, target, obj, item_id;

    focusObject = focusManager.getCurrent();
    if (focusObject.scope === $scope) {
      target = focusObject.target;
      if (target === 'back') {
        $scope.setFocusItem('', null);
        obj = $rootScope.pageManager.popHistory();
        if (!$scope.isInLink) {
          $scope.hide = true;
        } else {
          // 같은 controller 에서 이동하므로 기 생성된 scope을 초기화한다.
          $scope.hiding = true;
        }
        $scope.toBeGoScope = obj.module;
        $rootScope.draw(obj);
      } else if (target === 'option') {
        if ($rootScope.option.hide) {
          $rootScope.option.showOption($scope, $scope.filterOptionData);
        }
      } else {
        var dataAct = focusElement.getAttribute('data-act');
        if (dataAct === 'tvshowDetailMove' || dataAct === 'movieDetailMove') {
          if (device.tierType === 2) {
            var data = testTier2ExecList();
            popupService.watchClick($scope, data);
            return;
          }

          var item_type = focusElement.getAttribute('item-type');
          item_id = focusElement.getAttribute('item-id');
          item_id = item_type + '|' + item_id;
          $scope.toBeGoScope = item_id;
          $rootScope.draw({
            page: 'detailList',
            module: item_id,
            from : 'search',
            query : $scope.keyword,
            inLink: $scope.isInLink
          });

        } else if (dataAct === 'youtubeDetailMove') {
          var youtubeContentID = focusElement.getAttribute('item-id');
          var youtubeParams = {contentTarget : 'https://www.youtube.com/tv?v='+youtubeContentID};
          var youtubeRequestParam = {appId:'youtube.leanback.v4', appLaunchParams:youtubeParams};
          appLaunch.call(youtubeRequestParam);

        } else if (dataAct === 'appDetailMove' || dataAct === 'premiumDetailMove') {
          item_id = focusElement.getAttribute('item-id');
          $scope.toBeGoScope = item_id;
          $rootScope.draw({
            page: 'detailApp',
            module: item_id,
            from : 'search',
            query : $scope.keyword,
            inLink: $scope.isInLink
          });

        } else if (dataAct === 'searchMore') {
          $scope.scopeName = 'searchMore';
          $scope.$apply();
          $scope.toBeGoScope = focusElement.getAttribute('category');
          $timeout(function() {
            $rootScope.draw({
              page: 'searchMore',
              code: 'VDLD02', // ToDo
              keyword: $scope.keyword,
              category: focusElement.getAttribute('category'),
              module: focusElement.getAttribute('category'),
              inLink: $scope.isInLink
            });
          }, 10);
        } else if (dataAct === 'webSearch') {
          var params = {target : $scope.webUrl};
          var requestParam = {appId:'com.webos.app.browser', appLaunchParams:params};
          appLaunch.call(requestParam);
        }
        /**PM LOG**/
        if(dataAct === 'tvshowDetailMove' || dataAct === 'movieDetailMove' || dataAct === 'appDetailMove'
          || dataAct === 'premiumDetailMove' || dataAct === 'youtubeDetailMove') {
          var contents_id = focusElement.getAttribute('item-id');
          var contents_category = '';
          var keyword = $scope.keyword;
          if (dataAct === 'tvshowDetailMove') {
            contents_category = pmLog.TYPE.TVSHOWS;
          } else if (dataAct === 'movieDetailMove') {
            contents_category = pmLog.TYPE.MOVIE;
          } else if (dataAct === 'appDetailMove') {
            contents_category = pmLog.TYPE.APPGAME;
          } else if (dataAct === 'premiumDetailMove') {
            contents_category = pmLog.TYPE.PREMIUM;
          } else if (dataAct === 'youtubeDetailMove') {
            contents_category = pmLog.TYPE.YOUTUBE;
          }
          pmLog.write(pmLog.LOGKEY.SEARCH_CONTENT_CLICK , {
            contents_id : contents_id,
            shelf_id : contents_category,
            keyword : keyword
          });
        } else if (dataAct === 'searchMore') {
          if (focusElement.classList.contains('btn-text')) {
            pmLog.write(pmLog.LOGKEY.SEARCH_ALL_RESULT_CLICK , {
              keyword : $scope.keyword
            });
          } else {
            var contents_category = '';
            if (focusElement.getAttribute('category') === 'tvshow') {
              contents_category = pmLog.TYPE.TVSHOWS;
            } else if (focusElement.getAttribute('category') === 'movie') {
              contents_category = pmLog.TYPE.MOVIE;
            } else if (focusElement.getAttribute('category') === 'app') {
              contents_category = pmLog.TYPE.APPGAME;
            } else if (focusElement.getAttribute('category') === 'premium') {
              contents_category = pmLog.TYPE.PREMIUM;
            } else if (focusElement.getAttribute('category') === 'youtube') {
              contents_category = pmLog.TYPE.YOUTUBE;
            }
            pmLog.write(pmLog.LOGKEY.SEARCH_MORE , {
              contents_category : contents_category,
              keyword : $scope.keyword
            });
          }
        }
      }
    }
  };

  var setSubTitle = function(map) {
    if ($scope.category) {
      $scope.subTitle = map[$scope.category];
      if ($scope.filterOptionData.length != 0) {
        var firstAdd = true;
        $scope.subTitle = $scope.subTitle + ' | ';
        firstAdd = subtitleLoop('FILTER_CATEGORY', firstAdd);
        firstAdd = subtitleLoop('FILTER_ORDER', firstAdd);
        subtitleLoop('FILTER_FILTER', firstAdd);
      }
    } else {
      $scope.subTitle = msgLang.search_allResults;
    }
  };

  var subtitleLoop = function(keyVal, firstAdd) {
    for (i = 0; i < $scope.filterOptionData.length; i++) {
      if ($scope.filterOptionData[i].key == keyVal) {
        for (j = 0; j < $scope.filterOptionData[i].values.length; j++) {
          if ($scope.filterOptionData[i].values[j].selected) {
            if (firstAdd) {
              $scope.subTitle = $scope.subTitle + $scope.filterOptionData[i].values[j].name;
              firstAdd = false;
            } else {
              $scope.subTitle = $scope.subTitle + ', ' + $scope.filterOptionData[i].values[j].name;
            }
          }
        }
      }
    }
    return firstAdd;
  };

  var drawSearchResult = function(e, response) {
    //console.log('searchResult - drawSearchResult');
    e.preventDefault();

    // TODO : scope는 response.scopeId로 접근하면 됩니다.
    console.log('response.scopeId : ', response.scopeId);

//    try{
      var results;
      var title = $scope.$eval(response['response']['query_information'])['query'];
      // scope id를 비교하여 중복 호출을 방지함.
      if ($scope.$id != response.scopeId) {
        return;
      }
      //if ($scope.scopeName !== '' && $scope.scopeName !== response.scopeName) return;

      if (!$scope.category) {
        $scope.scopeName = e['name'];
      } else {
        $scope.scopeName = 'searchMore';
      }

      // msgLang.alert_adult_3_9 = 'SEARCH RESULTS: \'[search keyword]\''; // msgLang.searchresult_headtitle
      $scope.title = msgLang.alert_adult_3_9.replace('[search keyword]', title);
      $scope.keyword = title;
      //$scope.subTitle = msgLang.search_allResults;
      $scope.categoryTitle = msgLang.search_noresult_5.replace('[KEYWORD]', title);
      $rootScope.pageManager.setTitle($scope.title);

      var map = {
        'tvshow': msgLang.search_section02
        , 'youtube': msgLang.search_section05
        , 'app': msgLang.search_section04
        , 'premium': msgLang.premium
        , 'movie': msgLang.search_section03
      };

      setSubTitle(map);

      results = response['response']['results'];
      if (results.length > 0) {

        // remove livetv and 3d
        results = results.filter(function (el) {
          return (el.code !== 'livetv' && el.code !== '3d');
        });

        $scope.section = [];
        $scope.section.items = [];
        $scope.itemRowCountCol = new Array(results.length);
        $scope.itemRowHasSpecialKeyword = new Array(results.length);

        for (i = 0; i < results.length; i++) {
          $scope.section.items.push({
            code : results[i].code
            , title : map[results[i].code]
          });

          //영역별 item 개수 세팅
          if (results[i].code == 'cp') {
            if (resolutionRatio == "21:9") {
              $scope.maxContents = 8;
            } else if (resolutionRatio == "16:9") {
              $scope.maxContents = 6;
            }
          } else if (results[i].code == 'premium' || results[i].code == 'tvshow' || results[i].code == 'movie'
            || results[i].code == '3d' || results[i].code == 'app' || results[i].code == 'youtube') {
            if (results[i].emphasis == true) {
              if (resolutionRatio == "21:9") {
                $scope.maxContents = 16;
              } else if(resolutionRatio == "16:9") {
                $scope.maxContents = 12;
              }
            } else {
              if (resolutionRatio == "21:9") {
                $scope.maxContents = 8;
              } else if(resolutionRatio == "16:9") {
                $scope.maxContents = 6;
              }
            }
          }

          if (results[i].doc.length > 0) {
            $scope.section.items[i].row = i;
            if (results[i].doc.length > $scope.maxContents) {
              $scope.section.items[i].showMore = true;
            }
            $scope.section.items[i].content = [];
            $scope.section.items[i].content.items = [];

            var cntColumn = 0;
            $scope.itemRowHasSpecialKeyword[i] = false;
            for (j = 0; j < results[i].doc.length; j++) {
              var contentssetid = results[i].doc[j].contentssetid === undefined ? '' : results[i].doc[j].contentssetid + '|';
              $scope.section.items[i].content.items.push({
                code : results[i].code
                , item_id : contentssetid + results[i].doc[j].contentsid
                , thumb : results[i].doc[j].thumbnail
                , title : results[i].doc[j].title
              });

              if (results[i].code === 'web') {
                $scope.webUrl = results[i].doc[j].url + $scope.keyword;
                $scope.webRow = i;
                if ($scope.webRow === 0) {
                  $scope.noResult = true;
                }
              }

              var s = parseFloat(results[i].doc[j].score);
              if (!isNaN(s) && (s > 0)) {
                $scope.section.items[i].content.items[j].itemGrade = true;
                $scope.section.items[i].content.items[j].score = parseInt(results[i].doc[j].score * 10);
              }

              $scope.section.items[i].content.items[j].searchListItem = 'item-list'; // tvshow, movie
              if (results[i].code === 'tvshow') {
                $scope.section.items[i].content.items[j].item_type = 'TS';
              } else if (results[i].code === 'movie') {
                $scope.section.items[i].content.items[j].item_type = 'MV';
              } else if (results[i].code === 'youtube') {
                $scope.section.items[i].content.items[j].item_type = 'youtube';
                $scope.section.items[i].content.items[j].searchListItem = 'item-youtube';
              } else if (results[i].code === 'app' || results[i].code === 'premium') {
                if (results[i].code === 'app') {
                  $scope.section.items[i].content.items[j].searchListItem = 'item-apps';
                } else if (results[i].code === 'premium') {
                  $scope.section.items[i].content.items[j].searchListItem = 'item-premium';
                }
                $scope.section.items[i].content.items[j].item_type = 'app';
                $scope.section.items[i].content.items[j].item_id = results[i].doc[j].appid;
                $scope.section.items[i].content.items[j].itemGrade = false;
                $scope.section.items[i].content.items[j].isApp = true;
                $scope.section.items[i].content.items[j].category = results[i].doc[j].genre;
                $scope.section.items[i].content.items[j].showPrice = true;
                $scope.section.items[i].content.items[j].price = results[i].doc[j].price;
                if (results[i].doc[j].price.replace(/[^0-9]/g, '') === '0') {
                  $scope.section.items[i].content.items[j].price = msgLang.free;
                }
              }

              if (cntColumn < $scope.maxContents && results[i].doc[j].ranklevel !== 'L') {
                if (results[i].doc[j].ranklevel === 'XS') {
                  // Special Keyword
                  $scope.itemRowHasSpecialKeyword[i] = true;
                  $scope.section.items[i].content.items[j].itemSpecialKeyword = 'item-search-keyword';
                  if (results[i].code === 'tvshow' || results[i].code === 'movie') {
                    // TVSHOW, MOVIE
                    $scope.section.items[i].content.items[j].itemKeywordDetail = true;
                    $scope.section.items[i].content.items[j].year = results[i].doc[j].makeyear;
                    if (results[i].doc[j].cast) {
                      $scope.section.items[i].content.items[j].broadcastName = msgLang.search_specialkeyword_cast;
                      $scope.section.items[i].content.items[j].cast = results[i].doc[j].cast.replace(/-_-/gi, ', ');
                    }
                  } else if (results[i].code === 'premium' || results[i].code === 'app') {
                    // PREMIUM, APP
                    $scope.section.items[i].content.items[j].showPrice = false;
                    $scope.section.items[i].content.items[j].appItemKeywordDetail = true;
                    if (results[i].code === 'app') {
                      $scope.section.items[i].content.items[j].appPrice = true;

                      s = parseFloat(results[i].doc[j].score);
                      if (!isNaN(s) && (s > 0)) {
                        $scope.section.items[i].content.items[j].appGrade = true;
                        $scope.section.items[i].content.items[j].score = parseInt(results[i].doc[j].score * 10);
                      }
                      $scope.section.items[i].content.items[j].price = results[i].doc[j].price;
                      if (results[i].doc[j].price.replace(/[^0-9]/g, '') === '0') {
                        $scope.section.items[i].content.items[j].price = msgLang.free;
                      }
                      if (results[i].doc[j].price !== results[i].doc[j].eventprice) {
                        $scope.section.items[i].content.items[j].isEventPriceDifferFromPrice = true;
                        $scope.section.items[i].content.items[j].eventPrice = results[i].doc[j].eventprice;
                      }
                    }
                    $scope.section.items[i].content.items[j].developer = results[i].doc[j].director;
                  }
                  cntColumn++;
                }
                $scope.section.items[i].content.items[j].show = true;
                $scope.section.items[i].content.items[j].rowIndex = i;
                $scope.section.items[i].content.items[j].idx = j + '-' + i; // col-row
                cntColumn++;
              } else if ($scope.scopeName === 'searchMore') {
                $scope.section.items[i].content.items[j].show = true;
                $scope.section.items[i].content.items[j].rowIndex = i;
                $scope.section.items[i].content.items[j].idx = j + '-' + i; // col-row
                $scope.section.items[i].showMore = false;
                if (!onceCheckShowCategoryTitle) {
                  for (k = 0; k < results[i].doc.length; k++) {
                    if (k === 0) {
                      $scope.showCategoryTitle = true;
                    }
                    if (results[i].doc[k].ranklevel !== 'L') {
                      $scope.showCategoryTitle = false;
                      break;
                    }
                  }
                  onceCheckShowCategoryTitle = true;
                }
                cntColumn++;
              } else {
                $scope.section.items[i].content.items[j].show = false;
              }

              if (j === results[i].doc.length - 1) {
                $scope.webSearch = msgLang.search_gotoweb;
                $scope.itemRowCountCol[i] = cntColumn;
                if ($scope.itemRowHasSpecialKeyword[i] === true) {
                  $scope.itemRowCountCol[i] = cntColumn - 1;
                }
                if (cntColumn < $scope.maxContents) {
                  if (cntColumn === 0) {
                    $scope.section.items[i].resultPhrase = true;
                    $scope.section.items[i].resultPhraseText = msgLang.search_noresult_4.replace('[KEYWORD]', title);
                    $scope.section.items[i].view = msgLang.search_view ;
                  }
                  $scope.section.items[i].showMore = false;
                }
              }
            }
          }
        }
        // remove livetv and 3d and web
        $scope.section.items = $scope.section.items.filter(function (el) {
          return (el.code !== 'livetv' && el.code !== '3d' && el.code !== 'web');
        });
      }

      $scope.$apply();

      // set Mouse Event
      $scope.setMouseEvent($element[0].getElementsByClassName('blank panel-back')[0]);

      arr = $element[0].getElementsByClassName('blank item item-search');
      for (i = 0; i < arr.length; i++) {
        obj = arr[i];
        $scope.setMouseEvent(obj);
        obj.removeAttribute('ng-class');
        obj.removeAttribute('ng-repeat');
      }

      arr = $element[0].getElementsByClassName('blank btn-more');
      for (i = 0; i < arr.length; i++) {
        obj = arr[i];
        $scope.setMouseEvent(obj);
        obj.removeAttribute('ng-class');
        obj.removeAttribute('ng-repeat');
      }

      arr = $element[0].getElementsByClassName('blank btn');
      for (i = 0; i < arr.length; i++) {
        obj = arr[i];
        $scope.setMouseEvent(obj);
        obj.removeAttribute('ng-class');
        obj.removeAttribute('ng-repeat');
      }

      $element[0].removeAttribute('ng-class');

      util.async(function() {
        $scope.drawed = true;
        initializeDetail();
        initializeScroll();
        if ($scope.scopeName == 'searchResult') pageManager.initHistory(); // 검색 결과 페이지가 완료되면 history 를 초기화함.
        $scope.$emit('finishDraw', $scope.scopeName, timeOutValue.FINISH_DRAW);
      });
//    } catch(e) {
//      console.log(e);
//      var errorCode = 'searchResult.002';
//      var popOpts = {title: msgLang.alert_adult_3_2, subTitle: msgLang.alert_adult_3_5, errorCode: errorCode, type: 'errorPopup'};
//      $rootScope.popupApp.showPopup($scope, popOpts);
//    }
  };

  var initializeDetail = function() {
    $scope.$apply();
    util.async($scope.scrollRefresh);
  };

  var hideSearchList = function(e, page) {
    e.preventDefault();

    $scope.isInLink = $rootScope.pageManager.getLink();
    if ($scope.toBeGoScope) {
      $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
        $scope.hiding = true;
        $scope.$apply();
        destroyScope();
      });
      return;
    }
    if ((page != $scope.scopeName || $scope.isInLink) && !$scope.showing) {
      if ($scope.direct === false && $scope.showing === false) {
        if (page === '') {
          $scope.setDefaultFocus();
          $scope.direct = true;
          $scope.toBeGoScope = true;
          $rootScope.breadcrumb.onPageFromDeepLink();
          $scope.$apply();
        } else {
          $scope.setDefaultFocus();
          $rootScope.breadcrumb.onPageMoveIn($scope.scopeName, undefined, function() {
            // breadcrum animation이 종료된 이후 호출되는 callback 임
            $scope.showing = true;
            $scope.$apply();
          });
        }
      }
      return;
    }

    $rootScope.breadcrumb.onPageMoveOut($scope.scopeName, function() {
      // breadcrum animation이 종료된 이후 호출되는 callback 임
      $scope.hiding = true;
      // $timeout(function() {
        delete scroll;
        scrollBar = null;
        $element.remove();
        $scope.$destroy();
      // }, timeOutValue.DESTROYING);
    });
  };

  var requestData = function() {
    var params = {}, keyword;
    var re = /[\\]/gi, rs=/[\"]/gi;

    keyword = $element[0].getAttribute("item").replace(re,'\\\\').replace(rs,'\\\"');

    // more 진입 시
    if ($scope.category) {
      arrDomains = [];
      arrDomains.push($scope.category);
      keyword = $scope.keyword.replace(re,'\\\\').replace(rs,'\\\"');
    }

    if (!device.isLocalJSON) {
      params = {
        api : '/rest/sdp/v6.0/search/retrieval',
        method : 'post',
        payload : {
          query: keyword,
          startindex: '1',
          maxresults: '200',
          domain: arrDomains,
          version: 'v1',
          epgcode: ['794', '795', '796', '798', '797'], // TODO 의미파악
          sortby: [sortCode],
          filterby: {
            price_code: priceCode,
            genre_code: genreCode
          }
        }
      };
      $rootScope.spinner.showSpinner();

      try {
        server.requestApi(eventKey.SEARCH_RESULT, params, $scope.$id);
      } catch (e) {}

    } else {
      // local file용
      params = {
        query : keyword,
        startindex : '1',
        maxresults : '200',
        domain : arrDomains,
        version : 'v1',
        epgcode : ['794', '795', '796', '798', '797'], // TODO 의미파악
        sortby : [sortCode],
        filterby : {
          price_code : priceCode,
          genre_code : genreCode
        }
      };
      $rootScope.spinner.showSpinner();

      try {
        server.requestSearchResult(params);
      } catch (e) {}

    }
  };

  var move = function(y) {
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

  var end = function(y) {
    $scope.$broadcast('loadImage');
    $timeout(function() {
      scrollByKey = false;
    }, 100);
  };

  var initializeScroll = function() {
    var option = {};
    option.onPositionChange = move;
    option.onScrollEnd = end;
    option.useTransform = false;

    scroll = new iScroll($element[0].getElementsByClassName('panel-body')[0], option);

    $element[0].getElementsByClassName('panel-body')[0].onmousewheel = function(e) {
      if (scroll.wrapperH >= scroll.scrollerH) return;
      if (focusManager.blockExecution()) return;
      if (focusManager.preExecution()) return;
      if (e.wheelDelta < 0 && scroll.y > 0) return;
      if (e.wheelDelta > 0 && scroll.y < scroll.maxScrollY) return;
      scroll.scrollTo(0, e.wheelDelta * -3, 300, true);
    };
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

  var goToScroll = function(keyCode) {
    if (scroll.wrapperH < scroll.scrollerH) {
      rect = {
        x: 0,
        y: focusElement.offsetTop + scroll.y,
        width: 0,
        height: focusElement.clientHeight
      };
      $scope.$broadcast('focus', 'scroll', keyCode, rect);
    }
  };

  $scope.setDefaultFocus = function() {
    var target;

    if (focusManager.getState('option') === true) return;

    target = $element[0].getElementsByClassName('item-search')[0];
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

  $scope.moveFocusByKey = function(keyCode) {
    var name, element, hidden, rect, scrollY;
    var currElement, currElement_top, elementToGo, elementToGo_top, candidateElements;

    if ($scope.focusItem === '') {
      $scope.setFocusItem(lastFocus.item, lastFocus.element);
      return;
    }

    switch ($scope.focusItem) {
      case 'back':
        moveFocusFromBack(keyCode);
        return;
    }

    arr = $scope.focusItem.split('-');
    column = parseInt(arr[0]);
    index = parseInt(arr[1]);
    switch (keyCode) {
      case keyHandler.LEFT:
        if (column === 0) {
          name = 'back';
          element = $element[0].getElementsByClassName('blank panel-back')[0];
          break;
        }
        name = (column - 1) + '-' + index;
        if (name === 'NaN-NaN') {
          name = 'back';
          element = $element[0].getElementsByClassName('blank panel-back')[0];
          break;
        }
        element = angular.element(document.getElementById(name))[0];

        // check if left element is in the same row.
        currElement = focusElement;
        elementToGo = element;
        currElement_top = currElement.getBoundingClientRect().top;
        elementToGo_top = elementToGo.getBoundingClientRect().top;
        if (currElement_top !== elementToGo_top) {
          name = 'back';
          element = $element[0].getElementsByClassName('blank panel-back')[0];
          break;
        }

        break;

      // module code
      /*var prevFocus = findFocusLeftItem();
       name = prevFocus[0];
       element = prevFocus[1];
       break;*/

      case keyHandler.UP:
        // searchMore page
        if ($scope.scopeName === 'searchMore') {
          // option or web-search-button
          if (index+'' === 'NaN') {
            if (focusElement.getAttribute('item') === 'option') {
              $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
              return;
            }
            var contents = $element[0].querySelectorAll('[row-index="0"]');
            name = (contents.length-1) + '-' + 0;
            element = angular.element(document.getElementById(name))[0];
          } else {
            // contents
            currElement = focusElement.getAttribute('item');
            arr = currElement.split('-');
            column = parseInt(arr[0]) - parseInt($scope.maxContents);
            if ($scope.itemRowHasSpecialKeyword[0] && parseInt(arr[0]) === $scope.maxContents - 1) {
              name = 0 + '-' + 0;
              element = angular.element(document.getElementById(name))[0];
              break;
            }
            if (column >= 0) {
              name = (column) + '-' + 0;
              element = angular.element(document.getElementById(name))[0];
            } else {
              if (!$element[0].querySelector('[item="option"]').classList.contains('ng-hide')) {
                name = 'option';
                element = elementToGo = $element[0].querySelector('[item="option"]');
              } else {
                $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
                return;
              }
            }
          }
          break;
        }

        // searchResult page
        var upFocus;
        // detail-more-button
        if (index+'' === 'NaN' || index === undefined || index === null || index === '') {
          index = parseInt(focusElement.getAttribute('item').split('-')[2]);
          if (index === 0) {
            $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
            return;
          } else {
            index = index - 1;
            // 1st, check contents
            candidateElements = $element[0].querySelectorAll('[row-index="'+index+'"]');
            if (candidateElements.length > 0) {
              upFocus = findFocusUpItem(candidateElements);
              name = upFocus[0];
              element = upFocus[1];
              break;
            }
            // 2nd, check detail-more-button
            elementToGo = $element[0].querySelector('[item="detail-more-'+index+'"]');
            name = 'detail-more-'+index;
            element = angular.element(elementToGo)[0];
            break;
          }
        }

        // contents
        // 1st, check detail-more-button
        elementToGo = $element[0].querySelector('[item="detail-more-'+index+'"]');
        if (elementToGo) {
          name = 'detail-more-'+index;
          element = angular.element(elementToGo)[0];
        } else {
          // 2nd, check contents
          if (index === 0) {
            $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
            return;
          } else {
            index = index - 1;
            candidateElements = $element[0].querySelectorAll('[row-index="'+index+'"]');
            if (candidateElements.length > 0) {
              upFocus = findFocusUpItem(candidateElements);
              name = upFocus[0];
              element = upFocus[1];
              break;
            }
          }
        }
        break;

      case keyHandler.RIGHT:
        name = (column + 1) + '-' + index;
        element = angular.element(document.getElementById(name))[0];
        if (element === undefined) {
          goToScroll(keyCode);
          return;
        }

        // check if right element is in the same row.
        currElement = focusElement;
        elementToGo = element;
        currElement_top = currElement.getBoundingClientRect().top;
        elementToGo_top = elementToGo.getBoundingClientRect().top;
        if (currElement_top !== elementToGo_top) {
          goToScroll(keyCode);
          return;
        }
        break;
      case keyHandler.DOWN:
        // searchMore page
        if ($scope.scopeName === 'searchMore') {
          // option button
          if (index+'' === 'NaN') {
            if (focusElement.getAttribute('item') === 'option') {
              if ($scope.itemRowHasSpecialKeyword[0]) {
                name = ($scope.maxContents - 2) + '-' + 0;
              } else {
                name = ($scope.maxContents - 1) + '-' + 0;
              }
              element = angular.element(document.getElementById(name))[0];
              break;
            }
          } else {
            // contents
            currElement = focusElement.getAttribute('item');
            arr = currElement.split('-');
            column = parseInt(arr[0]) + parseInt($scope.maxContents);
            if ($scope.itemRowHasSpecialKeyword[0] && parseInt(arr[0]) === 0) {
              name = ($scope.maxContents-1) + '-' + 0;
              element = angular.element(document.getElementById(name))[0];
              break;
            }
            var contents = $element[0].querySelectorAll('[row-index="0"]');
            if (column < contents.length) {
              name = (column) + '-' + 0;
              element = angular.element(document.getElementById(name))[0];
            } else {
              name = 'detail-more-1';
              element = $element[0].querySelector('[item="detail-more-1"]');
            }
          }
          break;
        }

        // searchResult page
        var downFocus;
        // detail-more-button
        if (index+'' === 'NaN' || index === undefined || index === null || index === '') {
          index = parseInt(focusElement.getAttribute('item').split('-')[2]);
          // 1st, check contents
          candidateElements = $element[0].querySelectorAll('[row-index="'+index+'"]');
          if (candidateElements.length > 0) {
            downFocus = findFocusDownItem(candidateElements);
            name = downFocus[0];
            element = downFocus[1];
            break;
          }
          // 2nd, check detail-more-button
          index = index + 1;
          elementToGo = $element[0].querySelector('[item="detail-more-'+index+'"]');
          if (elementToGo) {
            name = 'detail-more-'+index;
            element = angular.element(elementToGo)[0];
          }
          break;
        }

        // contents
        // 1st, check detail-more-button
        index = index + 1;
        elementToGo = $element[0].querySelector('[item="detail-more-'+index+'"]');
        if (elementToGo) {
          name = 'detail-more-'+index;
          element = angular.element(elementToGo)[0];
        } else {
          // 2nd, check contents
          candidateElements = $element[0].querySelectorAll('[row-index="'+index+'"]');
          if (candidateElements.length > 0) {
            downFocus = findFocusDownItem(candidateElements);
            name = downFocus[0];
            element = downFocus[1];
            break;
          }
        }
        break;
    }

    if (name && element) {
      $scope.setFocusItem(name, element);
      if (focusElement.getBoundingClientRect().top < 300) {
        hidden = true;
        scrollY = - focusElement.offsetTop;
      } else if (focusElement.getBoundingClientRect().bottom > screen.height-300) {
        hidden = true;
        scrollY = - focusElement.offsetTop;
      }
      if (hidden) {
        scrollByKey = true;
        scroll.scrollTo(0, scrollY, 300, false);
      }
    }
  };

  var moveFocusFromBack = function(keyCode) {
    switch (keyCode) {
      case keyHandler.UP:
        $rootScope.$broadcast('focus', 'drawer', keyCode, {x: 0, y: 0, width: 0, height: 0});
        break;
      case keyHandler.LEFT:
        $scope.executeAction();
        break;
      case keyHandler.RIGHT:
        $scope.focusFromScroll('prev', true);
        break;
    }
  };

  $scope.focusFromScroll = function(target, back) {
    var element, hidden, scrollY;

    if (target == 'header') {
      $rootScope.$broadcast('focus', 'drawer', null, {x: 0, y: 0, width: 0, height: 0});
      return;
    }

    if (back && lastItemFocus.item) {
      element = lastItemFocus.element;
      //back에서 이전 포커스된 아이템으로 돌아올 경우 스크롤 영역 밖의 아이템에 대한 포커스 기준을 변환한다.
      if ((element.offsetTop + element.offsetHeight) > (scroll.wrapperH - scroll.y)) {
        target = 'next';
      }
    } else {
      $scope.setDefaultFocus();
      return;
    }

    if (target == 'prev') {
      scrollY = element.offsetTop;
      if(scrollY < -scroll.y) {
        hidden = true;
        scrollY = -scrollY;
      }
    } else {
      scrollY = element.offsetTop + element.offsetHeight;
      if (scrollY > (scroll.wrapperH - scroll.y)) {
        hidden = true;
        scrollY = scroll.wrapperH - scrollY;
      }
    }

    if (element) {
      $scope.setFocusItem(element.getAttribute('item'), element);
      if (hidden) {
        scrollByKey = true;
        scroll.scrollTo(0, scrollY, 300, false);
      }
    }
  };

  var focusHandler = function(e, target, keyCode, rect) {
    if (target !== 'main') return;
    e.preventDefault();

    var element = $element[0].getElementsByClassName('blank panel-back')[0];
    $scope.setFocusItem('back', element);
  };

  var requestOptionData = function() {
    var params = {};

    if (!device.isLocalJSON) {
      // local IP, Server용
      params = {
        api : '/rest/sdp/v6.0/search/condition',
        method : 'post',
        payload : {
          version : 'v1',
          service : 'lgstore'
        }
      };

      try {
        server.requestApi(eventKey.SEARCH_OPTION, params, $scope.$id);
      } catch (e) {}

    } else {
      // local file용
      params = {
        version : 'v1',
        service : 'lgstore'
      };

      try {
        server.requestSearchOption(params);
      } catch (e) {}

    }
  };

  var drawOption = function(e, response) {
    // option setting
    console.log(response);

    var advancedflag = {
      sortbyflag: false
      , pricecodeflag: false
      , genrecodeflag: false
    };
    if ($scope.$id != response.scopeId) {
      return;
    }

    arrDomains = [];
    angular.forEach(response.response.results, function(value, index) {
      arrDomains.push(value.code);
      if(value.code == $scope.category){
        if(value.sortby != null){
          //advancedflag.sortbyflag = true;
          var sortOption = {};
          sortOption.key = 'FILTER_ORDER';
          sortOption.values = value.sortby;
          if(sortOption.values[0]){
            sortOption.values[0].selected = "TRUE";
          }
          $scope.filterOptionData.push(sortOption);
        }
        if(value.filterby != null){
          for (var i=0; i<value.filterby.length; i++) {
            if(value.filterby[i].price_code){
              //advancedflag.pricecodeflag = true;
              var priceOption = {};
              priceOption.key = 'FILTER_FILTER';
              priceOption.values = value.filterby[i].price_code;
              if(priceOption.values[0]){
                priceOption.values[0].selected = "TRUE";
              }
              $scope.filterOptionData.push(priceOption);
            }else if(value.filterby[i].genre_code){
              //advancedflag.genrecodeflag = true;
              var genreOption = {};
              genreOption.key = 'FILTER_CATEGORY';
              genreOption.values = value.filterby[i].genre_code;
              if(genreOption.values[0]){
                genreOption.values[0].selected = "TRUE";
              }
              $scope.filterOptionData.push(genreOption);
            }
          }
        }
      }
    });
    if($scope.filterOptionData.length != 0 && $scope.category){ //sort filter data 존재하고 more시 버튼 보여줌
      $scope.sort = true;
      $scope.setMouseEvent($element[0].querySelector('[item="option"]'));
    }else{
      $scope.sort = false;
    }

    //console.log('searchResult - drawOption');
    util.async(requestData);
  };

  var setDefaultOption = function(category) {
    if (category === 'app') {
      sortCode = 'S_0002_00000';
      priceCode = 'F_0000_00000';
      genreCode = 'F_0006_00000';

    } else if (category === '3d') {
      sortCode = 'S_0003_00000';
      priceCode = 'F_0000_00000';

    } else if (category === 'tvshow' || category === 'movie') {
      sortCode = 'S_0003_00000';
    }
  };

  var getSearchTitle = function(category) {
    var searchSectionTitleArray = null;
    var mainMenu = JSON.parse(storage.getMenuList());

    if (category === "tvshow") category = "tvshows";
    else if (category === "movie") category = "movies";
    else if (category === "app") category = "appsngames";

    if (category === "youtube") {
      searchSectionTitleArray = msgLang.sdp_search_005;
      return searchSectionTitleArray;

    } else {
      for (var i=0; i<mainMenu.length; i++) {
        if (mainMenu[i].serviceCode === category){
          searchSectionTitleArray = mainMenu[i].menuText;
        }
      }

      // 메인 카테고리 메뉴 없는 경우
      if(searchSectionTitleArray == null){
        if(category === "tvshows")
          searchSectionTitleArray = msgLang.tvShow_title;
        else if(category == "movies")
          searchSectionTitleArray = msgLang.movie_title;
      }
      return searchSectionTitleArray;
    }
  };

  // not used currently
  var findFocusLeftItem = function() {
    var retVal = new Array(2);
    var min_dist = -1;
    var cur_item = null;
    var cur_obj = null;
    var _curFocusItem, _curRect, focus_left, midheight, focus_midheight, focus_top, focus_height;
    _curFocusItem = focusElement;
    _curRect = _curFocusItem.getBoundingClientRect();
    focus_left = _curRect.left;
    midheight = (_curRect.bottom - _curRect.top) / 2;
    focus_midheight = _curRect.top + midheight;
    focus_top = _curRect.top;
    focus_height = _curRect.bottom - _curRect.top;

    var _focusElements = $element[0].querySelectorAll('[item]');
    for (i = 0; i < _focusElements.length; i++) {
      var thisRect = _focusElements[i].getBoundingClientRect();
      var gap_left = focus_left - (thisRect.left + (thisRect.right - thisRect.left));

      if(gap_left >= 0){
        var gap_top = focus_midheight - (thisRect.top + (thisRect.bottom - thisRect.top)/2);

        var cur_dist = gap_left * gap_left + gap_top * gap_top;
        if ((min_dist < 0 || cur_dist < min_dist) &&
          ( (focus_top > thisRect.top  && focus_top < thisRect.top+(thisRect.bottom - thisRect.top))
            ||(focus_top == thisRect.top)
            ||(focus_top < thisRect.top  && focus_top+focus_height > thisRect.top)
            )
          ){
          min_dist = cur_dist;
          cur_obj = _focusElements[i];
          cur_item = _focusElements[i].getAttribute('item');
        }

        if (cur_obj === null || cur_obj === undefined) {
          cur_obj = $element[0].getElementsByClassName('blank panel-back')[0];
          cur_item = cur_obj.getAttribute('item');
        }

      }
    }

    retVal[0] = cur_item;
    retVal[1] = cur_obj;

    return retVal;
  };

  // not used currently
  var findFocusRightItem = function() {
  };

  var findFocusUpItem = function(candidateElements) {
    var retVal = new Array(2);
    var min_dist = -1;
    var cur_item = null;
    var cur_obj = null;
    var _curFocusItem, _curRect, focus_left, midwidth, focus_midheight, focus_top;
    var gap_left_before = 999;
    _curFocusItem = focusElement;
    _curRect = _curFocusItem.getBoundingClientRect();
    midwidth = (_curRect.right - _curRect.left) / 2;
    focus_left = _curRect.left + midwidth;

    var _focusElements = candidateElements;
    for (i = 0; i < _focusElements.length; i++) {
      var thisRect = _focusElements[i].getBoundingClientRect();
      var gap_left = focus_left - (thisRect.left + (thisRect.right - thisRect.left) / 2);

      if (Math.abs(gap_left) < Math.abs(gap_left_before)) {
        cur_obj = _focusElements[i];
        cur_item = _focusElements[i].getAttribute('item');
      }
      gap_left_before = gap_left;

    }

    retVal[0] = cur_item;
    retVal[1] = cur_obj;

    return retVal;
  };

  var findFocusDownItem = function(candidateElements) {
    return findFocusUpItem(candidateElements);
  };

  var testTier2ExecList = function() {
    var exec_list = {
      execs : [
        {
          "item_id": "com.lge.meta.crawler.pooq.PooqCrawler|K02_T2000-0065",
          "cp_conts_name": "개그 콘서트",
          "exec_type": "APP",
          "exec_app_id": "pooq",
          "exec_app_name": "pooq",
          "exec_id": "K02_T2000-0065",
          "plex_flag": "FALSE",
          "price_disp": "",
          "img_url_cp": "http://qt2-ngfts.lge.com/fts/gftsDownload.lge?biz_code=META_IMG&func_code=CPLOGO&file_path=/appstore/app/icon/20141028/10736729836784463pooq_130x130_130x130_webos.png",
          "add_info_disp": "정액제",
          "premium_app_flag": "TRUE"
        },
        {
          "item_id": "com.lge.meta.crawler.cine21premium.Cine21PremiumCrawler|K02_T2000-0065",
          "cp_conts_name": "[HD] 론 서바이버",
          "exec_type": "APP",
          "exec_app_id": "cine21",
          "exec_app_name": "즐감",
          "exec_id": "K02_T2000-0065",
          "plex_flag": "FALSE",
          "price_disp": "￦1,500",
          "img_url_cp": "http://qt2-ngfts.lge.com/fts/gftsDownload.lge?biz_code=META_IMG&func_code=CPLOGO&file_path=/appstore/app/icon/20150428/13133509968069316cine21_130x130_130x130_webos.png",
          "add_info_disp": "HD",
          "premium_app_flag": "TRUE"
        }
      ]
    };

    return exec_list;
  };

  var destroyScope = function() {
    delete scroll;
    scrollBar = null;
    $element.remove();
    $scope.$destroy();
  };

  $scope.initialize = function() {
    // Parameter 가져오기
    $scope.code = $element[0].getAttribute('code');
    $scope.category = $element[0].getAttribute('category');
    $scope.keyword = $element[0].getAttribute('keyword');
    $scope.itemId = $element[0].getAttribute('item');
    $scope.scopeName = $scope.category ? 'searchMore' : 'searchResult';
    // 같은 scope으로 화면전환이 일어날 경우 이전에 생성된 scope 정보를 저장한다.
    for(var childScope = $scope.$parent.$$childHead; childScope; childScope = childScope.$$nextSibling) {
      if (childScope.scopeName == $scope.scopeName && childScope.$id < $scope.$id) {
        $scope.toBeDelScope = childScope.itemId;
        childScope.toBeGoScope = $scope.itemId;
      }
    }

    // default Option 세팅
    setDefaultOption($scope.category);

    $scope.$on(eventKey.SEARCH_OPTION, drawOption);
    $scope.$on(eventKey.SEARCH_RESULT, drawSearchResult);
    $scope.$on('hiding', hideSearchList);
    $scope.$on('focus', focusHandler);
    $scope.$on(eventKey.RECOVER_FOCUS, $scope.recoverFocus);

    util.async(requestOptionData);
  };

  $scope.initialize();
});
