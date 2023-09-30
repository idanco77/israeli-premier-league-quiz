import {Component, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import {UserLevelService} from 'src/app/shared/services/user-level.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
    userLevel: FormControl<string | null> = new FormControl('');
    faRefresh = faRefresh;

    constructor(private userLevelService: UserLevelService) {

    }

    ngOnInit() {
        this.userLevel.valueChanges.subscribe((val: string | null): void => {
            this.userLevelService.isBeginner.next(!!val);
        });
    }

    resetGame() {
        localStorage.clear();
        window.location.reload();
    }
}
