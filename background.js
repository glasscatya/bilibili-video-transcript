console.log("Service Worker 已启动");

self.addEventListener('install', (event) => {
  console.log('Service Worker 安装完成');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker 已激活');
});

// 用于存储当前视频的已处理字幕 URL
let processedUrls = new Set();

// 处理字幕的函数
async function handleSubtitle(url, type) {
  if (!processedUrls.has(url)) {
    console.log(`捕获到${type}字幕响应:`);
    console.log("URL:", url);

    // 将 URL 添加到已处理的集合中
    processedUrls.add(url);

    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log("响应内容:", data);

      // 发送消息到内容脚本
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "showSubtitles", data: data.body});
      });
    } catch (error) {
      console.error(`获取${type}字幕响应内容时出错:`, error);
    }
  } else {
    console.log(`该 ${type}字幕 URL 已经处理过，跳过:`, url);
  }
}

// 监听导航事件以检测新的视频页面
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) {  // 只在主框架导航时重置
    console.log("检测到新的视频页面，重置已处理的字幕 URL 集合");
    processedUrls = new Set();
  }
}, {url: [{hostSuffix: 'bilibili.com'}]});

chrome.webRequest.onCompleted.addListener(
  (details) => {
    const aiSubtitleUrl = "https://aisubtitle.hdslb.com/bfs/ai_subtitle/prod/";
    const humanSubtitleUrl = "https://aisubtitle.hdslb.com/bfs/subtitle/";

    if (details.url.startsWith(humanSubtitleUrl)) {
      handleSubtitle(details.url, "人工");
    } else if (details.url.startsWith(aiSubtitleUrl)) {
      // 检查是否有人工字幕已经被处理过
      if (![...processedUrls].some(url => url.startsWith(humanSubtitleUrl))) {
        handleSubtitle(details.url, "AI");
      }
    }
  },
  {urls: ["<all_urls>"]}
);

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "convertToArticle") {
    convertSubtitleToArticle(request.subtitleText, request.bvid)
      .then(article => {
        sendResponse({ success: true, article: article });
      })
      .catch(error => {
        console.error('转换文章失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放
  }
});

// 转换字幕为文章的函数
async function convertSubtitleToArticle(subtitleText, bvid) {
  try {
    // 验证输入
    if (!subtitleText || subtitleText.trim().length === 0) {
      throw new Error('字幕内容为空');
    }

    // 从存储中获取API配置
    const config = await chrome.storage.sync.get(['apiEndpoint', 'apiKey', 'model', 'customModel']);
    
    if (!config.apiEndpoint || !config.apiKey) {
      throw new Error('请先在插件设置中配置API端点和密钥');
    }
    
    // 确定使用的模型
    let modelToUse = 'gpt-3.5-turbo'; // 默认模型
    if (config.model) {
      if (config.model === 'custom' && config.customModel) {
        modelToUse = config.customModel;
      } else if (config.model !== 'custom') {
        modelToUse = config.model;
      }
    }

    // 限制字幕长度，避免API调用超时
    const maxLength = 8000; // 大约4000个中文字符
    if (subtitleText.length > maxLength) {
      subtitleText = subtitleText.substring(0, maxLength) + '\n\n[内容已截断，仅处理前' + maxLength + '个字符]';
    }

    const prompt = `你的任务是根据提供的字幕文本输出逐字稿文章。
请仔细阅读以下字幕文本：
<subtitle_text>
${subtitleText}
</subtitle_text>
在将字幕文本转换为逐字稿文章时，请遵循以下规则：
1. 保持内容的完整性，不遗漏字幕中的任何信息。
2. 合理使用标点符号，使文章语句通顺、表意清晰。

请在<文章>标签内输出转换后的逐字稿文章。

`;

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API错误响应:', errorText);
      
      if (response.status === 401) {
        throw new Error('API密钥无效，请检查您的API密钥');
      } else if (response.status === 429) {
        throw new Error('API调用频率过高，请稍后再试');
      } else if (response.status === 400) {
        throw new Error('API请求参数错误，请检查配置');
      } else {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API响应格式错误');
    }

    let article = data.choices[0].message.content;
    
    // 提取<文章>标签内的内容
    const articleMatch = article.match(/<文章>([\s\S]*?)<\/文章>/);
    if (articleMatch) {
      article = articleMatch[1].trim();
    }

    // 如果没有找到标签，直接使用返回的内容
    if (!article || article.length === 0) {
      article = data.choices[0].message.content.trim();
    }

    return article;
  } catch (error) {
    console.error('转换文章时出错:', error);
    throw error;
  }
}
