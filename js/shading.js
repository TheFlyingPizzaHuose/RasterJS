import {sort2dReverse, vectorSubtract, vectorScalar, vectorAdd} from './math.js';

//Checks if entire triangle is outside of camera frustum
function checkTriangleCull(coords, cull, cull2){
    var xcoords = coords.map(value=>value[0])
    var ycoords = coords.map(value=>value[1])
    var maxY = Math.max(...ycoords)
    var maxX = Math.max(...xcoords)
    var minY = Math.min(...ycoords)
    var minX = Math.min(...xcoords)
    return (maxY>cull2 && minY>cull2) || (maxX>cull && minX>cull) || (maxY<0 && minY<0) || (maxX<0 && minX<0) || (maxX-minX>cull*2)? false:true
}

//Generates an array of pairs defining the lines that comprise the triangle on the screen
function generateZMap(coords, width, height, textCoords, texWid, texHet){
    if(checkTriangleCull(coords, width, height)){
        //Generates wirframe
        var pairs = []
        //Sorts screen positions and texture coordinates according to y screen positions
        var sortedCoords = coords.map((value, index) => [value[1], value[0], textCoords[index]]).sort(sort2dReverse)

        //Array of y coordinates moved down till smallest value is 0
        var ycoords = sortedCoords.map(array=>array[0])

        //Array of x coordinates
        var xcoords = sortedCoords.map(array=>array[1])

        //Array of  texutre coordinates
        var texCordStart = sortedCoords.map(array=>[array[2][0]*texWid, texHet*(1-array[2][1])])

        //Slopes per pair of coordinates
        var slopes = [1,2,2].map((v,i)=>(xcoords[v]-xcoords[i<2?0:1])/(ycoords[v]-ycoords[i<2?0:1]))
        var texCordSlopes = [1,2,2].map((v,i)=>vectorScalar(vectorSubtract(texCordStart[v], texCordStart[i<2?0:1]), 1/(ycoords[v]-ycoords[i<2?0:1])))

        //Array of starting screen and UV positions
        xcoords = [0,0,1].map(v=>xcoords[v])
        texCordStart = [0,0,1].map(v=>texCordStart[v])

        //Interpolate and store to index corresponding to y value
        for(var x=0;x<3;x++){
            for(var i=ycoords[x<2?0:1]; i<ycoords[x<1?1:2]; i++){
                pairs[i]=pairs[i]==undefined?[[],[]]:pairs[i]
                if(ycoords[x<1?1:2]-ycoords[x<2?0:1]>height*3){
                    return [];
                }else{
                    pairs[i][0].push(xcoords[x])
                    pairs[i][1].push(texCordStart[x])
                    texCordStart[x]=vectorAdd(texCordStart[x], texCordSlopes[x])
                    xcoords[x]+=slopes[x]
                }
            }
        }
        return pairs;
    }else{
        return [];
    }
}

export {generateZMap, checkTriangleCull};