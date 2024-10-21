// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { CameraComponent } from '../camera/camera.component';
import { RegisterComponent } from '../register/register.component'; // Import component đăng ký

export const routes: Routes = [
  { path: '', component: CameraComponent }, // Route mặc định
  { path: 'register', component: RegisterComponent }, // Route đến trang đăng ký
];
