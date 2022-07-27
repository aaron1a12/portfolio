//
// Types
//

type clampType = (x: number, min: number, max: number) => number
type lerpType = (x: number, y: number, a: number) => number
type lerpToType = (current: any, target: any, dt: number, speed: number) => any;
type lerpVType = (x: THREE.Vector3, y: THREE.Vector3, a: number) => THREE.Vector3;

//
// Forward declarations
//

/**
 * Clamps a number
 */ 
declare const clamp: clampType;

/**
 * Linearly interpolate a number.
 */ 
declare const lerp: lerpType; 
 
/**
 * Linearly interpolate a number.
 */
function lerpTo(
    current: number,
    target: number,
    dt: number,speed: number): number;

/**
 * Linearly interpolate a vector with speed.
 */    
function lerpTo(
    current: THREE.Vector3,
    target: THREE.Vector3,
    dt: number, speed: number): THREE.Vector3;

/**
 * Linearly interpolate a vector.
 */ 
declare const lerpV: lerpVType; 

//
// Add properties to the global scope, specifically "window."
// This lets us make calls like: clamp() instead of utils.clamp()
//

interface Window {
    lerp: lerpType;
    lerpTo: lerpToType;
    lerpV: lerpVType;
    clamp: clampType;
}