<script setup lang="ts">
import { withBase } from "vitepress";

export interface ExampleItem {
  src: string;
  title: string;
  caption?: string;
  href?: string;
  alt?: string;
}

defineProps<{
  items: ExampleItem[];
}>();
</script>

<template>
  <ul class="vl-gallery">
    <li v-for="item in items" :key="item.src" class="vl-gallery__card">
      <component
        :is="item.href ? 'a' : 'div'"
        class="vl-gallery__inner"
        :href="item.href ? withBase(item.href) : undefined"
      >
        <span class="vl-gallery__frame">
          <img
            class="vl-gallery__img"
            :src="withBase(item.src)"
            :alt="item.alt ?? item.title"
            loading="lazy"
            decoding="async"
          />
        </span>
        <span class="vl-gallery__body">
          <span class="vl-gallery__title">{{ item.title }}</span>
          <span v-if="item.caption" class="vl-gallery__caption">{{ item.caption }}</span>
        </span>
      </component>
    </li>
  </ul>
</template>

<style scoped>
.vl-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin: 24px 0;
  padding: 0;
  list-style: none;
}
.vl-gallery > .vl-gallery__card {
  margin: 0;
}
.vl-gallery__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.2s,
    transform 0.2s;
}
a.vl-gallery__inner:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}
a.vl-gallery__inner:focus-visible {
  outline: 3px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
.vl-gallery__frame {
  display: block;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #fff;
  border-bottom: 1px solid var(--vp-c-divider);
}
.vl-gallery__img {
  display: block;
  width: 100%;
  height: 100%;
  margin: 0;
  object-fit: cover;
  object-position: top center;
}
.vl-gallery__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px 14px;
}
.vl-gallery__title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}
a.vl-gallery__inner .vl-gallery__title {
  color: var(--vp-c-brand-1);
}
.vl-gallery__caption {
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
@media (max-width: 639px) {
  .vl-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .vl-gallery__body {
    padding: 8px 10px 10px;
  }
  .vl-gallery__caption {
    font-size: 12px;
  }
}
</style>
