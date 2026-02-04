import { Route } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { ConversationLayoutComponent } from './conversations/conversation-layout.component';
import { ConversationListComponent } from './conversations/conversation-list.component';
import { ConversationViewComponent } from './conversations/conversation-view.component';
import { WelcomeScreenComponent } from './conversations/welcome-screen.component';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'conversations',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'conversations',
    canActivate: [authGuard],
    component: ConversationLayoutComponent,
    children: [
      {
        path: '',
        component: ConversationListComponent,
        outlet: 'list',
      },
      {
        path: '',
        component: WelcomeScreenComponent,
        outlet: 'primary',
      },
      {
        path: ':id',
        component: ConversationViewComponent,
        outlet: 'primary',
      },
    ],
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: '**',
    redirectTo: 'conversations',
  },
];
