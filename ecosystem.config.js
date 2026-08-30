module.exports = {
  apps: [
    {
      name: 'erp-backend',
      cwd: './backend',
      script: 'server.js',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PRISMA_CLIENT_ENGINE_TYPE: 'binary',
      },
    },
    {
      name: 'erp-frontend',
      cwd: './frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: '--host',
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
