module.exports = {
  apps: [
    {
      name: 'server',
      script: './dist/server.js',
      watch: false,
      force: true,
      env: {
        PORT: 4500,
        NODE_ENV: 'production',
        MY_ENV_VAR: 'MyVarValue',
      },
    },
  ],
};