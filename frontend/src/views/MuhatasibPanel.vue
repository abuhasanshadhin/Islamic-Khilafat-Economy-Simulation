<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-4">Muhatasib Panel — Pending Reports</h2>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <ul>
        <li v-for="r in reports" :key="r.id" class="border p-2 mb-2">
          <div>
            <strong>{{ r.reporterUsername }}</strong> reported
            <strong>{{ r.accusedUsername }}</strong>
          </div>
          <div class="text-sm">{{ r.reason }}</div>
          <div class="mt-2">
            <button @click="validate(r.id)" class="btn mr-2">Validate</button>
            <button @click="resolve(r.id)" class="btn mr-2">Resolve</button>
          </div>

          <div class="mt-2">
            <input v-model="assignments[r.id]" placeholder="investigator username" class="border p-1 mr-2" />
            <button @click="assign(r.id)" class="btn">Assign Investigator</button>
          </div>

          <div class="mt-2">
            <textarea v-model="notes[r.id]" placeholder="Add note" class="border p-1 w-full mb-2"></textarea>
            <div>
              <button @click="addNote(r.id)" class="btn mr-2">Add Note</button>
              <button @click="loadNotes(r.id)" class="btn">View Notes</button>
            </div>
            <ul v-if="notesList[r.id] && notesList[r.id].length" class="mt-2">
              <li v-for="n in notesList[r.id]" :key="n.id" class="text-sm border p-1 my-1">
                <div><strong>{{ n.authorUsername }}</strong> — <small>{{ n.createdAt }}</small></div>
                <div>{{ n.note }}</div>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
const API_BASE = "/api";
export default {
  data() {
    return { loading: true, reports: [] };
  },
  async created() {
    await this.load();
  },
  methods: {
      assignments: {},
      notes: {},
      notesList: {},
    async load() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/hisbah/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.reports = await res.json();
      } catch (e) {
        console.error(e);
        this.reports = [];
      }
      this.loading = false;
    },
      async assign(id) {
        try {
          const token = localStorage.getItem('token');
          const username = this.assignments[id];
          if (!username) return alert('Enter investigator username');
          await fetch(`${API_BASE}/hisbah/report/${id}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ investigatorUsername: username }),
          });
          this.assignments[id] = '';
          await this.load();
        } catch (e) { console.error(e); }
      },
      async addNote(id) {
        try {
          const token = localStorage.getItem('token');
          const text = this.notes[id];
          if (!text) return alert('Enter note');
          await fetch(`${API_BASE}/hisbah/report/${id}/note`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ note: text }),
          });
          this.notes[id] = '';
          await this.loadNotes(id);
        } catch (e) { console.error(e); }
      },
      async loadNotes(id) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE}/hisbah/report/${id}/notes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          this.$set(this.notesList, id, await res.json());
        } catch (e) { console.error(e); this.$set(this.notesList, id, []); }
      },
    async validate(id) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/hisbah/validate/${id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        await this.load();
      } catch (e) {
        console.error(e);
      }
    },
    async resolve(id) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE}/hisbah/resolve/${id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        await this.load();
      } catch (e) {
        console.error(e);
      }
    },
  },
};
</script>
