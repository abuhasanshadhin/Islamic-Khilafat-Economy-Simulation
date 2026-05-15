import { defineStore } from 'pinia'

export const useStore = defineStore('main', {
    state: () => ({
        user: {
            id: null,
            username: null,
            email: null,
            goldBalance: '0', // store as string (mg)
            reputationScore: 0,
            role: 'USER',
            token: null
        },
        baitulMal: {
            id: 1,
            goldReserve: '0',
            oilReserve: 0,
            gasReserve: 0,
            totalZakatCollected: '0'
        },
        baitulHistory: [],   // [{ timestamp, goldReserve }] — for admin chart
        prices: {},          // { GOLD: { priceInGoldMg, updatedAt }, OIL: {...}, GAS: {...} }
        stocks: [],          // latest stock list
        transactions: [],
        zakatToast: null,    // { deducted, newBalance } — cleared after display
        marketRefreshKey: 0, // incremented on new market listing
        stockRefreshKey: 0,  // incremented on share change / dividend
    }),
    getters: {
        totalUserGold: (state) => {
            // approximated from transaction history — admin fetches all users separately
            return state.baitulHistory.length > 0
                ? state.baitulHistory[state.baitulHistory.length - 1]?.totalUserGold ?? 0
                : 0
        }
    },
    actions: {
        setUser(payload) { this.user = { ...this.user, ...payload } },
        setBaitulMal(payload) {
            this.baitulMal = { ...this.baitulMal, ...payload }
            // push to history for admin chart (keep last 50 points)
            this.baitulHistory.push({ timestamp: new Date().toISOString(), goldReserve: Number(payload.goldReserve || this.baitulMal.goldReserve) })
            if (this.baitulHistory.length > 50) this.baitulHistory.shift()
        },
        setPrices(pricesArray) {
            const map = {}
            pricesArray.forEach(p => { map[p.resource] = p })
            this.prices = map
        },
        setStocks(list) { this.stocks = list },
        addTransaction(tx) { this.transactions.unshift(tx); if (this.transactions.length > 50) this.transactions.pop(); },
        setZakatToast(payload) { this.zakatToast = payload },
    }
})

