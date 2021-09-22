import {vectorSubtract, vectorsToAngle, dotProduct, vectorDistance, vectorScalar, degToArc, vectorMagnitude} from './math.js';

function camera2to3(cameraVector){
    var verticalShadow = Math.cos(degToArc(cameraVector[1]));
	return [Math.sin(degToArc(cameraVector[0]))*verticalShadow, 
            Math.cos(degToArc(cameraVector[0]))*verticalShadow, 
            Math.sin(degToArc(cameraVector[1]))]; //Direction
}

function camera2ToPerpendicular(cameraVector){
    var verticalShadow = Math.cos(degToArc(cameraVector[2]));
	return [verticalShadow*Math.sin(degToArc(cameraVector[0] + 90)), 
            verticalShadow*Math.cos(degToArc(cameraVector[0] + 90)), 
            Math.sin(degToArc(cameraVector[2]))]; //Perpendicular
}

function degPerpendicular(A, B, vector3){
    var projectedPercent = dotProduct(A, B)/Math.pow(vectorMagnitude(B),2);
    var projectedVector = vectorScalar(B, projectedPercent);
    var perpendicular = vectorSubtract(A, projectedVector);
    return vectorsToAngle(perpendicular, vector3);
}

//Projects 3d points onto 2d camera
function vertexToPixel(vector1, cameraLocation, cameraVector, cameraPerpendicular, fov, width, cameraVertical){
    var result = [];
    var vector1 = vectorSubtract(vector1, cameraLocation);
    var mag = vectorsToAngle(vector1, cameraVector)*180/Math.PI/(fov/2)*(width/2);
    var angle = degPerpendicular(vector1, cameraVector, cameraPerpendicular);
    var sign = Math.sign(dotProduct(cameraVertical, vector1));
    result = [parseInt(Math.cos(angle)*mag), 
              parseInt(Math.sin(angle*sign)*mag)];
    return result;
}

export {camera2to3, vertexToPixel, camera2ToPerpendicular};