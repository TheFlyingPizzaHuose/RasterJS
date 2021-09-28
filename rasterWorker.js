//subtract vector 100%
function vectorSubtract(vector1, vector2){
	var result = [];
	vector1.forEach((value,i)=>{
		result.push(value - vector2[i]);
	})
	return result;
}
//gets vector length
function vectorMagnitude(vector){
	var sum=0;
	vector.forEach(value=>{
		sum+=(value*value);
	})
	return Math.sqrt(sum);
}
//calculate angle between 2 vectors
function vectorsToAngle(vector1, vector2){
	var A = vectorMagnitude(vector1);
	var B = vectorMagnitude(vector2);
	return Math.acos(dotProduct(vector1, vector2)/(A*B));
}
//calculate multiplying vector by scalar
function vectorScalar(vector1, mult){
	var result = [];
	vector1.forEach((value)=>{
		result.push(value*mult);
	})
	return result;
}
function degPerpendicular(A, B, vector3){
    var projectedPercent = dotProduct(A, B)/Math.pow(vectorMagnitude(B),2);
    var projectedVector = vectorScalar(B, projectedPercent);
    var perpendicular = vectorSubtract(A, projectedVector);
    return vectorsToAngle(perpendicular, vector3);
}
//dot product of 2 vectors
function dotProduct(vector1, vector2){
	var sum = 0;
	vector1.forEach((value, index)=>{
		sum+= value*vector2[index];
	})
	return sum;
}

onmessage = function(e){
    var verticies = e.data[0];
    var cameraLocation = e.data[1];
    var cameraVector = e.data[2];
    var cameraPerpendicular = e.data[3];
    var fov = e.data[4];
    var width = e.data[5];
    var cameraVertical = e.data[6];
    var result = [];
    verticies.forEach((value)=> {
        var vector1 = vectorSubtract(value, cameraLocation);
        var mag = vectorsToAngle(vector1, cameraVector)*180/Math.PI/(fov/2)*(width/2);
        var angle = degPerpendicular(vector1, cameraVector, cameraPerpendicular);
        var sign = Math.sign(dotProduct(cameraVertical, vector1));
        result.push([parseInt(Math.cos(angle)*mag), 
                     parseInt(Math.sin(angle*sign)*mag)]);
    });
    postMessage(result);
}