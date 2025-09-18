// 심사 페이지 JavaScript

let currentJudge = null;
let currentMode = 'primary'; // 'primary' or 'adjustment'
let judgeScores = {};

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

// 페이지 초기화
function initializePage() {
    // 로그인 체크
    currentJudge = Utils.getCurrentJudge();
    if (!currentJudge) {
        alert('로그인이 필요합니다.');
        window.location.href = 'index.html';
        return;
    }

    // 현재 모드 로드
    currentMode = Utils.getStorageData(STORAGE_KEYS.JUDGE_MODE) || 'primary';

    // 점수 데이터 로드
    judgeScores = Utils.getJudgeScores(currentJudge.id);

    // UI 초기화
    setupUI();
    setupEventListeners();
    renderTeams();
    updateProgress();
    updateModeDisplay();
}

// UI 설정
function setupUI() {
    // 심사위원 정보 표시
    const judgeName = document.getElementById('judgeName');
    judgeName.textContent = `${currentJudge.name} (${currentJudge.nickname})님`;

    // 심사 기준 동적 생성
    updateCriteriaGuide();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 로그아웃 버튼
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // 모드 전환 버튼
    document.getElementById('switchModeBtn').addEventListener('click', handleModeSwitch);

    // 최종 제출 버튼
    document.getElementById('finalSubmitBtn').addEventListener('click', handleFinalSubmit);

    // 모달 버튼들
    document.getElementById('modalCancel').addEventListener('click', hideModal);
    document.getElementById('modalConfirm').addEventListener('click', confirmModalAction);
}

// 심사 기준 패널 업데이트
function updateCriteriaGuide() {
    const criteriaList = document.getElementById('criteriaList');
    criteriaList.innerHTML = '';

    APP_DATA.criteria.forEach(criterion => {
        const criteriaItem = document.createElement('div');
        criteriaItem.style.cssText = `
            background: #fff3a0;
            border: 1px solid #ffd506;
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 1rem;
            border-left: 4px solid #ffd506;
        `;
        criteriaItem.innerHTML = `
            <div style="font-weight: 600; color: #3d3d3d; margin-bottom: 0.5rem;">
                ${criterion.name} (${criterion.maxScore}점)
            </div>
            <div style="color: #6b6b6b; font-size: 0.9rem; line-height: 1.4;">
                ${criterion.description}
            </div>
        `;
        criteriaList.appendChild(criteriaItem);
    });
}

// 별표 순서 박스들 렌더링
function renderTeams() {
    const judgeArea = document.getElementById('judgeArea');
    judgeArea.innerHTML = '';

    // 처음 4개 팀만 표시 (2x2 그리드)
    const teamsToShow = APP_DATA.teams.slice(0, 4);

    teamsToShow.forEach((team, index) => {
        const starOrderBox = createStarOrderBox(team, index);
        judgeArea.appendChild(starOrderBox);
    });
}

// 별표 순서 박스 생성
function createStarOrderBox(team, index) {
    const isActive = isTeamActive(team, index);
    const starOrderBox = document.createElement('div');
    starOrderBox.className = `star-order-box ${isActive ? 'active' : 'disabled'}`;
    starOrderBox.id = `team-${team.id}`;

    starOrderBox.innerHTML = `
        <div class="star-order-header">
            별표 순서 ${team.order}: ${team.name}
        </div>
        <div class="box-content">
            ${APP_DATA.criteria.map(criterion => createBoxCriteriaRow(team, criterion)).join('')}
            <button class="save-btn" onclick="saveTeamScores('${team.id}')" ${!isActive ? 'disabled' : ''}>
                저장
            </button>
        </div>
    `;

    return starOrderBox;
}

// 박스 내부 심사 기준 행 생성
function createBoxCriteriaRow(team, criterion) {
    const currentScore = (judgeScores[team.id] && judgeScores[team.id][criterion.id]) || 0;
    const currentStars = scoreToStars(currentScore);

    if (currentMode === 'primary') {
        // 1차 심사 모드: 별점 입력
        return `
            <div class="box-criteria-item">
                <div class="box-criteria-name">${criterion.name}</div>
                <div class="box-criteria-controls">
                    <div class="box-star-rating" data-team="${team.id}" data-criterion="${criterion.id}">
                        ${createStarRating(currentStars)}
                    </div>
                    <div class="box-score" id="score-${team.id}-${criterion.id}">
                        ${currentScore}
                    </div>
                </div>
            </div>
        `;
    } else {
        // 보정 모드: 별점 유지 + 점수 직접 입력
        return `
            <div class="box-criteria-item">
                <div class="box-criteria-name">${criterion.name}</div>
                <div class="box-criteria-controls">
                    <div class="box-star-rating" data-team="${team.id}" data-criterion="${criterion.id}">
                        ${createStarRating(currentStars)}
                    </div>
                    <input type="number"
                           class="box-score-input"
                           min="0"
                           max="${criterion.maxScore}"
                           value="${currentScore}"
                           data-team="${team.id}"
                           data-criterion="${criterion.id}"
                           id="score-${team.id}-${criterion.id}">
                </div>
            </div>
        `;
    }
}

// 별점 UI 생성
function createStarRating(currentStars, disabled = false) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        const isActive = i <= currentStars;
        const className = `star ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`;
        starsHtml += `<span class="${className}" data-stars="${i}">★</span>`;
    }
    return starsHtml;
}

// 점수를 별점으로 변환
function scoreToStars(score) {
    for (let stars = 5; stars >= 1; stars--) {
        if (score >= APP_DATA.starScoreMap[stars]) {
            return stars;
        }
    }
    return 0;
}

// 팀이 현재 활성화되어야 하는지 확인
function isTeamActive(team, index) {
    if (currentMode === 'adjustment') {
        return true; // 보정 모드에서는 모든 팀 활성화
    }

    // 1차 심사에서는 순차적 진행
    if (index === 0) return true; // 첫 번째 팀은 항상 활성화

    // 이전 팀들이 모두 완료되었는지 확인
    for (let i = 0; i < index; i++) {
        const prevTeam = APP_DATA.teams[i];
        if (!isTeamCompleted(prevTeam.id)) {
            return false;
        }
    }
    return true;
}

// 팀 심사 완료 여부 확인
function isTeamCompleted(teamId) {
    const teamScores = judgeScores[teamId];
    if (!teamScores) return false;

    return APP_DATA.criteria.every(criterion => {
        return teamScores[criterion.id] && teamScores[criterion.id] > 0;
    });
}

// 개별 팀 저장 기능
function saveTeamScores(teamId) {
    const team = APP_DATA.teams.find(t => t.id === teamId);
    if (!team) return;

    const teamScores = judgeScores[teamId];
    if (!teamScores) {
        alert('점수를 입력해주세요.');
        return;
    }

    // 보정 모드에서는 유연한 저장 허용
    if (currentMode === 'adjustment') {
        // 실제 로컬스토리지에 저장
        Utils.setStorageData(`${STORAGE_KEYS.JUDGE_SCORES}_${currentJudge.id}`, judgeScores);

        // 저장 성공 메시지
        const saveBtn = document.querySelector(`#team-${teamId} .save-btn`);
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '저장됨!';
        saveBtn.style.background = '#28a745';
        saveBtn.disabled = true;

        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
            saveBtn.disabled = false;
        }, 1500);
        return;
    }

    // 1차 심사 모드: 모든 기준에 점수가 입력되었는지 확인
    const allScored = APP_DATA.criteria.every(criterion => {
        return teamScores[criterion.id] && teamScores[criterion.id] > 0;
    });

    if (!allScored) {
        alert('모든 심사 기준에 점수를 입력해주세요.');
        return;
    }

    // 실제 로컬스토리지에 저장
    Utils.setStorageData(`${STORAGE_KEYS.JUDGE_SCORES}_${currentJudge.id}`, judgeScores);

    // 저장 성공 메시지
    const saveBtn = document.querySelector(`#team-${teamId} .save-btn`);
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '저장됨!';
    saveBtn.style.background = '#28a745';
    saveBtn.disabled = true;

    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
        saveBtn.disabled = false;

        // 다음 팀 활성화 체크 (1차 심사에서만)
        if (currentMode === 'primary') {
            checkNextTeamActivation();
        }
    }, 1500);

    // 진행률 업데이트
    updateProgress();
}

// 별점 클릭 이벤트 처리
function handleStarClick(event) {
    if (currentMode !== 'primary') return;
    if (!event.target.classList.contains('star')) return;
    if (event.target.classList.contains('disabled')) return;

    const starRating = event.target.closest('.box-star-rating') || event.target.closest('.star-rating');
    const starOrderBox = event.target.closest('.star-order-box');

    if (starOrderBox && starOrderBox.classList.contains('disabled')) {
        alert('이전 팀의 심사를 먼저 완료해주세요.');
        return;
    }

    const teamId = starRating.dataset.team;
    const criterionId = starRating.dataset.criterion;
    const stars = parseInt(event.target.dataset.stars);

    updateTeamScore(teamId, criterionId, stars);
}

// 팀 점수 업데이트
function updateTeamScore(teamId, criterionId, stars) {
    const score = Utils.starToScore(stars);

    // 데이터 업데이트
    judgeScores = Utils.updateScore(currentJudge.id, teamId, criterionId, score);

    // UI 업데이트
    updateStarRating(teamId, criterionId, stars);
    updateScoreDisplay(teamId, criterionId, score);
    updateTotalScore(teamId);
    updateProgress();

    // 다음 팀 활성화 체크
    checkNextTeamActivation();
}

// 별점 UI 업데이트
function updateStarRating(teamId, criterionId, stars) {
    const starRating = document.querySelector(`[data-team="${teamId}"][data-criterion="${criterionId}"]`);
    const starElements = starRating.querySelectorAll('.star');

    starElements.forEach((star, index) => {
        if (index < stars) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// 점수 표시 업데이트
function updateScoreDisplay(teamId, criterionId, score) {
    const scoreDisplay = document.getElementById(`score-${teamId}-${criterionId}`);
    if (scoreDisplay) {
        scoreDisplay.textContent = `${score}점`;
    }
}

// 총점 업데이트
function updateTotalScore(teamId) {
    const totalElement = document.getElementById(`total-${teamId}`);
    const totalScore = Utils.calculateTotalScore(judgeScores[teamId] || {});
    totalElement.textContent = `총점: ${totalScore}점`;
}

// 진행률 업데이트
function updateProgress() {
    const completedTeams = APP_DATA.teams.filter(team => isTeamCompleted(team.id)).length;
    const totalTeams = APP_DATA.teams.length;

    const progressText = document.getElementById('progressText');
    progressText.textContent = `진행률: ${completedTeams}/${totalTeams}팀 완료`;

    // 모든 팀이 완료되면 보정 버튼 활성화
    if (completedTeams === totalTeams && currentMode === 'primary') {
        document.getElementById('switchModeBtn').disabled = false;
        document.getElementById('switchModeBtn').style.opacity = '1';
    }
}

// 다음 팀 활성화 체크
function checkNextTeamActivation() {
    if (currentMode !== 'primary') return;

    // 모든 팀 카드 다시 렌더링
    renderTeams();
    setupStarEventListeners();
}

// 별점 이벤트 리스너 설정
function setupStarEventListeners() {
    // 기존 이벤트 리스너 제거
    document.removeEventListener('click', handleStarClick);
    document.removeEventListener('mouseover', handleStarHover);
    document.removeEventListener('mouseout', handleStarHoverOut);

    // 새 이벤트 리스너 추가
    document.addEventListener('click', handleStarClick);
    document.addEventListener('mouseover', handleStarHover);
    document.addEventListener('mouseout', handleStarHoverOut);
}

// 별점 호버 효과
function handleStarHover(event) {
    if (currentMode !== 'primary') return;
    if (!event.target.classList.contains('star')) return;
    if (event.target.classList.contains('disabled')) return;

    const starRating = event.target.closest('.star-rating');
    const teamCard = event.target.closest('.team-card');

    if (teamCard.classList.contains('disabled')) return;

    const stars = parseInt(event.target.dataset.stars);
    const starElements = starRating.querySelectorAll('.star');

    starElements.forEach((star, index) => {
        if (index < stars) {
            star.classList.add('hover');
        } else {
            star.classList.remove('hover');
        }
    });
}

// 별점 호버 아웃
function handleStarHoverOut(event) {
    if (!event.target.classList.contains('star')) return;

    const starRating = event.target.closest('.star-rating');
    if (starRating) {
        const starElements = starRating.querySelectorAll('.star');
        starElements.forEach(star => star.classList.remove('hover'));
    }
}

// 모드 표시 업데이트
function updateModeDisplay() {
    const modeTitle = document.getElementById('modeTitle');
    const modeDescription = document.getElementById('modeDescription');
    const switchModeBtn = document.getElementById('switchModeBtn');
    const finalSubmitBtn = document.getElementById('finalSubmitBtn');

    if (currentMode === 'primary') {
        modeTitle.textContent = '1차 심사 (발표 당시)';
        modeDescription.textContent = '별점으로 각 심사 기준에 대해 점수를 매겨주세요';
        switchModeBtn.textContent = '보정하기';
        switchModeBtn.style.display = 'inline-block';
        finalSubmitBtn.style.display = 'none';

        // 처음 4개 팀이 완료되지 않으면 버튼 비활성화
        const firstFourTeams = APP_DATA.teams.slice(0, 4);
        const completedTeams = firstFourTeams.filter(team => isTeamCompleted(team.id)).length;
        if (completedTeams < firstFourTeams.length) {
            switchModeBtn.disabled = true;
            switchModeBtn.style.opacity = '0.6';
        } else {
            switchModeBtn.disabled = false;
            switchModeBtn.style.opacity = '1';
        }
    } else {
        modeTitle.textContent = '보정 단계';
        modeDescription.textContent = '점수 조정이 필요하다면 해당 팀 점수를 직접 조정하고 저장 버튼을 눌러주세요. 점수 조정이 모두 끝났다면 최종 제출하기 볼을 눌러주세요.';
        switchModeBtn.style.display = 'none'; // 1차 심사 돌아가기 버튼 숨김
        finalSubmitBtn.style.display = 'inline-block';
        finalSubmitBtn.disabled = false;
        finalSubmitBtn.style.opacity = '1';
    }
}

// 로그아웃 처리
function handleLogout() {
    showModal(
        '로그아웃',
        '정말 로그아웃하시겠습니까? 저장되지 않은 내용은 로컬스토리지에 보관됩니다.',
        () => {
            Utils.setStorageData(STORAGE_KEYS.CURRENT_JUDGE, null);
            window.location.href = 'index.html';
        }
    );
}

// 모드 전환 처리
function handleModeSwitch() {
    if (currentMode === 'primary') {
        const completedTeams = APP_DATA.teams.filter(team => isTeamCompleted(team.id)).length;
        if (completedTeams < APP_DATA.teams.length) {
            alert('모든 팀의 1차 심사를 완료해주세요.');
            return;
        }

        showModal(
            '보정 단계로 이동',
            '보정 단계에서는 점수를 직접 수정할 수 있습니다. 이동하시겠습니까?',
            () => {
                currentMode = 'adjustment';
                Utils.setStorageData(STORAGE_KEYS.JUDGE_MODE, currentMode);
                renderTeams();
                updateModeDisplay();
                setupScoreInputListeners();
            }
        );
    } else {
        showModal(
            '1차 심사로 돌아가기',
            '1차 심사 모드로 돌아가시겠습니까?',
            () => {
                currentMode = 'primary';
                Utils.setStorageData(STORAGE_KEYS.JUDGE_MODE, currentMode);
                renderTeams();
                updateModeDisplay();
                setupStarEventListeners();
            }
        );
    }
}

// 점수 입력 필드 이벤트 리스너 설정 (보정 모드용)
function setupScoreInputListeners() {
    const scoreInputs = document.querySelectorAll('.box-score-input');
    scoreInputs.forEach(input => {
        input.addEventListener('change', handleScoreInputChange);
        input.addEventListener('input', handleScoreInputChange);
    });
}

// 점수 직접 입력 처리 (보정 모드)
function handleScoreInputChange(event) {
    const input = event.target;
    const teamId = input.dataset.team;
    const criterionId = input.dataset.criterion;
    let score = parseInt(input.value) || 0;

    // 점수 범위 체크
    const criterion = APP_DATA.criteria.find(c => c.id === criterionId);
    if (score > criterion.maxScore) {
        score = criterion.maxScore;
        input.value = score;
    }
    if (score < 0) {
        score = 0;
        input.value = score;
    }

    // 데이터 업데이트 (즉시 저장하지 않고 임시 저장)
    if (!judgeScores[teamId]) judgeScores[teamId] = {};
    judgeScores[teamId][criterionId] = score;

    // 별점 업데이트
    const stars = scoreToStars(score);
    updateStarRating(teamId, criterionId, stars);
}

// 최종 제출 처리
function handleFinalSubmit() {
    const allCompleted = APP_DATA.teams.every(team => isTeamCompleted(team.id));

    if (!allCompleted) {
        alert('모든 팀의 심사를 완료해주세요.');
        return;
    }

    showModal(
        '최종 제출',
        '심사를 최종 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.',
        () => {
            // 최종 제출 완료 처리
            Utils.setStorageData(`${currentJudge.id}_submitted`, true);

            // 제출 완료 알림 모달 표시
            showSubmitSuccessModal();
        }
    );
}

// 제출 완료 알림 모달 표시
function showSubmitSuccessModal() {
    const modal = document.getElementById('submitSuccessModal');
    const timer = modal.querySelector('.success-timer');

    modal.style.display = 'flex';

    let countdown = 3;
    timer.textContent = `${countdown}초 후 완료 화면으로 이동합니다...`;

    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            timer.textContent = `${countdown}초 후 완료 화면으로 이동합니다...`;
        } else {
            clearInterval(countdownInterval);

            // 모달 숨기기
            modal.style.display = 'none';

            // 완료 화면 표시
            document.getElementById('teamsContainer').style.display = 'none';
            document.getElementById('modeSwitch').style.display = 'none';
            document.getElementById('criteriaGuide').style.display = 'none';
            document.getElementById('progressIndicator').style.display = 'none';
            document.getElementById('submissionComplete').style.display = 'block';
        }
    }, 1000);
}

// 모달 표시
function showModal(title, message, confirmCallback) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'flex';

    // 확인 버튼에 콜백 연결
    window.currentModalCallback = confirmCallback;
}

// 모달 숨기기
function hideModal() {
    document.getElementById('confirmModal').style.display = 'none';
    window.currentModalCallback = null;
}

// 모달 확인 처리
function confirmModalAction() {
    if (window.currentModalCallback) {
        window.currentModalCallback();
    }
    hideModal();
}

// 전역 함수 등록
window.saveTeamScores = saveTeamScores;

// 페이지 로드 시 이벤트 리스너 초기화
window.addEventListener('load', function() {
    setupStarEventListeners();
    if (currentMode === 'adjustment') {
        setupScoreInputListeners();
    }
});