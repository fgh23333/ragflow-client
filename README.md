# RAGFlow Client

This is the client-side application for RAGFlow, built with Vue 3 and Vite.

## Recommended Environment

- **Node.js Version**: `v18.x` or later is recommended.
- **Package Manager**: This project uses `pnpm`.

## Project Setup

### 1. Clone the repository
```bash
git clone https://github.com/fgh23333/ragflow-client.git
cd ragflow-client
```

### 2. Install Dependencies
```bash
pnpm install
```

## Available Scripts

### Start Development Server
This command will start a local development server.
```bash
pnpm dev
```

### Compile and Minify for Production
This command will build the application for production.
```bash
pnpm build
```

### Preview Production Build
This command will serve the production build locally for previewing.
```bash
pnpm preview
```

## Docker Deployment

This project includes a `Dockerfile` for easy containerization and deployment.

### 1. Build the Docker Image
```bash
docker build -t ragflow-client .
```

### 2. Run the Docker Container
This command will run the container and map port 80 of the container to port 8080 on your local machine.
```bash
docker run -p 8080:80 ragflow-client
```
You can then access the application at `http://localhost:8080`.
