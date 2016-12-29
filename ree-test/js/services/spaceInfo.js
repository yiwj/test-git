discoveryService.service('spaceInfo', function($rootScope, LunaService2, device, pmLog) {
  var that = this;

  this.type = 'spaceInfo';
  this.api = 'luna://com.webos.service.attachedstoragemanager/getProperties';
  this.debugApi = './resources/assets/getAttachedStorageInfo.json';
  this.subscribe = false;
  this.param = {deviceId: 'INTERNAL_STORAGE'};
  this.timeout = 20000;

  var lunaService = new LunaService2(that);

  this.call = lunaService.call;

  this.serviceCallback = function(response) {
    if (response.returnValue) {
      device.spaceTotalSize = parseInt(response.totalSpace) + ' MB';
      device.spaceFreeSize  = parseInt(response.logicalFreeSpace) + ' MB';
      device.spaceUsedSize  = parseInt(response.totalSpace) - parseInt(response.logicalFreeSpace);

      pmLog.write(pmLog.LOGKEY.SPACE_LOG, {
        key : 'serviceCallback',
        totalSize : device.spaceTotalSize,
        freeSize : device.spaceFreeSize,
        usedSize : device.spaceUsedSize
      });

    }
  };

  this.update = function(callback) {
    var luna = {
      type : 'spaceInfo',
      api : 'luna://com.webos.service.attachedstoragemanager/getProperties',
      debugApi : './resources/assets/getAttachedStorageInfo.json',
      subscribe : false,
      param : {deviceId: 'INTERNAL_STORAGE'},
      timeout : 20000,
      serviceCallback : function(response) {
        if (response.returnValue) {
          device.spaceTotalSize = parseInt(response.totalSpace) + ' MB';
          device.spaceFreeSize  = parseInt(response.logicalFreeSpace) + ' MB';
          device.spaceUsedSize  = parseInt(response.totalSpace) - parseInt(response.logicalFreeSpace);

          pmLog.write(pmLog.LOGKEY.SPACE_LOG, {
            key : 'update',
            totalSize : device.spaceTotalSize,
            freeSize : device.spaceFreeSize,
            usedSize : device.spaceUsedSize
          });

          if (callback) {
            callback();
          }
        }
      }
    };
    var lunaService = new LunaService2(luna);
    lunaService.call();
  };

  var convertSize = function(size, isSubFix) {
    var b = parseFloat(size);
    var subFix = '';

    b = b / 1024;

    if (b < 0 || isNaN(b)) {
        b = 0;
    }
    if (isSubFix) subFix = 'MB';
    return parseInt(b) + ' ' + subFix;
  };
});