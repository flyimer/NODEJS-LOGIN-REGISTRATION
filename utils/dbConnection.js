const mysql = require("mysql2/promise");

const db_connection = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_auth",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db_connection;