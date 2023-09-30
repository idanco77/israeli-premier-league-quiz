import {Injectable} from '@angular/core';
import { Subject} from 'rxjs';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';
import {LAST_LETTER, OPTIONAL_TERMINAL_LETTERS_CODES} from 'src/app/shared/consts/rules';
import * as playersDetailsJSON from 'src/assets/players-details.json';


@Injectable({
    providedIn: 'root'
})
export class PlayersDataService {
    autocompleteAvailableWordsSub = new Subject<string[]>();

    getPlayersData(): any {


        /* API Call - original data. can update the json file if we want */

        // this.http.get('https://cdnapi.bamboo-video.com/api/football/player' +
        //     '?format=json&iid=573881b7181f46ae4c8b4567&returnZeros=false' +
        //     '&disableDefaultFilter=true&useCache=false&ts=28245347').subscribe(response => {
        //     const playerDetails = Object.values(response.data)
        //         .filter((player: any) =>
        //             player.leagues.hasOwnProperty('23/24') &&
        //             player.leagues['23/24'] === 902 &&
        //             player.lastName?.length === MAX_LETTERS_ALLOWED &&
        //             !/[A-Z][a-z]/.test(player.lastName)
        //         )
        //         .map((player: any) => this.createPlayerDetail(player));
        // });
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
