discoveryService.service('pageManager', function(device, $rootScope, eventKey, pmLog, util) {
  var preTemplates = {
    'featured': '<div main>',
    'mainTier1': '<div main-tier1>',
    'mainTier2': '<div main-tier2>',
    'mainTier3': '<div main-tier3>',
    'list': '<div list item="',
    'premiumList': '<div premium-list item="',
    'list3d': '<div list3d item="',
    'listApp': '<div app-list item="',
    'premiumDetail': '<div premium-detail item="',
    'detailApp': '<div app-detail item="',
    'actor' : '<div actor item="',
    'detail3d': '<div detail3d item="',
    'detailList': '<div list-detail item="',
    'search' : '<div search></div>',
    'searchResult': '<div search-result item="',
    'searchMore':  '<div search-result item="',
    'myPage': '<div my-page item="',
    'detailTheme': '<div theme-detail item="'
  };
  var postTemplates = {
    'featured': '</div>',
    'mainTier1': '</div>',
    'mainTier2': '</div>',
    'mainTier3': '</div>',
    'list': '"></div>',
    'premiumList': '"></div>',
    'list3d': '"></div>',
    'listApp': '"></div>',
    'premiumDetail': '"></div>',
    'detailApp': '"></div>',
    'actor': '"></div>',
    'detail3d': '"></div>',
    'detailList': '"></div>',
    'search' : '',
    'searchResult': '"></div>',
    'searchMore': '"></div>',
    'myPage': '"></div>',
    'detailTheme': '"></div>'
  };
  var history = [], preHistory = [];

  this.getTemplateFromParam = function(param) {
    var i, page = 'featured', module = '';
    var isSamePage = false;
    var peekObj, item;

    preHistory = [];
    angular.copy(history, preHistory);

    peekObj = this.peekHistory();

    if (param) {
      // 2015-12-01 : 같은 페이지는 history에 쌓지 않게 처리 (김나래 대리 요청사항)
      if (peekObj) {
        if (param.page === peekObj.page && param.module === peekObj.module) {
          isSamePage = true;
        }
      }

      if (param.page)
        page = param.page;
      if (param.module)
        module = param.module;
    }

    if (page !== 'featured' && history.length === 0) {
      history[0] = {
        param: {page: 'featured'},
        title: msgLang.title
      };
    }
    if (page == 'featured') {
      param = param || {};
      param.page = page;

      // check tier
      if (device.tierType === 1 || device.tierType === 1.5) {
        page = 'mainTier1';
      } else if (device.tierType === 2) {
        page = 'mainTier2';
      } else if (device.tierType === 3) {
        page = 'mainTier3';
      }
      history = [];
      history[0] = {param: param};
    } else if (page == 'detail3d') { // 3d 상세 파라미터
      var prodType, tvRating, tag;

      prodType = param.prodType;
      tvRating = param.tvRating;
      tag = param.tag;
      item = param.itemId;
      module = item + '" prod-type="' + prodType + '" tv-rating="' + tvRating + '" tag="' + tag;

      if (!isSamePage) {
        history.push({param: param});
      }
    } else if (page == 'searchMore') {
      var category, keyword, code;

      // TODO 연결 후 주석해제
      // TODO keyword 사용여부에 따라 merge
      code = param.code;
      keyword = param.keyword;
      category = param.category;
      item = param.module;
      module = item + '" code="' + code + '" keyword="' + keyword + '" category="' + category;

      // TODO sample data (메뉴연결 후 삭제)
      //module = '개그 콘서트" code="VDLD02" keyword="개그 콘서트" category="tvshow';

      if (!isSamePage) {
        history.push({param: param});
      }
    } else if (page === 'detailTheme') {
      // luna-send -n 1 luna://com.webos.applicationManager/launch '{"id":"com.webos.app.discovery","params":{"query": "category/THEME/아이템아이디", “head”: “Y”}}'
      // mycontents에서 테마 상세페이지로 deeplink시 head:'Y'로, default는 'N'
      if (param.head) {
        module +=  '" head="' + param.head;
      } else {
        module += '" head="N';
      }
      //[WOSLQEVENT-106445] LG Store 첫화면으로 복귀하지 않고, Launcher 출력됨
      //테마 상세로 갈때 history 기록하지 않아 back 이동이 안되었음
      if (!isSamePage) {
        history.push({param: param});
      }

    } else if (page === 'detailList') {
      // 2015-12-16 상세페이지 유입 경로 확인을 위해 구분자 요청 (이원우 책임)
      // 2016-01-15 일 스펙변경으로 아래 내용 사용하지 않습니다.
      // 로깅 시에 무조건 com.webos.app.discovery.로 들어감 (param.source에 상황에 따라 com.webos.app.discovery.featured로 세팅했었음)
      if (param.source) {
        module +=  '" source="' + param.source;
      } else {
        module += '" source="com.webos.app.discovery';
      }
      if (!isSamePage) {
        history.push({param: param});
      }
    } else {
      /*if (param) {
        for (i = 0; i < history.length; i++) {
          if (!history[i].param) {
            // "LG Content Store"
            continue;
          }
          if (Object.keys(history[i].param).length === Object.keys(param).length) {
            if (history[i].param.page === page && history[i].param.module === param.module) {
              history.splice(i, 1);
              break;
            }
          }
        }
      }*/

      if (!isSamePage) {
        history.push({param: param});
      }
    }

    isSamePage = null;
    peekObj = null;

    // search로부터 호출 되어 있는지 검사 (Object || etc object)
    if(param && param.from) {
      return preTemplates[page] + param.module + '" from="' + param.from + '" query="' + param.query + postTemplates[page];
    } else {
      return preTemplates[page] + module + postTemplates[page];
    }
  };

  this.popHistory = function(fromErr) {
    var obj, result;

    if(!fromErr) { // server.js에서 에러났을 경우 파라미터를 넘겨서 1번만 history popup
      // 현재 페이지
      history.pop();
    }
    // 과거 페이지
    obj = history.pop();

    result = {};
    if (!obj) {
      result.page = 'featured';
    } else {
      result = obj.param;
    }
    return result;
  };

  this.getHistory = function(n){
    return history[n];
  };

  this.getHistoryCount = function(key, value) {
    return history.length;
  };

  this.setParam = function(key, value) {
    if (history.length < 1)
      return;

    var obj = history[history.length - 1];
    obj.param = obj.param || {};

    if (value) {
      obj.param[key] = value;
    } else {
      delete obj.param[key];
    }
  };

  this.getParam = function(key) {
    if (history.length < 1)
      return;

    var obj = history[history.length - 1];
    return obj.param ? obj.param[key] : undefined;
  };

  this.peekHistory = function() {
    if (history.length < 1)
      return;
    return history[history.length - 1].param;
  };

  this.chgHistory = function(param) {
    var startIndex = history.length - 1;
    // history 역순으로 조회하여 해당 되는 가장 최근 메뉴의 서브메뉴를 수정함.
    for (var i = startIndex; i >= 0; i--) {
      if (history[i].param.page === param.page) {
        history[i].param.module = param.module;
        history[i].param.category = param.category;
        history[i].param.genre = param.genre;
        break;
      }
    }
  };

  this.setTitle = function(title) {
    if (history.length > 0) {
      history[history.length - 1].title = title;
    }
  };

  this.getTitle = function(target) {
    var index = history.length - 1;
    if (target == 'back') index--;
    if (index < 0) return '';
    return history[index].title;
  };

  this.getLink = function(target) {
    var index = history.length - 1;
    if (target == 'back') index--;
    if (index < 0) return '';
    return history[index].param ? history[index].param.inLink : '';
  };

  this.getCategory = function(target) {
    var index = history.length - 1;
    if (target == 'back') index--;
    if (index < 0) return '';
    return history[index].param ? history[index].param.category : '';
  };

  this.getGenre = function(target) {
    var index = history.length - 1;
    if (target == 'back') index--;
    if (index < 0) return '';
    return history[index].param ? history[index].param.genre : '';
  };

  this.initHistory = function() {
    var l;

    l = parseInt(history.length, 10);
    if (l > 2) {
      history.splice(1, (l-2));
    }
  };

  this.clearHistory = function() {
    history = [];
  };

  /**
   * @param {string} errorCode : 에러코드
   * @param {object} scope : 에러가 발생한 scope
   * @param {object} element : 에러가 발생한 element
   * @description 페이지 전환시에 에러가 발생하였을 경우 에러 팝업창을 띄우며, 에러가 발생한 element, scope을 삭제한다.
   * */
  this.movePageError = function(errorCode, scope, element) {
    var eCode, errorArray, errorParam;

    pmLog.write(pmLog.LOGKEY.PAGEMANAGER_LOG, {
      msg : 'movePageError, errorCode=' + errorCode +
              ', scopeName=' + (scope ? scope.scopeName : 'undefined')
    });

    $rootScope.breadcrumb.setRunning(false);

    if (errorCode) {
      errorArray = errorCode.split('.');
      if (errorArray.length > 1) {
        eCode = errorArray[1];
      } else {
        eCode = errorArray[0];
      }
    }
    setTimeout(function() { // scope destroy 시 garbage time delay로 인해 delay처리함.
      if (element){
        element.remove(); // 에러가 발생한 scope의 element를 삭제한다.
      }
      if (scope){
        scope.$destroy(); // 에러가 발생한 scope을 삭제한다.
      }
    }, 500);

    history.pop(); // history에서 에러가 발생한 데이타를 삭제한다.
    // device정보를 원복한다.
    if (history.length > 0 ) {
      device.param = history[(history.length - 1)].param;
    }

    console.log('movePageError : ', eCode);
    errorParam = {
        type: 'popup',
        popupTitle: msgLang.alert_adult_3_3,
        popupDesc: msgLang.alert_error_4_1,
        popupBut1: msgLang.ok,
        popupButAct1 : 'closeAppPopup'
    };
    if(util.isAWSServer() && device.param.page === 'myPage' && errorCode.indexOf('Apps3Depth') !== -1) {
      // 서비스 중지된 Stub App 클릭시 서비스 에러 팝업 출력 (2016.03.16)
      if (eCode === '001') {
        errorParam = {
          type: 'popup',
          popupTitle: msgLang.alert_adult_3_3,
          popupDesc: msgLang.mypage_apps_myapps_popup_desc || 'Service of this app has been discontinued.',
          popupBut1: msgLang.ok,
          popupButAct1: 'closeAppPopup'
        };
      }
    }
    //[WOSLQEVENT-112283] 미지원 앱 팝업에서 OK 버튼 선택시, LG Store화면 검정 화면이고 일반리모콘으로 x 버튼 선택 불가
    // UX팀 가이드 받아서 메인페이지 에러 뜨게 수정
    if(util.isAWSServer() && device.firstRun && device.isDeepLink && device.previousPage ==='' &&errorCode.indexOf('Apps3Depth') !== -1) {
      var data ='';
      device.firstRun = false;
      $rootScope.isMainError(data);
    }else{
      $rootScope.$broadcast(eventKey.PAGE_MOVE_ERROR, errorParam);
    }
  };

  /**
   * @description 마지막으로 생성한 페이지 단위의 scope의 Item 정보를 반환한다.
   * */
  this.findLastScopeId = function() {
    var lastScopeElement;

    lastScopeElement = angular.element(document.getElementsByClassName('page'));
    if (lastScopeElement[(lastScopeElement.length - 1)]) {
      return lastScopeElement[(lastScopeElement.length - 1)].getAttribute('item');
    }
  };

  /**
   * @description Back키 이동 시 에러 났을 경우 history 복구
   */
  this.setPreHistory = function() {
    history = [];
    angular.copy(preHistory, history);
  };
});
