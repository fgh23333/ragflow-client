<template>
    <div class="settings-container">
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <span>RAGFlow 连接设置</span>
                </div>
            </template>
            <el-form :model="form" label-width="150px">
                <el-form-item label="服务器地址">
                    <el-input v-model="form.serverUrl" placeholder="例如: http://127.0.0.1:8000" />
                    <div class="form-tip">请输入 RAGFlow 后端的完整地址</div>
                </el-form-item>
                <el-form-item label="API Key">
                    <el-input v-model="form.apiKey" type="password" show-password placeholder="请输入您的 API Key" />
                    <div class="form-tip">您可以在 RAGFlow 的个人设置页面找到 API Key</div>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSave">保存配置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useSystemStore } from '@/store/system';
import { ElMessage } from 'element-plus';

const systemStore = useSystemStore();

const form = reactive({
    serverUrl: systemStore.serverUrl,
    apiKey: systemStore.apiKey,
});

const onSave = () => {
    if (!form.apiKey) {
        ElMessage.error('API Key 不能为空！');
        return;
    }
    systemStore.setConfig(form.serverUrl, form.apiKey);
    ElMessage.success('配置已保存！');
};
</script>

<style scoped>
.settings-container {
    display: flex;
    justify-content: center;
    padding-top: 50px;
}

.box-card {
    width: 600px;
}

.form-tip {
    color: #909399;
    font-size: 12px;
    line-height: 1.5;
}
</style>