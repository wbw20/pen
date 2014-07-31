/*! Licensed under MIT, https://github.com/sofish/pen */
(function(doc) {

  var Pen, utils = {};

  var blocks = ['blockquote', 'p', 'h1', 'h2', 'ul', 'ol'],
      semiblocks = ['li'];

  var defaults = {
    class: 'pen',
    debug: false,
    textarea: '<textarea name="content"></textarea>',
    list: [
      'blockquote', 'h2', 'h3', 'p', 'insertorderedlist', 'insertunorderedlist', 'inserthorizontalrule',
      'bold', 'codespan', 'italic', 'underline', 'createlink'
    ]
  };

  // log
  utils.log = function(message, force) {
    if(window._pen_debug_mode_on || force) console.log('%cPEN DEBUGGER: %c' + message, 'font-family:arial,sans-serif;color:#1abf89;line-height:2em;', 'font-family:cursor,monospace;color:#333;');
  };

  Pen = function(config) {

    if(!config) return utils.log('can\'t find config', true);

    // merge user config
    var options = _.extend(defaults, config);

    if(options.editor.nodeType !== 1) return utils.log('can\'t find editor');
    if(options.debug) window._pen_debug_mode_on = true;

    var editor = options.editor;

    // set default class
    editor.classList.add(options.class);

    // set contenteditable
    var editable = editor.getAttribute('contenteditable');
    if(!editable) editor.setAttribute('contenteditable', 'true');

    // assign config
    this.config = options;

    // save the selection obj
    this._sel = doc.getSelection();

    // map actions
    this.actions();

    // enable toolbar
    this.toolbar();

    // enable markdown covert
    if (this.markdown) {
      this.markdown.init(this);
    }

    // stay on the page
    if (this.config.stay) {
      this.stay();
    }
  };

  // node effects
  Pen.prototype._effectNode = function(el, returnAsNodeName) {
    var nodes = [];
    while(el !== this.config.editor) {
      if(el.nodeName.match(/(?:[pia]|\Au\z|\Ab\z|h[1-6]|code|[uo]l|li)/i)) {
        nodes.push(returnAsNodeName ? el.nodeName.toLowerCase() : el);
      }
      el = el.parentNode;
    }
    return nodes;
  };

  // remove style attr
  Pen.prototype.nostyle = function() {
    var els = this.config.editor.querySelectorAll('[style]');
    [].slice.call(els).forEach(function(item) {
      item.removeAttribute('style');
    });
    return this;
  };

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

  // highlight menu
  Pen.prototype.highlight = function() {
    var node = this._sel.focusNode
      , effects = this._effectNode(node)
      , menu = this._menu
      , linkInput = menu.querySelector('input')
      , highlight;

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
      var selector = '.icon-' + str
        , el = menu.querySelector(selector);
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
        case 'ol':
          return highlight('insertorderedlist');
        default :
          highlight(tag);
      }
    });

    return this;
  };

  /* Get the relevant parent */
  function _block(node) {
    while(node.nodeType !== 1) {
      node = node.parentNode;
    }

    return node;
  }

  /* Are we at the start or end? */
  function _selectionInfo(el, range) {
    var atStart = false, atEnd = false;
    var testRange;
    if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            testRange = range.cloneRange();

            testRange.selectNodeContents(el);
            testRange.setEnd(range.startContainer, range.startOffset);
            atStart = (testRange.toString() == "");

            testRange.selectNodeContents(el);
            testRange.setStart(range.endContainer, range.endOffset);
            atEnd = (testRange.toString() == "");
        }
    } else if (document.selection && document.selection.type != "Control") {
        range = document.selection.createRange();
        testRange = range.duplicate();

        testRange.moveToElementText(el);
        testRange.setEndPoint("EndToStart", range);
        atStart = (testRange.text == "");

        testRange.moveToElementText(el);
        testRange.setEndPoint("StartToEnd", range);
        atEnd = (testRange.text == "");
    }

    return { atStart: atStart, atEnd: atEnd };
  }

  Pen.prototype.actions = function() {
    var that = this, reg, block, overall, insert;

    // allow command list
    reg = {
      block: /^(?:p|h[1-6]|blockquote|pre)$/,
      codespan: /^(?:codespan)$/,
      inline: /^(?:bold|italic|underline|insertorderedlist|insertunorderedlist)$/,
      source: /^(?:insertimage|createlink|unlink)$/,
      insert: /^(?:inserthorizontalrule|insert)$/
    };

    overall = function(cmd, val) {
      var message = ' to exec 「' + cmd + '」 command' + (val ? (' with value: ' + val) : '');
      if(document.execCommand(cmd, false, val) && that.config.debug) {
        utils.log('success' + message);
      } else {
        utils.log('fail' + message);
      }
    };

    insert = function(name) {
      var range = that._sel.getRangeAt(0)
        , node = _block(range.startContainer);

      range.selectNode(node);
      range.collapse(false);
      return overall(name);
    };

    block = function(name) {
      if(that._effectNode(that._sel.getRangeAt(0).startContainer, true).indexOf(name) !== -1) {
        if(name === 'blockquote') return document.execCommand('outdent', false, null);
        name = 'p';
      }
      return overall('formatblock', name);
    };

    codespan = function(name) {
      var range = that._sel.getRangeAt(),
          begins = range.startContainer.parentElement,
          ends = range.endContainer.parentElement;

      if (_isWithinCopespan(begins) && _isWithinCopespan(ends)) {
        if (_isExactlyWithin(range, begins)) {
          _deTag(begins, range);
        } else if (begins !== ends) {
          console.log('its the wierd case');
          _merge(begins, ends, range);
        }
      } else if (_isWithinCopespan(begins)) {
        _absorbRight(begins, range);
      } else if (_isWithinCopespan(ends)) {
        _absorbLeft(ends, range);
      } else {
        if (begins !== ends) {
          console.log('selection cannot cross');
        } else {
          _tag(range);
        }
      }

      return _highlight(range);
    };

    /* turn this range into a codespan */
    _tag = function(range) {
      var node = document.createElement('code');
      range.surroundContents(node);
      var children = node.getElementsByTagName('code');
      for (var i = 0; i < children.length; i++) {
        _deTag(children[i], range);
      }
    }

    /* remove this node's tag, leaving only its innnerHTML in the parent */
    _deTag = function(node, range) {
      var parent = node.parentElement,
          clone = document.createElement('el'),
          start = range.startOffset, end = range.endOffset;

      clone.innerHTML = node.innerHTML;
      parent.replaceChild(clone, node);
      parent.innerHTML = parent.innerHTML.replace(/(<\/?el>)/g, '');
      range.selectNodeContents(parent);
      return clone;
    };

    _absorbRight = function(node, range) {
        range.setStartBefore(node);
        range.surroundContents(document.createElement('code'));
        _deTag(node, range);
    };

    _absorbLeft = function(node, range) {
        range.setEndAfter(node);
        range.surroundContents(document.createElement('code'));
        _deTag(node, range);
    };

    _merge = function(left, right, range) {
      range.setStartBefore(left);
      range.setEndAfter(right);
      range.surroundContents(document.createElement('code'));
      _deTag(left, range);
    };

    _isExactlyWithin = function(range, node) {
      return node.innerHTML === range.toString();
    };

    _highlight = function(range) {
      that._sel.removeAllRanges();
      that._sel.addRange(range);
    };

    _isWithinCopespan = function(node) {
      while (node.tagName.toLowerCase() !== 'body') {
        if (node.tagName.toLowerCase() === 'code') {
          return true;
        }

        node = node.parentElement;
      }

      return false;
    };

    this._actions = function(name, value) {
      if(name.match(reg.block)) {
        block(name);
      } else if(name.match(reg.codespan)) {
        codespan(name);
      } else if(name.match(reg.inline) || name.match(reg.source)) {
        overall(name, value);
      } else if(name.match(reg.insert)) {
        insert(name);
      } else {
        if(this.config.debug) utils.log('can not find command function for name: ' + name + (value ? (', value: ' + value) : ''));
      }
    };

    return this;
  };

  // show menu
  Pen.prototype.menu = function() {

    var offset = this._range.getBoundingClientRect()
      , menuPadding = 10
      , top = offset.top - menuPadding
      , left = offset.left + (offset.width / 2)
      , menu = this._menu
      , menuOffset = { x: 0, y: 0 }
      , stylesheet = this._stylesheet;

    // store the stylesheet used for positioning the menu horizontally
    if(this._stylesheet === undefined) {
      var style = document.createElement("style");
      document.head.appendChild(style);
      this._stylesheet = stylesheet = style.sheet;
    }
    // display block to caculate its width & height
    menu.style.display = 'block';

    menuOffset.x = left - (menu.clientWidth/2);
    menuOffset.y = top - menu.clientHeight;

    // check to see if menu has over-extended its bounding box. if it has,
    // 1) apply a new class if overflowed on top;
    // 2) apply a new rule if overflowed on the left
    if(stylesheet.cssRules.length > 0) {
      stylesheet.deleteRule(0);
    }
    if(menuOffset.x < 0) {
      menuOffset.x = 0;
      stylesheet.insertRule('.pen-menu:after { left: ' + left + 'px; }',0);
    } else {
      stylesheet.insertRule('.pen-menu:after { left: 50%; }',0);
    }
    if(menuOffset.y < 0) {
      menu.classList.toggle('pen-menu-below', true);
      menuOffset.y = offset.top + offset.height + menuPadding;
    } else {
      menu.classList.toggle('pen-menu-below', false);
    }

    menu.style.top = menuOffset.y + 'px';
    menu.style.left = menuOffset.x + 'px';
    return this;
  };

  Pen.prototype.stay = function() {
    var that = this;
    if (!window.onbeforeunload) {
      window.onbeforeunload = function() {
        if(!that._isDestroyed) return 'Are you going to leave here?';
      };
    }
  };

  Pen.prototype.destroy = function(isAJoke) {
    var destroy = isAJoke ? false : true
      , attr = isAJoke ? 'setAttribute' : 'removeAttribute';

    if(!isAJoke) {
      this._sel.removeAllRanges();
      this._menu.style.display = 'none';
    }
    this._isDestroyed = destroy;
    this.config.editor[attr]('contenteditable', '');

    return this;
  };

  Pen.prototype.rebuild = function() {
    return this.destroy('it\'s a joke');
  };

  // make it accessible
  this.Pen = Pen;

}(document));
