import {game} from './game';

export class Actor
{
    public tryLoad:Promise<void> = new Promise<void>((resolve, reject) => {
        this.onLoad(resolve, reject);
    });

    onLoad(onSuccess: () => void, onFailure: () => void)
    {
        onSuccess();
    }

    constructor()
    {
        game.registerActor(this);
    }

    onStart()
    {
    }

    onUpdate(dt: number)
    {
    }
}