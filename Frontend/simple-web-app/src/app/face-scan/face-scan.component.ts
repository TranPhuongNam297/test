import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as faceapi from 'face-api.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-face-scan',
  templateUrl: './face-scan.component.html',
  styleUrls: ['./face-scan.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class FaceScanComponent implements OnInit {
  @ViewChild('video') videoElement!: ElementRef;
  uploadedImage: string | null = null;
  isMatched: boolean | null = null;
  userName: string | null = null;
  scanInterval: any;
  stream: MediaStream | null = null; // Biến để lưu trữ luồng camera

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models');
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models');

    // Mở camera để bắt đầu quét gương mặt
    this.startCamera();
  }

  startCamera() {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        this.stream = stream;  // Lưu trữ luồng camera
        this.videoElement.nativeElement.srcObject = stream;
        this.startFaceDetection();  // Bắt đầu quét gương mặt
      })
      .catch((err) => console.error('Error accessing camera: ', err));
  }

  startFaceDetection() {
    this.scanInterval = setInterval(async () => {
      const video = this.videoElement.nativeElement;

      // Quét gương mặt mỗi 1 giây
      const detections = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();

      if (detections) {
        clearInterval(this.scanInterval);  // Dừng quét gương mặt
        this.captureImage();  // Chụp ảnh và hiển thị
      } else {
        console.log('No face detected, retrying...');
      }
    }, 1000);  // Mỗi giây quét một lần
  }

  async captureImage() {
    const video = this.videoElement.nativeElement;

    // Chụp một frame từ video và chuyển thành canvas
    const canvas = faceapi.createCanvasFromMedia(video);
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Hiển thị ảnh đã chụp lên màn hình
    this.uploadedImage = canvas.toDataURL('image/png');  // Lưu URL của ảnh đã chụp

    // Dừng camera sau khi chụp ảnh
    this.stopCamera();

    // Chuyển canvas thành file ảnh và gửi tới API để so sánh
    const imageBlob = await this.canvasToBlob(canvas);
    this.sendImageToAPI(imageBlob);
  }

  // Hàm chuyển canvas thành blob
  canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      });
    });
  }

  // Gửi ảnh đến API để so sánh
  sendImageToAPI(file: Blob) {
    const apiUrl = 'http://127.0.0.1:8000/uploadfile/';

    const formData = new FormData();
    formData.append('file', file);

    this.http.post(apiUrl, formData).subscribe({
      next: (response: any) => {
        if (response.FIRSTNAME && response.LASTNAME) {
          this.isMatched = true;
          this.userName = `${response.FIRSTNAME} ${response.LASTNAME}`;
        } else {
          this.isMatched = false;
          this.userName = null;
        }
      },
      error: (err) => {
        console.error('Error uploading image', err);
        this.isMatched = false;
        this.userName = null;
      },
    });
  }

  // Hàm dừng camera sau khi chụp ảnh
  stopCamera() {
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach((track) => track.stop());  // Dừng tất cả các track video/audio
      this.stream = null;  // Xóa luồng camera
    }
  }

  // Nếu cần dừng quá trình quét thủ công
  stopFaceDetection() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }
  }
}
