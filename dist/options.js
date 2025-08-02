// 页面加载时加载保存的设置
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupModelSelection();
});

// 设置模型选择逻辑
function setupModelSelection() {
  const modelSelect = document.getElementById('model');
  const customModelGroup = document.getElementById('customModelGroup');
  
  modelSelect.addEventListener('change', () => {
    if (modelSelect.value === 'custom') {
      customModelGroup.style.display = 'block';
    } else {
      customModelGroup.style.display = 'none';
    }
  });
}

// 加载设置
function loadSettings() {
  chrome.storage.sync.get(['apiEndpoint', 'apiKey', 'model', 'customModel', 'targetWordCount'], (result) => {
    if (result.apiEndpoint) {
      document.getElementById('apiEndpoint').value = result.apiEndpoint;
    }
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
    }
    if (result.model) {
      document.getElementById('model').value = result.model;
      if (result.model === 'custom') {
        document.getElementById('customModelGroup').style.display = 'block';
      }
    }
    if (result.customModel) {
      document.getElementById('customModel').value = result.customModel;
    }
    if (result.targetWordCount) {
      document.getElementById('targetWordCount').value = result.targetWordCount;
    }
  });
}

// 保存设置
function saveSettings() {
  const apiEndpoint = document.getElementById('apiEndpoint').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  const model = document.getElementById('model').value;
  const customModel = document.getElementById('customModel').value.trim();
  const targetWordCount = document.getElementById('targetWordCount').value.trim();
  
  // 验证输入
  if (!apiEndpoint) {
    showStatus('请输入API端点', 'error');
    return;
  }
  
  if (!apiKey) {
    showStatus('请输入API密钥', 'error');
    return;
  }
  
  // 验证自定义模型
  if (model === 'custom' && !customModel) {
    showStatus('请输入自定义模型名称', 'error');
    return;
  }
  
  // 验证目标字数
  if (targetWordCount && (isNaN(targetWordCount) || targetWordCount < 100 || targetWordCount > 10000)) {
    showStatus('目标字数必须在100-10000之间', 'error');
    return;
  }
  
  // 验证URL格式
  try {
    new URL(apiEndpoint);
  } catch (e) {
    showStatus('API端点格式不正确，请输入有效的URL', 'error');
    return;
  }
  
  // 保存到存储
  const saveData = {
    apiEndpoint: apiEndpoint,
    apiKey: apiKey,
    model: model
  };
  
  if (model === 'custom') {
    saveData.customModel = customModel;
  }
  
  if (targetWordCount) {
    saveData.targetWordCount = parseInt(targetWordCount);
  }
  
  chrome.storage.sync.set(saveData, () => {
    if (chrome.runtime.lastError) {
      showStatus('保存失败: ' + chrome.runtime.lastError.message, 'error');
    } else {
      showStatus('设置保存成功！', 'success');
    }
  });
}

// 显示状态信息
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  // 3秒后自动隐藏
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// 监听表单提交
document.getElementById('settingsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  saveSettings();
});

// 监听保存按钮点击
document.getElementById('saveBtn').addEventListener('click', (e) => {
  e.preventDefault();
  saveSettings();
});

// 监听清除缓存按钮点击
document.getElementById('clearCacheBtn').addEventListener('click', (e) => {
  e.preventDefault();
  clearArticleCache();
});

// 清除文章缓存
function clearArticleCache() {
  if (confirm('确定要清除所有已转换的文章缓存吗？这将删除所有保存的文章，下次需要重新转换。')) {
    chrome.storage.local.get(null, (items) => {
      const articleKeys = Object.keys(items).filter(key => key.startsWith('article_'));
      if (articleKeys.length > 0) {
        chrome.storage.local.remove(articleKeys, () => {
          showStatus(`已清除 ${articleKeys.length} 个文章的缓存`, 'success');
        });
      } else {
        showStatus('没有找到需要清除的文章缓存', 'success');
      }
    });
  }
} 