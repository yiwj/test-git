/**
 * Created by hyeoksoo.kwon on 2016-03-10.
 */
discoveryService.service('audioGuidance', function($rootScope, LunaService2, device, util) {
  var that = this;
  var previousAudio = '';
  this.type = 'audioGuidance';
  this.api = 'luna://com.webos.service.tts/speakVKB';
  this.debugApi = '';
  this.subscribe = false;
  this.lastLaunchId = null;
  this.param = {};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = function(req) {
    // TODO : audio device국가 체크 (해당 국가 정해지면 넣기)
    var applyNation = [];
    // TODO : if (!device.isTv || applyNation.indexOf(device.q['X-Device-Country'].toUpperCase()) === -1) {
    if (!device.isTv) {
      return;
    }
    if (device.isAudioGuidance) {
      if (!req || !req.text) {
        return;
      }
      if (req.text === previousAudio) {
        if (util.isAWSServer()) {
          if (req.duplication) {
            //continue;
          } else {
            return;
          }
        } else {
          if (req.text === 'down' || req.text === 'up') {
            //continue;
          } else {
            return;
          }
        }
      }
      previousAudio = req.text;

      if (util.isAWSServer()) {
        this.param.text = req.text.replace("?.","?");
        //[WOSLQEVENT-114774]기호 " !" 를 " .(점) "으로 발화됨.
        this.param.text = (this.param.text).replace(/!./gi, '!');
        this.param.text = (this.param.text).replace(/\.\./g , '.');
      } else {
        this.param.text = req.text;
      }

      if (req.clear === undefined) {
        this.param.clear = true;
      } else {
        this.param.clear = req.clear;
      }

      if (req.timeout) this.timeout = req.timeout;
      //console.log('★★audioGuidance:  ', this.param.text);
      lunaService.call();
    }
  };

  this.serviceCallback = function(res) {
    // callback 따로 처리안함
    console.log('audioGuidance response', JSON.stringify(res));
  };
});