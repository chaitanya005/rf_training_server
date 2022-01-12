
exports.up = function(knex) {
    return knex.schema.createTable('comments', (table)=>{
        table.increments('id').primary();
       table.integer('issue_id').notNullable();
       table.integer('label_id').notNullable()
       table.string('comment', 255).notNullable();
       table.string('posted_by', 255).notNullable();
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable("comments");
};
