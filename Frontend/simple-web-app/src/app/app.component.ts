import { Component } from '@angular/core';
import { RegisterComponent } from '../register/register.component';

@Component({
  selector: 'app-root', // Selector của AppComponent, không phải RegisterComponent
  standalone: true,
  templateUrl: './app.component.html',
  imports: [RegisterComponent] // Import RegisterComponent
})
export class AppComponent {}
