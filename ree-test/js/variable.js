var discoveryVariable = angular.module('discoveryVariable', []);

discoveryVariable.value('device', {
  startTime: 0,                // 속도 측정을 위해 만든 변수
  endTime: 0,                  // 속도 측정을 위해 만든 변수
  additionalDataAllowed: false,
  adFeatured: false,
  adProvider: false,
  auth: {
    loginSession: '',
    userID: '',
    adultStatus: '',
    prevAdultStatus: '',
    userAutoSignIn: ''
  },
  countryCode: '',
  dateformat: '',
  eula: '',
  firstRun: true,
  isLandscape: {
    tvshows: false,
    movies: false
  },
  isOnline: true,
  languageCode: 'ko',
  page: 'store',
  param: {page: 'featured'},
  powerState: 'Active',
  isQuickStartPlusState : false,
  isQuickStartPlusPowerOff : false,
  q: {},
  featuredMainData : {},
  localPCHeaderObj: {
    'X-Device-Product' : 'webOSTV 3.0'
    , 'X-Device-Platform' : 'W16M'
    , 'X-Device-Model' : 'HE_DTV_W16M_AFADABAA'
    , 'X-Device-Netcast-Platform-Version' : '3.0.0'
    , 'X-Device-Eco-Info' : '1'
    , 'X-Device-Country-Group' : 'KR'
    , 'X-Device-Publish-Flag' : 'N'
    , 'X-Device-ContentsQA-Flag' : 'N'
    , 'X-Device-FW-Version' : '01.00.34'
    , 'X-Device-SDK-VERSION' : '3.0.0'
    , 'X-Device-ID' : 'p4Afhm/z+iNdwfR9zK/1BTcbVrZmVcRobyjA/VxjWke7qTjhB4cS43eYyw7QKPUKHl36kJfKbzIBnEPCh3dgkPGjKmgtQlEX70nay0KfAv87YkwtvgYhzpCfRLkqhm6Y'
    , 'X-Device-Sales-Model' : 'WEBOS2'
    , 'X-Device-Type' : 'T01'
    , 'X-Device-Language' : 'ko-KR'
    , 'X-Device-Locale' : 'ko-KR'
    , 'X-Device-Country' : 'KR'
    , 'HOST' : 'qt2-KR.lgtvsdp.com'
    , 'X-Device-Remote-Flag' : 'N'
    , 'X-Device-FCK' : '156'
    , 'X-Device-Eula' : 'generalTermsAllowed,networkAllowed'
    , 'X-Authentication' : ''
    , 'cookie' : '*'
    , 'X-Login-Session' : ''
  },
  sessionID: '',
  isLocalJSON: (window.location.port === '8080' || window.PalmSystem || window.location.href.indexOf('lgappstv.com') !== -1) ? false : true, // 서버가 안 될 시 로컬 JSON 파일을 사용할 목적으로 만든 변수
  spaceFreeSize: '',
  spaceTotalSize: '',
  spaceUsedSize: '',
  tierType: 1,
  wifiMacAddr: '',
  wiredMacAddr: '',
  currentPage: '',
  resolutionRatio: '',
  isLite : false,
  isDeepLink : false,
  isDeepLinkLaunch : false,
  previousPage : '',
  prevListData : '',
  appsngamesModule : '4', // [WOSLQEVENT-50979] deeplink 광고(Apps&Games) 선택시, device.param.module이 '4'가 되도록 수정함. (모듈번호 1 -> 4)
  hasLaunchParamsResult : false, // from membership
  hasLoginSession : false,
  isBreadcrumbsClicked : false,
  isScrollBtnPressed : false,
  isScrollBtnDimmed : false,
  isKeyDown : false,
  isDepth2AdFocused : false,
  isMainError : false,
  isPlayer : false,
  initTime : (new Date()).toString(),
  isTv : (window.PalmSystem ? true : false),
  icon3D : '/usr/palm/applications/com.webos.app.tvhotkey/qml/images/hotkeys/localkey_3D.png',
  isHD : false,
  isRTL : false,
  availableCpList : {},
  onnowLogging : '', // 각 페이지내에서 사용 후 service.js에서 폐기
  isOpenApi : true, /** isOpenApi 절대 false 후 commit 하지말것!!*/
  isAudioGuidance : false,
  isFocusItem : true,
  isTooltipFocusItem : true
});

discoveryVariable.value('headers', {});

discoveryVariable.value('config', {
  thumbnailTVShows: ['GB', 'FR']
});

discoveryVariable.value('app', {
  appStatusCheckArray : [22, 23, 24, 25, 26, 30, 31],
  appStatusIdList: [],
  appStatusList: [],
  packageAppStatusIdList: [],
  packageAppStatusList: [],
  usbListData: []
});

discoveryVariable.value('billKey', {
  APP_KEY : '00E2EAC38E6EC0AAE053A5F49133C0AA',
  AUTH_CODE : 'D2PJGAAZSJAL49HP'
});

discoveryVariable.value('timeOutValue', {
  SHOWING : 100,
  DESTROYING : 250,
  FINISH_DRAW: 600,
  DRAW_MAIN_ON_INIT: 100
});

discoveryVariable.value('eventKey', {
  FEATURED_MAIN: 'featuredMain',
  DISCOVERY_LOADED : 'discoveryLoaded',
  RECOVER_FOCUS : 'recoverFocus',
  AD_LOADED : 'adLoaded',
  DEPTH2_AD_LOADED : 'depth2ADLoaded',
  DEVICE_AUTH : 'device_auth',
  DATE_FORMAT : 'dateFormat',
  MENU_LOADED : 'menuLoaded',
  LIST_TVMOVIE : 'listLoaded',
  DETAIL_TVMOVIE : 'detailLoaded',
  DETAIL_ACTOR : 'actorLoaded',
  LIST_APPGAME : 'appListLoaded',
  MENU_APPGAME : 'appMenuLoaded',
  DETAIL_LOADED_APPGAME : 'appDetailLoaded',
  UPDATE_LOADED_APPGAME : 'appUpdateLoaded',
  SMALL_UPDATE_LOADED_APPGAME : 'appSmallUpdateLoaded',
  RECOMMEND_APPGAME : 'appRecommendLoaded',
  PACKAGE_APPGAME : 'appPackageLoaded',
  INSTALLABLE_APPGAME : 'appInstallableLoaded',
  CHECK_UPDATE_APPGAME : 'appCheckUpdateLoaded',
  EVENT_FREE_PURCHASE_APPGAME : 'eventFreeAppPurchased',
  LIST_PREMIUM : 'premiumListLoaded',
  THEME_LOADED : 'themeDataLoaded',
  RATED_APPGAME : 'appNGameRated',
  PURCHASE_INFO : 'purchaseInfoLoaded',
  PACKAGE_STATUS_RESULT : 'packageStatusResult',
  PACKAGE_STATUS_UPDATE : 'packageStatusUpdate',
  BILL_INFO : 'billInfo',
  MYPAGE_LOADED : 'myPageLoaded',
  MYPAGE_DEL_RECENTHISTORY : 'deleteRecentHistory',
  MYPAGE_MENU_LOADED : 'myPageMenuLoaded',
  MYPAGE_APP_INSTALL_SUCCESS : 'myPageAppInstallSuccess',
  MYPAGE_APP_DELETE_SUCCESS : 'myPageAppDeleteSuccess',
  MYPAGE_APP_UPDATE_SUCCESS : 'myPageAppUpdateSuccess',
  MYPAGE_APP_INSTALL_FAIL: 'myPageAppUpdateFail',
  LOCALSTORAGE_MYPAGE_LOCALSTORAGE : 'LocalStorageMypageHistoryDelete',
  SEARCH_TITLE : 'searchTitle',
  SEARCH_SUGGEST : 'searchSuggest',
  SEARCH_POPULAR : 'searchPopular',
  SEARCH_RESULT : 'searchResult',
  SEARCH_OPTION : 'searchOption',
  SIGNIN_STATUS_CHANGED: 'signInStatusChanged',
  ADULT_STATUS_LOADED : 'adultStatusLoaded',
  REFRESH_SCREEN : 'refreshScreen',
  NOTICE_LOADED : 'noticeLoaded',
  REGIST_CP : 'registCp',
  UNREGIST_CP : 'unregistCp',
  CHANGE_LANGUAGE : 'popupLangChange',
  NETWORK_ERROR : 'networkError',
  PAGE_MOVE_ERROR : 'pageMoveError',
  CP_LIST : 'availableCpList',
  FEATURED_ROLLING: 'featuredRolling',
  LIST_PAGE_UP_DOWN: 'listPageUpDown',
  PURCHASABLE_APP : 'purchasableApp',
  ON_WRITE_SERVER_LOG_RECEIVED: 'onWriteServerLogReceived',
  TVMOVIE_EXEC : 'onExecDataReceived',
  HEADER_ERROR : 'onHttpHeaderError'
});