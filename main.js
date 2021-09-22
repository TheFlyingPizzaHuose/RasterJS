import {fastSin, fastCos, sinTable, cosTable} from './SinCosTan.js';
import {face} from './classes.js';
import {camera2to3, camera2ToPerpendicular, vertexToPixel} from './raster.js';
import * as objParse from './obj-file-parser/dist/OBJFile.js';
import {arrayEqual, vectorAdd, vectorScalar, degToArc, crossProduct, vectorsToAngle, vectorDistance} from './math.js';
import {generateWireframe, generateZMap} from './shading.js';

var debugMode = false;
var fog = false;
var frameTime = false;

//create canvas variables
var ctx = document.querySelector('canvas');
var c = ctx.getContext("2d");
var width = ctx.width;
var height = ctx.height;
var imageData = [];
var hasErr = false;
var textBuffer = [];
var frameCounter = 0;
var frameSinceLastTime = 0;

//Mouse Movement Setup
var cameraVector = [0,0,0];
ctx.requestPointerLock = ctx.requestPointerLock || ctx.mozRequestPointerLock;
ctx.requestPointerLock();
document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
ctx.onclick = function() {
	ctx.requestPointerLock();
};

// Hook pointer lock state change events for different browsers
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
function lockChangeAlert() {
	if (document.pointerLockElement === ctx ||
		document.mozPointerLockElement === ctx) {
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
	if(e.code == 'NumpadAdd'){
		increaseSpeed = true;
	}
	if(e.code == 'NumpadSubtract'){
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
	if(e.code == 'NumpadAdd'){
		increaseSpeed = false;
	}
	if(e.code == 'NumpadSubtract'){
		decreaseSpeed = false;
	}
}

// variable assignments
var objectVerticies = [[[0.962642,5.67513,-0.015534],[-0.706398,6.57358,-0.210624],[0.376032,4.96034,-0.405714]],[[0.503704,5.77224,-0.772596],[0.265035,4.27993,0.463644],[-0.141839,6.06564,-0.062336]]];
let test = [new face(1, [255,0,0], 0,1,2, objectVerticies[0])];
let test2 = [new face(1, [0,0,255], 0,1,2, objectVerticies[1])];
var sceneData = [test, test2]; 
var cameraLocation = [0, -1, 0];
var fov = 70;
var imported = ["test1", "test2", ];
document.getElementById('importedObjects').textContent = "Imported OBJs: " + imported;


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

//fills image data array with single color
function fillScreen(R, G, B){
	var c = document.getElementById("screen");
	var result = [];
	for (var h=0; h<height; h++){
		for (var w=0; w<width; w++){
			var i = ((h*width) + w) * 4;
			result[i    ] = R;
			result[i + 1] = G;
			result[i + 2] = B;
			result[i + 3] = 255;
		}
	}
	return result;
}

function raster(){
	var TwoDemCoords = [];
	//var CoordsLines = [];
	var result = [];
	var ZMap = [];
	var ZMapIndexes = [];
	//CoordsLines = CoordsLines1;
	//result = result1;
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
	var cameraVector3 = camera2to3(dillutedCamera);
	var cameraPerpendicular = camera2ToPerpendicular(dillutedCamera);
	var cameraVertical = crossProduct(cameraVector3, cameraPerpendicular);

	//Camera movement
	increaseSpeed? movementSpeed++: nothing();
	decreaseSpeed? movementSpeed--: nothing();
	moveForward? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVector3, 0.1*movementSpeed)): nothing();
	moveBackward? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVector3, -0.1*movementSpeed)): nothing();
	moveLeft? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraPerpendicular, -0.1*movementSpeed)): nothing();
	moveRight? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraPerpendicular, 0.1*movementSpeed)): nothing();
	moveUp? cameraLocation = vectorAdd(cameraLocation, [0,0,0.1*movementSpeed]): nothing();
	moveDown? cameraLocation = vectorAdd(cameraLocation, [0,0,-0.1*movementSpeed]): nothing();

	//Display camera info
	displayCameraInfo(dillutedCamera, cameraLocation);
	
	try{
		frameTime? console.time('Frame Time'): nothing();
		//generate ZMap
		sceneData.forEach((objectData, index)=>{
			objectData.forEach((value)=>{
				//Backface cull
				if(vectorsToAngle(cameraVector3, value.normal)/Math.PI < (0.5+(fov/360))){

					//Get 2d coords
					//Checks if 2d coord has already been calculated
					var vertexes = [objectVerticies[index][value.v1], objectVerticies[index][value.v2], objectVerticies[index][value.v3]];
					var coords = [];
					var thisObject = TwoDemCoords[index];
					[value.v1, value.v2, value.v3].forEach((e, i)=>{
						thisObject[e] != false? coords[i] = thisObject[e]:
							coords[i] = vertexToPixel(vertexes[i], cameraLocation, cameraVector3, cameraPerpendicular, fov, width, cameraVertical);
							TwoDemCoords[index][e] = coords[i];
					})
					
					var triangleDepth = generateZMap(coords, vertexes, vectorsToAngle(value.normal, [-0.5,1,1])/Math.PI, value.color, width/2, height/2);

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
		});
		frameTime? console.timeEnd('Frame Time'): nothing();
		//Z Buffered
		ZMapIndexes.forEach((value3, index)=>{
			var value = ZMap[value3];
			if(value != undefined && value.length>1){
				var closest = 10000;
				var closestIndex;
				value.forEach((value2, index2) =>{
					var distance = vectorDistance(cameraLocation, vectorAdd(value2[3],vectorScalar(value2[4], value2[2])));
					if(distance < closest){
						closest = distance;
						closestIndex = index2;
					}
				})
				ZMap[value3] = value[closestIndex];
			}else if(value != undefined && value.length==1){
				ZMap[value3] = value[0];
			}
		})
		//Shading
		ZMapIndexes.forEach(value3=>{
			var value = ZMap[value3];
			if(value != undefined){
				var Xpos = parseInt(value[0] + (width/2));
				var Ypos = parseInt(value[1] + (height/2));
				var displayPosition = (Xpos + (Ypos * width))*4;
				if (displayPosition <result.length){
					result[displayPosition] 	= value[5][0];
					result[displayPosition + 1] = value[5][1];
					result[displayPosition + 2] = value[5][2];
					//fog != false? result[displayPosition + 3] = 255-value[2]*fog: nothing();
				}
			}
		})
	}catch(err){
		textBuffer.push(err + ", " + err.stack +"\n");
		hasErr = true;
	}
	return result;
}

//render method
function render(){
	textBuffer = [];
	//Keeps the image up
	display(imageData);

	//Updates camera info
	fov = document.getElementById("fov").value;

	//Updates canvas resolution
	document.getElementById('resolutionX').onchange = function(){
		ctx.width = document.getElementById('resolutionX').value;
		width = ctx.width;
		ZMap1 = [];
		for(var i=0; i<width*(height+1);i++){
			ZMap1[i] = [];
		}
	}
	document.getElementById('resolutionY').onchange = function(){
		ctx.height = document.getElementById('resolutionY').value;
		height = ctx.height;
		ZMap1 = [];
		for(var i=0; i<width*(height+1);i++){
			ZMap1[i] = [];
		}
	}

	//creates image data
	imageData = raster();

	//draws image
	display(imageData);
	hasErr? console.log(textBuffer) : nothing();

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

setInterval(getFramerate, 1000);
if(debugMode != false){ 
	for(var i=0; i<debugMode; i++){
		render()
	}
}else{
	setInterval(render, 32);
}

//import obj
const inputElement = document.getElementById("file");
inputElement.addEventListener('change', function(){
	const fr = new FileReader();
	//convert the file into text
	fr.addEventListener('load', (event)=>{

		//convert the text into .OBJ object
		const obj = new objParse.OBJFile(event.target.result);
		var content = obj.parse().models[0];

		//Adds verticies to objectVerticies
		var temp = [];
		content.vertices.forEach(value=>{
			temp.push(Object.values(value));
		})

		//select faces
		var objectData = [];
		content.faces.forEach((value, index)=>{
			var indexes = [];

			//get indexes of verticies for the face
			value.vertices.forEach((value2)=>{
				indexes.push(value2.vertexIndex-1);
			})

			//get color values
			var R = parseInt(document.getElementById("R").value);
			var G = parseInt(document.getElementById("G").value);
			var B = parseInt(document.getElementById("B").value);

			//add face to sceneData
			var newFace = new face(1, [R, G, B], indexes[0], indexes[1], indexes[2], temp);

			objectData.push(newFace);
		})

		//display that another object has been imported 
		objectVerticies.push(temp);
		sceneData.push(objectData);
		imported.push(content.name);
		console.log('import success');
		document.getElementById('importedObjects').textContent = "Imported OBJs: " + imported;
	});
	fr.readAsText(inputElement.files[0]);
}, false);


document.getElementById('delete').onclick = function(){
	var tempi = parseInt(document.getElementById('OBJind').value) -1;
	sceneData.splice(tempi, 1);
	imported.splice(tempi,1);
	objectVerticies.splice(tempi,1);
	document.getElementById('importedObjects').textContent = "Imported OBJs: " + imported;
}

function nothing(){
	return null;
}