import { BaseModel } from '#app/Models/Base';

export class Users extends BaseModel {
  static get tableName() {
    return `${process.env.DB_PREFIX || ''}users`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      properties: {
        isActive: { type: 'boolean' },
        level: { type: 'integer' }
      }
    };
  }
}