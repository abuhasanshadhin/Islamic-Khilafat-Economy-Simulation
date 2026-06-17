<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-4">Shura Proposals</h2>
    <div class="mb-4">
      <form @submit.prevent="create">
        <input v-model="title" placeholder="Title" class="border p-2 mr-2" />
        <button class="btn">Create Proposal</button>
      </form>
    </div>

    <ul>
      <li v-for="p in proposals" :key="p.id" class="border p-2 mb-2">
        <div class="font-semibold">{{ p.title }}</div>
        <div class="text-sm text-gray-600">Status: {{ p.status }}</div>
      </li>
    </ul>
  </div>
</template>

<script>
const API_BASE = "/api";
export default {
  data() {
    return { title: "", proposals: [] };
  },
  async created() {
    await this.load();
  },
  methods: {
    async load() {
      const res = await fetch(`${API_BASE}/shura/proposals`);
      this.proposals = await res.json();
    },
    async create() {
      if (!this.title) return;
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/shura/proposals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: this.title }),
        });
        this.title = "";
        await this.load();
      } catch (e) {
        console.error(e);
        alert("Failed");
      }
    },
  },
};
</script>
