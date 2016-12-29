var drawerTmpl = '';
drawerTmpl += '<div class = "drawer" item = "drawer">';
drawerTmpl += '<div class="blank drawer-category drawer-{{item.name}}" title="{{item.title}}" index="{{item.index}}" item="{{item.name}}" ng-repeat="item in menu" ng-class="{\'focus\': focusItem==\'{{item.name}}\'}"></div>';
drawerTmpl += '</div>';

var optionTmpl = '';
optionTmpl += '<div class="popup-list-option" ng-class="{\'popup-open\': open}" ng-hide="hide">';
optionTmpl += '<div class="wrap-filter {{getColumnClass($index)}}" ng-repeat="option in options" ng-if="!hide">';
optionTmpl += '<div class="sec-title list-title" ng-bind="option.name"></div>';
optionTmpl += '<div class="blank option-list" item="{{item.code}}" index="{{option.idx}}-{{item.idx}}" ng-class="{\'check-on\': selected{{option.filter}}==\'{{item.code}}\'}" ng-repeat="item in option.values">';
optionTmpl += '<div class="icon icon-check"></div>';
optionTmpl += '<div class="area-text"><div class="marquee text" ng-bind="item.name"></div></div>';
optionTmpl += '</div>';
optionTmpl += '</div>';
optionTmpl += '<div class="blank btn btn-icon btn-pop-close" item="close"><div class="icon"></div></div>';
optionTmpl += '</div>';

var ratingTmpl = '';
ratingTmpl += '<div class="popup-modal-rating" ng-class="{\'open\': open}" ng-hide="hide">';
ratingTmpl += '<div class="popup-contextual pop-rating" ng-mouseenter="onMouseEnter($event)"';
ratingTmpl += ' ng-mouseleave="onMouseLeave($event)" style="left: 83.30rem;top: 12rem;z-index: 1;">';
ratingTmpl += '<div class="pop-rating-title" ng-bind="title"></div>';
ratingTmpl += '<div class="pop-rating-cont">';
ratingTmpl += '<div class="blank icon btn-score star{{$index}}" ng-class="{\'on\': star.point}" ng-repeat="star in starList" item="star{{$index}}"></div>';
ratingTmpl += '</div>';
ratingTmpl += '<div class="wrap-btn-rating" ng-if="!alreadyRating">';
ratingTmpl += '<div class="blank btn-popup btn-small btn01" item="btn01" ng-if="button1">';
ratingTmpl += '<div class="area-text"><div class="text marquee" ng-bind="button1"></div></div>';
ratingTmpl += '</div><div class="blank btn-popup btn-small btn02" item="btn02" ng-if="button2">';
ratingTmpl += '<div class="area-text"><div class="text marquee" ng-bind="button2"></div></div>';
ratingTmpl += '</div>';
ratingTmpl += '</div>';
ratingTmpl += '<div class="bg-empty"><div class="bg-empty-inner"></div><div class="bg-empty-inner2"></div></div>';
ratingTmpl += '</div>';
ratingTmpl += '</div>';

var seasonTmpl = '';
seasonTmpl += '<div class="popup-modal-season" ng-hide="hide">';
seasonTmpl += '<div class="popup-contextual pop-{{type}}" ng-style="popStyle" ng-class="{\'open\': open}" ng-if="!hide">';
seasonTmpl += '<div class="pop-opt-cont">';
seasonTmpl += '<div class="wrap-opt-list season-scroller">';
seasonTmpl += '<div class="blank option-list item-season-{{$index}}" ng-class="{\'on\': item.isSelect}" item="item-season-{{$index}}" select="{{item.isSelect}}" ng-repeat="item in data.items" item-type="season" item-id="{{item.id}}">';
seasonTmpl += '<div class="icon-bullet"></div>';
seasonTmpl += '<div class="area-text"><div class="marquee text" ng-class="{\'dir-ltr\': item.isLTR}">{{item.name}}&nbsp;{{data.unit}}</div></div>';
seasonTmpl += '</div>';
seasonTmpl += '</div>';
seasonTmpl += '<div scroll class="scroll scroll-v"></div>';
seasonTmpl += '</div>';
seasonTmpl += '<div class="bg-empty bg-left" ng-style="arrowStyle"><div class="bg-empty-inner"></div><div class="bg-empty-inner2"></div></div>';
seasonTmpl += '</div>';
seasonTmpl += '</div>';

var popupAppTmpl = '';
popupAppTmpl += '<div class="popup-dialog" ng-hide="hide" ng-class="{\'open\': open}">';
popupAppTmpl += '<div class="popup-basic" ng-if="!hide">';
 //20150804 dukim.kim, 개발 확인 후 아래 라인 삭제하고 위 두줄 적용  */
//popupAppTmpl += '<div class="popup-basic" ng-hide="hide" ng-class="{\'open\': open}">';
popupAppTmpl += '<div ng-if="type==\'popup\'">';
popupAppTmpl += '<div class="popup-header">';
popupAppTmpl += '<div class="wrap-title-popup">';
popupAppTmpl += '<div class="area-text no-event popup-title">';
popupAppTmpl += '<div class="marquee text" ng-bind="title"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="wrap-btn-popup">';
popupAppTmpl += '<div class="blank btn-popup btn-small btn01" item="btn01" ng-if="button1">';
popupAppTmpl += '<div class="area-text">';
popupAppTmpl += '<div class="text marquee" ng-bind="button1"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="blank btn-popup btn-small btn02" item="btn02" ng-if="button2">';
popupAppTmpl += '<div class="area-text">';
popupAppTmpl += '<div class="text marquee" ng-bind="button2"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="blank btn-popup btn-small btn03" item="btn03" ng-if="button3">';
popupAppTmpl += '<div class="area-text">';
popupAppTmpl += '<div class="text marquee" ng-bind="button3"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="popup-cont" ng-bind-html="desc | nl2br"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div ng-if="type==\'error\'">';
popupAppTmpl += '<div class="popup-header">';
popupAppTmpl += '<div class="wrap-title-popup">';
popupAppTmpl += '<div class="area-text no-event popup-title">';
popupAppTmpl += '<div class="marquee text" ng-bind="title"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="wrap-btn-popup">';
popupAppTmpl += '<div class="blank btn-popup btn-small" item="close">';
popupAppTmpl += '<div class="area-text"><div class="text marquee" ng-bind="okTxt"></div></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="popup-cont popup-error">';
popupAppTmpl += '{{errorMsg}}';
popupAppTmpl += '<div class="blank icon icon-code" item="error"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div ng-if="type==\'usb\'">';
popupAppTmpl += '<div class="popup-header">';
popupAppTmpl += '<div class="wrap-title-popup">';
popupAppTmpl += '<div class="area-text no-event popup-title">';
popupAppTmpl += '<div class="marquee text" ng-bind="title"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="popup-sub-text" ng-bind="usbDesc"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="wrap-btn-popup">';
popupAppTmpl += '<div class="blank btn-popup btn-small btn01" item="btn01" ng-if="button1">';
popupAppTmpl += '<div class="area-text"><div class="text marquee" ng-bind="button1"></div></div>';
popupAppTmpl += '</div><div class="blank btn-popup btn-small btn02" item="btn02" ng-if="button2">';
popupAppTmpl += '<div class="area-text"><div class="text marquee" ng-bind="button2"></div></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="pop-external-memory" ng-if="usbListData">';
popupAppTmpl += '<div class="blank memory-list usbList{{$index}}" ng-repeat="usb in usbListData" item="usbList{{$index}}"';
popupAppTmpl += 'device-id="{{usb.deviceId}}" drive-id="{{usb.driveId}}" ng-class="{\'check-on\': (selectedDeviceId == usb.deviceId) && (selectedDriveId == usb.driveId)}">';
popupAppTmpl += '<div class="icon icon-check"></div>';
popupAppTmpl += '<div class="area-text"><div class="marquee text">USB{{usb.portNum}} : [{{usb.freeSpace}} Free] {{usb.deviceName}}';
popupAppTmpl += '({{usb.partitionInfo}})</div></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div ng-if="type==\'package\'">';
popupAppTmpl += '<div class="popup-header">';
popupAppTmpl += '<div class="wrap-title-popup">';
popupAppTmpl += '<div class="area-text no-event popup-title">';
popupAppTmpl += '<div class="marquee text" ng-bind="title"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="popup-sub-text" ng-bind="packageGuide"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="wrap-btn-popup">';
popupAppTmpl += '<div class="blank btn-popup btn-small btn01" item="btn01" ng-if="button1">';
popupAppTmpl += '<div class="area-text"><div class="text marquee" ng-bind="button1"></div></div>';
popupAppTmpl += '</div><div class="blank btn-popup btn-small btn02" item="btn02" ng-if="button2">';
popupAppTmpl += '<div class="area-text"><div class="text marquee" ng-bind="button2"></div></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="pop-list-package">';
popupAppTmpl += '<div class="blank item item-apps item-package-{{$index}}" data-act="launch" item="item-package-{{$index}}" item-id="{{loopAppInfo.id}}" ng-repeat="loopAppInfo in packageListData">';
popupAppTmpl += '<div class="item-thumb">';
popupAppTmpl += '<img ng-src="{{loopAppInfo.iconURL}}" class="thumb-img">';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="area-text item-tit"><div class="marquee text" ng-bind="loopAppInfo.name"></div></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div ng-if="type==\'watch\'" class="view-popup">';
popupAppTmpl += '<div class="popup-header">';
popupAppTmpl += '<div class="wrap-title-popup">';
popupAppTmpl += '<div class="area-text no-event popup-title">';
popupAppTmpl += '<div class="marquee text" ng-bind="title"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="popup-sub-text" ng-bind="desc"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="wrap-btn-popup">';
//popupAppTmpl += '<div class="blank btn-popup btn-small btn-setCp" item="setCp">';
//popupAppTmpl += '<div class="area-text"><div class="text marquee">{{watchSetBtn}}</div></div>';
//popupAppTmpl += '</div>';
popupAppTmpl += '<div class="blank btn-popup btn-small btn-close" item="close">';
popupAppTmpl += '<div class="area-text"><div class="text marquee" ng-bind="watchClose"></div></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="pop-list-cp">';
popupAppTmpl += '<div class="blank item item-apps {{item.execId}}" isSameDevice="{{item.isSameDevice}}" premiumAppFlag = "{{item.premiumAppFlag}}" item="{{item.execId}}" execItemId="{{item.execItemId}}" appId ="{{item.execAppId}}" price="{{item.execPrice}}" index="{{$index}}" ng-style="item.style" ng-repeat="item in items">';
popupAppTmpl += '<div class="item-thumb">';
popupAppTmpl += '<img ng-src="{{item.execImgUrl}}" class="thumb-img">';
popupAppTmpl += '</div>';
popupAppTmpl += '<div class="area-text item-tit"><div class="marquee text">{{item.execAppName}}-{{item.execContsName}}</div></div>';
popupAppTmpl += '<div class="item-attribute" ng-repeat="disp in item.addInfoDisp" ng-bind="disp"></div>';
popupAppTmpl += '<div class="item-price" ng-bind="item.execPrice"></div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>';
popupAppTmpl += '</div>'; /* 20150804 dukim.kim 개발 확인 후 적용요망 */

var popupMainTmpl = '';
popupMainTmpl += '<div class="popup-main-error" ng-class="{\'showing\': showing, \'open\': open}" ng-hide="hide">';
popupMainTmpl += '<div ng-if="isHeader">';
popupMainTmpl += '<div header class="header"></div>';
popupMainTmpl += '</div>';
popupMainTmpl += '<div ng-if="isPopup" class="isPopup">';
popupMainTmpl += '<div class="wrap-main-error">';
popupMainTmpl += '<div class="tit" ng-bind="popOpts.lgContentStore"></div>';
popupMainTmpl += '<div class="text">{{popOpts.title}}<br>{{popOpts.subTitle}}</div>';
popupMainTmpl += '<div class="blank button btn btn-large" item="ok">';
popupMainTmpl += '<div class="area-text">';
popupMainTmpl += '<div class="text marquee" ng-bind="popOpts.button"></div>';
popupMainTmpl += '</div>';
popupMainTmpl += '</div>';
popupMainTmpl += '</div>';
popupMainTmpl += '</div>';
popupMainTmpl += '</div>';

var playerTmpl = '';
playerTmpl += '<div class="player" ng-class="{\'open\': open}" ng-hide="hide">';
playerTmpl += '<div class="screen-dim" ng-hide="hideScreenDim"></div>';
playerTmpl += '<video movie-player video-current-time="currentTime" video-end-time="videoEndTime" control-Tick="controlTick" begint-tick="begintTick" end-tick="endTick" playing="playing" play-cont="playCont" class="movie-player" autoplay="autoplay" name="media" style="width:100%;height:100%;position:absolute" src="">';
playerTmpl += '<source id="movie_player_src" src="" isPlayControl="" type="video/mp4;mediaOption=&quot;%7B%22htmlMediaOption%22%3A%7B%22useUMSMediaInfo%22%3Atrue%7D%7D&quot;">';
playerTmpl += '</video>';
playerTmpl += '<div class="player_thumb" item="imgPoster" style="display: block; background-image: url({{getImgPosterUrl()}});"></div>';
playerTmpl += '<div class="player-header" item="header" ng-class="{\'headOpen\': headOpen, \'video-header\': isMovie}" ng-hide="controlHide" ng-if="controlOpen">';
playerTmpl += '<div class="area-text no-event player-title">';
playerTmpl += '<div class="marquee text" ng-bind="trailerData.title"></div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '<div class="player-cont" item="control">';
playerTmpl += '<div ng-class="{\'controlOpen\': controlOpen}" ng-hide="controlHide" ng-if="controlOpen">';
playerTmpl += '<div class="player-control">';
playerTmpl += '<div class="blank icon-player btnIcon-1 btn-jumpbackward" item="btnIcon-1" ng-if="!fromTrailerBtn"></div>';
playerTmpl += '<div class="blank icon-player btnIcon-2 btn-{{playControl}}" ng-init="isPause = false" item="btnIcon-2"></div>';
playerTmpl += '<div class="blank icon-player btnIcon-3 btn-jumpforward" item="btnIcon-3" ng-if="!fromTrailerBtn"></div>';
playerTmpl += '<div class="blank icon-player btnIcon-0 btn-back" item="btnIcon-0"></div>';
playerTmpl += '<div class="blank icon-player btnIcon-4 btn-slide-show" item="btnIcon-4" ng-if="trailerData.data.length > 1"></div>';
playerTmpl += '</div>';
playerTmpl += '<div class="player-time-wrap">';
playerTmpl += '<div class="time time-play" ng-bind="begintTick"></div>';
playerTmpl += '<div class="time slash-bar-empty" ng-if="isMovie">/</div>';
playerTmpl += '<div class="time slash-bar-empty" ng-if="!isMovie">&nbsp;</div>';
playerTmpl += '<div class="time time-remain" ng-bind="endTick"></div>';
playerTmpl += '</div>';
playerTmpl += '<div class="player-progress-wrap">';
playerTmpl += '<div class="player-progress" ng-if="isMovie" item="progress" ng-mousemove="onMouseMove($event)" ng-mouseleave="onMouseLeave($event)" ng-mousedown="onMouseDown($event)">';
playerTmpl += '<div class="bar-play" style="width:{{playing}}%;"></div>';
playerTmpl += '<div class="pointer-wrap">';
playerTmpl += '<div class="empty-pointer" item="pointer" style="display: none;"></div>';
playerTmpl += '<div class="current-time" style="display: none;">{{controlTick}}</div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '<div class="player-slide" ng-class="{\'slideOpen\': slideOpen}" ng-hide="slideHide">';
playerTmpl += '<div class="player-slide-head">';
playerTmpl += '<div class="area-text no-event slide-title">';
playerTmpl += '<div class="marquee text" ng-bind="trailerData.title"></div>';
playerTmpl += '</div>';
playerTmpl += '<div class="wrap-btn-slide">';
playerTmpl += '<div class="player-slide-speed">';
playerTmpl += '<div class="blank btn btn-large btn-fixed-icon btn-player-opt btnSpeed" ng-class="{\'btn-open\': speedOpen}" item="btnSpeed">';
playerTmpl += '<div class="area-text"><div class="text marquee" ng-bind="trailer.labelData.speed"></div></div><div class="icon"></div>';
playerTmpl += '</div>';
playerTmpl += '<div class="txt-speed">{{trailer.slideShow.nameMap[trailer.slideShow.currentSpeed].name}}</div>';
playerTmpl += '<div class="popup-contextual pop-play-opt" ng-hide="speedHide">';
playerTmpl += '<div class="pop-play-cont">';
playerTmpl += '<div class="blank option-list speed-{{data.idx}}" ng-repeat="(key, data) in trailer.slideShow.nameMap" item="speed-{{key}}" ng-class="{\'on\': trailer.slideShow.currentSpeed == key}">';
playerTmpl += '<div class="icon-bullet"></div>';
playerTmpl += '<div class="area-text"><div class="marquee text" ng-bind="data.name"></div></div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '<div class="bg-empty bg-bottom"><div class="bg-empty-inner"></div><div class="bg-empty-inner2"></div></div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '<div class="blank btn btn-large btnClose" item="btnClose">';
playerTmpl += '<div class="area-text"><div class="text marquee" ng-bind="trailer.labelData.close"></div></div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '<div class="player-slide-cont">';
playerTmpl += '<div class="player-scroller" ng-style="slide">';
playerTmpl += '<div class="blank item-slide item-{{$index}}" ng-class="{\'on\' : $index == trailer.idx, \'item-video\' : item.type == \'V\'}" ng-repeat="item in getSlideImages()" item="item-{{$index}}">';
playerTmpl += '<img ng-src="{{item.thumb}}" class="thumb-img" player-thumb-resizable>';
playerTmpl += '<div class="frame-empty"></div>';
playerTmpl += '<div class="icon-player icon-video"></div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '<div class="scroll scroll-h">';
playerTmpl += '<div class="blank icon scroll-prev" item="scroll-prev"></div>';
playerTmpl += '<div class="scroll-area"><div class="scroll-bar" style="width: 454px; left: 0px;"></div></div>';
playerTmpl += '<div class="blank icon scroll-next" item="scroll-next"></div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '<div class="player-end" ng-hide="hideTrailerEndButtons">';
playerTmpl += '<div class="blank btn btn-large btnPlayMovie" item="btnPlayMovie">';
playerTmpl += '<div class="area-text"><div class="text marquee" ng-bind="trailerEndBtn.playMovie"></div></div>';
playerTmpl += '</div><div class="blank btn btn-large btnReplayTrailer" item="btnReplayTrailer">';
playerTmpl += '<div class="area-text"><div class="text marquee" ng-bind="trailerEndBtn.replayTrailer"></div></div>';
playerTmpl += '</div><div class="blank btn btn-large btnCloseTrailer" item="btnCloseTrailer">';
playerTmpl += '<div class="area-text"><div class="text marquee" ng-bind="trailerEndBtn.close"></div></div>';
playerTmpl += '</div>';
playerTmpl += '</div>';
playerTmpl += '</div>';

//var guideTmpl = '';
//guideTmpl += '<div ng-if="isViewGuide" class="help-guide">';
//guideTmpl += '  <div class="guide-box guide-box-1">';
//guideTmpl += '    <div class="guide-tit">{{guide_10}}Quick Access Menu</div>';
//guideTmpl += '    <div class="guide-text">{{guide_10_desc}}Go directly to the Main, Categories or Search pages to find the content you want.</div>';
//guideTmpl += '  </div>';
//guideTmpl += '  <div class="guide-box guide-box-2">';
//guideTmpl += '    <div class="guide-tit">{{guide_11}}Promotion Content</div>';
//guideTmpl += '    <div class="guide-text">{{guide_11_desc}}Click arrow buttons to see more available content.</div>';
//guideTmpl += '  </div>';
//guideTmpl += '  <div class="guide-box guide-box-3">';
//guideTmpl += '    <div class="guide-tit">{{guide_12}}Updated Content</div>';
//guideTmpl += '    <div class="guide-text">{{guide_12_desc}}Discover the latest and most popular content and apps.</div>';
//guideTmpl += '  </div>';
//guideTmpl += '  <div class="guide-box guide-box-4">';
//guideTmpl += '    <div class="guide-text">{{guide_13}}Access this screen at any time from My Page > Guide.</div>';
//guideTmpl += '    <div class="blank btn btn-large guide-close-button" item="close">';
//guideTmpl += '      <div class="area-text"><div class="text marquee">{{close}}</div></div>';
//guideTmpl += '    </div>';
//guideTmpl += '  </div>';
//guideTmpl += '</div>';

var tooltipTmpl = '';
tooltipTmpl += '<div class="tooltip tooltip-multiline2" ng-hide="hide" ng-style="style" ng-class="customClass()">';
tooltipTmpl += '<div ng-switch on="isSeason">';
tooltipTmpl += '<span ng-switch-when="true">';
tooltipTmpl += '<div class="area-text">';
tooltipTmpl += '<div class="text">{{title}}<br>{{seasonDate}}</div><div class="bg-empty"></div>';
tooltipTmpl += '</div>';
tooltipTmpl += '</span>';
tooltipTmpl += '<span ng-switch-default>';
tooltipTmpl += '{{title}}<div class = "bg-empty"></div>';
tooltipTmpl += '</span>';
tooltipTmpl += '</div>';
tooltipTmpl += '</div>';

var depth2AdTmpl = '';
depth2AdTmpl += '<div class="blank ad-banner item-video" ng-class="{\'focus\': adFocus && !fullScreen}" ng-show="show" item="depth2Ad" adContextIndex="{{adRes.adContextIndex}}" assetId="{{adRes.assetId}}">';
depth2AdTmpl += '</div>';

var depth2AdSubTmpl = '';
depth2AdSubTmpl += '<div class="ad-dim" style="visibility:visible">';
depth2AdSubTmpl += '<div class="thumb" id="videothumb">';
depth2AdSubTmpl += '<video preload="metadata" autoplay="" style="opacity: 1; width: 100%; height: 100%;" data-time="' + new Date().getTime() + '" video-handler>';
depth2AdSubTmpl += '</video>';
depth2AdSubTmpl += '<img id="adDefaultImage" ng-src="{{defaultImg}}" style="display:none;" class="thumb-img"/>';
depth2AdSubTmpl += '<div class="icon-player icon-video"></div>';
depth2AdSubTmpl += '<div class="bg-icon"></div>';
depth2AdSubTmpl += '</div>';
depth2AdSubTmpl += '<div class="area-text ban-text">';
depth2AdSubTmpl += '<div class="text">AD SPONSOR</div>';
depth2AdSubTmpl += '</div>';
depth2AdSubTmpl += '<div class="info-time" style="display:none;"><div class="time-text"></div><div class="blank btn btn-icon btn-pop-close" ng-class="{\'focus\': closeFocus && fullScreen}" item="close"><div class="icon"></div></div></div>';
depth2AdSubTmpl += '<div class="blank btn btn-icon btn-pop-close img-close" style="display:none;" item="close"><div class="icon"></div></div>';
depth2AdSubTmpl += '<div class="blank btn btn-ad btn-ad-more" style="display:none;">';
depth2AdSubTmpl += '<div class="area-text"><div class="text marquee">more</div></div>';
depth2AdSubTmpl += '</div>';
depth2AdSubTmpl += '<div class="blank ad-inset-ban" style="display:none;" item="banner"><img ng-src="{{bannerImg}}" class="thumb-img"></div>';
depth2AdSubTmpl += '</div>';

var videoTagTmpl = '';
videoTagTmpl += '<video preload="metadata" autoplay="" style="opacity: 1;" data-time="' + new Date().getTime() + '" video-handler>';
videoTagTmpl += '<source src="{{src}}" type="video/mp4;mediaOption={{mediaOption}}">';
videoTagTmpl += '</video>';

var sourceTagTmpl = '';
sourceTagTmpl += '<source src="{{src}}" type="video/mp4;mediaOption={{mediaOption}}">';

var mainAdTmpl = '';
mainAdTmpl += '<div class="blank ad-banner ad-banner-main item-video ad-banner-autoPlay" ng-class="{\'focus\': adFocus && !fullScreen}" ng-show="show" item="mainAd">';
mainAdTmpl += '</div>';

var mainAdSubTmpl = '';
mainAdSubTmpl += '<div class="ad-dim" style="visibility:visible">';
mainAdSubTmpl += '<div class="thumb" id="mainvideothumb">';
mainAdSubTmpl += '<video preload="metadata" autoplay="" style="opacity: 1;" data-time="' + new Date().getTime() + '" video-handler>';
mainAdSubTmpl += '</video>';
mainAdSubTmpl += '<img id="adDefaultImage" ng-src="{{defaultImg}}" style="display:none;" class="thumb-img"/>';
mainAdSubTmpl += '<div class="icon-player icon-video"></div>';
mainAdSubTmpl += '<div class="bg-icon"></div>';
mainAdSubTmpl += '</div>';
mainAdSubTmpl += '<div class="info-time" style="display:none;"><div class="time-text"></div><div class="blank btn btn-icon btn-pop-close" ng-class="{\'focus\': closeFocus && fullScreen}" item="close"><div class="icon"></div></div></div>';
mainAdSubTmpl += '<div class="blank btn btn-icon btn-pop-close img-close" style="display:none;" item="close"><div class="icon"></div></div>';
mainAdSubTmpl += '<div class="blank btn btn-ad btn-ad-more" style="display:none;">';
mainAdSubTmpl += '<div class="area-text"><div class="text marquee">more</div></div>';
mainAdSubTmpl += '</div>';
mainAdSubTmpl += '<div class="blank ad-inset-ban" style="display:none;" item="banner"><img ng-src="{{bannerImg}}" class="thumb-img"></div>';
mainAdSubTmpl += '</div>';

var prerollAdTmpl = '<div class="ad-player item-video" ng-show="show" item="prerollAd"></div>';

var prerollAdTmplInner = '';
prerollAdTmplInner += '<video id="prerollvideo" preload="metadata" autoplay="" style="opacity: 1; width:100%;height:100%" >';
//prerollAdTmplInner += '<source src="{{src}}" type="video/mp4;mediaOption={{mediaOption}}">';
prerollAdTmplInner += '</video>';

//prerollAdTmplInner += '<div class="player-cont">';
//prerollAdTmplInner += '<div id="skipbtn" item="skipbtn" ng-show="skipshow" class="blank btn btn-ad btn-ad-skip">';
//prerollAdTmplInner += '<div id="skip" class="area-text"><div id="skipText" class="text marquee">skip ad</div></div>';
//prerollAdTmplInner += '</div>';
//prerollAdTmplInner += '<div id="progress" item = "progress" class="player-progress">';
//prerollAdTmplInner += '<div class="bar-buffering" style="width:0%;"></div>';
//prerollAdTmplInner += '<div class="bar-play" style="width:0%;"></div>';
//prerollAdTmplInner += '<div class="time time-play">00:00</div>';
//prerollAdTmplInner += '<div class="time time-remain">00:00</div>';
//prerollAdTmplInner += '</div>';
//prerollAdTmplInner += '</div>';
//prerollAdTmpl += '</div>';

prerollAdTmplInner += '<div class="player-cont">';
prerollAdTmplInner += ' <div id="skipbtn" item="skipbtn" ng-show="skipshow" class="blank btn btn-ad btn-ad-skip">';
prerollAdTmplInner += '   <div id="skip" class="area-text"><div id="skipText" class="text marquee">skip ad</div></div>';
prerollAdTmplInner += ' </div>';
prerollAdTmplInner += ' <div id="progresstime" class="player-time-wrap">';
prerollAdTmplInner += '   <div class="time time-play">00:00:00</div>';
prerollAdTmplInner += '   <div class="time slash-bar-empty">/</div>';
prerollAdTmplInner += '   <div class="time time-remain">00:00:00</div>';
prerollAdTmplInner += ' </div>';
prerollAdTmplInner += ' <div id="progress" class="player-progress-wrap">';
prerollAdTmplInner += '   <div item="progresss" class="player-progress">';
prerollAdTmplInner += '     <div class="bar-buffering" style="width:60%;"></div>';
prerollAdTmplInner += '     <div class="bar-play" style="width:40%;"></div>';
prerollAdTmplInner += '   </div>';
prerollAdTmplInner += ' </div>';
prerollAdTmplInner += '</div>';


var scrollTmpl = '';
scrollTmpl += '<div class="blank icon scroll-prev" item="prev" ng-class="{\'focus\': focusInPrev}"></div>';
scrollTmpl += '<div class="scroll-area"><div class="scroll-bar"></div></div>';
scrollTmpl += '<div class="blank icon scroll-next" item="next" ng-class="{\'focus\': focusInNext}"></div>';

var headerTmpl = '';
headerTmpl += '<div class="main-header">';
headerTmpl += ' <div class="header-tit" ng-bind="title"></div>';
headerTmpl += ' <img class="thumb-img" ng-src="{{current.src}}" ng-hide="hideImage">';
headerTmpl += ' <div class="header-item">';
headerTmpl += ' <div class="item-category" ng-bind="current.genre"></div>';
headerTmpl += ' <div class="item-tit" ng-bind="current.name"></div>';
headerTmpl += ' <div class="item-text" ng-bind="current.desc"></div>';
headerTmpl += ' <div item="more" class="blank btn btn-small" ng-class="{\'focus\': focusInMore}" ng-hide="!more">';
headerTmpl += ' <div class="area-text"><div class="text marquee" ng-bind="more"></div></div>';
headerTmpl += ' </div>';
headerTmpl += ' </div>';
headerTmpl += ' <div item="left" class="blank btn btn-icon btn-main-prev" ng-class="{\'focus\': focusInLeft}"><div class="icon"></div></div>';
headerTmpl += ' <div item="right" class="blank btn btn-icon btn-main-next" ng-class="{\'focus\': focusInRight}"><div class="icon"></div></div>';
headerTmpl += ' <div class="header-mask" ng-class="{\'mask-block\' : maskBlock}"></div>';
headerTmpl += '</div>';

var breadcrumbTmpl = '';
breadcrumbTmpl += '<div class="panels-breadcrumbs" ng-hide="hide">';
breadcrumbTmpl += '<!-- <div class="panels-breadcrumbs"> -->';
breadcrumbTmpl += '	<div class="breadcrumb blank showing" ng-class="{\'focus\': focus1}" item="breadcrumb1">';
breadcrumbTmpl += '		<div class="breadcrumb-bar"></div><div class="step" ng-bind="stepIndex1"></div><div class="icon icon-panel-back"></div>';
breadcrumbTmpl += '	</div>';
breadcrumbTmpl += '	<div class="breadcrumb blank" ng-class="{\'focus\': focus2}" item="breadcrumb2">';
breadcrumbTmpl += '		<div class="breadcrumb-bar"></div><div class="step" ng-bind="stepIndex2"></div><div class="icon icon-panel-back"></div>';
breadcrumbTmpl += '	</div>';
breadcrumbTmpl += '</div>';