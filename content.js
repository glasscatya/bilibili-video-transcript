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
  
  function openSubtitle() {
    var subtitleButton = document.querySelector('[aria-label="字幕"] [class="bpx-common-svg-icon"]');
    if (subtitleButton) {
      var subtitleState = document.querySelector('div[class="bpx-player-ctrl-subtitle-language-item bpx-state-active"]');
      if (subtitleState) {
        var subtitleName = subtitleState.innerText;
        var stateNum = Number(subtitleName.indexOf('自动'));
        if (stateNum !== -1) {
          if (document.querySelectorAll('svg[preserveAspectRatio="xMidYMid meet"] > defs > filter').length === 3) {
            subtitleButton.click();
            console.log('字幕已开启');
          }
        } else {
          console.log('字幕不为AI生成,跳过该视频');
        }
      } else {
        console.log('该视频无字幕');
      }
    }
  }
  
  function checkVideo() {
    if (document.querySelector('video[crossorigin="anonymous"]').readyState === 4) {
      console.log('视频加载完毕');
      var timeout = setTimeout(function() {
        console.log('字幕加载超时,当前视频可能无字幕');
      }, 5000);
      var interval = setInterval(function() {
        openSubtitle();
        if (document.querySelectorAll('svg[preserveAspectRatio="xMidYMid meet"] > defs > filter').length === 3) {
          clearInterval(interval);
          clearTimeout(timeout);
        }
      }, 200);
    }
  }
  
  interceptSubtitleRequest();
  
  var run = setInterval(function() {
    checkVideo();
    if (document.querySelectorAll('svg[preserveAspectRatio="xMidYMid meet"] > defs > filter').length === 3) {
      clearInterval(run);
    }
  }, 200);
  
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
  
    // 创建按钮栏
    const buttonBar = document.createElement('div');
    buttonBar.style.marginBottom = '10px';
  
    // 创建全文复制按钮
    const copyButton = document.createElement('button');
    copyButton.textContent = '📋';
    copyButton.style.marginRight = '10px';
    copyButton.onclick = () => copySubtitlesToClipboard(subtitles, copyButton);
  
    buttonBar.appendChild(copyButton);
    subtitleContainer.appendChild(buttonBar);
  
    // 添加逐字稿内容
    subtitles.forEach(subtitle => {
      const p = document.createElement('p');
      p.textContent = subtitle.content;
      subtitleContainer.appendChild(p);
    });
  
    // 插入到弹幕列表上方
    danmukuBox.insertBefore(subtitleContainer, danmukuBox.firstChild);
  }
  
  function copySubtitlesToClipboard(subtitles, button) {
    const textToCopy = subtitles.map(subtitle => subtitle.content).join('\n');
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = textToCopy;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);
  
    // 更改按钮文本为勾的emoji
    button.textContent = '✔️';
  
    // 恢复按钮文本
    setTimeout(() => {
      button.textContent = '📋';
    }, 2000);
  }