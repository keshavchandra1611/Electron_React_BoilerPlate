import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SerialMessageTypeInterface } from '../../../SDK/serial-commands.enum';
import { showPopup } from '../../Components/global/BubblePopup/PopupManager';
import { getAvatarByGenderAndRoll } from '../../assets/Images/ChildrenImages/Children';

interface Student {
  name: string;
  rollNumber: string;
  gender: string;
  clickerMacId: string | null;
}

const STUDENTS_KEY = 'students';

const MOCK_STUDENTS: Student[] = Array.from({ length: 30 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');
  return {
    name: `Student ${number}`,
    rollNumber: `R${number}`,
    gender: 'Other',
    clickerMacId: null,
  };
});

export default function ClickerPage() {
  const navigate = useNavigate();
  const [pairingEnabled, setPairingEnabled] = useState(false);
  const pairingModeRef = useRef<boolean>(false);
  const [isConnected, setIsConnected] = useState(false);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [targetOption, setTargetOption] = useState<string>('C');
  const [lastData, setLastData] = useState<any>(null);
  const [lastClickerData, setLastClickerData] = useState<any>(null);

  // Student management
  const [students, setStudents] = useState<Student[]>([]);
  const studentsRef = useRef<Student[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [gender, setGender] = useState('Male');

  // Which student (rollNumber) is currently being paired
  const [pairingStudentRoll, setPairingStudentRoll] = useState<string | null>(
    null,
  );
  const pairingStudentRef = useRef<string | null>(null);

  const sessionPairedIdsRef = useRef<Set<string>>(new Set());
  const pendingPairRef = useRef<Set<string>>(new Set());

  // Transiently highlights the student tile whose clicker just responded (idle)
  const [activeClickerId, setActiveClickerId] = useState<string | null>(null);
  const activeClickerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Attendance: students press any clicker button to mark themselves present.
  const [attendanceActive, setAttendanceActive] = useState(false);
  const attendanceActiveRef = useRef(false);
  const [presentRolls, setPresentRolls] = useState<Set<string>>(new Set());
  const presentRollsRef = useRef<Set<string>>(new Set());

  // REF to track the latest visible target
  const targetOptionRef = useRef<string>(targetOption);

  // Scrollable roster: show a bottom inner shadow while more content sits below.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollShadow, setShowScrollShadow] = useState(false);
  const updateScrollShadow = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollShadow(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  };

  const optionMapping: Record<number, string> = {
    1: 'A',
    2: 'B',
    3: 'C',
    4: 'D',
    5: 'Hand',
    6: 'Yes',
    7: 'No',
  };

  // Keep refs in sync
  useEffect(() => {
    targetOptionRef.current = targetOption;
  }, [targetOption]);

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  // Recompute the bottom scroll shadow whenever the roster changes or resizes.
  useEffect(() => {
    updateScrollShadow();
    window.addEventListener('resize', updateScrollShadow);
    return () => window.removeEventListener('resize', updateScrollShadow);
  }, [students]);

  // Load students from electron store on mount
  useEffect(() => {
    const stored = window.electron.electronStore.get(STUDENTS_KEY);
    if (Array.isArray(stored)) {
      setStudents(stored);
    }
  }, []);

  // Persist helper: updates state + electron store together
  const persistStudents = (list: Student[]) => {
    setStudents(list);
    studentsRef.current = list;
    window.electron.electronStore.set(STUDENTS_KEY, list);
  };

  // Buttons a student can be asked to press to pair. Picked at random each time
  // so pairing doesn't always use the same key (previously always 'C').
  const PAIR_BUTTONS = ['A', 'B', 'C', 'D', 'Hand', 'Yes', 'No'];
  const pickPairButton = () =>
    PAIR_BUTTONS[Math.floor(Math.random() * PAIR_BUTTONS.length)];

  // Convert target letter to number
  function getOptionNumber(letter: string): number | undefined {
    const entry = Object.entries(optionMapping).find(
      ([_, value]) => value === letter,
    );
    return entry ? Number(entry[0]) : undefined;
  }

  // Open/Close SDK dynamically
  const toggleOpen = () => {
    if (isConnected) {
      window.electron.clickerSDK.close();
    } else {
      window.electron.clickerSDK.open();
    }
  };

  // ===== Student handlers =====
  const handleAddStudent = () => {
    const trimmedName = name.trim();
    const trimmedRoll = rollNumber.trim();

    if (!trimmedName || !trimmedRoll) {
      toast.error('Please fill Name and Roll Number.');
      return;
    }

    const duplicate = students.some(
      (s) => s.rollNumber.toLowerCase() === trimmedRoll.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`Roll number "${trimmedRoll}" already exists.`);
      return;
    }

    const newStudent: Student = {
      name: trimmedName,
      rollNumber: trimmedRoll,
      gender,
      clickerMacId: null,
    };

    persistStudents([...students, newStudent]);
    toast.success(`Student "${trimmedName}" added.`);

    setName('');
    setRollNumber('');
    setGender('Male');
    setShowAddForm(false);
  };

  // Remove the clicker assignment from a student (moves them to "Not paired").
  const handleUnpairStudent = (roll: string) => {
    const updated = studentsRef.current.map((s) =>
      s.rollNumber === roll ? { ...s, clickerMacId: null } : s,
    );
    persistStudents(updated);
    toast.info('Clicker unpaired.');
  };

  const handleDeleteStudent = (roll: string) => {
    // If the deleted student was mid-pairing, stop it
    if (pairingStudentRef.current === roll) {
      stopPairing();
    }
    persistStudents(students.filter((s) => s.rollNumber !== roll));
    toast.info('Student deleted.');
  };

  const handleLoadMockStudents = () => {
    persistStudents(MOCK_STUDENTS);
    toast.success('Loaded 30 mock students.');
  };

  const handleClearAllStudents = () => {
    persistStudents([]);
    toast.info('All students deleted.');
  };

  // ===== Attendance =====
  const startAttendance = () => {
    if (!isConnected) {
      toast.error('Connect the receiver before taking attendance.');
      return;
    }
    if (pairingEnabled) stopPairing();
    presentRollsRef.current = new Set();
    setPresentRolls(new Set());
    attendanceActiveRef.current = true;
    setAttendanceActive(true);
    window.electron.clickerSDK.write(SerialMessageTypeInterface.START_POLL);
    toast.info('Attendance started. Students raise their hand on the clicker.');
  };

  const stopAttendance = () => {
    attendanceActiveRef.current = false;
    setAttendanceActive(false);
    const present = presentRollsRef.current.size;
    toast.success(`Attendance finished. ${present} marked present.`);
  };

  // Manually flip a student's present/absent status (tap the P/A badge).
  const togglePresent = (roll: string) => {
    const next = new Set(presentRollsRef.current);
    if (next.has(roll)) next.delete(roll);
    else next.add(roll);
    presentRollsRef.current = next;
    setPresentRolls(next);
  };

  const stopPairing = () => {
    if (pairingModeRef.current) {
      window.electron.clickerSDK.write(SerialMessageTypeInterface.END_PAIR);
    }
    pairingModeRef.current = false;
    pairingStudentRef.current = null;
    setPairingStudentRoll(null);
    setPairingEnabled(false);
    sessionPairedIdsRef.current.clear();
    pendingPairRef.current.clear();
    setTargetOption('C');
  };

  // Start pairing flow for a specific student
  const startPairingForStudent = (roll: string) => {
    if (!isConnected) {
      toast.error('Cannot start pairing: Receiver is not connected!');
      return;
    }

    pairingStudentRef.current = roll;
    setPairingStudentRoll(roll);
    sessionPairedIdsRef.current.clear();
    pendingPairRef.current.clear();

    if (!pairingModeRef.current) {
      window.electron.clickerSDK.write(SerialMessageTypeInterface.START_PAIR);
      pairingModeRef.current = true;
      setPairingEnabled(true);
    }
    // Random target button (not always 'C'). Set the ref now too so the very
    // first clicker press is matched against the freshly-picked button.
    const target = pickPairButton();
    targetOptionRef.current = target;
    setTargetOption(target);
    toast.info(`Pairing started. Press "${target}" on the clicker to pair.`);
  };

  useEffect(() => {
    window.electron.clickerSDK.subscribeEvents((data) => {
      console.log('Event Data:', data);

      if (data.type === 'opened') {
        setIsConnected(true);
        toast.success('Receiver Connected!');
        setLastError(null);
      } else if (data.type === 'closed') {
        setIsConnected(false);
        setReceiverId(null);
        setPairingEnabled(false);
        pairingModeRef.current = false;
        pairingStudentRef.current = null;
        setPairingStudentRoll(null);
        sessionPairedIdsRef.current.clear();
        pendingPairRef.current.clear();
        setTargetOption('C');
        attendanceActiveRef.current = false;
        setAttendanceActive(false);
        toast.error('Receiver Unplugged! Stopping pairing.');
        setLastData(null);
        setLastClickerData(null);
      } else if (data.type === 'data') {
        if (data.payload.clickerId && !data.payload.receiverId) {
          setLastClickerData(data.payload);
        } else {
          setLastData(data.payload);
        }

        // Ignore the placeholder/broadcast receiver id — keep the last real one.
        const incomingReceiverId = data.payload?.receiverId;
        if (incomingReceiverId && incomingReceiverId !== 'FE:00:00:00:00:01') {
          setReceiverId(incomingReceiverId || null);
        }

        const { clickerId, selectedOption, success } = data.payload;

        if (!clickerId) return;

        if (activeClickerTimeoutRef.current) {
          clearTimeout(activeClickerTimeoutRef.current);
        }
        setActiveClickerId(clickerId);
        activeClickerTimeoutRef.current = setTimeout(() => {
          setActiveClickerId(null);
        }, 2500);

        // If this clicker is paired to a known student, celebrate the response
        // with a floating bubble popup alongside the card highlight.
        const respondingStudent = studentsRef.current.find(
          (s) => s.clickerMacId === clickerId,
        );
        if (respondingStudent) {
          showPopup(
            respondingStudent.name,
            String(
              Number(respondingStudent.rollNumber.replace(/\D/g, '')) || 1,
            ),
            respondingStudent.gender,
          );
        }

        // Attendance: a student is marked present only when they raise their
        // hand (press the "Hand" button) on their clicker.
        if (
          attendanceActiveRef.current &&
          respondingStudent &&
          selectedOption === getOptionNumber('Hand')
        ) {
          if (!presentRollsRef.current.has(respondingStudent.rollNumber)) {
            const next = new Set(presentRollsRef.current);
            next.add(respondingStudent.rollNumber);
            presentRollsRef.current = next;
            setPresentRolls(next);
          }
        }

        if (!pairingModeRef.current || !pairingStudentRef.current) {
          return;
        }

        // Handle success/failure after a pairClicker attempt
        if (success !== undefined && pendingPairRef.current.has(clickerId)) {
          pendingPairRef.current.delete(clickerId);
          if (success) {
            sessionPairedIdsRef.current.add(clickerId);
            const roll = pairingStudentRef.current;
            if (roll) {
              const updated = studentsRef.current.map((s) =>
                s.rollNumber === roll ? { ...s, clickerMacId: clickerId } : s,
              );
              persistStudents(updated);
              toast.success(`Clicker ${clickerId} paired to student!`);
              stopPairing();
            }
          } else {
            toast.error(`Clicker ${clickerId} pairing failed. Try again.`);
          }
          return;
        }

        // Attempt to pair the clicker that pressed the target option
        if (
          selectedOption === getOptionNumber(targetOptionRef.current) &&
          !sessionPairedIdsRef.current.has(clickerId)
        ) {
          const assignedStudent = studentsRef.current.find(
            (s) => s.clickerMacId === clickerId,
          );

          if (
            assignedStudent &&
            assignedStudent.rollNumber !== pairingStudentRef.current
          ) {
            toast.error(
              `Clicker ${clickerId} is already paired to student ${assignedStudent.name}.`,
            );
            return;
          }

          window.electron.clickerSDK.pairClicker(clickerId);
          pendingPairRef.current.add(clickerId);
          toast.info(`Attempting to pair Clicker ${clickerId}...`);
        }
      } else if (data.type === 'error') {
        setLastError(data.payload?.message || 'Unknown error');
        // toast.error('SDK Error: ' + (data.payload?.message || 'Unknown error'));
        setLastData(data.payload);
        setLastClickerData(null);
      }
    });

    return () => {
      setIsConnected(false);
      setReceiverId(null);
      setPairingEnabled(false);
      setLastError(null);
      pairingModeRef.current = false;
      pairingStudentRef.current = null;
      sessionPairedIdsRef.current.clear();
      pendingPairRef.current.clear();
      if (activeClickerTimeoutRef.current) {
        clearTimeout(activeClickerTimeoutRef.current);
      }
      window.electron.clickerSDK.unsubscribeEvents();
    };
  }, []);

  useEffect(() => {
    // window.electron.clickerSDK.open();

    // Cleanup on unmount (e.g. when pressing the back button)
    return () => {
      window.electron.clickerSDK.close();
    };
  }, []);

  const avatarColors = [
    '#FF6B6B',
    '#4ECDC4',
    '#FFD93D',
    '#6C5CE7',
    '#FF8C42',
    '#1DD1A1',
    '#54A0FF',
    '#EE5253',
    '#00B894',
    '#E84393',
  ];
  const colorFor = (key: string) =>
    avatarColors[
      [...key].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length
    ];

  const presentCount = students.filter((s) =>
    presentRolls.has(s.rollNumber),
  ).length;
  const absentCount = students.length - presentCount;

  // Segregate the roster into paired and not-paired groups.
  const pairedStudents = students.filter((s) => !!s.clickerMacId);
  const unpairedStudents = students.filter((s) => !s.clickerMacId);

  const renderStudentCard = (s: Student) => {
    const isPaired = !!s.clickerMacId;
    const isPairingThis = pairingStudentRoll === s.rollNumber;
    const isActiveClickerMatch =
      !!s.clickerMacId && activeClickerId === s.clickerMacId;
    const isPresent = presentRolls.has(s.rollNumber);
    return (
      <div
        key={s.rollNumber}
        className={`grid w-full gap-4 rounded-2xl border bg-[#1e293b] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition duration-200 hover:-translate-y-1 hover:border-[#475569] ${
          isPairingThis
            ? 'border-[#38bdf8] shadow-[0_0_0_2px_rgba(56,189,248,0.25)]'
            : isActiveClickerMatch
              ? 'border-[#0ea5e9] shadow-[0_0_0_2px_rgba(14,165,233,0.25)]'
              : isPresent
                ? 'border-[#22c55e]/60 shadow-[0_0_0_2px_rgba(34,197,94,0.18)]'
                : !isPaired
                  ? 'border-[#334155] ring-1 ring-inset ring-[#f43f5e]/25'
                  : 'border-[#334155]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-[#0ea5e9] text-lg font-bold text-white">
              {getAvatarByGenderAndRoll(
                s.gender,
                Number(s.rollNumber.replace(/\D/g, '')) || 1,
              ) ? (
                <img
                  src={getAvatarByGenderAndRoll(
                    s.gender,
                    Number(s.rollNumber.replace(/\D/g, '')) || 1,
                  )}
                  alt={s.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                s.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-[#f1f5f9]">
                {s.name}
              </div>
              <div className="mt-0.5 text-xs text-[#94a3b8]">
                Roll {s.rollNumber}
              </div>
              <div className="mt-0.5 truncate text-xs text-[#38bdf8]">
                MAC: {s.clickerMacId ?? 'Not assigned'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => togglePresent(s.rollNumber)}
            title={
              isPresent
                ? 'Present — tap to mark absent'
                : 'Absent — tap to mark present'
            }
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[15px] font-bold transition-transform hover:scale-110 ${
              isPresent
                ? 'bg-[#22c55e]/15 text-[#4ade80] ring-1 ring-[#22c55e]/50'
                : 'bg-[#f43f5e]/15 text-[#fb7185] ring-1 ring-[#f43f5e]/50'
            }`}
          >
            {isPresent ? 'P' : 'A'}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            className={`flex-1 rounded-full px-4 py-2 text-sm font-bold shadow-sm transition ${
              isPairingThis
                ? 'bg-[#e11d48] text-white hover:bg-[#be123c]'
                : isPaired
                  ? 'border border-[#475569] bg-[#334155]/40 text-[#cbd5e1] hover:bg-[#334155] hover:text-white'
                  : 'bg-[#0ea5e9] text-white hover:bg-[#0284c7]'
            } ${pairingEnabled && !isPairingThis ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={() => {
              if (isPairingThis) {
                stopPairing();
              } else if (isPaired) {
                handleUnpairStudent(s.rollNumber);
              } else {
                startPairingForStudent(s.rollNumber);
              }
            }}
            disabled={pairingEnabled && !isPairingThis}
            title={
              isPairingThis
                ? 'Cancel pairing'
                : isPaired
                  ? 'Unpair this clicker'
                  : 'Pair a clicker to this student'
            }
          >
            {isPairingThis ? 'Cancel' : isPaired ? 'Unpair' : 'Pair'}
          </button>
          <button
            className={`flex-1 rounded-full border border-[#f43f5e]/50 bg-transparent px-4 py-2 text-sm font-bold text-[#fb7185] shadow-sm transition ${
              pairingEnabled
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-[#e11d48] hover:border-[#e11d48] hover:text-white'
            }`}
            onClick={() => handleDeleteStudent(s.rollNumber)}
            disabled={pairingEnabled}
            title="Delete this student"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-[#0f172a] text-[#e2e8f0]"
      style={{
        backgroundImage:
          'radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 34%), radial-gradient(circle at bottom right, rgba(34, 197, 94, 0.08), transparent 30%)',
      }}
    >
      <header className="flex h-[60px] shrink-0 items-center justify-between px-7">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (pairingEnabled) {
                stopPairing();
              }
              navigate(-1);
            }}
            aria-label="Back to lessons"
            title="Back to lessons"
            className="grid h-9 w-9 place-items-center rounded-full border border-[#334155] bg-[#1e293b] text-[16px] text-[#94a3b8] transition-colors hover:bg-[#334155] hover:text-[#f1f5f9]"
          >
            ‹
          </button>
          <p className="text-[19px] font-bold text-[#f1f5f9]">
            Classroom Management
          </p>
        </div>

        <div className="flex items-center gap-5">
          {pairingEnabled && (
            <button
              type="button"
              onClick={stopPairing}
              title="Stop the current pairing session"
              className="rounded-full border border-[#f43f5e]/50 bg-transparent px-4 py-1.5 text-[13px] font-semibold text-[#fb7185] transition-colors hover:bg-[#e11d48] hover:text-white"
            >
              Stop pairing
            </button>
          )}
          <button
            type="button"
            title="Preview the celebration popup animation"
            className="rounded-full border border-[#334155] bg-[#1e293b] px-4 py-1.5 text-[13px] font-medium text-[#cbd5e1] transition-colors hover:bg-[#334155]"
            onClick={async () => {
              for (let i = 0; i < 100; i++) {
                const gender = Math.random() < 0.5 ? 'male' : 'female';

                showPopup(`Student ${i + 1}`, `${i + 1}`, gender);

                await new Promise((resolve) => setTimeout(resolve, 50));
              }
            }}
          >
            Show Popup
          </button>
          <button
            type="button"
            onClick={toggleOpen}
            title={
              isConnected && receiverId
                ? `Receiver ${receiverId}`
                : 'Clicker receiver'
            }
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium text-white shadow-sm transition-colors ${
              isConnected
                ? 'bg-[#334155] hover:bg-[#475569]'
                : 'bg-[#0ea5e9] hover:bg-[#0284c7]'
            }`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: isConnected ? '#4ade80' : '#fda4af',
              }}
            />
            {isConnected
              ? `Disconnect receiver${receiverId ? ` (${receiverId})` : ''}`
              : 'Connect receiver'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-6 px-7 pb-6 pt-2">
        {pairingEnabled && targetOption && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-[#155e75] bg-[#0b2536] px-4 py-3 text-center text-base font-semibold text-[#e2e8f0] shadow-sm">
            Press{' '}
            <span className="inline-block rounded-xl bg-[#0ea5e9] px-3 py-1 text-lg text-white">
              {targetOption}
            </span>{' '}
            on the clicker to pair.
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#334155] bg-[#1e293b] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-2 mb-4 border-b border-[#334155]">
            <div>
              <h2 className="text-2xl font-semibold text-[#f1f5f9]">
                Student management
              </h2>
              <p className="mt-1 text-sm text-[#94a3b8]">
                {students.length} students
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Live present / absent summary */}
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-[#22c55e]/15 px-3 py-2 text-sm font-bold text-[#4ade80] ring-1 ring-[#22c55e]/40">
                  Present {presentCount}
                </span>
                <span className="rounded-full bg-[#f43f5e]/15 px-3 py-2 text-sm font-bold text-[#fb7185] ring-1 ring-[#f43f5e]/40">
                  Absent {absentCount}
                </span>
              </div>

              {attendanceActive ? (
                <button
                  className="flex items-center gap-2 rounded-full bg-[#15803d] px-4 py-2 text-sm font-bold text-white shadow-sm"
                  onClick={stopAttendance}
                  title="Finish attendance"
                >
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Taking attendance…
                </button>
              ) : (
                <button
                  className="rounded-full bg-[#16a34a] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#15803d]"
                  onClick={startAttendance}
                  title="Start taking attendance"
                >
                  Start attendance
                </button>
              )}

              <button
                className="rounded-full border border-[#475569] bg-[#334155]/40 px-4 py-2 text-sm font-bold text-[#cbd5e1] shadow-sm transition hover:bg-[#334155] hover:text-white"
                onClick={handleLoadMockStudents}
                title="Load 30 sample students"
              >
                Add mock
              </button>
              <button
                className="rounded-full border border-[#f43f5e]/50 bg-transparent px-4 py-2 text-sm font-bold text-[#fb7185] shadow-sm transition hover:bg-[#e11d48] hover:border-[#e11d48] hover:text-white"
                onClick={handleClearAllStudents}
                title="Delete all students"
              >
                Delete all
              </button>
              <button
                className="rounded-full bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#0284c7]"
                onClick={() => setShowAddForm((v) => !v)}
                title={showAddForm ? 'Close the add form' : 'Add a new student'}
              >
                {showAddForm ? 'Cancel' : 'Add student'}
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-[24px] border border-[#334155] bg-[#1e293b] p-6 shadow-[0_26px_70px_rgba(0,0,0,0.5)]">
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#334155]">
                  <div>
                    <h3 className="text-xl font-semibold text-[#f1f5f9]">
                      Add Student
                    </h3>
                    <p className="mt-1 text-sm text-[#94a3b8]">
                      Enter student details and save.
                    </p>
                  </div>
                  <button
                    className="rounded-full bg-[#334155] px-4 py-2 text-sm font-semibold text-[#e2e8f0] transition hover:bg-[#475569]"
                    onClick={() => setShowAddForm(false)}
                    title="Close"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-5 grid gap-4">
                  <input
                    className="w-full rounded-[14px] border border-[#334155] bg-[#0f172a] px-4 py-3 text-sm text-[#e2e8f0] outline-none placeholder:text-[#64748b] focus:border-[#0ea5e9]"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="w-full rounded-[14px] border border-[#334155] bg-[#0f172a] px-4 py-3 text-sm text-[#e2e8f0] outline-none placeholder:text-[#64748b] focus:border-[#0ea5e9]"
                    placeholder="Roll number"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                  />
                  <div>
                    <p className="mb-2 text-sm font-semibold text-[#e2e8f0]">
                      Gender
                    </p>
                    <div className="flex gap-3">
                      {['Male', 'Female'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`flex-1 rounded-[14px] border px-4 py-2 text-sm font-semibold transition ${
                            gender === option
                              ? 'border-[#0ea5e9] bg-[#0c2e44] text-[#7dd3fc]'
                              : 'border-[#334155] bg-[#0f172a] text-[#e2e8f0] hover:bg-[#334155]'
                          }`}
                          onClick={() => setGender(option)}
                          title={`Set gender to ${option}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      className="rounded-full bg-[#0ea5e9] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#0284c7]"
                      onClick={handleAddStudent}
                      title="Save student"
                    >
                      Save
                    </button>
                    <button
                      className="rounded-full border border-[#475569] bg-[#334155]/40 px-4 py-2 text-sm font-bold text-[#cbd5e1] shadow-sm transition hover:bg-[#334155] hover:text-white"
                      onClick={() => setShowAddForm(false)}
                      title="Cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollRef}
              onScroll={updateScrollShadow}
              className="h-full overflow-y-auto px-5 pb-5"
            >
              {students.length === 0 ? (
                <div className="text-center py-7 text-[#94a3b8]">
                  <div className="mb-3 text-4xl">📘</div>
                  <p className="text-sm">
                    Add students to pair their clickers.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {pairedStudents.length > 0 && (
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#4ade80]">
                        <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                        Paired ({pairedStudents.length})
                      </h3>
                      <div className="grid w-full gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        {pairedStudents.map(renderStudentCard)}
                      </div>
                    </section>
                  )}
                  {unpairedStudents.length > 0 && (
                    <section>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#fb7185]">
                        <span className="h-2 w-2 rounded-full bg-[#f43f5e]" />
                        Not paired ({unpairedStudents.length})
                      </h3>
                      <div className="grid w-full gap-3 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                        {unpairedStudents.map(renderStudentCard)}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 h-7 shadow-[inset_0_-16px_14px_-12px_rgba(0,0,0,0.7)] transition-opacity duration-200 ${
                showScrollShadow ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        </div>

        {/* Data Received Wala Container */}
        {lastData && (
          <div style={styles.card} className="w-full p-6">
            <h3>Last Data Received:</h3>
            <pre style={styles.pre}>{JSON.stringify(lastData, null, 2)}</pre>
          </div>
        )}
        {lastClickerData && (
          <div style={styles.card} className="w-full p-6">
            <h3>Last Data Received From Clicker:</h3>
            <pre style={styles.pre}>
              {JSON.stringify(lastClickerData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '8px',
    // margin: '0 auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  pre: {
    backgroundColor: '#222',
    color: '#0f0',
    padding: '15px',
    borderRadius: '5px',
    overflowX: 'auto' as const,
    maxHeight: '300px',
  },
};
