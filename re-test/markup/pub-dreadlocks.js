/*--------------------- Markup Sample js(Store App / WebOS 3.0) --------------------- */
UI = {
  isLite : false, //Lite 버전 설정
  isRtl : false, //Rtl 버전 설정
  isPopupRtl : false, //Popup Rtl 설정
  isHoverMode : true, //true : :hover css, false : .focus 클래스 추가 삭제
  focusCurrent : null, //Current Focused
  //isNohoverMode : false, 적용안함
  //isNohover : false, //적용안함
  focusClass : 'focus',
  targetClass : 'blank',
  rtlClass : 'dir-rtl',
  ltrClass : 'dir-ltr',
  hoverModeClass : 'hover-mode',
  noHoverClass : 'nohover', //적용안함
  /**
   * load
   */
  load : function(){
    this.lite();
    this.focusCtrl();
    this.marquee();
    this.thumbReisze();
    this.accordion();
    this.moreLess();
    this.listOption();
    this.rtlCtrl();
    //this.panelsAnimation();  //panels.html
    //featured
    if(document.getElementsByClassName('header-item-cnts').length)
      this.featuredHeaderRolling();
    if(document.getElementsByClassName('item-main-wrap').length)
      this.featuredCntsRolling();
  },
  /**
   * Lite Css Load
   */
  lite : function () {
    if(this.isLite) {
      document.getElementsByTagName('link')[1].href = '../css/store17-animation-lite.css';
    }
  },
  /**
   * Focus Control
   */
  focusCtrl : function(){
    var init = function(){
      /*if(UI.isNohoverMode) { //적용안함
        document.getElementsByTagName('link')[0].href = '../css/store16-nohover.css';
        document.body.classList.add('nohover_');
        if(UI.isNohover) {
          document.body.classList.add(UI.noHoverClass);
          console.log('noHover noHover');
        } else {
          document.body.classList.remove(UI.hoverModeClass);
          console.log('noHover hover');
        }
      } else { //현재 적용되어 있는 방식*/
        if(UI.isHoverMode) {
          document.body.classList.add(UI.hoverModeClass);
          //console.log('hover-mode hover-mode');
        } else {
          document.body.classList.remove(UI.hoverModeClass);
          //console.log('hover-mode focus-mode');
        }
      /*}*/
    }
    var focusIn = function(e){
      if(!e.classList.contains(UI.targetClass)) return;
      UI.focusCurrent = e;
      if(!UI.isHoverMode) e.classList.add(UI.focusClass);
    }
    var focusOut = function(e){
      if(!e.classList.contains(UI.targetClass)) return;
      UI.focusCurrent = e;
      if(!UI.isHoverMode) e.classList.remove(UI.focusClass);
    }
    init();
    //event
    document.getElementsByTagName('html')[0].addEventListener('mouseover', function(e){
      focusIn(e.target);
    });
    document.getElementsByTagName('html')[0].addEventListener('mouseout', function(e){
      focusOut(e.target);
    });
   /* document.getElementsByTagName('html')[0].addEventListener('click', function(e){
      document.getElementsByClassName('popup-dialog')[0].style.display = 'block';
      UI.isHoverMode = true;
      document.body.classList.add(UI.hoverModeClass);
    });*/
  },
  /**
   * Marquee Text
   */
  marquee : function(){
    var timer = null,
        timerAutoSet = null,
        timerAutoStart = null,
        timeVal = null;
    var init = function(e, m){
      if(m == 'out') stopTimer(); //mouseOut
      var i=0, len = e.length;
      for(i; i<len ; i++) {
        var ele = e[i];
        if(m == 'auto') {autoPlay(ele, m);} //autoPlay
        else if(m == 'out') {marqueeDel(ele);} //mouseOut
        else {playSetProp(ele, m);} //mouseOver
      }
    }
    var playSetProp = function(e, m) {
      var target = e,
          width = 0,
          time = 0;
      width = target.scrollWidth - target.parentElement.clientWidth;;
      if (width <= 0) return;
      time = Number((width / 40).toFixed(2));
      playSet(target, m, width, time);
    }
    var playSet = function(e, m, w, t){
      aniSet(e);
      if(m == 'auto') {
        timerAutoSet = timeClearSet(e, m, w, t);
        //console.log('timerAutoSet', timerAutoSet);
      } else {
        timer = timeClearSet(e, m, w, t);
        //console.log('timer', timer);
      }
    }
    var playStart = function(e, m, w, t){
      var _w = (( UI.isRtl && !e.classList.contains('dir-ltr') ) ? '+' : '-' ) + w + 'px';
      if(UI.isLite) {
        e.style.left =  _w ;
      } else {
        e.style.webkitTransform ='translateX(' + _w + ')';
      }
      e.style.transitionDuration = t + 's';
      if(m == 'auto') {
        timerAutoStart = timeClearStart(e, m, w, t);;
       // console.log('timerAutoStart', timerAutoStart);
      } else {
        timer = timeClearStart(e, m, w, t);;
        //console.log('timer', timer);
      }
    }
    var stopTimer = function(){
      var _t = (timeVal) ? timeVal : 0;
      for(var i = timer ; i>_t ; i--) {
        if(!(i == timerAutoStart || i == timerAutoSet)) {
          clearTimeout(i);
          timeVal = timer;
        }
      }
    }
    var aniSet = function(e){
      if(UI.isLite) {
        e.style.left = '0px';
        e.style.transition = 'left 0s linear';
      } else {
        e.style.webkitTransition = '-webkit-transform 0s linear';
        e.style.webkitTransform = 'none';/* translateX(0) 150605수정-seojin : LIST ACTION POPUP */
      }
    }
    var marqueeDel = function(e){
      aniSet(e);
    }
    var autoPlay = function(e, m){
      var text = e.getElementsByClassName('marquee')[0];
      text.classList.add('marquee-start');
      playSetProp(text, m);
    }
    var timeClearSet = function(e, m, w, t){
      return setTimeout(function(){
        playStart(e, m, w, t);
      }, 700)
    }
    var timeClearStart = function(e, m, w, t){
      return setTimeout(function(){
        playSet(e, m, w, t);
      }, (t + 1) * 1000);
    }
    // Auto Play
    init(document.getElementsByClassName('no-event'), 'auto');
    // mouseover
    document.getElementsByTagName('html')[0].addEventListener('mouseover', function(e){
      if(!e.target.classList.contains('blank')) return;
      if(UI.focusCurrent)
        init(UI.focusCurrent.getElementsByClassName('marquee'));
    });
    // mouseout
    document.getElementsByTagName('html')[0].addEventListener('mouseout', function(e){
      if(!e.target.classList.contains('blank')) return;
      if(UI.focusCurrent)
        init(UI.focusCurrent.getElementsByClassName('marquee'), 'out');
    });
    //season tooltip marquee
    if(document.getElementsByClassName('detail-episode-list').length) {
      var btnSeason = document.getElementsByClassName('detail-episode-list')[0].getElementsByClassName('btn-large')[4],
          tooltipSeason = document.getElementsByClassName('tooltip-season')[1];
      btnSeason.addEventListener('mouseover', function(e){
          tooltipSeason.style.display = 'block';
          tooltipSeason.getElementsByClassName('marquee')[0].classList.add('marquee-start');
          init(tooltipSeason.getElementsByClassName('marquee'));
      });
      btnSeason.addEventListener('mouseout', function(e){
          tooltipSeason.getElementsByClassName('marquee')[0].classList.remove('marquee-start');
          init(tooltipSeason.getElementsByClassName('marquee'), 'out');
          tooltipSeason.style.display = 'none';
      });
    }
  },
  /**
   * Thumb Resize
   */
  thumbReisze : function(){
    var init = function(obj){
      var img = obj,
        imgW = img.naturalWidth,
        imgH = img.naturalHeight,
        area = img.parentElement,
        areaW = area.clientWidth,
        areaH = area.clientHeight;
      img.removeAttribute('style');
      var v =  maniplulate(areaW, areaH, imgW, imgH);
      apply(img, v.w, v.h);
    }
    var maniplulate = function(areaW, areaH, imgW, imgH){
      var w = null,
          h = parseInt(imgH * areaW / imgW),
          rate = (h/areaH).toFixed(2);
      if(rate < 0.8) {
        w = areaW;
        h = null;
      } else if(rate > 1.2) {
        h = areaH;
      } else {
        w = areaW;
        h = areaH;
      }
      return {
        w : w,
        h : h
      };
    }
    var apply = function(target, w, h){
      target.style.width = w + 'px';
      target.style.height = h + 'px';
    }

    if(document.getElementsByClassName('item-thumb').length) {
      var i,
          itemThumb = document.getElementsByClassName('item-thumb'),
          itemThumbLen = itemThumb.length;
      for(i=0; i<itemThumbLen ; i++) {
        init(itemThumb[i].getElementsByClassName('thumb-img')[0]);
      }
    }
    if(document.getElementsByClassName('item-slide').length) {
      var i,
          itemThumb = document.getElementsByClassName('item-slide'),
          itemThumbLen = itemThumb.length;
      for(i=0; i<itemThumbLen ; i++) {
        init(itemThumb[i].getElementsByClassName('thumb-img')[0]);
      }
    }
  },
  /**
   * Panels(Panel[page], Breadcrumb) Animation Sample : panels.html
      http://nebula.lgsvl.com/enyojs/strawman/?MoonstoneExtra#ActivityPanelsSample - 현재 다른 화면
      http://10.177.230.119/~soongil.choi/sampler/enyo-strawman/moonstone-extra/dist/?MoonstoneExtra#ActivityPanelsSample
   */
  panelsAnimation : function(){
    var drawer = document.getElementsByClassName('drawer')[0],
        panels = document.getElementsByClassName('panels'),
        breadcrumbs = document.getElementsByClassName('panels-breadcrumbs')[0];
    var stepIdx = 0,
        backwardClass = 'transition-backward',
        showClass = 'showing',
        hideClass = 'hiding';
    var init = function(e, d){
      if(d == 'forward') {
        //Panels backwardClass Class Remove
        if(panels[0].classList.contains(backwardClass))
          panels[0].classList.remove(backwardClass);
      }
      play(e, d);
    }
    // 애니메이션  Play
    var play = function(e, d){
      // panel[page], breadcrumb 구분
      var target = e.classList.contains('page') ? 'panel' : 'breadcrumb';
      //Element Set : eleCur, eleNew
      var eleCur = e;
      var eleNew = target == 'panel' ? createEl(e, target, d) : e.previousElementSibling ? e.previousElementSibling : e.nextElementSibling;
      //Previous Set
      prevSet(target, eleCur, eleNew, d);
      //Panel Move
      move(target, eleCur, eleNew, d);
      //After Set
      afterSet(target, eleCur, eleNew);
    }
    // Element(panel[page]) 생성
    var createEl = function(e, target, d) {
      var templet = null,
          parentEl = null,
          node = null,
          slidEnd = null;
      if(target == 'panel') {
        node = document.createElement("div");
        if(d=='backward' && stepIdx == 0) {//back, faetured templest
          templet = '<div class="main-header"> <div class="header-tit">LG CONTENT STORE</div> <img src="../images/thumb/main/genre_19_e.png" class="thumb-img"> <!-- TV Shows --> <div class="header-item"> <div class="item-category">TV Shows</div> <div class="item-tit">Game of Thrones</div> <div class="item-text">1line1line1line1line1line1line1line1line1line1line1line1line1line</div> <div class="blank btn btn-small"> <div class="area-text"><div class="text marquee">more...</div></div> </div> </div> <!-- //TV Shows --> <!-- Apps &amp; Games --> <div class="header-item" style="display: none"> <div class="item-category">Apps &amp; Games</div> <div class="item-tit">App Title</div> <div class="app-category">Entertainment</div><div class="bar-empty">|</div><div class="item-price">$2.99</div><div class="list-price">$5.99<div class="price-empty"></div></div> <div class="blank btn btn-small"> <div class="area-text"><div class="text marquee">more...</div></div> </div> </div> <!-- //Apps &amp; Games --> <div class="blank btn btn-icon btn-main-prev"><div class="icon"></div></div> <div class="blank btn btn-icon btn-main-next"><div class="icon"></div></div> <div class="header-mask"></div><!-- Image Header 영역 컨텐츠 바뀌는 동안 class="mask-block" 추가했다가 완료시 삭제 --> </div> <div class="main-body" style="background-color:#3f3024"><!-- 상단 이미지에 맞는 Hex컬러 --> <div class="panel-cont"> <!-- content --> <!-- vod --> <div class="main-column column-1"><!-- 가로방향 컨텐츠 1칸 class="column-1" --> <div class="tit-category"><div class="text">New Release[TBD]</div><div class="bg-empty"></div></div><!-- uk only --> <!-- item --> <div class="blank item item-main"> <div class="item-thumb"> <img src="../images/thumb/default_tvshow_370x542.png" class="thumb-img" style="width: 370px; height: 550px;"> </div> <div class="area-text item-tit"><div class="marquee text">default_tvshow_370x542.png</div></div> <div class="blank icon-player btn-cp-play"></div><!-- 컨텐츠 Thumbnail에 play 버튼 --> </div><!-- //item --> </div> <!-- //vod --> <!-- vod --> <div class="main-column column-2"><!-- 가로방향 컨텐츠 2칸 class="column-2" --> <div class="tit-category"><div class="text">Trending[TBD]</div><div class="bg-empty"></div></div><!-- uk only --> <!-- item --> <div class="blank item item-main item-main-width"><!-- 가로형 썸네일 class="item-main-width" 추가 --> <div class="item-thumb"> <img src="../images/thumb/default_tvshow_370x277.png" class="thumb-img" style="width: 370px; height: 270px;"> </div> <div class="area-text item-tit"><div class="marquee text">1default_tvshow_370x277.png</div></div> <div class="blank icon-player btn-cp-play"></div><!-- 컨텐츠 Thumbnail에 play 버튼 --> </div><!-- //item --><!-- item --><div class="blank item item-main item-main-width"><!-- 가로형 썸네일 class="item-main-width" 추가 --> <div class="item-thumb"> <img src="../images/thumb/default_tvshow_370x277.png" class="thumb-img" style="width: 370px; height: 270px;"> </div> <div class="area-text item-tit"><div class="marquee text" style="-webkit-transition: -webkit-transform 0s linear; transition: -webkit-transform 0s linear; -webkit-transform: none;">2default_tvshow_370x277.png</div></div> <div class="blank icon-player btn-cp-play"></div><!-- 컨텐츠 Thumbnail에 play 버튼 --> </div><!-- //item --><!-- item --><div class="blank item item-main item-main-width"><!-- 가로형 썸네일 class="item-main-width" 추가 --> <div class="item-thumb"> <img src="../images/thumb/default_tvshow_370x277.png" class="thumb-img" style="width: 370px; height: 270px;"> </div> <div class="area-text item-tit"><div class="marquee text">3default_tvshow_370x277.png</div></div> <div class="blank icon-player btn-cp-play"></div><!-- 컨텐츠 Thumbnail에 play 버튼 --> </div><!-- //item --><!-- item --><div class="blank item item-main item-main-width"><!-- 가로형 썸네일 class="item-main-width" 추가 --> <div class="item-thumb"> <img src="../images/thumb/default_tvshow_370x277.png" class="thumb-img" style="width: 370px; height: 270px;"> </div> <div class="area-text item-tit"><div class="marquee text">4default_tvshow_370x277.png</div></div> <div class="blank icon-player btn-cp-play"></div><!-- 컨텐츠 Thumbnail에 play 버튼 --> </div><!-- //item --> </div> <!-- //vod --> <!-- Apps &amp; Games --> <div class="main-column column-1"><!-- 가로방향 컨텐츠 1칸 class="column-1" --> <!-- item --> <div class="blank item item-main-apps"> <div class="item-thumb"> <img src="../images/thumb/default_app.png" class="thumb-img" style="height: 303px;"> </div> <div class="item-info"> <div class="area-text item-tit"><div class="marquee text">default_app.png</div></div> <div class="app-category">category</div> <div class="item-price">$2.99</div> </div> </div><!-- //item --><!-- item --><div class="blank item item-main-apps"> <div class="item-thumb" style="background-color:#742873;"><!-- app* Hex컬러 있는 경우 --> <img src="../images/temp/temp_app_01.jpg" class="thumb-img" style="height: 303px;"> </div> <div class="item-info"> <div class="area-text item-tit"><div class="marquee text">Facebook Apps Apps end</div></div> <div class="app-category">category</div> <div class="item-price">$2.99</div> </div> </div><!-- //item --> </div> <!-- //Apps &amp; Games --> <!-- 광고 --> <div class="main-column column-ban"><!-- 광고 컨텐츠 class="column-ban" --> <!-- AD --> <div class="blank item item-ad"><img src="../images/temp/temp-ad.png" class="thumb-img"></div> <!-- //AD --> <!-- theme banner --> <div class="blank item theme-banner"> <div class="thumb"> <img src="../images/temp/temp-theme-banner.png" class="thumb-img"> </div> <div class="area-text ban-text"><div class="text">Theme banner</div></div> </div> <!-- //theme banner --> </div> <!-- //광고 --> <!-- //content --> </div> <div class="scroll scroll-v ng-hide"> <div class="blank icon scroll-prev"></div> <div class="scroll-area"><div class="scroll-bar" style="height:300px; top 0px;"></div></div> <div class="blank icon scroll-next"></div> </div> </div>'
          node.className = 'page panel-list panel-main main-tier1';
        } else {
          templet = '<div class="panel-header"> <div class="area-text no-event panel-title"> <div class="marquee text marquee-start">Panel New</div> </div> <div class="panel-sub"> <div class="sub-text sub-title">Sub category</div><div class="bar-empty">|</div> <div class="sub-text sub-sub-title">List 정렬 옵션항목</div> </div> </div> <div class="panel-menu"> <div class="blank menu-list"> <div class="icon-bullet"></div><div class="area-text menu-text"><div class="marquee text">category menu</div></div> </div> </div> <div class="panel-body"> <div class="panel-cont"> <!-- content --> <!-- <div class="sec-title list-title">shelf title</div> --> <div class="list-cont"> <!-- item --> <div class="blank item item-list"> <div class="item-badge"><div class="area-text badge-text"><div class="marquee text" style="-webkit-transition: -webkit-transform 0s linear; transition: -webkit-transform 0s linear; -webkit-transform: none;">For you</div></div></div> <div class="item-thumb"> <img src="../images/temp/temp_02.jpg" class="thumb-img" style="width: 262px; height: 384px;"> </div> <div class="area-text item-tit"><div class="marquee text" style="-webkit-transition: -webkit-transform 0s linear; transition: -webkit-transform 0s linear; -webkit-transform: none;">w ITEM </div></div> <div class="item-grade list-grade"><div class="icon percent-grade" style="width:50%;"></div><div class="icon bg-grade"></div></div> <div class="blank icon-player btn-cp-play"></div> </div> </div> <div class="sec-title list-title">shelf title</div> <div class="list-cont"> <!-- item --> <div class="blank item item-list item-list-width focus"><!-- 가로형 썸네일 class="item-list-width" 추가 --> <div class="item-thumb"> <img src="../images/temp/thum_h1.jpg" class="thumb-img" style="height: 248px;"> </div> <div class="area-text item-tit"><div class="marquee text">w title</div></div> <div class="item-grade list-grade"><div class="icon percent-grade" style="width:50%;"></div><div class="icon bg-grade"></div></div> </div> </div> <!-- //content --> </div> <div class="scroll scroll-v"> <div class="blank icon scroll-prev focus"></div> <div class="scroll-area"><div class="scroll-bar" style="height:454px; top 0px;"></div></div> <div class="blank icon scroll-next"></div> </div> </div>';
          node.className = 'page panel-list';
        }
      }
      node.innerHTML = templet;
      e.parentElement.appendChild(node);
      return node;
    }
    var prevSet = function(target, eleCur, eleNew, d){
      //Breadcrumb Step Index
      if(target == 'breadcrumb') {
        if(d == 'forward')
          getStepIdx(stepIdx++, 'plus', eleNew);
        else
          getStepIdx(stepIdx--, 'minus', eleNew);
        /*if(!UI.isLite)
          eleNew.style.webkitTransitionDuration = '';*/ /*20150717 삭제*/
      }
    }
    var getStepIdx = function (n, operator, e) {
      var i =  operator == 'plus' ? n+1 : n-1;
      var val = ((i < 10) ? '0' : '') + i;
      e.getElementsByClassName('step')[0].textContent = val;
    }
    var move = function(target, eleCur, eleNew, d){
      var drawerMainClass = 'main-drawer';
      //Featured Control
      if(d=='forward' && stepIdx == 1 && target=='panel'){ //정뱡향
        if(UI.isLite) {
          drawer.classList.remove(drawerMainClass);
          breadcrumbs.classList.remove('hide'); //2015.717 tkrwp
        } else {
          eleCur.addEventListener('webkitTransitionEnd', function(){
            drawer.classList.remove(drawerMainClass);
          });
        }
      } else if(d=='backward' && stepIdx == 0 && target=='breadcrumb' ) { //역방향
         // breadcrumbs.classList.add('hide');
          drawer.classList.add(drawerMainClass);
      }

      //direct 클래스 삭제
      if(target == 'panel') eleCur.classList.remove('direct');
      //현재 패널 hiding 클래스 추가
      eleCur.classList.add(hideClass);
      //진입 패널 showing 클래스 추가
      if(UI.isLite) {
        eleNew.classList.add(showClass);
      } else {
        setTimeout(function(){
          eleNew.classList.add(showClass);
        }, 10);
      }


    }
    var afterSet = function(target, eleCur, eleNew){
      if(UI.isLite) {
        if(target=='breadcrumb')
          eleCur.classList.remove(showClass, hideClass);
        else
          eleCur.remove();
      } else {
        eleNew.addEventListener('webkitTransitionEnd', function(){
          if(target=='breadcrumb') {
            //eleCur.style.webkitTransitionDuration = '0'; 20150717 삭제
            eleCur.classList.remove(showClass, hideClass);
          } else {
            eleCur.remove();
          }
          this.removeEventListener('webkitTransitionEnd', arguments.callee,false);
        });
      }
    }

    if(!panels.length) return;
    /* 정방향 */
    document.getElementsByClassName('panels-viewport')[0].addEventListener('click', function(e){
      if(!e.target.classList.contains(UI.targetClass)) return;
      if(!breadcrumbs.getElementsByClassName(showClass).length) {
        breadcrumbs.getElementsByClassName('breadcrumb')[0].classList.add(showClass);
      }
      init(breadcrumbs.getElementsByClassName(showClass)[0], 'forward');
      init(document.getElementsByClassName('page')[0], 'forward');
    });
    /* 역방향 */
    //panels-breadcrumbs hover시
    breadcrumbs.addEventListener('mouseover', function(e){
      if(!e.target.classList.contains(UI.targetClass)) return;
      panels[0].classList.add(backwardClass);
    });
    //breadcrumb click시
    breadcrumbs.addEventListener('click', function(e){
      if(!e.target.classList.contains(UI.targetClass)) return;
      init(breadcrumbs.getElementsByClassName(showClass)[0], 'backward');
      init(document.getElementsByClassName('page')[0], 'backward');
    });
  },
  /**
   * Accordion Control Sample : accordion.html
      http://nebula.lgsvl.com/enyojs/pilot/lib/moonstone/samples/AccordionSample.html > In Group Using Groupsed Selectable Items
   */
  accordion : function(){
    var openClass = 'depth-open',
        openedEl = null;
    var open = function(e) {
      var accordionDrawer = e.getElementsByClassName('menu-depth-drawer')[0];
      if(openedEl) close(openedEl);
      if(!e.classList.contains(openClass))
        e.classList.add(openClass);
      if(!UI.isRtl)
        accordionDrawer.style.height = (accordionDrawer.children[0].clientHeight * accordionDrawer.children.length) + 'px';
      openedEl = e;
    }
    var close = function(e) {
      var accordionDrawer = e.getElementsByClassName('menu-depth-drawer')[0];
      e.classList.remove(openClass);
      if(!UI.isRtl) {
        accordionDrawer.style.height = '';
      }
    }

    // Auto Open
    if(document.getElementsByClassName('depth-open').length) {
      if(document.getElementsByClassName('popup-common').length) return;
      open(document.getElementsByClassName('depth-open')[0]);
    }
    // Menu Click
    if(document.getElementsByClassName('panel-menu').length) {
      document.getElementsByClassName('panel-menu')[0].addEventListener('click', function(e){
        if(e.target.classList.contains('menu-depth-header')) {
          var accordion = e.target.parentElement;
          if(accordion.classList.contains(openClass))
            close(accordion);
          else
            open(accordion);
        }
      });
    }
  },
  /**
   * Featured Header Rolling Animation
      마크업 & css 수정 필요(main-tier-1_featuredHeaderRolling.html)
   */
  featuredHeaderRolling : function() {
    var headerItem = document.getElementsByClassName('header-item');
    var e = null,
        idx = 0,
        len = headerItem.length - 1,
        intervalId = null,
        intervalTime = 2000,
        direction = 'next';
    //headerItem[idx].classList.add('show');
    var play = function(direction){
      e = headerItem[idx];
      e.classList.remove('show');
      if(direction == 'prev') {
        idx = (idx==0) ? len : --idx;
      } else {
        idx = (idx==len) ? 0 : ++idx;
      }
      e = headerItem[idx];
      e.classList.add('show');
    }
    var startAuto = function(direction){
      intervalId = setInterval(function(){
        play(direction);
      }, intervalTime);
    }
    startAuto(direction);
    document.getElementsByClassName('main-header')[0].onclick = function(e){
      if(e.target.classList.contains('btn-main-next')) {
        direction = 'next';
      } else if(e.target.classList.contains('btn-main-prev')){
        direction = 'prev';
      }
      clearInterval(intervalId);
      play(direction);
      startAuto(direction);
    }
  },
  /**
   * Featured Contents Rolling Control Sample : 광고만 제외
      마크업 & css 수정 필요(main-tier-1-featuredcntsRoling.html)
   */
  featuredCntsRolling : function() {
    var showClass = 'show',
        hideClass = 'hide',
        setIntervalTime = '5000'; //Interval Time Set

    var init = function(items){
      setInterval(function(){
        for(var i=0; i<items.length ; i++) {
          play(items[i].firstElementChild);
        }
      }, setIntervalTime);
    }
    var play = function(items){
      if(!items.classList.contains('item-main-wrap')) return;
      var newEl = createEl(items);
      showHide(items, newEl);
      newEl.addEventListener('webkitTransitionEnd', function(){
        reset(items, newEl);
      });
    }
    var createEl = function(items) {
      newEl = items.cloneNode(true);
      newEl.classList.add(hideClass);
      items.parentNode.appendChild(newEl);
      newEl.style.marginTop = '-' + items.clientHeight + 'px';
      //newEl.getElementsByClassName('thumb-img')[0].src = '../images/temp/temp_01.jpg';
      return newEl;
    }
    var showHide = function(items, newEl) {
      items.classList.add(hideClass);
      newEl.classList.remove(hideClass);
      newEl.classList.add(showClass);
    }
    var reset = function(items, newEl) {
      newEl.style.marginTop = '';
      newEl.classList.remove(showClass);
      items.remove();
    }
    init(document.getElementsByClassName('item-main'));
    init(document.getElementsByClassName('item-main-apps'));
    init(document.getElementsByClassName('theme-banner'));
  },
  /**
   * Detail More Less Control
   */
  moreLess : function(){
    var toggle = function(e){
      if( !(e.target.classList.contains('btn-more') && e.target.parentElement.classList.contains('detail-section')) ) return;
      var targetParent = e.target.parentElement,
          btnMoreDetail = e.target,
          moreOpenClassName = 'more-open';
      if(targetParent.classList.contains(moreOpenClassName)) {
        targetParent.classList.remove(moreOpenClassName);
        btnMoreDetail.childNodes[0].nodeValue = 'less';
      } else {
        targetParent.classList.add(moreOpenClassName);
        btnMoreDetail.childNodes[0].nodeValue = 'more';
      }
    }
    if(document.getElementsByClassName('detail-section').length){
      document.getElementsByClassName('detail-section')[0].addEventListener('click', function(e){
        if( !e.target.classList.contains('blank') )  return;
        toggle(e);
      });
    }
  },
  /**
   * Popup List Option Control
   */
  listOption : function(){
    if(!(document.getElementsByClassName('btn-pop-close').length && document.getElementsByClassName('btn-list-option').length)) return;
    var popLstOption = document.getElementsByClassName('popup-list-option')[0],
        popLstOptionOpenClass = 'popup-open',
        popLstOptionModalClass = 'popup-modal-list-option';
    document.getElementsByClassName('btn-list-option')[0].onclick = function(){
      popLstOption.parentNode.classList.add(popLstOptionModalClass);
      popLstOption.classList.add(popLstOptionOpenClass);
    };
    if(!popLstOption) return;
    popLstOption.getElementsByClassName('btn-pop-close')[0].onclick = function(){
      popLstOption.classList.remove(popLstOptionOpenClass);
      popLstOption.parentNode.classList.remove(popLstOptionModalClass);
    };
  },
  /**
   * Rtl Control
   */
  rtlCtrl : function(){
    var doLtrChk = true; //ltr 체크 여부
    var init = function(){
      if(UI.isRtl) {
        document.body.classList.remove('dir-rtl-');
        document.body.classList.add(UI.rtlClass);
      }
      if(UI.isRtl && doLtrChk) {
        var text = document.getElementsByClassName('text');
        for(var i=0; i<text.length ; i++ ){
          isLtr(text[i].textContent, text[i]);
        }
      }
      if(UI.isPopupRtl) {
        var popupCommon = document.getElementsByClassName('popup-dialog');
        for(var i=0 ; i<popupCommon.length; i++) {
          popupCommon[i].classList.add(UI.rtlClass);
        }
      }
    }
    var rtlPattern = function(str) {
      var rtlStr = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE\u0590-\u05FF\uFB1D-\uFB4F]/;
      return rtlStr.test(str);
    }
    var isLtr = function(str, target) {
      if(!rtlPattern(str))
        target.classList.add(UI.ltrClass);
    }
    init();
  }
}

window.onload = function() {
  console.log('*** WebOS 3.0 LG Contents Store Markup Sample Script ***');
  UI.load();
};

