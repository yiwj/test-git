app.directive('listApp', function(util, device) {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    template: listAppItemTmpl,
    link: function($scope, $element) {
      $element[0].update = function(obj, apply) {
        var defaultImgData = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
//        this.getElementsByClassName('thumb-img')[0].style.opacity = 0;
        if (obj === null) {
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
          $scope.listClass = 'app-list-item';
          $scope.ageType = '';
          $scope.$apply();
        } else {
          //this.getElementsByClassName('thumb-img')[0].setAttribute('src', defaultImgData);
          $scope.id = obj.id;
          $scope.type = obj.type;
          $scope.mode = obj.mode;
          $scope.name = obj.name;
          if(obj.updateYN) {    // for my apps
            if(obj.bInstalled === false) {        // 구매일자
              $scope.categoryName = msgLang.apps_purchase + ' ' + util.getInstalledDate(obj.purchaseDate);
            } else if(obj.installedDate.length > 0) {
              $scope.categoryName = msgLang.apps_install + ' ' + util.getInstalledDate(obj.installedDate);
            }
            $scope.displayPrice = obj.bFree ? msgLang.free : msgLang.alert_adult_4_6;
          } else {
            $scope.categoryName = obj.categoryName;
            $scope.displayPrice = obj.displayPrice;
          }
          $scope.iconColor = obj.iconColor;
          if($scope.iconColor === '#000000'){
            this.getElementsByClassName('item-thumb')[0].className += ' bg-black';
          }
          $scope.price = obj.price;
          $scope.event = obj.event;
          $scope.eventPrice = obj.eventPrice;
          $scope.displayEventPrice = obj.displayEventPrice;
          $scope.showPromotion = obj.isPromotion;
          $scope.ageType = obj.ageType;
          $scope.src = obj.img;
          // branche : display badge
          if ($scope.event === 'Y') {
            $scope.badge = msgLang.apps_event;
            if ($scope.mode === 'P') $scope.badge = $scope.badge + ', ' + msgLang.badge_package;
            $scope.showBadge = true;
          } else {
            if ($scope.mode === 'P') {
              $scope.badge = msgLang.badge_package;
              $scope.showBadge = true;
            } else {
              $scope.showBadge = false;
            }
          }
          // branche : event/price policy
          // [WOSLQEVENT-76090] Russia일때 소수점(,:쉼표)이하 절삭
          /**
           * 2015-11-13 권팀장님 요청으로 주석 처리
           */
/*          if (device.q['X-Device-Country'].toUpperCase() === 'RU') {
            var tmpPrice = '';
            if ($scope.displayPrice && $scope.displayPrice.indexOf(',') > -1) {
              tmpPrice = $scope.displayPrice.split(',')[0] + 'руб.';
              $scope.displayPrice = tmpPrice;
            }
            if ($scope.displayEventPrice && $scope.displayEventPrice.indexOf(',') > -1) {
              tmpPrice = $scope.displayEventPrice.split(',')[0] + 'руб.';
              $scope.displayEventPrice = tmpPrice;
            }
            tmpPrice = null;
          }*/
          if ($scope.event === 'Y' && ($scope.eventPrice) === 0) {
            $scope.dpPrice1 = msgLang._3d_price_free;
            $scope.dpPrice2 = $scope.displayPrice;
            $scope.eventPirceClass = 'event-price';
          } else if ($scope.event === 'Y' && ($scope.eventPrice) !== 0) {
            $scope.dpPrice1 = $scope.displayEventPrice;
            $scope.dpPrice2 = $scope.displayPrice;
            $scope.eventPirceClass = 'event-price';
          } else if ($scope.event === 'N' && ($scope.price) === 0) {
            $scope.dpPrice1 = msgLang._3d_price_free;
            $scope.dpPrice2 = '';
            $scope.eventPirceClass = '';
          } else if ($scope.event === 'N' && ($scope.price) !== 0) {
            $scope.dpPrice1 = $scope.displayPrice;
            $scope.dpPrice2 = '';
            $scope.eventPirceClass = '';
          } else {
            $scope.dpPrice1 = $scope.displayPrice;
            $scope.dpPrice2 = '';
            $scope.eventPirceClass = '';
          }
          // branche : app/promotion css
          if ($scope.showPromotion) {
            $scope.listClass = 'item-promotion';
          } else {
            $scope.listClass = 'item-apps';
          }
          $scope.hideItem = false;
        }
        //this.children[1].style.backgroundColor = '';
        clearTimeout($scope.timer);
        //if (apply)
        $scope.$digest();
      };
    }
  };
});

/*
app.directive('appThumbResizable', function() {
  var defaultAppImg = './resources/images/default_app.png';
  return {
    link: function($scope, $element) {
      // image loading failed case : display default image.
      $element.bind('error', function () {
        if ($element.parent().attr('class').indexOf('screenshot') >= 0) {
          defaultAppImg = './resources/images/default_app_games_screenshot.png';
        }
        if($element[0].src !== defaultAppImg) {
          $element[0].src = defaultAppImg;
        }
      });

      $element.bind('load', function(e) {
        $scope.$on('lazyImage', function() {
          var x, y, w, h, dstW, dstH;
          if (!$scope.hideThumb) return;

          setTimeout(function() {
            // App Item Image Size Setting
            dstW = 130;
            dstH = 130;
            // promotion item case : image size re-setting
            if ($element.parent().parent().attr('class').indexOf('item-promotion') >= 0) {
              dstH = 337;
              dstW = 460;
            }
            // screen image case : image size re-setting
            if ($element.parent().attr('class').indexOf('screenshot') >= 0) {
              dstH = 225;
              dstW = 400;
            }
            if ($element[0].getAttribute('src') === 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=') return;
            h = parseInt($element[0].naturalHeight * dstW / $element[0].naturalWidth);
            if ($element[0].naturalHeight === $element[0].naturalWidth) {
              h = dstH;
              w = dstH;
              y = 0;
              x = parseInt((dstW - w) / 2);
            } else if (h > dstH) {
              w = dstW;
              x = 0;
              y = parseInt((dstH - h) / 2);
            } else {
              w = parseInt($element[0].naturalWidth * dstH / $element[0].naturalHeight);
              h = dstH;
              x = parseInt((dstW - w) / 2);
              y = 0;
            }
            $element[0].style.width = w + 'px';
            $element[0].style.height = h + 'px';
            $element[0].style.left = x + 'px';
            $element[0].style.top = y + 'px';
            if ($element[0].parentElement.getAttribute('data-color') !==  '') {
              $element[0].parentElement.style.backgroundColor = $scope.iconColor;
            }
            if ($scope.hideThumb) {
              $scope.hideThumb = false;
              $scope.$apply();
            }
          }, 10);
        });
      });
    }
  }
});*/
