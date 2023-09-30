import {Game} from 'src/app/shared/types/games.type';

export const refreshAfter1Hour = (game: Game) => {
    const time: string | null = localStorage.getItem(game + 'ChosenWordTimestamp');
    const now: number = Math.floor(Date.now() / 1000);
    if (time && (now - 3600) > +time ) {
        localStorage.clear();
    }
};
