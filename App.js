import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import StudentScreen from './screens/StudentScreen';
import WardenScreen from './screens/WardenScreen';
import GuardScreen from './screens/GuardScreen'; // Ye nayi line

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
        <Stack.Screen name="Student" component={StudentScreen} options={{ title: 'Student Dashboard' }} />
        <Stack.Screen name="Warden" component={WardenScreen} options={{ title: 'Warden Dashboard' }} />
        <Stack.Screen name="Guard" component={GuardScreen} options={{ title: 'Guard Scanner' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}