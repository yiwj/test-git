/**
 * webOS3 0_whitelist_v0.5_20150826.xlsx (코드 설계 재 검증 기준)
 */
discoveryService.service('pmLog', function(device) {

  /**
   * @description
   * @type {{FEATURED: string, DRAWER_OPEN: string, DRAWER_MENU_CLICK: string, IMAGE_HEADER_IMPRESSION: string, IMAGE_HEADER_CLICK: string, MAIN_MENU_CLICK: string, RCMD_CONTENTS_CLICK: string, PROMOTION_CLICK: string, SECOND_MENU_CLICK: string, SECOND_CONTENTS_CLICK: string, OPTION_CHANGED: string, CONTENTS_WATCH_CLICK: string, APP_LAUNCH_CLICK: string, THIRD_SHELF_CLICK: string, THIRD_SHELF_MORE: string, SEARCH_REQ: string, SEARCH_CONTENT_CLICK: string, SEARCH_ALL_RESULT_CLICK: string, SEARCH_RESULT_OPTION_CHANGE: string, SEARCH_MORE: string, AD_CLICK: string}}
   */
  this.LOGKEY = {
    FEATURED : 'NL_FEATURED',
    DRAWER_OPEN : 'NL_DRAWER_OPEN',
    DRAWER_MENU_CLICK : 'NL_DRAWER_MENU_CLICK', // Req-03
    IMAGE_HEADER_IMPRESSION : 'NL_IMAGE_HEADER_IMPRESSION', // Req-04
    IMAGE_HEADER_NAVI_CLICK : 'NL_IMAGE_HEADER_NAVI_CLICK', // Req-05
    IMAGE_HEADER_MORE_CLICK : 'NL_IMAGE_HEADER_MORE_CLICK', // Req-06
    MAIN_MENU_CLICK : 'NL_MAIN_MENU_CLICK',
    CONTENTS_PLAY_CLICK : 'NL_CONTENTS_PLAY_CLICK', // Req-08
    CP_SELECT : 'NL_CP_SELECT', // Req-09
    DEFAULT_CP_SETTING_CLICK : 'NL_DEFAULT_CP_SETTING_CLICK', // Req-10
    CONTENTS_IMAGE_CLICK : 'NL_CONTENTS_IMAGE_CLICK',
    CONTENTS_CLICK : 'NL_CONTENTS_CLICK', // Req-11, Req-12, Req-15
    APPS_CLICK : 'NL_APPS_CLICK',
    PROMOTION_CLICK : 'NL_PROMOTION_CLICK', // Req-13
    SECOND_MENU_CLICK : 'NL_2ND_MENU_CLICK', // Req-14
    SECOND_CONTENTS_CLICK : 'NL_2ND_CONTENTS_CLICK',
    OPTION_CHANGED : 'NL_OPTION_CHANGED', // Req-11 (문서 중복 : 아래 11)
    SECOND_CONTENTS_PLAY_CLICK : 'NL_2ND_CONTENTS_PLAY_CLICK',
    SECOND_PLAY_CP_CLICK : 'NL_2ND_PLAY_CP_CLICK',
    CONTENTS_WATCH_CLICK : 'NL_CONTENTS_WATCH_CLICK',
    TRAILER_WATCH_CLICK : 'NL_TRAILER_WATCH_CLICK', // Req-16
    CONTENTS_WATCH_CP_CLICK : 'NL_CONTENTS_WATCH_CP_CLICK',
    THIRD_FAVORITE_CP : 'NL_3RD_FAVORITE_CP',
    APP_LAUNCH_CLICK : 'NL_APP_LAUNCH_CLICK', // Req-19
    THIRD_SHELF_CLICK : 'NL_3RD_SHELF_CLICK', // Req-20
    THIRD_SHELF_MORE : 'NL_3RD_SHELF_MORE', // Req-21
    SEARCH_ENTER : 'NL_SEARCH_ENTER',
    SEARCH_REQ : 'NL_SEARCH_REQ',
    SEARCH_CONTENT_CLICK : 'NL_SEARCH_CONTENT_CLICK',
    SEARCH_ALL_RESULT_CLICK : 'NL_SEARCH_ALL_RESULT_CLICK',
    SEARCH_RESULT_OPTION_CHANGE : 'NL_SEARCH_RESULT_OPTION_CHANGE',
    SEARCH_MORE : 'NL_SEARCH_MORE',
    AD_CLICK : 'NL_AD_CLICK', // Req-28
    MENU_CLICK : 'NL_MENU_CLICK', // Req-29
    SEARCH_AUTO_COMPLETE : 'NL_SEARCH_AUTO_COMPLETE',

    // Test Log : 추후 문제될 시 isWritable에 except에 추가
    // NL로 시작되는 로그는 검증이 되어야 합니다.
    // 테스트로 넣는 것은 NL_ 빼주세요~
    AD_LOG : 'ST_AD_RECEIVE', // 광고 테스트
    AD_LOG_MAIN : 'ST_AD_MAIN' ,
    USB_LOG : 'ST_USB_RECEIVE', //USB 테스트
    AD_LOAD_ERROR : 'ST_VIDEO_LOAD_ERROR', // depth2ad에서 error 로깅
    SCREENSAVER_LOG : 'ST_SCREENSAVER',
    PAGEMANAGER_LOG : 'ST_PAGEMANAGER',
    DETAILAPP_GETINSTALLGETCAPACITYRESULT : 'ST_GETINSTALLGETCAPACITYRESULT', //루나명령어로 들어오는 tv용량 결과값 확인
    LAUNCH_PARAM_LOG : 'ST_LAUNCH_PARAM',  // deepLink로 들어올 파라미터 출력
    NSU_LOG : 'ST_NSU_MEMBERSHIP_LAUNCH', // NSU 시 QSM일 때 멤버쉽 블랙화면 이슈 로깅
    POPUP_LOG : 'ST_POPUP', // showpopu시 관련없는 메세지 뜨는 현상 로깅
    ERROR_HANDLER : 'ST_ERROR_HANDLER',
    MAIN_ERROR : 'ST_MAIN_ERROR',
    KEY_HANDLER : 'ST_KEY_HANDLER',
    SERVER : 'ST_SERVER',
    SPACE_LOG : 'ST_SPACE',
    BREADCRUMB : 'ST_BREADCRUMB',
    STUB_APP : 'ST_STUB_APP',
    STUB_APP_BUTTON : 'ST_STUB_APP_BUTTON',
    FEATURED_LOG : 'ST_FEATURED',
    PANEL_NODE_CNT : 'ST_NODE_CNT',
    NSU_RESPONSE_LOG : 'ST_NSU_RESPONSE_LOG'
  };

  /**
   * @description pmLog기록 시 key 에 대한 value 값 상수 (menu명 || content type)
   * @type {{TVSHOWS: string, MOVIE: string, PREMIUM: string, APPGAME: string, YOUTUBE: string, MYPAGE: string, SEARCH: string, SEARCHRESULT: string, THEME: string, PERSON: string, PROMOTION: string}}
   */
  this.TYPE = {
    MAIN : 'Main',
    TVSHOWS : 'TVShows',
    MOVIE : 'Movie',
    PREMIUM : 'Premium',
    APPGAME : 'AppGame',
    YOUTUBE : 'Youtube',
    MYPAGE : 'MyPages',
    SEARCH : 'Search',
    SEARCHRESULT : 'SearchResult',
    THEME : 'Theme',
    THREED : '3D',
    PERSON : 'person',
    PROMOTION : 'promotion'
  };

  /**
   * @description 로그 write시 로깅하지 말아야 할 것을 소스단에서 하지 않고 이 메소드에서 filtering합니다.
   * @param key
   * @returns {boolean}
   */
  this.isWritable = function(key) {
    // 이미 코딩되어 있는 각 페이지내에서 처리하지 않고
    // 로그기록을 하지 않는 것은 아래 배열에다 넣을 것
    var except = [
      this.LOGKEY.DRAWER_OPEN,
      this.LOGKEY.FEATURED,
      this.LOGKEY.DRAWER_OPEN,
      this.LOGKEY.MAIN_MENU_CLICK,
      this.LOGKEY.SECOND_CONTENTS_PLAY_CLICK,
      this.LOGKEY.SECOND_PLAY_CP_CLICK,
      this.LOGKEY.CONTENTS_WATCH_CLICK,
      this.LOGKEY.CONTENTS_WATCH_CP_CLICK,
      this.LOGKEY.THIRD_FAVORITE_CP,
      this.LOGKEY.SEARCH_ENTER,
      this.LOGKEY.SEARCH_REQ,
      this.LOGKEY.SEARCH_CONTENT_CLICK,
      this.LOGKEY.SEARCH_ALL_RESULT_CLICK,
      this.LOGKEY.SEARCH_RESULT_OPTION_CHANGE,
      this.LOGKEY.SEARCH_MORE,
      this.LOGKEY.SEARCH_AUTO_COMPLETE,
      this.LOGKEY.CONTENTS_IMAGE_CLICK,
      this.LOGKEY.APPS_CLICK
    ];
    //if (key.indexOf('ST_') === 0) return false;
    if (except.indexOf(key) === -1) return true;

    return false;
  };

  /**
   * @description PMLog처리 /var/log/message에 기록
   * @param messageId 각 Action 항목별로 정의된 messageId
   * @param value webOS3.0_Normal Log Whitelist v 0.8.xlsx에 정의한 {key:value}
   */
  this.write = function(messageId, value) {
    var logLevel = -1, logs;

    // PmLogCtl -help
    var LEVEL = {
      NONE : -1,
      EMERG : 0,
      ALERT : 1,
      CRIT : 2,
      ERR : 3,
      WARNING : 4,
      NOTICE : 5,
      INFO : 6,
      DEBUG : 7
    };

    // value.time = new Date(); TV에서 타임 자동 기록
    logs = JSON.stringify(value);

    // Tv만 일때 로그 기록
    if (this.isWritable(messageId)) {
      if (device.isTv) {
        logLevel = LEVEL.INFO; // 개발자 가이드에 INFO로그만 남기도록 가이드됨
        window.PalmSystem.PmLogString(logLevel, messageId, logs, '');
      }
      console.info('%c PM LOG : ' + messageId + ' : ' + logs, 'background-color:#000066;color:white');
    }
  };
});