const { EntitySchema } = require('typeorm');

const InvestigationNoteEntity = new EntitySchema({
  name: 'InvestigationNote',
  tableName: 'investigation_notes',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    reportId: { type: 'int' },
    authorId: { type: 'int' },
    note: { type: 'text' },
    createdAt: { type: 'datetime', createDate: true },
  },
});

module.exports = { InvestigationNoteEntity };
