Pen.prototype.toolbar = function() {

  var that = this, icons = '';

  _.map(this.config.list, function(item) {
    var klass = 'pen-icon icon-' + item;
    icons += '<i class="' + klass + '" data-action="' + item + '">' + (item.match(/^h[1-6]|p$/i) ? item.toUpperCase() : '') + '</i>';
    if((item === 'createlink')) icons += '<input class="pen-input" placeholder="http://" />';
  });

  var menu = doc.createElement('div');
  menu.setAttribute('class', this.config.class + '-menu pen-menu');
  menu.innerHTML = icons;
  menu.style.display = 'none';

  doc.body.appendChild((this._menu = menu));

  var setpos = function() {
    if(menu.style.display === 'block') that.menu();
  };

  // change menu offset when window resize / scroll
  window.addEventListener('resize', setpos);
  window.addEventListener('scroll', setpos);

  var editor = this.config.editor;
  var show = _.debounce(function() {
      var range = that._sel;
      if(!range.isCollapsed) {
        //show menu
        that._range = range.getRangeAt(0);
        that.menu().highlight();
      } else {
        //hide menu
        that._menu.style.display = 'none';
      }
    }, 200);
  var toggle = function(event) {
    if(!that._isDestroyed) show();
  };

  // toggle toolbar on mouse select
  editor.addEventListener('mouseup', toggle);

  var linebreak = function(event) {
    if (event.which === 13) {
      var selection = window.getSelection(),
          range = selection.getRangeAt(0),
          parent = _block(range.startContainer),
          tag;

      if (event.shiftKey) {
        var contents;
        tag = document.createElement(parent.tagName);
        range.deleteContents();
        range.setEndAfter(parent);
        tag.innerHTML = range.toString() || '<br>';
        range.deleteContents();
        if (parent.innerHTML === '') { parent.innerHTML = '<br>' };
        range.insertNode(tag);
        range.setEnd(tag, 0);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        tag = document.createElement('br');
        range.deleteContents();
        range.insertNode(tag);
        range.setStartAfter(tag);
        range.setEndAfter(tag);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      event.preventDefault();
      return false;
    }
  }

  // prevent execCommand from adding a new block level element
  // and instead just add a br within this block
  editor.addEventListener('keydown', linebreak);

  // toggle toolbar on key select
  editor.addEventListener('keyup', toggle);

  // toggle toolbar on key select
  menu.addEventListener('click', function(e) {
    var action = e.target.getAttribute('data-action');

    if(!action) return;

    var apply = function(value) {
      that._sel.removeAllRanges();
      that._sel.addRange(that._range);
      that._actions(action, value);
      that._range = that._sel.getRangeAt(0);
      that.highlight().nostyle().menu();
    };

    // create link
    if(action === 'createlink') {
      var input = menu.getElementsByTagName('input')[0], createlink;

      input.style.display = 'block';
      input.focus();

      createlink = function(input) {
        input.style.display = 'none';
        if(input.value) return apply(input.value.replace(/(^\s+)|(\s+$)/g, '').replace(/^(?!http:\/\/|https:\/\/)(.*)$/, 'http://$1'));
        action = 'unlink';
        apply();
      };

      input.onkeypress = function(e) {
        if(e.which === 13) return createlink(e.target);
      };

      return input.onkeypress;
    }

    apply();
  });

  return this;
};
