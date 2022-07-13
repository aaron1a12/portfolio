/**
 * @license
 * Copyright 2022 Aaron Escobar (aaron1a12)
 * SPDX-License-Identifier: MIT
 */

import '../scss/style.scss';
import {game} from "./game"; // It's a singleton - bite me

const dev = document.documentElement.classList.contains("dev");
const buildHash = document.documentElement.getAttribute("data-build-hash");

if (dev)
{
    var debugDiv = document.createElement("div");
    debugDiv.id = "debugDiv"
    debugDiv.innerHTML = `<span style="color:red;">DEV BUILD - ${buildHash}</span>
    Actor count: <span id="actorCount"></span> | Velocity: <span id="vel"></span>`;


    document.body.appendChild(debugDiv);
}



////////////////////////////////////////////////////////////////////////////////
// Site stuff
////////////////////////////////////////////////////////////////////////////////

/**
 * Simulate a keyboard typing text onto an element.
 */
async function liveType( text: string, element: HTMLElement | null, speed: number )
{
    return new Promise<void>((resolve, reject) => {
        
        if (element)
        {
            speed *= 1000;
            let letters: string[] = text.split('');

            console.log(`Speed: ${speed}`);

            for(let i=0; i < letters.length; i++)
            {
                setTimeout(()=>{
                    let textNode = document.createTextNode(letters[i]);
                    element.appendChild(textNode);
                }, i * speed);
            }

            setTimeout(()=>{
                element.normalize();
                resolve();
            }, letters.length * speed);
        }
        else
        {
            reject();
        }
    });
}

liveType("aaron escobar", document.getElementById("dev-name"), 0.1).then(()=>
{
    setTimeout(()=>{
        const firstBlinker = document.getElementById("first-blinker");
        const secondBlinker = document.getElementById("second-blinker");

        if (firstBlinker)
        {
            firstBlinker.parentNode?.removeChild(firstBlinker);
        }

        if (secondBlinker)
        {
            secondBlinker.style.visibility = "visible";
        }

        /*const emptyDiv = document.createElement("DIV");

        let titleDiv = document.getElementById("dev-title");

        if (titleDiv)
        {
            titleDiv.parentNode?.insertBefore(emptyDiv, titleDiv);
        }*/

        liveType("web developer", document.getElementById("dev-title"), 0.1);
    },600);
});

const hamburgerBtn = document.getElementById("hamburger");

hamburgerBtn?.addEventListener("click", (e)=>{
    const links = document.getElementById("main-nav-links");
    const nav = document.getElementById("main-nav");

    if (!links) return;
    if (!nav) return;

    if (!nav.classList.contains("opened"))
        nav.classList.add("opened");
    else
        nav.classList.remove("opened");       


    if (!hamburgerBtn.classList.contains("opened"))
    {
        hamburgerBtn.classList.add("opened");
        links.classList.add("opened");
    }
    else
    {
        hamburgerBtn.classList.remove("opened");
        links.classList.remove("opened");        
    }
});

game.run();