import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BailleurHomeScreen from './src/screens/BailleurHomeScreen';
import EtudiantHomeScreen from './src/screens/EtudiantHomeScreen';
import PropertyDetailsScreen from './src/screens/PropertyDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ConversationsScreen from './src/screens/ConversationsScreen'; // <-- Écran de liste des messages
import ChatScreen from './src/screens/ChatScreen'; // <-- Écran de discussion en direct
import ColocatairesScreen from './src/screens/ColocatairesScreen'; // <-- Écran de recherche de colocataires
import AjouterColocAnnonceScreen from './src/screens/AjouterColocAnnonceScreen'; // <-- Écran de publication d'annonce
import FavorisScreen from './src/screens/FavorisScreen'; // <-- Écran des logements favoris

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="EtudiantHome" component={EtudiantHomeScreen} />
        <Stack.Screen name="BailleurHome" component={BailleurHomeScreen} />
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
          options={{ headerShown: true, title: "Recherche Colocataires" }} 
        />
        <Stack.Screen 
          name="AjouterColocAnnonce" 
          component={AjouterColocAnnonceScreen} 
          options={{ headerShown: true, title: "Publier une annonce" }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}