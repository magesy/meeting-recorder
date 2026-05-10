import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import Navigation from './src/Navigation';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Navigation />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
