import {Observable, Subject} from 'rxjs';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AutocompleteService {
    autocompleteOutput = new Subject<string[]>();
}
