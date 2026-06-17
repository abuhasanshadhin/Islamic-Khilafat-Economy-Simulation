<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-4">Mudaraba / Musharaka Contracts</h2>
    <div class="mb-4">
      <form @submit.prevent="launch">
        <input
          v-model="name"
          placeholder="Partnership name"
          class="border p-2 mr-2"
        />
        <input
          v-model.number="shares"
          placeholder="Total shares"
          class="border p-2 mr-2"
        />
        <input
          v-model.number="price"
          placeholder="Initial price (mg)"
          class="border p-2 mr-2"
        />
        <button class="btn">Launch Partnership</button>
      </form>
    </div>

    <div class="mt-6">
      <h3 class="font-semibold mb-2">Distribute Dividend</h3>
      <form @submit.prevent="distribute">
        <input
          v-model.number="partnershipId"
          placeholder="Partnership ID"
          class="border p-2 mr-2"
        />
        <input
          v-model.number="amountMg"
          placeholder="Amount (mg)"
          class="border p-2 mr-2"
        />
        <button class="btn">Distribute</button>
      </form>
    </div>
  </div>
</template>

<script>
const API_BASE = "/api";
export default {
  data() {
    return {
      name: "",
      shares: 100,
      price: 1000,
      partnershipId: null,
      amountMg: 0,
    };
  },
  methods: {
    async launch() {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/partnership/partnership`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: this.name,
            totalShares: this.shares,
            initialPriceMg: String(this.price),
          }),
        });
        alert("Launched");
      } catch (e) {
        console.error(e);
        alert("Failed");
      }
    },
    async distribute() {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/partnership/distribute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            partnershipId: this.partnershipId,
            totalAmountMg: this.amountMg,
          }),
        });
        alert("Distributed");
      } catch (e) {
        console.error(e);
        alert("Failed");
      }
    },
  },
};
</script>
