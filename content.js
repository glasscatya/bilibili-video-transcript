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

  // 防止冲突，移除现有的逐字稿容器和底部栏
  const existingContainer = danmukuBox.querySelector('.subtitleContainer');
  const existingFooter = danmukuBox.querySelector('.footerBar');
  if (existingContainer) {
    danmukuBox.removeChild(existingContainer);
  }
  if (existingFooter) {
    danmukuBox.removeChild(existingFooter);
  }

  // 创建逐字稿容器
  const subtitleContainer = document.createElement('div');
  subtitleContainer.className = 'subtitleContainer';
  subtitleContainer.style.backgroundColor = 'white';
  subtitleContainer.style.padding = '14px';
  subtitleContainer.style.border = '1px solid black';
  subtitleContainer.style.marginBottom = '14px';
  subtitleContainer.style.maxHeight = '300px';
  subtitleContainer.style.overflowY = 'auto';
  subtitleContainer.style.position = 'relative';
  subtitleContainer.style.fontSize = '14px'; // 设置逐字稿文字大小为14px

  // 创建按钮栏
  const buttonBar = document.createElement('div');
  buttonBar.style.marginBottom = '12px';
  buttonBar.style.position = 'sticky';
  buttonBar.style.top = '0';
  buttonBar.style.background = 'white';
  buttonBar.style.zIndex = '1';

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

  // 创建定位到当前视频字幕的位置按钮
  const focusButton = document.createElement('button');
  focusButton.textContent = '🎯';
  focusButton.style.marginRight = '12px';
  focusButton.style.fontSize = '12px'; // 设置按钮文字大小为12px
  focusButton.onclick = () => focusCurrentSubtitle(subtitles, subtitleContainer);

  buttonBar.appendChild(toggleTimestampButton);
  buttonBar.appendChild(copyButton);
  buttonBar.appendChild(focusButton);
  subtitleContainer.appendChild(buttonBar);

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
  footerBar.style.borderTop = '1px solid black';
  footerBar.style.display = 'flex';
  footerBar.style.justifyContent = 'space-between';
  footerBar.style.alignItems = 'center';

  // 创建作者信息
  const authorInfo = document.createElement('div');
  authorInfo.innerHTML = 'Made with ❤️ by <a href="https://github.com/glasscatya/bilibili-video-transcript" style="color: #0366d6; text-decoration: none;">glasscat</a>';
  authorInfo.style.fontSize = '14px';

  // 创建 Bilibili 链接
  const bilibiliLink = document.createElement('a');
  bilibiliLink.href = 'https://space.bilibili.com/93398070';
  bilibiliLink.textContent = 'Bilibili';
  bilibiliLink.style.color = '#00a1d6';
  bilibiliLink.style.textDecoration = 'none';
  bilibiliLink.style.fontSize = '14px';

  footerBar.appendChild(authorInfo);
  footerBar.appendChild(bilibiliLink);

  // 插入到弹幕列表上方
  danmukuBox.insertBefore(subtitleContainer, danmukuBox.firstChild);
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
