<template>
  <el-container class="main-container">
    <el-header class="header">
      <div class="logo">RAGFlow Client</div>
      <el-menu :default-active="activeIndex" mode="horizontal" :router="true" background-color="#545c64"
        text-color="#fff" active-text-color="#ffd04b">
        <el-menu-item index="/knowledge-bases">知识库管理</el-menu-item>
        <el-menu-item index="/settings">系统设置</el-menu-item>
      </el-menu>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeIndex = computed(() => route.path);
</script>

<style>
* {
  padding: 0;
  margin: 0;
  text-decoration: none;
}

#app {
  height: 100vh;
  width: 100vw;
  padding: 0;
  margin: 0;
}

body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.main-container {
  height: 100vh;
  width: 100vw;
}

.header {
  display: flex;
  align-items: center;
  background-color: #545c64;
  color: white;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  margin-right: 50px;
}

/* El-menu takes up remaining space */
.el-menu {
  flex-grow: 1;
  border-bottom: none !important;
}

.el-main {
  width: 100%;
}

.el-container {
  width: 100%;
}
</style>