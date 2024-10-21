import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Import RouterModule

@Component({
  selector: 'app-camera',
  standalone: true,
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.css'],
  imports: [CommonModule, RouterModule] // Thêm RouterModule vào imports
})
export class CameraComponent {
  @ViewChild('video', { static: true }) video!: any;
  @ViewChild('canvas', { static: true }) canvas!: any;
  private stream: MediaStream | null = null;
  imageCaptured: boolean = false; // Biến này sẽ theo dõi khi nào ảnh đã chụp

  constructor(private router: Router) {}

  // Bật camera
  startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream: MediaStream) => {
        this.stream = stream;
        this.video.nativeElement.srcObject = stream;
      })
      .catch((err) => console.error("Error accessing camera: ", err));
  }

  // Tắt camera
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  // Chụp hình và lưu vào máy
  captureImage() {
    const videoWidth = this.video.nativeElement.videoWidth;
    const videoHeight = this.video.nativeElement.videoHeight;

    // Đặt lại kích thước của canvas dựa trên videoWidth và videoHeight
    this.canvas.nativeElement.width = videoWidth;
    this.canvas.nativeElement.height = videoHeight;

    const context = this.canvas.nativeElement.getContext('2d');
    context.drawImage(this.video.nativeElement, 0, 0, videoWidth, videoHeight);

    // Chuyển canvas thành ảnh và tạo link để tải về
    const imageData = this.canvas.nativeElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = imageData;
    a.download = 'captured_image.png';
    a.click();

    this.imageCaptured = true; // Sau khi chụp hình, cập nhật imageCaptured thành true
  }

  // Chuyển sang trang đăng ký
  goToRegister() {
    if (this.imageCaptured) {
      console.log("Chuyển trang đến /scan");
      this.router.navigate(['/scan']); // Điều hướng đến trang 'register'
    } else {
      console.warn("Chưa chụp hình, không thể chuyển trang!");
    }
  }
}
