discoveryService.service('billing', function($rootScope, LunaService, device, server, billKey, eventKey) {
  var _billingId;

  /**
   * @description App 구매 정보 확인을 위한 Billin ID 조회
   * @param {string} event 호출하는 곳에서 callback으로 받을 event명 (string)
   */
  this.checkSetId = function(event) {
    if (!_billingId) {
      var callParam = {};
      callParam.type = 'checkSetId';
      callParam.api = 'luna://com.webos.service.sdx/getDeviceUuid';
      callParam.debugApi = './resources/assets/getDeviceUuid.json';
      callParam.subscribe = false;
      callParam.param = {};
      callParam.timeout = 20000;
      callParam.serviceCallback = function(res) {
        if (res.response.data.returnValue) {
          _billingId = res.response.data.billingId;
          if (event) {
            $rootScope.$broadcast(event);
          }
        }
      };
      var lunaService = new LunaService(callParam);
      lunaService.call();

    } else {
      $rootScope.$broadcast(event);
    }
  };

  /**
   * @description 빌링아이디를 반환
   * @returns {*}
   */
  this.getId = function() {
    return _billingId;
  };

  /**
   * @description 구매한 컨텐츠 정보 (TODO : 데이터 확인)
   * @param {object} pageParam
   */
  this.getPurchasedContentsInfo = function (callParam) {
    if (!device.isLocalJSON) {
      // server data 용
      var params = {
        api : '/openapi/purchase/checkPaid',
        method : 'get',
        params : {
          sellrFlag: "1",
          appID: encodeURIComponent(callParam.appId),
          useFlag: "1",
          userID: encodeURIComponent(device.auth.userID),
          deviceID: _billingId,
          productIDs: encodeURIComponent(callParam.contentId),
          checkSameDevice: "Y",
          appKey: billKey.APP_KEY,
          authCode: billKey.AUTH_CODE
        }
      };
      try {
        server.requestApi(eventKey.BILL_INFO, params);
      } catch (e) {
      }
    } else {
      // local json 용
      var reqParam = {
        api: '/openapi/purchase/checkPaid',
        method: 'get',
        sellrFlag: "1",
        appID: encodeURIComponent(callParam.appId),
        useFlag: "1",
        userID: encodeURIComponent(device.auth.userID),
        deviceID: _billingId,
        productIDs: encodeURIComponent(callParam.contentId),
        checkSameDevice: "Y",
        appKey: billKey.APP_KEY,
        authCode: billKey.AUTH_CODE,
        event: callParam.event // server호출 후 broadcast할 event명
      };

      try {
        server.requestBillInfo(callParam.contentId, reqParam);
      } catch (e) {
      }
    }
  };

  /**
   * @description 구매앱 정보
   * @used detailApp.js, rating.js
   * @param callParam
   */
  this.getPurchasedAppinfo = function (callParam) {
    if (!device.isLocalJSON) {
      // server data 용
      var params = {
        api : '/purchase/app',
        method : 'get',
        apiAppStoreVersion : 'v8.0',
        params : {
          app_id : callParam.appId
        }
      };
      try {
       server.requestApi(callParam.event, params); // eventKey.PURCHASE_INFO or eventKey.PACKAGE_STATUS_RESULT
      } catch (e) {
      }
    } else {
      // local json 용
      var reqParam = {
        api: '/purchase/app',
        method: 'get',
        apiAppStoreVersion: 'v8.0',
        app_id: callParam.appId,
        event: callParam.event // server호출 후 broadcast할 event명
      };
      try {
        server.requestBillInfo(callParam.appId, reqParam);
      } catch (e) {
      }
    }
  };
});