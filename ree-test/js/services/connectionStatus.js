discoveryService.service('connectionStatus', function($rootScope, LunaService2, device) {
  var that = this;

  this.type = 'connectionStatus';
  this.api = 'luna://com.palm.connectionmanager/getstatus';
  this.debugApi = './resources/assets/getConnectionStatus.json';
  this.subscribe = false;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  this.serviceCallback = function(response) {
    if (response.returnValue) {
      if (response.hasOwnProperty('isInternetConnectionAvailable')) {
        device.isOnline = Boolean(response.isInternetConnectionAvailable);
      }
    }

    $rootScope.$broadcast('checkConnection', device.isOnline);
  };
});