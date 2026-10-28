<script setup lang="ts">
defineProps<{
  items: string[];
}>();
</script>

<template>
  <ul class="vl-chips">
    <li v-for="item in items" :key="item" class="vl-chips__chip">{{ item }}</li>
  </ul>
</template>

<style scoped>
.vl-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
  padding: 0;
  list-style: none;
}
.vl-chips > .vl-chips__chip {
  margin: 0;
  padding: 6px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  font-size: 14px;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}
</style>
