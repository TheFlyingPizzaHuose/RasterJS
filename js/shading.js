import {arrayEqual} from './math.js';

//Generates wireframe from 2d coordinates
function generateWireframe(coords, width, height){
    var line1 = [];
    if(checkTriangleCull(coords, width, height)){
        line1 = generateLine(coords[0], coords[1], height);
        var line2 = generateLine(coords[0], coords[2], height);
        var line3 = generateLine(coords[1], coords[2], height);
        line1[0] = (line1[0].concat(line2[0])).concat(line3[0])
        line1[1] = (line1[1].concat(line2[1])).concat(line3[1])
    }
    return line1;
}

//Checks if entire triangle is outside of camera frustum
function checkTriangleCull(coords, cull, cull2){
    var xcoords = [coords[0][0],coords[1][0],coords[2][0]]
    var ycoords = [coords[0][1],coords[1][1],coords[2][1]]
    var maxY = Math.max(...ycoords)
    var maxX = Math.max(...xcoords)
    var minY = Math.min(...ycoords)
    var minX = Math.min(...xcoords)
    if((maxY>cull2 && minY>cull2) || (maxX>cull && minX>cull) || (maxY<0 && minY<0) || (maxX<0 && minX<0)){
        return false
    }else{
        return true
    }
}

//Interpolates between two points and returns the values
function generateLine(point1, point2, cull){
    var result = [[],[]];

    //Interpolates
    if(arrayEqual(point1, point2)){
        result[0]=[parseInt(point1[0])]
        result[1]=[parseInt(point1[1])];
    }else{
        //Gets begining coord
        var currentX = point2[1]>point1[1]?point1[0]:point2[0]
        var currentY=point2[1]>point1[1]?point1[1]:point2[1]
        var xend = point2[1]>point1[1]?point2[0]:point1[0]
        var yend = point2[1]>point1[1]?point2[1]:point1[1]
        var slope = (xend-currentX)/(yend-currentY)
        if(yend-currentY<cull*2){
            for(var i=currentY; i<=yend; i++){
                result[0].push(parseInt(currentX));
                result[1].push(parseInt(i))
                currentX+=slope;
            }
        }
    }
    return result;
}

//Generates a depth map based on 2d coordinates and 3d coordinates
function generateZMap(coords, width, height){

    //Generates wirframe
    var lines = [[],[]]
    var temp = generateWireframe(coords, width, height);
    lines[0] = lines[0].concat(temp[0])
    lines[1] = lines[1].concat(temp[1])

    var pairs = [];
    //Find pairs
    lines[1].forEach((value, index)=>{
        for(var i = index+1; i < lines[1].length; i++){
            if(value == lines[1][i]){
                pairs.push([lines[0][index], lines[0][i], value]);
                break;
            }else if(i == lines[1].length){
                pairs.push([lines[0][index], lines[0][index], value]);
                break;
            }
        }
    })

    return pairs;
}

export {generateZMap, generateWireframe, checkTriangleCull};