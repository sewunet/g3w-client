var t = require('core/i18n/i18n.service').t;
var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var Stack = require('./barstack.js');
var Component = require('gui/vue/component');

// componente interno (VUE) del content della viewport
var InternalComponent = Vue.extend({
    template: require('../html/contentsviewer.html'),
    data: function() {
      return {
        state: null
      }
    }
});
// componente content
function ContentsComponent(options){
  base(this,options);
  this.stack = new Stack();
  this._service = this;
  this.id = "contents";
  this.title = "contents";
  this.state.visible = true;
  this._content = null;
  merge(this, options);
  this.internalComponent = new InternalComponent({
    service: this
  });
  this.internalComponent.state = this.state;
}

inherit(ContentsComponent, Component);

var proto = ContentsComponent.prototype;

// setta il contenuto dell content
proto.setContent = function(content) {
  // svuoto sempre lo stack, così ho sempre un solo elemento (la gestione dello stack è delegata alla viewport).
  // Uso comunque barstack perché implementa già la logica di montaggio dei contenuti nel DOM
  this.clearContents();
  return this.stack.push(content,this.internalComponent.$el, true);
};
// rimuove il contenuto dallo stack
proto.removeContent = function() {
  return this.stack.pop();
};

// usato da viewport.js
proto.popContent = function() {
  return this.removeContent()
};
// fa il clear dello stack
proto.clearContents = function() {
  return this.stack.clear();
};

module.exports = ContentsComponent;