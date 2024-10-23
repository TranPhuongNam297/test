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
  @ViewChild('video', { static: true }) video!: HTMLVideoElement;
  @ViewChild('canvas', { static: true }) canvas!: HTMLCanvasElement;
  public stream: MediaStream | null = null;
  imageCaptured: boolean = false;
  isFaceDetected: boolean = false;

  constructor(private router: Router) {}

  async ngOnInit() {
    // Chỉ tải mô hình khi đang trong môi trường trình duyệt
    if (typeof window !== 'undefined') {
      await this.loadFaceApiModels();
    } else {
      //console.error('Môi trường không hỗ trợ face-api.js');
    }
  }

  // Tải các mô hình của face-api.js
  async loadFaceApiModels() {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
      console.log('Face API models loaded.');
    } catch (error) {
      console.error('Error loading face-api models: ', error);
    }
  }

  // Hàm bật/tắt camera dựa trên trạng thái hiện tại
  toggleCamera() {
    this.stream ? this.stopCamera() : this.startCamera();
  }

  // Bật camera
  startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream: MediaStream) => {
        this.stream = stream;
        this.video.srcObject = stream;
        this.video.play(); // Chơi video
        this.imageCaptured = false; // Reset imageCaptured khi bật camera
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
    const video = this.video;

    const detect = async () => {
      if (!this.imageCaptured) { // Chỉ phát hiện khuôn mặt nếu chưa chụp ảnh
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        if (detections.length > 0) {
          this.isFaceDetected = true;
          this.captureImage(); // Tự động chụp hình
        } else {
          this.isFaceDetected = false; // Không phát hiện khuôn mặt
        }
      }
      requestAnimationFrame(detect); // Gọi lại hàm detect
    };

    detect(); // Khởi động phát hiện
  }

  // Chụp hình và lưu vào máy
  captureImage() {
    const videoWidth = this.video.videoWidth;
    const videoHeight = this.video.videoHeight;

    // Đặt lại kích thước của canvas dựa trên videoWidth và videoHeight
    this.canvas.width = videoWidth;
    this.canvas.height = videoHeight;

    const context = this.canvas.getContext('2d');
    if (context) {
      context.drawImage(this.video, 0, 0, videoWidth, videoHeight);

      // Chuyển canvas thành ảnh và tạo link để tải về
      const imageData = this.canvas.toDataURL('image/png');
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
