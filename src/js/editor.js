Pen.prototype.editor = function(options) {
  var self = this;

  this.reg = {
    block: /^(?:p|h[1-6]|blockquote|pre|insertorderedlist|insertunorderedlist)$/,
    codespan: /^(?:codespan)$/,
    inline: /^(?:bold|italic|underline)$/,
    source: /^(?:insertimage|createlink|unlink)$/,
    insert: /^(?:inserthorizontalrule|insert)$/
  };

  if (!window.onbeforeunload) {
    window.onbeforeunload = function() {
      if(!self._isDestroyed) return 'Are you going to leave here?';
    };
  };

  this.execute = function(action, value) {
    if(action.match(self.reg.block)) {
      self.block(action);
    } else if(action.match(self.reg.codespan)) {
      self.codespan('code');
    } else if(action.match(self.reg.inline) || action.match(self.reg.source)) {
      self.overall(action, value);
    } else if(action.match(self.reg.insert)) {
      self.insert(action);
    } else {
      if(self.config.debug) utils.log('can not find command function for name: ' + name + (value ? (', value: ' + value) : ''));
    }
  };

  this.block = function(name) {
    var block = self.overall('formatblock', 'p');

    var after = _.union($(self._range.startContainer).closest('p').toArray(),
                        $(self._range.endContainer).closest('p').toArray());

    after.forEach(function(block) {
      $(block).removeClass().addClass(name);
    });
  };

  this.codespan = function(name) {
    var before = _.union($(self._range.startContainer).closest('b').toArray(),
                            $(self._range.endContainer).closest('b').toArray());

    before.forEach(function(codespan) {
      $(codespan).removeAttr('class');
    });

    self.overall('bold', name);

    var removed = $(self._range.startContainer.parentNode).find('b:not([class])');

    var after = _.union($(self._range.startContainer).closest('b').toArray(),
                            $(self._range.endContainer).closest('b').toArray());

    _.union(removed, after).forEach(function(codespan) {
      $(codespan).addClass('code');
    });
  };

  this.insert = function(name) {
    var range = self._range,
        node = _block(range.startContainer);

    range.selectNode(node);
    range.collapse(false);
    return self.overall(name);
  };

  this.overall = function(cmd, val) {
    var message = ' to exec 「' + cmd + '」 command' + (val ? (' with value: ' + val) : '');
    if(document.execCommand(cmd, false, val) && self.config.debug) {
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
