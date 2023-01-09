const express = require('express');
const mysql = require('mysql2/promise');

const port = process.env.API_PORT;

const dbConnection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
});

const app = express();

app.get('/health', async (req, res, next) => {
    let healthStatus = { mysql: 'down' };

    try {
        const connection = await dbConnection.getConnection();
        await connection.ping();
        healthStatus.mysql = 'up';
    } catch (error) {
        console.log(error);
    }

    res.status(200);
    res.json(healthStatus);
    next();
});

app.post('/campaigns', (req, res, next) => {
    // Your solution stars here
    res.status(200);
    res.send({ hello: 'World' });
    next();
});

app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port', port);
});
