const FRAME_TIME=15;
const BASE_SPEED_PER_FRAME=0.0001;
const DECCELERATION=0.975;
const MAX_SPEED=0.5;
const PLANET_MIN_SCALE=0.6;
const PLANET_MAX_SCALE=1.2;
const PLANET_MAX_DELTA_SCALE=PLANET_MAX_SCALE-PLANET_MIN_SCALE;
const VISIBLE_SECTOR_OF_GALAXY_START = -3.3;
const VISIBLE_SECTOR_OF_GALAXY_END = 0.2;
const VISIBLE_SECTOR_OF_GALAXY = VISIBLE_SECTOR_OF_GALAXY_END-VISIBLE_SECTOR_OF_GALAXY_START;

class Planet {
    constructor(id,phase){
        this.element=document.getElementById(id);
        this.phase=phase;
    }
}

export class Rim{
    constructor(planetIds,speed,orbit,id){
        this.speed=speed;        
        this.run=true;
        this.currentPhase=0;
        this.planets=Rim.InitPlanets(planetIds);
        this.lastFramePhase=0;
        this.inertiaSpeed=0;
        this.orbit=orbit;
        this.div=document.getElementById(id);
        this.lastFramePhase=0;
        this.currentFramePhase=0;
    }

    static InitPlanets(planetIds){
        let planetsPhase=0;
        let deltaPhase=VISIBLE_SECTOR_OF_GALAXY/planetIds.length ;
        let planets=[];
        planetIds.forEach(id=>{
            planets.push(new Planet(id,planetsPhase));
            planetsPhase+=deltaPhase;
        });
        return planets;
    }
}

export class Galaxy{
    constructor(rims){
        this.galaxy=rims;
        this.lastFrameTime=0;
        this.currentFrameTime=0;
    }

    AddListeners(){
        this.galaxy.forEach(rim=>{
            rim.div.onmouseenter=(event)=>{
                rim.run=false;
                rim.inertiaSpeed=0;
                let mousePosition={x:event.clientX,y:event.clientY};
                rim.startPhase=rim.currentPhase+this.GetAngle(mousePosition,rim.div);
            };

            rim.div.onmousemove=(event)=>{
                let mousePosition={x:event.clientX,y:event.clientY};
                this.MoveRimTo(rim.startPhase-this.GetAngle(mousePosition,rim.div),rim);
                rim.lastFramePhase=rim.currentFramePhase;
                rim.currentFramePhase=rim.currentPhase;            
                this.lastFrameTime=this.currentFrameTime;
                this.currentFrameTime=new Date().getTime();
            };

            rim.div.onmouseleave=()=>{
                this.galaxy.forEach(rim=>rim.run=true);
                let deltaTime=Math.max((this.currentFrameTime-this.lastFrameTime),FRAME_TIME);
                let inertia=(rim.currentPhase-rim.lastFramePhase)/deltaTime;
                inertia=this.Clamp(inertia,MAX_SPEED);
                rim.inertiaSpeed=inertia;
            };
        });
    }

    MoveRimBy(angle,rim){
        rim.currentPhase+=angle;
        rim.planets.forEach(planet=>this.MovePlanet(planet,rim));
    }

    MoveRimTo(angle,rim){
        rim.currentPhase=angle;
        rim.planets.forEach(planet=>this.MovePlanet(planet,rim));
    }

    MovePlanet(planet,rim){
        let phase = this.SumPhases(rim.currentPhase,planet.phase);
        if(phase>VISIBLE_SECTOR_OF_GALAXY_END){
            planet.phase-=VISIBLE_SECTOR_OF_GALAXY;
            phase = this.SumPhases(rim.currentPhase,planet.phase);
        }else if(phase<VISIBLE_SECTOR_OF_GALAXY_START){
            planet.phase+=VISIBLE_SECTOR_OF_GALAXY;
            phase = this.SumPhases(rim.currentPhase,planet.phase);
        }
        let top=(rim.orbit.r*Math.cos(phase)+rim.orbit.y);
        let left=(rim.orbit.r*Math.sin(phase)+rim.orbit.x);
        planet.element.style.top=top+'%';
        planet.element.style.left=left+'%';
        this.ScalePlanet(planet,top);
    }

    SumPhases(planetPhase,rimPhase){
        return planetPhase+rimPhase;
    }

    ScalePlanet(planet,proximity){
        planet.element.style.transform="scale("+(PLANET_MIN_SCALE+PLANET_MAX_DELTA_SCALE*proximity/100)+")";
    }

    GetAngle(point,div){
        let center=this.GetCenterOf(div);
        let dx=point.x-center.x;
        let dy=point.y-center.y;
        return Math.atan2(dy,dx);
    }

    GetCenterOf(div){
        return{
            x:div.offsetLeft+div.offsetWidth*0.6,
            y:div.offsetTop+div.offsetHeight*0.5
        }
    }

    Clamp(num,border){
        return Math.min(Math.max(num,-border),border);
    }

    Run(){
        this.AddListeners();
        setInterval(()=>{
            this.galaxy.forEach(rim=>{
                if(rim.run){
                    rim.inertiaSpeed*=DECCELERATION;
                    let speed=BASE_SPEED_PER_FRAME*rim.speed+rim.inertiaSpeed;
                    this.MoveRimBy(speed,rim);
                }
            });
        }, FRAME_TIME);
    }
} 