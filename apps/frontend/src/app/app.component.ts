import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header>
        <img class="logo" [src]="'https://res.cloudinary.com/dmm7pipxt/image/upload/w_192,h_128/v1770762472/Gen%20UI/Layer/logo_w1jdum.png'" />
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
      color: white;
      padding: 0.75rem 1.5rem;
      position: sticky;
      top: 0;
      z-index: 100;
      height: var(--app-header-height, 60px);
      display: flex;
      align-items: center;
    }
    
    main {
      flex: 1;
      overflow: hidden;
    }
  `],
})
export class AppComponent {
  title = 'Gen UI';
}
