// src/api/index.js
import axios from 'axios';
import { useSystemStore } from '@/store/system';

// 创建一个 Axios 实例
const apiClient = axios.create({
    timeout: 30000, // 30 seconds timeout
});

// 添加请求拦截器
apiClient.interceptors.request.use(
    (config) => {
        const systemStore = useSystemStore();
        const { serverUrl, apiKey } = systemStore;

        if (!serverUrl || !apiKey) {
            // 如果没有配置，拒绝请求并提示
            const error = new Error('RAGFlow 服务器地址或 API Key 未配置！');
            return Promise.reject(error);
        }

        // 动态设置 baseURL 和 Authorization 头
        config.baseURL = serverUrl;
        config.headers['Authorization'] = `Bearer ${apiKey}`;

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 封装所有需要用到的 RAGFlow API
export default {
    // === Knowledge Base (Dataset) APIs ===
    getDatasets(page = 1, pageSize = 100) {
        return apiClient.get('/api/v1/datasets', { params: { page, page_size: pageSize } });
    },

    createDataset(data) {
        // data: { name, embedding_model, ... }
        return apiClient.post('/api/v1/datasets', data);
    },

    updateDataset(datasetId, data) {
        return apiClient.put(`/api/v1/datasets/${datasetId}`, data);
    },

    deleteDatasets(ids) {
        // ids: ['id1', 'id2']
        return apiClient.delete('/api/v1/datasets', { data: { ids } });
    },

    // === Document APIs ===
    getDocuments(datasetId, page = 1, pageSize = 30) {
        return apiClient.get(`/api/v1/datasets/${datasetId}/documents`, { params: { page, page_size: pageSize } });
    },

    uploadDocuments(datasetId, formData) {
        // formData is a FormData object
        return apiClient.post(`/api/v1/datasets/${datasetId}/documents`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // Optional: Add progress tracking
            onUploadProgress: (progressEvent) => {
                // You can use this to show an upload progress bar
                console.log(`Upload Progress: ${Math.round((progressEvent.loaded * 100) / progressEvent.total)}%`);
            }
        });
    },

    updateDocument(datasetId, documentId, data) {
        // data can contain one or more of the following fields:
        // { name: string, meta_fields: object, chunk_method: string, parser_config: object }
        return apiClient.put(`/api/v1/datasets/${datasetId}/documents/${documentId}`, data);
    },

    deleteDocument(datasetId, documentId) {
        return apiClient.delete(`/api/v1/datasets/${datasetId}/documents/${documentId}`);
    },

    // === Parsing (Chunk) API ===
    runParsing(datasetId, document_ids) {
        return apiClient.post(`/api/v1/datasets/${datasetId}/chunks`, { document_ids });
    }
};
