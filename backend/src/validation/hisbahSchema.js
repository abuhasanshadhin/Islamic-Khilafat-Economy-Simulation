const { z } = require('zod');

const reportSchema = z.object({
  accusedUsername: z.string().min(1),
  reason: z.string().min(5),
  markValid: z.boolean().optional()
});

module.exports = { reportSchema };
