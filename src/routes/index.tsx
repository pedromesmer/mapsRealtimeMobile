import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Map} from '../screens/Map';

const Routes: React.FC = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="Home" component={Map} />
    </Stack.Navigator>
  );
};

export {Routes};
