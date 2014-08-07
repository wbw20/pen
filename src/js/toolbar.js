Pen.prototype.toolbar = {
  init: function() {
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
    var show = ;
    var toggle = function;

    editor.addEventListener('mouseup', this.toggle);
    editor.addEventListener('keyup', this.toggle);
    editor.addEventListener('keydown', this.linebreak);
    menu.addEventListener('click', this.click);

    return this;
  },
  toggle: function(event) {
    if(!this._isDestroyed) show();
  },
  click: function(e) {
    var action = e.target.getAttribute('data-action');

    if(!action) return;

    var apply = function(value) {
      that._sel.removeAllRanges();
      that._sel.addRange(that._range);
      that._actions(action, value);
      that._range = that._sel.getRangeAt(0);
      that.highlightItems().menu();
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
  },
  show: _.debounce(function() {
    var range = this._sel;
    if(!range.isCollapsed) {
      //show menu
      this._range = range.getRangeAt(0);
      this.menu().highlightItems();
    } else {
      //hide menu
      this._menu.style.display = 'none';
    }
  }, 200),
  linebreak: function(event) {
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
  },
  highlightItems: function() {

  },
};














function highlightItems() {
  var node = this._sel.focusNode,
      effects = this._effectNode(node),
      menu = this._menu,
      linkInput = menu.querySelector('input'),
      highlight;

  // remove all highlights
  _.map(menu.querySelectorAll('.active'), function(el) {
    el.classList.remove('active');
  });

  if (linkInput) {
    // display link input if createlink enabled
    linkInput.style.display = 'none';
    // reset link input value
    linkInput.value = '';
  }

  highlight = function(str) {
    var selector = '.icon-' + str,
        el = menu.querySelector(selector);
    return el && el.classList.add('active');
  };

  effects.forEach(function(item) {
    var tag = item.nodeName.toLowerCase();
    switch(tag) {
      case 'a':
        return (menu.querySelector('input').value = item.href), highlight('createlink');
      case 'i':
        return highlight('italic');
      case 'code':
        return highlight('codespan');
      case 'u':
        return highlight('underline');
      case 'b':
        return highlight('bold');
      case 'ul':
        return highlight('insertunorderedlist');
      case 'ol':
        return highlight('insertorderedlist');
      default :
        highlight(tag);
    }
  });

  return this;
}

function _effectNode(el, returnAsNodeName) {
  var nodes = [];
  while(el !== this.config.editor) {
    if(el.nodeName.match(/(?:[pia]|\Au\z|\Ab\z|h[1-6]|code|[uo]l|li)/i)) {
      nodes.push(returnAsNodeName ? el.nodeName.toLowerCase() : el);
    }
    el = el.parentNode;
  }
  return nodes;
};
