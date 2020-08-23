//Global variables for the simulation
let movers = [];
let statics = [];
let drawbuff = [];
let framerate = 60;
let ticksize = 1 / framerate;
let looping = true;
let gravity = false;
let drawing = false;
let firstClickBuffer = false;
let gConstant = 9.8;
let collisionEfficiency = 1;
let filename = false;
let saveName = "New Save"
let playrate = 1;
let statout = false;
let inFocus = false;
let pauseOnCollision = false;
let varrows = false;
let aarrows = false;

//Set up the canvas object on the page
function setup() {
  let cnv = createCanvas(windowWidth*0.75, windowHeight * 0.75);
  cnv.parent('sim-viewport'); //Put it in the <div> marked out for the canvas
  frameRate(framerate); //set the framerate of the p5 elements
  let e = document.getElementById("defaultCanvas0"); //Get the canvas' details from the html so we can look at it later
  windowProperties = e.getBoundingClientRect(); //The edges of the canvas
  
};

//Called once per 1/framerate of a second, main display code
function draw() { 
  background(220,220,220) //Clear last frame's drawings
  fill(255,255,255,50) //Set to translucent
  for (var i in drawbuff) { //Draw everything in the drawbuffer
    if (drawbuff[i].type == 'dynamic') {
      if (drawbuff[i].shape == "e") {
        ellipse(mouseX,mouseY,drawbuff[i].dim.diam)
      } else if (drawbuff[i].shape == "q") {
        rect(mouseX-drawbuff[i].dim.x/2,mouseY-drawbuff[i].dim.y/2,drawbuff[i].dim.x, drawbuff[i].dim.y)
      }
    } else if (drawbuff[i].type == 'static') {
      rect(mouseX-drawbuff[i].dim.x/2,mouseY-drawbuff[i].dim.y/2,drawbuff[i].dim.x,drawbuff[i].dim.y)
    }
  }
  fill(255,255,255) //set to opaque
  for (let i in movers) { //Loop over the dynamic objects
    //If the simulation is playing, do the simulation stuff to the objects
    if (looping){
      var colliders;
      colliders = movers.concat(statics) //All objects, static or otherwise
      selfIndex = colliders.indexOf(movers[i]) //Find own position in the list
      if (selfIndex > -1) {
        colliders.splice(selfIndex, 1); //Remove self from the list if present
      }
      //Trigger the simulation methods of the object, then draw it
      movers[i].tick(ticksize*playrate)
      movers[i].amIColliding(colliders)
      movers[i].update()
    } else { //Otherwise, just redraw them where they were
      movers[i].update()
    }
    //Draw arrows to represent Velocity and acceleration
    if(varrows){
      drawArrow(movers[i].pos,movers[i].velocity,'blue')
    }
    if(aarrows){
      drawArrow(movers[i].pos,movers[i].accel,'red')
    }
  }
  for (var i in statics){
    //Just draw them, they don't move
    statics[i].update()
  }
  //Update object stats display
  if (statout) {
    objMenu(inFocus)
  }
}

//Toggle the playing state of the sim when called
function playpause() {
  if (looping){
    document.getElementById('playpause').innerText = "Play"
    looping = false
  } else {
    document.getElementById('playpause').innerText = "Pause"
    looping = true
  }
}

//Toggle the new object menu
function newObjectMenu() {
  menu = document.getElementById('newObject')
  if (menu.style.display == "none"){
    menu.style.display = 'block'
  } else {
    menu.style.display = 'none'
  }
}

//Toggle the type menu based on user selection
function typeMenu() {
  selector = document.getElementById('type')
  static = document.getElementById('static')
  dynamic = document.getElementById('dynamic')
  if (selector.value == 0) {
    dynamic.style.display = 'none'
    static.style.display = 'block'
  } else if (selector.value == 1) {
    static.style.display = 'none'
    dynamic.style.display = 'block'
  }
}
//Toggle the inputs in the Dynamic menu depending on shape
function shapeMenu() {
  selector = document.getElementById('shape')
  quad = document.getElementById('quad')
  ell = document.getElementById('ellipse')
  if (selector.value == 0) {
    quad.style.display = 'none'
    ell.style.display = 'block'
  } else if (selector.value == 1) {
    ell.style.display = 'none'
    quad.style.display = 'block'
  }
}

//Add a new object to the sim
function newObject(type, shape){ 
  reset()
  newObjectMenu()
  if (type == 'static'){
    //get details from the menu, clear menu, push to the drawbuffer
    width = float(document.getElementById('statObjWidth').value)
    document.getElementById('statObjWidth').value = ''
    height = float(document.getElementById('statObjHeight').value)
    document.getElementById('statObjHeight').value = ''
    if (!(width<=0 || height <= 0)) {
      drawbuff.push({type:'static',dim:{x:width,y:height}})
    }
  } else if (type == 'dynamic') {
    //get details from the menu, clear menu, push to drawbuffer
    if (shape == "ellipse") {
      width = float(document.getElementById('objWidth').value)
      document.getElementById('objWidth').value = ''
      mass = float(document.getElementById('objMass').value)
      document.getElementById('objMass').value = ''
      velocity = {x:float(document.getElementById('velx').value),y:float(document.getElementById('vely').value)*-1}
      document.getElementById('velx').value = ''
      document.getElementById('vely').value = ''
      acceleration = {x:float(document.getElementById('accelx').value),y:float(document.getElementById('accely').value)*-1}
      document.getElementById('accelx').value = ''
      document.getElementById('accely').value = ''
      if (!(width <= 0 || mass <= 0)) {
        drawbuff.push({type:'dynamic',shape:'e',dim:{diam:width},mass:mass,suvat:{u:velocity,a:acceleration}})
      }
    } else {
      x = float(document.getElementById('objX').value)
      document.getElementById('objX').value = ''
      y = float(document.getElementById('objY').value)
      document.getElementById('objY').value = ''
      mass = float(document.getElementById('qobjMass').value)
      document.getElementById('qobjMass').value = ''
      velocity = {x:float(document.getElementById('qvelx').value),y:float(document.getElementById('qvely').value)*-1}
      document.getElementById('qvelx').value = ''
      document.getElementById('qvely').value = ''
      acceleration = {x:float(document.getElementById('qaccelx').value),y:float(document.getElementById('qaccely').value)*-1}
      document.getElementById('qaccelx').value = ''
      document.getElementById('qaccely').value = ''
      if (!(x <=0 || y <= 0 || mass <= 0)){
        drawbuff.push({type:'dynamic',shape:'q',dim:{x:x,y:y},mass:mass,suvat:{u:velocity,a:acceleration}})
      }
    }
  }
  if (drawbuff.length > 0) {
    drawing = true //Flag that there's something in the draw buffer
  }
}

//make an object at a desired position
function addObject(item,x,y) {
  if (item.type == 'static'){
    statics.push(new staticObj({x:x,y:y},item.dim,{shape:'quadrilateral'}))
  } else if (item.type == 'dynamic') {
    if (item.shape =='e' || item.shape == "ellipse") {
      movers.push(new dynObj(
        {x:x,y:y},
        {diam:item.dim.diam},
        {u:item.suvat.u,a:item.suvat.a},
        {mass:item.mass, efficiency:collisionEfficiency, shape:'ellipse', start:{x:x,y:y}}
        ))
      } else if (item.shape == 'q' || item.shape == "quadrilateral"){
        movers.push(new dynObj(
          {x:x,y:y},
          {x:item.dim.x,y:item.dim.y},
          {u:item.suvat.u,a:item.suvat.a},
          {mass:item.mass, efficiency:collisionEfficiency, shape:'quadrilateral', start:{x:x,y:y}}
          ))
      }
  }
}

//handle clicking
function mouseClicked() {
  if (drawing) {
    //For placing new objects
    if (firstClickBuffer) {
      var item = drawbuff.pop()
      addObject(item,mouseX,mouseY)
      drawing = false
      firstClickBuffer = false
    } else {
      firstClickBuffer = true
    }
  } else {
    //For reading values of existing objects
    var anyClicked = false
    //Iterate over all sim objects
    for (let i of movers){
      if (i.clicked(mouseX,mouseY)){
        anyClicked = true
        inFocus=false;
        objMenu(i)
      }
    }
    for (let i of statics){
      if (i.clicked(mouseX,mouseY)){
        anyClicked = true
        inFocus=false;
        objMenu(i)
      }
    }
    //Close the menu if empty space in the window is clicked
    if (!anyClicked && mouseX <= windowProperties.width && mouseY <= windowProperties.height){
      objMenu(null)
    }
  }
}

function clearSim(mode) {
  if (mode % 2 == 0) {
    statics = []
  } //Modes are 0, 1, and 2. 0 triggers first clause, 1 the second, and 2 both.
  if (mode > 0) {
    movers = []
  }
}

/**
 * 
 * @param {String} dispName Display name of the sim
 * Send a request to the server to save the state of the simulation.
 */
function saveSim(dispName){
  //Assemble arrays of save data
  var savmovers = []
  for (i of movers){
    savmovers.push(i.save())
  }
  var savstatics = []
  for (i of statics) {
    savstatics.push(i.save())
  }
  //Assemble API query
  var saveData = {
    'sav' : {
      movers : savmovers,
      statics : savstatics,
      debug : debug,
      options : {}
    },
    'fname' : filename,
    'dispName' : dispName,
  }
  //Send POST request to /api/save
  $.ajax({
    url: '/api/save',
    method:"POST",
    data: JSON.stringify(saveData),
    success : function(res) {
      if (debug) {console.log(res)};
      if (res[0] === "Access Denied") {
        displayInfo("Access Denied, please sign in")
      } else {
        displayInfo(`File "${res[2]}" Saved`)
      }
      filename=res[1];
      saveName=res[2];
    },
  })
}

/**
 * 
 * @param {String} target The file to load
 */
function retrSim(target){
  //Send the GET request to /api/load
  $.ajax({
    url: 'api/load',
    method: "GET",
    data: {"fname":target},
    success: function(res) {
      if (debug) {console.log(res)};
      saveName=target;
      if (typeof res == "string") {
        res = JSON.parse(res)  
      } 
      if (res.denied) {
        return displayInfo("This file doesn't exist, or you don't have access")
      }
      filename=res.filename
      displayInfo(`File "${saveName}" Loaded`)
      return loadSim(res.file)
    }
  })
}

function loadSim(save) {
  reset()
  var savmovers = save.movers;
  var savstatics = save.statics;
  debug = save.debug;
  movers = [];
  statics = [];
  for (i of savmovers) {
    addObject(i,i.startpos.x,i.startpos.y)
  }
  for (i of savstatics) {
    addObject(i,i.pos.x,i.pos.y)
  }
}

function reset() {
  if (looping) {
    playpause()
  }
  for (let i of movers) {
    i.pos = i.start.copy()
    i.velocity = i.initialv.copy()
    i.updateSuvat(0)
  }
  playrate = 1
  setRateOut(1)
}

function objMenu(obj) {
  var menu = document.getElementById("objDetails")
  var sub = document.getElementById("dynStats")
  if (!obj) {
    menu.style.display = "none"
    sub.style.display = "none"
    statout = false
    inFocus = false
  } else if (obj.type == "dynamic") {
    menu.style.display = "block"
    sub.style.display = "block"
    var xout = document.getElementById("posx")
    var yout = document.getElementById("posy")
    var mout = document.getElementById("mass")
    var vout = document.getElementById("velocity")
    var aout = document.getElementById("acceleration")
    xout.innerHTML = neatRound(obj.pos.x,2)
    yout.innerHTML = neatRound(obj.pos.y,2)
    mout.innerHTML = neatRound(obj.mass,2)
    vout.innerHTML = `X: ${neatRound(obj.velocity.x,2)}, Y: ${neatRound(obj.velocity.y * -1,2)}`
    aout.innerHTML = `X: ${neatRound(obj.accel.x,2)}, Y: ${neatRound(obj.accel.y * -1,2)}`
    statout = true
    if(!inFocus) {
      inFocus = obj
    }
  } else {
    menu.style.display = "block"
    statout = true
    if(!inFocus) {
      inFocus = obj
    }
  }

}
/**
 *  @param {simObj} target Object to be removed
 */
function remObj(target){
  if (target.type =="dynamic"){
    var i = movers.indexOf(target)
    movers.splice(i,1)
  } else {
    var i = statics.indexOf(target)
    statics.splice(i,1)
  }
  return objMenu(false)
}
/**
 * 
 * @param {Number} num The value to round
 * @param {Integer} precision The number of decimal places to use, default 2
 * Decimal rounds to an arbitary number of places. Returns a sting to precision dp, incl. 0s.
 */
function neatRound(num,precision) {
  if (!precision){
    precision = 2
  } 
  //Round and account for known floating point error. Scale by precision.
  let val = Math.round((num + Number.EPSILON) * (10**precision))
  //Find out how many significant figures are 0
  for (let i = precision; i>=0;i--) {
    if(val % (10 ** i) == 0){
      val = `${val/(10**precision)}`
      var dpleft = i
      break
    }
  }
  //If the number's whole, add a decimal point
  if (dpleft == precision) {
    val = val + '.'
  }
  //Fill remaining 0s
  for (i = 0; i < dpleft; i++){
    val = val + '0'
  }
  return val
}
/**
 * 
 * @param {p5.Vector} start 
 * @param {p5.Vector} vector 
 * @param {String} colour 
 * Draw an arrow representing vector starting from start (from origin). 
 */
function drawArrow(start, vector, colour) {
  push();
  stroke(colour);
  strokeWeight(3);
  fill(colour);
  translate(start.x, start.y);
  line(0, 0, vector.x, vector.y);
  rotate(vector.heading());
  let arrowSize = 7;
  translate(vector.mag() - arrowSize, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}