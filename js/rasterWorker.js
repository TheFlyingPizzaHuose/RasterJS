//subtract vector 100%
function vectorSubtract(vector1, vector2){
	var result = [];
	vector1.forEach((value,i)=>{
		result.push(value - vector2[i]);
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

// worker.js
self.addEventListener('message', (event) => {
	const sharedArrayX = new Int16Array(event.data[0]);
	const sharedArrayY = new Int16Array(event.data[1]);
	const index = event.data[2]
	const vector1 = event.data[3]
	const cameraLocation = event.data[4]
	const cameraVector = event.data[5]
	const cameraPerpendicular = event.data[6]
	const width = event.data[7]
	const height = event.data[8]
	const cameraVer = event.data[9]
	var temp = vertexToPixel(vector1, cameraLocation, cameraVector, cameraPerpendicular, width, height, cameraVer)
	Atomics.store(sharedArrayX, index, temp[0]);
	Atomics.store(sharedArrayY, index, temp[1]);
}, false);


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
