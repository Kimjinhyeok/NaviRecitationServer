var { Client } = require('pg');

var { dbUser, host, database, password, dbPort } = process.env;

module.exports = (function createPgClient(){
  
  return new Client({
    user : dbUser,
    host : host,
    database : database,
    password : password,
    port : dbPort,
  });
})();