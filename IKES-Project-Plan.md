# 🕋 Project Title: Islamic Khilafat Economy Simulation (IKES)

**Subtitle:** A Shariah-Compliant Strategic Virtual Economy
**Tech Stack:** Express.js, TypeORM, MySQL, Zod, Socket.io, Vue.js 3, Tailwind CSS.

---

## 1. Core Economic Principles

- **Gold Standard:** Currency is Gold Milligrams (mg). 1g = 1000mg.
- **Precision:** All gold values must use `BigInt` to avoid floating-point drift.
- **No Riba:** Interest-based transactions and loan-based returns are prohibited.
- **Baitul Mal:** A central treasury manages public reserves and zakat collection.
- **Asset-backed pricing:** Resource prices move based on reserve levels rather than speculation.
- **Accountability:** Reputation and hisbah reporting maintain market integrity.

---

## 2. Feature Specifications

### A. Registration, Authentication & Initial Grant

- **Sign-up flow:** Users register with username, email, and password.
- **Validation:** Input validation uses Zod schemas.
- **Password security:** Passwords are hashed with Bcrypt before storage.
- **Initial grant:** New users receive `5000mg` gold from the Baitul Mal zakat fund on first registration.
- **Error handling:** Registration and grant assignment must be atomic so users never register without their starting balance.
- **Login:** JWT-based authentication issues tokens that expire appropriately and are stored client-side.

### B. Central Treasury & Mining Engine

- **Baitul Mal reserves:** Tracks `goldReserve`, `oilReserve`, `gasReserve`, and `totalZakatCollected`.
- **Mining service:** A periodic backend job simulates state mining and increases Baitul Mal reserves.
- **Pricing engine:** Resource prices are updated on a schedule using reserve ratios and optional random events (discovery/depletion).
- **Real-time updates:** Socket.io emits price and reserve changes so the frontend reflects live economic conditions.

### C. Khilafat Partnership Market

- **Partnership launch:** Trusted members can offer a public partnership by defining:
  - company/partnership name
  - total share units
  - price per share in mg
- **Reputation gating:** Only users with `reputationScore > 80` may launch a public partnership.
- **Public offer:** Partnerships are listed with available units, total supply, price, and owner information.
- **Buying:** Other users may purchase partnership units if they have sufficient gold balance.
- **Ownership record:** Purchases update both the buyer's balance and the owner’s balance; share ownership is tracked in `ShareOwnership`.
- **Profit distribution:** Partnership owners can distribute a gold payout to all shareholders pro rata.
- **Live refresh:** Partnership listings refresh automatically on new offers and share events.
- **Shariah framing:** This market is described as public musharaka-style partnership trading rather than conventional stock trading.

### D. Halal Marketplace

- **Product listings:** Users can list halal goods with name, description, price, and available units.
- **Spot trading:** Buyers can instantly purchase products if they have enough gold and the seller has stock.
- **Self-purchase blocked:** Users may not buy their own marketplace listings.
- **Trade events:** Each transaction creates a record and updates balances for both buyer and seller.
- **Reputation uplift:** Successful marketplace activity increases reputation, rewarding trustworthy traders.

### E. Automated Zakat System

- **Nisab threshold:** `85,000mg` of gold.
- **Zakat cycle:** Periodic job scans all users and deducts `2.5%` from balances above nisab.
- **Redistribution:** Deducted gold is added to the Baitul Mal gold reserve and recorded as zakat collection.
- **Notifications:** Users receive socket notifications when zakat is deducted.
- **Transaction log:** Every zakat deduction is stored as a dedicated transaction type.

### F. Hisbah & Reputation Enforcement

- **Reporting:** Users may file reports against other members for marketplace abuse.
- **Validation roles:** SHURA, KHALIFA, and MUHTASIB roles can review and validate reports.
- **Sanctions:** Validated reports reduce the accused user’s reputation score.
- **Access control:** Low reputation can restrict marketplace and partnership access as needed.
- **Transparency:** Reports and status changes are accessible through the hisbah interface for governance.

### G. Governance Roles & Permissions

- **USER:** Basic participant. Can trade, buy partnerships, and use the marketplace.
- **SHURA:** Council member. Can review reports, approve state actions, and monitor market justice.
- **KHALIFA:** Highest admin role. Full visibility into economy, transaction logs, and governance panels.
- **MUHTASIB:** Market inspector. Can validate reports and help enforce fair trading.

---

## 3. Implementation Details

### Backend

- **Express.js** handles HTTP APIs and route definitions.
- **TypeORM** manages entities and relational database access.
- **Entity design:** Includes `User`, `BaitulMal`, `Product`, `Partnership`, `ShareOwnership`, `Transaction`, `Report`, and `ResourcePrice`.
- **Routes:** Separate service routes for user, market, partnership, state, trade, and hisbah actions.
- **Transactions:** Critical balance updates and zakat operations use atomic TypeORM transactions.

### Frontend

- **Vue.js 3 + Composition API** powers the UI.
- **Tailwind CSS** delivers responsive styling.
- **Socket.io client** listens for live events such as price updates, partnership listings, share changes, dividends, and zakat deductions.
- **Role-aware navigation:** UI sections appear conditionally based on authenticated user role.

### Real-time flow

- **Socket channels:** Emits include `state_reserves_updated`, `price_changed`, `partnership:new-listing`, `shares_changed`, `dividends_distributed`, and `zakat_deducted`.
- **Client refresh:** Frontend components respond to socket events by refreshing lists and updating balances.

### Data handling requirements

- **BigInt JSON:** Ensure `BigInt.prototype.toJSON = function() { return this.toString() }` or equivalent serialization exists in the backend entry point.
- **String conversion:** API responses convert `BigInt` fields to strings for safe JSON transport.
- **No floating arithmetic:** All gold/math operations use integer math with `BigInt`.

---

## 4. User Experience

- **Dashboard:** Shows user gold balance, reputation, and active partnership/product opportunities.
- **Marketplace:** Facilitates halal product trading with stock validation and pricing.
- **Partnership Market:** Presents public partnerships as trust-gated opportunities for shared profit.
- **Hisbah panel:** Enables governance roles to review reports and preserve market justice.
- **State dashboard:** Displays Baitul Mal reserve levels, mining status, and price events.

---

## 5. Shariah-Aligned Notes

- **No interest:** The system avoids lending/borrowing with interest.
- **Asset focus:** Balances and pricing are tied to gold and state-managed resources.
- **Community welfare:** Zakat and Baitul Mal reinforce redistribution and public good.
- **Trust-first finance:** Reputation and hisbah ensure participants are accountable.
- **Partnership framing:** The public listing model is framed as musharaka-style participation rather than conventional IPO stock issuance.
