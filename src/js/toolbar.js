Pen.prototype.toolbar = function(options) {
  var self = this;

  this.toggle = function(event) {
    if(!self._isDestroyed) self.show();
  };

  this.click = function(event) {
    var action = event.target.getAttribute('data-action');
    if(!action) return;

    // create link
    if(action === 'createlink') {
      var input = menu.getElementsByTagName('input')[0], createlink;

      input.style.display = 'block';
      input.focus();

      input.onkeypress = function(e) {
        if(event.which === 13) return self.createlink(event.target);
      };

      return input.onkeypress;
    }

    self.apply();
  };

  this.apply = function(value) {
    self._sel.removeAllRanges();
    self._sel.addRange(self._range);
    self._actions(action, value);
    self._range = self._sel.getRangeAt(0);
    self.highlightItems().menu();
  };

  this.createlink = function(input) {
    input.style.display = 'none';
    if(input.value) return self.apply(input.value.replace(/(^\s+)|(\s+$)/g, '').replace(/^(?!http:\/\/|https:\/\/)(.*)$/, 'http://$1'));
    action = 'unlink';
    self.apply();
  };

  this.show = _.debounce(function() {
    var range = self._sel;
    if(!range.isCollapsed) {
      //show menu
      self._range = range.getRangeAt(0);
      self.highlightItems();
    } else {
      //hide menu
      self.hide();
    }
  }, 200);

  this.hide = function() {
    self._menu.style.display = 'none';
  };

  this.linebreak = function(event) {
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
  };

  this.highlightItems = function() {
    var node = self._sel.focusNode,
    effects = self.effectNode(node),
    menu = self._menu,
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

    return self;
  };

  this.effectNode = function(el, returnAsNodeName) {
    var nodes = [];
    while(el !== options.editor) {
      if(el.nodeName.match(/(?:[pia]|\Au\z|\Ab\z|h[1-6]|code|[uo]l|li)/i)) {
        nodes.push(returnAsNodeName ? el.nodeName.toLowerCase() : el);
      }
      el = el.parentNode;
    }
    return nodes;
  }

  var icons = '';

  _.map(options.list, function(item) {
    var klass = 'pen-icon icon-' + item;
    icons += '<i class="' + klass + '" data-action="' + item + '">' + (item.match(/^h[1-6]|p$/i) ? item.toUpperCase() : '') + '</i>';
    if((item === 'createlink')) icons += '<input class="pen-input" placeholder="http://" />';
  });

  var menu = doc.createElement('div');
  menu.setAttribute('class', options.class + '-menu pen-menu');
  menu.innerHTML = icons;
  menu.style.display = 'none';

  doc.body.appendChild((self._menu = menu));

  // change menu offset when window resize / scroll
  window.addEventListener('resize', self.hide);
  window.addEventListener('scroll', self.hide);

  var editor = options.editor;

  editor.addEventListener('mouseup', self.toggle);
  editor.addEventListener('keyup', self.toggle);
  editor.addEventListener('keydown', self.linebreak);
  menu.addEventListener('click', self.click);
};
