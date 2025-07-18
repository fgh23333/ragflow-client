// src/store/knowledgeBase.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ElNotification, ElMessage } from 'element-plus';
import api from '@/api';

export const useKnowledgeBaseStore = defineStore('knowledgeBase', () => {
  const knowledgeBases = ref([]);
  const files = ref([]);
  const totalFiles = ref(0);
  const loading = ref(false);

  // === 数据获取 Actions ===
  async function fetchKnowledgeBases() {
    loading.value = true;
    try {
      const res = await api.getDatasets();
      if (res.data && Array.isArray(res.data.data)) {
        knowledgeBases.value = res.data.data;
      } else {
        knowledgeBases.value = [];
      }
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      knowledgeBases.value = [];
      ElNotification({ title: '错误', message: '获取知识库列表失败', type: 'error' });
    } finally {
      loading.value = false;
    }
  }

  async function fetchFiles(kbId, page = 1, pageSize = 30) {
    loading.value = true;
    try {
      const res = await api.getDocuments(kbId, page, pageSize);
      if (res.data && Array.isArray(res.data.data.docs)) {
        files.value = res.data.data.docs;
        totalFiles.value = res.data.total || 0;
      } else {
        files.value = [];
        totalFiles.value = 0;
      }
    } catch (error) {
      console.error(`获取文件列表失败 for kb ${kbId}:`, error);
      files.value = [];
      totalFiles.value = 0;
      ElNotification({ title: '错误', message: '获取文件列表失败', type: 'error' });
    } finally {
      loading.value = false;
    }
  }

  // === 知识库操作 Actions ===
  async function createKnowledgeBase(kbData) {
    loading.value = true;
    try {
      await api.createDataset(kbData);
      ElMessage.success('知识库创建成功!');
      await fetchKnowledgeBases();
    } catch (error) {
      ElNotification({ title: '错误', message: `创建知识库失败: ${error.message}`, type: 'error' });
    } finally {
      loading.value = false;
    }
  }

  async function deleteKnowledgeBases(ids) {
    loading.value = true;
    try {
      await api.deleteDatasets(ids);
      ElMessage.success('成功删除所选知识库!');
      await fetchKnowledgeBases();
    } catch (error) {
      ElNotification({ title: '错误', message: '删除知识库失败', type: 'error' });
    } finally {
      loading.value = false;
    }
  }

  // === 文件操作 Actions ===
  async function updateFilesInStore(kbId, docIds, data) {
    loading.value = true;
    ElMessage.info(`开始为 ${docIds.length} 个文件批量更新信息...`);
    try {
      const promises = docIds.map(docId => api.updateDocument(kbId, docId, data));
      await Promise.all(promises);
      ElMessage.success('批量更新信息成功!');
      await fetchFiles(kbId); // Refresh the file list
    } catch (error) {
      ElNotification({ title: '错误', message: `批量更新信息时发生错误: ${error.message}`, type: 'error' });
    } finally {
      loading.value = false;
    }
  }

  async function runParsingForFiles(kbId, document_ids) {
    // 1. **立即在前端更新状态**，提供即时反馈
    const docIdSet = new Set(document_ids);
    files.value = files.value.map(file => {
      if (docIdSet.has(file.id)) {
        return { ...file, run: 'RUNNING' }; // Use a more descriptive status
      }
      return file;
    });

    ElMessage.info('已发送批量解析任务，文件状态更新为“解析中”...');

    // 2. **异步向后端发送请求**
    try {
      await api.runParsing(kbId, document_ids);
      ElMessage.success('解析任务已成功提交到后端处理。');
      // 3. **延迟后从服务器刷新**，获取最终状态
      setTimeout(() => {
        ElMessage.info('正在刷新文件状态...');
        fetchFiles(kbId);
      }, 5000); // 延迟5秒刷新
    } catch (error) {
      ElNotification({ title: '错误', message: `发送解析任务失败: ${error.message}`, type: 'error' });
      // 如果失败，可以把状态再改回去
      fetchFiles(kbId);
    }
  }

  return {
    knowledgeBases,
    files,
    totalFiles,
    loading,
    fetchKnowledgeBases,
    createKnowledgeBase,
    deleteKnowledgeBases,
    fetchFiles,
    updateFilesInStore,
    runParsingForFiles
  };
});
