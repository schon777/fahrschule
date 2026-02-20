(() => {
  const STORAGE_KEYS = {
    token: "ap2_token",
    username: "ap2_username",
    apiBase: "ap2_api_base",
    debug: "ap2_debug",
    testMode: "ap2_test_mode",
    fakeLatency: "ap2_fake_latency"
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
    isAuthenticated: false
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
      builder: document.getElementById("page-builder")
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

  let dataStore = { topics: [], questions: [] };
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
    const attemptedIds = new Set(attempts.map((a) => a.questionId));
    const correctIds = new Set(
      attempts.filter((a) => a.correct).map((a) => a.questionId)
    );

    ui.totalQuestions.textContent = total;
    ui.answeredQuestions.textContent = attemptedIds.size;

    renderTopicsTable(total, attemptedIds, correctIds);
    renderLearningSpeed(now, total, correctIds);
    renderAppointmentsSummary(now);
    updateDebugPanel();
  }

  function renderTopicsTable(total, attemptedIds, correctIds) {
    ui.topicsBody.innerHTML = "";
    dataStore.topics.forEach((topic) => {
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
        <td>${escapeHtml(topic.name)}</td>
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

  function renderQuiz(forceNext) {
    const question = state.overrideQuestion || getNextQuestion(forceNext);
    state.overrideQuestion = null;
    if (!question) {
      showWarning("No questions available.");
      ui.quizForm.innerHTML = "";
      ui.quizResult.textContent = "";
      setSubmitEnabled(false);
      return;
    }
    currentQuestionStartAt = Date.now();
    state.currentQuestionId = question.id;
    state.currentTopicId = question.topicId;
    ui.quizMeta.textContent = `Topic: ${question.topicId} | Type: ${question.type}`;
    ui.quizForm.innerHTML = "";
    ui.quizResult.textContent = "";
    const form = document.createElement("div");
    form.className = "quiz-form";
    form.id = "quiz-form";
    form.innerHTML = `<div class="quiz-prompt">${escapeHtml(question.prompt)}</div>`;

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
    } else {
      form.innerHTML += `<div class="warning">This question type is not implemented yet.</div>`;
      logger.warn("quiz", "type not implemented", { type });
      setSubmitEnabled(false);
    }

    ui.quizForm.replaceWith(form);
    ui.quizForm = form;
    updateDebugPanel();
  }

  async function submitAnswer() {
    const question = dataStore.questions.find(
      (q) => q.id === state.currentQuestionId
    );
    if (!question) {
      showWarning("Invalid question state.");
      logger.error("quiz", "missing question");
      return;
    }

    const timeMs = currentQuestionStartAt
      ? Date.now() - currentQuestionStartAt
      : null;
    const type = question.type;
    let correct = false;
    let expected = "";
    let selected = null;
    let gradedByUser = false;

    if (type === "multi") {
      selected = Array.from(
        ui.quizForm.querySelectorAll("input[name='option']:checked")
      ).map((el) => Number(el.value));
      correct = compareSelections(selected, question.correctIndexes);
      expected = question.correctIndexes
        .map((i) => question.options[i])
        .join(", ");
    } else if (type === "single") {
      const value = ui.quizForm.querySelector("input[name='single']:checked");
      if (!value) {
        showWarning("Select one answer.");
        return;
      }
      selected = Number(value.value);
      correct = selected === question.correctIndex;
      expected = question.options[question.correctIndex];
    } else if (type === "truefalse") {
      const value = ui.quizForm.querySelector("input[name='truefalse']:checked");
      if (!value) {
        showWarning("Select true or false.");
        return;
      }
      selected = value.value;
      correct = (value.value === "true") === question.correctBoolean;
      expected = question.correctBoolean ? "True" : "False";
    } else if (type === "matching") {
      const selections = question.pairs.map((pair, idx) => {
        const select = ui.quizForm.querySelector(`select[name='match-${idx}']`);
        return select ? select.value : "";
      });
      if (selections.some((v) => !v)) {
        showWarning("Please select all matches.");
        return;
      }
      selected = selections;
      correct = selections.every(
        (val, idx) => val === question.pairs[idx].right
      );
      expected = question.pairs
        .map((pair) => `${pair.left} -> ${pair.right}`)
        .join("; ");
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
      selected = values;
      correct = values.every((val, idx) => {
        const accepted = blanks[idx].map((a) => a.toLowerCase());
        return accepted.includes(val.toLowerCase());
      });
      expected = blanks.map((opts) => opts.join("/")).join(" | ");
    } else if (type === "guess") {
      const input = ui.quizForm.querySelector("input[name='guess']");
      const value = input ? input.value.trim() : "";
      if (!value) {
        showWarning("Please enter an answer.");
        return;
      }
      selected = value;
      const accepted = question.expectedAnswers.map((a) => a.toLowerCase());
      correct = accepted.includes(value.toLowerCase());
      expected = question.expectedAnswers.join(", ");
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
      selected = selections.map((v) => Number(v));
      const expectedOrder = question.correct_order || [];
      correct = selected.every((val, idx) => val === expectedOrder[idx]);
      expected = expectedOrder.map((pos) => pos + 1).join(", ");
    } else if (type === "explain" || type === "exam") {
      showSelfCheck(question, timeMs);
      return;
    } else {
      showWarning("This question type is not implemented yet.");
      logger.warn("quiz", "submit on unimplemented type", { type });
      return;
    }

    const attempt = {
      id: `att_${Date.now()}`,
      questionId: question.id,
      selected,
      correct,
      graded_by_user: gradedByUser,
      timestamp: new Date().toISOString(),
      timeMs
    };
    await postAttempt(attempt);

    ui.quizResult.textContent = `${correct ? "Correct" : "Incorrect"} | Expected: ${expected} | ${question.explanation} | Source: ${question.source_ref}`;
    logger.info("quiz", "answer submitted", {
      questionId: question.id,
      type,
      correct,
      graded_by_user: gradedByUser
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
    const topicOptions = [
      { id: "all", name: "All Topics (Mixed)" },
      ...dataStore.topics
    ];
    topicOptions.forEach((topic) => {
      const opt = document.createElement("option");
      opt.value = topic.id;
      opt.textContent = topic.name;
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
    dataStore.topics.forEach((topic) => {
      const opt = document.createElement("option");
      opt.value = topic.id;
      opt.textContent = topic.name;
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
    if (!pack || pack.schema !== "ap2-questionpack-v1") {
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
    if (result.errors.length > 0) {
      lines.push(`Errors (first 5):`);
      result.errors.slice(0, 5).forEach((err) => lines.push(`- ${err}`));
    }
    return lines.join("\n");
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

  function showSelfCheck(question, timeMs) {
    ui.quizResult.innerHTML = `
      <div class="warning">Self-check required for this question type.</div>
      <div class="quiz-actions">
        <button id="self-correct" class="primary" type="button">I was correct</button>
        <button id="self-wrong" class="ghost" type="button">I was wrong</button>
      </div>
      <div class="muted">Expected: ${escapeHtml(
        question.expectedAnswer || "Use your best judgement."
      )}</div>
      <div class="muted">${escapeHtml(question.explanation)}</div>
      <div class="muted">Source: ${escapeHtml(question.source_ref)}</div>
    `;
    const onGrade = async (isCorrect) => {
      const attempt = {
        id: `att_${Date.now()}`,
        questionId: question.id,
        selected: null,
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
    return localStorage.getItem(STORAGE_KEYS.apiBase) || "http://localhost:8000";
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
      dataStore = { topics: data.topics || [], questions: data.questions || [] };
      const attemptsRes = await apiFetch("/attempts");
      attempts = attemptsRes.attempts || [];
      const appointmentsRes = await apiFetch("/appointments");
      appointments = appointmentsRes.appointments || [];
      renderDashboard();
      renderQuizControls();
      renderQuiz();
      renderCalendar();
      renderBuilderControls();
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
