import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";

import JsonViewer from "vue3-json-viewer";

createApp(App).use(store).use(router).use(JsonViewer).mount("#app");
