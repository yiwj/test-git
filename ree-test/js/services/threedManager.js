/**
 * threeD Menu list 및 sort, filter code 관리 서비스
 */
discoveryService.factory('threedManager', function(device) {
  var _pageModel = {}, _listOptionData = [];

  /**
   * @decription sort & filter Data initialize (메뉴코드는 공통사용으로 인해 SORTER/FILTER붙임)
   * 검색시 숫자코드로 변환
   * @param menuCode
   * @returns [{sort},{filter}] sort & filter 객체 배열
   */
  var _init3dListOptionData = function(menuCode) {
    var listOptionData = [];
    // 메뉴코드가 단편이면
    if(menuCode === '_shortfilm') {
      listOptionData.push({
        key : 'FILTER_SORTER', // 'sort'
        title : msgLang.sort,
        values : [{
          name : msgLang.apps_category01,        // 전체 (_categoryCode == _tags)
          code : '_shortfilm',
          selected : 'TRUE'
        }, {
          name : msgLang._3d_submenu_kids,
          code : '_kids',
          selected : 'FALSE'
        }, {
          name : msgLang._3d_submenu_ent,
          code : '_entertainment',
          selected : 'FALSE'
        }, {
          name : msgLang._3d_submenu_sports,
          code : '_sports',
          selected : 'FALSE'
        }, {
          name : msgLang._3d_submenu_docu,
          code : '_documentary',
          selected : 'FALSE'
        }]
      });
      // 그 외에 (_top5, _disney, _movies 이면)
    } else {
      listOptionData.push({
        key : 'FILTER_SORTER',
        title : msgLang.sorting,
        values : [{
          name : msgLang._3d_sort_new,
          code : 'SORTER1',
          selected : 'TRUE'
        }, {
          name : msgLang._3d_sort_alpha,
          code : 'SORTER2',
          selected : 'FALSE'
        }]
      });
    }
    listOptionData.push({
      key : 'FILTER_FILTER', // 'filter'
      title : msgLang.filter,
      values : [{
        name: msgLang._3d_price_free + ' & ' + msgLang._3d_price_paid,
        code: 'FILTER1',
        selected : 'TRUE'
      }, {
        name : msgLang._3d_price_free,
        code : 'FILTER3',
        selected : 'FALSE'
      }, {
        name: msgLang._3d_price_paid,
        code: 'FILTER2',
        selected : 'FALSE'
      }]
    });
    return listOptionData;
  };

  return {
    pageModel : _pageModel,

    /**
     * @description threedManager서비스 초기화
     * @param pageParams
     * @returns {{}}
     */
    init : function(pageParams) {
      _pageModel.menuCode = pageParams.menuCode || '_top5';
      _pageModel.pageNumber = 0;
      _pageModel.pageSize = (pageParams.menuCode === '_top5') ? 30 : 100;
      _pageModel.sort = 'SORTER1';
      _pageModel.filter = 'FILTER1';
      _pageModel.shortfilmTag = '_shortfilm';
      _pageModel.isLastData = pageParams.isLastData || false;

      _listOptionData = _init3dListOptionData(pageParams.menuCode);
    },

    /**
     * @description 메뉴에 threed메뉴 add (TBD)
     * @param menuMap 기 메뉴 맵
     */
    add3dMenuMap : function(menuMap) {
      var objMenu = this.getMenuFlag();
      var menu = {_top5 : 'ThreedList'};

      if (!objMenu.hasOwnProperty('disney')) {
        for (var key in objMenu) {
          if (objMenu[key]) menu['_' + key] = 'ThreedList';
        }
      } else {
        menu['_shortfilm'] = '3dList'; // default
      }
      angular.extend(menuMap, menu);
      return;
    },

    /**
     * @description menuCode 코드별 서브타이틀 (_tag별 메뉴이름)
     * @param menuCode
     * @return sub 메뉴명
     */
    draw2depthCommon : function(menuCode) {
      return {
        '_top5' : msgLang._3d_submenu_hot,
        '_disney' : msgLang._3d_submenu_disney,
        '_movie' : msgLang._3d_submenu_movie,
        '_shortfilm' : msgLang._3d_submenu_short,
        '_appsgames' : msgLang._3d_submenu_appngame
        //' _documentary' : msgLang._3d_submenu_docu,
        // '_entertainment' : msgLang._3d_submenu_ent,
        // '_kids' : msgLang._3d_submenu_kids,
        // '_sports' : msgLang._3d_submenu_sports
      }[menuCode];
    },

    /**
     * @description 국가코드별 노출할 기본메뉴 정보
     * @returns {object} 메뉴노출 정보
     */
    getMenuFlag : function() {
      var countryCode = device.countryCode;
      return {
        // 2014.02.28 반영
        KR : {disney : true, movie : true, shortfilm : true, apps : false},  // Korea
        AL : {disney : false, movie : false, shortfilm : true, apps : false},  // Albania
        AM : {disney : false, movie : false, shortfilm : false, apps : false},  // Armenia
        AT : {disney : false, movie : false, shortfilm : true, apps : false},  // Austria
        AZ : {disney : false, movie : false, shortfilm : false, apps : false},  // Azerbaijan
        BY : {disney : false, movie : false, shortfilm : true, apps : false},  // Belarus
        BE : {disney : false, movie : false, shortfilm : true, apps : false},  // Belgium
        BA : {disney : false, movie : false, shortfilm : true, apps : false},  // Bosnia and Herzegovina
        BG : {disney : false, movie : false, shortfilm : true, apps : false},  // Bulgaria
        HR : {disney : false, movie : false, shortfilm : true, apps : false},  // Croatia
        CY : {disney : false, movie : false, shortfilm : false, apps : false},  // Cyprus
        CZ : {disney : false, movie : false, shortfilm : true, apps : false},  // Czech Republic
        DK : {disney : false, movie : false, shortfilm : true, apps : false},  // Denmark
        EE : {disney : false, movie : false, shortfilm : true, apps : false},  // Estonia
        FI : {disney : false, movie : false, shortfilm : true, apps : false},  // Finland
        FR : {disney : false, movie : false, shortfilm : true, apps : false},  // France
        GE : {disney : false, movie : false, shortfilm : false, apps : false},  // Georgia
        DE : {disney : true, movie : false, shortfilm : true, apps : false},  // Germany
        GR : {disney : false, movie : false, shortfilm : true, apps : false},  // Greece
        HU : {disney : false, movie : false, shortfilm : true, apps : false},  // Hungary
        IS : {disney : false, movie : false, shortfilm : false, apps : false},  // Iceland
        IE : {disney : false, movie : false, shortfilm : true, apps : false},  // Ireland
        IT : {disney : false, movie : false, shortfilm : true, apps : false},  // Italy
        KZ : {disney : false, movie : false, shortfilm : true, apps : false},  // Kazakhstan
        KG : {disney : false, movie : false, shortfilm : false, apps : false},  // Kyrgyzstan
        LV : {disney : false, movie : false, shortfilm : true, apps : false},  // Latvia
        LT : {disney : false, movie : false, shortfilm : true, apps : false},  // Lithuania
        LU : {disney : false, movie : false, shortfilm : true, apps : false},  // Luxembourg
        MK : {disney : false, movie : false, shortfilm : true, apps : false},  // Macedonia
        ME : {disney : false, movie : false, shortfilm : false, apps : false},  // Montenegro
        MA : {disney : false, movie : false, shortfilm : true, apps : false},  // Morocco
        NL : {disney : false, movie : false, shortfilm : true, apps : false},  // Netherlands
        NO : {disney : false, movie : false, shortfilm : true, apps : false},  // Norway
        PL : {disney : false, movie : false, shortfilm : true, apps : false},  // Poland
        PT : {disney : false, movie : false, shortfilm : true, apps : false},  // Portugal
        RO : {disney : false, movie : false, shortfilm : true, apps : false},  // Romania
        RU : {disney : true, movie : true, shortfilm : true, apps : false},  // Russia
        RS : {disney : false, movie : false, shortfilm : true, apps : false},  // Serbia
        SK : {disney : false, movie : false, shortfilm : false, apps : false},  // Slovakia
        SI : {disney : false, movie : false, shortfilm : true, apps : false},  // Slovenia
        ES : {disney : false, movie : false, shortfilm : true, apps : false},  // Spain
        SE : {disney : false, movie : false, shortfilm : true, apps : false},  // Sweden
        CH : {disney : false, movie : false, shortfilm : true, apps : false},  // Switzerland
        TR : {disney : true, movie : true, shortfilm : true, apps : false},  // Turkey
        GB : {disney : false, movie : false, shortfilm : true, apps : false},  // UK (United Kingdom)
        UA : {disney : false, movie : false, shortfilm : true, apps : false},  // Ukraine
        UZ : {disney : false, movie : false, shortfilm : true, apps : false},  // Uzbekistan
        CA : {disney : false, movie : false, shortfilm : true, apps : false},  // Canada        ---> disney false로 변경 14.12.03 변재방사원
        CR : {disney : false, movie : false, shortfilm : true, apps : false},  // Costa Rica
        DO : {disney : false, movie : false, shortfilm : true, apps : false},  // Dominican Republic
        EC : {disney : false, movie : false, shortfilm : true, apps : false},  // Ecuador
        SV : {disney : false, movie : false, shortfilm : true, apps : false},  // El Salvador
        GT : {disney : false, movie : false, shortfilm : true, apps : false},  // Guatemala
        HN : {disney : false, movie : false, shortfilm : true, apps : false},  // Honduras
        MX : {disney : false, movie : false, shortfilm : true, apps : false},  // Mexico
        NI : {disney : false, movie : false, shortfilm : false, apps : false},  // Nicaragua
        PA : {disney : false, movie : false, shortfilm : true, apps : false},  // Panama
        PH : {disney : false, movie : false, shortfilm : true, apps : false},  // Philippines
        PR : {disney : false, movie : false, shortfilm : false, apps : false},  // Puerto Rico
        US : {disney : false, movie : false, shortfilm : true, apps : false},  // USA           ---> movie false로 변경 14.12.03 변재방사원
        VE : {disney : false, movie : false, shortfilm : true, apps : false},  // Venezuela
        AR : {disney : false, movie : false, shortfilm : true, apps : false},  // Argentina
        BO : {disney : false, movie : false, shortfilm : true, apps : false},  // Bolivia
        BR : {disney : true, movie : false, shortfilm : true, apps : false},  // Brazil
        CL : {disney : false, movie : false, shortfilm : true, apps : false},  // Chile
        PY : {disney : false, movie : false, shortfilm : true, apps : false},  // Paraguay
        PE : {disney : false, movie : false, shortfilm : true, apps : false},  // Peru
        UY : {disney : false, movie : false, shortfilm : true, apps : false},  // Uruguay
        CO : {disney : false, movie : false, shortfilm : true, apps : false},  // Colombia
        TW : {disney : false, movie : false, shortfilm : true, apps : false},  // Taiwan
        CN : {disney : false, movie : false, shortfilm : false, apps : false},  // China
        HK : {disney : false, movie : false, shortfilm : true, apps : false},  // Hongkong
        IL : {disney : false, movie : false, shortfilm : true, apps : false},  // Israel
        PS : {disney : false, movie : false, shortfilm : false, apps : false},  // Palestine
        JP : {disney : false, movie : false, shortfilm : true, apps : false},  // Japan
        AU : {disney : true, movie : false, shortfilm : true, apps : false},  // Australia
        IN : {disney : false, movie : false, shortfilm : true, apps : false},  // India
        ID : {disney : false, movie : false, shortfilm : true, apps : false},  // Indonesia
        MY : {disney : false, movie : false, shortfilm : true, apps : false},  // Malaysia
        MM : {disney : false, movie : false, shortfilm : false, apps : false},  // Myanmar
        NZ : {disney : false, movie : false, shortfilm : true, apps : false},  // New Zealand
        SG : {disney : false, movie : false, shortfilm : true, apps : false},  // Singapore
        LK : {disney : false, movie : false, shortfilm : false, apps : false},  // Sri Lanka
        TH : {disney : false, movie : false, shortfilm : true, apps : false},  // Thailand
        VN : {disney : false, movie : false, shortfilm : true, apps : false},  // Vietnam
        AF : {disney : false, movie : false, shortfilm : false, apps : false},  // Afghanistan
        DZ : {disney : false, movie : false, shortfilm : true, apps : false},  // Algeria
        AO : {disney : false, movie : false, shortfilm : false, apps : false},  // Angola
        BH : {disney : false, movie : false, shortfilm : false, apps : false},  // Bahrain
        BJ : {disney : false, movie : false, shortfilm : false, apps : false},  // Benin
        BF : {disney : false, movie : false, shortfilm : false, apps : false},  // Burkina Faso
        CM : {disney : false, movie : false, shortfilm : false, apps : false},  // Cameroon
        CV : {disney : false, movie : false, shortfilm : false, apps : false},  // Cape Verde
        CF : {disney : false, movie : false, shortfilm : false, apps : false},  // Central African Republic
        CG : {disney : false, movie : false, shortfilm : false, apps : false},  // Congo Brazzaville
        DJ : {disney : false, movie : false, shortfilm : false, apps : false},  // Djibouti
        CD : {disney : false, movie : false, shortfilm : false, apps : false},  // DR Congo
        EG : {disney : false, movie : false, shortfilm : true, apps : false},  // Egypt
        ET : {disney : false, movie : false, shortfilm : false, apps : false},  // Ethiopia
        GA : {disney : false, movie : false, shortfilm : false, apps : false},  // Gabon
        GM : {disney : false, movie : false, shortfilm : false, apps : false},  // Gambia
        GH : {disney : false, movie : false, shortfilm : false, apps : false},  // Ghana
        GN : {disney : false, movie : false, shortfilm : false, apps : false},  // Guinea Conakry
        GQ : {disney : false, movie : false, shortfilm : false, apps : false},  // Guinea Equatorial
        IR : {disney : false, movie : false, shortfilm : true, apps : false},  // Iran
        IQ : {disney : false, movie : false, shortfilm : false, apps : false},  // Iraq
        CI : {disney : false, movie : false, shortfilm : false, apps : false},  // Ivory Coast
        JO : {disney : false, movie : false, shortfilm : true, apps : false},  // Jordan
        KE : {disney : false, movie : false, shortfilm : true, apps : false},  // Kenya
        KW : {disney : false, movie : false, shortfilm : true, apps : false},  // Kuwait
        LB : {disney : false, movie : false, shortfilm : false, apps : false},  // Lebanon
        LR : {disney : false, movie : false, shortfilm : false, apps : false},  // Liberia
        LY : {disney : false, movie : false, shortfilm : false, apps : false},  // Libya
        MW : {disney : false, movie : false, shortfilm : false, apps : false},  // Malawi
        ML : {disney : false, movie : false, shortfilm : false, apps : false},  // Mali
        MR : {disney : false, movie : false, shortfilm : false, apps : false},  // Mauritania
        NG : {disney : false, movie : false, shortfilm : true, apps : false},  // Nigeria
        OM : {disney : false, movie : false, shortfilm : false, apps : false},  // Oman
        PK : {disney : false, movie : false, shortfilm : true, apps : false},  // Pakistan
        QA : {disney : false, movie : false, shortfilm : true, apps : false},  // Qatar
        RW : {disney : false, movie : false, shortfilm : false, apps : false},  // Rwanda
        SA : {disney : false, movie : false, shortfilm : true, apps : false},  // Saudi Arabia
        SN : {disney : false, movie : false, shortfilm : false, apps : false},  // Senegal
        SL : {disney : false, movie : false, shortfilm : false, apps : false},  // Sierra Leone
        ZA : {disney : false, movie : false, shortfilm : true, apps : false},  // South Africa
        SD : {disney : false, movie : false, shortfilm : false, apps : false},  // Sudan
        SY : {disney : false, movie : false, shortfilm : false, apps : false},  // Syria
        TZ : {disney : false, movie : false, shortfilm : false, apps : false},  // Tanzania
        TG : {disney : false, movie : false, shortfilm : false, apps : false},  // Togo
        TN : {disney : false, movie : false, shortfilm : true, apps : false},  // Tunisia
        AE : {disney : false, movie : false, shortfilm : true, apps : false},  // UAE (United Arab Emirates)
        UG : {disney : false, movie : false, shortfilm : false, apps : false},  // Uganda
        YE : {disney : false, movie : false, shortfilm : false, apps : false},  // Yemen
        ZM : {disney : false, movie : false, shortfilm : false, apps : false},  // Zambia
        AG : {disney : false, movie : false, shortfilm : false, apps : false},  // Antigua and Barbuda
        AW : {disney : false, movie : false, shortfilm : false, apps : false},  // Aruba
        BB : {disney : false, movie : false, shortfilm : false, apps : false},  // Barbados
        BZ : {disney : false, movie : false, shortfilm : false, apps : false},   // Belize
        DM : {disney : false, movie : false, shortfilm : false, apps : false},  // Dominica
        GD : {disney : false, movie : false, shortfilm : false, apps : false},  // Grenada
        GY : {disney : false, movie : false, shortfilm : false, apps : false},  // Guyana
        JM : {disney : false, movie : false, shortfilm : false, apps : false},  // Jamaica
        VC : {disney : false, movie : false, shortfilm : false, apps : false},  // Saint Vincent and the Grenadines
        TT : {disney : false, movie : false, shortfilm : false, apps : false},  // Trinidad and Tobago
        DEFAULT : {disney : false, movie : false, shortfilm : true, apps : false, clientMenuFlag: true}
      }[countryCode];
    },

    /**
     * @description 3d 메뉴 세팅
     * @param obj
     * @param menuCode 현재 카테고리 코드
     * @returns {{currentCategory: *, menuList: {code: string, title: string}[]}}
     */
    getMenuData : function(obj, menuCode) {
      var data = {
        currentCategory : menuCode || '_top5',
        menuList : [{
          code : '_top5',
          name : msgLang._3d_submenu_hot,
          selected : 'FALSE'
        }]
      };
      if(obj.disney) {
        data.menuList.push({
          code : '_disney',
          name : msgLang._3d_submenu_disney,
          selected : 'FALSE'
        });
      }
      if(obj.movie) {
        data.menuList.push({
          code : '_movie',
          name : msgLang.movie_title,
          selected : 'FALSE'
        });
      }
      if(obj.shortfilm) {
        data.menuList.push({
          code : '_shortfilm',
          name : msgLang._3d_submenu_short,
          selected : 'FALSE'
        });
      }
      if(obj.apps) {
        data.menuList.push({
          code : '_appsgames',
          name : msgLang._3d_submenu_appngame,
          selected : 'FALSE'
        });
      }
      // 선택된 메뉴 세팅
      for(var i = 0, len = data.menuList.length; i < len; i++) {
        if(menuCode === data.menuList[i].code) {
          data.menuList[i].selected = 'TRUE';
          break;
        }
      }
      return data;
    },

    /**
     * @description 데이터 가공하기
     * @param data 서버로부터 받은 데이터
     * @param menuCode 메뉴 코드
     * @returns {{scopeName: string, menuList: Array, itemList: Array, filterList: Array, page_number: string, page_size: string}}
     */
    getResponseData : function(data, menuCode) {
      var result = {
        scopeName: '3d',
        menuList: [],
        itemList: [],
        filterList: [],
        page_number: '0',
        page_size: '30'
      };

      var menuFlag = this.getMenuFlag();
      var menuList = this.getMenuData(menuFlag, menuCode);

      result.total = parseInt(data.total_count);
      result.startIndex = parseInt(data.page_number) * parseInt(data.page_size);

      angular.extend(result.menuList, menuList.menuList);
      angular.extend(result.itemList, data.items);
      angular.extend(result.filterList, menuCode !== '_top5' ? _listOptionData : {});

      return result;
    },

    /**
     * @description listOptionData selected 변경
     * @param menuCode 메뉴코드
     * @param sort 정렬옵션
     * @param filter 필터옵션
     */
    setChangeListOptionSelected : function(menuCode, sort, filter) {
      for( var i = 0, len = _listOptionData.length; i < len; i++) {
        for(var j = 0, len2 = _listOptionData[i].values.length; j < len2; j++) {
          _listOptionData[i].values[j].selected = 'FALSE'; // 초기화

          // sort&filter 를 공통으로 사용하기 위해 부가코드(SORTER, FILTER)
          // 부여했던 것을 비교처리 함
          var sort_code = _listOptionData[i].values[j].code.replace(/SORTER/g, '');
          var filter_code = _listOptionData[i].values[j].code.replace(/FILTER/g, '');

          if((_listOptionData[i].key === 'FILTER_SORTER' && sort_code === (sort + '').replace(/SORTER/g, '')) ||
            (_listOptionData[i].key === 'FILTER_FILTER' && filter_code === (filter + '').replace(/FILTER/g, ''))) {
              _listOptionData[i].values[j].selected = 'TRUE';
          }
        }
      }
    }
  };
});