Pen.prototype.editor = function(options) {
  this.reg = {
    block: /^(?:p|h[1-6]|blockquote|pre|insertorderedlist|insertunorderedlist)$/,
    codespan: /^(?:codespan)$/,
    inline: /^(?:bold|italic|underline)$/,
    source: /^(?:insertimage|createlink|unlink)$/,
    insert: /^(?:inserthorizontalrule|insert)$/
  };

  if (!window.onbeforeunload) {
    window.onbeforeunload = function() {
      if(!that._isDestroyed) return 'Are you going to leave here?';
    };
  };

  this.apply = function(action, value) {
    if(action.match(this.reg.block)) {
      this.block(action);
    } else if(action.match(this.reg.codespan)) {
      this.codespan('code');
    } else if(action.match(this.reg.inline) || action.match(this.reg.source)) {
      this.overall(action, value);
    } else if(action.match(this.reg.insert)) {
      this.insert(action);
    } else {
      if(this.config.debug) utils.log('can not find command function for name: ' + name + (value ? (', value: ' + value) : ''));
    }
  };

  this.block = function(name) {
    var block = overall('formatblock', 'p');

    var after = _.union($(that._sel.getRangeAt().startContainer).closest('p').toArray(),
                        $(that._sel.getRangeAt().endContainer).closest('p').toArray());

    after.forEach(function(block) {
      $(block).removeClass().addClass(name);
    });
  };

  this.codespan = function(name) {
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

  this.insert = function(name) {
    var range = that._sel.getRangeAt(0)
      , node = _block(range.startContainer);

    range.selectNode(node);
    range.collapse(false);
    return overall(name);
  };

  this.overall = function(cmd, val) {
    var message = ' to exec 「' + cmd + '」 command' + (val ? (' with value: ' + val) : '');
    if(document.execCommand(cmd, false, val) && that.config.debug) {
      utils.log('success' + message);
    } else {
      utils.log('fail' + message);
    }
  };
};

/* Get the relevant parent */
function _block(node) {
  while(node.nodeType !== 1) {
    node = node.parentNode;
  }

  return node;
}

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
