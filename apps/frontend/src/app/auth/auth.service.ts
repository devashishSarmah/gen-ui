import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { signal } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  UserDto,
} from '@gen-ui/shared';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  
  // Signal-based state management (Angular 21)
  currentUser = signal<UserDto | null>(null);
  isAuthenticatedSignal = signal<boolean>(false);

  register(data: RegisterDto): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/auth/register`, data);
  }

  login(data: LoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/auth/login`, data).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.access_token);
        this.isAuthenticatedSignal.set(true);
        this.loadProfile();
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.isAuthenticatedSignal.set(false);
    this.currentUser.set(null);
  }

  loadProfile(): void {
    this.http.get<UserDto>(`${this.apiUrl}/auth/profile`).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.isAuthenticatedSignal.set(true);
      },
      error: () => {
        this.logout();
      },
    });
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
