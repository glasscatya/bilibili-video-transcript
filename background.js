console.log("Service Worker 已启动");

self.addEventListener('install', (event) => {
  console.log('Service Worker 安装完成');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker 已激活');
});

// 用于存储已处理的请求 URL
const processedUrls = new Set();

chrome.webRequest.onCompleted.addListener(
  (details) => {
    // 检查请求的 URL 是否符合条件
    if (details.url.startsWith("https://aisubtitle.hdslb.com/bfs/ai_subtitle/prod/")) {
      // 检查该 URL 是否已经处理过
      if (!processedUrls.has(details.url)) {
        console.log("捕获到AI字幕响应:");
        console.log("URL:", details.url);
        
        // 将 URL 添加到已处理的集合中
        processedUrls.add(details.url);

        fetch(details.url)
          .then(response => response.json())
          .then(data => {
            console.log("响应内容:", data);
            // 发送消息到内容脚本
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
              chrome.tabs.sendMessage(tabs[0].id, {action: "showSubtitles", data: data.body});
            });
          })
          .catch(error => console.error('获取响应内容时出错:', error));
      } else {
        console.log("该 URL 已经处理过，跳过:", details.url);
      }
    }
  },
  {urls: ["<all_urls>"]}
);