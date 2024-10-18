import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Import map

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'https://localhost:7155/api/events'; // Địa chỉ API của bạn

  constructor(private http: HttpClient) { }

  // Lấy tất cả sự kiện và chỉ lấy lastname và firstname
  getEvents(): Observable<{ firstname: string, lastname: string }[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(events => events.map(event => ({
        firstname: event.firstname,
        lastname: event.lastname
      })))
    );
  }
}
