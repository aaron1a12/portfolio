import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import {Actor} from './actor';
import {game} from './game';

const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

function clamp(x: number, min: number, max: number)
{
    if (x > max)
        return max;
    else if (x < min)
        return min;
    else
        return x;
}

function interpTo(
    current: number,
    target: number,
    dt: number,speed: number): number;

function interpTo(
    current: THREE.Vector3,
    target: THREE.Vector3,
    dt: number, speed: number): THREE.Vector3;

function interpTo(current: any, target: any, dt: number, speed: number)
{
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

export class Player extends Actor {
    constructor()
    {
        super();
    }

    private model = null as null | THREE.Group;

    onLoad(onSuccess: () => void, onFailure: () => void)
    {
        game.gltfLoader?.load( 'assets/models/mascot.glb', (gltf: GLTF) => {
            let model = gltf.scene;

            this.model = model;

            model.scale.set(1.0, 1.0, 1.0); 
            model.position.set(0.0, 0.0, 0.0);
        
            model.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                }
            });

            model.castShadow = true;

            game.scene?.add(model);

            onSuccess();
        });
    }

    getHealth()
    {
        return 100;
    }

    getModel() 
    {
        return this.model;
    }

    getPosition() : THREE.Vector3
    {
        if (this.model)
            return this.model.position;
        else
            return new THREE.Vector3(0,0,0);
    }

    private velocity = new THREE.Vector3(0,0,0);
    private desiredVelocity = new THREE.Vector3(0,0,0);

    private sphere = null as null | THREE.Mesh;

    onStart()
    {
        document.addEventListener('keydown', (e) => {
            this.ProcessInput(e, true);
        });

        document.addEventListener('keyup', (e)=>{
            this.ProcessInput(e, false);
        });


        let me = this;
        me.desiredVelocity.set(0, 0, 0);

        const geometry = new THREE.SphereGeometry( 0.1, 32, 16 );
        const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        this.sphere = new THREE.Mesh( geometry, material );
        //game.scene?.add( this.sphere );
    }


    private camPos:number = 0.0;



    private camTargetAlpha = 0;

    onUpdate(dt: number)
    {
        
        /*let velocity = this.velocity;
        velocity.multiplyScalar(dt);*/

        if (this.model)
        {


            this.camTargetAlpha = interpTo(this.camTargetAlpha,
                (Math.abs(this.desiredVelocity.lengthSq()) > 0) ? 1:0, dt, 1.0);

            let target = new THREE.Vector3().addVectors(this.model.position, this.velocity);
            let newPos = interpTo(this.model.position, target, dt, 0.5);

            this.model.position.set(newPos.x, newPos.y, newPos.z);
            

            let camFollowPlayer = interpTo(this.camPos, this.model.position.x, dt, 1.1);
            let camFollowTarget = interpTo(this.camPos, target.x, dt, 1.0);
            
            let alpha = clamp(Math.abs(this.velocity.x) * (1/5), 0.0, 1.0) * 0.5;


            let newCamPos = lerp(camFollowPlayer, camFollowTarget, this.camTargetAlpha);

            this.sphere?.position.set(newCamPos, target.y, target.z);

            game.camera?.position.setX(newCamPos);

            this.camPos = newCamPos;

            const db = document.getElementById("vel");

            if (db)
            {
                //db.innerText = Math.round(this.velocity.lengthSq() * 10) / 10 + "";
                db.innerText = String(this.camTargetAlpha);
            }


            if (game.camera)
            {
                var pos = new THREE.Vector3(0,0,0);//this.model.position.clone();
                pos.project(game.camera);

                let size = new THREE.Vector2;
                game.renderer?.getSize(size);

                let xHalf = size.x * 0.5;
                let yHalf = size.y * 0.5;

                pos.x = ( pos.x * xHalf ) + xHalf;
                pos.y = - ( pos.y * yHalf ) + yHalf;

                const homePane = document.getElementById("home-pane");

                if (homePane)
                {
                    let paneWidth = homePane.offsetWidth * 0.5;
                    homePane.style.left = pos.x - paneWidth + "px";
                }
            }
        }


        let newVel = interpTo( this.velocity, this.desiredVelocity, dt, 10);
        this.velocity.set(newVel.x, newVel.y, newVel.z);

        //this.velocity.lerp(this.desiredVelocity, 100.0 * dt);
        //this.desiredVelocity.set(0,0,0);
        
        
        //this.model?.position.add(this.velocity);   

        //console.log(this.velocity);
    }

    ProcessInput(e: KeyboardEvent, bPressed: boolean)
    {
        //console.log(bPressed);
        switch (e.key)
        {
            case 'd':
            case 'ArrowRight':
                this.desiredVelocity.set((bPressed) ? 5.0 : 0, 0, 0);
                break;

            case 'a':
            case 'ArrowLeft':
                this.desiredVelocity.set((bPressed) ? -5.0 : 0, 0, 0);
                break;     
            
            /*case 'w':    
            case 'ArrowUp':
                this.desiredVelocity.set(0, 0, (bPressed) ? -5.0 : 0);
                break;      
            case 's':    
            case 'ArrowDown':
                this.desiredVelocity.set(0, 0, (bPressed) ? 5.0 : 0);
                break;     */            
        }
    }
}