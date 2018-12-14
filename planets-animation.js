const FRAME_TIME = 16;
const BASE_SPEED_PER_FRAME = 0.0001;
const PLANET_MIN_SCALE = 0.6;
const PLANET_MAX_SCALE = 1.2;
const PLANET_MAX_DELTA_SCALE = PLANET_MAX_SCALE - PLANET_MIN_SCALE;
const VISIBLE_SECTOR_OF_GALAXY_START = -3.3;
const VISIBLE_SECTOR_OF_GALAXY_END = 0.2;
const VISIBLE_SECTOR_OF_GALAXY = VISIBLE_SECTOR_OF_GALAXY_END - VISIBLE_SECTOR_OF_GALAXY_START;
const ORBIT_INTERACTION_TRASHOLD = 0.1;

class Galaxy {
  constructor(rims) {
    this.rims = rims;
    this._addListeners();
  }

  _addListeners() {
    document.onpointerdown = (event) => {this.rims.forEach( rim => rim.onPointerDown(event))};
    document.onpointerup = (_) => {this.rims.forEach( rim => rim.onPointerUp())};
    document.onmousemove = (event) => {this.rims.forEach( rim => rim.onPointerMove(event))};
  }

  run() {
    setInterval( () => {
      this.rims.forEach( rim => {
        if(!rim.run) return;
        if(rim.pointerOverThePlanet) return;
        let speed = BASE_SPEED_PER_FRAME * rim.speed * rim.speedCoeff;
        rim.moveBy(speed);
      });
    }, FRAME_TIME);
  }
} 

class Rim {
  constructor(planetIds, speed, pointerOnSpeedCoeff, orbit, id) {
    this.id = id;
    this.speed = speed;        
    this.speedCoeff = 1;  
    this.pointerOnSpeedCoeff = pointerOnSpeedCoeff;
    this.pointerOverThePlanet = false;
    this.run = true;
    this.currentPhase = 0;
    this.startPhase = 0;
    this.planets = this._initPlanets(planetIds);
    this.orbit = orbit;
    this.div = document.getElementById(id);
    this.localCoordinateSystem = new RotatedCoordinatSystem(orbit.alpha, this.div);
    this.pointerdown = false;
  }

  _initPlanets(planetIds) {
    let planetsPhase = VISIBLE_SECTOR_OF_GALAXY_START;
    let deltaPhase = VISIBLE_SECTOR_OF_GALAXY / planetIds.length;
    let planets = [];
    planetIds.forEach(id => {
      planets.push( new Planet(id, planetsPhase, this) );
      planetsPhase += deltaPhase;
    });
    return planets;
  }

  onPointerDown(point){
    let localPoint = this.localCoordinateSystem.calculate({x: point.clientX, y: point.clientY});
    if(this._isOnOrbit(localPoint)){
      this.pointerdown = true;
      this.run = false;
      let localPoint = this.localCoordinateSystem.calculate({x: point.clientX, y: point.clientY});
      this.startPhase = this.currentPhase - Utils.getAngle(localPoint);
    }
  }

  onPointerUp(){
    if(!this.pointerdown) return;
    this.pointerdown = false;
    this.run = true;
  }

  onPointerOnOrbit(){
    if(this.pointerdown)return;
    if(this.pointerOnOrbit)return;
    this.pointerOnOrbit = true;
    this.speedCoeff = this.pointerOnSpeedCoeff;
  }

  onPointerMove(point){
    if(this.pointerdown){
      let localPoint = this.localCoordinateSystem.calculate({x: point.clientX, y: point.clientY});
      this.moveTo( this.startPhase + Utils.getAngle(localPoint) );
      return;
    }

    let localPoint = this.localCoordinateSystem.calculate({x: point.clientX, y: point.clientY});
    if(this._isOnOrbit(localPoint)){
      this.onPointerOnOrbit();
    }else{
      this.onPointerOutOfOrbit(point);
    }
  }

  onPointerOutOfOrbit(){
    if(this.pointerdown) return;
    this.speedCoeff = 1;
    this.pointerOnOrbit = false; 
  }

  moveBy(angle) {
    this.moveTo( this.currentPhase + angle )
  }

  moveTo(angle) {
    this.currentPhase = angle;
    this.planets.forEach( planet => planet.moveByRim() );
  }

  _isOnOrbit({x,y}){
    return Math.abs(x * x + y * y - 1) < ORBIT_INTERACTION_TRASHOLD;
  }
}

class Planet {
  constructor(id, phase, rim) {
    this.element = document.getElementById(id);
    this.phase = phase;
    this.rim = rim;
    this._addListeners();
  }

  _addListeners() {
    this.element.onpointerenter = (_) => {this.rim.pointerOverThePlanet = true};
    this.element.onpointermove = (_) => {this.rim.pointerOverThePlanet = true};
    this.element.onpointerout = (_) => {this.rim.pointerOverThePlanet = false};
  }

  moveByRim() {
    this._jumpOverInvisibleSector();
    let top = ( this.rim.orbit.r * Math.cos(this.phaseInGalaxy) + this.rim.orbit.y );
    let left = ( this.rim.orbit.r * Math.sin(this.phaseInGalaxy) + this.rim.orbit.x );
    this.element.style.top = top + '%';
    this.element.style.left = left + '%';
    this._scale( 1 - top / 100 );
	}
	
	_jumpOverInvisibleSector(){
		this.phase +=  this.sectorShiftSign * VISIBLE_SECTOR_OF_GALAXY;
	}

  get sectorShiftSign() {
		return this.phaseInGalaxy < VISIBLE_SECTOR_OF_GALAXY_START ? 1 :
			this.phaseInGalaxy > VISIBLE_SECTOR_OF_GALAXY_END ? -1 : 
			0;
	}
	
	get phaseInGalaxy() {
    return this.rim.currentPhase + this.phase;
	}
	
  _scale(proximity) {
		this.element.style.transform = "scale(" +
			( PLANET_MIN_SCALE + PLANET_MAX_DELTA_SCALE * proximity ) +
			")";
  }
}

class Utils{
  static clamp(num, border) {
    return Math.min(Math.max(num, -border), border);
  }
  
  static getAngle({x, y}) {
    return Math.atan2(x, y);
  }

  static getCenterOf(div) {
    let rect = div.getBoundingClientRect();
    return{
      x: (rect.left + rect.right) / 2, 
      y: (rect.top  +rect.bottom) / 2,
    }
  }
}

class RotatedCoordinatSystem{
  constructor(alpha, div) {
    let rad = alpha/180*Math.PI;
    this.matrix = {
      x1: + Math.cos(rad),
      x2: + Math.sin(rad),
      y1: - Math.sin(rad),
      y2: + Math.cos(rad),
    }
    this.div = div;
    this.style = window.getComputedStyle(div); 
  }

  calculate(point) {
    let center = Utils.getCenterOf(this.div);
    let x = point.x - center.x;
    let y = point.y - center.y;
    return {
      x: 2 * (x * this.matrix.x1 + y * this.matrix.x2) / parseInt(this.style.width),
      y: 2 * (x * this.matrix.y1 + y * this.matrix.y2) / parseInt(this.style.height),
    };
	}
}

let outerRimPlanets = [
    "planet_1_1",
    "planet_1_2",
    "planet_1_3",
    "planet_1_4",
    "planet_1_5",
    "planet_1_6",
];

let middleRimPlanets = [
    "planet_2_1",
    "planet_2_2",
    "planet_2_3",
];

let innerRimPlanets = [
    "planet_3_1",
    "planet_3_2",
];

let rims = [
  new Rim(outerRimPlanets, -3, 8, {x:48, y:46, r:50, alpha:-7}, "galaxy_outer_rim"),
  new Rim(middleRimPlanets, -13, 8, {x:50, y:45, r:52, alpha:-7}, "galaxy_middle_rim"),
  new Rim(innerRimPlanets, -23, 8, {x:50, y:44, r:52, alpha:-7}, "galaxy_inner_rim"),
];

new Galaxy(rims).run();
