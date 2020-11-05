/*!
Rotate vector features interaction for OpenLayers

@package ol-rotate-feature
@author Vladimir Vershinin <ghettovoice@gmail.com>
@version 3.0.1
@licence MIT
@copyright (c) 2016-2020, Vladimir Vershinin <ghettovoice@gmail.com>
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('ol/interaction'), require('ol'), require('ol/layer'), require('ol/source'), require('ol/geom'), require('ol/style'), require('ol/extent'), require('ol/events/condition')) :
  typeof define === 'function' && define.amd ? define('ol-rotate-feature', ['ol/interaction', 'ol', 'ol/layer', 'ol/source', 'ol/geom', 'ol/style', 'ol/extent', 'ol/events/condition'], factory) :
  (global = global || self, global.RotateFeatureInteraction = factory(global.ol.interaction, global.ol, global.ol.layer, global.ol.source, global.ol.geom, global.ol.style, global.ol.extent, global.ol.events.condition));
}(this, (function (interaction, ol, layer, source, geom, style, extent, condition) { 'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var defineProperty = _defineProperty;

  function createCommonjsModule(fn, basedir, module) {
  	return module = {
  	  path: basedir,
  	  exports: {},
  	  require: function (path, base) {
        return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
      }
  	}, fn(module, module.exports), module.exports;
  }

  function commonjsRequire () {
  	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
  }

  var _typeof_1 = createCommonjsModule(function (module) {
  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      module.exports = _typeof = function _typeof(obj) {
        return typeof obj;
      };
    } else {
      module.exports = _typeof = function _typeof(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  module.exports = _typeof;
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var classCallCheck = _classCallCheck;

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  var createClass = _createClass;

  var getPrototypeOf = createCommonjsModule(function (module) {
  function _getPrototypeOf(o) {
    module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  module.exports = _getPrototypeOf;
  });

  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = getPrototypeOf(object);
      if (object === null) break;
    }

    return object;
  }

  var superPropBase = _superPropBase;

  var get = createCommonjsModule(function (module) {
  function _get(target, property, receiver) {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      module.exports = _get = Reflect.get;
    } else {
      module.exports = _get = function _get(target, property, receiver) {
        var base = superPropBase(target, property);
        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);

        if (desc.get) {
          return desc.get.call(receiver);
        }

        return desc.value;
      };
    }

    return _get(target, property, receiver || target);
  }

  module.exports = _get;
  });

  var setPrototypeOf = createCommonjsModule(function (module) {
  function _setPrototypeOf(o, p) {
    module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  module.exports = _setPrototypeOf;
  });

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) setPrototypeOf(subClass, superClass);
  }

  var inherits = _inherits;

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  var assertThisInitialized = _assertThisInitialized;

  function _possibleConstructorReturn(self, call) {
    if (call && (_typeof_1(call) === "object" || typeof call === "function")) {
      return call;
    }

    return assertThisInitialized(self);
  }

  var possibleConstructorReturn = _possibleConstructorReturn;

  /**
   * This file is part of ol-rotate-feature package.
   * @module ol-rotate-feature
   * @license MIT
   * @author Vladimir Vershinin
   */

  /**
   * @param {boolean} condition
   * @param {string} message
   * @throws Error
   */
  function assert(condition) {
    var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    message = ['Assertion failed', message].join(': ');

    if (!condition) {
      throw new Error(message);
    }
  }
  /**
   * @param {*} arg
   * @returns {*}
   */

  function identity(arg) {
    return arg;
  }
  function includes(arr, value) {
    return arr.indexOf(value) !== -1;
  }
  function isArray(val) {
    return Object.prototype.toString.call(val) === '[object Array]';
  }

  /**
   * This file is part of ol-rotate-feature package.
   * @module ol-rotate-feature
   * @license MIT
   * @author Vladimir Vershinin
   */

  /**
   * @enum {string}
   */
  var RotateFeatureEventType = {
    /**
     * Triggered upon feature rotate start.
     * @event RotateFeatureEvent#rotatestart
     */
    START: 'rotatestart',

    /**
     * Triggered upon feature rotation.
     * @event RotateFeatureEvent#rotating
     */
    ROTATING: 'rotating',

    /**
     * Triggered upon feature rotation end.
     * @event RotateFeatureEvent#rotateend
     */
    END: 'rotateend'
  };
  /**
   * Events emitted by RotateFeatureInteraction instances are instances of this type.
   *
   * @class
   * @author Vladimir Vershinin
   */

  var RotateFeatureEvent = /*#__PURE__*/function () {
    /**
     * @param {string} type Type.
     * @param {ol.Collection<ol.Feature>} features Rotated features.
     * @param {number} angle Angle in radians.
     * @param {ol.Coordinate} anchor Anchor position.
     */
    function RotateFeatureEvent(type, features, angle, anchor) {
      classCallCheck(this, RotateFeatureEvent);

      /**
       * @type {boolean}
       * @private
       */
      this.propagationStopped_ = false;
      /**
       * The event type.
       * @type {string}
       * @private
       */

      this.type_ = type;
      /**
       * The features being rotated.
       * @type {ol.Collection<ol.Feature>}
       * @private
       */

      this.features_ = features;
      /**
       * Current angle in radians.
       * @type {number}
       * @private
       */

      this.angle_ = angle;
      /**
       * Current rotation anchor.
       * @type {ol.Coordinate}
       * @private
       */

      this.anchor_ = anchor;
    }
    /**
     * @type {boolean}
     */


    createClass(RotateFeatureEvent, [{
      key: "preventDefault",

      /**
       * Prevent event propagation.
       */
      value: function preventDefault() {
        this.propagationStopped_ = true;
      }
      /**
       * Stop event propagation.
       */

    }, {
      key: "stopPropagation",
      value: function stopPropagation() {
        this.propagationStopped_ = true;
      }
    }, {
      key: "propagationStopped",
      get: function get() {
        return this.propagationStopped_;
      }
      /**
       * @type {string}
       */

    }, {
      key: "type",
      get: function get() {
        return this.type_;
      }
      /**
       * @type {ol.Collection<ol.Feature>}
       */

    }, {
      key: "features",
      get: function get() {
        return this.features_;
      }
      /**
       * @type {number}
       */

    }, {
      key: "angle",
      get: function get() {
        return this.angle_;
      }
      /**
       * @type {ol.Coordinate}
       */

    }, {
      key: "anchor",
      get: function get() {
        return this.anchor_;
      }
    }]);

    return RotateFeatureEvent;
  }();

  var ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  var MAC = ua.indexOf('macintosh') !== -1;
  var WEBKIT = ua.indexOf('webkit') !== -1 && ua.indexOf('edge') == -1;
  var mouseActionButton = function mouseActionButton(mapBrowserEvent) {
    var originalEvent =
    /** @type {MouseEvent} */
    mapBrowserEvent.originalEvent;
    return originalEvent.button == 0 && !(WEBKIT && MAC && originalEvent.ctrlKey);
  };

  function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return possibleConstructorReturn(this, result); }; }

  function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
  var ANCHOR_KEY = 'rotate-anchor';
  var ARROW_KEY = 'rotate-arrow';
  var ANGLE_PROP = 'angle';
  var ANCHOR_PROP = 'anchor';
  /**
   * @todo todo добавить опцию condition - для возможности переопределения клавиш
   */

  var RotateFeatureInteraction = /*#__PURE__*/function (_PointerInteraction) {
    inherits(RotateFeatureInteraction, _PointerInteraction);

    var _super = _createSuper(RotateFeatureInteraction);

    /**
     * @param {InteractionOptions} options
     */
    function RotateFeatureInteraction() {
      var _context;

      var _this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      classCallCheck(this, RotateFeatureInteraction);

      _this = _super.call(this, {
        // handleEvent: handleEvent,
        handleDownEvent: handleDownEvent,
        handleUpEvent: handleUpEvent,
        handleDragEvent: handleDragEvent,
        handleMoveEvent: handleMoveEvent
      });
      /**
       * @type {string}
       * @private
       */

      _this.previousCursor_ = undefined;
      /**
       * @type {Feature}
       * @private
       */

      _this.anchorFeature_ = undefined;
      /**
       * @type {Feature}
       * @private
       */

      _this.arrowFeature_ = undefined;
      /**
       * @type {Coordinate}
       * @private
       */

      _this.lastCoordinate_ = undefined;
      /**
       * @type {boolean}
       * @private
       */

      _this.anchorMoving_ = false;
      /**
       * @type {Vector}
       * @private
       */

      _this.overlay_ = new layer.Vector({
        style: options.style || getDefaultStyle(),
        source: new source.Vector({
          features: new ol.Collection()
        })
      });
      /**
       * @private
       * @type {module:ol/events/condition~Condition}
       */

      _this.condition_ = options.condition ? options.condition : condition.always;
      /**
       * @type {Collection<Feature>}
       * @private
       */

      _this.features_ = undefined;

      if (options.features) {
        if (isArray(options.features)) {
          _this.features_ = new ol.Collection(options.features);
        } else if (options.features instanceof ol.Collection) {
          _this.features_ = options.features;
        } else {
          throw new Error('Features option should be an array or collection of features, ' + 'got ' + _typeof_1(options.features));
        }
      } else {
        _this.features_ = new ol.Collection();
      }
      /**
       * @type {boolean}
       * @public
       */


      _this.allowAnchorMovement = options.allowAnchorMovement === undefined ? true : options.allowAnchorMovement;

      _this.setAnchor(options.anchor || getFeaturesCentroid(_this.features_));

      _this.setAngle(options.angle || 0);

      _this.features_.on('add', (_context = _this).onFeatureAdd_.bind(_context));

      _this.features_.on('remove', (_context = _this).onFeatureRemove_.bind(_context));

      _this.on('change:' + ANGLE_PROP, (_context = _this).onAngleChange_.bind(_context));

      _this.on('change:' + ANCHOR_PROP, (_context = _this).onAnchorChange_.bind(_context));

      _this.createOrUpdateAnchorFeature_();

      _this.createOrUpdateArrowFeature_();

      return _this;
    }
    /**
     * @type {Collection<Feature>}
     */


    createClass(RotateFeatureInteraction, [{
      key: "setMap",

      /**
       * @param {ol.Map} map
       */
      value: function setMap(map) {
        this.overlay_.setMap(map);

        get(getPrototypeOf(RotateFeatureInteraction.prototype), "setMap", this).call(this, map);
      }
      /**
       * @param {boolean} active
       */

    }, {
      key: "setActive",
      value: function setActive(active) {
        if (this.overlay_) {
          this.overlay_.setMap(active ? this.map : undefined);
        }

        get(getPrototypeOf(RotateFeatureInteraction.prototype), "setActive", this).call(this, active);
      }
      /**
       * Set current angle of interaction features.
       *
       * @param {number} angle
       */

    }, {
      key: "setAngle",
      value: function setAngle(angle) {
        assert(!isNaN(parseFloat(angle)), 'Numeric value passed');
        this.set(ANGLE_PROP, parseFloat(angle));
      }
      /**
       * Returns current angle of interaction features.
       *
       * @return {number}
       */

    }, {
      key: "getAngle",
      value: function getAngle() {
        return this.get(ANGLE_PROP);
      }
      /**
       * Set current anchor position.
       *
       * @param {Coordinate | undefined} anchor
       */

    }, {
      key: "setAnchor",
      value: function setAnchor(anchor) {
        assert(anchor == null || isArray(anchor) && anchor.length === 2, 'Array of two elements passed');
        this.set(ANCHOR_PROP, anchor != null ? anchor.map(parseFloat) : getFeaturesCentroid(this.features_));
      }
      /**
       * Returns current anchor position.
       *
       * @return {Coordinate | undefined}
       */

    }, {
      key: "getAnchor",
      value: function getAnchor() {
        return this.get(ANCHOR_PROP);
      }
      /**
       * @private
       */

    }, {
      key: "createOrUpdateAnchorFeature_",
      value: function createOrUpdateAnchorFeature_() {
        var angle = this.getAngle();
        var anchor = this.getAnchor();
        if (!anchor) return;

        if (this.anchorFeature_) {
          this.anchorFeature_.getGeometry().setCoordinates(anchor);
          this.anchorFeature_.set(ANGLE_PROP, angle);
        } else {
          var _Feature;

          this.anchorFeature_ = new ol.Feature((_Feature = {
            geometry: new geom.Point(anchor)
          }, defineProperty(_Feature, ANGLE_PROP, angle), defineProperty(_Feature, ANCHOR_KEY, true), _Feature));
          this.overlay_.getSource().addFeature(this.anchorFeature_);
        }
      }
      /**
       * @private
       */

    }, {
      key: "createOrUpdateArrowFeature_",
      value: function createOrUpdateArrowFeature_() {
        var angle = this.getAngle();
        var anchor = this.getAnchor();
        if (!anchor) return;

        if (this.arrowFeature_) {
          this.arrowFeature_.getGeometry().setCoordinates(anchor);
          this.arrowFeature_.set(ANGLE_PROP, angle);
        } else {
          var _Feature2;

          this.arrowFeature_ = new ol.Feature((_Feature2 = {
            geometry: new geom.Point(anchor)
          }, defineProperty(_Feature2, ANGLE_PROP, angle), defineProperty(_Feature2, ARROW_KEY, true), _Feature2));
          this.overlay_.getSource().addFeature(this.arrowFeature_);
        }
      }
      /**
       * @private
       */

    }, {
      key: "resetAngleAndAnchor_",
      value: function resetAngleAndAnchor_() {
        this.resetAngle_();
        this.resetAnchor_();
      }
      /**
       * @private
       */

    }, {
      key: "resetAngle_",
      value: function resetAngle_() {
        this.set(ANGLE_PROP, 0, true);
        this.arrowFeature_ && this.arrowFeature_.set(ANGLE_PROP, this.getAngle());
        this.anchorFeature_ && this.anchorFeature_.set(ANGLE_PROP, this.getAngle());
      }
      /**
       * @private
       */

    }, {
      key: "resetAnchor_",
      value: function resetAnchor_() {
        this.set(ANCHOR_PROP, getFeaturesCentroid(this.features_), true);

        if (this.getAnchor()) {
          this.arrowFeature_ && this.arrowFeature_.getGeometry().setCoordinates(this.getAnchor());
          this.anchorFeature_ && this.anchorFeature_.getGeometry().setCoordinates(this.getAnchor());
        }
      }
      /**
       * @private
       */

    }, {
      key: "onFeatureAdd_",
      value: function onFeatureAdd_() {
        this.resetAngleAndAnchor_();
        this.createOrUpdateAnchorFeature_();
        this.createOrUpdateArrowFeature_();
      }
      /**
       * @private
       */

    }, {
      key: "onFeatureRemove_",
      value: function onFeatureRemove_() {
        this.resetAngleAndAnchor_();

        if (this.features_.getLength()) {
          this.createOrUpdateAnchorFeature_();
          this.createOrUpdateArrowFeature_();
        } else {
          this.overlay_.getSource().clear();
          this.anchorFeature_ = this.arrowFeature_ = undefined;
        }
      }
      /**
       * @private
       */

    }, {
      key: "onAngleChange_",
      value: function onAngleChange_(_ref) {
        var _this2 = this;

        var oldValue = _ref.oldValue;
        this.features_.forEach(function (feature) {
          return feature.getGeometry().rotate(_this2.getAngle() - oldValue, _this2.getAnchor());
        });
        this.arrowFeature_ && this.arrowFeature_.set(ANGLE_PROP, this.getAngle());
        this.anchorFeature_ && this.anchorFeature_.set(ANGLE_PROP, this.getAngle());
      }
      /**
       * @private
       */

    }, {
      key: "onAnchorChange_",
      value: function onAnchorChange_() {
        var anchor = this.getAnchor();

        if (anchor) {
          this.anchorFeature_ && this.anchorFeature_.getGeometry().setCoordinates(anchor);
          this.arrowFeature_ && this.arrowFeature_.getGeometry().setCoordinates(anchor);
        }
      }
      /**
       * @param {Collection<Feature>} features
       * @private
       */

    }, {
      key: "dispatchRotateStartEvent_",
      value: function dispatchRotateStartEvent_(features) {
        this.dispatchEvent(new RotateFeatureEvent(RotateFeatureEventType.START, features, this.getAngle(), this.getAnchor()));
      }
      /**
       * @param {Collection<Feature>} features
       * @private
       */

    }, {
      key: "dispatchRotatingEvent_",
      value: function dispatchRotatingEvent_(features) {
        this.dispatchEvent(new RotateFeatureEvent(RotateFeatureEventType.ROTATING, features, this.getAngle(), this.getAnchor()));
      }
      /**
       * @param {Collection<Feature>} features
       * @private
       */

    }, {
      key: "dispatchRotateEndEvent_",
      value: function dispatchRotateEndEvent_(features) {
        this.dispatchEvent(new RotateFeatureEvent(RotateFeatureEventType.END, features, this.getAngle(), this.getAnchor()));
      }
    }, {
      key: "features",
      get: function get() {
        return this.features_;
      }
      /**
       * @type {number}
       */

    }, {
      key: "angle",
      get: function get() {
        return this.getAngle();
      }
      /**
       * @param {number} angle
       */
      ,
      set: function set(angle) {
        this.setAngle(angle);
      }
      /**
       * @type {Coordinate|number[]|undefined}
       */

    }, {
      key: "anchor",
      get: function get() {
        return this.getAnchor();
      }
      /**
       * @param {Coordinate|undefined} anchor
       */
      ,
      set: function set(anchor) {
        this.setAnchor(anchor);
      }
      /**
       * @param {PluggableMap} map
       */

    }, {
      key: "map",
      set: function set(map) {
        this.setMap(map);
      }
      /**
       * @type {PluggableMap}
       */
      ,
      get: function get() {
        return this.getMap();
      }
      /**
       * @param {boolean} active
       */

    }, {
      key: "active",
      set: function set(active) {
        this.setActive(active);
      }
      /**
       * @type {boolean}
       */
      ,
      get: function get() {
        return this.getActive();
      }
    }]);

    return RotateFeatureInteraction;
  }(interaction.Pointer);

  function handleDownEvent(evt) {
    if (!condition.mouseOnly(evt)) {
      return false;
    }

    if (mouseActionButton(evt) && this.condition_(evt)) {
      // disable selection of inner features
      var foundFeature = evt.map.forEachFeatureAtPixel(evt.pixel, identity);

      if (includes(['click', 'singleclick', 'dblclick'], evt.type) && includes([this.anchorFeature_, this.arrowFeature_], foundFeature)) {
        return false;
      } // handle click & drag on features for rotation


      if (foundFeature && !this.lastCoordinate_ && (includes(this.features_.getArray(), foundFeature) || foundFeature === this.arrowFeature_)) {
        this.lastCoordinate_ = evt.coordinate;
        handleMoveEvent.call(this, evt);
        this.dispatchRotateStartEvent_(this.features_);
        return true;
      } // handle click & drag on rotation anchor feature
      else if (foundFeature && foundFeature === this.anchorFeature_ && this.allowAnchorMovement) {
          this.anchorMoving_ = true;
          handleMoveEvent.call(this, evt);
          return true;
        }
    }

    return false;
  }
  /**
   * @param {MapBrowserEvent} evt Event.
   * @return {boolean}
   * @this {RotateFeatureInteraction}
   * @private
   */


  function handleUpEvent(evt) {
    // stop drag sequence of features
    if (this.lastCoordinate_) {
      this.lastCoordinate_ = undefined;
      handleMoveEvent.call(this, evt);
      this.dispatchRotateEndEvent_(this.features_);
      return true;
    } // stop drag sequence of the anchors
    else if (this.anchorMoving_) {
        this.anchorMoving_ = false;
        handleMoveEvent.call(this, evt);
        return true;
      }

    return false;
  }
  /**
   * @param {MapBrowserEvent} evt Event.
   * @return {boolean}
   * @this {RotateFeatureInteraction}
   * @private
   */


  function handleDragEvent(_ref2) {
    var coordinate = _ref2.coordinate;
    var anchorCoordinate = this.anchorFeature_.getGeometry().getCoordinates(); // handle drag of features by angle

    if (this.lastCoordinate_) {
      // calculate vectors of last and current pointer positions
      var lastVector = [this.lastCoordinate_[0] - anchorCoordinate[0], this.lastCoordinate_[1] - anchorCoordinate[1]];
      var newVector = [coordinate[0] - anchorCoordinate[0], coordinate[1] - anchorCoordinate[1]]; // calculate angle between last and current vectors (positive angle counter-clockwise)

      var angle = Math.atan2(lastVector[0] * newVector[1] - newVector[0] * lastVector[1], lastVector[0] * newVector[0] + lastVector[1] * newVector[1]);
      this.setAngle(this.getAngle() + angle);
      this.dispatchRotatingEvent_(this.features_);
      this.lastCoordinate_ = coordinate;
    } // handle drag of the anchor
    else if (this.anchorMoving_) {
        this.setAnchor(coordinate);
      }
  }
  /**
   * @param {MapBrowserEvent} evt Event.
   * @return {boolean}
   * @this {RotateFeatureInteraction}
   * @private
   */


  function handleMoveEvent(_ref3) {
    var map = _ref3.map,
        pixel = _ref3.pixel;
    var elem = map.getTargetElement();
    var foundFeature = map.forEachFeatureAtPixel(pixel, identity);

    var setCursor = function setCursor(cursor) {
      var vendor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (vendor) {
        elem.style.cursor = '-webkit-' + cursor;
        elem.style.cursor = '-moz-' + cursor;
      }

      elem.style.cursor = cursor;
    };

    if (this.lastCoordinate_) {
      this.previousCursor_ = elem.style.cursor;
      setCursor('grabbing', true);
    } else if (foundFeature && (includes(this.features_.getArray(), foundFeature) || foundFeature === this.arrowFeature_)) {
      this.previousCursor_ = elem.style.cursor;
      setCursor('grab', true);
    } else if (foundFeature && foundFeature === this.anchorFeature_ && this.allowAnchorMovement || this.anchorMoving_) {
      this.previousCursor_ = elem.style.cursor;
      setCursor('crosshair');
    } else {
      setCursor(this.previousCursor_ || '');
      this.previousCursor_ = undefined;
    }
  }
  /**
   * @returns {StyleFunction}
   * @private
   */


  function getDefaultStyle() {
    var _styles;

    var white = [255, 255, 255, 0.8];
    var blue = [0, 153, 255, 0.8];
    var transparent = [255, 255, 255, 0.01];
    var width = 2;
    var styles = (_styles = {}, defineProperty(_styles, ANCHOR_KEY, [new style.Style({
      image: new style.RegularShape({
        fill: new style.Fill({
          color: [0, 153, 255, 0.8]
        }),
        stroke: new style.Stroke({
          color: blue,
          width: 1
        }),
        radius: 4,
        points: 6
      }),
      zIndex: Infinity
    })]), defineProperty(_styles, ARROW_KEY, [new style.Style({
      fill: new style.Fill({
        color: transparent
      }),
      stroke: new style.Stroke({
        color: white,
        width: width + 2
      }),
      text: new style.Text({
        font: '12px sans-serif',
        offsetX: 20,
        offsetY: -20,
        fill: new style.Fill({
          color: 'blue'
        }),
        stroke: new style.Stroke({
          color: white,
          width: width + 1
        })
      }),
      zIndex: Infinity
    }), new style.Style({
      fill: new style.Fill({
        color: transparent
      }),
      stroke: new style.Stroke({
        color: blue,
        width: width
      }),
      zIndex: Infinity
    })]), _styles);
    return function (feature, resolution) {
      var style;
      var angle = feature.get(ANGLE_PROP) || 0;

      switch (true) {
        case feature.get(ANCHOR_KEY):
          style = styles[ANCHOR_KEY];
          style[0].getImage().setRotation(-angle);
          return style;

        case feature.get(ARROW_KEY):
          style = styles[ARROW_KEY];
          var coordinates = feature.getGeometry().getCoordinates(); // generate arrow polygon

          var geom$1 = new geom.Polygon([[[coordinates[0], coordinates[1] - 6 * resolution], [coordinates[0] + 8 * resolution, coordinates[1] - 12 * resolution], [coordinates[0], coordinates[1] + 30 * resolution], [coordinates[0] - 8 * resolution, coordinates[1] - 12 * resolution], [coordinates[0], coordinates[1] - 6 * resolution]]]); // and rotate it according to current angle

          geom$1.rotate(angle, coordinates);
          style[0].setGeometry(geom$1);
          style[1].setGeometry(geom$1);
          style[0].getText().setText(Math.round(-angle * 180 / Math.PI) + '°');
          return style;
      }
    };
  }
  /**
   * @param {Collection<Feature>|Array<Feature>} features
   * @returns {Extent | number[] | undefined}
   * @private
   */


  function getFeaturesExtent(features) {
    features = features instanceof ol.Collection ? features.getArray() : features;
    if (!features.length) return;
    return new geom.GeometryCollection(features.map(function (feature) {
      return feature.getGeometry();
    })).getExtent();
  }
  /**
   * @param {Collection<ol.Feature> | Array<Feature>} features
   * @return {Coordinate | number[] | undefined}
   */


  function getFeaturesCentroid(features) {
    features = features instanceof ol.Collection ? features.getArray() : features;
    if (!features.length) return;
    return extent.getCenter(getFeaturesExtent(features));
  }

  /**
   * This file is part of ol-rotate-feature package.
   * @module ol-rotate-feature
   * @license MIT
   * @author Vladimir Vershinin
   */

  if (typeof window !== 'undefined' && window.ol && window.ol.interaction) {
    window.ol.interaction.RotateFeature = RotateFeatureInteraction;
  }

  return RotateFeatureInteraction;

})));
//# sourceMappingURL=ol-rotate-feature.umd.js.map
