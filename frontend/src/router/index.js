import Dashboard from '../components/Dashboard.vue'
import Marketplace from '../components/Marketplace.vue'
import ShuraDashboard from '../components/ShuraDashboard.vue'
import AdminView from '../components/AdminView.vue'

const routes = [
    { path: '/', name: 'Dashboard', component: Dashboard },
    { path: '/marketplace', name: 'Marketplace', component: Marketplace },
    { path: '/shura', name: 'Shura', component: ShuraDashboard }
    ,{ path: '/admin', name: 'Admin', component: AdminView }
]

export default routes
