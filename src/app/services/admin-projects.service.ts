import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Project } from '../shared/types/project.types';
import type { ApiAck, ApiSuccess } from '../shared/types/api.types';

@Injectable({
  providedIn: 'root',
})
export class AdminProjectsService {
  private readonly http = inject(HttpClient);

  deleteProject(projectId: string): Observable<void> {
    return this.http.delete<ApiAck>(`/api/admin/projects/${projectId}`).pipe(map(() => undefined));
  }

  createProject(payload: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Observable<Project> {
    return this.http.post<ApiSuccess<Project>>('/api/admin/projects', payload).pipe(map((response) => response.data));
  }

  updateProject(projectId: string, payload: Partial<Project>): Observable<Project> {
    return this.http.put<ApiSuccess<Project>>(`/api/admin/projects/${projectId}`, payload).pipe(map((response) => response.data));
  }
}
