// 더미 데이터 - 프로토타입용
const APP_DATA = {
    // 심사위원 정보
    judges: [
        { id: 'judge1', name: '김심사', nickname: '기술전문가' },
        { id: 'judge2', name: '이심사', nickname: '창의성평가자' },
        { id: 'judge3', name: '박심사', nickname: '실무전문가' },
        { id: 'judge4', name: '최심사', nickname: '산업전문가' },
        { id: 'judge5', name: '정심사', nickname: '사업화전문가' }
    ],

    // 심사 기준 정보
    criteria: [
        { id: 'creativity', name: '창의성', maxScore: 35, description: '창의성 부문에 대한 심사 방향 설명' },
        { id: 'technical', name: '기술력', maxScore: 35, description: '기술력에 대한 심사 방향 설명' },
        { id: 'feasibility', name: '현실 가능성', maxScore: 35, description: '현실 가능성에 대한 심사 방향 설명' }
    ],

    // 참가팀 정보 (발표 순서대로)
    teams: [
        { id: 'team1', name: '해커톤팀1', order: 1 },
        { id: 'team2', name: '이노베이터즈', order: 2 },
        { id: 'team3', name: '코드마스터즈', order: 3 },
        { id: 'team4', name: '테크파이터즈', order: 4 }
    ],

    // 별점-점수 변환표 (별 하나 없앨 때마다 2점씩 감소)
    starScoreMap: {
        5: 20,  // 별 5개 = 20점
        4: 18,  // 별 4개 = 18점
        3: 16,  // 별 3개 = 16점
        2: 14,  // 별 2개 = 14점
        1: 12   // 별 1개 = 12점
    }
};

// 로컬스토리지 키 상수
const STORAGE_KEYS = {
    CURRENT_JUDGE: 'currentJudge',
    JUDGE_SCORES: 'judgeScores',
    JUDGE_MODE: 'judgeMode' // 'primary' 또는 'adjustment'
};

// 유틸리티 함수들
const Utils = {
    // 별점을 점수로 변환
    starToScore: (stars) => {
        return APP_DATA.starScoreMap[stars] || 0;
    },

    // 팀의 총점 계산
    calculateTotalScore: (teamScores) => {
        if (!teamScores) return 0;
        return Object.values(teamScores).reduce((total, score) => total + (score || 0), 0);
    },

    // 로컬스토리지에서 데이터 가져오기
    getStorageData: (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },

    // 로컬스토리지에 데이터 저장하기
    setStorageData: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },

    // 현재 심사위원 정보 가져오기
    getCurrentJudge: () => {
        const judgeId = Utils.getStorageData(STORAGE_KEYS.CURRENT_JUDGE);
        return APP_DATA.judges.find(judge => judge.id === judgeId) || null;
    },

    // 심사 점수 초기화
    initializeJudgeScores: (judgeId) => {
        const scores = {};
        APP_DATA.teams.forEach(team => {
            scores[team.id] = {};
            APP_DATA.criteria.forEach(criterion => {
                scores[team.id][criterion.id] = 0;
            });
        });
        Utils.setStorageData(`${STORAGE_KEYS.JUDGE_SCORES}_${judgeId}`, scores);
        return scores;
    },

    // 심사위원별 점수 가져오기
    getJudgeScores: (judgeId) => {
        let scores = Utils.getStorageData(`${STORAGE_KEYS.JUDGE_SCORES}_${judgeId}`);
        if (!scores) {
            scores = Utils.initializeJudgeScores(judgeId);
        }
        return scores;
    },

    // 점수 업데이트
    updateScore: (judgeId, teamId, criterionId, score) => {
        const scores = Utils.getJudgeScores(judgeId);
        if (!scores[teamId]) scores[teamId] = {};
        scores[teamId][criterionId] = score;
        Utils.setStorageData(`${STORAGE_KEYS.JUDGE_SCORES}_${judgeId}`, scores);
        return scores;
    }
};

// 전역으로 사용할 수 있도록 export
if (typeof window !== 'undefined') {
    window.APP_DATA = APP_DATA;
    window.STORAGE_KEYS = STORAGE_KEYS;
    window.Utils = Utils;
}