import * as THREE from 'three';

/**
 * Very simple 3D spring model.
 */
export class Spring {
    private position = new THREE.Vector3(0,0,0);
    private velocity = new THREE.Vector3(0,0,0);
    private acceleration = new THREE.Vector3(0,0,0);

    /** Damping constant, in kg / s */
    private mass = 0.1;    

    /** Spring stiffness, in kg / s^2 */
    private k = -10;

    /** Damping constant, in kg / s */
    private b = -0.5;    

    constructor(
        /** Default position. */
        initialPosition: THREE.Vector3,

        /** The mass of the spring. */
        mass: number = 0.1,

        /** Represents how difficult it is to move or how it 'lags' behind. */
        stiffness: number = -10,

        /** Higher damping will reduce oscillations. */
        damping: number = -0.5
    )
    {
        this.mass = mass;
        this.k = stiffness;
        this.b = damping;
    }

    /**
     * Move the spring without affecting physics.
     */
    public teleport(newPosition: THREE.Vector3)
    {
        this.position = newPosition;
    }

    /**
     * Update the spring for the next frame and return the new position.
     */
    public update(target: THREE.Vector3, dt: number) : THREE.Vector3
    {
        let spring = new THREE.Vector3().subVectors(this.position, target).multiplyScalar(this.k);
        let damper = new THREE.Vector3().addScaledVector(this.velocity, this.b);

        // update acceleration
        this.acceleration.set(0,0,0);
        this.acceleration.addVectors(spring, damper).divideScalar(this.mass);

        // update velocity
        this.velocity.add(
            this.acceleration.clone().multiplyScalar(dt)
        );
        
        // update position
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        return this.position.clone();
    }

    /**
     * Returns the latest position of the spring.
     */    
    public getPosition()
    {
        return this.position.clone();
    }
}