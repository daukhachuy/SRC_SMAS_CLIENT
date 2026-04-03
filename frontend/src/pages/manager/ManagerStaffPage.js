// Đảm bảo không có hook ngoài function component
  import React, { useCallback, useEffect, useMemo, useState } from 'react';
  import {
    UserPlus,
    CalendarPlus,
    Sun,
    Sunset,
    Moon,
    Star,
    CheckCircle,
    Plus,
    FileDown,
    Edit2,
    X,
    Search,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Clock,
    MapPin,
    Save,
    Trash2,
    Loader2,
    RefreshCw,
    AlertCircle,
  } from 'lucide-react';
  import '../../styles/ManagerStaffPage.css';
  import { staffAPI } from '../../api/managerApi';
  import { getAllStaff } from '../../api/managerApi';
  import { getTables } from '../../api/tableApi';

  const DEPARTMENTS = ['all', 'kitchen', 'service'];
  const DEPARTMENT_LABELS = {
    all: 'Tất cả',
    kitchen: 'Bếp',
    service: 'Phục vụ',
  };

  const SHIFT_KEYS = ['morning', 'afternoon', 'evening'];

  const ROLE_TO_POSITION = {
    all: ['Kitchen', 'Waiter'],
    kitchen: ['Kitchen'],
    service: ['Waiter'],
  };

  // --- MAPPER FUNCTIONS ---
  function mapStaffToUI(raw) {
    // Log dữ liệu để debug
    if (process.env.NODE_ENV !== 'production') {
      console.log('[STAFF RAW]', raw);
    }
    let role = raw.position || raw.role || raw.staffRole || '';
    if (role && role.toLowerCase() === 'waiter') role = 'Phục vụ';
    if (role && role.toLowerCase() === 'kitchen') role = 'Đầu bếp';
    return {
      id: raw.userId || raw.id,
      name: raw.fullName || raw.fullname || raw.name || raw.staffName || '---',
      avatar: raw.avatarUrl || raw.avatar || '',
      role,
      email: raw.email || '',
      phone: raw.phone || '',
      joinDate: raw.hireDate || raw.joinDate || '',
      rating: typeof raw.rating === 'number' ? raw.rating : 0,
      workStaffId: raw.workStaffId,
      isWorking: raw.isWorking,
      startTime: raw.startTime,
      location: raw.location || '',
      roleColor: 'blue',
    };
  }

  function mapWorkshiftToUI(raw) {
    return {
      id: raw.shiftId || raw.id,
      name: raw.shiftName || raw.name,
      startTime: raw.startTime,
      endTime: raw.endTime,
      typeStaff: raw.typeStaff,
      additionalWork: raw.additionalWork,
    };
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
    return [];
  }

  function unwrapResponse(res) {
    if (!res) return null;

    if (res.data?.data) return res.data.data;
    if (res.data) return res.data;

    return res;
  }

  function getWeekDatesFromRange(dateRange) {
    const labels = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return dateRange.map((dateStr, idx) => {
      const d = new Date(dateStr);
      return {
        key: dateStr,
        day: labels[d.getDay()],
        date: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        highlight: idx === 0,
      };
    });
  }

  function inferShiftKey(item) {
    const shiftName = String(item?.shiftName || item?.shift || '').toLowerCase();
    if (shiftName.includes('sáng') || shiftName.includes('morning')) return 'morning';
    if (shiftName.includes('chiều') || shiftName.includes('afternoon')) return 'afternoon';
    if (shiftName.includes('tối') || shiftName.includes('evening') || shiftName.includes('night')) return 'evening';

    const startTime = String(item?.startTime || '').trim();
    const hour = Number(startTime.slice(0, 2));
    if (!Number.isNaN(hour)) {
      if (hour < 12) return 'morning';
      if (hour < 18) return 'afternoon';
      return 'evening';
    }

    return 'morning';
  }

  function roleMatch(employeeRole, selectedDepartment) {
    if (employeeRole === 'Quản lý') return false;
    if (selectedDepartment === 'all') return true;
    if (selectedDepartment === 'kitchen') return employeeRole === 'Đầu bếp';
    if (selectedDepartment === 'service') return employeeRole === 'Phục vụ';
    return true;
  }


  const ManagerStaffPage = () => {
    const [activeTab, setActiveTab] = useState('schedule');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [schedule, setSchedule] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [weekSchedule, setWeekSchedule] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [grouped, setGrouped] = useState({});
    const [currentlyWorking, setCurrentlyWorking] = useState([]);

    const [scheduleData, setScheduleData] = useState({
      morning: [],
      afternoon: [],
      evening: [],
    });

    const [employees, setEmployees] = useState([]);
    const [workshifts, setWorkshifts] = useState([]);

    const [stats, setStats] = useState({
      totalWorkShift: 0,
      totalHours: 0,
    });

    const [submitting, setSubmitting] = useState(false);
    const [processingDetail, setProcessingDetail] = useState(false);
    const [tables, setTables] = useState([]);

    const fetchSchedule = useCallback(async (baseEmployees, dateRange) => {
      const positions = ROLE_TO_POSITION.all;
      const dateParam = dateRange[0];
      // Log tham số truyền lên để so sánh với Swagger
      console.log('[DEBUG] Call getNextSevenDays positions:', positions);
      console.log('[DEBUG] Call getNextSevenDays raw param:', JSON.stringify(positions));
      console.log('[DEBUG] Call getScheduleWeekKitchenWaiter date:', dateParam);
      const [nextSevenRes, weekKitchenRes] = await Promise.allSettled([
        staffAPI.getNextSevenDays(positions),
        staffAPI.getScheduleWeekKitchenWaiter(dateParam),
      ]);

      // Parse API mới: shifts -> days -> staffs
      const nextSevenData = nextSevenRes.status === 'fulfilled'
        ? unwrapResponse(nextSevenRes.value)
        : null;
      console.log('[DEBUG][fetchSchedule] API nextSevenData:', nextSevenData);
      console.log('[DEBUG][fetchSchedule] input dateRange:', dateRange);

      // Fix: luôn đảm bảo weekDates bắt đầu từ hôm nay
      let weekDatesArr = [];
      const todayStr = new Date().toISOString().split('T')[0];
      let useToday = false;
      if (nextSevenData?.dateRange && Array.isArray(nextSevenData.dateRange) && nextSevenData.dateRange.length > 0) {
        // Nếu dateRange không chứa today, sẽ tạo lại từ hôm nay
        if (nextSevenData.dateRange[0] === todayStr) {
          weekDatesArr = nextSevenData.dateRange;
        } else {
          useToday = true;
        }
      } else {
        useToday = true;
      }
      if (useToday) {
        weekDatesArr = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          weekDatesArr.push(d.toISOString().split('T')[0]);
        }
      }
      console.log('[DEBUG][fetchSchedule] weekDatesArr (final):', weekDatesArr);
      const weekDates = getWeekDatesFromRange(weekDatesArr);
      setWeekSchedule(weekDates);
      const byDay = {
        morning: Array.from({ length: weekDates.length }, () => []),
        afternoon: Array.from({ length: weekDates.length }, () => []),
        evening: Array.from({ length: weekDates.length }, () => []),
      };
      const employeePool = [...baseEmployees];
      const employeeIds = new Set(employeePool.map((e) => e.id));

      // Map shiftId sang shiftKey chuẩn (luôn đúng với dữ liệu backend)
      const getShiftKey = (shift) => {
        if (shift.shiftId === 1 || /sáng|morning/i.test(shift.shiftName || '')) return 'morning';
        if (shift.shiftId === 2 || /chiều|afternoon/i.test(shift.shiftName || '')) return 'afternoon';
        if (shift.shiftId === 3 || /tối|evening|night/i.test(shift.shiftName || '')) return 'evening';
        return 'morning';
      };

      // DEBUG LOG: Duyệt từng shift
      (nextSevenData?.shifts || []).forEach((shift, shiftIdx) => {
        const shiftKey = getShiftKey(shift);
        if (!SHIFT_KEYS.includes(shiftKey)) return;
        shift.days.forEach((day, dayIdx) => {
          const workDayStr = (day.workDay || '').slice(0, 10);
          const dayIndex = weekDates.findIndex((d) => d.key.slice(0, 10) === workDayStr);
          console.log(`[DEBUG][fetchSchedule] shiftIdx=${shiftIdx}, shiftKey=${shiftKey}, dayIdx=${dayIdx}, workDayStr=${workDayStr}, dayIndex=${dayIndex}`);
          if (dayIndex < 0) return;
          day.staffs.forEach((staff, staffIdx) => {
            console.log(`[DEBUG][fetchSchedule]  staffIdx=${staffIdx}, staff=`, staff);
            if (!employeeIds.has(staff.userId)) {
              employeePool.push({
                id: staff.userId,
                name: staff.fullName,
                avatar: staff.avatarUrl,
                role: staff.position,
              });
              employeeIds.add(staff.userId);
            }
            if (!byDay[shiftKey][dayIndex].includes(staff.userId)) {
              byDay[shiftKey][dayIndex].push(staff.userId);
            }
          });
        });
      });

      // Xử lý thêm dữ liệu từ weekKitchenRes nếu cần (giữ nguyên logic cũ)
      const scheduleItems = weekKitchenRes.status === 'fulfilled' ? unwrapResponse(weekKitchenRes.value) : [];
      scheduleItems.forEach((raw, idx) => {
        const staff = mapStaffToUI(raw);
        if (staff.id == null) return;
        if (!employeeIds.has(staff.id)) {
          employeePool.push(staff);
          employeeIds.add(staff.id);
        }
        const workDate = raw?.workDate || raw?.workDay || staff.workDate;
        const dateKey = workDate ? new Date(workDate).toISOString().split('T')[0] : null;
        const dayIndex = weekDates.findIndex((d) => d.key === dateKey);
        console.log(`[DEBUG][fetchSchedule] [weekKitchenRes] idx=${idx}, staffId=${staff.id}, workDate=${workDate}, dateKey=${dateKey}, dayIndex=${dayIndex}`);
        if (dayIndex < 0) return;
        const shiftKey = inferShiftKey(raw);
        if (!SHIFT_KEYS.includes(shiftKey)) return;
        if (!byDay[shiftKey][dayIndex].includes(staff.id)) {
          byDay[shiftKey][dayIndex].push(staff.id);
        }
      });

      // DEBUG LOG: Kết quả mapping ca làm
      console.log('[DEBUG][fetchSchedule] byDay:', byDay);
      console.log('[DEBUG][fetchSchedule] employeePool:', employeePool);

      setScheduleData(byDay);

      setEmployees((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        employeePool.forEach((p) => {
          if (p.id != null && !map.has(p.id)) map.set(p.id, p);
        });
        const arr = Array.from(map.values());
        console.log('[SET EMPLOYEES]', arr);
        return arr;
      });
    }, []);

    const fetchPageData = useCallback(async (department, withRefresh = false) => {
      if (withRefresh) setRefreshing(true);
      else setLoading(true);

      setError('');

      try {

        const [workshiftRes, staffWorkRes, workingRes, sumShiftRes, sumTimeRes, nextSevenRes] = await Promise.allSettled([
          staffAPI.getWorkshift(),
          staffAPI.getStaffWorkToday(),
          staffAPI.getWorkingToday(),
          staffAPI.getSumWorkshiftThisMonth(),
          staffAPI.getSumTimeworkThisMonth(),
          staffAPI.getNextSevenDays(ROLE_TO_POSITION.all),
        ]);

        // Log chi tiết response API getWorkshift
        if (process.env.NODE_ENV !== 'production') {
          console.log('[DEBUG] workshiftRes:', workshiftRes);
          if (workshiftRes.status === 'fulfilled') {
            console.log('[DEBUG] workshiftRes.value:', workshiftRes.value);
          } else {
            console.error('[ERROR] workshiftRes:', workshiftRes.reason);
          }
        }
        const workshiftItems = workshiftRes.status === 'fulfilled' ? unwrapResponse(workshiftRes.value) : [];
        if (process.env.NODE_ENV !== 'production') {
          console.log('[DEBUG] workshiftItems (raw):', workshiftItems);
        }
        const mappedWorkshifts = workshiftItems.map(mapWorkshiftToUI).filter((x) => x.id != null);
        if (process.env.NODE_ENV !== 'production') {
          console.log('[DEBUG] mappedWorkshifts:', mappedWorkshifts);
          if (mappedWorkshifts.length === 0) {
            console.warn('[WARNING] Không có ca làm việc nào sau khi map!');
          }
        }
        setWorkshifts(mappedWorkshifts);

        const workingItemsA = staffWorkRes.status === 'fulfilled' ? unwrapResponse(staffWorkRes.value) : [];
        let workingItemsB = workingRes.status === 'fulfilled' ? unwrapResponse(workingRes.value) : [];
        // Đảm bảo workingItemsB là mảng
        if (!Array.isArray(workingItemsB)) workingItemsB = [];
        const workingMapped = [...(Array.isArray(workingItemsA) ? workingItemsA : []), ...workingItemsB]
          .map(mapStaffToUI)
          .filter((x) => x.id != null && !x.isManager);
        const uniqueWorking = [];
        const seenWorking = new Set();
        workingMapped.forEach((item) => {
          if (seenWorking.has(item.id)) return;
          seenWorking.add(item.id);
          uniqueWorking.push({ ...item, isWorking: true });
        });
        setCurrentlyWorking(uniqueWorking);

        const totalWorkShift = Number(sumShiftRes.status === 'fulfilled' ? sumShiftRes.value?.data?.data ?? sumShiftRes.value?.data ?? 0 : 0);
        const totalHours = Number(sumTimeRes.status === 'fulfilled' ? sumTimeRes.value?.data?.data ?? sumTimeRes.value?.data ?? 0 : 0);
        setStats({
          totalWorkShift: Number.isFinite(totalWorkShift) ? totalWorkShift : 0,
          totalHours: Number.isFinite(totalHours) ? totalHours : 0,
        });

        // Lấy dateRange từ API (nếu có), fallback sang getWeekDatesFromRange với hôm nay
        let dateRange = [];
        if (nextSevenRes.status === 'fulfilled') {
          const data = unwrapResponse(nextSevenRes.value);
          if (data.dateRange && Array.isArray(data.dateRange)) {
            dateRange = data.dateRange;
          }
        }
        if (!dateRange.length) {
          // fallback: lấy 7 ngày từ hôm nay
          const today = new Date();
          for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dateRange.push(d.toISOString().split('T')[0]);
          }
        }

        await fetchSchedule(uniqueWorking, dateRange);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu nhân sự.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [fetchSchedule]);



    // Khi ở tab 'schedule', chỉ gọi fetchPageData (lấy dữ liệu ca làm việc, nhân viên đang làm)
    useEffect(() => {
      if (activeTab === 'schedule') {
        fetchPageData(selectedDepartment);
      }
    }, [fetchPageData, selectedDepartment, activeTab]);

    // Khi ở tab 'list', chỉ gọi getAllStaff để lấy toàn bộ nhân viên
    useEffect(() => {
      if (activeTab === 'list') {
        setLoading(true);
        setError('');
        getAllStaff()
          .then((res) => {
            const data = unwrapResponse(res) || [];
            setEmployees(data.map(mapStaffToUI));
          })
          .catch((err) => {
            setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách nhân viên.');
            setEmployees([]);
          })
          .finally(() => setLoading(false));
      }
    }, [activeTab]);

    const employeeMap = useMemo(() => {
      const map = new Map();
      employees.forEach((emp) => {
        if (emp?.id != null) map.set(emp.id, emp);
      });
      return map;
    }, [employees]);

    const filteredEmployees = useMemo(() => {
      return employees.filter((emp) => {
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch = !q
          || emp.name.toLowerCase().includes(q)
          || (emp.email?.toLowerCase().includes(q))
          || (emp.phone?.toLowerCase().includes(q));
        return matchesSearch && roleMatch(emp.role, selectedDepartment);
      });
    }, [employees, searchQuery, selectedDepartment]);

    const getRoleColorClass = (color) => {
      const colors = {
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      };
      return colors[color] || colors.blue;
    };

    const renderEmployeeAvatar = (employeeId) => {
      // Log debug chi tiết khi render avatar
      console.log('[RENDER AVATAR]', { employeeId, employeeMap, employee: employeeMap.get(employeeId) });
      const employee = employeeMap.get(employeeId);
      if (!employee) return null;

      return (
        <div
          key={employeeId}
          className="staff-avatar"
          title={employee.name}
          onClick={() => {
            setSelectedEmployee(employee);
            setShowDetailModal(true);
          }}
        >
          <img
            src={employee.avatar}
            alt={employee.name}
            onError={e => {
              if (!e.target.src.includes('default-avatar.png')) {
                e.target.onerror = null;
                e.target.src = '/images/default-avatar.png';
              }
            }}
          />
        </div>
      );
    };

    const handleCreateAssignment = async ({ userId, shiftId, workDay, note }) => {
      setSubmitting(true);
      try {
        console.log('[DEBUG][handleCreateAssignment] Tạo ca:', { userId, shiftId, workDay, note });
        const res = await staffAPI.createWorkStaff({ userId, shiftId, workDay, note });
        console.log('[DEBUG][handleCreateAssignment] Kết quả API:', res);
        setShowAssignModal(false);
        await fetchPageData(selectedDepartment, true);
        console.log('[DEBUG][handleCreateAssignment] Đã reload dữ liệu sau khi tạo ca');
      } catch (err) {
        // Kiểm tra lỗi 409 (Conflict - trùng ca)
        if (err?.response?.status === 409) {
          setError('Nhân viên này đã có ca làm việc vào thời gian này!');
        } else {
          setError(err?.response?.data?.message || err?.message || 'Không thể tạo ca làm việc.');
        }
        console.error('[DEBUG][handleCreateAssignment] Lỗi:', err);
      } finally {
        setSubmitting(false);
      }
    };

    const handleUpdateShift = async (workStaffId, payload) => {
      if (!workStaffId) return;
      setProcessingDetail(true);
      try {
        await staffAPI.updateWorkStaff(workStaffId, payload);
        setShowDetailModal(false);
        setSelectedEmployee(null);
        await fetchPageData(selectedDepartment, true);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Không thể cập nhật ca làm việc.');
      } finally {
        setProcessingDetail(false);
      }
    };

    const handleDeleteShift = async (workStaffId) => {
      if (!workStaffId) return;
      setProcessingDetail(true);
      try {
        await staffAPI.deleteWorkStaff(workStaffId);
        setShowDetailModal(false);
        setSelectedEmployee(null);
        await fetchPageData(selectedDepartment, true);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Không thể xóa ca làm việc.');
      } finally {
        setProcessingDetail(false);
      }
    };

    // Lấy danh sách bàn khi mount trang (chỉ gọi 1 lần, không ảnh hưởng logic khác)
    useEffect(() => {
      getTables()
        .then(setTables)
        .catch((err) => {
          // Có thể log hoặc hiển thị lỗi nếu cần
          console.error('Lỗi lấy danh sách bàn:', err);
        });
    }, []);

    return (
      <div className="staff-page-container">
        <div className="staff-header">
          <div className="staff-header-content">
            <div className="staff-header-text">
              <h2>{activeTab === 'schedule' ? 'Quản lý Nhân sự & Phân ca' : 'Danh sách nhân viên'}</h2>
              <p>{activeTab === 'schedule'
                ? 'Theo dõi và sắp xếp lịch làm việc hàng tuần cho nhân viên'
                : 'Quản lý thông tin và hiệu suất làm việc của đội ngũ nhân sự'}</p>
            </div>

            <div className="staff-header-actions">
              
              {activeTab === 'list' && (
                <button className="btn-secondary" type="button">
                  <FileDown size={20} />
                  Xuất báo cáo
                </button>
              )}
              {activeTab === 'schedule' && (
                <button className="btn-primary" onClick={() => setShowAssignModal(true)}>
                  <CalendarPlus size={20} />
                  Tạo ca làm việc
                </button>
              )}
            </div>
          </div>

          <div className="staff-filters">
            <div className="department-filters">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  className={`filter-btn ${selectedDepartment === dept ? 'active' : ''}`}
                  onClick={() => setSelectedDepartment(dept)}
                >
                  {DEPARTMENT_LABELS[dept]}
                </button>
              ))}
            </div>

            {activeTab === 'list' && (
              <div className="search-box">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhân viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            )}

            <div className="staff-tabs">
              <button className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
                Lịch làm việc
              </button>
              <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
                Danh sách nhân viên
              </button>
            </div>
          </div>
        </div>

        {!!error && (
          <div style={{ margin: '16px 32px 0', padding: 12, borderRadius: 10, background: '#fff1f2', color: '#9f1239', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: 60 }}>
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : (
          <div className="staff-main-content">
            {activeTab === 'schedule' ? (
              <>
                <div className="staff-planner">
                  <div className="planner-card">
                    <div className="week-header">
                      <div className="week-cell"></div>
                      {weekSchedule.map((day) => (
                        <div key={day.key} className={`week-day-cell ${day.highlight ? 'today' : ''}`}>
                          <p className="day-name">{day.day}</p>
                          <p className="day-date">{day.date}</p>
                        </div>
                      ))}
                    </div>

                    {/* Lọc nhân viên theo vai trò cho từng ca */}
                    <div className="shift-row">
                      <div className="shift-label">
                        <Sun className="shift-icon morning" size={24} />
                        <p className="shift-name">Sáng</p>
                        <p className="shift-time">06:00 - 12:00</p>
                      </div>
                      {weekSchedule.map((day, dayIdx) => (
                        <div key={`morning-${day.key}`} className={`shift-cell ${day.highlight ? 'today' : ''}`}>
                          {(scheduleData.morning?.[dayIdx] || [])
                            .filter((empId) => {
                              if (selectedDepartment === 'all') return true;
                              const emp = employees.find(e => e.id === empId);
                              if (!emp) return false;
                              if (selectedDepartment === 'kitchen') return emp.role === 'Đầu bếp';
                              if (selectedDepartment === 'service') return emp.role === 'Phục vụ';
                              return true;
                            })
                            .map((empId) => renderEmployeeAvatar(empId))}
                          <button className="add-employee-btn" onClick={() => setShowAssignModal(true)}>
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="shift-row">
                      <div className="shift-label">
                        <Sunset className="shift-icon afternoon" size={24} />
                        <p className="shift-name">Chiều</p>
                        <p className="shift-time">12:00 - 18:00</p>
                      </div>
                      {weekSchedule.map((day, dayIdx) => (
                        <div key={`afternoon-${day.key}`} className={`shift-cell ${day.highlight ? 'today' : ''}`}>
                          {(scheduleData.afternoon?.[dayIdx] || [])
                            .filter((empId) => {
                              if (selectedDepartment === 'all') return true;
                              const emp = employees.find(e => e.id === empId);
                              if (!emp) return false;
                              if (selectedDepartment === 'kitchen') return emp.role === 'Đầu bếp';
                              if (selectedDepartment === 'service') return emp.role === 'Phục vụ';
                              return true;
                            })
                            .map((empId) => renderEmployeeAvatar(empId))}
                          <button className="add-employee-btn" onClick={() => setShowAssignModal(true)}>
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="shift-row">
                      <div className="shift-label">
                        <Moon className="shift-icon evening" size={24} />
                        <p className="shift-name">Tối</p>
                        <p className="shift-time">18:00 - 23:00</p>
                      </div>
                      {weekSchedule.map((day, dayIdx) => (
                        <div key={`evening-${weekSchedule[dayIdx].key}`} className={`shift-cell ${weekSchedule[dayIdx].highlight ? 'today' : ''}`}>
                          {(scheduleData.evening?.[dayIdx] || [])
                            .filter((empId) => {
                              if (selectedDepartment === 'all') return true;
                              const emp = employees.find(e => e.id === empId);
                              if (!emp) return false;
                              if (selectedDepartment === 'kitchen') return emp.role === 'Đầu bếp';
                              if (selectedDepartment === 'service') return emp.role === 'Phục vụ';
                              return true;
                            })
                            .map((empId) => renderEmployeeAvatar(empId))}
                          <button className="add-employee-btn" onClick={() => setShowAssignModal(true)}>
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="staff-sidebar">
                  <div className="sidebar-card">
                    <h3 className="sidebar-title">Nhân viên đang làm việc</h3>
                    <div className="working-staff-list">
                      {currentlyWorking.slice(0, 8).map((staff) => (
                        <div key={staff.id} className="working-staff-item">
                          <div className="staff-avatar-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <img
                              src={staff.avatar}
                              alt={staff.name}
                              className="staff-avatar-img"
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #e5e7eb',
                                background: '#f3f4f6',
                                boxShadow: '0 1px 4px 0 #0001',
                                display: 'block',
                              }}
                              onError={e => {
                                if (!e.target.src.includes('default-avatar.png')) {
                                  e.target.onerror = null;
                                  e.target.src = '/images/default-avatar.png';
                                }
                              }}
                            />
                            <div className="online-indicator" style={{ left: 32, bottom: 6, width: 10, height: 10, border: '2px solid #fff' }}></div>
                          </div>
                          <div className="staff-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p className="staff-name" style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{typeof staff.name === 'string' ? staff.name : (staff.name?.toString?.() || '---')}</p>
                            <p className="staff-details" style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{staff.role} {staff.location ? `• ${staff.location}` : ''}</p>
                          </div>
                          <span className="staff-time">{staff.startTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="sidebar-card rating-card">
                    <h3 className="sidebar-title">Đánh giá trung bình</h3>
                    <div className="rating-display">
                      <span className="rating-number">4.8</span>
                      <div className="rating-stars">
                        <div className="stars">
                          <Star size={16} fill="#fbbf24" color="#fbbf24" />
                          <Star size={16} fill="#fbbf24" color="#fbbf24" />
                          <Star size={16} fill="#fbbf24" color="#fbbf24" />
                          <Star size={16} fill="#fbbf24" color="#fbbf24" />
                          <Star size={16} fill="#fbbf24" color="#fbbf24" />
                        </div>
                        <p className="reviews-count">Dựa trên 150 đánh giá</p>
                      </div>
                    </div>
                  </div>

                  <div className="sidebar-card status-card">
                    <div className="status-header">
                      <CheckCircle className="status-icon" size={24} />
                      <p className="status-label">THỐNG KÊ THÁNG</p>
                    </div>
                    <p className="status-text">Tổng ca làm đã phân: {stats.totalWorkShift}</p>
                    <p className="status-subtext">Tổng giờ làm đã ghi nhận: {stats.totalHours}</p>
                  </div>
                </aside>
              </>
            ) : (
              <div className="employee-list-container">
                <div className="employee-table-card">
                  <table className="employee-table">
                    <thead>
                      <tr>
                        <th style={{color: '#fff'}}>Ảnh đại diện & Họ tên</th>
                        <th style={{color: '#fff'}}>Vai trò</th>
                        <th style={{color: '#fff'}}>Số điện thoại</th>
                        <th style={{color: '#fff'}}>Ngày vào làm</th>
                        <th className="text-center" style={{color: '#fff'}}>Đánh giá</th>
                        <th className="text-right" style={{color: '#fff'}}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((employee) => (
                        <tr key={employee.id}>
                          <td>
                            <div className="employee-info">
                              <div className="employee-avatar-wrapper">
                                <img
                                  src={employee.avatar}
                                  alt={employee.name}
                                  onError={e => {
                                    if (!e.target.src.includes('default-avatar.png')) {
                                      e.target.onerror = null;
                                      e.target.src = '/images/default-avatar.png';
                                    }
                                  }}
                                />
                              </div>
                              <div className="employee-details">
                                <span className="employee-name">{typeof employee.name === 'string' ? employee.name : (employee.name?.toString?.() || '---')}</span>
                                <span className="employee-email">{typeof employee.email === 'string' ? employee.email : (employee.email?.toString?.() || '---')}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge ${getRoleColorClass(employee.roleColor)}`}>
                              {employee.role}
                            </span>
                          </td>
                          <td className="text-slate-600 dark:text-slate-400 font-medium">{typeof employee.phone === 'string' ? employee.phone : (employee.phone?.toString?.() || '---')}</td>
                          <td className="text-slate-600 dark:text-slate-400">{employee.joinDate}</td>
                          <td>
                            <div className="rating-cell">
                              <span className="rating-value">{(typeof employee.rating === 'number' ? employee.rating : 0).toFixed(1)}</span>
                              <Star size={16} fill="#fbbf24" color="#fbbf24" />
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="detail-btn"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowDetailModal(true);
                                }}
                              >
                                Chi tiết
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="table-footer">
                    <p className="pagination-info">
                      Hiển thị {filteredEmployees.length} trên tổng số {employees.length} nhân viên
                    </p>
                    <div className="pagination-buttons">
                      <button className="pagination-btn" type="button">
                        <ChevronLeft size={18} />
                      </button>
                      <button className="pagination-btn active" type="button">1</button>
                      <button className="pagination-btn" type="button">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {showAssignModal && (
          <AssignShiftModal
            onClose={() => setShowAssignModal(false)}
            employees={employees}
            workshifts={workshifts}
            submitting={submitting}
            onConfirm={handleCreateAssignment}
          />
        )}

        {showDetailModal && selectedEmployee && (
          <ShiftDetailModal
            employee={selectedEmployee}
            replacementCandidates={employees}
            processing={processingDetail}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedEmployee(null);
            }}
            onUpdate={handleUpdateShift}
            onDelete={handleDeleteShift}
          />
        )}
      </div>
    );
  };

  const AssignShiftModal = ({ onClose, employees, workshifts, submitting, onConfirm }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedShiftId, setSelectedShiftId] = useState(workshifts[0]?.id ? String(workshifts[0].id) : '');
    const [workDay, setWorkDay] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');

    useEffect(() => {
      if (!selectedShiftId && workshifts[0]?.id) {
        setSelectedShiftId(String(workshifts[0].id));
      }
      // Log workshifts để debug
      if (process.env.NODE_ENV !== 'production') {
        console.log('[DEBUG] workshifts:', workshifts);
      }
    }, [selectedShiftId, workshifts]);

    const submit = async () => {
      if (!selectedEmployeeId || !selectedShiftId || !workDay) return;
      await onConfirm({
        userId: Number(selectedEmployeeId),
        shiftId: Number(selectedShiftId),
        workDay,
        note,
      });
    };

    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-wrapper">
              <Calendar className="text-primary" size={24} />
              <h2>Phân công ca làm việc</h2>
            </div>
            <button onClick={onClose} className="modal-close-btn" type="button">
              <X size={24} />
            </button>
          </div>

          <div className="modal-content">
            <div className="form-group">
              <label>Chọn nhân viên</label>
              <div className="select-wrapper">
                <Search className="select-icon" size={20} />
                <select className="form-select" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                  <option value="">Tìm kiếm nhân viên theo tên...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.role}
                    </option>
                  ))}
                </select>
                <ChevronRight className="select-arrow" size={20} />
              </div>
            </div>

            <div className="form-group">
              <label>Chọn ngày làm việc</label>
              <input type="date" className="form-input" value={workDay} onChange={(e) => setWorkDay(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Chọn ca làm việc</label>
              <div className="select-wrapper">
                <Clock className="select-icon" size={20} />
                <select className="form-select" value={selectedShiftId} onChange={(e) => setSelectedShiftId(e.target.value)}>
                  <option value="">Chọn ca làm</option>
                  {workshifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name}
                    </option>
                  ))}
                </select>
                <ChevronRight className="select-arrow" size={20} />
              </div>
              {workshifts.length === 0 && (
                <div style={{ color: '#dc2626', marginTop: 8, fontSize: 14 }}>
                  Không có ca làm việc nào, vui lòng kiểm tra lại dữ liệu ca làm!
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Ghi chú</label>
              <textarea
                className="form-textarea"
                placeholder="Nhập ghi chú thêm cho nhân viên (ví dụ: khu vực bàn 1-10, trực quầy bar...)"
                rows="4"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="btn-cancel" type="button" disabled={submitting}>
              Hủy bỏ
            </button>
            <button
              className="btn-confirm"
              type="button"
              disabled={submitting || !selectedEmployeeId || !selectedShiftId || !workDay}
              onClick={submit}
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              Xác nhận phân ca
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ShiftDetailModal = ({ employee, replacementCandidates, onClose, onUpdate, onDelete, processing }) => {
    const [replaceUserId, setReplaceUserId] = useState('');
    const [checkInTime, setCheckInTime] = useState('');
    const [checkOutTime, setCheckOutTime] = useState('');
    const [isWorking, setIsWorking] = useState(Boolean(employee.isWorking));
    const [note, setNote] = useState('');

    const canMutate = employee.workStaffId != null;

    const update = async () => {
      if (!canMutate) return;

      await onUpdate(employee.workStaffId, {
        replaceUserId: replaceUserId ? Number(replaceUserId) : null,
        checkInTime: checkInTime ? new Date(checkInTime).toISOString() : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime).toISOString() : null,
        isWorking,
        note: note || null,
      });
    };

    const remove = async () => {
      if (!canMutate) return;
      await onDelete(employee.workStaffId);
    };

    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-container modal-detail" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Chi tiết ca làm việc</h2>
            <button onClick={onClose} className="modal-close-btn" type="button">
              <X size={24} />
            </button>
          </div>

          <div className="modal-content">
            <div className="employee-profile">
              <div className="employee-profile-avatar">
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  onError={e => {
                    if (!e.target.src.includes('default-avatar.png')) {
                      e.target.onerror = null;
                      e.target.src = '/images/default-avatar.png';
                    }
                  }}
                />
                {isWorking && <div className="online-badge"></div>}
              </div>
              <div className="employee-profile-info">
                <p className="employee-profile-name">{employee.name}</p>
                <div className="employee-profile-role">
                  <MapPin size={16} />
                  <p>{employee.role.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {!canMutate && (
              <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: '#fff7ed', color: '#9a3412' }}>
                Chưa có mã ca làm việc nên chỉ xem được thông tin nhân viên.
              </div>
            )}

            <div className="form-group">
              <label>Thay thế nhân viên</label>
              <div className="select-wrapper">
                <Search className="select-icon" size={20} />
                <select className="form-select" value={replaceUserId} onChange={(e) => setReplaceUserId(e.target.value)}>
                  <option value="">Chọn nhân viên thay thế...</option>
                  {replacementCandidates.filter((emp) => emp.id !== employee.id).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.role}
                    </option>
                  ))}
                </select>
                <ChevronRight className="select-arrow" size={20} />
              </div>
            </div>

            <div className="time-group">
              <div className="form-group">
                <label>Giờ check-in</label>
                <input type="datetime-local" className="form-input" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Giờ check-out</label>
                <input type="datetime-local" className="form-input" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
              </div>
            </div>

            <div className="total-hours-card">
              <div className="total-hours-info">
                <Clock className="text-primary" size={24} />
                <p className="total-hours-label">Ghi chú ca làm</p>
              </div>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Thêm ghi chú cho ca làm việc"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              ></textarea>
            </div>

            <div className="status-toggle-card">
              <div className="status-toggle-info">
                <div className="status-toggle-header">
                  <CheckCircle className="text-green-500" size={20} />
                  <p className="status-toggle-title">Trạng thái hiện tại</p>
                </div>
                <p className="status-toggle-text">
                  {isWorking ? 'Nhân viên đang làm việc' : 'Nhân viên không làm việc'}
                </p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={isWorking} onChange={(e) => setIsWorking(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="detail-actions">
              <button className="btn-save" type="button" disabled={!canMutate || processing} onClick={update}>
                {processing ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Cập nhật ca làm
              </button>
              <button className="btn-delete" type="button" disabled={!canMutate || processing} onClick={remove}>
                <Trash2 size={20} />
                Xóa ca
              </button>
            </div>
          </div>

          <div className="modal-footer-brand">
            <p>QUẢN LÝ NHÂN SỰ • RESTAURANT PRO</p>
          </div>
        </div>
      </div>
    );
  };

  export default ManagerStaffPage;
