<template>
  <div class="space-y-4 mt-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="text-sm text-gray-500">
        Showing {{ meta.rangeStart }}–{{ meta.rangeEnd }} of
        {{ meta.total }} items
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="onPrev"
          :disabled="meta.page <= 1"
          class="px-3 py-1 rounded-lg border bg-white text-sm disabled:opacity-50"
        >
          Prev
        </button>
        <div class="flex items-center gap-1">
          <button
            v-for="(item, index) in pageButtons"
            :key="item === 'ellipsis' ? `ellipsis-${index}` : `page-${item}`"
            v-if="item !== 'ellipsis'"
            @click="gotoPage(item)"
            :disabled="item === meta.page"
            :class="[
              'px-3 py-1 rounded-lg border text-sm min-w-8 transition',
              item === meta.page
                ? 'bg-khilafat-900 text-white border-khilafat-900 cursor-default'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100',
            ]"
          >
            {{ item }}
          </button>
          <span v-else class="px-2 text-sm text-gray-500">…</span>
        </div>
        <button
          @click="onNext"
          :disabled="meta.page >= meta.totalPages"
          class="px-3 py-1 rounded-lg border bg-white text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  meta: {
    type: Object,
    required: true,
    validator: (value) =>
      typeof value.page === "number" &&
      typeof value.total === "number" &&
      typeof value.totalPages === "number" &&
      typeof value.rangeStart === "number" &&
      typeof value.rangeEnd === "number",
  },
});

const emit = defineEmits(["prev", "next", "goto"]);

const pageButtons = computed(() => {
  const pages = [];
  const maxButtons = 7;
  const current = props.meta.page;
  const total = props.meta.totalPages;

  if (total <= maxButtons) {
    for (let i = 1; i <= total; i += 1) pages.push(i);
    return pages;
  }

  pages.push(1);

  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) pages.push("ellipsis");
  for (let i = left; i <= right; i += 1) pages.push(i);
  if (right < total - 1) pages.push("ellipsis");

  pages.push(total);
  return pages;
});

function onPrev() {
  emit("prev");
}

function onNext() {
  emit("next");
}

function gotoPage(targetPage) {
  if (targetPage === "ellipsis") return;
  emit("goto", targetPage);
}
</script>

<style scoped></style>
