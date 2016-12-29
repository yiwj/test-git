discoveryService.service('authentication', function($rootScope, $http, LunaService2, device) {
  var that = this;

  this.type = 'authentication';
  this.api = 'luna://com.webos.service.sdx/requestDeviceAuthentication';
  this.debugApi = './resources/assets/requestDeviceAuthentication.json';
  this.subscribe = false;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  this.update = function(callback){
    var luna = {
      type : this.type,
      api : this.api,
      debugApi : this.debugApi,
      subscribe : this.subscribe,
      param : this.param,
      timeout : this.timeout,
      serviceCallback : function(response) {
        //device.firstRun = false;
        var res = '';
        if (!response.returnValue || !response.serverResponse || !response.serverResponse.response) {
        }else{
          res = JSON.parse(response.serverResponse.response);
        }
        if (res.error || !res.authentication || !res.authentication.sessionID) {
        } else{
          device.q['X-Authentication'] = res.authentication.sessionID;
        }
        if (callback) {
          callback();
        }
      }
    };
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };

  this.serviceCallback = function(response) {
    //device.firstRun = false;

    var res = '';
    if (!response.returnValue || !response.serverResponse || !response.serverResponse.response) {
      //return;
    }else{
      res = JSON.parse(response.serverResponse.response);
    }


    if (res.error || !res.authentication || !res.authentication.sessionID) {
      /**TODO
      return을 하게 되면 internal server에러 발생시 무한로딩에 빠지게 됨 authentication 값 없이 메인 discovery 호출시 main error페이지로
      자연스럽게 넘어갈 것으로 예상됨**/
      //return;
    } else{
      device.q['X-Authentication'] = res.authentication.sessionID;
    }


    // 화면 그리는 함수 시작(featuredOnload);
    // event를 보내서 view를 관리하는 곳에서 처리하도록 할 것
    $rootScope.initializeCountry(true);
  };
});