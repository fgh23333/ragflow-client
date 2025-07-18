// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import KBListView from '@/views/KnowledgeBase/KBListView.vue';
import KBDetailView from '@/views/KnowledgeBase/KBDetailView.vue';
import Settings from '@/views/Settings.vue';

const routes = [
    {
        path: '/',
        redirect: '/knowledge-bases'
    },
    {
        path: '/knowledge-bases',
        name: 'KnowledgeBaseList',
        component: KBListView,
    },
    {
        path: '/knowledge-bases/:id',
        name: 'KnowledgeBaseDetail',
        component: KBDetailView,
        props: true // Pass route params as component props
    },
    {
        path: '/settings',
        name: 'Settings',
        component: Settings,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;