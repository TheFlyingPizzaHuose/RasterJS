import {vectorSubtract, dotProduct, degToArc} from './math.js';

function camera2to3(cameraVector){
    var verticalShadow = Math.cos(degToArc(cameraVector[1]));
	return [Math.sin(degToArc(cameraVector[0]))*verticalShadow, 
            Math.cos(degToArc(cameraVector[0]))*verticalShadow, 
            Math.sin(degToArc(cameraVector[1]))]; //Direction
}

//Projects 3d points onto 2d camera: 36 steps
function vertexToPixel(vector1, cameraLocation, cameraVector, cameraPerpendicular, width, height, cameraVer){
    //Projected length : 1
    var relVec = vectorSubtract(vector1, cameraLocation);
    var ratio = dotProduct(relVec, cameraVector);
    if(ratio>=0){
        //Scaled vectors by ratio
        var temp = width/ratio
        var X = dotProduct(relVec, cameraPerpendicular)*temp+(width/2)
        var Y = dotProduct(relVec, cameraVer)*temp+(height/2)
        return [parseInt(X), parseInt(Y)];
    }else{
        return[width+1,width+1];
    }
}

export {camera2to3, vertexToPixel};