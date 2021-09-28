//subtract vector 100%
function vectorSubtract(vector1, vector2){
	var result = [];
	vector1.forEach((value,i)=>{
		result.push(value - vector2[i]);
	})
	return result;
}

//subtract vector 100%
function vectorAdd(vector1, vector2){
	var result = [];
	vector1.forEach((value,i)=>{
		result.push(value + vector2[i]);
	})
	return result;
}

//gets distance of two points 100%
function vectorDistance(point1, point2){
	var sum = 0;
	point1.forEach((value,i)=>{
		sum+=Math.pow(value-point2[i], 2);
	})
	return sum;
}

//calculate crossProduct 100%
function crossProduct(vector1, vector2){
	var cX = vector1[1]*vector2[2] - vector1[2]*vector2[1];
	var cY = vector1[2]*vector2[0] - vector1[0]*vector2[2];
	var cZ = vector1[0]*vector2[1] - vector1[1]*vector2[0];
	return [cX,cY,cZ];
}

//calculate multiplying vector by scalar
function vectorScalar(vector1, mult){
	var result = [];
	vector1.forEach((value)=>{
		result.push(value*mult);
	})
	return result;
}

//dot product of 2 vectors
function dotProduct(vector1, vector2){
	var sum = 0;
	vector1.forEach((value, index)=>{
		sum+= value*vector2[index];
	})
	return sum;
}

//calculate angle between 2 vectors
function vectorsToAngle(vector1, vector2){
	var A = vectorMagnitude(vector1);
	var B = vectorMagnitude(vector2);
	return Math.acos(dotProduct(vector1, vector2)/(A*B));
}

//convert degrees to radians
function degToArc(angle){
	return angle*Math.PI/180;
}

//gets vector length
function vectorMagnitude(vector){
	var sum=0;
	vector.forEach(value=>{
		sum+=(value*value);
	})
	return Math.sqrt(sum);
}

//compares two arrays
function arrayEqual(arr1, arr2){
	var result = true;
	arr1.forEach((value, index)=>{
		if(value != arr2[index]){
			result = false; 
		}
	})
	return result;
}

//normalize vector
function normalize(vector1){
	var ratio = 1/Math.sqrt(Math.pow(vector1[0], 2), Math.pow(vector1[1], 2), Math.pow(vector1[2], 2));
	return vectorScalar(vector1, ratio);
}

//2d sort
function sort2d(a, b){
	if(a[0] === b[0]){
		return 0;
	}else{
		return (a[0] < b[0])? -1 : 1
	}
}

export {sort2d, normalize, arrayEqual, vectorMagnitude, dotProduct, vectorAdd, vectorSubtract, vectorScalar, vectorDistance, crossProduct, vectorsToAngle, degToArc};