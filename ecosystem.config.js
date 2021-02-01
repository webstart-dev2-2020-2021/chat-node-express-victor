module.exports = {
  apps: [{
    script: "app.js",
    watch: ["server", "client"],
    ignore_watch : ["node_modules", "./migrations/"],
    watch_options: {
      "followSymlinks": false
    }
  }]
};
