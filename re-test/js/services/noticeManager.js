discoveryService.service('noticeManager', function(LunaService2) {
  var that = this;
  this.type = 'launchNotificationCenter';
  this.api = 'luna://com.webos.applicationManager/launch';
  this.debugApi = '';
  this.subscribe = false;
  this.param = {
    id : 'com.webos.app.notificationcenter'
  };
  this.timeout = 20000;

  var lunaService = new LunaService2(that);
  this.call = function() {
    lunaService.call();
  };

  this.serviceCallback = function(res) {
    console.log('luna called notificationCenter');
  };
});