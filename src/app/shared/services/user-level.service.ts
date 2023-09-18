import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserLevelService {
    isBeginner = new BehaviorSubject<boolean>(false);
}
