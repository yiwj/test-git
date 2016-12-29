var discoveryServer = angular.module('discoveryServer', ['discoveryVariable', 'discoveryUtil']);

discoveryServer.service('server', function($rootScope, device, headers, util, eventKey) {
  var handler = {};
  var thread;
  var discovery = {
    requestTime: 0,
    responseTime: 0,
    responseData: {}
  };
  var TVShowRecommended = {
    requestTime: 0,
    responseTime: 0,
    responseData: {}
  };
  var MovieRecommended = {
    requestTime: 0,
    responseTime: 0,
    responseData: {}
  };
  var Premium = {
    requestTime: 0,
    responseTime: 0,
    responseData: {}
  };
  var ThreedList = {
    requestTime: 0,
    responseTime: 0,
    responseData: {}
  };
  var PremiumDetail = {
    requestTime: 0,
    responseTime: 0,
    responseData: {}
  };
  var AppList = {
    requestTime: 0,
    responseTime: 0,
    responseData: {}
  } ;
  var actor = {
    requestTime: 0,
    responseTime: 0,
    responseData: {}
  };
  var SearchList = {
    requestTime: 0,
    responseTime: 0,
    responseData: {}
  };
  var MyPage = {
    requestTime: 0,
    responseTime: 0,
    responseData: {}
  };

  var handleMessage = function(e) {
    var command = e.data.cmd;
    var params = e.data.params;

    if (!command || !handler[command]) {
      console.log('Worker Command Error: ', e.data);
      return;
    }

    handler[command].apply(this, params);
  };

  this.initialize = function() {
    thread = new Worker("./resources/js/threadJson.js");

    thread.addEventListener('message', handleMessage, false);

    if (window.location.host.indexOf('lgappstv.com') < 0 && window.PalmSystem === undefined) {
      thread.postMessage({cmd: 'setHost', params: [window.location.protocol, window.location.host, eventKey]});
    } else if(window.location.port === "8080" && window.PalmSystem){ //로컬서버를 이용하고 티비에 마운트한 경우 테스트를 위해 qt2를 host로 설정
      thread.postMessage({cmd: 'setHost', params: ['http:', 'qt2-kr.lgrecommends.lgappstv.com/2015/api', eventKey]});
    } else {
      //thread.postMessage({cmd: 'setHost', params: ['http:', 'qt2-kr.lgrecommends.lgappstv.com/2015/api']});
      thread.postMessage({cmd: 'setHost', params: ['http:', '', eventKey]});
    }
  };

  this.requestDateFormat = function() {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'dateformat', params: [params]});
  };

  handler.dateformat = function(format) {
    device.dateformat = format;
  };

  this.requestDiscovery = function() {
    if (discovery.requestTime && (new Date()) - discovery.responseTime < 60000) {
      $rootScope.$broadcast('discoveryLoaded', discovery.responseData);
      return;
    }

    var params = {};

    discovery.requestTime = new Date();

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'discovery', params: [params, device.tierType]});
  };

  handler.discovery = function(data) {
    discovery.responseTime = new Date();
    discovery.responseData = data;

    $rootScope.$broadcast('discoveryLoaded', data);
  };

  this.requestTVShowRecommended = function(apiID) {
    if (TVShowRecommended.requestTime && (new Date()) - TVShowRecommended.responseTime < 60000) {
      $rootScope.$broadcast('listLoaded', TVShowRecommended.responseData);
      return;
    }

    var params = {};

    TVShowRecommended.requestTime = new Date();

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'TVShowRecommended', params: [apiID, params]});
  };

  handler.TVShowRecommended = function(data) {
    TVShowRecommended.responseTime = new Date();
    util.copyObject(TVShowRecommended.responseData, data);

    $rootScope.$broadcast('listLoaded', data);
  };

  this.requestTVShowList = function(apiID, payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'TVShowList', params: [apiID, params, payload]});
  };

  handler.TVShowList = function(data) {
    $rootScope.$broadcast('listLoaded', data);
  };

  this.requestTVShowDetail = function(apiID, scopeId) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'TVShowDetail', params: [apiID, params, scopeId]});
  };

  handler.TVShowDetail = function(data) {
    $rootScope.$broadcast('detailLoaded', data);
  };

  this.requestMovieRecommended = function(apiID) {
    if (MovieRecommended.requestTime && (new Date()) - MovieRecommended.responseTime < 60000) {
      $rootScope.$broadcast('listLoaded', MovieRecommended.responseData);
      return;
    }

    var params = {};

    MovieRecommended.requestTime = new Date();

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'MovieRecommended', params: [apiID, params]});
  };

  handler.MovieRecommended = function(data) {
    MovieRecommended.responseTime = new Date();
    util.copyObject(MovieRecommended.responseData, data);

    $rootScope.$broadcast('listLoaded', data);
  };

  this.requestMovieList = function(apiID, payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'MovieList', params: [apiID, params, payload]});
  };

  handler.MovieList = function(data) {
    $rootScope.$broadcast('listLoaded', data);
  };

  this.requestMovieShowDetail = function(apiID, scopeId) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'MovieShowDetail', params: [apiID, params, scopeId]});
  };

  handler.MovieShowDetail = function(data) {
    $rootScope.$broadcast('detailLoaded', data);
  };

  this.requestPremiumList = function() {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'PremiumList', params: [params]});
  };

  handler.PremiumList = function(data) {
    $rootScope.$broadcast('premiumListLoaded', data);
  };

  this.requestPremiumDetail = function(item_id) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'PremiumDetail', params: [item_id, params]});
  };

  handler.PremiumDetail = function(data) {
    $rootScope.$broadcast('premiumDetail', data);
  };

  this.requestThreedList = function(apiID, payload) {
    if (ThreedList.requestTime && (new Date()) - ThreedList.responseTime < 60000) {
      $rootScope.$broadcast('3dListLoaded', ThreedList.responseData);
      return;
    }

    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'ThreedList', params: [apiID, params, payload]});
  };

  handler.ThreedList = function(data) {
    ThreedList.responseTime = new Date();
    util.copyObject(ThreedList.responseData, data);

    $rootScope.$broadcast('3dListLoaded', data);
  };

  this.requestThreedDetail = function(apiID, payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'ThreedDetail', params: [apiID, params, payload]});
  };

  handler.ThreedDetail = function(event, data) {
    $rootScope.$broadcast(event, data);
  };

  this.requestThreedData = function(apiID, payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'ThreedData', params: [apiID, params, payload]});
  };

  handler.ThreedData = function(data) {
    $rootScope.$broadcast('threedData', data);
  };

  this.requestAppNGameList = function(apiID, payload) {
    if (AppList.requestTime && (new Date()) - AppList.responseTime < 60000) {
      $rootScope.$broadcast('appListLoaded', AppList.responseData);
      return;
    }

    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'AppNGameList', params: [apiID, params, payload]});
  };

  handler.AppNGameList = function(data) {
    AppList.responseTime = new Date();
    util.copyObject(AppList.responseData, data);
    $rootScope.$broadcast('appListLoaded', data);
  };

  this.requestAppNGameMenu = function(rank, category) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'AppNGameMenu', params: [rank, category, params]});
  };

  handler.AppNGameMenu = function(data) {
    $rootScope.$broadcast('appMenuLoaded', data);
  };

  this.requestAppNGameDetail = function(payload, scopeId, flag) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'AppNGameDetail', params: [params, payload, scopeId, flag]});
  };

  handler.AppNGameDetail = function(data) {
    if(data.target == 'update') {
      $rootScope.$broadcast('appUpdateLoaded', data);
    } else {
      $rootScope.$broadcast('appDetailLoaded', data);
    }
  };

  this.requestAppNGameRecommended = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'AppNGameRecommended', params: [params, payload]});
  };

  handler.AppNGameRecommended = function(data) {
    $rootScope.$broadcast('appRecommendLoaded', data);
  };

  this.requestAppPackageList = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'AppPackageList', params: [params, payload]});
  };

  handler.AppPackageList = function(data) {
    $rootScope.$broadcast('appPackageLoaded', data);
  };

  this.requestActor = function(item_id, payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'Actor', params: [item_id, params, payload]});
  };

  handler.Actor = function(data) {
    $rootScope.$broadcast('actorLoaded', data);
  };

  this.requestSearchList = function() {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'SearchList', params: [params]});
  };

  handler.SearchList = function(data) {
    $rootScope.$broadcast('searchListLoaded', data);
  };

  this.requestMyPage = function(apiID, payload) {
    if (MyPage.requestTime && (new Date()) - MyPage.responseTime < 60000) {
      $rootScope.$broadcast('myPageLoaded', MyPage.responseData);
      return;
    }

    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'MyPage', params: [apiID, params, payload]});
  };

  handler.MyPage = function(data) {
    MyPage.responseTime = new Date();
    util.copyObject(MyPage.responseData, data);
    $rootScope.$broadcast('myPageLoaded', data);
  };

  this.requestMyPageMenu = function(rank, category) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];
    params['TierType'] = device.tierType;

    thread.postMessage({cmd: 'MyPageMenu', params: [rank, category, params]});
  };

  handler.MyPageMenu = function(data) {
    $rootScope.$broadcast('myPageMenuLoaded', data);
  };

  this.requestCpList = function(apiID, payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'MyPageCpList', params: [apiID, params, payload]});
  };

  this.requestRecentData = function(apiID, payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'MyPageRecentData', params: [apiID, params, payload]});
  };

  this.deleteRecentData = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'deleteRecentHistory', params: [params, payload]});
  };

  handler.onRecentDataDeleted = function(data) {
    $rootScope.$broadcast('myPageMenuLoaded', data);
  };

  this.requestAppInstallable = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'AppInstallable', params: [params, payload]});
  };

  handler.AppInstallable = function(data) {
    $rootScope.$broadcast('appInstallableLoaded', data);
  };

  this.requestAppCheckUpdate = function(payload, scope) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'AppCheckUpdate', params: [params, payload, scope]});
  };

  handler.AppCheckUpdate = function(data) {
    if (data.scopeName == 'detailApp') {
      $rootScope.$broadcast('appCheckUpdateLoaded', data);
    } else {
      $rootScope.$broadcast('othersAppCheckUpdateLoaded', data);
    }
  };

  this.requestEventFreeAppPurchase = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'EventFreeAppPurchase', params: [params, payload]});
  };

  handler.EventFreeAppPurchase = function(data) {
    $rootScope.$broadcast('eventFreeAppPurchased', data);
  };

  this.requestBillInfo = function(apiID, payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'BillInfo', params: [apiID, params, payload]});
  };

  handler.BillInfo = function(event, data) {
    $rootScope.$broadcast(event, data);
  };

  this.requestLocalStorage = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'LocalStorage', params: [params, payload]});
  };

  handler.LocalStorage = function(event, data) {
    console.log("svr movie, 3D, TVShow, history deleted  :::", data);
  };

  this.requestAppNGameRating = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'AppNGameRating', params: [params, payload]});
  };

  handler.AppNGameRating = function(data) {
    $rootScope.$broadcast('appNGameRated', data);
  };

  this.requestSearchResult = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'SearchResult', params: [params, payload, createSearchApiHost()]});
  };

  handler.SearchResult = function(data) {
    $rootScope.$broadcast('searchResultLoaded', data);
  };

  this.requestSearchOption = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'SearchOption', params: [params, payload, createSearchApiHost()]});
  };

  handler.SearchOption = function(data) {
    $rootScope.$broadcast('searchOptionList', data);
  };

  this.requestSearchTitle = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'searchTitle', params: [params, payload, createSearchApiHost()]});
  };

  handler.SearchTitle = function(data) {
    $rootScope.$broadcast('setSearchTitle', data);
  };

  this.requestSearchPopular = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'searchPopular', params: [params, payload, createSearchApiHost()]});
  };

  handler.SearchPopular = function(data) {
    $rootScope.$broadcast('setSearchPopular', data);
  };

  this.requestSearchSuggest = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'searchSuggest', params: [params, payload, createSearchApiHost()]});
  };

  handler.SearchSuggest = function(data) {
    $rootScope.$broadcast('setSearchSuggest', data);
  };

  this.requestTheme = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'theme', params: [params, payload]});
  };

  handler.theme = function(data) {
    $rootScope.$broadcast('themeDataLoaded', data);
  };

  this.requestContentData = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'ContentData', params: [params, payload]});
  };

  handler.ContentData = function(data) {
    $rootScope.$broadcast('contentDataLoaded', data);
  };

  this.requestAppPurchasable = function(payload) {
    var params = {};

    util.copyObject(params, headers);
    params['X-Authentication'] = device.q['X-Authentication'];

    thread.postMessage({cmd: 'requestAppPurchasable', params: [params, payload]});
  };

});
