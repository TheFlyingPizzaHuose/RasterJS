import {sort2dReverse, vectorSubtract, vectorScalar, vectorAdd} from './math.js';

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

//Generates an array of pairs defining the lines that comprise the triangle on the screen
function generateZMap(coords, width, height, textCoords){
    if(checkTriangleCull(coords, width, height)){
        //Generates wirframe
        var pairs = []
        var finalTexCords = []
        //Sorts screen positions and texture coordinates according to y screen positions
        var sortedCoords = coords.map((value, index) => [value[1], [value[0], textCoords[index]]]).sort(sort2dReverse)
        var ycoords = [sortedCoords[0][0],sortedCoords[1][0],sortedCoords[2][0]]
        var xcoords = [sortedCoords[0][1][0],sortedCoords[1][1][0],sortedCoords[2][1][0]]
        var texCordStart = [sortedCoords[0][1][1],sortedCoords[1][1][1],sortedCoords[2][1][1]]
        var slopes = [(xcoords[1]-xcoords[0])/(ycoords[1]-ycoords[0]), 
                      (xcoords[2]-xcoords[0])/(ycoords[2]-ycoords[0]),
                      (xcoords[2]-xcoords[1])/(ycoords[2]-ycoords[1])]
        var texCordSlopes = [vectorScalar(vectorSubtract(texCordStart[1], texCordStart[0]), 1/(ycoords[1]-ycoords[0])),
                             vectorScalar(vectorSubtract(texCordStart[2], texCordStart[0]), 1/(ycoords[2]-ycoords[0])),
                             vectorScalar(vectorSubtract(texCordStart[2], texCordStart[1]), 1/(ycoords[2]-ycoords[1])),]
        xcoords = [sortedCoords[0][1][0],sortedCoords[0][1][0],sortedCoords[1][1][0]]
        texCordStart = [sortedCoords[0][1][1],sortedCoords[0][1][1],sortedCoords[1][1][1]]
        var minY = Math.min(...ycoords)
        for(var x=0;x<3;x++){
            for(var i=ycoords[x<2?0:1]-minY; i<ycoords[x<1?1:2]-minY; i++){
                if(ycoords[x<1?1:2]-minY>height*2){
                    break;
                }else{
                    pairs[i] != undefined? pairs[i].push(parseInt(xcoords[x])):pairs[i] = [parseInt(xcoords[x])]
                    finalTexCords[i] != undefined? finalTexCords[i].push(texCordStart[x]):finalTexCords[i] = [texCordStart[x]]
                    texCordStart[x] = vectorAdd(texCordStart[x], texCordSlopes[x])
                    xcoords[x]+=slopes[x]
                }
            }
        }
        pairs = pairs.map((value,index) => value.concat(finalTexCords[index].concat([index+minY])))
        return pairs;
    }else{
        return [];
    }
}

export {generateZMap, checkTriangleCull};