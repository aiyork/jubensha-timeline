const { createElement: h, useEffect, useMemo, useState } = React;

const STORAGE_KEY = "murder-mystery-react-board-v2";

const statusOptions = [
  { value: "normal", label: "普通" },
  { value: "suspicious", label: "可疑" },
  { value: "conflict", label: "矛盾" },
  { value: "key", label: "关键证据" },
  { value: "unknown", label: "行踪不明" },
];

// 时间粒度选项配置：下拉框只提供需求指定的这些分钟数。
const stepOptions = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// 人物颜色分配逻辑：使用柔和色板，适合长时间推理查看，并保证文字可读。
const personColors = ["#dbeafe", "#dcfce7", "#fef3c7", "#fae8ff", "#ffe4e6", "#ccfbf1", "#e0e7ff", "#f1f5f9"];

const weaponStatusOptions = ["出现", "被拿走", "被使用", "被隐藏", "被发现", "下落不明"];
const weaponSourceOptions = ["剧本", "搜证卡", "证词", "监控", "尸检", "其他"];

const sampleBoard = {
  timeline: {
    startDate: "2026-06-04",
    start: "18:00",
    endDate: "2026-06-04",
    end: "20:00",
    stepMode: "30",
    customStep: 7,
  },
  people: [
    { id: "person-victim", name: "死者", color: personColors[0] },
    { id: "person-a", name: "A", color: personColors[1] },
    { id: "person-b", name: "B", color: personColors[2] },
    { id: "person-c", name: "C", color: personColors[3] },
  ],
  timeSlots: generateSlots("2026-06-04", "18:00", "2026-06-04", "20:00", 30),
  cells: {
    [cellKey("person-victim", slotIdFromRange("2026-06-04", "18:00", "2026-06-04", "18:30"))]: makeCell({
      location: "书房",
      action: "独自在书房",
      evidence: "管家证词",
      witness: "管家",
      status: "normal",
    }),
    [cellKey("person-victim", slotIdFromRange("2026-06-04", "18:30", "2026-06-04", "19:00"))]: makeCell({
      location: "书房",
      action: "和 A 争吵",
      weapon: "裁纸刀",
      evidence: "B 听到争吵",
      witness: "B",
      suspicion: "争吵内容未知",
      inference: "A 与死者有直接冲突",
      status: "key",
    }),
    [cellKey("person-victim", slotIdFromRange("2026-06-04", "19:00", "2026-06-04", "19:30"))]: makeCell({
      location: "不明",
      action: "失踪",
      evidence: "暂无",
      suspicion: "死亡前关键空白",
      inference: "疑似案发窗口",
      status: "unknown",
    }),
    [cellKey("person-victim", slotIdFromRange("2026-06-04", "19:30", "2026-06-04", "20:00"))]: makeCell({
      location: "书房",
      action: "被发现死亡",
      evidence: "全员到场",
      witness: "A/B/C",
      inference: "死亡结果确认",
      status: "key",
    }),
    [cellKey("person-a", slotIdFromRange("2026-06-04", "18:00", "2026-06-04", "18:30"))]: makeCell({
      location: "客厅",
      action: "声称在喝茶",
      evidence: "本人证词",
      suspicion: "无人证明",
      inference: "有离开客厅的空间",
      status: "suspicious",
    }),
    [cellKey("person-a", slotIdFromRange("2026-06-04", "18:30", "2026-06-04", "19:00"))]: makeCell({
      location: "书房",
      action: "去找死者",
      weapon: "裁纸刀",
      evidence: "本人承认",
      witness: "死者",
      suspicion: "与死者争吵",
      inference: "动机和接触机会同时存在",
      status: "suspicious",
    }),
    [cellKey("person-a", slotIdFromRange("2026-06-04", "19:00", "2026-06-04", "19:30"))]: makeCell({
      location: "房间",
      action: "声称回房",
      evidence: "本人证词",
      conflict: "C 称 19:10 在走廊看到 A",
      inference: "证词冲突，需要追问",
      status: "conflict",
    }),
    [cellKey("person-b", slotIdFromRange("2026-06-04", "18:00", "2026-06-04", "18:30"))]: makeCell({
      location: "厨房",
      action: "准备晚餐",
      evidence: "厨师证词",
      witness: "厨师",
      status: "normal",
    }),
    [cellKey("person-b", slotIdFromRange("2026-06-04", "18:30", "2026-06-04", "19:00"))]: makeCell({
      location: "走廊",
      action: "经过书房外",
      evidence: "本人证词",
      suspicion: "可能听到争吵",
      inference: "掌握关键声音线索",
      status: "suspicious",
    }),
    [cellKey("person-b", slotIdFromRange("2026-06-04", "19:00", "2026-06-04", "19:30"))]: makeCell({
      location: "不明",
      action: "不明",
      evidence: "暂无",
      suspicion: "行踪空白",
      inference: "存在作案窗口",
      status: "unknown",
    }),
    [cellKey("person-c", slotIdFromRange("2026-06-04", "18:00", "2026-06-04", "18:30"))]: makeCell({
      location: "花园",
      action: "修剪花枝",
      evidence: "园丁证词",
      witness: "园丁",
      status: "normal",
    }),
    [cellKey("person-c", slotIdFromRange("2026-06-04", "18:30", "2026-06-04", "19:00"))]: makeCell({
      location: "不明",
      action: "不明",
      suspicion: "无人能说明去向",
      inference: "空白时间明显",
      status: "unknown",
    }),
    [cellKey("person-c", slotIdFromRange("2026-06-04", "19:00", "2026-06-04", "19:30"))]: makeCell({
      location: "厨房",
      action: "取水",
      evidence: "厨师证词",
      witness: "厨师",
      status: "normal",
    }),
  },
  archive: [],
  // 凶器记录的数据结构：独立记录凶器、人物、时间、地点、状态、证据和推论，不依赖表格格子存在。
  weaponRecords: [
    {
      id: "weapon-sample-knife",
      weaponName: "刀",
      personId: "person-a",
      personNameSnapshot: "A",
      startSlotId: slotIdFromRange("2026-06-04", "18:30", "2026-06-04", "19:00"),
      endSlotId: slotIdFromRange("2026-06-04", "18:30", "2026-06-04", "19:00"),
      startText: "18:30",
      endText: "19:00",
      timeText: "18:30-19:00",
      startAbs: dateTimeToAbsoluteMinutes("2026-06-04", "18:30"),
      endAbs: dateTimeToAbsoluteMinutes("2026-06-04", "19:00"),
      location: "厨房",
      status: "被拿走",
      source: "监控",
      note: "A 在案发前接触过可能凶器",
    },
  ],
};

function App() {
  const [board, setBoard] = useState(loadBoard);
  const [timelineDraft, setTimelineDraft] = useState(() => ({ ...loadBoard().timeline }));
  const [newPerson, setNewPerson] = useState("");
  const [selectedCell, setSelectedCell] = useState(null);
  const [dragRange, setDragRange] = useState(null);
  const [tapRangeStart, setTapRangeStart] = useState(null);

  useEffect(() => {
    // localStorage 保存逻辑：board 每次变化都自动写入当前浏览器，包含时间线、人物、格子和凶器记录。
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  const visibleSlots = useMemo(() => board.timeSlots.slice().sort(sortSlots), [board.timeSlots]);
  const selected = selectedCell ? getSelectionContext(board, selectedCell, visibleSlots) : null;
  const insights = useMemo(() => buildInsights(board), [board]);

  function applyTimeline(event) {
    event.preventDefault();
    // 时间颗粒度切换逻辑：预设粒度直接取分钟数；选择“自定义”时读取用户填写的分钟数。
    const step = timelineDraft.stepMode === "custom" ? Number(timelineDraft.customStep) : Number(timelineDraft.stepMode);
    const startAbs = dateTimeToAbsoluteMinutes(timelineDraft.startDate, timelineDraft.start);
    const endAbs = dateTimeToAbsoluteMinutes(timelineDraft.endDate, timelineDraft.end);
    if (!Number.isFinite(startAbs) || !Number.isFinite(endAbs) || !Number.isFinite(step) || step <= 0) {
      window.alert("请填写有效的开始日期、开始时间、结束日期、结束时间和分钟粒度。");
      return;
    }

    // 结束时间早于开始时间的校验逻辑：跨天时比较“日期 + 时间”组合后的绝对分钟数。
    if (endAbs <= startAbs) {
      window.alert("结束日期时间必须晚于开始日期时间。");
      return;
    }

    // 根据最新的开始时间、结束时间和颗粒度，重新生成横向时间轴。
    const nextSlots = generateSlots(timelineDraft.startDate, timelineDraft.start, timelineDraft.endDate, timelineDraft.end, step);
    if (!nextSlots.length) {
      window.alert("无法生成时间轴，请检查日期时间设置。");
      return;
    }

    const changed = JSON.stringify(nextSlots.map((slot) => slot.id)) !== JSON.stringify(board.timeSlots.map((slot) => slot.id));
    if (changed && Object.keys(board.cells).length) {
      const ok = window.confirm("修改时间轴后，相同时间段的内容会保留；无法对应的旧格子会放入待整理内容。继续？");
      if (!ok) return;
    }

    // 修改时间轴后会尝试保留旧格子内容，无法匹配的旧内容会进入“待整理内容”。
    // 凶器记录 localStorage 保存逻辑：凶器时间保留原 timeText，不因时间轴变化被删除。
    setBoard((current) => remapBoardToSlots(current, timelineDraft, nextSlots));
    setSelectedCell(null);
  }

  function addPerson(event) {
    event.preventDefault();
    const name = newPerson.trim();
    if (!name) return;
    setBoard((current) => {
      // 新增人物自动分配颜色逻辑：按当前人物数量取色；颜色写入 person，删除其他人不会改已有颜色。
      const person = { id: createId("person"), name, color: getPersonColor(current.people.length) };
      return { ...current, people: [...current.people, person] };
    });
    setNewPerson("");
  }

  function deletePerson(personId) {
    const person = board.people.find((item) => item.id === personId);
    if (!person) return;
    if (!window.confirm(`删除人物「${person.name}」及其所有时间格内容？`)) return;
    setBoard((current) => ({
      ...current,
      people: current.people.filter((item) => item.id !== personId),
      cells: filterCells(current.cells, (key) => !key.startsWith(`${personId}:`)),
      // 人物删除后凶器记录的保留逻辑：这里只删人物和表格格子，不删除 weaponRecords，显示时会标为“人物已删除”。
      weaponRecords: current.weaponRecords || [],
    }));
    setSelectedCell(null);
  }

  function renamePerson(personId, name) {
    setBoard((current) => ({
      ...current,
      people: current.people.map((person) => (person.id === personId ? { ...person, name } : person)),
    }));
  }

  function updateCell(field, value) {
    if (!selected) return;
    const eventId = selected.cell.eventId || (selected.slots.length > 1 ? createId("event") : "");
    setBoard((current) => ({
      ...current,
      cells: {
        ...current.cells,
        ...Object.fromEntries(
          selected.slots.map((slot) => {
            const key = cellKey(selected.person.id, slot.id);
            return [
              key,
              {
                ...emptyCell(),
                ...current.cells[key],
                ...selected.cell,
                [field]: value,
                // 事件开始时间和结束时间保存逻辑：连续事件块内每个格子都保存完整范围，刷新后还能合并显示。
                eventId,
                eventStart: selected.startSlot.start,
                eventEnd: selected.endSlot.end,
                eventStartLabel: selected.startSlot.label,
                eventEndLabel: selected.endSlot.label,
              },
            ];
          })
        ),
      },
    }));
  }

  function clearCell() {
    if (!selected) return;
    const keys = new Set(selected.slots.map((slot) => cellKey(selected.person.id, slot.id)));
    setBoard((current) => ({ ...current, cells: filterCells(current.cells, (cellId) => !keys.has(cellId)) }));
    setSelectedCell(null);
    setTapRangeStart(null);
  }

  function startRangeSelect(personId, index, pointerType = "mouse") {
    // iPad / 手机触摸选择格子的逻辑：pointer 事件同时支持鼠标、触控板和手指。
    // 触摸端如果拖拽不顺手，可以先点开始格，再点同一人物行的结束格，自动选中中间范围。
    if (pointerType !== "mouse" && tapRangeStart?.personId === personId && tapRangeStart.startIndex !== index) {
      finishTapRange(personId, index);
      return;
    }
    const range = { personId, startIndex: index, endIndex: index, active: true };
    setDragRange(range);
    setSelectedCell(range);
    setTapRangeStart({ personId, startIndex: index });
  }

  function moveRangeSelect(personId, index) {
    if (!dragRange?.active || dragRange.personId !== personId) return;
    setDragRange((current) => ({ ...current, endIndex: index }));
    setSelectedCell((current) => ({ ...current, endIndex: index }));
  }

  function finishRangeSelect(personId, index) {
    if (!dragRange?.active || dragRange.personId !== personId) return;
    const nextRange = normalizeRange({ ...dragRange, endIndex: index, active: false });
    const slots = visibleSlots.slice(nextRange.startIndex, nextRange.endIndex + 1);
    const hasExisting = slots.some((slot) => !isEmptyCell(getCell(board, personId, slot.id)));
    // 覆盖已有内容的判断逻辑：划选多个格子且范围内已有内容时，先让用户确认是否覆盖。
    if (slots.length > 1 && hasExisting && !window.confirm("划选范围内已有内容，是否覆盖原内容？")) {
      setDragRange(null);
      setSelectedCell(null);
      return;
    }
    setDragRange(null);
    setSelectedCell(nextRange);
    setTapRangeStart({ personId, startIndex: nextRange.startIndex });
  }

  function selectRange(personId, startIndex, endIndex) {
    setDragRange(null);
    setSelectedCell(normalizeRange({ personId, startIndex, endIndex, active: false }));
    setTapRangeStart(null);
  }

  function finishTapRange(personId, endIndex) {
    if (!tapRangeStart || tapRangeStart.personId !== personId) return;
    const nextRange = normalizeRange({ personId, startIndex: tapRangeStart.startIndex, endIndex, active: false });
    const slots = visibleSlots.slice(nextRange.startIndex, nextRange.endIndex + 1);
    const hasExisting = slots.some((slot) => !isEmptyCell(getCell(board, personId, slot.id)));
    if (slots.length > 1 && hasExisting && !window.confirm("划选范围内已有内容，是否覆盖原内容？")) {
      setDragRange(null);
      setTapRangeStart(null);
      setSelectedCell(null);
      return;
    }
    setDragRange(null);
    setTapRangeStart(null);
    setSelectedCell(nextRange);
  }

  function changeSelectedPerson(personId) {
    if (!selectedCell || !board.people.some((person) => person.id === personId)) return;
    // 事件填写人物切换逻辑：保留当前选择的时间范围，只把记录目标换到另一个人物行。
    setSelectedCell((current) => ({ ...current, personId }));
  }

  function saveWeaponRecord(record) {
    setBoard((current) => {
      // 添加 / 编辑凶器记录逻辑：有 id 就覆盖原记录，没有 id 就创建新记录。
      const nextRecord = normalizeWeaponRecord({
        ...record,
        id: record.id || createId("weapon"),
      });
      // localStorage 保存凶器时间段逻辑：保存完整 startAbs/endAbs 和一份 timeText，刷新或时间轴变化后都能显示。
      nextRecord.timeText = weaponRangeText(nextRecord.startAbs, nextRecord.endAbs, nextRecord.startText, nextRecord.endText);
      const exists = (current.weaponRecords || []).some((item) => item.id === nextRecord.id);
      return {
        ...current,
        weaponRecords: exists
          ? current.weaponRecords.map((item) => (item.id === nextRecord.id ? nextRecord : item))
          : [...(current.weaponRecords || []), nextRecord],
      };
    });
  }

  function deleteWeaponRecord(recordId) {
    if (!window.confirm("删除这条凶器追踪记录？")) return;
    setBoard((current) => ({
      ...current,
      // 添加 / 编辑 / 删除凶器记录逻辑：删除只移除当前记录，不影响人物、时间线和表格内容。
      weaponRecords: (current.weaponRecords || []).filter((record) => record.id !== recordId),
    }));
  }

  function resetSample() {
    if (!window.confirm("载入示例会覆盖当前数据，确定继续？")) return;
    const next = copyBoard(sampleBoard);
    setBoard(next);
    setTimelineDraft({ ...next.timeline });
    setSelectedCell(null);
    setTapRangeStart(null);
  }

  function clearAll() {
    if (!window.confirm("确定清空整个推理板？")) return;
    const empty = {
      timeline: { startDate: todayString(), start: "18:00", endDate: todayString(), end: "22:00", stepMode: "5", customStep: 7 },
      people: [],
      timeSlots: generateSlots(todayString(), "18:00", todayString(), "22:00", 5),
      cells: {},
      archive: [],
      weaponRecords: [],
    };
    setBoard(empty);
    setTimelineDraft({ ...empty.timeline });
    setSelectedCell(null);
    setTapRangeStart(null);
  }

  return h("main", { className: "app-shell" }, [
    h(Header, { key: "header", resetSample, clearAll }),
    h("section", { className: `workspace${selected ? " has-editor" : " no-editor"}`, key: "workspace" }, [
      h(Matrix, {
        key: "matrix",
        board,
        visibleSlots,
        selectedCell,
        tapRangeStart,
        selectRange,
        startRangeSelect,
        moveRangeSelect,
        finishRangeSelect,
      }),
      h(CellEditor, {
        key: "editor",
        selected,
        people: board.people,
        changeSelectedPerson,
        updateCell,
        clearCell,
        closeEditor: () => setSelectedCell(null),
      }),
    ]),
    h("section", { className: "setup-panel", key: "setup" }, [
      h(TimelineSettings, {
        key: "timeline",
        draft: timelineDraft,
        setDraft: setTimelineDraft,
        applyTimeline,
      }),
      h(PeopleManager, {
        key: "people",
        people: board.people,
        newPerson,
        setNewPerson,
        addPerson,
        deletePerson,
        renamePerson,
      }),
      h(WeaponTracker, {
        key: "weapon",
        board,
        visibleSlots,
        saveWeaponRecord,
        deleteWeaponRecord,
      }),
    ]),
    h(InsightStrip, { key: "insights", insights }),
    h(ArchivePanel, { key: "archive", archive: board.archive }),
  ]);
}

function Header({ resetSample, clearAll }) {
  return h("header", { className: "topbar" }, [
    h("div", { key: "title" }, [
      h("h1", { key: "h1" }, "剧本杀推演时间线"),
      h("p", { key: "p" }, "横向时间轴，纵向人物线；像表格一样复盘行动、证词和矛盾。"),
    ]),
    h("div", { className: "top-actions", key: "actions" }, [
      h("button", { className: "secondary-btn", type: "button", onClick: resetSample, key: "sample" }, "载入示例"),
      h("button", { className: "danger-btn", type: "button", onClick: clearAll, key: "clear" }, "清空"),
    ]),
  ]);
}

function TimelineSettings({ draft, setDraft, applyTimeline }) {
  const step = draft.stepMode === "custom" ? Number(draft.customStep) : Number(draft.stepMode);
  const preview = generateSlots(draft.startDate, draft.start, draft.endDate, draft.end, step);
  return h("details", { className: "timeline-settings collapsible-card", open: true }, [
    h("summary", { key: "summary" }, "时间轴设置"),
    h("form", { className: "card-body", onSubmit: applyTimeline, key: "form" }, [
      h("div", { className: "settings-grid", key: "fields" }, [
        h(InputField, {
          key: "startDate",
          label: "开始日期",
          type: "date",
          value: draft.startDate,
          onChange: (value) => setDraft((current) => ({ ...current, startDate: value })),
        }),
        h(InputField, {
          key: "start",
          label: "开始时间",
          type: "time",
          value: draft.start,
          onChange: (value) => setDraft((current) => ({ ...current, start: value })),
        }),
        h(InputField, {
          key: "endDate",
          label: "结束日期",
          type: "date",
          value: draft.endDate,
          onChange: (value) => setDraft((current) => ({ ...current, endDate: value })),
        }),
        h(InputField, {
          key: "end",
          label: "结束时间",
          type: "time",
          value: draft.end,
          onChange: (value) => setDraft((current) => ({ ...current, end: value })),
        }),
        h("label", { className: "field", key: "step" }, [
          h("span", { key: "span" }, "时间粒度"),
          h(
            "select",
            {
              key: "select",
              value: draft.stepMode,
              onChange: (event) => setDraft((current) => ({ ...current, stepMode: event.target.value })),
            },
            [
              ...stepOptions.map((minutes) => h("option", { value: String(minutes), key: minutes }, `${minutes} 分钟`)),
              h("option", { value: "custom", key: "custom" }, "自定义分钟数"),
            ]
          ),
        ]),
        draft.stepMode === "custom"
          ? h(InputField, {
              key: "custom",
              label: "自定义分钟",
              type: "number",
              min: "1",
              value: draft.customStep,
              onChange: (value) => setDraft((current) => ({ ...current, customStep: value })),
            })
          : null,
      ]),
      h("div", { className: "timeline-preview", key: "preview" }, [
        h("strong", { key: "count" }, `${formatDate(draft.startDate)} ${draft.start} 到 ${formatDate(draft.endDate)} ${draft.end} 将生成 ${preview.length} 个时间段`),
        h("span", { key: "sample" }, preview.slice(0, 5).map((slot) => slot.label).join(" | ") || "请设置有效时间"),
      ]),
      h("button", { className: "primary-btn", type: "submit", key: "button" }, "应用时间轴"),
    ]),
  ]);
}

function PeopleManager({ people, newPerson, setNewPerson, addPerson, deletePerson, renamePerson }) {
  return h("details", { className: "people-manager collapsible-card", open: true }, [
    h("summary", { key: "summary" }, "人物管理"),
    h("form", { className: "inline-form card-body", onSubmit: addPerson, key: "form" }, [
      h("input", {
        key: "input",
        value: newPerson,
        placeholder: "新增人物，例如：侦探",
        onChange: (event) => setNewPerson(event.target.value),
      }),
      h("button", { className: "primary-btn", type: "submit", key: "button" }, "添加"),
    ]),
    h(
      "div",
      { className: "person-chips", key: "chips" },
      people.length
        ? people.map((person) =>
            h("div", { className: "person-chip", key: person.id, style: { "--person-color": person.color || getPersonColor(0) } }, [
              h("span", { className: "person-color-dot", key: "color" }),
              h("input", {
                className: "person-name-input",
                key: "name",
                value: person.name,
                title: "修改人物名字",
                onChange: (event) => renamePerson(person.id, event.target.value),
                onBlur: (event) => {
                  if (!event.target.value.trim()) renamePerson(person.id, "未命名");
                },
              }),
              h("button", { type: "button", onClick: () => deletePerson(person.id), key: "delete" }, "×"),
            ])
          )
        : h("p", { className: "muted", key: "empty" }, "暂无人物")
    ),
  ]);
}

function WeaponTracker({ board, visibleSlots, saveWeaponRecord, deleteWeaponRecord }) {
  const [draft, setDraft] = useState(() => emptyWeaponDraft());
  const sortedRecords = (board.weaponRecords || []).slice().sort((a, b) => (a.startAbs || 0) - (b.startAbs || 0));

  function updateDraft(field, value) {
    setDraft((current) => {
      if (field === "personId") {
        // 人物和时间选择逻辑：选择人物时同时保存一份人物名快照，后续人物被删除也能知道原来是谁。
        const person = board.people.find((item) => item.id === value);
        return { ...current, personId: value, personNameSnapshot: person?.name || current.personNameSnapshot };
      }
      if (field === "startSlotId") {
        const slot = visibleSlots.find((item) => item.id === value);
        return {
          ...current,
          startSlotId: value,
          startAbs: Number.isFinite(slot?.start) ? slot.start : current.startAbs,
          startText: slot ? formatWeaponBoundary(slot.start) : current.startText,
        };
      }
      if (field === "endSlotId") {
        const slot = visibleSlots.find((item) => item.id === value);
        return {
          ...current,
          endSlotId: value,
          endAbs: Number.isFinite(slot?.end) ? slot.end : current.endAbs,
          endText: slot ? formatWeaponBoundary(slot.end) : current.endText,
        };
      }
      return { ...current, [field]: value };
    });
  }

  function submitRecord(event) {
    event.preventDefault();
    if (!draft.weaponName.trim()) {
      window.alert("请填写凶器名称。");
      return;
    }
    // 结束时间不能早于开始时间的校验逻辑：用内部完整分钟数比较，跨天也能正确判断。
    if (Number.isFinite(draft.startAbs) && Number.isFinite(draft.endAbs) && draft.endAbs < draft.startAbs) {
      window.alert("结束时间不能早于开始时间。");
      return;
    }
    saveWeaponRecord(draft);
    setDraft(emptyWeaponDraft());
  }

  function editRecord(record) {
    setDraft(normalizeWeaponRecord(record));
  }

  const timeOptions = visibleSlots.map((slot) => ({
    id: slot.id,
    startLabel: formatWeaponBoundary(slot.start),
    endLabel: formatWeaponBoundary(slot.end),
  }));
  const hasDeletedDraftPerson = draft.personId && !board.people.some((person) => person.id === draft.personId);
  const hasOldDraftStart = draft.startSlotId && !visibleSlots.some((slot) => slot.id === draft.startSlotId);
  const hasOldDraftEnd = draft.endSlotId && !visibleSlots.some((slot) => slot.id === draft.endSlotId);

  return h("details", { className: "weapon-tracker collapsible-card", open: true }, [
    h("summary", { key: "summary" }, "凶器追踪"),
    h("form", { className: "weapon-form card-body", onSubmit: submitRecord, key: "form" }, [
      h(InputField, {
        key: "weaponName",
        label: "凶器名称",
        type: "text",
        value: draft.weaponName,
        onChange: (value) => updateDraft("weaponName", value),
      }),
      h("label", { className: "field", key: "person" }, [
        h("span", { key: "span" }, "对应人物"),
        h(
          "select",
          { value: draft.personId, onChange: (event) => updateDraft("personId", event.target.value), key: "select" },
          [
            h("option", { value: "", key: "empty" }, "未选择"),
            hasDeletedDraftPerson
              ? h("option", { value: draft.personId, key: "deleted" }, `人物已删除（${draft.personNameSnapshot || "未知"}）`)
              : null,
            ...board.people.map((person) => h("option", { value: person.id, key: person.id }, person.name)),
          ]
        ),
      ]),
      h("label", { className: "field", key: "startTime" }, [
        h("span", { key: "span" }, "开始时间"),
        h(
          "select",
          { value: draft.startSlotId, onChange: (event) => updateDraft("startSlotId", event.target.value), key: "select" },
          [
            h("option", { value: "", key: "empty" }, "未选择"),
            hasOldDraftStart ? h("option", { value: draft.startSlotId, key: "old" }, draft.startText || "旧开始时间") : null,
            ...timeOptions.map((slot) => h("option", { value: slot.id, key: slot.id }, slot.startLabel)),
          ]
        ),
      ]),
      h("label", { className: "field", key: "endTime" }, [
        h("span", { key: "span" }, "结束时间"),
        h(
          "select",
          { value: draft.endSlotId, onChange: (event) => updateDraft("endSlotId", event.target.value), key: "select" },
          [
            h("option", { value: "", key: "empty" }, "未选择"),
            hasOldDraftEnd ? h("option", { value: draft.endSlotId, key: "old" }, draft.endText || "旧结束时间") : null,
            ...timeOptions.map((slot) => h("option", { value: slot.id, key: slot.id }, slot.endLabel)),
          ]
        ),
      ]),
      h(InputField, {
        key: "location",
        label: "地点",
        type: "text",
        value: draft.location,
        onChange: (value) => updateDraft("location", value),
      }),
      h("label", { className: "field", key: "status" }, [
        h("span", { key: "span" }, "状态"),
        h(
          "select",
          { value: draft.status, onChange: (event) => updateDraft("status", event.target.value), key: "select" },
          weaponStatusOptions.map((status) => h("option", { value: status, key: status }, status))
        ),
      ]),
      h("label", { className: "field", key: "source" }, [
        h("span", { key: "span" }, "证据来源"),
        h(
          "select",
          { value: draft.source, onChange: (event) => updateDraft("source", event.target.value), key: "select" },
          weaponSourceOptions.map((source) => h("option", { value: source, key: source }, source))
        ),
      ]),
      h(TextField, { key: "note", label: "备注 / 推论", value: draft.note, onChange: (value) => updateDraft("note", value) }),
      h("div", { className: "editor-actions weapon-actions", key: "actions" }, [
        h("button", { className: "primary-btn", type: "submit", key: "save" }, draft.id ? "保存修改" : "添加记录"),
        draft.id ? h("button", { className: "secondary-btn", type: "button", onClick: () => setDraft(emptyWeaponDraft()), key: "cancel" }, "取消编辑") : null,
      ]),
    ]),
    h(
      "div",
      { className: "weapon-list", key: "list" },
      sortedRecords.length
        ? sortedRecords.map((record) =>
            h(WeaponRecordItem, {
              key: record.id,
              record,
              people: board.people,
              slots: visibleSlots,
              onEdit: () => editRecord(record),
              onDelete: () => deleteWeaponRecord(record.id),
            })
          )
        : h("p", { className: "muted", key: "empty" }, "暂无凶器记录")
    ),
  ]);
}

function WeaponRecordItem({ record, people, slots, onEdit, onDelete }) {
  const person = people.find((item) => item.id === record.personId);
  const startSlot = slots.find((item) => item.id === record.startSlotId);
  const endSlot = slots.find((item) => item.id === record.endSlotId);
  const personName = person ? person.name : record.personId ? `人物已删除（${record.personNameSnapshot || "未知"}）` : "未选择";
  // 时间轴修改后保留旧凶器记录的逻辑：新时间轴找不到原始 slot 时，继续展示保存过的 timeText。
  const timeText = formatWeaponRecordRange(record, startSlot, endSlot);

  return h("article", { className: "weapon-record" }, [
    h("div", { className: "weapon-record-main", key: "main" }, [
      h("strong", { key: "weapon" }, `凶器：${record.weaponName || "未命名"}`),
      h("span", { key: "person" }, `人物：${personName}`),
      h("span", { key: "time" }, `时间段：${timeText}`),
      h("span", { key: "location" }, `地点：${record.location || "未填写"}`),
      h("span", { key: "status" }, `状态：${record.status}`),
      h("span", { key: "source" }, `证据来源：${record.source}`),
      record.note ? h("p", { key: "note" }, `备注：${record.note}`) : null,
    ]),
    h("div", { className: "weapon-record-actions", key: "actions" }, [
      h("button", { className: "secondary-btn", type: "button", onClick: onEdit, key: "edit" }, "编辑"),
      h("button", { className: "danger-btn", type: "button", onClick: onDelete, key: "delete" }, "删除"),
    ]),
  ]);
}

function InsightStrip({ insights }) {
  return h("section", { className: "insight-grid" }, [
    h(InsightCard, { key: "unknown", title: "空白时间", items: insights.unknown }),
    h(InsightCard, { key: "conflict", title: "证词冲突", items: insights.conflicts }),
    h(InsightCard, { key: "chance", title: "作案机会", items: insights.chances }),
  ]);
}

function InsightCard({ title, items }) {
  return h("article", null, [
    h("h2", { key: "title" }, title),
    h(
      "ul",
      { key: "list" },
      items.length ? items.slice(0, 8).map((item) => h("li", { key: item }, item)) : h("li", null, "暂无明显记录")
    ),
  ]);
}

function Matrix({ board, visibleSlots, selectedCell, tapRangeStart, selectRange, startRangeSelect, moveRangeSelect, finishRangeSelect }) {
  return h("section", { className: "matrix-panel" }, [
    h("div", { className: "matrix-scroll", key: "scroll" }, [
      h("table", { className: "timeline-matrix", key: "table" }, [
        h("colgroup", { key: "cols" }, [
          h("col", { className: "person-col", key: "person-col" }),
          ...visibleSlots.map((slot) => h("col", { className: "time-col", key: slot.id })),
        ]),
        // 第一排固定为时间表头：这里只显示时间点，不渲染事件块，也不绑定拖拽。
        h("thead", { key: "head" }, [
          h("tr", null, [
            h("th", { className: "corner-cell", key: "corner" }, "人物 / 时间"),
            ...visibleSlots.map((slot) =>
              h("th", { className: "time-header", key: slot.id, title: slot.label }, formatHeaderTime(slot))
            ),
          ]),
        ]),
        h(
          "tbody",
          { key: "body" },
          board.people.map((person) => {
            const segments = buildRowSegments(board, person, visibleSlots);
            // 第二排开始才是人物行动区域：事件块根据当前人物行的 segments 渲染，确保不会跑到表头。
            return h("tr", { key: person.id }, [
              h("th", { className: "person-header", key: "person" }, person.name),
              ...segments.map((segment) =>
                segment.kind === "event"
                  ? h(EventBlock, {
                      key: segment.key,
                      person,
                      segment,
                      selected: isRangeSelected(selectedCell, person.id, segment.startIndex, segment.endIndex),
                      onPick: () => selectRange(person.id, segment.startIndex, segment.endIndex),
                    })
                  : h(TimelineCell, {
                      key: segment.slot.id,
                      person,
                      slot: segment.slot,
                      index: segment.startIndex,
                      cell: segment.cell,
                      selected: isRangeSelected(selectedCell, person.id, segment.startIndex, segment.endIndex),
                      pendingStart: isTapRangeStart(tapRangeStart, person.id, segment.startIndex),
                      onPointerDown: (event) => startRangeSelect(person.id, segment.startIndex, event.pointerType),
                      onPointerEnter: () => moveRangeSelect(person.id, segment.startIndex),
                      onPointerUp: () => finishRangeSelect(person.id, segment.startIndex),
                    })
              ),
            ]);
          })
        ),
      ]),
    ]),
  ]);
}

function EventBlock({ person, segment, selected, onPick }) {
  const cell = segment.cell;
  const hasConflict = cell.status === "conflict" || Boolean(cell.conflict.trim());
  const eventRange = formatEventRange(segment.startSlot, segment.endSlot);
  const title = buildEventTooltip(person, segment, cell);
  // 事件块宽度和高度计算逻辑：宽度由 td colSpan 覆盖多个时间列，高度由 CSS 的行高变量填满当前人物行。
  return h("td", { className: `timeline-cell event-cell event-status-${cell.status}${selected ? " selected" : ""}`, colSpan: segment.colSpan }, [
    h("button", { className: "cell-button event-button", type: "button", onClick: onPick, title, style: { "--person-color": person.color || getPersonColor(0) } }, [
      h("span", { className: "event-time", key: "time" }, eventRange),
      cell.action ? h("span", { className: "cell-action", key: "action" }, cell.action) : null,
      cell.weapon ? h("span", { className: "weapon-tag", key: "weapon" }, `凶器: ${cell.weapon}`) : null,
      cell.location ? h("span", { className: "cell-location", key: "location" }, cell.location) : null,
      h("span", { className: "cell-status", key: "status" }, statusLabel(cell.status)),
      cell.evidence ? h("span", { className: "event-detail", key: "evidence" }, `证据: ${cell.evidence}`) : null,
      cell.witness ? h("span", { className: "event-detail", key: "witness" }, `证人: ${cell.witness}`) : null,
      cell.suspicion ? h("span", { className: "event-detail" , key: "suspicion" }, `疑点: ${cell.suspicion}`) : null,
      hasConflict ? h("span", { className: "conflict-dot", key: "conflict" }, "冲突") : null,
      cell.inference ? h("span", { className: "event-detail", key: "inference" }, `推论: ${cell.inference}`) : null,
    ]),
  ]);
}

function TimelineCell({ person, slot, index, cell, selected, pendingStart, onPointerDown, onPointerEnter, onPointerUp }) {
  const hasConflict = cell.status === "conflict" || Boolean(cell.conflict.trim());
  const blank = isEmptyCell(cell);
  return h("td", { className: `timeline-cell status-${cell.status}${selected ? " selected" : ""}${pendingStart ? " tap-start" : ""}` }, [
    h("button", {
      className: "cell-button",
      type: "button",
      onPointerDown,
      onPointerEnter,
      onPointerUp,
      title: `${person.name} ${slot.label}`,
    }, [
      !blank && cell.action ? h("span", { className: "cell-action", key: "action" }, cell.action) : null,
      !blank && cell.location ? h("span", { className: "cell-location", key: "location" }, cell.location) : null,
      !blank ? h("span", { className: "cell-status", key: "status" }, statusLabel(cell.status)) : null,
      !blank && hasConflict ? h("span", { className: "conflict-dot", key: "conflict" }, "冲突") : null,
    ]),
  ]);
}

function CellEditor({ selected, people, changeSelectedPerson, updateCell, clearCell, closeEditor }) {
  if (!selected) {
    return null;
  }

  return h("aside", { className: "editor-panel" }, [
    h("div", { className: "editor-title", key: "title" }, [
      h("div", { key: "copy" }, [
        h("h2", { key: "h2" }, "编辑事件"),
        h("p", { key: "p" }, `${selected.person.name} · ${selected.startSlot.label} 到 ${selected.endSlot.label}`),
      ]),
      h("button", { className: "icon-btn", type: "button", onClick: closeEditor, key: "close" }, "关闭"),
    ]),
    h("label", { className: "field", key: "person" }, [
      h("span", { key: "span" }, "人物"),
      h(
        "select",
        {
          value: selected.person.id,
          onChange: (event) => changeSelectedPerson(event.target.value),
          key: "select",
        },
        people.map((person) => h("option", { value: person.id, key: person.id }, person.name))
      ),
    ]),
    h("label", { className: "field readonly-field", key: "time" }, [
      h("span", { key: "span" }, "时间"),
      // 时间自动显示逻辑：单格显示一个时间段，拖拽多格时显示完整开始和结束。
      h("output", { key: "output" }, `${selected.startSlot.label} 到 ${selected.endSlot.label}`),
    ]),
    h(TextField, { key: "location", label: "地点", value: selected.cell.location, onChange: (value) => updateCell("location", value) }),
    h(TextField, { key: "action", label: "干了什么", value: selected.cell.action, onChange: (value) => updateCell("action", value) }),
    h("label", { className: "field", key: "status" }, [
      h("span", { key: "span" }, "状态"),
      h(
        "select",
        { value: selected.cell.status, onChange: (event) => updateCell("status", event.target.value), key: "select" },
        statusOptions.map((option) => h("option", { value: option.value, key: option.value }, option.label))
      ),
    ]),
    h("details", { className: "more-fields", key: "more" }, [
      h("summary", { key: "summary" }, "更多线索"),
      h(TextField, { key: "weapon", label: "凶器/物品", value: selected.cell.weapon, onChange: (value) => updateCell("weapon", value) }),
      h(TextField, { key: "evidence", label: "证据来源", value: selected.cell.evidence, onChange: (value) => updateCell("evidence", value) }),
      h(TextField, { key: "witness", label: "证人", value: selected.cell.witness, onChange: (value) => updateCell("witness", value) }),
      h(TextField, { key: "suspicion", label: "可疑点", value: selected.cell.suspicion, onChange: (value) => updateCell("suspicion", value) }),
      h(TextField, { key: "conflict", label: "矛盾点", value: selected.cell.conflict, onChange: (value) => updateCell("conflict", value) }),
      h(TextField, { key: "inference", label: "当前推论", value: selected.cell.inference, onChange: (value) => updateCell("inference", value) }),
    ]),
    h("div", { className: "editor-actions", key: "actions" }, [
      h("button", { className: "primary-btn", type: "button", onClick: closeEditor, key: "save" }, "保存记录"),
      h("button", { className: "secondary-btn", type: "button", onClick: () => updateCell("status", "unknown"), key: "unknown" }, "标记行踪不明"),
      h("button", { className: "secondary-btn", type: "button", onClick: () => updateCell("status", "conflict"), key: "conflict" }, "标记证词冲突"),
      h("button", { className: "danger-btn", type: "button", onClick: clearCell, key: "clear" }, "清空格子"),
    ]),
  ]);
}

function TextField({ label, value, onChange }) {
  return h("label", { className: "field" }, [
    h("span", { key: "label" }, label),
    h("textarea", {
      key: "input",
      rows: 2,
      value,
      onChange: (event) => onChange(event.target.value),
    }),
  ]);
}

function InputField({ label, type, value, onChange, min }) {
  return h("label", { className: "field" }, [
    h("span", { key: "label" }, label),
    h("input", {
      key: "input",
      type,
      min,
      value,
      onChange: (event) => onChange(event.target.value),
    }),
  ]);
}

function emptyWeaponDraft() {
  return {
    id: "",
    weaponName: "",
    personId: "",
    personNameSnapshot: "",
    startSlotId: "",
    endSlotId: "",
    startText: "",
    endText: "",
    timeText: "",
    startAbs: NaN,
    endAbs: NaN,
    location: "",
    status: "出现",
    source: "剧本",
    note: "",
  };
}

function normalizeWeaponRecord(record) {
  // 凶器记录的数据结构：统一补齐字段，避免旧 localStorage 缺字段时页面报错。
  const legacySlotId = String(record?.slotId || "");
  const startSlotId = String(record?.startSlotId || legacySlotId);
  const endSlotId = String(record?.endSlotId || legacySlotId);
  const legacyTimeText = String(record?.timeText || "");
  const startText = String(record?.startText || legacyTimeText);
  const endText = String(record?.endText || legacyTimeText);
  const rawStartAbs = Number(record?.startAbs);
  const rawEndAbs = Number(record?.endAbs);
  const startAbs = Number.isFinite(rawStartAbs) ? rawStartAbs : NaN;
  const endAbs = Number.isFinite(rawEndAbs) ? rawEndAbs : NaN;
  return {
    ...emptyWeaponDraft(),
    ...record,
    weaponName: String(record?.weaponName || ""),
    personId: String(record?.personId || ""),
    personNameSnapshot: String(record?.personNameSnapshot || ""),
    startSlotId,
    endSlotId,
    startText,
    endText,
    timeText: weaponRangeText(startAbs, endAbs, startText, endText) || legacyTimeText,
    startAbs,
    endAbs,
    location: String(record?.location || ""),
    status: weaponStatusOptions.includes(record?.status) ? record.status : "出现",
    source: weaponSourceOptions.includes(record?.source) ? record.source : "剧本",
    note: String(record?.note || ""),
  };
}

function ArchivePanel({ archive }) {
  if (!archive.length) return null;
  return h("section", { className: "archive-panel" }, [
    h("h2", { key: "title" }, "待整理内容"),
    h(
      "ul",
      { key: "list" },
      archive.slice(-20).map((item, index) =>
        h("li", { key: `${item.personName}-${item.slotLabel}-${index}` }, `${item.personName} ${item.slotLabel}: ${summary(item.cell)}`)
      )
    ),
  ]);
}

function loadBoard() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeBoard(JSON.parse(stored)) : copyBoard(sampleBoard);
  } catch {
    return copyBoard(sampleBoard);
  }
}

function normalizeBoard(board) {
  const storedTimeline = board.timeline || {};
  const fallbackDate = storedTimeline.date || sampleBoard.timeline.startDate;
  const timeline = {
    ...sampleBoard.timeline,
    ...storedTimeline,
    startDate: storedTimeline.startDate || fallbackDate,
    endDate: storedTimeline.endDate || fallbackDate,
  };
  delete timeline.date;
  const step = timeline.stepMode === "custom" ? Number(timeline.customStep) : Number(timeline.stepMode);
  const timeSlots = Array.isArray(board.timeSlots)
    ? board.timeSlots
    : generateSlots(timeline.startDate, timeline.start, timeline.endDate, timeline.end, step || 30);
  return {
    timeline,
    // localStorage 保存人物颜色逻辑：旧数据没有 color 时在读取阶段补齐，并随 board 自动保存回 localStorage。
    people: Array.isArray(board.people) ? board.people.map((person, index) => ({ ...person, color: person.color || getPersonColor(index) })) : [],
    timeSlots,
    cells: board.cells && typeof board.cells === "object" ? board.cells : {},
    archive: Array.isArray(board.archive) ? board.archive : [],
    weaponRecords: Array.isArray(board.weaponRecords) ? board.weaponRecords.map(normalizeWeaponRecord) : [],
  };
}

function remapBoardToSlots(current, timeline, nextSlots) {
  const nextSlotIds = new Set(nextSlots.map((slot) => slot.id));
  const oldSlotsById = Object.fromEntries(current.timeSlots.map((slot) => [slot.id, slot]));
  const nextSlotsByLabel = Object.fromEntries(
    nextSlots.flatMap((slot) => [slot.label, ...(slot.matchLabels || [])].map((label) => [label, slot]))
  );
  const nextCells = {};
  const archived = [];

  // 旧数据保留逻辑：如果旧时间段 label 在新时间轴里仍存在，就把该格子迁移到新时间段。
  // 例如 6/4 18:00-18:05 在新旧时间轴中都存在时，人物该时间段的内容会继续保留。
  for (const [key, cell] of Object.entries(current.cells)) {
    const [personId, oldSlotId] = key.split(":");
    const oldSlot = oldSlotsById[oldSlotId];
    const person = current.people.find((item) => item.id === personId);
    const oldLabels = oldSlot ? [oldSlot.label, ...(oldSlot.matchLabels || [])] : [oldSlotId];
    const matchedSlot = oldLabels.map((label) => nextSlotsByLabel[label]).find(Boolean);

    if (matchedSlot && nextSlotIds.has(matchedSlot.id)) {
      nextCells[cellKey(personId, matchedSlot.id)] = cell;
    } else if (!isEmptyCell(cell)) {
      // 待整理内容逻辑：无法匹配到新时间段、但格子里有内容时，不删除，先放入 archive。
      archived.push({
        personId,
        personName: person?.name || "未知人物",
        slotLabel: oldSlot?.label || oldSlotId,
        cell,
      });
    }
  }

  return {
    ...current,
    timeline: { ...timeline },
    timeSlots: nextSlots,
    cells: nextCells,
    archive: [...(current.archive || []), ...archived],
  };
}

function getCellContext(board, personId, slotId) {
  const person = board.people.find((item) => item.id === personId);
  const slot = board.timeSlots.find((item) => item.id === slotId);
  if (!person || !slot) return null;
  return { person, slot, cell: getCell(board, personId, slotId) };
}

function getSelectionContext(board, range, visibleSlots) {
  const normalized = normalizeRange(range);
  const person = board.people.find((item) => item.id === normalized.personId);
  if (!person) return null;
  const slots = visibleSlots.slice(normalized.startIndex, normalized.endIndex + 1);
  if (!slots.length) return null;
  const firstCell = getCell(board, person.id, slots[0].id);
  const sameEventCell = firstCell.eventId
    ? slots.map((slot) => getCell(board, person.id, slot.id)).find((cell) => cell.eventId === firstCell.eventId)
    : null;
  return {
    person,
    slots,
    startSlot: slots[0],
    endSlot: slots[slots.length - 1],
    cell: sameEventCell || firstCell,
  };
}

function buildRowSegments(board, person, slots) {
  const segments = [];
  let index = 0;

  while (index < slots.length) {
    const slot = slots[index];
    const cell = getCell(board, person.id, slot.id);
    const canMerge = cell.eventId && !isEmptyCell(cell);

    if (!canMerge) {
      segments.push({
        kind: "cell",
        key: slot.id,
        slot,
        startIndex: index,
        endIndex: index,
        cell,
      });
      index += 1;
      continue;
    }

    let endIndex = index;
    while (endIndex + 1 < slots.length) {
      const nextCell = getCell(board, person.id, slots[endIndex + 1].id);
      if (nextCell.eventId !== cell.eventId) break;
      endIndex += 1;
    }

    // 连续时间格合并显示逻辑：相邻格子拥有同一个 eventId 时，渲染为一个 colSpan 事件块。
    segments.push({
      kind: "event",
      key: cell.eventId,
      startIndex: index,
      endIndex,
      colSpan: endIndex - index + 1,
      startSlot: slots[index],
      endSlot: slots[endIndex],
      cell,
    });
    index = endIndex + 1;
  }

  return segments;
}

function normalizeRange(range) {
  const startIndex = Math.min(range.startIndex, range.endIndex);
  const endIndex = Math.max(range.startIndex, range.endIndex);
  return { ...range, startIndex, endIndex };
}

function isRangeSelected(range, personId, startIndex, endIndex) {
  if (!range || range.personId !== personId) return false;
  const selected = normalizeRange(range);
  return selected.startIndex <= endIndex && selected.endIndex >= startIndex;
}

function isTapRangeStart(range, personId, index) {
  return Boolean(range && range.personId === personId && range.startIndex === index);
}

function buildInsights(board) {
  const unknown = [];
  const conflicts = [];
  const chances = [];

  for (const person of board.people) {
    for (const slot of board.timeSlots) {
      const cell = getCell(board, person.id, slot.id);
      const label = `${slot.label} ${person.name}`;
      const blank = isEmptyCell(cell);
      const unknownStatus = cell.status === "unknown" || blank || cell.action.includes("不明") || cell.location.includes("不明");
      const conflictStatus = cell.status === "conflict" || Boolean(cell.conflict.trim());
      const suspiciousNoWitness = (cell.status === "suspicious" || cell.suspicion.trim()) && !cell.witness.trim();

      if (unknownStatus) unknown.push(`${label}: ${cell.action || "空白"}`);
      if (conflictStatus) conflicts.push(`${label}: ${cell.conflict || "已标记证词冲突"}`);
      if (unknownStatus || suspiciousNoWitness) chances.push(`${label}: ${cell.inference || cell.suspicion || "存在未证明行动窗口"}`);
    }
  }

  return { unknown, conflicts, chances };
}

function generateSlots(startDate, startTime, endDate, endTime, step) {
  // 开始日期时间和结束日期时间组合逻辑：把日期和时间合并成绝对分钟数，方便同一天/跨天统一计算。
  const startMin = dateTimeToAbsoluteMinutes(startDate, startTime);
  const endMin = dateTimeToAbsoluteMinutes(endDate, endTime);
  const safeStep = Number(step);
  if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || !Number.isFinite(safeStep) || safeStep <= 0 || endMin <= startMin) {
    return [];
  }

  // 跨天时间段生成逻辑：从开始日期时间按 step 分钟向后切片，直到结束日期时间。
  // 例如 6/4 23:55 到 6/5 00:05、step=5，会生成 6/4 23:55-6/5 00:00、6/5 00:00-00:05。
  const slots = [];
  for (let current = startMin; current < endMin; current += safeStep) {
    const next = Math.min(current + safeStep, endMin);
    slots.push({
      id: `slot-${current}-${next}`,
      // 内部仍保留完整时间段数据：label/start/end 用于跨天计算、编辑提示、旧数据迁移和待整理内容。
      label: formatSlotLabel(current, next),
      matchLabels: legacyMatchLabels(current, next),
      start: current,
      end: next,
    });
  }
  return slots;
}

function makeCell(value) {
  return { ...emptyCell(), ...value };
}

function emptyCell() {
  return {
    location: "",
    action: "",
    weapon: "",
    evidence: "",
    witness: "",
    suspicion: "",
    conflict: "",
    inference: "",
    status: "normal",
  };
}

function getCell(board, personId, slotId) {
  return { ...emptyCell(), ...board.cells[cellKey(personId, slotId)] };
}

function cellKey(personId, slotId) {
  return `${personId}:${slotId}`;
}

function isEmptyCell(cell) {
  return !cell.location && !cell.action && !cell.weapon && !cell.evidence && !cell.witness && !cell.suspicion && !cell.conflict && !cell.inference && cell.status === "normal";
}

function filterCells(cells, predicate) {
  return Object.fromEntries(Object.entries(cells).filter(([key]) => predicate(key)));
}

function summary(cell) {
  if (cell.action || cell.location || cell.weapon) {
    const weapon = cell.weapon ? ` / 凶器: ${cell.weapon}` : "";
    return `${cell.action || "未写行动"}${cell.location ? `（${cell.location}）` : ""}${weapon}`;
  }
  return "空白";
}

function statusLabel(status) {
  return statusOptions.find((item) => item.value === status)?.label || "普通";
}

function getPersonColor(index) {
  return personColors[index % personColors.length];
}

function sortSlots(a, b) {
  return (a.start ?? timeToMinutes(a.label)) - (b.start ?? timeToMinutes(b.label));
}

function formatHeaderTime(slot) {
  // 表头只显示开始时间的格式化逻辑：界面只展示 HH:mm，不展示日期和结束时间。
  if (Number.isFinite(slot.start)) return minutesToTime(slot.start);
  const match = String(slot.label || "").match(/(\d{1,2})[:：](\d{2})/);
  return match ? `${String(Number(match[1])).padStart(2, "0")}:${match[2]}` : "";
}

function formatEventRange(startSlot, endSlot) {
  return `${formatHeaderTime(startSlot)}-${minutesToTime(endSlot.end)}`;
}

function formatWeaponBoundary(value) {
  if (!Number.isFinite(value)) return "";
  const parts = absoluteMinutesToParts(value);
  return `${parts.month}/${parts.day} ${parts.clock}`;
}

function weaponRangeText(startAbs, endAbs, startText, endText) {
  // 跨天时间段显示逻辑：同一天只显示 HH:mm-HH:mm，跨天显示日期，避免 23:50-00:20 产生误解。
  if (Number.isFinite(startAbs) && Number.isFinite(endAbs)) {
    const startParts = absoluteMinutesToParts(startAbs);
    const endParts = absoluteMinutesToParts(endAbs);
    const sameDay = startParts.month === endParts.month && startParts.day === endParts.day;
    return sameDay
      ? `${startParts.clock}-${endParts.clock}`
      : `${startParts.month}/${startParts.day} ${startParts.clock} - ${endParts.month}/${endParts.day} ${endParts.clock}`;
  }
  if (startText && endText) return startText === endText ? startText : `${startText}-${endText}`;
  return startText || endText || "";
}

function formatWeaponRecordRange(record, startSlot, endSlot) {
  // 时间轴修改后保留旧凶器记录的逻辑：能匹配新时间轴就重新计算，不能匹配就用记录里保存的旧文本。
  if (startSlot && endSlot) return weaponRangeText(startSlot.start, endSlot.end, record.startText, record.endText);
  return record.timeText || weaponRangeText(record.startAbs, record.endAbs, record.startText, record.endText) || "未选择";
}

function buildEventTooltip(person, segment, cell) {
  const lines = [
    `人物: ${person.name}`,
    `时间: ${formatEventRange(segment.startSlot, segment.endSlot)}`,
    cell.action ? `行动: ${cell.action}` : "",
    cell.weapon ? `凶器: ${cell.weapon}` : "",
    cell.location ? `地点: ${cell.location}` : "",
    `状态: ${statusLabel(cell.status)}`,
    cell.evidence ? `证据: ${cell.evidence}` : "",
    cell.witness ? `证人: ${cell.witness}` : "",
    cell.suspicion ? `可疑点: ${cell.suspicion}` : "",
    cell.conflict ? `矛盾点: ${cell.conflict}` : "",
    cell.inference ? `推论: ${cell.inference}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

function slotIdFromRange(startDate, startTime, endDate, endTime) {
  const start = dateTimeToAbsoluteMinutes(startDate, startTime);
  const end = dateTimeToAbsoluteMinutes(endDate, endTime);
  return `slot-${start}-${end}`;
}

function dateTimeToAbsoluteMinutes(dateValue, timeValue) {
  const day = dateToDayNumber(dateValue);
  const minute = timeToMinutes(timeValue);
  if (!Number.isFinite(day) || !Number.isFinite(minute)) return NaN;
  return day * 1440 + minute;
}

function dateToDayNumber(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return NaN;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return NaN;
  return Math.floor(utc / 86400000);
}

function absoluteMinutesToParts(total) {
  const dayNumber = Math.floor(total / 1440);
  const minuteOfDay = total - dayNumber * 1440;
  const date = new Date(dayNumber * 86400000);
  return {
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    clock: minutesToTime(minuteOfDay),
  };
}

function formatSlotLabel(start, end) {
  const startParts = absoluteMinutesToParts(start);
  const endParts = absoluteMinutesToParts(end);
  const startDate = `${startParts.month}/${startParts.day}`;
  const endDate = `${endParts.month}/${endParts.day}`;
  if (startDate === endDate) return `${startDate} ${startParts.clock}-${endParts.clock}`;
  return `${startDate} ${startParts.clock}-${endDate} ${endParts.clock}`;
}

function legacyMatchLabels(start, end) {
  const startParts = absoluteMinutesToParts(start);
  const endParts = absoluteMinutesToParts(end);
  return [`${startParts.clock}-${endParts.clock}`];
}

function timeToMinutes(value) {
  const match = String(value || "").match(/^(\d{1,2})[:：](\d{2})/);
  if (!match) return NaN;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return NaN;
  return hour * 60 + minute;
}

function minutesToTime(total) {
  const normalized = ((total % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function validTime(value) {
  return Number.isFinite(timeToMinutes(value));
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "未选择日期";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function createId(prefix) {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function copyBoard(board) {
  return JSON.parse(JSON.stringify(board));
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
