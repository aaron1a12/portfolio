import { Actor } from "./actor";
import { game } from "./game";

export class NPC extends Actor
{
    onStart()
    {
        let n = game.actors.length;
        console.log(`There are ${n} actors in the game.`);

        console.log(`${this.constructor.name} has loaded and called onStart()`);
    }

    onLoad(onSuccess: () => void, onFailure: () => void)
    {
        setTimeout(()=>{
            console.log("NPC loaded.");
            onSuccess();
        }, 1);

    }

    onUpdate(dt: number)
    {
    }
}