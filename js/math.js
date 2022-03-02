//subtract vector 100%
function vectorSubtract(vector1, vector2){return vector1.map((value, index)=> value-vector2[index]);}

//subtract vector 100%
function vectorAdd(vector1, vector2){return vector1.map((value, index)=> value+vector2[index]);}

//gets distance of two points PIECEWISE 100%
function vectorDistance(point1, point2){return point1.map((v,i)=>Math.pow(point2[i]-v,2)).reduce((prev,v)=>prev+v);}

//gets distance of two points true 100%
function vectorDistanceTrue(point1, point2){return Math.sqrt(point1.map((v,i)=>Math.pow(point2[i]-v,2)).reduce((prev,v)=>prev+v));}

//calculate crossProduct 100%
function crossProduct(vector1, vector2){
	vector1=vector1.map((v,i)=>v*vector2[i<2?i+1:0] - vector1[i<2?i+1:0]*vector2[i])
	return [vector1[1],vector1[2],vector1[0]];
}

//calculate multiplying vector by scalar
function vectorScalar(vector1, mult){return vector1.map(value=> value*mult);}

//dot product of 2 vectors
function dotProduct(vector1, vector2){return vector1.map((v,i)=>v*vector2[i]).reduce((prev,v)=>prev+v);}

//calculate angle between 2 vectors
function vectorsToAngle(vector1, vector2){
	var A = vectorMagnitude(vector1);
	var B = vectorMagnitude(vector2);
	return Math.acos(dotProduct(vector1, vector2)/(A*B));
}

//convert degrees to radians
function degToArc(angle){return angle*Math.PI/180;}

//gets vector length
function vectorMagnitude(vector){return Math.sqrt(vector.map(v=>Math.pow(v,2)).reduce((prev,v)=>prev+v));}

//compares two arrays
function arrayEqual(arr1, arr2){
	arr1.forEach((value, index)=>{if(value!=arr2[index]){return false}})
	return true
}

//normalize vector
function normalize(vector1){return vectorScalar(vector1, 1/vectorMagnitude(vector1))}

//2d sort
function sort2d(a, b){
	if(a[0] === b[0]){
		return 0;
	}else{
		return (a[0] > b[0])? -1 : 1
	}
}

//2d sort
function sort2dReverse(a, b){
	if(a[0] === b[0]){
		return 0;
	}else{
		return (a[0] < b[0])? -1 : 1
	}
}

//Converts 3d coordinates to spherical coordinates
function vector3to2(vector1){return [Math.atan(vector1[1]/vector1[0]), Math.atan(vector1[2]/vectorMagnitude([vector1[0], vector1[1]]))]}

//Clamps values
function clamp(min, max, val){return val>max?max:val<min?min:val}

//Converts X,Y values to index value
function xyToIndex(X,Y,width){return (X+(Y*width))*4}

export {xyToIndex, sort2dReverse, clamp, vectorDistanceTrue, vector3to2, sort2d, normalize, arrayEqual, vectorMagnitude, dotProduct, vectorAdd, vectorSubtract, vectorScalar, vectorDistance, crossProduct, vectorsToAngle, degToArc};