import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()
export class ApiService
{
  constructor(private http: HttpClient) {
  }
  getPlayersData(): Observable<any> {
    return this.http.get('https://cdnapi.bamboo-video.com/api/football/player' +
      '?format=json&iid=573881b7181f46ae4c8b4567&returnZeros=false' +
      '&disableDefaultFilter=true&useCache=false&ts=28245347');
  }
}
