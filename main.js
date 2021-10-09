import {face, particle} from './js/classes.js';
import {camera2to3, camera2ToPerpendicular, vertexToPixel} from './js/raster.js';
import * as objParse from './obj-file-parser/dist/OBJFile.js';
import {degToArc, vectorAdd, vectorScalar, crossProduct, vectorsToAngle, sort2d, vectorDistance, vectorMagnitude} from './js/math.js';
import {generateZMap} from './js/shading.js';

var debugMode = false;
var frameTime = false;
var frameCap = 1000/60

//###########################################Variables###########################################
//Canvas variables
var ctx = document.getElementById('screen'), c = ctx.getContext("2d"), width = ctx.width, height = ctx.height;
//Debug variables
var frameCounter=0, frameSinceLastTime=0, vertexCount=0
//Scene data variables
var sceneData=[],objectVerticies=[],sortedIndexes=[],starField=[],particles=[],textures=[], sunAngle=0, gamma=3;
//Camera variables 
var cameraVector=[0,0,0],cameraPer=[],cameraVector3=[],cameraVer=[],cameraLocation=[0, -100, 0],cameraLocationPrevious=[],fov=70,fovLength=1;
//###########################################Variables###########################################


//Hook pointer lock state change events for different browsers
if(/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
	var src = document.getElementById("screen");
	var start=[]
	var tempCamVec=[]
	//Gets starting touch position
	src.addEventListener('touchstart', function(e) {
		var music = document.getElementById('music');
		music.play();	
		tempCamVec=cameraVector
		// Cache the client X/Y coordinates
		start[0]=e.touches[0].clientX
		start[1]=e.touches[0].clientY
	}, false);
	//Gets postion relative to old position
	src.addEventListener('touchmove', function(e) {
		cameraVector[0]=tempCamVec[0]-(e.touches[0].clientX - start[0])/10*document.getElementById('sens').value
		cameraVector[1]=tempCamVec[1]+(e.touches[0].clientY - start[1])/10*document.getElementById('sens').value
	}, false);
	//Replaced old position
	src.addEventListener('touchend', function(e) {
		cameraVector[0]=tempCamVec[0]-(e.touches[0].clientX - start[0])/10*document.getElementById('sens').value
		cameraVector[1]=tempCamVec[1]+(e.touches[0].clientY - start[1])/10*document.getElementById('sens').value
	}, false);
	//Key board event listeners	
	document.addEventListener('keydown', logKeyMobile);
	//Create less starfield
	for(var i=0; i<500; i++){
		starField.push([parseInt((Math.random()-0.5)*1000), 
						parseInt((Math.random()-0.5)*1000), 
						parseInt((Math.random()-0.5)*1000), 
						[255, (Math.random()*500), (Math.random()*500), 255], ])
	}
}else{	
	//Mouse Movement Setup
	ctx.requestPointerLock = ctx.requestPointerLock || ctx.mozRequestPointerLock;
	ctx.requestPointerLock();
	document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
	ctx.onclick = function() {
		ctx.requestPointerLock();
	};

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

	//Key board event listeners	
	document.addEventListener('keydown', logKey);
	document.addEventListener('keyup', logKey2);
	function updatePosition(e) {
		cameraVector[0] += e.movementX*document.getElementById('sens').value;
		cameraVector[1] -= e.movementY*document.getElementById('sens').value;
	}
	//Create starfield
	for(var i=0; i<4000; i++){
		starField.push([parseInt((Math.random()-0.5)*1000), 
						parseInt((Math.random()-0.5)*1000), 
						parseInt((Math.random()-0.5)*1000), 
						[255, (Math.random()*500), (Math.random()*500), 255], ])
	}
}

//Key press detection
var moveForward, moveBackward, moveLeft, moveRight, moveUp, moveDown, tiltLeft, tiltRight, increaseSpeed, decreaseSpeed;
var movementSpeed = 1;
function logKey(e) {
	switch(e.code){
		case 'KeyW':
			moveForward = true;
			break;	
		case 'KeyS':
			moveBackward = true;
			break;
		case 'KeyA':
			moveLeft = true;
			break;
		case 'KeyD':
			moveRight = true;
			break;
		case 'KeyQ':
			tiltLeft = true;
			break;
		case 'KeyE':
			tiltRight = true;
			break;	
		case 'Space':
			moveUp = true;
			break;
		case 'ShiftLeft':
			moveDown = true;
			break;
		case 'KeyZ':
			increaseSpeed = true;
			break;
		case 'KeyX':
			decreaseSpeed = true;
			break;
	}
}
function logKey2(e) {
	switch(e.code){
		case 'KeyW':
			moveForward = false;
			break;	
		case 'KeyS':
			moveBackward = false;
			break;
		case 'KeyA':
			moveLeft = false;
			break;
		case 'KeyD':
			moveRight = false;
			break;
		case 'KeyQ':
			tiltLeft = false;
			break;
		case 'KeyE':
			tiltRight = false;
			break;	
		case 'Space':
			moveUp = false;
			break;
		case 'ShiftLeft':
			moveDown = false;
			break;
		case 'KeyZ':
			increaseSpeed = false;
			break;
		case 'KeyX':
			decreaseSpeed = false;
			break;
	}
}
function logKeyMobile(e) {
	switch(e.code){
		case 'KeyW':
			moveForward = moveForward? false: true;
			break;	
		case 'KeyS':
			moveBackward = moveBackward? false: true;
			break;
		case 'KeyA':
			moveLeft = moveLeft? false: true;
			break;
		case 'KeyD':
			moveRight = moveRight? false: true;
			break;
		case 'KeyQ':
			tiltLeft = tiltLeft? false: true;
			break;
		case 'KeyE':
			tiltRight = tiltRight? false: true;
			break;	
		case 'Space':
			moveUp = moveUp? false: true;
			break;
		case 'ShiftLeft':
			moveDown = moveDown? false: true;
			break;
		case 'KeyZ':
			increaseSpeed = increaseSpeed? false: true;
			break;
		case 'KeyX':
			decreaseSpeed = decreaseSpeed? false: true;
			break;
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
	var result = new Uint8ClampedArray(new ArrayBuffer(width*height*4))
	var ZMap = []
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
	tiltLeft? cameraVector[2]-=10*document.getElementById('sens').value: nothing();
	tiltRight? cameraVector[2]+=10*document.getElementById('sens').value: nothing();
	cameraVector3 = camera2to3(cameraVector);
	cameraPer = camera2ToPerpendicular(cameraVector);
	cameraVer = crossProduct(cameraVector3, cameraPer);
	cameraVector3=vectorScalar(cameraVector3, fovLength);
	cameraPer = vectorAdd(vectorScalar(cameraPer, Math.cos(degToArc(cameraVector[2]))) , vectorScalar(cameraVer, Math.sin(degToArc(cameraVector[2]))))
	cameraVer = crossProduct(cameraVector3, cameraPer);

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
			var shade = value.isEmmision? 1: gamma/(1+Math.exp((vectorsToAngle(value.normal, camera2to3([-50, sunAngle]))/Math.PI)*value.roughness));
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

	//Updates color picker color
	var colorString = 'rgb('+document.getElementById('R').value+','+
	document.getElementById('G').value+','+
	document.getElementById('B').value+')'
	document.getElementById('colorPick').style.backgroundColor = colorString
	document.getElementById('colorPick').style.color = colorString
																
	frameSinceLastTime++;
	frameCounter++;
	gamma=parseInt(document.getElementById('gamma').value)
	document.getElementById('keys').textContent = ''
	//Changes sun position
	var date_ob = new Date();
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
	userImport(inputElement.files[0], [document.getElementById('R').value,
									  document.getElementById('G').value,
									  document.getElementById('B').value],
									  [document.getElementById('X').value,
									   document.getElementById('Y').value,
									   document.getElementById('Z').value,], document.getElementById('scale').value);
}, false);
//self import file
function selfImport(file, color, offset=[0,0,0], scale=1, isEmmision=false, isBackground=false, LOD=false)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4 && (rawFile.status === 200 || rawFile.status == 0))
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
					var newFace = new face(3, [R, G, B], indexes, temp, isEmmision, isBackground, LOD);
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
    rawFile.send(null);
}
//self import file
function userImport(file, color, offset=[0,0,0], scale=1, isEmmision=false, isBackground=false, LOD=false)
{
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
			var newFace = new face(3, [R, G, B], indexes, temp, isEmmision, isBackground, LOD);
			objectData.push(newFace);
		})

		//display that another object has been imported
		sceneData.push(objectData);
		console.log('import success');
		document.getElementById('Vertex Count').textContent = "Vertex Count: " + vertexCount;
	});
	fr.readAsText(file);
}
//copy paste model
function copyPaste(model, vertices, offset=[0,0,0], scale=1, isEmmision=false, isBackground=false, LOD=false, randomColor=false){
	//Adds verticies to objectVerticies
	var temp = [];
	vertices.forEach(value=>{
		temp.push(vectorAdd(vectorScalar(value, scale), offset));
	})
	objectVerticies.push(temp);
	//Updates vertex count
	vertexCount+=temp.length;

	//select faces
	var color = randomColor? vectorScalar(model[0].color, (Math.random()+0.5)/1.5): model[0].color
	var objectData = [];
	model.forEach(value=>{

		//add face to sceneData
		var newFace = new face(3, color, [value.v1, value.v2, value.v3], temp, isEmmision, isBackground, LOD);
		objectData.push(newFace);
	})

	//display that another object has been imported
	sceneData.push(objectData);
	console.log('copied!');
	document.getElementById('Vertex Count').textContent = "Vertex Count: " + vertexCount;
}
//Self import texture
function importTexture(path, ind){
	var Ctx = document.getElementById('texture')
	var C = Ctx.getContext('2d')
	//Get image
	var img = new Image();
	img.onload = function() {
		//Adjust canvas size to fit
		Ctx.width = img.width;
		Ctx.height = img.height;
		C.drawImage(img, 0, 0);
		textures[ind] = {image: C.getImageData(0, 0, img.width, img.height)};
		Ctx.width = 1;
		Ctx.height = 1;
	};
	img.src = path;
	console.log('texture ' + path + ' imported');
}
//###########################################Import functions###########################################

document.getElementById('fov').onchange = function(){
	fov = document.getElementById('fov').value
	fovLength = Math.tan(degToArc(fov/2));
}

function nothing(){
	return null;
}

//Loading Screen
var load = new Image();
load.onload = function() {
	c.drawImage(load, 0, 0);
};
load.src = './textures/loading.png';
textures=new Array(3)
importTexture('./textures/debug.png',0)
importTexture('./textures/fireball.png',1)
importTexture('./textures/Asteroid.png',2)

selfImport('./models/Sun.obj', [255, 255, 255], [-3000,3000,1800], 80, true, true);
selfImport('./models/Sun.obj', [255, 100, 100], [0,0,0], 5);
selfImport('./models/1.obj', [250, 160, 100], [0,0,0], 1, false, false, [100000000,100000001]);
selfImport('./models/2.obj', [250, 160, 100], [0,0,0], 1, false, false, [100000000,100000001]);
selfImport('./models/3.obj', [250, 160, 100], [0,0,0], 1, false, false, [100000000,100000001]);
selfImport('./models/4.obj', [250, 160, 100], [0,0,0], 1, false, false, [100000000,100000001]);
selfImport('./models/5.obj', [250, 160, 100], [0,0,0], 1, false, false, [100000000,100000001]);

//Gives time for texture import
setTimeout(function(){
		console.log(objectVerticies)
		console.log(textures)	
		//creates asteroid field
		for(var i=0; i<500; i++){
			var selectModel = parseInt(Math.random()*6)
			var distance = 100*((Math.random()+4)/5)
			var angle = Math.random()*2*Math.PI
			var position = [distance*Math.sin(angle), distance*Math.cos(angle), (Math.random()-0.5)*2]
			var lod = [2, 1000]
			var sclrurer =  0.1*(Math.random()+1)/2
			switch(selectModel){
				case 1:
					copyPaste(sceneData[2], objectVerticies[2], position, sclrurer, false, false, lod, true)
					break;
				case 2:
					copyPaste(sceneData[3], objectVerticies[3], position, sclrurer, false, false, lod, true)
					break;
				case 3:
					copyPaste(sceneData[4], objectVerticies[4], position, sclrurer, false, false, lod, true)
					break;
				case 4:
					copyPaste(sceneData[5], objectVerticies[5], position, sclrurer, false, false, lod, true)
					break;
				case 5:
					copyPaste(sceneData[6], objectVerticies[6], position, sclrurer, false, false, lod, true)
					break;
			}
			particles.push(new particle(50, position, [1000, 5000], 2, false))
		}
		//Create fireballs
		for(var i=0; i<50; i++){
			particles.push(new particle(30000, vectorScalar(camera2to3([Math.random()*360, Math.random()*360]), 410), [0,100000], 1, true))
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
}, 2000);