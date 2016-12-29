app.directive('listControlTvshow', function($compile) {
  return {
    restrict: 'A',
    scope: {},
    controller: 'listControlTvshow',
    template: listControlTvshowTmpl,
    replace: true,
    link: function ($scope, $element, $attrs) {
      $scope.listtype = $attrs.listtype;
      $scope.isMyPage = $attrs.ismypage;
    }
  };
});

app.controller('listControlTvshow', function($scope, $controller, $element, $attrs,
  $rootScope, focusManager, keyHandler, marquee, util, storage, pmLog) {
  angular.extend(this, $controller('listControl', {
    $scope: $scope,
    $controller: $controller,
    $element: $element,
    $attrs: $attrs,
    $rootScope: $rootScope,
    focusManager: focusManager,
    keyHandler: keyHandler,
    marquee: marquee,
    util: util,
    storage: storage,
    pmLog: pmLog
  }));
});
