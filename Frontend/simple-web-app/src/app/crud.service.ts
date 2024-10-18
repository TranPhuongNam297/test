import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CrudService {
  private apiUrl = 'https://localhost:7155/api/CRUD'; // Địa chỉ API của bạn

  constructor(private http: HttpClient) { }

  // Ví dụ: Lấy danh sách dữ liệu
  getData(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Ví dụ: Gửi dữ liệu
  addData(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // Các phương thức khác như update, delete cũng có thể được thêm vào
}
