import AsyncStorage from '@react-native-async-storage/async-storage';
import { publicApiRequest } from './api';

// Tipos para autenticação
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;           // Formato esperado pelo frontend
  access_token?: string;    // Formato retornado pelo backend
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ValidateCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordConfirmRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

// Chaves para AsyncStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Serviços de autenticação
export const authService = {
  // Login do usuário
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 Tentando fazer login com:', { email: credentials.email });
    console.log('📤 Enviando requisição para: /auth/login');
    console.log('📦 Dados enviados:', JSON.stringify({ email: credentials.email, password: '[HIDDEN]' }));
    
    const response = await publicApiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    console.log('📥 Resposta recebida:', {
      hasToken: !!(response?.token || response?.access_token),
      hasUser: !!response?.user,
      tokenLength: (response?.token || response?.access_token)?.length || 0,
      userId: response?.user?.id || 'N/A'
    });

    // Validar se a resposta contém os dados necessários
    if (!response) {
      throw new Error('Resposta vazia do servidor');
    }

    // O backend retorna 'access_token' em vez de 'token'
    const token = response.token || response.access_token;
    if (!token) {
      console.error('❌ Token não encontrado na resposta:', response);
      throw new Error('Token não encontrado na resposta do servidor');
    }

    if (!response.user) {
      console.error('❌ Dados do usuário não encontrados na resposta:', response);
      throw new Error('Dados do usuário não encontrados na resposta do servidor');
    }

    console.log('✅ Login bem-sucedido, salvando dados...');

    // Salvar token e dados do usuário
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));

    console.log('💾 Dados salvos no AsyncStorage');
    console.log('🎉 LOGIN REALIZADO COM SUCESSO!');

    // Retornar no formato esperado (normalizando access_token para token)
    return {
      token,
      user: response.user
    };
  },

  // Cadastro do usuário
  async signup(userData: SignupRequest): Promise<LoginResponse> {
    const response = await publicApiRequest<LoginResponse>('/user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // O backend retorna 'access_token' em vez de 'token'
    const token = response.token || response.access_token;
    if (!token) {
      throw new Error('Token não encontrado na resposta do servidor');
    }

    // Salvar token e dados do usuário
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));

    // Retornar no formato esperado (normalizando access_token para token)
    return {
      token,
      user: response.user
    };
  },

  // Logout do usuário
  async logout(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },

  // Obter token armazenado
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  },

  // Obter dados do usuário armazenados
  async getUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem(USER_KEY);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return null;
    }
  },

  // Verificar se está logado
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },

  // Validar token (fazer requisição ao backend)
  async validateToken(): Promise<boolean> {
    try {
      // TODO: Implementar quando houver endpoint de validação
      // await apiRequest<{ valid: boolean }>('/auth/validate');
      
      // Por enquanto, apenas verifica se o token existe
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      // Token inválido, fazer logout
      await this.logout();
      return false;
    }
  },

  // Solicitar reset de senha
  async requestPasswordReset(data: ResetPasswordRequest): Promise<void> {
    return publicApiRequest<void>('/auth/request-reset', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Validar código de reset
  async validateResetCode(data: ValidateCodeRequest): Promise<boolean> {
    try {
      await publicApiRequest<void>('/auth/validate-code', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Confirmar reset de senha
  async confirmPasswordReset(data: ResetPasswordConfirmRequest): Promise<void> {
    return publicApiRequest<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
