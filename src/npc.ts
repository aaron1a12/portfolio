import { Actor } from "./actor";
import { game } from "./game";

export class NPC extends Actor
{
    onStart()
    {
        let n = game.actors.length;
        console.log(`There are ${n} actors in the game.`);
    }

    onLoad(onSuccess: () => void, onFailure: () => void)
    {
        console.log("NPC loaded.");
        onSuccess();
    }

    onUpdate(dt: number)
    {
    }
}