discoveryService.service('getTierType', function() {

  this.num = function(countryCode) {
    var DIC_TIER = {
      'tier1' :
      {
        'app_id' : 'com.webos.app.discovery',
        'country' : ['FR','DE','ES','GB','KR','US','BR','C01','RU']
      },

      'tier2' :
      {
        'app_id' : 'com.webos.app.discovery',
        'country' : ['AL','AT','BY','BE','BA','BG','HR','CZ','DK','EE','FI','GR',
          'HU','IE','IT','KZ','KE','LV','LT','LU','MK','MA','NL','NG',
          'NO','PL','PT','RO','RS','SK','SI','ZA','SE','CH','TR','UA',
          'UZ','CA','MX','CR','DO','EC','SV','GT','HN','PA','VE','AR',
          'BO','CL','PY','PE','UY','CO','TW','HK','IL','JP','AU','IN',
          'ID','MY','NZ','PH','SG','TH','VN','DZ','EG','IR','JO','KW',
          'PK','QA','SA','TN','AE']
      },

      'tier3' :
      {
        'app_id' : 'com.webos.app.premium',
        'country' : ['CN','AM','AZ','CY','GE','GH','IS','IQ','KG','ME','EU7','KR7',
          'US7','NI','PR','AG','AW','BB','BZ','DM','GD','GY','JM','VC',
          'TT','BR7','TW7','C03','CN7','HK7','PS','IL7','P7','MM','LK',
          'AJ7','AF','AO','BH','BJ','BF','CM','CV','CF','CG','DJ','CD',
          'ET','GA','GM','GN','GQ','CI','LB','LR','LY','MW','ML','MR','OM',
          'RW','SN','SL','SD','SY','TZ','TG','UG','YE','ZM','JA7']
      }
    };

    for (i = 1 ; i < 4; i++) {
      var country = DIC_TIER['tier' + i]['country'];
      for (j = 0 ; j < country.length; j++) {
        if (countryCode === country[j]) {
          return i;
        }
      }
    }

  };

});