import {vectorSubtract, crossProduct, normalize, vectorScalar, vectorAdd, vectorDistance, vectorDistanceTrue, vectorsToAngle} from'./math.js';
import {camera2to3} from './raster.js'

class face{
    constructor(roughness, vS, verticies, isEmmision, isBackground, LOD, textCordS, textureIndex){
        this.roughness = roughness;
        this.v1 = vS[0];
        this.v2 = vS[1];
        this.v3 = vS[2];
        this.textCordS1 = textCordS[0];
        this.textCordS2 = textCordS[1];
        this.textCordS3 = textCordS[2];
        this.textureIndex = textureIndex
        this.e1 = vectorSubtract(verticies[this.v2], verticies[this.v1]);
        this.e2 = vectorSubtract(verticies[this.v3], verticies[this.v1]);
        this.normal = normalize(crossProduct(this.e2, this.e1));
        this.center = vectorScalar(vectorAdd(vectorAdd(verticies[this.v1], verticies[this.v2]), verticies[this.v3]), 1/3);
        this.isEmmision = isEmmision;
        this.isBackground = isBackground
        if(LOD != false){
            this.minLod = LOD[0]*LOD[0]; 
            this.maxLod = LOD[1]*LOD[1];
        }else{
            this.minLod= false;
        }
    }
    get lod(){
        return this.lod();
    }
    get backfaceCull(){
        return this.backfaceCull()
    }
    get selfShade(){
        return this.selfShade()
    }
    lod(cameraLocation){
        if(this.minLod==false){
            return true
        }else{
            var dist = vectorDistance(this.center, cameraLocation)
            return  dist>this.minLod && dist<this.maxLod? true: false
        }
    }
    backfaceCull(cameraVector, fov){
        return vectorsToAngle(cameraVector, this.normal)/Math.PI < (0.5+(fov/360))
    }
    selfShade(sunAngle, gamma){
        return this.isEmmision? gamma: gamma/(1+Math.exp((vectorsToAngle(this.normal, camera2to3([-50, sunAngle]))/Math.PI)*this.roughness));
    }
}

class particle{
    constructor(size, position, LOD, textureIndex, isBackground){
        this.size=size
        this.position=position
        this.isBackground=isBackground
        this.textureIndex = textureIndex;
        if(LOD==false){
            this.minLod=false
        }else{
            this.minLod=LOD[0] 
            this.maxLod=LOD[1]
        }
    }   
    get lod(){
        return this.lod();
    }
    lod(cameraLocation){
        if(this.minLod==false){
            return [true, vectorDistanceTrue(this.position, cameraLocation)]
        }else{
            var dist = vectorDistanceTrue(this.position, cameraLocation)
            return [(dist>this.minLod && dist<this.maxLod)? true: false, dist]
        }
    }
}

export {face, particle};