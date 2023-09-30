import {Game} from 'src/app/shared/types/games.type';
import {CITIES} from 'src/app/shared/consts/cities/cities.const';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';
import * as playersDetailsJSON from 'src/assets/players-details.json';

export const getDetails = (game: Game) => {
    switch (game) {
        case 'israeliPremierLeague':
            const playersDetails: PlayerDetail[] = [];

            for (const prop in playersDetailsJSON) {
                if (isNaN(Number(prop))) {
                    continue;
                }
                playersDetails.push(playersDetailsJSON[prop] as PlayerDetail)
            }
            return playersDetails;
        case 'cities':
            return CITIES;
    }
};
