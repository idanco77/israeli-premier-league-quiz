import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';
import {LAST_LETTER, MAX_LETTERS_ALLOWED, OPTIONAL_TERMINAL_LETTERS_CODES} from 'src/app/shared/consts/rules';
import {mapPlayerDetails} from 'src/app/shared/services/helper.service';
import {ApiService} from 'src/app/shared/services/api.service';

@Injectable({
    providedIn: 'root'
})
export class PlayersDataService {
    playerDetailsSub = new Subject<PlayerDetail[]>();
    availableWordsSub = new Subject<string[]>();
    autocompleteAvailableWordsSub = new Subject<string[]>();

    constructor(private apiService: ApiService) {
    }

    setPlayersData() {
        if (localStorage.getItem('availableWords') &&
            localStorage.getItem('details') &&
            localStorage.getItem('autocompleteAvailableWords')) {
            this.availableWordsSub.next(JSON.parse(localStorage.getItem('availableWords') || '[]'));
            this.playerDetailsSub.next(JSON.parse(localStorage.getItem('details') || '[]'));
            this.autocompleteAvailableWordsSub.next(JSON.parse(localStorage.getItem('autocompleteAvailableWords') || '[]'));
        }

        this.apiService.getPlayersData().subscribe(response => {
            const playerDetails = Object.values(response.data)
                .filter((player: any) =>
                    player.leagues.hasOwnProperty('23/24') &&
                    player.leagues['23/24'] === 902 &&
                    player.lastName?.length === MAX_LETTERS_ALLOWED &&
                    !/[A-Z][a-z]/.test(player.lastName)
                )
                .map((player: any) => this.createPlayerDetail(player));

            const availableWords = mapPlayerDetails([...playerDetails.map((player: PlayerDetail) => player.lastName)]);
            const availableWordsAutocomplete = mapPlayerDetails([...playerDetails.map((player: PlayerDetail) => player.lastNameTerminalLetters)]);

            this.playerDetailsSub.next(playerDetails);
            this.availableWordsSub.next(availableWords);
            this.autocompleteAvailableWordsSub.next(availableWordsAutocomplete);

            localStorage.setItem('details', JSON.stringify(playerDetails));
            localStorage.setItem('availableWords', JSON.stringify(availableWords));
            localStorage.setItem('autocompleteAvailableWords', JSON.stringify(availableWordsAutocomplete));
        })
    }

    createPlayerDetail(player: any): PlayerDetail {
        const { dateOfBirth, teamId, hebrewName, hebrewPosition, shirtNumber, lastName } = player;
        return {
            age: dateOfBirth?.sec ? this.getAge(new Date(dateOfBirth.sec * 1000)) : null,
            coachName: teamId.hebrewCoachName,
            name: hebrewName,
            position: hebrewPosition,
            shirtNumber,
            team: teamId.hebrewName,
            teamLogo: teamId.logoUrl,
            lastName: this.terminalToRegularWord(lastName),
            lastNameTerminalLetters: lastName,
        };
    }

    getAge(birthdate: Date): number {
        const today: Date = new Date();
        let age: number = today.getFullYear() - birthdate.getFullYear();
        const m: number = today.getMonth() - birthdate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
            age--;
        }
        return age;
    }

    private terminalToRegularWord(word: string): string {
        let wordArray = word.split('');
        let lastLetter = wordArray[LAST_LETTER];
        if (! lastLetter) {
            return '';
        }
        const isTerminalLetter: boolean = OPTIONAL_TERMINAL_LETTERS_CODES.includes(lastLetter.charCodeAt(0) + 1);
        if (isTerminalLetter) {
            // convert to regular letter:
            lastLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1);
            wordArray[LAST_LETTER] = lastLetter;
        }
        return wordArray.join('');
    }


}
