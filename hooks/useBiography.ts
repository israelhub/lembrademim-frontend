import { useState } from 'react';
import { Alert } from 'react-native';
import { 
  biographyService, 
  folderService, 
  CreateBiographyRequest, 
  ApiError,
  type Folder,
  type Biography 
} from '../services';

export interface UseBiographyParams {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useBiography({ onSuccess, onError }: UseBiographyParams = {}) {
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Criar biografia com pastas associadas
  const createBiography = async (
    data: CreateBiographyRequest, 
    selectedFolderIds: string[] = []
  ) => {
    setLoading(true);
    try {
      // Criar a biografia
      const biography = await biographyService.create(data);

      // Se há pastas selecionadas, criar as associações
      if (selectedFolderIds.length > 0) {
        const promises = selectedFolderIds.map(folderId =>
          folderService.addBiographyToFolder({
            biographyId: parseInt(biography.id),
            folderId: parseInt(folderId),
          })
        );
        
        await Promise.all(promises);
      }

      Alert.alert('Sucesso', 'Biografia criada com sucesso!');
      onSuccess?.();
      return biography;
    } catch (error) {
      let errorMessage = 'Não foi possível criar a biografia';
      
      if (error instanceof ApiError) {
        if (error.status === 400) {
          errorMessage = 'Dados inválidos. Verifique as informações inseridas.';
        } else if (error.status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente.';
        }
      }
      
      Alert.alert('Erro', errorMessage);
      onError?.(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Buscar pastas disponíveis
  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      console.log('📂 Buscando pastas para modal de seleção...');
      const foldersData = await folderService.getFolders();
      console.log(`📂 Pastas encontradas: ${foldersData.length}`);
      setFolders(Array.isArray(foldersData) ? foldersData : []);
    } catch (error) {
      console.error('Erro ao buscar pastas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as pastas');
      setFolders([]);
    } finally {
      setLoadingFolders(false);
    }
  };

  // Buscar biografia por ID
  const getBiography = async (id: string) => {
    try {
      return await biographyService.getById(id);
    } catch (error) {
      console.error('Erro ao buscar biografia:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da biografia');
      throw error;
    }
  };

  // Atualizar biografia
  const updateBiography = async (id: string, data: Partial<CreateBiographyRequest>) => {
    setLoading(true);
    try {
      const updatedBiography = await biographyService.update(id, data);
      Alert.alert('Sucesso', 'Biografia atualizada com sucesso!');
      onSuccess?.();
      return updatedBiography;
    } catch (error) {
      let errorMessage = 'Não foi possível atualizar a biografia';
      
      if (error instanceof ApiError) {
        if (error.status === 400) {
          errorMessage = 'Dados inválidos. Verifique as informações inseridas.';
        } else if (error.status === 404) {
          errorMessage = 'Biografia não encontrada.';
        } else if (error.status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente.';
        }
      }
      
      Alert.alert('Erro', errorMessage);
      onError?.(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estados
    loading,
    folders,
    loadingFolders,
    
    // Funções
    createBiography,
    fetchFolders,
    getBiography,
    updateBiography
  };
}
