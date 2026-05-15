const { z } = require('zod');

const registerUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8)
});

module.exports = { registerUserSchema };
