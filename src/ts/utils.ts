import * as THREE from 'three';

//
// Implementations
//

window.clamp = (x: number, min: number, max: number) => {
    if (x > max)
        return max;
    else if (x < min)
        return min;
    else
        return x;
};

window.lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

window.lerpTo = (current: any, target: any, dt: number, speed: number) => {
    const closeToZero = (1.e-8);

    if( speed <= 0 )
    {
        return target;
    }

    if (typeof target === 'number')
    {
        let dist = target - current;

        if(Math.abs(dist) < 0.001)
        { 
            return target;
        }     
        
        let deltaDiff = dist * clamp(dt * speed, 0.0, 1.0);
        
        return current + deltaDiff;
    }
    else
    {
        let dist = new THREE.Vector3().subVectors(target, current);

        if(dist.lengthSq() < closeToZero)
            return target;

        let deltaDiff = new THREE.Vector3().addScaledVector(dist, clamp(dt * speed, 0.0, 1.0));

        return new THREE.Vector3().addVectors(current, deltaDiff);
    }
}

window.lerpV = (x: THREE.Vector3, y: THREE.Vector3, a: number) => {
    return new THREE.Vector3(
        x.x * (1 - a) + y.x * a,
        x.y * (1 - a) + y.y * a,
        x.z * (1 - a) + y.z * a,
    );
}