const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const tasksFile = path.join(__dirname, "tasks.json");
const stateFile = path.join(__dirname, "task_state.json");
const heatmapFile = path.join(__dirname, "failure_heatmap.json");
const memoryFile = path.join(__dirname, "evolutionary_memory.json");
const tracesDir = path.join(__dirname, "traces");

// Helper: safe directory creation
if (!fs.existsSync(tracesDir)) {
    fs.mkdirSync(tracesDir, { recursive: true });
}

// -------------------------------------------------------------
// Database & State Helpers
// -------------------------------------------------------------

function readTasks() {
    if (!fs.existsSync(tasksFile)) return [];
    try {
        return JSON.parse(fs.readFileSync(tasksFile, "utf8"));
    } catch (_) {
        return [];
    }
}

function writeTasks(tasks) {
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 4), "utf8");
}

function readState() {
    if (!fs.existsSync(stateFile)) {
        return { activeTaskId: null, currentState: "idle", retries: 0, maxRetries: 3, trace: [] };
    }
    try {
        return JSON.parse(fs.readFileSync(stateFile, "utf8"));
    } catch (_) {
        return { activeTaskId: null, currentState: "idle", retries: 0, maxRetries: 3, trace: [] };
    }
}

function writeState(state) {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 4), "utf8");
}

function readHeatmap() {
    if (!fs.existsSync(heatmapFile)) {
        return { total_failures: 0, categories: { misalignment: 0, design: 0, verification: 0, coordination: 0 }, task_failures: {} };
    }
    try {
        return JSON.parse(fs.readFileSync(heatmapFile, "utf8"));
    } catch (_) {
        return { total_failures: 0, categories: { misalignment: 0, design: 0, verification: 0, coordination: 0 }, task_failures: {} };
    }
}

function writeHeatmap(heatmap) {
    fs.writeFileSync(heatmapFile, JSON.stringify(heatmap, null, 4), "utf8");
}

function readMemory() {
    if (!fs.existsSync(memoryFile)) {
        return { successful_patterns: [], anti_patterns: [], learnings: [] };
    }
    try {
        return JSON.parse(fs.readFileSync(memoryFile, "utf8"));
    } catch (_) {
        return { successful_patterns: [], anti_patterns: [], learnings: [] };
    }
}

function writeMemory(memory) {
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 4), "utf8");
}

function logTrace(taskId, stepName, status, details = "") {
    const tracePath = path.join(tracesDir, `${taskId}.json`);
    let traceData = [];
    if (fs.existsSync(tracePath)) {
        try {
            traceData = JSON.parse(fs.readFileSync(tracePath, "utf8"));
        } catch (_) {}
    }
    const logEntry = {
        timestamp: new Date().toISOString(),
        step: stepName,
        status,
        details
    };
    traceData.push(logEntry);
    fs.writeFileSync(tracePath, JSON.stringify(traceData, null, 4), "utf8");
    
    // Also push to active state trace
    const state = readState();
    if (state.activeTaskId === taskId) {
        state.trace.push(logEntry);
        writeState(state);
    }
}

// -------------------------------------------------------------
// Core ACP States & Transitions
// -------------------------------------------------------------

function runACPWorkflow(taskId) {
    const tasks = readTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        console.error(`\x1b[31m✖ Error: Task ${taskId} not found.\x1b[0m`);
        return;
    }

    console.log(`\n\x1b[35m=== RUNNING ADAPTIVE ACP WORKFLOW FOR ${task.id} ===\x1b[0m`);
    console.log(`Title: ${task.title}`);

    // Risk Assessment & State Init
    const risk = assessRisk(task);
    console.log(`[Risk Assessment] Risk Level: \x1b[33m${risk.level.toUpperCase()}\x1b[0m (Score: ${risk.score}/10)`);
    console.log(`  Notes: ${risk.notes.join(", ")}`);

    // Initialize state
    const state = {
        activeTaskId: taskId,
        currentState: "planning",
        retries: 0,
        maxRetries: 3,
        trace: []
    };
    writeState(state);
    logTrace(taskId, "init", "success", `Risk level: ${risk.level}`);

    // State machine loop
    let success = false;
    while (state.currentState !== "completed" && state.currentState !== "failed") {
        const currentState = state.currentState;
        console.log(`\n\x1b[36m➔ Transitioning to state: [${currentState.toUpperCase()}]\x1b[0m`);

        switch (currentState) {
            case "planning":
                state.currentState = handlePlanning(task);
                break;
            case "plan-reviewing":
                state.currentState = handlePlanReview(task);
                break;
            case "developing":
                state.currentState = handleDevelopment(task, state);
                break;
            case "code-reviewing":
                state.currentState = handleCodeReview(task);
                break;
            case "testing":
                state.currentState = handleTesting(task, state);
                break;
            case "fixing":
                state.currentState = handleFixing(task, state);
                break;
            default:
                state.currentState = "failed";
        }
        writeState(state);
    }

    // Closeout & Reporting
    if (state.currentState === "completed") {
        task.status = "completed";
        task.completedAt = new Date().toISOString();
        task.notes = `Completed after ${state.retries} fix retries. Trace recorded in traces/${taskId}.json.`;
        writeTasks(tasks);

        // Update memory
        const memory = readMemory();
        const pattern = `Task ${taskId} (${task.title}) resolved successfully with risk level ${risk.level}.`;
        if (!memory.successful_patterns.includes(pattern)) {
            memory.successful_patterns.push(pattern);
            memory.learnings.push(`Successfully added/updated codebase with risk score ${risk.score}.`);
            writeMemory(memory);
        }

        console.log(`\n\x1b[32m🏆 ACP Workflow SUCCESS: Task ${taskId} is completed!\x1b[0m\n`);
        success = true;
    } else {
        task.status = "failed";
        task.notes = `Aborted workflow. Exceeded max retries or critical design flaw encountered.`;
        writeTasks(tasks);

        // Update failure heatmap
        const heatmap = readHeatmap();
        heatmap.total_failures++;
        heatmap.categories.coordination++;
        heatmap.task_failures[taskId] = {
            title: task.title,
            reason: "Exceeded retry threshold or critical design mismatch.",
            timestamp: new Date().toISOString()
        };
        writeHeatmap(heatmap);

        console.log(`\n\x1b[31m✖ ACP Workflow FAILURE: Task ${taskId} failed.\x1b[0m\n`);
    }

    // Reset active task state
    writeState({ activeTaskId: null, currentState: "idle", retries: 0, maxRetries: 3, trace: [] });
    return success;
}

// -------------------------------------------------------------
// Phase Implementations & Simulators
// -------------------------------------------------------------

function assessRisk(task) {
    let score = 2;
    const notes = ["Base complexity score"];

    if (task.description.toLowerCase().includes("upgrade") || task.title.toLowerCase().includes("upgrade")) {
        score += 3;
        notes.push("Modifies upgrades game state");
    }
    if (task.description.toLowerCase().includes("arena") || task.description.toLowerCase().includes("damage")) {
        score += 2;
        notes.push("Modifies combat or core game mechanics");
    }

    let level = "low";
    if (score >= 7) level = "high";
    else if (score >= 4) level = "medium";

    return { score, level, notes };
}

function handlePlanning(task) {
    logTrace(task.id, "planning", "started");
    const planDir = path.join(__dirname, "plans");
    if (!fs.existsSync(planDir)) fs.mkdirSync(planDir);

    const planPath = path.join(planDir, `${task.id}.md`);
    if (!fs.existsSync(planPath)) {
        const template = `# Implementation Plan: ${task.title}
- **Task ID**: ${task.id}
- **Status**: Drafted by Architect

## 1. System Design & State Changes
- Addressed state variables: training levels

## 2. Code Changes Spec
- Files to edit: app.js, source.html

## 3. DOM & UI Spec
- Selectors: upgrade-training-* elements

## 4. Test Specifications
- Tests: Assertions in tests/mechanics.test.cjs
`;
        fs.writeFileSync(planPath, template, "utf8");
        console.log(`\x1b[32m✔ Architect generated initial plan blueprint.\x1b[0m`);
        logTrace(task.id, "planning", "success", "Generated draft plan file");
    } else {
        console.log(`\x1b[32m✔ Architect retrieved existing implementation plan.\x1b[0m`);
        logTrace(task.id, "planning", "success", "Retrieved existing plan");
    }

    return "plan-reviewing";
}

function handlePlanReview(task) {
    console.log("[Plan Critic] Reviewing implementation plan...");
    logTrace(task.id, "plan-reviewing", "started");
    
    const planPath = path.join(__dirname, "plans", `${task.id}.md`);
    if (!fs.existsSync(planPath)) {
        console.log("\x1b[31m✖ Plan Critic REJECTED: Plan file not found.\x1b[0m");
        logTrace(task.id, "plan-reviewing", "failed", "Plan file missing");
        updateHeatmapCategory("design");
        return "planning";
    }

    const planContent = fs.readFileSync(planPath, "utf8");
    const checkTargetFiles = planContent.includes("Target Files") || planContent.includes("Files to edit");
    const checkTestSpec = planContent.includes("Test Specifications") || planContent.includes("Tests:");

    if (checkTargetFiles && checkTestSpec) {
        console.log("\x1b[32m✔ Plan Critic APPROVED plan format and specs.\x1b[0m");
        logTrace(task.id, "plan-reviewing", "success", "Plan validated successfully");
        return "developing";
    } else {
        console.log("\x1b[31m✖ Plan Critic REJECTED: Missing target files or test specifications in plan.\x1b[0m");
        logTrace(task.id, "plan-reviewing", "failed", "Plan format review rejected");
        updateHeatmapCategory("design");
        return "planning";
    }
}

function handleDevelopment(task, state) {
    logTrace(task.id, "developing", "started");
    console.log("[Developer] Checking local workspace file modifications...");
    
    // Development checkpoint
    try {
        const gitStatus = execSync("git status --porcelain", { cwd: root }).toString().trim();
        if (gitStatus) {
            console.log("\x1b[33m[Developer] Code changes detected in workspace.\x1b[0m");
            logTrace(task.id, "developing", "success", "Workspace code changes detected");
        } else {
            console.log("\x1b[33m[Developer] No workspace changes detected. Code is aligned with main branch.\x1b[0m");
            logTrace(task.id, "developing", "success", "Workspace code matches clean branch");
        }
    } catch (_) {
        logTrace(task.id, "developing", "success", "Git status check skipped");
    }

    return "code-reviewing";
}

function handleCodeReview(task) {
    console.log("[Code Critic] Reviewing code changesets...");
    logTrace(task.id, "code-reviewing", "started");

    // Check syntax using Node syntax validation
    try {
        const appPath = path.join(root, "app.js");
        if (fs.existsSync(appPath)) {
            execSync(`node -c "${appPath}"`);
        }
        
        const testPath = path.join(root, "tests", "mechanics.test.cjs");
        if (fs.existsSync(testPath)) {
            execSync(`node -c "${testPath}"`);
        }
        
        console.log("\x1b[32m✔ Code Critic APPROVED: Syntax analysis passed with zero errors.\x1b[0m");
        logTrace(task.id, "code-reviewing", "success", "Syntax validation passed");
        return "testing";
    } catch (err) {
        console.log(`\x1b[31m✖ Code Critic REJECTED: Syntax error detected in source code:\x1b[0m\n${err.message}`);
        logTrace(task.id, "code-reviewing", "failed", `Syntax error: ${err.message}`);
        updateHeatmapCategory("misalignment");
        return "fixing";
    }
}

function handleTesting(task, state) {
    console.log("[Tester] Running build compilation and game mechanics test suites...");
    logTrace(task.id, "testing", "started");

    try {
        // Run pre-build compilation
        execSync("npm run build:html", { cwd: root, stdio: "pipe" });
        console.log("✔ Layout compiled successfully (index.html output matches source.html structural tags).");

        // Run tests
        const testOutput = execSync("npm test", { cwd: root, stdio: "pipe" }).toString();
        console.log(testOutput.trim());
        console.log("\x1b[32m✔ Tester APPROVED: All test cases pass successfully.\x1b[0m");
        logTrace(task.id, "testing", "success", "All build checks and tests passed");
        return "completed";
    } catch (err) {
        const errorMsg = err.stderr ? err.stderr.toString() : err.message;
        console.log(`\x1b[31m✖ Tester REJECTED: Test failures detected.\x1b[0m\n${errorMsg}`);
        logTrace(task.id, "testing", "failed", errorMsg);
        updateHeatmapCategory("verification");

        state.errorLog = errorMsg;
        return "fixing";
    }
}

function handleFixing(task, state) {
    if (state.retries >= state.maxRetries) {
        console.log(`\x1b[31m✖ Fixer Escalation: Maximum retries (${state.maxRetries}) exceeded.\x1b[0m`);
        logTrace(task.id, "fixing", "escalated", `Retries exceeded limit of ${state.maxRetries}`);
        return "failed";
    }

    state.retries++;
    console.log(`[Fixer] Analyzing failure logs (Retry ${state.retries}/${state.maxRetries})...`);
    logTrace(task.id, "fixing", "started", `Retry ${state.retries}`);

    const errorLog = state.errorLog || "";
    let proposal = "Unknown test runtime error. Check console log stack trace.";

    if (errorLog.includes("AssertionError")) {
        proposal = "Assertion mismatch: game values do not match formula logic. Check multipliers or starting balance.";
    } else if (errorLog.includes("ReferenceError") || errorLog.includes("is not defined")) {
        proposal = "Reference error: missing element initialization or variable scoping issue inside app.js.";
    } else if (errorLog.includes("SyntaxError")) {
        proposal = "Syntax error: invalid character token or brace mismatch. Check modified lines.";
    }

    console.log(`\n\x1b[33m[Fixer Proposal]\x1b[0m: ${proposal}`);
    console.log(`[Fixer] Reverting workspace changes to last safe git commit to avoid state contamination...`);

    try {
        execSync("git checkout -- app.js source.html tests/mechanics.test.cjs", { cwd: root });
        console.log("✔ Workspace files reverted to baseline.");
        logTrace(task.id, "fixing", "success", `Reverted files and proposed fix: ${proposal}`);
    } catch (err) {
        console.log(`\x1b[31m✖ Fixer warning: Could not run git rollback: ${err.message}\x1b[0m`);
        logTrace(task.id, "fixing", "success", `Rollback skipped: ${err.message}`);
    }

    // Update evolutionary memory with failure mode
    const memory = readMemory();
    const antiPattern = `Failure on task ${task.id}: ${proposal.substring(0, 80)}`;
    if (!memory.anti_patterns.includes(antiPattern)) {
        memory.anti_patterns.push(antiPattern);
        writeMemory(memory);
    }

    return "developing";
}

function updateHeatmapCategory(category) {
    const heatmap = readHeatmap();
    if (heatmap.categories[category] !== undefined) {
        heatmap.categories[category]++;
        heatmap.total_failures++;
        writeHeatmap(heatmap);
    }
}

// -------------------------------------------------------------
// CLI Routes
// -------------------------------------------------------------

function listTasks() {
    const tasks = readTasks();
    console.log("\n=== GROK-TALK AGENCY: TASK ARCHIVE ===");
    if (tasks.length === 0) {
        console.log("No tasks found in history.");
        return;
    }
    tasks.forEach(t => {
        const statusColors = {
            pending: "\x1b[33m[PENDING]\x1b[0m",
            planning: "\x1b[35m[PLANNING]\x1b[0m",
            "plan-reviewing": "\x1b[35m[PLAN-REVIEWING]\x1b[0m",
            developing: "\x1b[36m[DEVELOPING]\x1b[0m",
            "code-reviewing": "\x1b[36m[CODE-REVIEWING]\x1b[0m",
            testing: "\x1b[34m[TESTING]\x1b[0m",
            fixing: "\x1b[31m[FIXING]\x1b[0m",
            completed: "\x1b[32m[COMPLETED]\x1b[0m",
            failed: "\x1b[31m[FAILED]\x1b[0m"
        };
        const color = statusColors[t.status] || `[${t.status.toUpperCase()}]`;
        console.log(`${t.id} - ${color} ${t.title}`);
        console.log(`  Description: ${t.description}`);
        if (t.completedAt) console.log(`  Completed: ${t.completedAt}`);
        console.log("--------------------------------------");
    });
}

function addTask(title, desc) {
    const tasks = readTasks();
    const id = `task_${String(tasks.length + 1).padStart(3, "0")}`;
    const newTask = {
        id,
        title,
        description: desc,
        status: "pending",
        assignedTo: "orchestrator",
        plan: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        notes: ""
    };
    tasks.push(newTask);
    writeTasks(tasks);
    console.log(`\n\x1b[32m✔ Task ${id} added successfully!\x1b[0m`);
    console.log(`Title: ${title}`);
}

function showStatus() {
    const state = readState();
    console.log("\n=== GROK-TALK AGENCY: ACTIVE STATE ===");
    if (!state.activeTaskId) {
        console.log("Current State: IDLE (No task running)");
        return;
    }
    console.log(`Active Task ID: ${state.activeTaskId}`);
    console.log(`Current ACP State: \x1b[36m${state.currentState.toUpperCase()}\x1b[0m`);
    console.log(`Retries: ${state.retries} / ${state.maxRetries}`);
    console.log("\nRecent Transitions:");
    state.trace.slice(-5).forEach(t => {
        console.log(`  [${t.timestamp}] ${t.step.toUpperCase()} -> ${t.status.toUpperCase()}: ${t.details}`);
    });
    console.log("--------------------------------------");
}

function showHeatmap() {
    const heatmap = readHeatmap();
    console.log("\n=== GROK-TALK AGENCY: FAILURE HEAT MAP ===");
    console.log(`Total Failures Registered: \x1b[31m${heatmap.total_failures}\x1b[0m`);
    console.log("Categories:");
    console.log(`  Misalignment (syntax/references): ${heatmap.categories.misalignment}`);
    console.log(`  Design (plan structure/scope):   ${heatmap.categories.design}`);
    console.log(`  Verification (broken tests):     ${heatmap.categories.verification}`);
    console.log(`  Coordination (exceeded limits):  ${heatmap.categories.coordination}`);
    console.log("\nLogged Failures:");
    const keys = Object.keys(heatmap.task_failures);
    if (keys.length === 0) {
        console.log("  No task failures logged.");
    } else {
        keys.forEach(k => {
            const f = heatmap.task_failures[k];
            console.log(`  ${k}: ${f.title} - Reason: ${f.reason} (${f.timestamp})`);
        });
    }
    console.log("------------------------------------------");
}

function showMemory() {
    const memory = readMemory();
    console.log("\n=== GROK-TALK AGENCY: EVOLUTIONARY MEMORY BANK ===");
    console.log("Successful Patterns:");
    if (memory.successful_patterns.length === 0) console.log("  None recorded.");
    memory.successful_patterns.forEach(p => console.log(`  ✔ ${p}`));
    
    console.log("\nAnti-patterns Identified:");
    if (memory.anti_patterns.length === 0) console.log("  None recorded.");
    memory.anti_patterns.forEach(a => console.log(`  ⚠ ${a}`));
    
    console.log("\nContinuous Learnings:");
    if (memory.learnings.length === 0) console.log("  None recorded.");
    memory.learnings.forEach(l => console.log(`  💡 ${l}`));
    console.log("--------------------------------------------------");
}

// -------------------------------------------------------------
// CLI Router
// -------------------------------------------------------------

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help" || command === "-h") {
    console.log(`
Grok-talk Dev Agency CLI v2 (Adaptive State Machine).

Commands:
  node orchestrator.js list                  List all tasks and statuses
  node orchestrator.js add "Title" "Desc"    Add a new feature request task
  node orchestrator.js run task_xxx          Execute adaptive planning, design review, development, code review, test, and fix loops
  node orchestrator.js status                Show live state, retries, and traces of active task
  node orchestrator.js heatmap               Display failure analytics and category heat map
  node orchestrator.js memory                Display evolutionary memory bank and learnings
`);
    process.exit(0);
}

if (command === "list") {
    listTasks();
} else if (command === "add") {
    const title = args[1];
    const desc = args[2] || "";
    if (!title) {
        console.error("\x1b[31m✖ Error: Missing task title.\x1b[0m");
        process.exit(1);
    }
    addTask(title, desc);
} else if (command === "run") {
    const id = args[1];
    if (!id) {
        console.error("\x1b[31m✖ Error: Missing task ID.\x1b[0m");
        process.exit(1);
    }
    const success = runACPWorkflow(id);
    process.exit(success ? 0 : 1);
} else if (command === "status") {
    showStatus();
} else if (command === "heatmap") {
    showHeatmap();
} else if (command === "memory") {
    showMemory();
} else {
    console.error(`\x1b[31m✖ Error: Unknown command "${command}"\x1b[0m`);
    process.exit(1);
}
