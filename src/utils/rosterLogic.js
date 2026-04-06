// rosterLogic.js

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// ローテーションの基準となる過去の固定日付（2024年1月1日 月曜日）
const EPOCH_START = new Date('2024-01-01T00:00:00Z');

export const LOCATIONS = [
    '1Fトイレ',
    '1F給湯室',
    '2Fトイレ',
    '2F給湯室'
];

export const ANCHOR_CHOICES = [
    '1Fトイレ',
    '1F給湯室',
    '休み',
    '2Fトイレ',
    '2F給湯室'
];

/**
 * 指定された年月の週のリストを取得する
 */
export const getMonthWeeks = (year, month) => {
    const weeks = [];
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    let currentMonday = new Date(startOfMonth);
    const dayOfWeek = currentMonday.getDay(); // 0(日)〜6(土)
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentMonday.setDate(currentMonday.getDate() - diffToMonday);

    while (currentMonday <= endOfMonth) {
        const endOfWeek = new Date(currentMonday);
        endOfWeek.setDate(endOfWeek.getDate() + 6); // 日曜日

        const utcCurrentMonday = Date.UTC(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate());
        const utcEpoch = Date.UTC(EPOCH_START.getFullYear(), EPOCH_START.getMonth(), EPOCH_START.getDate());
        const globalWeekIndex = Math.floor((utcCurrentMonday - utcEpoch) / MS_PER_WEEK);

        weeks.push({
            start: new Date(currentMonday),
            end: new Date(endOfWeek),
            globalWeekIndex,
        });

        currentMonday.setDate(currentMonday.getDate() + 7);
    }

    return weeks;
};

/**
 * 安定版シミュレーションによるロスター生成
 * 指定した日付（アンカー）を起点として、そこから順繰りにローテーションを進める（右にシフトしていく）
 */
export const generateRoster = (staffList, year, month) => {
    const weeks = getMonthWeeks(year, month);
    if (weeks.length === 0) return [];

    const maxWeekIndex = weeks[weeks.length - 1].globalWeekIndex;
    if (maxWeekIndex < 0) return weeks.map(w => ({ ...w, assignments: {} }));

    const allExpectedWeeks = [];

    // シミュレーションの一貫性のためにID等で並び替えを固定
    const sortedStaff = [...staffList].sort((a, b) => {
        const aT = a.createdAt?.seconds || 0;
        const bT = b.createdAt?.seconds || 0;
        if (aT !== bT) return aT - bT;
        return a.id.localeCompare(b.id);
    });

    // シミュレーション用のキュー（IDの配列）
    let rotationQueue = sortedStaff.map(s => s.id);

    for (let wIdx = 0; wIdx <= maxWeekIndex; wIdx++) {
        // 現在のシミュレーション週の開始日と終了日
        const weekStartMs = Date.UTC(EPOCH_START.getFullYear(), EPOCH_START.getMonth(), EPOCH_START.getDate()) + wIdx * MS_PER_WEEK;
        const weekEndMs = weekStartMs + 6 * MS_PER_DAY;

        let assignments = { '1Fトイレ': null, '1F給湯室': null, '2Fトイレ': null, '2F給湯室': null, '休み': [] };

        // 稼働中のスタッフ抽出
        const baseActiveStaff = staffList.filter(s => !s.status || s.status === '在籍中');
        const inactiveStaff = staffList.filter(s => s.status && s.status !== '在籍中');
        assignments['休み'] = [...inactiveStaff];

        // --- 1. rotationQueue を最新の有効なスタッフのみに整理 ---
        const activeIds = baseActiveStaff.map(s => s.id);
        rotationQueue = rotationQueue.filter(id => activeIds.includes(id) && id !== null);
        activeIds.forEach(id => {
            if (!rotationQueue.includes(id)) {
                rotationQueue.push(id);
            }
        });

        // --- 2. アンカー指定の適用 (スワップ) ---
        // 同じ週に複数人のアンカーがあった場合でも順次スワップする
        const thisWeekAnchors = [];
        baseActiveStaff.forEach(staff => {
            if (staff.rotationAnchors && Array.isArray(staff.rotationAnchors)) {
                // 該当週の期間内に開始日が含まれるアンカーを探す
                const matchingAnchor = staff.rotationAnchors.find(a => {
                    const aTime = new Date(a.startDate).getTime();
                    return aTime >= weekStartMs && aTime <= weekEndMs;
                });
                if (matchingAnchor) {
                    thisWeekAnchors.push({ staffId: staff.id, location: matchingAnchor.location, startDate: matchingAnchor.startDate });
                }
            }
        });

        // アンカーを開始日順に適用することで公平性を保つ
        thisWeekAnchors.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        thisWeekAnchors.forEach(anchor => {
            const targetIndex = ANCHOR_CHOICES.indexOf(anchor.location);
            const currentIndex = rotationQueue.findIndex(id => id === anchor.staffId);

            if (targetIndex !== -1 && currentIndex !== -1) {
                // 配列の長さが targetIndex に満たない場合、null で埋める
                while (rotationQueue.length <= targetIndex) {
                    rotationQueue.push(null);
                }
                const temp = rotationQueue[targetIndex];
                rotationQueue[targetIndex] = rotationQueue[currentIndex];
                rotationQueue[currentIndex] = temp;
            }
        });

        // --- 3. 割り当ての実行 ---
        for (let i = 0; i < rotationQueue.length; i++) {
            if (rotationQueue[i] !== null) {
                const staff = staffList.find(s => s.id === rotationQueue[i]);
                if (i < ANCHOR_CHOICES.length) {
                    const choice = ANCHOR_CHOICES[i];
                    if (choice === '休み') {
                        assignments['休み'].push(staff);
                    } else {
                        assignments[choice] = staff;
                    }
                } else {
                    // Sequenceから溢れた人は休み
                    assignments['休み'].push(staff);
                }
            }
        }

        // スワップで生じた空きを詰める
        rotationQueue = rotationQueue.filter(id => id !== null);

        // --- 4. 部署制約の手動適用 ---
        const activeStaffForConstraint = staffList.filter(s => rotationQueue.includes(s.id));
        const enforceConstraintForDept = (dept) => {
            const deptMembers = activeStaffForConstraint.filter(s => s.department === dept);
            if (deptMembers.length === 0) return;

            const hasDeptMemberOnBreak = assignments['休み'].some(s => s && s.department === dept);

            if (!hasDeptMemberOnBreak) {
                const dutyToFree = LOCATIONS.find(duty => assignments[duty] && assignments[duty].department === dept);

                if (dutyToFree) {
                    const deptStaffToBreak = assignments[dutyToFree];
                    const eligibleBreakStaffIndex = assignments['休み'].findIndex(breakStaff => {
                        if (!breakStaff) return false;
                        if (inactiveStaff.some(s => s.id === breakStaff.id)) return false;
                        if (breakStaff.department === dept) return false;
                        if (['総務部', '営業部'].includes(breakStaff.department)) {
                            const activeBreakCount = assignments['休み'].filter(s =>
                                s && s.department === breakStaff.department && !inactiveStaff.some(is => is.id === s.id)
                            ).length;
                            return activeBreakCount > 1;
                        }
                        return true;
                    });

                    if (eligibleBreakStaffIndex !== -1) {
                        const staffToDuty = assignments['休み'][eligibleBreakStaffIndex];
                        assignments[dutyToFree] = staffToDuty;
                        assignments['休み'].splice(eligibleBreakStaffIndex, 1);
                        assignments['休み'].push(deptStaffToBreak);
                    } else {
                        assignments[dutyToFree] = null;
                        assignments['休み'].push(deptStaffToBreak);
                    }
                }
            }
        };
        enforceConstraintForDept('総務部');
        enforceConstraintForDept('営業部');

        // --- 5. 次週のためにキューを前進 (右シフト) ---
        // 1Fトイレの人(index0)が、次週に1F給湯室(index1)に遷移するためには、
        // 末尾の人が先頭に来る（全要素が1つ右に押し出される）必要がある。
        if (rotationQueue.length > 0) {
            rotationQueue.unshift(rotationQueue.pop());
        }

        allExpectedWeeks[wIdx] = { globalWeekIndex: wIdx, assignments };
    }

    const formatDate = (date) => `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

    return weeks.map(week => {
        const wIdx = week.globalWeekIndex;
        return {
            ...week,
            assignments: allExpectedWeeks[wIdx]?.assignments || {
                '1Fトイレ': null, '1F給湯室': null, '2Fトイレ': null, '2F給湯室': null, '休み': []
            },
            label: `${formatDate(week.start)} 〜 ${formatDate(week.end)}`
        };
    });
};

/**
 * 月間カレンダー用に、日単位の当番配列を生成する（上書きデータ対応）
 */
export const generateDailyRoster = (staffList, year, month, overrides = {}) => {
    const weeklyRoster = generateRoster(staffList, year, month);

    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyRoster = [];

    const pad = (n) => n.toString().padStart(2, '0');

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dateStr = `${year}-${pad(month)}-${pad(day)}`; // YYYY-MM-DD

        const timeTarget = currentDate.getTime();
        const weekData = weeklyRoster.find(w => timeTarget >= w.start.getTime() && timeTarget <= w.end.getTime());

        let baseAssignments = {
            '1Fトイレ': null, '1F給湯室': null, '2Fトイレ': null, '2F給湯室': null, '休み': []
        };

        if (weekData) {
            baseAssignments = {
                '1Fトイレ': weekData.assignments['1Fトイレ'],
                '1F給湯室': weekData.assignments['1F給湯室'],
                '2Fトイレ': weekData.assignments['2Fトイレ'],
                '2F給湯室': weekData.assignments['2F給湯室'],
                '休み': [...weekData.assignments['休み']]
            };
        }

        const dayOverrides = overrides[dateStr] || {};

        // 手動の上書き処理（カレンダー上で1日ごとにクリックして変更した分）
        Object.keys(dayOverrides).forEach(loc => {
            const overrideStaffId = dayOverrides[loc];
            if (overrideStaffId) {
                if (overrideStaffId === 'clear') {
                    baseAssignments[loc] = null;
                } else {
                    const staff = staffList.find(s => String(s.id) === String(overrideStaffId));
                    if (staff) {
                        const previousStaff = baseAssignments[loc];
                        baseAssignments[loc] = staff;

                        baseAssignments['休み'] = baseAssignments['休み'].filter(s => s.id !== staff.id);

                        if (previousStaff) {
                            const isStillWorking = ['1Fトイレ', '1F給湯室', '2Fトイレ', '2F給湯室'].some(l =>
                                baseAssignments[l] && baseAssignments[l].id === previousStaff.id
                            );
                            if (!isStillWorking && !baseAssignments['休み'].find(s => s.id === previousStaff.id)) {
                                baseAssignments['休み'].push(previousStaff);
                            }
                        }
                    }
                }
            }
        });

        dailyRoster.push({
            date: currentDate,
            dateStr: dateStr,
            dayOfWeek: currentDate.getDay(),
            assignments: baseAssignments,
            isOverride: Object.keys(dayOverrides).length > 0
        });
    }

    return dailyRoster;
};
