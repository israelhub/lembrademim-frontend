import { apiRequest } from './api';

// Tipos para as APIs de biografia
export interface Biography {
  id: string;
  name: string;
  cellphoneNumber: string;
  birthDate: string;
  tags: string[];
  notes: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBiographyRequest {
  name: string;
  cellphoneNumber: string;
  birthDate: string;
  tags: string[];
  notes: string;
  profileImage?: string;
}

export interface CreateBiographyResponse {
  id: string;
  name: string;
  cellphoneNumber: string;
  birthDate: string;
  tags: string[];
  notes: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

// Serviços de biografia
export const biographyService = {
  // Criar uma nova biografia
  async create(data: CreateBiographyRequest): Promise<CreateBiographyResponse> {
    return apiRequest<CreateBiographyResponse>('/biography', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Buscar todas as biografias
  async getAll(): Promise<Biography[]> {
    return apiRequest<Biography[]>('/biography');
  },

  // Buscar biografias com filtros
  async search(params?: { search?: string; tag?: string }): Promise<Biography[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.tag) queryParams.append('tag', params.tag);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/biography/search?${queryString}` : '/biography/search';
    
    return apiRequest<Biography[]>(endpoint);
  },

  // Buscar biografia por ID
  async getById(id: string): Promise<Biography> {
    return apiRequest<Biography>(`/biography/${id}`);
  },

  // Atualizar biografia
  async update(id: string, data: Partial<CreateBiographyRequest>): Promise<Biography> {
    return apiRequest<Biography>(`/biography/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Deletar biografia
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/biography/${id}`, {
      method: 'DELETE',
    });
  },
};
