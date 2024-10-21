// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { CameraComponent } from '../camera/camera.component';
import { RegisterComponent } from '../register/register.component'; // Import component đăng ký
import { FaceScanComponent } from './face-scan/face-scan.component';

export const routes: Routes = [
  { path: '', component: CameraComponent }, // Route mặc định
  { path: 'scan', component: FaceScanComponent }, // Route đến trang đăng ký
];
