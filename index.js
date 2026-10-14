 // --- DATA MOCKING ---
        // Sample questions array for demonstration
        const sampleExams = [
            {
                id: 'exam1',
                name: 'HTML & CSS Basics',
                subject: 'Web Technologies',
                duration: 10, // minutes
                passMarks: 40, // percentage
                questions: [
                    {
                        q: "What does HTML stand for?",
                        options: [
                            "Hyper Text Markup Language",
                            "High Text Machine Language",
                            "Hyperlink Text Management Language",
                            "Home Tool Markup Language"
                        ],
                        correct: 0
                    },
                    {
                        q: "Which property is used to change the background color in CSS?",
                        options: ["color", "bgcolor", "background-color", "bg-color"],
                        correct: 2
                    },
                    {
                        q: "Choose the correct HTML element for the largest heading:",
                        options: ["<h6>", "<heading>", "<h1>", "<head>"],
                        correct: 2
                    },
                    {
                        q: "Which CSS property controls the text size?",
                        options: ["font-style", "text-size", "font-size", "text-style"],
                        correct: 2
                    },
                    {
                        q: "What is the correct HTML for adding a background color?",
                        options: ["<body bg=\"yellow\">", "<body style=\"background-color:yellow;\">", "<background>yellow</background>", "<body color=\"yellow\">"],
                        correct: 1
                    }
                ]
            },
            {
                id: 'exam2',
                name: 'JavaScript Fundamentals',
                subject: 'Programming',
                duration: 15,
                passMarks: 50,
                questions: [
                    {
                        q: "Inside which HTML element do we put the JavaScript?",
                        options: ["<js>", "<scripting>", "<script>", "<javascript>"],
                        correct: 2
                    },
                    {
                        q: "How do you write 'Hello World' in an alert box?",
                        options: ["msg('Hello World');", "alertBox('Hello World');", "msgBox('Hello World');", "alert('Hello World');"],
                        correct: 3
                    },
                    {
                        q: "How do you create a function in JavaScript?",
                        options: ["function myFunction()", "function:myFunction()", "function = myFunction()", "myFunction():function"],
                        correct: 0
                    },
                    {
                        q: "How does a FOR loop start?",
                        options: ["for (i <= 5; i++)", "for (i = 0; i <= 5; i++)", "for i = 1 to 5", "for (i = 0; i <= 5)"],
                        correct: 1
                    }
                ]
            }
        ];

        // --- GLOBAL STATE ---
        let currentUser = null;
        let currentExam = null;
        let currentQuestionIndex = 0;
        let userAnswers = []; // Array of selected option indices
        let markedForReview = []; // Array of booleans
        let timerInterval = null;
        let timeRemaining = 0; // in seconds
        let lastResult = null; // Temp holder for viewing review

        // --- INIT & UTILS ---
        document.addEventListener('DOMContentLoaded', () => {
            // Seed default demo user if no users exist
            if (!localStorage.getItem('examPortalUsers')) {
                const demoUsers = [
                    {
                        name: "Rahul Sharma",
                        email: "student@exam.com",
                        password: "password123",
                        mobile: "9876543210",
                        course: "B.Tech Computer Science"
                    }
                ];
                localStorage.setItem('examPortalUsers', JSON.stringify(demoUsers));
            }

            // Set current date in dashboard
            const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('currentDate').innerText = new Date().toLocaleDateString('en-US', dateOpts);
                        
            checkAuth();
        });

        function navigateTo(viewId, isBackFromReview = false) {
            // Allow both short names (dashboard, profile, register, login)
            // and actual HTML IDs (dashboard-view, profile-view, etc.).
            const viewMap = {
                login: 'login-view',
                register: 'register-view',
                dashboard: 'dashboard-view',
                instructions: 'instructions-view',
                exam: 'exam-view',
                result: 'result-view',
                'my-results': 'my-results-view',
                profile: 'profile-view',
                review: 'review-view'
            };

            const targetId = viewMap[viewId] || viewId;
            const targetView = document.getElementById(targetId);

            if (!targetView) {
                console.error(`View not found: ${viewId}`);
                return;
            }

            // Hide all views
            document.querySelectorAll('.view-section').forEach(el => {
                el.classList.remove('active');
            });

            // Show target view
            targetView.classList.add('active');
            window.scrollTo(0, 0);

            // Conditional rendering based on view
            if (targetId === 'dashboard-view') loadDashboard();
            if (targetId === 'profile-view') loadProfile();
            if (targetId === 'my-results-view') loadMyResults();
            if (targetId === 'result-view' && !isBackFromReview) renderResult();
        }

        // --- AUTHENTICATION ---
        function checkAuth() {
            const storedUser = localStorage.getItem('examPortalUser');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                document.getElementById('mainNavbar').classList.remove('d-none');
                document.getElementById('navUserName').innerText = currentUser.name.split(' ')[0];
                navigateTo('dashboard');
            } else {
                document.getElementById('mainNavbar').classList.add('d-none');
                navigateTo('login-view');
            }
        }

        function handleRegister(e) {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const mobile = document.getElementById('regMobile').value;
            const course = document.getElementById('regCourse').value;
            const pass = document.getElementById('regPassword').value;
            const cpass = document.getElementById('regConfirmPassword').value;
            const alertBox = document.getElementById('registerAlert');

            if (pass !== cpass) {
                alertBox.innerText = "Passwords do not match!";
                alertBox.classList.remove('d-none');
                return;
            }

            // In a real app, check if email exists. Using simple local storage for SPA.
            let users = JSON.parse(localStorage.getItem('examPortalUsers')) || [];
            if (users.find(u => u.email === email)) {
                alertBox.innerText = "Email already registered!";
                alertBox.classList.remove('d-none');
                return;
            }

            const newUser = { name, email, mobile, course, password: pass };
            users.push(newUser);
            localStorage.setItem('examPortalUsers', JSON.stringify(users));
            
            // Auto login
            localStorage.setItem('examPortalUser', JSON.stringify(newUser));
            checkAuth();
        }

        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;
            const alertBox = document.getElementById('loginAlert');

            let users = JSON.parse(localStorage.getItem('examPortalUsers')) || [];
            const user = users.find(u => u.email === email && u.password === pass);

            if (user) {
                localStorage.setItem('examPortalUser', JSON.stringify(user));
                checkAuth();
            } else {
                alertBox.innerText = "Invalid email or password!";
                alertBox.classList.remove('d-none');
            }
        }

        function logout() {
            localStorage.removeItem('examPortalUser');
            currentUser = null;
            checkAuth();
        }

        // --- DASHBOARD & PROFILE ---
        function loadDashboard() {
            document.getElementById('welcomeMessage').innerText = `Welcome, ${currentUser.name.split(' ')[0]}!`;
            
            // Calculate stats
            let results = JSON.parse(localStorage.getItem(`results_${currentUser.email}`)) || [];
            document.getElementById('statTotalExams').innerText = sampleExams.length;
            document.getElementById('statCompleted').innerText = results.length;
            document.getElementById('statUpcoming').innerText = Math.max(0, sampleExams.length - results.length);
            
            let avg = 0;
            if (results.length > 0) {
                const totalPercent = results.reduce((sum, res) => sum + res.percentage, 0);
                avg = (totalPercent / results.length).toFixed(0);
            }
            document.getElementById('statAvgScore').innerText = `${avg}%`;

            // Render exams
            const container = document.getElementById('availableExamsContainer');
            container.innerHTML = '';
            
            sampleExams.forEach(exam => {
                // Check if already taken
                const isTaken = results.find(r => r.examId === exam.id);
                
                const card = document.createElement('div');
                card.className = 'col-md-6 mb-4';
                card.innerHTML = `
                    <div class="card exam-card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill">${exam.subject}</span>
                                ${isTaken ? `<span class="badge bg-success"><i class="bi bi-check2"></i> Completed</span>` : `<span class="badge bg-warning text-dark"><i class="bi bi-clock"></i> Pending</span>`}
                            </div>
                            <h5 class="card-title fw-bold">${exam.name}</h5>
                            <div class="mb-3 text-muted small">
                                <span class="me-3"><i class="bi bi-list-task"></i> ${exam.questions.length} Questions</span>
                                <span><i class="bi bi-stopwatch"></i> ${exam.duration} Minutes</span>
                            </div>
                            ${isTaken ? 
                                `<button class="btn btn-outline-secondary w-100" onclick="navigateTo('my-results')">View Result</button>` : 
                                `<button class="btn btn-primary w-100" onclick="prepareExam('${exam.id}')">Start Exam <i class="bi bi-arrow-right"></i></button>`
                            }
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function loadProfile() {
            document.getElementById('profNameTitle').innerText = currentUser.name;
            document.getElementById('profCourseTitle').innerText = currentUser.course;
            
            document.getElementById('profName').innerText = currentUser.name;
            document.getElementById('profEmail').innerText = currentUser.email;
            document.getElementById('profMobile').innerText = currentUser.mobile;
            document.getElementById('profCourse').innerText = currentUser.course;
        }

        // --- EXAM SYSTEM ---
        function prepareExam(examId) {
            currentExam = sampleExams.find(e => e.id === examId);
            document.getElementById('instExamName').innerText = currentExam.name;
            document.getElementById('instTotalQuestions').innerText = currentExam.questions.length;
            document.getElementById('instDuration').innerText = currentExam.duration;
            document.getElementById('instTotalMarks').innerText = currentExam.questions.length; // 1 mark each
            
            // Reset state
            document.getElementById('agreeInstructions').checked = false;
            document.getElementById('startExamBtn').disabled = true;
            
            navigateTo('instructions-view');
        }

        function toggleStartBtn() {
            const checked = document.getElementById('agreeInstructions').checked;
            document.getElementById('startExamBtn').disabled = !checked;
        }

        function startExam() {
            // Initialize exam state
            currentQuestionIndex = 0;
            userAnswers = new Array(currentExam.questions.length).fill(null);
            markedForReview = new Array(currentExam.questions.length).fill(false);
            
            document.getElementById('activeExamName').innerText = currentExam.name;
            document.getElementById('activeStudentName').innerText = currentUser.name;
            document.getElementById('totalQNum').innerText = currentExam.questions.length;
            
            generatePalette();
            renderQuestion();
            startTimer(currentExam.duration * 60); // Convert mins to secs
            
            // Go fullscreen-like (hide navbar)
            document.getElementById('mainNavbar').classList.add('d-none');
            navigateTo('exam-view');
        }

        function startTimer(seconds) {
            timeRemaining = seconds;
            updateTimerDisplay();
            
            if(timerInterval) clearInterval(timerInterval);
            
            timerInterval = setInterval(() => {
                timeRemaining--;
                updateTimerDisplay();
                
                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    autoSubmitExam();
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
            const s = (timeRemaining % 60).toString().padStart(2, '0');
            const display = document.getElementById('timerDisplay');
            display.innerText = `${m}:${s}`;
            
            // Flash red if less than 1 minute
            if (timeRemaining < 60) {
                display.parentElement.classList.replace('bg-primary', 'bg-danger');
                display.parentElement.classList.add('pulse');
            }
        }

        function generatePalette() {
            const palette = document.getElementById('questionPalette');
            palette.innerHTML = '';
            
            for (let i = 0; i < currentExam.questions.length; i++) {
                const btn = document.createElement('button');
                btn.className = `palette-btn palette-not-visited`;
                btn.innerText = i + 1;
                btn.id = `palBtn_${i}`;
                btn.onclick = () => jumpToQuestion(i);
                palette.appendChild(btn);
            }
        }

        function updatePaletteStyles() {
            for (let i = 0; i < currentExam.questions.length; i++) {
                const btn = document.getElementById(`palBtn_${i}`);
                // Remove all classes
                btn.classList.remove('palette-not-visited', 'palette-answered', 'palette-marked', 'palette-current');
                
                if (i === currentQuestionIndex) {
                    btn.classList.add('palette-current');
                    // Add background based on state so it keeps color but adds border
                    if (markedForReview[i]) btn.classList.add('palette-marked');
                    else if (userAnswers[i] !== null) btn.classList.add('palette-answered');
                    else btn.classList.add('palette-not-visited');
                } else {
                    if (markedForReview[i]) btn.classList.add('palette-marked');
                    else if (userAnswers[i] !== null) btn.classList.add('palette-answered');
                    else btn.classList.add('palette-not-visited');
                }
            }
        }
     
function renderQuestion() {
    const question = currentExam.questions[currentQuestionIndex];

    document.getElementById("currentQNum").innerText =
        currentQuestionIndex + 1;

    document.getElementById("questionText").textContent = question.q;

    const optionsContainer = document.getElementById("optionsContainer");
    optionsContainer.innerHTML = "";

    question.options.forEach((option, index) => {
        const optionDiv = document.createElement("div");

        const isSelected = userAnswers[currentQuestionIndex] === index;

        optionDiv.className =
            `option-container ${isSelected ? "selected" : ""}`;

        optionDiv.onclick = () => selectOption(index);

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.className = "form-check-input cursor-pointer";
        radio.name = "examOption";
        radio.id = `opt_${index}`;
        radio.value = index;
        radio.checked = isSelected;

        const label = document.createElement("label");
        label.className = "form-check-label w-100 cursor-pointer ps-2";
        label.htmlFor = radio.id;
        label.textContent = option;

        const formCheck = document.createElement("div");
        formCheck.className = "form-check m-0";

        formCheck.appendChild(radio);
        formCheck.appendChild(label);

        optionDiv.appendChild(formCheck);
        optionsContainer.appendChild(optionDiv);
    });

    document.getElementById("btnPrev").disabled =
        currentQuestionIndex === 0;

    document.getElementById("btnNext").disabled =
        currentQuestionIndex === currentExam.questions.length - 1;

    updatePaletteStyles();
}


        function selectOption(index) {
            userAnswers[currentQuestionIndex] = index;
            // Optionally unmark review if answered
            markedForReview[currentQuestionIndex] = false; 
            renderQuestion(); // re-render to show selection and update palette
        }

        function navigateQuestion(step) {
            const newIndex = currentQuestionIndex + step;
            if (newIndex >= 0 && newIndex < currentExam.questions.length) {
                currentQuestionIndex = newIndex;
                renderQuestion();
            }
        }

        function jumpToQuestion(index) {
            currentQuestionIndex = index;
            renderQuestion();
        }

        function markForReview() {
            markedForReview[currentQuestionIndex] = !markedForReview[currentQuestionIndex];
            updatePaletteStyles();
        }

        // --- SUBMISSION & RESULTS ---
        let submitModalInstance = null;
        
        function showSubmitModal() {
            if(!submitModalInstance) {
                submitModalInstance = new bootstrap.Modal(document.getElementById('submitModal'));
            }
            submitModalInstance.show();
        }

        function autoSubmitExam() {
            if(submitModalInstance) submitModalInstance.hide();
            alert("Time is up! Submitting exam automatically.");
            finishExam();
        }

        function finishExam() {
            clearInterval(timerInterval);
            if(submitModalInstance) submitModalInstance.hide();
            
            // Calculate Results
            let correct = 0;
            let wrong = 0;
            let unanswered = 0;
            
            currentExam.questions.forEach((q, i) => {
                if (userAnswers[i] === null) {
                    unanswered++;
                } else if (userAnswers[i] === q.correct) {
                    correct++;
                } else {
                    wrong++;
                }
            });
            
            const total = currentExam.questions.length;
            const percentage = (correct / total) * 100;
            const isPass = percentage >= currentExam.passMarks;
            
            const resultData = {
                examId: currentExam.id,
                examName: currentExam.name,
                subject: currentExam.subject,
                date: new Date().toISOString(),
                total,
                correct,
                wrong,
                unanswered,
                score: correct,
                percentage: Math.round(percentage),
                isPass,
                userAnswers: [...userAnswers] // save copy
            };
            
            // Save to LocalStorage
            let results = JSON.parse(localStorage.getItem(`results_${currentUser.email}`)) || [];
            results.push(resultData);
            localStorage.setItem(`results_${currentUser.email}`, JSON.stringify(results));
            
            lastResult = resultData;
            
            // Restore navbar and show result
            document.getElementById('mainNavbar').classList.remove('d-none');
            navigateTo('result-view');
        }

        function renderResult() {
            if (!lastResult) return navigateTo('dashboard');
            
            document.getElementById('resExamName').innerText = lastResult.examName;
            document.getElementById('resStudentName').innerText = currentUser.name;
            
            document.getElementById('resScoreText').innerText = `${lastResult.score} / ${lastResult.total}`;
            document.getElementById('resPercentageText').innerText = `${lastResult.percentage}%`;
            
            const pBar = document.getElementById('resProgressBar');
            pBar.style.width = `${lastResult.percentage}%`;
            
            const statusEl = document.getElementById('resultStatus');
            const iconEl = document.getElementById('resultIcon');
            
            if (lastResult.isPass) {
                statusEl.innerText = "PASS";
                statusEl.className = "fw-bold text-success";
                iconEl.innerHTML = '<i class="bi bi-trophy text-warning"></i>';
                pBar.className = "progress-bar progress-bar-striped progress-bar-animated bg-success";
            } else {
                statusEl.innerText = "FAIL";
                statusEl.className = "fw-bold text-danger";
                iconEl.innerHTML = '<i class="bi bi-emoji-frown text-danger"></i>';
                pBar.className = "progress-bar progress-bar-striped progress-bar-animated bg-danger";
            }
            
            document.getElementById('resCorrect').innerText = lastResult.correct;
            document.getElementById('resWrong').innerText = lastResult.wrong;
            document.getElementById('resUnanswered').innerText = lastResult.unanswered;
        }

       
function showAnswerReview() {
    if (!lastResult || !currentExam) {
        console.error("Result or exam data not found.");
        return;
    }

    document.getElementById("revExamName").textContent =
        lastResult.examName;

    const container = document.getElementById("reviewContainer");
    container.innerHTML = "";

    currentExam.questions.forEach((q, i) => {
        const userAnswer = lastResult.userAnswers[i];
        const correctAnswer = Number(q.correct);

        const isUnanswered = userAnswer === null ||
                             userAnswer === undefined;
        const isCorrect = !isUnanswered &&
                          Number(userAnswer) === correctAnswer;

        // Question card
        const card = document.createElement("div");
        card.className =
            `card mb-4 shadow-sm border ${
                isUnanswered
                    ? "border-secondary"
                    : isCorrect
                    ? "border-success"
                    : "border-danger"
            }`;

        // Card header
        const header = document.createElement("div");
        header.className =
            "card-header bg-white d-flex justify-content-between align-items-center";

        const heading = document.createElement("h6");
        heading.className = "mb-0 fw-bold";
        heading.textContent = `Question ${i + 1}`;

        const status = document.createElement("span");
        status.className = isUnanswered
            ? "text-secondary"
            : isCorrect
            ? "text-success"
            : "text-danger";

        status.textContent = isUnanswered
            ? "Not Answered"
            : isCorrect
            ? "✓ Correct"
            : "✗ Incorrect";

        header.append(heading, status);

        // Card body
        const body = document.createElement("div");
        body.className = "card-body";

        const questionText = document.createElement("p");
        questionText.className = "fs-5 mb-3";
        questionText.textContent = q.q;

        const optionsContainer = document.createElement("div");
        optionsContainer.className = "options-review";

        q.options.forEach((option, index) => {
            const optionDiv = document.createElement("div");
            optionDiv.className = "p-3 mb-2 rounded border";

            // IMPORTANT: textContent displays HTML tags as text.
            optionDiv.textContent = `${String.fromCharCode(65 + index)}. ${option}`;

            if (index === correctAnswer) {
                optionDiv.classList.add(
                    "bg-success-subtle",
                    "border-success",
                    "fw-bold",
                    "text-success"
                );
                optionDiv.textContent += "  ✓ Correct Answer";
            } else if (
                !isUnanswered &&
                index === Number(userAnswer)
            ) {
                optionDiv.classList.add(
                    "bg-danger-subtle",
                    "border-danger",
                    "text-danger"
                );
                optionDiv.textContent += "  ✗ Your Answer";
            }

            optionsContainer.appendChild(optionDiv);
        });

        body.append(questionText, optionsContainer);
        card.append(header, body);
        container.appendChild(card);
    });

    navigateTo("review-view");
}


        function loadMyResults() {
            const results = JSON.parse(localStorage.getItem(`results_${currentUser.email}`)) || [];
            const tbody = document.getElementById('resultsTableBody');
            const noRes = document.getElementById('noResultsMsg');
            
            tbody.innerHTML = '';
            
            if (results.length === 0) {
                noRes.classList.remove('d-none');
                return;
            }
            
            noRes.classList.add('d-none');
            
            // Sort by date desc
            results.sort((a,b) => new Date(b.date) - new Date(a.date));
            
            results.forEach(res => {
                const dateStr = new Date(res.date).toLocaleDateString();
                const statusBadge = res.isPass ? 
                    `<span class="badge bg-success">Pass</span>` : 
                    `<span class="badge bg-danger">Fail</span>`;
                    
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-medium">${res.examName}<br><small class="text-muted">${res.subject}</small></td>
                    <td>${dateStr}</td>
                    <td>${res.score}/${res.total}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="me-2">${res.percentage}%</span>
                            <div class="progress flex-grow-1" style="height: 6px; width: 60px;">
                                <div class="progress-bar ${res.isPass ? 'bg-success' : 'bg-danger'}" style="width: ${res.percentage}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewPastResult('${res.examId}', '${res.date}')">View</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        function viewPastResult(examId, dateStr) {
            const results = JSON.parse(localStorage.getItem(`results_${currentUser.email}`)) || [];
            const targetResult = results.find(r => r.examId === examId && r.date === dateStr);
            if(targetResult) {
                lastResult = targetResult;
                currentExam = sampleExams.find(e => e.id === examId);
                renderResult();
                navigateTo('result-view');
            }
        }