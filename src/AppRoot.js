import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/loginscreen';
import StudentScreen from './screens/studentscreen';
import WardenScreen from './screens/wardenscreen';
import GuardScreen from './screens/gaurdscreen';
import ProfileScreen from './screens/profilescreen';

const Stack = createNativeStackNavigator();

export default function AppRoot() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#E66A2C',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '800',
            letterSpacing: 0.2,
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Student"
          component={StudentScreen}
          options={{
            title: 'Student Dashboard',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Warden"
          component={WardenScreen}
          options={{ title: 'Warden Dashboard', headerShown: false }}
        />
        <Stack.Screen
          name="Guard"
          component={GuardScreen}
          options={{ title: 'Guard Scanner', headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Student Profile', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
