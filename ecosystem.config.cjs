module.exports = {
  apps: [
    {
      name: "natsumi-24-7",
      script: "server.ts",
      interpreter: "node",
      interpreter_args: "--import tsx",
      env: {
        NODE_ENV: "production",
        HOST: process.env.HOST || "0.0.0.0",
        PORT: process.env.PORT || "3000",
      },
      max_memory_restart: process.env.PM2_MAX_MEMORY || "512M",
      autorestart: true,
      restart_delay: 5000,
      exp_backoff_restart_delay: 1000,
      watch: false,
    },
  ],
};
