import {Component, HostListener, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UserLevelService} from 'src/app/shared/services/user-level.service';
import {map, Observable, startWith, Subscription} from 'rxjs';
import {MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {FormControl} from '@angular/forms';
import {PlayersDataService} from 'src/app/shared/services/players-data.service';
import {AutocompleteService} from 'src/app/shared/services/autocomplete.service';
import {mapPlayerDetails} from 'src/app/shared/consts/israeli-premier-league/player-detail-mapper.const';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';
import {Game} from 'src/app/shared/types/games.type';
import {getDetails} from 'src/app/shared/consts/get-details.const';
import {getAvailableWords} from 'src/app/shared/consts/get-available-words.const';

@Component({
    selector: 'app-autocomplete',
    templateUrl: './autocomplete.component.html'
})
export class AutocompleteComponent implements OnInit, OnDestroy {
    @Input() game: Game;

    autocompleteControl: FormControl<string | null> = new FormControl('');
    filteredOptions: Observable<string[]> = new Observable<string[]>();
    autocompleteAvailableWords: string[];

    @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger | undefined;
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        this.process(event.key);
    }
    isBeginner: boolean = false;
    isBeginnerSub: Subscription;
    constructor(private userLevelService: UserLevelService,
                private autocompleteService: AutocompleteService) {
    }

    ngOnInit() {
        const playersDetails = getDetails(this.game);
        this.autocompleteAvailableWords = getAvailableWords(this.game, playersDetails);
        this.handleAutocomplete();

        this.isBeginnerSub = this.userLevelService.isBeginner.subscribe((isBeginner: boolean) => {
            this.isBeginner = isBeginner;
        })
    }

    private handleAutocomplete(): void {
        this.filteredOptions = this.autocompleteControl.valueChanges.pipe(
            startWith(''),
            map(value => this.autocompleteAvailableWords.filter(
                option => option.includes(value || '')
              )
              .slice(0, 10)
            ),
        );
    }

    private process(eventKey: string): void {
        if (this.isBeginner && eventKey === 'Enter' && this.autocomplete?.panelOpen) {
            const filteredList = this.autocompleteAvailableWords?.filter(option => option.includes(this.autocompleteControl.value || ''));
            if (filteredList.length) {
                this.autocompleteService.autocompleteOutput.next(filteredList[0].split(''));
                this.autocomplete?.closePanel();
                this.autocompleteControl.reset();
            }
        }
    }

    handleSelection(selectedValue: string[]): void {
        this.autocompleteService.autocompleteOutput.next(selectedValue);
        this.autocompleteControl.reset();
    }

    ngOnDestroy(): void {
        this.isBeginnerSub.unsubscribe();
    }
}
