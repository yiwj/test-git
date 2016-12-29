var listTmpl = '';
listTmpl += '<div class="page panel-list ">';
listTmpl += '<div class="panel-header">';
listTmpl += '<div class="area-text no-event panel-title">';
listTmpl += '<div class="marquee text" ng-bind="title"></div>';
listTmpl += '</div>';
listTmpl += '<div class="panel-sub">';
listTmpl += '<div class="sub-text sub-title" ng-bind="subtitle"></div><div class="bar-empty" ng-if="sort">/</div>';
listTmpl += '<div class="sub-text sub-sub-title" ng-show="sort" ng-bind="sort"></div>';
listTmpl += '</div>';
listTmpl += '</div>';
listTmpl += '  <div class="panel-menu">';
listTmpl += '    <div class="menu-list" ng-class="{\'depth-open\': focusedMenu == \'{{menu.code}}\' && menu.length > 0, \'blank left-menu\' : menu.length == 0, \'menu-depth\':menu.length > 0, \'on\' : menu.code == selectedMenu && !selectedCategory}" ng-repeat="menu in listData.menuList" item="{{menu.code}}">';
listTmpl += '      <div class="icon-bullet" ng-if="menu.length == 0"></div>';
listTmpl += '      <div class="area-text menu-text" ng-if="menu.length == 0"><div class="marquee text" ng-bind="menu.name"></div></div>';
listTmpl += '      <div class="blank menu-depth-header left-menu" ng-if="menu.length > 0" item="{{menu.code}}">';
listTmpl += '        <div class="area-text menu-text"><div class="marquee text" ng-bind="menu.name"></div></div><div class="icon icon-depth"></div>';
listTmpl += '      </div>';
listTmpl += '      <!-- menu-depth-drawer -->';
listTmpl += '      <div class="menu-depth-drawer" item="{{menu.code}}" ng-if="menu.length > 0">';
listTmpl += '        <div class="blank menu-list-depth" ng-repeat="filter in listData.filterList[0].values" ng-show="focusedMenu == menu.code" ng-class="{\'on\': selectedCategory == \'{{filter.code}}\' && selectedMenu == \'{{menu.code}}\', \'left-menu\': focusedMenu == menu.code}" item="submenu{{filter.code}}" item-catg="{{listData.filterList[0].key}}">';
listTmpl += '          <div class="icon-bullet"></div><div class="area-text menu-text"><div class="marquee text" ng-bind="filter.name"></div></div>';
listTmpl += '        </div>';
listTmpl += '      </div>';
listTmpl += '    </div>';
listTmpl += '  </div>';
listTmpl += '<div list-control-tvshow name="tvshowsList" itemPerRow="5" itemH="480" listtype="tvshow"></div>';
listTmpl += '</div>';

var listItemTmpl = '';
listItemTmpl += '<div ng-hide="hideItem" item-id="{{id}}" item-type="{{type}}">';
//listItemTmpl += '<div class="item-badge" ng-if="itemOverIconCode !== undefined && itemOverIconCode !== \'\'">';
//listItemTmpl += '<div class="area-text badge-text"><div class="text" ng-bind="badge"></div></div>';
//listItemTmpl += '</div>';
listItemTmpl += '<div class="img-badge_wrap" ng-if="execCpList.length > 0">';
listItemTmpl += '<div class="img-badge" ng-repeat="cp in execCpList" ng-if="cp.iconUrl != \'\'">';
listItemTmpl += '<div class="bg-badge" style="background-color:{{cp.iconColor[0]}};"></div>';
listItemTmpl += '<img class="badge-img" ng-src="{{cp.iconUrl[0]}}" />';
listItemTmpl += '</div>';
listItemTmpl += '</div>';
listItemTmpl += '<div class="item-thumb">';
listItemTmpl += '<img class="thumb-img" ng-src="{{src}}" image-resize d-img-type="{{type}}"><div class="thumbcheck" id="thumbcheck{{id}}"></div>';
listItemTmpl += '</div>';
listItemTmpl += '<div class="item-info" style="">';
listItemTmpl += '<div class="wrap-title-item">';
listItemTmpl += '<div class="area-text item-tit">';
listItemTmpl += '<div class="marquee text" ng-bind="name"></div>';
listItemTmpl += '</div>';
listItemTmpl += '<div class="item-grade list-grade" ng-hide="hideScore">';
listItemTmpl += '<div class="icon percent-grade" ng-style="scoreStyle"></div>';
listItemTmpl += '<div class="icon bg-grade"></div>';
listItemTmpl += '</div>';
listItemTmpl += '</div>';
listItemTmpl += '<div class="blank icon icon-code btn-cp-play" item="player" item-id="{{id}}" item-type="{{type}}"></div>';
listItemTmpl += '</div>';

var listControlTvshowTmpl = '';
listControlTvshowTmpl += '<div class="panel-body" ng-hide="hideListContent">';
listControlTvshowTmpl += '<div class="panel-cont list-scroller" ng-hide="hideListContent" ng-show="drawed">';
listControlTvshowTmpl += '<div class="sec-title list-title" ng-repeat="r in getSplits()" ng-class="{\'split{{r}}\': true}" ng-show="view[\'s\' + r]"></div>';
listControlTvshowTmpl += '<div class="list-cont" ng-repeat="r in getRows()" ng-class="{\'row{{r}}\': true}" ng-show="view[\'r\' + r]">';
listControlTvshowTmpl += '<div class="blank item item-list {{getSkinClass()}}" ng-repeat="c in getRowItems()" ng-class="{\'item{{r}}-{{c}}\': true}" item="item{{r}}-{{c}}" list-item></div>';
listControlTvshowTmpl += '</div>';
listControlTvshowTmpl += '<div class="wrap-no-data" ng-show="drawed && !listData.total" style="display: none;">';
listControlTvshowTmpl += '<div class="no-data-img no-tvShow"></div>';
listControlTvshowTmpl += '<div class="text" ng-bind="nodata"></div>';
listControlTvshowTmpl += '</div>';
listControlTvshowTmpl += '</div>';
listControlTvshowTmpl += '<div scroll class="scroll scroll-v"></div>';
listControlTvshowTmpl += '</div>';

var detailListTmpl = '';
detailListTmpl += '<div class="page panel-detail">';
detailListTmpl += '<div class="panel-header">';
detailListTmpl += '<div class="area-text no-event panel-title">';
detailListTmpl += '<div class="marquee text" ng-bind="title"></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div id="subTitle" class="panel-sub" ng-if="isSubTitle"><div class="sub-text sub-title" ng-bind="subTitle"></div></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="detail-brief">';
detailListTmpl += '<div class="item-thumb">';
detailListTmpl += '<img ng-src="{{posterURL}}" style="{{posterStyle}}" class="thumb-img" image-loader d-img-type="{{module}}">';
detailListTmpl += '</div>';
detailListTmpl += '<div class="blank btn btn-large" item="watch" ng-if="isWatchable()">';
detailListTmpl += '<div class="area-text"><div class="text marquee" ng-bind="labelData.watchBtn"></div></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="blank btn btn-large" item="trailer" ng-if="isAdPlayer">';
detailListTmpl += '<div class="area-text"><div class="text marquee" ng-bind="labelData.trailorBtn"></div></div>';
detailListTmpl += '</div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="panel-body">';
detailListTmpl += '<div class="panel-cont detail-scroller" ng-show="drawed">';
detailListTmpl += '<div class="detail-section sec-episode" ng-if="isSeasonData||isEpisodeData" detail-section-handle>';
detailListTmpl += '<div class="sec-title detail-title" ng-bind="labelData.seasonEpisode"></div>';
detailListTmpl += '<div class="blank btn btn-small btn-season item-seasonBtn-0" ng-class="{\'btn-open\' : $root.season.hide == false && type == \'season\'}" ng-if="isSeasonData" item="item-seasonBtn-0">';
detailListTmpl += '<div class="area-text"><div class="text marquee" ng-bind="selSeasonName"></div></div><div class="icon"></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="sec-cont detail-episode-list">';
detailListTmpl += '<div class="blank btn btn-large item-episodeBtn-{{$index}}" ng-class="{\'on\': item.isSelect == true}" item="item-episodeBtn-{{$index}}" ng-repeat="item in episode.items" ng-if="isEpisodeData" item-id="{{item.id}}">';
detailListTmpl += '<div class="area-text"><div class="text marquee" ng-bind="item.name">&nbsp;</div></div>';
detailListTmpl += '</div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="blank btn-more item-episodeMore-0" item="item-episodeMore-0" ng-if="useEpisodeMore" more-button-handle></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="sec-info-brief">';
detailListTmpl += '<div class="info-brief" ng-if="isYearData">';
detailListTmpl += '<div class="sec-title detail-title" ng-bind="labelData.yearTitle"></div>';
detailListTmpl += '<div class="info-cont" ng-bind="year.content"></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="info-brief" ng-if="isRunningTime">';
detailListTmpl += '<div class="sec-title detail-title" ng-bind="labelData.runningTitle"></div>';
detailListTmpl += '<div class="info-cont" ng-bind="runningTime.content"><div class="unit" ng-bind="labelData.runningUnit"></div></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="info-brief" ng-if="isRating && !isBrazil">';
detailListTmpl += '<div class="sec-title detail-title" ng-bind="labelData.gradeTitle"></div>';
detailListTmpl += '<div class="info-cont" ng-bind="grade.content"></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="info-brief" ng-if="isRating && isBrazil">';
detailListTmpl += '<div class="sec-title detail-title info-tit" ng-bind="labelData.gradeTitle"></div>';
detailListTmpl += '<div class="info-cont icon icon-grade-{{grade.content}}"></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="info-brief">';
detailListTmpl += '<div class="sec-title detail-title" ng-bind="labelData.availableIn"></div>';
detailListTmpl += '<div class="list-cp-icon">';
detailListTmpl += '<div class="icon-thumb" ng-repeat="cp in detailData.item_detail.exec_list.execs"><img ng-src="{{cp.img_url_cp}}" auto-item-id="{{cp.exec_app_id}}" class="thumb-img"></div>';
detailListTmpl += '<div class="icon-thumb disabled" ng-repeat="cp in cpFullList"><img ng-src="{{cp.img_url_cp}}" auto-item-id="{{cp.exec_app_id}}" class="thumb-img"></div>';
detailListTmpl += '</div>';
detailListTmpl += '</div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="detail-section sec-info-detail" ng-if="detail" detail-section-handle>';
detailListTmpl += '<div class="sec-title detail-title" ng-bind="labelData.detailTitle"></div>';
detailListTmpl += '<div class="detail-cont">';
detailListTmpl += '<div class="synopsis-info synopsis-category" ng-bind="detail.genre"></div><div class="bar-empty" ng-if="isScore">|</div>';
detailListTmpl += '<div class="item-grade synopsis-grade" ng-if="isScore"><div class="icon percent-grade" style="width: {{detail.score * 10}}%;"></div><div class="icon bg-grade"></div></div><div class="bar-empty" ng-if="actors || director">|</div>';
detailListTmpl += '<div class="synopsis-info synopsis-name" ng-bind="director"></div>';
detailListTmpl += '<div class="synopsis-info synopsis-name" ng-bind="actors"></div>';
detailListTmpl += '<div class="synopsis-text" ng-bind="detail.content"></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="blank btn-more item-descBtn-0" item="item-descBtn-0" ng-if="useDescMore" more-button-handle></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="detail-section sec-detail-list" ng-if="isRecommendData" detail-section-handle>';
detailListTmpl += '<div class="sec-title detail-title" ng-bind="labelData.recommendTitle"></div>';
detailListTmpl += '<div class="sec-cont detail-list">';
detailListTmpl += '<div class="blank item item-detail {{getSkinClass()}} item-recommend-{{$index}}" item="item-recommend-{{$index}}" ng-repeat="item in recommend.items" ng-if="item.showRecommend" item-type="recommend" item-id="{{item.id}}">';
detailListTmpl += '<div class="item-thumb">';
detailListTmpl += '<img class="detail-item-poster detail-item-recommend" ng-src="{{item.img}}" class="thumb-img" image-resize d-img-type="{{module}}" >';
detailListTmpl += '</div>';
detailListTmpl += '<div class="area-text item-tit"><div class="marquee text" ng-bind="item.title"></div></div>';
detailListTmpl += '</div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="blank btn-more item-recommendBtn-0" item="item-recommendBtn-0" ng-if="recommendData.length > recommColCount" more-button-handle></div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="detail-section sec-detail-list" ng-if="isPhotoData" detail-section-handle>';
detailListTmpl += '<div class="sec-title detail-title" ng-bind="labelData.photoTitle"></div>';
detailListTmpl += '<div class="sec-cont detail-list-trailer">';
detailListTmpl += '<div class="blank item item-trailer item-video item-photo-{{$index}}" item="item-photo-{{$index}}" ng-repeat="item in photo.items" ng-if="item.showPhoto" item-type="photo" item-id="{{item.id}}">';
detailListTmpl += '<div class="item-thumb">';
detailListTmpl += '<img class="detail-photo-poster" ng-src="{{item.img}}" class="thumb-img" image-resize d-img-type="{{item.type ? \'VD\' : \'PT\'}}" />';
detailListTmpl += '</div>';
detailListTmpl += '<div ng-if="item.type" class="icon-player icon-video"></div>';
detailListTmpl += '</div>';
detailListTmpl += '</div>';
detailListTmpl += '<div class="blank btn-more item-photoBtn-0" item="item-photoBtn-0" ng-if="photoData.length > 4" more-button-handle></div>';
detailListTmpl += '</div>';
detailListTmpl += '</div>';
detailListTmpl += '<div scroll class="scroll scroll-v"></div>';
detailListTmpl += '</div>';
detailListTmpl += '</div>';