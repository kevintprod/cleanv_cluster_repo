import { Sequelize } from 'sequelize';
import { CONFIG_DB } from '../config.js';

const dbconfig = CONFIG_DB.DB2_LIVE;
const sequelize = new Sequelize(...dbconfig);
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

export default db;
