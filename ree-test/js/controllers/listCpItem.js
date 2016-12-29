app.directive('listCp', function(util) {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
//    templateUrl: './resources/html/listCpItem.html',
    template: listCpItemTmpl,
    link: function($scope, $element) {
      $element[0].update = function(obj, apply) {
        var defaultImgData = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        if (obj == null) {
          this.getElementsByClassName('thumb-img')[0].setAttribute('src', defaultImgData);
          $scope.id = '';
          $scope.type = '';
          $scope.name = '';
          $scope.src = defaultImgData;
          $scope.img = '';
          $scope.categoryName = '';
          $scope.displayPrice = '';
          $scope.iconColor = '';
          $scope.price = '';
          $scope.event = '';
          $scope.eventPrice = '';
          $scope.displayEventPrice = '';
          $scope.hideItem = true;
          $scope.showBadge = false;
          $scope.showPromotion = false;
          $scope.dpPrice1 = '';
          $scope.dpPrice2 = '';
          $scope.badge = '';
          $scope.mode = '';
          $scope.listClass = 'cp-list-item';
          $scope.ageType = '';
          $scope.$digest();
        } else {
          //this.getElementsByClassName('thumb-img')[0].setAttribute('src', defaultImgData);
          $scope.id = obj.id;
          $scope.type = obj.type;
          $scope.mode = obj.mode;
          $scope.name = obj.name;
          if(obj.updateYN) {    // for my apps
            $scope.categoryName = msgLang.myPage_apps_013 + ' ' + util.getInstalledDate(obj.installedDate);
            $scope.displayPrice = obj.bFree ? msgLang.free : msgLang.alert_adult_4_6;
          } else {
            $scope.categoryName = obj.categoryName;
            $scope.displayPrice = obj.displayPrice;
          }
          $scope.iconColor = obj.iconColor;
          $scope.price = obj.price;
          $scope.event = obj.event;
          $scope.eventPrice = obj.eventPrice;
          $scope.displayEventPrice = obj.displayEventPrice;
          $scope.showPromotion = obj.isPromotion;
          $scope.ageType = obj.ageType;
          $scope.src = obj.img;
          // branche : display badge
          if ($scope.event == 'Y') {
            $scope.badge = msgLang.apps_event;
            if ($scope.mode == 'P') $scope.badge = $scope.badge + ', ' + msgLang.badge_package;
            $scope.showBadge = true;
          } else {
            if ($scope.mode == 'P') {
              $scope.badge = msgLang.badge_package;
              $scope.showBadge = true;
            } else {
              $scope.showBadge = false;
            }
          }
          // branche : event/price policy
          if ($scope.event == 'Y' && parseInt($scope.eventPrice) == 0) {
            $scope.dpPrice1 = msgLang._3d_price_free;
            $scope.dpPrice2 = $scope.displayPrice;
            $scope.eventPirceClass = 'event-price';
          } else if ($scope.event == 'Y' && parseInt($scope.eventPrice) != 0) {
            $scope.dpPrice1 = $scope.displayEventPrice;
            $scope.dpPrice2 = $scope.displayPrice;
            $scope.eventPirceClass = 'event-price';
          } else if ($scope.event == 'N' && parseInt($scope.price) == 0) {
            $scope.dpPrice1 = msgLang._3d_price_free;
            $scope.dpPrice2 = '';
            $scope.eventPirceClass = '';
          } else if ($scope.event == 'N' && parseInt($scope.price) != 0) {
            $scope.dpPrice1 = $scope.displayPrice;
            $scope.dpPrice2 = '';
            $scope.eventPirceClass = '';
          } else {
            $scope.dpPrice1 = $scope.displayPrice;
            $scope.dpPrice2 = '';
            $scope.eventPirceClass = '';
          }

          if(obj.selected === 'true') {
            $scope.listClass = 'item-cp check-on';
          } else {
            $scope.listClass = 'item-cp';
          }
          $scope.hideItem = false;
        }
        //this.children[1].style.backgroundColor = '';
        clearTimeout($scope.timer);
        $scope.$digest();
      };
    }
  };
});
