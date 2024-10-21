import { Component, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as faceapi from 'face-api.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-face-scan',
  templateUrl: './face-scan.component.html',
  styleUrls: ['./face-scan.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class FaceScanComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video', { static: true }) video!: HTMLVideoElement; // Thay đổi loại thành HTMLVideoElement
  @ViewChild('canvas', { static: true }) canvas!: HTMLCanvasElement; // Thay đổi loại thành HTMLCanvasElement
  uploadedImage: string | null = null; // Hình ảnh đã tải lên
  capturedImage: string | null = null; // Hình ảnh từ camera
  stream: MediaStream | null = null; // Dữ liệu luồng video
  isMatched: boolean | null = null; // Kết quả so khớp
  detectionInterval: any = null; // Để lưu trữ interval phát hiện khuôn mặt
  isLoading: boolean = true; // Trạng thái để hiển thị loading
  errorMessage: string | null = null; // Để hiển thị lỗi nếu có

  ngAfterViewInit(): void {
    this.loadModels().then(() => {
      this.startCamera();
      this.isLoading = false; // Ngừng trạng thái loading sau khi load xong
    }).catch(error => {
      this.errorMessage = 'Error loading face detection models. Please try again later.';
      this.isLoading = false; // Ngừng loading nếu có lỗi
    });
  }

  ngOnDestroy(): void {
    this.stopCamera(); // Dừng camera khi component bị hủy
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
  }

  async loadModels() {
    try {
      // Load các model của face-api.js
      await faceapi.nets.ssdMobilenetv1.loadFromUri('assets/ssd_mobilenetv1_model-weights_manifest.json');
      await faceapi.nets.faceLandmark68Net.loadFromUri('assets/face_landmark_68_face_landmarks_model-weights_manifest.json');
      await faceapi.nets.faceRecognitionNet.loadFromUri('assets/face_recognition_model-weights_manifest.json');
      console.log("Models loaded successfully.");
    } catch (error) {
      console.error("Error loading models:", error);
      this.errorMessage = 'Failed to load face detection models.';
      throw error; // Ném lỗi nếu load thất bại
    }
  }

  startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream: MediaStream) => {
        this.stream = stream;
        this.video.srcObject = stream; // Thiết lập luồng video
        this.video.play();
        this.detectFace(); // Bắt đầu nhận diện khuôn mặt
      })
      .catch(err => {
        console.error("Error accessing camera:", err);
        this.errorMessage = 'Unable to access the camera. Please check your permissions.';
      });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async detectFace() {
    const videoElement = this.video;

    this.detectionInterval = setInterval(async () => {
      if (!videoElement || videoElement.readyState !== 4) {
        console.warn("Video is not ready for detection.");
        return;
      }

      const detection = await faceapi.detectSingleFace(videoElement, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        console.log("Face detected!");
        this.captureImage(); // Tự động chụp ảnh khi phát hiện khuôn mặt
        clearInterval(this.detectionInterval); // Dừng phát hiện khi đã chụp ảnh
      } else {
        console.log("No face detected.");
      }
    }, 100); // Giảm thời gian phát hiện xuống để cải thiện độ chính xác
  }

  captureImage() {
    const videoWidth = this.video.videoWidth;
    const videoHeight = this.video.videoHeight;

    this.canvas.width = videoWidth;
    this.canvas.height = videoHeight;

    const context = this.canvas.getContext('2d');
    if (context) {
      context.drawImage(this.video, 0, 0, videoWidth, videoHeight);
      this.capturedImage = this.canvas.toDataURL('image/png'); // Lưu hình ảnh đã chụp

      console.log("Image captured from camera.");
      this.compareImages(); // Tự động so sánh khuôn mặt sau khi chụp
    } else {
      console.error("Failed to get canvas context.");
    }
  }

  uploadImage(event: any) {
    const file = event.target.files[0];
    if (!file) {
      console.warn("No file selected.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.uploadedImage = e.target.result; // Hình ảnh đã tải lên
      console.log("Image uploaded:", this.uploadedImage);
      this.compareImages(); // Tự động so sánh sau khi ảnh được tải lên
    };
    reader.readAsDataURL(file);
  }

  async compareImages() {
    if (!this.uploadedImage || !this.capturedImage) {
      console.error("Uploaded or captured image is missing.");
      this.isMatched = false;
      return;
    }

    try {
      console.log("Comparing faces...");
      const img1 = await faceapi.fetchImage(this.uploadedImage);
      const img2 = await faceapi.fetchImage(this.capturedImage);

      const fullFaceDescription1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
      const fullFaceDescription2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();

      if (fullFaceDescription1 && fullFaceDescription2) {
        const distance = faceapi.euclideanDistance(
          fullFaceDescription1.descriptor, fullFaceDescription2.descriptor
        );
        const threshold = 0.4; // Điều chỉnh ngưỡng so sánh chặt hơn
        this.isMatched = distance < threshold;
        console.log('Faces Matched:', this.isMatched, 'Distance:', distance);
      } else {
        console.error("One or both faces could not be detected.");
        this.isMatched = false;
      }
    } catch (error) {
      console.error("Error comparing images:", error);
      this.isMatched = false;
    }
  }
}
