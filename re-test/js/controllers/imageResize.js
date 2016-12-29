app.directive('imageResize', function(device) {
  return {
    link: function($scope, $element) {
      // image loading failed case : display default image.
      $element[0].style.opacity = 0;
      var onUnregisterFunc;

      $element.bind('error', function () {
        var defaultImageArray = {
            'TS': './resources/images/thumb/default_tvshow_280x410.png',
            'MV': './resources/images/thumb/default_movie_280x410.png',
            'APP': './resources/images/thumb/default_app.png',
            'APR': './resources/images/thumb/app&games_default_promotion.png',
            'SC': './resources/images/thumb/app&games_default_screenshot.png',
            'PT': './resources/images/thumb/default_photo.png',
            'VD': './resources/images/thumb/default_video.png'
          }
        ;
        var defaultImgType = $element[0].getAttribute('d-img-type');
        if($element[0].src !== defaultImageArray[defaultImgType]) {
          $element[0].src = defaultImageArray[defaultImgType];
          $scope.$digest();
        }
      });

      $scope.imageResize = function() {
        if ($element[0].style.opacity === 1)
          return;

        var w, h, areaW, areaH, imgW, imgH, rate;

        // App Item Image Size Setting
        areaW = $element.parent()[0].clientWidth;
        areaH = $element.parent()[0].clientHeight;
        imgW = $element[0].naturalWidth;
        imgH = $element[0].naturalHeight;
        w = null;
        h = parseInt(imgH * areaW / imgW, 10);
        rate = (h / areaH).toFixed(2);

        if (isNaN(rate)) {
          // WEBOSDEFEC-14022, WEBOSDEFEC-14023
          return;
        } else if (rate < 0.8) {
          w = areaW;
          h = null;
        } else if (rate > 1.2) {
          h = areaH;
        } else {
          w = areaW;
          h = areaH;
        }

        if (!w && !h) {
          w = $element[0].style.width;
          h = $element[0].style.height;
        }

        if (w) {
          $element[0].style.width = w + 'px';
        } else {
          // WEBOSDEFEC-14022, WEBOSDEFEC-14023
          $element[0].style.width = '';
        }
        if (h) {
          $element[0].style.height = h + 'px';
        } else {
          // WEBOSDEFEC-14022, WEBOSDEFEC-14023
          $element[0].style.height = '';
        }
        $element[0].style.opacity = 1;

        // console.log('imageResize.image_resize_func, src=' + $element[0].src);
      };

      $element.bind('load', function(e) {
        // lite ver check
        if (device.isLite) {
          //image_resize_func();
          //WOSLQEVENT-51735 이슈처리 타임아웃 50 추가
          setTimeout($scope.imageResize(), 300);
          return;
        }

        if (onUnregisterFunc) {
          onUnregisterFunc();
          onUnregisterFunc = undefined;
        }
        onUnregisterFunc = $scope.$on('lazyImage', function() {
          // console.log('imageResize.load, on lazyImage, src=' + $element[0].src);

          if ($element[0].style.opacity === 1)
            return;

          setTimeout($scope.imageResize(), 10);
        });

        // parent에서 lazyImage가 이미 호출된 경우
        var showImage;
        var parent = $scope.$parent;
        while (parent) {
          if (parent.getShowAllImage) {
            showImage = parent.getShowAllImage();
            if (showImage) {
              $scope.imageResize();
              return;
            }
            break;
          }

          parent = parent.$parent;
        }

        // deepLink 타고 들어온 경우
        if ($scope.getShowAllImage) {
          showImage = $scope.getShowAllImage();
          if (showImage) {
            $scope.imageResize();
            return;
          }
        }

        // console.log('imageResize.load, src=' + $element[0].src + ', showImage=' + showImage);

        $element[0].style.opacity = 0;
      });
    }
  };
});

app.directive('imageLoader', function(device) {
  return {
    link: function($scope, $element) {
      $element.bind('error', function () {
        var defaultImageArray = {
            'TS': './resources/images/thumb/default_tvshow_280x410.png',
            'MV': './resources/images/thumb/default_movie_280x410.png',
            'APP': './resources/images/thumb/default_app.png',
            'APR': './resources/images/thumb/app&games_default_promotion.png',
            'SC': './resources/images/thumb/app&games_default_screenshot.png',
            'PT': './resources/images/thumb/default_photo.png',
            'VD': './resources/images/thumb/default_video.png'
          }
        ;
        var defaultImgType = $element[0].getAttribute('d-img-type');
        if($element[0].src !== defaultImageArray[defaultImgType]) {
          $element[0].src = defaultImageArray[defaultImgType];
          $scope.$digest();
        }
      });
    }
  };
});