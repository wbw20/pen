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

// make it accessible
this.Pen = Pen;
