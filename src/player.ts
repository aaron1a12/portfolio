import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import {Actor} from './actor';
import {game} from './game';

export class Player extends Actor {
    constructor()
    {
        super();
    }

    onLoad(onSuccess: () => void, onFailure: () => void)
    {
        setTimeout(()=>{
        // Load model
        game.gltfLoader?.load( 'assets/models/mascot.glb', (gltf: GLTF) => {
            let model = gltf.scene;

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
        },2000);
        console.log("Loading assets...");


    }

    getHealth()
    {
        return 100;
    }

    onStart()
    {
        console.log('The game has begun!');
    }

    onUpdate(dt: number)
    {
    }
}