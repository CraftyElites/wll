/** PM2 / process manager config for Abasthan-style hosts */
module.exports = {
  apps: [
    {
      name: "webever-api",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
      max_memory_restart: "400M",
    },
  ],
};
