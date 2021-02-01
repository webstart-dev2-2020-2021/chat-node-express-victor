module.exports = {
  apps: [{
    script: "app.js",
    watch: ["server", "client"],
    ignore_watch : ["node_modules", "migrations", "models", "database.sqlite.3"],
    watch_options: {
      "followSymlinks": false
    }
  }]
};
