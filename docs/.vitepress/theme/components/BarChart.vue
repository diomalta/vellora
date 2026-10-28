<script setup lang="ts">
import { computed } from "vue";

export interface Bar {
  label: string;
  value: number;
  highlight?: boolean;
}

const props = withDefaults(
  defineProps<{
    bars: Bar[];
    title?: string;
    unit?: string;
    footnote?: string;
  }>(),
  { title: undefined, unit: "", footnote: undefined },
);

const max = computed(() => Math.max(0, ...props.bars.map((b) => b.value)));

function widthOf(value: number): string {
  if (max.value <= 0 || value <= 0) return "0%";
  // Linear scale; keep a hairline so tiny values stay visible next to large ones.
  return `max(3px, ${(value / max.value) * 100}%)`;
}

function format(value: number): string {
  const text = value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return props.unit ? `${text} ${props.unit}` : text;
}
</script>

<template>
  <figure class="vl-bars">
    <figcaption v-if="title" class="vl-bars__title">{{ title }}</figcaption>
    <dl class="vl-bars__list">
      <div
        v-for="bar in bars"
        :key="bar.label"
        class="vl-bars__row"
        :class="{ 'vl-bars__row--hl': bar.highlight }"
      >
        <dt class="vl-bars__label">{{ bar.label }}</dt>
        <dd class="vl-bars__track">
          <span class="vl-bars__wrap">
            <span class="vl-bars__bar" :style="{ width: widthOf(bar.value) }" />
            <span class="vl-bars__value">{{ format(bar.value) }}</span>
          </span>
        </dd>
      </div>
    </dl>
    <p v-if="footnote" class="vl-bars__footnote">{{ footnote }}</p>
  </figure>
</template>

<style scoped>
.vl-bars {
  margin: 24px 0;
  padding: 18px 18px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.vl-bars__title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}
.vl-bars__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
}
.vl-bars__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}
@media (min-width: 640px) {
  .vl-bars__row {
    grid-template-columns: minmax(110px, 30%) 1fr;
    align-items: center;
    gap: 12px;
  }
}
.vl-bars__label {
  font-size: 14px;
  line-height: 1.4;
  color: var(--vp-c-text-2);
}
.vl-bars__row--hl .vl-bars__label {
  font-weight: 700;
  color: var(--vp-c-text-1);
}
.vl-bars__track {
  min-width: 0;
  margin: 0;
  /* Reserve room so the value label fits after the longest (100%) bar. */
  padding-right: 7.5em;
}
.vl-bars__wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.vl-bars__bar {
  flex: none;
  height: 18px;
  border-radius: 4px;
  background: var(--vp-c-text-3);
  opacity: 0.55;
}
.vl-bars__row--hl .vl-bars__bar {
  background: var(--vp-c-brand-1);
  opacity: 1;
}
.vl-bars__value {
  flex: none;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}
.vl-bars__footnote {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
</style>
