<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    works?: string[];
    limits?: string[];
    unsupported?: string[];
  }>(),
  { works: () => [], limits: () => [], unsupported: () => [] },
);

const columns = computed(() => [
  { key: "works", title: "Works", mark: "✓", srMark: "Works:", items: props.works },
  {
    key: "limits",
    title: "Works with limits",
    mark: "~",
    srMark: "Works with limits:",
    items: props.limits,
  },
  {
    key: "unsupported",
    title: "Not supported",
    mark: "✕",
    srMark: "Not supported:",
    items: props.unsupported,
  },
]);
</script>

<template>
  <div class="vl-fit">
    <section
      v-for="col in columns"
      :key="col.key"
      class="vl-fit__card"
      :class="`vl-fit__card--${col.key}`"
    >
      <h4 class="vl-fit__title">
        <span class="vl-fit__badge" aria-hidden="true">{{ col.mark }}</span>
        {{ col.title }}
      </h4>
      <ul class="vl-fit__list">
        <li v-for="item in col.items" :key="item" class="vl-fit__item">
          <span class="vl-fit__mark" aria-hidden="true">{{ col.mark }}</span>
          <span class="vl-fit__sr">{{ col.srMark }}</span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.vl-fit {
  --vl-ok: #166534;
  --vl-warn: #92400e;
  --vl-bad: #991b1b;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin: 24px 0;
}
:global(.dark) .vl-fit {
  --vl-ok: #4ade80;
  --vl-warn: #fbbf24;
  --vl-bad: #f87171;
}
@media (min-width: 768px) {
  .vl-fit {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.vl-fit__card {
  --vl-accent: var(--vl-ok);
  padding: 16px 18px;
  border: 1px solid var(--vp-c-divider);
  border-top: 4px solid var(--vl-accent);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.vl-fit__card--limits {
  --vl-accent: var(--vl-warn);
}
.vl-fit__card--unsupported {
  --vl-accent: var(--vl-bad);
}
.vl-fit__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}
.vl-fit__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 800;
  color: var(--vl-accent);
  border: 2px solid var(--vl-accent);
}
.vl-fit__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.vl-fit__list > .vl-fit__item {
  display: flex;
  gap: 8px;
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-1);
}
.vl-fit__mark {
  flex: none;
  width: 1em;
  font-weight: 800;
  color: var(--vl-accent);
}
.vl-fit__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
