import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as faceapi from 'face-api.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-face-scan',
  templateUrl: './face-scan.component.html',
  standalone: true,
  styleUrls: ['./face-scan.component.css'],
  imports: [CommonModule],
})
export class FaceScanComponent implements OnInit {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  capturedImage: string | null = null;
  uploadedImage: string | null = null;
  isMatched: boolean | null = null;
  loadingModels: boolean = true; // Trạng thái tải mô hình
  isCameraActive: boolean = true; // Trạng thái hiển thị camera

  async ngOnInit() {
    await this.loadModels();
    this.loadingModels = false; // Đánh dấu đã tải xong mô hình
    this.startCamera(); // Bắt đầu camera khi đã tải xong mô hình
  }

  async loadModels() {
    // Tải các mô hình nhận diện khuôn mặt từ face-api.js
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models/');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models/');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models/');
    console.log('Models loaded successfully.');
  }

  startCamera() {
    const video = this.videoRef.nativeElement;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
        video.play();
        this.detectFace(); // Bắt đầu quét khuôn mặt khi camera đã khởi động
      })
      .catch(err => console.error('Error accessing camera:', err));
  }

  detectFace() {
    const video = this.videoRef.nativeElement;
    video.addEventListener('play', () => {
      const canvas = this.canvasRef.nativeElement;
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);
      const interval = setInterval(async () => {
        if (!this.loadingModels) { // Chỉ phát hiện khuôn mặt nếu mô hình đã tải xong
          const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptors();
          if (detections.length > 0) {
            clearInterval(interval);
            this.captureImage();
            this.stopCamera();
          }
        }
      }, 1000);
    });
  }

  captureImage() {
    const canvas = this.canvasRef.nativeElement;
    const video = this.videoRef.nativeElement;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (context) {
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      this.capturedImage = canvas.toDataURL('image/png');
      console.log('Captured image from camera.');
    }
  }

  stopCamera() {
    const video = this.videoRef.nativeElement;
    const stream = video.srcObject as MediaStream;

    if (stream) {
      // Kiểm tra nếu stream tồn tại, dừng các track của nó
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      this.isCameraActive = false; // Ẩn camera sau khi chụp hình
    } else {
      console.warn('Camera is already stopped or not started.');
    }
  }

  uploadImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.uploadedImage = reader.result as string;
        this.autoCompareImages(); // Tự động so sánh khi ảnh đã tải lên
      };
      reader.readAsDataURL(file);
    }
  }

  async autoCompareImages() {
    if (!this.capturedImage || !this.uploadedImage) {
      console.error('Uploaded or captured image is missing.');
      return;
    }

    const img1 = await faceapi.fetchImage(this.capturedImage);
    const img2 = await faceapi.fetchImage(this.uploadedImage);

    const fullFaceDescription1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
    const fullFaceDescription2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();

    if (fullFaceDescription1 && fullFaceDescription2) {
      const distance = faceapi.euclideanDistance(
        fullFaceDescription1.descriptor, fullFaceDescription2.descriptor
      );
      const threshold = 0.6;
      this.isMatched = distance < threshold;
      console.log('Faces Matched:', this.isMatched, 'Distance:', distance);
    } else {
      console.error('One or both faces could not be detected.');
      this.isMatched = false;
    }
  }
}
