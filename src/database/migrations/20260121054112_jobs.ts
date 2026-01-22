import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists(`${process.env.DB_PREFIX}jobs`, (table) => {
    table.bigIncrements('id').primary();
    table.string('queue').index().defaultTo('default'); // 队列名
    table.text('payload');        // 存储 Job 类名和参数 (JSON)
    table.integer('attempts').defaultTo(0); // 已尝试次数
    table.timestamp('reserved_at').nullable(); // 锁定时间（防止重复消费）
    table.timestamp('available_at').index();   // 计划执行时间
    table.timestamps().defaultTo(knex.fn.now());
    table.comment('队列');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(`${process.env.DB_PREFIX}jobs`);
}