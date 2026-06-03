const zipInput = document.getElementById('problemZip');
const selectedFileText = document.getElementById('selectedFileText');
const uploadForm = document.getElementById('zipUploadForm');
const uploadButton = document.getElementById('uploadButton');
const uploadStatus = document.getElementById('uploadStatus');
const formTitle = document.getElementById('formTitle');
const problemTbody = document.getElementById('problem-tbody');
const testCaseTitle = document.getElementById('testCaseTitle');
const testCaseList = document.getElementById('test-case-list');

const DEFAULT_FILE_HELP = 'problem.json과 cases 폴더가 들어있는 zip 파일을 선택하세요.';
let openedTestCaseProblemId = null;

function setStatus(type, message) {
  if (!uploadStatus) return;
  uploadStatus.className = `status ${type}`;
  uploadStatus.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function difficultyLabel(difficulty) {
  const labels = { easy: '쉬움', medium: '보통', hard: '어려움' };
  return labels[difficulty] || difficulty || '-';
}

function previewText(value) {
  const text = String(value ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return '-';
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

function renderProblemRows(problems) {
  if (!problemTbody) return;

  if (!problems.length) {
    problemTbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-cell">등록된 문제가 없습니다.</td>
      </tr>
    `;
    return;
  }

  problemTbody.innerHTML = problems.map((problem, index) => {
    const deleted = Boolean(problem.is_deleted);
    const difficulty = problem.difficulty || '-';
    const caseCount = Number(problem.case_count || 0);
    const statusText = deleted ? '삭제됨' : difficultyLabel(difficulty);
    const statusClass = deleted ? 'status-deleted' : `status-${escapeHtml(difficulty)}`;

    return `
      <tr>
        <td class="id-cell">${index + 1}</td>
        <td>${escapeHtml(problem.title)}</td>
        <td><span class="status-text ${statusClass}">${escapeHtml(statusText)}</span></td>
        <td><span class="case-count">${caseCount}개</span></td>
        <td class="action-cell">
          <button type="button" class="btn-cases px-sm py-1 border border-outline-variant text-secondary rounded text-xs hover:border-blue-400 hover:text-blue-600 transition-all" data-problem-id="${problem.id}" data-problem-title="${escapeHtml(problem.title)}">테스트케이스</button>
          <button type="button" class="btn-delete px-sm py-1 border border-outline-variant text-secondary rounded text-xs hover:border-red-400 hover:text-red-500 transition-all" data-problem-id="${problem.id}" ${deleted ? 'disabled' : ''}>문제 삭제</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadProblemList() {
  if (!problemTbody) return;
  problemTbody.innerHTML = `
    <tr>
      <td colspan="5" class="empty-cell">문제 목록을 불러오는 중입니다.</td>
    </tr>
  `;

  try {
    const problems = await apiRequest('/admin/problems');
    const withCaseCounts = await Promise.all(problems.map(async problem => {
      try {
        const cases = await apiRequest(`/problems/${problem.id}/test-cases`);
        return { ...problem, case_count: cases.length };
      } catch (error) {
        console.warn(`test case count load failed: ${problem.id}`, error.message);
        return { ...problem, case_count: 0 };
      }
    }));
    renderProblemRows(withCaseCounts);
  } catch (error) {
    problemTbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-cell">문제 목록을 불러오지 못했습니다.</td>
      </tr>
    `;
    setStatus('error', `문제 목록 조회 실패: ${error.message}`);
  }
}

function renderTestCases(problemId, problemTitle, cases) {
  if (!testCaseList) return;
  if (testCaseTitle) testCaseTitle.textContent = `테스트케이스 관리 - ${problemTitle || `문제 ${problemId}`}`;

  if (!cases.length) {
    testCaseList.innerHTML = '<div class="empty-cell">등록된 테스트케이스가 없습니다.</div>';
    return;
  }

  testCaseList.innerHTML = cases.map(testCase => `
    <div class="test-case-row">
      <div class="test-case-meta">
        <span class="id-cell">#${testCase.case_order}</span>
        <span>${testCase.is_sample ? '예제' : '일반'}</span>
      </div>
      <div class="test-case-preview">
        <div><strong>입력</strong><pre>${escapeHtml(previewText(testCase.input_data))}</pre></div>
        <div><strong>출력</strong><pre>${escapeHtml(previewText(testCase.expected_output))}</pre></div>
      </div>
      <button type="button" class="btn-test-case-delete px-sm py-1 border border-outline-variant text-secondary rounded text-xs hover:border-red-400 hover:text-red-500 transition-all" data-problem-id="${problemId}" data-test-case-id="${testCase.id}">
        테스트케이스 삭제
      </button>
    </div>
  `).join('');
}

async function loadTestCases(problemId, problemTitle) {
  if (!testCaseList) return;
  openedTestCaseProblemId = String(problemId);
  testCaseList.innerHTML = '<div class="empty-cell">테스트케이스를 불러오는 중입니다.</div>';

  try {
    const cases = await apiRequest(`/problems/${problemId}/test-cases`);
    renderTestCases(problemId, problemTitle, cases);
  } catch (error) {
    testCaseList.innerHTML = '<div class="empty-cell">테스트케이스를 불러오지 못했습니다.</div>';
    setStatus('error', `테스트케이스 조회 실패: ${error.message}`);
  }
}

function closeTestCases() {
  openedTestCaseProblemId = null;
  if (testCaseTitle) testCaseTitle.textContent = '테스트케이스 관리';
  if (testCaseList) {
    testCaseList.innerHTML = '문제 목록에서 테스트케이스 버튼을 눌러 확인하세요.';
  }
}

async function deleteTestCase(problemId, testCaseId) {
  if (!confirm(`테스트케이스 ID ${testCaseId}를 삭제하시겠습니까?`)) return;

  try {
    await apiRequest(`/problems/${problemId}/test-cases/${testCaseId}`, { method: 'DELETE' });
    setStatus('success', `테스트케이스 ID ${testCaseId}가 삭제되었습니다.`);
    await loadProblemList();
    await loadTestCases(problemId, testCaseTitle?.textContent?.replace(/^테스트케이스 관리 - /, '') || '');
  } catch (error) {
    setStatus('error', `테스트케이스 삭제 실패: ${error.message}`);
  }
}

function handleZipChange() {
  if (!zipInput || !selectedFileText) return;
  const file = zipInput.files[0];
  if (!file) {
    selectedFileText.textContent = DEFAULT_FILE_HELP;
    return;
  }
  selectedFileText.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
}

async function handleZipSubmit(event) {
  event.preventDefault();
  if (!zipInput || !uploadForm || !uploadButton || !selectedFileText) return;

  const file = zipInput.files[0];
  if (!file) {
    setStatus('error', '업로드할 zip 파일을 먼저 선택하세요.');
    return;
  }

  if (!file.name.toLowerCase().endsWith('.zip')) {
    setStatus('error', 'zip 파일만 업로드할 수 있습니다.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  uploadButton.disabled = true;
  uploadButton.textContent = '업로드 중...';
  setStatus('info', 'ZIP 파일을 서버로 전송하고 있습니다.');

  try {
    const token = getToken();
    const response = await fetch('/admin/problems/import-zip', {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
    });

    let result;
    try { result = await response.json(); } catch { result = null; }

    if (!response.ok) {
      throw new Error(result?.detail || '업로드 API 요청에 실패했습니다.');
    }

    setStatus('success', result?.message || '문제 데이터셋 업로드가 완료되었습니다.');
    uploadForm.reset();
    selectedFileText.textContent = DEFAULT_FILE_HELP;
    await loadProblemList();
  } catch (error) {
    setStatus('error', `업로드 실패: ${error.message}`);
  } finally {
    uploadButton.disabled = false;
    uploadButton.textContent = 'ZIP 업로드';
  }
}

async function deleteProblem(id) {
  if (!confirm(`문제 ID ${id}를 삭제하시겠습니까?`)) return;

  try {
    await apiRequest(`/admin/problems/${id}`, { method: 'DELETE' });
    setStatus('success', `문제 ID ${id}가 삭제되었습니다.`);
    await loadProblemList();
  } catch (error) {
    setStatus('error', `문제 삭제 실패: ${error.message}`);
  }
}

async function loadAdminNavbar() {
  const container = document.getElementById('navbar-container');
  if (!container) return;
  try {
    const response = await fetch('/components/admin-navbar.html?v=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error(`admin-navbar load failed: ${response.status}`);
    container.innerHTML = await response.text();
    await hydrateAdminNavbar();
    bindAdminNavbarLogout();
  } catch (error) {
    console.warn(error.message);
  }
}

async function hydrateAdminNavbar() {
  try {
    const user = await getMe();
    const nickname = document.getElementById('navbar-nickname');
    if (nickname) nickname.textContent = user.nickname || '관리자';
  } catch (error) {
    console.warn(error.message);
  }
}

function bindAdminNavbarLogout() {
  const logoutButton = document.getElementById('btn-logout');
  if (!logoutButton) return;

  logoutButton.addEventListener('click', event => {
    event.preventDefault();
    logoutButton.disabled = true;

    apiLogout().catch(error => {
      console.warn(error.message);
    });

    clearToken();
    window.location.replace('/');
  });
}

function bindAdminProblemEvents() {
  if (zipInput) zipInput.addEventListener('change', handleZipChange);
  if (uploadForm) uploadForm.addEventListener('submit', handleZipSubmit);
  if (problemTbody) {
    problemTbody.addEventListener('click', event => {
      const button = event.target.closest('button[data-problem-id]');
      if (!button) return;

      if (button.classList.contains('btn-cases')) {
        if (openedTestCaseProblemId === String(button.dataset.problemId)) {
          closeTestCases();
        } else {
          loadTestCases(button.dataset.problemId, button.dataset.problemTitle);
        }
      }
      if (button.classList.contains('btn-delete')) {
        deleteProblem(button.dataset.problemId);
      }
    });
  }
  if (testCaseList) {
    testCaseList.addEventListener('click', event => {
      const button = event.target.closest('.btn-test-case-delete');
      if (!button) return;
      deleteTestCase(button.dataset.problemId, button.dataset.testCaseId);
    });
  }
}

(async () => {
  await adminGuard();
  await loadAdminNavbar();
  bindAdminProblemEvents();
  await loadProblemList();
})();
