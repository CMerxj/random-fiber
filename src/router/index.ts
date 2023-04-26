import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "../views/Home.vue";

const routes: Array<RouteRecordRaw> = [
    {
        path: "/",
        name: "Home",
        component: Home,
    },
    {
        path: "/about",
        name: "About",
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () =>
            import(/* webpackChunkName: "about" */ "../views/About.vue"),
    },
    {
        path: "/translation",
        name: "translation",
        component: () => import("../views/translation.vue"),
    },
    {
        path: "/json2csv",
        name: "CSV",
        component: () => import("../views/json-csv.vue"),
    },
    {
        // 兜底方法
        path: "/:catchAll(.*)",
        redirect: "/",
        component: () => {
            return null;
        },
    },
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

export default router;
