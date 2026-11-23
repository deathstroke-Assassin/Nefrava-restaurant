
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalItems: number;
  totalCategories: number;
  totalOrders: number;
  featuredItems: number;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardStats;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = '/api/v1.0/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.apiUrl);
  }
}
