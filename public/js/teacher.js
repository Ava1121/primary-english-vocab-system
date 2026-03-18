// 检查登录权限
if (!checkAuth('teacher')) {
  // checkAuth 内部会自动跳转
}

// 当前页码
let studentPage = 1;
let lessonPage = 1;

// 教学相关变量
let teachWords = [];
let teachIndex = 0;
let knowWords = [];
let unknownWords = [];
let currentStudentId = '';
let currentGrade = 1;
let specialWords = [];
let specialIndex = 0;

// 默写相关变量
let dictationWords = [];
let dictationIndex = 0;
let dictationAnswers = [];

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

// 加载学生列表
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

// 显示新增学生弹窗
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

// 编辑学生
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

// 保存学生
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
    loadStudentOptions(); // 刷新学生选项
  } else {
    showToast(res.msg, 'error');
  }
});

// 删除学生
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

// ========== 单词教学 ==========

// 加载学生选项
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

// 初始化教学
function initTeach() {
  loadStudentOptions();
  document.getElementById('teachSelect').style.display = 'block';
  document.getElementById('teachContainer').style.display = 'none';
  teachWords = [];
  teachIndex = 0;
  knowWords = [];
  unknownWords = [];
}

// 开始教学
async function startTeach() {
  const studentId = document.getElementById('teachStudentId').value;
  const grade = parseInt(document.getElementById('teachGrade').value);
  
  if (!studentId) {
    showToast('请选择学生', 'error');
    return;
  }
  
  currentStudentId = studentId;
  currentGrade = grade;
  
  // 加载单词
  const res = await http.get(`/teacher/teach/words?grade=${grade}`);
  if (res.code === 200) {
    teachWords = res.data;
    teachIndex = 0;
    knowWords = [];
    unknownWords = [];
    
    document.getElementById('teachSelect').style.display = 'none';
    document.getElementById('teachContainer').style.display = 'flex';
    document.getElementById('normalTeach').style.display = 'flex';
    document.getElementById('specialTeach').classList.remove('active');
    
    renderTeachWordList();
    showCurrentWord();
  } else {
    showToast(res.msg, 'error');
  }
}

// 渲染单词列表
function renderTeachWordList() {
  let html = '';
  teachWords.forEach((word, index) => {
    let status = '';
    if (knowWords.includes(word._id)) status = 'style="background-color: #d4edda;"';
    else if (unknownWords.includes(word._id)) status = 'style="background-color: #f8d7da;"';
    
    html += `
      <div class="word-item ${index === teachIndex ? 'current' : ''}" ${status} onclick="jumpToWord(${index})">
        <span>${word.en}</span>
        <span style="color: #999;">${word.cn}</span>
      </div>
    `;
  });
  document.getElementById('teachWordList').innerHTML = html;
  document.getElementById('teachProgress').textContent = `(${teachIndex + 1}/${teachWords.length})`;
}

// 显示当前单词
function showCurrentWord() {
  if (teachIndex >= teachWords.length) {
    finishTeach();
    return;
  }
  
  const word = teachWords[teachIndex];
  document.getElementById('teachWordEn').textContent = word.en;
  document.getElementById('teachWordCn').textContent = word.cn;
  
  renderTeachWordList();
}

// 标记单词
function markWord(status) {
  const wordId = teachWords[teachIndex]._id;
  
  if (status === 'know') {
    if (!knowWords.includes(wordId)) knowWords.push(wordId);
    unknownWords = unknownWords.filter(id => id !== wordId);
  } else {
    if (!unknownWords.includes(wordId)) unknownWords.push(wordId);
    knowWords = knowWords.filter(id => id !== wordId);
  }
  
  // 检查是否达到5个不认识
  if (unknownWords.length >= 5 && unknownWords.length === knowWords.length + unknownWords.length - teachIndex + 1) {
    // 暂不触发专项教学，继续下一个
  }
  
  teachIndex++;
  
  // 检查是否需要专项教学
  if (unknownWords.length >= 5 && teachIndex >= teachWords.length) {
    startSpecialTeach();
  } else {
    showCurrentWord();
  }
}

// 跳转到指定单词
function jumpToWord(index) {
  teachIndex = index;
  showCurrentWord();
}

// 开始专项教学
function startSpecialTeach() {
  specialWords = teachWords.filter(w => unknownWords.includes(w._id));
  specialIndex = 0;
  
  if (specialWords.length === 0) {
    finishTeach();
    return;
  }
  
  document.getElementById('normalTeach').style.display = 'none';
  document.getElementById('specialTeach').classList.add('active');
  
  showSpecialWord();
}

// 显示专项教学单词
function showSpecialWord() {
  if (specialIndex >= specialWords.length) {
    finishTeach();
    return;
  }
  
  const word = specialWords[specialIndex];
  document.getElementById('specialWordEn').textContent = word.en;
  document.getElementById('specialWordCn').textContent = '（点击下方按钮显示中文）';
  document.getElementById('specialWordCn').dataset.cn = word.cn;
  
  const progress = ((specialIndex + 1) / specialWords.length) * 100;
  document.getElementById('specialProgress').style.width = `${progress}%`;
}

// 切换中文显示
function toggleSpecialCn() {
  const el = document.getElementById('specialWordCn');
  if (el.textContent === '（点击下方按钮显示中文）') {
    el.textContent = el.dataset.cn;
  } else {
    el.textContent = '（点击下方按钮显示中文）';
  }
}

// 下一个专项单词
function nextSpecialWord() {
  specialIndex++;
  showSpecialWord();
}

// 完成教学
async function finishTeach() {
  const res = await http.post('/teacher/teach/finish', {
    studentId: currentStudentId,
    grade: currentGrade,
    knowWords,
    unknownWords
  });
  
  if (res.code === 200) {
    const masterRate = res.data.masterRate;
    showToast(`教学完成！掌握率: ${masterRate}%`);
    initTeach();
  } else {
    showToast(res.msg, 'error');
  }
}

// ========== 课时记录 ==========

// 初始化课时
function initLessons() {
  loadStudentOptions();
}

// 加载课时列表
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

// 显示课时详情
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

// 重教课时
async function reteachLesson(lessonId) {
  if (!confirm('确定要重教这节课的未掌握单词吗？')) return;
  
  const res = await http.post('/teacher/lessons/reteach', { lessonId });
  if (res.code === 200) {
    showToast('已加入教学列表');
    // TODO: 实现重教逻辑
  } else {
    showToast(res.msg, 'error');
  }
}

// ========== 薄弱单词库 ==========

// 初始化薄弱单词
function initWeak() {
  loadStudentOptions();
}

// 加载薄弱单词
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

// 一键重教薄弱单词
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
    // TODO: 实现重教逻辑
  } else {
    showToast(res.msg, 'error');
  }
}

// 清空薄弱库
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

// 初始化默写
async function initDictation() {
  await loadStudentOptions();
  
  // 加载历史记录
  const studentId = document.getElementById('dictationStudentId').value;
  if (studentId) {
    loadDictationHistory(studentId);
  }
  
  // 监听学生选择
  document.getElementById('dictationStudentId').addEventListener('change', function() {
    if (this.value) {
      loadDictationHistory(this.value);
    }
  });
}

// 加载默写历史
async function loadDictationHistory(studentId) {
  const res = await http.get(`/teacher/dictation/list?studentId=${studentId}&page=1&size=5`);
  if (res.code === 200 && res.data.list.length > 0) {
    let html = '<table class="table"><thead><tr><th>时间</th><th>年级</th><th>题数</th><th>得分</th></tr></thead><tbody>';
    res.data.list.forEach(d => {
      html += `<tr><td>${formatDate(d.dictationTime)}</td><td>${gradeMap[d.grade]}</td><td>${d.totalNum}</td><td>${d.score}</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('dictationHistory').innerHTML = html;
  } else {
    document.getElementById('dictationHistory').innerHTML = '<p style="color: #999; text-align: center;">暂无历史记录</p>';
  }
}

// 开始默写
async function startDictation() {
  const studentId = document.getElementById('dictationStudentId').value;
  const grade = parseInt(document.getElementById('dictationGrade').value);
  const num = parseInt(document.getElementById('dictationNum').value);
  
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
    
    document.getElementById('dictationSelect').style.display = 'none';
    document.getElementById('dictationContainer').style.display = 'block';
    document.getElementById('dictationResult').style.display = 'none';
    
    showDictationQuestion();
  } else {
    showToast(res.msg, 'error');
  }
}

// 显示默写题目
function showDictationQuestion() {
  document.getElementById('dictationCurrentNum').textContent = dictationIndex + 1;
  document.getElementById('dictationTotalNum').textContent = dictationWords.length;
  document.getElementById('dictationCn').textContent = dictationWords[dictationIndex].cn;
  document.getElementById('dictationInput').value = '';
  document.getElementById('dictationInput').focus();
}

// 提交默写答案
function submitDictationAnswer() {
  const answer = document.getElementById('dictationInput').value.trim();
  
  if (!answer) {
    showToast('请输入答案', 'error');
    return;
  }
  
  dictationAnswers.push({
    wordId: dictationWords[dictationIndex]._id,
    answer
  });
  
  dictationIndex++;
  
  if (dictationIndex >= dictationWords.length) {
    finishDictation();
  } else {
    showDictationQuestion();
  }
}

// 监听回车提交
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('dictationInput')?.addEventListener('keyup', function(e) {
    if (e.keyCode === 13) {
      submitDictationAnswer();
    }
  });
});

// 完成默写
async function finishDictation() {
  const res = await http.post('/teacher/dictation/submit', {
    studentId: currentStudentId,
    grade: currentGrade,
    totalNum: dictationWords.length,
    answers: dictationAnswers
  });
  
  if (res.code === 200) {
    document.getElementById('dictationContainer').style.display = 'none';
    document.getElementById('dictationResult').style.display = 'block';
    
    document.getElementById('dictationScore').textContent = res.data.score;
    
    if (res.data.wrongWords && res.data.wrongWords.length > 0) {
      let html = '<h4 style="margin-bottom: 15px;">错题列表</h4><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
      res.data.wrongWords.forEach(w => {
        html += `<div style="padding: 10px; background: #f8d7da; border-radius: 4px;"><strong>${w.en}</strong> ${w.cn}</div>`;
      });
      html += '</div>';
      document.getElementById('dictationWrongList').innerHTML = html;
    } else {
      document.getElementById('dictationWrongList').innerHTML = '<p style="text-align: center; color: var(--primary-color);">🎉 全部正确！</p>';
    }
  } else {
    showToast(res.msg, 'error');
  }
}

// 取消默写
function cancelDictation() {
  if (!confirm('确定要取消默写吗？')) return;
  resetDictation();
}

// 重置默写
function resetDictation() {
  document.getElementById('dictationSelect').style.display = 'block';
  document.getElementById('dictationContainer').style.display = 'none';
  document.getElementById('dictationResult').style.display = 'none';
  dictationWords = [];
  dictationIndex = 0;
  dictationAnswers = [];
}

// ========== 学习统计 ==========

// 初始化统计
function initStatistics() {
  loadStudentOptions();
}

// 加载统计数据
async function loadStatistics() {
  const studentId = document.getElementById('statsStudentId').value;
  
  if (!studentId) {
    document.getElementById('statsContainer').style.display = 'none';
    return;
  }
  
  document.getElementById('statsContainer').style.display = 'block';
  
  // 概览数据
  const overviewRes = await http.get(`/teacher/statistics/overview?studentId=${studentId}`);
  if (overviewRes.code === 200) {
    document.getElementById('statsTotalLessons').textContent = overviewRes.data.totalLessons;
    document.getElementById('statsKnowWords').textContent = overviewRes.data.knowWordsCount;
    document.getElementById('statsUnknownWords').textContent = overviewRes.data.unknownWordsCount;
    document.getElementById('statsWeakWords').textContent = overviewRes.data.weakWordCount;
  }
  
  // 分年级掌握率
  const gradeRes = await http.get(`/teacher/statistics/grade?studentId=${studentId}`);
  if (gradeRes.code === 200) {
    let html = '';
    for (let i = 1; i <= 6; i++) {
      const rate = gradeRes.data[i];
      const height = rate * 2.5; // 最高250px
      html += `
        <div class="chart-bar">
          <div class="value">${rate}%</div>
          <div class="bar" style="height: ${height}px;"></div>
          <div class="label">${gradeMap[i]}</div>
        </div>
      `;
    }
    document.getElementById('gradeChart').innerHTML = html;
  }
  
  // 高频错题
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

// 关闭弹窗
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// 点击弹窗外部关闭
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
