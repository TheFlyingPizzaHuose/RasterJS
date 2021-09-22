//degrees to radians 100%
function degToArc(degree){
	return Math.PI*degree/180;
}

//fast sine, tangent and cosine initilization 100%
function fastSinCosTanInitialize(resolutionX, fov){
	var result = [[], [], []];
	var accuracy = fov/resolutionX;
	for(var i=0; i <= Math.round(360/accuracy); i++){

		//calculates sin
		result[0][i] = parseFloat(Math.sin(degToArc(i*accuracy)).toFixed(5));

		//calculates cos
		result[1][i] = parseFloat(Math.cos(degToArc(i*accuracy)).toFixed(5));

		//calculates tan^-1 fraction
		result[2][i] = parseFloat((result[0][i]/result[1][i]).toFixed(5));
	}
    console.log('fastSinCosTan initialize done');
	return result;
}

const temp = fastSinCosTanInitialize(854, 20);
const sinTable = temp[0];
const cosTable = temp[1];
const tanTable = temp[2];

//fast arctangent method WIP
function fastAtan(fraction, table){
	var result = 0;
	var temp = 1;
	for(var i = 0; i < table.length; i++){
		var temp2 = Math.abs(table[i] - fraction);
		if(temp2 < temp){
			temp = temp2;
			result = (360/table.length) * i;
		}
	}
	return result;
}

//fast sine method 100%
function fastSin(angle, table){
	var angle2;
	if(angle < 0){
		angle2 = 360 - Math.abs(angle)%360;
	}else if(angle > 360){
		angle2 = angle%360;
	}else{
		angle2 =  angle;
	}
	return table[parseInt(angle2/(360/table.length))];
}

//fast cosine method 100%
function fastCos(angle, table){
	var angle2;
	if(angle < 0){
		angle2 = 360 - Math.abs(angle)%360;
	}else if(angle > 360){
		angle2 = angle%360;
	}else{
		angle2 =  angle;
	}
	return table[parseInt(angle2/(360/table.length))];
}

export {fastAtan, fastSin, fastCos, degToArc, sinTable, cosTable, tanTable};