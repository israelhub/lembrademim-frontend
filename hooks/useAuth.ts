import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { authService, type User, type LoginRequest, type SignupRequest, ApiError } from '../services';

export interface UseAuthParams {
  onLoginSuccess?: () => void;
  onLogoutSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useAuth({ onLoginSuccess, onLogoutSuccess, onError }: UseAuthParams = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Verificar se o usuário está autenticado ao inicializar
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    setCheckingAuth(true);
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const userData = await authService.getUser();
        setUser(userData);
        setIsAuthenticated(true);
        
        // Validar se o token ainda é válido
        const isValid = await authService.validateToken();
        if (!isValid) {
          await logout();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      await logout();
    } finally {
      setCheckingAuth(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      onLoginSuccess?.();
      return response;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      
      let errorMessage = 'Erro ao fazer login';
      
      if (error instanceof ApiError) {
        if (error.status === 401) {
          errorMessage = 'Email ou senha incorretos';
        } else if (error.status === 400) {
          errorMessage = 'Dados inválidos';
        } else if (error.status === 500) {
          errorMessage = 'Erro interno do servidor';
        } else {
          errorMessage = `Erro do servidor: ${error.status}`;
        }
      } else if (error instanceof Error) {
        // Verificar se é um erro de conectividade
        if (error.message.includes('Todas as URLs falharam') || 
            error.message.includes('Network request failed') ||
            error.message.includes('fetch')) {
          errorMessage = 'Erro de conectividade. Verifique se o servidor está rodando e use o botão "Testar Conectividade" para diagnosticar.';
        } else {
          errorMessage = error.message;
        }
      }
      
      onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: SignupRequest) => {
    setLoading(true);
    try {
      const response = await authService.signup(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      
      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      onLoginSuccess?.();
      
      return response;
    } catch (error) {
      let errorMessage = 'Erro ao criar conta';
      
      if (error instanceof ApiError) {
        if (error.status === 409) {
          errorMessage = 'Este email já está em uso';
        } else if (error.status === 400) {
          errorMessage = 'Dados inválidos';
        }
      }
      
      Alert.alert('Erro', errorMessage);
      onError?.(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      
      onLogoutSuccess?.();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    return await authService.getToken();
  };

  const requestPasswordReset = async (data: { email: string }) => {
    setLoading(true);
    try {
      await authService.requestPasswordReset(data);
      return true;
    } catch (error) {
      let errorMessage = 'Erro ao solicitar redefinição de senha';
      
      if (error instanceof ApiError) {
        if (error.status === 404) {
          errorMessage = 'Email não encontrado';
        } else if (error.status === 400) {
          errorMessage = 'Email inválido';
        }
      }
      
      onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateResetCode = async (data: { email: string, code: string }) => {
    setLoading(true);
    try {
      const isValid = await authService.validateResetCode(data);
      return isValid;
    } catch (error) {
      let errorMessage = 'Erro ao validar código de verificação';
      onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (data: { email: string, code: string, newPassword: string }) => {
    setLoading(true);
    try {
      await authService.confirmPasswordReset(data);
      return true;
    } catch (error) {
      let errorMessage = 'Erro ao redefinir senha';
      
      if (error instanceof ApiError) {
        if (error.status === 400) {
          errorMessage = 'Código inválido ou expirado';
        }
      }
      
      onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estados
    user,
    loading,
    isAuthenticated,
    checkingAuth,
    
    // Funções
    login,
    signup,
    logout,
    getToken,
    checkAuthentication,
    requestPasswordReset,
    validateResetCode,
    resetPassword,
  };
}
