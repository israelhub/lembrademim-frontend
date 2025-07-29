// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: { folderId?: string };
  CreateBiography: undefined;
  Folders: undefined;
  BiographyView: { biographyId: string };
  EditBiography: { biographyId: string };
  EmailVerification: { email: string };
  ResetPassword: { email: string; code: string };
  NetworkDiagnostic: undefined;
  Settings: undefined;
};

// Common Types
export interface User {
  id: string;
  name: string;
  email: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
