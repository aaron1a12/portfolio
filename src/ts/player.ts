import { Console } from 'console';
import { REFUSED } from 'dns';
import { Dir } from 'fs';
import * as THREE from 'three';
import { Bone } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { pathToFileURL } from 'url';
import {Actor} from './actor';
import {game} from './game';
import { Spring } from './spring';

enum Direction {
    Left,
    Right,
}

enum Bones {
    root = 1,
    head = 6,
    antenna_a = 17,
    antenna_b,
    antenna_c,
    antenna_d,
    antenna_end,
    eyes = 24,
    eye_l = 25,
    eye_r = 26,
}

enum StateMachineStates {
    idle = 1,
    head = 8,
    antenna_a = 17,
    antenna_b,
    antenna_c,
    antenna_d,
    antenna_end,
    eyes = 24,
    eye_l = 25,
    eye_r = 26,
}

function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2;
}

export class Player extends Actor {
    constructor()
    {
        super();
    }

    private model = null as null | THREE.Group;

    private velocity = new THREE.Vector3(0,0,0);
    private desiredInput = new THREE.Vector3(0,0,0);
    private inputVector = new THREE.Vector3(0,0,0);
    private camPos:number = 0.0;
    private mass = 10.0; // kg
    private maxSpeed:number = 15.0;
    private camTargetAlpha = 0;
    private bInAir = false;
    private friction = 5.0;
    private sphere = null as null | THREE.Mesh;

    private bones: any = [];

    private arrowHelper = new THREE.ArrowHelper(
        new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0), 1.0, 0xffff00 );

    private mixer = null as null | THREE.AnimationMixer;    

    private identityPose  =  null as null | THREE.AnimationClip;
    private idleAnim =  null as null | THREE.AnimationClip;
    private walkAnim =  null as null | THREE.AnimationClip;

    onLoad(onSuccess: () => void, onFailure: () => void)
    {
        let dependencies:any = [];

        if (game.gltfLoader)
        {
            const loadModel = game.gltfLoader?.loadAsync("assets/models/mascot.glb", (event: ProgressEvent) => {});
            const loadIdleAnim = game.gltfLoader?.loadAsync("assets/models/mascot_scratch.glb", (event: ProgressEvent) => {});
            const loadWalkAnim = game.gltfLoader?.loadAsync("assets/models/mascot_walk.glb", (event: ProgressEvent) => {});

            dependencies.push(loadModel);
            dependencies.push(loadIdleAnim)

            
            loadModel.then((gltf) => { 
                this.model = gltf.scene;
                this.identityPose = gltf.animations[0];
    
                let me = this;
    
                this.model.scale.set(1.0, 1.0, 1.0); 
                this.model.position.set(0.0, 0.0, 0.0);
            
                this.model.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                    }
    
                    if (child instanceof THREE.Bone) {
                        me.bones.push(child as THREE.Bone);
                    }
                });
    
                this.model.castShadow = true;
                game.scene?.add(this.model);
            });

            loadIdleAnim.then((gltf) => {
                this.idleAnim = gltf.animations[0];
                this.idleAnim = THREE.AnimationUtils.subclip(this.idleAnim, "", 1, this.idleAnim.duration*30, 30);
            })

            loadWalkAnim.then((gltf) => {
                this.walkAnim = gltf.animations[0];
                this.walkAnim = THREE.AnimationUtils.subclip(this.walkAnim, "", 1, this.walkAnim.duration*30, 30);
            })
        }

        game.registerLoadingPromises(dependencies as Promise<void>[]);

        Promise.all(dependencies).then(() => {
            // All dependencies have loaded.
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
            return this.model.position.clone();
        else
            return new THREE.Vector3(0,0,0);
    }

    private mouseInertia = 0;
    private mousePos = new THREE.Vector2(0,0);
    private mouseOldPos = new THREE.Vector2(0,0);
    private mouseVelocity = new THREE.Vector2(0,0);

    onStart()
    {
        console.log("I exist.");
        game.scene?.add(this.arrowHelper);

        document.addEventListener('keydown', (e) => {
            this.ProcessInput(e, true);
        });

        document.addEventListener('keyup', (e)=>{
            this.ProcessInput(e, false);
        });

        document.addEventListener('wheel', (e: WheelEvent)=>{
            this.mouseInertia += e.deltaY * 0.01;
        });

        // Mouse pos for look at

        document.addEventListener('mousemove', (e: MouseEvent)=>{
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        });

        let size = new THREE.Vector2;
        game.renderer?.getSize(size);

        // Default should be in the middle of screen
        this.mousePos.x = size.x * 0.5;
        this.mousePos.y = size.y * 0.5;
        

        let tutorialCheck = setInterval(()=>{
            // /

            if (game.player && game.player.getPosition().x > 2.0)
            {
                const arrowHelp = document.getElementById("help-this-way");

                if (arrowHelp)
                    arrowHelp.parentNode?.removeChild(arrowHelp);
                    
                clearInterval(tutorialCheck);
            }
        }, 1000);

        let n = 0;
        let test = setInterval(()=>{
           // this.DrawStars((Math.sin(n) + 1.0) * 10);
           //this.DrawStars(easeInOutSine(n));

           //console.log("("+ (Math.round(n*1000) / 1000 )+")");

           n += 1/100;
            //n += 0.5;
        }, 100);


        const controls = document.querySelectorAll(".touch-controls .touch");

        for(let i=0; i<controls.length; i++)
        {
            controls[i].addEventListener('contextmenu', function (e) {  
                e.preventDefault(); 
            }, false);

            controls[i].addEventListener("touchstart", (e)=>{
                this.SetAcceleration(i, 1.0);
            });

            controls[i].addEventListener("touchend", (e)=>{
                this.SetAcceleration(i, 0.0);
            });
        }

        let me = this;
        me.inputVector.set(0, 0, 0);

        const geometry = new THREE.SphereGeometry( 0.05, 32, 16 );
        const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        this.sphere = new THREE.Mesh( geometry, material );
        game.scene?.add( this.sphere );


        if (this.model && this.idleAnim)
        {
            // Initial antenna spring position

            const bone = this.bones[Bones.antenna_end] as THREE.Bone;
            const target = new THREE.Vector3();
            bone.getWorldPosition(target);

            this.antennaSpring.teleport(target);

            // Animation stuff

            this.mixer = new THREE.AnimationMixer( this.model );
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.mixer.getRoot());

            //this.mixer.clipAction(this.identityPose as THREE.AnimationClip).play().setEffectiveWeight(0.05);

            //THREE.AnimationUtils.makeClipAdditive(this.idleAnim, 0);

            
            
            //

            if (this.identityPose)
                this.mixer.clipAction(this.identityPose).setDuration( 2.5 ).play();

            this.activeAction = this.mixer.clipAction(this.idleAnim).setDuration( 2.5 ).play();   
            this.activeAction.setEffectiveWeight(0.001);
            //this.mixer.addEventListener()
        }

        const boneA = this.bones[Bones.antenna_a] as THREE.Bone;
        //boneA.rotation.x = Math.PI/2;
        //boneA.updateMatrix();
    }

    private inputSpeed = 0.02;

    private bIsBlinking = true;
    private bClosing = false;
    private blinkAlpha: number = 0.0;
    private iTimeSinceBlink = 0.0;
    private iBlinkFrequency = 10.0;

    idleBlink(dt: number)
    {
        this.iTimeSinceBlink += dt;

        if (!this.bIsBlinking)
        {
            let interval = ((Math.random() + 0.001) * 1000.0) / this.iBlinkFrequency;

            if (this.iTimeSinceBlink > interval)
            {
                this.iTimeSinceBlink = 0;
                this.bIsBlinking = true;
            }
        }
        else
        {
            this.blinkAlpha += 16 * dt;
            this.blinkAlpha = clamp(this.blinkAlpha, 0.0, 2.0)

            let eyes = this.bones[Bones.eyes] as THREE.Bone;
            eyes.scale.y = 1-easeInOutSine(this.blinkAlpha);

            if (this.blinkAlpha == 2.0)
            {
                this.bIsBlinking = false;
                this.blinkAlpha = 0.0;
            }
        }
    }

    private randomEyeTarget = new THREE.Vector2(0,0);
    private randomEyeCurrent = new THREE.Vector2(0,0);
    private randomEyeCurrentWaiting = 0.0;

    private lookAtAlpha = 0.0;

    private timeSinceCursorVelocityCalc = 0.0;
    private timeLookingAtStillCursor = 0.0;

    updateLookAt(dt: number)
    {
        if (!game.camera) return;
        if (!game.renderer) return;

        //
        // Cursor velocity (calculated every 0.1 sec) 
        //

        this.timeSinceCursorVelocityCalc += dt;

        if (this.timeSinceCursorVelocityCalc > 0.1)
        {
            this.timeSinceCursorVelocityCalc = 0.0;
            this.mouseVelocity.subVectors(this.mousePos, this.mouseOldPos).divideScalar(0.1);
            this.mouseOldPos.copy(this.mousePos);
        }

        // Time spent looking at a still cursor

        if (this.mouseVelocity.length() < 10.0)
            this.timeLookingAtStillCursor += dt;
        else
            this.timeLookingAtStillCursor = 0.0;


        // 
        
        this.lookAtAlpha = lerpTo(this.lookAtAlpha, (this.timeLookingAtStillCursor > 2.0) ? 1.0 : 0.0, dt, 5);    


        let eyes = this.bones[Bones.eyes] as THREE.Bone;

        let pos = this.getPosition().project(game.camera);
        let size = new THREE.Vector2;

        game.renderer.getSize(size);

        let xHalf = size.x * 0.5;
        let yHalf = size.y * 0.5;

        //

        let origin = new THREE.Vector2(( pos.x * xHalf ) + xHalf, - ( pos.y * yHalf ) + yHalf);
        origin.y -= 75.0;
        let target = this.mousePos;        

        let dist = target.distanceTo(origin);

        const maxDist = (size.x > size.y) ? size.x : size.y;
        const amount = dist / (maxDist * 0.5);

        let norm = target.clone().sub(origin).normalize().multiplyScalar(12.0 * amount);

        let mouseEyeLookAt = new THREE.Vector2(
            norm.x,
            clamp(-norm.y, -3.5, 7.0)
        );

        //

        this.randomEyeCurrentWaiting -= dt;

        if (this.randomEyeCurrentWaiting < 0.0)
        {
            // Get a new random target for the eyes
            this.randomEyeTarget.x = (Math.random() * 16.0) - 8.0;
            this.randomEyeTarget.y = (Math.random() * 8.0) - 4.0;

            this.randomEyeCurrentWaiting = Math.random() * 1; // wait between 0-1 sec
        }

        this.randomEyeCurrent.x = lerpTo(this.randomEyeCurrent.x, this.randomEyeTarget.x, dt, 10);
        this.randomEyeCurrent.y = lerpTo(this.randomEyeCurrent.y, this.randomEyeTarget.y, dt, 10);

        //

        eyes.position.x = lerp(mouseEyeLookAt.x, this.randomEyeCurrent.x, this.lookAtAlpha);
        eyes.position.y = lerp(mouseEyeLookAt.y, this.randomEyeCurrent.y, this.lookAtAlpha);

        //

        let head = this.bones[Bones.head] as THREE.Bone; 

        let headAimingCursor = new THREE.Vector2(
            clamp(norm.y * 0.1 + 0.2, -0.5, 0.5),
            clamp(norm.x * 0.1, -0.5, 0.5)
        );

        head.rotation.x += lerp(headAimingCursor.x, head.rotation.x, this.lookAtAlpha);
        head.rotation.y += lerp(headAimingCursor.y, head.rotation.y, this.lookAtAlpha);

    }

    private springPos = new THREE.Vector3(0,0,0);
    private springV = new THREE.Vector3(0,0,0); // velocity
    private springA = new THREE.Vector3(0,0,0); // acceleration

    private antennaMass = 0.1;
 
    private oldPos = new THREE.Vector3(0,0,0);
    private timeElapsedSincePos = 0.0;
    private boneVelocity = new THREE.Vector3(0,0,0);

    private antennaSpring = new Spring(new THREE.Vector3());

    updateSpring(dt: number)
    {
        if (!this.sphere) return;

        const boneA = this.bones[Bones.antenna_a] as THREE.Bone;
        const boneB = this.bones[Bones.antenna_b] as THREE.Bone;
        const boneC = this.bones[Bones.antenna_c] as THREE.Bone;
        const boneD = this.bones[Bones.antenna_d] as THREE.Bone;
        const boneE = this.bones[Bones.antenna_end] as THREE.Bone;
        
        const target = this.getPosition().add(new THREE.Vector3(0,1.0,0));
        const dirOrigin = this.getPosition().add(new THREE.Vector3(0,0.5,0));

        this.sphere.position.copy(this.antennaSpring.update(target, dt));
        this.sphere.visible = false;

        let dir = new THREE.Vector3().subVectors(this.sphere.position, dirOrigin).normalize();
        dir.applyMatrix4(new THREE.Matrix4().makeRotationY(-0.5));

        const UP = new THREE.Vector3(0.0, 1.0, 0.0);
        const RIGHT = new THREE.Vector3(1.0, 0.0, 0.0);

        this.arrowHelper.setDirection(dir);
        this.arrowHelper.visible = false;

        const aimBlend = (offset: THREE.Vector3, multiplier: number) => {
            return new THREE.Vector3(
                this.arrowHelper.rotation.x,
                this.arrowHelper.rotation.y,
                this.arrowHelper.rotation.z
            ).multiplyScalar(multiplier).add(offset);
        };    

        boneA.rotation.setFromVector3(
            aimBlend(new THREE.Vector3(0,0, Math.PI / 2), 0.5)
        );

        boneB.rotation.setFromVector3(
            aimBlend(new THREE.Vector3(0, 0, 0), 1.0)
        );

        boneC.rotation.setFromVector3(
            aimBlend(new THREE.Vector3(0, 0, 0), 2.0)
        );

        boneD.rotation.setFromVector3(
            aimBlend(new THREE.Vector3(0, 0, 0), 2.0)
        );

        boneE.rotation.setFromVector3(
            aimBlend(new THREE.Vector3(0, 0, 1-(Math.PI / 1.2)), 2.0)
        );
    }

    private bIsPlayingWalkingAnim = false;

    private activeAction = null as null | THREE.AnimationAction;



            

    onUpdate(dt: number)
    {   
        // Update before anim post-processing (blinking, lookat, etc...)
        this.mixer?.update(dt);



        /*if (this.mixer && this.idleAnim)
            this.mixer.clipAction(this.idleAnim).setDuration( duration );

        if (this.bIsPlayingWalkingAnim && this.velocity.length() < 0.01)
        {
            this.bIsPlayingWalkingAnim = false;
            this.mixer.clipAction(this.idleAnim).crossFadeTo(this.idleAnim)
        }//*/
        
        //console.log(duration);

        //this.idleBlink(dt);
        this.updateLookAt(dt);
        //this.updateSpring(dt);

        this.mouseInertia = lerpTo(this.mouseInertia, 0.0, dt, 5);

        this.inputVector.setX(
            this.inputVector.x + clamp(this.mouseInertia, -1.0, 1.0) * dt * this.inputSpeed
        );

        // desiredInput = acceleration?
        this.inputVector.add(this.desiredInput.clone().multiplyScalar(dt * this.inputSpeed));

        /*let velocity = this.velocity;
        velocity.multiplyScalar(dt);*/

        if (this.model)
        {
            

            this.camTargetAlpha = lerpTo(this.camTargetAlpha,
                (Math.abs(this.inputVector.lengthSq()) > 0) ? 1:0, dt, 1.0);

            // Add forces
            const gravity = new THREE.Vector3(0, -9.8, 0);

            this.velocity.add(gravity.clone().multiplyScalar(dt * this.mass * 0.004));

            let targetFacing = this.getPosition().add(this.velocity);
            //targetFacing.y = 0;

            //this.model.lookAt(targetFacing);
            this.model.rotation.y = this.velocity.x * 30;

            //let force = mass * acceleration;

            this.velocity.add(this.inputVector.clone().multiplyScalar(this.mass));
            this.inputVector.set(0,0,0);

            // Make sure it doesn't go faster than the max
            this.velocity.clampScalar(-this.maxSpeed, this.maxSpeed)
            
            this.model.position.add(this.velocity);

            if (this.model.position.y < 0.0 && this.velocity.y < 0.0)
            {
                this.bInAir = false;
                this.velocity.y = 0.0;
                this.model.position.y = 0.0;
            }
            else
            {
                this.bInAir = true;
            }

            if (!this.bInAir)
            {
                let newVel = lerpTo( this.velocity, new THREE.Vector3(0,0,0), dt, this.friction);
                this.velocity.set(newVel.x, newVel.y, newVel.z);
            }

            let target = new THREE.Vector3().addVectors(this.model.position, this.velocity);

            // Camera

            let camFollowPlayer = lerpTo(this.camPos, this.model.position.x, dt, 12.1);
            let camFollowTarget = lerpTo(this.camPos, target.x, dt, 1.0);
            
            let alpha = clamp(Math.abs(this.velocity.x) * (1/5), 0.0, 1.0) * 0.5;


            //let newCamPos = lerp(camFollowPlayer, camFollowTarget, this.camTargetAlpha);
            let newCamPos = camFollowPlayer;

            //this.sphere?.position.set(newCamPos, target.y, target.z);

            game.camera?.position.setX(newCamPos);

            this.camPos = newCamPos;

            const db = document.getElementById("vel");

            if (db)
            {
                const debugV = (v: THREE.Vector3) => {
                    let x = Math.round(v.x * 1000) / 1000;
                    let y = Math.round(v.y * 1000) / 1000;
                    let z = Math.round(v.z * 1000) / 1000;

                    return `x: ${x}, y: ${y}, z: ${z}`;
                };

                db.innerText = debugV(this.desiredInput);
                //db.innerText = String(this.camTargetAlpha);
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

            //
            // Animations
            // 


            /*if (this.mixer && this.activeAction)
            {
                let speed = this.velocity.length() * 27.2727;  // what is this?
                
                if (speed > 0.1 && !this.bIsPlayingWalkingAnim)
                {
                    if (this.walkAnim)
                    {

                        this.bIsPlayingWalkingAnim = true;
                        let newAction = this.mixer.clipAction(this.walkAnim).setDuration(1.0).play();
                        this.activeAction.crossFadeTo(newAction, this.transitionTime, true);

                        this.activeAction = newAction;
                        console.log("walking");
                    }
                }
                else if (speed < 0.1 && this.bIsPlayingWalkingAnim)
                {
                    if (this.idleAnim)
                    {
                        this.mixer.stopAllAction();
                        this.bIsPlayingWalkingAnim = false;

                        let newAction = this.mixer.clipAction(this.idleAnim).setDuration(1.0).play();
                        this.activeAction.crossFadeTo(newAction, this.transitionTime, true);

                        this.activeAction = newAction;
                    }
                }
            }*/
            
        }

        //this.velocity.lerp(this.inputVector, 100.0 * dt);
        this.inputVector.set(0,0,0);
        
        
        //this.model?.position.add(this.velocity);   

        //console.log(this.velocity);
     
        /*        let duration = 1 - Math.abs(this.velocity.x * 30);
            duration *= 2.0;

            duration = clamp(duration, 0.5, 10); */
    }

    private transitionTime:number = 0.5;
    private bAnimTransitioning = false;

    SetAcceleration(dir: Direction, speed: number)
    {
        let forceDirection = new THREE.Vector3(
            (dir == Direction.Left) ? -1.0 : 1.0,
            0,
            0
        ).multiplyScalar(speed);

        this.desiredInput.copy(forceDirection);
    }

    StopMoving()
    {
    }

    Jump()
    {
        if (this.bInAir) return;

        console.log("jump");
        this.inputVector.add(new THREE.Vector3(
            0,
            0.01,
            0
        ));
    }

    ProcessInput(e: KeyboardEvent, bPressed: boolean)
    {
        if (bPressed == false && e.key != ' ')
        {
            this.SetAcceleration(Direction.Left, 0.0); // dir is irrelevant
            return;
        }


        //console.log(bPressed);
        switch (e.key)
        {
            case 'D':
            case 'd':
            case 'ArrowRight':
                this.SetAcceleration(Direction.Right, 1.0);
                break;

            case 'A':
            case 'a':
            case 'ArrowLeft':
                this.SetAcceleration(Direction.Left, 1.0);
                break; 

            case ' ':
                (bPressed) ? this.Jump() : 0;

                break;          
            
            /*case 'w':    
            case 'ArrowUp':
                this.inputVector.set(0, 0, (bPressed) ? -5.0 : 0);
                break;      
            case 's':    
            case 'ArrowDown':
                this.inputVector.set(0, 0, (bPressed) ? 5.0 : 0);
                break;     */            
        }
    }
}