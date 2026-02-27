(() => {
  const STORAGE_KEYS = {
    token: "ap2_token",
    username: "ap2_username",
    apiBase: "ap2_api_base",
    debug: "ap2_debug",
    testMode: "ap2_test_mode",
    fakeLatency: "ap2_fake_latency",
    questionOverrides: "ap2_question_overrides",
    questionDeletes: "ap2_question_deletes"
  };

  // Exam date missing in Projekt.txt, keep one placeholder constant.
  const EXAM_DATE_ISO = "2026-06-01";

  const state = {
    route: "dashboard",
    currentQuestionId: null,
    currentTopicId: null,
    questionIndex: 0,
    testMode: false,
    fakeLatency: false,
    lastAppointmentAction: "none",
    calendarMonth: startOfMonth(new Date()).toISOString(),
    quizTopic: "all",
    quizMode: "mixed",
    lastImportSummary: null,
    overrideQuestion: null,
    currentInstance: null,
    currentRenderedQuestion: null,
    progressSummary: null,
    isAuthenticated: false,
    managerTopic: "all",
    managerType: "all",
    managerSearch: "",
    managerSort: "newest",
    managerShowSeeded: true,
    managerShowCustom: true,
    managerAllowSeededEdit: false,
    managerPage: 1
  };

  const debugEnabled =
    new URLSearchParams(window.location.search).get("debug") === "1" ||
    localStorage.getItem(STORAGE_KEYS.debug) === "1";

  const logger = createLogger(debugEnabled);
  let lastErrorStack = "None";
  let lastImportSnapshot = null;

  const ui = {
    pages: {
      dashboard: document.getElementById("page-dashboard"),
      quiz: document.getElementById("page-quiz"),
      calendar: document.getElementById("page-calendar"),
      builder: document.getElementById("page-builder"),
      manage: document.getElementById("page-manage")
    },
    navButtons: document.querySelectorAll(".nav-btn"),
    toggleDebug: document.getElementById("toggle-debug"),
    debugPanel: document.getElementById("debug-panel"),
    debugLogs: document.getElementById("debug-logs"),
    debugState: document.getElementById("debug-state"),
    debugStorage: document.getElementById("debug-storage"),
    debugError: document.getElementById("debug-error"),
    debugExport: document.getElementById("debug-export"),
    debugClear: document.getElementById("debug-clear"),
    debugReset: document.getElementById("debug-reset"),
    debugClose: document.getElementById("debug-close"),
    debugTestMode: document.getElementById("debug-test-mode"),
    debugLatency: document.getElementById("debug-latency"),
    errorBanner: document.getElementById("error-banner"),
    loginOverlay: document.getElementById("login-overlay"),
    loginForm: document.getElementById("login-form"),
    loginUsername: document.getElementById("login-username"),
    loginPassword: document.getElementById("login-password"),
    loginStatus: document.getElementById("login-status"),
    warning: document.getElementById("warning"),
    countdown: document.getElementById("countdown"),
    isoWeek: document.getElementById("iso-week"),
    totalQuestions: document.getElementById("total-questions"),
    answeredQuestions: document.getElementById("answered-questions"),
    accuracyOverall: document.getElementById("accuracy-overall"),
    masteryOverall: document.getElementById("mastery-overall"),
    weekAttempts: document.getElementById("week-attempts"),
    weekCorrect: document.getElementById("week-correct"),
    weekAvgTime: document.getElementById("week-avg-time"),
    forecast: document.getElementById("forecast"),
    appointmentsSummary: document.getElementById("appointments-summary"),
    topicsBody: document.getElementById("topics-body"),
    quizForm: document.getElementById("quiz-form"),
    quizMeta: document.getElementById("quiz-meta"),
    quizResult: document.getElementById("quiz-result"),
    nextQuestion: document.getElementById("next-question"),
    submitAnswer: document.getElementById("submit-answer"),
    resetQuiz: document.getElementById("reset-quiz"),
    quizTopic: document.getElementById("quiz-topic"),
    quizMode: document.getElementById("quiz-mode"),
    importFile: document.getElementById("import-file"),
    importReplace: document.getElementById("import-replace"),
    importParse: document.getElementById("import-parse"),
    importApply: document.getElementById("import-apply"),
    importCancel: document.getElementById("import-cancel"),
    importPreview: document.getElementById("import-preview"),
    aiGuideSpec: document.getElementById("ai-guide-spec"),
    aiGuidePrompt: document.getElementById("ai-guide-prompt"),
    managerMeta: document.getElementById("manager-meta"),
    managerCoverage: document.getElementById("manager-coverage"),
    managerSearch: document.getElementById("manager-search"),
    managerTopic: document.getElementById("manager-topic"),
    managerType: document.getElementById("manager-type"),
    managerSort: document.getElementById("manager-sort"),
    managerShowSeeded: document.getElementById("manager-show-seeded"),
    managerShowCustom: document.getElementById("manager-show-custom"),
    managerAllowSeededEdit: document.getElementById("manager-allow-seeded-edit"),
    managerSelectAllPage: document.getElementById("manager-select-all-page"),
    managerTbody: document.getElementById("manager-tbody"),
    managerLoadMore: document.getElementById("manager-load-more"),
    managerCount: document.getElementById("manager-count"),
    managerBulkCount: document.getElementById("manager-bulk-count"),
    managerSelectAll: document.getElementById("manager-select-all"),
    managerClearSelect: document.getElementById("manager-clear-select"),
    managerBulkMoveTopic: document.getElementById("manager-bulk-move-topic"),
    managerBulkMove: document.getElementById("manager-bulk-move"),
    managerBulkDelete: document.getElementById("manager-bulk-delete"),
    managerBulkType: document.getElementById("manager-bulk-type"),
    managerBulkTypeApply: document.getElementById("manager-bulk-type-apply"),
    topicCreateId: document.getElementById("topic-create-id"),
    topicCreateName: document.getElementById("topic-create-name"),
    topicCreateParent: document.getElementById("topic-create-parent"),
    topicCreate: document.getElementById("topic-create"),
    topicRenameId: document.getElementById("topic-rename-id"),
    topicRenameName: document.getElementById("topic-rename-name"),
    topicRename: document.getElementById("topic-rename"),
    topicMoveId: document.getElementById("topic-move-id"),
    topicMoveParent: document.getElementById("topic-move-parent"),
    topicMove: document.getElementById("topic-move"),
    topicDeleteId: document.getElementById("topic-delete-id"),
    topicDeleteMode: document.getElementById("topic-delete-mode"),
    topicDelete: document.getElementById("topic-delete"),
    topicActionStatus: document.getElementById("topic-action-status"),
    managerEdit: document.getElementById("manager-edit"),
    managerEditForm: document.getElementById("manager-edit-form"),
    managerEditClose: document.getElementById("manager-edit-close"),
    managerEditId: document.getElementById("manager-edit-id"),
    managerEditTopic: document.getElementById("manager-edit-topic"),
    managerEditType: document.getElementById("manager-edit-type"),
    managerEditPrompt: document.getElementById("manager-edit-prompt"),
    managerEditExplanation: document.getElementById("manager-edit-explanation"),
    managerEditSource: document.getElementById("manager-edit-source"),
    managerEditTags: document.getElementById("manager-edit-tags"),
    managerEditDifficulty: document.getElementById("manager-edit-difficulty"),
    managerEditDynamic: document.getElementById("manager-edit-dynamic"),
    managerEditStatus: document.getElementById("manager-edit-status"),
    managerEditCancel: document.getElementById("manager-edit-cancel"),
    managerEditSave: document.getElementById("manager-edit-save"),
    builderForm: document.getElementById("builder-form"),
    builderTopic: document.getElementById("builder-topic"),
    builderTopicNew: document.getElementById("builder-topic-new"),
    builderType: document.getElementById("builder-type"),
    builderId: document.getElementById("builder-id"),
    builderPrompt: document.getElementById("builder-prompt"),
    builderExplanation: document.getElementById("builder-explanation"),
    builderSource: document.getElementById("builder-source"),
    builderTags: document.getElementById("builder-tags"),
    builderDynamic: document.getElementById("builder-dynamic"),
    builderTry: document.getElementById("builder-try"),
    builderStatus: document.getElementById("builder-status"),
    exportQuestions: document.getElementById("export-questions"),
    appointmentForm: document.getElementById("appointment-form"),
    apptId: document.getElementById("appt-id"),
    apptTitle: document.getElementById("appt-title"),
    apptStart: document.getElementById("appt-start"),
    apptEnd: document.getElementById("appt-end"),
    apptCategory: document.getElementById("appt-category"),
    apptNotes: document.getElementById("appt-notes"),
    apptCancel: document.getElementById("appt-cancel"),
    appointmentsList: document.getElementById("appointments-list"),
    calendarDays: document.getElementById("calendar-days"),
    calendarLabel: document.getElementById("cal-label"),
    calendarPrev: document.getElementById("cal-prev"),
    calendarNext: document.getElementById("cal-next")
  };

  let dataStore = {
    topics: [],
    questions: [],
    packs: [],
    methods: [],
    assets: [],
    settings: {},
    meta: {}
  };
  let questionOrder = new Map();
  let managerEditId = null;
  let managerSelectedIds = new Set();
  let managerVisibleIds = [];
  let attempts = [];
  let appointments = [];
  let currentQuestionStartAt = null;

  init();

  function init() {
    bindNav();
    bindDebug();
    bindQuiz();
    bindCalendar();
    bindBuilder();
    bindManager();
    bindLogin();
    applyDebugFlags();
    setRoute("dashboard");
    restoreSession();
    if (debugEnabled) {
      ui.debugPanel.classList.remove("hidden");
    }
    logger.info("app", "init complete");
  }


  function bindNav() {
    ui.navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        setRoute(btn.dataset.route);
      });
    });
  }

  function bindDebug() {
    ui.toggleDebug.addEventListener("click", () => {
      const isHidden = ui.debugPanel.classList.toggle("hidden");
      logger.debug("debug", isHidden ? "panel closed" : "panel opened");
      updateDebugPanel();
    });
    ui.debugClose.addEventListener("click", () => {
      ui.debugPanel.classList.add("hidden");
      logger.debug("debug", "panel closed");
      updateDebugPanel();
    });
    ui.debugExport.addEventListener("click", exportDebugBundle);
    ui.debugClear.addEventListener("click", () => {
      logger.clear();
      updateDebugPanel();
    });
    ui.debugReset.addEventListener("click", () => {
      resetDemoData();
      renderDashboard();
      renderQuiz();
      renderCalendar();
      updateDebugPanel();
    });
    ui.debugTestMode.addEventListener("change", (event) => {
      state.testMode = event.target.checked;
      localStorage.setItem(
        STORAGE_KEYS.testMode,
        state.testMode ? "1" : "0"
      );
      updateDebugPanel();
    });
    ui.debugLatency.addEventListener("change", (event) => {
      state.fakeLatency = event.target.checked;
      localStorage.setItem(
        STORAGE_KEYS.fakeLatency,
        state.fakeLatency ? "1" : "0"
      );
      updateDebugPanel();
    });
  }

  function bindQuiz() {
    ui.nextQuestion.addEventListener("click", () => {
      runWithLatency(() => {
        renderQuiz(true);
      });
    });
    ui.submitAnswer.addEventListener("click", () => {
      runWithLatency(() => {
        submitAnswer();
      });
    });
    ui.resetQuiz.addEventListener("click", () => {
      renderQuiz();
    });
    ui.quizTopic.addEventListener("change", () => {
      state.quizTopic = ui.quizTopic.value;
      logger.debug("quiz", "topic change", { topic: state.quizTopic });
      renderQuiz(true);
    });
    ui.quizMode.addEventListener("change", () => {
      state.quizMode = ui.quizMode.value;
      logger.debug("quiz", "mode change", { mode: state.quizMode });
      renderQuiz(true);
    });
  }

  function bindCalendar() {
    ui.appointmentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveAppointment();
    });
    ui.apptCancel.addEventListener("click", () => {
      clearAppointmentForm();
    });
    ui.calendarPrev.addEventListener("click", () => {
      shiftMonth(-1);
    });
    ui.calendarNext.addEventListener("click", () => {
      shiftMonth(1);
    });
  }

  function bindBuilder() {
    ui.importParse.addEventListener("click", () => {
      parseImportFile(false);
    });
    ui.importApply.addEventListener("click", () => {
      parseImportFile(true);
    });
    ui.importCancel.addEventListener("click", () => {
      ui.importPreview.textContent = "";
      ui.importFile.value = "";
      state.lastImportSummary = null;
      updateDebugPanel();
    });
    ui.importFile.addEventListener("change", () => {
      if (ui.importFile.files && ui.importFile.files[0]) {
        logger.debug("import", "file selected", {
          name: ui.importFile.files[0].name
        });
      }
    });
    ui.builderType.addEventListener("change", () => {
      renderBuilderFields(ui.builderType.value);
    });
    ui.builderForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveBuiltQuestion();
    });
    ui.builderTry.addEventListener("click", () => {
      tryBuiltQuestion();
    });
    ui.exportQuestions.addEventListener("click", () => {
      exportCustomQuestions();
    });
    if (ui.aiGuideSpec) {
      ui.aiGuideSpec.addEventListener("click", () => {
        try {
          const content = buildAiFormatSpecText();
          logger.debug("builder", "ai guide generated", {
            kind: "spec",
            bytes: content.length
          });
          downloadTextFile("ap2-questionpack-v2-spec.txt", content, "spec");
        } catch (error) {
          showError("Failed to generate AI format guide.", String(error));
          logger.error("builder", "ai guide generate failed", { error: String(error) });
        }
      });
    }
    if (ui.aiGuidePrompt) {
      ui.aiGuidePrompt.addEventListener("click", () => {
        try {
          const content = buildAiPromptTemplateText();
          logger.debug("builder", "ai prompt generated", {
            kind: "prompt",
            bytes: content.length
          });
          downloadTextFile("ap2-questionpack-v2-prompt-template.txt", content, "prompt");
        } catch (error) {
          showError("Failed to generate AI prompt template.", String(error));
          logger.error("builder", "ai prompt generate failed", { error: String(error) });
        }
      });
    }
  }

  function bindManager() {
    if (!ui.managerSearch) return;
    ui.managerSearch.addEventListener("input", () => {
      state.managerSearch = ui.managerSearch.value;
      state.managerPage = 1;
      logger.debug("manager", "filter change", { search: state.managerSearch });
      renderManager();
    });
    ui.managerTopic.addEventListener("change", () => {
      state.managerTopic = ui.managerTopic.value;
      state.managerPage = 1;
      logger.debug("manager", "filter change", { topic: state.managerTopic });
      renderManager();
    });
    ui.managerType.addEventListener("change", () => {
      state.managerType = ui.managerType.value;
      state.managerPage = 1;
      logger.debug("manager", "filter change", { type: state.managerType });
      renderManager();
    });
    ui.managerSort.addEventListener("change", () => {
      state.managerSort = ui.managerSort.value;
      state.managerPage = 1;
      logger.debug("manager", "filter change", { sort: state.managerSort });
      renderManager();
    });
    ui.managerShowSeeded.addEventListener("change", () => {
      state.managerShowSeeded = ui.managerShowSeeded.checked;
      state.managerPage = 1;
      logger.debug("manager", "filter change", { showSeeded: state.managerShowSeeded });
      renderManager();
    });
    ui.managerShowCustom.addEventListener("change", () => {
      state.managerShowCustom = ui.managerShowCustom.checked;
      state.managerPage = 1;
      logger.debug("manager", "filter change", { showCustom: state.managerShowCustom });
      renderManager();
    });
    ui.managerAllowSeededEdit.addEventListener("change", () => {
      state.managerAllowSeededEdit = ui.managerAllowSeededEdit.checked;
      logger.debug("manager", "filter change", { allowSeededEdit: state.managerAllowSeededEdit });
      renderManager();
    });
    ui.managerLoadMore.addEventListener("click", () => {
      state.managerPage += 1;
      logger.debug("manager", "load more", { page: state.managerPage });
      renderManager();
    });
    if (ui.managerSelectAllPage) {
      ui.managerSelectAllPage.addEventListener("change", (event) => {
        const checked = event.target.checked;
        managerVisibleIds.forEach((id) => {
          if (checked) {
            managerSelectedIds.add(id);
          } else {
            managerSelectedIds.delete(id);
          }
        });
        renderManager();
        updateManagerSelectionUI();
      });
    }
    ui.managerTbody.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.dataset.action;
      const id = target.dataset.id;
      if (!action || !id) return;
      if (action === "edit") {
        openManagerEdit(id);
      } else if (action === "delete") {
        confirmDeleteQuestion(id);
      }
    });
    ui.managerTbody.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.dataset.action !== "select") return;
      const id = target.dataset.id;
      if (!id) return;
      if (target.checked) {
        managerSelectedIds.add(id);
      } else {
        managerSelectedIds.delete(id);
      }
      updateManagerSelectionUI();
    });
    ui.managerEditClose.addEventListener("click", () => {
      closeManagerEdit();
    });
    ui.managerEditCancel.addEventListener("click", () => {
      closeManagerEdit();
    });
    ui.managerEditForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveManagerEdit();
    });
    if (ui.managerSelectAll) {
      ui.managerSelectAll.addEventListener("click", () => {
        const all = getManagerFilteredQuestions();
        all.forEach((q) => managerSelectedIds.add(q.id));
        renderManager();
        updateManagerSelectionUI();
      });
    }
    if (ui.managerClearSelect) {
      ui.managerClearSelect.addEventListener("click", () => {
        managerSelectedIds.clear();
        renderManager();
        updateManagerSelectionUI();
      });
    }
    if (ui.managerBulkMove) {
      ui.managerBulkMove.addEventListener("click", () => {
        runWithLatency(() => bulkMoveQuestions());
      });
    }
    if (ui.managerBulkDelete) {
      ui.managerBulkDelete.addEventListener("click", () => {
        runWithLatency(() => bulkDeleteQuestions());
      });
    }
    if (ui.managerBulkTypeApply) {
      ui.managerBulkTypeApply.addEventListener("click", () => {
        runWithLatency(() => bulkChangeQuestionType());
      });
    }
    if (ui.topicCreate) {
      ui.topicCreate.addEventListener("click", () => {
        runWithLatency(() => createTopic());
      });
    }
    if (ui.topicRename) {
      ui.topicRename.addEventListener("click", () => {
        runWithLatency(() => renameTopic());
      });
    }
    if (ui.topicMove) {
      ui.topicMove.addEventListener("click", () => {
        runWithLatency(() => moveTopic());
      });
    }
    if (ui.topicDelete) {
      ui.topicDelete.addEventListener("click", () => {
        runWithLatency(() => deleteTopic());
      });
    }
  }

  function bindLogin() {
    if (!ui.loginForm) return;
    ui.loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = ui.loginUsername.value.trim();
      const password = ui.loginPassword.value;
      if (!username || !password) {
        setLoginStatus("Enter username and password.", true);
        return;
      }
      try {
        const res = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password })
        }, false);
        localStorage.setItem(STORAGE_KEYS.token, res.token);
        localStorage.setItem(STORAGE_KEYS.username, res.username);
        state.isAuthenticated = true;
        hideLogin();
        await loadInitialData();
        setLoginStatus("", false);
      } catch (error) {
        setLoginStatus("Login failed.", true);
        logger.error("auth", "login failed", { error: String(error) });
      }
    });
  }

  function restoreSession() {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (token) {
      state.isAuthenticated = true;
      hideLogin();
      loadInitialData();
    } else {
      showLogin();
    }
  }

  function applyDebugFlags() {
    state.testMode = localStorage.getItem(STORAGE_KEYS.testMode) === "1";
    state.fakeLatency = localStorage.getItem(STORAGE_KEYS.fakeLatency) === "1";
    ui.debugTestMode.checked = state.testMode;
    ui.debugLatency.checked = state.fakeLatency;
  }

  function setRoute(route) {
    state.route = route;
    Object.entries(ui.pages).forEach(([key, el]) => {
      if (key === route) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    });
    ui.navButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.route === route);
    });
    if (route === "builder") {
      logger.debug("builder", "page opened");
    }
    if (route === "manage") {
      renderManagerControls();
      renderManager();
      logger.debug("manager", "page opened");
    }
    updateDebugPanel();
  }

  function renderDashboard() {
    const now = new Date();
    const exam = new Date(EXAM_DATE_ISO + "T00:00:00");
    const daysLeft = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
    ui.countdown.textContent =
      daysLeft >= 0
        ? `Exam in ${daysLeft} days`
        : `Exam date passed (${EXAM_DATE_ISO})`;
    ui.isoWeek.textContent = getISOWeekNumber(now);

    const total = dataStore.questions.length;
    const activeIds = new Set(dataStore.questions.map((q) => q.id));
    const attemptedIds = new Set(
      attempts.filter((a) => activeIds.has(a.questionId)).map((a) => a.questionId)
    );
    const correctIds = new Set(
      attempts
        .filter((a) => a.correct && activeIds.has(a.questionId))
        .map((a) => a.questionId)
    );

    ui.totalQuestions.textContent = total;
    ui.answeredQuestions.textContent = attemptedIds.size;
    if (state.progressSummary && state.progressSummary.totals) {
      const totals = state.progressSummary.totals;
      const accuracy =
        totals.attempted_unique > 0
          ? Math.round((totals.correct_unique / totals.attempted_unique) * 100)
          : 0;
      let masteryCount = 0;
      const byType = state.progressSummary.by_type || {};
      Object.values(byType).forEach((entry) => {
        masteryCount += entry.mastery_count || 0;
      });
      ui.accuracyOverall.textContent = `${accuracy}%`;
      ui.masteryOverall.textContent = masteryCount;
    } else {
      ui.accuracyOverall.textContent = "-";
      ui.masteryOverall.textContent = "-";
    }

    renderTopicsTable(total, attemptedIds, correctIds);
    renderLearningSpeed(now, total, correctIds);
    renderAppointmentsSummary(now);
    updateDebugPanel();
  }

  function renderTopicsTable(total, attemptedIds, correctIds) {
    ui.topicsBody.innerHTML = "";
    getSortedTopics().forEach((topic) => {
      const questions = dataStore.questions.filter(
        (q) => q.topicId === topic.id
      );
      const totalTopic = questions.length;
      const done = questions.filter((q) => attemptedIds.has(q.id)).length;
      const correct = questions.filter((q) => correctIds.has(q.id)).length;
      const donePct = totalTopic ? Math.round((done / totalTopic) * 100) : 0;
      const correctPct = totalTopic
        ? Math.round((correct / totalTopic) * 100)
        : 0;
      const remainingPct = totalTopic
        ? Math.round(((totalTopic - done) / totalTopic) * 100)
        : 0;
      const sharePct = total ? Math.round((totalTopic / total) * 100) : 0;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(getTopicDisplayPath(topic.id))}</td>
        <td>${totalTopic}</td>
        <td>${donePct}</td>
        <td>${correctPct}</td>
        <td>${remainingPct}</td>
        <td>${sharePct}</td>
      `;
      ui.topicsBody.appendChild(row);
    });
  }

  function renderLearningSpeed(now, total, correctIds) {
    const weekStart = getISOWeekStart(now);
    const weekAttempts = attempts.filter(
      (a) => new Date(a.timestamp) >= weekStart
    );
    const weekCorrect = weekAttempts.filter((a) => a.correct);
    const avgTime = average(
      weekAttempts.map((a) => (typeof a.timeMs === "number" ? a.timeMs : null))
    );

    ui.weekAttempts.textContent = weekAttempts.length;
    ui.weekCorrect.textContent = weekCorrect.length;
    ui.weekAvgTime.textContent =
      avgTime === null ? "n/a" : `${Math.round(avgTime / 1000)}s`;

    const remainingCorrect = total - correctIds.size;
    if (weekCorrect.length > 0) {
      const weeks = remainingCorrect / weekCorrect.length;
      ui.forecast.textContent = `Estimate: ${weeks.toFixed(1)} weeks`;
    } else {
      ui.forecast.textContent = "Estimate: no data";
    }
  }

  function renderAppointmentsSummary(now) {
    const upcoming = appointments
      .filter((a) => new Date(a.start) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 10);
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const inNextWeek = upcoming.filter(
      (a) => new Date(a.start) <= nextWeek
    );

    ui.appointmentsSummary.innerHTML = "";
    if (upcoming.length === 0) {
      ui.appointmentsSummary.textContent = "No appointments yet.";
      return;
    }

    inNextWeek.forEach((item) => {
      const div = document.createElement("div");
      div.className = "appointment-item";
      div.textContent = `${formatDateTime(item.start)} - ${item.title}`;
      ui.appointmentsSummary.appendChild(div);
    });
  }

  async function renderQuiz(forceNext) {
    let question = state.overrideQuestion || getNextQuestion(forceNext);
    state.overrideQuestion = null;
    if (!question) {
      showWarning("No questions available.");
      ui.quizForm.innerHTML = "";
      ui.quizResult.textContent = "";
      setSubmitEnabled(false);
      return;
    }
    if (question.variants || question.randomization) {
      try {
        const seed = getQuestionSeed(question);
        const inst = await apiFetch(
          `/questions/${encodeURIComponent(question.id)}/instantiate`,
          {
            method: "POST",
            body: JSON.stringify({ seed, mode: "variant" })
          }
        );
        question = inst.question || question;
        state.currentInstance = {
          id: inst.instance_id,
          seed: inst.seed,
          params: inst.params || {}
        };
      } catch (error) {
        logger.warn("quiz", "instantiate failed", { error: String(error) });
        state.currentInstance = null;
      }
    } else {
      state.currentInstance = null;
    }
    currentQuestionStartAt = Date.now();
    state.currentQuestionId = question.id;
    state.currentTopicId = question.topicId;
    state.currentRenderedQuestion = question;
    ui.quizMeta.textContent = `Topic: ${question.topicId} | Type: ${question.type}`;
    ui.quizForm.innerHTML = "";
    ui.quizResult.textContent = "";
    const form = document.createElement("div");
    form.className = "quiz-form";
    form.id = "quiz-form";
    form.innerHTML = `<div class="quiz-prompt">${escapeHtml(question.prompt)}</div>`;
    form.innerHTML += renderSupportPanel(question);

    const type = question.type;
    if (type === "multi") {
      form.innerHTML += question.options
        .map(
          (opt, index) => `
            <label class="quiz-option">
              <input type="checkbox" name="option" value="${index}" />
              <span>${escapeHtml(opt)}</span>
            </label>
          `
        )
        .join("");
      setSubmitEnabled(true);
    } else if (type === "single") {
      form.innerHTML += question.options
        .map(
          (opt, index) => `
            <label class="quiz-option">
              <input type="radio" name="single" value="${index}" />
              <span>${escapeHtml(opt)}</span>
            </label>
          `
        )
        .join("");
      setSubmitEnabled(true);
    } else if (type === "truefalse") {
      ["true", "false"].forEach((val) => {
        form.innerHTML += `
          <label class="quiz-option">
            <input type="radio" name="truefalse" value="${val}" />
            <span>${val === "true" ? "True" : "False"}</span>
          </label>
        `;
      });
      setSubmitEnabled(true);
    } else if (type === "matching") {
      const rightOptions = shuffleArray(
        question.pairs.map((pair) => pair.right)
      );
      question.pairs.forEach((pair, idx) => {
        form.innerHTML += `
          <div class="matching-row">
            <div>${escapeHtml(pair.left)}</div>
            <select name="match-${idx}">
              <option value="">Select</option>
              ${rightOptions
                .map(
                  (opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`
                )
                .join("")}
            </select>
          </div>
        `;
      });
      setSubmitEnabled(true);
    } else if (type === "fillblank") {
      const blanks = getFillBlankAnswers(question);
      const inputs = blanks
        .map(
          (_, index) => `
            <label class="quiz-option">
              <input type="text" name="fillblank-${index}" placeholder="Blank ${index + 1}" />
            </label>
          `
        )
        .join("");
      form.innerHTML += inputs;
      setSubmitEnabled(true);
    } else if (type === "guess") {
      form.innerHTML += `
        <label class="quiz-option">
          <input type="text" name="guess" placeholder="Type the term..." />
        </label>
      `;
      setSubmitEnabled(true);
    } else if (type === "explain" || type === "exam") {
      form.innerHTML += `
        <label class="quiz-option">
          <textarea name="free" rows="4" placeholder="Write your answer..."></textarea>
        </label>
      `;
      setSubmitEnabled(true);
    } else if (type === "ordering") {
      const items = question.items || [];
      form.innerHTML += items
        .map(
          (item, index) => `
            <div class="matching-row">
              <div>${escapeHtml(item)}</div>
              <select name="order-${index}">
                <option value="">Select</option>
                ${items
                  .map(
                    (_, pos) =>
                      `<option value="${pos}">${pos + 1}</option>`
                  )
                  .join("")}
              </select>
            </div>
          `
        )
        .join("");
      setSubmitEnabled(true);
    } else if (type === "calc_value") {
      const payload = question.payload || {};
      const units = payload.accept_units || [payload.expected_unit || ""];
      form.innerHTML += `
        <label class="quiz-option">
          <input type="text" name="calc-value" placeholder="Enter value" />
        </label>
        <label class="quiz-option">
          <select name="calc-unit">
            ${units.map((u) => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join("")}
          </select>
        </label>
        <div class="muted">Round to ${payload.rounding_decimals || 2} decimals.</div>
      `;
      setSubmitEnabled(true);
    } else if (type === "calc_multi") {
      const payload = question.payload || {};
      const fields = payload.fields || [];
      fields.forEach((field) => {
        const unit = field.unit || "";
        form.innerHTML += `
          <div class="matching-row">
            <div>${escapeHtml(field.label || field.id)}</div>
            <input type="text" name="calc-field-${escapeHtml(field.id)}" placeholder="Value" />
            <input type="text" name="calc-unit-${escapeHtml(field.id)}" value="${escapeHtml(unit)}" />
          </div>
        `;
      });
      setSubmitEnabled(true);
    } else if (type === "hotspot_svg") {
      const payload = question.payload || {};
      const safeSvg = sanitizeSvg(payload.svg || "");
      form.innerHTML += `
        <div class="hotspot-wrap">${safeSvg}</div>
        <div class="muted" id="hotspot-selected">Selected: none</div>
      `;
      form._hotspotSelected = new Set();
      setSubmitEnabled(true);
      setTimeout(() => {
        const svgRoot = form.querySelector(".hotspot-wrap svg");
        const hotspots = payload.hotspots || [];
        hotspots.forEach((spot) => {
          const el = svgRoot ? svgRoot.querySelector(`#${spot.svg_element_id}`) : null;
          if (!el) return;
          el.classList.add("hotspot-clickable");
          el.addEventListener("click", () => {
            if (form._hotspotSelected.has(spot.id)) {
              form._hotspotSelected.delete(spot.id);
              el.classList.remove("hotspot-active");
            } else {
              form._hotspotSelected.add(spot.id);
              el.classList.add("hotspot-active");
            }
            const selectedText = Array.from(form._hotspotSelected).join(", ") || "none";
            const label = form.querySelector("#hotspot-selected");
            if (label) label.textContent = `Selected: ${selectedText}`;
          });
        });
      }, 0);
    } else if (type === "troubleshoot_flow") {
      renderTroubleshootFlow(form, question);
      setSubmitEnabled(true);
    } else {
      form.innerHTML += `<div class="warning">This question type is not implemented yet.</div>`;
      logger.warn("quiz", "type not implemented", { type });
      setSubmitEnabled(false);
    }

    ui.quizForm.replaceWith(form);
    ui.quizForm = form;
    updateDebugPanel();
  }

  function getQuestionSeed(question) {
    const base = `${question.id}|${attempts.length}`;
    let hash = 0;
    for (let i = 0; i < base.length; i += 1) {
      hash = (hash << 5) - hash + base.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function sanitizeSvg(svgText) {
    if (!svgText) return "";
    return svgText.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  }

  function resolveAssetById(id) {
    return (dataStore.assets || []).find((a) => a.id === id);
  }

  function renderTableAsset(asset) {
    if (!asset) return "";
    if (asset.type === "table" && asset.content && Array.isArray(asset.content.rows)) {
      const headers = Array.isArray(asset.content.headers)
        ? asset.content.headers
        : null;
      const rows = asset.content.rows;
      const headerHtml = headers
        ? `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`
        : "";
      const bodyHtml = rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
        )
        .join("");
      return `<table class="support-table">${headerHtml}${bodyHtml}</table>`;
    }
    return `<pre class="support-pre">${escapeHtml(asset.content || "")}</pre>`;
  }

  function renderSupportPanel(question) {
    const support = question.support || {};
    if (!support || Object.keys(support).length === 0) return "";
    const parts = [];
    const addSection = (title, items) => {
      if (!items || (Array.isArray(items) && items.length === 0)) return;
      const list = Array.isArray(items) ? items : [items];
      parts.push(
        `<div class="support-section"><div class="support-title">${escapeHtml(
          title
        )}</div><div class="support-body">${list
          .map((i) => `<div>${escapeHtml(String(i))}</div>`)
          .join("")}</div></div>`
      );
    };
    addSection("Given", support.given);
    addSection("Formula sheet", support.formula_sheet);
    addSection("Assumptions", support.assumptions);
    addSection("Units", support.units_guide);
    addSection("Belegsatz", support.belegsatz_snippets);
    if (support.tables && support.tables.length) {
      const tableHtml = support.tables
        .map((tbl) => {
          if (typeof tbl === "string") {
            const asset = resolveAssetById(tbl);
            return renderTableAsset(asset);
          }
          if (tbl && tbl.rows) {
            return renderTableAsset({ type: "table", content: tbl });
          }
          return "";
        })
        .join("");
      parts.push(
        `<div class="support-section"><div class="support-title">Tables</div><div class="support-body">${tableHtml}</div></div>`
      );
    }
    return `<div class="support-panel">${parts.join("")}</div>`;
  }

  function renderTroubleshootFlow(form, question) {
    const payload = question.payload || {};
    const nodes = payload.nodes || [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    form._flowState = {
      path: [],
      current: payload.start
    };
    const container = document.createElement("div");
    container.className = "flow-panel";
    const renderNode = () => {
      const node = nodeMap.get(form._flowState.current);
      if (!node) return;
      container.innerHTML = `
        <div class="flow-node">${escapeHtml(node.text || node.label || node.id)}</div>
        <div class="flow-actions"></div>
        <div class="flow-path">${form._flowState.path
          .map((p) => escapeHtml(`${p.node_id}:${p.choice_id}`))
          .join(" > ")}</div>
      `;
      const actions = container.querySelector(".flow-actions");
      (node.choices || []).forEach((choice) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ghost";
        btn.textContent = choice.label || choice.id || "Next";
        btn.addEventListener("click", () => {
          form._flowState.path.push({
            node_id: node.id,
            choice_id: choice.id,
            next: choice.next
          });
          if (choice.next) {
            form._flowState.current = choice.next;
            renderNode();
          }
        });
        actions.appendChild(btn);
      });
    };
    renderNode();
    const controls = document.createElement("div");
    controls.className = "flow-controls";
    controls.innerHTML = `
      <button type="button" class="ghost" data-action="back">Back</button>
      <button type="button" class="ghost" data-action="reset">Reset</button>
    `;
    controls.querySelector("[data-action='back']").addEventListener("click", () => {
      const last = form._flowState.path.pop();
      if (last && last.node_id) {
        form._flowState.current = last.node_id;
      }
      renderNode();
    });
    controls.querySelector("[data-action='reset']").addEventListener("click", () => {
      form._flowState.path = [];
      form._flowState.current = payload.start;
      renderNode();
    });
    form.appendChild(container);
    form.appendChild(controls);
  }

  async function submitAnswer() {
    const question =
      state.currentRenderedQuestion ||
      dataStore.questions.find((q) => q.id === state.currentQuestionId);
    if (!question) {
      showWarning("Invalid question state.");
      logger.error("quiz", "missing question");
      return;
    }

    const timeMs = currentQuestionStartAt
      ? Date.now() - currentQuestionStartAt
      : null;
    const type = question.type;
    let answerPayload = null;

    if (type === "multi") {
      const selected = Array.from(
        ui.quizForm.querySelectorAll("input[name='option']:checked")
      ).map((el) => Number(el.value));
      if (selected.length === 0) {
        showWarning("Select at least one answer.");
        return;
      }
      answerPayload = { selected };
    } else if (type === "single") {
      const value = ui.quizForm.querySelector("input[name='single']:checked");
      if (!value) {
        showWarning("Select one answer.");
        return;
      }
      answerPayload = { selected: Number(value.value) };
    } else if (type === "truefalse") {
      const value = ui.quizForm.querySelector("input[name='truefalse']:checked");
      if (!value) {
        showWarning("Select true or false.");
        return;
      }
      answerPayload = { selected: value.value === "true" };
    } else if (type === "matching") {
      const selections = question.pairs.map((pair, idx) => {
        const select = ui.quizForm.querySelector(`select[name='match-${idx}']`);
        return select ? select.value : "";
      });
      if (selections.some((v) => !v)) {
        showWarning("Please select all matches.");
        return;
      }
      answerPayload = { selected: selections };
    } else if (type === "fillblank") {
      const blanks = getFillBlankAnswers(question);
      const values = blanks.map((_, index) => {
        const input = ui.quizForm.querySelector(`input[name='fillblank-${index}']`);
        return input ? input.value.trim() : "";
      });
      if (values.some((v) => !v)) {
        showWarning("Please fill all blanks.");
        return;
      }
      answerPayload = { selected: values };
    } else if (type === "guess") {
      const input = ui.quizForm.querySelector("input[name='guess']");
      const value = input ? input.value.trim() : "";
      if (!value) {
        showWarning("Please enter an answer.");
        return;
      }
      answerPayload = { text: value };
    } else if (type === "ordering") {
      const items = question.items || [];
      const selections = items.map((_, index) => {
        const select = ui.quizForm.querySelector(`select[name='order-${index}']`);
        return select ? select.value : "";
      });
      if (selections.some((v) => v === "")) {
        showWarning("Please select an order for all items.");
        return;
      }
      answerPayload = { selected: selections.map((v) => Number(v)) };
    } else if (type === "explain" || type === "exam") {
      const input = ui.quizForm.querySelector("textarea[name='free']");
      const value = input ? input.value.trim() : "";
      if (!value) {
        showWarning("Please enter an answer.");
        return;
      }
      answerPayload = { text: value };
    } else if (type === "calc_value") {
      const value = ui.quizForm.querySelector("input[name='calc-value']");
      const unit = ui.quizForm.querySelector("select[name='calc-unit']");
      const rawValue = value ? value.value.trim() : "";
      if (!rawValue) {
        showWarning("Please enter a value.");
        return;
      }
      answerPayload = { value: rawValue, unit: unit ? unit.value : "" };
    } else if (type === "calc_multi") {
      const payload = question.payload || {};
      const fields = payload.fields || [];
      const fieldMap = {};
      for (const field of fields) {
        const valInput = ui.quizForm.querySelector(`input[name='calc-field-${field.id}']`);
        const unitInput = ui.quizForm.querySelector(`input[name='calc-unit-${field.id}']`);
        const rawValue = valInput ? valInput.value.trim() : "";
        const rawUnit = unitInput ? unitInput.value.trim() : "";
        if (!rawValue) {
          showWarning("Please fill all fields.");
          return;
        }
        fieldMap[field.id] = { value: rawValue, unit: rawUnit };
      }
      answerPayload = { fields: fieldMap };
    } else if (type === "hotspot_svg") {
      const selected = ui.quizForm._hotspotSelected
        ? Array.from(ui.quizForm._hotspotSelected)
        : [];
      if (selected.length === 0) {
        showWarning("Select at least one hotspot.");
        return;
      }
      answerPayload = { selected };
    } else if (type === "troubleshoot_flow") {
      const path = ui.quizForm._flowState ? ui.quizForm._flowState.path : [];
      const finalNode = ui.quizForm._flowState ? ui.quizForm._flowState.current : null;
      answerPayload = { path, final_node: finalNode };
    } else {
      showWarning("This question type is not implemented yet.");
      logger.warn("quiz", "submit on unimplemented type", { type });
      return;
    }

    let grade;
    try {
      grade = await apiFetch(`/questions/${encodeURIComponent(question.id)}/grade`, {
        method: "POST",
        body: JSON.stringify({
          answer: answerPayload,
          seed: state.currentInstance ? state.currentInstance.seed : null,
          instance_params: state.currentInstance ? state.currentInstance.params : null,
          time_ms: timeMs
        })
      });
    } catch (error) {
      showError("Grading failed.", String(error));
      logger.error("quiz", "grade failed", { error: String(error) });
      return;
    }

    if (grade.status === "needs_self_grade") {
      showSelfCheck(question, timeMs, grade.expected, grade.solution, {
        answer: answerPayload,
        instance_id: state.currentInstance ? state.currentInstance.id : null,
        seed: state.currentInstance ? state.currentInstance.seed : null,
        params: state.currentInstance ? state.currentInstance.params : null
      });
      return;
    }

    const correct = !!grade.correct;
    const attempt = {
      id: `att_${Date.now()}`,
      questionId: question.id,
      selected: {
        answer: answerPayload,
        instance_id: state.currentInstance ? state.currentInstance.id : null,
        seed: state.currentInstance ? state.currentInstance.seed : null,
        params: state.currentInstance ? state.currentInstance.params : null
      },
      correct,
      graded_by_user: false,
      timestamp: new Date().toISOString(),
      timeMs
    };
    await postAttempt(attempt);

    const solutionText = formatSolution(grade.solution);
    ui.quizResult.innerHTML = `
      <div>${correct ? "Correct" : "Incorrect"} | Expected: ${escapeHtml(grade.expected || "")}</div>
      ${solutionText ? `<div class="muted">${solutionText}</div>` : ""}
      <div class="muted">${escapeHtml(question.explanation || "")}</div>
      <div class="muted">Source: ${escapeHtml(question.source_ref || "")}</div>
    `;
    logger.info("quiz", "answer submitted", {
      questionId: question.id,
      type,
      correct,
      graded_by_user: false
    });
    renderDashboard();
    updateDebugPanel();
  }

  function renderCalendar() {
    const now = new Date();
    renderCalendarGrid(now);
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.start) - new Date(b.start)
    );

    ui.appointmentsList.innerHTML = "";
    if (sorted.length === 0) {
      ui.appointmentsList.textContent = "No appointments yet.";
      return;
    }

    sorted.forEach((appt) => {
      const isPast = new Date(appt.start) < now;
      const item = document.createElement("div");
      item.className = "calendar-item";
      const timeText = `${formatDateTime(appt.start)}${
        appt.end ? " - " + formatDateTime(appt.end) : ""
      }`;
      item.innerHTML = `
        <div><strong>${escapeHtml(appt.title)}</strong></div>
        <div class="muted">${timeText}${isPast ? " (past)" : ""}</div>
        <div class="muted">${escapeHtml(appt.category || "no category")}</div>
        <div>${escapeHtml(appt.notes || "")}</div>
        <div class="calendar-actions">
          <button class="ghost" data-action="edit" data-id="${appt.id}">Edit</button>
          <button class="ghost" data-action="delete" data-id="${appt.id}">Delete</button>
        </div>
      `;
      ui.appointmentsList.appendChild(item);
    });

    ui.appointmentsList
      .querySelectorAll("button[data-action]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          if (action === "edit") {
            loadAppointmentToForm(id);
          } else if (action === "delete") {
            deleteAppointment(id);
          }
        });
      });
  }

  function renderCalendarGrid(now) {
    const monthStart = new Date(state.calendarMonth);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    ui.calendarLabel.textContent = `${monthStart.toLocaleString("default", {
      month: "long"
    })} ${year}`;

    const firstDay = new Date(year, month, 1);
    const startIndex = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startIndex);
    const days = 42;

    ui.calendarDays.innerHTML = "";
    for (let i = 0; i < days; i++) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + i);
      const isOutside = day.getMonth() !== month;
      const dateKey = toLocalDateKey(day);
      const dayAppointments = appointments.filter(
        (a) => toLocalDateKey(new Date(a.start)) === dateKey
      );

      const cell = document.createElement("div");
      cell.className = `calendar-day${isOutside ? " outside" : ""}`;
      cell.innerHTML = `
        <div class="calendar-day-number">${day.getDate()}</div>
        ${dayAppointments
          .map(
            (appt) =>
              `<div class="calendar-entry">${escapeHtml(appt.title)}</div>`
          )
          .join("")}
      `;
      if (!isOutside) {
        cell.addEventListener("click", () => {
          ui.apptStart.value = `${dateKey}T09:00`;
          ui.apptTitle.focus();
        });
      }
      ui.calendarDays.appendChild(cell);
    }
  }

  function getNextQuestion(forceNext) {
    const filtered = getFilteredQuestions();
    if (filtered.length === 0) {
      logger.error("quiz", "no questions for filters", {
        topic: state.quizTopic,
        mode: state.quizMode
      });
      return null;
    }
    if (state.testMode) {
      if (forceNext) {
        state.questionIndex =
          (state.questionIndex + 1) % filtered.length;
      }
      const q = filtered[state.questionIndex];
      logger.debug("quiz", "question selected", {
        topic: state.quizTopic,
        mode: state.quizMode,
        question_id: q.id,
        type: q.type
      });
      return q;
    }
    const index = Math.floor(getRng() * filtered.length);
    const q = filtered[index];
    logger.debug("quiz", "question selected", {
      topic: state.quizTopic,
      mode: state.quizMode,
      question_id: q.id,
      type: q.type
    });
    return q;
  }

  function compareSelections(selected, correctIndexes) {
    if (selected.length !== correctIndexes.length) {
      return false;
    }
    const a = [...selected].sort().join(",");
    const b = [...correctIndexes].sort().join(",");
    return a === b;
  }

  function refreshDataStore() {
    loadInitialData();
  }

  function hydratePackRegistry() {
    const packs = Array.isArray(dataStore.packs) ? dataStore.packs : [];
    if (packs.length === 0) return;
    const pick =
      packs.find((p) => p.id === "default_pack") ||
      packs.find((p) => p.schema === "quiztab-questionpack-v2") ||
      packs[0];
    const parseField = (val, fallback) => {
      if (!val) return fallback;
      if (typeof val === "object") return val;
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    };
    dataStore.meta = parseField(pick.meta, {});
    dataStore.settings = parseField(pick.settings, {});
    dataStore.methods = parseField(pick.methods, []);
    dataStore.assets = parseField(pick.assets, []);
  }

  // Attempts and appointments are stored on the backend.

  function seedData() {
    return {
      topics: [
        { id: "netzwerk", name: "Netzwerk Grundlagen" },
        { id: "elektro", name: "Elektrotechnik" },
        { id: "it", name: "IT Systeme" }
      ],
      questions: [
        {
          id: "q1",
          topicId: "netzwerk",
          type: "multi",
          prompt: "Welche Aussagen zu IPv4 sind korrekt?",
          options: [
            "IPv4 nutzt 32 Bit Adressen",
            "IPv4 hat 128 Bit Adressen",
            "Private Netze nutzen z.B. 192.168.0.0/16",
            "IPv4 kann keine Subnetze nutzen"
          ],
          correctIndexes: [0, 2],
          explanation: "IPv4 nutzt 32 Bit und private Netze sind definiert.",
          source_ref: "Library/Netzwerk/Grundlagen/ip-adressierung-v4-v6.md"
        },
        {
          id: "q2",
          topicId: "netzwerk",
          type: "multi",
          prompt: "Welche Protokolle sind Layer 2?",
          options: ["Ethernet", "IP", "TCP", "ARP"],
          correctIndexes: [0, 3],
          explanation: "Ethernet und ARP arbeiten am Link Layer.",
          source_ref: "Library/Netzwerk/Grundlagen/osi-tcpip-ethernet.md"
        },
        {
          id: "q3",
          topicId: "elektro",
          type: "multi",
          prompt: "Welche Aussagen zum Ohmschen Gesetz stimmen?",
          options: [
            "U = R * I",
            "I = U / R",
            "R = U * I",
            "R = U / I"
          ],
          correctIndexes: [0, 1, 3],
          explanation: "Ohmsches Gesetz: U = R * I.",
          source_ref: "Library/Elektrotechnik/Grundlagen/spannung-strom-ohm.md"
        },
        {
          id: "q4",
          topicId: "elektro",
          type: "multi",
          prompt: "Welche Schutzeinrichtungen koennen Fehlerstrom erfassen?",
          options: ["RCD", "LS Schalter", "FI", "NH Sicherung"],
          correctIndexes: [0, 2],
          explanation: "RCD und FI sind Fehlerstromschutz.",
          source_ref: "Library/Elektrotechnik/Schutztechnik/rcd-fi-fehlerstromschutz.md"
        },
        {
          id: "q5",
          topicId: "it",
          type: "multi",
          prompt: "Welche Aussagen zur CIA Triad sind korrekt?",
          options: [
            "C steht fuer Confidentiality",
            "I steht fuer Integrity",
            "A steht fuer Availability",
            "C steht fuer Compliance"
          ],
          correctIndexes: [0, 1, 2],
          explanation: "CIA Triad: Confidentiality, Integrity, Availability.",
          source_ref:
            "Library/IT-Systeme/Grundlagen/cia-triad-datenschutz-datensicherheit.md"
        },
        {
          id: "q6",
          topicId: "it",
          type: "multi",
          prompt: "Welche Aussagen zu Backups stimmen?",
          options: [
            "3-2-1 Regel: 3 Kopien auf 2 Medien, 1 extern",
            "RAID ist immer ein Backup",
            "Backups sollten regelmaessig getestet werden",
            "Snapshots ersetzen alle Backups"
          ],
          correctIndexes: [0, 2],
          explanation: "RAID ist kein Backup, Tests sind wichtig.",
          source_ref:
            "Library/IT-Systeme/Dienste/backupverfahren-3-2-1-generationenprinzip.md"
        },
        {
          id: "tf1",
          topicId: "netzwerk",
          type: "truefalse",
          prompt: "IPv4 nutzt 32 Bit Adressen.",
          correctBoolean: true,
          explanation: "IPv4 ist 32 Bit.",
          source_ref: "Library/Netzwerk/Grundlagen/ip-adressierung-v4-v6.md"
        },
        {
          id: "tf2",
          topicId: "netzwerk",
          type: "truefalse",
          prompt: "VLANs arbeiten auf Layer 3.",
          correctBoolean: false,
          explanation: "VLANs sind Layer 2 Segmentierung.",
          source_ref: "Library/Netzwerk/VLAN/vlan-grundlagen-trunk-tagging.md"
        },
        {
          id: "tf3",
          topicId: "elektro",
          type: "truefalse",
          prompt: "RCD und FI sind Fehlerstromschutz.",
          correctBoolean: true,
          explanation: "RCD/FI sind Fehlerstromschutz.",
          source_ref: "Library/Elektrotechnik/Schutztechnik/rcd-fi-fehlerstromschutz.md"
        },
        {
          id: "tf4",
          topicId: "elektro",
          type: "truefalse",
          prompt: "Der Schutzleiter darf geschaltet werden.",
          correctBoolean: false,
          explanation: "Der Schutzleiter darf nicht geschaltet werden.",
          source_ref: "Library/Elektrotechnik/Sicherheit/fuenf-sicherheitsregeln.md"
        },
        {
          id: "tf5",
          topicId: "it",
          type: "truefalse",
          prompt: "RAID ersetzt ein Backup.",
          correctBoolean: false,
          explanation: "RAID ist kein Backup.",
          source_ref:
            "Library/IT-Systeme/Dienste/raid-grundlagen.md"
        },
        {
          id: "m1",
          topicId: "netzwerk",
          type: "matching",
          prompt: "Match protocol to function.",
          pairs: [
            { left: "DHCP", right: "IP Address Assignment" },
            { left: "DNS", right: "Name Resolution" },
            { left: "NAT", right: "Address Translation" }
          ],
          explanation: "These are core network services.",
          source_ref: "Library/Netzwerk/Dienste/dhcp-dns.md"
        },
        {
          id: "m2",
          topicId: "netzwerk",
          type: "matching",
          prompt: "Match OSI layer to example.",
          pairs: [
            { left: "Layer 2", right: "Ethernet" },
            { left: "Layer 3", right: "IP" },
            { left: "Layer 4", right: "TCP" }
          ],
          explanation: "OSI layers have typical protocols.",
          source_ref: "Library/Netzwerk/Grundlagen/osi-tcpip-ethernet.md"
        },
        {
          id: "m3",
          topicId: "elektro",
          type: "matching",
          prompt: "Match device to role.",
          pairs: [
            { left: "LS", right: "Overcurrent protection" },
            { left: "RCD", right: "Residual current protection" },
            { left: "SLS", right: "Selective main protection" }
          ],
          explanation: "Protection devices have different roles.",
          source_ref: "Library/Elektrotechnik/Schutztechnik/selektivitaet-sls.md"
        },
        {
          id: "m4",
          topicId: "it",
          type: "matching",
          prompt: "Match term to meaning.",
          pairs: [
            { left: "CIA", right: "Security goals" },
            { left: "VM", right: "Virtual machine" },
            { left: "NAS", right: "Network storage" }
          ],
          explanation: "Common IT terms.",
          source_ref: "Library/IT-Systeme/Virtualisierung/virtualisierung-hypervisor-grundlagen.md"
        },
        {
          id: "m5",
          topicId: "it",
          type: "matching",
          prompt: "Match service to type.",
          pairs: [
            { left: "SaaS", right: "Software as a Service" },
            { left: "PaaS", right: "Platform as a Service" },
            { left: "IaaS", right: "Infrastructure as a Service" }
          ],
          explanation: "Cloud service models.",
          source_ref: "Library/IT-Systeme/Dienste/cloud-services-saas-paas-iaas.md"
        },
        {
          id: "fb1",
          topicId: "netzwerk",
          type: "fillblank",
          prompt: "Fill in the blank: IPv4 has ___ bits.",
          expectedAnswers: ["32"],
          explanation: "IPv4 uses 32-bit addresses.",
          source_ref: "Library/Netzwerk/Grundlagen/ip-adressierung-v4-v6.md"
        },
        {
          id: "fb2",
          topicId: "netzwerk",
          type: "fillblank",
          prompt: "Fill in the blank: VLAN tags use standard ___ .",
          expectedAnswers: ["802.1q", "8021q"],
          explanation: "VLAN tagging uses IEEE 802.1Q.",
          source_ref: "Library/Netzwerk/VLAN/vlan-grundlagen-trunk-tagging.md"
        },
        {
          id: "fb3",
          topicId: "elektro",
          type: "fillblank",
          prompt: "Fill in the blank: U = R * ___.",
          expectedAnswers: ["I", "i"],
          explanation: "Ohmsches Gesetz.",
          source_ref: "Library/Elektrotechnik/Grundlagen/spannung-strom-ohm.md"
        },
        {
          id: "fb4",
          topicId: "elektro",
          type: "fillblank",
          prompt: "Fill in the blank: A FI is a ___ device.",
          expectedAnswers: ["fehlerstromschutz", "rcd"],
          explanation: "FI is a residual current device.",
          source_ref: "Library/Elektrotechnik/Schutztechnik/rcd-fi-fehlerstromschutz.md"
        },
        {
          id: "fb5",
          topicId: "it",
          type: "fillblank",
          prompt: "Fill in the blank: CIA stands for Confidentiality, Integrity, and ___.",
          expectedAnswers: ["availability"],
          explanation: "CIA triad.",
          source_ref: "Library/IT-Systeme/Grundlagen/cia-triad-datenschutz-datensicherheit.md"
        },
        {
          id: "s1",
          topicId: "netzwerk",
          type: "single",
          prompt: "Which port is standard for HTTPS?",
          options: ["80", "443", "53", "22"],
          correctIndex: 1,
          explanation: "HTTPS uses port 443.",
          source_ref: "Library/Netzwerk/Grundlagen/osi-tcpip-ethernet.md"
        },
        {
          id: "s2",
          topicId: "elektro",
          type: "single",
          prompt: "Which unit is for electrical current?",
          options: ["Volt", "Ampere", "Ohm", "Watt"],
          correctIndex: 1,
          explanation: "Current is measured in Ampere.",
          source_ref: "Library/Elektrotechnik/Grundlagen/spannung-strom-ohm.md"
        },
        {
          id: "s3",
          topicId: "it",
          type: "single",
          prompt: "Which is a backup rule?",
          options: ["3-2-1", "4-4-2", "1-1-1", "2-3-5"],
          correctIndex: 0,
          explanation: "3-2-1 is common backup rule.",
          source_ref:
            "Library/IT-Systeme/Dienste/backupverfahren-3-2-1-generationenprinzip.md"
        },
        {
          id: "g1",
          topicId: "netzwerk",
          type: "guess",
          prompt: "Guess the word: Protocol that assigns IP addresses automatically.",
          expectedAnswers: ["dhcp"],
          explanation: "DHCP assigns IP addresses.",
          source_ref: "Library/Netzwerk/Dienste/dhcp-dns.md"
        },
        {
          id: "g2",
          topicId: "elektro",
          type: "guess",
          prompt: "Guess the word: Device that protects against residual current.",
          expectedAnswers: ["rcd", "fi"],
          explanation: "RCD/FI is residual current device.",
          source_ref: "Library/Elektrotechnik/Schutztechnik/rcd-fi-fehlerstromschutz.md"
        },
        {
          id: "g3",
          topicId: "it",
          type: "guess",
          prompt: "Guess the word: Security goals trio (C, I, A).",
          expectedAnswers: ["cia"],
          explanation: "CIA triad.",
          source_ref:
            "Library/IT-Systeme/Grundlagen/cia-triad-datenschutz-datensicherheit.md"
        },
        {
          id: "e1",
          topicId: "netzwerk",
          type: "explain",
          prompt: "Explain VLANs in one or two sentences.",
          expectedAnswer: "Segmentiert Layer 2 Netzwerke logisch, trennt Broadcast Domains.",
          explanation: "VLANs segment networks at Layer 2.",
          source_ref: "Library/Netzwerk/VLAN/vlan-grundlagen-trunk-tagging.md"
        },
        {
          id: "e2",
          topicId: "elektro",
          type: "explain",
          prompt: "Explain the purpose of protective earth (PE).",
          expectedAnswer: "Sichert gegen Fehlerstrom und leitet ihn ab.",
          explanation: "PE protects against fault current.",
          source_ref: "Library/Elektrotechnik/Sicherheit/schutz-gegen-elektrischen-schlag.md"
        },
        {
          id: "e3",
          topicId: "it",
          type: "explain",
          prompt: "Explain the 3-2-1 backup rule.",
          expectedAnswer: "3 copies, 2 media, 1 offsite.",
          explanation: "3-2-1 is a backup best practice.",
          source_ref:
            "Library/IT-Systeme/Dienste/backupverfahren-3-2-1-generationenprinzip.md"
        },
        {
          id: "x1",
          topicId: "netzwerk",
          type: "exam",
          prompt: "Exam scenario: Design a small VLAN plan for 3 departments with 60 clients. Outline VLAN IDs and subnets.",
          expectedAnswer: "Provide VLAN IDs and /26 or /25 subnets per department.",
          explanation: "Keep subnets per department and document VLAN IDs.",
          source_ref: "Library/Netzwerk/Methoden/checkliste-vlan-plan.md"
        },
        {
          id: "x2",
          topicId: "elektro",
          type: "exam",
          prompt: "Exam scenario: Describe steps for safe work on electrical equipment.",
          expectedAnswer: "Five safety rules in order.",
          explanation: "Use five safety rules.",
          source_ref: "Library/Elektrotechnik/Sicherheit/fuenf-sicherheitsregeln.md"
        },
        {
          id: "x3",
          topicId: "it",
          type: "exam",
          prompt: "Exam scenario: Plan a backup strategy for a small office.",
          expectedAnswer: "Define 3-2-1, schedule, and test plan.",
          explanation: "Use 3-2-1 and test restores.",
          source_ref:
            "Library/IT-Systeme/Dienste/backupverfahren-3-2-1-generationenprinzip.md"
        },
        {
          id: "o1",
          topicId: "netzwerk",
          type: "ordering",
          prompt: "Order the steps for basic network troubleshooting.",
          items: ["Check link", "Check IP config", "Ping gateway"],
          correct_order: [0, 1, 2],
          explanation: "Start physical, then config, then reachability.",
          source_ref: "Library/Netzwerk/Methoden/troubleshooting-dhcp.md"
        },
        {
          id: "o2",
          topicId: "elektro",
          type: "ordering",
          prompt: "Order the five safety rules (simplified).",
          items: ["Disconnect", "Secure against restart", "Verify absence of voltage"],
          correct_order: [0, 1, 2],
          explanation: "First disconnect, secure, then verify.",
          source_ref: "Library/Elektrotechnik/Sicherheit/fuenf-sicherheitsregeln.md"
        },
        {
          id: "o3",
          topicId: "it",
          type: "ordering",
          prompt: "Order a simple backup workflow.",
          items: ["Plan", "Run backup", "Test restore"],
          correct_order: [0, 1, 2],
          explanation: "Plan first, then run, then test.",
          source_ref:
            "Library/IT-Systeme/Dienste/backupverfahren-3-2-1-generationenprinzip.md"
        }
      ]
    };
  }

  function renderQuizControls() {
    ui.quizTopic.innerHTML = "";
    ui.quizMode.innerHTML = "";
    const topicOptions = [{ id: "all", name: "All Topics (Mixed)" }, ...getSortedTopics()];
    topicOptions.forEach((topic) => {
      const opt = document.createElement("option");
      opt.value = topic.id;
      opt.textContent =
        topic.id === "all" ? topic.name : formatTopicLabel(topic);
      ui.quizTopic.appendChild(opt);
    });
    ui.quizTopic.value = state.quizTopic;

    const modes = [
      { id: "single", name: "Multiple Choice (single answer)" },
      { id: "truefalse", name: "True/False" },
      { id: "multi", name: "Multiple Response / Multi-select" },
      { id: "matching", name: "Matching" },
      { id: "fillblank", name: "Fill-in-the-Blank" },
      { id: "ordering", name: "Ordering" },
      { id: "calc_value", name: "Calc (single value)" },
      { id: "calc_multi", name: "Calc (multi-field)" },
      { id: "hotspot_svg", name: "Hotspot (SVG)" },
      { id: "troubleshoot_flow", name: "Troubleshoot Flow" },
      { id: "explain", name: "Explain Term" },
      { id: "guess", name: "Guess the Word" },
      { id: "exam", name: "Exam Template" },
      { id: "mixed", name: "Mixed Mode" }
    ];
    modes.forEach((mode) => {
      const opt = document.createElement("option");
      opt.value = mode.id;
      opt.textContent = mode.name;
      ui.quizMode.appendChild(opt);
    });
    ui.quizMode.value = state.quizMode;
  }

  function renderBuilderControls() {
    if (!ui.builderTopic || !ui.builderType) {
      return;
    }
    ui.builderTopic.innerHTML = "";
    getSortedTopics().forEach((topic) => {
      const opt = document.createElement("option");
      opt.value = topic.id;
      opt.textContent = formatTopicLabel(topic);
      ui.builderTopic.appendChild(opt);
    });
    ui.builderType.innerHTML = "";
    const types = [
      { id: "single", name: "Multiple Choice (single answer)" },
      { id: "multi", name: "Multiple Response / Multi-select" },
      { id: "truefalse", name: "True/False" },
      { id: "fillblank", name: "Fill-in-the-Blank" },
      { id: "matching", name: "Matching" },
      { id: "ordering", name: "Ordering" },
      { id: "calc_value", name: "Calc (single value)" },
      { id: "calc_multi", name: "Calc (multi-field)" },
      { id: "hotspot_svg", name: "Hotspot (SVG)" },
      { id: "troubleshoot_flow", name: "Troubleshoot Flow" },
      { id: "guess", name: "Guess the Word" },
      { id: "explain", name: "Explain Term" },
      { id: "exam", name: "Exam Template" }
    ];
    types.forEach((type) => {
      const opt = document.createElement("option");
      opt.value = type.id;
      opt.textContent = type.name;
      ui.builderType.appendChild(opt);
    });
    if (!ui.builderType.value) {
      ui.builderType.value = "multi";
    }
    renderBuilderFields(ui.builderType.value);
  }

  function renderBuilderFields(type) {
    if (!ui.builderDynamic) {
      return;
    }
    if (type === "single" || type === "multi") {
      ui.builderDynamic.innerHTML = `
        <label>
          Options (one per line)
          <textarea id="builder-options" rows="4"></textarea>
        </label>
        <label>
          Correct index list (comma)
          <input id="builder-correct" type="text" placeholder="0,2" />
        </label>
      `;
    } else if (type === "truefalse") {
      ui.builderDynamic.innerHTML = `
        <label>
          Correct (true/false)
          <select id="builder-correct-boolean">
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </label>
      `;
    } else if (type === "fillblank") {
      ui.builderDynamic.innerHTML = `
        <label>
          Answers per blank (one line per blank, comma separated)
          <textarea id="builder-answers" rows="3" placeholder="answer1, answer2"></textarea>
        </label>
      `;
    } else if (type === "matching") {
      ui.builderDynamic.innerHTML = `
        <label>
          Left items (one per line)
          <textarea id="builder-left" rows="3"></textarea>
        </label>
        <label>
          Right items (one per line)
          <textarea id="builder-right" rows="3"></textarea>
        </label>
        <label>
          Pairs (leftIndex-rightIndex per line, optional)
          <textarea id="builder-pairs" rows="2" placeholder="0-0"></textarea>
        </label>
      `;
    } else if (type === "ordering") {
      ui.builderDynamic.innerHTML = `
        <label>
          Items (one per line)
          <textarea id="builder-items" rows="3"></textarea>
        </label>
        <label>
          Correct order indices (comma)
          <input id="builder-order" type="text" placeholder="2,0,1" />
        </label>
      `;
    } else if (type === "guess") {
      ui.builderDynamic.innerHTML = `
        <label>
          Accepted answers (comma)
          <input id="builder-answers" type="text" placeholder="answer1, answer2" />
        </label>
      `;
    } else if (type === "explain") {
      ui.builderDynamic.innerHTML = `
        <label>
          Keywords (comma, optional)
          <input id="builder-keywords" type="text" />
        </label>
      `;
    } else if (type === "exam") {
      ui.builderDynamic.innerHTML = `
        <label>
          Grading mode
          <select id="builder-grading">
            <option value="self">Self</option>
          </select>
        </label>
      `;
    } else {
      ui.builderDynamic.innerHTML = `<div class="warning">Unknown type.</div>`;
    }
  }

  function parseImportFile(applyImport) {
    const file = ui.importFile.files ? ui.importFile.files[0] : null;
    if (!file) {
      showWarning("Select a JSON file first.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        lastImportSnapshot = json;
        const result = validateQuestionPack(json);
        state.lastImportSummary = result.summary;
        ui.importPreview.textContent = renderImportSummary(result);
        logger.debug("import", "validation result", result.summary);
        if (applyImport) {
          applyImportResult(json, result, ui.importReplace.checked);
        }
      } catch (error) {
        lastErrorStack = error && error.stack ? error.stack : String(error);
        showError("Invalid JSON file.");
        logger.error("import", "parse failed", { error: String(error) });
      }
      updateDebugPanel();
    };
    reader.readAsText(file);
  }

  function validateQuestionPack(pack) {
    const errors = [];
    const summary = {
      total: 0,
      valid: 0,
      invalid: 0,
      topics: {},
      types: {}
    };
    if (!pack || !pack.schema) {
      errors.push("Invalid schema.");
      return { errors, summary, questions: [], topics: [] };
    }
    if (pack.schema === "quiztab-questionpack-v2") {
      return normalizeQuiztabV2Pack(pack, errors, summary);
    }
    if (pack.schema !== "ap2-questionpack-v1" && pack.schema !== "ap2-questionpack-v2") {
      errors.push("Invalid schema.");
      return { errors, summary, questions: [], topics: [] };
    }
    const topics = Array.isArray(pack.topics) ? pack.topics : [];
    const questions = Array.isArray(pack.questions) ? pack.questions : [];
    const topicMap = new Map();
    topics.forEach((t) => {
      if (!t.slug) {
        errors.push("Topic missing slug.");
        return;
      }
      const title = t.title || slugToTitle(t.slug);
      topicMap.set(t.slug, {
        id: t.slug,
        name: title,
        topic_area: t.topic_area || ""
      });
    });

    const normalizedQuestions = [];
    questions.forEach((q) => {
      summary.total += 1;
      const normalized = normalizeQuestion(q, topicMap, errors);
      if (normalized) {
        normalizedQuestions.push(normalized);
        summary.valid += 1;
        summary.types[normalized.type] = (summary.types[normalized.type] || 0) + 1;
        summary.topics[normalized.topicId] =
          (summary.topics[normalized.topicId] || 0) + 1;
      } else {
        summary.invalid += 1;
      }
    });
    return { errors, summary, questions: normalizedQuestions, topics: Array.from(topicMap.values()) };
  }

  function normalizeQuiztabV2Pack(pack, errors, summary) {
    const topics = Array.isArray(pack.topics) ? pack.topics : [];
    const questions = Array.isArray(pack.questions) ? pack.questions : [];
    const topicMap = new Map();
    topics.forEach((t) => {
      if (!t.slug) {
        errors.push("Topic missing slug.");
        return;
      }
      const title = t.title || slugToTitle(t.slug);
      topicMap.set(t.slug, {
        id: t.slug,
        name: title,
        topic_area: t.topic_area || "",
        parent_id: t.parent_topic_id || t.parent_id || null,
        path: t.path || t.slug,
        depth: typeof t.depth === "number" ? t.depth : 0
      });
    });
    const normalizedQuestions = [];
    questions.forEach((q) => {
      summary.total += 1;
      const normalized = normalizeQuiztabQuestion(q, topicMap, errors);
      if (normalized) {
        normalizedQuestions.push(normalized);
        summary.valid += 1;
        summary.types[normalized.type] = (summary.types[normalized.type] || 0) + 1;
        summary.topics[normalized.topicId] =
          (summary.topics[normalized.topicId] || 0) + 1;
      } else {
        summary.invalid += 1;
      }
    });
    return {
      errors,
      summary,
      questions: normalizedQuestions,
      topics: Array.from(topicMap.values()),
      methods: Array.isArray(pack.methods) ? pack.methods : [],
      assets: Array.isArray(pack.assets) ? pack.assets : [],
      settings: pack.settings || {},
      meta: pack.meta || {}
    };
  }

  function normalizeQuiztabQuestion(input, topicMap, errors) {
    if (!input || !input.id || !input.method_id) {
      errors.push("Question missing id or method_id.");
      return null;
    }
    const typeMap = { guessword: "guess", explainterm: "explain" };
    const methodId = typeMap[input.method_id] || input.method_id;
    const topicSlug = input.topic_slug || "";
    if (!topicSlug) {
      errors.push(`Question ${input.id} missing topic_slug.`);
      return null;
    }
    if (!topicMap.has(topicSlug)) {
      topicMap.set(topicSlug, {
        id: topicSlug,
        name: slugToTitle(topicSlug),
        topic_area: ""
      });
    }
    const prompt = input.prompt;
    if (!prompt) {
      errors.push(`Question ${input.id} missing prompt.`);
      return null;
    }
    const base = {
      id: input.id,
      topicId: topicSlug,
      type: methodId,
      method_id: methodId,
      prompt,
      payload: input.payload || {},
      support: input.support || {},
      solution: input.solution || {},
      difficulty: input.difficulty || "",
      variants: Array.isArray(input.variants) ? input.variants : [],
      randomization: input.randomization || null,
      explanation: input.explanation || "",
      source_ref: input.source_ref || "internal:import",
      tags: Array.isArray(input.tags) ? input.tags : []
    };
    const payload = base.payload || {};
    if (base.type === "single") {
      if (Array.isArray(payload.options)) {
        base.options = payload.options;
      }
      if (Array.isArray(payload.correct)) {
        base.correctIndex = payload.correct[0];
      } else if (Number.isInteger(payload.correct)) {
        base.correctIndex = payload.correct;
      } else if (typeof payload.correct === "string" && payload.correct.trim() !== "") {
        const parsed = Number(payload.correct);
        if (!Number.isNaN(parsed)) base.correctIndex = parsed;
      }
    }
    if (base.type === "multi") {
      if (Array.isArray(payload.options)) {
        base.options = payload.options;
      }
      if (Array.isArray(payload.correct)) {
        base.correctIndexes = payload.correct;
      } else if (Number.isInteger(payload.correct)) {
        base.correctIndexes = [payload.correct];
      } else if (typeof payload.correct === "string" && payload.correct.trim() !== "") {
        const parsed = Number(payload.correct);
        if (!Number.isNaN(parsed)) base.correctIndexes = [parsed];
      }
    }
    if (base.type === "truefalse" && typeof payload.correct === "boolean") {
      base.correctBoolean = payload.correct;
    }
    if (base.type === "fillblank" && Array.isArray(payload.blanks)) {
      base.answers = payload.blanks;
    }
    if (base.type === "matching") {
      if (Array.isArray(payload.pairs) && payload.pairs.length > 0 && payload.pairs[0].left) {
        base.pairs = payload.pairs;
      } else if (Array.isArray(payload.left) && Array.isArray(payload.right) && Array.isArray(payload.pairs)) {
        base.pairs = payload.pairs
          .map((pair) => ({ left: payload.left[pair[0]], right: payload.right[pair[1]] }))
          .filter((pair) => pair.left && pair.right);
      }
    }
    if (base.type === "ordering") {
      base.items = payload.items || base.items;
      base.correct_order = payload.correct_order || base.correct_order;
    }
    if (base.type === "guess" && Array.isArray(payload.answers)) {
      base.expectedAnswers = payload.answers;
    }
    if (base.type === "explain" && payload.expectedAnswer) {
      base.expectedAnswer = payload.expectedAnswer;
    }
    if (base.type === "exam" && payload.expectedAnswer) {
      base.expectedAnswer = payload.expectedAnswer;
    }
    return base;
  }

  function normalizeQuestion(input, topicMap, errors) {
    if (!input || !input.id || !input.type) {
      errors.push(`Question missing id or type.`);
      return null;
    }
    const rawType = input.type;
    const typeMap = {
      guessword: "guess",
      explainterm: "explain"
    };
    const type = typeMap[rawType] || rawType;
    const topicSlug = input.topic_slug || input.topicId || input.topic || "";
    if (!topicSlug) {
      errors.push(`Question ${input.id} missing topic_slug.`);
      return null;
    }
    if (!topicMap.has(topicSlug)) {
      topicMap.set(topicSlug, {
        id: topicSlug,
        name: slugToTitle(topicSlug),
        topic_area: ""
      });
    }
    const prompt = input.prompt || input.statement || input.text;
    if (!prompt) {
      errors.push(`Question ${input.id} missing prompt.`);
      return null;
    }

    const base = {
      id: input.id,
      topicId: topicSlug,
      type,
      prompt,
      explanation: input.explanation || "",
      source_ref: input.source_ref || "internal:import",
      tags: Array.isArray(input.tags) ? input.tags : []
    };

    if (type === "single") {
      if (!Array.isArray(input.options) || !Array.isArray(input.correct)) {
        errors.push(`Single ${input.id} missing options/correct.`);
        return null;
      }
      return {
        ...base,
        options: input.options,
        correctIndex: input.correct[0]
      };
    }
    if (type === "multi") {
      if (!Array.isArray(input.options) || !Array.isArray(input.correct)) {
        errors.push(`Multi ${input.id} missing options/correct.`);
        return null;
      }
      return {
        ...base,
        options: input.options,
        correctIndexes: input.correct
      };
    }
    if (type === "truefalse") {
      if (typeof input.correct !== "boolean") {
        errors.push(`TrueFalse ${input.id} missing boolean correct.`);
        return null;
      }
      return {
        ...base,
        correctBoolean: input.correct
      };
    }
    if (type === "fillblank") {
      if (!Array.isArray(input.answers)) {
        errors.push(`Fillblank ${input.id} missing answers.`);
        return null;
      }
      return {
        ...base,
        answers: input.answers
      };
    }
    if (type === "matching") {
      if (!Array.isArray(input.left) || !Array.isArray(input.right)) {
        errors.push(`Matching ${input.id} missing left/right.`);
        return null;
      }
      let pairs = [];
      if (Array.isArray(input.pairs) && input.pairs.length > 0) {
        pairs = input.pairs.map((pair) => ({
          left: input.left[pair[0]],
          right: input.right[pair[1]]
        }));
      } else if (input.left.length === input.right.length) {
        pairs = input.left.map((left, idx) => ({
          left,
          right: input.right[idx]
        }));
      } else {
        errors.push(`Matching ${input.id} missing pairs.`);
        return null;
      }
      return { ...base, pairs };
    }
    if (type === "ordering") {
      if (!Array.isArray(input.items) || !Array.isArray(input.correct_order)) {
        errors.push(`Ordering ${input.id} missing items/correct_order.`);
        return null;
      }
      return { ...base, items: input.items, correct_order: input.correct_order };
    }
    if (type === "guess") {
      if (!Array.isArray(input.answers)) {
        errors.push(`Guess ${input.id} missing answers.`);
        return null;
      }
      return { ...base, expectedAnswers: input.answers };
    }
    if (type === "explain") {
      return { ...base, expectedAnswer: (input.keywords || []).join(", ") };
    }
    if (type === "exam") {
      return { ...base, expectedAnswer: input.answer_key || "" };
    }
    errors.push(`Unknown type ${type} for ${input.id}.`);
    return null;
  }

  async function applyImportResult(pack, result, replaceDuplicates) {
    try {
      const res = await apiFetch(
        `/questions/import?replace_duplicates=${replaceDuplicates ? "1" : "0"}`,
        {
          method: "POST",
          body: JSON.stringify(pack)
        }
      );
      state.lastImportSummary = {
        added: res.added,
        skipped: res.skipped,
        replaced: res.replaced,
        invalid: result.summary.invalid
      };
      logger.debug("import", "apply", {
        merge: !replaceDuplicates,
        added: res.added,
        skipped: res.skipped,
        replaced: res.replaced
      });
      refreshDataStore();
      ui.importPreview.textContent =
        renderImportSummary(result) +
        `\nApplied: +${res.added}, skipped ${res.skipped}, replaced ${res.replaced}`;
    } catch (error) {
      showError("Import failed.", String(error));
      logger.error("import", "apply failed", { error: String(error) });
    }
  }

  function renderImportSummary(result) {
    const lines = [];
    lines.push(`Total: ${result.summary.total}`);
    lines.push(`Valid: ${result.summary.valid}, Invalid: ${result.summary.invalid}`);
    lines.push(`Types: ${JSON.stringify(result.summary.types)}`);
    lines.push(`Topics: ${JSON.stringify(result.summary.topics)}`);
    if (result.methods) {
      lines.push(`Methods: ${Array.isArray(result.methods) ? result.methods.length : 0}`);
    }
    if (result.assets) {
      lines.push(`Assets: ${Array.isArray(result.assets) ? result.assets.length : 0}`);
    }
    if (result.errors.length > 0) {
      lines.push(`Errors (first 5):`);
      result.errors.slice(0, 5).forEach((err) => lines.push(`- ${err}`));
    }
    return lines.join("\n");
  }

  function loadLocalQuestionOverrides() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.questionOverrides);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      logger.error("manager", "override load failed", { error: String(error) });
      return {};
    }
  }

  function saveLocalQuestionOverrides(overrides) {
    try {
      localStorage.setItem(STORAGE_KEYS.questionOverrides, JSON.stringify(overrides));
    } catch (error) {
      showError("Failed to save edits locally.", String(error));
      logger.error("manager", "override save failed", { error: String(error) });
    }
  }

  function loadLocalQuestionDeletes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.questionDeletes);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      logger.error("manager", "deletes load failed", { error: String(error) });
      return new Set();
    }
  }

  function saveLocalQuestionDeletes(deletes) {
    try {
      localStorage.setItem(
        STORAGE_KEYS.questionDeletes,
        JSON.stringify(Array.from(deletes))
      );
    } catch (error) {
      showError("Failed to save deletes locally.", String(error));
      logger.error("manager", "deletes save failed", { error: String(error) });
    }
  }

  function applyLocalQuestionMutations() {
    const overrides = loadLocalQuestionOverrides();
    const deletes = loadLocalQuestionDeletes();
    dataStore.questions = dataStore.questions
      .filter((q) => !deletes.has(q.id))
      .map((q) => (overrides[q.id] ? { ...q, ...overrides[q.id] } : q));
  }

  async function migrateLocalQuestionMutations() {
    const overrides = loadLocalQuestionOverrides();
    const deletes = loadLocalQuestionDeletes();
    const overrideIds = Object.keys(overrides);
    const deleteIds = Array.from(deletes);
    if (overrideIds.length === 0 && deleteIds.length === 0) {
      return;
    }
    try {
      for (const id of overrideIds) {
        const updated = overrides[id];
        if (!updated || updated.id !== id) {
          continue;
        }
        await apiFetch(`/questions/${encodeURIComponent(id)}`, {
          method: "PUT",
          body: JSON.stringify(updated)
        });
      }
      for (const id of deleteIds) {
        await apiFetch(`/questions/${encodeURIComponent(id)}`, { method: "DELETE" });
      }
      localStorage.removeItem(STORAGE_KEYS.questionOverrides);
      localStorage.removeItem(STORAGE_KEYS.questionDeletes);
      logger.info("manager", "local mutations migrated", {
        overrides: overrideIds.length,
        deletes: deleteIds.length
      });
      refreshDataStore();
    } catch (error) {
      logger.error("manager", "local mutation migrate failed", { error: String(error) });
    }
  }

  function isSeededQuestion(question) {
    const source = String(question.source_ref || "").toLowerCase();
    const tags = Array.isArray(question.tags)
      ? question.tags.map((t) => String(t).toLowerCase())
      : [];
    const seededHints = ["seed", "official", "library", "ap2"];
    return seededHints.some((hint) => source.includes(hint)) || tags.includes("seeded");
  }

  function getTopicPath(topic) {
    return topic && topic.path ? topic.path : topic ? topic.id : "";
  }

  function getTopicDepth(topic) {
    if (!topic) return 0;
    if (typeof topic.depth === "number") return topic.depth;
    const path = getTopicPath(topic);
    return path ? path.split("/").length - 1 : 0;
  }

  function getSortedTopics() {
    return [...dataStore.topics].sort((a, b) =>
      getTopicPath(a).localeCompare(getTopicPath(b))
    );
  }

  function getTopicDisplayPath(topicId) {
    const map = new Map(dataStore.topics.map((t) => [t.id, t]));
    const parts = [];
    let current = map.get(topicId);
    let guard = 0;
    while (current && guard < dataStore.topics.length + 1) {
      parts.unshift(current.name || current.id);
      current = map.get(current.parent_id);
      guard += 1;
    }
    return parts.length ? parts.join(" / ") : topicId || "unknown";
  }

  function getTopicName(topicId) {
    return getTopicDisplayPath(topicId);
  }

  function formatTopicLabel(topic) {
    const depth = getTopicDepth(topic);
    const prefix = depth > 0 ? `${"--".repeat(depth)} ` : "";
    return `${prefix}${topic.name || topic.id}`;
  }

  function getDifficultyValue(question) {
    const value = String(question.difficulty || "").toLowerCase();
    if (value === "hard") return 3;
    if (value === "medium") return 2;
    if (value === "easy") return 1;
    return 0;
  }

  function getQuestionTimestamp(question) {
    const ts =
      question.created_at ||
      question.createdAt ||
      question.imported_at ||
      question.importedAt ||
      question.added_at ||
      question.addedAt;
    if (ts) {
      const parsed = new Date(ts).getTime();
      if (!Number.isNaN(parsed)) return parsed;
    }
    const order = questionOrder.get(question.id);
    return typeof order === "number" ? order : 0;
  }

  function truncateText(text, max) {
    const safe = String(text || "");
    if (safe.length <= max) return safe;
    return `${safe.slice(0, max - 1)}…`;
  }

  function renderManagerControls() {
    if (!ui.managerTopic) return;
    ui.managerSearch.value = state.managerSearch;
    const sortedTopics = getSortedTopics();
    const topicOptions = [
      `<option value="all">All topics</option>`,
      ...sortedTopics.map(
        (t) =>
          `<option value="${escapeHtml(t.id)}">${escapeHtml(formatTopicLabel(t))}</option>`
      )
    ];
    ui.managerTopic.innerHTML = topicOptions.join("");
    ui.managerTopic.value = state.managerTopic;

    const allTypes = getManagerTypeList();
    ui.managerType.innerHTML = [
      `<option value="all">All types</option>`,
      ...allTypes.map((t) => `<option value="${t}">${t}</option>`)
    ].join("");
    ui.managerType.value = state.managerType;

    ui.managerSort.innerHTML = [
      `<option value="newest">Newest</option>`,
      `<option value="oldest">Oldest</option>`,
      `<option value="difficulty">Difficulty</option>`,
      `<option value="topic">Topic</option>`
    ].join("");
    ui.managerSort.value = state.managerSort;
    ui.managerShowSeeded.checked = state.managerShowSeeded;
    ui.managerShowCustom.checked = state.managerShowCustom;
    ui.managerAllowSeededEdit.checked = state.managerAllowSeededEdit;

    const topicSelectOptions = [
      `<option value="">No parent (root)</option>`,
      ...sortedTopics.map(
        (t) =>
          `<option value="${escapeHtml(t.id)}">${escapeHtml(formatTopicLabel(t))}</option>`
      )
    ];
    if (ui.topicCreateParent) {
      ui.topicCreateParent.innerHTML = topicSelectOptions.join("");
    }
    if (ui.topicRenameId) {
      ui.topicRenameId.innerHTML = sortedTopics
        .map(
          (t) =>
            `<option value="${escapeHtml(t.id)}">${escapeHtml(formatTopicLabel(t))}</option>`
        )
        .join("");
    }
    if (ui.topicMoveId) {
      ui.topicMoveId.innerHTML = sortedTopics
        .map(
          (t) =>
            `<option value="${escapeHtml(t.id)}">${escapeHtml(formatTopicLabel(t))}</option>`
        )
        .join("");
    }
    if (ui.topicMoveParent) {
      ui.topicMoveParent.innerHTML = topicSelectOptions.join("");
    }
    if (ui.topicDeleteId) {
      ui.topicDeleteId.innerHTML = sortedTopics
        .map(
          (t) =>
            `<option value="${escapeHtml(t.id)}">${escapeHtml(formatTopicLabel(t))}</option>`
        )
        .join("");
    }
    if (ui.managerBulkMoveTopic) {
      ui.managerBulkMoveTopic.innerHTML = sortedTopics
        .map(
          (t) =>
            `<option value="${escapeHtml(t.id)}">${escapeHtml(formatTopicLabel(t))}</option>`
        )
        .join("");
    }
    if (ui.managerBulkType) {
      ui.managerBulkType.innerHTML = allTypes
        .map((t) => `<option value="${t}">${t}</option>`)
        .join("");
    }
    updateManagerSelectionUI();
  }

  function getManagerTypeList() {
    return [
      "single",
      "multi",
      "truefalse",
      "fillblank",
      "matching",
      "ordering",
      "calc_value",
      "calc_multi",
      "hotspot_svg",
      "troubleshoot_flow",
      "guess",
      "explain",
      "exam"
    ];
  }

  function getManagerFilteredQuestions() {
    let list = [...dataStore.questions];
    list = list.filter((q) => {
      const seeded = isSeededQuestion(q);
      if (seeded && !state.managerShowSeeded) return false;
      if (!seeded && !state.managerShowCustom) return false;
      return true;
    });
    if (state.managerTopic !== "all") {
      list = list.filter((q) => q.topicId === state.managerTopic);
    }
    if (state.managerType !== "all") {
      list = list.filter((q) => q.type === state.managerType);
    }
    const query = state.managerSearch.trim().toLowerCase();
    if (query) {
      list = list.filter((q) => {
        const tags = Array.isArray(q.tags) ? q.tags.join(" ") : "";
        return (
          String(q.id).toLowerCase().includes(query) ||
          String(q.prompt || "").toLowerCase().includes(query) ||
          String(tags).toLowerCase().includes(query)
        );
      });
    }
    if (state.managerSort === "difficulty") {
      list.sort((a, b) => getDifficultyValue(b) - getDifficultyValue(a));
    } else if (state.managerSort === "topic") {
      list.sort((a, b) => getTopicName(a.topicId).localeCompare(getTopicName(b.topicId)));
    } else if (state.managerSort === "oldest") {
      list.sort((a, b) => getQuestionTimestamp(a) - getQuestionTimestamp(b));
    } else {
      list.sort((a, b) => getQuestionTimestamp(b) - getQuestionTimestamp(a));
    }
    return list;
  }

  function renderManager() {
    if (!ui.managerTbody) return;
    const all = getManagerFilteredQuestions();
    const pageSize = 25;
    const visible = all.slice(0, pageSize * state.managerPage);
    managerVisibleIds = visible.map((q) => q.id);
    ui.managerTbody.innerHTML = "";
    if (visible.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="9" class="muted">No questions match your filters.</td>`;
      ui.managerTbody.appendChild(row);
    }
    visible.forEach((q) => {
      const seeded = isSeededQuestion(q);
      const canEdit = !seeded || state.managerAllowSeededEdit;
      const row = document.createElement("tr");
      const tags = Array.isArray(q.tags) ? q.tags.join(", ") : "";
      const source = truncateText(q.source_ref || "", 24);
      const prompt = truncateText(q.prompt || "", 80);
      const difficulty = q.difficulty ? String(q.difficulty) : "n/a";
      const checked = managerSelectedIds.has(q.id);
      row.innerHTML = `
        <td><input type="checkbox" data-action="select" data-id="${escapeHtml(q.id)}" ${checked ? "checked" : ""} /></td>
        <td>${escapeHtml(q.id)}</td>
        <td>${escapeHtml(getTopicName(q.topicId))}</td>
        <td>${escapeHtml(q.type)}</td>
        <td>${escapeHtml(difficulty)}</td>
        <td>${escapeHtml(prompt)}</td>
        <td>${escapeHtml(tags)}</td>
        <td>${escapeHtml(source)}</td>
        <td>
          <div class="manager-actions">
            ${
              canEdit
                ? `<button class="ghost" data-action="edit" data-id="${escapeHtml(q.id)}">Edit</button>
                   <button class="ghost" data-action="delete" data-id="${escapeHtml(q.id)}">Delete</button>`
                : `<span class="manager-lock">Locked</span>`
            }
          </div>
        </td>
      `;
      ui.managerTbody.appendChild(row);
    });

    const total = all.length;
    const showing = visible.length;
    ui.managerCount.textContent = `Showing ${showing} of ${total}`;
    ui.managerLoadMore.disabled = showing >= total;
    ui.managerLoadMore.style.opacity = showing >= total ? "0.5" : "1";
    ui.managerMeta.textContent = `Total questions: ${dataStore.questions.length}`;
    if (ui.managerSelectAllPage) {
      ui.managerSelectAllPage.checked =
        managerVisibleIds.length > 0 &&
        managerVisibleIds.every((id) => managerSelectedIds.has(id));
    }
    renderCoveragePanel();
    logger.debug("manager", "list render", { total, showing });
  }

  function renderCoveragePanel() {
    if (!ui.managerCoverage) return;
    const list = dataStore.questions.filter((q) => {
      const seeded = isSeededQuestion(q);
      if (seeded && !state.managerShowSeeded) return false;
      if (!seeded && !state.managerShowCustom) return false;
      return true;
    });
    const topics = getSortedTopics();
    const types = getManagerTypeList();
    const byTopic = {};
    const byType = {};
    const matrix = {};
    topics.forEach((t) => {
      byTopic[t.id] = 0;
      matrix[t.id] = {};
      types.forEach((type) => {
        matrix[t.id][type] = 0;
      });
    });
    list.forEach((q) => {
      byTopic[q.topicId] = (byTopic[q.topicId] || 0) + 1;
      byType[q.type] = (byType[q.type] || 0) + 1;
      if (!matrix[q.topicId]) {
        matrix[q.topicId] = {};
      }
      matrix[q.topicId][q.type] = (matrix[q.topicId][q.type] || 0) + 1;
    });

    const topicLines = topics.map(
      (t) => `${getTopicDisplayPath(t.id)}: ${byTopic[t.id] || 0}`
    );
    const typeLines = types.map((t) => `${t}: ${byType[t] || 0}`);

    const gaps = [];
    topics.forEach((t) => {
      types.forEach((type) => {
        if ((matrix[t.id] && matrix[t.id][type]) || 0) return;
        gaps.push(`${getTopicDisplayPath(t.id)} -> ${type}`);
      });
    });

    const headerCells = types.map((t) => `<th>${t}</th>`).join("");
    const bodyRows = topics
      .map((t) => {
        const cells = types
          .map((type) => {
            const count = matrix[t.id] ? matrix[t.id][type] || 0 : 0;
            const klass = count === 0 ? "missing" : "";
            return `<td class="${klass}">${count}</td>`;
          })
          .join("");
        return `<tr><th>${escapeHtml(getTopicDisplayPath(t.id))}</th>${cells}</tr>`;
      })
      .join("");

    ui.managerCoverage.innerHTML = `
      <div class="manager-coverage-grid">
        <div>
          <div class="stat-label">By topic</div>
          <div class="muted">${escapeHtml(topicLines.join(" | "))}</div>
        </div>
        <div>
          <div class="stat-label">By type</div>
          <div class="muted">${escapeHtml(typeLines.join(" | "))}</div>
        </div>
      </div>
      <div class="table-wrap">
        <table class="manager-matrix">
          <thead>
            <tr>
              <th>Topic</th>
              ${headerCells}
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
      </div>
      <div class="muted">Gaps: ${escapeHtml(gaps.slice(0, 8).join(" | ") || "None")}</div>
    `;
  }

  function updateManagerSelectionUI() {
    const validIds = new Set(dataStore.questions.map((q) => q.id));
    managerSelectedIds = new Set(
      Array.from(managerSelectedIds).filter((id) => validIds.has(id))
    );
    if (ui.managerBulkCount) {
      const count = managerSelectedIds.size;
      ui.managerBulkCount.textContent =
        count === 0 ? "No questions selected." : `${count} selected.`;
    }
    const disabled = managerSelectedIds.size === 0;
    if (ui.managerBulkMove) ui.managerBulkMove.disabled = disabled;
    if (ui.managerBulkDelete) ui.managerBulkDelete.disabled = disabled;
    if (ui.managerBulkTypeApply) ui.managerBulkTypeApply.disabled = disabled;
  }

  function setTopicActionStatus(message, isError) {
    if (!ui.topicActionStatus) return;
    ui.topicActionStatus.textContent = message;
    ui.topicActionStatus.style.color = isError ? "var(--error)" : "inherit";
  }

  async function createTopic() {
    const id = ui.topicCreateId.value.trim();
    const name = ui.topicCreateName.value.trim();
    const parentId = ui.topicCreateParent.value || null;
    if (!id) {
      setTopicActionStatus("Topic id is required.", true);
      return;
    }
    try {
      await apiFetch("/topics", {
        method: "POST",
        body: JSON.stringify({
          id,
          name,
          parent_id: parentId || null
        })
      });
      setTopicActionStatus(`Created topic ${id}.`, false);
      ui.topicCreateId.value = "";
      ui.topicCreateName.value = "";
      refreshDataStore();
    } catch (error) {
      setTopicActionStatus("Failed to create topic.", true);
      logger.error("manager", "topic create failed", { error: String(error) });
    }
  }

  async function renameTopic() {
    const id = ui.topicRenameId.value;
    const name = ui.topicRenameName.value.trim();
    if (!id || !name) {
      setTopicActionStatus("Select a topic and enter a new name.", true);
      return;
    }
    try {
      await apiFetch(`/topics/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ name })
      });
      setTopicActionStatus(`Renamed ${id}.`, false);
      ui.topicRenameName.value = "";
      refreshDataStore();
    } catch (error) {
      setTopicActionStatus("Failed to rename topic.", true);
      logger.error("manager", "topic rename failed", { error: String(error) });
    }
  }

  async function moveTopic() {
    const id = ui.topicMoveId.value;
    const parentId = ui.topicMoveParent.value || null;
    if (!id) {
      setTopicActionStatus("Select a topic to move.", true);
      return;
    }
    try {
      await apiFetch(`/topics/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ parent_id: parentId || null })
      });
      setTopicActionStatus(`Moved ${id}.`, false);
      refreshDataStore();
    } catch (error) {
      setTopicActionStatus("Failed to move topic.", true);
      logger.error("manager", "topic move failed", { error: String(error) });
    }
  }

  async function deleteTopic() {
    const id = ui.topicDeleteId.value;
    const mode = ui.topicDeleteMode.value;
    if (!id) {
      setTopicActionStatus("Select a topic to delete.", true);
      return;
    }
    const ok = window.confirm(
      mode === "reassign"
        ? "Delete topic and reassign its children and questions?"
        : "Delete topic and everything inside?"
    );
    if (!ok) return;
    try {
      await apiFetch(`/topics/${encodeURIComponent(id)}?mode=${encodeURIComponent(mode)}`, {
        method: "DELETE"
      });
      setTopicActionStatus(`Deleted ${id}.`, false);
      refreshDataStore();
    } catch (error) {
      setTopicActionStatus("Failed to delete topic.", true);
      logger.error("manager", "topic delete failed", { error: String(error) });
    }
  }

  async function bulkDeleteQuestions() {
    if (managerSelectedIds.size === 0) return;
    const ok = window.confirm("Delete selected questions?");
    if (!ok) return;
    try {
      await apiFetch("/questions/bulk", {
        method: "POST",
        body: JSON.stringify({ action: "delete", ids: Array.from(managerSelectedIds) })
      });
      managerSelectedIds.clear();
      refreshDataStore();
    } catch (error) {
      showError("Bulk delete failed.", String(error));
    }
  }

  async function bulkMoveQuestions() {
    if (managerSelectedIds.size === 0) return;
    const topicId = ui.managerBulkMoveTopic.value;
    if (!topicId) {
      showError("Select a target topic.");
      return;
    }
    try {
      await apiFetch("/questions/bulk", {
        method: "POST",
        body: JSON.stringify({
          action: "move",
          ids: Array.from(managerSelectedIds),
          topic_id: topicId
        })
      });
      managerSelectedIds.clear();
      refreshDataStore();
    } catch (error) {
      showError("Bulk move failed.", String(error));
    }
  }

  async function bulkChangeQuestionType() {
    if (managerSelectedIds.size === 0) return;
    const targetType = ui.managerBulkType.value;
    const selected = dataStore.questions.filter((q) => managerSelectedIds.has(q.id));
    const stemIds = new Set(selected.map((q) => q.stem_id).filter(Boolean));
    if (stemIds.size !== 1) {
      showError("Bulk type change requires a shared stem_id.");
      return;
    }
    const compatible = selected.every((q) => {
      if (q.type === targetType) return true;
      if (q.type === "single" && targetType === "multi") return true;
      if (q.type === "multi" && targetType === "single") return true;
      return false;
    });
    if (!compatible) {
      showError("Selected questions are not compatible for this type change.");
      return;
    }
    try {
      await apiFetch("/questions/bulk", {
        method: "POST",
        body: JSON.stringify({
          action: "change_type",
          ids: Array.from(managerSelectedIds),
          target_type: targetType
        })
      });
      managerSelectedIds.clear();
      refreshDataStore();
    } catch (error) {
      showError("Bulk type change failed.", String(error));
    }
  }

  function openManagerEdit(id) {
    const question = dataStore.questions.find((q) => q.id === id);
    if (!question) {
      showError("Question not found.", `Missing id ${id}`);
      return;
    }
    if (isSeededQuestion(question) && !state.managerAllowSeededEdit) {
      showError("Seeded questions are read-only by default.");
      return;
    }
    managerEditId = id;
    ui.managerEditId.value = question.id;
    ui.managerEditType.value = question.type;
    ui.managerEditPrompt.value = question.prompt || "";
    ui.managerEditExplanation.value = question.explanation || "";
    ui.managerEditSource.value = question.source_ref || "";
    ui.managerEditTags.value = Array.isArray(question.tags) ? question.tags.join(", ") : "";
    ui.managerEditDifficulty.value = question.difficulty || "";

    const topicOptions = getSortedTopics().map(
      (t) =>
        `<option value="${escapeHtml(t.id)}">${escapeHtml(formatTopicLabel(t))}</option>`
    );
    ui.managerEditTopic.innerHTML = topicOptions.join("");
    ui.managerEditTopic.value = question.topicId;

    renderManagerEditDynamic(question);
    ui.managerEditStatus.textContent = "";
    ui.managerEdit.classList.remove("hidden");
    logger.debug("manager", "edit open", { id });
  }

  function renderManagerEditDynamic(question) {
    const type = question.type;
    if (type === "multi") {
      ui.managerEditDynamic.innerHTML = `
        <label>
          Options (one per line)
          <textarea id="manager-edit-options" rows="4"></textarea>
        </label>
        <label>
          Correct indices (comma, 0-based)
          <input id="manager-edit-correct" type="text" />
        </label>
      `;
      const optionsEl = document.getElementById("manager-edit-options");
      const correctEl = document.getElementById("manager-edit-correct");
      if (optionsEl) {
        optionsEl.value = Array.isArray(question.options)
          ? question.options.join("\n")
          : "";
      }
      if (correctEl) {
        correctEl.value = Array.isArray(question.correctIndexes)
          ? question.correctIndexes.join(", ")
          : "";
      }
      ui.managerEditSave.disabled = false;
    } else if (type === "truefalse") {
      const value = question.correctBoolean ? "true" : "false";
      ui.managerEditDynamic.innerHTML = `
        <label>
          Correct answer
          <select id="manager-edit-boolean">
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </label>
      `;
      const select = ui.managerEditDynamic.querySelector("#manager-edit-boolean");
      if (select) select.value = value;
      ui.managerEditSave.disabled = false;
    } else {
      ui.managerEditDynamic.innerHTML = `
        <div class="warning">Editing for this type is not implemented yet.</div>
      `;
      ui.managerEditSave.disabled = true;
    }
  }

  function closeManagerEdit() {
    managerEditId = null;
    if (ui.managerEdit) ui.managerEdit.classList.add("hidden");
  }

  async function saveManagerEdit() {
    if (!managerEditId) return;
    const question = dataStore.questions.find((q) => q.id === managerEditId);
    if (!question) {
      showError("Question not found.", `Missing id ${managerEditId}`);
      return;
    }
    const updated = { ...question };
    const prompt = ui.managerEditPrompt.value.trim();
    if (!prompt) {
      ui.managerEditStatus.textContent = "Prompt is required.";
      return;
    }
    updated.prompt = prompt;
    updated.topicId = ui.managerEditTopic.value;
    updated.explanation = ui.managerEditExplanation.value.trim();
    updated.source_ref = ui.managerEditSource.value.trim();
    updated.tags = ui.managerEditTags.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    updated.difficulty = ui.managerEditDifficulty.value || "";

    if (updated.type === "multi") {
      const options = getLines("manager-edit-options");
      const correct = getCommaNumbers("manager-edit-correct");
      if (options.length < 2) {
        ui.managerEditStatus.textContent = "At least 2 options are required.";
        return;
      }
      if (correct.length === 0) {
        ui.managerEditStatus.textContent = "At least one correct index is required.";
        return;
      }
      if (correct.some((idx) => Number.isNaN(idx))) {
        ui.managerEditStatus.textContent = "Correct indices must be numbers.";
        return;
      }
      const maxIndex = options.length - 1;
      if (correct.some((idx) => idx < 0 || idx > maxIndex)) {
        ui.managerEditStatus.textContent = "Correct indices must be within range.";
        return;
      }
      updated.options = options;
      updated.correctIndexes = correct;
    } else if (updated.type === "truefalse") {
      const select = document.getElementById("manager-edit-boolean");
      if (!select) {
        ui.managerEditStatus.textContent = "Missing true/false selector.";
        return;
      }
      updated.correctBoolean = select.value === "true";
    } else {
      ui.managerEditStatus.textContent = "Editing for this type is not implemented yet.";
      return;
    }

    try {
      await apiFetch(`/questions/${encodeURIComponent(updated.id)}`, {
        method: "PUT",
        body: JSON.stringify(updated)
      });
      refreshDataStore();
      ui.managerEditStatus.textContent = "Saved.";
      logger.debug("manager", "edit saved", { id: updated.id });
    } catch (error) {
      ui.managerEditStatus.textContent = "Save failed.";
      logger.error("manager", "edit save failed", { error: String(error) });
    }
  }

  async function confirmDeleteQuestion(id) {
    const question = dataStore.questions.find((q) => q.id === id);
    if (!question) {
      showError("Question not found.", `Missing id ${id}`);
      return;
    }
    if (isSeededQuestion(question) && !state.managerAllowSeededEdit) {
      showError("Seeded questions are read-only by default.");
      return;
    }
    logger.debug("manager", "delete confirm", { id });
    const ok = window.confirm("Are you sure?");
    if (!ok) return;
    try {
      await apiFetch(`/questions/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (managerEditId === id) {
        closeManagerEdit();
      }
      refreshDataStore();
      logger.debug("manager", "question deleted", { id });
    } catch (error) {
      showError("Delete failed.", String(error));
      logger.error("manager", "question delete failed", { error: String(error) });
    }
  }

  function buildAiFormatSpecText() {
    return `AP2 Question Pack Format Guide
Schema: ap2-questionpack-v2

Top-level JSON structure:
{
  "schema": "ap2-questionpack-v2",
  "meta": {
    "source": "chatgpt",
    "created_at": "YYYY-MM-DD",
    "topic_budget": { "max_new_topics": 3, "max_depth": 4 }
  },
  "topics": [
    { "slug": "topic-id", "title": "Topic Name", "parent_topic_id": null, "path": "topic-id", "depth": 0, "topic_area": "area" }
  ],
  "stems": [
    {
      "stem_id": "stem_001",
      "stem_text": "Question stem or task statement",
      "topic_id": "topic-id",
      "variants": [ { ... question variant ... } ]
    }
  ],
  "questions": [
    { ... standalone question ... }
  ]
}

Global rules:
- Return ONLY valid JSON. No markdown fences. No commentary.
- Output structured data only. No extra keys outside the schema.
- "schema" must be exactly "ap2-questionpack-v2".
- Use unique ids for topics, stems, and questions.
- All questions must be attached to a topic, either via topic_slug or via stem.topic_id.
- Topic budget: reuse existing topics first. Create at most meta.topic_budget.max_new_topics new topics.
- Topic depth: do not exceed meta.topic_budget.max_depth.
- Prefer fewer, deeper topics over many flat topics.
- DO NOT invent new question types. Use only supported types.
- Do not invent external URLs. Use source_ref as plain text.
- Ordering: topics -> stems -> questions.

Topic Tree model (required for hierarchy):
Topic fields:
- slug (topic_id): string, unique id
- title: display name
- parent_topic_id: nullable string (root if null)
- path: computed path (parent_path/slug)
- depth: integer depth (root = 0)
- topic_area: optional grouping
Rules:
- Reuse existing topics when a similar topic already exists.
- Only create a new topic when the stem does not fit any existing path.
- Never create many sibling topics when a single parent can group them.

Stem reuse model:
Each stem is created once, then variants reuse the same stem_text.
Stem fields:
- stem_id, stem_text, topic_id
Variant fields:
- id, type, plus type-specific fields
Rules:
- Variants must keep the same meaning as stem_text.
- Variants should not contradict each other.
- If variant includes topic_slug, it must match stem.topic_id.

Supported question types (catalog)

Type: single
ID: "single"
Purpose: One correct option among several.
Input requirements: id, type, prompt, options[], correct[one index], topic_slug or stem.
Output schema:
{ "id": "...", "type": "single", "topic_slug": "...", "prompt": "...", "options": ["A","B"], "correct": [0] }
Generation rules:
1. Write a clear prompt.
2. Provide 3 to 5 options.
3. Exactly one correct index in correct[].
Validation rules:
- options length >= 2
- correct length == 1
- correct index is within options range
DOs:
- Make distractors plausible.
- Keep options similar length.
DON'Ts:
- Do not add multiple correct indices.
- Do not use "all of the above".
Example 1:
{ "id": "q_single_01", "type": "single", "topic_slug": "network-basics", "prompt": "What does LAN stand for?", "options": ["Local Area Network","Long Area Node","Low Access Node"], "correct": [0] }
Example 2:
{ "id": "q_single_02", "type": "single", "topic_slug": "security-basics", "prompt": "Which control is preventive?", "options": ["Firewall","Audit log","Forensic report"], "correct": [0] }

Type: multi
ID: "multi"
Purpose: Multiple correct options.
Input requirements: id, type, prompt, options[], correct[one or more indices], topic_slug or stem.
Output schema:
{ "id": "...", "type": "multi", "topic_slug": "...", "prompt": "...", "options": ["A","B","C"], "correct": [0,2] }
Generation rules:
1. Write a prompt that implies multiple answers.
2. Provide 4 to 6 options.
3. Provide 2+ correct indices.
Validation rules:
- options length >= 3
- correct length >= 1
- all correct indices within range
DOs:
- Include at least one strong distractor.
- Keep wording consistent.
DON'Ts:
- Do not make all options correct.
- Do not mix single-answer wording with multi-answer format.
Example 1:
{ "id": "q_multi_01", "type": "multi", "topic_slug": "network-osi", "prompt": "Which are Layer 2 protocols?", "options": ["Ethernet","IP","ARP","TCP"], "correct": [0,2] }
Example 2:
{ "id": "q_multi_02", "type": "multi", "topic_slug": "safety-electric", "prompt": "Select all safety checks before maintenance.", "options": ["Lockout","Verify absence of voltage","Wear gloves","Skip documentation"], "correct": [0,1,2] }

Type: truefalse
ID: "truefalse"
Purpose: A statement that is either true or false.
Input requirements: id, type, prompt, correct(boolean), topic_slug or stem.
Output schema:
{ "id": "...", "type": "truefalse", "topic_slug": "...", "prompt": "...", "correct": true }
Generation rules:
1. Use a single factual statement.
2. Avoid ambiguous qualifiers.
Validation rules:
- correct must be true or false
DOs:
- Keep statements concise.
- Ensure answer is unambiguous.
DON'Ts:
- Do not use double negatives.
- Do not use opinion-based statements.
Example 1:
{ "id": "q_tf_01", "type": "truefalse", "topic_slug": "network-ip", "prompt": "IPv4 uses 32-bit addresses.", "correct": true }
Example 2:
{ "id": "q_tf_02", "type": "truefalse", "topic_slug": "safety-electric", "prompt": "The protective earth may be switched.", "correct": false }

Type: fillblank
ID: "fillblank"
Purpose: Fill in missing word(s).
Input requirements: id, type, prompt or text, answers[], topic_slug or stem.
Output schema:
{ "id": "...", "type": "fillblank", "topic_slug": "...", "prompt": "IPv4 has ___ bits.", "answers": ["32"] }
Generation rules:
1. Use a single blank (___) unless multiple blanks are required.
2. Provide all acceptable answers (case-insensitive).
Validation rules:
- answers is a non-empty array
DOs:
- Include synonyms if valid.
- Keep blanks short.
DON'Ts:
- Do not use multiple unrelated blanks.
- Do not omit expected answer variants.
Example 1:
{ "id": "q_fb_01", "type": "fillblank", "topic_slug": "network-ip", "prompt": "IPv4 has ___ bits.", "answers": ["32"] }
Example 2:
{ "id": "q_fb_02", "type": "fillblank", "topic_slug": "math-ohm", "prompt": "U = R * ___.", "answers": ["I","i"] }

Type: matching
ID: "matching"
Purpose: Match items from left to right.
Input requirements: id, type, prompt, left[], right[], pairs[], topic_slug or stem.
Output schema:
{ "id": "...", "type": "matching", "topic_slug": "...", "prompt": "...", "left": ["A","B"], "right": ["1","2"], "pairs": [[0,1],[1,0]] }
Generation rules:
1. Provide equal length left/right lists.
2. Provide pairs mapping indices.
Validation rules:
- left and right arrays non-empty
- pairs indices within bounds
DOs:
- Keep items short.
- Avoid duplicate items on one side.
DON'Ts:
- Do not reuse the same right item for multiple left items unless intended.
- Do not omit pairs when lengths differ.
Example 1:
{ "id": "q_match_01", "type": "matching", "topic_slug": "network-services", "prompt": "Match service to function.", "left": ["DNS","DHCP"], "right": ["Name resolution","IP assignment"], "pairs": [[0,0],[1,1]] }
Example 2:
{ "id": "q_match_02", "type": "matching", "topic_slug": "security-cia", "prompt": "Match CIA letter to meaning.", "left": ["C","I","A"], "right": ["Confidentiality","Integrity","Availability"], "pairs": [[0,0],[1,1],[2,2]] }

Type: ordering
ID: "ordering"
Purpose: Put steps in correct sequence.
Input requirements: id, type, prompt, items[], correct_order[], topic_slug or stem.
Output schema:
{ "id": "...", "type": "ordering", "topic_slug": "...", "prompt": "...", "items": ["A","B","C"], "correct_order": [0,1,2] }
Generation rules:
1. Provide 3 to 6 steps.
2. correct_order is a permutation of item indices.
Validation rules:
- items length >= 2
- correct_order has same length and valid indices
DOs:
- Keep each step concise.
- Ensure only one correct order.
DON'Ts:
- Do not include duplicate steps.
- Do not skip indices.
Example 1:
{ "id": "q_order_01", "type": "ordering", "topic_slug": "troubleshooting", "prompt": "Order the steps.", "items": ["Check physical","Check config","Test connectivity"], "correct_order": [0,1,2] }
Example 2:
{ "id": "q_order_02", "type": "ordering", "topic_slug": "backup-process", "prompt": "Order the backup workflow.", "items": ["Plan","Run backup","Test restore"], "correct_order": [0,1,2] }

Type: guessword
ID: "guessword"
Purpose: Short answer, keyword or term.
Input requirements: id, type, prompt, answers[], topic_slug or stem.
Output schema:
{ "id": "...", "type": "guessword", "topic_slug": "...", "prompt": "...", "answers": ["term"] }
Generation rules:
1. Prompt should ask for a single term or short phrase.
2. Provide all acceptable answer variants.
Validation rules:
- answers array is non-empty
DOs:
- Include abbreviations if accepted.
- Keep answers short.
DON'Ts:
- Do not use full-sentence answers.
- Do not include unrelated synonyms.
Example 1:
{ "id": "q_guess_01", "type": "guessword", "topic_slug": "security-cia", "prompt": "What does CIA stand for (first word)?", "answers": ["confidentiality"] }
Example 2:
{ "id": "q_guess_02", "type": "guessword", "topic_slug": "network-vlan", "prompt": "A VLAN tag standard is ___ .", "answers": ["802.1q","8021q"] }

Type: explainterm
ID: "explainterm"
Purpose: Explain a term in keywords.
Input requirements: id, type, prompt, keywords[], topic_slug or stem.
Output schema:
{ "id": "...", "type": "explainterm", "topic_slug": "...", "prompt": "...", "keywords": ["k1","k2"] }
Generation rules:
1. Prompt asks to explain/define.
2. Keywords list is short and specific.
Validation rules:
- keywords array non-empty
DOs:
- Include essential concept words.
- Keep 3 to 6 keywords.
DON'Ts:
- Do not include full sentences.
- Do not include irrelevant buzzwords.
Example 1:
{ "id": "q_explain_01", "type": "explainterm", "topic_slug": "network-dhcp", "prompt": "Explain DHCP.", "keywords": ["dynamic","ip address","lease"] }
Example 2:
{ "id": "q_explain_02", "type": "explainterm", "topic_slug": "security-cia", "prompt": "Explain availability.", "keywords": ["uptime","resilience","redundancy"] }

Type: exam
ID: "exam"
Purpose: Open response, self-graded.
Input requirements: id, type, prompt, answer_key, topic_slug or stem.
Output schema:
{ "id": "...", "type": "exam", "topic_slug": "...", "prompt": "...", "answer_key": "..." }
Generation rules:
1. Prompt should be open-ended but focused.
2. answer_key lists key points.
Validation rules:
- answer_key is non-empty string
DOs:
- Keep answer_key short and scorable.
- Use bullet-like phrasing inside answer_key.
DON'Ts:
- Do not leave answer_key empty.
- Do not create multi-part prompts without scoring notes.
Example 1:
{ "id": "q_exam_01", "type": "exam", "topic_slug": "safety-electric", "prompt": "Describe the five safety rules.", "answer_key": "Disconnect; Secure; Verify; Ground; Cover adjacent." }
Example 2:
{ "id": "q_exam_02", "type": "exam", "topic_slug": "network-troubleshooting", "prompt": "Explain a DHCP failure workflow.", "answer_key": "Check link; Verify scope; Confirm relay; Test lease." }

Topic tree example with 3 levels:
{
  "topics": [
    { "slug": "network", "title": "Network", "parent_topic_id": null, "path": "network", "depth": 0 },
    { "slug": "ip", "title": "IP", "parent_topic_id": "network", "path": "network/ip", "depth": 1 },
    { "slug": "ipv4", "title": "IPv4", "parent_topic_id": "ip", "path": "network/ip/ipv4", "depth": 2 }
  ]
}

Stem reuse example (one stem, three variants):
{
  "stems": [
    {
      "stem_id": "stem_usa_president",
      "stem_text": "Who is the president of the USA?",
      "topic_id": "civics-us",
      "variants": [
        { "id": "q_tf_usa_president", "type": "truefalse", "prompt": "The president of the USA is the head of the executive branch.", "correct": true },
        { "id": "q_mc_usa_president", "type": "single", "prompt": "Who is the president of the USA?", "options": ["A","B","C"], "correct": [0] },
        { "id": "q_fb_usa_president", "type": "fillblank", "prompt": "The president of the USA is ___ .", "answers": ["Name"] }
      ]
    }
  ]
}
`;
  }

  function buildAiPromptTemplateText() {
    return `CHATGPT PROMPT TEMPLATE

You are generating a JSON question pack for this app.
Return ONLY valid JSON. No markdown fences. No commentary.
Schema must be: ap2-questionpack-v2

SUPPORTED TYPES:
single, multi, truefalse, fillblank, matching, ordering, guessword, explainterm, exam

TOP-LEVEL FORMAT:
{
  "schema": "ap2-questionpack-v2",
  "meta": {
    "source": "chatgpt",
    "created_at": "YYYY-MM-DD",
    "topic_budget": { "max_new_topics": 3, "max_depth": 4 }
  },
  "topics": [
    { "slug": "topic-id", "title": "Topic Title", "parent_topic_id": null, "path": "topic-id", "depth": 0, "topic_area": "Area" }
  ],
  "stems": [
    { "stem_id": "stem_001", "stem_text": "Question stem", "topic_id": "topic-id", "variants": [ { ... } ] }
  ],
  "questions": [ { ... } ]
}

FIELD RULES (summary):
- Use topic tree: slug, title, parent_topic_id, path, depth.
- Prefer stems + variants for reuse. questions[] is for standalone items.
- Every question/variant: id, type, prompt plus type-specific fields.
- single/multi: options array, correct array of indices (0-based).
- truefalse: correct true or false.
- fillblank: answers array.
- matching: left array, right array, pairs array of [leftIndex, rightIndex].
- ordering: items array, correct_order array of indices (0-based).
- guessword: answers array.
- explainterm: keywords array.
- exam: answer_key string.
- Do not invent external URLs. Use source_ref as plain text.

CONSTRAINTS (fill in before sending to ChatGPT):
Number of questions: [ENTER TOTAL COUNT]
Difficulty distribution: [EASY %, MEDIUM %, HARD %]
Tags to use: [TAG1, TAG2, ...]
Topic list and source info:
[PASTE TOPIC INFORMATION HERE]

OUTPUT RULES:
- Return only JSON.
- Use unique ids for each topic, stem, and question.
- Use topic_slug that matches topics[].slug or stem.topic_id.
- Obey topic budget and depth limits.

Now generate the JSON question pack.`;
  }

  function downloadTextFile(filename, content, kind) {
    try {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      logger.debug("builder", "ai guide downloaded", {
        kind,
        filename,
        bytes: blob.size
      });
    } catch (error) {
      showError("Download failed.", String(error));
      logger.error("builder", "ai guide download failed", { error: String(error) });
    }
  }

  async function saveBuiltQuestion() {
    const type = ui.builderType.value;
    const topicNew = ui.builderTopicNew.value.trim();
    const topicId = topicNew || ui.builderTopic.value;
    const id = ui.builderId.value.trim() || `custom-${Date.now()}`;
    const prompt = ui.builderPrompt.value.trim();
    if (!prompt) {
      setBuilderStatus("Prompt is required.", true);
      return;
    }
    const base = {
      id,
      topicId,
      type,
      prompt,
      explanation: ui.builderExplanation.value.trim(),
      source_ref: ui.builderSource.value.trim() || "internal:builder",
      tags: ui.builderTags.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    };

    const built = buildQuestionFromBuilder(base);
    if (!built) {
      return;
    }

    try {
      await apiFetch("/questions", {
        method: "POST",
        body: JSON.stringify({
          ...built,
          topicName: slugToTitle(topicId)
        })
      });
      logger.debug("builder", "question created", { id: built.id, type: built.type });
      setBuilderStatus(`Saved ${built.id}`, false);
      refreshDataStore();
    } catch (error) {
      setBuilderStatus("Save failed.", true);
      logger.error("builder", "save failed", { error: String(error) });
    }
  }

  function buildQuestionFromBuilder(base) {
    const type = base.type;
    if (type === "single" || type === "multi") {
      const options = getLines("builder-options");
      const correct = getCommaNumbers("builder-correct");
      if (options.length < 2 || correct.length === 0) {
        setBuilderStatus("Options and correct index required.", true);
        return null;
      }
      if (type === "single") {
        return { ...base, options, correctIndex: correct[0] };
      }
      return { ...base, options, correctIndexes: correct };
    }
    if (type === "truefalse") {
      const val = document.getElementById("builder-correct-boolean").value === "true";
      return { ...base, correctBoolean: val };
    }
    if (type === "fillblank") {
      const lines = getLines("builder-answers");
      const answers = lines.map((line) =>
        line.split(",").map((v) => v.trim()).filter(Boolean)
      );
      if (answers.length === 0) {
        setBuilderStatus("Answers required.", true);
        return null;
      }
      return { ...base, answers };
    }
    if (type === "matching") {
      const left = getLines("builder-left");
      const right = getLines("builder-right");
      const pairLines = getLines("builder-pairs");
      if (left.length === 0 || right.length === 0) {
        setBuilderStatus("Left and right items required.", true);
        return null;
      }
      let pairs = [];
      if (pairLines.length > 0) {
        pairs = pairLines.map((line) => {
          const parts = line.split("-");
          return { left: left[Number(parts[0])], right: right[Number(parts[1])] };
        });
      } else if (left.length === right.length) {
        pairs = left.map((l, i) => ({ left: l, right: right[i] }));
      } else {
        setBuilderStatus("Pairs required when lengths differ.", true);
        return null;
      }
      return { ...base, pairs };
    }
    if (type === "ordering") {
      const items = getLines("builder-items");
      const correctOrder = getCommaNumbers("builder-order");
      if (items.length === 0 || correctOrder.length !== items.length) {
        setBuilderStatus("Items and correct order required.", true);
        return null;
      }
      return { ...base, items, correct_order: correctOrder };
    }
    if (type === "guess") {
      const answers = getCommaStrings("builder-answers");
      if (answers.length === 0) {
        setBuilderStatus("Answers required.", true);
        return null;
      }
      return { ...base, expectedAnswers: answers };
    }
    if (type === "explain") {
      const keywords = getCommaStrings("builder-keywords");
      return { ...base, expectedAnswer: keywords.join(", ") };
    }
    if (type === "exam") {
      return { ...base, expectedAnswer: "" };
    }
    setBuilderStatus("Unknown type.", true);
    return null;
  }

  function tryBuiltQuestion() {
    const type = ui.builderType.value;
    const prompt = ui.builderPrompt.value.trim();
    if (!prompt) {
      setBuilderStatus("Add a prompt first.", true);
      return;
    }
    const base = {
      id: ui.builderId.value.trim() || `temp-${Date.now()}`,
      topicId: ui.builderTopicNew.value.trim() || ui.builderTopic.value,
      type,
      prompt,
      explanation: ui.builderExplanation.value.trim(),
      source_ref: ui.builderSource.value.trim() || "internal:builder"
    };
    const built = buildQuestionFromBuilder(base);
    if (!built) {
      return;
    }
    displayQuestion(built);
    setRoute("quiz");
  }

  async function exportCustomQuestions() {
    try {
      const pack = await apiFetch("/questions/export");
      const blob = new Blob([JSON.stringify(pack, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ap2-questionpack-v1.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      logger.debug("export", "questions exported", {
        count: pack.questions ? pack.questions.length : 0
      });
    } catch (error) {
      showError("Export failed.", String(error));
      logger.error("export", "failed", { error: String(error) });
    }
  }

  function exportQuestion(q) {
    const base = {
      id: q.id,
      topic_slug: q.topicId,
      type: mapExportType(q.type),
      prompt: q.prompt,
      explanation: q.explanation || "",
      source_ref: q.source_ref || "",
      tags: q.tags || []
    };
    if (q.type === "single") {
      return { ...base, options: q.options, correct: [q.correctIndex] };
    }
    if (q.type === "multi") {
      return { ...base, options: q.options, correct: q.correctIndexes };
    }
    if (q.type === "truefalse") {
      return { ...base, correct: q.correctBoolean };
    }
    if (q.type === "fillblank") {
      return { ...base, text: q.prompt, answers: getFillBlankAnswers(q) };
    }
    if (q.type === "matching") {
      return {
        ...base,
        left: q.pairs.map((p) => p.left),
        right: q.pairs.map((p) => p.right),
        pairs: q.pairs.map((p, i) => [i, i])
      };
    }
    if (q.type === "ordering") {
      return { ...base, items: q.items, correct_order: q.correct_order };
    }
    if (q.type === "guess") {
      return { ...base, answers: q.expectedAnswers || [] };
    }
    if (q.type === "explain") {
      return { ...base, keywords: q.expectedAnswer ? q.expectedAnswer.split(",") : [] };
    }
    if (q.type === "exam") {
      return { ...base, grading: "self" };
    }
    return base;
  }

  function displayQuestion(question) {
    state.overrideQuestion = question;
    state.quizTopic = question.topicId;
    state.quizMode = question.type;
    ui.quizTopic.value = state.quizTopic;
    ui.quizMode.value = state.quizMode;
    renderQuiz(true);
  }

  function mapExportType(type) {
    if (type === "guess") return "guessword";
    if (type === "explain") return "explainterm";
    return type;
  }

  function slugToTitle(slug) {
    return slug
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getLines(id) {
    const el = document.getElementById(id);
    if (!el) return [];
    return el.value
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  function getCommaNumbers(id) {
    const el = document.getElementById(id);
    if (!el) return [];
    return el.value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => Number(v));
  }

  function getCommaStrings(id) {
    const el = document.getElementById(id);
    if (!el) return [];
    return el.value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  function setBuilderStatus(message, isError) {
    if (!ui.builderStatus) return;
    ui.builderStatus.textContent = message;
    ui.builderStatus.style.color = isError ? "var(--error)" : "inherit";
  }

  function getFilteredQuestions() {
    let list = [...dataStore.questions];
    if (state.quizTopic !== "all") {
      list = list.filter((q) => q.topicId === state.quizTopic);
    }
    const mode = state.quizMode;
    const modeMap = {
      single: ["single"],
      truefalse: ["truefalse"],
      multi: ["multi"],
      matching: ["matching"],
      fillblank: ["fillblank"],
      ordering: ["ordering"],
      calc_value: ["calc_value"],
      calc_multi: ["calc_multi"],
      hotspot_svg: ["hotspot_svg"],
      troubleshoot_flow: ["troubleshoot_flow"],
      explain: ["explain"],
      guess: ["guess"],
      exam: ["exam"]
    };
    if (mode === "mixed") {
      const implemented = new Set([
        "single",
        "multi",
        "truefalse",
        "matching",
        "fillblank",
        "ordering",
        "calc_value",
        "calc_multi",
        "hotspot_svg",
        "troubleshoot_flow",
        "guess",
        "explain",
        "exam"
      ]);
      list = list.filter((q) => implemented.has(q.type));
    } else {
      const types = modeMap[mode] || [];
      list = list.filter((q) => types.includes(q.type));
    }
    return list;
  }

  function formatSolution(solution) {
    if (!solution || typeof solution !== "object") return "";
    const parts = [];
    if (solution.final) parts.push(`Final: ${solution.final}`);
    if (Array.isArray(solution.steps) && solution.steps.length) {
      parts.push(`Steps: ${solution.steps.join(" | ")}`);
    }
    if (Array.isArray(solution.checks) && solution.checks.length) {
      parts.push(`Checks: ${solution.checks.join(" | ")}`);
    }
    if (Array.isArray(solution.common_mistakes) && solution.common_mistakes.length) {
      parts.push(`Common mistakes: ${solution.common_mistakes.join(" | ")}`);
    }
    if (solution.mini_example) parts.push(`Mini example: ${solution.mini_example}`);
    return parts.join(" | ");
  }

  function showSelfCheck(question, timeMs, expectedOverride, solutionOverride, selectedOverride) {
    ui.quizResult.innerHTML = `
      <div class="warning">Self-check required for this question type.</div>
      <div class="quiz-actions">
        <button id="self-correct" class="primary" type="button">I was correct</button>
        <button id="self-wrong" class="ghost" type="button">I was wrong</button>
      </div>
      <div class="muted">Expected: ${escapeHtml(
        expectedOverride || question.expectedAnswer || "Use your best judgement."
      )}</div>
      ${solutionOverride ? `<div class="muted">${escapeHtml(formatSolution(solutionOverride))}</div>` : ""}
      <div class="muted">${escapeHtml(question.explanation)}</div>
      <div class="muted">Source: ${escapeHtml(question.source_ref)}</div>
    `;
    const onGrade = async (isCorrect) => {
      const attempt = {
        id: `att_${Date.now()}`,
        questionId: question.id,
        selected: selectedOverride || null,
        correct: isCorrect,
        graded_by_user: true,
        timestamp: new Date().toISOString(),
        timeMs
      };
      await postAttempt(attempt);
      logger.info("quiz", "self-graded", {
        questionId: question.id,
        type: question.type,
        correct: isCorrect,
        graded_by_user: true
      });
      renderDashboard();
      updateDebugPanel();
      ui.quizResult.textContent = `${isCorrect ? "Correct" : "Incorrect"} | ${question.explanation} | Source: ${question.source_ref}`;
    };
    ui.quizResult.querySelector("#self-correct").addEventListener("click", () => {
      onGrade(true);
    });
    ui.quizResult.querySelector("#self-wrong").addEventListener("click", () => {
      onGrade(false);
    });
  }

  function setSubmitEnabled(enabled) {
    ui.submitAnswer.disabled = !enabled;
  }

  function seedAppointments() {
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    return [
      {
        id: "a1",
        title: "Lernblock Netzwerk",
        start: new Date(now.getTime() + day).toISOString(),
        end: new Date(now.getTime() + day + 60 * 60 * 1000).toISOString(),
        notes: "Subnetting drills",
        category: "study"
      },
      {
        id: "a2",
        title: "Elektrotechnik Praxis",
        start: new Date(now.getTime() + 3 * day).toISOString(),
        end: new Date(now.getTime() + 3 * day + 90 * 60 * 1000).toISOString(),
        notes: "Messgeraete check",
        category: "lab"
      }
    ];
  }

  function resetDemoData() {
    showWarning("Demo reset is not available in backend mode.");
    logger.warn("debug", "demo reset disabled");
  }

  async function saveAppointment() {
    const id = ui.apptId.value || `appt_${Date.now()}`;
    const title = ui.apptTitle.value.trim();
    const start = ui.apptStart.value;
    if (!title || !start) {
      showError("Title and start are required.");
      logger.error("calendar", "invalid appointment input");
      state.lastAppointmentAction = "validation_failed";
      updateDebugPanel();
      return;
    }

    const appt = {
      id,
      title,
      start: new Date(start).toISOString(),
      end: ui.apptEnd.value ? new Date(ui.apptEnd.value).toISOString() : "",
      notes: ui.apptNotes.value.trim(),
      category: ui.apptCategory.value.trim()
    };

    const existingIndex = appointments.findIndex((a) => a.id === id);
    try {
      if (existingIndex >= 0) {
        await apiFetch(`/appointments/${id}`, {
          method: "PUT",
          body: JSON.stringify(appt)
        });
        appointments[existingIndex] = appt;
        state.lastAppointmentAction = "updated";
        logger.info("calendar", "appointment updated", { id });
      } else {
        await apiFetch("/appointments", {
          method: "POST",
          body: JSON.stringify(appt)
        });
        appointments.push(appt);
        state.lastAppointmentAction = "created";
        logger.info("calendar", "appointment created", { id });
      }
    } catch (error) {
      showError("Failed to save appointment.", String(error));
      logger.error("calendar", "save failed", { error: String(error) });
      return;
    }
    clearAppointmentForm(true);
    renderCalendar();
    renderDashboard();
    updateDebugPanel();
  }

  async function deleteAppointment(id) {
    try {
      await apiFetch(`/appointments/${id}`, { method: "DELETE" });
      appointments = appointments.filter((a) => a.id !== id);
      state.lastAppointmentAction = "deleted";
      logger.info("calendar", "appointment deleted", { id });
      renderCalendar();
      renderDashboard();
      updateDebugPanel();
    } catch (error) {
      showError("Failed to delete appointment.", String(error));
      logger.error("calendar", "delete failed", { error: String(error) });
    }
  }

  function loadAppointmentToForm(id) {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) {
      showWarning("Appointment not found.");
      logger.error("calendar", "appointment missing", { id });
      return;
    }
    ui.apptId.value = appt.id;
    ui.apptTitle.value = appt.title;
    ui.apptStart.value = toLocalInputValue(appt.start);
    ui.apptEnd.value = appt.end ? toLocalInputValue(appt.end) : "";
    ui.apptCategory.value = appt.category || "";
    ui.apptNotes.value = appt.notes || "";
    state.lastAppointmentAction = "editing";
    updateDebugPanel();
  }

  function clearAppointmentForm(skipActionUpdate) {
    ui.apptId.value = "";
    ui.apptTitle.value = "";
    ui.apptStart.value = "";
    ui.apptEnd.value = "";
    ui.apptCategory.value = "";
    ui.apptNotes.value = "";
    if (!skipActionUpdate) {
      state.lastAppointmentAction = "cleared";
      updateDebugPanel();
    }
  }

  function shiftMonth(delta) {
    const month = new Date(state.calendarMonth);
    month.setMonth(month.getMonth() + delta);
    state.calendarMonth = startOfMonth(month).toISOString();
    renderCalendar();
    updateDebugPanel();
  }

  function exportDebugBundle() {
    const bundle = {
      logs: logger.getLogs(),
      state: { ...state },
      storage: getStorageSnapshot(),
      last_import_snapshot: lastImportSnapshot
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ap2-debug-bundle.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function updateDebugPanel() {
    ui.debugLogs.textContent = logger
      .getLogs()
      .slice(-80)
      .map(
        (log) =>
          `${log.ts} [${log.level}] ${log.scope}: ${log.msg}` +
          (log.data ? ` | ${JSON.stringify(log.data)}` : "")
      )
      .join("\n");
    ui.debugState.textContent = JSON.stringify(state, null, 2);
    ui.debugStorage.textContent = JSON.stringify(getStorageSummary(), null, 2);
    ui.debugError.textContent = lastErrorStack || "None";
  }

  function getStorageSummary() {
    return {
      attempts: attempts.length,
      appointments: appointments.length,
      topics: dataStore.topics.length,
      questions: dataStore.questions.length
    };
  }

  function getStorageSnapshot() {
    const snapshot = {};
    Object.values(STORAGE_KEYS).forEach((key) => {
      if (localStorage.getItem(key) !== null) {
        snapshot[key] = localStorage.getItem(key);
      }
    });
    return snapshot;
  }

  function showWarning(message) {
    ui.warning.textContent = message;
    ui.warning.classList.remove("hidden");
  }

  function showError(message, stack) {
    ui.errorBanner.textContent = message;
    ui.errorBanner.classList.remove("hidden");
    lastErrorStack = stack || message;
    updateDebugPanel();
  }

  function showLogin() {
    if (ui.loginOverlay) {
      ui.loginOverlay.classList.remove("hidden");
    }
  }

  function hideLogin() {
    if (ui.loginOverlay) {
      ui.loginOverlay.classList.add("hidden");
    }
  }

  function setLoginStatus(message, isError) {
    if (!ui.loginStatus) return;
    ui.loginStatus.textContent = message;
    ui.loginStatus.style.color = isError ? "var(--error)" : "inherit";
  }

  function getApiBase() {
    return localStorage.getItem(STORAGE_KEYS.apiBase) || "/api";
  }

  async function apiFetch(path, options = {}, auth = true) {
    const headers = options.headers || {};
    headers["Content-Type"] = "application/json";
    if (auth) {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    const res = await fetch(getApiBase() + path, { ...options, headers });
    if (res.status === 401) {
      showLogin();
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    return res.json();
  }


  async function loadInitialData() {
    try {
      const data = await apiFetch("/questions");
      dataStore = {
        topics: data.topics || [],
        questions: data.questions || [],
        packs: data.packs || [],
        methods: [],
        assets: [],
        settings: {},
        meta: {}
      };
      hydratePackRegistry();
      questionOrder = new Map(
        dataStore.questions.map((q, idx) => [q.id, idx])
      );
      await migrateLocalQuestionMutations();
      const attemptsRes = await apiFetch("/attempts");
      attempts = attemptsRes.attempts || [];
      try {
        state.progressSummary = await apiFetch("/progress/summary");
      } catch (error) {
        logger.warn("progress", "summary failed", { error: String(error) });
        state.progressSummary = null;
      }
      const appointmentsRes = await apiFetch("/appointments");
      appointments = appointmentsRes.appointments || [];
      renderDashboard();
      renderQuizControls();
      renderQuiz();
      renderCalendar();
      renderBuilderControls();
      renderManagerControls();
      renderManager();
      updateDebugPanel();
    } catch (error) {
      showError("Failed to load data from server.", String(error));
      logger.error("api", "load failed", { error: String(error) });
    }
  }

  async function postAttempt(attempt) {
    try {
      await apiFetch("/attempts", {
        method: "POST",
        body: JSON.stringify(attempt)
      });
      attempts.push(attempt);
      try {
        state.progressSummary = await apiFetch("/progress/summary");
      } catch (error) {
        logger.warn("progress", "summary refresh failed", { error: String(error) });
      }
    } catch (error) {
      showError("Failed to save attempt.", String(error));
      logger.error("api", "attempt save failed", { error: String(error) });
    }
  }

  function runWithLatency(fn) {
    if (!state.fakeLatency) {
      Promise.resolve(fn()).catch((error) => {
        logger.error("async", "action failed", { error: String(error) });
      });
      return;
    }
    const delay = 150 + Math.random() * 250;
    setTimeout(() => {
      Promise.resolve(fn()).catch((error) => {
        logger.error("async", "action failed", { error: String(error) });
      });
    }, delay);
  }

  function createLogger(enabled) {
    const logs = [];
    function push(level, scope, msg, data) {
      const entry = {
        ts: new Date().toISOString(),
        level,
        scope,
        msg,
        data: data || null
      };
      logs.push(entry);
      if (logs.length > 400) {
        logs.shift();
      }
      if (enabled) {
        updateDebugPanel();
      }
      return entry;
    }
    return {
      debug: (scope, msg, data) => push("DEBUG", scope, msg, data),
      info: (scope, msg, data) => push("INFO", scope, msg, data),
      warn: (scope, msg, data) => push("WARN", scope, msg, data),
      error: (scope, msg, data) => push("ERROR", scope, msg, data),
      getLogs: () => logs.slice(),
      clear: () => {
        logs.length = 0;
      }
    };
  }

  function average(values) {
    const filtered = values.filter((v) => typeof v === "number");
    if (filtered.length === 0) {
      return null;
    }
    const sum = filtered.reduce((acc, v) => acc + v, 0);
    return sum / filtered.length;
  }

  function getISOWeekNumber(date) {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
  }

  function getISOWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - (day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatDateTime(iso) {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })}`;
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function toLocalInputValue(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function getFillBlankAnswers(question) {
    if (Array.isArray(question.answers) && question.answers.length > 0) {
      return question.answers.map((group) =>
        Array.isArray(group) ? group : [String(group)]
      );
    }
    if (Array.isArray(question.expectedAnswers) && question.expectedAnswers.length > 0) {
      return [question.expectedAnswers];
    }
    return [[""]];
  }

  function toLocalDateKey(date) {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function getRng() {
    if (!state.testMode) {
      return Math.random();
    }
    const seed = 12345;
    state.questionIndex = (state.questionIndex + seed) % 2147483647;
    return (state.questionIndex % 1000) / 1000;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function shuffleArray(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(getRng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  window.onerror = function (message, source, lineno, colno, error) {
    const stack = error && error.stack ? error.stack : String(message);
    logger.error("window", "error", { message, source, lineno, colno });
    showError("An error occurred. Open Debug Panel for details.", stack);
  };

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason || "Unhandled rejection";
    const stack = reason && reason.stack ? reason.stack : String(reason);
    logger.error("window", "unhandledrejection", { reason: String(reason) });
    showError("A promise rejection occurred. Open Debug Panel for details.", stack);
  });
})();
