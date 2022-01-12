const knex = require('knex');

const config = require('../knexfile.js');

const db = knex(config.development);

const { attachPaginate } = require('knex-paginate');

attachPaginate();

module.exports = db;