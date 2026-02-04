import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      <h2>Welcome to Gen UI</h2>
      <p>AI-Generated Angular Components for Conversational UI</p>
      
      <div class="actions">
        <a routerLink="/login" class="btn btn-primary">Login</a>
        <a routerLink="/register" class="btn btn-secondary">Register</a>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    
    h2 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    
    p {
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 2rem;
    }
    
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    
    .btn {
      padding: 0.75rem 2rem;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
    }
    
    .btn-primary {
      background-color: #1976d2;
      color: white;
    }
    
    .btn-secondary {
      background-color: #e0e0e0;
      color: #333;
    }
  `],
})
export class HomeComponent {}
