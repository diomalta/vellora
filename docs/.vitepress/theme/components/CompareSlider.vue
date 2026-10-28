<script setup lang="ts">
import { withBase } from "vitepress";
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    before: string;
    after: string;
    alt: string;
    beforeLabel?: string;
    afterLabel?: string;
    caption?: string;
    start?: number;
    /** Show only the top of both images, as a CSS aspect ratio such as "900 / 760". */
    ratio?: string;
  }>(),
  { beforeLabel: "Before", afterLabel: "After", caption: undefined, start: 50, ratio: undefined },
);

const position = ref(Math.min(100, Math.max(0, props.start)));
const beforeSrc = computed(() => withBase(props.before));
const afterSrc = computed(() => withBase(props.after));
// The "after" image covers the right-hand side; dragging right reveals more "before".
const afterClip = computed(() => `inset(0 0 0 ${position.value}%)`);

function onInput(event: Event) {
  position.value = Number((event.target as HTMLInputElement).value);
}
</script>

<template>
  <figure class="vl-compare">
    <div
      class="vl-compare__stage"
      :style="{ '--vl-pos': `${position}%`, aspectRatio: ratio }"
    >
      <img
        class="vl-compare__img"
        :src="beforeSrc"
        :alt="`${beforeLabel}: ${alt}`"
        loading="lazy"
        decoding="async"
      />
      <img
        class="vl-compare__img vl-compare__img--after"
        :src="afterSrc"
        :alt="`${afterLabel}: ${alt}`"
        :style="{ clipPath: afterClip }"
        loading="lazy"
        decoding="async"
      />
      <span class="vl-compare__label vl-compare__label--before" aria-hidden="true">{{
        beforeLabel
      }}</span>
      <span class="vl-compare__label vl-compare__label--after" aria-hidden="true">{{
        afterLabel
      }}</span>
      <span class="vl-compare__handle" aria-hidden="true"><span class="vl-compare__knob" /></span>
      <input
        class="vl-compare__range"
        type="range"
        min="0"
        max="100"
        step="1"
        :value="position"
        :aria-label="`Compare ${beforeLabel} and ${afterLabel}: drag or use arrow keys`"
        :aria-valuetext="`${Math.round(position)}% ${beforeLabel}, ${Math.round(100 - position)}% ${afterLabel}`"
        @input="onInput"
      />
    </div>
    <figcaption v-if="caption" class="vl-compare__caption">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.vl-compare {
  margin: 24px 0;
}
.vl-compare__stage {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: #fff;
  line-height: 0;
  user-select: none;
  touch-action: pan-y;
}
.vl-compare__img {
  display: block;
  width: 100%;
  height: auto;
  margin: 0;
}
.vl-compare__img--after {
  position: absolute;
  inset: 0;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}
.vl-compare__label {
  position: absolute;
  top: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  color: #fff;
  background: rgba(17, 17, 20, 0.78);
  pointer-events: none;
}
.vl-compare__label--before {
  left: 10px;
}
.vl-compare__label--after {
  right: 10px;
  box-shadow: inset 0 0 0 2px var(--vp-c-brand-1);
}
.vl-compare__handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--vl-pos);
  width: 3px;
  transform: translateX(-50%);
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7);
  pointer-events: none;
}
.vl-compare__knob {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 34px;
  height: 34px;
  transform: translate(-50%, -50%);
  border: 3px solid var(--vp-c-brand-1);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
.vl-compare__knob::before,
.vl-compare__knob::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 0;
  height: 0;
  border: 5px solid transparent;
  transform: translateY(-50%);
}
.vl-compare__knob::before {
  left: 2px;
  border-right-color: var(--vp-c-brand-1);
}
.vl-compare__knob::after {
  right: 2px;
  border-left-color: var(--vp-c-brand-1);
}
.vl-compare__range {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: ew-resize;
  -webkit-appearance: none;
  appearance: none;
}
.vl-compare__range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 44px;
  height: 100vh;
}
.vl-compare__range::-moz-range-thumb {
  width: 44px;
  height: 100vh;
  border: 0;
}
.vl-compare__stage:focus-within .vl-compare__knob {
  outline: 3px solid var(--vp-c-brand-2);
  outline-offset: 3px;
}
.vl-compare__caption {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  text-align: center;
}
</style>
