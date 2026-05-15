# 🕋 Project Title: Islamic Khilafat Economy Simulation (IKES)

**Subtitle:** A Shariah-Compliant Strategic Virtual Economy
**Tech Stack:** Express.js, Prisma 7, MySQL, Zod, Socket.io, Vue.js 3, Tailwind CSS.

---

### 1. Core Economic Principles

- **Gold Standard:** Currency is Gold Milligrams (mg). 1g = 1000mg.
- **Data Type:** All gold values MUST use `BigInt` to prevent rounding errors.
- **No Riba:** Interest-based transactions are strictly prohibited.
- **Baitul Mal:** A central treasury that manages state resources (Gold, Oil, Gas).

---

### 2. Feature Specifications

#### A. Authentication & Zakat Grant

- **Initial Grant:** New users receive 5000mg Gold from the Baitul Mal Zakat pool upon registration.
- **Atomicity:** This must be handled within a Prisma Transaction.
- **Validation:** Use Zod for input and Bcrypt for password hashing.

#### B. State Mining Engine

- **Logic:** Background service (Cron) runs every 5 minutes to extract resources.
- **Impact:** Increases Baitul Mal's Gold, Oil, and Gas reserves.
- **Real-time:** Updates must be broadcasted via Socket.io (`state_reserves_updated`).

#### C. Halal Marketplace (P2P)

- **Spot Trading:** Instant exchange of gold for assets/products.
- **Validation:** Users cannot buy their own products; cannot buy with insufficient balance.
- **Reputation:** Successful trades increase Reputation Score (0-100).

#### D. Automated Zakat System

- **Nisab Threshold:** 85,000mg (85g) of Gold.
- **Calculation:** 2.5% of total balance deducted annually (simulated cycle).
- **Redistribution:** Deducted gold returns to the Baitul Mal Zakat pool.

#### E. Hisbah (Market Justice)

- **Reporting:** Users can report fraud.
- **Sanctions:** Reputation Score drops for valid reports. Low reputation restricts marketplace access.

---

### 3. Roles & Permissions

- **USER:** Trade, produce, and grow wealth.
- **SHURA_MEMBER:** High-reputation users who can vote on state policies.
- **KHALIFA:** Admin role with full visibility of the economy and transaction logs.

---

### 4. Technical Requirements

- **BigInt Fix:** `BigInt.prototype.toJSON = function() { return this.toString() }` must be in the entry file.
- **Real-time:** Socket.io for all live economic events.
- **Database:** Prisma 7 with MySQL for robust relational integrity.
