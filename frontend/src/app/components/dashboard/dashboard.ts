import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { DashboardService, DashboardStats } from '../../services/dashboard';
import { Auth } from '../../services/auth';
import { I18nPipe } from '../../services/i18n.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, I18nPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard-shell.css'
})
export class Dashboard implements OnInit {
  readonly stats = signal<DashboardStats | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor(
    private dashboardService: DashboardService,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void { this.loadStats(); }

  loadStats(): void {
    this.loading.set(true);
    this.error.set('');
    this.dashboardService.getStats().subscribe({
      next: response => {
        this.stats.set(response.data);
        this.loading.set(false);
      },
      error: err => {
        console.error('Failed to load dashboard stats:', err);
        this.stats.set(null);
        this.error.set(err.error?.message || 'Failed to load dashboard statistics.');
        this.loading.set(false);
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
