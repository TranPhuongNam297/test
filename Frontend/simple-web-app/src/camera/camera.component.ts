import { Component, ViewChild, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as faceapi from 'face-api.js';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-camera',
  standalone: true,
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.css'],
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
})
export class CameraComponent implements OnInit, OnDestroy {
  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;  
  public stream: MediaStream | null = null;
  public imageCaptured: boolean = false;
  public isFaceDetected: boolean = false;
  public capturedImageData: string | null = null;
  private faceDetectionInProgress: boolean = false;
  private scanInterval: any;

  constructor(private router: Router) {}

  async ngOnInit() {
    if (this.isBrowser()) {
      await this.loadFaceApiModels();
      // Camera will not start automatically anymore
    }
  }

  isBrowser() {
    return typeof window !== 'undefined';
  }

  async loadFaceApiModels() {
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models'),
      ]);
      console.log('Face API models loaded.');
    } catch (error) {
      console.error('Error loading face-api models: ', error);
    }
  }

  toggleCamera() {
    this.stream ? this.stopCamera() : this.startCamera();
  }

  startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream: MediaStream) => {
        this.stream = stream;
        
        if (this.videoRef && this.videoRef.nativeElement) {
          const videoElement = this.videoRef.nativeElement;
          videoElement.srcObject = stream;
          videoElement.play();
          console.log("Camera started, video stream assigned.");
          this.detectFace();
        } else {
          console.error("Video element is not available.");
        }
      })
      .catch((err) => {
        console.error("Error accessing camera: ", err);
      });
  }
  

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.stopFaceDetection();
  }

  detectFace() {
    const video = this.videoRef.nativeElement;

    this.scanInterval = setInterval(async () => {
      console.log("Detecting face...");
      const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options());

      if (detections.length > 0 && !this.imageCaptured && !this.faceDetectionInProgress) {
        console.log("Face detected!");
        this.isFaceDetected = true;
        this.faceDetectionInProgress = true;
        this.captureImage(detections);
      } else {
        this.isFaceDetected = false;
      }
    }, 1000);
  }

  captureImage(detections: any[]) {
    if (!this.videoRef || !this.canvasRef) {
      console.error("Video or Canvas element is not available.");
      return;
    }
  
    const videoWidth = this.videoRef.nativeElement.videoWidth;
    const videoHeight = this.videoRef.nativeElement.videoHeight;
    const canvas = this.canvasRef.nativeElement;
  
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(this.videoRef.nativeElement, 0, 0, videoWidth, videoHeight);
      this.capturedImageData = canvas.toDataURL('image/png');
      this.imageCaptured = true;
      console.log('Image captured:', this.capturedImageData);
      this.stopCamera(); // Stop camera after capturing the image
      clearInterval(this.scanInterval); // Stop face detection interval
    }
  }
  

  submitData(firstName: string, lastName: string) {
    if (this.capturedImageData) {
      const data = {
        imageBase64: this.capturedImageData,
        firstName: firstName,
        lastName: lastName,
      };
  
      fetch('https://localhost:44320/api/CRUD', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      .then(response => {
        if (response.ok) {
          console.log('Data submitted successfully');
          alert('Bạn đã thêm dữ liệu thành công');
          this.router.navigate(['/scan']);
        } else {
          console.error('Error submitting data');
          alert('Thêm dữ liệu không thành công');
        }
      })
      .catch(err => {
        console.error('Fetch error: ', err);
        alert('Thêm dữ liệu không thành công');
      });
    }
  }  

  stopFaceDetection() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      this.faceDetectionInProgress = false;
    }
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopFaceDetection();
  }
}
