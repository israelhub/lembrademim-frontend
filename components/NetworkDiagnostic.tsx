import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { checkBackendConnectivity } from '../services/api';

export default function NetworkDiagnostic() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const runDiagnostic = async () => {
    setTesting(true);
    setResults(['🔍 Iniciando diagnóstico de rede...']);

    try {
      const connectivity = await checkBackendConnectivity();
      
      const newResults = [
        '🔍 Iniciando diagnóstico de rede...',
        '',
        connectivity.isConnected 
          ? `✅ Backend conectado em: ${connectivity.workingUrl}`
          : '❌ Nenhum backend acessível',
        '',
        '📋 Detalhes dos testes:',
        ...connectivity.errors,
      ];

      setResults(newResults);

      if (connectivity.isConnected) {
        Alert.alert(
          '✅ Conectado!',
          `Backend encontrado em: ${connectivity.workingUrl}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ Sem conexão',
          'Nenhum backend foi encontrado. Verifique se o servidor está rodando.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      const errorResults = [
        '🔍 Iniciando diagnóstico de rede...',
        '',
        '❌ Erro durante diagnóstico:',
        error instanceof Error ? error.message : 'Erro desconhecido'
      ];
      setResults(errorResults);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🩺 Diagnóstico de Rede</Text>
      
      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={runDiagnostic}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? '🔄 Testando...' : '🔍 Testar Conectividade'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FEF7FF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1D1B20',
  },
  button: {
    backgroundColor: '#65558F',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#B3B3B3',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1D1B20',
    fontFamily: 'monospace',
  },
});
