import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
@Component({
  selector: 'app-face-scan',
  templateUrl: './face-scan.component.html',
  styleUrls: ['./face-scan.component.css'],
  standalone: true,  // Đảm bảo thuộc tính này có mặt
  imports: [CommonModule, HttpClientModule],
})
export class FaceScanComponent {
  uploadedImage: string | null = null;  // Để hiển thị ảnh đã upload
  isMatched: boolean | null = null;  // Trạng thái so khớp
  userName: string | null = null;  // Lưu tên người dùng được nhận diện

  constructor(private http: HttpClient) {}

  // Hàm xử lý khi người dùng chọn ảnh
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      
      reader.onload = () => {
        this.uploadedImage = reader.result as string;
        this.sendImageToAPI(file);  // Gửi file đến API sau khi ảnh đã được chọn
      };
      
      reader.readAsDataURL(file);  // Hiển thị ảnh trong giao diện
    }
  }

  // Hàm gửi ảnh tới API để nhận diện
  sendImageToAPI(file: File) {
    const apiUrl = 'http://127.0.0.1:8000/uploadfile/';  // Đường dẫn API của bạn

    const formData = new FormData();
    formData.append('file', file);  // Gửi file trực tiếp

    this.http.post(apiUrl, formData).subscribe({
      next: (response: any) => {
        if (response.FIRSTNAME && response.LASTNAME) {
          this.isMatched = true;
          this.userName = `${response.FIRSTNAME} ${response.LASTNAME}`;  // Hiển thị tên người dùng
        } else {
          this.isMatched = false;
          this.userName = null;  // Không tìm thấy người dùng
        }
      },
      error: (err) => {
        console.error('Error uploading image', err);
        this.isMatched = false;
        this.userName = null;
      },
    });
  }
}
