import {vectorSubtract, vectorScalar, arrayEqual, vectorAdd} from './math.js';

//Generates wireframe from 2d coordinates
function generateWireframe(coords, width, height){
    var line1 = [];
    if(checkTriangleCull(coords, width, height)){
        line1 = generateLine(coords[0], coords[1], width);
        var line2 = generateLine(coords[0], coords[2], width);
        var line3 = generateLine(coords[1], coords[2], width);
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
function generateLine(point1, point2, cull=false, shadingMode=false){
    var result = [];
    //Gets differences
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
    }else{
        var increment = Math.sign(difference[1]);
        slope = slope*increment;
        for(var i=point1[1]; i!=point2[1]+increment; i+=increment){
            result.push([parseInt(currentX), parseInt(i)]);
            currentX+=slope;
        }
    }
    return result;
}

//Generates a depth map based on 2d coordinates and 3d coordinates
function generateZMap(coords, shade, color, width, height, workers){
    var shaded = vectorScalar(color, shade);
    shaded = [parseInt(shaded[0]), parseInt(shaded[1]),parseInt(shaded[2]), 255]

    //Generates wirframe
    var lines = new Int32Array(new ArrayBuffer(16))
    lines = generateWireframe(coords, width, height);

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
    //Create shared buffers
    /*var bufferLength = Int32Array.BYTES_PER_ELEMENT * pairs.length;
    const sharedBuffer = new SharedArrayBuffer(bufferLength);
    const pairBuffer = new SharedArrayBuffer(bufferLength);
    var pairs2 = new Int32Array(sharedBuffer);
    pairs.forEach((value, index)=>{
        Atomics.store(pairs2, index, value)
    })

    //Creates web workers
    var w1 = workers[0];
    var w2 = workers[1];
    var w3 = workers[2];
    var w4 = workers[3];*/


    //Interpolate pairs and run workers
    /*for(var i=0; i<pairs.length; i+=4){
        if(pairs[i] != undefined){
            w1.postMessage([sharedBuffer, pairs2, width]);
        }
        if(pairs[i+1] != undefined){
            w2.postMessage([sharedBuffer, pairs2, width]);
        }
        if(pairs[i+2] != undefined){
            w3.postMessage([sharedBuffer, pairs2, width]);
        }
        if(pairs[i+3] != undefined){
            w4.postMessage([sharedBuffer, pairs2, width]);
        }
    }*/

    //Interpolate pairs
    pairs.forEach(value=>{
        //Rearrange data (cuz my brain can't be bothered to write it in 1 line)
        var arg1 = [value[0][0], value[0][1]];
        var arg2 = [value[1][0], value[1][1]];
        generateLine(arg1, arg2, width, true).forEach(value2=>{
            lines.push(value2);
        })
    })
    
    //Get distances
    lines.forEach((value,index)=>{
        lines[index][2] = shaded
    })
    return lines;
}

export {generateZMap, generateWireframe};