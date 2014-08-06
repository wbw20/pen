/*! Licensed under MIT, https://github.com/sofish/pen */
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
    block: /^(?:p|h[1-6]|blockquote|pre|insertorderedlist|insertunorderedlist)$/,
    codespan: /^(?:codespan)$/,
    inline: /^(?:bold|italic|underline)$/,
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
    var block = overall('formatblock', 'p');

    var after = _.union($(that._sel.getRangeAt().startContainer).closest('p').toArray(),
                        $(that._sel.getRangeAt().endContainer).closest('p').toArray());

    after.forEach(function(block) {
      $(block).removeClass().addClass(name);
    });
  };

  codespan = function(name) {
    var before = _.union($(that._sel.getRangeAt().startContainer).closest('b').toArray(),
                            $(that._sel.getRangeAt().endContainer).closest('b').toArray());

    before.forEach(function(codespan) {
      $(codespan).removeAttr('class');
    });

    overall('bold', name);

    var removed = $(that._sel.getRangeAt().startContainer.parentNode).find('b:not([class])');

    var after = _.union($(that._sel.getRangeAt().startContainer).closest('b').toArray(),
                            $(that._sel.getRangeAt().endContainer).closest('b').toArray());

    _.union(removed, after).forEach(function(codespan) {
      $(codespan).addClass('code');
    });
  };

  this._actions = function(name, value) {
    if(name.match(reg.block)) {
      block(name);
    } else if(name.match(reg.codespan)) {
      codespan('code');
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
