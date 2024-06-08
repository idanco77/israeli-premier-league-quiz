import {Game} from 'src/app/shared/types/games.type';
import {CITIES_TERMINAL_LETTERS} from 'src/app/shared/consts/cities/cities.const';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';
import {mapPlayerDetails} from 'src/app/shared/consts/israeli-premier-league/player-detail-mapper.const';

export const getAvailableWords = (game: Game, details: any): string[] => {
    switch (game) {
        case 'israeliPremierLeague':
            return mapPlayerDetails([
                ...details.map((player: PlayerDetail) => player.lastNameTerminalLetters)]
            )
        case 'cities':
            return CITIES_TERMINAL_LETTERS;
    }
};
