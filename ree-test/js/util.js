var discoveryUtil = angular.module('discoveryUtil', ['discoveryVariable']);

discoveryUtil.service('util', function(headers, device) {
  this.copyObject = function(dst, src) {
    if ((!this.isObject(dst) && !this.isArray(dst)) || (!this.isObject(src) && !this.isArray(src))) return;
    for (var p in src) {
      if (this.isObject(src[p])) {
        dst[p] = {};
        this.copyObject(dst[p], src[p]);
      } else if (this.isArray(src[p])) {
        dst[p] = [];
        this.copyObject(dst[p], src[p]);
      } else {
        dst[p] = src[p];
      }
    }
  };

  this.isObject = function(obj) {
    return (Object.prototype.toString.call(obj) == '[object Object]') ? true : false;
  };

  this.isArray = function(obj) {
    return (Object.prototype.toString.call(obj) == '[object Array]') ? true : false;
  };

  this.async = function(func) {
    if (!device.isLite) {
      setTimeout(func, 1);
    } else {
      setTimeout(func, 200); // The lite version has no animation!
    }
  };

  this.createUUID = function() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";

    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }

    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    return s.join("");
  };

  this.turkishToUpper = function(turkishStr){
    //var letters = { "i": "?", "?": "?", "?": "?", "u": "U", "o": "O", "c": "C", "ı": "I" };
    //turkishStr = turkishStr.replace(/(([iı??uco]))/g, function(letter){ return letters[letter]; });
    //[WEBOSLOCAL-2836] 터키어 대문자 변경 로직 수정(터키어 소문자 i가 해당 로직으로 인해 ? 로 보이는 이슈) (WEB OS 2.0에서 가지고옴.)
    var letters = { "i": "İ", "ş": "Ş", "ğ": "Ğ", "ü": "Ü", "ö": "Ö", "ç": "Ç", "ı": "I" };
    turkishStr = turkishStr.replace(/(([iışğüçö]))/g, function(letter){ return letters[letter]; });
    return turkishStr.toUpperCase();
  };

  this.getZeroString = function(n, digits) {
    var zero = '';
    n = n.toString();
    if (n.length < digits) {
      for(var i=0; i<digits-n.length; i++) {
        zero += '0';
      }
    }
    return zero + n;
  };

  this.gregorianFun = {
    PERSIAN_EPOCH : 1948320.5,
    GREGORIAN_EPOCH : 1721425.5,
    //, PERSIAN_WEEKDAYS_EN : ["Yekshanbeh", "Doshanbeh", "Seshhanbeh", "Chaharshanbeh", "Panjshanbeh", "Jomeh", "Shanbeh"]
    //, PERSIAN_WEEKDAYS_FA : ["??????", "??????", "?? ????", "????????", "???????", "????", "????"]
    //, GREGORIAN_WEEKDAYS_EN : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    //, PERSIAN_MONTHS_FA : ["???????", "????????", "?????", "???", "?????", "??????", "???", "????", "???", "??", "????", "?????"]
    //, PERSIAN_MONTHS_EN : ["Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar", "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"]
    //, GREGORIAN_MONTHS_EN : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    //, GREGORIAN_MONTHS_FA : ["??????", "?????", "????", "?????", "??", "????", "?????", "???", "???????", "?????", "??????", "??????"]
    changePersian : function (yearVal, monthVal, dayVal) {
      if (headers['X-Device-Language'] === 'fa-IR') {
        var jd = gregorianFun.gregorian_to_jd(yearVal, monthVal, dayVal);
        var persian = gregorianFun.jd_to_persian(jd);
        return persian;
      } else {
        return [yearVal, monthVal, dayVal];
      }
    },
    changePersianYear : function (yearVal) {
      return gregorianFun.changePersian(yearVal, 1, 1)[0];
    },
    gregorian_to_jd : function (year, month, day) {
      return (gregorianFun.GREGORIAN_EPOCH - 1)
        + (365 * (year - 1))
        + Math.floor((year - 1) / 4)
        + (-Math.floor((year - 1) / 100))
        + Math.floor((year - 1) / 400)
        + Math.floor((((367 * month) - 362) / 12) + ((month <= 2) ? 0 : (gregorianFun.leap_gregorian(year) ? -1 : -2)) + day)
        ;
    },
    persian_to_jd : function (year, month, day) {
      var epbase, epyear;
      epbase = year - ((year >= 0) ? 474 : 473);
      epyear = 474 + gregorianFun.mod(epbase, 2820);
      return day
        + ((month <= 7) ? ((month - 1) * 31) : (((month - 1) * 30) + 6))
        + Math.floor(((epyear * 682) - 110) / 2816)
        + (epyear - 1) * 365
        + Math.floor(epbase / 2820) * 1029983
        + (gregorianFun.PERSIAN_EPOCH - 1);
    },
    jd_to_persian : function (jd) {
      var year, month, day, depoch, cycle, cyear, ycycle, aux1, aux2, yday;

      jd = Math.floor(jd) + 0.5;

      depoch = jd - gregorianFun.persian_to_jd(475, 1, 1);
      cycle = Math.floor(depoch / 1029983);
      cyear = gregorianFun.mod(depoch, 1029983);
      if (cyear == 1029982) {
        ycycle = 2820;
      } else {
        aux1 = Math.floor(cyear / 366);
        aux2 = gregorianFun.mod(cyear, 366);
        ycycle = Math.floor(((2134 * aux1) + (2816 * aux2) + 2815) / 1028522) + aux1 + 1;
      }
      year = ycycle + (2820 * cycle) + 474;
      if (year <= 0) {
        year--;
      }
      yday = (jd - gregorianFun.persian_to_jd(year, 1, 1)) + 1;
      month = (yday <= 186) ? Math.ceil(yday / 31) : Math.ceil((yday - 6) / 30);
      day = (jd - gregorianFun.persian_to_jd(year, month, 1)) + 1;
      return new Array(year, month, day);
    },
    jd_to_gregorian : function(jd) {
      var wjd, depoch, quadricent, dqc, cent, dcent, quad, dquad, yindex, dyindex, year, yearday, leapadj;

      wjd = Math.floor(jd - 0.5) + 0.5;
      depoch = wjd - gregorianFun.GREGORIAN_EPOCH;
      quadricent = Math.floor(depoch / 146097);
      dqc = gregorianFun.mod(depoch, 146097);
      cent = Math.floor(dqc / 36524);
      dcent = gregorianFun.mod(dqc, 36524);
      quad = Math.floor(dcent / 1461);
      dquad = gregorianFun.mod(dcent, 1461);
      yindex = Math.floor(dquad / 365);
      year = (quadricent * 400) + (cent * 100) + (quad * 4) + yindex;
      if (!((cent == 4) || (yindex == 4))) {
        year++;
      }
      yearday = wjd - gregorianFun.gregorian_to_jd(year, 1, 1);
      leapadj = ((wjd < gregorianFun.gregorian_to_jd(year, 3, 1)) ? 0 : (gregorianFun.leap_gregorian(year) ? 1 : 2));
      month = Math.floor((((yearday + leapadj) * 12) + 373) / 367);
      day = (wjd - gregorianFun.gregorian_to_jd(year, month, 1)) + 1;

      return new Array(year, month, day);
    },
    mod : function(a, b) {
      return a - (b * Math.floor(a / b));
    },
    jwday : function(j) {
      return gregorianFun.mod(Math.floor((j + 1.5)), 7);
    },
    leap_gregorian : function(year) {
      return ((year % 4) == 0) && (!(((year % 100) == 0) && ((year % 400) != 0)));
    }
  };

  /**
   * @description Recent History 국가에 따른 날짜 표시(MY Page)
   *                  한국 : YY/MM/DD
   *                  기타 : DD/MM/YY
   *                  fa-IR : YYYY/MM/DD
   * @param inUsedDate
   * @returns {*}
   * @used myPage1Depth.js
   */
  this.getSvrLocaleDate = function(inUsedDate){
    var dateTmp, changedateTmp, formatdate;

    if (!inUsedDate) return;

    if (headers['X-Device-Language'] === 'fa-IR') {
      changedateTmp = gregorianFun.changePersian(Number(inUsedDate.substring(0, 4)), Number(inUsedDate.substring(4, 6)), Number(inUsedDate.substring(6, 8)));
      dateTmp = changedateTmp[0] + "/" + changedateTmp[1] + "/" + changedateTmp[2];
    } else {
      formatdate = device.dateformat;
      dateTmp = formatdate.replace('YYYY', inUsedDate.substring(0, 4));
      dateTmp = dateTmp.replace('MM', inUsedDate.substring(4, 6));
      dateTmp = dateTmp.replace('DD', inUsedDate.substring(6, 8));
      dateTmp = dateTmp.replace(/-/gi, '/');

      var idxYY = formatdate.indexOf("YYYY");
      var indexOff = idxYY +4;
      var yyStr = dateTmp.substring(idxYY, indexOff );
      var idxYY2  =  idxYY +2;
      var yyStr2 = dateTmp.substring(idxYY2, indexOff );

      dateTmp = dateTmp.replace(yyStr, yyStr2);
    }
    return dateTmp;
  };

  /**
   * @description Guide Page 번역언어 관련 노출
   * @param srcStr
   * @param type
   * @returns {*}
   */
  this.guideReplace = function(srcStr, type) {
    if (type === 1) {
      endPos = srcStr.indexOf('<br>');
      if (endPos > 0) {
        return srcStr.substring(0, endPos ).replace('<br>', ' ');
      } else {
        return '';
      }
    } else {
      endPos = srcStr.indexOf('<br>');
      if (endPos > 0) {
        return srcStr.substring(endPos).replace('<br>', '');
      } else {
        return srcStr;
      }
    }
  };

  /**
   * @description 국가에 따른 App 설치일자 표시
   * @param inUsedDate
   * @returns {*}
   * @used myPage1Depth,js myPage2Depth.js
   */
  this.getInstalledDate = function(inUsedDate) {
    var dateTmp;

    if(!inUsedDate) return;

    dateTmp = inUsedDate.replace(/-/gi,'/');
//    var idxYY = device.dateformat.indexOf("YYYY");
//    var indexOff = idxYY + 4;
//    var yyStr = dateTmp.substring(idxYY, indexOff );
//    var idxYY2 = idxYY + 2;
//    var yyStr2 = dateTmp.substring(idxYY2, indexOff );
//
//    dateTmp = dateTmp.replace(yyStr, yyStr2);
    return dateTmp;
  };

  /**
   * @description string과 boolean type에 관계없이  true/false 판단
   * @param sourceValue
   * @returns {boolean}
   */
  this.parseBoolean = function (sourceValue) {
    sourceValue = '' + sourceValue;
    if('y' === sourceValue.toLowerCase()) {
      return true;
    } else {
      return (sourceValue).toLowerCase() === 'true';
    }
  };

  /**
   * @description
   * @param plainText
   * @returns {*|string}
   */
  this.md5 = function (plainText) {
    return CryptoJS.MD5(plainText).toString();
  };

  this.rtlPattern = function(str) {
    var rtlStr = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE\u0590-\u05FF\uFB1D-\uFB4F]/;
    return rtlStr.test(str);
  };

  this.rtlClassChange = function(str) {
    var textTagAry = undefined;
    textTagAry = document.getElementsByClassName(str);
    if (textTagAry.length !== 0) {
      for (var k=0;k<textTagAry.length;k++) {
        var target = textTagAry[k];
        var englishOnly = false;
        englishOnly = !this.rtlPattern(target.textContent);
        if (englishOnly) {
          target.classList.add('dir-ltr');
        }
      }
    }
  };

  /**
   * @description 아이템별 conts_exec_contents_set 값을 받아 avaiableCplist에서 url과 color를 리턴한다.
   * @param contentsSet
   * @returns {{result}}
   */
  this.cpInfo = function(contentsSet) {
    // console.log('util.cpInfo, contentsSet=' + JSON.stringify(contentsSet));
    var filterObj = [], result = {};
    if (device.availableCpList &&
      device.availableCpList.app_count > 0 &&
      device.availableCpList.appInfo) {
      filterObj =  device.availableCpList.appInfo.filter(function(value) {
        // WOSLQEVENT-57418, WOSLQEVENT-57256 : return문에 에러발생. 해당 값이 없을 경우 추가
        if (contentsSet && value.contents_set_id) {
          return (contentsSet.indexOf(value.contents_set_id) !== -1);
        }
      });

      var len = filterObj.length;
      var url = [], color = [];
      for (var i = 0; i < len; i++) {
        url.push(filterObj[i].app_icon_url);
        color.push(filterObj[i].app_icon_color);
      }
      result = {
        iconUrl : url,
        iconColor : color
      };
    }
    return result;
  };

  // device.availableCpList의 순서로 sort
  this.cpSortAsString = function(cpString) {
    // console.log('util.cpSortAsString begin, cpString=' + cpString);
    var sortedList = this.cpSortAsArray(cpString.split('|'));
    return sortedList.join('|');
  };

  // device.availableCpList의 순서로 sort
  this.cpSortAsArray = function(cpItems) {
    // console.log('util.cpSortAsArray begin, cpItems=' + JSON.stringify(cpItems));

    var sortedList = [];

    if (!device.availableCpList ||
      device.availableCpList.app_count < 1 ||
      !device.availableCpList.appInfo) {
      return cpItems;
    }
    if (!cpItems || cpItems.length < 2) {
      // 비어 있거나 하나만 있는 경우
      return cpItems;
    }

    for (var i = 0 ; i < device.availableCpList.appInfo.length ; i++) {
      for (var j = 0 ; j < cpItems.length ; j++) {
        if (device.availableCpList.appInfo[i].contents_set_id === cpItems[j]) {
          sortedList.push(cpItems[j]);
          break;
        }
      }
      if (sortedList.length === cpItems.length) {
        // sort 종료
        break;
      }
    }

    // console.log('util.cpSortAsArray end, sortedList=' + sortedList.join('|'));

    return sortedList;
  };

  this.cpSortAsObject = function(cpArray, item) {
    // console.log('util.cpSortAsObject begin, sortedList=' + JSON.stringify(cpArray));
    var sortedList = [];

    if (!device.availableCpList ||
      device.availableCpList.app_count < 1 ||
      !device.availableCpList.appInfo) {
      return cpArray;
    }
    if (!cpArray || cpArray.length < 2) {
      // 비어 있거나 하나만 있는 경우
      return cpArray;
    }

    for (var i = 0 ; i < device.availableCpList.appInfo.length ; i++) {
      for (var j = 0 ; j < cpArray.length ; j++) {
        var cpId = cpArray[j][item].split('|')[0];
        if (device.availableCpList.appInfo[i].contents_set_id === cpId) {
          sortedList.push(cpArray[j]);
          break;
        }
      }
      if (sortedList.length === cpArray.length) {
        // sort 종료
        break;
      }
    }

    // console.log('util.cpSortAsObject end, sortedList=' + JSON.stringify(sortedList));

    return sortedList;
  };

  this.showErrorMessage = function(e) {
    var isLog = true;

    if (isLog) {
      return e.stack;
    } else {
      return '';
    }
  };

  this.isAWSServer = function() {
    return true;
    /*var server = device.q['HOST'];
    if(server && server.indexOf('qt') !== -1){
      return true;
    }else{
      return false;
    }*/
  };
});
