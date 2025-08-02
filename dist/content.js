function getBVID() {
  // 处理watchlater列表页面
  if (window.location.pathname === '/list/watchlater') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('bvid');
  }
  // 处理常规视频页面
  return window.location.pathname.split('/video/')[1]?.replace('/', '');
}

// 在初始化函数中调用 checkVideoAndSubtitle
function initialize() {
  console.log("初始化B站字幕助手");
  const currentBVID = getBVID();
  if (!currentBVID) {
    console.log('未找到有效的视频BVID');
    return;
  }
  subtitleCheckAttempts = 0;
  checkVideoAndSubtitle();
}


// 拦截字幕请求
function interceptSubtitleRequest() {
  var originalFetch = window.fetch;
  window.fetch = function(url, init) {
    return originalFetch(url, init).then(function(response) {
      if (response.url.includes('aisubtitle.hdslb.com')) {
        response.clone().text().then(function(body) {
          console.log('获取到AI字幕数据:', body);
        });
      }
      return response;
    });
  };
}

interceptSubtitleRequest();

// 清除字幕容器
function clearSubtitleContainer() {
  console.log("清除字幕容器");
  const danmukuBox = document.getElementById('danmukuBox');
  if (danmukuBox) {
    const subtitleContainer = danmukuBox.querySelector('.subtitleContainer');
    const footerBar = danmukuBox.querySelector('.footerBar');
    const buttonBar = danmukuBox.querySelector('.buttonBar');
    if (subtitleContainer) {
      danmukuBox.removeChild(subtitleContainer);
    }
    if (footerBar) {
      danmukuBox.removeChild(footerBar);
    }
    if (buttonBar) {
      danmukuBox.removeChild(buttonBar);
    }
  }
}

// 自动开启 AI 字幕
function openSubtitle() {
  console.log("尝试开启AI字幕");
  var subtitleButton = document.querySelector('[aria-label="字幕"] [class="bpx-common-svg-icon"]');
  if (subtitleButton) {
    var subtitleState = document.querySelector('div[class="bpx-player-ctrl-subtitle-language-item bpx-state-active"]');
    if (subtitleState) {
      var subtitleName = subtitleState.innerText;
      var stateNum = subtitleName.indexOf('自动');
      if (stateNum !== -1) {
        subtitleButton.click();
        console.log('AI字幕已开启');
        // 开启字幕后，再次点击关闭字幕
        setTimeout(() => {
          subtitleButton.click();
          console.log('AI字幕已关闭');
        }, 1800); // 延迟1.8秒后关闭字幕
      } else {
        console.log('字幕不为AI生成,跳过该视频');
      }
    } else {
      console.log('该视频无字幕');
    }
  } else {
    console.log('未找到字幕按钮，可能是视频没有字幕');
  }
}

let subtitleCheckAttempts = 0;
const MAX_ATTEMPTS = 3; // 最多尝试3次，每次间隔500ms，总共1.5秒
const ATTEMPT_INTERVAL = 500; // 每次尝试间隔500ms

function checkVideoAndSubtitle() {
  console.log("检查视频和字幕状态");
  var video = document.querySelector('video[crossorigin="anonymous"]');
  var subtitleButton = document.querySelector('[aria-label="字幕"] [class="bpx-common-svg-icon"]');
  
  if (video && video.readyState >= 2) {
    console.log('视频已加载');
    
    if (subtitleButton) {
      console.log('字幕按钮已加载');
      clearSubtitleContainer(); // 只有在确认有字幕按钮时才清除旧的字幕容器
      openSubtitle();
      subtitleCheckAttempts = 0; // 重置尝试次数
    } else {
      subtitleCheckAttempts++;
      if (subtitleCheckAttempts < MAX_ATTEMPTS) {
        console.log(`字幕按钮尚未加载，继续等待... (尝试 ${subtitleCheckAttempts}/${MAX_ATTEMPTS})`);
        setTimeout(checkVideoAndSubtitle, ATTEMPT_INTERVAL);
      } else {
        console.log('字幕检查超时，视频可能没有字幕');
        handleNoSubtitles();
      }
    }
  } else {
    console.log('视频尚未加载完毕，等待中...');
    setTimeout(checkVideoAndSubtitle, ATTEMPT_INTERVAL);
  }
}

function handleNoSubtitles() {
  // 处理没有字幕的情况
  console.log('确认视频没有字幕，执行相应逻辑');
  clearSubtitleContainer();
}

// 使用 MutationObserver 监听页面变化
function observePageChanges() {
  console.log("开始监听页面变化");
  const observer = new MutationObserver((mutations) => {
    const currentBVID = getBVID();
    if (document.querySelector('video[crossorigin="anonymous"]') && currentBVID) {
      console.log("检测到视频元素");
      observer.disconnect();
      checkVideoAndSubtitle();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 初始化函数
function initialize() {
  console.log("初始化B站字幕助手");
  observePageChanges();
}

// 监听页面加载完成事件
window.addEventListener('load', initialize);

// 监听页面 URL 变化
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('页面 URL 发生变化，重新初始化');
    initialize();
  }
}).observe(document, { subtree: true, childList: true });

// 监听来自 background.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showSubtitles") {
    displaySubtitles(request.data);
  }
});

// 显示字幕的函数
function displaySubtitles(subtitles) {
  const danmukuBox = document.getElementById('danmukuBox');
  if (!danmukuBox) return;

  // 防止冲突，移除现有的逐字稿容器和底部栏
  clearSubtitleContainer();

  // 创建逐字稿容器
  const subtitleContainer = document.createElement('div');
  subtitleContainer.className = 'subtitleContainer';
  subtitleContainer.style.backgroundColor = 'white';
  subtitleContainer.style.padding = '14px';
  subtitleContainer.style.border = '1px solid black';
  subtitleContainer.style.maxHeight = '300px';
  subtitleContainer.style.overflowY = 'auto';
  subtitleContainer.style.position = 'relative';
  subtitleContainer.style.fontSize = '14px'; // 设置逐字稿文字大小为14px
  subtitleContainer.style.transition = 'max-height 0.3s ease-out';

  // 创建按钮栏
  const buttonBar = document.createElement('div');
  buttonBar.className = 'buttonBar';
  buttonBar.style.marginBottom = '-1px';
  buttonBar.style.position = 'sticky';
  buttonBar.style.top = '0';
  buttonBar.style.background = 'white';
  buttonBar.style.zIndex = '1';
  buttonBar.style.display = 'flex';
  buttonBar.style.alignItems = 'center';
  buttonBar.style.padding = '10px'; // 添加内边距
  buttonBar.style.border = '1px solid black'; // 添加边框

  // 创建显示/隐藏时间戳按钮
  const toggleTimestampButton = document.createElement('button');
  toggleTimestampButton.textContent = '⏱️ 显示/隐藏时间戳';
  toggleTimestampButton.style.marginRight = '12px';
  toggleTimestampButton.style.fontSize = '12px'; // 设置按钮文字大小为12px
  toggleTimestampButton.onclick = () => toggleTimestamp(subtitleContainer, toggleTimestampButton);

  // 创建复制按钮
  const copyButton = document.createElement('button');
  copyButton.textContent = '📋 复制';
  copyButton.style.marginRight = '12px';
  copyButton.style.fontSize = '12px'; // 设置按钮文字大小为12px
  copyButton.onclick = () => copySubtitlesToClipboard(subtitles, copyButton, showTimestamp);

  // 创建转换为文章按钮
  const convertToArticleButton = document.createElement('button');
  convertToArticleButton.textContent = '📝 转文章';
  convertToArticleButton.style.marginRight = '12px';
  convertToArticleButton.style.fontSize = '12px'; // 设置按钮文字大小为12px
  
  // 检查是否已有转换好的文章
  const bvid = getBVID();
  if (bvid) {
    chrome.storage.local.get([`article_${bvid}`], (result) => {
      if (result[`article_${bvid}`]) {
        convertToArticleButton.textContent = '📄 查看文章';
      }
    });
  }
  
  convertToArticleButton.onclick = () => convertToArticle(subtitles, convertToArticleButton);

  // 创建定位到当前视频字幕的位置按钮
  const focusButton = document.createElement('button');
  focusButton.textContent = '🎯';
  focusButton.style.marginRight = '12px';
  focusButton.style.fontSize = '12px'; // 设置按钮文字大小为12px
  focusButton.onclick = () => focusCurrentSubtitle(subtitles, subtitleContainer);

  // 创建折叠按钮
  const toggleFoldButton = document.createElement('button');
  toggleFoldButton.textContent = '🔽'; // 使用emoji作为按钮
  toggleFoldButton.style.marginLeft = 'auto'; // 将按钮移到最右侧
  toggleFoldButton.style.fontSize = '16px'; // 设置按钮文字大小
  toggleFoldButton.style.background = 'none';
  toggleFoldButton.style.border = 'none';
  toggleFoldButton.style.cursor = 'pointer';
  toggleFoldButton.onclick = () => toggleFold(subtitleContainer, toggleFoldButton);

  buttonBar.appendChild(toggleTimestampButton);
  buttonBar.appendChild(copyButton);
  buttonBar.appendChild(convertToArticleButton);
  buttonBar.appendChild(focusButton);
  buttonBar.appendChild(toggleFoldButton);

  let showTimestamp = true;

  // 添加逐字稿内容
  subtitles.forEach(subtitle => {
    const time = formatTime(subtitle.from);
    const timeElement = document.createElement('span');
    timeElement.textContent = time;
    timeElement.style.color = '#00b8f6';
    timeElement.style.marginRight = '14px';
    timeElement.style.cursor = 'pointer';
    timeElement.style.fontSize = '14px'; // 设置时间戳文字大小为14px
    timeElement.onclick = () => jumpToTime(subtitle.from);

    const p = document.createElement('p');
    p.appendChild(timeElement);
    p.appendChild(document.createTextNode(subtitle.content));
    subtitleContainer.appendChild(p);
  });

  // 创建底部栏
  const footerBar = document.createElement('div');
  footerBar.className = 'footerBar';
  footerBar.style.padding = '10px';
  footerBar.style.backgroundColor = 'white';
  footerBar.style.border = '1px solid black';
  footerBar.style.display = 'flex';
  footerBar.style.justifyContent = 'center';
  footerBar.style.alignItems = 'center';
  footerBar.style.marginTop = '-1px'; // 调整底部栏与内容容器的距离

  // 创建作者信息和链接
  const authorInfo = document.createElement('div');
  authorInfo.innerHTML = `Made with ❤️ by <a href="https://github.com/glasscatya/bilibili-video-transcript" target="_blank" style="color: #0366d6; text-decoration: none;">glasscat</a>, contact me: <a href="https://space.bilibili.com/93398070" target="_blank" style="color: #00a1d6; text-decoration: none;">bilibili</a>`;
  authorInfo.style.fontSize = '10px';

  footerBar.appendChild(authorInfo);

  // 插入到弹幕列表上方
  danmukuBox.insertBefore(buttonBar, danmukuBox.firstChild);
  danmukuBox.insertBefore(subtitleContainer, buttonBar.nextSibling);
  danmukuBox.insertBefore(footerBar, subtitleContainer.nextSibling);

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

  function focusCurrentSubtitle(subtitles, subtitleContainer) {
    const video = document.querySelector('video');
    if (!video) return;

    const currentTime = video.currentTime;
    if (!subtitleContainer) return;

    let closestSubtitle = null;
    let closestTimeDiff = Infinity;

    subtitles.forEach(subtitle => {
      const timeDiff = Math.abs(subtitle.from - currentTime);
      if (timeDiff < closestTimeDiff) {
        closestTimeDiff = timeDiff;
        closestSubtitle = subtitle;
      }
    });

    if (closestSubtitle) {
      const subtitleElements = subtitleContainer.querySelectorAll('p');
      subtitleElements.forEach((element, index) => {
        const timeElement = element.querySelector('span');
        if (timeElement && timeElement.textContent === formatTime(closestSubtitle.from)) {
          const offsetTop = element.offsetTop;
          subtitleContainer.scrollTo({ top: offsetTop - (subtitleContainer.clientHeight / 2), behavior: 'smooth' });
          element.style.backgroundColor = '#ffffcc'; // 视觉变化
          setTimeout(() => {
            element.style.backgroundColor = ''; // 恢复原样
          }, 2000);
        }
      });
    }
  }

  function toggleFold(container, button) {
    if (container.style.maxHeight === '0px') {
      container.style.maxHeight = '300px';
      button.textContent = '🔽';
    } else {
      container.style.maxHeight = '0px';
      button.textContent = '🔼';
    }
  }

  // 转换为文章的函数
  function convertToArticle(subtitles, button) {
    // 获取当前视频的BVID
    const bvid = getBVID();
    if (!bvid) {
      alert('无法获取视频ID，请刷新页面重试');
      return;
    }
    
    // 检查是否已经有转换好的文章
    chrome.storage.local.get([`article_${bvid}`], (result) => {
      if (result[`article_${bvid}`]) {
        // 如果已有文章，直接显示
        showArticleResult(result[`article_${bvid}`], button);
        return;
      }
      
      // 如果没有文章，开始转换
      const subtitleText = subtitles.map(subtitle => subtitle.content).join('\n');
      
      // 显示加载状态
      button.textContent = '⏳ 转换中...';
      button.disabled = true;
      
      // 发送消息给background script处理转换
      chrome.runtime.sendMessage({
        action: "convertToArticle",
        subtitleText: subtitleText,
        bvid: bvid
      }, (response) => {
        if (response && response.success) {
          // 保存文章到本地存储
          chrome.storage.local.set({ [`article_${bvid}`]: response.article }, () => {
            // 创建文章显示区域
            showArticleResult(response.article, button);
          });
        } else {
          // 显示错误信息
          button.textContent = '❌ 转换失败';
          setTimeout(() => {
            button.textContent = '📝 转文章';
            button.disabled = false;
          }, 2000);
          alert('转换失败：' + (response?.error || '未知错误'));
        }
      });
    });
  }

  // 显示文章结果的函数
  function showArticleResult(article, button) {
    // 更新按钮状态和文本
    button.textContent = '📄 查看文章';
    button.disabled = false;
    
    // 创建文章显示模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 80%;
      max-height: 80%;
      overflow-y: auto;
      position: relative;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
    `;
    closeButton.onclick = () => document.body.removeChild(modal);
    
    const copyArticleButton = document.createElement('button');
    copyArticleButton.textContent = '📋 复制文章';
    copyArticleButton.style.cssText = `
      margin-bottom: 15px;
      padding: 8px 16px;
      background-color: #00a1d6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    copyArticleButton.onclick = () => {
      const tempTextArea = document.createElement('textarea');
      tempTextArea.value = article;
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand('copy');
      document.body.removeChild(tempTextArea);
      copyArticleButton.textContent = '✔️ 复制成功';
      setTimeout(() => {
        copyArticleButton.textContent = '📋 复制文章';
      }, 2000);
    };
    
    const articleContent = document.createElement('div');
    articleContent.style.cssText = `
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 14px;
      margin-top: 10px;
    `;
    articleContent.textContent = article;
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(copyArticleButton);
    modalContent.appendChild(articleContent);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
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