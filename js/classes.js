import {vectorSubtract, crossProduct, normalize, vectorScalar, vectorAdd, vectorDistance} from'./math.js';

class face{
    constructor(roughness, color, vS, verticies, isEmmision, isBackground, LOD){
        //each element is an array with 7 elements [[R, G, B], vertex1, vertex2, vertex3, normal, sphereOfInfluence, roughness, edgeVector1, edgeVector2]
        this.roughness = roughness;
        this.color = color;
        this.v1 = vS[0];
        this.v2 = vS[1];
        this.v3 = vS[2];
        this.e1 = vectorSubtract(verticies[this.v2], verticies[this.v1]);
        this.e2 = vectorSubtract(verticies[this.v3], verticies[this.v1]);
        this.normal = normalize(crossProduct(this.e2, this.e1));
        this.center = vectorScalar(vectorAdd(vectorAdd(verticies[this.v1], verticies[this.v2]), verticies[this.v3]), 1/3);
        this.isEmmision = isEmmision;
        this.isBackground = isBackground
        if(LOD != false){
            this.minLod = LOD[0]; 
            this.maxLod = LOD[1];
        }else{
            this.minLod= false;
        }
    }
    get lod(){
        return this.lod();
    }
    lod(cameraLocation){
        if(this.minLod==false){
            return true
        }else{
            var dist = vectorDistance(this.center, cameraLocation)
            return  dist>this.minLod && dist<this.maxLod? true: false
        }
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
            return true
        }else{
            var dist = vectorDistance(this.position, cameraLocation)
            return  (dist>this.minLod && dist<this.maxLod)? true: false
        }
    }
}

export {face, particle};