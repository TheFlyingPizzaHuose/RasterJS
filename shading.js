import {vectorSubtract, vectorScalar, arrayEqual} from './math.js';

//Generates wireframe from 2d coordinates
function generateWireframe(coords, width, height){
    var line1 = [];
    if(checkTriangleCull(coords, width, height)){
        line1 = generateLine(coords[0], coords[1]);
        var line2 = generateLine(coords[0], coords[2]);
        var line3 = generateLine(coords[1], coords[2]);
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
function generateLine(point1, point2, cull=false, cull2=false, shadingMode=false){
    var result = [];

    //Gets slopes
    var difference = vectorSubtract(point2,point1);
    var slope = difference[0]/difference[1];

    //Gets begining coord
    var currentX = point1[0];
    var currentY = point1[1];

    //Interpolates
    if(arrayEqual(point1, point2)){
        result.push([parseInt(currentX), parseInt(currentY)]);
    }
    else if(shadingMode){
        var increment = Math.sign(difference[0]);
        for(var i = 0; i!=difference[0]; i+=increment){
            result.push([parseInt(currentX), parseInt(currentY)]);
            currentX+=increment;
            //Camera Culling
            if(cull != false){
                if(currentX < -cull && increment == -1){
                    break;
                }else if(currentX > cull && increment == 1){
                    break;
                }
            }
        }
        result.push([parseInt(currentX), parseInt(currentY)]);
    }else{
        var increment = Math.sign(difference[1]);
        slope = slope*increment;
        for(var i = 0; i!=difference[1]; i+=increment){
            result.push([parseInt(currentX), parseInt(currentY)]);
            currentX+=slope;
            currentY+=increment;
        }
        result.push([parseInt(currentX), parseInt(currentY)]);
    }
    return result;
}

//Generates a depth map based on 2d coordinates and 3d coordinates
function generateZMap(coords, shade, color, width, height){
    var shaded = vectorScalar(color, shade);
    shaded = [parseInt(shaded[0]), parseInt(shaded[1]), parseInt(shaded[2])];

    //Generates wirframe
    var lines = generateWireframe(coords, width, height);
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
        generateLine(arg1, arg2, width, height, true).forEach(value2=>{
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