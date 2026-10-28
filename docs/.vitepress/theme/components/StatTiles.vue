<script setup lang="ts">
export interface StatTile {
  value: string;
  label: string;
  note?: string;
}

defineProps<{
  items: StatTile[];
  footnote?: string;
}>();
</script>

<template>
  <div class="vl-stats">
    <ul class="vl-stats__row">
      <li v-for="item in items" :key="`${item.value}-${item.label}`" class="vl-stats__tile">
        <span class="vl-stats__value">{{ item.value }}</span>
        <span class="vl-stats__label">{{ item.label }}</span>
        <span v-if="item.note" class="vl-stats__note">{{ item.note }}</span>
      </li>
    </ul>
    <p v-if="footnote" class="vl-stats__footnote">{{ footnote }}</p>
  </div>
</template>

<style scoped>
.vl-stats {
  margin: 24px 0;
}
.vl-stats__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.vl-stats__row > .vl-stats__tile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 18px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.vl-stats__value {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--vp-c-brand-1);
  font-variant-numeric: tabular-nums;
}
.vl-stats__label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}
.vl-stats__note {
  font-size: 13px;
  line-height: 1.4;
  color: var(--vp-c-text-2);
}
.vl-stats__footnote {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
</style>
