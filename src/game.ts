import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Actor } from './actor';
import { Player } from "./player";

class Game
{
    private bGameIsStarted:boolean = false;

    public scene = null as null | THREE.Scene;
    public camera = null as null | THREE.PerspectiveCamera;
    public player = null as null | Player;
    public gltfLoader = null as null | GLTFLoader; 
    
    // List of tickable actors in scene
    public actors:any = [];

    // Used to know when actors have finished loading their assets
    private loadingPromises:any = [];

    public registerActor(actorRef: Actor)
    {
        this.actors.push(actorRef);
        this.loadingPromises.push(actorRef.tryLoad);
    }
  
    // Starts the game.
    public start()
    {
        if (this.bGameIsStarted) return;

        // Make sure all actors have loaded.
        
        let me:Game = this;
        Promise.all(game.loadingPromises).then(() => {
            me.bGameIsStarted = true;

            for ( let i = 0; i < me.actors.length; i++ )
                (me.actors[i] as Actor).onStart();
        });
    }
}

// Game singleton
export let game = new Game();