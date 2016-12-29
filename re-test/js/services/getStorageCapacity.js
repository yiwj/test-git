discoveryService.service('storageCapacity', function($rootScope, LunaService2, app) {
  var usbInfo, driveCnt, that = this;
  this.type = 'storageCapacity';
  this.api = 'luna://com.webos.service.attachedstoragemanager/getProperties';
  this.debugApi = './resources/assets/getAttachedStorageInfo.json';
  this.subscribe = false;
  this.param = {};
  this.timeout = 20000;
  this.callBackParam = {};

  var lunaService = new LunaService2(that);

  this.call = function(req) {
    driveCnt = 0;
    if (req) {
      this.param.callbackEvent = req;
    }

    if (app.usbListData && app.usbListData.length === 0) {
      var res = undefined;
      $rootScope.$broadcast(this.param.callbackEvent, res);
      return;
    }

    //[WOSLQEVENT-117689] 파티션 모두가 노출되지 않는 이슈
    //다수 파티션 나뉘어있는 외부 저장장치일 경우 모든 파티션 용량정보 확인위해 변경
    for(var i = 0; i < app.usbListData.length; i++) {
      usbInfo = app.usbListData[i];
      for(var j = 0 ; j < usbInfo.subDevices.length ; j++){
        this.param.deviceId = usbInfo.deviceId;
        this.param.subDeviceId = usbInfo.subDevices[j].deviceId;
        this.callBackParam = {
          idx: driveCnt,
          deviceId: usbInfo.deviceId,
          subDeviceId: usbInfo.subDevices[j].deviceId,
          data: usbInfo
        };
        lunaService.call();
        driveCnt++;
      }
    }
  };

  this.serviceCallback = function(res) {

    //var customParam = this.callBackParam;
    console.log('attachedStorageManager response', res);
    /**
     * deletable: true,
     * deviceType: "usb"
     * freeSpace: 14082
     * returnValue: true
     * totalSpace: 15455
     * writable: true
     */
    if (res.returnValue === true) {
      //[WOSLQEVENT-117689] 파티션 모두가 노출되지 않는 이슈
      //다수 파티션 나뉘어있는 외부 저장장치일 경우 모든 파티션 용량정보 확인위해 변경
      for(var i = 0 ; i < app.usbListData.length ; i++){
        var tmpData = app.usbListData[i];
        if (tmpData.deviceId === res.deviceId){
          for(var j = 0 ; j < tmpData.subDevices.length ; j++){
            if(tmpData.subDevices[j].deviceId === res.subDeviceId){
              tmpData.subDevices[j].capacity = res;
            }
          }
        }
      }
    } else {
      for(var i = 0 ; i < app.usbListData.length ; i++){
        var tmpData = app.usbListData[i];
        if (tmpData.deviceId === res.deviceId){
          for(var j = 0 ; j < tmpData.subDevices.length ; j++){
            if(tmpData.subDevices[j].deviceId === res.subDeviceId){
              tmpData.subDevices[j].capacity = {freeSpace: -1, totalSpace: -1};
            }
          }
        }
      }
//      app.usbListData[usbCount].capacity = {freeSpace: -1, totalSpace: -1};
      console.error('attachedStorageManager response', res);
    }

    //this.call(this.param.callbackEvent); //각 usb capacity 정보를 가져오는데 또 재귀를 할필요성이 없어보임 문제시 말씀주세요 by 양민철
    if (this.param.callbackEvent && res.idx + 1 === driveCnt) {
      console.log(this.param.callbackEvent);
      $rootScope.$broadcast(this.param.callbackEvent, res);
    }
    //usbCount++; //usb인덱스 값이 idx가 바뀐후 콜백이 들어오기때문에 콜백이 올때마다 usbcount++ 해주어 이것을 index값으로 삼는다.
  };
});