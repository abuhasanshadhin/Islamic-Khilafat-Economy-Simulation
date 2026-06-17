const { EntitySchema } = require('typeorm');

const ProposalEntity = new EntitySchema({
    name: 'Proposal',
    tableName: 'proposals',
    columns: {
        id: { primary: true, type: 'int', generated: true },
        title: { type: 'varchar' },
        description: { type: 'text', nullable: true },
        proposerId: { type: 'int' },
        status: { type: 'varchar', default: 'DRAFT' },
        createdAt: { type: 'datetime', createDate: true },
        updatedAt: { type: 'datetime', updateDate: true },
    },
});

module.exports = { ProposalEntity };
