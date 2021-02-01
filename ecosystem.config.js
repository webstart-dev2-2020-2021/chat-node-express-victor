module.exports = {
  apps: [{
    script: "app.js",
    watch: ["server", "client"],
    ignore_watch : ["node_modules", "migrations/20201110193817-create-user.js"],
    watch_options: {
      "followSymlinks": false
    }
  }]
};
