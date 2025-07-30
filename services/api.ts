import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração base da API
const API_BASE_URLS = [
  'http://localhost:3000',      // Servidor local
  'https://lembrademim.onrender.com',  // Servidor de produção
  'http://10.0.2.2:3000',       // Android Emulator (fallback)
  'http://192.168.1.67:3000',   // IP local da rede (fallback)
];

// Função para obter o token de autenticação
export async function getAuthToken(): Promise<string | null> {
  try {
    // Usar AsyncStorage no React Native
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.warn('Erro ao obter token:', error);
    return null;
  }
}

// Função para criar headers com autenticação (versão síncrona para uso imediato)
export function createAuthHeadersSync(token: string | null, additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// Função para criar headers com autenticação (versão assíncrona)
export async function createAuthHeaders(additionalHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return createAuthHeadersSync(token, additionalHeaders);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Tenta extrair detalhes da resposta se for uma string JSON
    if (typeof response === 'string') {
      try {
        const parsedResponse = JSON.parse(response);
        this.response = parsedResponse;
        
        // Adiciona mais contexto à mensagem de erro, se disponível
        if (parsedResponse.message) {
          this.message = `${message}: ${parsedResponse.message}`;
        }
      } catch (e) {
        // Se não conseguir analisar, mantém a resposta como está
        this.response = response;
      }
    }
  }
}

// Função utilitária para fazer requisições com fallback de URLs
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<T> {
  let lastError: Error | null = null;

  // Removido console.log para evitar mensagens de erro na tela

  for (const baseUrl of API_BASE_URLS) {
    try {
      const url = `${baseUrl}${endpoint}`;
      
      // Só adicionar headers de auth se requireAuth for true
      const headers = requireAuth 
        ? await createAuthHeaders(options.headers as Record<string, string>)
        : {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {})
          };
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Tentar extrair mensagem mais amigável do erro
        let errorMessage = `HTTP Error: ${response.status}`;
        
        try {
          // Tenta parse do JSON para extrair mensagens detalhadas
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch (parseError) {
          // Se não conseguir fazer parse, usa o texto como está
          if (errorText && errorText.length < 100) {
            errorMessage = errorText;
          }
        }
        
        throw new ApiError(
          errorMessage,
          response.status,
          errorText
        );
      }

      // Verificar se a resposta tem conteúdo
      const text = await response.text();
      
      if (!text) {
        throw new ApiError('Resposta vazia do servidor', response.status);
      }

      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (parseError) {
        throw new ApiError(
          `Erro ao processar resposta do servidor: ${parseError instanceof Error ? parseError.message : 'Formato inválido'}`,
          response.status,
          text
        );
      }
    } catch (error) {
      lastError = error as Error;
      continue; // Tenta a próxima URL
    }
  }

  throw lastError || new Error('Todas as URLs falharam');
}

// Função para requisições públicas (sem autenticação)
export async function publicApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const result = await apiRequest<T>(endpoint, options, false);
  return result;
}

// Função para requisições que não retornam JSON
export async function apiRequestNoJson(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let lastError: Error | null = null;

  for (const baseUrl of API_BASE_URLS) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const headers = await createAuthHeaders(options.headers as Record<string, string>);
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new ApiError(
          `HTTP Error: ${response.status}`,
          response.status,
          await response.text()
        );
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      continue; // Tenta a próxima URL
    }
  }

  throw lastError || new Error('Todas as URLs falharam');
}

// Função para diagnosticar conectividade com o backend
export async function checkBackendConnectivity(): Promise<{
  isConnected: boolean;
  workingUrl?: string;
  errors: string[];
}> {
  const errors: string[] = [];
  
  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          isConnected: true,
          workingUrl: baseUrl,
          errors
        };
      } else {
        const error = `${baseUrl}: HTTP ${response.status}`;
        errors.push(error);
      }
    } catch (error) {
      const errorMsg = `${baseUrl}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      errors.push(errorMsg);
    }
  }

  return {
    isConnected: false,
    errors
  };
}
