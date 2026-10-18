"use strict";

// ─────────────────────────────────────────────────────
//  RETRO SOUND SYNTHESIZER (Web Audio API)
// ─────────────────────────────────────────────────────

class SoundFx {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem("sound-muted") === "true";
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    // Механічний клік / клацання кнопок
    click() {
        if (this.muted) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
    }

    // Звук успіху / валідної команди
    success() {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.0, now + 0.08); // A5

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Звук помилки (невідома команда в CLI)
    error() {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.15);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Відкриття вікна / терміналу / модалки
    open() {
        if (this.muted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem("sound-muted", this.muted);
        return this.muted;
    }
}

const sfx = new SoundFx();
window.sfx = sfx;

// ─────────────────────────────────────────────────────
//  NAVIGATION & MODALS
// ─────────────────────────────────────────────────────

function showPage(pageId) {
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.remove("active");
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add("active");
    }

    document.querySelectorAll(".nav .nav-link, .nav a").forEach((link) => {
        link.classList.remove("active");
    });

    const activeLink = document.getElementById(`nav-${pageId}`);
    if (activeLink) {
        activeLink.classList.add("active");
    }

    if (pageId === "home") {
        history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
        );
    } else {
        history.replaceState(null, "", `#${pageId}`);
    }
}
window.showPage = showPage;

function closeStoryModal() {
    const modal = document.getElementById("story-modal");
    if (modal) {
        modal.classList.remove("active");
    }
}
window.closeStoryModal = closeStoryModal;

function appendOutput(text, type = "output") {
    const terminalBody = document.getElementById("terminal-body");
    if (!terminalBody) return;
    const line = document.createElement("div");
    line.className = `term-line ${type}`;
    line.textContent = text;
    terminalBody.appendChild(line);
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

// ─────────────────────────────────────────────────────
//  DOM INITIALIZATION
// ─────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    // 1. Звуковий клік на всі активні інтерактивні елементи
    document.addEventListener("click", (e) => {
        if (e.target.closest("button, a, .tag, .btn-project")) {
            sfx.click();
        }
    });

    // 2. Перевірка хешу в URL (наприклад: about.html#projects)
    const hash = window.location.hash.replace("#", "");
    if (hash && document.getElementById(hash)) {
        showPage(hash);
    }

    // 3. Підтримка кнопок «Назад / Вперед» у браузері
    window.addEventListener("hashchange", () => {
        const currentHash = window.location.hash.replace("#", "") || "home";
        if (document.getElementById(currentHash)) {
            showPage(currentHash);
        }
    });

    // 4. Елементи модалки історій
    const modal = document.getElementById("story-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalText = document.getElementById("modal-text");
    const modalBadge =
        document.getElementById("modal-badge") ||
        document.getElementById("modal-skill-badge");
    const modalImg = document.getElementById("modal-image");

    const clickableTags = document.querySelectorAll(".tag[data-story]");

    clickableTags.forEach((tag) => {
        tag.addEventListener("click", () => {
            if (!modal) return;

            const skillName = tag.getAttribute("data-badge") || tag.innerText.trim();
            const title = tag.getAttribute("data-title") || skillName;
            const story = tag.getAttribute("data-story") || "";
            const imgSrc = tag.getAttribute("data-image");

            if (modalBadge) modalBadge.textContent = skillName;
            if (modalTitle) modalTitle.textContent = title;
            if (modalText) modalText.textContent = story;

            if (modalImg) {
                if (imgSrc) {
                    modalImg.src = imgSrc;
                    modalImg.style.display = "block";
                } else {
                    modalImg.src = "";
                    modalImg.style.display = "none";
                }
            }

            sfx.open();
            modal.classList.add("active");
        });
    });

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeStoryModal();
        });
    }

    // 5. CLI Термінал
    const terminalModal = document.getElementById("terminal-modal");
    const terminalInput = document.getElementById("terminal-input");
    const terminalBody = document.getElementById("terminal-body");

    window.openTerminal = () => {
        if (!terminalModal) return;
        sfx.open();
        terminalModal.classList.add("active");
        if (terminalInput) terminalInput.focus();
    };

    window.closeTerminal = () => {
        if (!terminalModal) return;
        terminalModal.classList.remove("active");
    };

    if (terminalModal) {
        terminalModal.addEventListener("click", (e) => {
            if (e.target === terminalModal) window.closeTerminal();
        });
    }

    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            if (terminalModal?.classList.contains("active")) {
                window.closeTerminal();
            } else {
                window.openTerminal();
            }
        }
        if (e.key === "Escape") {
            closeStoryModal();
            if (window.closeTerminal) window.closeTerminal();
        }
    });

    if (terminalInput) {
        terminalInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const rawCommand = terminalInput.value.trim();
                const cmd = rawCommand.toLowerCase();
                terminalInput.value = "";

                if (!rawCommand) return;

                appendOutput(`user@ewsfme:~$ ${rawCommand}`, "cmd");

                switch (cmd) {
                    case "help":
                        sfx.success();
                        appendOutput(`Available commands:
  fetch           - Display system hardware & OS profile
  projects        - Navigate to Projects page
  notes           - Navigate to Notes page
  home            - Navigate to Home page
  mute            - Toggle sound effects on/off
  clear           - Clear terminal window
  exit            - Close terminal session`);
                        break;

                    case "fetch":
                        sfx.success();
                        appendOutput(`
    /\\___/\\      Class     : Code Alchemist (Lvl 19)
   ( o . o )     HP        : 100 / 100
     > ^ <       Mana      : 22 / 100
   ----------    Main Perk : Can break any UI in 3 clicks
                 Debuff    : Overthinking CSS layouts
                 Inventory : Mechanical KB, Looped Synthwave
                 Current Quest: Perfecting portfolio aesthetics`);
                        break;

                    case "projects":
                        sfx.success();
                        showPage("projects");
                        appendOutput("Navigated to Projects page.");
                        break;

                    case "notes":
                        sfx.success();
                        showPage("notes");
                        appendOutput("Navigated to Notes page.");
                        break;

                    case "home":
                        sfx.success();
                        showPage("home");
                        appendOutput("Navigated to Home page.");
                        break;

                    case "mute":
                    case "sound": {
                        const isMuted = sfx.toggleMute();
                        sfx.success();
                        appendOutput(`Audio state: ${isMuted ? "[MUTED]" : "[ACTIVE]"}`);
                        break;
                    }

                    case "clear":
                        if (terminalBody) terminalBody.innerHTML = "";
                        break;

                    case "exit":
                        window.closeTerminal();
                        break;

                    default:
                        sfx.error();
                        appendOutput(
                            `bash: command not found: ${rawCommand}. Type 'help' for options.`,
                        );
                        break;
                }
            }
        });
    }

    // ─────────────────────────────────────────────────────
    //  STREAMING TEXT ANIMATION
    // ─────────────────────────────────────────────────────

    const STREAM_SELECTORS =
        "h1, h2, h3, p, .card-header, .card-subheader, .project-category, .note-date";
    const STREAM_GAP = 25; // ms between consecutive words
    const STREAM_OVERLAP = 0.1;

    function wrapWords(el) {
        if (el.querySelector(".t-stream-w")) return;

        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        textNodes.forEach((node) => {
            const text = node.textContent;
            if (!text.trim()) return;

            const parts = text.split(/(\s+)/);
            const frag = document.createDocumentFragment();

            parts.forEach((part) => {
                if (!part) return;
                if (/^\s+$/.test(part)) {
                    frag.appendChild(document.createTextNode(part));
                } else {
                    const span = document.createElement("span");
                    span.className = "t-stream-w";
                    span.textContent = part;
                    frag.appendChild(span);
                }
            });

            node.parentNode.replaceChild(frag, node);
        });
    }

    function streamElement(el) {
        const words = el.querySelectorAll(".t-stream-w");
        if (!words.length) return;

        words.forEach((w) => {
            w.style.transition = "none";
            w.classList.remove("is-in");
        });
        void el.offsetHeight; // reflow
        words.forEach((w) => {
            w.style.transition = "";
        });

        words.forEach((w, i) => {
            setTimeout(() => w.classList.add("is-in"), i * STREAM_GAP);
        });
    }

    // 1. Обгортаємо слова
    document.querySelectorAll(".page").forEach((page) => {
        page.querySelectorAll(STREAM_SELECTORS).forEach(wrapWords);
    });

    // 2. IntersectionObserver для появи слів
    const streamObserver = new IntersectionObserver(
        (entries) => {
            const fresh = entries
                .filter((e) => e.isIntersecting && !e.target.dataset.streamed)
                .sort((a, b) => {
                    const pos = a.target.compareDocumentPosition(b.target);
                    return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
                });

            let delay = 0;
            fresh.forEach((entry) => {
                entry.target.dataset.streamed = "1";
                const count = entry.target.querySelectorAll(".t-stream-w").length;
                setTimeout(() => streamElement(entry.target), delay);
                delay += Math.min(count * STREAM_GAP * STREAM_OVERLAP, 300);
            });
        },
        { threshold: 0.1 },
    );

    document.querySelectorAll(".page").forEach((page) => {
        page.querySelectorAll(STREAM_SELECTORS).forEach((el) => {
            streamObserver.observe(el);
        });
    });

    // 3. Перевизначення showPage для перезапуску стрімінгу тексту
    const _origShowPage = window.showPage;
    window.showPage = (pageId) => {
        _origShowPage(pageId);

        const page = document.getElementById(pageId);
        if (!page) return;

        page.querySelectorAll(STREAM_SELECTORS).forEach((el) => {
            delete el.dataset.streamed;
            el.querySelectorAll(".t-stream-w").forEach((w) => {
                w.classList.remove("is-in");
            });
            streamObserver.unobserve(el);
            streamObserver.observe(el);
        });
    };
});