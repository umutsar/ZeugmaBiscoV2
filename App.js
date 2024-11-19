import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomePage from './Screens/HomePage';
import DirectionSelectingPage from './Screens/DirectionSelectingPage';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomePage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Yol Tarifi"
          component={DirectionSelectingPage}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
