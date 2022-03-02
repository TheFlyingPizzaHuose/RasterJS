import {vectorSubtract, crossProduct, normalize, vectorScalar, vectorAdd, vectorDistance, vectorDistanceTrue, vectorsToAngle} from'./math.js';
import {camera2to3} from './raster.js'

class element{
    constructor(inputObject){
        switch(inputObject.type){
            case "face":
                //Vertex data
                var temp = inputObject.vs
                this.v1 = temp[0];
                this.v2 = temp[1];
                this.v3 = temp[2];

                //Texture data
                temp = inputObject.textCordS
                this.textCordS1 = temp[0];
                this.textCordS2 = temp[1];
                this.textCordS3 = temp[2];
                this.textureIndex = inputObject.textureIndex

                //Render data
                temp = inputObject.verticies
                var e1 = vectorSubtract(temp[this.v2], temp[this.v1]);
                var e2 = vectorSubtract(temp[this.v3], temp[this.v1]);
                this.normal = normalize(crossProduct(e2, e1));
                this.center = vectorScalar(vectorAdd(vectorAdd(temp[this.v1], temp[this.v2]), temp[this.v3]), 1/3);
                this.isBackground = inputObject.isBackground

                //Material Properties
                this.roughness = inputObject.roughness;
                this.isEmmision = inputObject.isEmmision;

                //Type functions  
                this.lod = function(cameraLocation){
                    if(this.minLod==false){
                        return true
                    }else{
                        var dist = vectorDistance(this.center, cameraLocation)
                        return  dist>this.minLod && dist<this.maxLod? true: false
                    }
                }
                this.backfaceCull = function(cameraVector, fov){
                    return vectorsToAngle(cameraVector, this.normal)/Math.PI < (0.5+(fov/360))
                }
                this.selfShade = function(sunAngle, gamma){
                    return this.isEmmision? gamma: gamma/1.1*((vectorsToAngle(this.normal, camera2to3([sunAngle, 0]))/Math.PI)-0.5);
                }
                break;
            case "point":    
                this.size = inputObject.size    
                this.position = inputObject.position
                this.isBackground = inputObject.isBackground
                this.color = inputObject.color
                break;
            case "particle":  
                this.size = inputObject.size
                this.position = inputObject.position
                this.isBackground = inputObject.isBackground
                this.textureIndex = inputObject.textureIndex;
                break;
        }    
        //Sets element type
        this.type = inputObject.type
        //Gets LOD
        if(inputObject.LOD != false){
            this.minLod = inputObject.LOD[0]; 
            this.maxLod = inputObject.LOD[1];
        }else{
            this.minLod= false;
        }
        //Particle/point lod function
        if(this.size != undefined){
            this.lod = function(cameraLocation){
                if(this.minLod==false){
                    return [true, vectorDistance(this.position, cameraLocation)]
                }else{
                    var dist = vectorDistance(this.position, cameraLocation)
                    return [(dist>this.minLod && dist<this.maxLod)? true: false, dist]
                }
            }
        }
    }
}

export {element};