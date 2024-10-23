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

    // Chuyển đổi canvas thành base64
    this.uploadedImage = canvas.toDataURL('image/png');
    this.stopCamera();

    // Gửi base64 đến API
    this.sendImageToAPI(this.uploadedImage);
  }

  sendImageToAPI(base64Image: string) {
    const apiUrl = 'http://127.0.0.1:8000/upload-face/';
    
    // Tạo đối tượng JSON chứa chuỗi base64
    const data = {
      image: base64Image
    };

    this.http.post<ApiResponse>(apiUrl, data).subscribe({
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
