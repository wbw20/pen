Pen.prototype.toolbar = function(options) {
  var self = this;

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

    self.apply(action);
  };

  this.apply = function(action, value) {
    document.getSelection().addRange(self._range);
    self.execute(action, value);
    self.highlightItems();
  };

  this.createlink = function(input) {
    input.style.display = 'none';
    if(input.value) return self.apply(input.value.replace(/(^\s+)|(\s+$)/g, '').replace(/^(?!http:\/\/|https:\/\/)(.*)$/, 'http://$1'));
    action = 'unlink';
    self.apply();
  };

  this.linebreak = function(event) {
    if (event.which === 13) {
      var selection = window.getSelection(),
          range = self._range,
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
    var effects = self.effectNode(self._range.startContainer),
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
      var tag = item.className.toLowerCase();
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

  var icons = '<div>';

  _.map(options.list, function(item) {
    var klass = 'pen-icon icon-' + item;
    icons += '<i class="' + klass + '" data-action="' + item + '">' + (item.match(/^h[1-6]|p$/i) ? item.toUpperCase() : '') + '</i>';
    if((item === 'createlink')) icons += '<input class="pen-input" placeholder="http://" />';
  });

  icons += '</div>';

  var menu = doc.createElement('div');
  menu.setAttribute('class', options.class + '-menu pen-menu');
  menu.innerHTML = icons;

  $('[data-toggle="toolbar"]').append((self._menu = menu));
  menu.addEventListener('click', self.click);

  var editor = options.editor;
  editor.addEventListener('keydown', self.linebreak);
};
