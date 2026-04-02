![img.png](img.png)

## Что умеет проект

- создавать комнаты и подключаться к ним по коду
- работать в нескольких режимах:
  - `Just coding`
  - `Interviews`
  - `Algorithms`
- редактировать код совместно в реальном времени
- создавать, удалять и перемещать файлы и папки
- запускать код прямо из комнаты
- скачивать отдельный файл
- экспортировать весь проект комнаты в `.zip`
- генерировать алгоритмические задачи и проверять решение через AI

## Основные режимы комнат

### Just coding

Обычная комната для совместной разработки:
- полная файловая структура
- совместное редактирование
- запуск кода
- AI-помощь по файлу

### Interviews

Режим для собеседований:
- владелец комнаты управляет структурой проекта
- участник может редактировать существующий код
- участник не может создавать, удалять и перемещать файлы и папки

### Algorithms

Режим для решения алгоритмических задач:
- один общий файл для решения
- AI может сгенерировать задачу
- задача автоматически записывается в файл
- решение можно отдельно отправить на проверку

## Стек проекта

### Frontend

- `Next.js 14`
- `React 18`
- `TypeScript`
- `next-intl`
- `CodeMirror 6`
- `Socket.IO Client`
- `Yjs`
- `@hocuspocus/provider`
- `xterm.js`

### Backend

- `NestJS`
- `TypeScript`
- `Prisma`
- `PostgreSQL`
- `ory Kratos`
- `Yjs`
- `@hocuspocus/server`
- `OpenAI-compatible SDK`
- `E2B Code Interpreter`

### Инфраструктура

- `PostgreSQL`
- `Ory Kratos`
- `MailHog`
- `Docker Compose`

## Структура проекта

```txt
CodeMind/
  backend/
  frontend/
  docker/
  README.md
```

- backend — серверная часть проекта
- frontend — клиентская часть проекта
- docker — инфраструктура для локального запуска PostgreSQL, Kratos и MailHog

## Как запустить проект локально

### 1. Установить зависимости

Frontend:

```bash
cd frontend
yarn install
```

Backend:

```bash
cd backend
yarn install
```

### 2. Подготовить `.env` файлы

Нужно создать и заполнить:

- frontend/dashboard/identity/.env
- backend/.env
- docker/.env

Примеры уже есть в проекте:

- frontend/dashboard/identity/.env.example
- backend/.env.example
- docker/.env.example

### 3. Поднять инфраструктуру

Из папки docker:

```bash
docker compose up -d
```

Будут подняты:
- PostgreSQL
- Kratos
- MailHog

### 4. Применить Prisma и сгенерировать клиент

Из папки backend:

```bash
yarn prisma generate
yarn prisma migrate deploy
```

### 5. Запустить backend

Из папки backend:

```bash
yarn start:dev
```

Backend будет доступен на:

- `http://localhost:4000`


### 6. Запустить frontend

Из папки frontend:

```bash
yarn workspace @dashboard/identity dev
```

Frontend будет доступен на:

- `http://localhost:3000`

## Основные переменные окружения

### Frontend

```env
NEXT_PUBLIC_APP_NAME=Frontend
NEXT_PUBLIC_KRATOS_PUBLIC_URL=http://localhost:4433
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_COLLAB_URL=ws://localhost:1234
```

### Backend

```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codemind?schema=app
KRATOS_PUBLIC_URL=http://localhost:4433
COLLAB_PORT=1234
E2B_API_KEY=e2b_6d32d047802e4ece95d03e9c94e7b4034aa4c7f9
E2B_REQUEST_TIMEOUT_MS=30000
E2B_RUN_TIMEOUT_MS=15000
E2B_SANDBOX_TIMEOUT_MS=60000
LLM_API_KEY=sk-tfOiZPZ5Opl740HlOeN0NTqJ5KsxKViYZsTz9zEoqdLLynd8fVVpLVqxrFmB
LLM_API_BASE_URL=https://proxy.gen-api.ru/v1
LLM_MODEL=grok-4-1
```

## Проверка проекта

Frontend:

```bash
cd frontend
yarn lint
yarn test
yarn build
```

Backend:

```bash
cd backend
yarn lint
yarn build
```