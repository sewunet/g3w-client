const ApplicationService = require('core/applicationservice');
const {base, inherit, noop, downloadFile, throttle } = require('core/utils/utils');
const {getAlphanumericPropertiesFromFeature} = require('core/utils/geo');
const t = require('core/i18n/i18n.service').t;
const ProjectsRegistry = require('core/project/projectsregistry');
const Layer = require('core/layers/layer');
const GUI = require('gui/gui');
const G3WObject = require('core/g3wobject');
const VectorLayer = require('core/layers/vectorlayer');
const PrintService = require('core/print/printservice');
const CatalogLayersStoresRegistry = require('core/catalog/cataloglayersstoresregistry');
const RelationsPage = require('gui/relations/vue/relationspage');
// set formats for download single feature
const DOWNLOAD_FEATURE_FORMATS = ['shapefile', 'gpx', 'csv', 'xls'];

function QueryResultsService() {
  this.printService = new PrintService();
  this._currentLayerIds = [];
  ProjectsRegistry.onafter('setCurrentProject', project => {
    this._setRelations(project);
    this._setAtlasActions(project);
    this.state.download_data = false;
    this.plotLayerIds = [];
  });
  this.unlistenerlayeractionevents = [];
  this._actions = {
    'zoomto': QueryResultsService.zoomToElement,
    'highlightgeometry': this.highlightGeometry.bind(this),
    'clearHighlightGeometry': this.clearHighlightGeometry.bind(this)
  };
  this._relations = [];
  this._atlas = [];
  this.plotLayerIds = [];
  const project = this._project = ProjectsRegistry.getCurrentProject();
  // userful to set right order for query result based on toc order layers
  this._projectLayerIds = this._project.getConfigLayers().map(layer => layer.id);
  // set reactive state
  this.state = {
    zoomToResult: true,
    components: [],
    layers: [],
    query: null,
    loading: false,
    layersactions: {}
  };
  this.init = function() {
    this.clearState();
  };

  this._vectorLayers = [];
  this.setters = {
    setQueryResponse: function(queryResponse, coordinates, resolution ) {
      this.clearState();
      this.state.query = queryResponse.query;
      const layers = this._digestFeaturesForLayers(queryResponse.data);
      this.setLayersData(layers);
    },
    setLayersData: function(layers) {
      // here set the right order of result layers based on toc
      this._currentLayerIds = layers.map(layer => layer.id);
      this._orderResponseByProjectLayers(layers);
      this.state.loading = false;
      layers.forEach(layer => this.state.layers.push(layer));
      this.setActionsForLayers(layers);
    },
    addComponent: function(component) {
      this._addComponent(component)
    },
    addActionsForLayers: function(actions) {},
    postRender: function(element) {},
    closeComponent: function() {},
    openCloseFeatureResult({open, layer, feature, container}={}){}
  };
  base(this);

  this.addLayersPlotIds = function(layerIds=[]) {
    this.plotLayerIds = layerIds;
  };

  this._setRelations(project);
  this._setAtlasActions(project);
  this._addVectorLayersDataToQueryResponse();
  this._asyncFnc = {
    todo: noop,
    zoomToLayerFeaturesExtent: {
      async: false
    },
    goToGeometry: {
      async: false
    }
  };
  GUI.onbefore('setContent', (options)=>{
    const {perc} = options;
    this.mapService = this.mapService || ApplicationService.getApplicationService('map');
    if (perc === 100 && GUI.isMobile()) {
      this._asyncFnc.zoomToLayerFeaturesExtent.async = true;
      this._asyncFnc.goToGeometry.async = true;
    }
  })
}

// Make the public service en Event Emitter
inherit(QueryResultsService, G3WObject);

const proto = QueryResultsService.prototype;

proto.clear = function() {
  this.runAsyncTodo();
  this.unlistenerEventsActions();
  this._asyncFnc = null;
  this._asyncFnc = {
    todo: noop,
    zoomToLayerFeaturesExtent: {
      async: false
    },
    goToGeometry: {
      async: false
    }
  };
};

proto.getCurrentLayersIds = function(){
  return this._currentLayerIds;
};

proto.runAsyncTodo = function() {
  this._asyncFnc.todo();
};

proto._orderResponseByProjectLayers = function(layers) {
  layers.sort((layerA, layerB) => {
    const aIndex = this._projectLayerIds.indexOf(layerA.id);
    const bIndex = this._projectLayerIds.indexOf(layerB.id);
    return aIndex > bIndex ? 1 : -1;
  });
};

proto.setZoomToResults = function(bool=true) {
  this.state.zoomToResult = bool;
};

proto.zoomToLayerFeaturesExtent = function(layer, options={}) {
  const features = layer.features;
  if (this._asyncFnc.zoomToLayerFeaturesExtent.async)
    this._asyncFnc.todo = this.mapService.zoomToFeatures.bind(mapService, features, options);
  else this.mapService.zoomToFeatures(features, options);
};

proto.clearState = function() {
  this.state.layers.splice(0);
  this.state.query = {};
  this.state.querytitle = "";
  this.state.loading = true;
  this.state.layersactions = {};
};

proto.getState = function() {
  return this.state;
};

proto.setState = function(state) {
  this.state = state;
};

proto._setRelations = function(project) {
  const projectRelations = project.getRelations();
  this._relations = projectRelations ? _.groupBy(projectRelations,'referencedLayer'):  [];
};

proto.getAtlasByLayerId = function(layerId) {
  return this._atlas.filter(atlas => atlas.atlas.qgs_layer_id === layerId);
};

proto._setAtlasActions = function(project){
  this._atlas = project.getPrint().filter(printconfig => printconfig.atlas) || [];
};

proto.setTitle = function(querytitle) {
  this.state.querytitle = querytitle || "";
};

proto.reset = function() {
  this.clearState();
};

proto._digestFeaturesForLayers = function(featuresForLayers) {
  let id = 0;
  featuresForLayers = featuresForLayers || [];
  const layers = [];
  let layerAttributes,
    layerRelationsAttributes,
    layerTitle,
    layerId;
  const _handleFeatureFoLayer = (featuresForLayer) => {
    let formStructure;
    let sourceType;
    let extractRelations = false;
    const layer = featuresForLayer.layer;
    const download = {
      shapefile: false,
      gpx: false,
      csv: false,
      xls: false
    };
    let filter = {};
    let selection ={};
    if (layer instanceof Layer) {
      filter = layer.state.filter;
      selection = layer.state.selection;
      extractRelations = true;
      download.shapefile = layer.isShpDownlodable();
      download.gpx = layer.isGpxDownlodable();
      download.csv = layer.isCsvDownlodable();
      download.xls = layer.isXlsDownlodable();
      try {
        sourceType = layer.getSourceType()
      } catch(err){}

      layerAttributes = layer.getAttributes().map(attribute => {
        const sanitizeAttribute = {...attribute};
        sanitizeAttribute.name = sanitizeAttribute.name.replace(/ /g, '_');
        return sanitizeAttribute
      });
      layerRelationsAttributes = [];
      layerTitle = layer.getTitle();
      layerId = layer.getId();
      if (layer.hasFormStructure()) {
        const structure = layer.getEditorFormStructure({
          all:true
        });
        if (this._relations && this._relations.length) {
          const getRelationFieldsFromFormStructure = (node) => {
            if (!node.nodes) {
              node.name ? node.relation = true : null;
            } else {
              for (const _node of node.nodes) {
                getRelationFieldsFromFormStructure(_node);
              }
            }
          };
          for (const node of structure) {
            getRelationFieldsFromFormStructure(node);
          }
        }
        const fields = layer.getFields().filter(field => {
          return field.show
        }); // get features show
        formStructure = {
          structure,
          fields
        }
      }
    } else if (layer instanceof ol.layer.Vector){
      layerAttributes = layer.getProperties();
      layerRelationsAttributes =  [];
      layerTitle = layer.get('name');
      layerId = layer.get('id');
    } else if (typeof layer === 'string' || layer instanceof String) {
      const feature = featuresForLayer.features[0];
      layerAttributes = feature ? feature.getProperties() : [];
      layerRelationsAttributes =  [];
      const split_layer_name = layer.split('_');
      layerTitle = (split_layer_name.length > 4) ? split_layer_name.slice(0, split_layer_name.length -4).join(' '): layer;
      layerId = layer;
    }
    const layerObj = {
      title: layerTitle,
      id: layerId,
      attributes: [],
      features: [],
      hasgeometry: false,
      atlas: this.getAtlasByLayerId(layerId),
      download,
      show: true,
      filter,
      selection,
      expandable: true,
      hasImageField: false,
      relationsattributes: layerRelationsAttributes,
      formStructure,
      error: ''
    };

    if (featuresForLayer.features && featuresForLayer.features.length) {
      const layerSpecialAttributesName = (layer instanceof Layer) ? layerAttributes.filter(attribute => {
        try {
          return attribute.name[0] === '_' || Number.isInteger(1*attribute.name[0])
        } catch(e) {
          return false
        }
      }).map(attribute => ({
        alias: attribute.name.replace(/_/, ''),
        name: attribute.name
      })) : [];
      layerSpecialAttributesName.length && featuresForLayer.features.forEach( feature => this._setSpecialAttributesFetureProperty(layerSpecialAttributesName, feature));
      layerObj.attributes = this._parseAttributes(layerAttributes, featuresForLayer.features[0], sourceType);
      layerObj.attributes.forEach(attribute => {
        if (formStructure) {
          const relationField = layer.getFields().find(field => field.name === attribute.name); // need to check all field also show false
          !relationField && formStructure.fields.push(attribute);
        }
        if (attribute.type === 'image') layerObj.hasImageField = true;
      });
      featuresForLayer.features.forEach(feature => {
        const fid = feature.getId() ? feature.getId() : id;
        const geometry = feature.getGeometry();
        if (geometry) layerObj.hasgeometry = true;
        const featureObj = {
          id: fid,
          attributes: feature.getProperties(),
          geometry: feature.getGeometry(),
          show: true
        };
        layerObj.features.push(featureObj);
        id += 1;
      });
      layers.push(layerObj);
    }
    else if (featuresForLayer.error) layerObj.error = featuresForLayer.error;
  };
  featuresForLayers.forEach((featuresForLayer) => {
    if (!Array.isArray(featuresForLayer)) _handleFeatureFoLayer(featuresForLayer);
    else featuresForLayer.forEach((featuresForLayer) => _handleFeatureFoLayer(featuresForLayer));
  });
  return layers;
};

proto._setSpecialAttributesFetureProperty = function(layerSpecialAttributesName, feature) {
  const featureAttributes = feature.getProperties();
  const featureAttributesNames = Object.keys(featureAttributes);
  if (layerSpecialAttributesName.length) {
    layerSpecialAttributesName.forEach(attributeObj =>{
      featureAttributesNames.find(featureAttribute => {
        if (featureAttribute.match(attributeObj.alias)) {
          feature.set(attributeObj.name, feature.get(featureAttribute));
          return true
        }
      })
    });
  }
};

proto._parseAttributes = function(layerAttributes, feature, sourceType) {
  const featureAttributes = feature.getProperties();
  let featureAttributesNames = Object.keys(featureAttributes);
  featureAttributesNames = getAlphanumericPropertiesFromFeature(featureAttributesNames);
  if (layerAttributes && layerAttributes.length) {
    const attributes = layerAttributes.filter((attribute) => {
      return featureAttributesNames.indexOf(attribute.name) > -1;
    });
    return attributes;
  } else {
    return featureAttributesNames.map((featureAttributesName) => {
      return {
        name: featureAttributesName,
        label: featureAttributesName,
        show: featureAttributesName !== 'g3w_fid' && sourceType === 'wms'
      }
    })
  }
};

proto.setActionsForLayers = function(layers) {
  this.unlistenerlayeractionevents = [];
  layers.forEach(layer => {
    if (!this.state.layersactions[layer.id]) this.state.layersactions[layer.id] = [];
    //in case of geometry
    if (layer.hasgeometry) {
      if (layer.selection.active !== void 0) {
        // selection action
        const toggled = {};
        layer.features.map((feature, index) => toggled[index] = false);
        this.state.layersactions[layer.id].push({
          id: 'selection',
          download: false,
          class: GUI.getFontClass('success'),
          hint: 'sdk.mapcontrols.query.actions.add_selection.hint',
          state: Vue.observable({
            toggled
          }),
          init: ({feature, index, action}={})=>{
            layer.selection.active !== void 0 && this.checkFeatureSelection({
              layerId: layer.id,
              index,
              feature,
              action
            })
          },
          cbk: throttle(this.addToSelection.bind(this))
        });
        this.listenClearSelection(layer, 'selection');
        //end selection action
      }
      this.state.layersactions[layer.id].push({
        id: 'gotogeometry',
        download: false,
        mouseover: true,
        class: GUI.getFontClass('marker'),
        hint: 'sdk.mapcontrols.query.actions.zoom_to_feature.hint',
        cbk: throttle(this.goToGeometry.bind(this))
      });
    }
    // in case of relations
    if (this._relations) {
      const relations = this._relations[layer.id] && this._relations[layer.id].filter((relation) =>{
        return relation.type === 'MANY';
      });
      if (relations && relations.length) {
        const chartRelationIds = [];
        relations.forEach(relation => {
          const id = this.plotLayerIds.find(id => id === relation.referencingLayer);
          id && chartRelationIds.push(id);
        });

       this.state.layersactions[layer.id].push({
          id: 'show-query-relations',
          download: false,
          class: GUI.getFontClass('relation'),
          hint: 'sdk.mapcontrols.query.actions.relations.hint',
          cbk: this.showQueryRelations,
          relations,
         chartRelationIds
        });
        const toggled = {};
        layer.features.map((feature, index) => toggled[index] = false);
        chartRelationIds.length && this.state.layersactions[layer.id].push({
         id: 'show-plots-relations',
         download: false,
         opened: true,
         class: GUI.getFontClass('chart'),
         state: Vue.observable({
           toggled
         }),
         hint: 'sdk.mapcontrols.query.actions.relations_charts.hint',
         cbk: throttle(this.showRelationsChart.bind(this, chartRelationIds))
       });
      }
    }

    DOWNLOAD_FEATURE_FORMATS.forEach(format => {
      layer.download[format] && this.state.layersactions[layer.id].push({
        id: `download_${format}_feature`,
        download: true,
        class: GUI.getFontClass(format),
        hint: `sdk.tooltips.download_${format}`,
        cbk: this.downloadFeatures.bind(this, format)
      });
    });

    this.getAtlasByLayerId(layer.id).length && this.state.layersactions[layer.id].push({
      id: `printatlas`,
      download: true,
      class: GUI.getFontClass('print'),
      hint: `sdk.tooltips.atlas`,
      cbk: this.printAtlas.bind(this)
    });
  });
  this.addActionsForLayers(this.state.layersactions);
};

proto.trigger = function(actionId, layer, feature, index, container) {
  const actionMethod = this._actions[actionId];
  actionMethod && actionMethod(layer, feature, index);
  if (layer) {
    const layerActions = this.state.layersactions[layer.id];
    if (layerActions) {
      const action = layerActions.find(layerAction => layerAction.id === actionId);
      action && this.triggerLayerAction(action,layer,feature, index, container);
    }
  }
};

proto.triggerLayerAction = function(action,layer,feature, index, container) {
  action.cbk && action.cbk(layer,feature, action, index, container);
  if (action.route) {
    let url;
    let urlTemplate = action.route;
    url = urlTemplate.replace(/{(\w*)}/g,function(m,key){
      return feature.attributes.hasOwnProperty(key) ? feature.attributes[key] : "";
    });
    url && url !== '' && GUI.goto(url);
  }
};

proto.registerVectorLayer = function(vectorLayer) {
  (this._vectorLayers.indexOf(vectorLayer) === -1) && this._vectorLayers.push(vectorLayer);
};

proto.unregisterVectorLayer = function(vectorLayer) {
  this._vectorLayers = this._vectorLayers.filter(layer => {
    this.state.layers = this.state.layers && this.state.layers.filter(layer => layer.id !== vectorLayer.get('id'));
    return layer !== vectorLayer;
  });
};

proto._addVectorLayersDataToQueryResponse = function() {
  this.onbefore('setQueryResponse', (queryResponse, coordinates, resolution) => {
    let isVisible = false;
    this._vectorLayers.forEach(vectorLayer => {
      let features = [];
      let feature,
        intersectGeom;
      switch (vectorLayer.constructor) {
        case VectorLayer:
          isVisible = !vectorLayer.isVisible();
          break;
        case ol.layer.Vector:
          isVisible = !vectorLayer.getVisible();
          break;
      }
      if ((queryResponse.data && queryResponse.data.length && queryResponse.data[0].layer == vectorLayer) || !coordinates || isVisible ) { return true}
      if (Array.isArray(coordinates)) {
        if (coordinates.length === 2) {
          const pixel = this.mapService.viewer.map.getPixelFromCoordinate(coordinates);
          this.mapService.viewer.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
            features.push(feature);
          },  {
            layerFilter: function(layer) {
              return layer === vectorLayer;
            }
          });
        } else if (coordinates.length === 4) {
          intersectGeom = ol.geom.Polygon.fromExtent(coordinates);
          switch (vectorLayer.constructor) {
            case VectorLayer:
              features = vectorLayer.getIntersectedFeatures(intersectGeom);
              break;
            case ol.layer.Vector:
              vectorLayer.getSource().getFeatures().forEach(feature => {
                if (intersectGeom.intersectsExtent(feature.getGeometry().getExtent())) {
                  features.push(feature);
                }
              });
              break;
          }
        }
      } else if (coordinates instanceof ol.geom.Polygon || coordinates instanceof ol.geom.MultiPolygon) {
        intersectGeom = coordinates;
        switch (vectorLayer.constructor) {
          case VectorLayer:
            features = vectorLayer.getIntersectedFeatures(intersectGeom);
            break;
          case ol.layer.Vector:
            vectorLayer.getSource().getFeatures().forEach(feature => {
              if (intersectGeom.intersectsExtent(feature.getGeometry().getExtent())) {
                features.push(feature);
              }
            });
            break;
        }
      }
      queryResponse.data = queryResponse.data ? queryResponse.data : [];
      queryResponse.data.push({
        features,
        layer: vectorLayer
      });
    })
  });
};

//function to add custom componet in query result
proto._addComponent = function(component) {
  this.state.components.push(component)
};

proto._printSingleAtlas = function({atlas={}, features=[]}={}){
  let {name:template, atlas: {field_name}} = atlas;
  field_name = field_name || '$id';
  const values = features.map(feature => feature.attributes[field_name === '$id' ?  'g3w_fid': field_name]);
  const download_caller_id = ApplicationService.setDownload(true);
  return this.printService.printAtlas({
    field: field_name,
    values,
    template,
    download: true
  }).then(({url}) =>{
      downloadFile({
        url,
        filename: template,
        mime_type: 'application/pdf'
      }).catch(error=>{
        GUI.showUserMessage({
          type: 'alert',
          error
        })
      }).finally(()=>{
        ApplicationService.setDownload(false, download_caller_id);
        GUI.setLoadingContent(false);
      })
  })
};

proto.showChart = function(ids, container, relationData){
  this.emit('show-chart', ids, container, relationData);
};

proto.hideChart = function(container){
  this.emit('hide-chart', container);
};

proto.showRelationsChart = function(ids=[], layer, feature, action, index, container){
  action.state.toggled[index] = !action.state.toggled[index];
  const relations = this._relations[layer.id];
  const relationData = {
    relations,
    fid: feature.attributes['g3w_fid'],
    height: 400
  };
  this.emit('show-chart', ids, container, relationData);
};

proto.printAtlas = function(layer, feature){
  let {id:layerId, features} = layer;
  features = feature ? [feature]: features;
  const atlasLayer = this.getAtlasByLayerId(layerId);
  if (atlasLayer.length > 1) {
    let inputs='';
    atlasLayer.forEach((atlas, index) => {
      inputs += `<input id="${index}" class="magic-radio" type="radio" name="template" value="${atlas.name}"/>
                 <label for="${index}">${atlas.name}</label>
                 <br>`;
    });

    GUI.showModalDialog({
      title: "Seleziona Template",
      message: inputs,
      buttons: {
        success: {
          label: "OK",
          className: "btn-success",
          callback: ()=> {
            const index = $('input[name="template"]:checked').attr('id');
            if (index !== null || index !== undefined) {
              const atlas = atlasLayer[index];
              this._printSingleAtlas({
                atlas,
                features
              })
            }
          }
        }
      }
    })
  } else this._printSingleAtlas({
      atlas: atlasLayer[0],
      features
    })
};

proto.downloadFeatures = function(type, {id:layerId}={}, features=[]){
  const data = {};
  features = features ?  Array.isArray(features) ? features : [features]: features;
  data.fids = features.map(feature => feature.attributes['g3w_fid']).join(',');
  const layer = CatalogLayersStoresRegistry.getLayerById(layerId);
  let promise = Promise.resolve();
  const download_caller_id = ApplicationService.setDownload(true);
  GUI.setLoadingContent(true);
  switch(type) {
    case 'shapefile':
      promise = layer.getShp({data});
      break;
    case 'xls':
      promise  = layer.getXls({data});
      break;
    case 'csv':
      promise  = layer.getCsv({data});
      break;
    case 'gpx':
      promise = layer.getGpx({data});
      break;
  }
  promise.catch((err) => {
    GUI.notify.error(t("info.server_error"));
  }).finally(()=>{
    ApplicationService.setDownload(false, download_caller_id);
    GUI.setLoadingContent(false);
  })
};

proto.downloadGpx = function({id:layerId}={}, feature){
  const fid = feature ? feature.attributes['g3w_fid'] : null;
  const layer = CatalogLayersStoresRegistry.getLayerById(layerId);
  layer.getGpx({fid}).catch((err) => {
    GUI.notify.error(t("info.server_error"));
  }).finally(() => {
    this.layerMenu.loading.shp = false;
    this._hideMenu();
  })
};

proto.downloadXls = function({id:layerId}={}, feature){
  const fid = feature ? feature.attributes['g3w_fid'] : null;
  const layer = CatalogLayersStoresRegistry.getLayerById(layerId);
  layer.getXls({fid}).catch(err => {
    GUI.notify.error(t("info.server_error"));
  }).finally(() => {
    this.layerMenu.loading.shp = false;
    this._hideMenu();
  })
};

proto.listenClearSelection = function(layer, actionId){
  const _layer = CatalogLayersStoresRegistry.getLayerById(layer.id);
  const handler = ()=>{
    const action = this.state.layersactions[layer.id].find(action => action.id === actionId);
    layer.features.forEach((feature, index) => action.state.toggled[index] = false);
  };
  _layer.on('unselectionall', handler);
  this.unlistenerlayeractionevents.push({
    layer:_layer,
    event:'unselectionall',
    handler
  })
};

proto.unlistenerEventsActions = function(){
  this.unlistenerlayeractionevents.forEach(obj => {
    obj.layer.off(obj.event, obj.handler)
  });
  this.unlistenerlayeractionevents = null;
};

proto.addRemoveFilter = function(layer){
  const _layer = CatalogLayersStoresRegistry.getLayerById(layer.id);
  _layer.toggleFilterToken();
};

proto.selectionFeaturesLayer = function(layer) {
  const layerId = layer.id;
  const action = this.state.layersactions[layerId].find(action => action.id === 'selection');
  const bool = Object.values(action.state.toggled).reduce((acculmulator, value) => acculmulator && value, true);
  const _layer = CatalogLayersStoresRegistry.getLayerById(layerId);
  layer.features.forEach((feature, index) => {
    action.state.toggled[index] = !bool;
    this._addRemoveSelectionFeature(_layer, feature, index, bool ? 'remove' : 'add');
  })
};

proto._addRemoveSelectionFeature = async function(layer, feature, index, force){
  const fid = feature ? 1*feature.attributes['g3w_fid']: null;
  const hasAlreadySelectioned = layer.getFilterActive() || layer.hasSelectionFid(fid);
  if (!hasAlreadySelectioned) {
    if (feature && feature.geometry && !layer.getOlSelectionFeature(fid)) {
      layer.addOlSelectionFeature({
        id: fid,
        geometry: feature.geometry
      })
    }
  }
  if (force === undefined) {
    layer[hasAlreadySelectioned ? 'excludeSelectionFid': 'includeSelectionFid'](fid);
  } else if (!hasAlreadySelectioned && force === 'add') await layer.includeSelectionFid(fid);
    else if (hasAlreadySelectioned && force === 'remove') await layer.excludeSelectionFid(fid);
  if (layer.getFilterActive()) {
    const currentLayer = this.state.layers.find(_layer => _layer.id === layer.getId());
    layer.getSelectionFids().size > 0 && currentLayer && currentLayer.features.splice(index, 1);
    this.mapService.clearHighlightGeometry();
    this.state.layers.length === 1 && !this.state.layers[0].features.length && this.state.layers.splice(0);
  }
};

proto.checkFeatureSelection = function({layerId, feature, index, action}={}){
  const layer = CatalogLayersStoresRegistry.getLayerById(layerId);
  if (feature) {
    const fid = feature ? 1*feature.attributes['g3w_fid']: null;
    action.state.toggled[index] = layer.getFilterActive() || layer.hasSelectionFid(fid);
  }
};

proto.addToSelection = function(layer, feature, action, index){
  action.state.toggled[index] = !action.state.toggled[index];
  const _layer = CatalogLayersStoresRegistry.getLayerById(layer.id);
  this._addRemoveSelectionFeature(_layer, feature, index);
};

proto.goToGeometry = function(layer, feature) {
  if (feature.geometry) {
    if (this._asyncFnc.goToGeometry.async) {
      this._asyncFnc.todo = this.mapService.highlightGeometry.bind(this.mapService, feature.geometry, {
        layerId: layer.id,
        duration: 1500
      });
    } else setTimeout(() => {
      this.mapService.highlightGeometry(feature.geometry, {
        layerId: layer.id,
        duration: 1500
      });
    }, 0)
  }
};

//save layer result
proto.saveLayerResult = function({layer, type='csv'}={}) {
  this.downloadFeatures(type, layer, layer.features);
};

proto.highlightGeometry = function(layer, feature) {
  feature.geometry &&  this.mapService.highlightGeometry(feature.geometry, {
      layerId: layer.id,
      zoom: false,
      duration: Infinity
    });

};

proto.clearHighlightGeometry = function(layer, feature) {
  this.mapService.clearHighlightGeometry();
};

proto.showQueryRelations = function(layer, feature, action) {
  GUI.pushContent({
    content: new RelationsPage({
      relations: action.relations,
      chartRelationIds: action.chartRelationIds,
      feature,
      layer
    }),
    backonclose: true,
    closable: false
  });
};

module.exports = QueryResultsService;


