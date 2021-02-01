module.exports = {
  apps: [{
    name        : "user-migration",
    script      : "./migrations/",
    watch       : false,
  },
  {
    name        : "sqlite",
    script      : "./database.sqlite3",
    watch       : false,
  },
  {
    name        : "user-model",
    script      : "./models/user.js",
    watch       : false,
  }]
};
