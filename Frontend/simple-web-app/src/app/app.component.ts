import { Component } from '@angular/core';
import { RegisterComponent } from '../register/register.component';
import { EventComponent } from "../event-component/event-component.component";

@Component({
  selector: 'app-root', // Selector của AppComponent
  standalone: true,
  templateUrl: './app.component.html',
  imports: [EventComponent, RegisterComponent] // Import cả EventComponent và RegisterComponent
})
export class AppComponent {}
