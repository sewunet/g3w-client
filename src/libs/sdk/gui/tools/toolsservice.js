var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

function ToolsService(){
  var self = this;
  this.config = null;
  this._actions = {};
  this.state = {
    toolsGroups: []
  };
  
  this.setters = {
    addToolGroup: function(group) {
      self.state.toolsGroups.push(group);
    }
  };
  
  this.addTools = function(groupName, tools) {
    var self = this;
    var group = this._getToolsGroup(groupName);
    if (!group) {
      group = {
        name: groupName,
        tools: []
      };
      this.addToolGroup(group);
    }
    _.forEach(tools,function(tool){
      group.tools.push(tool);
      self._addAction(tool);
    });
  };
  
  this.removeTool = function(toolId) {
  };
  
  this.fireAction = function(actionId){
    var action = this._actions[actionId];
    action();
  };
  
  this._getToolsGroup = function(groupName) {
    var group = null;
    _.forEach(this.state.toolsGroups,function(_group){
      if (_group.name == groupName) {
        group = _group;
      }
    });
    return group;
  };
  
  this._addAction = function(tool) {
    var actionId = Math.floor(Math.random() * 1000000)+1;
    tool.actionId = actionId;
    this._actions[actionId] = tool.action;
  };
  
  base(this);
}

inherit(ToolsService, G3WObject);

module.exports = ToolsService;
