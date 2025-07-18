<template>
    <div class="kb-detail-container" v-loading="store.loading">
        <el-page-header @back="goBack" class="page-header-padding">
            <template #content>
                <span class="text-large font-600 mr-3"> 知识库详情: {{store.knowledgeBases.find(k => k.id === id)?.name}}
                </span>
            </template>
        </el-page-header>

        <el-divider />

        <div class="toolbar toolbar-padding">
            <el-upload multiple action="" class="upload-button" :show-file-list="false"
                :http-request="handleUploadRequest">
                <el-button type="primary" :icon="Upload">上传文件(自动匹配.json元数据)</el-button>
            </el-upload>

            <el-button type="success" :icon="EditPen" @click="openMetadataDialog"
                :disabled="selectedFiles.length === 0">批量设置元数据</el-button>
            <el-button type="warning" :icon="Reading" @click="handleRunParsing"
                :disabled="selectedFiles.length === 0">批量解析</el-button>
            <el-button :icon="Refresh" @click="fetchData" circle />
        </div>
        <el-button type="danger" :icon="Delete" @click="handleDeleteFiles"
            :disabled="selectedFiles.length === 0">批量删除</el-button>
        <el-table :data="store.files" @selection-change="handleSelectionChange" :row-key="'id'" style="width: 100%">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="文件名" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="120">
                <template #default="scope">
                    <el-tag :type="formatStatus(scope.row.run).type" effect="dark">
                        {{ formatStatus(scope.row.run).text }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="chunk_num" label="块数量" width="100" />
            <el-table-column prop="create_time" label="上传时间" width="180" />
            <el-table-column label="元数据">
                <template #default="scope">
                    <pre v-if="scope.row.meta_fields && Object.keys(scope.row.meta_fields).length > 0"
                        class="meta-pre">{{ JSON.stringify(scope.row.meta_fields, null, 2) }}</pre>
                    <span v-else style="color: #909399;">无</span>
                </template>
            </el-table-column>
        </el-table>

        <el-pagination v-if="store.totalFiles > 0" class="pagination" background layout="prev, pager, next"
            :total="store.totalFiles" :page-size="pagination.pageSize" :current-page="pagination.currentPage"
            @current-change="handlePageChange" />

        <el-dialog v-model="metadataDialogVisible" title="批量设置元数据" width="600px">
            <p class="dialog-tip">将为选中的 {{ selectedFiles.length }} 个文件设置以下元数据 (注意：这将完全覆盖文件原有的元数据！)</p>
            <el-form :model="metadataForm" label-position="top">
                <el-form-item label="元数据 (JSON 格式)">
                    <el-input v-model="metadataForm.jsonString" :rows="10" type="textarea"
                        placeholder='{ "source": "人力资源部" }' />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="metadataDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSetMetadata">确认更新</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useKnowledgeBaseStore } from '@/store/knowledgeBase';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, EditPen, Reading, Refresh } from '@element-plus/icons-vue';
import api from '@/api';

const props = defineProps({ id: { type: String, required: true } });
const store = useKnowledgeBaseStore();
const router = useRouter();

const selectedFiles = ref([]);
const metadataDialogVisible = ref(false);
const metadataForm = reactive({ jsonString: '' });
const pagination = reactive({ currentPage: 1, pageSize: 30 });

onMounted(() => {
    if (store.knowledgeBases.length === 0) store.fetchKnowledgeBases();
    fetchData();
});

const fetchData = () => { store.fetchFiles(props.id, pagination.currentPage, pagination.pageSize); };
const goBack = () => router.back();
const handleSelectionChange = (val) => { selectedFiles.value = val; };
const handlePageChange = (page) => { pagination.currentPage = page; fetchData(); };

const readFileAsText = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
});

const handleUploadRequest = async ({ file: singleFile, files: multipleFiles }) => {
    const fileList = multipleFiles || [singleFile];
    store.loading = true;
    ElMessage.info(`开始处理 ${fileList.length} 个选定文件...`);
    const dataFiles = [];
    const metadataMap = new Map();

    try {
        for (const file of fileList) {
            const actualFile = file.raw || file; // el-upload might wrap the file
            console.log(actualFile);
            
            if (actualFile.name.toLowerCase().endsWith('.json')) {
                const baseName = actualFile.name.slice(0, actualFile.name.lastIndexOf('.'));
                const content = await readFileAsText(actualFile);
                metadataMap.set(baseName, JSON.parse(content));
            } else {
                dataFiles.push(actualFile);
                console.log(dataFiles);
                
            }
        }
    } catch (e) {
        ElMessage.error(`读取或解析元数据JSON文件时出错: ${e.message}`);
        store.loading = false;
        return;
    }

    if (dataFiles.length === 0) {
        ElMessage.warning('没有找到可上传的数据文件。');
        store.loading = false;
        return;
    }

    const formData = new FormData();
    dataFiles.forEach(f => formData.append('file', f));
    let uploadedFilesInfo;
    try {
        ElMessage.info(`正在上传 ${dataFiles.length} 个数据文件...`);
        const res = await api.uploadDocuments(props.id, formData);
        uploadedFilesInfo = res.data.data;
        if (!Array.isArray(uploadedFilesInfo)) throw new Error("API未返回预期的文件信息数组");
        ElMessage.success('数据文件上传成功！开始匹配并更新元数据...');
    } catch (error) {
        ElMessage.error(`数据文件上传失败: ${error.message}`);
        store.loading = false;
        return;
    }

    const updatePromises = uploadedFilesInfo.map(docInfo => {
        const baseName = docInfo.name.slice(0, docInfo.name.lastIndexOf('.'));
        if (metadataMap.has(baseName)) {
            const payload = { meta_fields: metadataMap.get(baseName) };
            return api.updateDocument(props.id, docInfo.id, payload);
        }
        return Promise.resolve();
    }).filter(p => p !== Promise.resolve());

    if (updatePromises.length > 0) {
        try {
            await Promise.all(updatePromises);
            ElMessage.success(`${updatePromises.length} 个文件的元数据已成功更新！`);
        } catch (error) { ElMessage.warning('部分文件的元数据更新失败。'); }
    }
    store.loading = false;
    fetchData();
};

const openMetadataDialog = () => {
    if (selectedFiles.value.length === 0) return;
    metadataForm.jsonString = '{\n  \n}';
    metadataDialogVisible.value = true;
};

const handleSetMetadata = async () => {
    let parsedMetadata;
    try {
        parsedMetadata = JSON.parse(metadataForm.jsonString);
        if (typeof parsedMetadata !== 'object' || parsedMetadata === null || Array.isArray(parsedMetadata)) {
            throw new Error('输入内容必须是一个合法的 JSON 对象。');
        }
    } catch (e) {
        ElMessage.error(`JSON 格式错误: ${e.message}`);
        return;
    }
    const docIds = selectedFiles.value.map(file => file.id);
    const payload = { meta_fields: parsedMetadata };
    await store.updateFilesInStore(props.id, docIds, payload);
    metadataDialogVisible.value = false;
};

const handleRunParsing = () => {
    if (selectedFiles.value.length === 0) return;
    ElMessageBox.confirm(`确定要为选中的 ${selectedFiles.value.length} 个文件创建解析任务吗？`, '确认解析', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    }).then(() => store.runParsingForFiles(props.id, selectedFiles.value.map(f => f.id)))
        .catch(() => ElMessage.info('已取消解析'));
};

const formatStatus = (run) => {
    switch (String(run)) {
        case 'UNSTART': return { text: '未解析', type: 'primary' };
        case 'RUNNING': return { text: '解析中', type: 'primary' };
        case 'CANCEL': return { text: '取消', type: 'warning' };
        case 'DONE': return { text: '成功', type: 'success' };
        case 'FAIL': return { text: '失败', type: 'danger' };
        default: return { text: '未知', type: 'info' };
    }
};
</script>

<style scoped>
.kb-detail-container {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.page-header-padding,
.toolbar-padding {
    padding: 20px 20px 10px 20px;
    flex-shrink: 0;
}

.toolbar {
    padding-bottom: 20px;
    display: flex;
    gap: 10px;
}

.el-divider {
    margin: 0;
}

.el-table {
    flex-grow: 1;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    padding-bottom: 20px;
    flex-shrink: 0;
}

.dialog-tip {
    margin-bottom: 20px;
    color: #606266;
}

.meta-pre {
    background-color: #f5f7fa;
    padding: 5px;
    border-radius: 4px;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
}
</style>
