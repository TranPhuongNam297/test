// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Import RouterModule

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true, // Nếu bạn đang sử dụng component standalone
  imports: [RouterModule], // Thêm RouterModule vào imports
})
export class AppComponent {
  title = 'your-app-title'; // Đặt tiêu đề hoặc các thuộc tính khác nếu cần
}
