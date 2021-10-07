import {vectorSubtract, dotProduct, vectorScalar, degToArc} from './math.js';

function camera2to3(cameraVector){
    var verticalShadow = Math.cos(degToArc(cameraVector[1]));
	return [Math.sin(degToArc(cameraVector[0]))*verticalShadow, 
            Math.cos(degToArc(cameraVector[0]))*verticalShadow, 
            Math.sin(degToArc(cameraVector[1]))]; //Direction
}

function camera2ToPerpendicular(cameraVector){
	return [Math.sin(degToArc(cameraVector[0] + 90)), 
            Math.cos(degToArc(cameraVector[0] + 90)), 
            0]; //Perpendicular
}

//Projects 3d points onto 2d camera: 36 steps
function vertexToPixel(vector1, cameraLocation, cameraVector, cameraPerpendicular, width, height, cameraVer){
    //Projected length : 1
    var relVec = vectorSubtract(vector1, cameraLocation);
    var ratio = dotProduct(relVec, cameraVector);
    if(ratio>=0){
        //Scaled vectors by ratio
        var rat1 = vectorScalar(cameraVector, ratio);
        var onPlane = vectorSubtract(relVec, rat1)
        var temp = width/ratio
        var X = dotProduct(onPlane, cameraPerpendicular)*temp
        var Y = dotProduct(onPlane, cameraVer)*temp
        return [parseInt(X+(width/2)), parseInt(Y+(height/2))];
    }else{
        return[width,width];
    }
}

export {camera2to3, vertexToPixel, camera2ToPerpendicular};