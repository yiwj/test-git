app.controller('spinnerController', function($scope, $rootScope, focusManager, $timeout, device, marquee, audioGuidance) {
  $scope.hide = false;

  $scope.showSpinner = function(option) {
    if (!$scope.hide)
      return;

    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };

    params.text = msgLang.audio_content_loading;

    if (option && option.audioGuidanceForce) {
      params.duplication = option.audioGuidanceForce;
    }

    audioGuidance.call(params);

    marquee.setTarget(null);
    $scope.hide = false;
    focusManager.setState('loading', true);
    if (this.$root.$$phase != '$digest') $scope.$digest();
  };

  $scope.hideSpinner = function() {
    if ($scope.hide)
      return;

    // WOSLQEVENT-79551 : 클릭 시점 차이로 생기는 이슈로 M2보드에서는 50초의 delay
    var chkPlatForm = ['W16R'];
    var platform = device.q['X-Device-Platform'];
    var time = 0;

    if (chkPlatForm.indexOf(platform) > -1) {
      time = 50;
    }

    $timeout(function() {
      $scope.hide = true;
      focusManager.setState('loading', false);
      //$scope.$digest();
      chkPlatForm = null;
      platform = null;
      time = null;
    }, time);
  };

  var initialize = function() {
    $rootScope.spinner = $scope;
  };

  initialize();
});
