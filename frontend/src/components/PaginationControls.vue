<template>
  <div class="flex items-center justify-between mt-4">
    <div class="text-sm text-gray-500">Showing {{ rangeStart() }}–{{ rangeEnd() }} of {{ total }} items</div>
    <div class="flex items-center gap-2">
      <button @click="onPrev" :disabled="page <= 1" class="px-3 py-1 rounded-lg border bg-white text-sm">Prev</button>
      <div class="text-sm text-gray-700">Page</div>
      <input type="number" v-model.number="localPageInput" @change="onGoto" class="w-16 px-2 py-1 border rounded-lg text-sm text-center" />
      <button @click="onNext" :disabled="page >= totalPages()" class="px-3 py-1 rounded-lg border bg-white text-sm">Next</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'


const props = defineProps({
  page: { type: Number, required: true },
  total: { type: Number, required: true },
  limit: { type: Number, required: true },
  pageInput: { type: Number, required: false, default: 1 },
  rangeStart: { type: Function, required: true },
  rangeEnd: { type: Function, required: true },
  totalPages: { type: Function, required: true },
})

const emit = defineEmits(['prev', 'next', 'goto', 'update:pageInput'])
const localPageInput = ref(props.pageInput || 1)

watch(() => props.pageInput, (v) => { localPageInput.value = v })

function onPrev() { emit('prev') }
function onNext() { emit('next') }
function onGoto() {
  const p = Number(localPageInput.value) || 1
  emit('update:pageInput', p)
  emit('goto', p)
}
</script>

<style scoped></style>
