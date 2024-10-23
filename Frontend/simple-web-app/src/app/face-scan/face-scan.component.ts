import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as faceapi from 'face-api.js';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

interface ApiResponse {
  FIRSTNAME?: string;
  LASTNAME?: string;
}

@Component({
  selector: 'app-face-scan',
  templateUrl: './face-scan.component.html',
  styleUrls: ['./face-scan.component.css'],
  standalone: true,
  imports: [CommonModule, HttpClientModule],
})
export class FaceScanComponent implements OnInit, OnDestroy {
  @ViewChild('video') videoElement!: ElementRef;
  uploadedImage: string | null = null;
  isMatched: boolean | null = null;
  userName: string | null = null;
  scanInterval: any;
  stream: MediaStream | null = null;

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    // Ensure the code runs only in the browser
    if (this.isBrowser()) {
      await this.loadFaceApiModels();
      this.startCamera();
    } else {
      // console.error('This component can only run in a browser environment.');
    }
  }

  isBrowser() {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }

  async loadFaceApiModels() {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models'),
      ]);
    } catch (error) {
      console.error('Error loading face-api.js models', error);
    }
  }

  startCamera() {
    // Check if running in the browser before accessing the camera
    if (this.isBrowser()) {
      navigator.mediaDevices
        .getUserMedia({ video: {} })
        .then((stream) => {
          this.stream = stream;
          this.videoElement.nativeElement.srcObject = stream;
          this.startFaceDetection();
        })
        .catch((err) => console.error('Error accessing camera: ', err));
    } else {
      console.error('Camera access is only available in the browser.');
    }
  }

  startFaceDetection() {
    this.scanInterval = setInterval(async () => {
      const video = this.videoElement.nativeElement;
      const detections = await faceapi.detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        clearInterval(this.scanInterval);
        this.captureImage();
      } else {
        console.log('No face detected, retrying...');
      }
    }, 1000);
  }

  async captureImage() {
    const video = this.videoElement.nativeElement;
    const canvas = faceapi.createCanvasFromMedia(video);

    if (!canvas) {
      console.error('Failed to create canvas from video');
      return;
    }

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Lấy dữ liệu hình ảnh từ canvas với định dạng RGBA
    const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
    if (!imageData) {
      console.error('Failed to get image data from canvas');
      return;
    }

    // Chuyển đổi từ RGBA sang RGB (bỏ đi kênh alpha)
    const rgbData = this.convertToRGB(imageData);

    // Lưu ảnh RGB (không kênh alpha)
    this.uploadedImage = this.createImageFromRGB(rgbData, canvas.width, canvas.height);

    this.stopCamera();

    // Tạo blob từ dữ liệu RGB và gửi tới API
    const imageBlob = await this.canvasToBlob(rgbData, canvas.width, canvas.height);
    this.sendImageToAPI(imageBlob);
  }

  convertToRGB(imageData: ImageData): Uint8ClampedArray {
    const { data, width, height } = imageData;
    const rgbData = new Uint8ClampedArray(width * height * 3); // Mỗi pixel chỉ 3 kênh RGB

    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      rgbData[j] = data[i];     // Red
      rgbData[j + 1] = data[i + 1]; // Green
      rgbData[j + 2] = data[i + 2]; // Blue
      // Bỏ qua kênh alpha (data[i + 3])
    }

    return rgbData;
  }

  createImageFromRGB(rgbData: Uint8ClampedArray, width: number, height: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Failed to create canvas context');
      return '';
    }

    // Tạo ImageData từ RGB
    const imageData = new ImageData(new Uint8ClampedArray(rgbData), width, height);
    context.putImageData(imageData, 0, 0);

    // Trả về hình ảnh dưới dạng URL
    return canvas.toDataURL('image/png');
  }

  canvasToBlob(rgbData: Uint8ClampedArray, width: number, height: number): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Failed to create canvas context');
        resolve(new Blob()); // Return an empty blob if conversion fails
        return;
      }

      // Tạo lại ImageData từ dữ liệu RGB và đặt vào canvas
      const imageData = new ImageData(new Uint8ClampedArray(rgbData), width, height);
      context.putImageData(imageData, 0, 0);

      // Chuyển canvas thành Blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          console.error('Failed to convert canvas to blob');
          resolve(new Blob()); // Return an empty blob if conversion fails
        }
      }, 'image/png');
    });
  }

  sendImageToAPI(file: Blob) {
    const apiUrl = 'http://127.0.0.1:8000/uploadfile/';
    const formData = new FormData();
    formData.append('file', file);

    this.http.post<ApiResponse>(apiUrl, formData).subscribe({
      next: (response) => {
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

  stopCamera() {
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach((track) => track.stop());
      this.stream = null;
    }
  }

  stopFaceDetection() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopFaceDetection();
  }
}
