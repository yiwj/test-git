discoveryService.service('connectionInfo', function($rootScope, LunaService2, device) {
  var that = this;

  this.type = 'connectionInfo';
  this.api = 'luna://com.palm.connectionmanager/getinfo';
  this.debugApi = './resources/assets/getConnectionInfo.json';
  this.subscribe = false;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  this.serviceCallback = function(response) {
    if (response.returnValue) {
      device.wifiMacAddr = response.wifiInfo.macAddress;
      device.wiredMacAddr = response.wiredInfo.macAddress;
    }
  };
});