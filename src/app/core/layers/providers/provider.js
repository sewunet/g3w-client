const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const geoutils = require('g3w-ol/src/utils/utils');
const G3WObject = require('core/g3wobject');
const { geometryFields } =  require('core/utils/geo');
const WORD_NUMERIC_XML_TAG_ESCAPE = 'GIS3W_ESCAPE_NUMERIC_';
const WORD_NUMERIC_FIELD_ESCAPE = 'GIS3W_ESCAPE_NUMERIC_FIELD_';

function Provider(options = {}) {
  this._isReady = false;
  this._name = 'provider';
  this._layer = options.layer;
  this._hasFieldsStartWithNumber = false;
  base(this);
}

inherit(Provider, G3WObject);

const proto = Provider.prototype;

proto.getLayer = function() {
  return this._layer;
};

proto.setLayer = function(layer) {
  this._layer = layer;
};

proto.getFeatures = function() {
  console.log('overwriteby single provider')
};

proto.query = function() {
  console.log('overwriteby single provider')
};

proto.setReady = function(bool) {
  this._isReady = bool;
};

proto.isReady = function() {
  return this._isReady;
};

proto.error = function() {
  //TODO
};

proto.isValid = function() {
  console.log('overwriteby single provider');
};

proto.getName = function() {
  return this._name;
};


// to extract gml from multiple (Tuscany region)
proto.extractGML = function (response) {
  if (response.substr(0,2) !== '--')
    return response;
  const gmlTag1 = new RegExp("<([^ ]*)FeatureCollection");
  const gmlTag2 = new RegExp("<([^ ]*)msGMLOutput");
  const boundary = '\r\n--';
  const parts = response.split(new RegExp(boundary));
  parts.forEach((part) => {
    isGmlPart = part.search(gmlTag1) > -1 ? true : part.search(gmlTag2) > -1 ? true : false;
    if (isGmlPart) {
      const gml = part.substr(part.indexOf("<?xml"));
      return gml;
    }
  });
};

// Method to transform xml from server to present to queryreult component
proto.handleQueryResponseFromServer = function(response, projections, layers, wms=true) {
  layers = layers ? layers : [this._layer];
  const layer = layers[0];
  const infoFormat = layer.getInfoFormat();
  switch(infoFormat) {
    case 'json':
    case 'application/json':
      return this._parseGeoJsonResponse({
        layer,
        response,
        projections,
        infoFormat
      });
      break;
    default:
      if (layer.getType() === "table" || !layer.isExternalWMS() || !layer.isLayerProjectionASMapProjection()) {
        response =  this._handleXMLStringResponseBeforeConvertToJSON({
          layers,
          response,
          wms
        });
        return this._getHandledResponsesFromResponse({
          response,
          layers,
          projections
          //id: false //used in case of layer id .. but for now is set to false in case of layerid starting with number
        });
      } else {
        //case of
        if ( /msGMLOutput/.test(response)) {
          return layers.map((layer) => {
            const layers = layer.getQueryLayerOrigName();
            const parser = new ol.format.WMSGetFeatureInfo({
              layers
            });
            const features = parser.readFeatures(response);
            return {
              layer,
              features
            }
          })
        } else {
          return layers.map((layer) => {
            return this._handleWMSMultilayers({
              layer,
              response,
              projections
            })
          })
        }
      }
  }
};

proto._parseGeoJsonResponse = function({layer, response, projections, infoFormat}={}) {
  const data = infoFormat === 'json' ? response.vector && response.vector.data: response;
  let features = data && this._parseLayerGeoJSON(data, projections) || [];
  const layerFields = layer.getFields();
  features = infoFormat === 'application/json' && features.forEach(feature => {
    const properties = feature.getProperties();
    Object.entries(properties).forEach(([property, value]) => {
      if (property === 'id') feature.set('g3w_fid', feature.getId());
      else if (!geometryFields.find(geometryField => geometryField === property)) {
        const field = layerFields.find(field => field.label === property || field.name === property);
        (field.name !== property) && feature.set(field.name, value);
      }
    });
  }) || features;
  return [{
    layer,
    features
  }]
};

proto._handleWMSMultilayers = function({layer, response, projections} = {}) {
  const x2js = new X2JS();
  const arrayQGS = [...response.matchAll(/<qgs:(\w+) fid=/g)];
  const alreadySubstitute = [];
  arrayQGS.forEach(element => {
    const fid = element[1];
    if (alreadySubstitute.indexOf(fid) === -1) {
      alreadySubstitute.push(fid);
      const startfid = +fid[0];
      if (Number.isInteger(startfid))
        response = response.replace(new RegExp(`${fid}`, "g"), `${WORD_NUMERIC_XML_TAG_ESCAPE}${fid}`);
    }
  });
  const jsonresponse =  x2js.xml_str2json(response);
  // in case of parser return null
  if (!jsonresponse) return [{
    layer,
    features: []
  }];
  const FeatureCollection = jsonresponse.FeatureCollection;
  const handledResponses = [];
  if (FeatureCollection.featureMember) {
    const originalFeatureMember = Array.isArray(FeatureCollection.featureMember) ? FeatureCollection.featureMember : [FeatureCollection.featureMember];
    let layersNames = new Set();
    originalFeatureMember.forEach((featureMember) => {
      layersNames.add(Object.keys(featureMember)[0]);
    });
    for (const layerName of layersNames) {
      jsonresponse.FeatureCollection.featureMember = originalFeatureMember.filter((feature) => {
        return feature[layerName]
      });
      const handledResponse = this._parseLayerFeatureCollection({
        jsonresponse,
        layer,
        projections
      });
      if (handledResponse) {
        const response = handledResponse[0];
        response.layer = layerName.replace(WORD_NUMERIC_XML_TAG_ESCAPE,'');
        handledResponses.unshift(response);
      }
    }
  }
  return handledResponses;
};

proto._groupFeaturesByFields = function(features) {
  return _.groupBy(features, (feature) => {
    return Object.keys(feature);
  });
};

proto._handleWMSMultiLayersResponseFromQGISSERVER = function({groupFeatures, prefix, handledResponses, jsonresponse, layer, projections} = {}){
  // is a multilayers. Each feature has different fields
  Object.keys(groupFeatures).forEach((key, index) => {
    const features = groupFeatures[key];
    jsonresponse.FeatureCollection.featureMember = {
      [`layer${index}`]: features,
      __prefix: prefix
    };
    const handledResponse = this._parseLayerFeatureCollection({
      jsonresponse,
      layer,
      projections
    });
    if (handledResponse) {
      const response = handledResponse[0];
      response.layer = layer;
      handledResponses.unshift(response);
    }
  });
};

proto._getHandledResponsesFromResponse = function({response, layers, projections, id=false}) {
  let multilayers = false;
  const x2js = new X2JS();
  const jsonresponse =  x2js.xml_str2json(response);
  // in case of parser return null
  if (!jsonresponse) return [{
    layer: layers[0],
    features: []
  }];
  const FeatureCollection = jsonresponse.FeatureCollection;
  const handledResponses = [];
  if (FeatureCollection.featureMember) {
    const originalFeatureMember = Array.isArray(FeatureCollection.featureMember) ? FeatureCollection.featureMember : [FeatureCollection.featureMember];
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const layerName = id ? layer.getId() : `layer${i}`;
      const featureMemberArrayAndPrefix = {
        features: null,
        __prefix: null
      };
      jsonresponse.FeatureCollection.featureMember = originalFeatureMember.filter((feature) => {
        const featureMember = feature[layerName];
         if (featureMember) {
           featureMember.g3w_fid = {
             __prefix: feature.__prefix,
             __text: featureMember._fid && featureMember._fid.split('.')[1]
           };
           if (Array.isArray(featureMember)){
             featureMemberArrayAndPrefix.features = featureMember;
             featureMemberArrayAndPrefix.__prefix = feature.__prefix;
             return false;
           }
           return true;
         }
      });
      if (featureMemberArrayAndPrefix.features) {
        const prefix = featureMemberArrayAndPrefix.__prefix;
        // check if features have the same fields. If not group the featues with the same fields
        const groupFeatures = this._groupFeaturesByFields(featureMemberArrayAndPrefix.features);
        //check if features have different fields (multilayers)
        if (Object.keys(groupFeatures).length > 1) {
          // is a multilayers. Each feature has different fields
          multilayers = true;
          this._handleWMSMultiLayersResponseFromQGISSERVER({
            groupFeatures,
            prefix,
            handledResponses,
            jsonresponse,
            layer,
            projections
          })
        } else {
          featureMemberArrayAndPrefix.features.forEach((feature) => {
            //for Each element have to add and object contain layerName and information, and __prefix
            jsonresponse.FeatureCollection.featureMember.push({
              [layerName]: feature,
              __prefix: prefix
            })
          });
        }
      }
      if (!multilayers) {
        const handledResponse = this._parseLayerFeatureCollection({
          jsonresponse,
          layer,
          projections
        });
        handledResponse && handledResponses.unshift(handledResponse[0]);
      }
    }
  }
  return handledResponses;
};

proto._handleXMLStringResponseBeforeConvertToJSON = function({response, layers, wms}) {
  if (!(typeof response === 'string'|| response instanceof String))
    response = new XMLSerializer().serializeToString(response);
  for (let i=0; i < layers.length; i++) {
    const layer = layers[i];
    let originalName = (wms && layer.isWmsUseLayerIds()) ? layer.getId(): layer.getName();
    let sanitizeLayerName = wms ? originalName.replace(/[/\s]/g, '') : originalName.replace(/[/\s]/g, '_');
    sanitizeLayerName = sanitizeLayerName.replace(/(\'+)/, '');
    sanitizeLayerName = sanitizeLayerName.replace(/(\)+)/, '');
    sanitizeLayerName = sanitizeLayerName.replace(/(\(+)/, '');
    const reg = new RegExp(`qgs:${sanitizeLayerName}\\b`, "g");
    response = response.replace(reg, `qgs:layer${i}`);
  }
  const arrayQGS = [...response.matchAll(/qgs:(\d+)(\w+)>/g)];
  this._hasFieldsStartWithNumber = !!arrayQGS.length;
  arrayQGS.forEach((find, idx) => {
    if(idx%2 === 0) {
      const regex = new RegExp(`${find[0]}`, "g");
      response = response.replace(regex, `qgs:${WORD_NUMERIC_FIELD_ESCAPE}${find[1]}${find[2]}>`)
    }
  });
  return response;
};

// digest result
proto.digestFeaturesForLayers = function(featuresForLayers) {
  let id = 0;
  let layers = [];
  let layerAttributes,
    layerTitle,
    layerId;
  featuresForLayers.forEach((featuresForLayer) => {
    featuresForLayer = featuresForLayer;
    const layer = featuresForLayer.layer;
    layerAttributes = layer.getAttributes();
    layerTitle = layer.getTitle();
    layerId = layer.getId();

    const layerObj = {
      title: layerTitle,
      id: layerId,
      attributes: [],
      features: [],
      hasgeometry: false,
      show: true,
      expandable: true,
      hasImageField: false, // check if image filed exist
      error: ''
    };

    // check if exist feature related to the layer
    if (featuresForLayer.features && featuresForLayer.features.length) {
      // get aonly attributes returned by WMS (using the first feature availble)
      layerObj.attributes = this._parseAttributes(layerAttributes, featuresForLayer.features[0].getProperties());
      // check if exist image field
      layerObj.attributes.forEach((attribute) => {
        if (attribute.type === 'image') {
          layerObj.hasImageField = true;
        }
      });
      // loop throught selected features from query result
      featuresForLayer.features.forEach((feature) => {
        const fid = feature.getId() ? feature.getId() : id;
        const geometry = feature.getGeometry();
        // check if feature has geometry
        if (geometry) {
          // set to true it used by action
          layerObj.hasgeometry = true
        }
        // create feature object
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
    else if (featuresForLayer.error){
      layerObj.error = featuresForLayer.error;
    }
  });
  return layers;
};

proto._parseAttributes = function(layerAttributes, featureAttributes) {
  let featureAttributesNames = _.keys(featureAttributes);
  featureAttributesNames = _.filter(featureAttributesNames,function(featureAttributesName) {
    return geometryFields.indexOf(featureAttributesName) === -1;
  });
  if (layerAttributes && layerAttributes.length) {
    let featureAttributesNames = _.keys(featureAttributes);
    return _.filter(layerAttributes,function(attribute){
      return featureAttributesNames.indexOf(attribute.name) > -1;
    })
  } else {
    return _.map(featureAttributesNames, function(featureAttributesName) {
      return {
        name: featureAttributesName,
        label: featureAttributesName
      }
    })
  }
};

proto._transformFeatures = function(features, projections) {
  if (features.length) {
    if(!!features[0].getGeometry()) {
      const mainProjection = projections.layer ? projections.layer : projections.map;
      const invertedAxis = mainProjection.getAxisOrientation().substr(0,2) === 'ne';
      if (projections.layer && (projections.layer.getCode() !== projections.map.getCode())) {
        features.forEach((feature) => {
          const geometry = feature.getGeometry();
          feature.setGeometry(geometry.transform(projections.layer.getCode(), projections.map.getCode()))
        })
      }
      if (invertedAxis) features = this._reverseFeaturesCoordinates(features)
    }
  }
  return features;
};

proto._parseLayerFeatureCollection = function({jsonresponse, layer, projections}) {
  const x2js = new X2JS();
  const layerFeatureCollectionXML = x2js.json2xml_str(jsonresponse);
  const parser = new ol.format.WMSGetFeatureInfo();
  const features = this._transformFeatures(parser.readFeatures(layerFeatureCollectionXML), projections);
  if (features.length && this._hasFieldsStartWithNumber) {
    const properties = Object.keys(features[0].getProperties());
    const numericFields = properties.filter(property => property.indexOf(WORD_NUMERIC_FIELD_ESCAPE) !== -1);
    features.forEach(feature => {
      numericFields.forEach(_field => {
        const value = feature.get(_field);
        const ori_field = _field.replace(WORD_NUMERIC_FIELD_ESCAPE, '');
        feature.set(ori_field, value);
        feature.unset(_field);
      })
    });
    this._hasFieldsStartWithNumber = false;
  }
  return [{
    layer,
    features
  }]
};

proto._reverseFeaturesCoordinates = function(features) {
  features.forEach((feature) => {
    const geometry = feature.getGeometry();
    feature.setGeometry(geoutils.reverseGeometry(geometry))
  });
  return features
};

proto._parseLayermsGMLOutput = function(data) {
  const layers = this._layer.getQueryLayerOrigName();
  const parser = new ol.format.WMSGetFeatureInfo({
    layers: layers
  });
  return parser.readFeatures(data);
};

proto._parseLayerGeoJSON = function(data, projections) {
  const defaultDataProjection = projections.layer || projections.map;
  const geojson = new ol.format.GeoJSON({
    defaultDataProjection,
    geometryName: "geometry"
  });
  return geojson.readFeatures(data);
};


module.exports = Provider;
