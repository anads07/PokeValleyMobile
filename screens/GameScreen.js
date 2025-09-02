import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import axios from 'axios';

// Componente principal da tela do jogo
export default function GameScreen() {
    // Estados do jogo
    const [pokemon, setPokemon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRulesModalVisible, setIsRulesModalVisible] = useState(true);
    const [guess, setGuess] = useState('');
    const [guesses, setGuesses] = useState([]);
    const [isWin, setIsWin] = useState(false);
    const [winModalVisible, setWinModalVisible] = useState(false);
    const [loadingNewGame, setLoadingNewGame] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [error, setError] = useState('');

    // Mapeamento de cores
    const colors = {
        correct: '#abdf6c',
        partial: '#eab24f',
        incorrect: '#e97d6a',
        black: '#000000',
        pokemonYellow: '#ffde59',
        darkYellow: '#c0a442',
        green: '#abdf6c',
        red: '#e97d6a',
        hintBackground: '#f1f9c7',
        inputBackground: '#ffffff',
        darkGray: '#333333',
    };

    // Função para buscar um Pokémon aleatório
    const fetchRandomPokemon = async () => {
        setLoading(true);
        setIsWin(false);
        setGuesses([]);
        setGuess('');
        setLoadingNewGame(true);
        setGameOver(false);
        setError('');
        try {
            const randomId = Math.floor(Math.random() * 1025) + 1; // 1 a 1025
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            const data = response.data;
            
            const speciesUrl = data.species.url;
            const speciesResponse = await axios.get(speciesUrl);
            const speciesData = speciesResponse.data;

            const evolutionChainResponse = await axios.get(speciesData.evolution_chain.url);
            const evolutionChainData = evolutionChainResponse.data;
            const evolutionStage = getEvolutionStage(data.name, evolutionChainData);

            const fullData = {
                name: data.name,
                id: data.id,
                image: data.sprites.front_default,
                types: data.types.map(t => t.type.name),
                height: data.height,
                weight: data.weight,
                abilities: data.abilities.map(a => a.ability.name),
                species: speciesData,
                color: speciesData.color.name,
                habitat: speciesData.habitat ? speciesData.habitat.name : 'Unknown',
                generation: speciesData.generation.name,
                evolutionStage: evolutionStage
            };
            setPokemon(fullData);
            
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível carregar o Pokémon. Verifique sua conexão com a internet.');
            console.error(e);
        } finally {
            setLoading(false);
            setLoadingNewGame(false);
        }
    };
    
    // Auxiliar function to get evolution stage
    const getEvolutionStage = (name, evolutionChain) => {
        const chain = evolutionChain.chain;
        let stage = 1;
        if (chain.species.name === name) return 1;
    
        if (chain.evolves_to.length > 0) {
            stage = 2;
            const evolvesTo = chain.evolves_to;
            for (const evo of evolvesTo) {
                if (evo.species.name === name) return 2;
                if (evo.evolves_to.length > 0) {
                    const finalEvo = evo.evolves_to.find(final => final.species.name === name);
                    if (finalEvo) return 3;
                }
            }
        }
    
        return stage;
    };

    useEffect(() => {
        fetchRandomPokemon();
    }, []);

    // Função para lidar com o palpite do usuário
    const handleGuess = async () => {
        if (!guess.trim() || isWin || gameOver) return;

        const normalizedGuess = guess.trim().toLowerCase();
        setGuess('');
        setError('');

        try {
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${normalizedGuess}`);
            const guessedPokemonData = response.data;

            const speciesUrl = guessedPokemonData.species.url;
            const speciesResponse = await axios.get(speciesUrl);
            const speciesData = speciesResponse.data;
            
            const evolutionChainResponse = await axios.get(speciesData.evolution_chain.url);
            const evolutionChainData = evolutionChainResponse.data;
            const evolutionStage = getEvolutionStage(guessedPokemonData.name, evolutionChainData);

            const newGuess = {
                name: guessedPokemonData.name,
                image: guessedPokemonData.sprites.front_default,
                types: guessedPokemonData.types.map(t => t.type.name),
                height: guessedPokemonData.height,
                weight: guessedPokemonData.weight,
                color: speciesData.color.name,
                habitat: speciesData.habitat ? speciesData.habitat.name : 'Unknown',
                generation: speciesData.generation.name,
                evolutionStage: evolutionStage,
                isCorrect: normalizedGuess === pokemon.name.toLowerCase(),
            };

            setGuesses([...guesses, newGuess]);

            if (normalizedGuess === pokemon.name.toLowerCase()) {
                setIsWin(true);
                setWinModalVisible(true);
                setGameOver(true);
            }
        } catch (e) {
            setError('Pokémon inválido!');
        }
    };

    // Função para verificar as características e retornar a cor
    const checkCharacteristic = (guessedValue, correctValue) => {
        if (typeof guessedValue === 'string' && guessedValue.toLowerCase() === correctValue.toLowerCase()) {
            return colors.correct;
        }
        if (Array.isArray(guessedValue) && Array.isArray(correctValue)) {
            if (guessedValue.some(val => correctValue.includes(val))) {
                return colors.correct;
            }
            return colors.incorrect;
        }
        return colors.incorrect;
    };
    
    // Função para verificar se a altura ou peso estão corretos ou não
    const checkHeightWeight = (guessedValue, correctValue) => {
        if (guessedValue === correctValue) {
            return { color: colors.correct, arrow: '' };
        } else if (guessedValue < correctValue) {
            return { color: colors.incorrect, arrow: '↑' };
        } else {
            return { color: colors.incorrect, arrow: '↓' };
        }
    };

    if (loading) {
        return (
            <ImageBackground source={require('../assets/src/fundo.png')} style={styles.backgroundImage}>
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.pokemonYellow} />
                    <Text style={styles.loadingText}>Carregando Pokémon...</Text>
                </View>
            </ImageBackground>
        );
    }
    
    return (
        <ImageBackground source={require('../assets/src/fundo.png')} style={styles.backgroundImage}>
            <View style={styles.topBar}>
                <Image source={require('../assets/src/logo.png')} style={styles.topLogo} />
            </View>

            {/* Modal de Regras */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isRulesModalVisible}
                onRequestClose={() => setIsRulesModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeModalButton} onPress={() => setIsRulesModalVisible(false)}>
                            <Text style={styles.closeModalText}>X</Text>
                        </TouchableOpacity>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>POKEVALLEY</Text>
                            <Text style={[styles.modalSubtitle, { color: colors.darkYellow }]}>Tente descobrir o Pokémon do dia em até 8 palpites.</Text>
                        </View>
                        <ScrollView style={styles.rulesScrollView}>
                            <Text style={styles.ruleText}>1. Chute um Pokémon para começar.</Text>
                            <Text style={styles.ruleText}>2. Após seu chute, as características do Pokémon aparecerão:</Text>
                            <Text style={[styles.ruleText, { paddingLeft: 10 }]}>
                                <Text style={{ color: colors.correct }}>Verde: </Text> A característica está correta.
                            </Text>
                            <Text style={[styles.ruleText, { paddingLeft: 10 }]}>
                                <Text style={{ color: colors.partial }}>Amarelo: </Text> A característica está parcialmente correta.
                            </Text>
                            <Text style={[styles.ruleText, { paddingLeft: 10 }]}>
                                <Text style={{ color: colors.incorrect }}>Vermelho: </Text> A característica está incorreta.
                            </Text>
                            <Text style={styles.ruleText}>3. Nas dicas de Altura e Peso, uma seta (↑ ou ↓) indica se o Pokémon correto é mais alto/pesado ou mais baixo/leve que seu palpite.</Text>
                        </ScrollView>
                        <TouchableOpacity 
                            style={styles.modalButton} 
                            onPress={() => setIsRulesModalVisible(false)}
                        >
                            <Image source={require('../assets/src/botao.png')} style={styles.modalButtonImage} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            {/* Modal de vitória */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={winModalVisible}
                onRequestClose={() => setWinModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Parabéns!</Text>
                        <Text style={styles.modalSubtitle}>Você adivinhou o Pokémon em {guesses.length} palpites!</Text>
                        <Image source={{ uri: pokemon.image }} style={styles.winPokemonImage} />
                        <Text style={styles.winPokemonName}>{pokemon.name.toUpperCase()}</Text>
                        <TouchableOpacity style={[styles.modalButton, {backgroundColor: colors.correct}]} onPress={() => {
                            setWinModalVisible(false);
                            fetchRandomPokemon();
                        }}>
                            {loadingNewGame ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Novo Jogo</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Conteúdo do jogo */}
            <View style={styles.gameContent}>
                <Text style={styles.mainTitle}>POKEVALLEY</Text>
                
                <View style={styles.guessBox}>
                    <Text style={styles.guessBoxText}>Adivinhe qual o pokémon!</Text>
                </View>

                {/* Campo de input e botão */}
                <ImageBackground
                    source={require('../assets/src/escrever.png')}
                    style={styles.inputSectionImage}
                    resizeMode="contain"
                >
                    <View style={styles.inputSection}>
                        <TextInput
                            style={styles.input}
                            placeholder="Escreva o nome de um pokémon"
                            placeholderTextColor={colors.darkGray}
                            value={guess}
                            onChangeText={setGuess}
                            onSubmitEditing={handleGuess}
                            editable={!gameOver}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleGuess} disabled={gameOver}>
                            <Image source={require('../assets/src/seta.png')} style={styles.sendButtonImage} />
                        </TouchableOpacity>
                    </View>
                </ImageBackground>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Resultados dos palpites */}
                <ScrollView style={styles.guessesContainer}>
                    {guesses.map((g, index) => (
                        <View key={index} style={styles.guessItem}>
                            <View style={styles.guessedPokemonImageContainer}>
                                <Image source={{ uri: g.image }} style={styles.guessedPokemonImage} />
                                <Text style={styles.guessedPokemonName}>{g.name.toUpperCase()}</Text>
                            </View>
                            <View style={styles.characteristicsContainer}>
                                <View style={styles.row}>
                                    <Text style={[styles.characteristic, { backgroundColor: checkCharacteristic(g.types, pokemon.types) }]}>
                                        Tipo 1: {g.types[0]}
                                    </Text>
                                    <Text style={[styles.characteristic, { backgroundColor: checkCharacteristic(g.types, pokemon.types) }]}>
                                        Tipo 2: {g.types.length > 1 ? g.types[1] : 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={[styles.characteristic, { backgroundColor: checkCharacteristic(g.color, pokemon.color) }]}>
                                        Cor: {g.color}
                                    </Text>
                                    <Text style={[styles.characteristic, { backgroundColor: checkCharacteristic(g.habitat, pokemon.habitat) }]}>
                                        Habitat: {g.habitat}
                                    </Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={[styles.characteristic, { backgroundColor: checkHeightWeight(g.height, pokemon.height).color }]}>
                                        Altura: {g.height / 10} m {checkHeightWeight(g.height, pokemon.height).arrow}
                                    </Text>
                                    <Text style={[styles.characteristic, { backgroundColor: checkHeightWeight(g.weight, pokemon.weight).color }]}>
                                        Peso: {g.weight / 10} kg {checkHeightWeight(g.weight, pokemon.weight).arrow}
                                    </Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={[styles.characteristic, { backgroundColor: checkCharacteristic(g.generation, pokemon.generation) }]}>
                                        Geração: {g.generation.split('-')[1]}
                                    </Text>
                                    <Text style={[styles.characteristic, { backgroundColor: checkCharacteristic(g.evolutionStage, pokemon.evolutionStage) }]}>
                                        Evolução: {g.evolutionStage}
                                    </Text>
                                </View>
                                <Text style={[styles.characteristic, { backgroundColor: g.isCorrect ? colors.correct : colors.incorrect, width: '95%' }]}>
                                    Raridade: {'Unknown'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 10,
        zIndex: 10,
    },
    topLogo: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    gameContent: {
        flex: 1,
        paddingTop: 40,
        alignItems: 'center',
    },
    mainTitle: {
        fontFamily: 'Pokemon-Solid',
        fontSize: 40,
        color: '#ffde59',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -2, height: 2 },
        textShadowRadius: 5,
        marginBottom: 20,
    },
    guessBox: {
        width: '80%',
        backgroundColor: '#f1f9c7',
        borderColor: '#000',
        borderWidth: 2,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    guessBoxText: {
        fontFamily: 'PressStart2P-Regular',
        fontSize: 16,
        color: '#000',
        textAlign: 'center',
    },
    inputSectionImage: {
        width: '90%',
        height: 60,
        justifyContent: 'center',
    },
    inputSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    input: {
        flex: 1,
        fontFamily: 'PressStart2P-Regular',
        fontSize: 14,
        color: '#333',
        paddingHorizontal: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonImage: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
    },
    errorText: {
        color: 'red',
        marginTop: 5,
        fontSize: 12,
        fontFamily: 'PressStart2P-Regular',
    },
    guessesContainer: {
        flex: 1,
        width: '95%',
        marginTop: 20,
    },
    guessItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    guessedPokemonImageContainer: {
        position: 'relative',
        width: 100,
        height: 100,
        marginRight: 10,
    },
    guessedPokemonImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
    guessedPokemonName: {
        position: 'absolute',
        bottom: 5,
        left: 0,
        right: 0,
        fontFamily: 'PressStart2P-Regular',
        fontSize: 10,
        color: '#000',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        paddingVertical: 2,
    },
    characteristicsContainer: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    characteristic: {
        fontFamily: 'PressStart2P-Regular',
        fontSize: 10,
        padding: 5,
        borderRadius: 5,
        color: '#000',
        textAlign: 'center',
        flex: 1,
        marginHorizontal: 2,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        alignItems: 'center',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontFamily: 'Pokemon-Solid',
        fontSize: 30,
        color: '#ffde59',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 3,
    },
    modalSubtitle: {
        fontFamily: 'PressStart2P-Regular',
        fontSize: 12,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        marginTop: 5,
    },
    rulesScrollView: {
        maxHeight: 200,
    },
    ruleText: {
        fontFamily: 'PressStart2P-Regular',
        fontSize: 10,
        color: '#000',
        marginBottom: 8,
    },
    modalButton: {
        marginTop: 20,
    },
    modalButtonImage: {
        width: 150,
        height: 50,
        resizeMode: 'contain',
    },
    modalButtonText: {
        fontFamily: 'PressStart2P-Regular',
        fontSize: 14,
        color: '#000',
    },
    closeModalButton: {
        position: 'absolute',
        top: 10,
        right: 15,
    },
    closeModalText: {
        fontSize: 24,
        color: '#000',
    },
    winPokemonImage: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        marginTop: 10,
    },
    winPokemonName: {
        fontFamily: 'PressStart2P-Regular',
        fontSize: 16,
        marginTop: 10,
        color: '#000',
    },
    loadingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: '#fff',
        fontFamily: 'PressStart2P-Regular',
    }
});
