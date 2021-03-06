const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const ProjectsRegistry = require('core/project/projectsregistry');
const CatalogLayersStoresRegistry = require('core/catalog/cataloglayersstoresregistry');

function CatalogService() {
  this.state = {
    prstate: ProjectsRegistry.state,
    highlightlayers: false,
    externallayers:[],
    layerstrees: [],
    layersgroups: []
  };

  this.setters = {};

  base(this);

  const layersStores = CatalogLayersStoresRegistry.getLayersStores();

  layersStores.forEach((layersStore) => {
    this.addLayersStoreToLayersTrees(layersStore);
  });

  CatalogLayersStoresRegistry.onafter('addLayersStore', (layersStore) => {
    this.addLayersStoreToLayersTrees(layersStore);
  });

  CatalogLayersStoresRegistry.onafter('removeLayersStore', (layersStore) => {
    this.state.layerstrees.forEach((layersTree, idx) => {
      if (layersTree.storeid === layersStore.getId()) {
        this.state.layerstrees.splice(idx, 1);
        return false;
      }
    });
  });
  CatalogLayersStoresRegistry.onafter('removeLayersStores', () => {
    this.state.layerstrees.forEach((layersTree, idx) => {
      this.state.layerstrees.splice(idx, 1);
      return false;
    });
  });
}

inherit(CatalogService, G3WObject);

const proto = CatalogService.prototype;

proto.addExternalLayer = function(layer) {
  layer.removable = true;
  this.state.externallayers.push(layer);
};

proto.createLayersGroup = function({title = 'Layers Group', layers =[]} = {}) {
  const nodes = [];
  layers.forEach((layer) => {
    nodes.push(layer)
  });
  return {
    title,
    nodes
  }
};

proto.getMajorQgisVersion = function() {
  return ProjectsRegistry.getCurrentProject().getQgisVersion({
    type: 'major'
  });
};

// method to add a custom layers group
proto.addLayersGroup = function(layersGroup) {
  this.state.layersgroups.push(layersGroup);
};

proto.removeExternalLayer = function(name) {
  this.state.externallayers.forEach((layer, index) => {
    if (layer.name === name) {
      this.state.externallayers.splice(index, 1);
      return false
    }
  });
};

proto.addLayersStoreToLayersTrees = function(layersStore) {
  this.state.layerstrees.push({
    tree: layersStore.getLayersTree(),
    storeid: layersStore.getId()
  });
};

module.exports = CatalogService;
