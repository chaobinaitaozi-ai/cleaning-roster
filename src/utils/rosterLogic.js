// rosterLogic.js

// 曜日や日時の計算用定数
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
// ローテーションの基準となる過去の固定日付（2024年1月1日 月曜日）
const EPOCH_START = new Date('2024-01-01T00:00:00Z');

export const LOCATIONS = [
    '1Fトイレ',
    '1F給湯室',
    '2Fトイレ',
    '2F給湯室'
];

/**
 * 指定された年月の週のリストを取得する
 * 月初を含む週の月曜日から、月末を含む週の日曜日まで
 */
export const getMonthWeeks = (year, month) => {
    const weeks = [];
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    // 月初の直前の月曜日を探す
    let currentMonday = new Date(startOfMonth);
    const dayOfWeek = currentMonday.getDay(); // 0(日)〜6(土)
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentMonday.setDate(currentMonday.getDate() - diffToMonday);

    // 現在の月曜日が月末日以前である限りループ
    while (currentMonday <= endOfMonth) {
        const endOfWeek = new Date(currentMonday);
        endOfWeek.setDate(endOfWeek.getDate() + 6); // 日曜日

        // グローバルな週インデックス（基準日からの経過週数）
        // getTimezoneOffsetなどの影響を避けるためUTCで日付の差を計算
        const utcCurrentMonday = Date.UTC(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate());
        const utcEpoch = Date.UTC(EPOCH_START.getFullYear(), EPOCH_START.getMonth(), EPOCH_START.getDate());
        const globalWeekIndex = Math.floor((utcCurrentMonday - utcEpoch) / MS_PER_WEEK);

        weeks.push({
            start: new Date(currentMonday),
            end: new Date(endOfWeek),
            globalWeekIndex,
        });

        // 次の週へ
        currentMonday.setDate(currentMonday.getDate() + 7);
    }

    return weeks;
};

/**
 * スタッフリストと年月から当番表を生成する
 */
export const generateRoster = (staffList, year, month) => {
    const weeks = getMonthWeeks(year, month);

    // 「在籍中」またはステータスが未設定の人のみを当番の対象とする
    const baseActiveStaff = staffList.filter(staff => !staff.status || staff.status === '在籍中');
    // 休職中・時短勤務などの人は、最初から「休み」として扱う
    const baseInactiveStaff = staffList.filter(staff => staff.status && staff.status !== '在籍中');

    // 総務部と営業部の人数をカウント
    const soumuCount = baseActiveStaff.filter(s => s.department === '総務部').length;
    const eigyoCount = baseActiveStaff.filter(s => s.department === '営業部').length;

    // 1人しかいない場合は常に休み（inactiveStaffに追加）
    const alwaysOffStaff = [];
    const activeStaff = baseActiveStaff.filter(s => {
        if (s.department === '総務部' && soumuCount === 1) {
            alwaysOffStaff.push(s);
            return false;
        }
        if (s.department === '営業部' && eigyoCount === 1) {
            alwaysOffStaff.push(s);
            return false;
        }
        return true;
    });

    const inactiveStaff = [...baseInactiveStaff, ...alwaysOffStaff];

    const N = activeStaff.length;

    return weeks.map(week => {
        // この週の割り当てを初期化
        const assignments = {
            '1Fトイレ': null,
            '1F給湯室': null,
            '2Fトイレ': null,
            '2F給湯室': null,
            '休み': [...inactiveStaff] // 当番外の人は常に休みに含める
        };

        if (N > 0) {
            const duties = ['1Fトイレ', '1F給湯室', '2Fトイレ', '2F給湯室'];

            if (N >= 4) {
                // Nが4人以上いれば、全員できれいにローテーションを回す
                activeStaff.forEach((staff, index) => {
                    let pos = (index + week.globalWeekIndex) % N;
                    if (pos < 0) pos += N;

                    if (pos < 4) {
                        assignments[duties[pos]] = staff;
                    } else {
                        assignments['休み'].push(staff);
                    }
                });
            } else {
                // 4人未満の場合は上から順番に埋める（一部の場所が空きになる）
                activeStaff.forEach((staff, index) => {
                    assignments[duties[index]] = staff;
                });
            }
        }

        if (N > 0) {
            const enforceConstraintForDept = (dept) => {
                const deptMembers = activeStaff.filter(s => s.department === dept);
                if (deptMembers.length === 0) return;

                const hasDeptMemberOnBreak = assignments['休み'].some(s => s.department === dept);

                if (!hasDeptMemberOnBreak) {
                    const duties = ['1Fトイレ', '1F給湯室', '2Fトイレ', '2F給湯室'];
                    const dutyToFree = duties.find(duty => assignments[duty] && assignments[duty].department === dept);

                    if (dutyToFree) {
                        const deptStaffToBreak = assignments[dutyToFree];

                        const eligibleBreakStaffIndex = assignments['休み'].findIndex(breakStaff => {
                            if (inactiveStaff.includes(breakStaff)) return false; // 当番外の人は除外
                            if (breakStaff.department === dept) return false; // 同部署は除外

                            if (['総務部', '営業部'].includes(breakStaff.department)) {
                                const activeBreakCount = assignments['休み'].filter(s =>
                                    s.department === breakStaff.department && !inactiveStaff.includes(s)
                                ).length;
                                return activeBreakCount > 1; // 他の制約部署なら、その部署で2人以上休みの人がいる場合のみ交代可
                            }
                            return true; // システム部などは交代OK
                        });

                        if (eligibleBreakStaffIndex !== -1) {
                            const staffToDuty = assignments['休み'][eligibleBreakStaffIndex];
                            assignments[dutyToFree] = staffToDuty;
                            assignments['休み'].splice(eligibleBreakStaffIndex, 1);
                            assignments['休み'].push(deptStaffToBreak);
                        } else {
                            // 交代要員が見つからない場合でも、部署の「最低1人は休み」の条件を優先するため、
                            // その人を休みにして役割を空き（null）にする
                            assignments[dutyToFree] = null;
                            assignments['休み'].push(deptStaffToBreak);
                        }
                    }
                }
            };

            enforceConstraintForDept('総務部');
            enforceConstraintForDept('営業部');
        }

        // YYYY/MM/DDの形でフォーマット
        const formatDate = (date) => `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

        return {
            ...week,
            assignments,
            label: `${formatDate(week.start)} 〜 ${formatDate(week.end)}`
        };
    });
};
