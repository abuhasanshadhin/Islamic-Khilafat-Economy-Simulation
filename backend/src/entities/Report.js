const { EntitySchema } = require('typeorm');

const ReportEntity = new EntitySchema({
  name: 'Report',
  tableName: 'Report',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    reporterId: { type: 'int' },
    accusedId: { type: 'int' },
    reason: { type: 'varchar' },
    status: { type: 'varchar', default: 'OPEN' },
    createdAt: { type: 'datetime', createDate: true },
  },
  relations: {
    reporter: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'reporterId' },
      inverseSide: 'reportsMade',
    },
    accused: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'accusedId' },
      inverseSide: 'reportsAgainst',
    },
  },
});

module.exports = { ReportEntity };
