import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header>
        <h1>Gen UI - Conversational AI</h1>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    header {
      background-color: #1976d2;
      color: white;
      padding: 1rem 2rem;
    }
    
    header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    main {
      flex: 1;
      padding: 2rem;
    }
  `],
})
export class AppComponent {
  title = 'Gen UI';
}
