import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import BarChart from "./components/BarChart.vue";
import CompareSlider from "./components/CompareSlider.vue";
import ExampleGallery from "./components/ExampleGallery.vue";
import FitCheck from "./components/FitCheck.vue";
import PainChips from "./components/PainChips.vue";
import StatTiles from "./components/StatTiles.vue";
import "./custom.css";

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("CompareSlider", CompareSlider);
    app.component("StatTiles", StatTiles);
    app.component("FitCheck", FitCheck);
    app.component("ExampleGallery", ExampleGallery);
    app.component("BarChart", BarChart);
    app.component("PainChips", PainChips);
  },
};

export default theme;
