import {face, particle} from './js/classes.js';
import {camera2to3, vertexToPixel} from './js/raster.js';
import * as objParse from './obj-file-parser/dist/OBJFile.js';
import {xyToIndex, degToArc, vectorAdd, vectorScalar, sort2d, vectorDistance, vectorSubtract} from './js/math.js';
import {generateZMap} from './js/shading.js';

var debugMode = false;
var frameTime = false;
var frameCap = 1000/60

//###########################################Variables###########################################
//Canvas variables
var ctx = document.getElementById('screen'), c = ctx.getContext("2d"), width = ctx.width, height = ctx.height;
//Debug variables
var frameCounter=0,frameSinceLastTime=0,vertexCount=0,hasErr=false,countsSinceLastErr=0,showDebug=true;
//Scene data variables
var sceneData=[],objectVerticies=[],objectAnimate=[],sortedIndexes=[],starField=[],particles=[],textures=[],textCoords=[],sunAngle=0,gamma=3;
//Camera variables 
var cameraPer=[0,1,0],cameraVector3=[-1,0,0],cameraVer=[0,0,-1],cameraLocation=[200,0,-10],cameraLocationPrevious=[],fov=70,fovLength=1;
//###########################################Variables###########################################

//Loading Screen
var load = new Image();
load.onload = function() {
	c.drawImage(load, 0, 0);
};
load.src = './textures/loading.png';
textures=[]
importTexture('./textures/fireball.png',0,'./textures/fireballAlpha.jpg')
importTexture('./textures/Asteroid.png',1,'./textures/AsteroidAlpha.jpg')
importTexture('./textures/fireball2.png',2,'./textures/fireballAlpha.jpg')
importTexture('./textures/Saturn.png',3,'./textures/SaturnAlpha.png')
importTexture('./textures/Dirt.jpg',4,'./textures/DirtAlpha.jpg')
importTexture('./textures/DirtAlpha.jpg',5,'./textures/DirtAlpha.jpg')

selfImport({file: './models/Sun.obj', offset: [-3000,3000,1800], scale: 80, isEmmision: true, isBackground: true, textureIndex: 5});
selfImport({file: './models/Planet.obj', scale: 5, isEmmision: true , textureIndex: 3});
selfImport({file: './models/1.obj', LOD: [100000000,100000001], textureIndex: 4});
selfImport({file: './models/2.obj', LOD: [100000000,100000001], textureIndex: 4});
selfImport({file: './models/3.obj', LOD: [100000000,100000001], textureIndex: 4});
selfImport({file: './models/4.obj', LOD: [100000000,100000001], textureIndex: 4});
selfImport({file: './models/5.obj', LOD: [100000000,100000001], textureIndex: 4});

//Gives time for texture import
setTimeout(function(){
	console.log(textures)
	//creates asteroid field
	for(var i=0; i<500; i++){
		var selectModel = parseInt(Math.random()*6)
		var distance = 70*((Math.random()+4)/5)
		var angle = Math.random()*2*Math.PI
		var position = [distance*Math.sin(angle), distance*Math.cos(angle), (Math.random()-0.5)*2]
		var lod = [0.0001,30]
		var sclrurer =  0.1*(Math.random()+1)/2
		switch(selectModel){
			case 1:
				copyPaste(sceneData[2], objectVerticies[2], position, sclrurer, false, false, lod, textCoords[2])
				break;
			case 2:
				copyPaste(sceneData[3], objectVerticies[3], position, sclrurer, false, false, lod, textCoords[3])
				break;
			case 3:
				copyPaste(sceneData[4], objectVerticies[4], position, sclrurer, false, false, lod, textCoords[4])
				break;
			case 4:
				copyPaste(sceneData[5], objectVerticies[5], position, sclrurer, false, false, lod, textCoords[5])
				break;
			case 5:
				copyPaste(sceneData[6], objectVerticies[6], position, sclrurer, false, false, lod, textCoords[6])
				break;
		}
		particles.push(new particle(1.5, position, [30, 100], 1, false))
	}
	//Create starfield
	for(var i=0; i<4000; i++){
		starField.push([parseInt((Math.random()-0.5)*1000), 
						parseInt((Math.random()-0.5)*1000), 
						parseInt((Math.random()-0.5)*1000), 
						[(Math.random()*500), (Math.random()*500), (Math.random()*500), 255],false])
	}
	//creates dust field
	for(var i=0; i<1700; i++){
		var distance = 70*((Math.random()+4)/5)
		var angle = Math.random()*2*Math.PI
		var colVaria = Math.random()*50-25
		starField.push([distance*Math.sin(angle), distance*Math.cos(angle), (Math.random()-0.5)*2, 
					   [parseInt(250+colVaria), parseInt(160+colVaria), parseInt(100+colVaria), 255], true])
	}
	//creates dust field
	for(var i=0; i<1700; i++){
		var distance = 80*((Math.random()+4)/5)
		var angle = Math.random()*2*Math.PI
		var colVaria = Math.random()*50-25
		starField.push([distance*Math.sin(angle), distance*Math.cos(angle), (Math.random()-0.5)*2, 
					   [parseInt(255+colVaria), parseInt(240+colVaria), parseInt(150+colVaria), 255], true])
	}
	//creates dust field
	for(var i=0; i<1700; i++){
		var distance = 90*((Math.random()+4)/5)
		var angle = Math.random()*2*Math.PI
		var colVaria = Math.random()*50-25
		starField.push([distance*Math.sin(angle), distance*Math.cos(angle), (Math.random()-0.5)*2, 
					   [parseInt(166+colVaria), parseInt(106+colVaria), parseInt(66+colVaria), 255], true])
	}
	//Create fireballs
	for(var i=0; i<50; i++){
		particles.push(new particle(30000*(Math.random()+2)/3, vectorScalar(camera2to3([Math.random()*360, Math.random()*360]), 200000), [0,200001], 0, true))
		particles.push(new particle(30000*(Math.random()+2)/3, vectorScalar(camera2to3([Math.random()*360, Math.random()*360]), 200000), [0,200001], 2, true))
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

//Different browser settings
if(/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
	var start=[]
	//Gets starting touch position
	window.addEventListener('touchstart', function(e) {
		var music = document.getElementById('music');
		music.play();
		// Cache the client X/Y coordinates
		start = [e.touches[0].clientX, e.touches[0].clientY]
	}, false);
	//Gets postion relative to old position and replaces old position
	window.addEventListener('touchmove', function(e) {
		cameraRotate(-(e.touches[0].clientX-start[0])*document.getElementById('sens').value, -(e.touches[0].clientY-start[1])*document.getElementById('sens').value)
		start = [e.touches[0].clientX, e.touches[0].clientY]
	}, false);
	//Key board event listeners	
	document.addEventListener('keydown', logKeyMobile);
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
		cameraRotate(e.movementX*document.getElementById('sens').value, e.movementY*document.getElementById('sens').value)
	}
}

//Key press detection
var moveForward, moveBackward, moveLeft, moveRight, moveUp, moveDown, tiltLeft, tiltRight, increaseSpeed, decreaseSpeed;
var movementSpeed = 1;
function logKey(e) {
	switch(e.code){
		case 'KeyM':
			showDebug = showDebug? false: true;
			break;
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
//###########################################Camera Math###########################################
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
//turns camera
function cameraRotate(X=0, Y=0){
	//Perform roll
	var arcX = degToArc(X), arcY = degToArc(Y)
	var tempVer = tiltRight? vectorAdd(vectorScalar(cameraVer, Math.sin(degToArc(91))), vectorScalar(cameraPer, Math.cos(degToArc(91)))): cameraVer
	var tempPer = tiltRight? vectorAdd(vectorScalar(cameraVer, Math.sin(degToArc(1))), vectorScalar(cameraPer, Math.cos(degToArc(1)))): cameraPer
	tempVer = tiltLeft? vectorAdd(vectorScalar(tempVer, Math.sin(degToArc(89))), vectorScalar(tempPer, Math.cos(degToArc(89)))): tempVer
	tempPer = tiltLeft? vectorAdd(vectorScalar(tempVer, Math.sin(degToArc(-1))), vectorScalar(tempPer, Math.cos(degToArc(-1)))): tempPer
	//Perform yaw
	var tempV3 = vectorAdd(vectorScalar(cameraVector3, Math.cos(arcX)), vectorScalar(tempPer, Math.sin(arcX)))
	tempPer = vectorAdd(vectorScalar(cameraVector3, Math.cos(arcX+Math.PI/2)), vectorScalar(tempPer, Math.sin(arcX+Math.PI/2)))
	var tempV32 = tempV3
	//Perform pitch
	tempV3 = vectorAdd(vectorScalar(tempV32, Math.cos(arcY)), vectorScalar(tempVer, Math.sin(arcY)))
	tempVer = vectorAdd(vectorScalar(tempV32, Math.cos(arcY+Math.PI/2)), vectorScalar(tempVer, Math.sin(arcY+Math.PI/2)))
	//Finalizes
	cameraVector3 = tempV3
	cameraPer = tempPer
	cameraVer = tempVer
}
//###########################################Camera Math###########################################

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
	var ZMap = []
	for(var i=0; i<objectVerticies.length; i++){
		TwoDemCoords[i] = [];
		for(var x=0; x<objectVerticies[i].length; x++){
			TwoDemCoords[i][x] = false;
		}
	}
	var result = new Uint8ClampedArray((new Array(width*height*4).fill(0)))
	for(var i=0; i<width*height;i++){
		ZMap[i] = [];
	}

	document.getElementById('Frames').textContent = "Frames: " + frameCounter + ' '

	//Camera transform
	cameraMove();
	cameraRotate()
	var cameraVector=vectorScalar(cameraVector3, fovLength);
	
	//Sort triangles by distance
	if(cameraLocation != cameraLocationPrevious){
		cameraLocationPrevious = cameraLocation;
		sortedIndexes = [];
		sceneData.forEach((objectData, index)=>{
			objectData.forEach((value, index2)=>{
				if(value.lod(cameraLocation)){
					sortedIndexes.push([vectorDistance(cameraLocation, value.center), index, index2]);
				}
			})
		})
	}
	sortedIndexes.sort(sort2d);
	//Wireframe, Shading
	sortedIndexes.forEach((triangle)=>{
		var value = sceneData[triangle[1]][triangle[2]];
		//Backface cull & Distance cull
		if(value.backfaceCull(cameraVector, fov)){
			//Checks if model is in skybox
			var cameraLocation2 = value.isBackground? [0,0,0]: cameraLocation;

			//Get 2d coords & Send Job To Workers & Checks If Verts Have Been Calced
			var vertexes = [objectVerticies[triangle[1]][value.v1], objectVerticies[triangle[1]][value.v2], objectVerticies[triangle[1]][value.v3]];
			var coords = [];
			var thisObject = TwoDemCoords[triangle[1]];
			[value.v1, value.v2, value.v3].forEach((e, i)=>{
				thisObject[e] != false? coords[i] = thisObject[e]:
					coords[i] = vertexToPixel(vertexes[i], cameraLocation2, cameraVector, cameraPer, width, height, cameraVer);
					TwoDemCoords[triangle[1]][e] = coords[i];
			})

			//Checks if shading is off
			var shade = value.selfShade(sunAngle, gamma)
			//gets wirframe
			var vertTextCoords = [textCoords[triangle[1]][value.textCordS1], textCoords[triangle[1]][value.textCordS2], textCoords[triangle[1]][value.textCordS3]];
			var triangleDepth = generateZMap(coords, width, height, vertTextCoords);
			triangleDepth.forEach(coord=>{
				//Checks if coord is outside of view and clamps
				if(coord[4]<=height && coord[4]>=0){	
					var Xpos = coord[0]>width?width:coord[0]<0?0:coord[0]
					var Xpos2 = coord[1]>width?width:coord[1]<0?0:coord[1]
					var dispPos = xyToIndex(Xpos,coord[4],width)
					var dispPos2 = xyToIndex(Xpos2,coord[4],width)
					var dispPosTemp = dispPos
					var texPos1 = coord[2]
					var texPosSlope=vectorScalar(vectorSubtract(coord[3], texPos1),4/(dispPos2-dispPos))
					//finds which xcoord is larger
					if(dispPos>dispPos2){
						dispPos=dispPos2
						dispPos2=dispPosTemp
						texPos1=coord[3]
						texPosSlope=vectorScalar(vectorSubtract(coord[2], texPos1),4/(dispPos2-dispPos))
					}
					//Fallback if texture doesn't exist
					try{
						var texture = textures[value.textureIndex].image
					}catch{
						var texture = {width:1, height:1, data:[255,0,255]}
					}
					var texWid = texture.width
					if(dispPos2<result.length && dispPos<result.length){
						for(var i=dispPos;i<dispPos2;i+=4){
							//Converts UV coordinates to pixel postions
							var temp=xyToIndex(parseInt((texPos1[0])*texWid), parseInt((1-texPos1[1])*texture.height), texWid)
							var shaded = texture.data.slice(temp, temp+3)
							result.set([shaded[0], shaded[1], shaded[2], 255*shade], i)
							texPos1=vectorAdd(texPos1,texPosSlope)
						}
					}
				}
			})
		}
	})
	//Renders particles
	particles.forEach(value=>{
		//Checks if particle is within LOD
		var temp1 = value.lod(cameraLocation);
		if(temp1[0]){
			var temp = value.isBackground? [0,0,0]: cameraLocation;
			var coords = vertexToPixel(value.position, temp, cameraVector, cameraPer, width, height, cameraVer);
			//Checks if coord is outside of view
			if(0 < coords[0] && coords[0] < width && 0 < coords[1] && coords[1] < height && textures[value.textureIndex] != undefined){
				//Checks if texture exists
				var appSizeRatio = value.size/(Math.PI*2*temp1[1]*(fov/360))
				var texWid = textures[value.textureIndex].image.width,
				texHet = textures[value.textureIndex].image.height,
				texCol = textures[value.textureIndex].image.data,
				apparentWidth = parseInt(appSizeRatio*texWid),
				apparentHeight = parseInt(appSizeRatio*texHet)
				//Puts the texture in result 
				for(var y=0;y<apparentHeight;y++){
					var Ypos2 = parseInt(y/apparentHeight * texHet)
					for(var x=0;x<apparentWidth;x++){
						//Checks for width overlap
						if(coords[0]+x<width){
							var Xpos2 = parseInt(x/apparentWidth * texWid)
							var dispPos = xyToIndex(coords[0]+x, coords[1]+y ,width);
							var texPos = xyToIndex(Xpos2, Ypos2, texWid)
							//Alpha check, out of index check, pixel is empty check
							if (dispPos<result.length && texCol[texPos + 3]>0 && result[dispPos+3]==0){
								result.set(Array.from(texCol.slice(texPos, texPos+3)).concat(255), dispPos)
							}
						}
					}
				}
			}
		}
	})
	//Renders stars
	starField.forEach(value=>{
		var cameraLocation2 = value[4]?cameraLocation:[0,0,0]
		var coords = vertexToPixel([value[0],value[1],value[2]], cameraLocation2, cameraVector, cameraPer, width, height, cameraVer);
		if(0 < coords[0] && coords[0] < width && 0 < coords[1] && coords[1] < height){	
			var displayPosition = xyToIndex(coords[0], coords[1], width)
			if (displayPosition<result.length && result[displayPosition+3]==0){
				result.set(value[3].concat(255), displayPosition)
			}
		}
	})
	return result;
}
//render method
function render(){	
	try{
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
		//Changes sun position
		sunAngle=(new Date().getMinutes()/20)*360

		//Hides or unhides debug elements
		var displayMode = showDebug?'inline':'none'
		var colorMode = showDebug?'orange':'black'
		document.getElementById('Frames').setAttribute('style', 'color: '+colorMode)
		document.getElementById('Framerate').setAttribute('style', 'color: '+colorMode)
		try{
			document.getElementById('settings').setAttribute('style', 'display: '+displayMode)
		}catch{
		}
		document.getElementById('inputLabel').setAttribute('style', 'display: '+displayMode)
		document.getElementById('homeButton').setAttribute('style', 'display: '+displayMode)
		document.getElementById('keys').setAttribute('style', showDebug?'width: 20px; display: inline; float: none':'display: none')
	}catch(err){
		hasErr = true;
		document.getElementById('Framerate').textContent = err + '\n' + err.stack;
	}
}
//gets framerate and displays
function getFramerate(){
	frameTime? console.clear(): nothing();
	if(!hasErr){
		document.getElementById('Framerate').textContent = 'Framerate: ' + frameSinceLastTime + ' '
	}else{
		nothing();
	}
	if(countsSinceLastErr<10){
		countsSinceLastErr++
	}else{
		countsSinceLastErr=0
		hasErr=false
	}
	frameSinceLastTime = 0;
}
//###########################################Render functions###########################################

//###########################################Import functions###########################################
//user import obj
const inputElement = document.getElementById("file");
inputElement.addEventListener('change', function(){
	selfImport({file: inputElement.files[0], 
				color: [document.getElementById('R').value,
						document.getElementById('G').value,
						document.getElementById('B').value],
				offset: [parseFloat(document.getElementById('X').value),
						 parseFloat(document.getElementById('Y').value),
						 parseFloat(document.getElementById('Z').value)], 
				scale: document.getElementById('scale').value}, true);
}, false);
//self import file
function selfImport(object, userMode=false)
{
	//Checks if object variables are undefined
	var file=object.file,
		offset=object.offset!=undefined?object.offset:[0,0,0], 
		scale=object.scale!=undefined?object.scale:1, 
		isEmmision=object.isEmmision!=undefined?object.isEmmision:false, 
		isBackground=object.isBackground!=undefined?object.isBackground:false, 
		LOD=object.LOD!=undefined?object.LOD:false,
		roughness=object.roughness!=undefined?object.roughness:3,
		textureIndex=object.textureIndex!=undefined?object.textureIndex:0
	var rawFile = new XMLHttpRequest();
	var allText=file;
	if(!userMode){
		rawFile.open("GET", file, false);
		rawFile.onreadystatechange = function ()
		{
			if(rawFile.readyState === 4 && (rawFile.status === 200 || rawFile.status == 0))
			{
				allText = new Blob([rawFile.responseText]);
			}
		}
		rawFile.send(null);
	}
	const fr = new FileReader();
	//convert the file into text
	fr.addEventListener('load', (event)=>{
		//convert the text into .OBJ object
		var content = (new objParse.OBJFile(event.target.result)).parse().models[0];
		//Adds verticies to objectVerticies
		var temp = [];
		content.vertices.forEach(value=>{
			temp.push(vectorAdd(vectorScalar(Object.values(value), scale), offset));
		})
		objectVerticies.push(temp);
		//Updates vertex count
		vertexCount+=temp.length;
		//Adds texture coordinates to objectVerticies
		var temp2 = [];
		content.textureCoords.forEach(value=>{
			temp2.push(Object.values(value));
		})
		textCoords.push(temp2)

		//select faces
		var objectData = [];
		content.faces.forEach((value)=>{
			var indexes = [];
			var coordindexes = [];
			//get indexes of verticies for the face
			value.vertices.forEach((value2)=>{
				indexes.push(value2.vertexIndex-1);
				coordindexes.push(value2.textureCoordsIndex-1);
			})

			//add face to sceneData
			var newFace = new face(roughness, indexes, temp, isEmmision, isBackground, LOD, coordindexes, textureIndex);
			objectData.push(newFace);
		})

		//display that another object has been imported
		sceneData.push(objectData);
		objectAnimate.push({animate: false, rotation: false})
		console.log('import success');
		document.getElementById('Vertex Count').textContent = "Vertex Count: " + vertexCount;
	});
	fr.readAsText(allText);
}
//copy paste model
function copyPaste(model, vertices, offset=[0,0,0], scale=1, isEmmision=false, isBackground=false, LOD=false, texCoords=[]){
	//Adds verticies to objectVerticies
	var temp = [];
	vertices.forEach(value=>{
		var vert = vectorAdd(vectorScalar(Object.values(value), scale), offset)
		temp.push(vert);
	})
	objectVerticies.push(temp);
	//Updates vertex count
	vertexCount+=temp.length;
	//Adds texture coordinates to textCoords
	textCoords.push(texCoords)

	//select faces
	var objectData = [];
	model.forEach(value=>{
		//add face to sceneData
		var newFace = new face(3, [value.v1, value.v2, value.v3], temp, isEmmision, isBackground, LOD, [value.textCordS1, value.textCordS2, value.textCordS3], value.textureIndex);
		objectData.push(newFace);
	})

	//display that another object has been imported
	sceneData.push(objectData);
	objectAnimate.push({animate: false, rotation: false})
	console.log('copied!');
	document.getElementById('Vertex Count').textContent = "Vertex Count: " + vertexCount;
}
//Self import texture
function importTexture(path, ind, alphaPath=false){
	var Ctx = document.getElementById('texture')
	var C = Ctx.getContext('2d')
	//Get image
	var color = new Image();
	var alphaMask = new Image();
	alphaMask.onload = function() {
		//Adjust canvas size to fit
		Ctx.width = alphaMask.width;
		Ctx.height = alphaMask.height;
		C.drawImage(alphaMask, 0, 0);
		var alpha = C.getImageData(0, 0, color.width, color.height)
		Ctx.width = 1;
		Ctx.height = 1;
		color.onload = function() {
			//Adjust canvas size to fit
			Ctx.width = color.width;
			Ctx.height = color.height;
			C.drawImage(color, 0, 0);
			var temp = C.getImageData(0, 0, color.width, color.height)
			for(var i=0;i<temp.data.length;i+=4){
				temp.data[i+3]=alpha.data[i]
			}
			textures[ind] = {image: temp};
			Ctx.width = 1;
			Ctx.height = 1;
		};
	};
	alphaPath!=false? alphaMask.src = alphaPath: nothing()
	color.src = path;
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