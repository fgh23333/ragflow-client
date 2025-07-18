// src/store/system.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSystemStore = defineStore(
  'system',
  () => {
    // State
    const serverUrl = ref('http://ailab.flashhold.com:1080'); // Default server URL
    const apiKey = ref('');

    // Getter to check if the config is ready
    const isConfigReady = () => {
      return serverUrl.value && apiKey.value;
    };

    // Actions
    function setConfig(url, key) {
      serverUrl.value = url;
      apiKey.value = key;
    }

    return {
      serverUrl,
      apiKey,
      isConfigReady,
      setConfig,
    };
  },
  {
    // Enable persistence for this store
    persist: true,
  }
);