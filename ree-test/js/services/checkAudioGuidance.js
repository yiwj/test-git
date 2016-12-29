/**
 * Created by hyeoksoo.kwon on 2016-03-28.
 */
discoveryService.service('checkAudioGuidance', function($rootScope, LunaService2, device) {
  var that = this;
  this.type = 'checkAudioGuidance';
  this.api = 'luna://com.webos.settingsservice/getSystemSettings';
  this.debugApi = '';
  this.subscribe = true;
  this.param = {category : "option", keys: ["audioGuidance"]};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = function() {
    // TODO : audio device국가 체크 (해당 국가 정해지면 넣기)
    var applyNation = [];
    // TODO : if (!device.isTv || applyNation.indexOf(device.q['X-Device-Country'].toUpperCase()) === -1) {
    if (!device.isTv) {
      device.isAudioGuidance = false;
      return;
    }
    lunaService.call();
  };

  this.serviceCallback = function(response) {
    if (response.returnValue) {
      if (response.settings && response.settings.audioGuidance === 'on') {
        device.isAudioGuidance = true;
      } else {
        device.isAudioGuidance = false;
      }
    } else {
      device.isAudioGuidance = false;
    }
  };
});