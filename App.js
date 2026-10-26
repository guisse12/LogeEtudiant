import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BailleurHomeScreen from './src/screens/BailleurHomeScreen';
import EtudiantHomeScreen from './src/screens/EtudiantHomeScreen';
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import AdminPropertiesScreen from './src/screens/AdminPropertiesScreen';
import AdminUsersScreen from './src/screens/AdminUsersScreen';
import AdminVerifyBailleursScreen from './src/screens/AdminVerifyBailleursScreen';
import AdminReportsScreen from './src/screens/AdminReportsScreen';
import PropertyDetailsScreen from './src/screens/PropertyDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ConversationsScreen from './src/screens/ConversationsScreen';
import ChatScreen from './src/screens/ChatScreen';
import ColocatairesScreen from './src/screens/ColocatairesScreen';
import AjouterColocAnnonceScreen from './src/screens/AjouterColocAnnonceScreen';
import FavorisScreen from './src/screens/FavorisScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="EtudiantHome" component={EtudiantHomeScreen} />
        <Stack.Screen name="BailleurHome" component={BailleurHomeScreen} />
        
        {/* Écrans Administrateur - En-tête natif masqué pour conserver la navbar unique de l'écran */}
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
        <Stack.Screen 
          name="AdminProperties" 
          component={AdminPropertiesScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AdminUsers" 
          component={AdminUsersScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AdminVerifyBailleurs" 
          component={AdminVerifyBailleursScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AdminReports" 
          component={AdminReportsScreen} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        
        {/* Écran des favoris avec en-tête visible */}
        <Stack.Screen 
          name="Favoris" 
          component={FavorisScreen} 
          options={{ headerShown: true, title: "Mes Favoris" }} 
        />
        
        {/* Écrans de messagerie avec en-tête visible */}
        <Stack.Screen 
          name="Conversations" 
          component={ConversationsScreen} 
          options={{ headerShown: true, title: "Mes Messages" }} 
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ headerShown: true }} 
        />

        {/* Écrans de recherche et de publication de colocataires */}
        <Stack.Screen 
          name="ColocatairesScreen" 
          component={ColocatairesScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AjouterColocAnnonce" 
          component={AjouterColocAnnonceScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
