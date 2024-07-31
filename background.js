console.log("Service Worker 已启动");

self.addEventListener('install', (event) => {
  console.log('Service Worker 安装完成');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker 已激活');
});

// 用于存储已处理的请求 URL
const processedUrls = new Set();

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
