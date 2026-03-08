require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PERMISSIONS_FULL = {
  customers: ['read', 'write', 'delete'],
  suppliers: ['read', 'write', 'delete'],
  products: ['read', 'write', 'delete'],
  services: ['read', 'write', 'delete'],
  employees: ['read', 'write', 'delete'],
  sales: ['read', 'write', 'delete'],
  purchases: ['read', 'write', 'delete'],
  inventory: ['read', 'write', 'delete'],
  financial: ['read', 'write', 'delete'],
  reports: ['read'],
  admin: ['read', 'write', 'delete'],
  users: ['read', 'write', 'delete']
};

const PERMISSIONS_OPERATOR = {
  customers: ['read', 'write'],
  suppliers: ['read', 'write'],
  products: ['read', 'write'],
  services: ['read', 'write'],
  employees: ['read'],
  sales: ['read', 'write'],
  purchases: ['read', 'write'],
  inventory: ['read', 'write'],
  financial: ['read'],
  reports: ['read'],
  admin: [],
  users: ['read']
};

const PERMISSIONS_VIEWER = {
  customers: ['read'],
  suppliers: ['read'],
  products: ['read'],
  services: ['read'],
  employees: ['read'],
  sales: ['read'],
  purchases: ['read'],
  inventory: ['read'],
  financial: ['read'],
  reports: ['read'],
  admin: [],
  users: []
};

async function main() {
  console.log('Iniciando seed do banco de dados...\n');

  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Administrador do sistema', permissions: JSON.stringify(PERMISSIONS_FULL) }
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'gerente' },
    update: {},
    create: { name: 'gerente', description: 'Gerente', permissions: JSON.stringify(PERMISSIONS_FULL) }
  });

  const operatorRole = await prisma.role.upsert({
    where: { name: 'operador' },
    update: {},
    create: { name: 'operador', description: 'Operador', permissions: JSON.stringify(PERMISSIONS_OPERATOR) }
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: 'visualizador' },
    update: {},
    create: { name: 'visualizador', description: 'Somente leitura', permissions: JSON.stringify(PERMISSIONS_VIEWER) }
  });

  console.log('Perfis criados:', [adminRole.name, managerRole.name, operatorRole.name, viewerRole.name].join(', '));

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@erp.com', password: adminPassword, roleId: adminRole.id }
  });
  console.log('Usuário admin criado:', admin.email);

  // Demo user
  const demoPassword = await bcrypt.hash('demo123', 10);
  await prisma.user.upsert({
    where: { email: 'demo@erp.com' },
    update: {},
    create: { name: 'Usuário Demo', email: 'demo@erp.com', password: demoPassword, roleId: operatorRole.id }
  });
  console.log('Usuário demo criado: demo@erp.com');

  // Product Categories
  const categories = await Promise.all([
    prisma.productCategory.upsert({ where: { id: 'cat-01' }, update: {}, create: { id: 'cat-01', name: 'Eletrônicos' } }),
    prisma.productCategory.upsert({ where: { id: 'cat-02' }, update: {}, create: { id: 'cat-02', name: 'Informática' } }),
    prisma.productCategory.upsert({ where: { id: 'cat-03' }, update: {}, create: { id: 'cat-03', name: 'Escritório' } }),
    prisma.productCategory.upsert({ where: { id: 'cat-04' }, update: {}, create: { id: 'cat-04', name: 'Serviços' } })
  ]);
  console.log('Categorias criadas:', categories.length);

  // Financial Categories
  await prisma.financialCategory.createMany({
    data: [
      { name: 'Vendas', type: 'income' },
      { name: 'Serviços Prestados', type: 'income' },
      { name: 'Outras Receitas', type: 'income' },
      { name: 'Fornecedores', type: 'expense' },
      { name: 'Salários', type: 'expense' },
      { name: 'Aluguel', type: 'expense' },
      { name: 'Utilities (Água/Luz/Internet)', type: 'expense' },
      { name: 'Marketing', type: 'expense' },
      { name: 'Impostos', type: 'expense' },
      { name: 'Outras Despesas', type: 'expense' }
    ],

  });

  // Cost Centers
  await prisma.costCenter.createMany({
    data: [
      { code: 'CC001', name: 'Administrativo' },
      { code: 'CC002', name: 'Comercial' },
      { code: 'CC003', name: 'Operacional' },
      { code: 'CC004', name: 'TI' }
    ],

  });
  console.log('Categorias financeiras e centros de custo criados');

  // Sample Customers
  await prisma.customer.createMany({
    data: [
      { code: 'CLI00001', name: 'Empresa ABC Ltda', type: 'company', email: 'contato@abc.com', phone: '11 3000-0001', document: '12.345.678/0001-90', city: 'São Paulo', state: 'SP', creditLimit: 50000 },
      { code: 'CLI00002', name: 'Comércio XYZ SA', type: 'company', email: 'financeiro@xyz.com', phone: '21 3000-0002', document: '98.765.432/0001-10', city: 'Rio de Janeiro', state: 'RJ', creditLimit: 30000 },
      { code: 'CLI00003', name: 'João Silva', type: 'individual', email: 'joao@email.com', phone: '11 99999-0003', document: '123.456.789-09', city: 'Campinas', state: 'SP', creditLimit: 5000 },
      { code: 'CLI00004', name: 'Tech Solutions ME', type: 'company', email: 'contato@techsolutions.com', phone: '47 3000-0004', document: '55.444.333/0001-22', city: 'Joinville', state: 'SC', creditLimit: 20000 },
      { code: 'CLI00005', name: 'Maria Costa', type: 'individual', email: 'maria@email.com', phone: '11 99999-0005', document: '987.654.321-00', city: 'São Paulo', state: 'SP', creditLimit: 3000 }
    ],

  });

  // Sample Suppliers
  await prisma.supplier.createMany({
    data: [
      { code: 'FOR00001', name: 'Distribuidora Norte', type: 'company', email: 'compras@norte.com', phone: '11 3001-0001', document: '11.222.333/0001-44', city: 'São Paulo', state: 'SP' },
      { code: 'FOR00002', name: 'Tech Import Ltda', type: 'company', email: 'pedidos@techimport.com', phone: '11 3001-0002', document: '44.333.222/0001-11', city: 'Guarulhos', state: 'SP' },
      { code: 'FOR00003', name: 'Office Supply SA', type: 'company', email: 'vendas@officesupply.com', phone: '21 3001-0003', document: '77.888.999/0001-55', city: 'Rio de Janeiro', state: 'RJ' }
    ],

  });

  // Sample Products
  const products = await prisma.product.createMany({
    data: [
      { code: 'PRD00001', name: 'Notebook Dell Inspiron 15', unit: 'UN', price: 3599.90, cost: 2800.00, minStock: 5, maxStock: 20, categoryId: 'cat-02' },
      { code: 'PRD00002', name: 'Mouse Sem Fio Logitech', unit: 'UN', price: 129.90, cost: 80.00, minStock: 10, maxStock: 50, categoryId: 'cat-02' },
      { code: 'PRD00003', name: 'Teclado Mecânico RGB', unit: 'UN', price: 349.90, cost: 220.00, minStock: 8, maxStock: 30, categoryId: 'cat-02' },
      { code: 'PRD00004', name: 'Monitor 24" Full HD', unit: 'UN', price: 899.90, cost: 650.00, minStock: 5, maxStock: 15, categoryId: 'cat-01' },
      { code: 'PRD00005', name: 'Papel A4 Resma 500fls', unit: 'PCT', price: 29.90, cost: 18.00, minStock: 20, maxStock: 100, categoryId: 'cat-03' },
      { code: 'PRD00006', name: 'Caneta Esferográfica Cx12', unit: 'CX', price: 15.90, cost: 8.00, minStock: 10, maxStock: 50, categoryId: 'cat-03' },
      { code: 'PRD00007', name: 'Headset USB Plantronics', unit: 'UN', price: 249.90, cost: 180.00, minStock: 5, maxStock: 20, categoryId: 'cat-01' },
      { code: 'PRD00008', name: 'HD Externo 1TB Seagate', unit: 'UN', price: 299.90, cost: 220.00, minStock: 5, maxStock: 20, categoryId: 'cat-02' }
    ],

  });

  // Create inventory for each product
  const allProducts = await prisma.product.findMany();
  const stockQty = { PRD00001: 12, PRD00002: 45, PRD00003: 18, PRD00004: 8, PRD00005: 60, PRD00006: 35, PRD00007: 3, PRD00008: 15 };
  for (const p of allProducts) {
    const qty = stockQty[p.code] || 10;
    await prisma.inventory.upsert({
      where: { productId: p.id },
      update: {},
      create: { productId: p.id, quantity: qty }
    });
  }
  console.log('Produtos e estoque criados:', allProducts.length);

  // Sample Services
  await prisma.service.createMany({
    data: [
      { code: 'SRV00001', name: 'Consultoria de TI', price: 250.00, duration: 60, unit: 'HR' },
      { code: 'SRV00002', name: 'Suporte Técnico', price: 150.00, duration: 60, unit: 'HR' },
      { code: 'SRV00003', name: 'Instalação de Software', price: 200.00, duration: 120, unit: 'HR' },
      { code: 'SRV00004', name: 'Treinamento', price: 300.00, duration: 480, unit: 'DI' },
      { code: 'SRV00005', name: 'Manutenção Preventiva', price: 180.00, duration: 90, unit: 'HR' }
    ],

  });

  // Sample Employees
  await prisma.employee.createMany({
    data: [
      { code: 'FUN00001', name: 'Carlos Oliveira', email: 'carlos@empresa.com', phone: '11 99001-0001', position: 'Analista de TI', department: 'TI', salary: 5500 },
      { code: 'FUN00002', name: 'Ana Pereira', email: 'ana@empresa.com', phone: '11 99001-0002', position: 'Vendedor', department: 'Comercial', salary: 3500 },
      { code: 'FUN00003', name: 'Roberto Santos', email: 'roberto@empresa.com', phone: '11 99001-0003', position: 'Técnico', department: 'Operacional', salary: 3000 }
    ],

  });

  console.log('\nSeed concluído com sucesso!');
  console.log('\nCredenciais de acesso:');
  console.log('  Admin:  admin@erp.com  / admin123');
  console.log('  Demo:   demo@erp.com   / demo123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
