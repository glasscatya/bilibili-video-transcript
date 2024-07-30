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
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.backgroundColor = 'white';
    container.style.padding = '10px';
    container.style.border = '1px solid black';
    container.style.zIndex = '1000';
    container.style.maxHeight = '90vh';
    container.style.overflowY = 'auto';
  
    subtitles.forEach(subtitle => {
      const p = document.createElement('p');
      p.textContent = subtitle.content;
      container.appendChild(p);
    });
  
    document.body.appendChild(container);
  }