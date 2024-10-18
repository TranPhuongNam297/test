// event.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'https://localhost:7155/api/events'; // Địa chỉ API của bạn

  constructor(private http: HttpClient) { }

  // Lấy tất cả sự kiện
  getEvents(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
