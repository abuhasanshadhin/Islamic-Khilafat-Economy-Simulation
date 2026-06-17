import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Marketplace from '../views/Marketplace.vue'
import ShuraDashboard from '../views/ShuraDashboard.vue'
import ShuraProposals from '../views/ShuraProposals.vue'
import StateDashboard from '../views/StateDashboard.vue'
import AdminView from '../views/AdminView.vue'
import LoginView from '../views/LoginView.vue'
import PartnershipMarket from '../views/PartnershipMarket.vue'
import MemberDirectory from '../views/MemberDirectory.vue'
import BeitulMalDashboard from '../views/BeitulMalDashboard.vue'
import MuhatasibPanel from '../views/MuhatasibPanel.vue'
import Contracts from '../views/Contracts.vue'
import ProfileView from '../views/ProfileView.vue'
import SendGoldView from '../views/SendGoldView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import MyListingsView from '../views/MyListingsView.vue'
import PurchasesView from '../views/PurchasesView.vue'

const routes = [
    { path: '/', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/state', name: 'State', component: StateDashboard },
    { path: '/marketplace', name: 'Marketplace', component: Marketplace },
    { path: '/partnerships', name: 'Partnerships', component: PartnershipMarket },
    { path: '/shura', name: 'Shura', component: ShuraDashboard, meta: { requiresAuth: true, requiresRole: ['SHURA', 'KHALIFA', 'MUHTASIB'] } },
    { path: '/shura/proposals', name: 'ShuraProposals', component: ShuraProposals, meta: { requiresAuth: true, requiresRole: ['SHURA', 'KHALIFA', 'MUHTASIB'] } },
    { path: '/baitulmal', name: 'BeitulMal', component: BeitulMalDashboard },
    { path: '/muhatasib', name: 'Muhatasib', component: MuhatasibPanel, meta: { requiresAuth: true, requiresRole: ['MUHTASIB', 'SHURA', 'KHALIFA'] } },
    { path: '/contracts', name: 'Contracts', component: Contracts, meta: { requiresAuth: true } },
    { path: '/members', name: 'Members', component: MemberDirectory },
    { path: '/profile/:username', name: 'Profile', component: ProfileView },
    { path: '/send-gold', name: 'SendGold', component: SendGoldView, meta: { requiresAuth: true } },
    { path: '/transactions', name: 'Transactions', component: TransactionsView, meta: { requiresAuth: true } },
    { path: '/purchases', name: 'Purchases', component: PurchasesView, meta: { requiresAuth: true } },
    { path: '/my-listings', name: 'MyListings', component: MyListingsView, meta: { requiresAuth: true } },
    { path: '/admin', name: 'Admin', component: AdminView, meta: { requiresAuth: true, requiresRole: 'KHALIFA' } },
    { path: '/login', name: 'Login', component: LoginView }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, _from) => {
    const token = localStorage.getItem('token')
    if (to.meta.requiresAuth && !token) return '/login'
    if (to.meta.requiresRole) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const required = to.meta.requiresRole
            if (Array.isArray(required)) {
                if (!required.includes(payload.role)) return '/'
            } else {
                if (payload.role !== required) return '/'
            }
        } catch {
            return '/login'
        }
    }
    return true
})

export default router
