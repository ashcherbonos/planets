const TRASHOLD = 50;

var div = document.getElementById('move');
let halfSize = {x:25,y:25};
div.style.position = "fixed";
div.style.background = "red";
div.style.width = halfSize.x*2+"px";
div.style.height = halfSize.y*2+"px";

let orbitDiv = document.getElementById("galaxy_outer_rim");

document.addEventListener('mousemove', function(event) {
    event.preventDefault();

    let elipse = getElips(orbitDiv);
    let angle = GetAngle(event, elipse);
    //let angle = getAngle(event, orbitDiv);
    let radius = GetRadiusOfElipse(angle, elipse);
    let pointOnElipse = PolarToCartesian(radius,angle);

    let x = pointOnElipse.x+elipse.cx;
    let y = pointOnElipse.y+elipse.cy;

    let onOrbit = Math.abs(event.clientX-x) < TRASHOLD && Math.abs(event.clientY-y) < TRASHOLD;

    if(onOrbit){
      div.style.left = (pointOnElipse.x+elipse.cx-halfSize.x) + 'px';
      div.style.top  = (pointOnElipse.y+elipse.cy-halfSize.y) + 'px';
    }
}, true);

function isOnOrbit(div, point){
  let elipse = getElips(div);
  let angle = GetAngle(point, elipse);
  let radius = GetRadiusOfElipse(angle, elipse);
  let pointOnElipse = PolarToCartesian(radius,angle);

  let x = pointOnElipse.x+elipse.cx;
  let y = pointOnElipse.y+elipse.cy;

  return Math.abs(point.clientX-x) < TRASHOLD && Math.abs(point.clientY-y) < TRASHOLD;
}

function getElips(div){
  let rect = div.getBoundingClientRect();
  let style = window.getComputedStyle(div); 
  return{
    cx: ((rect.left+rect.right)/2),
    cy: ((rect.top+rect.bottom)/2),
    rx: parseInt(style.width)/2,
    ry: parseInt(style.height)/2,
    rotation: -7/180*Math.PI,
  }
}

/*
function getAngle({clientX, clientY}, div) {
  let center = _getCenterOf(div);
  let dx = clientX - center.x;
  let dy = clientY - center.y;
  return Math.atan2(-dy, -dx);
}

function _getCenterOf(div) {
  return{
    x: div.offsetLeft + div.offsetWidth * 0.6, 
    y: div.offsetTop + div.offsetHeight * 0.5
  }
}
*/
function GetAngle({clientX, clientY}, elipse){
  let dx = clientX - elipse.cx;
  let dy = clientY - elipse.cy;
  return Math.atan2(dy, dx);
}

function GetRadiusOfElipse(angle, elipse){
  angle-=elipse.rotation;
  return (elipse.rx*elipse.ry)/Math.sqrt(Math.pow((elipse.rx*Math.sin(angle)),2)+Math.pow((elipse.ry*Math.cos(angle)),2));
}

function PolarToCartesian(r,theta){
  return{
    x:r*Math.cos(theta),
    y:r*Math.sin(theta),
  }
}
