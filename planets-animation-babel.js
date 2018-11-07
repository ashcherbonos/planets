'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FRAME_TIME = 15;
var BASE_SPEED_PER_FRAME = 0.0001;
var DECCELERATION = 0.975;
var MAX_SPEED = 0.5;
var PLANET_MIN_SCALE = 0.6;
var PLANET_MAX_SCALE = 1.2;
var PLANET_MAX_DELTA_SCALE = PLANET_MAX_SCALE - PLANET_MIN_SCALE;
var VISIBLE_SECTOR_OF_GALAXY_START = -3.3;
var VISIBLE_SECTOR_OF_GALAXY_END = 0.2;
var VISIBLE_SECTOR_OF_GALAXY = VISIBLE_SECTOR_OF_GALAXY_END - VISIBLE_SECTOR_OF_GALAXY_START;

var Galaxy = function () {
  function Galaxy(rims) {
    _classCallCheck(this, Galaxy);

    this.rims = rims;
    this.lastFrameTime = 0;
    this.currentFrameTime = 0;
    this._addListeners();
  }

  _createClass(Galaxy, [{
    key: '_addListeners',
    value: function _addListeners() {
      var _this = this;

      this.rims.forEach(function (rim) {

        rim.div.onmouseenter = function (event) {
          rim.run = false;
          rim.inertiaSpeed = 0;
          rim.startPhase = rim.currentPhase + Utils.getAngle(event, rim.div);
        };

        rim.div.onmousemove = function (event) {
          if(rim.run) return;
          rim.moveTo(rim.startPhase - Utils.getAngle(event, rim.div));
          rim.lastFramePhase = rim.currentFramePhase;
          rim.currentFramePhase = rim.currentPhase;
          _this.lastFrameTime = _this.currentFrameTime;
          _this.currentFrameTime = Date.now();
        };

        rim.div.onmouseleave = function () {
          _this.rims.forEach(function (rim) {
            return rim.run = true;
          });
          var deltaTime = _this.currentFrameTime - _this.lastFrameTime;
          var inertia = (rim.currentPhase - rim.lastFramePhase) / deltaTime;
          inertia = Utils.clamp(inertia, MAX_SPEED);
          rim.inertiaSpeed = inertia;
        };
      });
    }
  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      setInterval(function () {
        _this2.rims.forEach(function (rim) {
          if (!rim.run) return;
          rim.inertiaSpeed *= DECCELERATION;
          var speed = BASE_SPEED_PER_FRAME * rim.speed + rim.inertiaSpeed;
          rim.moveBy(speed);
        });
      }, FRAME_TIME);
    }
  }]);

  return Galaxy;
}();

var Rim = function () {
  function Rim(planetIds, speed, orbit, id) {
    _classCallCheck(this, Rim);

    this.speed = speed;
    this.run = true;
    this.currentPhase = 0;
    this.startPhase = 0;
    this.planets = this._initPlanets(planetIds);
    this.lastFramePhase = 0;
    this.inertiaSpeed = 0;
    this.orbit = orbit;
    this.div = document.getElementById(id);
    this.lastFramePhase = 0;
    this.currentFramePhase = 0;
  }

  _createClass(Rim, [{
    key: '_initPlanets',
    value: function _initPlanets(planetIds) {
      var _this3 = this;

      var planetsPhase = VISIBLE_SECTOR_OF_GALAXY_START;
      var deltaPhase = VISIBLE_SECTOR_OF_GALAXY / planetIds.length;
      var planets = [];
      planetIds.forEach(function (id) {
        planets.push(new Planet(id, planetsPhase, _this3));
        planetsPhase += deltaPhase;
      });
      return planets;
    }
  }, {
    key: 'moveBy',
    value: function moveBy(angle) {
      this.moveTo(this.currentPhase + angle);
    }
  }, {
    key: 'moveTo',
    value: function moveTo(angle) {
      this.currentPhase = angle;
      this.planets.forEach(function (planet) {
        return planet.moveByRim();
      });
    }
  }]);

  return Rim;
}();

var Planet = function () {
  function Planet(id, phase, rim) {
    _classCallCheck(this, Planet);

    this.element = document.getElementById(id);
    this.phase = phase;
    this.rim = rim;
  }

  _createClass(Planet, [{
    key: 'moveByRim',
    value: function moveByRim() {
      this._jumpOverInvisibleSector();
      var top = this.rim.orbit.r * Math.cos(this.phaseInGalaxy) + this.rim.orbit.y;
      var left = this.rim.orbit.r * Math.sin(this.phaseInGalaxy) + this.rim.orbit.x;
      this.element.style.top = top + '%';
      this.element.style.left = left + '%';
      this._scale(top / 100);
    }
  }, {
    key: '_jumpOverInvisibleSector',
    value: function _jumpOverInvisibleSector() {
      this.phase += this.sectorShiftSign * VISIBLE_SECTOR_OF_GALAXY;
    }
  }, {
    key: '_scale',
    value: function _scale(proximity) {
      this.element.style.transform = "scale(" + (PLANET_MIN_SCALE + PLANET_MAX_DELTA_SCALE * proximity) + ")";
    }
  }, {
    key: 'sectorShiftSign',
    get: function get() {
      return this.phaseInGalaxy < VISIBLE_SECTOR_OF_GALAXY_START ? 1 : this.phaseInGalaxy > VISIBLE_SECTOR_OF_GALAXY_END ? -1 : 0;
    }
  }, {
    key: 'phaseInGalaxy',
    get: function get() {
      return this.rim.currentPhase + this.phase;
    }
  }]);

  return Planet;
}();

var Utils = function () {
  function Utils() {
    _classCallCheck(this, Utils);
  }

  _createClass(Utils, null, [{
    key: 'clamp',
    value: function clamp(num, border) {
      return Math.min(Math.max(num, -border), border);
    }
  }, {
    key: 'getAngle',
    value: function getAngle(_ref, div) {
      var x = _ref.clientX,
          y = _ref.clientY;

      var center = this._getCenterOf(div);
      var dx = x - center.x;
      var dy = y - center.y;
      return Math.atan2(-dy, -dx);
    }
  }, {
    key: '_getCenterOf',
    value: function _getCenterOf(div) {
      return {
        x: div.offsetLeft + div.offsetWidth * 0.6,
        y: div.offsetTop + div.offsetHeight * 0.5
      };
    }
  }]);

  return Utils;
}();

var outerRimPlanets = ["planet_1_1", "planet_1_2", "planet_1_3", "planet_1_4", "planet_1_5", "planet_1_6"];

var middleRimPlanets = ["planet_2_1", "planet_2_2", "planet_2_3"];

var innerRimPlanets = ["planet_3_1", "planet_3_2"];

var rims = [new Rim(outerRimPlanets, 3, { x: 48, y: 48, r: 50 }, "galaxy_outer_rim"), new Rim(middleRimPlanets, 13, { x: 50, y: 42, r: 52 }, "galaxy_middle_rim"), new Rim(innerRimPlanets, 23, { x: 50, y: 48, r: 52 }, "galaxy_inner_rim")];

new Galaxy(rims).run();