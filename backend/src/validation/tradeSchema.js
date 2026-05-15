const { z } = require('zod');

const purchaseSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().optional(),
});

module.exports = { purchaseSchema };
