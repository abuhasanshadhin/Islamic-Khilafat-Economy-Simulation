<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-4">BaitulMal Transparency</h2>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div class="mb-2">Gold Reserve: {{ data.goldReserve }}</div>
      <div class="mb-2">Oil Reserve: {{ data.oilReserve }}</div>
      <div class="mb-2">Gas Reserve: {{ data.gasReserve }}</div>
      <div class="mb-2">
        Total Zakat Collected: {{ data.totalZakatCollected }}
      </div>
    </div>
  </div>
</template>

<script>
const API_BASE = "/api";
export default {
  data() {
    return { loading: true, data: {} };
  },
  async created() {
    await this.load();
  },
  methods: {
    async load() {
      try {
        const res = await fetch(`${API_BASE}/state/stats`);
        this.data = await res.json();
      } catch (e) {
        console.error(e);
        this.data = {};
      }
      this.loading = false;
    },
  },
};
</script>
