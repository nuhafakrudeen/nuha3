// Vertex shader
var VSHADER_SOURCE =
  'precision mediump float;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_UV;\n' +
  'varying vec2 v_UV;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjectionMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;\n' +
  '  v_UV = a_UV;\n' +
  '}\n';

// Fragment shader
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec2 v_UV;\n' +
  'uniform vec4 u_FragColor;\n' +
  'uniform sampler2D u_Sampler0;\n' +
  'uniform sampler2D u_Sampler1;\n' +
  'uniform sampler2D u_Sampler2;\n' +
  'uniform sampler2D u_Sampler3;\n' +
  'uniform sampler2D u_Sampler4;\n' +  // sun
  'uniform sampler2D u_Sampler5;\n' +  // ocean
  'uniform sampler2D u_Sampler6;\n' +  // sky
  'uniform int u_whichTexture;\n' +
  'void main() {\n' +
  '   if(u_whichTexture == -2){ gl_FragColor = u_FragColor; }\n' +
  '   else if(u_whichTexture == -1){ gl_FragColor = vec4(v_UV, 1.0, 1.0); }\n' +
  '   else if(u_whichTexture == 0){ gl_FragColor = texture2D(u_Sampler0, v_UV); }\n' +
  '   else if(u_whichTexture == 1){ gl_FragColor = texture2D(u_Sampler1, v_UV); }\n' +
  '   else if(u_whichTexture == 2){ gl_FragColor = texture2D(u_Sampler2, v_UV); }\n' +
  '   else if(u_whichTexture == 3){ gl_FragColor = texture2D(u_Sampler3, v_UV); }\n' +
  '   else if(u_whichTexture == 4){ gl_FragColor = texture2D(u_Sampler4, v_UV); }\n' +
  '   else if(u_whichTexture == 5){ gl_FragColor = texture2D(u_Sampler5, v_UV); }\n' +
  '   else if(u_whichTexture == 6){ gl_FragColor = texture2D(u_Sampler6, v_UV); }\n' +
  '   else { gl_FragColor = vec4(1, .2, .2, 1); }\n' +
  '}\n';

//global vars
let canvas, gl;
let a_Position, a_UV;
let u_FragColor, u_ModelMatrix, u_ProjectionMatrix, u_ViewMatrix, u_GlobalRotateMatrix;
let u_whichTexture, u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3, u_Sampler4, u_Sampler5, u_Sampler6;

let g_charON            = false;
let g_CharAnimation     = true;
let g_CharHoverLocation = -0.3;
let g_tailAngle         = 0;
let g_fireSize          = 1;
let g_blink             = 1;
let g_wingAngle         = 40;
let g_limbAngle         = 0;
let g_armsAngle         = 0;
let g_forearmsAngle     = 0;

let g_globalAngle = 0;
var g_startTime = performance.now() / 1000.0;
var g_seconds   = performance.now() / 1000.0 - g_startTime;
let g_camera = new Camera();

//grid map (32x32)
let g_map = [
    // 2, 3, 4, 5, 6, 7, 8, 9, 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Top border
    [1, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //2
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //3
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], //4
    [1, 0, 0, 0, 0, 6, 0, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1], //5
    [1, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 4, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1], //6
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //7
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //8
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 1], //9
    [1, 0, 0, 4, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 6, 1], //10
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //11
    [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //12
    [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //13
    [1, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //14
    [1, 2, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 1], //15
    [1, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 6, 8, 7, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1], //16
    [1, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 6, 5, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //17
    [1, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //18
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //19
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1], //20
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //21
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //22
    [1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //23
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //24
    [1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 5, 0, 0, 0, 0, 0, 0, 1], //25
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 1], //26
    [1, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], //27
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1], //28
    [1, 0, 4, 5, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1], //29
    [1, 0, 6, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 1], //30
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],//31
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]//32
];

//world elements
let g_mob = { x: 0, y: -0.75, z: 10 };
g_mob.speed = 0.02;
let g_gameOver = false;
function updateMobPosition() {
  if (g_gameOver) return;
  let dx = g_camera.eye.elements[0] - g_mob.x;
  let dz = g_camera.eye.elements[2] - g_mob.z;
  let dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 0.5) {
      g_gameOver = true;
      alert("Game Over: The Valentines Bear has caught you! <3");
      return;
  }
  let step = g_mob.speed;
  dx /= dist;
  dz /= dist;
  g_mob.x += dx * step;
  g_mob.z += dz * step;
}

//bear globals/animations
let g_bearOn = true;
let g_bearBodyScaleFactor = 1.0;
const g_bearBodyAmplitude = 0.2;
let g_bearRightLegAngle = 0;
let g_bearLeftLegAngle = 0;
let g_bearArmAngle = 0;
function updateBearAnimation() {
  g_bearBodyScaleFactor = 1.0 + g_bearBodyAmplitude * Math.abs(Math.sin(g_seconds));
  g_bearRightLegAngle = 30 * Math.sin(g_seconds);
  g_bearLeftLegAngle  = 30 * Math.sin(g_seconds);
  g_bearArmAngle      = 45 * Math.cos(g_seconds);
}

//setup/initialize
function setupCanvas(){
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function connectVariablesToGLSL(){
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) { console.log('Failed to get a_Position'); return; }
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) { console.log('Failed to get a_UV'); return; }
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) { console.log('Failed to get u_FragColor'); return; }
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) { console.log('Failed to get u_GlobalRotateMatrix'); return; }
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) { console.log('Failed to get u_ViewMatrix'); return; }
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) { console.log('Failed to get u_ProjectionMatrix'); return; }
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { console.log('Failed to get u_ModelMatrix'); return; }
  
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if(!u_Sampler0){ console.log('Failed to get u_Sampler0'); return; }
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if(!u_Sampler1){ console.log('Failed to get u_Sampler1'); return; }
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if(!u_Sampler2){ console.log('Failed to get u_Sampler2'); return; }
  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if(!u_Sampler3){ console.log('Failed to get u_Sampler3'); return; }
  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
  if(!u_Sampler4){ console.log('Failed to get u_Sampler4'); return; }
  u_Sampler5 = gl.getUniformLocation(gl.program, 'u_Sampler5');
  if(!u_Sampler5){ console.log('Failed to get u_Sampler5'); return; }
  u_Sampler6 = gl.getUniformLocation(gl.program, 'u_Sampler6');
  if(!u_Sampler6){ console.log('Failed to get u_Sampler6'); return; }
  
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if(!u_whichTexture){ console.log('Failed to get u_whichTexture'); return; }
  
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function initTextures(){
  // texture 0: ground.jpg
  var image0 = new Image();
  image0.crossOrigin = "anonymous";
  image0.onload = function(){ sendTextureToTEXTURE0(image0); };
  image0.src = 'ground.jpg';
  
  // texture 0: ground.jpg
  var image1 = new Image();
  image1.crossOrigin = "anonymous";
  image1.onload = function(){ sendTextureToTEXTURE1(image1); };
  image1.src = 'ground.jpg';
  
  // texture 2: tree_top.webp
  var image2 = new Image();
  image2.crossOrigin = "anonymous";
  image2.onload = function(){ sendTextureToTEXTURE2(image2); };
  image2.src = 'tree_top.webp';
  
  // texture 3: tree.png
  var image3 = new Image();
  image3.crossOrigin = "anonymous";
  image3.onload = function(){ sendTextureToTEXTURE3(image3); };
  image3.src = 'tree.png';
  
  // texture 4: sun.png
  var image4 = new Image();
  image4.crossOrigin = "anonymous";
  image4.onload = function(){ sendTextureToTEXTURE4(image4); };
  image4.src = 'sun.png';
  
  // texture 5: ocean.jpeg
  var image5 = new Image();
  image5.crossOrigin = "anonymous";
  image5.onload = function(){ sendTextureToTEXTURE5(image5); };
  image5.src = 'ocean.jpeg';
  
  // texture 6: sunset.jpg
  var image6 = new Image();
  image6.crossOrigin = "anonymous";
  image6.onload = function(){ sendTextureToTEXTURE6(image6); };
  image6.src = 'sunset.jpg';
  
  return true;
}

function sendTextureToTEXTURE0(image){
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler0, 0);
}
function sendTextureToTEXTURE1(image){
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler1, 1);
}
function sendTextureToTEXTURE2(image){
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler2, 2);
}
function sendTextureToTEXTURE3(image){
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler3, 3);
}
function sendTextureToTEXTURE4(image){
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler4, 4);
}
function sendTextureToTEXTURE5(image){
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler5, 5);
}
function sendTextureToTEXTURE6(image){
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler6, 6);
}

//mouse/keyboard controls
function initMouseEvents() {
  var isMouseDown = false;
  var lastMouseX = 0;
  var lastMouseY = 0;
  if (g_camera.yaw === undefined) {
    var dx = g_camera.at.elements[0] - g_camera.eye.elements[0];
    var dz = g_camera.at.elements[2] - g_camera.eye.elements[2];
    g_camera.yaw = Math.atan2(dx, -dz) * 180 / Math.PI;
  }
  canvas.addEventListener('mousedown', function(e) {
    isMouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  canvas.addEventListener('mouseup', function(e) {
    isMouseDown = false;
  });
  canvas.addEventListener('mousemove', function(e) {
    if (!isMouseDown) return;
    var deltaX = e.clientX - lastMouseX;
    var rotationFactor = 0.5;
    g_camera.yaw += deltaX * rotationFactor;
    var dx = g_camera.at.elements[0] - g_camera.eye.elements[0];
    var dz = g_camera.at.elements[2] - g_camera.eye.elements[2];
    var distance = Math.sqrt(dx * dx + dz * dz);
    var rad = g_camera.yaw * Math.PI / 180;
    g_camera.at.elements[0] = g_camera.eye.elements[0] + Math.sin(rad) * distance;
    g_camera.at.elements[2] = g_camera.eye.elements[2] - Math.cos(rad) * distance;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    renderAllShapes();
  });
}

function keydown(ev){
  if(ev.keyCode == 68){      // d: move right
    g_camera.right();
  }
  else if(ev.keyCode == 65){ // a: move left  
    g_camera.left();  
  }
  else if(ev.keyCode == 87){ // w: move forward
    g_camera.forward();
  }
  else if(ev.keyCode == 83){ // s: move backward
    g_camera.backward();
  }
  else if(ev.keyCode == 69){ // e: rotate camera right
    g_camera.rotRight();
  }
  else if(ev.keyCode == 81){ // q: rotate camera left
    g_camera.rotLeft();
  }
  else if(ev.keyCode == 90){ // z: move up
    g_camera.upward();
  }
  else if(ev.keyCode == 88){ // x: move down
    g_camera.downward();
  }
  else if(ev.keyCode == 67){ // c: add block
    addBlock();
  }
  else if(ev.keyCode == 86){ // v: remove block
    removeBlock();
  }
  renderAllShapes();
}

function addBlock() {
    var dx = g_camera.at.elements[0] - g_camera.eye.elements[0];
    var dz = g_camera.at.elements[2] - g_camera.eye.elements[2];
    var mag = Math.sqrt(dx * dx + dz * dz);
    if(mag === 0) return;
    dx /= mag;
    dz /= mag;
    var d = 1;
    var targetX = g_camera.eye.elements[0] + dx * d;
    var targetZ = g_camera.eye.elements[2] + dz * d;
    var gridCol = Math.round(targetX + 4);
    var gridRow = Math.round(targetZ + 4);
    if(gridRow >= 0 && gridRow < 32 && gridCol >= 0 && gridCol < 32) {
         g_map[gridRow][gridCol] = (g_map[gridRow][gridCol] || 0) + 1;
         console.log("Added block at (" + gridRow + ", " + gridCol + "). New height: " + g_map[gridRow][gridCol]);
    } else {
         console.log("Target position out of bounds: (" + gridRow + ", " + gridCol + ")");
    }
    renderAllShapes();
}

function removeBlock() {
    var dx = g_camera.at.elements[0] - g_camera.eye.elements[0];
    var dz = g_camera.at.elements[2] - g_camera.eye.elements[2];
    var mag = Math.sqrt(dx * dx + dz * dz);
    if(mag === 0) return;
    dx /= mag;
    dz /= mag;
    var d = 1;
    var targetX = g_camera.eye.elements[0] + dx * d;
    var targetZ = g_camera.eye.elements[2] + dz * d;
    var gridCol = Math.round(targetX + 4);
    var gridRow = Math.round(targetZ + 4);
    if(gridRow >= 0 && gridRow < 32 && gridCol >= 0 && gridCol < 32) {
         if(g_map[gridRow][gridCol] > 0) {
             g_map[gridRow][gridCol]--;
             console.log("Removed block at (" + gridRow + ", " + gridCol + "). New height: " + g_map[gridRow][gridCol]);
         } else {
             console.log("No block to remove at (" + gridRow + ", " + gridCol + ")");
         }
    } else {
         console.log("Target position out of bounds: (" + gridRow + ", " + gridCol + ")");
    }
    renderAllShapes();
}

function main(){
  setupCanvas();
  connectVariablesToGLSL();
  initTextures();
  initMouseEvents();
  document.onkeydown = keydown;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  requestAnimationFrame(tick);
}

function tick(){
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateAnimationTransformations();
  updateMobPosition();
  updateBearAnimation();
  renderAllShapes();
  requestAnimationFrame(tick);
}

function updateAnimationTransformations(){
  if(g_CharAnimation){ 
    g_CharHoverLocation = (Math.sin(g_seconds * 3) / 30) - 0.3;
    g_tailAngle = 5 * Math.sin(g_seconds * 3);
    g_fireSize = Math.abs(Math.sin(g_seconds * 4));
    g_blink = Math.abs(Math.sin(g_seconds * 3));
    g_wingAngle = 20 * Math.sin(g_seconds * 3) + 40;
    g_limbAngle = 5 * Math.sin(g_seconds * 3);
    g_armsAngle = 10 * Math.sin(g_seconds * 3);
    g_forearmsAngle = 20 * Math.sin(g_seconds * 3);
  }
}

//rendering
function renderAllShapes(){
  var projMat = new Matrix4();
  projMat.setPerspective(60, canvas.width / canvas.height, 0.1, 100); 
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  
  var viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],  
    g_camera.at.elements[0],  g_camera.at.elements[1],  g_camera.at.elements[2],
    g_camera.up.elements[0],  g_camera.up.elements[1],  g_camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
  
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  drawSetting();
  drawMap();
  
  if(g_charON){ 
    renderCharShapes(); 
  }
  if(g_bearOn){
    renderBear();
  }
}

function drawSetting(){
  var ocean = new Cube();
  ocean.textureNum = 5;
  ocean.matrix.translate(0, -0.9, 0);
  ocean.matrix.scale(63, 0.1, 63);
  ocean.matrix.translate(-0.35, 0, -0.35);
  ocean.render();

  var floor = new Cube();
  floor.textureNum = 1;
  floor.matrix.translate(0, -0.75, 0);
  floor.matrix.scale(35, 0.01, 35);
  floor.matrix.translate(-0.15, 0, -0.15);
  floor.render();

  var sky = new Cube();
  sky.textureNum = 6;
  sky.matrix.translate(-1, 0, -1);
  sky.matrix.scale(60, 60, 60);
  sky.matrix.translate(-0.3, -0.5, -0.3);
  sky.render();

  var sun = new Cube();
  sun.textureNum = 4;
  sun.matrix.translate(-17.5, 0, 0);
  sun.matrix.scale(1, 10, 10);
  sun.matrix.translate(-2, -0.5, 0.5);
  sun.render();
}

//drawMap uses block height for texture placement on blocks
let treeCanopies = {};
function drawMap(){
  for (let row = 0; row < g_map.length; row++){
    for (let col = 0; col < g_map[row].length; col++){
      let cellHeight = g_map[row][col];
      let x = col - 4;
      let z = row - 4;
      
      if(cellHeight === 1){
        let cube = new Cube();
        cube.textureNum = 0; // ground
        cube.matrix.translate(x, -0.75, z);
        cube.renderfaster();
        
      } else if(cellHeight === 2){
        let cube = new Cube();
        cube.textureNum = 2; // tree_top
        cube.matrix.translate(x, -0.75, z);
        cube.renderfaster();
        
      } else if(cellHeight >= 3){
        for(let h = 0; h < cellHeight; h++){
          let trunk = new Cube();
          trunk.textureNum = 3; // tree trunk
          trunk.matrix.translate(x, h - 0.75, z);
          trunk.renderfaster();
        }
        
        // leaves on tree placement
        let key = row + "-" + col;
        if(!treeCanopies[key]){
        // generate rand num for variety
        let leafCount = 6 + Math.floor(Math.random() * 3);
        let offsets = [];
        for(let i = 0; i < leafCount; i++){
            let xOffset = -1.45 + Math.random() * 2;
            let zOffset = -1.45 + Math.random() * 2;
            offsets.push({ox: xOffset, oz: zOffset});
        }
        treeCanopies[key] = offsets;
        }
        let canopyOffsets = treeCanopies[key];
        let canopyY = cellHeight - 0.75; //place on top of tree block
        for(let i = 0; i < canopyOffsets.length; i++){
        let pos = canopyOffsets[i];
        let leaf = new Cube();
        leaf.textureNum = 2; // tree_top 
        leaf.matrix.translate(x + pos.ox, canopyY, z + pos.oz);
        leaf.renderfaster();
        }
      }
    }
  }
}

//code for bear (from asg2)
function Heart() {
  this.color = [1.0, 0.0, 0.0, 1.0];
  this.matrix = new Matrix4();
  if (!Heart.vertexBuffer) {
    var vertices = new Float32Array([
      0.0,   0.2,  0.1,    
      0.0,  -1.0,  0.1,    
      -1.0, -0.2,  0.1,    
      -1.4,  0.2,  0.1,    
      -1.6,  0.6,  0.1,    
      -1.4,  1.0,  0.1,    
      -0.8,  1.3,  0.1,    
      0.0,  0.9,  0.1,    
      0.8,  1.3,  0.1,    
      1.4,  1.0,  0.1,    
      1.6,  0.6,  0.1,    
      1.4,  0.2,  0.1,    
      1.0, -0.2,  0.1,    
      0.0,   0.2, -0.1,    
      0.0,  -1.0, -0.1,    
      -1.0, -0.2, -0.1,    
      -1.4,  0.2, -0.1,    
      -1.6,  0.6, -0.1,    
      -1.4,  1.0, -0.1,    
      -0.8,  1.3, -0.1,    
      0.0,  0.9, -0.1,    
      0.8,  1.3, -0.1,    
      1.4,  1.0, -0.1,    
      1.6,  0.6, -0.1,    
      1.4,  0.2, -0.1,    
      1.0, -0.2, -0.1     
    ]);
    var indices = new Uint16Array([
      0, 1, 2,
      0, 2, 3,
      0, 3, 4,
      0, 4, 5,
      0, 5, 6,
      0, 6, 7,
      0, 7, 8,
      0, 8, 9,
      0, 9, 10,
      0, 10, 11,
      0, 11, 12,
      0, 12, 1,
      13, 25, 24,
      13, 24, 23,
      13, 23, 22,
      13, 22, 21,
      13, 21, 20,
      13, 20, 19,
      13, 19, 18,
      13, 18, 17,
      13, 17, 16,
      13, 16, 15,
      13, 15, 14,
      13, 14, 25,
       1,  2, 15,   1, 15, 14,
       2,  3, 16,   2, 16, 15,
       3,  4, 17,   3, 17, 16,
       4,  5, 18,   4, 18, 17,
       5,  6, 19,   5, 19, 18,
       6,  7, 20,   6, 20, 19,
       7,  8, 21,   7, 21, 20,
       8,  9, 22,   8, 22, 21,
       9, 10, 23,   9, 23, 22,
      10, 11, 24,  10, 24, 23,
      11, 12, 25,  11, 25, 24,
      12,  1, 14,  12, 14, 25
    ]);
    Heart.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Heart.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    Heart.vertexBuffer.itemSize = 3;
    Heart.vertexBuffer.numItems = vertices.length / 3;
    Heart.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Heart.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    Heart.indexBuffer.numItems = indices.length;
  }
}
Heart.prototype.render = function() {
  gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  gl.uniform4fv(u_FragColor, this.color);
  gl.bindBuffer(gl.ARRAY_BUFFER, Heart.vertexBuffer);
  gl.vertexAttribPointer(a_Position, Heart.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Heart.indexBuffer);
  gl.drawElements(gl.TRIANGLES, Heart.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
};

function renderBear() {
  var bearOrigin = new Matrix4();
  bearOrigin.setTranslate(g_mob.x, 0.75, g_mob.z);

  // Body
  var body = new Cube();
  body.color = [0.5, 0.25, 0.1, 1];
  body.matrix = new Matrix4(bearOrigin);
  body.matrix.translate(-0.5, -0.35, 0.0);
  body.matrix.scale(0.6, 0.7, 0.6);
  body.render();

  // Right Leg & Paw
  var rightLeg = new Cube();
  rightLeg.color = [0.5, 0.25, 0.1, 1];
  var rightLegMat = new Matrix4(bearOrigin);
  rightLegMat.translate(-0.25 - 0.12, -0.3, 0.3);
  rightLegMat.rotate(-5, 1, 0, 0);
  rightLegMat.rotate(-g_bearRightLegAngle, 0, 0, 1);
  rightLegMat.scale(0.5, -0.5, 0.5);
  var rightLegCoordMat = new Matrix4(rightLegMat);
  rightLegMat.scale(0.55, 0.85, 0.55);
  rightLegMat.translate(-0.5, 0, 0);
  rightLeg.matrix = rightLegMat;
  rightLeg.render();

  var rightPaw = new Cube();
  rightPaw.color = [0.5, 0.25, 0.1, 1];
  rightPaw.matrix = new Matrix4(rightLegCoordMat);
  rightPaw.matrix.translate(0, 0.65, 0);
  rightPaw.matrix.rotate(-g_bearRightLegAngle, 0, 0, 1);
  rightPaw.matrix.scale(0.50, 0.55, 0.50);
  rightPaw.matrix.translate(-0.5, 0.45, -0.001);
  rightPaw.render();

  // Left Leg & Paw
  var leftLeg = new Cube();
  leftLeg.color = [0.5, 0.25, 0.1, 1];
  var leftLegMat = new Matrix4(bearOrigin);
  leftLegMat.translate(-0.25 + 0.25, -0.3, 0.3);
  leftLegMat.rotate(-5, 1, 0, 0);
  leftLegMat.rotate(-g_bearLeftLegAngle, 0, 0, 1);
  leftLegMat.scale(0.5, -0.5, 0.5);
  var leftLegCoordMat = new Matrix4(leftLegMat);
  leftLegMat.scale(0.55, 0.85, 0.55);
  leftLegMat.translate(-0.5, 0, 0);
  leftLeg.matrix = leftLegMat;
  leftLeg.render();

  var leftPaw = new Cube();
  leftPaw.color = [0.5, 0.25, 0.1, 1];
  leftPaw.matrix = new Matrix4(leftLegCoordMat);
  leftPaw.matrix.translate(0, 0.65, 0);
  leftPaw.matrix.rotate(-g_bearLeftLegAngle, 0, 0, 1);
  leftPaw.matrix.scale(0.50, 0.55, 0.50);
  leftPaw.matrix.translate(-0.5, 0.45, -0.001);
  leftPaw.render();

  // Head
  var head = new Cube();
  head.color = [0.5, 0.25, 0.1, 1];
  var headMat = new Matrix4(bearOrigin);
  headMat.translate(-0.4, 0.35, 0.15);
  headMat.scale(0.40, 0.30, 0.40);
  head.matrix = headMat;
  head.render();

  // Arms
  var leftArm = new Cube();
  leftArm.color = [0.5, 0.25, 0.1, 1];
  var leftArmMat = new Matrix4(bearOrigin);
  leftArmMat.translate(-0.25 - 0.45, -0.15, 0.35);
  leftArmMat.rotate(-0.75, 1, 1, 0);
  leftArmMat.scale(0.2, 0.5, 0.2);
  leftArm.matrix = leftArmMat;
  leftArm.render();

  var rightArm = new Cube();
  rightArm.color = [0.5, 0.25, 0.1, 1];
  var rightArmMat = new Matrix4(bearOrigin);
  rightArmMat.translate(-0.25 + 0.45, -0.3 + 0.5, 0.35);
  rightArmMat.rotate(-0.75, 1, -1, 0);
  rightArmMat.rotate(-g_bearArmAngle, 0, 0, 1);
  rightArmMat.scale(0.2, 0.5, 0.2);
  rightArm.matrix = rightArmMat;
  rightArm.render();

  // Ears
  var rightEar = new Cube();
  rightEar.color = [0.5, 0.25, 0.1, 1];
  var rightEarMat = new Matrix4(bearOrigin);
  rightEarMat.translate(-0.25 - 0.25, -0.3 + 0.85, 0.35);
  rightEarMat.rotate(-0.75, 1, 1, 0);
  rightEarMat.scale(0.2, 0.2, 0.2);
  rightEar.matrix = rightEarMat;
  rightEar.render();

  var leftEar = new Cube();
  leftEar.color = [0.5, 0.25, 0.1, 1];
  var leftEarMat = new Matrix4(bearOrigin);
  leftEarMat.translate(-0.25 + 0.15, -0.3 + 0.85, 0.35);
  leftEarMat.rotate(-0.75, 1, 1, 0);
  leftEarMat.scale(0.2, 0.2, 0.2);
  leftEar.matrix = leftEarMat;
  leftEar.render();

  // Nose
  var nose = new Cube();
  nose.color = [0.5, 0.4, 0.1, 1];
  var noseMat = new Matrix4(bearOrigin);
  noseMat.translate(-0.25 - 0.15, -0.3 + 0.60, 0);
  noseMat.rotate(-0.75, 1, 1, 0);
  noseMat.scale(0.4, 0.2, 0.2);
  nose.matrix = noseMat;
  nose.render();

  // Eyes
  var rightEye = new Cube();
  rightEye.color = [0, 0, 0, 1];
  var rightEyeMat = new Matrix4(bearOrigin);
  rightEyeMat.translate(-0.25 + 0.1, -0.3 + 0.80, 0.1);
  rightEyeMat.rotate(-0.75, 1, 1, 0);
  rightEyeMat.scale(0.1, 0.1, 0.1);
  rightEye.matrix = rightEyeMat;
  rightEye.render();

  var leftEye = new Cube();
  leftEye.color = [0, 0, 0, 1];
  var leftEyeMat = new Matrix4(bearOrigin);
  leftEyeMat.translate(-0.25 - 0.1, -0.3 + 0.80, 0.1);
  leftEyeMat.rotate(-0.75, 1, 1, 0);
  leftEyeMat.scale(0.1, 0.1, 0.1);
  leftEye.matrix = leftEyeMat;
  leftEye.render();
}

//start program
main();
