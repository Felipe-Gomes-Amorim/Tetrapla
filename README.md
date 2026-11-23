<img width="3192" height="1239" alt="TEtrapla BAnner" src="https://github.com/user-attachments/assets/c48a06cc-d924-4b8d-9426-d2b0dbb19cf3" />


# Tetrapla

**Tetrapla**, inspirado pela Hexapla de Orígenes, é um aplicativo mobile de estudo bíblico que coloca diferentes tradições textuais lado a lado e incentiva a leitura contínua com um sistema de progresso.

## O que o app tem

* **Textos em múltiplos idiomas**, alinhados versículo por versículo: português (ARA), latim (Vulgata), grego (Septuaginta / Novo Testamento), hebraico (Texto Massorético) e aramaico quando aplicável.
* **Referências patrísticas**: mais de 12 mil citações dos Pais Ante-Nicenos ligadas a versículos específicos (folha deslizante no leitor).
* **Pais da Igreja**: 23 escritos dos Pais Apostólicos, de Justino Mártir e de Ireneu (ANF vol. 1, em português) divididos em capítulos, com progresso de leitura e pesquisa próprios.
* **Metas de leitura**: na tela de Progresso há um menu de metas; cada uma tem nome, cor e progresso próprio (a cor troca o verde da Bíblia). Edição e remoção em Configurações.
* **Prefácios de São Jerônimo** para os livros que os têm.
* **Busca de versículos** em ordem bíblica, com contador de resultados e carregamento em páginas.
* **Progresso de leitura**: marcação de capítulos lidos, anel de progresso, porcentagem da Bíblia e títulos por nível.
* **Configurações**:
  * mostrar ou esconder os livros deuterocanônicos (Tobias, Judite, Sabedoria, Eclesiástico, Baruque, 1 e 2 Macabeus), que existem apenas em latim e, em alguns, em grego;
  * separar a lista de livros em grupos (Pentateuco, Evangelhos, Cartas Paulinas...), com ordem do Antigo Testamento cristã ou judaica (Torá, Neviim, Ketuvim).
* Tema claro e escuro, tamanho de fonte ajustável.

## Stack

* **Expo SDK 58** (React Native 0.88, React 19.3, TypeScript 6)
* **expo-sqlite** com o banco `assets/bible.db`
* **React Navigation 7** (stack)
* `@gorhom/bottom-sheet`, Reanimated e Gesture Handler

O banco é gerado pelo projeto [bible-importer](https://github.com/Felipe-Gomes-Amorim/bible-importer), que consolida as fontes textuais brutas em um único SQLite. O arquivo pronto já está no repositório.

## Como rodar

Requisitos: Node.js 22.13+ (ou 24.3+) e npm.

```bash
npm install
npx expo start -c
```

* **Celular com Expo Go:** o Expo Go instalado precisa suportar o SDK 58. Atualize-o pela loja se aparecer erro de módulo nativo (por exemplo, `Cannot find native module 'ExpoSQLite'`).
* **Build de desenvolvimento** (recomendado se o Expo Go não servir):

  ```bash
  eas build --profile development --platform android   # na nuvem
  npx expo run:android                                  # local, precisa do Android Studio
  npx expo start --dev-client
  ```
* O `.npmrc` usa `legacy-peer-deps=true`.
* `-c` limpa o cache do Metro; use sempre que trocar de branch ou atualizar dependências.

Na primeira execução o app copia `assets/bible.db` para o armazenamento local.

## Estrutura

```text
biblia-app/
├── App.tsx                    # Navegação, providers, carregamento de fontes e do banco
├── app.json / eas.json        # Configuração do Expo e dos builds
├── assets/
│   ├── bible.db               # Banco consolidado (textos + referências patrísticas)
│   └── fonts/                 # AlfaSlabOne (marca e títulos de livro), Bevan (subtítulos)
└── src/
    ├── db/database.ts         # Consultas SQLite, progresso de leitura, busca
    ├── contexts/              # ThemeContext, SettingsContext (salvo em settings.json)
    ├── data/                  # bookGroups.ts (grupos de livros), titles.ts (títulos de progresso)
    ├── theme/fonts.ts         # Helpers de fonte (brandFont, subFont)
    ├── screens/               # BookList, Reader, Search, Preface, Progress, Settings
    └── components/            # PatristicSheet, FontSizeModal, ProgressRing, CustomAlert
```

## Solução de problemas

* **`Cannot find native module 'ExpoSQLite'`**: o app em execução não tem o módulo nativo desta versão. Atualize o Expo Go ou use um build de desenvolvimento novo.
* **Erro após trocar de branch ou dependências**: rode `npx expo start -c`.
* **Layout quebrado no Android**: confirme que `GestureHandlerRootView` envolve o app (já está em `App.tsx`).

## Licenças

* **App**: MIT (veja [LICENSE](LICENSE))
* **Conteúdo bíblico**: vide as fontes do banco `bible.db` (domínio público / CC-BY-SA, conforme a tradição textual)
