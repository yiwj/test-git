discoveryService.service('storage', function($rootScope, device, util, server, eventKey) {

  var _key = {
    additionalDataAllowed : device.additionalDataAllowed,
    maxRecentCountSystem : 20,
    tvRatio : { "21:9": 10 , "16:9": 6 },
    isGuideOpened : 'IS_GUIDE_OPENED',
    appsDefaultUsb : 'APPS_DEFAULT_USB',
    threedWatchLogs : '3D_WATCH_LOGS',
    recentSearchKeyword : 'RECENT_SEARCH_KEYWORD',
    recentSearchResult : 'RECENT_SEARCH_RESULT',
    menuList : 'MENU_LIST',
    noticeId : 'NOTICE_ID',
    language : 'LANGUAGE'
  };

  // TODO 15년향 key 대응 : GLOBAL_CONSTANT.LOCAL_STORAGE.MYPAGE_RECENTxxx
  this.MYPAGE = {
    RECENTHISTORY3D : 'RecentHistory_3D',
    RECENTHISTORYAPPNGAME : 'RecentHistory_APPNGAME',
    RECENTHISTORYPREMIUM : 'RecentHistory_PREMIUM'
  };

  /**
   * @description TV 비율을 통해서 컨텐츠 갯수 반환
   * @returns {*}
   */
  this.getResolutionRatioCnt = function(){
    return _key.tvRatio[device.resolutionRatio];
  };

  /**
   * localstorage setter/getter
   * @param value
   */
  this.setLanguage = function(value) {
    _setData(_key.language, value);
  };

  this.getLanguage = function() {
    return _getData(_key.language);
  };

  this.setAppsDefaultUsb = function (value) {
    _setData(_key.appsDefaultUsb, value);
  };

  this.getAppsDefaultUsb = function() {
    return _getData(_key.appsDefaultUsb);
  };

  this.set3dWatchLogs = function(value) {
    _setData(_key.threedWatchLogs, value);
  };

  this.get3dWatchLogs = function() {
    return _getData(_key.threedWatchLogs);
  };

  this.getRecentSearchKeyword = function() {
    return _getData(_key.recentSearchKeyword);
  };

  this.getRecentSearchResult = function() {
    return _getData(_key.recentSearchResult);
  };

  var _setNoticeId = function(value) {
    var notice = _getNoticeId();

    if (notice) {
      value = value + ',' + notice;
    }
    _setData(_key.noticeId, value);
  };

  var _getNoticeId = function() {
    return _getData(_key.noticeId);
  };

  this.isNoticeRead = function(value) {
    var noticeId = _getNoticeId();
    value = util.md5(value);
    if (noticeId && noticeId.indexOf(value) !== -1) {
      return true;
    } else {
      _setNoticeId(value);
      return false;
    }
  };

  /**
   * @description 가이드 페이지 노출 Flag
   * @returns {*}
   * @used main.js, featuredBody.js
   */
  this.getGuideOpenedFlag = function() {
    return _getData(_key.isGuideOpened);
  };

  /**
   * @description 최초 진입시 가이드 페이지 노출(최초 진입 유무)
   * @param flag
   */
  this.setGuideOpenedFlag = function(flag) {
    _setData(_key.isGuideOpened, flag);
  };

  /**
   * @description Menu List 스토리지에서 삭제
   */
  this.removeMenuList = function() {
    _removeData(_key.menuList);
  };

  /**
   * @description Menu 리스트 로컬스토리지에서 저장
   * @param data
   */
  this.setMenuList = function(data){
    _setData(_key.menuList, JSON.stringify(data));
  };

  /**
   * @description munu 리스트 지우기
   * @returns {*}
   */
  this.getMenuList = function(){
    return _getData(_key.menuList);
  };

  /**
   * @description localStorage에 데이터 저장 (3d, appngame, premium 대상)
   * @param param
   * @private
   * @used apps3Depth, packageApp, threeD3Depth
   */
  this.addRecentData = function(param) {
    // 시청정보동의 약관 미동의 인 경우 recent history를 남기지 않음
    if(device.additionalDataAllowed == undefined) return;

    var itemId = param.itemId;
    var currentTime = (new Date).getTime();
    var storedIndex;

    if (param.ageType == null  || param.ageType == undefined || param.ageType == '') {
      ageType = '0';
    }

    var d = new Date();
    var yy = d.getFullYear();
    var mm = util.getZeroString((d.getMonth()+1), 2);
    var dd = util.getZeroString(d.getDate(), 2);
    var hh = util.getZeroString(d.getHours(), 2);
    var mi = util.getZeroString(d.getMinutes(), 2);
    var itemLastUseDate = yy + mm+ dd + hh + mi;

    var newStoreData = {
      itemId : param.itemId,
      itemName : param.itemName,
      itemImg : param.itemImg,
      viewTime : currentTime,
      item_last_use_date : itemLastUseDate,
      ageType : param.ageType,
      iconColor : param.iconColor,
      categoryName : param.categoryName,
      itemPrice : 0
    };

    var storedData = _getData(param.serviceType);
    var recentItems = null;

    if (!storedData) {
      // 기존 storage data가 없어 NEW 생성
      recentItems = [newStoreData];

    } else {
      recentItems = JSON.parse(storedData);

      // 최근 목록에 동일 Item이 존재하는 경우
      storedIndex = _seekItemInArray(itemId, recentItems);
      if (storedIndex !== -1) {

        // 기존 data 삭제 후, 새로 추가(시간순 정렬을 유지하기 위함)
        recentItems.splice(storedIndex, 1);
        recentItems.push(newStoreData);

      } else {
        // 동일한 item id가 존재하지 않는 경우 item id 추가
        recentItems.push(newStoreData);

        // 최근 목록에 대한 저장 갯수가 초과된 경우
        if (recentItems.length > _key.maxRecentCountSystem) {
          recentItems = _deleteOldItem(recentItems);
        }
      }
    }
    _setData(param.serviceType, JSON.stringify(recentItems));
  };

  /**
   * @description Storage에서 지정된 Item ID를 가지는 최근 조회 목록 삭제 후 저장
   * @param serviceType(MYPAGE = {})
   * @param itemId
   * @used : myPage1Depth, myPage2Depth
   */
  this.removeRecentData = function(serviceType, itemId) {
    var recentItems, deleteIndex;

    recentItems = JSON.parse(_getData(serviceType));
    deleteIndex = _seekItemInArray(itemId, recentItems);

    if (deleteIndex !== -1) {
      recentItems.splice(deleteIndex, 1);
    }
    _setData(serviceType, JSON.stringify(recentItems));
  };

  /**
   * @description 카테고리별 최근 정보 조회
   * @param serviceType
   * @returns {*}
   * @used myPage1Depth, myPage2Depth
   */
  this.readRecentData = function(serviceType) {
    var recentItemList, storedData;
    var deleteItemIdArray = [];
    var position = 0;
    var returnRecentList = {};
    var currentItemIndex;

    storedData = _getData(serviceType);

    if (!storedData || storedData == "[]") {
      return undefined;
    } else {
      recentItemList = JSON.parse(storedData);

      angular.forEach(recentItemList, function(value, index){
        if (!value.hasOwnProperty('ageType')) {
          deleteItemIdArray[position++] = value.itemId;
        }
      });

      angular.forEach(deleteItemIdArray, function(value, index){
        removeRecentData(serviceType, deleteItemIdArray[index]);
      });

      if (position > 0) {
        recentItemList = JSON.parse(_getData(serviceType));
      }

      currentItemIndex = recentItemList.length - 1;
      angular.forEach(recentItemList, function(value, index){
        returnRecentList[currentItemIndex--] = value;
      });
      return returnRecentList;
    }
  };

  /**
   * @description 최근 검색어 저장 (검색어 클릭 시 해당 index삭제 후 위로 올림)
   * @param value
   * @used search.js
   */
  this.addRecentKeyword = function(value) {
    var arrRecentKeyword, storedData;
    var isExist = false, position = 0;
    var newKeyword = {query : value};

    storedData = _getData(_key.recentSearchKeyword);

    if (!storedData) {
      arrRecentKeyword = [newKeyword];
    } else {
      arrRecentKeyword = JSON.parse(storedData);
      angular.forEach(arrRecentKeyword, function(value, index){
        if (value.query === newKeyword.query) {
          isExist = true;
          position = index;
        }
      });

      if (isExist) arrRecentKeyword.splice(position, 1);
      if (arrRecentKeyword.length == 5) arrRecentKeyword.shift();

      arrRecentKeyword.push(newKeyword);
    }
    _setData(_key.recentSearchKeyword, JSON.stringify(arrRecentKeyword));
  };

  /**
   * @description 최근 검색어를 삭제
   * @param arrQuery
   * @returns {boolean}
   * @used search.js
   */
  this.removeRecentKeyword = function(arrQuery) {
    var storedData;
    var resultData = [];
    var flag = true;

    storedData = JSON.parse(_getData(_key.recentSearchKeyword));
    if (!storedData) return true;

    angular.forEach(storedData, function(storedValue, storedIndex){
      flag = true;
      angular.forEach(arrQuery, function(value, index){
        if (storedValue.query === value) {
          flag = false;
        }
      });
      if (flag) resultData.push(storedValue);
    });
    _setData(_key.recentSearchKeyword, JSON.stringify(resultData));
  };

  /**
   * @description 검색결과 컨텐츠 Detail 페이지 이동후 Local Storage에 정보 저장
   * @param storeItem
   * @returns {boolean}
   * @used apps3Depth.js, movie3Depth.js, packageApps.js, search2Depth.js, threeD3Depth.js, tvshow3Depth.js
   */
  this.addRecentResult = function(storeItem) {
    var addFlag = true, findLength = 0;
    var recentResultItem, storedData;

    if (!storeItem) return false;

    storedData = _getData(_key.recentSearchResult);

    if (!storedData) {
      recentResultItem = [storeItem];
    } else {
      recentResultItem = JSON.parse(storedData);

      // 중복체크
      angular.forEach(recentResultItem, function(value, index){
        if (value.item_id === storeItem.item_id) addFlag = false;
      });

      // 21:9와 16:9 최근검색결과 갯수 수정(WEBOSLCD13-84811 이슈)
      findLength = this.getResolutionRatioCnt();

      if (recentResultItem.length == findLength) { // 16:9 - 6개 | 21:9 - 10개
        recentResultItem.shift();
      }
      recentResultItem.push(storeItem);
    }
    if(addFlag) {
      _setData(_key.recentSearchResult, JSON.stringify(recentResultItem));
    }
  };

  /**
   * @description 최근 검색 결과 스토리지에서 삭제
   * @param objInfo
   * @returns {boolean}
   * @used search.js
   */
  this.removeRecentResult = function(objInfo) {
    var storedData;
    var resultData = [];
    var flag = true;

    storedData = JSON.parse(_getData(_key.recentSearchResult));

    if(!storedData) return true;

    angular.forEach(storedData, function(storedValue,storedIndex){
      flag = true;

      angular.forEach(objInfo, function(value, index){
        if(storedValue.item_id === value) flag = false;
      });

      if(flag) resultData.push(storedValue);
    });
    _setData(_key.recentSearchResult, JSON.stringify(resultData));
  };

  /**
   * @description tier1,2에서 guide호출
   */
  this.guideProcess = function(scope, onCloseCallback) {
    // console.log('localStorage.guideProcess begin, scope=' + scope);
    if (!$rootScope.popupMain.isPopup && $rootScope.popupApp.hide) {
      if (!device.isDeepLink) { // 최초 deeplink가 아닐때 만 팝업
        if (!util.parseBoolean(this.getGuideOpenedFlag())) {
          try {
//            this.deleteRecentAll();
            this.setGuideOpenedFlag(true);
          } catch(e) {
            console.error('storage.guideProcess try~catch error');
          }
          $rootScope.guide.showViewGuide(scope, onCloseCallback);
        }
      }
    }
  };

  /**
   * @description MY Page의 최근기록 삭제(TV 시청정보 약관 미동의시)
   * @used deviceController.js, featuredBody.js, myPage1Depth.js, featuredBody.jsp
   */
  this.deleteRecentAll = function() {
    _removeData(this.MYPAGE.RECENTHISTORYAPPNGAME);
    _removeData(this.MYPAGE.RECENTHISTORY3D);
    _removeData(this.MYPAGE.RECENTHISTORYPREMIUM);

    // WOSLQEVENT-103477 최초 진입 시 user_delete_all 호출 안함
    /*try {
      this.deleteAllSvrRecentHistory();
    } catch(e) {
      console.error('storage.deleteRecentAll  try~catch error');
    }*/
    console.debug('remove Mypage recent history');
  };

  /**
   * @description 검색결과로부터 진입했는지 여부
   * @param elem element객체
   * @returns {boolean}
   */
  this.isFromSearch = function(elem) {
    if (elem.attr('from'))
      return elem.attr('from').toLowerCase() === 'search' ? true : false;
    else
      return false;
  };

  /**
   * @description 서버로 부터 내려오는 코드값이 있으면 서버의 menuText값을 헤더로 세팅하고
   *                    없으면 i18n (msgLang변수의 값을 세팅)
   * @param category
   * @returns {*}
   */
  this.getHeadTitle = function(category) {
    var code = category.toLowerCase();
    var data = JSON.parse(this.getMenuList());
    var title = '';

    for (var i=0; i<data.length; i++) {
      if (data[i].serviceCode === code) {
        title = data[i].menuText;
        break;
      }
    }

    if (title) return title;
    else if (code === 'tvshows') return msgLang.tvShow_title;
    else if (code === 'appsngames') return msgLang.apps_title;
    else if (code === 'movies') return msgLang.movie_title;
    else if (code === 'premium') return msgLang.premium;
  };

  /**
   * @description 로컬 스토리지에 저장 (localstorage.setItem wrapper)
   * @param key
   * @param value
   * @private
   */
  var _setData = function(key, value) {
    localStorage.setItem(key, value);
  };

  /**
   * @description 저장된 값 불러오기 (localstorage.getItem wrapper)
   * @param key
   * @returns {*}
   * @private
   */
  var _getData = function(key) {
    return localStorage.getItem(key);
  };

  /**
   * @description 로컬스토리지 key값 삭제 (localstorage.removeItem wrapper)
   * @param key
   */
  var _removeData = function (key) {
    localStorage.removeItem(key);
  };

  /**
   * 저장된 데이터에서 해당 item을 찾아 index를 반환 ('3D' || 'PREMIUM' || 'APPGAME')
   * @param itemId
   * @param recentItems
   * @returns {number|Number}
   * @private
   */
  var _seekItemInArray = function(itemId, recentItems) {
    var seekItem;

    angular.forEach(recentItems, function(value, index){
      if (value.itemId === itemId) {
        seekItem = value;
      }
    });
    return recentItems.indexOf(seekItem);
  };

  /**
   * @description 저장된 storage 객체에서 가장 오래전에 저장된 최근 조회 목록 삭제
   * @param recentItems
   * @returns {*}
   * @private
   */
  var _deleteOldItem = function(recentItems) {
    var deleteItem, position;
    var oldestViewTime = (new Date()).getTime();

    angular.forEach(recentItems, function(value, index){
      if (oldestViewTime > value.viewTime) {
        oldestViewTime = value.viewTime;
        deleteItem = value;
      }
    });
    position = recentItems.indexOf(deleteItem);
    recentItems.splice(position, 1);
    return recentItems;
  };

  /**
   * @description MY Page의 최근기록(Movie, Tv Show) 서버 삭제 (callback 처리 안함)
   */
  this.deleteAllSvrRecentHistory = function() {
    var reqParam = {
      api : '/discovery/resent/remove1',
      method : 'post',
      apiAppStoreVersion : 'v8.0'
    };
    try {
      if (!device.isLocalJSON) {
        // server data 용
        server.requestApi(eventKey.LOCALSTORAGE_MYPAGE_LOCALSTORAGE, reqParam);
      } else {
        // local json 용
        server.requestLocalStorage(reqParam);
      }
    } catch (e) {}
  };
});