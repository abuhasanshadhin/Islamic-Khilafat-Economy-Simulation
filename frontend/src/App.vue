<template>
  <div class="min-h-screen bg-white font-sans text-gray-900">
    <div class="max-w-6xl mx-auto p-6">
      <header class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold text-khilafat-700">
          BaitulMal Dashboard
        </h1>
        <nav class="space-x-4">
          <router-link to="/" class="text-sm text-gray-700">Home</router-link>
          <router-link to="/marketplace" class="text-sm text-gray-700"
            >Marketplace</router-link
          >
          <router-link to="/shura" class="text-sm text-gray-700"
            >Shura</router-link
          >
        </nav>
      </header>

      <router-view />
    </div>
  </div>
</template>

<script setup>
// App-level layout and router-view
</script>
