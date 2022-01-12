
exports.up = function(knex) {
    return knex.schema.createTable('labels', (table)=>{
        table.increments('id').primary();
        table.string('name', 255).notNullable();
       table.string('description', 255).notNullable();
       table.string('bg_color', 255).notNullable();
       table.string('font_color', 255).notNullable();
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable("labels");
};
