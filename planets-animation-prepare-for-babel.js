const FRAME_TIME = 15;
const BASE_SPEED_PER_FRAME = 0.0001;
const DECCELERATION = 0.975;
const MAX_SPEED = 0.5;
const PLANET_MIN_SCALE = 0.6;
const PLANET_MAX_SCALE = 1.2;
const PLANET_MAX_DELTA_SCALE = PLANET_MAX_SCALE - PLANET_MIN_SCALE;
const VISIBLE_SECTOR_OF_GALAXY_START = -3.3;
const VISIBLE_SECTOR_OF_GALAXY_END = 0.2;
const VISIBLE_SECTOR_OF_GALAXY = VISIBLE_SECTOR_OF_GALAXY_END - VISIBLE_SECTOR_OF_GALAXY_START;

class Galaxy {
  constructor(rims) {
    this.rims = rims;
    this.lastFrameTime = 0;
    this.currentFrameTime = 0;
    this._addListeners();
  }

  _addListeners() {
    this.rims.forEach( rim => {

      rim.div.ontouchstart = (event) => {
        rim.run = false;
        rim.inertiaSpeed = 0;
        rim.startPhase = rim.currentPhase + Utils.getAngle(event, rim.div);
      };

      rim.div.ontouchmove = (event) => {
        if(rim.run) return;
        rim.moveTo( rim.startPhase - Utils.getAngle(event, rim.div) );
        rim.lastFramePhase = rim.currentFramePhase;
        rim.currentFramePhase = rim.currentPhase;            
        this.lastFrameTime = this.currentFrameTime;
        this.currentFrameTime = Date.now();
      };

      rim.div.ontouchend = () => {
        this.rims.forEach( rim => rim.run = true );
				let deltaTime = this.currentFrameTime - this.lastFrameTime;
				let inertia = (rim.currentPhase - rim.lastFramePhase) / deltaTime;
        inertia = Utils.clamp(inertia, MAX_SPEED);
        rim.inertiaSpeed = inertia;
      };

      /*
      rim.div.onmouseenter = (event) => {
        rim.run = false;
        rim.inertiaSpeed = 0;
        rim.startPhase = rim.currentPhase + Utils.getAngle(event, rim.div);
      };

      rim.div.onmousemove = (event) => {
        if(rim.run) return;
        rim.moveTo( rim.startPhase - Utils.getAngle(event, rim.div) );
        rim.lastFramePhase = rim.currentFramePhase;
        rim.currentFramePhase = rim.currentPhase;            
        this.lastFrameTime = this.currentFrameTime;
        this.currentFrameTime = Date.now();
      };

      rim.div.onmouseleave = () => {
        this.rims.forEach( rim => rim.run = true );
				let deltaTime = this.currentFrameTime - this.lastFrameTime;
				let inertia = (rim.currentPhase - rim.lastFramePhase) / deltaTime;
        inertia = Utils.clamp(inertia, MAX_SPEED);
        rim.inertiaSpeed = inertia;
      };
      */
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

  moveBy(angle) {
    this.moveTo( this.currentPhase + angle )
  }

  moveTo(angle) {
    this.currentPhase = angle;
    this.planets.forEach( planet => planet.moveByRim() );
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
    this._scale( top / 100 );
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

  static getAngle({x, y}, div) {
    let center = this._getCenterOf(div);
    let dx = x - center.x;
    let dy = y - center.y;
    return Math.atan2(-dy, -dx);
  }

  static _getCenterOf(div) {
    return{
      x: div.offsetLeft + div.offsetWidth * 0.6, 
      y: div.offsetTop + div.offsetHeight * 0.5
    }
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
    new Rim(outerRimPlanets, 3, {x:48, y:48, r:50}, "galaxy_outer_rim"),
    new Rim(middleRimPlanets, 13, {x:50, y:42, r:52}, "galaxy_middle_rim"),
    new Rim(innerRimPlanets, 23, {x:50, y:48, r:52}, "galaxy_inner_rim"),
];

new Galaxy(rims).run();

