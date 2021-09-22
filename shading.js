import {vectorSubtract, vectorAdd, vectorScalar, vectorDistance, arrayEqual, vectorsToAngle} from './math.js';

//Generates wireframe from 2d coordinates
function generateWireframe(coords, verticies, width, height){
    var line1 = [];
    if(checkTriangleCull(coords, width, height)){
        line1 = generateLine(coords[0], coords[1], verticies[0], verticies[1]);
        var line2 = generateLine(coords[0], coords[2], verticies[0], verticies[2]);
        var line3 = generateLine(coords[1], coords[2], verticies[1], verticies[2]);
        line2.forEach(value=>{
            line1.push(value);
        })
        line3.forEach(value=>{
            line1.push(value);
        })
    }
    return line1;
}

//Checks if entire triangle is outside of camera frustum
function checkTriangleCull(coords, cull, cull2){
    if((coords[0][0] < -cull || coords[0][0] > cull ||
       coords[0][1] < -cull2 || coords[0][1] > cull2) &&
       (coords[1][0] < -cull || coords[1][0] > cull ||
       coords[1][1] < -cull2 || coords[1][1] > cull2) &&
       (coords[2][0] < -cull || coords[2][0] > cull ||
       coords[2][1] < -cull2 || coords[2][1] > cull2)){
        return false;
    }else{
        return true;
    }
}

//Interpolates between two points and returns the values
function generateLine(point1, point2, vector1, vector2, cull=false, cull2=false, shadingMode=false){
    var result = [];

    //Gets slopes
    var difference = vectorSubtract(point2,point1);
    var vector3 = vectorSubtract(vector2, vector1);
    var slope = difference[0]/difference[1];

    //Gets begining coord
    var interPerc = 0;
    var currentX = point1[0];
    var currentY = point1[1];

    //Interpolates
    if(arrayEqual(point1, point2)){
        result.push([parseInt(currentX), parseInt(currentY), 0, vector1, vector3]);
    }
    else if(shadingMode){
        var increment = Math.sign(difference[0]);
        var percInc = increment/difference[0];
        for(var i = 0; i!=difference[0]; i+=increment){
            result.push([parseInt(currentX), parseInt(currentY), interPerc, vector1, vector3]);
            currentX+=increment;
            interPerc+=percInc;
            //Camera Culling
            if(cull != false){
                if(currentX < -cull && increment == -1){
                    break;
                }else if(currentX > cull && increment == 1){
                    break;
                }
            }
        }
        result.push([parseInt(currentX), parseInt(currentY), interPerc, vector1, vector3]);
    }else{
        var increment = Math.sign(difference[1]);
        slope = slope*increment;
        var percInc = increment/difference[1];
        for(var i = 0; i!=difference[1]; i+=increment){
            result.push([parseInt(currentX), parseInt(currentY), interPerc, vector1, vector3]);
            currentX+=slope;
            currentY+=increment;
            interPerc+=percInc;
        }
        result.push([parseInt(currentX), parseInt(currentY), interPerc, vector1, vector3]);
    }
    return result;
}

//Generates a depth map based on 2d coordinates and 3d coordinates
function generateZMap(coords, verticies, shade, color, width, height){
    var shaded = vectorScalar(color, shade);
    shaded = [parseInt(shaded[0]), parseInt(shaded[1]), parseInt(shaded[2])];

    //Generates wirframe
    var lines = generateWireframe(coords, verticies, width, height);
    var lines2 = [];

    var pairs = [];
    //Find pairs
    lines.forEach((value, index)=>{
        for(var i = index+1; i < lines.length; i++){
            if(value[1] == lines[i][1]){
                pairs.push([value, lines[i]]);
            }else if(i == lines.length){
                pairs.push([value, value]);
            }
        }
    })
    //Interpolate pairs
    pairs.forEach(value=>{
        //Rearrange data (cuz my brain can't be bothered to write it in 1 line)
        var arg1 = [value[0][0], value[0][1]];
        var arg2 = [value[1][0], value[1][1]];
        var arg3 = vectorAdd(value[0][3],vectorScalar(value[0][4], value[0][2]));
        var arg4 = vectorAdd(value[1][3],vectorScalar(value[1][4], value[1][2]));
        generateLine(arg1, arg2, arg3, arg4, width, height, true).forEach(value2=>{
            lines2.push(value2);
        })
    })

    
    //Get distances
    lines2.forEach((value,index)=>{
        lines2[index][5] = shaded;
    })

    return lines2;
}

export {generateZMap, generateWireframe};