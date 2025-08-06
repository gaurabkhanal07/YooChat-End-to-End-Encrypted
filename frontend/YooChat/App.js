import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "./screens/Login";
import SignUp from "./screens/SignUp";
import Home from "./screens/Home";
import ChatScreen from "./screens/ChatScreen";   
import Logout from "./screens/Logout";

console.log("Login:", Login);
console.log("SignUp:", SignUp);
console.log("Home:", Home);
console.log("Logout:", Logout);
console.log("ChatScreen:", ChatScreen);
//console.log("Profile:", Profile);

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
      
        <Stack.Screen name="Logout" component={Logout} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}