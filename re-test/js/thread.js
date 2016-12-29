var handler = {};
var host = '';
var eventKey;

var handleMessage = function(e) {
  var command = e.data.cmd;
  var params = e.data.params;

  if (!command || !handler[command]) {
    self.postMessage({cmd: 'error', params: ['Invalid Command']});
    return;
  }

  handler[command](params);
};

self.addEventListener("message", handleMessage, false);

handler.setHost = function(args) {
  host = args[0] + '//' + args[1];
  eventKey = args[2];
};

// @TODO : 임시용 cplist api 나올때 까지
handler.MyPage = function(args) {
  var request = {};
  var apiID = args[0];
  request.method = 'post';
  request.api = '/discovery/mypage/myapps';
  request.headers = args[1];
  request.apiAppStoreVersion = 'v8.0';
  request.deviceInfo = {};
  request.apiLocal = apiID;
  if (args[2]) request.payload = args[2];
  return requestList('mypage', 'MyPage', apiID, request);
};

handler.MyPageMenu = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var rank = args[0].replace('MP00', '');
  var category = args[1];
  request.method = 'get';
  request.api = '/discovery/category/myPageMenu';
  request.headers = args[2];
  request.deviceInfo = {};
//  if (host.indexOf('lgappstv.com') < 0) {
//    http.open('GET', '../../resources/assets/MyPageMenu.json', true);
//  } else {
//    http.open('POST', host, true);
//  }
  http.open('GET', '../../resources/assets/MyPageMenu.json', true);
  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var jsonObj = JSON.parse(http.responseText);
        var result = {
          menuList: [], filterList: []
        };
        try {
          parseAppMenuList(result.menuList, jsonObj.appstoreApps.rankTypeList, rank, args[2].TierType);
          parseAppFilterList(result.filterList, jsonObj.appstoreApps.categoryList, category);
        } catch (e) {}
        self.postMessage({cmd: 'MyPageMenu', params: [result]});
      }
    }
  };
  http.send(JSON.stringify(request));
};

handler.MyPageCpList = function(args) {
  var http = new XMLHttpRequest();
  var request = {};
  var apiID = args[0];

  request.method = 'post';
  request.api = '/discovery2016/cp-list';
  request.apiAppStoreVersion = 'v8.0';
  request.headers = args[1];
  request.deviceInfo = {};
  if (host.indexOf('lgappstv.com') < 0) request.apiLocal = apiID;
  if (args[2]) request.payload = args[2];

  return requestList('mypage', 'MyPage', apiID, request);
};

function parseMenuList(dst, src) {
  var i, l;

  try {
    l = src.length;
    for (i = 0; i < l; i++) {
      dst[i] = {};
      dst[i].selected = src[i]['@selected'];
      dst[i].name = src[i].name;
      dst[i].code = src[i].code;
    }
  } catch (e) {}
}

function parseItemList(dst, src) {
  var i, l;

  try {
    l = src.length;
    for (i = 0; i < l; i++) {
      dst[i] = {};

      // WOSLQEVENT-65469
      if (src[i].conts_epsd_name && src[i].conts_epsd_name.length > 0) {
        dst[i].name = src[i].conts_epsd_name;
      } else {
        dst[i].name = src[i].item_name;
      }

      if (src[i]['@type'] == 'SPLIT') {
        dst[i].type = 'split';
      } else {
        dst[i].id = src[i].item_id;
        dst[i].img = src[i].item_img;
        dst[i].contsType = src[i].conts_type;
        dst[i].itemOverIconCode = src[i].item_over_icon_code;
        if (src[i].conts_exec_contents_set) dst[i].execCpList = src[i].conts_exec_contents_set.split('|');
        if (src[i].item_rated_score) dst[i].score = src[i].item_rated_score;
      }
    }
  } catch (e) {}
}

function parseFilterList(dst, src) {
  var i, j, l, m, arr;

  try {
    l = src.length;
    for (i = 0; i < l; i++) {
      dst[i] = {};
      dst[i].key = src[i].key;
      dst[i].values = [];
      arr = src[i].values;
      m = arr.length;
      for (j = 0; j < m; j++) {
        dst[i].values[j] = {};
        dst[i].values[j].selected = arr[j]['@selected'];
        dst[i].values[j].code = arr[j].code;
        dst[i].values[j].name = arr[j].name;
      }
    }
  } catch (e) {}
}

function parseAppMenuList(dst, src, rank, tierType) {
  var i, l, k=-1;
  try {
    l = src.length;
    for (i = 0; i < l; i++) {
      if(tierType < 2 || src[i].tierType >= tierType) {
        k++;
        dst[k] = {};
        dst[k].selected = src[i]['@selected'];
        dst[k].name = src[i].name;

        if(src[i].menuType) {
          dst[k].menuType = src[i].menuType;
        } else {
          dst[k].menuType = '';
        }

        if(src[i].subId) {
          dst[k].subId = src[i].subId;

          dst[k].code = src[i].id.toString() + '_' + src[i].subId.toString();
        } else {
          dst[k].code = src[i].id.toString();
        }

        if (dst[k].code == rank) {
          dst[k].selected = 'TRUE';
        } else {
          dst[k].selected = 'FALSE';
        }
      }
    }
  } catch (e) {}
}

function parseAppList(dst, src, index) {
  var i, l, k;
  try {
    l = src.length;
    k = dst.length;
    // 스크롤시 아이템을 추가할 경우가 아니면 첫번째 shelter 생성
    if (index == 0 && l > 0) {
      dst[k] = {};
      dst[k].type = 'split';
      dst[k].name = '';
      dst[k].firstSplit = true;
      dst[k].showPromotion = false;
      k = k + 1;
    }
    for (i = 0; i < l; i++) {
      dst[i + k] = {};
      dst[i + k].type = 'app';
      dst[i + k].name = src[i].name;
      dst[i + k].id = src[i].id;
      dst[i + k].img = src[i].iconURL;
      dst[i + k].iconColor = src[i].iconColor;
      dst[i + k].categoryName = src[i].categoryName;
      dst[i + k].categoryId = src[i].categoryId;
      dst[i + k].currencyCode = src[i].currencyCode;
      dst[i + k].price = src[i].price;
      dst[i + k].displayPrice = src[i].displayPrice;
      dst[i + k].event = src[i].event;
      dst[i + k].eventPrice = src[i].eventPrice;
      dst[i + k].displayEventPrice = src[i].displayEventPrice;
      dst[i + k].evaluationAverage = src[i].evaluationAverage;
      //2017년향 스크린샷 추가
      dst[i + k].previewURL = src[i].previewURL;
      dst[i + k].ageType = src[i].ageType;
      dst[i + k].mode = src[i].type;
      dst[i + k].bItem = src[i].bItem;
      dst[i + k].isPromotion = false;
    }
  } catch (e) {}
}

function parseMyPageList(dst, src) {
  var i, l, splitDate = '', yyyymmdd;
  // @TODO src가 날짜별로 정렬

  if (src) src = sortByKey(src, 'item_last_use_date');

  try {
    l=0;
    for (i = 0; i < src.length; i++) {
      dst[l] = {};

      yyyymmdd = src[i].item_last_use_date.substring(0, 8);
      if(splitDate != yyyymmdd) {
        splitDate = yyyymmdd;
        dst[l].type = 'split';
        dst[l].name = splitDate;
        l++;
        dst[l] = {};
      }

      dst[l].name = src[i].item_name;
      dst[l].id = src[i].item_id;
      dst[l].img = src[i].item_img;
      dst[l].categoryName = src[i].category_name;
      dst[l].contsType = src[i].conts_type;
      if (src[i].item_rated_score) dst[l].score = src[i].item_rated_score;
      l++;
    }
  } catch (e) {}
}

function parseMyPagePremiumList(dst, src) {
  var i, l, splitDate = '', yyyymmdd, obj;

  // @TODO src가 날짜별로 정렬
  src = sortByKey(src, 'item_last_use_date');

  try {
    l = -1;
    for (i = 0; i < src.length; i++) {
      yyyymmdd = src[i].item_last_use_date.substring(0, 8);
      if(splitDate != yyyymmdd) {
        splitDate = yyyymmdd;

        l++;
        dst[l] = {};
        dst[l].date = splitDate;
        dst[l].apps = [];
      }

      obj = {};
      obj = {
        name: src[i].item_name,
        id: src[i].item_id,
        img: src[i].item_img,

        categoryName: src[i].categoryName,
        iconURL: src[i].iconURL,
        iconColor: src[i].iconColor
      };
      if (src[i].item_rated_score)
        obj.score = src[i].item_rated_score;

      dst[l].apps.push(obj);
    }
  } catch (e) {}
}

function parsePromotionList(dst, src) {
  var i, j, k, l, m;
  try {
    l = src.length;
    k = 0;
    for (i = 0; i < l; i++) {
      dst[k] = {};
      dst[k].type = 'split';
      dst[k].name = src[i].promotionName;
      m = src[i].promotionAppCount;
      k++;
      for (j = 0; j < m; j++) {
        dst[k] = {};
        dst[k].img = src[i].promotionAppList[j].bannerURL;
        dst[k].id = src[i].promotionAppList[j].id;
        dst[k].type = src[i].promotionAppList[j].type;
        dst[k].isPromotion = true;
        k++;
      }
    }
  } catch (e) {}
}

function parseAppFilterList(dst, src, category) {
  var i, l;
  try {
    l = src.length;
    dst[0] = {};
    dst[0].key = 'FILTER_CATEGORY';
    dst[0].values = [];
    for (i = 0; i < l; i++) {
      dst[0].values[i] = {};
      dst[0].values[i].name = src[i].name;
      dst[0].values[i].code = src[i].id;
      if (src[i].id == category) {
        dst[0].values[i].selected = 'TRUE';
      } else {
        dst[0].values[i].selected = 'FALSE';
      }
    }
  } catch (e) {}
}

function toArrayList(dst, jsonObj) {
  var obj, i=0, j=0;

  while(jsonObj[i]) {
    obj = jsonObj[i];
    dst[j] = {};
    dst[j].item_name = obj.itemName;
    dst[j].item_id = obj.itemId;
    dst[j].item_img = obj.itemImg;
    dst[j].category_name = obj.categoryName;
    dst[j].item_last_use_date = obj.item_last_use_date;

    dst[j].categoryName = obj.categoryName;
    dst[j].iconURL = obj.iconURL;
    dst[j].iconColor = obj.iconColor;

    i++;
    j++;
  }

  return i;
}

function requestList(scope, command, apiID, request) {
  var startIndex, http = new XMLHttpRequest();
  if (host.indexOf('lgappstv.com') < 0) {
    switch (scope) {
      case 'tvshows':
        apiID = 'TS' + apiID;
        break;
      case 'movies':
        apiID = 'MV' + apiID;
        break;
      case 'appsngames':
        apiID = 'AG' + apiID;
        //app&game의 경우 startIndex를 api에서 넘겨오지 않으므로, 최초 요청시에 데이타로 대체?
        startIndex = request.payload ? (request.payload.index > 0 ? request.payload.index : 0) : 0;
        break;
      case 'mypage':
        apiID = '' + apiID;
        //pc local서버용
        if (apiID == '0-0') {
          apiID = 'MP001000100';
        } else if(apiID =='CP') {
          apiID = 'MP002000100';
        }
        //mypage의 경우 startIndex를 api에서 넘겨오지 않으므로, 최초 요청시에 데이타로 대체?
        startIndex = request.payload ? (request.payload.index > 0 ? request.payload.index : 0) : 0;
        break;
    }
    if (request.payload) {
      if (request.payload['FILTER_FILTER']) {
        apiID += request.payload['FILTER_FILTER'];
      } else if (request.payload['FILTER_CATEGORY']) {
        apiID += request.payload['FILTER_CATEGORY'];
      } else if (request.payload['FILTER_ORDER'] && request.payload['FILTER_GENRE']) {
        apiID += request.payload['FILTER_ORDER'];
        apiID += request.payload['FILTER_GENRE'];
      }

      if (scope == 'appsngames' && startIndex > 0) apiID += startIndex;

      // submenu인 경우
      if(scope == 'mypage') {
        if (request.payload.index > 0) {
          if(request.payload.index == 1) {
            apiID = apiID + '_' + 'TS';
          } else if(request.payload.index == 2) {
            apiID = apiID + '_' + 'MOVIE';
          } else {
            apiID += request.payload.index;
          }
        }
      }
    }
    http.open('GET', '../../resources/assets/' + apiID + '.json', true);
  } else {
    http.open('POST', host, true);
  }

  http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      if (http.responseText) {
        var result = {
          scopeName: scope,
          menuList: [],
          itemList: [],
          filterList: []
        };

        var tempObj = {itemList: []};

        try {
          var jsonObj = JSON.parse(http.responseText);
          if (result.scopeName == 'appsngames') {
            if (!request.payload) {
              request.payload = request.params;
              startIndex = request.params.index;
            }
            if (jsonObj.rankType.promotionCount > 0) {
              parsePromotionList(result.itemList, jsonObj.rankType.promotionList);
            }
            parseAppList(result.itemList, jsonObj.rankType.appList, request.params.index);
            result.total = parseInt(jsonObj.rankType.totalAppCount);
            result.startIndex = startIndex;
          } else if (result.scopeName == 'mypage') {
            result.scope = scope;
            result.jsonObj = jsonObj;
          } else {
            result.total = parseInt(jsonObj.item_list['@total_item_cnt']);
            result.startIndex = parseInt(jsonObj.item_list['@start_index']) - 1;
            result.skinType = jsonObj.item_list['@skin_type'];
            parseMenuList(result.menuList, jsonObj.menu_list.menus);
            parseItemList(result.itemList, jsonObj.item_list.items);
            parseFilterList(result.filterList, jsonObj.filter_list.filters);
          }
        } catch (e) {}

        self.postMessage({cmd: command, params: [result]});
      }
    }
  };

  http.send(JSON.stringify(request));
}

var codeList = {
  '100': 100, // apps&games
  '200': 200, // premium
  '1': 26, // ETC 기타
  '2': 19, // Drama 드라마
  '3': 17, // Melodrama Romance 멜로·로맨스
  '4': 26, // SF  SF
  '5': 15, // Current Affairs/Documentary 시사/다큐
  '6': 4, // Action 액션
  '7': 14, // Animation 애니메이션
  '8': 8, // Fantasy  판타지
  '9': 12, // Adventure 어드벤처
  '10': 13, // Mystery  미스터리
  '11': 11, // Western  서부
  '12': 3, // Musical 뮤지컬
  '13': 4, // Noir  느와르
  '14': 4, // Crime 범죄
  '15': 4, // Martial Arts  무협
  '16': 25, // War  전쟁
  '17': 2, // Comedy  코미디
  '18': 3, // Music 뮤직
  '19': 9, // Biography 전기
  '20': 5, // Omnibus 옴니버스
  '21': 5, // Short Film  단편 영화
  '22': 1, // Family  가족
  '23': 21, // Sport  스포츠
  '24': 5, // Experimental Film and Video 실험영화
  '25': 19, // TV Series  TV 시리즈
  '26': 10, // 3D 3D
  '27': 5, // Silent film 무성 영화
  '28': 5, // Black and white films 흑백 영화
  '29': 16, // Adult  성인
  '30': 17, // Melodrama Romance  멜로·로맨스
  '31': 7, // CBlockbuster  블록버스터
  '32': 16, // Queer  퀴어
  '33': 9, // History and Narrative 역사·서사
  '34': 9, // Period drama  시대극
  '35': 13, // Thriller 스릴러
  '36': 13, // Detective  추리
  '37': 1, // Sitcom  시트콤
  '38': 4, // Spy 스파이
  '39': 22, // Schooldays 학원물
  '40': 13, // Horror 호러
  '41': 24, // Natural disasters  자연재해
  '42': 5, // Film  필름
  '43': 9, // History 역사
  '44': 5, // Independent Film  인디영화
  '45': 15, // International  국제
  '46': 14, // Kids 어린이
  '47': 20, // Lifestyle  생활
  '48': 6, // Promotion Content 프로모션
  '49': 19, // Reality TV 리얼리티
  '50': 23, // Science Fiction  과학
  '51': 17, // Emotional Romance  감성로맨스
  '52': 2, // Romantic Comedy 로맨틱 코메디
  '53': 2, // Black Comedy  블랙코미디
  '54': 16, // Erotic 에로
  '55': 16, // Erotic Drama 에로틱드라마
  '56': 18, // Recreation Entertainment 오락/연예
  '57': 20, // Hobby/Leisure  취미/레저
  '58': 22, // Education  교육
  '59': 15, // News 뉴스
  '60': 15, // Culture/Information  교양/정보
  '61': 6, // Shopping  홈쇼핑
  '62': 18, // talk show & Entertainment  토크쇼/예능
  '64': 15 // Mockumentary  페이크 다큐
};
var imageList = {
  '100': ['app'],
  '200': ['premiumapp'],
  '1': ['01'],
  '2': ['02_a','02_b','02_c'],
  '3': ['03'],
  '4': ['04_a', '04_b'],
  '5': ['05'],
  '6': ['06'],
  '7': ['07_a','07_b','07_c'],
  '8': ['08_a','08_b'],
  '9': ['09_a','09_b'],
  '10': ['10'],
  '11': ['11'],
  '12': ['12'],
  '13': ['13_a','13_b'],
  '14': ['14_a','14_b'],
  '15': ['15_a','15_b'],
  '16': ['16'],
  '17': ['17_a','17_b'],
  '18': ['18_a','18_b','18_c','18_d','18_e'],
  '19': ['19_a','19_b','19_c','19_d','19_e'],
  '20': ['20'],
  '21': ['21'],
  '22': ['22_a','22_b'],
  '23': ['23_a','23_b'],
  '24': ['24'],
  '25': ['25'],
  '26': ['26_a','26_b','26_c','26_d','26_e','26_f','26_g','26_h']
};

var colorList =  {
  '01' : '#2c331c',
  '02_a' : '#313337',
  '02_b' : '#11172a',
  '02_c' : '#403a25',
  '03' : '#030504',
  '04_a' : '#060f03',
  '04_b' : '#191509',
  '05' : '#120d0c',
  '06' : '#392a1e',
  '07_a' : '#25140a',
  '07_b' : '#0d0e1a',
  '07_c' : '#1d1f2e',
  '08_a' : '#333f4a',
  '08_b' : '#040308',
  '09_a' : '#060503',
  '09_b' : '#120f0d',
  '10' : '#1b0613',
  '11' : '#402403',
  '12' : '#394444',
  '13_a' : '#323b3e',
  '13_b' : '#202b29',
  '14_a' : '#212504',
  '14_b' : '#0f273b',
  '15_a' : '#313537',
  '15_b' : '#455359',
  '16' : '#44010c',
  '17_a' : '#301e0d',
  '17_b' : '#36190a',
  '18_a' : '#060103',
  '18_b' : '#1e0f13',
  '18_c' : '#0b0201',
  '18_d' : '#3e3d39',
  '18_e' : '#34444c',
  '19_a' : '#2f110a',
  '19_b' : '#222522',
  '19_c' : '#281d2e',
  '19_d' : '#142d33',
  '19_e' : '#3f3024',
  '20' : '#04272c',
  '21' : '#15200c',
  '22_a' : '#1b100a',
  '22_b' : '#0c1913',
  '23_a' : '#1a162d',
  '23_b' : '#060606',
  '24' : '#090806',
  '25' : '#080102',
  '26_a' : '#000000',
  '26_b' : '#070611',
  '26_c' : '#24070b',
  '26_d' : '#00101a',
  '26_e' : '#000a20',
  '26_f' : '#000000',
  '26_g' : '#11212c',
  '26_i' : '#110105'
};

var getGenreBgColor = function(genreId) {
  arr = imageList[codeList[genreId]];
  str = arr[0];
  try {
    return colorList[str];
  } catch(e) {
    return '';
  }
};

var getGenreImage = function(genreId) {
  var prefix = '';
  var postfix = '.png';
  var arr, str;

  //if (host.indexOf('qt') > -1) {
  //  prefix = 'https://qt2-kr.lgrecommends.lgappstv.com/gi-image/genreimage/genre_';
  //} else {
    prefix = 'http://ngfts.lge.com/fts/gftsDownload.lge?biz_code=LGSTORE&func_code=THEME_IMG&file_path=/lgstore/theme_img/genre_';
  //}

  arr = imageList[codeList[genreId]];
  str = arr[0];
  arr.push(arr.shift());

  return prefix + str + postfix;
};

/**
 * 주어진 Data Array 를 해당 Key 중심으로 정렬 한다
 * array : 정렬 대상 key : data 에서 정렬이 필요한 Key data.key 형식 사용한다
 * @description Data를 날짜순으로 정렬
 */
function sortByKey(array, key) {
  return array.sort(function(a, b) {
    var x = a[key];
    var y = b[key];
    return ((x > y) ? -1 : ((x < y) ? 1 : 0));
  });
}

/**
 * @description REST API call
 * @param args [eventId, apiUrl, payload, headers, deviceinfo]
 * @returns {*}
 */
handler.executeApi = function(args) {
  // console.log('thread.executeApi');
  var http = new XMLHttpRequest();
  var request = {};
  var eventId = '', callUrl = '';
  var scopeId = '', query = '';
  var extra, target, payObj;
  var xmlHttpTimeout;
  var response = [];

  // broadcast할 event명
  eventId = args[0];

  // 호출 URL (sadf로 call)
  callUrl = args[1];

  // 요청파라미터
  request = args[2];

  // 각 카테고리별 parsing때 필요한 데이터 포함한 데이터
  extra = args[3];
  if (args[3].scopeId) scopeId = args[3].scopeId;

  // 호출 이벤트
  response.push(eventId);

  if(request.deviceInfo.isOpenApi) {
    // OpenAPI begins
    http.open(args[2]['method'], callUrl, true); // openAPI

    target = args[2]['headers'];

    // HOST|cookie|subscribed|referer는 Header에 포함 시키지 않음, cookie의 경우는 X-Cookie로 변경하여 보냄
    for (var k in target) {
      if (target.hasOwnProperty(k)) {
        if (k !== 'HOST' && k !== 'cookie' && k !== 'subscribed' && k !== 'referer') {
          http.setRequestHeader(k, target[k]);
        } else if (k === 'cookie') {
          http.setRequestHeader('X-Cookie', target[k]);
        }
      }
    }
    http.setRequestHeader('X-Lge-AppKey', 'dd9c5815-1dfe-4de2-affa-ef85c5785304');
    http.setRequestHeader('Access-Control-Allow-Origin', '*'); // http.status = 0 추가 대응

    // OAP측에서 POST시에 querystring 형태의 값으로 변환해서 호출요청
    if (args[2]['method'].toUpperCase() === 'POST') {
      http.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
//      http.setRequestHeader('content-type', 'application/x-www-form-urlencoded charset=utf-8');
      if (request['payload'] || request['params']) {
        payObj = request['payload'] ? request['payload'] : request['params'] ;
        for ( var p in payObj) {
          if (payObj.hasOwnProperty(p)) {
            query += p;
            query += '=';
            query += encodeURIComponent(payObj[p]);
            query += '&';
          }
        }
        query = query.substring(0, query.length-1);
      }
    } else { // 'GET'
      http.setRequestHeader('content-type', 'application/json');
    }
    // end of OpenAPI
  } else {
    http.open('POST', callUrl, true); // sadf2
    http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8'); // sadf2
  }

  http.onreadystatechange = function () {
    if (http.readyState === 4) {
      clearTimeout(xmlHttpTimeout);

      if (http.responseText) {
        try {
          var jsonObj = JSON.parse(http.responseText);

          //Device 인증 실패인 경우 retry 로직 추가, args[4]는 retryflag
          if ((http.status === 400 && args[4] === undefined) || (jsonObj.error && jsonObj.responseStatus === 400 && jsonObj.error.message == 'Device Authentication Failed' && args[4] == undefined)) {
            var data = {eventId: args[0], callUrl: args[1], request: args[2], extra: args[3]};
            response.push(data);
            self.postMessage({cmd: 'retryApiCall', params: response});
            return;
          }
          jsonObj = threadProcess(eventId, jsonObj, request, extra);
        } catch (e) {
          if (eventId === eventKey.DETAIL_TVMOVIE) { // tv|mv에서 사용
            response.push('onreadystatechange');
            response.push('exception 001, e=' + e.message);
            self.postMessage({cmd: 'log', params: response});
          } else {
            response.push({error : 'exception 001, e=' + e.message, extra: extra, response: jsonObj});
            self.postMessage({cmd: 'errorHandler', params: response});
            return;
          }
        }
        if (scopeId) jsonObj.scopeId = scopeId;
        response.push(jsonObj);

        if (!response[1].scopeName) response[1].scopeName = '';
        if (http.status !== 200) {
          if (request.deviceInfo.isOpenApi) {
            // openApi
            if (response[1] && response[1].scopeName && response[1].scopeName.indexOf('detailApp') > -1) {
              response[1].httpStatus = http.status;
              self.postMessage({cmd: 'responseData', params: response});
              return;
            }
          }
          response.push({error: 'http status is ' + http.status});
          self.postMessage({cmd: 'errorHandler', params: response});
          return;
        } else if (http.status === 200 && jsonObj.error && response[1].scopeName.indexOf('detailApp') === -1) { // app&game은 내부에서 처리
          response.push({error: jsonObj.error, extra: extra});
          self.postMessage({cmd: 'errorHandler', params: response});
          return;
        } else {
          self.postMessage({cmd: 'responseData', params: response});
        }
      } else if (http.status === 0){  // 2016.01.15 [WOSLQEVENT-96872]
        // HTTP Status code 0 : Unreachable - If we cannot reach your server the message will be delayed.
        // 네트워크가 끊어진 상태에서 서버에 요청을 보내고 요청정보가 도달하지 못한 경우
        response.push({error : 'http.status 0, There is no response', extra:extra});
        self.postMessage({cmd: 'errorHandler', params: response});
      } else {
        if (response[1] && response[1].scopeName && response[1].scopeName.indexOf('detailApp') === -1) {// app&game은 내부에서 처리
          if (jsonObj && jsonObj.error) {
            response.push({error : jsonObj.error, extra:extra});
          } else {
            response.push({error : 'no jsonObj', extra:extra});
          }
        } else {
          response.push({error : 'no response[1]', extra:extra});
        }
        self.postMessage({cmd: 'errorHandler', params: response});
      }
    }
  };
//  if (eventId === eventKey.DISCOVERY_LOADED || eventId === eventKey.FEATURED_MAIN) {
//    request.method = 'post';
//    request.api = '/discoveryv6';
//    request.headers = args[0];
//    request.deviceInfo = {};
//    http.open('GET', '../../resources/assets/discoveryv6_tier1.json', true);
//  }
  if (request.deviceInfo.isOpenApi) {
    http.send(query); // openAPI
  } else {
    http.send(JSON.stringify(request)); // sadf2
  }

  xmlHttpTimeout = setTimeout(function() {
    http.abort();

    if (eventId === eventKey.DETAIL_TVMOVIE) {
      response.push('onreadystatechange');
      response.push('exception 020, xmlHttpTimeout');
      self.postMessage({cmd: 'log', params: response});
    } else {
      response.push({error : 'exception 020, xmlHttpTimeout', extra:extra});
      self.postMessage({cmd: 'errorHandler', params: response});
    }
  }, 30 * 1000);

  // onreadystatechange에서 처리 못할 경우
//  http.timeout = 20 * 1000;
//  http.ontimeout = function () {
//    self.postMessage({cmd: 'errorHandler', params: 'time out 20Sec'});
//  };
//  http.send(JSON.stringify(request));
};

/**
 * @description 각 서비스/카테고리별 처리 로직
 * @param eventId 각 페이지에서 호출한 이벤트명
 * @param jsonObj rest api 호출한 raw데이터
 * @param request rest api 호출에 필요한 request객체
 * @param extra 각 페이지에서 넘겨준 param객체
 * @returns {{}} jsonObj을 각 페이지에서 필요한 데이터를 추가/수정해서 가공한 데이터를 리턴
 */
var threadProcess = function(eventId, jsonObj, request, extra) {
  var retObj, result = {};

  // DateFormat
  if (eventId === eventKey.DATE_FORMAT) {
    if (jsonObj && jsonObj.dateformat && jsonObj.dateformat.format) {
      result = jsonObj.dateformat.format;
    }
    // Featured Main
  } else if (eventId === eventKey.DISCOVERY_LOADED || eventId === eventKey.FEATURED_MAIN) {
    result = {
      scopeName : 'featured',
      contentsList : [],
      headRollingInterval : 30,
      contentsRollingInterval : 10,
      headList : [],
      menuList : [],
      cpMetadataFlag : '' // tier1.5국가 구분
    };
    var temp, arr, obj, i, j;

    if (jsonObj.lgStore) {
      try {
        temp = jsonObj.lgStore.contentsList;
        for (i = 0; i < temp.length; i++) {
          obj = result.contentsList[i] = {};
          obj.column = temp[i].columnsCount; // v8.0은 arrayNumber에서 변경
          obj.category = temp[i].category; // v8.0은 contentsCategory에서 변경
          obj.contentsTitle = temp[i].title; // v8.0은 contentsTitle에서 변경
          obj.contents = [];
          obj.banners = [];

          try {
            arr = temp[i].contents.promotionBannerList;
            for (j = 0; j < arr.length; j++) {
              obj = result.contentsList[i].banners[j] = {};
              obj.column = arr[j].promotionBanner.arrayLocation;
              obj.order = arr[j].promotionBanner.order;
              obj.img = arr[j].promotionBanner.bannerImage;
              obj.id = arr[j].promotionBanner.bannerLink;
              obj.name = arr[j].promotionBanner.bannerName;


              if ( arr[j].promotionBanner != undefined && arr[j].promotionBanner.contents != undefined && arr[j].promotionBanner.singleContents != undefined && arr[j].promotionBanner.singleContents === 'Y' ) {

                if ( arr[j].promotionBanner.contents.appList != undefined && arr[j].promotionBanner.contents.appList.rankTypeList[0] != undefined && arr[j].promotionBanner.contents.appList.rankTypeList[0].name != undefined
                  && arr[j].promotionBanner.contents.appList.rankTypeList[0].name === 'APP') {
                  obj.singleContentsType = 'appsngames';
                  obj.id = arr[j].promotionBanner.contents.appList.rankTypeList[0].appList[0].id;
                }

                if ( arr[j].promotionBanner.contents.movieList != undefined && arr[j].promotionBanner.contents.movieList[0].conts_type === 'MV' ) {
                  obj.singleContentsType = 'movies';
                  obj.id = arr[j].promotionBanner.contents.movieList[0].item_id;
                }

                if ( arr[j].promotionBanner.contents.vodList != undefined && arr[j].promotionBanner.contents.vodList[0].conts_type === 'TS' ) {
                  obj.singleContentsType = 'tvshows';
                  obj.id = arr[j].promotionBanner.contents.vodList[0].item_id;
                }


              }
            }
          } catch (e) {}

          if (temp[i].category == 'tvshows') { // v8.0은 contentsCategory에서 변경
            try {
              arr = temp[i].contents.contentList; // v8.0은 vodList에서 변경됨 
              for (j = 0; j < arr.length; j++) {
                obj = result.contentsList[i].contents[j] = {};
                obj.id = arr[j].item_id;
                obj.img = arr[j].item_img;
                obj.size = arr[j].item_img_size;
                obj.name = arr[j].item_name;
                if (arr[j].conts_exec_contents_set) obj.execCpListString = arr[j].conts_exec_contents_set;
              }
            } catch (e) {}
          } else if (temp[i].category == 'movies') {
            try {
              arr = temp[i].contents.contentList; // v8.0은 movieList에서 변경됨
              for (j = 0; j < arr.length; j++) {
                obj = result.contentsList[i].contents[j] = {};
                obj.id = arr[j].item_id;
                obj.img = arr[j].item_img;
                obj.size = arr[j].item_img_size;
                obj.name = arr[j].item_name;
                if (arr[j].conts_exec_contents_set) obj.execCpListString = arr[j].conts_exec_contents_set;
              }
            } catch (e) {}
          } else if (temp[i].category == 'appsngames' || temp[i].category == 'appsngameshot' || temp[i].category == 'appsngamesnew') {
            arr = temp[i].contents.appList.rankTypeList[0].appList;
            for (j = 0; j < arr.length; j++) {
              obj = result.contentsList[i].contents[j] = {};
              obj.id = arr[j].id;
              obj.img = arr[j].iconURL;
              obj.name = arr[j].name;
              obj.categoryName = arr[j].categoryName;
              obj.price = arr[j].displayPrice;
              //WOSLQEVENT-72469, 앱할인이벤트(event:'Y)할때 할인된 금액이 화면에 나오게 수정
              var tempEventPrice = arr[j].displayEventPrice;
               if(tempEventPrice != undefined && arr[j].event ==='Y'){
                 obj.price = tempEventPrice;
              }
              obj.iconColor = undefined;
              if(arr[j].iconColor) {
                obj.iconColor = arr[j].iconColor;
              }
              obj.appType = arr[j].type;
            }
          } else if (temp[i].category == 'premium') {
            // tier2
            arr = temp[i].contents.appList.rankTypeList[0].appList;
            for (j = 0; j < arr.length; j++) {
              obj = result.contentsList[i].contents[j] = {};
              obj.id = arr[j].id;
              obj.img = arr[j].iconURL;
              obj.name = arr[j].name;
              obj.categoryName = arr[j].categoryName;
              obj.price = arr[j].displayPrice;
              if (arr[j].iconColor) {
                obj.iconColor = arr[j].iconColor;
              }
            }
          }
        }
      } catch (e) {}

      if (jsonObj.lgStore.headRollingInterval) {
        result.headRollingInterval = jsonObj.lgStore.headRollingInterval;
      }
      if (jsonObj.lgStore.contentsRollingInterval) {
        result.contentsRollingInterval = jsonObj.lgStore.headRollingInterval;
      }
      // 2016.01.05 : tier1.5구분 플래그
      if (jsonObj.lgStore.cpMetadataFlag) {
        result.cpMetadataFlag = jsonObj.lgStore.cpMetadataFlag;
      }
      try {
        temp = jsonObj.lgStore.headerList;
        var j=0;
        for (i = 0; i < temp.length; i++) {
          if (temp[i].contentsCategory === '3d') continue;
          result.headList[j] = {};
          result.headList[j].category = temp[i].category;
          result.headList[j].categoryText = temp[i].categoryTitle;
          result.headList[j].title = temp[i].title;

          if (temp[i].contentsCategory === 'headmanual') {
            result.headList[j].image = temp[i].headImg;
            result.headList[j].id = temp[i].headLink;
            result.headList[j].singleContent = temp[i].singleContent;
            result.headList[j].bgHexCode = temp[i].bgHexCode;
            //[WEBOSDEFEC-13601] headmanual이면 무조건 Description 보이게 수정
            result.headList[j].description = temp[i].description.replace(/\n/g, ' ').substr(0, 150);

            if(temp[i].contents != undefined && temp[i].singleContent === 'Y'){
              if(temp[i].contents.contentList != undefined) {
                result.headList[j].id = temp[i].contents.contentList[0].item_id;
                if (temp[i].contents.contentList[0].conts_type === 'TS') {
                  result.headList[j].conts_type = 'tvshows';
                }
              }
              if(temp[i].contents.movieList != undefined) {
                result.headList[j].id = temp[i].contents.movieList[0].item_id;
                  if(temp[i].contents.movieList[0].conts_type === 'MV'){
                    result.headList[j].conts_type ='movies';
                  }
              }

              if(temp[i].contents.premiumList != undefined){
                result.headList[j].id =  temp[i].contents.premiumList.rankTypeList[0].appList[0].id;
                result.headList[j].conts_type ='premium';
              }

              if(temp[i].contents.appList != undefined){
                result.headList[j].id = temp[i].contents.appList.rankTypeList[0].appList[0].id;
                result.headList[j].conts_type ='appsngames';
              }
            }
          } else {
            result.headList[j].genreId = temp[i].genreId && temp[i].genreId.trim();
            result.headList[j].image = getGenreImage(parseInt(temp[i].genreId));
            if (getGenreBgColor(parseInt(temp[i].genreId))) {
              result.headList[j].bgHexCode = getGenreBgColor(parseInt(temp[i].genreId));
            }
          }

          if (temp[i].category == 'tvshows' || temp[i].category == 'movies') {
            result.headList[j].description = temp[i].description.replace(/\n/g, ' ').substr(0, 150);

            try {
              result.headList[j].id = temp[i].contents.contentList[0].item_id;
            } catch (e) {}

          } else if (temp[i].category == 'premium') {
            result.headList[j].genreName = temp[i].genreName;
            result.headList[j].price = temp[i].price;

            try {
              result.headList[j].id = temp[i].contents.premiumList.rankTypeList[0].appList[0].id;
            } catch (e) {}

          } else if (temp[i].category == 'appsngames') {
            result.headList[j].genreName = temp[i].genreName;
            result.headList[j].price = temp[i].price;

            try {
              result.headList[j].id = temp[i].contents.appList.rankTypeList[0].appList[0].id;
            } catch (e) {}
          } else if (temp[i].category == 'mypage') {
            result.headList[j].genreName = temp[i].genreName;
            result.headList[j].price = temp[i].price;

            try {
              result.headList[j].id = temp[i].contents.appList.rankTypeList[0].appList[0].id;
            } catch (e) {}
          }
          j++;
        }
      } catch (e) {}

      try {
        temp = jsonObj.lgStore.menuList;
        for (i = 0; i < temp.length; i++) {
          result.menuList[i] = {};
          result.menuList[i].menuText = temp[i].menuText;
          result.menuList[i].serviceCode = temp[i].serviceCode;
        }
      } catch (e) {}
    }

    // TVSHOW/MOVIES menu
  } else if (eventId === eventKey.MENU_LOADED) {
    result = {
      scopeName: extra.gubun === 'TS' ? 'tvshows' : 'movies',
      menuList: []
    };
    parseMenuList(result.menuList, jsonObj.menu_list.menus);

    // TVSHOW List
  } else if (eventId === eventKey.LIST_TVMOVIE) {
    result = {
      scopeName: extra.gubun === 'TS' ? 'tvshows' : 'movies',
      menuList: [],
      itemList: [],
      filterList: []
    };
    result.total = parseInt(jsonObj.item_list['@total_item_cnt']);
    result.startIndex = parseInt(jsonObj.item_list['@start_index']) - 1;
    result.skinType = jsonObj.item_list['@skin_type'];
    parseMenuList(result.menuList, jsonObj.menu_list.menus);
    parseItemList(result.itemList, jsonObj.item_list.items);
    if (jsonObj.filter_list && jsonObj.filter_list.filters) {
      parseFilterList(result.filterList, jsonObj.filter_list.filters);
    }

    // TVSHOW Detail
  } else if (eventId === eventKey.DETAIL_TVMOVIE) {
    result = {
      scopeName: extra.gubun === 'TS' ? 'TVShowDetail' : 'MovieShowDetail',
      TVShowDetail: []
    };
    var temp, arr, obj, i, j;

    if (jsonObj.item) {
      result.listDetail = jsonObj.item;
    }

    // Actor  detail
  } else if (eventId === eventKey.DETAIL_ACTOR) {
    result = {
      scopeName : 'actor',
      actor : []
    };
    result.actor = jsonObj.item;

    // AppNGame menu
  } else if (eventId === eventKey.MENU_APPGAME) {
    result = {
      scopeName : 'appsngames',
      menuList : [],
      filterList : []
    };
    parseAppMenuList(result.menuList, jsonObj.appstoreApps.rankTypeList, extra.item.replace('ANG00', ''), 0);
    parseAppFilterList(result.filterList, jsonObj.appstoreApps.categoryList, extra.category);

    // AppNGame List
  } else if (eventId === eventKey.LIST_APPGAME) {
    result = {
      scopeName : 'appsngames',
      menuList : [],
      itemList : [],
      filterList : []
    };

    if (jsonObj.rankType == null || jsonObj.rankType == undefined) {
      return result;
    }
    if (jsonObj.rankType.promotionCount > 0 && request.params.index === 0) { // if promotion, only show the first promotion data and do not append.
      parsePromotionList(result.itemList, jsonObj.rankType.promotionList);
    }
    parseAppList(result.itemList, jsonObj.rankType.appList, request.params.index);
    result.total = parseInt(jsonObj.rankType.totalAppCount);
    result.startIndex = request.params.index > 0 ? request.params.index : 0;

    // AppNGame Detail Loaded || Update Loaded
  } else if (eventId === eventKey.DETAIL_LOADED_APPGAME || eventId === eventKey.UPDATE_LOADED_APPGAME || eventId === eventKey.SMALL_UPDATE_LOADED_APPGAME || eventId === eventKey.PURCHASABLE_APP) {
    result = {
      scopeName: 'detailApp',
      appDetail: []
    };
    //서버에서 iconColor(아이콘배경화면)이 안올경우 검정색으로 설정해준다.
//    if (jsonObj.app) {
//      if (!jsonObj.app.iconColor) {
//        jsonObj.app.iconColor = '#000000';
//      }
//    }
    result.appDetail = jsonObj;

    // AppNGame Recommend
  } else if (eventId === eventKey.RECOMMEND_APPGAME) {
    result = {
      scopeName: 'detailApp',
      appRecommend: [],
      scopeId: extra.freeAppScopeId
    };
    result.appRecommend = jsonObj.recommendedApp;

    // AppNGame Package load
  } else if (eventId === eventKey.PACKAGE_APPGAME) {
    result = {
      scopeName: 'detailApp',
      appPackageList: [],
      scopeId: extra.freeAppScopeId
    };
    result.appPackageList = jsonObj.app;

    // AppNGame Installable
  } else if (eventId === eventKey.INSTALLABLE_APPGAME) {
    result = {
      scopeName: 'detailApp',
      appInstallData: [],
      scopeId: extra.freeAppScopeId
    };
    result.appInstallData = jsonObj;

    // AppNGame check update
  } else if (eventId === eventKey.CHECK_UPDATE_APPGAME) {
    result = {
      scopeName: extra.scope,
      appUpdateList: [],
      scopeId: extra.freeAppScopeId
    };
    result.appUpdateList = jsonObj.appUpdateList;

    // AppNGame Event Free App Purchased
  } else if (eventId === eventKey.EVENT_FREE_PURCHASE_APPGAME) {
    result = {
      scopeName: 'detailApp',
      purchaseResult: [],
      scopeId: extra.freeAppScopeId
    };
    result.purchaseResult = jsonObj;

    // Premium List
  } else if (eventId === eventKey.LIST_PREMIUM) {
    result = {
      scopeName: 'premium',
      premiumAppList: []
    };
    var temp, arr, obj, i, j;

    if (jsonObj.premiumAppList && jsonObj.premiumAppList.appList) {
      temp = jsonObj.premiumAppList.appList;
      for (i = 0; i < temp.length; i++) {
        result.premiumAppList[i] = {};
        result.premiumAppList[i].id = temp[i].id;
        result.premiumAppList[i].name = temp[i].name;
        result.premiumAppList[i].categoryName = temp[i].categoryName;
        result.premiumAppList[i].iconURL = temp[i].iconURL;
        //서버단에서 프리미엄 iconColor(아이콘바탕화면 색상)이 내려오지 않을 경우 검정색으로 보이게 수정
        //만약 아이콘바탕화면 색상이 없으면 해당 프리미엄선택하면 포커스때문에 바탕화면이 빨강색으로 변경됨.
        if(!temp[i].iconColor){
          temp[i].iconColor ='#000000';
        }
        result.premiumAppList[i].iconColor = temp[i].iconColor;
      }
      result.appCount = parseInt(jsonObj.premiumAppList.appCount);
    } else {
      result.appCount = 0;
    }

    // Theme Load
  } else if (eventId === eventKey.THEME_LOADED) {
    result = {
      scopeName: 'detailTheme',
      themePage: []
    };
    result.themePage = jsonObj.themepage;

    // AppNGame Rated
  } else if (eventId === eventKey.RATED_APPGAME) {
    result = {
      scopeName: 'detailApp',
      rateResult: []
    };
    result.rateResult = jsonObj;

    // MyPage
  } else if (eventId === eventKey.MYPAGE_LOADED) {
    result.scope = 'mypage';
    //서버에서 iconColor(아이콘배경화면)이 안올경우 검정색으로 설정해준다.
//    if (jsonObj.appUpdateList && jsonObj.appUpdateList.appUpdateCheck) {
//      temp = jsonObj.appUpdateList.appUpdateCheck;
//      for (i = 0; i < temp.length; i++) {
//        if (!temp[i].iconColor) {
//          temp[i].iconColor = '#000000';
//        }
//      }
//    }
    result.jsonObj = jsonObj;

    // default
  } else {
    result = jsonObj;
  }
  return result;
};
