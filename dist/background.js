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
    convertSubtitleToArticle(request.subtitleText, request.bvid, request.promptType)
      .then(article => {
        sendResponse({ success: true, article: article });
      })
      .catch(error => {
        console.error('转换文章失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放
  } else if (request.action === "downloadAndTranscribe") {
    downloadAndTranscribe(request.audioUrl, request.bvid)
      .then(text => {
        sendResponse({ success: true, text: text });
      })
      .catch(error => {
        console.error('极速转录失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  } else if (request.action === "fetchBilibiliSubtitle") {
    fetchBilibiliSubtitle(request.bvid, request.cid)
      .then(result => {
        sendResponse({ success: true, subtitles: result });
      })
      .catch(error => {
        console.error('获取B站字幕失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

// 获取 B 站 API 字幕
async function fetchBilibiliSubtitle(bvid, cid) {
  try {
    const url = `https://api.bilibili.com/x/player/v2?cid=${cid}&bvid=${bvid}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(`API Error: ${data.message}`);
    }

    if (!data.data || !data.data.subtitle || !data.data.subtitle.subtitles || data.data.subtitle.subtitles.length === 0) {
      throw new Error('该视频没有官方/AI字幕');
    }

    // 优先选择中文 (zh-CN) 或 AI生成 (ai-zh)，否则默认取第一个
    const subtitles = data.data.subtitle.subtitles;
    const targetSubtitle = subtitles.find(s => s.lan === 'zh-CN') || subtitles.find(s => s.lan === 'ai-zh') || subtitles[0];
    
    let subtitleUrl = targetSubtitle.subtitle_url;
    if (subtitleUrl.startsWith('//')) {
      subtitleUrl = 'https:' + subtitleUrl;
    }

    console.log('Fetching subtitle from:', subtitleUrl);
    const subResponse = await fetch(subtitleUrl);
    const subData = await subResponse.json();
    
    // 返回 body 数组
    return subData.body;

  } catch (error) {
    throw error;
  }
}

// 极速转录函数 (下载音频流并识别)
async function downloadAndTranscribe(audioUrl, bvid) {
  try {
    const config = await chrome.storage.sync.get(['apiEndpoint', 'apiKey', 'audioModel']);
    if (!config.apiKey) throw new Error('请先配置 API Key');

    // 1. 下载音频
    console.log('开始下载音频流:', audioUrl);
    // 必须添加 Referer 否则会被 B 站拒绝
    const audioRes = await fetch(audioUrl, {
        headers: {
            'Referer': 'https://www.bilibili.com/',
            'Origin': 'https://www.bilibili.com'
        }
    });
    
    if (!audioRes.ok) throw new Error(`音频下载失败: ${audioRes.status}`);
    
    const blob = await audioRes.blob();
    console.log(`音频下载完成，大小: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    
    // 检查大小限制 (25MB)
    if (blob.size > 25 * 1024 * 1024) {
        throw new Error(`文件过大 (${(blob.size / 1024 / 1024).toFixed(2)}MB)，超过 Whisper API 25MB 限制。请使用录制模式或尝试较短的视频。`);
    }

    // 2. 调用 Whisper API
    // 复用 transcribeAudio 中的逻辑，但需要适配 Blob
    return await callWhisperApi(blob, config);

  } catch (error) {
    console.error('极速转录出错:', error);
    throw error;
  }
}

async function callWhisperApi(blob, config) {
     // 处理 API Endpoint
     let endpoint = 'https://api.openai.com/v1/audio/transcriptions';
     if (config.apiEndpoint) {
       let baseUrl = config.apiEndpoint;
       if (baseUrl.endsWith('/chat/completions')) {
         baseUrl = baseUrl.replace('/chat/completions', '');
       } else if (baseUrl.endsWith('/v1')) {
         // do nothing
       } else if (baseUrl.endsWith('/')) {
         baseUrl = baseUrl.slice(0, -1);
       }
       
       if (baseUrl.includes('/v1')) {
          const v1Index = baseUrl.indexOf('/v1');
          baseUrl = baseUrl.substring(0, v1Index + 3); 
          endpoint = `${baseUrl}/audio/transcriptions`;
       } else {
          if (!baseUrl.endsWith('/audio/transcriptions')) {
             endpoint = `${baseUrl}/audio/transcriptions`;
          }
       }
     }

     const formData = new FormData();
     // 强制命名为 .m4a 以便 API 识别 (即使原始格式可能是 m4s/aac)
     formData.append('file', blob, 'audio.m4a');
     formData.append('model', 'whisper-1');
     formData.append('response_format', 'text');

     const apiResponse = await fetch(endpoint, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${config.apiKey}`
       },
       body: formData
     });

     if (!apiResponse.ok) {
       const errorText = await apiResponse.text();
       console.error('Whisper API错误响应:', errorText);
       throw new Error(`Whisper API请求失败: ${apiResponse.status} ${apiResponse.statusText}`);
     }

     return await apiResponse.text();
}

// 音频转录函数
async function transcribeAudio(audioDataBase64, bvid) {
  try {
    // 从存储中获取API配置
    const config = await chrome.storage.sync.get(['apiEndpoint', 'apiKey', 'model', 'audioModel']);
    
    if (!config.apiKey) {
      throw new Error('请先在插件设置中配置API密钥');
    }

    // 将 base64 转换为 Blob
    const response = await fetch(audioDataBase64);
    const blob = await response.blob();
    
    return await callWhisperApi(blob, config);

  } catch (error) {
    console.error('音频转录出错:', error);
    throw error;
  }
}

async function convertSubtitleToArticle(subtitleText, bvid, promptType = 'article') {
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
    const maxLength = 12000; // 稍微放宽限制
    if (subtitleText.length > maxLength) {
      subtitleText = subtitleText.substring(0, maxLength) + '\n\n[内容已截断，仅处理前' + maxLength + '个字符]';
    }

    let systemPrompt = '';
    let userPrompt = '';
    
    if (promptType === 'summary') {
        // 视频纪要 Prompt
        systemPrompt = `你是一个专业的视频内容总结助手。你的任务是根据提供的视频字幕，生成一份结构清晰、重点突出的视频纪要。`;
        userPrompt = `请阅读以下视频字幕，并生成一份视频纪要。
<subtitle>
${subtitleText}
</subtitle>

要求：
1. **核心主题**：用一句话概括视频的主旨。
2. **关键要点**：使用无序列表列出视频中的3-5个关键信息点。
3. **时间线总结**：如果视频较长，请按时间顺序简要概括主要内容的发展（无需精确时间戳，只需逻辑顺序）。
4. **忽略废话**：请忽略口语中的重复、语气词和无关的闲聊。
5. **输出格式**：请直接输出 Markdown 格式的内容，不要包含任何开场白或结束语。
`;
    } else if (promptType === 'insight') {
        // 观点提取 Prompt
        systemPrompt = `你是一个深刻的洞察力分析师。你的任务是从视频字幕中提取核心观点、论据和独特见解，忽略一般性的事实陈述。`;
        userPrompt = `请分析以下视频字幕，提取其中的核心观点和洞察。
<subtitle>
${subtitleText}
</subtitle>

要求：
1. **核心观点**：讲者想要传达的最重要的思想是什么？
2. **关键论据**：讲者使用了哪些例子、数据或逻辑来支持其观点？
3. **独特见解**：视频中有哪些让人耳目一新或深思的看法？
4. **争议/反思**：(如果有) 视频中是否存在有争议的观点或值得进一步思考的问题？
5. **输出格式**：请直接输出 Markdown 格式的内容，条理清晰，不要包含任何开场白或结束语。
`;
    } else {
        // 默认为逐字稿 (article)
        systemPrompt = `你是一个专业的文字编辑。你的任务是将视频字幕转换为通顺、流畅的文章或逐字稿。`;
        userPrompt = `请将以下字幕文本转换为一篇通顺的文章。
<subtitle_text>
${subtitleText}
</subtitle_text>
在转换时，请遵循以下规则：
1. **保持完整性**：不遗漏任何信息，不得改变顺序。
2. **优化表达**：修正口语中的语病、重复和不通顺之处，添加适当的标点符号，使文章读起来像一篇精心撰写的文稿。
3. **段落划分**：根据内容逻辑进行合理的段落划分。
4. **输出格式**：请在<文章>标签内输出转换后的内容。
`;
    }

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
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
    
    // 仅针对默认模式尝试提取标签，其他模式直接返回
    if (promptType === 'article') {
        const articleMatch = article.match(/<文章>([\s\S]*?)<\/文章>/);
        if (articleMatch) {
          article = articleMatch[1].trim();
        }
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
