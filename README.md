# Bíblia Políglota - App React Native (Expo)

App mobile para leitura de textos bíblicos em múltiplos idiomas com suporte a referências patrísticas.

## 📋 Estrutura do Projeto

```
biblia-app/
├── assets/
│   └── bible.db                 ← Copie aqui o arquivo do banco
├── src/
│   ├── db/
│   │   └── database.ts         # SQLite integration
│   ├── screens/
│   │   ├── BookListScreen.tsx  # Seleção de livros/capítulos
│   │   └── ReaderScreen.tsx    # Leitor de versículos
│   └── components/
│       └── PatristicSheet.tsx  # Bottom sheet de citações
├── App.tsx                      # Configuração principal
├── app.json                     # Expo config
├── package.json
└── tsconfig.json
```

## 🚀 Setup Inicial

### 1. Instalar dependências
```bash
npm install
# ou
yarn install
```

### 2. Copiar banco de dados
Copie o arquivo `bible.db` do projeto Python para:
```
biblia-app/assets/bible.db
```

### 3. Rodar app
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web

# Desenvolvimento
npm start
```

## 📱 Funcionalidades

### Tela 1: BookListScreen
- **Lista de livros**: 73 livros em ordem canônica
- **Capítulos**: Grid 5x5 com navegação rápida
- **Busca visual**: Diferenciação de AT/NT

### Tela 2: ReaderScreen  
- **Seletor de idiomas**: PT, LAT, GRC, HEB (abas)
- **Versículos**: Leitura fluida com números laterais
- **Referências patrísticas**: Badge com contador
- **Navegação**: Anterior/próximo capítulo

### Tela 3: PatristicSheet
- **Bottom sheet**: Desliza de 40% a 85% da tela
- **Cards**: Autor, obra, citação formatada
- **Swipe to close**: Feche deslizando para baixo

## 🗄️ Database

### Conexão Automática
- Se não encontrar `bible.db` no armazenamento, copia de `assets/`
- Usa `expo-sqlite` para acesso rápido

### Queries Implementadas
```typescript
getVerses(book, chapter)              // Todos versículos do capítulo
getPatristicRefs(book, ch, v)         // Citações de um versículo
getPatristicCount(book, ch, v)        // Número de referências
getPreface(book)                      // Prefácio de um livro
```

## 🎨 Tema

- **Cor primária**: `#1D9E75` (verde)
- **Fundo**: `#fff` (branco)
- **Texto principal**: `#1a1a1a` (quase preto)
- **Acentos**: `#E1F5EE` (verde claro)

## 📦 Dependências Principais

- **expo**: Framework React Native
- **expo-sqlite**: Database local
- **react-navigation**: Navegação entre telas
- **@gorhom/bottom-sheet**: Component deslizável
- **react-native-reanimated**: Animações performáticas

## ⚙️ Configuração TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "jsx": "react-native",
    "strict": true,
    "moduleResolution": "node"
  }
}
```

## 🐛 Troubleshooting

### Erro: `bible.db` não encontrado
- Verifique se o arquivo está em `assets/bible.db`
- Rebuild: `expo prebuild --clean`

### Layout quebrado em Android
- Adicione `<GestureHandlerRootView>` wrapper (já feito em App.tsx)

### Slow queries
- Se houver muitos versículos, considere pagination
- Adicione índices no banco (sql: `CREATE INDEX idx_book_ch ON verses(book, chapter)`)

## 📄 Licenças

- **App**: MIT
- **Conteúdo Bíblico**: Vide banco `bible.db` (PD/CC-BY-SA)

## 🔮 Próximas Fases

- [ ] Search global de versículos
- [ ] Favoritos com sincronização
- [ ] Notas pessoais (local storage)
- [ ] Tema escuro
- [ ] Export para PDF/e-book
- [ ] Sincronia com servidor (backend Supabase)

---

**Versão**: 1.0 (Beta)  
**Atualizado**: 29 de abril de 2026
