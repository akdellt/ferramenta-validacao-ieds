# FRONT-END -- Ferramenta de Validação de Parâmetros de IEDs

Interface para upload de arquivos, topologia, análise de resultados e visualização de diagrama de subestação.

## Tecnologias Principais

- **React + Vite**
- **TailwindCSS** (estilização)
- **Lucide React** (écones)
- **Axios** (comunicação com API)

## Estrutura

```
frontend/
├── src/
│   ├── assets/       # Logo da empresa
│   ├── components/   # Componentes reutilizáveis
│   ├── config/       # Configuração de tipos e restrições de arquivos
│   ├── context/      # Contextos do React (autenticação, validação)
│   ├── features/     # Componentes específicos das features
│   ├── hooks/        # Hooks de sidebar e tela de import
│   ├── pages/        # Páginas principais da aplicação
│   ├── services/     # Configuração do Axios e chamadas à API
│   ├── types/        # Definições de interfaces TypeScript
│   ├── App.tsx       # Componente raiz e rotas
│   └── index.css     # Configuração de cores e estilos
└── .env # Opcional se não for usar Docker
```

## Configuração de ambiente local

> **Requisito:** Node.js 20 ou superior.

1. Acesse a pasta: `cd frontend`
2. Instale as dependências: `npm install`
3. **Variáveis de Ambiente:** - Crie um arquivo `.env` nesta pasta com a variável: `VITE_API_URL=http://localhost:8000`
   - (Se estiver usando Docker, este passo é automático via `docker-compose.yml`).
4. Inicie o servidor de desenvolvimento: `npm run dev`

Acesse: http://localhost:5173

## Observação

O backend precisa estar rodando para o frontend funcionar corretamente.
Veja as instruções em [backend/README.md](../backend/README.md)
