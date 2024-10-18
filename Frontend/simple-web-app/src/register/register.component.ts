import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // Import HttpClient để gửi yêu cầu
import { Observable } from 'rxjs'; // Import Observable

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule]
})
export class RegisterComponent {
  registerForm: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  showPopup = false;

  constructor(private fb: FormBuilder, private http: HttpClient) { // Inject HttpClient
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      image: [null, Validators.required]
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.registerForm.patchValue({ image: file });
      this.registerForm.get('image')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file); // Đọc file dưới dạng Base64
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const formData = new FormData();
      formData.append('firstName', this.registerForm.get('firstName')?.value);
      formData.append('lastName', this.registerForm.get('lastName')?.value);
      
      // Lưu trữ hình ảnh dưới dạng Base64
      const imageFile = this.registerForm.get('image')?.value;
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = reader.result; // Hình ảnh dưới dạng Base64
        formData.append('image', base64data as string); // Thêm Base64 vào FormData

        // Gửi dữ liệu đến API
        this.addData(formData).subscribe({
          next: (response) => {
            console.log('Dữ liệu đã được thêm!', response);
            this.showPopup = true; // Hiển thị popup thành công
          },
          error: (error) => {
            console.error('Có lỗi xảy ra khi thêm dữ liệu!', error);
          }
        });
      };

      reader.readAsDataURL(imageFile); // Đọc file dưới dạng Base64
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  // Hàm gửi dữ liệu đến API
  addData(data: FormData): Observable<any> {
    const apiUrl = 'https://localhost:7155/api/CRUD'; // Địa chỉ API của bạn
    return this.http.post<any>(apiUrl, data); // Gửi yêu cầu POST
  }

  closePopup(): void {
    this.showPopup = false;
  }
}
