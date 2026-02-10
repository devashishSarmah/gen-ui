import { Route } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { ConversationLayoutComponent } from './conversations/conversation-layout.component';
import { ConversationListComponent } from './conversations/conversation-list.component';
import { ConversationViewComponent } from './conversations/conversation-view.component';
import { WelcomeScreenComponent } from './conversations/welcome-screen.component';
import { AdminReplayComponent } from './admin/admin-replay.component';

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
    path: 'admin/replay/:conversationId',
    canActivate: [authGuard],
    component: AdminReplayComponent,
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: '**',
    redirectTo: 'conversations',
  },
];
