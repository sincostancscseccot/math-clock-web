/**
 * Math Clock - 数学极客表盘 v2.1
 * ============================================
 * v2 改动:
 *   - 修复公式定位 (CSS 坐标三角函数)
 *   - 信息面板移至表盘外侧，不再遮挡
 *   - 设置系统 (秒针模式/数字时钟/刻度线/自定义公式)
 *   - 番茄钟可自定义时长
 *   - 闹钟增加 ODE 难度 (多选题)
 * v2.1 改动:
 *   - 信息面板标题只显示纯数字 (不再显示 "= N")
 *   - 修正斐波那契科普文案 (去掉多余的 0)
 *   - 四套主题: 学术黑板 / 极简现代 / 深邃午夜 / 赛博朋克
 *   - 设置面板新增主题下拉菜单 + 自定义背景色选择器
 */

(function () {
  'use strict';

  // ========================================
  // 1. 公式数据源 (默认值，可被自定义覆盖)
  // ========================================
  var DEFAULT_FORMULAS = [
    { value: 1,  tex: '-e^{i\\pi}',                                  result: '= 1',  branch: '复分析',     trivia: '欧拉恒等式: e^{iπ}+1=0，被誉为"最美公式"，统一了五个基本常数。' },
    { value: 2,  tex: '\\csc(\\pi/6)',                               result: '= 2',  branch: '三角函数',   trivia: 'csc(π/6)=1/sin(30°)=2，余割是正弦的倒数。' },
    { value: 3,  tex: '\\log_2 8',                                   result: '= 3',  branch: '代数',       trivia: '2³=8，所以 log₂8=3。对数是指数的逆运算。' },
    { value: 4,  tex: '\\left. \\frac{d}{dx}(x^2) \\right|_{x=2}',  result: '= 4',  branch: '微分学',     trivia: 'x² 的导数是 2x，在 x=2 处取值为 4。描述瞬时变化率。' },
    { value: 5,  tex: '\\sqrt{3^2 + 4^2}',                          result: '= 5',  branch: '欧氏几何',   trivia: '勾股定理: 3²+4²=25, √25=5。毕达哥拉斯约公元前500年证明。' },
    { value: 6,  tex: '3!',                                          result: '= 6',  branch: '组合数学',   trivia: '3!=3×2×1=6。阶乘描述 n 个元素全排列的方式数。' },
    { value: 7,  tex: '\\lfloor e^2 \\rfloor',                       result: '= 7',  branch: '实分析',     trivia: 'e²≈7.389，⌊7.389⌋=7。向下取整返回不大于 x 的最大整数。' },
    { value: 8,  tex: 'F_6',                                         result: '= 8',  branch: '离散数学',   trivia: '斐波那契 F₆=8 (序列:1,1,2,3,5,8...)。黄金比例与之密切相关。' },
    { value: 9,  tex: '\\int_0^3 x^2 \\, dx',                       result: '= 9',  branch: '积分学',     trivia: '∫₀³x²dx=[x³/3]₀³=9。定积分求曲线下面积，微积分基本定理的应用。' },
    { value: 10, tex: '\\binom{5}{2}',                                result: '= 10', branch: '组合数学',   trivia: 'C(5,2)=5!/(2!·3!)=10。从5个元素中选2个的组合数。' },
    { value: 11, tex: '(1011)_2',                                    result: '= 11', branch: '计算机科学', trivia: '二进制 1011=8+2+1=11。二进制是计算机数据表示的基础。' },
    { value: 12, tex: '\\begin{vmatrix} 4 & 2 \\\\ 2 & 4 \\end{vmatrix}', result: '= 12', branch: '线性代数', trivia: 'det=4×4-2×2=12。行列式衡量线性变换对面积的缩放倍数。' }
  ];

  // ========================================
  // 2. DOM 引用
  // ========================================
  var clockFace   = document.getElementById('clock-face');
  var hourHand    = document.getElementById('hour-hand');
  var minuteHand  = document.getElementById('minute-hand');
  var secondHand  = document.getElementById('second-hand');
  var digitalClock = document.getElementById('digital-clock');

  // Info panel (替代表盘内 tooltip)
  var infoResult = document.getElementById('info-result');
  var infoBranch = document.getElementById('info-branch');
  var infoTrivia = document.getElementById('info-trivia');

  // 主题 & 设置
  var themeToggle   = document.getElementById('theme-toggle');
  var settingsBtn   = document.getElementById('settings-btn');
  var settingsModal = document.getElementById('settings-modal');
  var settingsClose = document.getElementById('settings-close');
  var themeSelect   = document.getElementById('theme-select');
  var customBgColor = document.getElementById('custom-bg-color');

  // 番茄钟
  var pomoWorkInput    = document.getElementById('pomo-work');
  var pomoBreakInput   = document.getElementById('pomo-break');
  var pomodoroDisplay  = document.getElementById('pomodoro-display');
  var pomodoroStart    = document.getElementById('pomodoro-start');
  var pomodoroReset    = document.getElementById('pomodoro-reset');
  var pomodoroStatus   = document.getElementById('pomodoro-status');

  // 闹钟
  var alarmTimeInput    = document.getElementById('alarm-time');
  var alarmSetBtn       = document.getElementById('alarm-set-btn');
  var alarmStatus       = document.getElementById('alarm-status');
  var alarmCancelBtn    = document.getElementById('alarm-cancel-btn');
  var alarmDifficulty   = document.getElementById('alarm-difficulty');
  var alarmModal        = document.getElementById('alarm-modal');
  var mathProblem       = document.getElementById('math-problem');
  var alarmOptions      = document.getElementById('alarm-options');
  var alarmTextInput    = document.getElementById('alarm-text-input');
  var alarmAnswerInput  = document.getElementById('alarm-answer-input');
  var alarmSubmit       = document.getElementById('alarm-submit');
  var modalFeedback     = document.getElementById('modal-feedback');

  // 侧边栏
  var sidebar       = document.getElementById('sidebar');
  var sidebarToggle = document.getElementById('sidebar-toggle');

  // 自定义公式列表容器
  var customFormulaList = document.getElementById('custom-formula-list');

  // ========================================
  // 3. 设置系统 (LocalStorage)
  // ========================================
  var SETTINGS_KEY = 'math-clock-settings-v2';

  var DEFAULT_SETTINGS = {
    theme: 'chalkboard',     // 'chalkboard' | 'minimal' | 'midnight' | 'cyberpunk'
    customBgColor: '',       // 自定义背景色覆盖 (空字符串 = 使用主题默认)
    secondHand: 'smooth',    // 'smooth' | 'tick'
    digitalClock: 'show',    // 'show' | 'hide'   (PC 上 CSS 控制是否显示)
    tickMarks: 'show',       // 'show' | 'hide'
    customFormulas: {}       // { "3": "\\log_2 8", ... } 用户自定义的 LaTeX
  };

  var settings = loadSettings();

  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        // 合并默认值，兼容新增字段
        for (var k in DEFAULT_SETTINGS) {
          if (!(k in parsed)) parsed[k] = DEFAULT_SETTINGS[k];
        }
        return parsed;
      }
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  /**
   * 将设置应用到 DOM
   */
  function applySettings() {
    // 秒针模式
    if (settings.secondHand === 'tick') {
      secondHand.classList.add('tick-mode');
    } else {
      secondHand.classList.remove('tick-mode');
    }

    // 数字时钟: 移动端由 body class 控制; PC 上 CSS 不显示
    // 在移动端 CSS 中 `.show-digital .digital-clock { display: block }`
    // PC 上始终 display:none (被 media query 覆盖前不受影响)
    if (settings.digitalClock === 'show') {
      document.body.classList.add('show-digital');
    } else {
      document.body.classList.remove('show-digital');
    }

    // 刻度线
    if (settings.tickMarks === 'show') {
      clockFace.classList.add('show-ticks');
    } else {
      clockFace.classList.remove('show-ticks');
    }

    // 同步设置面板按钮状态
    var btns = settingsModal.querySelectorAll('.setting-btn');
    btns.forEach(function (btn) {
      var key = btn.getAttribute('data-setting');
      var val = btn.getAttribute('data-value');
      btn.classList.toggle('active', settings[key] === val);
    });
  }

  // 设置按钮点击
  settingsBtn.addEventListener('click', function () {
    // 同步主题 UI
    themeSelect.value = settings.theme;
    customBgColor.value = settings.customBgColor || THEME_DEFAULT_BG[settings.theme] || '#2b4a3e';
    settingsModal.classList.remove('hidden');
    renderCustomFormulaInputs();
  });

  settingsClose.addEventListener('click', function () {
    settingsModal.classList.add('hidden');
  });

  // 点击遮罩关闭设置
  settingsModal.addEventListener('click', function (e) {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
  });

  // 设置面板内按钮委托
  settingsModal.addEventListener('click', function (e) {
    var btn = e.target.closest('.setting-btn');
    if (!btn) return;
    var key = btn.getAttribute('data-setting');
    var val = btn.getAttribute('data-value');
    if (key && val) {
      settings[key] = val;
      saveSettings();
      applySettings();
    }
  });

  // ========================================
  // 4. 自定义公式输入
  // ========================================
  function renderCustomFormulaInputs() {
    customFormulaList.innerHTML = '';
    for (var i = 1; i <= 12; i++) {
      var row = document.createElement('div');
      row.className = 'custom-formula-row';

      var label = document.createElement('label');
      label.textContent = i + ':';

      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = DEFAULT_FORMULAS[i - 1].tex;
      input.value = settings.customFormulas[i] || '';
      input.setAttribute('data-hour', i);

      input.addEventListener('change', function () {
        var h = this.getAttribute('data-hour');
        var val = this.value.trim();
        if (val) {
          settings.customFormulas[h] = val;
        } else {
          delete settings.customFormulas[h];
        }
        saveSettings();
        rebuildFormulas();
      });

      row.appendChild(label);
      row.appendChild(input);
      customFormulaList.appendChild(row);
    }
  }

  // ========================================
  // 5. 合并后的公式数组 (默认 + 自定义)
  // ========================================
  function getActiveFormulas() {
    return DEFAULT_FORMULAS.map(function (f) {
      var custom = settings.customFormulas[String(f.value)];
      if (custom) {
        return {
          value: f.value,
          tex: custom,
          result: f.result,
          branch: f.branch,
          trivia: f.trivia
        };
      }
      return f;
    });
  }

  // ========================================
  // 6. 主题系统 (4 套主题 + 自定义背景色)
  // ========================================
  var THEME_LIST = ['chalkboard', 'minimal', 'midnight', 'cyberpunk'];

  // 每个主题的默认背景色, 用于颜色选择器的回退值
  var THEME_DEFAULT_BG = {
    chalkboard: '#2b4a3e',
    minimal:    '#fafafa',
    midnight:   '#0d1b2a',
    cyberpunk:  '#0a0a0f'
  };

  /**
   * 应用主题到 DOM, 并同步 dropdown / color picker 状态
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    settings.theme = theme;
    // 同步 dropdown
    themeSelect.value = theme;
    // 同步颜色选择器: 如果有自定义背景色则用它, 否则用主题默认
    customBgColor.value = settings.customBgColor || THEME_DEFAULT_BG[theme] || '#2b4a3e';
    // 应用自定义背景色 (如果有)
    applyCustomBgColor();
    saveSettings();
  }

  /**
   * 将用户选择的自定义背景色注入到 body 上 (覆盖主题默认)
   */
  function applyCustomBgColor() {
    if (settings.customBgColor) {
      document.body.style.backgroundColor = settings.customBgColor;
    } else {
      document.body.style.backgroundColor = '';
    }
  }

  function initTheme() {
    var saved = settings.theme || 'chalkboard';
    applyTheme(saved);
  }

  // 顶部按钮: 循环切换四套主题
  themeToggle.addEventListener('click', function () {
    var current = settings.theme || 'chalkboard';
    var idx = THEME_LIST.indexOf(current);
    var next = THEME_LIST[(idx + 1) % THEME_LIST.length];
    applyTheme(next);
  });

  // 设置面板下拉菜单: 直接切换主题
  themeSelect.addEventListener('change', function () {
    applyTheme(this.value);
  });

  // 自定义背景色选择器
  customBgColor.addEventListener('input', function () {
    settings.customBgColor = this.value;
    applyCustomBgColor();
    saveSettings();
  });

  // 右键颜色选择器可清除自定义背景色 (恢复主题默认)
  customBgColor.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    settings.customBgColor = '';
    applyTheme(settings.theme);
  });

  // ========================================
  // 7. 公式刻度生成 & 定位
  // ========================================

  /**
   * 将表盘上的公式标记从 DOM 移除并重新创建
   */
  function rebuildFormulas() {
    // 移除旧的 formula-marker 元素
    var oldMarkers = clockFace.querySelectorAll('.formula-marker');
    oldMarkers.forEach(function (el) { el.remove(); });
    createFormulaMarkers();
  }

  function createFormulaMarkers() {
    var formulas = getActiveFormulas();

    formulas.forEach(function (formula) {
      var marker = document.createElement('div');
      marker.className = 'formula-marker';
      marker.setAttribute('data-value', formula.value);

      // 使用 KaTeX 渲染 (可能尚未加载)
      (function render() {
        if (typeof katex !== 'undefined') {
          katex.render(formula.tex, marker, { throwOnError: false, displayMode: false });
        } else {
          setTimeout(render, 100);
        }
      })();

      // ---- 定位逻辑 (修复版) ----
      // CSS 坐标系: x 向右, y 向下
      // 时钟角度 θ (从12点方向顺时针): θ = value × 30°
      //   12 → 360°(=0°), 1 → 30°, 3 → 90°, 6 → 180°, 9 → 270°
      // CSS 中心为 (50%, 50%), 使用三角函数:
      //   x = 50 + R × sin(θ)    (sin 使 3 点在右, 9 点在左)
      //   y = 50 - R × cos(θ)    (减号使 12 点在上, 6 点在下)
      var theta = formula.value * 30 * Math.PI / 180;
      var radius = 41; // 距中心的百分比
      var x = 50 + radius * Math.sin(theta);
      var y = 50 - radius * Math.cos(theta);

      marker.style.left = x + '%';
      marker.style.top  = y + '%';

      // Hover → 信息面板
      marker.addEventListener('mouseenter', function () {
        showInfo(formula);
        marker.classList.add('active');
      });
      marker.addEventListener('mouseleave', function () {
        hideInfo();
        marker.classList.remove('active');
      });

      // 触屏
      marker.addEventListener('touchstart', function (e) {
        e.preventDefault();
        showInfo(formula);
        marker.classList.add('active');
        setTimeout(function () { hideInfo(); marker.classList.remove('active'); }, 3000);
      });

      clockFace.appendChild(marker);
    });
  }

  // ========================================
  // 8. 信息面板 (表盘外侧, 不遮挡)
  // ========================================
  function showInfo(formula) {
    infoResult.textContent = formula.value;
    infoBranch.textContent = formula.branch;
    infoTrivia.textContent = formula.trivia;
  }

  function hideInfo() {
    infoResult.textContent = '悬停公式查看详情';
    infoBranch.textContent = '';
    infoTrivia.textContent = '';
  }

  // ========================================
  // 9. 时钟指针动画
  // ========================================
  var lastSecond = -1; // 用于滴答模式检测秒变化

  function updateClock() {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    var s = now.getSeconds();
    var ms = now.getMilliseconds();

    // 时针 & 分针 (始终平滑)
    var minAngle  = (m + s / 60) * 6;
    var hourAngle = ((h % 12) + m / 60) * 30;
    minuteHand.style.transform = 'rotate(' + minAngle + 'deg)';
    hourHand.style.transform   = 'rotate(' + hourAngle + 'deg)';

    // 秒针: 根据设置决定平滑或滴答
    if (settings.secondHand === 'tick') {
      // 滴答: 每秒跳一格, 使用 CSS transition 步进动画
      if (s !== lastSecond) {
        lastSecond = s;
        var tickAngle = s * 6;
        secondHand.style.transform = 'rotate(' + tickAngle + 'deg)';
      }
    } else {
      // 平滑: 包含毫秒
      var smoothAngle = (s + ms / 1000) * 6;
      secondHand.style.transform = 'rotate(' + smoothAngle + 'deg)';
    }

    // 数字时钟
    digitalClock.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);

    // 闹钟检测
    checkAlarm(h, m, s);

    requestAnimationFrame(updateClock);
  }

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  // ========================================
  // 10. 番茄钟 (可自定义时长)
  // ========================================
  var pomodoroRemaining = 25 * 60;
  var pomodoroInterval  = null;
  var pomodoroIsBreak   = false;
  var pomodoroRunning   = false;

  function getPomoWork() {
    var v = parseInt(pomoWorkInput.value);
    return (v >= 1 && v <= 120) ? v : 25;
  }

  function getPomoBreak() {
    var v = parseInt(pomoBreakInput.value);
    return (v >= 1 && v <= 60) ? v : 5;
  }

  function formatPomodoro(seconds) {
    var mm = Math.floor(seconds / 60);
    var ss = seconds % 60;
    return pad(mm) + ':' + pad(ss);
  }

  function updatePomodoroDisplay() {
    pomodoroDisplay.textContent = formatPomodoro(pomodoroRemaining);
    pomodoroStatus.textContent  = pomodoroIsBreak ? '休息时间' : '专注时间';
  }

  pomodoroStart.addEventListener('click', function () {
    if (pomodoroRunning) {
      clearInterval(pomodoroInterval);
      pomodoroRunning = false;
      pomodoroStart.textContent = '继续';
    } else {
      // 如果还未开始过 (remaining == 设定值), 用输入框的值
      if (!pomodoroIsBreak && pomodoroRemaining === getPomoWork() * 60) {
        pomodoroRemaining = getPomoWork() * 60;
      }
      pomodoroRunning = true;
      pomodoroStart.textContent = '暂停';

      // 禁用输入防止运行中修改
      pomoWorkInput.disabled = true;
      pomoBreakInput.disabled = true;

      pomodoroInterval = setInterval(function () {
        pomodoroRemaining--;
        if (pomodoroRemaining <= 0) {
          pomodoroIsBreak = !pomodoroIsBreak;
          pomodoroRemaining = pomodoroIsBreak ? getPomoBreak() * 60 : getPomoWork() * 60;
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('番茄钟', {
              body: pomodoroIsBreak ? '休息一下吧！' : '开始专注！'
            });
          }
        }
        updatePomodoroDisplay();
      }, 1000);
    }
  });

  pomodoroReset.addEventListener('click', function () {
    clearInterval(pomodoroInterval);
    pomodoroRunning  = false;
    pomodoroIsBreak  = false;
    pomodoroRemaining = getPomoWork() * 60;
    pomodoroStart.textContent = '开始';
    pomoWorkInput.disabled = false;
    pomoBreakInput.disabled = false;
    updatePomodoroDisplay();
  });

  // 输入框变化时实时更新显示 (仅在未运行时)
  pomoWorkInput.addEventListener('change', function () {
    if (!pomodoroRunning && !pomodoroIsBreak) {
      pomodoroRemaining = getPomoWork() * 60;
      updatePomodoroDisplay();
    }
  });

  // ========================================
  // 11. 硬核闹钟 (含 ODE 难度)
  // ========================================
  var alarmTarget  = null;
  var alarmFired   = false;
  var alarmAudioCtx = null;
  var currentAlarmAnswer = null;

  // ---------- 基础题库 (文本输入) ----------
  var EASY_PROBLEMS = [
    {
      question: '\\int 2x \\, dx = \\;?',
      check: function (ans) {
        var n = normalize(ans);
        return n === 'x2+c' || n === 'x²+c';
      },
      hint: 'x² + C'
    },
    {
      question: '\\frac{d}{dx}(x^3) = \\;?',
      check: function (ans) {
        var n = normalize(ans);
        return n === '3x2' || n === '3x²';
      },
      hint: '3x²'
    },
    {
      question: '\\int_0^2 3x^2 \\, dx = \\;?',
      check: function (ans) { return parseInt(ans) === 8; },
      hint: '8'
    },
    {
      question: '\\det\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} = \\;?',
      check: function (ans) { return parseInt(ans) === -2; },
      hint: '-2'
    },
    {
      question: '\\frac{d}{dx}(\\sin x) \\Big|_{x=0} = \\;?',
      check: function (ans) { return parseInt(ans) === 1; },
      hint: '1'
    },
    {
      question: '\\sum_{k=1}^{5} k = \\;?',
      check: function (ans) { return parseInt(ans) === 15; },
      hint: '15'
    },
    {
      question: '\\int e^x \\, dx = \\;?',
      check: function (ans) {
        var n = normalize(ans);
        return n === 'ex+c' || n === 'e^x+c';
      },
      hint: 'e^x + C'
    },
    {
      question: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = \\;?',
      check: function (ans) { return parseInt(ans) === 1; },
      hint: '1'
    },
    {
      question: '2^5 = \\;?',
      check: function (ans) { return parseInt(ans) === 32; },
      hint: '32'
    },
    {
      question: '\\sqrt{144} = \\;?',
      check: function (ans) { return parseInt(ans) === 12; },
      hint: '12'
    }
  ];

  // ---------- ODE 题库 (多选题) ----------
  var HARD_PROBLEMS = [
    {
      question: '求解微分方程 \\; \\frac{dy}{dx} = 2y \\; 的通解:',
      options: [
        { tex: 'y = Ce^{2x}',     correct: true  },
        { tex: 'y = Ce^{x/2}',    correct: false },
        { tex: 'y = Cx^2',        correct: false },
        { tex: 'y = C\\sin 2x',   correct: false }
      ]
    },
    {
      question: `求解微分方程 \\; y’ + y = 0 \\; 的通解:`,
      options: [
        { tex: 'y = C_1\\cos x + C_2\\sin x',  correct: true  },
        { tex: 'y = C_1 e^x + C_2 e^{-x}',     correct: false },
        { tex: 'y = C_1 x + C_2',              correct: false },
        { tex: 'y = Ce^{-x}',                   correct: false }
      ]
    },
    {
      question: '求解微分方程 \\; \\frac{dy}{dx} = \\frac{y}{x} \\; 的通解:',
      options: [
        { tex: 'y = Cx',          correct: true  },
        { tex: 'y = Ce^x',        correct: false },
        { tex: 'y = C/x',         correct: false },
        { tex: 'y = C\\ln x',     correct: false }
      ]
    },
    {
      question: `求解微分方程 \\; y'' - 3y' + 2y = 0 \\; 的通解:`,
      options: [
        { tex: 'y = C_1 e^x + C_2 e^{2x}',     correct: true  },
        { tex: 'y = C_1 e^{-x} + C_2 e^{-2x}', correct: false },
        { tex: 'y = e^{3x}(C_1 + C_2 x)',       correct: false },
        { tex: 'y = C_1\\cos x + C_2\\sin x',   correct: false }
      ]
    },
    {
      question: '求解微分方程 \\; \\frac{dy}{dx} + 2y = 4 \\; 的通解:',
      options: [
        { tex: 'y = 2 + Ce^{-2x}',       correct: true  },
        { tex: 'y = 4 + Ce^{-2x}',       correct: false },
        { tex: 'y = Ce^{2x} + 2',         correct: false },
        { tex: 'y = Ce^{-2x}',            correct: false }
      ]
    },
    {
      question: `求解微分方程 \\; y'' + 4y = 0 \\; 的通解:`,
      options: [
        { tex: 'y = C_1\\cos 2x + C_2\\sin 2x',  correct: true  },
        { tex: 'y = C_1\\cos x + C_2\\sin x',     correct: false },
        { tex: 'y = C_1 e^{2x} + C_2 e^{-2x}',   correct: false },
        { tex: 'y = (C_1 + C_2 x)e^{-2x}',        correct: false }
      ]
    },
    {
      question: `方程 \\; xy' + y = 0 \\; 恰好是以下哪种形式:`,
      options: [
        { tex: `\\frac{d}{dx}(xy') = 0`,  correct: true  },
        { tex: '可分离变量',               correct: false },
        { tex: '线性非齐次方程',            correct: false },
        { tex: '伯努利方程',               correct: false }
      ]
    },
    {
      question: '求解 \\; \\frac{dy}{dx} = -\\frac{x}{y} \\; 的通解:',
      options: [
        { tex: 'x^2 + y^2 = C',     correct: true  },
        { tex: 'y = Ce^{-x^2/2}',   correct: false },
        { tex: 'y = Cx',            correct: false },
        { tex: 'y = -x + C',        correct: false }
      ]
    }
  ];

  function normalize(s) {
    return s.toLowerCase().replace(/\s/g, '').replace(/\^/g, '').replace(/＊/g, '*');
  }

  function generateAlarmProblem() {
    var diff = alarmDifficulty.value;
    if (diff === 'hard') {
      var idx = Math.floor(Math.random() * HARD_PROBLEMS.length);
      return { type: 'choice', data: HARD_PROBLEMS[idx] };
    } else {
      var idx = Math.floor(Math.random() * EASY_PROBLEMS.length);
      return { type: 'text', data: EASY_PROBLEMS[idx] };
    }
  }

  // ---------- 蜂鸣声 ----------
  function startAlarmSound() {
    try {
      alarmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      function beep(freq, start, dur) {
        var osc  = alarmAudioCtx.createOscillator();
        var gain = alarmAudioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.value = 0.15;
        osc.connect(gain);
        gain.connect(alarmAudioCtx.destination);
        osc.start(start);
        osc.stop(start + dur);
      }
      var now = alarmAudioCtx.currentTime;
      for (var i = 0; i < 30; i++) {
        beep(880, now + i * 0.6, 0.2);
        beep(660, now + i * 0.6 + 0.25, 0.2);
      }
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  function stopAlarmSound() {
    if (alarmAudioCtx) { alarmAudioCtx.close(); alarmAudioCtx = null; }
  }

  // ---------- 显示闹钟模态框 ----------
  function showAlarmModal() {
    var prob = generateAlarmProblem();
    currentAlarmAnswer = prob;

    // 渲染题目
    alarmOptions.innerHTML = '';
    alarmTextInput.classList.add('hidden');
    alarmOptions.classList.add('hidden');

    if (typeof katex !== 'undefined') {
      katex.render(prob.data.question, mathProblem, { throwOnError: false, displayMode: true });
    } else {
      mathProblem.textContent = prob.data.question;
    }

    if (prob.type === 'choice') {
      // ODE 多选题
      alarmOptions.classList.remove('hidden');
      prob.data.options.forEach(function (opt, i) {
        var btn = document.createElement('button');
        btn.className = 'alarm-option-btn';
        if (typeof katex !== 'undefined') {
          katex.render(opt.tex, btn, { throwOnError: false, displayMode: false });
        } else {
          btn.textContent = opt.tex;
        }
        btn.addEventListener('click', function () {
          if (opt.correct) {
            stopAlarmSound();
            alarmModal.classList.add('hidden');
            resetAlarmState();
          } else {
            modalFeedback.textContent = '答案不对，再试试！';
            modalFeedback.classList.remove('hidden');
          }
        });
        alarmOptions.appendChild(btn);
      });
    } else {
      // 基础文本输入
      alarmTextInput.classList.remove('hidden');
      alarmAnswerInput.value = '';
      alarmAnswerInput.focus();
    }

    modalFeedback.classList.add('hidden');
    alarmModal.classList.remove('hidden');
    startAlarmSound();
  }

  function resetAlarmState() {
    alarmTarget = null;
    alarmFired  = false;
    alarmStatus.textContent = '未设定';
    alarmCancelBtn.classList.add('hidden');
  }

  function checkAlarm(h, m, s) {
    if (!alarmTarget || alarmFired) return;
    if (h === alarmTarget.h && m === alarmTarget.m && s >= alarmTarget.s) {
      alarmFired = true;
      showAlarmModal();
    }
  }

  // 设定闹钟
  alarmSetBtn.addEventListener('click', function () {
    var val = alarmTimeInput.value;
    if (!val) return;
    var parts = val.split(':');
    alarmTarget = { h: parseInt(parts[0]), m: parseInt(parts[1]), s: 0 };
    alarmFired = false;
    alarmStatus.textContent = '闹钟设定: ' + pad(alarmTarget.h) + ':' + pad(alarmTarget.m);
    alarmCancelBtn.classList.remove('hidden');
  });

  alarmCancelBtn.addEventListener('click', function () {
    resetAlarmState();
  });

  // 文本答案提交
  alarmSubmit.addEventListener('click', submitTextAnswer);
  alarmAnswerInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitTextAnswer();
  });

  function submitTextAnswer() {
    var ans = alarmAnswerInput.value.trim();
    if (!ans) return;
    if (currentAlarmAnswer.data.check(ans)) {
      stopAlarmSound();
      alarmModal.classList.add('hidden');
      resetAlarmState();
    } else {
      modalFeedback.textContent = '答案不对，再试试！提示: ' + currentAlarmAnswer.data.hint;
      modalFeedback.classList.remove('hidden');
      alarmAnswerInput.value = '';
      alarmAnswerInput.focus();
    }
  }

  // 点击遮罩不关闭闹钟模态框 (强制答题)
  alarmModal.addEventListener('click', function (e) {
    if (e.target === alarmModal) {
      // 晃动提示不可跳过
      alarmModal.querySelector('.modal-card').style.animation = 'shake 0.3s';
      setTimeout(function () {
        alarmModal.querySelector('.modal-card').style.animation = '';
      }, 300);
    }
  });

  // ========================================
  // 12. 移动端侧边栏切换
  // ========================================
  sidebarToggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
  });

  document.querySelector('.clock-section').addEventListener('click', function () {
    if (sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  });

  // ========================================
  // 13. 通知权限
  // ========================================
  if ('Notification' in window && Notification.permission === 'default') {
    document.addEventListener('click', function reqPerm() {
      Notification.requestPermission();
      document.removeEventListener('click', reqPerm);
    }, { once: true });
  }

  // ========================================
  // 14. 刻度线 (60 小刻度 + 12 大刻度)
  // ========================================
  function createTickMarks() {
    var container = document.createElement('div');
    container.className = 'tick-marks';
    for (var i = 0; i < 60; i++) {
      var tick = document.createElement('div');
      tick.className = 'tick-mark' + (i % 5 === 0 ? ' major' : '');
      // 旋转: i * 6° 从12点方向顺时针
      // transform-origin 设为圆心, 用 rotate 即可
      tick.style.transform = 'rotate(' + (i * 6) + 'deg)';
      tick.style.transformOrigin = '0 calc(var(--clock-size) / 2)';
      container.appendChild(tick);
    }
    clockFace.appendChild(container);
  }

  // ========================================
  // 15. shake 动画注入 (闹钟不可跳过)
  // ========================================
  var shakeStyle = document.createElement('style');
  shakeStyle.textContent = '@keyframes shake{0%,100%{transform:translate(-50%,-50%)}25%{transform:translate(calc(-50% - 8px),-50%)}75%{transform:translate(calc(-50% + 8px),-50%)}}';
  // 修正: modal-card 没有 translate(-50%), 改为普通抖动
  shakeStyle.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}';
  document.head.appendChild(shakeStyle);

  // ========================================
  // 初始化
  // ========================================
  initTheme();
  applySettings();
  createTickMarks();
  createFormulaMarkers();
  updatePomodoroDisplay();
  requestAnimationFrame(updateClock);

})();
