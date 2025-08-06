import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Logout({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>You are logged out.</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.buttonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#8948C2', 
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
