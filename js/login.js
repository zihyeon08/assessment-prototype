// 로그인 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    loadJudges();
    loadTeamsList();
    setupLoginForm();
    checkExistingLogin();
}

// 심사위원 목록을 드롭다운에 로드
function loadJudges() {
    const judgeSelect = document.getElementById('judgeSelect');

    APP_DATA.judges.forEach(judge => {
        const option = document.createElement('option');
        option.value = judge.id;
        option.textContent = `${judge.name} (${judge.nickname})`;
        judgeSelect.appendChild(option);
    });
}

// 참가팀 목록 표시
function loadTeamsList() {
    const teamsList = document.getElementById('teamsList');

    // 로딩 스피너 제거
    teamsList.innerHTML = '';

    const teamsGrid = document.createElement('div');
    teamsGrid.style.display = 'grid';
    teamsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
    teamsGrid.style.gap = '10px';

    APP_DATA.teams.forEach(team => {
        const teamItem = document.createElement('div');
        teamItem.style.cssText = `
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 12px;
            border-radius: 10px;
            text-align: center;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        teamItem.innerHTML = `
            <div style="font-size: 0.9rem; opacity: 0.8;">발표 ${team.order}번</div>
            <div style="font-size: 1.1rem; margin-top: 5px;">${team.name}</div>
        `;
        teamsGrid.appendChild(teamItem);
    });

    teamsList.appendChild(teamsGrid);
}

// 로그인 폼 설정
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const judgeSelect = document.getElementById('judgeSelect');
    const loginBtn = document.getElementById('loginBtn');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const selectedJudgeId = judgeSelect.value;
        if (!selectedJudgeId) {
            alert('심사위원을 선택해주세요.');
            return;
        }

        // 로그인 처리
        handleLogin(selectedJudgeId);
    });

    // 드롭다운 변경 시 버튼 활성화/비활성화
    judgeSelect.addEventListener('change', function() {
        if (this.value) {
            loginBtn.disabled = false;
            loginBtn.style.opacity = '1';
        } else {
            loginBtn.disabled = true;
            loginBtn.style.opacity = '0.6';
        }
    });

    // 초기 상태에서 버튼 비활성화
    loginBtn.disabled = true;
    loginBtn.style.opacity = '0.6';
}

// 로그인 처리
function handleLogin(judgeId) {
    try {
        // 선택된 심사위원 정보 확인
        const selectedJudge = APP_DATA.judges.find(judge => judge.id === judgeId);
        if (!selectedJudge) {
            alert('올바르지 않은 심사위원입니다.');
            return;
        }

        // 로컬스토리지에 현재 심사위원 저장
        Utils.setStorageData(STORAGE_KEYS.CURRENT_JUDGE, judgeId);

        // 심사 모드 초기화 (기본값: 1차 심사)
        Utils.setStorageData(STORAGE_KEYS.JUDGE_MODE, 'primary');

        // 해당 심사위원의 점수 데이터 확인/초기화
        let judgeScores = Utils.getJudgeScores(judgeId);
        if (!judgeScores) {
            judgeScores = Utils.initializeJudgeScores(judgeId);
        }

        // 로그인 성공 메시지
        showLoginSuccess(selectedJudge.name, selectedJudge.nickname);

        // 심사 페이지로 이동
        setTimeout(() => {
            window.location.href = 'judge.html';
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// 로그인 성공 메시지 표시
function showLoginSuccess(judgeName, judgeNickname) {
    const loginForm = document.getElementById('loginForm');
    loginForm.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
            <h2 style="color: #4facfe; margin-bottom: 1rem;">로그인 성공!</h2>
            <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">환영합니다, <strong>${judgeName}</strong>님</p>
            <p style="color: #666; margin-bottom: 2rem;">(${judgeNickname})</p>
            <div class="loading">
                <div class="spinner"></div>
            </div>
            <p style="margin-top: 1rem; color: #666;">심사 페이지로 이동 중...</p>
        </div>
    `;
}

// 기존 로그인 확인
function checkExistingLogin() {
    const currentJudge = Utils.getCurrentJudge();
    if (currentJudge) {
        const judgeSelect = document.getElementById('judgeSelect');
        const continueBtn = document.createElement('button');
        continueBtn.type = 'button';
        continueBtn.className = 'btn btn-secondary';
        continueBtn.style.cssText = 'width: 100%; margin-bottom: 1rem;';
        continueBtn.textContent = `${currentJudge.name}님으로 계속하기`;

        continueBtn.addEventListener('click', function() {
            window.location.href = 'judge.html';
        });

        const loginForm = document.getElementById('loginForm');
        loginForm.insertBefore(continueBtn, loginForm.firstChild);

        // 현재 로그인된 심사위원을 드롭다운에서 선택
        judgeSelect.value = currentJudge.id;
        judgeSelect.dispatchEvent(new Event('change'));
    }
}

// 에러 핸들링
window.addEventListener('error', function(e) {
    console.error('Page error:', e.error);
    alert('페이지 로드 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', function() {
    // 필요한 경우 정리 작업 수행
});