discoveryService.service('screenSaver', function($rootScope, LunaService2, pmLog) {
  var that = this;

  this.type = 'screenSaver';
  this.api = 'luna://com.webos.service.tvpower/power/registerScreenSaverRequest';
  this.subscribe = true;
  this.subscribed = false;
  this.clientName = 'lgStore';
  this.param = {
    clientName: 'lgStore'
  };
  this.timeout = 20000;
  this.blocked = false;

  var lunaService = new LunaService2(that);

  this.block = function() {
    console.log('screenSaver.block');
    this.blocked = true;

    if (!this.subscribed) {
      lunaService.call();
    }
  };

  this.unBlock = function() {
    console.log('screenSaver.unBlock');

    this.blocked = false;
  };

  this.serviceCallback = function(response) {
    console.log('screenSaver.serviceCallback, response=' + JSON.stringify(response));

    pmLog.write(pmLog.LOGKEY.SCREENSAVER_LOG, {
      api : 'luna://com.webos.service.tvpower/power/registerScreenSaverRequest',
      params : JSON.stringify(that.param),
      response : JSON.stringify(response)
    });

    if(response && response.returnValue && response.timestamp && that.blocked) {
      responseScreenSaverRequest(that.blocked, response.timestamp);
    } else if (response && response.subscribed) {
      that.subscribed = response.subscribed;
    }
  };

  var responseScreenSaverRequest = function(block, timestamp) {
    console.log('screenSaver.responseScreenSaverRequest, block=' + block +
      ', timestamp=' + timestamp);

    var luna = {
      type : that.type,
      api : 'luna://com.webos.service.tvpower/power/responseScreenSaverRequest',
      param : {
        "clientName": that.clientName,
        "ack": !block,
        "timestamp": timestamp
      },
      serviceCallback : function(response) {
        var log = 'screenSaver.responseScreenSaverRequest.serviceCallback, block=' + block +
          ', timestamp=' + timestamp + ', response=' + JSON.stringify(response);
        pmLog.write(log);
      }
    };

    pmLog.write(pmLog.LOGKEY.SCREENSAVER_LOG, {
      api : 'luna://com.webos.service.tvpower/power/responseScreenSaverRequest',
      params : JSON.stringify(luna.param)
    });

    var lunaService = new LunaService2(luna);
    lunaService.call();
  };
});
