<template>
    <div v-loading="store.loading" class="kb-list-container">
        <div class="toolbar">
            <el-button type="primary" :icon="Plus" @click="openCreateDialog">创建知识库</el-button>
            <el-button type="danger" :icon="Delete" @click="handleBatchDelete"
                :disabled="selectedKbs.length === 0">批量删除</el-button>
        </div>

        <el-table :data="store.knowledgeBases" @selection-change="handleSelectionChange" :row-key="'id'"
            style="width: 100%">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="名称" width="200">
                <template #default="scope">
                    <el-link type="primary" @click="navigateToDetail(scope.row.id)">{{ scope.row.name }}</el-link>
                </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="embedding_model" label="Embedding模型" width="200" />
            <el-table-column prop="chunk_num" label="文档/块数量" width="150">
                <template #default="scope">
                    {{ scope.row.doc_num }} / {{ scope.row.chunk_num }}
                </template>
            </el-table-column>
            <el-table-column prop="create_time" label="创建时间" width="180" />
            <el-table-column label="操作" width="150" fixed="right">
                <template #default="scope">
                    <el-button size="small" type="danger" @click="handleSingleDelete(scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-dialog v-model="dialogVisible" title="创建新知识库" width="500px">
            <el-form :model="createForm" label-width="120px">
                <el-form-item label="知识库名称">
                    <el-input v-model="createForm.name" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="createForm.description" type="textarea" />
                </el-form-item>
                <el-form-item label="Embedding 模型">
                    <el-input v-model="createForm.embedding_model" placeholder="例如 BAAI/bge-large-en-v1.5" />
                    <div class="form-tip">请确保模型名称在RAGFlow中可用</div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleCreate">确认创建</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useKnowledgeBaseStore } from '@/store/knowledgeBase';
import { useSystemStore } from '@/store/system';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';

const store = useKnowledgeBaseStore();
const systemStore = useSystemStore();
const router = useRouter();
const selectedKbs = ref([]);
const dialogVisible = ref(false);
const createForm = reactive({ name: '', description: '', embedding_model: 'BAAI/bge-large-en-v1.5' });

onMounted(() => {
    if (systemStore.isConfigReady()) {
        store.fetchKnowledgeBases();
    } else {
        ElMessage.warning('请先在系统设置中配置服务器地址和 API Key！');
        router.push('/settings');
    }
});

const handleSelectionChange = (val) => { selectedKbs.value = val; };
const openCreateDialog = () => { dialogVisible.value = true; };
const navigateToDetail = (id) => { router.push(`/knowledge-bases/${id}`); };

const handleCreate = async () => {
    if (!createForm.name || !createForm.embedding_model) {
        ElMessage.error('名称和模型为必填项');
        return;
    }
    await store.createKnowledgeBase(createForm);
    dialogVisible.value = false;
};

const confirmDelete = (ids) => {
    const message = ids.length > 1 ? `确定要删除选中的 ${ids.length} 个知识库吗？` : `确定要删除此知识库吗？`;
    ElMessageBox.confirm(`${message}此操作不可逆！`, '警告', {
        confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning',
    }).then(() => store.deleteKnowledgeBases(ids))
        .catch(() => ElMessage.info('已取消删除'));
};

const handleBatchDelete = () => { confirmDelete(selectedKbs.value.map(kb => kb.id)); };
const handleSingleDelete = (row) => { confirmDelete([row.id]); };
</script>

<style scoped>
.kb-list-container {
    height: 100%;
}

.toolbar {
    padding: 20px;
}

.form-tip {
    color: #909399;
    font-size: 12px;
    line-height: 1.5;
}
</style>