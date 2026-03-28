# RotaPro 🚚

Aplicativo mobile **offline-first** para rastreamento de rotas e controle de jornada de entregadores. Construído com React Native + Expo, Supabase e SQLite local.

## ✨ Funcionalidades

- **Rastreamento GPS em segundo plano** — Continua registrando mesmo com o app fechado
- **Dashboard de turno** — Distância, tempo ativo e tempo ocioso em tempo real
- **Histórico de viagens** — Listagem e detalhamento de todos os turnos realizados
- **Analytics** — Gráficos de performance e tendências por período
- **Sincronização offline-first** — Dados salvos localmente e enviados ao servidor quando há conexão
- **Proteção contra duplicação** — Índice único no SQLite + upsert no Supabase
- **Modo claro/escuro** — Suporte automático ao tema do sistema

## 🛠️ Stack

| Camada         | Tecnologia                        |
| -------------- | --------------------------------- |
| Framework      | Expo SDK 51 + Expo Router         |
| Linguagem      | TypeScript                        |
| Estado Global  | Zustand                           |
| Banco Local    | expo-sqlite (SQLite)              |
| Backend / Auth | Supabase (PostgreSQL + Auth)      |
| Localização    | expo-location + expo-task-manager |
| Feedback Tátil | expo-haptics                      |
| Build / Deploy | EAS Build                         |

## 📁 Estrutura do Projeto

```
courier-tracker/
├── app/                          # Rotas (Expo Router - file-based)
│   ├── _layout.tsx               # Root layout, inicialização do DB e sessão
│   ├── login.tsx                 # Tela de login
│   ├── register.tsx              # Tela de registro
│   └── (tabs)/
│       ├── index.tsx             # Dashboard principal (turno ativo)
│       ├── trips.tsx             # Histórico de viagens
│       ├── analytics.tsx         # Gráficos e métricas
│       └── settings.tsx          # Configurações e perfil
│
└── src/
    ├── modules/                  # Domínios de negócio
    │   ├── auth/                 # Autenticação (store + serviços)
    │   ├── sessions/             # Controle de turno (service + store)
    │   └── tracking/             # GPS e processamento de localização
    │
    ├── services/                 # Serviços de infraestrutura
    │   ├── sqlite.ts             # Init do banco local + migrations
    │   ├── localDatabase.ts      # Camada de acesso seguro ao SQLite
    │   ├── supabase.ts           # Cliente Supabase + schema visualization
    │   ├── sync.ts               # Engine de sincronização offline→online
    │   └── authSessionGuard.ts   # Guarda de sessão ao retornar ao app
    │
    ├── infrastructure/
    │   └── location-provider.ts  # Registro da task de background GPS
    │
    ├── components/
    │   └── LocationDisclosureModal.tsx  # Modal de privacidade (exigência Google Play)
    │
    └── utils/
        ├── logger.ts             # Logger seguro (silenciado em produção)
        └── location.ts           # Helpers: cálculo de distância, validação de GPS
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Conta no [Supabase](https://supabase.com)
- App [Expo Go](https://expo.dev/go) no celular (para desenvolvimento)

### 1. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento

```bash
npx expo start
```

Escaneie o QR code com o Expo Go para testar no celular.

> **Nota:** O rastreamento GPS em segundo plano **não funciona no Expo Go**. O app faz fallback automático para `watchPosition` (apenas com app aberto). Para testar o modo background completo, use um [development build](#build-de-desenvolvimento).

## 📦 Build

### Build de Preview (APK para teste)

```bash
eas build -p android --profile preview
```

### Build de Produção (Google Play)

```bash
eas build -p android --profile production
```

## 🗄️ Banco de Dados

### Tabelas Locais (SQLite)

| Tabela          | Descrição                                   |
| --------------- | ------------------------------------------- |
| `profiles`      | Dados do perfil do entregador               |
| `work_sessions` | Turnos de trabalho com métricas agregadas   |
| `trips`         | Resumo de cada viagem finalizada            |
| `gps_points`    | Pontos GPS brutos coletados durante o turno |

### Proteção Contra Duplicação

- **Índice único** em `gps_points (session_id, recorded_at)` no SQLite
- **Guard explícito** antes de cada inserção (`queryFirst` → `if (existing) return`)
- **`upsert`** no Supabase para tolerância a falhas de rede
- Registros marcados com `synced = 1` após envio para evitar re-sincronização

### Sincronização

O fluxo de sync (`src/services/sync.ts`) é acionado:

1. Manualmente pelo botão de sync no dashboard
2. Automaticamente ao finalizar um turno

Ordem de sincronização: `profiles` → `work_sessions` → `trips` → `gps_points` (em batches de 500)

## 🔐 Segurança

- Sessão armazenada no `expo-secure-store` (keychain/keystore nativo)
- `logger` silenciado em produção — sem dados sensíveis em logs
- Acesso ao SQLite via `localDatabase` com whitelist de tabelas permitidas
- Variáveis do Supabase via `EXPO_PUBLIC_*` — nunca hardcoded

## 📍 Permissões Android

```
ACCESS_FINE_LOCATION
ACCESS_COARSE_LOCATION
ACCESS_BACKGROUND_LOCATION       ← Rastreamento em segundo plano
FOREGROUND_SERVICE
FOREGROUND_SERVICE_LOCATION
```

O usuário é informado sobre o uso de localização em background através do `LocationDisclosureModal`, exibido antes do primeiro início de turno — requisito obrigatório do Google Play.

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npx expo start                    # Inicia servidor de dev
npx expo start --android          # Abre no emulador Android
npx expo lint                     # Lint do projeto

# Build
eas build -p android --profile preview     # APK de teste
eas build -p android --profile production  # Build de produção
eas build -p android --clear-cache         # Força rebuild limpo

# Diagnóstico
eas build:list                    # Lista builds recentes
```

## 📄 Licença

Projeto privado — todos os direitos reservados.
