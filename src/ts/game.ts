import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Actor } from './actor';
import { Player } from "./player";
import { NPC } from './npc';


class Game
{
    private bGameIsStarted:boolean = false;

    public renderer = null as null | THREE.WebGLRenderer;
    public scene = null as null | THREE.Scene;
    public camera = null as null | THREE.PerspectiveCamera;
    public mainLight = null as null | THREE.DirectionalLight;
    private lightTarget = new THREE.Object3D();
    public player = null as null | Player;
    public gltfLoader = null as null | GLTFLoader; 
    public rgbeLoader = null as null | RGBELoader; 
    private clock = null as null | THREE.Clock;

    private lastTime = 0;
    
    // List of tickable actors in scene
    public actors:any = [];

    // Used to know when actors have finished loading their assets
    private loadingPromises:any = [];

    private gameStartEvent = new CustomEvent('gamestart', {
        bubbles: false,
        detail: { text: () => 'foobar' }
    });

    constructor()
    {
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;

        this.renderer.toneMapping = THREE.ReinhardToneMapping; // beautiful
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.setClearAlpha(0);

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 0.1, 100 );
        this.camera.position.z = 10;
        this.camera.position.y = 1.5;

        this.gltfLoader = new GLTFLoader();
        this.rgbeLoader = new RGBELoader().setPath( 'assets/textures/' );

        this.clock = new THREE.Clock();

        //const controls = new OrbitControls( game.camera, renderer.domElement );
        //controls.update();
    }

    /**
     * Sets up the camera, renderer, actors, etc.
     */ 
    public updateSize()
    {
        if (this.renderer)
        {
            this.renderer.setPixelRatio( window.devicePixelRatio );
            this.renderer.setSize( window.innerWidth, window.innerHeight );
        }
    
        if (game.camera)
        {
            game.camera.aspect = window.innerWidth / window.innerHeight;
            game.camera.updateProjectionMatrix();
        }
    }

    /**
     * Updates the LODs, shadows, culling, etc.
     */
    public updateCamera()
    {
        if (this.player)
        {
            const center = this.player.getPosition();
        }
    }

    /**
     * Updates the LODs, shadows, culling, etc.
     */
    public updateLODs()
    {
        if (this.player && this.mainLight && this.camera)
        {
            const center = this.player.getPosition();

            this.mainLight.position.set(-1 + center.x, 1.75, 1);
            this.lightTarget.position.copy(center);

            this.mainLight.target = this.lightTarget;
            this.mainLight.target.updateMatrixWorld();
        }
    }

    /**
     * Sets up the camera, renderer, actors, etc.
     */ 
    public run()
    {
        ////////////////////////////////////////////////////////////////////////////////
        // Add the three.js renderer to the DOM
        ////////////////////////////////////////////////////////////////////////////////

        if (this.renderer)
        {
            this.renderer.domElement.id = "scene-canvas";
            document.body.appendChild( this.renderer.domElement );
        }

        // Resize
        this.updateSize();

        // Bind resize func
        window.addEventListener("resize", this.updateSize.bind(this), false); 

        this.camera?.lookAt(0.0, 1.0, 0.0);

        ////////////////////////////////////////////////////////////////////////////////
        // Setup the scene
        ////////////////////////////////////////////////////////////////////////////////

        if (!this.scene) return;

        const size = 10;
        const divisions = 10;
        const gridHelper = new THREE.GridHelper( size, divisions,  0x000000, 0x54281d);
        //this.scene.add( gridHelper );

        // Ground
        const groundGeo = new THREE.PlaneGeometry( 100, 100 );
        const groundMat = new THREE.ShadowMaterial ( { color: 0x000000 } );
        groundMat.opacity = 0.5;
        groundMat.color.setRGB( 0.2, 0.03, 0.0 );

        const ground = new THREE.Mesh( groundGeo, groundMat );
        ground.position.y = - 0.0;
        ground.rotation.x = - Math.PI / 2;
        ground.castShadow = false;
        ground.receiveShadow = true;
        this.scene.add( ground );

        // Ambience light
        const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 2.6 );
        hemiLight.color.setRGB( 1.0, 0.8, 0.6 );
        hemiLight.groundColor.setRGB( 0.4, 0.1, 0.0 );
        hemiLight.position.set( 0, 50, 0 );
        this.scene.add( hemiLight );

        // Main Light
        const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
        dirLight.color.setHSL( 1, 1, 1 );
        dirLight.position.set( - 1, 1.75, 1 );
        dirLight.position.multiplyScalar( 3 );
        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.radius = 4;

        const d = 5;
        dirLight.shadow.camera.left = - d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = - d;

        dirLight.shadow.camera.far = 100;
        dirLight.shadow.bias = - 0.00001;

        this.mainLight = dirLight;
        this.scene.add( this.mainLight );

        var shadowHelper = new THREE.CameraHelper( this.mainLight.shadow.camera );
        //this.scene.add( shadowHelper );

        const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 1 );
        //scene.add( dirLightHelper );

        // Reflection map for PBR
        this.rgbeLoader?.load('venice_sunset_1k.hdr', (texture) => {
            // environment
            texture.mapping = THREE.EquirectangularReflectionMapping;
            //scene.background = texture;

            if (game.scene)
                game.scene.environment = texture;
        });  


        const geometry = new THREE.CircleGeometry( 1, 32 );
        const material = new THREE.MeshPhongMaterial( { color: 0x991b11 } );
        const mesh = new THREE.Mesh( geometry, material );
        mesh.position.y = -0.0001;
        mesh.rotation.x = -1.5708;
        this.scene.add( mesh );
        
        ////////////////////////////////////////////////////////////////////////////////
        // Add the player
        ////////////////////////////////////////////////////////////////////////////////

        game.player = new Player();        
        new NPC();  

        ////////////////////////////////////////////////////////////////////////////////
        // Load the individual scenes
        ////////////////////////////////////////////////////////////////////////////////

        // TODO: WIP

        ////////////////////////////////////////////////////////////////////////////////
        // Waits for all actors to load and then calls onStart on everybody
        ////////////////////////////////////////////////////////////////////////////////

        game.start();

        ////////////////////////////////////////////////////////////////////////////////
        // Game/render loop
        ////////////////////////////////////////////////////////////////////////////////

        /*setInterval(() => {
            if (!this.clock) return;
            let dt:number = this.clock.getDelta();

            for ( let i = 0; i < game.actors.length; i++ )
            {
                let actor = game.actors[i] as Actor;

                actor.onUpdate(dt);
            }

            this.renderer?.render(game.scene as THREE.Scene, game.camera as THREE.Camera);
        }, 1000 / 60);*/

        // Debug

        setInterval(()=>{
            let n = game.actors.length;
            let e = document.getElementById("actorCount");

            if (e)
                e.innerHTML = n;
        }, 10);

        /*if (game.scene && game.camera)
        {
            const gameLoop = ()=> {
                let dt:number = clock.getDelta();

                for ( let i = 0; i < game.actors.length; i++ )
                {
                    let actor = game.actors[i] as Actor;

                    actor.onUpdate(dt);
                }

                renderer.render(game.scene as THREE.Scene, game.camera as THREE.Camera);
                requestAnimationFrame(gameLoop);
            };
            gameLoop();
        }*/        
    }

    /**
     * Puts the actor in an array and keeps track of its loading promise.
     */  
    public registerActor(actorRef: Actor)
    {
        this.actors.push(actorRef);
        this.loadingPromises.push(actorRef.tryLoad);

        if (this.bGameIsStarted)
        {
            actorRef.tryLoad.then(() => {
                actorRef.onStart();                   
            });
        }
        else
        {
            window.addEventListener("gamestart", actorRef.onStart.bind(actorRef), false); 
        }
    }
  
    /**
     * Starts the game by waiting for all actors to load and then broadcasts
     * the 'gamestart' event.
     */ 
    public start()
    {
        if (this.bGameIsStarted) return;
        this.bGameIsStarted = true;
        
        let me:Game = this;
        let total = game.loadingPromises.length;
        let done = 0;

        const updateProgress = () => {
            const spinnerRing = document.getElementById("spinner-ring");
            const minOff = 502.654;
            const maxOff = minOff * 2;

            const a = done / total;
            //const size = minOff + (minOff * progress);
            const size = minOff * (1 - a) + maxOff * a;

            if (spinnerRing)
            {
                spinnerRing.style.strokeDashoffset = "" + size;

                if (a == 1.0)
                {
                    const progressCont = document.getElementById("progress-cont");
                    
                    if (progressCont)
                    {
                        progressCont.style.transform = "scale(0)";
                        setTimeout(()=>{
                            progressCont.parentNode?.removeChild(progressCont);
                        }, 1000);
                    }
                }
            } 
        };        

        for (const load of game.loadingPromises) {
            load.then(()=>{
                done++;
                updateProgress();
            });
        }
        
        Promise.all(game.loadingPromises).then(() => {
            me.bGameIsStarted = true;

            window.dispatchEvent(this.gameStartEvent);

            console.log("The game has started.");
            me.gameLoop(0);

            const homePane = document.getElementById("home-pane");

            if (homePane)
            {
                setTimeout(()=>{
                    homePane.style.transform = "scale(1)"
                }, 1000);
            }

            this.renderer?.domElement.classList.add("opaque");
        });
    }
    
    /**
     * Starts or continues the game loop. Also ticks or updates all actors.
     */
    public gameLoop(time: number)
    {
        if (!this.lastTime) {
            this.lastTime = time;
        }
        else
        {
            let dt:number = (time - this.lastTime) / 1000;
            this.lastTime = time;
    
            for ( let i = 0; i < game.actors.length; i++ )
            {
                let actor = game.actors[i] as Actor;
    
                actor.onUpdate(dt);
            }
            
            this.updateLODs();
            this.renderer?.render(game.scene as THREE.Scene, game.camera as THREE.Camera);
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    };
}

// Game singleton
export let game = new Game();