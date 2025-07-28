import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { View } from 'react-native';
import DevMenu from '../../components/DevMenu';
import NetworkDiagnostic from '../../components/NetworkDiagnostic';
import BiographyViewScreen from '../screens/BiographyViewScreen';
import CreateBiographyScreen from '../screens/CreateBiographyScreen';
import EditBiographyScreen from '../screens/EditBiographyScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import FoldersScreen from '../screens/FoldersScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SignupScreen from '../screens/SignupScreen';

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

const Stack = createStackNavigator<RootStackParamList>();

function AppStack() {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateBiography" component={CreateBiographyScreen} />
        <Stack.Screen name="Folders" component={FoldersScreen} />
        <Stack.Screen name="BiographyView" component={BiographyViewScreen} />
        <Stack.Screen name="EditBiography" component={EditBiographyScreen} />
        <Stack.Screen name="NetworkDiagnostic" component={NetworkDiagnostic} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
      
      {/* Dev Menu - agora dentro do NavigationContainer */}
      <DevMenu />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
}
