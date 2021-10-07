onmessage = function(e){
    //console.log(e.data[1])
}


//Interpolates between two points and returns the values
function generateLine(point1, point2, cull=false, shadingMode=false){
    var result = [];

    //Gets begining coord
    var currentX = point1[0];

    //Interpolates
    if(arrayEqual(point1, point2)){
        result.push([parseInt(currentX), parseInt(currentY)]);
    }
    else{
        var increment = Math.sign(difference[0]);
        for(var i = point1[0]+=increment; i!=point2[0]; i+=increment){
            result.push([parseInt(i), currentY]);
            //Camera Culling
            if(cull != false){
                if(currentX < -cull && increment == -1){
                    break;
                }else if(currentX > cull && increment == 1){
                    break;
                }
            }
        }
    }
    return result;
}