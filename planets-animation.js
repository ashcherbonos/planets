const FRAME_TIME = 15;
const BASE_SPEED_PER_FRAME = 0.0001;
const DECCELERATION = 0.975;
const MAX_SPEED = 1;

let outerRim =[ 
    {element:document.getElementById("planet_1_1"),phase:DergeeToRad(0)},
    {element:document.getElementById("planet_1_2"),phase:DergeeToRad(30)},
    {element:document.getElementById("planet_1_3"),phase:DergeeToRad(60)},
    {element:document.getElementById("planet_1_4"),phase:DergeeToRad(90)},
    {element:document.getElementById("planet_1_5"),phase:DergeeToRad(120)},
    {element:document.getElementById("planet_1_6"),phase:DergeeToRad(150)},
    {element:document.getElementById("planet_1_7"),phase:DergeeToRad(180)},
    {element:document.getElementById("planet_1_8"),phase:DergeeToRad(210)},
    {element:document.getElementById("planet_1_9"),phase:DergeeToRad(240)},
    {element:document.getElementById("planet_1_10"),phase:DergeeToRad(270)},
    {element:document.getElementById("planet_1_11"),phase:DergeeToRad(300)},
    {element:document.getElementById("planet_1_12"),phase:DergeeToRad(330)},
];

let middleRim =[ 
    {element:document.getElementById("planet_2_1"),phase:DergeeToRad(0)},
    {element:document.getElementById("planet_2_2"),phase:DergeeToRad(60)},
    {element:document.getElementById("planet_2_3"),phase:DergeeToRad(120)},
    {element:document.getElementById("planet_2_4"),phase:DergeeToRad(150)},
    {element:document.getElementById("planet_2_5"),phase:DergeeToRad(210)},
    {element:document.getElementById("planet_2_6"),phase:DergeeToRad(270)},
];

let innerRim =[ 
    {element:document.getElementById("planet_3_1"),phase:DergeeToRad(0)},
    {element:document.getElementById("planet_3_2"),phase:DergeeToRad(90)},
    {element:document.getElementById("planet_3_3"),phase:DergeeToRad(180)},
    {element:document.getElementById("planet_3_4"),phase:DergeeToRad(270)},
];

let galaxy=[
    {speed:3,run:true,currentPhase:0,lastFramePhase:0,inertiaSpeed:0,orbit:{x:48,y:48,r:50},planets:outerRim,div:document.getElementById("galaxy_outer_rim"),lastFramePhase:0,currentFramePhase:0},
    {speed:13,run:true,currentPhase:0,lastFramePhase:0,inertiaSpeed:0,orbit:{x:50,y:42,r:52},planets:middleRim,div:document.getElementById("galaxy_middle_rim"),lastFramePhase:0,currentFramePhase:0},
    {speed:23,run:true,currentPhase:0,lastFramePhase:0,inertiaSpeed:0,orbit:{x:50,y:48,r:52},planets:innerRim,div:document.getElementById("galaxy_inner_rim"),lastFramePhase:0,currentFramePhase:0},
]

let lastFrameTime=0;
let currentFrameTime=0;

function AddListeners(){
    galaxy.forEach(rim=>{
        rim.div.onmouseenter = function(event) {
            rim.run = false;
            rim.inertiaSpeed = 0;
            mousePosition = {
                x : event.clientX,
                y : event.clientY
            };
            rim.startPhase = rim.currentPhase + GetAngle(mousePosition,rim.div);
        };

        rim.div.onmousemove = function(event) {
            mousePosition = {
                x : event.clientX,
                y : event.clientY
            };
            MoveRimTo(rim.startPhase-GetAngle(mousePosition,rim.div),rim);
            rim.lastFramePhase = rim.currentFramePhase;
            rim.currentFramePhase = rim.currentPhase;            
            lastFrameTime = currentFrameTime;
            currentFrameTime = new Date().getTime();
        };

        rim.div.onmouseleave = function() {
            galaxy.forEach(rim=>rim.run = true);

            let deltaTime = Math.max((currentFrameTime-lastFrameTime), FRAME_TIME);
            let inertia = (rim.currentPhase-rim.lastFramePhase)/deltaTime;
            inertia = Clamp(inertia, MAX_SPEED/2);
            rim.inertiaSpeed = inertia;
        };
    });
}

function DergeeToRad(dergee){
    return dergee/180*Math.PI;
}

function RadToDergee(rad){
    return 180*rad/Math.PI;
}

function MoveRimBy(angle,rim){
    rim.currentPhase += angle;
    rim.planets.forEach(planet=>
        MovePlanet(planet,rim)
    );
}

function MoveRimTo(angle,rim){
    rim.currentPhase = angle;
    rim.planets.forEach(planet=>
        MovePlanet(planet,rim)
    );
}

function MovePlanet(planet,rim){
    let top = (rim.orbit.r*Math.cos(rim.currentPhase+planet.phase)+rim.orbit.y);
    planet.element.style.top =  top + '%';
    planet.element.style.left = (rim.orbit.r*Math.sin(rim.currentPhase+planet.phase)+rim.orbit.x) + '%';
    ScalePlanet(planet, top);
}

function ScalePlanet(planet, top){
    planet.element.style.transform = "scale("+ 0.6*(1 + top/100) + ")";
}

function GetAngle(point,rim){
    let dx = point.x - GetCenterOf(rim).x;
    let dy = point.y - GetCenterOf(rim).y;
    return Math.atan2(dy, dx);
}

function GetCenterOf(div){
    return{
        x:div.offsetLeft+div.offsetWidth*0.6,
        y:div.offsetTop+div.offsetHeight*0.5
    }
}

function Clamp(num,border){
    return Math.min(Math.max(num, -border), border);
}

let speedMaximum=0;
let speedMinimum=0;

function RunTheGalaxy() {
    setInterval(frame, FRAME_TIME);
    function frame() {
        galaxy.forEach(rim=>{
            if(rim.run){
                rim.inertiaSpeed *= DECCELERATION;
                let speed = BASE_SPEED_PER_FRAME*rim.speed+rim.inertiaSpeed;
                speed = Clamp(speed, MAX_SPEED);
                MoveRimBy(speed,rim);
            }
        });
    }
} 

AddListeners();
RunTheGalaxy();