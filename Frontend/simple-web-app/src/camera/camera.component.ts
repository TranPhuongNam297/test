import { Component, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as faceapi from 'face-api.js';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-camera',
  standalone: true,
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.css'],
  imports: [CommonModule, RouterModule]
})
export class CameraComponent implements OnInit {
  @ViewChild('video', { static: true }) video!: any;
  @ViewChild('canvas', { static: true }) canvas!: any;
  public stream: MediaStream | null = null;
  imageCaptured: boolean = false;
  isFaceDetected: boolean = false;

  constructor(private router: Router) {}

  async ngOnInit() {
    await this.loadFaceApiModels();
  }

  // Tải các mô hình của face-api.js
  async loadFaceApiModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
    console.log('Face API models loaded.');
  }

  // Hàm bật/tắt camera dựa trên trạng thái hiện tại
  toggleCamera() {
    if (this.stream) {
      this.stopCamera();
    } else {
      this.startCamera();
    }
  }

  // Bật camera
  startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream: MediaStream) => {
        this.stream = stream;
        this.video.nativeElement.srcObject = stream;
        this.detectFace(); // Bắt đầu phát hiện khuôn mặt khi camera hoạt động
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

  // Phát hiện khuôn mặt từ video
  detectFace() {
    const video = this.video.nativeElement;
    video.addEventListener('play', () => {
      const canvas = this.canvas.nativeElement;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const interval = setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        if (detections.length > 0 && !this.imageCaptured) {
          this.isFaceDetected = true;
          clearInterval(interval); // Ngừng phát hiện khi có khuôn mặt
          this.captureImage(); // Tự động chụp hình
        }
      }, 1000); // Kiểm tra mỗi giây
    });
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

    this.imageCaptured = true;

    // Thêm thời gian chờ nhỏ để đảm bảo ảnh đã được lưu trước khi chuyển trang
    setTimeout(() => {
      this.goToRegister(); // Tự động chuyển trang sau khi chụp xong
    }, 1000); // Thời gian chờ 1 giây để đảm bảo tải ảnh xong
  }

  // Chuyển sang trang scan
  goToRegister() {
    if (this.imageCaptured) {
      console.log("Chuyển trang đến /scan");
      this.router.navigate(['/scan']); // Điều hướng đến trang 'scan'
    } else {
      console.warn("Chưa chụp hình, không thể chuyển trang!");
    }
  }
}
