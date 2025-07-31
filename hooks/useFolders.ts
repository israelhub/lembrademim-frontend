import { useState, useEffect } from 'react';
import { folderService, Folder } from '../services/folderService';

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      const foldersData = await folderService.getFolders();
      setFolders(foldersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pastas');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (name: string) => {
    try {
      const newFolder = await folderService.createFolder({ name });
      // Atualizar a lista local de pastas imediatamente
      setFolders(prev => [...prev, newFolder]);
      return newFolder;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar pasta');
    }
  };

  const updateFolder = async (id: number, name: string) => {
    try {
      console.log(`🔄 Iniciando atualização da pasta ${id} para o nome "${name}"`);
      const updatedFolder = await folderService.updateFolder(id, { name });
      
      // Atualizar a lista de pastas localmente
      setFolders(prev => 
        prev.map(folder => 
          folder.id === id ? updatedFolder : folder
        )
      );
      
      console.log('✅ Pasta atualizada com sucesso:', updatedFolder);
      return updatedFolder;
    } catch (err) {
      console.error('❌ Erro detalhado ao atualizar pasta:', err);
      
      // Extrair mensagem de erro mais significativa
      let errorMessage = 'Erro ao atualizar pasta';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Lançar o erro para ser tratado pelo componente
      throw new Error(errorMessage);
    }
  };

  const deleteFolder = async (id: number) => {
    try {
      console.log(`🗑️ Iniciando exclusão da pasta ${id}`);
      await folderService.deleteFolder(id);
      
      // Remover a pasta da lista local após exclusão bem-sucedida
      setFolders(prev => prev.filter(folder => folder.id !== id));
      
      console.log('✅ Pasta excluída com sucesso');
      return true; // Indica sucesso
    } catch (err) {
      console.error('❌ Erro detalhado ao excluir pasta:', err);
      
      // Extrair a mensagem de erro
      let errorMessage = 'Erro ao deletar pasta';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Determinar o tipo de erro para mostrar uma mensagem adequada
      if (errorMessage.includes('contém biografias')) {
        throw new Error('Esta pasta contém biografias e não pode ser excluída. Remova as biografias da pasta primeiro.');
      } else if (errorMessage.includes('registros associados') || errorMessage.includes('relação com outros dados')) {
        throw new Error('Esta pasta não pode ser excluída porque está vinculada a outros dados no sistema.');
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal server error')) {
        throw new Error('Ocorreu um erro no servidor ao tentar excluir a pasta. A pasta pode ter vínculos que impedem sua exclusão.');
      } else {
        throw new Error(errorMessage);
      }
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  return {
    folders,
    loading,
    error,
    loadFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
};
