// 检查登录权限
if (!checkAuth('teacher')) {
  // checkAuth 内部会自动跳转
}

// 当前页码
let studentPage = 1;
let lessonPage = 1;

// 教学相关变量
let teachingWords = [];
let knowWords = [];
let unknownWords = [];
let currentStudentId = '';
let currentStudentName = '';
let currentGrade = 1;
let currentFilter = 'all';

// 默写相关变量
let dictationWords = [];
let dictationIndex = 0;
let dictationAnswers = [];
let dictationMode = 'en'; // 默认模式：en-默写英文, cn-默写中文, fill-字母填空
let dictationFillData = []; // 填空模式的题目数据
let dictationShowingFeedback = false; // 是否正在显示答题反馈
let dictationCurrentCorrect = false; // 当前题目是否正确

// 切换标签页
function switchTab(tabName) {
  document.querySelectorAll('.sidebar-menu li').forEach(item => item.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  
  if (tabName === 'dashboard') loadDashboard();
  else if (tabName === 'students') loadStudents();
  else if (tabName === 'teach') initTeach();
  else if (tabName === 'lessons') initLessons();
  else if (tabName === 'weak') initWeak();
  else if (tabName === 'dictation') initDictation();
  else if (tabName === 'statistics') initStatistics();
}

document.querySelectorAll('.sidebar-menu li[data-tab]').forEach(li => {
  li.addEventListener('click', function() {
    switchTab(this.dataset.tab);
  });
});

// 加载控制台数据
async function loadDashboard() {
  const res = await http.get('/teacher/dashboard');
  if (res.code === 200) {
    document.getElementById('studentCount').textContent = res.data.studentCount;
    document.getElementById('todayLessonCount').textContent = res.data.todayLessonCount;
    document.getElementById('avgMasterRate').textContent = res.data.avgMasterRate;
  }
}

// ========== 学生管理 ==========

async function loadStudents(page = 1) {
  studentPage = page;
  const keyword = document.getElementById('studentKeyword').value;
  
  const res = await http.get(`/teacher/students/list?page=${page}&size=10&keyword=${encodeURIComponent(keyword)}`);
  if (res.code === 200) {
    const { list, total } = res.data;
    let html = '';
    list.forEach((student, index) => {
      html += `
        <tr>
          <td>${(page - 1) * 10 + index + 1}</td>
          <td>${student.username}</td>
          <td>${student.name}</td>
          <td>${gradeMap[student.grade]}</td>
          <td>${formatDate(student.createTime)}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="editStudent('${student._id}', '${student.name}', ${student.grade})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student._id}')">删除</button>
          </td>
        </tr>
      `;
    });
    document.getElementById('studentList').innerHTML = html || '<tr><td colspan="6" style="text-align: center;">暂无数据</td></tr>';
    
    const totalPages = Math.ceil(total / 10);
    renderPagination(document.getElementById('studentPagination'), page, totalPages, loadStudents);
  }
}

function showAddStudentModal() {
  document.getElementById('studentModalTitle').textContent = '新增学生';
  document.getElementById('studentId').value = '';
  document.getElementById('studentUsername').value = '';
  document.getElementById('studentPassword').value = '';
  document.getElementById('studentName').value = '';
  document.getElementById('studentGrade').value = '1';
  document.getElementById('studentUsername').disabled = false;
  document.getElementById('studentPwdGroup').style.display = 'block';
  document.getElementById('studentPassword').required = true;
  document.getElementById('studentModal').classList.add('active');
}

function editStudent(id, name, grade) {
  document.getElementById('studentModalTitle').textContent = '编辑学生';
  document.getElementById('studentId').value = id;
  document.getElementById('studentUsername').value = '';
  document.getElementById('studentPassword').value = '';
  document.getElementById('studentName').value = name;
  document.getElementById('studentGrade').value = grade;
  document.getElementById('studentUsername').disabled = true;
  document.getElementById('studentPwdGroup').style.display = 'none';
  document.getElementById('studentPassword').required = false;
  document.getElementById('studentModal').classList.add('active');
}

document.getElementById('studentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('studentId').value;
  const data = {
    name: document.getElementById('studentName').value.trim(),
    grade: parseInt(document.getElementById('studentGrade').value)
  };
  
  let res;
  if (id) {
    data.id = id;
    res = await http.put('/teacher/students/edit', data);
  } else {
    data.username = document.getElementById('studentUsername').value.trim();
    data.password = document.getElementById('studentPassword').value;
    res = await http.post('/teacher/students/add', data);
  }
  
  if (res.code === 200) {
    showToast(res.msg);
    closeModal('studentModal');
    loadStudents(studentPage);
    loadStudentOptions();
  } else {
    showToast(res.msg, 'error');
  }
});

async function deleteStudent(id) {
  if (!confirm('确定要删除这个学生吗？删除后无法恢复！')) return;
  
  const res = await http.delete(`/teacher/students/del?id=${id}`);
  if (res.code === 200) {
    showToast('删除成功');
    loadStudents(studentPage);
    loadStudentOptions();
  } else {
    showToast(res.msg, 'error');
  }
}

// ========== 单词教学 - 新版本 ==========

async function loadStudentOptions() {
  const res = await http.get('/teacher/students/list?page=1&size=1000');
  if (res.code === 200) {
    const options = res.data.list.map(s => `<option value="${s._id}">${s.name} (${gradeMap[s.grade]})</option>`).join('');
    
    document.getElementById('teachStudentId').innerHTML = '<option value="">请选择学生</option>' + options;
    document.getElementById('lessonStudentId').innerHTML = '<option value="">请选择学生</option>' + options;
    document.getElementById('weakStudentId').innerHTML = '<option value="">请选择学生</option>' + options;
    document.getElementById('dictationStudentId').innerHTML = '<option value="">请选择学生</option>' + options;
    document.getElementById('statsStudentId').innerHTML = '<option value="">请选择学生</option>' + options;
  }
}

function initTeach() {
  loadStudentOptions();
  document.getElementById('teachConfig').style.display = 'block';
  document.getElementById('teachInterface').style.display = 'none';
  teachingWords = [];
  knowWords = [];
  unknownWords = [];
}

// 开始教学
async function startTeaching() {
  const studentId = document.getElementById('teachStudentId').value;
  const grade = parseInt(document.getElementById('teachGrade').value);
  const wordCount = document.getElementById('teachWordCount').value;
  const wordScope = document.getElementById('teachWordScope').value;
  
  if (!studentId) {
    showToast('请选择学生', 'error');
    return;
  }
  
  currentStudentId = studentId;
  currentGrade = grade;
  
  // 获取学生姓名
  const studentSelect = document.getElementById('teachStudentId');
  currentStudentName = studentSelect.options[studentSelect.selectedIndex].text.split('(')[0].trim();
  
  let words = [];
  
  // 根据单词范围获取单词
  if (wordScope === 'new') {
    // 仅获取生词（除已掌握外的单词）
    const res = await http.get(`/teacher/teach/newWords?studentId=${studentId}&grade=${grade}`);
    if (res.code === 200) {
      words = res.data;
      if (words.length === 0) {
        showToast('该学生已掌握所有单词，没有生词', 'error');
        return;
      }
    } else {
      showToast(res.msg, 'error');
      return;
    }
  } else {
    // 获取全部单词
    const res = await http.get(`/teacher/teach/words?grade=${grade}`);
    if (res.code === 200) {
      words = res.data;
    } else {
      showToast(res.msg, 'error');
      return;
    }
    
    // 根据数量筛选（随机）
    if (wordCount !== 'all') {
      const count = parseInt(wordCount);
      if (words.length > count) {
        // 随机打乱
        words = words.sort(() => Math.random() - 0.5);
        words = words.slice(0, count);
      }
    }
  }
  
  teachingWords = words;
  knowWords = [];
  unknownWords = [];
  currentFilter = 'all';
  
  // 显示教学界面
  document.getElementById('teachConfig').style.display = 'none';
  document.getElementById('teachInterface').style.display = 'block';
  
  // 更新标题
  const scopeText = wordScope === 'new' ? '（仅生词）' : '';
  document.getElementById('teachBookTitle').textContent = `📖 ${gradeMap[grade]}单词学习${scopeText}`;
  document.getElementById('teachStudentInfo').textContent = `学生：${currentStudentName} | 年级：${gradeMap[grade]}`;
  
  // 渲染单词列表
  renderWordList();
  updateStats();
}

// 渲染单词列表
function renderWordList() {
  const container = document.getElementById('wordGrid');
  let html = '';
  
  const filteredWords = teachingWords.filter(word => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'known') return knowWords.includes(word._id);
    if (currentFilter === 'unknown') return unknownWords.includes(word._id);
    return true;
  });
  
  filteredWords.forEach(word => {
    const isKnown = knowWords.includes(word._id);
    const isUnknown = unknownWords.includes(word._id);
    let statusClass = '';
    if (isKnown) statusClass = 'known';
    if (isUnknown) statusClass = 'unknown';
    
    // 音标显示
    const phoneticHtml = word.phonetic ? `<div class="phonetic">${word.phonetic}</div>` : '';
    
    html += `
      <div class="word-card-item ${statusClass}" data-id="${word._id}">
        <div class="word-info">
          <div class="word-en-row">
            <span class="en" onclick="playPronunciation('${word.en}')">${word.en}</span>
            <button class="speaker-btn" onclick="playPronunciation('${word.en}')" title="点击发音">🔊</button>
          </div>
          ${phoneticHtml}
          <div class="cn">${word.cn}</div>
        </div>
        <div class="word-status-btns">
          <button class="status-btn know-btn ${isKnown ? 'active' : ''}" onclick="markWordStatus('${word._id}', 'know', event)" title="标记为熟悉">✓</button>
          <button class="status-btn unknown-btn ${isUnknown ? 'active' : ''}" onclick="markWordStatus('${word._id}', 'unknown', event)" title="标记为不熟悉">✗</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html || '<div style="padding: 40px; text-align: center; color: #999;">暂无单词</div>';
}

// 标记单词状态
function markWordStatus(wordId, status, event) {
  if (event) event.stopPropagation();
  
  if (status === 'know') {
    // 从不熟悉移到熟悉
    if (unknownWords.includes(wordId)) {
      unknownWords = unknownWords.filter(id => id !== wordId);
    }
    if (!knowWords.includes(wordId)) {
      knowWords.push(wordId);
    }
  } else {
    // 从熟悉移到不熟悉
    if (knowWords.includes(wordId)) {
      knowWords = knowWords.filter(id => id !== wordId);
    }
    if (!unknownWords.includes(wordId)) {
      unknownWords.push(wordId);
    }
  }
  
  updateStats();
  renderWordList();
}

// 更新统计
function updateStats() {
  const total = teachingWords.length;
  const known = knowWords.length;
  const unknown = unknownWords.length;
  const progress = total > 0 ? Math.round(((known + unknown) / total) * 100) : 0;
  
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statKnown').textContent = known;
  document.getElementById('statUnknown').textContent = unknown;
  document.getElementById('statProgress').textContent = progress + '%';
  
  // 更新筛选按钮的数字
  document.getElementById('filterAllCount').textContent = total;
  document.getElementById('filterKnownCount').textContent = known;
  document.getElementById('filterUnknownCount').textContent = unknown;
}

// 筛选单词
function filterWords(filter) {
  currentFilter = filter;
  
  // 更新按钮状态
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('filter' + filter.charAt(0).toUpperCase() + filter.slice(1)).classList.add('active');
  
  renderWordList();
}

// 朗读所有不熟悉的单词
function playAllUnknown() {
  if (unknownWords.length === 0) {
    showToast('没有不熟悉的单词', 'error');
    return;
  }
  
  const words = teachingWords.filter(w => unknownWords.includes(w._id));
  let index = 0;
  
  function speakNext() {
    if (index >= words.length) return;
    playPronunciation(words[index].en);
    index++;
    setTimeout(speakNext, 1500);
  }
  
  speakNext();
  showToast(`开始朗读 ${words.length} 个不熟悉的单词`);
}

// 重置所有状态
function resetAllStatus() {
  if (!confirm('确定要重置所有单词的学习状态吗？')) return;
  
  knowWords = [];
  unknownWords = [];
  updateStats();
  renderWordList();
  showToast('已重置所有状态');
}

// 完成教学
async function finishTeaching() {
  if (knowWords.length === 0 && unknownWords.length === 0) {
    showToast('请至少标记一个单词的状态', 'error');
    return;
  }
  
  const res = await http.post('/teacher/teach/finish', {
    studentId: currentStudentId,
    grade: currentGrade,
    knowWords,
    unknownWords
  });
  
  if (res.code === 200) {
    const masterRate = res.data.masterRate;
    showToast(`教学完成！掌握率: ${masterRate}%`);
    backToConfig();
  } else {
    showToast(res.msg, 'error');
  }
}

// 返回配置界面
function backToConfig() {
  document.getElementById('teachConfig').style.display = 'block';
  document.getElementById('teachInterface').style.display = 'none';
}

// ========== 课时记录 ==========

function initLessons() {
  loadStudentOptions();
}

async function loadLessons(page = 1) {
  lessonPage = page;
  const studentId = document.getElementById('lessonStudentId').value;
  
  if (!studentId) {
    document.getElementById('lessonList').innerHTML = '<tr><td colspan="7" style="text-align: center;">请选择学生</td></tr>';
    return;
  }
  
  const res = await http.get(`/teacher/lessons/list?studentId=${studentId}&page=${page}&size=10`);
  if (res.code === 200) {
    const { list, total } = res.data;
    let html = '';
    list.forEach((lesson, index) => {
      html += `
        <tr>
          <td>${(page - 1) * 10 + index + 1}</td>
          <td>${gradeMap[lesson.grade]}</td>
          <td>${lesson.knowWords?.length || 0}</td>
          <td>${lesson.unknownWords?.length || 0}</td>
          <td>${lesson.masterRate}%</td>
          <td>${formatDate(lesson.studyTime)}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="showLessonDetail('${lesson._id}')">详情</button>
            <button class="btn btn-sm btn-primary" onclick="reteachLesson('${lesson._id}')">重教</button>
          </td>
        </tr>
      `;
    });
    document.getElementById('lessonList').innerHTML = html || '<tr><td colspan="7" style="text-align: center;">暂无数据</td></tr>';
    
    const totalPages = Math.ceil(total / 10);
    renderPagination(document.getElementById('lessonPagination'), page, totalPages, loadLessons);
  }
}

async function showLessonDetail(lessonId) {
  const res = await http.get(`/teacher/lessons/detail?id=${lessonId}`);
  if (res.code === 200) {
    const lesson = res.data;
    let html = `
      <div style="margin-bottom: 20px;">
        <p><strong>年级：</strong>${gradeMap[lesson.grade]}</p>
        <p><strong>掌握率：</strong>${lesson.masterRate}%</p>
        <p><strong>上课时间：</strong>${formatDate(lesson.studyTime)}</p>
      </div>
    `;
    
    if (lesson.knowWords && lesson.knowWords.length > 0) {
      html += `
        <h4 style="margin: 20px 0 10px; color: var(--primary-color);">已掌握单词 (${lesson.knowWords.length})</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
      `;
      lesson.knowWords.forEach(w => {
        html += `
          <div style="padding: 8px 15px; background: #d4edda; border-radius: 4px; cursor: pointer;" onclick="playPronunciation('${w.en}')">
            <strong>${w.en}</strong> ${w.cn}
          </div>
        `;
      });
      html += '</div>';
    }
    
    if (lesson.unknownWords && lesson.unknownWords.length > 0) {
      html += `
        <h4 style="margin: 20px 0 10px; color: #e74c3c;">未掌握单词 (${lesson.unknownWords.length})</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
      `;
      lesson.unknownWords.forEach(w => {
        html += `
          <div style="padding: 8px 15px; background: #f8d7da; border-radius: 4px; cursor: pointer;" onclick="playPronunciation('${w.en}')">
            <strong>${w.en}</strong> ${w.cn}
          </div>
        `;
      });
      html += '</div>';
    }
    
    document.getElementById('lessonDetailContent').innerHTML = html;
    document.getElementById('lessonDetailModal').classList.add('active');
  }
}

async function reteachLesson(lessonId) {
  if (!confirm('确定要重教这节课的未掌握单词吗？')) return;
  
  const res = await http.post('/teacher/lessons/reteach', { lessonId });
  if (res.code === 200) {
    showToast('已加入教学列表');
  } else {
    showToast(res.msg, 'error');
  }
}

// ========== 薄弱单词库 ==========

function initWeak() {
  loadStudentOptions();
}

async function loadWeakWords() {
  const studentId = document.getElementById('weakStudentId').value;
  const grade = document.getElementById('weakGrade').value;
  
  if (!studentId) {
    document.getElementById('weakWordList').innerHTML = '<tr><td colspan="5" style="text-align: center;">请选择学生</td></tr>';
    return;
  }
  
  const res = await http.get(`/teacher/weak/list?studentId=${studentId}&grade=${grade}`);
  if (res.code === 200) {
    let html = '';
    res.data.forEach((item, index) => {
      const word = item.wordId;
      if (word) {
        html += `
          <tr>
            <td>${index + 1}</td>
            <td>${word.en}</td>
            <td>${word.cn}</td>
            <td>${gradeMap[word.grade]}</td>
            <td>${formatDate(item.createTime)}</td>
          </tr>
        `;
      }
    });
    document.getElementById('weakWordList').innerHTML = html || '<tr><td colspan="5" style="text-align: center;">暂无数据</td></tr>';
  }
}

async function reteachWeakWords() {
  const studentId = document.getElementById('weakStudentId').value;
  const grade = document.getElementById('weakGrade').value;
  
  if (!studentId) {
    showToast('请选择学生', 'error');
    return;
  }
  
  const res = await http.post('/teacher/weak/reteach', { studentId, grade: grade || undefined });
  if (res.code === 200) {
    showToast('已开始重教');
  } else {
    showToast(res.msg, 'error');
  }
}

async function clearWeakWords() {
  const studentId = document.getElementById('weakStudentId').value;
  const grade = document.getElementById('weakGrade').value;
  
  if (!studentId) {
    showToast('请选择学生', 'error');
    return;
  }
  
  if (!confirm('确定要清空薄弱单词库吗？')) return;
  
  const res = await http.delete(`/teacher/weak/clear?studentId=${studentId}&grade=${grade}`);
  if (res.code === 200) {
    showToast('清空成功');
    loadWeakWords();
  } else {
    showToast(res.msg, 'error');
  }
}

// ========== 默写练习 ==========

async function initDictation() {
  await loadStudentOptions();
  
  const studentId = document.getElementById('dictationStudentId').value;
  if (studentId) {
    loadDictationHistory(studentId);
  }
  
  document.getElementById('dictationStudentId').addEventListener('change', function() {
    if (this.value) {
      loadDictationHistory(this.value);
    }
  });
}

async function loadDictationHistory(studentId) {
  const res = await http.get(`/teacher/dictation/list?studentId=${studentId}&page=1&size=5`);
  if (res.code === 200 && res.data.list.length > 0) {
    let html = '<table class="table"><thead><tr><th>时间</th><th>模式</th><th>年级</th><th>题数</th><th>得分</th></tr></thead><tbody>';
    res.data.list.forEach(d => {
      const modeLabels = {
        'en': '📝 英文',
        'cn': '🇨🇳 中文',
        'fill': '🔤 填空'
      };
      const modeText = modeLabels[d.mode] || '📝 英文';
      html += `<tr><td>${formatDate(d.dictationTime)}</td><td>${modeText}</td><td>${gradeMap[d.grade]}</td><td>${d.totalNum}</td><td>${d.score}</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('dictationHistory').innerHTML = html;
  } else {
    document.getElementById('dictationHistory').innerHTML = '<p style="color: #999; text-align: center;">暂无历史记录</p>';
  }
}

async function startDictation() {
  const studentId = document.getElementById('dictationStudentId').value;
  const grade = parseInt(document.getElementById('dictationGrade').value);
  const num = parseInt(document.getElementById('dictationNum').value);
  
  // 获取选择的默写模式
  const modeRadio = document.querySelector('input[name="dictationMode"]:checked');
  dictationMode = modeRadio ? modeRadio.value : 'en';
  
  if (!studentId) {
    showToast('请选择学生', 'error');
    return;
  }
  
  currentStudentId = studentId;
  currentGrade = grade;
  
  const res = await http.get(`/teacher/dictation/words?studentId=${studentId}&grade=${grade}&num=${num}`);
  if (res.code === 200) {
    dictationWords = res.data;
    dictationIndex = 0;
    dictationAnswers = [];
    dictationFillData = [];
    
    // 如果是填空模式，预生成填空数据
    if (dictationMode === 'fill') {
      dictationWords.forEach(word => {
        dictationFillData.push(generateFillBlank(word.en));
      });
    }
    
    document.getElementById('dictationConfig').style.display = 'none';
    document.getElementById('dictationContainer').style.display = 'block';
    document.getElementById('dictationResult').style.display = 'none';
    
    showDictationQuestion();
  } else {
    showToast(res.msg, 'error');
  }
}

// 生成填空题目：随机替换字母为下划线
function generateFillBlank(word) {
  const letters = word.split('');
  const len = letters.length;
  
  // 计算需要隐藏的字母数量（30%-50%的字母）
  const hideCount = Math.max(1, Math.floor(len * (0.3 + Math.random() * 0.2)));
  
  // 随机选择要隐藏的位置（优先隐藏元音和辅音）
  const positions = [];
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  
  // 先收集元音位置
  const vowelPositions = [];
  const consonantPositions = [];
  letters.forEach((letter, index) => {
    if (vowels.includes(letter.toLowerCase())) {
      vowelPositions.push(index);
    } else if (/[a-z]/i.test(letter)) {
      consonantPositions.push(index);
    }
  });
  
  // 随机打乱
  vowelPositions.sort(() => Math.random() - 0.5);
  consonantPositions.sort(() => Math.random() - 0.5);
  
  // 优先选择元音，然后选择辅音
  const allPositions = [...vowelPositions, ...consonantPositions];
  for (let i = 0; i < hideCount && i < allPositions.length; i++) {
    positions.push(allPositions[i]);
  }
  
  // 生成填空后的显示和答案
  const display = letters.map((letter, index) => 
    positions.includes(index) ? '_' : letter
  ).join('');
  
  const hiddenLetters = positions.map(index => letters[index]);
  
  return {
    display,
    hiddenLetters,
    positions,
    answer: hiddenLetters.join('')
  };
}

// 渲染填空字母格子
function renderFillWordBoxes(word, blankPositions) {
  const container = document.getElementById('dictationFillWord');
  container.innerHTML = '';
  
  const letters = word.split('');
  letters.forEach((letter, index) => {
    const box = document.createElement('div');
    box.className = 'fill-letter-box';
    box.id = `fill-box-${index}`;
    
    if (blankPositions.includes(index)) {
      box.classList.add('blank');
      box.textContent = '_';
    } else {
      box.classList.add('normal');
      box.textContent = letter;
    }
    
    container.appendChild(box);
  });
}

// 更新填空格子显示
function updateFillBoxes(inputValue) {
  if (dictationMode !== 'fill') return;
  
  const fillData = dictationFillData[dictationIndex];
  const positions = fillData.positions;
  const inputLetters = inputValue.split('');
  
  positions.forEach((pos, index) => {
    const box = document.getElementById(`fill-box-${pos}`);
    if (box) {
      if (inputLetters[index]) {
        box.textContent = inputLetters[index].toUpperCase();
        box.classList.add('filled');
      } else {
        box.textContent = '_';
        box.classList.remove('filled');
      }
    }
  });
}

function showDictationQuestion() {
  const currentWord = dictationWords[dictationIndex];
  
  // 更新题号
  document.getElementById('dictationCurrentNum').textContent = dictationIndex + 1;
  document.getElementById('dictationTotalNum').textContent = dictationWords.length;
  
  // 更新模式标签
  const modeLabels = {
    'en': '📝 默写英文',
    'cn': '🇨🇳 默写中文',
    'fill': '🔤 字母填空'
  };
  document.getElementById('dictationModeLabel').textContent = modeLabels[dictationMode];
  
  const questionArea = document.getElementById('dictationQuestionArea');
  const fillArea = document.getElementById('dictationFillArea');
  const input = document.getElementById('dictationInput');
  const feedback = document.getElementById('dictationFeedback');
  const submitBtn = document.getElementById('dictationSubmitBtn');
  
  // 隐藏反馈区域
  feedback.style.display = 'none';
  dictationShowingFeedback = false;
  submitBtn.textContent = '确定';
  input.disabled = false;
  
  // 根据模式显示不同的题目
  if (dictationMode === 'en') {
    // 默写英文模式：显示中文，输入英文
    questionArea.style.display = 'block';
    fillArea.style.display = 'none';
    document.getElementById('dictationQuestion').textContent = currentWord.cn;
    document.getElementById('dictationHint').textContent = '请输入对应的英文单词';
    input.placeholder = '请输入英文单词';
  } else if (dictationMode === 'cn') {
    // 默写中文模式：显示英文，输入中文
    questionArea.style.display = 'block';
    fillArea.style.display = 'none';
    document.getElementById('dictationQuestion').textContent = currentWord.en;
    document.getElementById('dictationHint').textContent = '请输入对应的中文意思';
    input.placeholder = '请输入中文意思';
  } else if (dictationMode === 'fill') {
    // 字母填空模式：显示带下划线的单词
    questionArea.style.display = 'block';
    fillArea.style.display = 'block';
    
    const fillData = dictationFillData[dictationIndex];
    document.getElementById('dictationQuestion').textContent = currentWord.cn;
    // 不显示完整单词，只有提交后才显示
    document.getElementById('dictationHint').textContent = '';
    
    // 动态生成字母格子
    renderFillWordBoxes(currentWord.en, fillData.positions);
    
    document.getElementById('dictationFillHint').textContent = `请按顺序填写 ${fillData.hiddenLetters.length} 个缺失的字母`;
    input.placeholder = `请输入缺失的字母（${fillData.hiddenLetters.length}个）`;
  }
  
  input.value = '';
  input.focus();
}

// 处理默写操作（提交答案或继续下一题）
function handleDictationAction() {
  if (dictationShowingFeedback) {
    // 当前正在显示反馈，点击确定继续下一题
    nextQuestion();
  } else {
    // 提交答案
    submitDictationAnswer();
  }
}

// 检查答案是否正确
function checkAnswer(answer, currentWord) {
  if (dictationMode === 'en') {
    // 默写英文模式：比较英文（大小写不敏感）
    return currentWord.en.toLowerCase() === answer.toLowerCase().trim();
  } else if (dictationMode === 'cn') {
    // 默写中文模式：比较中文
    return currentWord.cn.trim() === answer.trim();
  } else if (dictationMode === 'fill') {
    // 字母填空模式：比较填写的字母
    const correctFill = dictationFillData[dictationIndex].answer;
    return correctFill.toLowerCase() === answer.toLowerCase().trim();
  }
  return false;
}

function submitDictationAnswer() {
  const answer = document.getElementById('dictationInput').value.trim();
  
  if (!answer) {
    showToast('请输入答案', 'error');
    return;
  }
  
  const currentWord = dictationWords[dictationIndex];
  const isCorrect = checkAnswer(answer, currentWord);
  dictationCurrentCorrect = isCorrect;
  
  // 记录答案
  const answerData = {
    wordId: currentWord._id,
    answer,
    mode: dictationMode,
    isCorrect
  };
  
  // 填空模式额外存储正确答案
  if (dictationMode === 'fill') {
    answerData.correctFillAnswer = dictationFillData[dictationIndex].answer;
  }
  
  dictationAnswers.push(answerData);
  
  // 显示反馈
  showAnswerFeedback(isCorrect, currentWord, answer);
}

// 显示答题反馈
function showAnswerFeedback(isCorrect, currentWord, userAnswer) {
  const feedback = document.getElementById('dictationFeedback');
  const feedbackIcon = document.getElementById('dictationFeedbackIcon');
  const feedbackText = document.getElementById('dictationFeedbackText');
  const correctAnswerEl = document.getElementById('dictationCorrectAnswer');
  const input = document.getElementById('dictationInput');
  const submitBtn = document.getElementById('dictationSubmitBtn');
  const hint = document.getElementById('dictationHint');
  
  dictationShowingFeedback = true;
  input.disabled = true;
  submitBtn.textContent = '继续';
  
  if (isCorrect) {
    feedback.style.background = '#d4edda';
    feedback.style.border = '2px solid #28a745';
    feedbackIcon.textContent = '✅';
    feedbackText.textContent = '回答正确！';
    feedbackText.style.color = '#28a745';
    correctAnswerEl.textContent = '';
    
    // 显示完整单词
    if (dictationMode === 'fill') {
      hint.textContent = `完整单词: ${currentWord.en}`;
    }
  } else {
    feedback.style.background = '#f8d7da';
    feedback.style.border = '2px solid #dc3545';
    feedbackIcon.textContent = '❌';
    feedbackText.textContent = '回答错误！';
    feedbackText.style.color = '#dc3545';
    
    // 显示正确答案
    if (dictationMode === 'en') {
      correctAnswerEl.textContent = `正确答案: ${currentWord.en}`;
    } else if (dictationMode === 'cn') {
      correctAnswerEl.textContent = `正确答案: ${currentWord.cn}`;
    } else if (dictationMode === 'fill') {
      correctAnswerEl.textContent = `正确答案: ${dictationFillData[dictationIndex].answer}`;
      hint.textContent = `完整单词: ${currentWord.en}`;
    }
  }
  
  feedback.style.display = 'block';
}

// 继续下一题
function nextQuestion() {
  dictationIndex++;
  
  if (dictationIndex >= dictationWords.length) {
    finishDictation();
  } else {
    showDictationQuestion();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('dictationInput');
  if (input) {
    // 回车提交
    input.addEventListener('keyup', function(e) {
      if (e.keyCode === 13) {
        handleDictationAction();
      }
    });
    
    // 实时更新填空格子
    input.addEventListener('input', function(e) {
      updateFillBoxes(e.target.value);
    });
  }
});

async function finishDictation() {
  // 计算本地结果
  let correctNum = 0;
  const wrongWords = [];
  
  dictationAnswers.forEach((answerData, index) => {
    if (answerData.isCorrect) {
      correctNum++;
    } else {
      wrongWords.push({
        en: dictationWords[index].en,
        cn: dictationWords[index].cn
      });
    }
  });
  
  const score = (correctNum / dictationWords.length) * 100;
  
  // 提交到后端保存记录
  const res = await http.post('/teacher/dictation/submit', {
    studentId: currentStudentId,
    grade: currentGrade,
    totalNum: dictationWords.length,
    answers: dictationAnswers,
    mode: dictationMode
  });
  
  document.getElementById('dictationContainer').style.display = 'none';
  document.getElementById('dictationResult').style.display = 'block';
  
  document.getElementById('dictationScore').textContent = score.toFixed(1);
  
  if (wrongWords.length > 0) {
    let html = '<h4 style="margin-bottom: 15px;">错题列表</h4><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
    wrongWords.forEach(w => {
      html += `<div style="padding: 10px; background: #f8d7da; border-radius: 4px;"><strong>${w.en}</strong> ${w.cn}</div>`;
    });
    html += '</div>';
    document.getElementById('dictationWrongList').innerHTML = html;
  } else {
    document.getElementById('dictationWrongList').innerHTML = '<p style="text-align: center; color: var(--primary-color);">🎉 全部正确！</p>';
  }
  
  // 刷新历史记录
  loadDictationHistory(currentStudentId);
}

function cancelDictation() {
  if (!confirm('确定要取消默写吗？')) return;
  resetDictation();
}

function resetDictation() {
  document.getElementById('dictationConfig').style.display = 'block';
  document.getElementById('dictationContainer').style.display = 'none';
  document.getElementById('dictationResult').style.display = 'none';
  dictationWords = [];
  dictationIndex = 0;
  dictationAnswers = [];
}

// ========== 学习统计 ==========

function initStatistics() {
  loadStudentOptions();
}

async function loadStatistics() {
  const studentId = document.getElementById('statsStudentId').value;
  
  if (!studentId) {
    document.getElementById('statsContainer').style.display = 'none';
    return;
  }
  
  document.getElementById('statsContainer').style.display = 'block';
  
  const overviewRes = await http.get(`/teacher/statistics/overview?studentId=${studentId}`);
  if (overviewRes.code === 200) {
    document.getElementById('statsTotalLessons').textContent = overviewRes.data.totalLessons;
    document.getElementById('statsKnowWords').textContent = overviewRes.data.knowWordsCount;
    document.getElementById('statsUnknownWords').textContent = overviewRes.data.unknownWordsCount;
    document.getElementById('statsWeakWords').textContent = overviewRes.data.weakWordCount;
  }
  
  const gradeRes = await http.get(`/teacher/statistics/grade?studentId=${studentId}`);
  if (gradeRes.code === 200) {
    let html = '';
    for (let i = 1; i <= 6; i++) {
      const rate = gradeRes.data[i];
      const height = rate * 2.5;
      html += `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
          <div style="font-weight: bold;">${rate}%</div>
          <div style="width: 60px; background: var(--primary-color); border-radius: 4px 4px 0 0; height: ${height}px;"></div>
          <div style="font-size: 12px; color: var(--text-secondary);">${gradeMap[i]}</div>
        </div>
      `;
    }
    document.getElementById('gradeChart').innerHTML = html;
  }
  
  const wrongRes = await http.get(`/teacher/statistics/wrong?studentId=${studentId}&limit=10`);
  if (wrongRes.code === 200) {
    let html = '';
    wrongRes.data.forEach((item, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.word?.en || '-'}</td>
          <td>${item.word?.cn || '-'}</td>
          <td>${item.count}</td>
        </tr>
      `;
    });
    document.getElementById('wrongWordsList').innerHTML = html || '<tr><td colspan="4" style="text-align: center;">暂无数据</td></tr>';
  }
}

// ========== 个人中心 ==========

document.getElementById('changePwdForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const oldPwd = document.getElementById('oldPwd').value;
  const newPwd = document.getElementById('newPwd').value;
  const confirmPwd = document.getElementById('confirmPwd').value;
  
  if (newPwd !== confirmPwd) {
    showToast('两次输入的密码不一致', 'error');
    return;
  }
  
  const res = await http.put('/teacher/profile/pwd', { oldPwd, newPwd });
  if (res.code === 200) {
    showToast('密码修改成功');
    document.getElementById('changePwdForm').reset();
  } else {
    showToast(res.msg, 'error');
  }
});

// ========== 工具函数 ==========

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
});

// 初始化加载
loadDashboard();
loadStudentOptions();
