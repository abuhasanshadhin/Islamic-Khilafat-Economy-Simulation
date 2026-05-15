const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { registerUserSchema } = require('../validation/userSchema');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

function makeAuthController(prisma) {
    async function register(req, res) {
        try {
            const data = registerUserSchema.parse(req.body);

            const hashed = await bcrypt.hash(data.password, 10);

            // Atomic transaction: check BaitulMal and create user/update reserves
            const result = await prisma.$transaction(async (tx) => {
                const bait = await tx.baitulMal.findFirst();

                let userData = {
                    username: data.username,
                    email: data.email,
                    password: hashed,
                };

                if (bait && bait.goldReserve >= 5000n) {
                    // deduct 5000 and give user 5000
                    const updatedBait = await tx.baitulMal.update({
                        where: { id: bait.id },
                        data: { goldReserve: bait.goldReserve - 5000n, totalZakatCollected: bait.totalZakatCollected + 5000n }
                    });

                    userData.goldBalance = 5000n;
                }

                const user = await tx.user.create({ data: userData });
                return { user };
            });

            const { user } = result;
            res.status(201).json({ id: user.id, username: user.username, email: user.email, goldBalance: user.goldBalance });
        } catch (err) {
            if (err && err.name === 'ZodError') {
                return res.status(400).json({ error: err.errors });
            }
            console.error(err);
            res.status(500).json({ error: 'Registration failed' });
        }
    }

    async function login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });

            const ok = await bcrypt.compare(password, user.password);
            if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            res.json({ token });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    return { register, login };
}

module.exports = makeAuthController;
