'use strict';

const dotenv = require('dotenv');
dotenv.config();
const mysqlConfig = {
    development: {
        username: process.env.SEQUELIZE_USER_DEV,
        password: process.env.SEQUELIZE_PW_DEV,
        database: process.env.SEQUELIZE_DB_DEV,
        host: process.env.SEQUELIZE_HOST_DEV,
        dialect: 'mysql',
        logging: false,
        timezone: '+09:00',
        dialectOptions: {
            charset: 'utf8mb4',
            dateStrings: true,
            typeCast: true,
        },
    },
    test: {
        username: process.env.SEQUELIZE_USER_TEST,
        password: process.env.SEQUELIZE_PW_TEST,
        database: process.env.SEQUELIZE_DB_TEST,
        host: process.env.SEQUELIZE_HOST_TEST,
        dialect: 'mysql',
        logging: false,
        timezone: '+09:00',
        dialectOptions: {
            charset: 'utf8mb4',
            dateStrings: true,
            typeCast: true,
        },
    },
    production: {
        username: process.env.SEQUELIZE_USER_PD,
        password: process.env.SEQUELIZE_PW_PD,
        database: process.env.SEQUELIZE_DB_PD,
        host: process.env.SEQUELIZE_HOST_PD,
        dialect: 'mysql',
        logging: false,
        timezone: '+09:00',
        dialectOptions: {
            charset: 'utf8mb4',
            dateStrings: true,
            typeCast: true,
        },
    },
};

const Sequelize = require('sequelize');
const Study = require('./study');
const Current = require('./current');
const Waiting = require('./waiting');

const db = {};
const env = process.env.NODE_ENV || 'development';
const config = mysqlConfig[env];
const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Study = Study;
db.Current = Current;
db.Waiting = Waiting;

Study.init(sequelize);
Current.init(sequelize);
Waiting.init(sequelize);

module.exports = db;