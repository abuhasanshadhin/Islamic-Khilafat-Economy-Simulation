const { z } = require('zod');

const reportSchema = z.object({
  accusedId: z.coerce.number().int().positive(),
  reason: z.string().min(5),
  markValid: z.boolean().optional()
});

module.exports = { reportSchema };
