// 拦截字幕请求
function interceptSubtitleRequest() {
    var originalFetch = window.fetch;
    window.fetch = function(url, init) {
      return originalFetch(url, init).then(function(response) {
        if (response.url.includes('aisubtitle.hdslb.com')) {
          response.clone().text().then(function(body) {
            console.log('字幕响应:', body);
          });
        }
        return response;
      });
    };
  }
  
  interceptSubtitleRequest();
  
  // 监听来自 background.js 的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showSubtitles") {
      displaySubtitles(request.data);
    }
  });
  
  function displaySubtitles(subtitles) {
    const danmukuBox = document.getElementById('danmukuBox');
    if (!danmukuBox) return;
  
    // 创建逐字稿容器
    const subtitleContainer = document.createElement('div');
    subtitleContainer.style.backgroundColor = 'white';
    subtitleContainer.style.padding = '10px';
    subtitleContainer.style.border = '1px solid black';
    subtitleContainer.style.marginBottom = '10px';
    subtitleContainer.style.maxHeight = '300px';
    subtitleContainer.style.overflowY = 'auto';
    subtitleContainer.style.position = 'relative';
  
    // 创建按钮栏
    const buttonBar = document.createElement('div');
    buttonBar.style.marginBottom = '10px';
    buttonBar.style.position = 'sticky';
    buttonBar.style.top = '0';
    buttonBar.style.background = 'white';
    buttonBar.style.zIndex = '1';
  
    // 创建显示/隐藏时间戳按钮
    const toggleTimestampButton = document.createElement('button');
    toggleTimestampButton.textContent = '⏱️ 显示/隐藏时间戳';
    toggleTimestampButton.style.marginRight = '10px';
    toggleTimestampButton.onclick = () => toggleTimestamp(subtitleContainer, toggleTimestampButton);
  
    // 创建复制按钮
    const copyButton = document.createElement('button');
    copyButton.textContent = '📋 复制';
    copyButton.style.marginRight = '10px';
    copyButton.onclick = () => copySubtitlesToClipboard(subtitles, copyButton, showTimestamp);
  
    buttonBar.appendChild(toggleTimestampButton);
    buttonBar.appendChild(copyButton);
    subtitleContainer.appendChild(buttonBar);
  
    let showTimestamp = true;
  
    // 添加逐字稿内容
    subtitles.forEach(subtitle => {
      const time = formatTime(subtitle.from);
      const timeElement = document.createElement('span');
      timeElement.textContent = time;
      timeElement.style.color = '#00b8f6';
      timeElement.style.marginRight = '10px';
      timeElement.style.cursor = 'pointer';
      timeElement.onclick = () => jumpToTime(subtitle.from);
  
      const p = document.createElement('p');
      p.appendChild(timeElement);
      p.appendChild(document.createTextNode(subtitle.content));
      subtitleContainer.appendChild(p);
    });
  
    // 插入到弹幕列表上方
    danmukuBox.insertBefore(subtitleContainer, danmukuBox.firstChild);
  
    function toggleTimestamp(subtitleContainer, toggleTimestampButton) {
      const timeElements = subtitleContainer.querySelectorAll('span');
      showTimestamp = !showTimestamp;
      timeElements.forEach(element => {
        element.style.display = showTimestamp ? 'inline-block' : 'none';
      });
      toggleTimestampButton.textContent = showTimestamp ? '⏱️ 隐藏时间戳' : '⏱️ 显示时间戳';
    }
  
    function copySubtitlesToClipboard(subtitles, button, showTimestamp) {
      const textToCopy = subtitles.map(subtitle => {
        if (showTimestamp) {
          return `${formatTime(subtitle.from)} ${subtitle.content}`;
        } else {
          return subtitle.content;
        }
      }).join('\n');
  
      const tempTextArea = document.createElement('textarea');
      tempTextArea.value = textToCopy;
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand('copy');
      document.body.removeChild(tempTextArea);
  
      // 更改按钮文本为勾的emoji
      button.textContent = '✔️ 复制成功';
  
      // 恢复按钮文本
      setTimeout(() => {
        button.textContent = '📋 复制';
      }, 2000);
    }
  }
  
  function formatTime(seconds) {
    const roundedSeconds = Math.round(seconds);
    const minutes = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  
  function jumpToTime(seconds) {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = seconds;
    }
  }
  