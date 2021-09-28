import {face} from './classes.js';
import {camera2to3, camera2ToPerpendicular, vertexToPixel} from './raster.js';
import * as objParse from './obj-file-parser/dist/OBJFile.js';
import {vectorAdd, vectorScalar, crossProduct, vectorsToAngle, sort2d, vectorDistance} from './math.js';
import {generateZMap} from './shading.js';

var debugMode = false;
var frameTime = false;

//create canvas variables
var ctx = document.querySelector('canvas'), c = ctx.getContext("2d"), width = ctx.width, height = ctx.height;

//debug variables
var frameCounter = 0, frameSinceLastTime = 0, vertexCount = 0;

//scene data variables
var sceneData = [], objectVerticies = [], sortedIndexes = [], starField = [];

//camera variables 
var cameraVector = [0,0,0], cameraPerpendicular = [], cameraVector3 = [], cameraVertical = [], cameraLocation = [0, -1, 0], cameraLocationPrevious = [], fov = 70;

//Mouse Movement Setup
ctx.requestPointerLock = ctx.requestPointerLock || ctx.mozRequestPointerLock;
ctx.requestPointerLock();
document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
ctx.onclick = function() {
	ctx.requestPointerLock();
};

//Hook pointer lock state change events for different browsers
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
function lockChangeAlert() {
	if (document.pointerLockElement === ctx ||
		document.mozPointerLockElement === ctx) {
		var music = document.getElementById('music');
		music.play();	
		document.addEventListener("mousemove", updatePosition, false);
	} else { 
		document.removeEventListener("mousemove", updatePosition, false);
	}
}
function updatePosition(e) {
	cameraVector[0] += e.movementX;
	cameraVector[1] -= e.movementY;
}

//Key press detection
var moveForward, moveBackward, moveLeft, moveRight, moveUp, moveDown, tiltLeft, tiltRight, increaseSpeed, decreaseSpeed;
var movementSpeed = 1;
document.addEventListener('keydown', logKey);
document.addEventListener('keyup', logKey2);
function logKey(e) {
	if(e.code == 'KeyW'){
		moveForward = true;
	}
	if(e.code == 'KeyS'){
		moveBackward = true;
	}
	if(e.code == 'KeyA'){
		moveLeft = true;
	}
	if(e.code == 'KeyD'){
		moveRight = true;
	}
	if(e.code == 'KeyQ'){
		tiltLeft = true;
	}
	if(e.code == 'KeyE'){
		tiltRight = true;
	}
	if(e.code == 'Space'){
		moveUp = true;
	}
	if(e.code == 'ShiftLeft'){
		moveDown = true;
	}
	if(e.code == 'KeyZ'){
		increaseSpeed = true;
	}
	if(e.code == 'KeyX'){
		decreaseSpeed = true;
	}
}
function logKey2(e) {
	if(e.code == 'KeyW'){
		moveForward = false;
	}
	if(e.code == 'KeyS'){
		moveBackward = false;
	}
	if(e.code == 'KeyA'){
		moveLeft = false;
	}
	if(e.code == 'KeyD'){
		moveRight = false;
	}
	if(e.code == 'KeyQ'){
		tiltLeft = false;
	}
	if(e.code == 'KeyE'){
		tiltRight = false;
	}
	if(e.code == 'Space'){
		moveUp = false;
	}
	if(e.code == 'ShiftLeft'){
		moveDown = false;
	}
	if(e.code == 'KeyZ'){
		increaseSpeed = false;
	}
	if(e.code == 'KeyX'){
		decreaseSpeed = false;
	}
}

//moves camera
function cameraMove(){
	increaseSpeed? movementSpeed*=1.1: nothing();
	decreaseSpeed? movementSpeed=movementSpeed/1.1: nothing();
	moveForward? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVector3, 0.1*movementSpeed)): nothing();
	moveBackward? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVector3, -0.1*movementSpeed)): nothing();
	moveLeft? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraPerpendicular, -0.1*movementSpeed)): nothing();
	moveRight? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraPerpendicular, 0.1*movementSpeed)): nothing();
	moveUp? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVertical, -0.1*movementSpeed)): nothing();
	moveDown? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVertical, 0.1*movementSpeed)): nothing();
}

//draw image on screen function 
function display(image){
	var canvasImage = c.createImageData(width, height);
	canvasImage.data.set(image);
	c.putImageData(canvasImage, 0, 0);
}

//display camera angle and position
function displayCameraInfo(arg1, arg2){
	document.getElementById('cameraX').value = arg1[0];
	document.getElementById('cameraY').value = arg1[1];
	document.getElementById('cameraW').value = arg1[2];

	document.getElementById('positionX').value = arg2[0];
	document.getElementById('positionY').value = arg2[1];
	document.getElementById('positionZ').value = arg2[2];
}

//Raster
function raster(){
	var TwoDemCoords = [];
	var result = [];
	var ZMap = [];
	var ZMapIndexes = [];
	for(var i=0; i<objectVerticies.length; i++){
		TwoDemCoords[i] = [];
		for(var x=0; x<objectVerticies[i].length; x++){
			TwoDemCoords[i][x] = false;
		}
	}
	for(var i=0; i<width*height;i++){
		var displayPosition = i*4
		result[displayPosition] = 0;
		result[displayPosition + 1] = 0;
		result[displayPosition + 2] = 0;
		result[displayPosition + 3] = 255;
	
		ZMap[i] = [];
	}

	//Camera angle
	tiltLeft? cameraVector[2]+=10: nothing();
	tiltRight? cameraVector[2]-=10: nothing();
	var dillutedCamera = vectorScalar(cameraVector, 0.1*document.getElementById('sens').value);
	cameraVector3 = camera2to3(dillutedCamera);
	cameraPerpendicular = camera2ToPerpendicular(dillutedCamera);
	cameraVertical = crossProduct(cameraVector3, cameraPerpendicular);

	//Camera movement
	cameraMove();

	//Display camera info
	displayCameraInfo(dillutedCamera, cameraLocation);
	
	frameTime? console.time('Frame Time'): nothing();
	//sort triangles by distance
	if(cameraLocation != cameraLocationPrevious){
		cameraLocationPrevious = cameraLocation;
		sortedIndexes = [];
		sceneData.forEach((objectData, index)=>{
			objectData.forEach((value, index2)=>{
				sortedIndexes.push([vectorDistance(cameraLocation, value.center), index, index2]);
			})
		})
	}
	sortedIndexes.sort(sort2d);
	//generate ZMap
	sortedIndexes.forEach((triangle, index)=>{
		var value = sceneData[triangle[1]][triangle[2]];
		//Backface cull
		if(vectorsToAngle(cameraVector3, value.normal)/Math.PI < (0.5+(fov/360))){

			//Checks if model is in skybox
			var cameraLocation2;
			value.isBackground? cameraLocation2=[0,0,0]: cameraLocation2=cameraLocation;

			//Get 2d coords
			//Checks if 2d coord has already been calculated
			var vertexes = [objectVerticies[triangle[1]][value.v1], objectVerticies[triangle[1]][value.v2], objectVerticies[triangle[1]][value.v3]];
			var coords = [];
			var thisObject = TwoDemCoords[triangle[1]];
			[value.v1, value.v2, value.v3].forEach((e, i)=>{
				thisObject[e] != false? coords[i] = thisObject[e]:
					coords[i] = vertexToPixel(vertexes[i], cameraLocation2, cameraVector3, cameraPerpendicular, fov, width, cameraVertical, cameraVector[2]);
					TwoDemCoords[triangle[1]][e] = coords[i];
			})

			//Checks if shading is off
			var shade = (vectorsToAngle(value.normal, [-0.5,1,0.3])/Math.PI-0.1)*2
			value.isEmmision? shade = 1: nothing();

			var triangleDepth = generateZMap(coords, shade, value.color, width/2, height/2);

			triangleDepth.forEach(value=>{
				//Checks if coord is outside of view
				var Xpos = parseInt(value[0] + (width/2));
				var Ypos = parseInt(value[1] + (height/2));
				if(0 < Xpos && Xpos < width && 0 < Ypos && Ypos < height){	
					var displayPosition = (Xpos + (Ypos * width));
					if (displayPosition<ZMap.length){
						if(ZMap[displayPosition].length < 1 || ZMap[displayPosition] == undefined){
							ZMapIndexes.push(displayPosition);
						}
						ZMap[displayPosition].push(value);
					}
				}
			})
		}
	})
	frameTime? console.timeEnd('Frame Time'): nothing();
	starField.forEach(value=>{
		var coords = vertexToPixel([value[0],value[1],value[2],], [0,0,0], cameraVector3, cameraPerpendicular, fov, width, cameraVertical, cameraVector[2]);
		var Xpos = coords[0] + (width/2)
		var Ypos = coords[1] + (height/2)
		if(0 < Xpos && Xpos < width && 0 < Ypos && Ypos < height){	
			var displayPosition = (Xpos + (Ypos * width));
			if (displayPosition<ZMap.length){
				if(ZMap[displayPosition].length < 1 || ZMap[displayPosition] == undefined){
					ZMapIndexes.push(displayPosition);
				}
				ZMap[displayPosition].push([coords[0], coords[1], value[3]]);
			}
		}
	})
	//Shading
	ZMapIndexes.forEach(value3=>{
		var value = ZMap[value3][0];
		if(value != undefined){
			var Xpos = parseInt(value[0] + (width/2));
			var Ypos = parseInt(value[1] + (height/2));
			var displayPosition = (Xpos + (Ypos * width))*4;
			if (displayPosition <result.length){
				result[displayPosition] 	= value[2][0];
				result[displayPosition + 1] = value[2][1];
				result[displayPosition + 2] = value[2][2];
				result[displayPosition + 3] = value[2][3];
			}
		}
	})
	return result;
}

//render method
function render(){

	//Updates camera info
	fov = document.getElementById("fov").value;

	//Updates canvas resolution
	document.getElementById('resolutionX').onchange = function(){
		ctx.width = document.getElementById('resolutionX').value;
		width = ctx.width;
	}
	document.getElementById('resolutionY').onchange = function(){
		ctx.height = document.getElementById('resolutionY').value;
		height = ctx.height;
	}

	//draws image
	display(raster());

	frameSinceLastTime++;
	frameCounter++;
	document.getElementById('Frames').textContent = "Frames: " + frameCounter;
}

//gets framerate and displays
function getFramerate(){
	frameTime? console.clear(): nothing();
	document.getElementById('Framerate').textContent = 'Framerate: ' + frameSinceLastTime;
	frameSinceLastTime = 0;
}

selfImport('./models/Planet Rings.obj', [255, 180, 150], [0,0,10]);
selfImport('./models/Planet.obj', [255, 100, 100], [0,0,10]);
selfImport('./models/Sun.obj', [255, 255, 255], [-3000,6000,1800], 100, true, true);

//Create starfield
for(var i=0; i<2000; i++){
	starField.push([parseInt((Math.random()-0.5)*1000), 
					parseInt((Math.random()-0.5)*1000), 
					parseInt((Math.random()-0.5)*1000), 
					[255, (Math.random()*500), (Math.random()*500), 255], ])
}


setInterval(getFramerate, 1000);
if(debugMode != false){ 
	for(var i=0; i<debugMode; i++){
		render()
	}
}else{
	setInterval(render, 16);
}

//user import obj
const inputElement = document.getElementById("file");
inputElement.addEventListener('change', function(){
	importOBJ(inputElement.files[0], [document.getElementById('R').value,
									  document.getElementById('G').value,
									  document.getElementById('B').value]);
}, false);

//convert obj to scene data
function importOBJ(blob, color, offset=[0,0,0], scale=1, isEmmision=false, isBackground=false){
	const fr = new FileReader();
	//convert the file into text
	fr.addEventListener('load', (event)=>{

		//convert the text into .OBJ object
		const obj = new objParse.OBJFile(event.target.result);
		var content = obj.parse().models[0];

		//Adds verticies to objectVerticies
		var temp = [];
		content.vertices.forEach(value=>{
			temp.push(vectorAdd(vectorScalar(Object.values(value), scale), offset));
		})
		//Updates vertex count
		vertexCount+=temp.length;

		//select faces
		var objectData = [];
		content.faces.forEach((value)=>{
			var indexes = [];

			//get indexes of verticies for the face
			value.vertices.forEach((value2)=>{
				indexes.push(value2.vertexIndex-1);
			})

			//get color values
			var R = parseInt(color[0]);
			var G = parseInt(color[1]);
			var B = parseInt(color[2]);

			//add face to sceneData
			var newFace = new face(1, [R, G, B], indexes[0], indexes[1], indexes[2], temp, isEmmision, isBackground);

			objectData.push(newFace);
		})

		//display that another object has been imported 
		objectVerticies.push(temp);
		sceneData.push(objectData);
		console.log('import success');
		document.getElementById('Vertex Count').textContent = "Vertex Count: " + vertexCount;
	});
	fr.readAsText(blob);
}

//self import file
function selfImport(file, color, offset, scale, isEmmision, isBackground)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                importOBJ(new Blob([allText]), color, offset, scale, isEmmision, isBackground);
            }
        }
    }
    rawFile.send(null);
}

document.getElementById('delete').onclick = function(){
	var tempi = parseInt(document.getElementById('OBJind').value) -1;
	sceneData.splice(tempi, 1);
	objectVerticies.splice(tempi,1);
}

function nothing(){
	return null;
}