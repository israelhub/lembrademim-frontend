import { apiRequest } from './api';

// Tipos para as APIs de pasta
export interface Folder {
  id: number;
  name: string;
  userId?: number;
  biographyCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFolderRequest {
  name: string;
}

export interface UpdateFolderRequest {
  name: string;
}

export interface CreateBiographyFolderRequest {
  biographyId: number | string;
  folderId: number | string;
}

export interface BiographyFolder {
  id: number;
  biographyId: number;
  folderId: number;
  createdAt: string;
}

// Serviços de pasta
export const folderService = {
  // Buscar todas as pastas
  async getFolders(): Promise<Folder[]> {
    return apiRequest<Folder[]>('/folder');
  },

  // Buscar pasta por ID
  async getById(id: number): Promise<Folder> {
    return apiRequest<Folder>(`/folder/${id}`);
  },

  // Criar nova pasta
  async createFolder(data: CreateFolderRequest): Promise<Folder> {
    return apiRequest<Folder>('/folder', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Atualizar pasta
  async updateFolder(id: number, data: UpdateFolderRequest): Promise<Folder> {
    try {
      console.log(`✏️ Tentando atualizar pasta ${id} com dados:`, data);
      
      const result = await apiRequest<Folder>(`/folder/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      
      console.log(`✅ Pasta ${id} atualizada com sucesso:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao atualizar pasta ${id}:`, error);
      throw error;
    }
  },

  // Deletar pasta
  async deleteFolder(id: number): Promise<void> {
    try {
      console.log(`🗑️ Tentando excluir pasta ${id}`);
      
      // Tenta buscar biografias associadas à pasta antes de excluí-la
      try {
        const biographies = await this.getBiographiesByFolder(id.toString());
        if (biographies && biographies.length > 0) {
          console.log(`⚠️ Pasta ${id} contém ${biographies.length} biografias`);
          throw new Error('Esta pasta contém biografias e não pode ser excluída. Remova as biografias da pasta primeiro.');
        }
      } catch (checkError) {
        if (checkError instanceof Error && checkError.message.includes('contém biografias')) {
          throw checkError;
        }
        // Se o erro não for sobre biografias, continuamos com a exclusão
        console.log('⚠️ Verificação de biografias: continuando com a exclusão', checkError);
      }
      
      // Excluir a pasta
      // Para métodos DELETE, alguns servidores não aceitam body, então usamos params de URL
      await apiRequest<void>(`/folder/${id}`, {
        method: 'DELETE',
        // Não incluímos body em requisições DELETE
      });
      
      console.log(`✅ Pasta ${id} excluída com sucesso`);
      return;
    } catch (error) {
      console.error(`❌ Erro ao excluir pasta ${id}:`, error);
      
      // Repassar o erro para ser tratado pelo hook
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Erro ao excluir pasta. Verifique se a pasta não tem nenhuma relação com outros dados do sistema.');
      }
    }
  },

  // MÉTODOS PARA BIOGRAPHYFOLDER
  // Buscar todas as pastas
  async getAll(): Promise<Folder[]> {
    return apiRequest<Folder[]>('/folder');
  },

  // Criar associação entre biografia e pasta
  async addBiographyToFolder(data: CreateBiographyFolderRequest): Promise<BiographyFolder> {
    try {
      console.log('🔗 Adicionando biografia à pasta:', data);
      
      // Converter IDs para números se forem strings
      const requestData = {
        biographyId: typeof data.biographyId === 'string' ? parseInt(data.biographyId as string, 10) : data.biographyId,
        folderId: typeof data.folderId === 'string' ? parseInt(data.folderId as string, 10) : data.folderId
      };
      
      console.log('🔗 Dados convertidos:', requestData);
      
      return apiRequest<BiographyFolder>('/biographyfolder', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar biografia à pasta:', error);
      throw error;
    }
  },

  // Remover associação entre biografia e pasta
  async removeBiographyFromFolder(biographyId: number | string, folderId: number | string): Promise<void> {
    try {
      console.log('🗑️ Removendo biografia da pasta:', { biographyId, folderId });
      
      // Converter IDs para números se forem strings
      const numericBiographyId = typeof biographyId === 'string' ? parseInt(biographyId, 10) : biographyId;
      const numericFolderId = typeof folderId === 'string' ? parseInt(folderId as string, 10) : folderId;
      
      console.log('🗑️ IDs convertidos:', { numericBiographyId, numericFolderId });
      
      // Para métodos DELETE, pode ser melhor usar querystring ou parâmetros URL em vez de body
      // Tentativa 1: DELETE com parâmetros na URL
      try {
        return await apiRequest<void>(
          `/biographyfolder/remove?biographyId=${numericBiographyId}&folderId=${numericFolderId}`, 
          { method: 'DELETE' }
        );
      } catch (error1) {
        console.log('⚠️ Falha na tentativa 1 de remoção, tentando alternativa:', error1);
        
        // Tentativa 2: DELETE com body tradicional
        return await apiRequest<void>('/biographyfolder', {
          method: 'DELETE',
          body: JSON.stringify({
            biographyId: numericBiographyId,
            folderId: numericFolderId
          }),
        });
      }
    } catch (error) {
      console.error('❌ Erro ao remover biografia da pasta:', error);
      throw error;
    }
  },

  // Buscar todas as pastas de uma biografia
  async getFoldersByBiography(biographyId: string | number): Promise<Folder[]> {
    try {
      console.log('🔎 Iniciando busca de pastas para biografia:', biographyId);
      console.log('🔎 Tipo do biographyId:', typeof biographyId);
      
      // Converter para número se for string numérica
      const numericId = typeof biographyId === 'string' ? parseInt(biographyId, 10) : biographyId;
      
      console.log('🔎 ID convertido para número:', numericId);
      
      // Verificar se temos token de autenticação
      const { getAuthToken } = await import('./api');
      const token = await getAuthToken();
      console.log('🔐 Token disponível:', token ? 'SIM' : 'NÃO');
      
      // Tentar a chamada da API com o ID numérico
      try {
        const result = await apiRequest<Folder[]>(`/biographyfolder/biography/${numericId}`);
        console.log('📁 Resultado da API getFoldersByBiography:', result);
        console.log('📁 Tipo do resultado:', typeof result);
        console.log('📁 É array?', Array.isArray(result));
        console.log('📁 Pastas encontradas:', result?.length || 0);
        
        if (Array.isArray(result) && result.length > 0) {
          result.forEach((folder, index) => {
            console.log(`📁 Pasta ${index + 1}:`, {
              id: folder.id,
              name: folder.name,
              userId: folder.userId,
              biographyCount: folder.biographyCount
            });
          });
        }
        
        return result || [];
      } catch (apiError) {
        // Verificar se o erro é 404 "Biografia não encontrada"
        // Neste caso, a biografia existe mas não tem pastas associadas
        if (apiError instanceof Error && 
            apiError.message.includes('404') && 
            (apiError.message.includes('Biografia não encontrada') || 
             (apiError as any).response?.includes('Biografia não encontrada'))) {
          console.log('⚠️ Biografia existe mas não tem pastas associadas, retornando array vazio');
          return [];
        }
        
        console.error('❌ Erro na API com ID numérico, tentando com ID original:', apiError);
        
        // Se o erro não for 404 "Biografia não encontrada", tenta com o ID original
        try {
          const result = await apiRequest<Folder[]>(`/biographyfolder/biography/${biographyId}`);
          return result || [];
        } catch (secondError) {
          // Se ambas as tentativas falharem, verifica novamente se é o erro "Biografia não encontrada"
          if (secondError instanceof Error && 
              secondError.message.includes('404') && 
              (secondError.message.includes('Biografia não encontrada') || 
               (secondError as any).response?.includes('Biografia não encontrada'))) {
            console.log('⚠️ Biografia existe mas não tem pastas associadas, retornando array vazio');
            return [];
          }
          
          throw secondError;
        }
      }
    } catch (error) {
      console.error('❌ Erro detalhado ao buscar pastas da biografia:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'Sem stack trace');
      // Retornar array vazio em vez de lançar erro para evitar que a UI quebre
      console.log('⚠️ Retornando array vazio devido ao erro');
      return [];
    }
  },

  // Buscar todas as biografias de uma pasta
  async getBiographiesByFolder(folderId: string | number): Promise<any[]> {
    try {
      console.log('📖 Buscando biografias para pasta:', folderId);
      
      // Converter para número se for string
      const numericId = typeof folderId === 'string' ? parseInt(folderId, 10) : folderId;
      console.log('📖 ID convertido para número:', numericId);
      
      try {
        // Tentar com ID numérico
        const result = await apiRequest<any[]>(`/biographyfolder/folder/${numericId}`);
        console.log('📖 Biografias encontradas:', result?.length || 0);
        
        // Adicionar logs para entender a estrutura dos dados
        if (result && result.length > 0) {
          console.log('📖 Exemplo do primeiro resultado:', JSON.stringify(result[0]));
          
          // Verificar qual é o formato da resposta
          const keys = Object.keys(result[0]);
          console.log('📖 Propriedades do primeiro item:', keys.join(', '));
          
          // Ver se temos a propriedade biography ou biographyId
          if (result[0].biography) {
            console.log('📖 Formato detectado: tem propriedade biography');
          } else if (result[0].biographyId) {
            console.log('📖 Formato detectado: tem propriedade biographyId');
          } else {
            console.log('📖 Formato desconhecido, verificando propriedades manualmente');
          }
        }
        
        return result || [];
      } catch (apiError) {
        console.error('❌ Erro na API com ID numérico, tentando com ID original:', apiError);
        // Se falhar com ID numérico, tenta com o ID original
        const result = await apiRequest<any[]>(`/biographyfolder/folder/${folderId}`);
        
        // Mesmo diagnóstico para a segunda tentativa
        if (result && result.length > 0) {
          console.log('📖 [2ª tentativa] Exemplo do primeiro resultado:', JSON.stringify(result[0]));
          console.log('📖 [2ª tentativa] Propriedades:', Object.keys(result[0]).join(', '));
        }
        
        return result || [];
      }
    } catch (error) {
      console.error('❌ Erro ao buscar biografias da pasta:', error);
      // Retornar array vazio em vez de lançar erro para evitar que a UI quebre
      console.log('⚠️ Retornando array vazio devido ao erro');
      return [];
    }
  },
  
  // Remover biografia de todas as pastas
  async removeBiographyFromAllFolders(biographyId: string | number): Promise<void> {
    try {
      console.log('🗑️ Removendo biografia de todas as pastas:', biographyId);
      
      // Converter para número se for string
      const numericId = typeof biographyId === 'string' ? parseInt(biographyId, 10) : biographyId;
      
      // Buscar todas as pastas da biografia
      const folders = await this.getFoldersByBiography(numericId);
      
      // Remover biografia de cada pasta
      const promises = folders.map(folder => 
        this.removeBiographyFromFolder(numericId, folder.id)
      );
      
      // Aguardar todas as remoções
      await Promise.all(promises);
      
      console.log('✅ Biografia removida de todas as pastas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao remover biografia de todas as pastas:', error);
      throw error;
    }
  },
};
