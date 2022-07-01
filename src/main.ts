import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import {game} from "./game"; // It's a singleton - bite me
import {Actor} from './actor'
import {Player} from './player'
import {NPC} from './npc'

////////////////////////////////////////////////////////////////////////////////
// Initialize some stuff
////////////////////////////////////////////////////////////////////////////////

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

renderer.toneMapping = THREE.ReinhardToneMapping; // beautiful
renderer.toneMappingExposure = 1.0;
renderer.outputEncoding = THREE.sRGBEncoding;

renderer.setClearAlpha(0);

game.scene = new THREE.Scene();

game.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
game.camera.position.z = 2;
game.camera.position.y = 0.5;
let cam: THREE.Camera = game.camera;

game.camera.lookAt(0.0, 0.5, 0.0);

game.gltfLoader = new GLTFLoader();

const rgbeLoader = new RGBELoader().setPath( 'assets/textures/' );
let clock = new THREE.Clock();

const controls = new OrbitControls( game.camera, renderer.domElement );
controls.update();

////////////////////////////////////////////////////////////////////////////////
// Resize automatically
////////////////////////////////////////////////////////////////////////////////

function updateSize()
{
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    if (game.camera)
    {
        game.camera.aspect = window.innerWidth / window.innerHeight;
        game.camera.updateProjectionMatrix();
    }
}
updateSize();

window.addEventListener("resize", updateSize);

////////////////////////////////////////////////////////////////////////////////
// Add the three.js renderer to the DOM
////////////////////////////////////////////////////////////////////////////////

renderer.domElement.id = "scene-canvas";
document.body.appendChild( renderer.domElement );

////////////////////////////////////////////////////////////////////////////////
// Setup the scene
////////////////////////////////////////////////////////////////////////////////

const size = 10;
const divisions = 10;
const gridHelper = new THREE.GridHelper( size, divisions,  0x000000, 0x54281d);
game.scene.add( gridHelper );

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
game.scene.add( ground );

// Ambience light
const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 2.6 );
hemiLight.color.setRGB( 1.0, 0.8, 0.6 );
hemiLight.groundColor.setRGB( 0.4, 0.1, 0.0 );
hemiLight.position.set( 0, 50, 0 );
game.scene.add( hemiLight );

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
game.scene.add( dirLight );

const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 1 );
//scene.add( dirLightHelper );

// Reflection map for PBR
rgbeLoader.load('venice_sunset_1k.hdr', (texture) => {
    // environment
    texture.mapping = THREE.EquirectangularReflectionMapping;
    //scene.background = texture;

    if (game.scene)
        game.scene.environment = texture;
});

////////////////////////////////////////////////////////////////////////////////
// Add the player
////////////////////////////////////////////////////////////////////////////////

game.player = new Player();

let npc = new NPC();

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

if (game.scene && game.camera)
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
}