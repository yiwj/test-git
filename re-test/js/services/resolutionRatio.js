discoveryService.service('resolutionRatio', function($rootScope, device) {
  var RESOLUTION = "16:9";
  var ratio = screen.width / screen.height;

  var ratio_21_lg = 64/27;
  var ratio_16 = 16/9;
  var ratio_22 = 22/9;
  var ratio_20 = 20/9;

  this.call = function() {
    if (ratio == ratio_21_lg) {
      RESOLUTION = '21:9';
    } else if (ratio == ratio_16) {
      RESOLUTION = '16:9';
    } else {
      console.info("Unknown ratio: " + screen.width +"/"+ screen.height);
      if (ratio>ratio_20 && ratio<ratio_22) {
        RESOLUTION = '21:9';
      }
    }

    if ( window.innerWidth < 1300 ) {
      // TODO : lite버전 어떻게 처리할 것인가 협의 후
      RESOLUTION += "L";
      console.log("Lite version : " + RESOLUTION);
    }
    device.resolutionRatio = RESOLUTION.split('L')[0];
  };
});