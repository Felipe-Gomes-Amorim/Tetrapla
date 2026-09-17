<img width="3192" height="1239" alt="TEtrapla BAnner" src="https://github.com/user-attachments/assets/c48a06cc-d924-4b8d-9426-d2b0dbb19cf3" />


# Tetrapla

**Tetrapla**, Inspirado pela Hexapla de Orígenes é um aplicativo mobile que une estudo bíblico profundo com uma experiência interativa moderna. A proposta é simples, mas poderosa: colocar diferentes tradições textuais lado a lado — e ao mesmo tempo incentivar progresso real de leitura através de mecânicas de gamificação.

---

## Visão geral

O app reúne textos bíblicos em múltiplos idiomas e tradições:

* Português
* Latim (Vulgata)
* Grego (Septuaginta / Novo Testamento)
* Hebraico (Texto Massorético)
* Aramaico (quando aplicável)

Todos alinhados **versículo por versículo**, permitindo comparação direta entre tradições textuais.

Além disso, o app integra:

* **12.482 referências dos Pais Ante-Nicenos**, conectadas a versículos específicos
* Prefácios e materiais de Jerônimo
* Estrutura pensada tanto para estudo quanto para leitura contínua

---

## Objetivo

O Tetrapla não é apenas uma ferramenta acadêmica.

Ele foi projetado para responder a dois problemas comuns:

1. **Estudo profundo é fragmentado**
   → textos, línguas e comentários ficam espalhados

2. **Leitura bíblica consistente é difícil de manter**
   → falta motivação e senso de progresso

A solução proposta:

> unir profundidade textual com engajamento progressivo

---

## Funcionalidades principais

### Comparação textual

* Visualização paralela de múltiplas tradições
* Navegação por livro, capítulo e versículo
* Foco em fidelidade textual

---

### Referências patrísticas

* Integração com escritos dos Pais Ante-Nicenos
* Conexão direta com versículos
* Facilita estudos históricos e teológicos

---

### Gamificação (diferencial central)

O app inclui um sistema completo de progressão:

#### Progresso de leitura

* Acompanhamento em porcentagem da Bíblia lida
* Evolução visível ao longo do tempo

#### Títulos progressivos

* Usuário recebe **títulos conforme avança**
* Exemplo de progressão:

  * Iniciante
  * Leitor
  * Discípulo
  * Escriba
  * (e níveis mais avançados)

#### Achievements

* Conquistas por:

  * leitura de capítulos específicos
  * marcos de progresso
  * exploração de conteúdos

A ideia não é "gamificar por gamificar", mas:

> incentivar constância sem perder o foco espiritual e intelectual

---

## Stack

* **Python**

  * processamento de dados
  * estruturação textual
  * geração de banco (SQLite)

* **React Native / Expo**

  * interface mobile
  * experiência do usuário
  * sistema de progresso e conquistas

---

## Filosofia do projeto

O Tetrapla parte de uma ideia simples:

> leitura e estudo não precisam ser separados

Ele tenta recuperar algo que existia naturalmente na tradição antiga:

* leitura contínua
* contato com o texto original
* diálogo com intérpretes históricos

Mas com uma camada moderna:

* feedback de progresso
* motivação contínua
* experiência fluida no mobile

---

## Desenvolvimento

### Estrutura do projeto

```text
biblia-app/
├── assets/
│   └── bible.db                 # Banco consolidado (textos + referências patrísticas)
├── src/
│   ├── db/
│   │   ├── database.ts          # Integração SQLite (versículos, referências)
│   │   └── achievementsDb.ts    # Progresso e conquistas
│   ├── contexts/                # Contextos React (estado global)
│   ├── screens/
│   │   ├── BookListScreen.tsx   # Seleção de livros/capítulos
│   │   ├── ReaderScreen.tsx     # Leitor de versículos
│   │   ├── SearchScreen.tsx     # Busca global
│   │   ├── PrefaceScreen.tsx    # Prefácios (ex: Jerônimo)
│   │   ├── AchievementsScreen.tsx
│   │   └── ProgressScreen.tsx
│   └── components/
│       ├── PatristicSheet.tsx   # Bottom sheet de citações
│       ├── FontSizeModal.tsx
│       ├── AchievementToast.tsx
│       └── ProgressRing.tsx
├── App.tsx                      # Configuração principal
├── app.json                     # Expo config
├── eas.json                     # Configuração de build (EAS)
└── package.json
```

### Setup inicial

```bash
# 1. Instalar dependências
npm install

# 2. Rodar o app
npm start        # modo desenvolvimento
npm run ios
npm run android
npm run web
```

O arquivo `assets/bible.db` já vem incluído no repositório — não é necessário gerá-lo separadamente. Ele é criado a partir do projeto [bible-importer](https://github.com/Felipe-Gomes-Amorim/bible-importer), que consolida as fontes textuais brutas em um único banco SQLite.

### Banco de dados

* Na primeira execução, o app copia `assets/bible.db` para o armazenamento local (`expo-sqlite`)
* Principais queries: `getVerses`, `getPatristicRefs`, `getPatristicCountsForChapter`

### Troubleshooting

* **`bible.db` não encontrado**: verifique se `assets/bible.db` existe e rode `expo prebuild --clean`
* **Layout quebrado no Android**: confirme que `GestureHandlerRootView` está envolvendo o app (já configurado em `App.tsx`)

---

## Licenças

* **App**: MIT (veja [LICENSE](LICENSE))
* **Conteúdo bíblico**: vide fontes do banco `bible.db` (domínio público / CC-BY-SA, conforme a tradição textual)
