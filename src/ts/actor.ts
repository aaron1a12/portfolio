import {game} from './game';

export class Actor
{
    /**
     * Promise object for loading assets.
     * When it resolves, all assets have loaded.
     */
    public tryLoad:Promise<void> = new Promise<void>((resolve, reject) => {
        this.onLoad(resolve, reject);
    });

    /**
     * Asynchronously loads its assets and calls onSucess() or onFailure()
     */
    onLoad(onSuccess: () => void, onFailure: () => void)
    {
        onSuccess();
    }

    /**
     * Default constructor automatically registers the actor.
     */
    constructor()
    {
        game.registerActor(this);
    }

    /**
     * Fired when all actors have loaded and the game begins or when this
     * particular actor has, mid-game.
     */
    onStart()
    {
    }

    /**
     * Executed every frame.
     */    
    onUpdate(dt: number)
    {
    }
}