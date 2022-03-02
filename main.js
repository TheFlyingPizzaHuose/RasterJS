import {element} from './js/classes.js';
import {vertexToPixel} from './js/raster.js';
import * as objParse from './obj-file-parser/dist/OBJFile.js';
import {xyToIndex, degToArc, vectorAdd, vectorScalar, sort2dReverse, vectorDistance, vectorSubtract} from './js/math.js';
import {generateZMap} from './js/shading.js';

//###########################################Variables###########################################
//Config settings
var debugMode = false;
var frameCap = 1000/60
//Canvas variables
var ctx = document.getElementById('screen'), c = ctx.getContext("2d"), width = ctx.width, height = ctx.height;
var graph = document.getElementById('Frametime'),  graphc = document.getElementById('Frametime').getContext("2d");;
//Debug variables
var frameCounter=0,frameSinceLastTime=0,vertexCount=0,hasErr=false,countsSinceLastErr=0,showDebug=true, frameTimeGraph=[];
//Scene data variables
var elements=[],objectVerticies=[],objectAnimate=[],sortedIndexes=[],sunAngle=0,gamma=3;
//Texture variables
var textures=[],textCoords=[],
textureColorPaths=['./textures/fireball.png', 
				   './textures/Asteroid.png', 
				   './textures/fireball2.png', 
				   './textures/Earth.jpg', 
				   './textures/Dirt.jpg',
				   './textures/DirtAlpha.jpg', 
				   './textures/Moon.jpg',
				   './textures/Galaxy HDRI.jpg'],
textureAlphaPaths=['./textures/fireballAlpha.jpg',
				   './textures/AsteroidAlpha.jpg',
				   './textures/fireballAlpha.jpg',
				   './textures/EarthAlpha.jpg',
				   './textures/DirtAlpha.jpg',
				   './textures/DirtAlpha.jpg', 
				   './textures/MoonAlpha.jpg', 
				   './textures/Galaxy HDRIAlpha.jpg']
//Camera variables 
//var cameraPer=[0,1,0],cameraVector3=[-1,0,0],cameraVer=[0,0,-1],cameraLocation=[20,0,0],cameraLocationPrevious=[],fov=70,fovLength=1;
var cameraPer=[1,0,0],cameraVector3=[0,1,0],cameraVer=[0,0,-1],cameraLocation=[0,-200,0],cameraLocationPrevious=[],fov=70,fovLength=1;
//###########################################Variables###########################################

//Loading Screen
var load = new Image();
load.onload = function() {
	c.drawImage(load, 0, 0);
};
load.src = './textures/loading.png';
textureColorPaths.forEach((value,index)=>{
	importTexture(value, index, textureAlphaPaths[index])
})

selfImport({file: './models/Sun.obj', offset: [-3000,3000,1800], scale: 80, isEmmision: true, isBackground: true, textureIndex: 5});
selfImport({file: './models/Planet.obj', scale: 30, textureIndex: 3});
selfImport({file: './models/1.obj', LOD: [100000000,100000001], textureIndex: 4});
selfImport({file: './models/2.obj', LOD: [100000000,100000001], textureIndex: 4});
selfImport({file: './models/3.obj', LOD: [100000000,100000001], textureIndex: 4});
selfImport({file: './models/4.obj', LOD: [100000000,100000001], textureIndex: 4});
selfImport({file: './models/5.obj', LOD: [100000000,100000001], textureIndex: 4});
selfImport({file: './models/Planet.obj', offset: [500,1000,0], scale: 5, textureIndex: 6});

//Gives time for texture import
setTimeout(function(){
	//creates asteroid field
	for(var i=0; i<500; i++){
		var selectModel = parseInt(Math.random()*6)
		var distance = 70*((Math.random()+4)/5)
		var angle = Math.random()*2*Math.PI
		var position = [distance*Math.sin(angle), distance*Math.cos(angle), (Math.random()-0.5)*2]
		var lod = [0.0001,500]
		var sclrurer =  0.1*(Math.random()+1)/2
		switch(selectModel){
			case 1:
				copyPaste(elements[2], objectVerticies[2], position, sclrurer, false, false, lod, textCoords[2])
				break;
			case 2:
				copyPaste(elements[3], objectVerticies[3], position, sclrurer, false, false, lod, textCoords[3])
				break;
			case 3:
				copyPaste(elements[4], objectVerticies[4], position, sclrurer, false, false, lod, textCoords[4])
				break;
			case 4:
				copyPaste(elements[5], objectVerticies[5], position, sclrurer, false, false, lod, textCoords[5])
				break;
			case 5:
				copyPaste(elements[6], objectVerticies[6], position, sclrurer, false, false, lod, textCoords[6])
				break;
		}
		elements.push(new element({type: "particle",
								   size: 10, 
								   position: position, 
								   LOD: [500, 1000000], 
								   textureIndex: 1, 
								   isBackground: false}))
	}
	//creates dust field
	for(var i=0; i<2500; i++){
		var angle = Math.random()*2*Math.PI
		var colVaria = Math.random()*50-25, distance, position, color = [parseInt(255+colVaria), parseInt(240+colVaria), parseInt(150+colVaria)]
		switch(parseInt(Math.random()*3)){
			case 1:
				distance = 70*((Math.random()+4)/5)
				color = [parseInt(250+colVaria), parseInt(160+colVaria), parseInt(100+colVaria)]
			case 2:
				distance = 60*((Math.random()+4)/5)
			case 3:
				distance = 80*((Math.random()+4)/5)
				color = [parseInt(166+colVaria), parseInt(106+colVaria), parseInt(66+colVaria)]
		}
		elements.push(new element({type: "point",
								   size: 200000000, 
								   position: [distance*Math.sin(angle), distance*Math.cos(angle), (Math.random()-0.5)*2], 
								   color: color, 
								   LOD: false, 
								   isBackground: false}))
	}
	//Create starfield
	for(var i=0; i<4000; i++){
		elements.push(new element({type: "point",
										  size: 1, 
										  position: [Math.random()-0.5*1, Math.random()-0.5*1, Math.random()-0.5*1], 
							     		  color: [parseInt(Math.random()*255), parseInt(Math.random()*255), parseInt(Math.random()*255)],
										  LOD: false, 
										  isBackground: true}))
	}
	//Create larger stars
	for(var i=0; i<0; i++){
		var size = 30000*(Math.random()+2)/3, position = vectorScalar(camera2to3([Math.random()*360, Math.random()*360]), 200000),
			LOD = [0,200001]
		elements.push(new element({type: "particle", size: size, position: position, LOD: LOD, textureIndex: 0, isBackground: true}))
		elements.push(new element({type: "particle", size: size, position: position, LOD: LOD, textureIndex: 2, isBackground: true}))
	}
	fov = document.getElementById('fov').value
	//Begins render
	if(debugMode != false){ 
		for(var i=0; i<debugMode; i++){
			render()
		}
	}else{
		//Attemps to load previously unloaded textures
		setInterval(function(){
			textureColorPaths.forEach((value,index)=>{
				if(textures[index]==(null || undefined)){
					console.log('Trying to import texture again')
					importTexture(value, index, textureAlphaPaths[index])
				}
			})
		},10000)
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
			temp2.push([value.u, value.v]);
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

			//add face to elements
			objectData.push(new element({type: "face",
										 roughness:roughness, 
										 vs:indexes, 
										 verticies:temp, 
										 isEmmision:isEmmision, 
										 isBackground:isBackground, 
										 LOD:LOD, 
										 textCordS:coordindexes, 
										 textureIndex:textureIndex}));
		})

		//display that another object has been imported
		elements.push(objectData);
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
		//add face to elements
		var newFace = new element({type: "face",
								   roughness:3, 
								   vs: [value.v1, value.v2, value.v3], 
								   verticies:temp, 
								   isEmmision:isEmmision, 
								   isBackground:isBackground, 
								   LOD:LOD, 
								   textCordS: [value.textCordS1, value.textCordS2, value.textCordS3], 
								   textureIndex: value.textureIndex});
		objectData.push(newFace);
	})

	//display that another object has been imported
	elements.push(objectData);
	objectAnimate.push({animate: false, rotation: false})
	console.log('copied!');
	document.getElementById('Vertex Count').textContent = "Vertex Count: " + vertexCount;
}
//Self import texture
function importTexture(path, ind, alphaPath){
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
			textures[ind] = {image: temp, isUnloaded:false};
			Ctx.width = 1;
			Ctx.height = 1;
		};
	};
	alphaMask.src = alphaPath
	color.src = path;
	console.log('texture ' + path + ' imported');
}
//###########################################Import functions###########################################

//###########################################Render functions###########################################
//draw image on screen function 
function display(image){
	var canvasImage = c.createImageData(width, height);
	canvasImage.data.set(image);
	c.putImageData(canvasImage, 0, 0);
}
//Raster
function raster(){
	var TwoDemCoords = new Array(objectVerticies.length).fill([]).map((v, i)=>new Array(objectVerticies[i].length).fill(false));
	var cacldPairs = new Array(objectVerticies.length).fill({})
	var result = new Uint8ClampedArray((new Array(width*height*4).fill(0)))

	document.getElementById('Frames').textContent = "Frames: " + frameCounter + ' '

	//Additive Time Measument
	var times = {wireframe: 0}
	var start, end

	//Camera transform
	cameraMove();
	cameraRotate()
	var cameraVector=vectorScalar(cameraVector3, fovLength);

	//Sort triangles by distance
	if(cameraLocation != cameraLocationPrevious){
		cameraLocationPrevious = cameraLocation;
		sortedIndexes = [];
		var objectCount = 0
		elements.forEach((element, i1)=>{
			//Checks if element is a 3d object or particle
			if(Array.isArray(element)){
				element.forEach((face, i2)=>{
					if(face.lod(cameraLocation)){
						sortedIndexes.push([vectorDistance(cameraLocation, face.isBackground?[0,0,0]:face.center), i1, i2, objectCount])
					}
				})
				objectCount++
			}else{
				sortedIndexes.push([vectorDistance(cameraLocation, element.isBackground?[0,0,0]:element.position), i1])
			}
		})
	}
	sortedIndexes.sort(sort2dReverse);
	//Renders ordered by distance
	sortedIndexes.forEach((index)=>{
		//Wireframe and shading
		if(index.length == 4){
			var value = elements[index[1]][index[2]];
			//Backface cull & Distance cull
			if(value.backfaceCull(cameraVector, fov)){
				//Checks if model is in skybox
				var cameraLocation2 = value.isBackground? [0,0,0]: cameraLocation;
	
				//Get 2d coords  & Checks If Verts Have Been Calced
				var vertexes = [objectVerticies[index[3]][value.v1], objectVerticies[index[3]][value.v2], objectVerticies[index[3]][value.v3]];
				var coords = [];
				var thisObject = TwoDemCoords[index[3]];
				[value.v1, value.v2, value.v3].forEach((e, i)=>{
					coords[i] = thisObject[e] != false?  thisObject[e]:vertexToPixel(vertexes[i], cameraLocation2, cameraVector, cameraPer, width, height, cameraVer);
					TwoDemCoords[index[3]][e] = coords[i];
				})
	
				//Gets texture coordinates
				var verTexCoords = [textCoords[index[3]][value.textCordS1], textCoords[index[3]][value.textCordS2], textCoords[index[3]][value.textCordS3]];
				
				//Absent texture fallback
				var texture = textures[value.textureIndex]!=undefined?textures[value.textureIndex].image:{width:1,height:1,data:[255,0,255,255]}

				start = window.performance.now()
				var lines = generateZMap(coords, width, height, verTexCoords, texture.width, texture.height);
				end = window.performance.now()
				times.wireframe+=end-start
				
				//Checks if shading is off
				var shade = value.selfShade(sunAngle, gamma)

				lines.forEach((coord, y)=>{
					//Checks if coord is outside of view and clamps
					if(y<=height && y>=0){
						
						//Clamps X values
						var Xpos = coord[0][0]>width?width:coord[0][0]<0?0:coord[0][0]
						var Xpos2 = coord[0][1]>width?width:coord[0][1]<0?0:coord[0][1]
	
						//Unclamped Xpos to Dispos
						var temp= (y*width)
						var unclX = [(parseInt(coord[0][0])+temp)*4, (parseInt(coord[0][1])+temp)*4]
						var dispPoses = [(parseInt(Xpos)+temp)*4, (parseInt(Xpos2)+temp)*4]
						var texPos1, texPos2, texPosSlope
	
						//finds which xcoord is larger and reverses data
						if(dispPoses[0]>dispPoses[1]){
							dispPoses=[dispPoses[1],dispPoses[0]]
							texPos2 = coord[1][0]
							texPos1 = coord[1][1]
	
							temp = 4/(unclX[0]-unclX[1])
							texPosSlope=[(texPos2[0]-texPos1[0])*temp, (texPos2[1]-texPos1[1])*temp]
	
							temp = (Xpos2-coord[0][1])
						}else{
							texPos1 = coord[1][0]
							texPos2 = coord[1][1]
	
							temp = 4/(unclX[1]-unclX[0])
							texPosSlope=[(texPos2[0]-texPos1[0])*temp, (texPos2[1]-texPos1[1])*temp]
	
							temp = (Xpos-coord[0][0])
						}
						//Fixes texture warping near edges
						texPos1=[texPos1[0]+texPosSlope[0]*temp,texPos1[1]+texPosSlope[1]*temp]
	
						if(dispPoses[1]<result.length && (dispPoses[1]-dispPoses[0])>0){
							for(var i=dispPoses[0];i<dispPoses[1];i+=4){
								//Checks if pixel is empty
								if(result[i+3]==0){
									//Converts UV coordinates to pixel postions
									var temp=(parseInt(texPos1[0])+(parseInt(texPos1[1])*texture.width))*4
									result[i]  = texture.data[temp]*shade
									result[i+1]= texture.data[temp+1]*shade
									result[i+2]= texture.data[temp+2]*shade
									result[i+3]= texture.data[temp+3]
									texPos1=[texPos1[0]+texPosSlope[0],texPos1[1]+texPosSlope[1]]
								}else{
									texPos1=[texPos1[0]+texPosSlope[0],texPos1[1]+texPosSlope[1]]
								}
							}
						}
					}
				})
			}
		}else{
			var value = elements[index[1]];

			//Checks what type of particle value is
			if(value.type == "point"){
				//Renders stars
				var cameraLocation2 = !value.isBackground?cameraLocation:[0,0,0]
				var temp = value.lod(cameraLocation2)
				if(temp[0]){
					var coords = vertexToPixel(value.position, cameraLocation2, cameraVector, cameraPer, width, height, cameraVer);
					if(0 < coords[0] && coords[0] < width && 0 < coords[1] && coords[1] < height){	
						var displayPosition = xyToIndex(coords[0], coords[1], width)
						if (displayPosition<result.length && result[displayPosition+3]==0){
							result[displayPosition] = value.color[0]
							result[displayPosition+1] = value.color[1]
							result[displayPosition+2] = value.color[2]
							result[displayPosition+3] = value.isBackground?255:value.size/(Math.PI*2*temp[1]*(fov/360))
						}
					}
				}
			}else{
				//Renders particles
				var cameraLocation2 = !value.isBackground?cameraLocation:[0,0,0]
				var temp1 = value.lod(cameraLocation2);
				if(temp1[0] && textures[value.textureIndex] != undefined){
					var coords = vertexToPixel(value.position, cameraLocation2, cameraVector, cameraPer, width, height, cameraVer);
					//Checks if coord is outside of view
					if(0 < coords[0] && coords[0] < width && 0 < coords[1] && coords[1] < height){
						//Checks if texture exists
						var appSizeRatio = value.size/(Math.PI*2*temp1[1]*(fov/360))
						var texture = textures[value.textureIndex]!=undefined?textures[value.textureIndex]:{image:{width:1,height:1,data:[255,0,255,255]}},
						texHet = texture.image.height,
						texCol = texture.image.data,
						texWid = texture.image.width,
						apparentWidth = parseInt(appSizeRatio*texWid),
						apparentHeight = parseInt(appSizeRatio*texHet)
						//Puts the texture in result 
						for(var y=0;y<apparentHeight;y++){
							for(var x=0;x<apparentWidth;x++){
								//Checks for width overlap
								if(coords[0]+x<width){
									//Particle screen position
									var dispPos = xyToIndex(coords[0]+x, coords[1]+y ,width);
									//Texture position
									var texPos = xyToIndex(parseInt(x/apparentWidth * texWid), parseInt(y/apparentHeight * texHet), texWid)
									//Texture alpha check, out of index check, screen pixel is empty check
									if (dispPos<result.length && texCol[texPos + 3]>0 && result[dispPos+3]==0){
										result[dispPos]=texCol[texPos]
										result[dispPos+1]=texCol[texPos+1]
										result[dispPos+2]=texCol[texPos+2]
										result[dispPos+3]=255
									}
								}
							}
						}
					}
				}
			}
		}
	})

	//console.log(times)
	display(result);
}
//render method
function render(){	
	try{
		//Updates canvas resolution
		document.getElementById('resolutionX').onchange = ()=>{
			ctx.width = document.getElementById('resolutionX').value;
			width = ctx.width;
		}
		document.getElementById('resolutionY').onchange = ()=>{
			ctx.height = document.getElementById('resolutionY').value;
			height = ctx.height;
		}
		document.getElementById('fov').onchange = ()=>{
			fov = document.getElementById('fov').value
			fovLength = Math.tan(degToArc(fov/2));
		}
		//draws image
		var start = window.performance.now()
		raster();
		var end = window.performance.now()
		frameTimeGraph=[end-start, ...frameTimeGraph].slice(0,100)
		dispTime()

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
		document.getElementById('Frametimelabel').setAttribute('style', 'color: '+colorMode)
		try{
			document.getElementById('settings').setAttribute('style', 'display: '+displayMode)
		}catch{
		}
		document.getElementById('Frametime').setAttribute('style', 'display: '+displayMode)
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
//displays frametimes
function dispTime(){
	var result = new Uint8ClampedArray((new Array(graph.width*graph.height*4).fill(0)))
	var graphPeak = Math.max(...frameTimeGraph)
	var previousYval = graph.height-1
	for(var i=graph.width;i>=0;i--){
		var yValue = parseInt(graph.height*(1-frameTimeGraph[i]/graphPeak))
		if(yValue<previousYval){
			for(var x=yValue; x<previousYval;x++){
				result.set([255,0,0,255],xyToIndex(i,x, graph.width))
			}
			previousYval=yValue
		}else{
			result.set([255,0,0,255],xyToIndex(i,yValue, graph.width))
			previousYval=yValue
		}
	}
	var canvasImage = graphc.createImageData(graph.width, graph.height);
	canvasImage.data.set(result);
	graphc.putImageData(canvasImage, 0, 0);
}
//###########################################Render functions###########################################

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

function nothing(){
}
