'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FRAME_TIME = 16;
var BASE_SPEED_PER_FRAME = 0.0001;
var PLANET_MIN_SCALE = 0.6;
var PLANET_MAX_SCALE = 1.2;
var PLANET_MAX_DELTA_SCALE = PLANET_MAX_SCALE - PLANET_MIN_SCALE;
var VISIBLE_SECTOR_OF_GALAXY_START = -3.3;
var VISIBLE_SECTOR_OF_GALAXY_END = 0.2;
var VISIBLE_SECTOR_OF_GALAXY = VISIBLE_SECTOR_OF_GALAXY_END - VISIBLE_SECTOR_OF_GALAXY_START;
var ORBIT_INTERACTION_TRASHOLD = 0.1;

var Galaxy = function () {
  function Galaxy(rims) {
    _classCallCheck(this, Galaxy);

    this.rims = rims;
    this._addListeners();
  }

  _createClass(Galaxy, [{
    key: '_addListeners',
    value: function _addListeners() {
      var _this = this;

      document.onpointerdown = function (event) {
        _this.rims.forEach(function (rim) {
          return rim.onPointerDown(event);
        });
      };
      document.onpointerup = function (_) {
        _this.rims.forEach(function (rim) {
          return rim.onPointerUp();
        });
      };
      document.onmousemove = function (event) {
        _this.rims.forEach(function (rim) {
          return rim.onPointerMove(event);
        });
      };
    }
  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      setInterval(function () {
        _this2.rims.forEach(function (rim) {
          if (!rim.run) return;
          var speed = BASE_SPEED_PER_FRAME * rim.speed * rim.speedCoeff;
          rim.moveBy(speed);
        });
      }, FRAME_TIME);
    }
  }]);

  return Galaxy;
}();

var Rim = function () {
  function Rim(planetIds, speed, pointerOnSpeedCoeff, orbit, id) {
    _classCallCheck(this, Rim);

    this.id = id;
    this.speed = speed;
    this.speedCoeff = 1;
    this.pointerOnSpeedCoeff = pointerOnSpeedCoeff;
    this.run = true;
    this.currentPhase = 0;
    this.startPhase = 0;
    this.planets = this._initPlanets(planetIds);
    this.orbit = orbit;
    this.div = document.getElementById(id);
    this.localCoordinateSystem = new RotatedCoordinatSystem(orbit.alpha, this.div);
    this.pointerdown = false;
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
    key: 'onPointerDown',
    value: function onPointerDown(point) {
      var localPoint = this.localCoordinateSystem.calculate({ x: point.clientX, y: point.clientY });
      if (this._isOnOrbit(localPoint)) {
        this.pointerdown = true;
        this.run = false;
        var _localPoint = this.localCoordinateSystem.calculate({ x: point.clientX, y: point.clientY });
        this.startPhase = this.currentPhase - Utils.getAngle(_localPoint);
      }
    }
  }, {
    key: 'onPointerUp',
    value: function onPointerUp() {
      if (!this.pointerdown) return;
      this.pointerdown = false;
      this.run = true;
    }
  }, {
    key: 'onPointerOnOrbit',
    value: function onPointerOnOrbit() {
      if (this.pointerdown) return;
      if (this.pointerOnOrbit) return;
      this.pointerOnOrbit = true;
      this.speedCoeff = this.pointerOnSpeedCoeff;
    }
  }, {
    key: 'onPointerMove',
    value: function onPointerMove(point) {
      if (this.pointerdown) {
        var _localPoint2 = this.localCoordinateSystem.calculate({ x: point.clientX, y: point.clientY });
        this.moveTo(this.startPhase + Utils.getAngle(_localPoint2));
        return;
      }

      var localPoint = this.localCoordinateSystem.calculate({ x: point.clientX, y: point.clientY });
      if (this._isOnOrbit(localPoint)) {
        this.onPointerOnOrbit();
      } else {
        this.onPointerOutOfOrbit(point);
      }
    }
  }, {
    key: 'onPointerOutOfOrbit',
    value: function onPointerOutOfOrbit() {
      if (this.pointerdown) return;
      this.speedCoeff = 1;
      this.pointerOnOrbit = false;
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
  }, {
    key: '_isOnOrbit',
    value: function _isOnOrbit(_ref) {
      var x = _ref.x,
          y = _ref.y;

      return Math.abs(x * x + y * y - 1) < ORBIT_INTERACTION_TRASHOLD;
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
      this._scale(1 - top / 100);
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
    value: function getAngle(_ref2) {
      var x = _ref2.x,
          y = _ref2.y;

      return Math.atan2(x, y);
    }
  }, {
    key: 'getCenterOf',
    value: function getCenterOf(div) {
      var rect = div.getBoundingClientRect();
      return {
        x: (rect.left + rect.right) / 2,
        y: (rect.top + rect.bottom) / 2
      };
    }
  }]);

  return Utils;
}();

var RotatedCoordinatSystem = function () {
  function RotatedCoordinatSystem(alpha, div) {
    _classCallCheck(this, RotatedCoordinatSystem);

    var rad = alpha / 180 * Math.PI;
    this.matrix = {
      x1: +Math.cos(rad),
      x2: +Math.sin(rad),
      y1: -Math.sin(rad),
      y2: +Math.cos(rad)
    };
    this.div = div;
    this.style = window.getComputedStyle(div);
  }

  _createClass(RotatedCoordinatSystem, [{
    key: 'calculate',
    value: function calculate(point) {
      var center = Utils.getCenterOf(this.div);
      var x = point.x - center.x;
      var y = point.y - center.y;
      return {
        x: 2 * (x * this.matrix.x1 + y * this.matrix.x2) / parseInt(this.style.width),
        y: 2 * (x * this.matrix.y1 + y * this.matrix.y2) / parseInt(this.style.height)
      };
    }
  }]);

  return RotatedCoordinatSystem;
}();

var outerRimPlanets = ["planet_1_1", "planet_1_2", "planet_1_3", "planet_1_4", "planet_1_5", "planet_1_6"];

var middleRimPlanets = ["planet_2_1", "planet_2_2", "planet_2_3"];

var innerRimPlanets = ["planet_3_1", "planet_3_2"];

var rims = [new Rim(outerRimPlanets, -3, 50, { x: 48, y: 46, r: 50, alpha: -7 }, "galaxy_outer_rim"), new Rim(middleRimPlanets, -13, 20, { x: 50, y: 45, r: 52, alpha: -7 }, "galaxy_middle_rim"), new Rim(innerRimPlanets, -23, 15, { x: 50, y: 44, r: 52, alpha: -7 }, "galaxy_inner_rim")];

new Galaxy(rims).run();