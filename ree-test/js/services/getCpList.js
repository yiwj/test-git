/**
 * Created by hyeoksoo.kwon on 2015-12-09.
 */
discoveryService.service('getCpList', function($rootScope, LunaService2, device) {
  var that = this;

  // [WOSLQEVENT-70989] quickstart+ on/off 상태 체크
  this.type = 'getCpList';
  this.api = 'luna://com.webos.service.sdx/send';
  this.subscribe = false;
  this.param = {serviceName : 'sdp_secure', url: 'content_discovery/cp-list', methodType : 'REQ_SSL_POST_METHOD', useCache :'true'};
  this.callback = undefined;
  this.timeout = 1000;

  var lunaService = new LunaService2(that);

  this.call = function(callback) {
    this.callback = callback;
    lunaService.call();
  };

  this.serviceCallback = function(response) {
    var availableCpList;
    if (response.returnValue &&
      response.serverResponse &&
      response.serverResponse.code === '200') {
      availableCpList = JSON.parse(response.serverResponse.response);
    }

    if (this.callback) {
      this.callback(availableCpList);
    }
  };
});