app.directive('listItem', function() {
  return {
    restrict: 'A',
    scope: {},
    replace: true,
    template: listItemTmpl,
    link: function($scope, $element) {
      $element[0].update = function(obj, apply) {
        var defaultImgData = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        this.getElementsByClassName('thumb-img')[0].style.opacity = 0;
        if (obj == null) {
          this.getElementsByClassName('thumb-img')[0].setAttribute('src', defaultImgData);
          $scope.id = '';
          $scope.type = '';
          $scope.name = '';
          $scope.src = defaultImgData;
          $scope.img = '';
          $scope.itemOverIconCode = '';
          $scope.hideItem = true;
          $scope.$apply();
        } else {
          //this.getElementsByClassName('thumb-img')[0].setAttribute('src', defaultImgData);
          $scope.id = obj.id;
          $scope.type = obj.contsType;
          $scope.name = obj.name;
          $scope.src = obj.img;
          if(obj.execCpList) {
            $scope.execCpList = obj.execCpList;
          }
          $scope.itemOverIconCode = obj.itemOverIconCode;
          if(typeof $scope.itemOverIconCode != 'undefined') $scope.badge = msgLang.tvshow_badge_youmaylike;// TODO tier1.5 cp 정보 등 노출 정보 변경 예정

          var s = parseFloat(obj.score);
          if (!isNaN(s) && (s > 0)) {
            $scope.hideScore = false;
            $scope.scoreStyle = {width: parseInt(obj.score * 10) + '%'};
            //$element[0].style.height = '500px';
          } else {
            $scope.hideScore = true;
            $scope.scoreStyle = {};
            //$element[0].style.height = '466px';
          }

          $scope.hideItem = false;
        }
        clearTimeout($scope.timer);
        //if (apply)
        $scope.$digest();
      };
    }
  };
});

/*
app.directive('thumbResizable', function() {
  return {
    link: function($scope, $element) {
      $element.bind('error', function (e) {
        $scope.posterURL = './resources/images/default_cast.png';
      });
      $element.bind('load', function(e) {
        $scope.$on('lazyImage', function() {
          if (!$scope.hideThumb) return;

          if($element[0].getAttribute('img') == null) {
            $scope.src = $scope.img;
            $scope.img = '';
          } else {
            $element[0].src = $element[0].getAttribute('img');
          }
          $scope.$apply();

          var x, y, w, h, dstW, dstH, imgH, imgW;
          x = 0;
          y = 0;

          setTimeout(function() {
            imgH = $element[0].naturalHeight;
            imgW = $element[0].naturalWidth;

            if($element.hasClass('list-poster')) {
              if ($element[0].getAttribute('src') == 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=') return;
              h = parseInt(imgH * 280 / imgW);
              if (h >= 410) {
                w = 280;
                y = parseInt((410 - h) / 2);
              } else {
                w = parseInt(imgW * 410 / imgH);
                h = 410;
                x = parseInt((280 - w) / 2);
              }
            } else if ($element.hasClass('detail-poster')) {
              dstW = 430;
              dstH = 630;

              h = parseInt(imgH * dstW / imgW);
              if (h >= dstH) {
                w = dstW;
                y = parseInt((dstH - h) / 2);
              } else {
                w = parseInt(imgW * dstH / imgH);
                h = dstH;
                x = parseInt((dstW - w) / 2);
              }
            } else if ($element.hasClass('detail-item-actor')) {
              dstW = 203;
              dstH = 298;

              h = parseInt(imgH * dstW / imgW);
              if (h >= dstH) {
                h = dstH;
                w = parseInt(imgW * dstH / imgH);
                if (w < dstW) {
                  x = parseInt((dstW - w) / 2);
                }
              } else {
                w = dstW;
                y = parseInt((dstH - h) / 2);
              }
            } else if ($element.hasClass('detail-photo-poster')) {
              var dstH = 230;
              var dstW = 305;

              h = parseInt(imgH * dstW / imgW);
              if (h >= dstH) {
                h = dstH;
                w = parseInt(imgW * dstH / imgH);
                if (w < dstW) {
                  x = parseInt((dstW - w) / 2);
                }
              } else {
                w = dstW;
                if(h < dstH) {
                  y = parseInt((dstH - h) / 2);
                }
              }
            } else if ($element.hasClass('detail-item-recommend')) {
              dstW = 203;
              dstH = 298;

              h = parseInt(imgH * dstW / imgW);
              if (h >= dstH) {
                w = dstW;
                y = parseInt((dstH - h) / 2);
              } else {
                w = parseInt(imgW * dstH / imgH);
                h = dstH;
                x = parseInt((dstW - w) / 2);
              }
            }

            $element[0].style.width = w + 'px';
            $element[0].style.height = h + 'px';
            $element[0].style.left = x + 'px';
            $element[0].style.top = y + 'px';
            if($scope.hideThumb) {
              $scope.hideThumb = false;
              $scope.$apply();
            }
          },10);
        });
      });
    }
  };
});*/
