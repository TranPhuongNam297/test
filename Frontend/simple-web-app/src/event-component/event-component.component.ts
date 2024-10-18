// event.component.ts
import { Component, OnInit } from '@angular/core';
import { EventService } from '../event.service'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event',
  standalone: true,
  templateUrl: './event-component.component.html',
  styleUrls: ['./event-component.component.css'],
  imports: [CommonModule] // Nếu sử dụng ngFor/ngIf thì cần import CommonModule
})
export class EventComponent implements OnInit {
  events: any[] = []; // Mảng để lưu trữ dữ liệu sự kiện
  errorMessage: string | null = null; // Để hiển thị lỗi nếu có

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.eventService.getEvents().subscribe({
      next: (data) => {
        this.events = data; // Lưu dữ liệu vào mảng events
      },
      error: (error) => {
        this.errorMessage = 'Có lỗi xảy ra khi lấy dữ liệu: ' + error.message; // Hiển thị thông báo lỗi
      }
    });
  }
}
