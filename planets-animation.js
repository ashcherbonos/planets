const FRAME_TIME = 16;
const BASE_SPEED_PER_FRAME = 0.0001;
const DECCELERATION = 0.975;
const MAX_SPEED = 0.5;
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
    this.rims.forEach( rim => {
      rim.div.ontouchmove = (event) => rim.onPointerMove(event.changedTouches[0]);
      rim.div.ontouchend = (event) => rim.onPointerOut();
      
      rim.div.onmousemove = (event) => rim.onPointerMove(event);
      rim.div.onmouseleave = () => rim.onPointerOut();
    });
  }

  run() {
    setInterval( () => {
      this.rims.forEach( rim => {
        if(!rim.run) return;
        rim.inertiaSpeed *= DECCELERATION;
        let speed = BASE_SPEED_PER_FRAME * rim.speed + rim.inertiaSpeed;
        rim.moveBy(speed);
      });
    }, FRAME_TIME);
  }
} 

class Rim {
  constructor(planetIds, speed, orbit, id) {
    this.id = id;
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
    this.lastFrameTime = 0;
    this.currentFrameTime = 0;
    this.localCoordinateSystem = new RotatedCoordinatSystem(orbit.alpha, this.div);
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

  onPointerEnter(point){
    if(this.pointerEntered)return;
    this.pointerEntered = true;

    this.run = false;
    this.inertiaSpeed = 0;
    let localPoint = this.localCoordinateSystem.calculate({x: point.clientX, y: point.clientY});
    this.startPhase = this.currentPhase - Utils.getAngle(localPoint);
  }

  onPointerMove(point){
    let localPoint = this.localCoordinateSystem.calculate({x: point.clientX, y: point.clientY});
    if(this._isOnOrbit(localPoint)){
      this.onPointerEnter(point);
  
      this.moveTo( this.startPhase + Utils.getAngle(localPoint) );
      this.lastFramePhase = this.currentFramePhase;
      this.currentFramePhase = this.currentPhase;            
      this.lastFrameTime = this.currentFrameTime;
      this.currentFrameTime = Date.now();
    }else{
      this.onPointerOut(point);
    }
  }

  onPointerOut(){
    if(!this.pointerEntered)return;
    this.pointerEntered = false;

    this.run = true;
		let deltaTime = this.currentFrameTime - this.lastFrameTime;
		let inertia = (this.currentPhase - this.lastFramePhase) / deltaTime;
    inertia = Utils.clamp(inertia, MAX_SPEED);
    this.inertiaSpeed = inertia;
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
  new Rim(outerRimPlanets, -3, {x:50, y:46, r:50, alpha:-7}, "galaxy_outer_rim"),
  new Rim(middleRimPlanets, -13, {x:50, y:45, r:50, alpha:-7}, "galaxy_middle_rim"),
  new Rim(innerRimPlanets, -23, {x:50, y:44, r:50, alpha:-7}, "galaxy_inner_rim"),
];

new Galaxy(rims).run();
