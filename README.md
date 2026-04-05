# RotaPro 🚚

Aplicativo mobile **offline-first** para rastreamento de rotas e controle de jornada de entregadores. Construído com React Native + Expo, API Customizada (Node.js/Prisma) e SQLite local.

## ✨ Funcionalidades

- **Rastreamento GPS em segundo plano** — Continua registrando mesmo com o app fechado
- **Dashboard de turno** — Distância, tempo ativo e tempo ocioso em tempo real
- **Histórico de viagens** — Listagem e detalhamento de todos os turnos realizados via API
- **Analytics Avançado** — Gráficos de performance, tendências e médias diárias processadas no servidor
- **Sincronização Batch (Atômica)** — Dados salvos localmente e enviados em um único lote otimizado
- **Proteção contra duplicação** — Índice único no SQLite + Lógica de UPSERT na API
- **Modo claro/escuro** — Suporte automático ao tema do sistema

## 🛠️ Stack

| Camada         | Tecnologia                        |
| -------------- | --------------------------------- |
| Framework      | Expo SDK 51 + Expo Router         |
| Linguagem      | TypeScript                        |
| Estado Global  | Zustand                           |
| Banco Local    | expo-sqlite (SQLite)              |
| Backend / Auth | Custom API (Node.js + JWT)        |
| Localização    | expo-location + expo-task-manager |
| Feedback Tátil | expo-haptics                      |
| Build / Deploy | EAS Build                         |

## 📁 Estrutura do Projeto

```
courier-tracker/
├── app/                          # Rotas (Expo Router - file-based)
│   ├── _layout.tsx               # Root layout, Splash Screen e Sessão
│   ├── login.tsx                 # Tela de login
│   ├── register.tsx              # Tela de registro
│   └── (tabs)/
│       ├── index.tsx             # Dashboard principal (turno ativo)
│       ├── trips.tsx             # Histórico de viagens
│       ├── analytics.tsx         # Gráficos e métricas da API
│       └── settings.tsx          # Configurações e perfil
│
└── src/
    ├── modules/                  # Domínios de negócio
    │   ├── auth/                 # Autenticação (store + serviços)
    │   ├── sessions/             # Controle de turno (service + store)
    │   └── tracking/             # GPS e processamento de localização
    │
    ├── services/                 # Serviços de infraestrutura
    │   ├── api.ts                # Cliente Axios centralizado (Interceptors)
    │   ├── auth.service.ts       # Login, Signup, Google OAuth e Reset
    │   ├── sync.service.ts       # Comunicação com endpoint de Batch Sync
    │   ├── analytics.service.ts  # Consumo de métricas e performance
    │   ├── sqlite.ts             # Init do banco local + migrations
    │   ├── localDatabase.ts      # Camada de acesso seguro ao SQLite
    │   ├── sync.ts               # Engine de orquestração de sincronização
    │   └── authSessionGuard.ts   # Validação de sessão (Foreground/Background)
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
- Servidor Backend RotaPro ativo
- App [Expo Go](https://expo.dev/go) no celular (para desenvolvimento)

### 1. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_API_URL=https://api.seudominio.com
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento

```bash
npx expo start
```

## 📦 Build

### Build de Preview (APK para teste)

```bash
eas build -p android --profile preview
```

### Build de Produção (Google Play)

```bash
eas build -p android --profile production
```

## 🗄️ Banco de Dados e Sincronização

### Tabelas Locais (SQLite)

| Tabela          | Descrição                                   |
| --------------- | ------------------------------------------- |
| `profiles`      | Dados do perfil do entregador               |
| `work_sessions` | Turnos de trabalho com métricas agregadas   |
| `trips`         | Resumo de cada viagem finalizada            |
| `gps_points`    | Pontos GPS brutos coletados durante o turno |
| `expenses`      | Registros de gastos (combustível, etc)      |

### Sincronização Batch

O app utiliza uma estratégia de **Batch Sync** atômica para otimizar o uso de rede e bateria:

1. Os dados são coletados e preparados em um `SyncPayload`.
2. Enviados para o endpoint `POST /sync/v1/batch`.
3. O servidor processa todas as tabelas em uma única transação (UPSERT).
4. O app marca os registros como `synced = 1` localmente após o sucesso.

## 🔐 Segurança

- Sessão (JWT) armazenada no `expo-secure-store`.
- Interceptor Axios remove sessão e limpa DB local em caso de erro `401 Unauthorized`.
- `logger` silenciado em produção.
- `localDatabase` com whitelist para evitar SQL injection ou acesso indevido.

## 📍 Permissões Android

```
ACCESS_FINE_LOCATION
ACCESS_COARSE_LOCATION
ACCESS_BACKGROUND_LOCATION       ← Rastreamento em segundo plano
FOREGROUND_SERVICE
FOREGROUND_SERVICE_LOCATION
```

O usuário é informado sobre o uso de localização em background através do `LocationDisclosureModal`, exibido antes do primeiro início de turno — requisito obrigatório do Google Play.

## 📄 Licença

Projeto privado — todos os direitos reservados.
