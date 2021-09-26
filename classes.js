import {vectorSubtract, crossProduct, normalize, vectorScalar, vectorAdd} from'./math.js';

class face{
    constructor(roughness, color, v1, v2, v3, verticies){
        //each element is an array with 7 elements [[R, G, B], vertex1, vertex2, vertex3, normal, sphereOfInfluence, roughness, edgeVector1, edgeVector2]
        this.roughness = roughness;
        this.color = color;
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
        this.e1 = vectorSubtract(verticies[v2], verticies[v1]);
        this.e2 = vectorSubtract(verticies[v3], verticies[v1]);
        this.normal = normalize(crossProduct(this.e2, this.e1));
        this.center = vectorScalar(vectorAdd(vectorAdd(verticies[v1], verticies[v2]), verticies[v3]), 1/3);
    }
}

export {face};