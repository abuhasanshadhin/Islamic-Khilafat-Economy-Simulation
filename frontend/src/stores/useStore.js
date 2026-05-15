import { defineStore } from 'pinia'

export const useStore = defineStore('main', {
    state: () => ({
        user: {
            id: null,
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
        transactions: []
    }),
    actions: {
        setUser(payload) { this.user = { ...this.user, ...payload } },
        setBaitulMal(payload) { this.baitulMal = { ...this.baitulMal, ...payload } },
        addTransaction(tx) { this.transactions.unshift(tx); if (this.transactions.length > 50) this.transactions.pop(); }
    }
})

