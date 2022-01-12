
exports.up = function(knex) {
    return knex.schema.createTable('issues', (table)=>{
        table.increments('id').primary();
       table.string('title', 255).notNullable();
       table.integer('label_id').notNullable();
       table.integer('assignee_id').notNullable();
       table.string('comment', 255).notNullable();
       table.string('posted_by', 255).notNullable();
       table.string('issue_status', 255).notNullable();
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable("issues");
};
