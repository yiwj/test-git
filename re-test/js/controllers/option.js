app.directive('option', function() {
  return {
    restrict: 'A',
    scope: {},
    controller: 'optionController',
    //templateUrl: './resources/html/option.html',
    template: optionTmpl
  };
});

app.controller('optionController', function($scope, $controller, $element, $rootScope, $timeout, focusManager, keyHandler, marquee, util, audioGuidance) {
  angular.extend(this, $controller('viewController', {$scope: $scope, $element: $element}));
  var focusElement = null;
  var owner = null;
  var lastSelected = {};
  var that = this;
  var isFirst = true; //팝업 첫 진입 위한 flag 변수
  var checkedItem = ''; //check 유무 비교 변수

  this.ROW_COUNT = 5;

  $scope.scopeName = 'option';
  $scope.focusItem = '';
  $scope.lastFocusItem = {};
  $scope.open = false;
  $scope.hide = true;
  $scope.options = null;
  $scope.selectedCategory = '';
  $scope.selectedGenre = '';
  $scope.selectedOrder = '';

  $scope.getColumnClass = function(index) {
    if ($scope.options[index].values.length > 15)
      return 'filter-column4';
    else if ($scope.options[index].values.length > 10)
      return 'filter-column3';
    else if ($scope.options[index].values.length > 5)
      return 'filter-column2';
    else
      return '';
  };

  $scope.setFocusItem = function(item, element) {
    var i, j;

    $scope.focusItem = item;

    if (focusElement) {
      focusElement.classList.remove('focus');
    }
    focusElement = element;
    if (focusElement) {
      focusElement.classList.add('focus');
      $scope.lastFocusItem = {
        item: item,
        index: element.getAttribute('index')
      };
    }
    if (item) {
      marquee.setTarget(element.getElementsByClassName('marquee')[0]);
      focusManager.setCurrent($scope, item, element);
    } else {
      marquee.setTarget(null);
      focusManager.setCurrent($scope, '');
    }
  };

  $scope.audioGuidance = function (scope, target, element) {
    //audioGuidance 호출 params
    var params = {
      text: '',
      clear: true
    };

    var enterSound = '';
    var title = '';

    //checked Item 설정
    if (element && element.parentElement.querySelector('.option-list.check-on .text')) {
      checkedItem = element.parentElement.querySelector('.option-list.check-on .text').innerText;  //checked 아이템
    }

    if (isFirst) {
      //Title 설정
      if (element && element.parentElement.querySelector('.list-title')) {
        title = element.parentElement.querySelector('.list-title').innerText; //title
      }

      enterSound = title;
      isFirst = false;
    }

    var contentName = null;
    if (element && element.querySelector('.focus .text')) {
      contentName = element.querySelector('.focus .text').innerText;
    }

    if (enterSound.length > 0) {
      params.text = enterSound;
      params.text += '. ';
      params.text += contentName;
    } else {
      params.text = contentName;
    }

    if(checkedItem === contentName) {
      params.text += '. ';
      params.text += msgLang.audio_filter_check;
    }else{
      params.text += '. ';
      params.text += msgLang.audio_filter_uncheck;
    }

    //close 버튼 focus 시
    if(element && element.classList.contains('btn-pop-close')){
      params.text = msgLang.close;
      if(element.parentElement.querySelector('.list-title')){
        params.text += '. ';
        params.text += element.parentElement.querySelector('.list-title').innerText; //title
        params.text += '. ';
        params.text += msgLang.audio_button_button;
      }
    }

    audioGuidance.call(params);
  };

  $scope.removeFocus = function() {};

  $scope.moveFocusByKey = function(keyCode) {
    var i, j, l, arr, optionIndex, itemIndex, rowCount, itemCount, valueCount, columnCount, focusItem;

    focusItem = $scope.focusItem;
    if(!$scope.open) { // 닫는 동작 수행중이면 바로 return, [WOSLQEVENT-116491]
      return;
    }

    if ($scope.lastFocusItem) {
      if ($scope.lastFocusItem.index &&
        ($scope.lastFocusItem.index.length > 0)) {
        arr = $scope.lastFocusItem.index.split('-');
        optionIndex = parseInt(arr[0], 10);
        itemIndex = parseInt(arr[1], 10);
      }

      if (!focusItem || (focusItem.length === 0)) {
        focusItem = $scope.lastFocusItem.item;
      }
    }

    if ((focusItem !== 'close') &&
      (isNaN(optionIndex) || (optionIndex < 0) ||
      isNaN(itemIndex) || (itemIndex < 0))) {
      // if currently nothing is selected
      return;
    }

    if (keyCode == keyHandler.UP) {
      if (focusItem === 'close') {
        return;
      }

      if ((itemIndex % that.ROW_COUNT) === 0) {
        // first item in the column
        // set focus on close button
        focusOnCloseButton();
        return;
      }
      moveFocus(optionIndex, itemIndex - 1);
    } else if (keyCode == keyHandler.DOWN) {

      if (focusItem === 'close') {
        // if focus is currently on close button,
        // select the first item in the last column.
        optionIndex = $scope.options.length - 1;
        valueCount = $scope.options[optionIndex].values.length;
        itemIndex = Math.floor(valueCount / that.ROW_COUNT) * that.ROW_COUNT;
      } else {
        if ((itemIndex % that.ROW_COUNT) === (that.ROW_COUNT - 1)) {
          // no item to go down
          return;
        }
        itemIndex++;

        if (itemIndex >= $scope.options[optionIndex].values.length) {
          if ((itemIndex - that.ROW_COUNT) < 0) {
            // check previous row from left option
            rowCount = itemIndex % that.ROW_COUNT;
            for (i = optionIndex - 1 ; i >= 0 ; i--) {
              valueCount = $scope.options[i].values.length;
              columnCount = Math.ceil(valueCount / that.ROW_COUNT);

              for (j = columnCount - 1 ; j >= 0 ; j--) {
                itemCount = that.ROW_COUNT;

                if (j === (columnCount - 1)) {
                  // if last column
                  l = valueCount % that.ROW_COUNT;
                  if (l > 0) {
                    // last column is not full
                    itemCount -= (that.ROW_COUNT - l);
                  }
                }

                if (rowCount <= itemCount) {
                  optionIndex = i;
                  itemIndex = j * that.ROW_COUNT;
                  itemIndex += rowCount;

                  // exit for loops
                  i = 0;
                  break;
                }
              }
            }

            // check next row from right option
            if (((optionIndex + 1) < $scope.options.length) &&
              (rowCount < $scope.options[optionIndex + 1].values.length)) {
              optionIndex++;
              itemIndex = rowCount;
            }
          } else {
            itemIndex -= that.ROW_COUNT;
          }
        }
      }

      moveFocus(optionIndex, itemIndex);
    } else if (keyCode == keyHandler.RIGHT) {
      if ((focusItem === 'close') || (itemIndex < 0)) {
        return;
      }

      valueCount = $scope.options[optionIndex].values.length;
      columnCount = Math.ceil(valueCount / that.ROW_COUNT);
      var currentColumnIndex = Math.floor(itemIndex / that.ROW_COUNT);

      if ((itemIndex + that.ROW_COUNT) < valueCount) {
        // set focus on an item on next column
        itemIndex += that.ROW_COUNT;
        moveFocus(optionIndex, itemIndex);
      } else if (currentColumnIndex < (columnCount - 1)) {
        // there are more item on next column in the current option
        // select the last item in the last column.
        moveFocus(optionIndex, valueCount - 1);
      } else if ((optionIndex + 1) >= $scope.options.length) {
        // set focus on close button
        focusOnCloseButton();
        return;
      } else if (optionIndex < $scope.options.length) {
        // move to next option
        optionIndex += 1;
        itemIndex = itemIndex % that.ROW_COUNT;
        valueCount = $scope.options[optionIndex].values.length;
        if (itemIndex >= valueCount) {
          itemIndex = valueCount - 1;
        }
        moveFocus(optionIndex, itemIndex);
      } else if (Math.ceil((itemIndex + 1) / that.ROW_COUNT) <
        Math.ceil(valueCount / that.ROW_COUNT)) {
        // if current item is not on the last column,
        // select the last item in the last column.
        moveFocus(optionIndex, valueCount - 1);
      } else {
        // set focus on close button
        focusOnCloseButton();
      }
    } else if (keyCode == keyHandler.LEFT) {
      if (focusItem === 'close') {
        // if focus is currently on close button,
        // select the first item in the last column.
        optionIndex = $scope.options.length - 1;

        valueCount = $scope.options[optionIndex].values.length;
        itemIndex = Math.floor(valueCount / that.ROW_COUNT) * that.ROW_COUNT;
      } else if ((itemIndex - that.ROW_COUNT) >= 0) {
        itemIndex -= that.ROW_COUNT;
      } else if (optionIndex > 0) {
        optionIndex -= 1;

        valueCount = $scope.options[optionIndex].values.length;
        columnCount = Math.ceil(valueCount / that.ROW_COUNT);

        // calculate index at the same height in the last column.
        itemIndex += (columnCount - 1) * that.ROW_COUNT;

        if (itemIndex >= valueCount) {
          // if no such item, set it to the last item in the current option.
          itemIndex = valueCount - 1;
        }
      }

      if (itemIndex < 0) {
        return;
      }
      moveFocus(optionIndex, itemIndex);
    }
  };

  var moveFocus = function(optionIndex, itemIndex) {
    var i, arr, item, element, arrIndex;

    if (optionIndex < 0 ||
      optionIndex >= $scope.options.length ||
      itemIndex < 0 ||
      !$scope.options[optionIndex].values ||
      itemIndex >= $scope.options[optionIndex].values.length) {
      // index is out of range. Do nothing
      return;
    }

    // calculate array index from optionIndex and itemIndex.
    arrIndex = 0;
    for (i = 0 ; i < optionIndex ; i++) {
      arrIndex += $scope.options[i].values.length;
    }
    arrIndex += itemIndex;

    arr = $element[0].getElementsByClassName('option-list');
    if (arrIndex >= arr.length) {
      return;
    }

    element = arr[arrIndex];
    var code = $scope.options[optionIndex].values[itemIndex].code;
    $scope.setFocusItem(code, element);
  };

  var focusOnCloseButton = function() {
    var element;
    element = $element[0].getElementsByClassName('btn-pop-close')[0];
    $scope.setFocusItem('close', element);
  };

  $scope.executeAction = function() {
    var i, j, l, arr, filer, focusObject, target;

    focusObject = focusManager.getCurrent();
    if (focusObject.scope == $scope) {
      target = focusObject.target;
      if (target == 'close') {
        document.getElementsByClassName('popup-list-option')[0].parentNode.classList.remove('popup-modal-list-option'); // 팝업창 외 포커스 방지 제거
        $scope.setFocusItem('', null);
        $scope.hideOption();
      } else {
        l = $scope.options.length;
        for (i = 0; i < l; i++) {
          filter = $scope.options[i].filter;
          arr = $scope.options[i].values;
          for (j = 0; j < arr.length; j++) {
            if (arr[j].code == target) {
              if ($scope['selected' + filter] != target) {
                $scope['selected' + filter] = target;
                owner.setFilter(filter, target);
              } else {
                return false; // WOSLQEVENT-51051 이슈대응
              }

              // save the selection
              lastSelected.optionIndex = i;
              lastSelected.itemIndex = j;

              // exit the for loops
              i = l;
              break;
            }
          }
        }
        // shelf가 1개일 경우 close
        if (l === 1) {
          $scope.setFocusItem('', null);
          $scope.hideOption();
        }
        $scope.$apply();
      }
    }
  };

  $scope.showOption = function(scope, optionList, resetSelection) {
    var i, l, k, w, arr, obj, filter, optionIndex, itemIndex;
    isFirst = true;
    owner = scope;

    if (!resetSelection && scope) {
      if (scope.selectedMenu !== lastSelected.selectedMenu) {
        // this is to reset the selection when menu is changed.
        lastSelected.optionIndex = null;
        lastSelected.itemIndex = null;
        $scope.focusItem = '';
        $scope.lastFocusItem = {};
      }
      lastSelected.selectedMenu = scope.selectedMenu;
    } else {
      lastSelected.optionIndex = null;
      lastSelected.itemIndex = null;
      $scope.focusItem = '';
      $scope.lastFocusItem = {};
      lastSelected.selectedMenu = null;
    }

    focusManager.setState('option', true);

    $scope.options = [];

    w = 1818;
    if (optionList === null || optionList === undefined) {
      l = 0;
    } else {
      l = optionList.length;
    }

    for (i = 0; i < l; i++) {
      obj = {};
      util.copyObject(obj, optionList[i]);
      switch (obj.key) {
        case 'FILTER_GENRE':
          $scope.options.unshift(obj);
          obj.name = msgLang.genre;
          obj.filter = 'Genre';
          break;
        case 'FILTER_CATEGORY':
          $scope.options.unshift(obj);
          obj.name = msgLang.category;
          obj.filter = 'Category';
          break;
        case 'FILTER_ORDER':
          $scope.options.push(obj);
          obj.name = msgLang.sort;
          obj.filter = 'Order';
          break;
        case 'FILTER_SORTER':
          $scope.options.push(obj);
          obj.name = obj.title;
          obj.filter = 'Sorter';
          break;
        case 'FILTER_FILTER':
          $scope.options.push(obj);
          obj.name = msgLang.filters;
          obj.filter = 'Filter';
          break;
      }
      filter = obj.filter;

      arr = obj.values;
      obj.width = 451 * Math.ceil(arr.length / that.ROW_COUNT) - 18;
      obj.style = {};
      obj.style.width = obj.width + "px";
      w = w - obj.width - 18;

      for (k = 0; k < arr.length; k++) {
        obj = arr[k];
        obj.idx = k;
        obj.style = {};
        obj.style.top = (60 * (k % that.ROW_COUNT) + 41) + "px";
        obj.style.left = (451 * Math.floor(k / that.ROW_COUNT)) + "px";
        if (obj.selected == 'TRUE') {
          $scope['selected' + filter] = obj.code;
        }
      }
    }

    for (i = 0; i < l; i++) {
      obj = $scope.options[i];
      obj.style.left = w + "px";
      obj.idx = i;
      w = w + obj.width + 18;
    }

    $scope.hide = false;
    $scope.$apply();

    arr = $element[0].getElementsByClassName('option-list');
    l = arr.length;
    for (i = 0; i < l; i++) {
      $scope.setMouseEvent(arr[i]);
    }

    if ((lastSelected.optionIndex !== null) &&
      (lastSelected.optionIndex >= 0) &&
      (lastSelected.itemIndex !== null) &&
      (lastSelected.itemIndex >= 0)) {
      optionIndex = lastSelected.optionIndex;
      itemIndex = lastSelected.itemIndex;
    } else {
      optionIndex = 0;
      itemIndex = 0;
    }

    moveFocus(optionIndex, itemIndex);

    $scope.setMouseEvent($element[0].getElementsByClassName('btn-pop-close')[0]);

    util.async(function() {
      $scope.open = true;
      $scope.$apply();
    });
  };

  $scope.hideOption = function(key) {
    focusManager.setState('option', false);

    $scope.open = false;
    $scope.$apply();

    $timeout(function() {
      if (owner === null) return;
      owner.recoverFocus();
    }, 300);

    $timeout(function() {
      if ($scope.open === false) {
        $scope.hide = true;
        $scope.$apply();
      }
    }, 1000);
  };

  var initialize = function() {
    $rootScope.option = $scope;
  };

  initialize();
});
