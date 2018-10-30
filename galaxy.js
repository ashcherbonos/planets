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

class Planet {
  constructor(id, phase, rim) {
    this.element = document.getElementById(id);
    this.phase = phase;
    this.rim = rim;
  }

  MoveByRim() {
    this.phase +=  this.sectorShiftSign * VISIBLE_SECTOR_OF_GALAXY;
    let top = ( this.rim.orbit.r * Math.cos(this.phaseInGalaxy) + this.rim.orbit.y );
    let left = ( this.rim.orbit.r * Math.sin(this.phaseInGalaxy) + this.rim.orbit.x );
    this.element.style.top = top + '%';
    this.element.style.left = left + '%';
    this.Scale(top);
  }

  get phaseInGalaxy() {
    return this.rim.currentPhase + this.phase;
  }

  get sectorShiftSign() {
		return this.phaseInGalaxy < VISIBLE_SECTOR_OF_GALAXY_START ? 1 :
			this.phaseInGalaxy > VISIBLE_SECTOR_OF_GALAXY_END ? -1 : 
			0;
	}
	
  Scale(proximity) {
		this.element.style.transform = "scale(" +
			( PLANET_MIN_SCALE + PLANET_MAX_DELTA_SCALE * proximity / 100 ) +
			")";
  }
}

export class Rim {
  constructor(planetIds, speed, orbit, id) {
    this.speed = speed;        
    this.run = true;
    this.currentPhase = 0;
    this.planets = this.InitPlanets(planetIds);
    this.lastFramePhase = 0;
    this.inertiaSpeed = 0;
    this.orbit = orbit;
    this.div = document.getElementById(id);
    this.lastFramePhase = 0;
    this.currentFramePhase = 0;
  }

  InitPlanets(planetIds) {
    let planetsPhase = VISIBLE_SECTOR_OF_GALAXY_START;
    let deltaPhase = VISIBLE_SECTOR_OF_GALAXY / planetIds.length;
    let planets = [];
    planetIds.forEach(id => {
      planets.push( new Planet(id, planetsPhase, this) );
      planetsPhase += deltaPhase;
    });
    return planets;
  }

  MoveBy(angle) {
    this.MoveTo( this.currentPhase + angle )
  }

  MoveTo(angle) {
    this.currentPhase = angle;
    this.planets.forEach( planet => planet.MoveByRim() );
  }
}

export class Galaxy {
  constructor(rims) {
    this.galaxy = rims;
    this.lastFrameTime = 0;
    this.currentFrameTime = 0;
    this.AddListeners();
  }

  AddListeners() {
    this.galaxy.forEach( rim => {
      rim.div.onmouseenter = (event) => {
        rim.run = false;
        rim.inertiaSpeed = 0;
        rim.startPhase = rim.currentPhase + Utils.GetAngle(event, rim.div);
      };

      rim.div.onmousemove = (event) => {
        rim.MoveTo( rim.startPhase - Utils.GetAngle(event, rim.div) );
        rim.lastFramePhase = rim.currentFramePhase;
        rim.currentFramePhase = rim.currentPhase;            
        this.lastFrameTime = this.currentFrameTime;
        this.currentFrameTime = Date.now();
      };

      rim.div.onmouseleave = () => {
        this.galaxy.forEach( rim => rim.run = true );
				let deltaTime = this.currentFrameTime - this.lastFrameTime;
				let inertia = (rim.currentPhase - rim.lastFramePhase) / deltaTime;
        inertia = Utils.Clamp(inertia, MAX_SPEED);
        rim.inertiaSpeed = inertia;
      };
    });
  }

  Run() {
    setInterval( () => {
      this.galaxy.forEach( rim => {
        if(!rim.run) return;
        rim.inertiaSpeed *= DECCELERATION;
        let speed = BASE_SPEED_PER_FRAME * rim.speed + rim.inertiaSpeed;
        rim.MoveBy(speed);
      });
    }, FRAME_TIME);
  }
} 

class Utils{
  static  Clamp(num, border) {
    return Math.min(Math.max(num, -border), border);
  }

  static  GetAngle(event, div) {
    let center = this.GetCenterOf(div);
    let dx = event.clientX - center.x;
    let dy = event.clientY - center.y;
    return Math.atan2(-dy, -dx);
  }

  static GetCenterOf(div) {
    return{
      x: div.offsetLeft + div.offsetWidth * 0.6, 
      y: div.offsetTop + div.offsetHeight * 0.5
    }
  }
}