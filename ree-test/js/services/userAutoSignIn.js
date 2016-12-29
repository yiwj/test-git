discoveryService.service('userAutoSignIn', function($rootScope, LunaService2, device, eventKey, membership) {
  var that = this;

  this.type = 'userAutoSignIn';
  this.api = 'luna://com.webos.service.membership/getValue';
  this.debugApi = './resources/assets/getUserID.json';
  this.subscribe = true;
  this.param = {key: '/users/autoSignIn'};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  this.serviceCallback = function(response) {
    if (response.returnValue) {
      device.auth.userAutoSignIn = response.value;
    }else {
      device.auth.userAutoSignIn = false;
    }
  };
});