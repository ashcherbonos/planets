const FRAME_TIME=15;
const BASE_SPEED_PER_FRAME=0.0001;
const DECCELERATION=0.975;
const MAX_SPEED=0.5;
const PLANET_MIN_SCALE=0.6;
const PLANET_MAX_SCALE=1.2;
const PLANET_MAX_DELTA_SCALE=PLANET_MAX_SCALE-PLANET_MIN_SCALE;
const VISIBLE_SECTOR_OF_GALAXY_START=-3.3;
const VISIBLE_SECTOR_OF_GALAXY_END=0.2;
const VISIBLE_SECTOR_OF_GALAXY=VISIBLE_SECTOR_OF_GALAXY_END-VISIBLE_SECTOR_OF_GALAXY_START;

class Planet {
    constructor(id,phase){
        this.element=document.getElementById(id);
        this.phase=phase;
    }

    MoveByRim(rim){
        let phase=this.SumPhases(rim.currentPhase,this.phase);
        if(phase>VISIBLE_SECTOR_OF_GALAXY_END){
            this.phase-=VISIBLE_SECTOR_OF_GALAXY;
            phase=this.SumPhases(rim.currentPhase,this.phase);
        }else if(phase<VISIBLE_SECTOR_OF_GALAXY_START){
            this.phase+=VISIBLE_SECTOR_OF_GALAXY;
            phase=this.SumPhases(rim.currentPhase,this.phase);
        }
        let top=(rim.orbit.r*Math.cos(phase)+rim.orbit.y);
        let left=(rim.orbit.r*Math.sin(phase)+rim.orbit.x);
        this.element.style.top=top+'%';
        this.element.style.left=left+'%';
        this.Scale(top);
    }

    SumPhases(rimPhase,planetPhase){
        return planetPhase+rimPhase;
    }

    Scale(proximity){
        this.element.style.transform="scale("+(PLANET_MIN_SCALE+PLANET_MAX_DELTA_SCALE*proximity/100)+")";
    }
}

export class Rim{
    constructor(planetIds,speed,orbit,id){
        this.speed=speed;        
        this.run=true;
        this.currentPhase=0;
        this.planets=this.InitPlanets(planetIds);
        this.lastFramePhase=0;
        this.inertiaSpeed=0;
        this.orbit=orbit;
        this.div=document.getElementById(id);
        this.lastFramePhase=0;
        this.currentFramePhase=0;
    }

    InitPlanets(planetIds){
        let planetsPhase=0;
        let deltaPhase=VISIBLE_SECTOR_OF_GALAXY/planetIds.length ;
        let planets=[];
        planetIds.forEach(id=>{
            planets.push(new Planet(id,planetsPhase));
            planetsPhase+=deltaPhase;
        });
        return planets;
    }

    MoveBy(angle){
        this.currentPhase+=angle;
        this.planets.forEach(planet=>planet.MoveByRim(this));
    }

    MoveTo(angle){
        this.currentPhase=angle;
        this.planets.forEach(planet=>planet.MoveByRim(this));
    }
}

export class Galaxy{
    constructor(rims){
        this.galaxy=rims;
        this.lastFrameTime=0;
        this.currentFrameTime=0;
        this.AddListeners();
    }

    AddListeners(){
        this.galaxy.forEach(rim=>{
            rim.div.onmouseenter=(event)=>{
                rim.run=false;
                rim.inertiaSpeed=0;
                let mousePosition={x:event.clientX,y:event.clientY};
                rim.startPhase=rim.currentPhase+Utils.GetAngle(mousePosition,rim.div);
            };

            rim.div.onmousemove=(event)=>{
                let mousePosition={x:event.clientX,y:event.clientY};
                rim.MoveTo(rim.startPhase-Utils.GetAngle(mousePosition,rim.div));
                rim.lastFramePhase=rim.currentFramePhase;
                rim.currentFramePhase=rim.currentPhase;            
                this.lastFrameTime=this.currentFrameTime;
                this.currentFrameTime=Date.now();
            };

            rim.div.onmouseleave=()=>{
                this.galaxy.forEach(rim=>rim.run=true);
                let deltaTime=Math.max((this.currentFrameTime-this.lastFrameTime),FRAME_TIME);
                let inertia=(rim.currentPhase-rim.lastFramePhase)/deltaTime;
                inertia=Utils.Clamp(inertia,MAX_SPEED);
                rim.inertiaSpeed=inertia;
            };
        });
    }

    Run(){
        setInterval(()=>{
            this.galaxy.forEach(rim=>{
                if(rim.run){
                    rim.inertiaSpeed*=DECCELERATION;
                    let speed=BASE_SPEED_PER_FRAME*rim.speed+rim.inertiaSpeed;
                    rim.MoveBy(speed);
                }
            });
        }, FRAME_TIME);
    }
} 

class Utils{
    static  Clamp(num,border){
        return Math.min(Math.max(num,-border),border);
    }

    static  GetAngle(point,div){
        let center=this.GetCenterOf(div);
        let dx=point.x-center.x;
        let dy=point.y-center.y;
        return Math.atan2(dy,dx);
    }

    static GetCenterOf(div){
        return{
            x:div.offsetLeft+div.offsetWidth*0.6,
            y:div.offsetTop+div.offsetHeight*0.5
        }
    }
}