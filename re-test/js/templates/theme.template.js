var themeTmpl = '';
themeTmpl += '<div class="page panel-detail panel-detail2" ng-mouseup="onMouseUp($event)">';
themeTmpl += '<div class="panel-header">';
themeTmpl += '<div class="area-text no-event panel-title">';
themeTmpl += '<div class="marquee text" ng-class="{\'premium-title\' : !useRating}">{{themeData.themeTitle | uppercase}}</div>';
themeTmpl += '</div>';
themeTmpl += '</div>';
themeTmpl += '<div class="detail-brief detail-apps-brief">';
themeTmpl += '<div class="item-thumb item-theme">';
themeTmpl += '<img ng-src="{{themeData.bannerImg}}" class="thumb-img" image-resize d-img-type="APR">';
themeTmpl += '</div>';
themeTmpl += '</div>';
themeTmpl += '<div class="panel-body">';
themeTmpl += '<div class="panel-cont detail-scroller" style="padding-bottom: 5px;" ng-show="drawed">';
themeTmpl += '<div class="detail-section sec-info-detail" ng-if="themeData.description" detail-section-handle>';
themeTmpl += '<div class="sec-title detail-title" ng-bind="detailsTxt"></div>';
themeTmpl += '<div class="detail-cont">';
themeTmpl += '<div style="max-height: none;line-height: 40px;" class="synopsis-text app-detail-text" ng-bind-html="themeData.description | nl2br"></div>';
themeTmpl += '</div>';
themeTmpl += '<div class="blank btn-more item-descBtn-0" item="item-descBtn-0" ng-if="useDescMore" more-button-handle></div>';
themeTmpl += '</div>';
themeTmpl += '<div class="detail-section" ng-repeat="(parentIndex, themeCategory) in themeData.Category" ng-if="themeData.Category.length > 0 && themeCategory.contentsCategory !=\'3d\'">';
themeTmpl += '<div class="sec-title detail-title" ng-bind="themeCategory.categoryTitle"></div>';
themeTmpl += '<div class="sec-cont detail-list-apps" ng-if="themeCategory.contentsCategory == \'appsngames\'">';
themeTmpl += '<div class="blank item item-apps item-{{themeCategory.contentsCategory}}{{parentIndex}}-{{$index}}" ng-repeat="appList in themeCategory.contents.appList.rankTypeList[0].appList" item="item-{{themeCategory.contentsCategory}}{{parentIndex}}-{{$index}}" item-id="{{appList.id}}" conts-type="{{vodList.conts_type}}">';
themeTmpl += '<div class="item-thumb">';
themeTmpl += '<img ng-src="{{appList.iconURL}}" class="thumb-img" ng-hide="hideThumb" image-resize d-img-type="APP">';
themeTmpl += '</div>';
themeTmpl += '<div class="area-text item-tit"><div class="marquee text" ng-bind="appList.name"></div></div>';
themeTmpl += '<div class="app-category" ng-bind="appList.categoryName"></div>';
themeTmpl += '<div class="item-price" ng-bind="appList.dpPrice1"></div>';
themeTmpl += '<div class="list-price" ng-bind="appList.dpPrice2"><div class="price-empty"></div></div>';
themeTmpl += '</div>';
themeTmpl += '</div>';
themeTmpl += '<div class="sec-cont detail-list" ng-if="themeCategory.contentsCategory == \'tvshows\' || themeCategory.contentsCategory == \'movies\'">';
themeTmpl += '<div class="blank item item-detail2 item-{{themeCategory.contentsCategory}}{{parentIndex}}-{{$index}}" ng-repeat="vodList in (themeCategory.contents.vodList||themeCategory.contents.movieList)" item-id="{{vodList.item_id}}" conts-type="{{vodList.conts_type}}" item="item-{{themeCategory.contentsCategory}}{{parentIndex}}-{{$index}}">';
themeTmpl += '<div class="item-thumb">';
themeTmpl += '<img class="list-poster" ng-src="{{vodList.item_img}}" image-resize d-img-type="{{vodList.conts_type}}"><div class="thumbcheck" id="thumbcheck{{id}}"></div>';
themeTmpl += '</div>';
themeTmpl += '<div class="area-text item-tit">';
themeTmpl += '<div class="marquee text" ng-bind="vodList.item_name"></div>';
themeTmpl += '</div>';
themeTmpl += '<div class="item-grade list-grade" ng-hide="vodList.hideScore">';
themeTmpl += '<div class="icon percent-grade" ng-style="vodList.scoreStyle"></div>';
themeTmpl += '<div class="icon bg-grade"></div>';
themeTmpl += '</div>';
themeTmpl += '</div>';
themeTmpl += '</div>';
themeTmpl += '</div>';
themeTmpl += '</div>';
themeTmpl += '<div scroll class="scroll scroll-v"></div>';
themeTmpl += '</div>';
themeTmpl += '</div>';