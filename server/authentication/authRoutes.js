const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
require('dotenv').config();
const cookieParser = require('cookie-parser');


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DATABASE_CONNECTION_PW,
    database: 'btcwallet'
});

function generateAccessToken(username) {
    return jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}
function holyPoggers(req, res) {
    res.json('HOLY POGGERS')
}
function authenticateToken(req, res, next) {
    console.log('poggers');
    console.log('All Cookies:', req.cookies);
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).send('Access token not found');
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log('pog')
        req.user = decoded;
        next()
    } catch (err) {
        return res.status(403).send('Invalid token');
    }
}

const registerRoute = async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Error registering user');
            }
            const accessToken = generateAccessToken(username);
            res.cookie('accessToken', accessToken, { path: '/', httpOnly: true,sameSite: 'strict', });
            res.status(201).json({ accessToken });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering user');
    }
};


const loginRoute = async (req, res) => {
    const { username, password } = req.body;
    connection.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
    if (error) {
        console.error(error);
        return res.status(500).send('Server error');
    }
    if (results.length === 0) {
        return res.status(401).send('Invalid username or password');
    }

    const user = results[0];
    try {
        if (await bcrypt.compare(password, user.password)) {
            const accessToken = generateAccessToken(username);
            res.cookie('accessToken', accessToken, { httpOnly: true });
            res.json({ accessToken });
        } else {
            return res.status(401).send('Invalid username or password');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error');
    }
});
};

module.exports = { registerRoute, loginRoute, authenticateToken, holyPoggers };