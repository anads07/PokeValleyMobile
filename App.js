import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, ActivityIndicator, ImageBackground } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import GameScreen from './screens/GameScreen';

const Stack = createNativeStackNavigator();

function SplashScreen({ navigation }) {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Pokemon-Solid': require('./assets/fonts/PokemonSolid.ttf'),
          'PressStart2P-Regular': require('./assets/fonts/PressStart2P-Regular.ttf'),
        });
        setFontLoaded(true);
      } catch (error) {
        console.error("Erro ao carregar a fonte: ", error);
        setFontLoaded(false); 
      }
    }
    loadFonts();
  }, []);

  useEffect(() => {
    if (fontLoaded) {
      const timer = setTimeout(() => {
        navigation.replace('Game');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fontLoaded, navigation]);

  if (!fontLoaded) {
    return (
      <ImageBackground 
        source={require('./assets/src/fundo.png')} 
        style={styles.backgroundImage}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffde59" />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground 
      source={require('./assets/src/fundo.png')} 
      style={styles.backgroundImage}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>POKEVALLEY</Text>
        <Image 
          source={require('./assets/src/logo.png')} 
          style={styles.logoImage}
        />
      </View>
    </ImageBackground>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 48,
    color: '#ffde59',
    textShadowColor: 'black',
    textShadowOffset: { width: -2, height: 2 },
    textShadowRadius: 5,
    fontFamily: 'Pokemon-Solid',
  },
  logoImage: {
    marginTop: 5,
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
});
