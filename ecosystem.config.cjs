// PM2 process config — `pm2 start ecosystem.config.cjs`
module.exports = {
  apps: [{
    name: 'yuzhou-inquiry',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
