const FRAME_TIME=15;
const BASE_SPEED_PER_FRAME=0.0001;
const DECCELERATION=0.975;
const MAX_SPEED=1;

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
        let deltaPhase=2*Math.PI/planetIds.length ;
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
                inertia=this.Clamp(inertia,MAX_SPEED/2);
                rim.inertiaSpeed=inertia;
            };
        });
    }

    MoveRimBy(angle,rim){
        rim.currentPhase+=angle;
        rim.planets.forEach(planet=>this.MovePlanet(planet,rim));
    }

    MoveRimTo(angle,rim){
        rim.currentPhase = angle;
        rim.planets.forEach(planet=>this.MovePlanet(planet,rim));
    }

    MovePlanet(planet,rim){
        let top=(rim.orbit.r*Math.cos(rim.currentPhase+planet.phase)+rim.orbit.y);
        planet.element.style.top=top+'%';
        planet.element.style.left=(rim.orbit.r*Math.sin(rim.currentPhase+planet.phase)+rim.orbit.x)+'%';
        this.ScalePlanet(planet,top);
    }

    ScalePlanet(planet, top){
        planet.element.style.transform="scale("+0.6*(1+top/100)+")";
    }

    GetAngle(point,div){
        let dx=point.x-this.GetCenterOf(div).x;
        let dy=point.y-this.GetCenterOf(div).y;
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
                    speed=this.Clamp(speed,MAX_SPEED);
                    this.MoveRimBy(speed,rim);
                }
            });
        }, FRAME_TIME);
    }
} 