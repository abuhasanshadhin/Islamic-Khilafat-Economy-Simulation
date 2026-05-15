const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { registerUserSchema } = require('../validation/userSchema');
const { UserEntity } = require('../entities/User');
const { BaitulMalEntity } = require('../entities/BaitulMal');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

function makeAuthController(dataSource) {
    async function register(req, res) {
        try {
            const data = registerUserSchema.parse(req.body);
            const hashed = await bcrypt.hash(data.password, 10);

            const result = await dataSource.transaction(async (manager) => {
                const [bait] = await manager.find(BaitulMalEntity, { order: { id: 'ASC' }, take: 1 });

                let userData = {
                    username: data.username,
                    email: data.email,
                    password: hashed,
                    goldBalance: 0n,
                };

                if (bait && bait.goldReserve >= 5000n) {
                    await manager.update(BaitulMalEntity, { id: bait.id }, {
                        goldReserve: (bait.goldReserve - 5000n).toString(),
                        totalZakatCollected: (bait.totalZakatCollected + 5000n).toString(),
                    });
                    userData.goldBalance = 5000n;
                }

                const user = await manager.save(UserEntity, userData);
                return { user };
            });

            const { user } = result;
            const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            res.status(201).json({
                token,
                user: { id: user.id, username: user.username, email: user.email, role: user.role, goldBalance: user.goldBalance, reputationScore: user.reputationScore }
            });
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

            const user = await dataSource.getRepository(UserEntity).findOneBy({ email });
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });

            const ok = await bcrypt.compare(password, user.password);
            if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            res.json({
                token,
                user: { id: user.id, username: user.username, email: user.email, role: user.role, goldBalance: user.goldBalance, reputationScore: user.reputationScore }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    return { register, login };
}

module.exports = makeAuthController;
