# 🚀 SETUP: Bíblia Políglota App

## ✅ O que já foi preparado

- ✓ Estrutura completa React Native + Expo
- ✓ Database `bible.db` copiado para `assets/` (17.5 MB)
- ✓ 3 telas implementadas (BookList, Reader, PatristicSheet)
- ✓ TypeScript + styling completo
- ✓ Navegação stack com React Navigation

## 📦 Pré-requisitos

### Instalar Node.js
Baixe em: https://nodejs.org/ (versão 18 ou superior recomendada)

Depois de instalar, abra PowerShell e verifique:
```powershell
node --version
npm --version
```

## 🔧 Instalação (5 minutos)

### 1. Abra PowerShell nesta pasta
```powershell
cd c:\Users\felipe\Documents\biblia-app
```

### 2. Instale dependências
```powershell
npm install
```

Isso vai baixar e instalar todos os pacotes necessários (pode levar 2-5 minutos).

### 3. Rode o app

**Para iOS (Mac apenas):**
```powershell
npm run ios
```

**Para Android (precisa emulador ou device):**
```powershell
npm run android
```

**Para Web (mais rápido para testar):**
```powershell
npm run web
```

**Modo desenvolvimento (Expo Go):**
```powershell
npm start
```
Abre QR code — scaneie com seu telefone no app "Expo Go" (gratuito na Play Store / App Store)

## 📱 Testando

### Navegação
1. **Tela 1**: Clique em um livro → lista de capítulos em grid
2. **Tela 2**: Clique em um capítulo → leitor
3. **Seletor de língua**: PT, LAT, GRC, HEB (abas no topo)
4. **Bottom sheet**: Clique no número verde se houver referências

## 🐛 Se der erro

### "expo-sqlite not found"
```powershell
npm install expo-sqlite
```

### "GestureHandlerRootView error"
```powershell
npm install react-native-gesture-handler react-native-reanimated
```

### Limpar cache
```powershell
npm run cache:clean
# ou
npx expo prebuild --clean
```

### SQLite database error
- Verifique se `assets/bible.db` existe
- Size deve ser ~17.5 MB
- Reload o app (Ctrl+M em Android, Cmd+D em iOS)

## 📋 Estrutura de Código

### `src/db/database.ts`
Conecta ao SQLite e expõe queries:
- `getVerses(book, chapter)` → versículos
- `getPatristicRefs(book, ch, v)` → citações patrísticas
- `getPreface(book)` → prefácios de Jerônimo (implementar depois)

### `src/screens/BookListScreen.tsx`
Tela 1: Lista de 73 livros + grid de capítulos

### `src/screens/ReaderScreen.tsx`
Tela 2: Leitor com seletor de idiomas + navegação

### `src/components/PatristicSheet.tsx`
Tela 3: Bottom sheet com citações patrísticas

### `App.tsx`
Router principal (Stack Navigation)

## ✨ Melhorias Futuras

1. **Prefácios**: Mostra ao abrir livro 1 do livro
   ```typescript
   const preface = await getPreface(book);
   if (preface) showModal(preface);
   ```

2. **Busca**: SearchBar global
   ```typescript
   export async function searchVerses(term: string) { ... }
   ```

3. **Favoritos**: AsyncStorage
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   ```

4. **Tema Escuro**: Toggle no header
   ```typescript
   const [isDark, setIsDark] = useState(false);
   // Ajuste StyleSheet conforme isDark
   ```

5. **Notas**: Crie tabela `user_notes` no banco

## 📚 Recursos Úteis

- **Expo Docs**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **React Native Docs**: https://reactnative.dev/
- **Bottom Sheet**: https://gorhom.github.io/bottom-sheet/

## 🎯 Quick Start Command

```powershell
cd c:\Users\felipe\Documents\biblia-app; npm install; npm start
```

---

**Status**: ✅ Pronto para usar  
**Versão**: 1.0 Beta  
**Database**: 36.769 versículos + 13 prefácios
