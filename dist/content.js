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
let apiTried = false; // 标记是否已尝试过 API 获取
const MAX_ATTEMPTS = 3; // 最多尝试3次，每次间隔500ms，总共1.5秒
const ATTEMPT_INTERVAL = 500; // 每次尝试间隔500ms

// 获取 CID (Content ID)
function getCID() {
  try {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].innerHTML.includes('window.__INITIAL_STATE__')) {
        const content = scripts[i].innerHTML;
        // 简单匹配 "cid":123456
        const match = content.match(/"cid":(\d+)/);
        if (match) return match[1];
      }
    }
  } catch (e) {
    console.error('获取 CID 失败:', e);
  }
  return null;
}

// 尝试通过 API 获取字幕
async function tryFetchSubtitleFromApi() {
  const bvid = getBVID();
  const cid = getCID();
  
  if (!bvid || !cid) {
    console.log('无法获取 BVID 或 CID，跳过 API 字幕获取');
    return false;
  }

  console.log(`尝试通过 API 获取字幕 (BVID: ${bvid}, CID: ${cid})...`);
  
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: "fetchBilibiliSubtitle",
      bvid: bvid,
      cid: cid
    }, (response) => {
      if (response && response.success && response.subtitles) {
        console.log('API 字幕获取成功');
        displaySubtitles(response.subtitles);
        resolve(true);
      } else {
        console.log('API 字幕获取失败或无字幕:', response?.error);
        resolve(false);
      }
    });
  });
}

async function checkVideoAndSubtitle() {
  console.log("检查视频和字幕状态");
  var video = document.querySelector('video[crossorigin="anonymous"]');
  var danmukuBox = document.getElementById('danmukuBox');
  var subtitleButton = document.querySelector('[aria-label="字幕"] [class="bpx-common-svg-icon"]');
  
  if (video && video.readyState >= 2 && danmukuBox) {
    console.log('视频及容器已加载');
    
    // 1. 优先尝试 API 获取 (仅尝试一次)
    if (!apiTried) {
        apiTried = true;
        const apiSuccess = await tryFetchSubtitleFromApi();
        if (apiSuccess) {
            console.log('通过 API 成功获取字幕，跳过模拟点击流程');
            return;
        }
    }
    
    // 2. API 失败，回退到模拟点击流程
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
    console.log('视频或容器尚未加载完毕，等待中...');
    setTimeout(checkVideoAndSubtitle, ATTEMPT_INTERVAL);
  }
}

function handleNoSubtitles() {
  // 处理没有字幕的情况
  console.log('确认视频没有字幕，显示手动AI识别面板');
  clearSubtitleContainer();
  renderManualPanel();
}

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

function renderManualPanel() {
  const danmukuBox = document.getElementById('danmukuBox');
  if (!danmukuBox) return;

  // 创建容器
  const subtitleContainer = document.createElement('div');
  subtitleContainer.className = 'subtitleContainer';
  subtitleContainer.style.backgroundColor = 'white';
  subtitleContainer.style.padding = '14px';
  subtitleContainer.style.border = '1px solid black';
  subtitleContainer.style.maxHeight = '300px';
  subtitleContainer.style.overflowY = 'auto';
  subtitleContainer.style.position = 'relative';
  subtitleContainer.style.fontSize = '14px';
  
  // 提示信息
  const tip = document.createElement('p');
  tip.innerHTML = '未检测到B站官方字幕。您可以尝试使用AI听写功能。<br><span style="color:orange;font-size:11px;">注意：请确保已配置OpenAI API Key。单次录音建议不超过10分钟(API限制)。</span>';
  tip.style.color = '#666';
  tip.style.marginBottom = '10px';
  tip.style.fontSize = '12px';
  
  // 录音按钮
  const recordButton = document.createElement('button');
  recordButton.textContent = '🎙️ 开始 AI 听写';
  recordButton.style.padding = '8px 16px';
  recordButton.style.backgroundColor = '#00a1d6';
  recordButton.style.color = 'white';
  recordButton.style.border = 'none';
  recordButton.style.borderRadius = '4px';
  recordButton.style.cursor = 'pointer';
  recordButton.style.width = '100%';
  
  recordButton.onclick = () => toggleRecording(recordButton, subtitleContainer);

  // 极速识别按钮
  const fastButton = document.createElement('button');
  fastButton.textContent = '🚀 极速识别 (无需播放)';
  fastButton.style.padding = '8px 16px';
  fastButton.style.backgroundColor = '#4caf50'; // Green
  fastButton.style.color = 'white';
  fastButton.style.border = 'none';
  fastButton.style.borderRadius = '4px';
  fastButton.style.cursor = 'pointer';
  fastButton.style.width = '100%';
  fastButton.style.marginTop = '10px';
  
  fastButton.onclick = () => startFastTranscribe(fastButton, subtitleContainer);

  subtitleContainer.appendChild(tip);
  subtitleContainer.appendChild(recordButton);
  subtitleContainer.appendChild(fastButton);

  // 插入到弹幕列表上方
  danmukuBox.insertBefore(subtitleContainer, danmukuBox.firstChild);
}

// 获取音频流地址
function getAudioUrl() {
  try {
    // 尝试从 script 标签中解析 __playinfo__
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].innerHTML.includes('window.__playinfo__')) {
        const content = scripts[i].innerHTML;
        const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
        const playinfo = JSON.parse(jsonStr);
        
        if (playinfo.data && playinfo.data.dash && playinfo.data.dash.audio) {
          // 优先寻找 id 最小的音频流 (通常 bitrate 最低，文件最小)
          // 30280: 192k, 30232: 132k, 30216: 64k
          const audios = playinfo.data.dash.audio;
          audios.sort((a, b) => a.id - b.id);
          return audios[0].baseUrl || audios[0].backupUrl[0];
        }
      }
    }
  } catch (e) {
    console.error('解析 playinfo 失败:', e);
  }
  return null;
}

async function startFastTranscribe(button, container) {
  const audioUrl = getAudioUrl();
  if (!audioUrl) {
    alert('无法获取音频流地址，请尝试刷新页面或使用录音模式。');
    return;
  }

  button.textContent = '⏳ 正在下载并识别...';
  button.disabled = true;

  chrome.runtime.sendMessage({
    action: "downloadAndTranscribe",
    audioUrl: audioUrl,
    bvid: getBVID()
  }, (response) => {
    button.disabled = false;
    button.textContent = '🚀 极速识别 (无需播放)';
    
    if (response && response.success) {
      // 显示识别结果 (复用现有逻辑)
      const resultContainer = document.createElement('div');
      resultContainer.style.marginTop = '10px';
      resultContainer.style.padding = '10px';
      resultContainer.style.backgroundColor = '#e8f5e9'; // Light Green
      resultContainer.style.borderRadius = '4px';
      
      const title = document.createElement('div');
      title.textContent = '极速识别结果:';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '5px';
      title.style.fontSize = '12px';
      
      const p = document.createElement('p');
      p.textContent = response.text;
      p.style.whiteSpace = 'pre-wrap';
      
      const copyBtn = document.createElement('button');
      copyBtn.textContent = '📋 复制结果';
      copyBtn.style.marginTop = '5px';
      copyBtn.style.fontSize = '12px';
      copyBtn.onclick = () => {
         navigator.clipboard.writeText(response.text);
         copyBtn.textContent = '✔️ 已复制';
         setTimeout(() => copyBtn.textContent = '📋 复制结果', 2000);
      };
      
      resultContainer.appendChild(title);
      resultContainer.appendChild(p);
      resultContainer.appendChild(copyBtn);
      
      container.appendChild(resultContainer);
    } else {
      alert('极速识别失败: ' + (response?.error || '未知错误'));
    }
  });
}

async function toggleRecording(button, container) {
  if (!isRecording) {
    // 开始录音
    try {
      const video = document.querySelector('video');
      if (!video) throw new Error('未找到视频元素');
      
      // 尝试捕获音频流
      // 注意：如果视频跨域且没有 CORS 头，这里会静音
      const stream = video.captureStream();
      const audioTrack = stream.getAudioTracks()[0];
      
      if (!audioTrack) {
        throw new Error('无法捕获音频轨道，可能是因为版权保护或跨域限制');
      }
      
      const mediaStream = new MediaStream([audioTrack]);
      // 使用较低的比特率 (48kbps) 以确保 40 分钟的视频文件大小在 Whisper API 限制 (25MB) 之内
      // 40 min * 60 sec * 48 kbps / 8 / 1024 = ~14 MB < 25 MB
      const options = {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 48000
      };
      
      // 检查浏览器是否支持特定的 mimeType
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
         console.warn(`${options.mimeType} 不被支持，尝试使用默认配置`);
         delete options.mimeType;
      }
      
      mediaRecorder = new MediaRecorder(mediaStream, options);
      
      recordedChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        button.textContent = '⏳ 正在识别中...';
        button.disabled = true;
        
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        
        // 转换为 Base64 发送给 Background
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          
          chrome.runtime.sendMessage({
            action: "transcribeAudio",
            audioData: base64data,
            bvid: getBVID()
          }, (response) => {
            button.disabled = false;
            button.textContent = '🎙️ 开始 AI 听写';
            
            if (response && response.success) {
              // 显示识别结果
              const resultContainer = document.createElement('div');
              resultContainer.style.marginTop = '10px';
              resultContainer.style.padding = '10px';
              resultContainer.style.backgroundColor = '#f0f0f0';
              resultContainer.style.borderRadius = '4px';
              
              const p = document.createElement('p');
              p.textContent = response.text;
              p.style.whiteSpace = 'pre-wrap';
              
              const copyBtn = document.createElement('button');
              copyBtn.textContent = '📋 复制结果';
              copyBtn.style.marginTop = '5px';
              copyBtn.style.fontSize = '12px';
              copyBtn.onclick = () => {
                 navigator.clipboard.writeText(response.text);
                 copyBtn.textContent = '✔️ 已复制';
                 setTimeout(() => copyBtn.textContent = '📋 复制结果', 2000);
              };
              
              resultContainer.appendChild(p);
              resultContainer.appendChild(copyBtn);
              
              // 插入到按钮后面
              if (container.lastChild.tagName === 'DIV' && container.lastChild.className !== 'subtitleContainer') { // simple check
                 container.appendChild(resultContainer);
              } else {
                 container.appendChild(resultContainer);
              }
              
            } else {
              alert('识别失败: ' + (response?.error || '未知错误'));
            }
          });
        };
      };
      
      mediaRecorder.start();
      isRecording = true;
      button.textContent = '⏹️ 停止并识别';
      button.style.backgroundColor = '#ff4d4f';
      
      // 如果视频没播放，自动播放
      if (video.paused) {
        video.play();
      }
      
    } catch (e) {
      console.error(e);
      alert('无法启动录音: ' + e.message + '\n请确保您在扩展选项中配置了 OpenAI API Key。');
    }
  } else {
    // 停止录音
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    isRecording = false;
  }
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
  apiTried = false; // 重置 API 尝试状态
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

  // 创建转换为文章按钮 (AI 生成)
  const aiGenerateButton = document.createElement('button');
  aiGenerateButton.textContent = '✨ AI 生成';
  aiGenerateButton.style.marginRight = '12px';
  aiGenerateButton.style.fontSize = '12px'; 
  aiGenerateButton.style.position = 'relative'; // 为下拉菜单做准备
  
  // 创建下拉菜单容器
  const dropdownMenu = document.createElement('div');
  dropdownMenu.style.display = 'none';
  dropdownMenu.style.position = 'absolute';
  dropdownMenu.style.top = '100%';
  dropdownMenu.style.left = '0';
  dropdownMenu.style.backgroundColor = 'white';
  dropdownMenu.style.border = '1px solid #ccc';
  dropdownMenu.style.borderRadius = '4px';
  dropdownMenu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  dropdownMenu.style.zIndex = '1000';
  dropdownMenu.style.minWidth = '120px';
  dropdownMenu.style.marginTop = '5px';

  // 菜单项配置
  const menuItems = [
    { text: '📝 逐字稿', type: 'article' },
    { text: '📋 视频纪要', type: 'summary' },
    { text: '💡 观点提取', type: 'insight' }
  ];

  menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.textContent = item.text;
    menuItem.style.padding = '8px 12px';
    menuItem.style.cursor = 'pointer';
    menuItem.style.fontSize = '12px';
    menuItem.style.color = '#333';
    menuItem.style.transition = 'background-color 0.2s';
    
    menuItem.onmouseover = () => menuItem.style.backgroundColor = '#f5f5f5';
    menuItem.onmouseout = () => menuItem.style.backgroundColor = 'white';
    
    menuItem.onclick = (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = 'none';
        convertToArticle(subtitles, aiGenerateButton, item.type);
    };
    
    dropdownMenu.appendChild(menuItem);
  });

  aiGenerateButton.appendChild(dropdownMenu);
  
  // 点击按钮切换菜单显示
  aiGenerateButton.onclick = (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
  };
  
  // 点击外部关闭菜单
  document.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
  });

  // 检查是否已有转换好的内容 (默认检查 article)
  const bvid = getBVID();
  if (bvid) {
    chrome.storage.local.get([`article_${bvid}`], (result) => {
      if (result[`article_${bvid}`]) {
         // 如果有已生成的内容，稍微改变样式提示用户，但不改变按钮文字以保持通用性
         aiGenerateButton.style.border = '1px solid #4caf50';
      }
    });
  }

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
  buttonBar.appendChild(aiGenerateButton);
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

  // 转换字幕为文章/纪要/观点
  async function convertToArticle(subtitles, button, promptType = 'article') {
    // 检查是否已有转换好的内容
    const bvid = getBVID();
    const storageKey = `ai_result_${bvid}_${promptType}`;
    
    // 如果是默认的 article 类型，兼容旧的 key
    const legacyKey = `article_${bvid}`;
    
    chrome.storage.local.get([storageKey, legacyKey], (result) => {
      const cachedContent = result[storageKey] || (promptType === 'article' ? result[legacyKey] : null);
      
      if (cachedContent) {
        showArticleModal(cachedContent, promptType);
        return;
      }
      
      // 如果没有缓存，开始生成
      const subtitleText = subtitles.map(s => s.content).join('\n');
      
      const originalText = button.firstChild.textContent; // 保存原始按钮文本 (忽略 dropdown)
      button.firstChild.textContent = '⏳ 生成中...';
      button.disabled = true;

      chrome.runtime.sendMessage({
        action: "convertToArticle",
        subtitleText: subtitleText,
        bvid: bvid,
        promptType: promptType
      }, (response) => {
        button.disabled = false;
        button.firstChild.textContent = originalText;
        
        if (response && response.success) {
          // 保存结果
          const dataToSave = {};
          dataToSave[storageKey] = response.article;
          // 如果是 article 类型，同时也更新 legacy key 以保持兼容
          if (promptType === 'article') {
               dataToSave[legacyKey] = response.article;
          }
          chrome.storage.local.set(dataToSave);
          
          showArticleModal(response.article, promptType);
        } else {
          alert('生成失败: ' + (response?.error || '未知错误'));
        }
      });
    });
  }

  function showArticleModal(content, type) {
      let title = '逐字稿文章';
      if (type === 'summary') title = '视频纪要';
      if (type === 'insight') title = '观点提取';

      // 创建模态框
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '10000';
      
      const modalContent = document.createElement('div');
      modalContent.style.backgroundColor = 'white';
      modalContent.style.padding = '20px';
      modalContent.style.borderRadius = '8px';
      modalContent.style.width = '80%';
      modalContent.style.maxWidth = '800px';
      modalContent.style.maxHeight = '80%';
      modalContent.style.overflowY = 'auto';
      modalContent.style.position = 'relative';
      
      const closeBtn = document.createElement('span');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '10px';
      closeBtn.style.right = '20px';
      closeBtn.style.fontSize = '24px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.onclick = () => document.body.removeChild(modal);
      
      const header = document.createElement('h2');
      header.textContent = title;
      header.style.marginTop = '0';
      
      const contentDiv = document.createElement('div');
      contentDiv.style.whiteSpace = 'pre-wrap';
      contentDiv.style.lineHeight = '1.6';
      // 简单的 Markdown 渲染 (粗体和列表)
      let formattedContent = content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/^-\s/gm, '• ');
          
      contentDiv.innerHTML = formattedContent;
      
      const copyBtn = document.createElement('button');
      copyBtn.textContent = '📋 复制内容';
      copyBtn.style.marginTop = '20px';
      copyBtn.style.padding = '8px 16px';
      copyBtn.style.backgroundColor = '#00a1d6';
      copyBtn.style.color = 'white';
      copyBtn.style.border = 'none';
      copyBtn.style.borderRadius = '4px';
      copyBtn.style.cursor = 'pointer';
      copyBtn.onclick = () => {
          navigator.clipboard.writeText(content);
          copyBtn.textContent = '✔️ 已复制';
          setTimeout(() => copyBtn.textContent = '📋 复制内容', 2000);
      };
      
      modalContent.appendChild(closeBtn);
      modalContent.appendChild(header);
      modalContent.appendChild(contentDiv);
      modalContent.appendChild(copyBtn);
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