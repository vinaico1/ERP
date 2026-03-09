# ERP Corporativo

Sistema ERP completo com backend Node.js e frontend React.

## Tecnologias

**Backend**
- Node.js + Express
- Prisma ORM + SQLite
- JWT para autenticação
- Helmet, Rate Limit, CORS

**Frontend**
- React 18 + Vite
- Tailwind CSS
- React Router DOM
- Recharts (gráficos)
- Axios

## Módulos

- Vendas
- Compras
- Estoque e inventário
- Clientes e fornecedores
- Financeiro (contas a pagar/receber, fluxo de caixa)
- Serviços e ordens de serviço
- RH / Funcionários
- Relatórios
- Admin (usuários, perfis, logs de auditoria)

## Instalação

### Requisitos
- Node.js 18+

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Iniciar tudo de uma vez

```bash
chmod +x start.sh
./start.sh
```

## Acesso

| Serviço  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:3001      |
| Health   | http://localhost:3001/health |

**Login padrão:** `admin@erp.com` / `admin123`

## Variáveis de Ambiente

Copie `backend/.env.example` para `backend/.env` e ajuste:

```env
DATABASE_URL="file:./erp.db"
JWT_SECRET="sua-chave-secreta"
JWT_REFRESH_SECRET="sua-chave-refresh"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```
