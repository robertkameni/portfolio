import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Project } from '../shared/types/project.types';

@Injectable({
  providedIn: 'root',
})
export class AdminProjectsService {
  private readonly http = inject(HttpClient);

  deleteProject(projectId: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/projects/${projectId}`);
  }

  createProject(payload: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Observable<Project> {
    return this.http.post<Project>('/api/admin/projects', payload);
  }

  updateProject(projectId: string, payload: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`/api/admin/projects/${projectId}`, payload);
  }
}
