let mousePosition;
let halfSize = {x:25,y:25};

let parent = document.getElementById("galaxy_parent_div");

var div = document.getElementById('move');
div.style.position = "fixed";
div.style.background = "red";
div.style.width = halfSize.x*2+"px";
div.style.height = halfSize.y*2+"px";


let orbitDiv = document.getElementById("galaxy_outer_rim");
let rect = orbitDiv.getBoundingClientRect();
let parentRect = parent.getBoundingClientRect();

let elipse={
  cx: ((rect.left+rect.right)/2),
  cy: ((rect.top+rect.bottom)/2),
  rx: 1.82*(parentRect.right - parentRect.left)/2,
  ry: 0.79*(parentRect.bottom - parentRect.top)/2,
  rotation: -7/180*Math.PI,
}

document.addEventListener('mousemove', function(event) {
    event.preventDefault();
    let angle = GetAngle(event);
    let radius = GetRadiusOfElipse(angle);
    let pointOnElipse = PolarToCartesian(radius,angle);
    div.style.left = (pointOnElipse.x+elipse.cx-halfSize.x) + 'px';
    div.style.top  = (pointOnElipse.y+elipse.cy-halfSize.y) + 'px';
}, true);

function GetAngle({clientX, clientY}){
  let dx = clientX - elipse.cx;
  let dy = clientY - elipse.cy;
  return Math.atan2(dy, dx);
}

function GetRadiusOfElipse(angle){
    angle-=elipse.rotation;
  return (elipse.rx*elipse.ry)/Math.sqrt(Math.pow((elipse.rx*Math.sin(angle)),2)+Math.pow((elipse.ry*Math.cos(angle)),2));
}

function PolarToCartesian(r,theta){
    return{
      x:r*Math.cos(theta),
    y:r*Math.sin(theta),
  }
}

function _getCenterOf(div) {
  return{
    x: div.offsetLeft + div.offsetWidth * 0.5, 
    y: div.offsetTop + div.offsetHeight * 0.5
  }
}


let center = document.createElement("center");
center.style.position = "absolute";
center.style.left = elipse.cx+"px";
center.style.top = elipse.cy+"px";
center.style.width = "10px";
center.style.height = "10px";
center.style.background = "red";
center.style.color = "red";
document.body.appendChild(center);