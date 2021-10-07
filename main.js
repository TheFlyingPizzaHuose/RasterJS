import {face, particle} from './js/classes.js';
import {camera2to3, camera2ToPerpendicular, vertexToPixel} from './js/raster.js';
import * as objParse from './obj-file-parser/dist/OBJFile.js';
import {degToArc, vectorAdd, vectorScalar, crossProduct, vectorsToAngle, sort2d, vectorDistance} from './js/math.js';
import {generateZMap} from './js/shading.js';

const date_ob = new Date();
var debugMode = false;
var frameTime = false;
var frameCap = 1000/60

//Creates URL blob for shading worker
var blob = new Blob(["importScripts('http://localhost:5000/js/shadingWorker.js')"], { "type": 'application/javascript' });
var url = window.URL || window.webkitURL;
var blobUrl = url.createObjectURL(blob);
var workers = [new Worker(blobUrl),new Worker(blobUrl),new Worker(blobUrl),new Worker(blobUrl)]

//###########################################Variables###########################################
//Canvas variables
var ctx = document.getElementById('screen'), c = ctx.getContext("2d"), width = ctx.width, height = ctx.height;
//Debug variables
var frameCounter=0, frameSinceLastTime=0, vertexCount=0
//Scene data variables
var sceneData=[],objectVerticies=[],sortedIndexes=[],starField=[],particles=[],textures=[], sunAngle=(date_ob.getMinutes()/20)*360;
//Camera variables 
var cameraVector=[0,0,0],cameraPer=[],cameraVector3=[],cameraVer=[],cameraLocation=[0, -100, 0],cameraLocationPrevious=[],fov=70,fovLength=1;
//###########################################Variables###########################################

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
	cameraVector[0] += e.movementX*document.getElementById('sens').value;
	cameraVector[1] -= e.movementY*document.getElementById('sens').value;
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
	moveLeft? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraPer, -0.1*movementSpeed)): nothing();
	moveRight? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraPer, 0.1*movementSpeed)): nothing();
	moveUp? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVer, -0.1*movementSpeed)): nothing();
	moveDown? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVer, 0.1*movementSpeed)): nothing();
}

//###########################################Render functions###########################################
//draw image on screen function 
function display(image){
	var canvasImage = c.createImageData(width, height);
	canvasImage.data.set(image);
	c.putImageData(canvasImage, 0, 0);
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
	cameraVector3 = camera2to3(cameraVector);
	cameraPer = camera2ToPerpendicular(cameraVector);
	cameraVer = crossProduct(cameraVector3, cameraPer);
	cameraVector3=vectorScalar(cameraVector3, fovLength);

	//Camera movement
	cameraMove();

	document.getElementById('Frames').textContent = "Frames: " + frameCounter + ' ';
	
	frameTime? console.time('Frame Time'): nothing();
	//Sort triangles by distance
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
	//Wireframe, Shading
	sortedIndexes.forEach((triangle)=>{
		var value = sceneData[triangle[1]][triangle[2]];
		//Backface cull
		if(vectorsToAngle(cameraVector3, value.normal)/Math.PI < (0.5+(fov/360)) && value.lod(cameraLocation)){
			//Checks if model is in skybox
			var cameraLocation2;
			value.isBackground? cameraLocation2=[0,0,0]: cameraLocation2=cameraLocation;

			//Get 2d coords & Checks if 2d coord has already been calculated
			var vertexes = [objectVerticies[triangle[1]][value.v1], objectVerticies[triangle[1]][value.v2], objectVerticies[triangle[1]][value.v3]];
			var coords = [];
			var thisObject = TwoDemCoords[triangle[1]];
			[value.v1, value.v2, value.v3].forEach((e, i)=>{
				thisObject[e] != false? coords[i] = thisObject[e]:
					coords[i] = vertexToPixel(vertexes[i], cameraLocation2, cameraVector3, cameraPer, width, height, cameraVer);
					TwoDemCoords[triangle[1]][e] = coords[i];
			})

			//Checks if shading is off
			var shade = value.isEmmision? 1: (vectorsToAngle(value.normal, camera2to3([-50, sunAngle]))/Math.PI-0.5)*6;
			var triangleDepth = generateZMap(coords, shade, value.color, width, height);
			triangleDepth.forEach(value=>{
				//Checks if coord is outside of view
				if(0 < value[0] && value[0] < width && 0 < value[1] && value[1] < height){	
					var displayPosition = (value[0] + (value[1] * width));
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
	//Renders particles
	particles.forEach(value=>{
		//Checks if particle is within LOD
		if(value.lod(cameraLocation)){
			var temp = value.isBackground? [0,0,0]: cameraLocation;
			var coords = vertexToPixel(value.position, temp, cameraVector3, cameraPer, width, height, cameraVer);
			//Checks if coord is outside of view
			if(0 < coords[0] && coords[0] < width && 0 < coords[1] && coords[1] < height){
				var appSizeRatio = value.size/(Math.PI*2*vectorDistance(temp, value.position)*(fov/360))
				var texWid = textures[value.textureIndex].image.width
				var texHet = textures[value.textureIndex].image.height
				var texCol = textures[value.textureIndex].image.data
				var apparentWidth = parseInt(appSizeRatio*texWid)
				var apparentHeight = parseInt(appSizeRatio*texHet)

				//Puts in result the texture
				for(var y=0;y<apparentHeight;y++){
					var Ypos2 = parseInt(y/apparentHeight * texHet)
					for(var x=0;x<apparentWidth;x++){
						var Xpos2 = parseInt(x/apparentWidth * texWid)
						var displayPosition = (coords[0]+x+((coords[1]+y) * width))*4;
						var texturePosition = (Xpos2+((Ypos2)) * texWid)*4;
						if (displayPosition <result.length){
							result[displayPosition] 	= texCol[texturePosition];
							result[displayPosition + 1] = texCol[texturePosition+1];
							result[displayPosition + 2] = texCol[texturePosition+2];
							result[displayPosition + 3] = texCol[texturePosition+3];
						}
					}
				}
			}
		}
	})
	//Renders stars
	starField.forEach(value=>{
		var coords = vertexToPixel([value[0],value[1],value[2]], [0,0,0], cameraVector3, cameraPer, width, height, cameraVer);
		if(0 < coords[0] && coords[0] < width && 0 < coords[1] && coords[1] < height){	
			var displayPosition = (coords[0] + (coords[1] * width));
			if (displayPosition<ZMap.length){
				if(ZMap[displayPosition].length < 1 || ZMap[displayPosition] == undefined){
					ZMapIndexes.push(displayPosition);
				}
				ZMap[displayPosition].push([coords[0], coords[1], value[3]]);
			}
		}
	})
	frameTime? console.timeEnd('Frame Time'): nothing();

	//Zbuffer and input into result
	ZMapIndexes.forEach(value3=>{
		var value = ZMap[value3][0];
		if(value != undefined){
			var Xpos = value[0];
			var Ypos = value[1];
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
	sunAngle=(date_ob.getMinutes()/20)*360
}
//gets framerate and displays
function getFramerate(){
	frameTime? console.clear(): nothing();
	document.getElementById('Framerate').textContent = 'Framerate: ' + frameSinceLastTime + ' ';
	frameSinceLastTime = 0;
}
//###########################################Render functions###########################################

//###########################################Import functions###########################################
//user import obj
const inputElement = document.getElementById("file");
inputElement.addEventListener('change', function(){
	selfImport(inputElement.files[0], [document.getElementById('R').value,
									  document.getElementById('G').value,
									  document.getElementById('B').value]);
}, false);
//self import file
function selfImport(file, color, offset=[0,0,0], scale=1, isEmmision=false, isBackground=false, LOD=false)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = new Blob([rawFile.responseText]);
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
					objectVerticies.push(temp);
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
						var newFace = new face(1, [R, G, B], indexes, temp, isEmmision, isBackground, LOD);
						objectData.push(newFace);
					})

					//display that another object has been imported
					sceneData.push(objectData);
					console.log('import success');
					document.getElementById('Vertex Count').textContent = "Vertex Count: " + vertexCount;
				});
				fr.readAsText(allText);
            }
        }
    }
    rawFile.send(null);
}
//Self import texture
function importTexture(path, alias){
	var Ctx = document.getElementById('texture')
	var C = Ctx.getContext('2d')
	//Get image
	var img = new Image();
	img.onload = function() {
		//Adjust canvas size to fit
		Ctx.width = img.width;
		Ctx.height = img.height;
		C.drawImage(img, 0, 0);
		textures.push({image: C.getImageData(0, 0, img.width, img.height)});
		Ctx.width = 1;
		Ctx.height = 1;
	};
	img.src = path;
	console.log('texture ' + path + ' imported');
}
document.getElementById('delete').onclick = function(){
	var tempi = parseInt(document.getElementById('OBJind').value) -1;
	sceneData.splice(tempi, 1);
	objectVerticies.splice(tempi,1);
}
//###########################################Import functions###########################################

document.getElementById('fov').onchange = function(){
	fov = document.getElementById('fov').value
	fovLength = Math.tan(degToArc(fov/2));
}

function nothing(){
	return null;
}

importTexture('./textures/debug.png')
importTexture('./textures/fireball.png')
importTexture('./textures/Asteroid.PNG')
setTimeout(() => {
	selfImport('./models/Sun.obj', [255, 255, 255], [-3000,3000,1800], 80, true, true);
	selfImport('./models/Sun.obj', [255, 100, 100], [0,0,0], 5);
	//creates asteroid field
	for(var i=0; i<500; i++){
		var selectModel = parseInt(Math.random()*5)
		var distance = 100*((Math.random()+4)/5)
		var angle = Math.random()*2*Math.PI
		var position = [distance*Math.sin(angle), distance*Math.cos(angle), (Math.random()-0.5)*2]
		var lod = [10, 1000]
		var sclrurer =  0.1*(Math.random()+1)/2
		switch(selectModel){
			case 1:
				selfImport('./models/1.obj', [250, 160, 100], position, sclrurer, false, false, lod);
				break;
			case 2:
				selfImport('./models/2.obj', [250, 160, 100], position, sclrurer, false, false, lod);
				break;
			case 3:
				selfImport('./models/3.obj', [250, 160, 100], position, sclrurer, false, false, lod);
				break;
			case 4:
				selfImport('./models/4.obj', [250, 160, 100], position, sclrurer, false, false, lod);
				break;
			case 5:
				selfImport('./models/5.obj', [250, 160, 100], position, sclrurer, false, false, lod);
				break;
		}
		particles.push(new particle(50, position, [1000, 1000000], 2, false))
	}
}, 500);

//Gives time for texture import
setTimeout(function(){
	console.log(objectVerticies)
	console.log(textures)
	//Create fireballs
	for(var i=0; i<50; i++){
		particles.push(new particle(30000, vectorScalar(camera2to3([Math.random()*360, Math.random()*360]), 410), [0,100000], 1, true))
	}
	//Create starfield
	for(var i=0; i<4000; i++){
		starField.push([parseInt((Math.random()-0.5)*1000), 
						parseInt((Math.random()-0.5)*1000), 
						parseInt((Math.random()-0.5)*1000), 
						[255, (Math.random()*500), (Math.random()*500), 255], ])
	}
	fov = document.getElementById('fov').value
	if(debugMode != false){ 
		for(var i=0; i<debugMode; i++){
			render()
		}
	}else{
		setInterval(getFramerate, 1000);
		setInterval(render, frameCap);
	}
}, 500);