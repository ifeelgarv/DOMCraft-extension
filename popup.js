document.addEventListener("DOMContentLoaded", () => {
    const commandInput = document.getElementById("commandInput");
    const applyButton = document.getElementById("applyButton");
    const resetButton = document.getElementById("resetButton");
    const statusMessage = document.getElementById("statusMessage");
    const statusText = document.getElementById("statusText");
    const loader = document.querySelector(".loader");
    const commandButtons = document.querySelectorAll(".command-btn");

    commandButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            commandInput.value = btn.dataset.command;
            commandInput.focus();
        });
    });

    resetButton.addEventListener("click", () => {
        executeCommand("reset page");
    });

    applyButton.addEventListener("click", () => {
        const commandText = commandInput.value.trim();
        if (!commandText) {
            showStatus("Please enter a command.", "error");
            return;
        }
        executeCommand(commandText);
    });

    function executeCommand(commandText) {
        showLoading();
        const instruction = parseCommand(commandText);

        if (!instruction) {
            showStatus('Command not recognized. Try "change background to blue" or "increase font size"', "error");
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                showStatus("Error accessing current tab: " + chrome.runtime.lastError.message, "error");
                return;
            }

            if (tabs && tabs.length > 0) {
                const tabId = tabs[0].id;
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: pageModifierFunction,
                    args: [instruction],
                }, (results) => {
                    if (chrome.runtime.lastError) {
                        showStatus("Error applying changes: " + chrome.runtime.lastError.message, "error");
                    } else if (results && results[0] && results[0].result && results[0].result.error) {
                        showStatus("Error during page modification: " + results[0].result.error, "error");
                    } else {
                        showStatus("Changes applied successfully!", "success");
                    }
                });
            } else {
                showStatus("No active tab found to apply changes.", "error");
            }
        });
    }

    function showLoading() {
        statusMessage.classList.remove("hidden", "success", "error");
        loader.classList.remove("hidden");
        statusText.textContent = "Applying changes...";
    }

    function showStatus(message, type) {
        statusMessage.classList.remove("hidden");
        loader.classList.add("hidden");
        statusMessage.classList.remove("success", "error");

        if (type === "success") {
            statusMessage.classList.add("success");
        } else if (type === "error") {
            statusMessage.classList.add("error");
        }

        statusText.textContent = message;

        if (type === "success") {
            setTimeout(() => {
                statusMessage.classList.add("hidden");
            }, 3000);
        }
    }
});

function parseCommand(commandText) {
    const lowerCmd = commandText.toLowerCase();

    const colorMappings = {
        red: "red", blue: "blue", "light blue": "lightblue", "dark blue": "darkblue",
        green: "green", "light green": "lightgreen", "dark green": "darkgreen",
        yellow: "yellow", black: "black", white: "white", purple: "purple",
        orange: "orange", pink: "pink", brown: "brown", gray: "gray", grey: "gray",
        "light gray": "lightgray", "dark gray": "darkgray", cyan: "cyan",
        magenta: "magenta", silver: "silver", gold: "gold", beige: "beige"
    };

    if (/reset|reload|refresh|restore|revert|clear/i.test(lowerCmd)) {
        return { action: "RELOAD_PAGE" };
    }

    const fontSizeMatch = lowerCmd.match(/font\s+size\s+(\d+)\s*px/i) || lowerCmd.match(/set\s+font\s+size\s+to\s+(\d+)/i);
    if (fontSizeMatch && fontSizeMatch[1]) {
        return {
            action: "SET_STYLE",
            selector: "body *",
            property: "fontSize",
            value: fontSizeMatch[1] + "px",
        };
    }

    if (/increase|bigger|larger|grow|enlarge/i.test(lowerCmd) && /font|text|size/i.test(lowerCmd)) {
        return { action: "INCREASE_FONT_SIZE", selector: "body *", increment: 2 };
    }

    if (/decrease|smaller|reduce|shrink/i.test(lowerCmd) && /font|text|size/i.test(lowerCmd)) {
        return { action: "DECREASE_FONT_SIZE", selector: "body *", decrement: 2 };
    }

    if (/background|bg/i.test(lowerCmd)) {
        for (const [colorName, colorValue] of Object.entries(colorMappings)) {
            if (lowerCmd.includes(colorName)) {
                return {
                    action: "SET_STYLE",
                    selector: "html, body",
                    property: "backgroundColor",
                    value: colorValue,
                    important: true,
                    clearModes: true
                };
            }
        }
    }

    if (/text color|font color|color text|color font/i.test(lowerCmd)) {
        for (const [colorName, colorValue] of Object.entries(colorMappings)) {
            if (lowerCmd.includes(colorName)) {
                return {
                    action: "SET_STYLE",
                    selector: "body, body *",
                    property: "color",
                    value: colorValue,
                    important: true,
                    clearModes: true
                };
            }
        }
    }

    if (/hide|remove|disable/i.test(lowerCmd) && /image|img|picture|photo/i.test(lowerCmd)) {
        return {
            action: "SET_STYLE",
            selector: 'img, picture, svg, [role="img"]',
            property: "display",
            value: "none",
        };
    }

    if (/show|display|enable|unhide/i.test(lowerCmd) && /image|img|picture|photo/i.test(lowerCmd)) {
        return {
            action: "SET_STYLE",
            selector: 'img, picture, svg, [role="img"]',
            property: "display",
            value: "inline-block",
        };
    }

    if (/high contrast|contrast mode|increase contrast/i.test(lowerCmd)) {
        return { action: "HIGH_CONTRAST" };
    }

    if (/dark mode|night mode|dark theme/i.test(lowerCmd)) {
        return { action: "DARK_MODE" };
    }

    if (/light mode|day mode|light theme/i.test(lowerCmd)) {
        return { action: "LIGHT_MODE" };
    }

    return null;
}

function pageModifierFunction(instruction) {
    function removeModeStyles() {
        const styleIds = ["webmodifier-high-contrast", "webmodifier-dark-mode", "webmodifier-light-mode", "webmodifier-custom-style"];
        styleIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        document.documentElement.style.backgroundColor = "";
        document.documentElement.style.color = "";
        document.body.style.backgroundColor = "";
        document.body.style.color = "";
    }

    function applyStyle(selector, property, value, important = false) {
        try {
            if (important) {
                const styleId = "webmodifier-custom-style";
                let styleEl = document.getElementById(styleId);
                if (!styleEl) {
                    styleEl = document.createElement("style");
                    styleEl.id = styleId;
                    document.head.appendChild(styleEl);
                }

                let newContent = "";
                if (property === "backgroundColor") {
                    newContent = `${selector} { background-color: ${value} !important; }`;
                    newContent += `\n${selector} { color: initial !important; }`;
                } else if (property === "color") {
                    newContent = `${selector} { color: ${value} !important; }`;
                    newContent += `\n${selector} { background-color: initial !important; }`;
                } else {
                    newContent = `${selector} { ${property}: ${value} !important; }`;
                }
                styleEl.textContent = newContent;
            } else {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    el.style[property] = value;
                });
            }
            return { success: true, message: "Applied style to selected elements" };
        } catch (error) {
            return { error: `Failed to apply style: ${error.message}` };
        }
    }

    try {
        if (instruction.action === "SET_STYLE" && (instruction.property === "backgroundColor" || instruction.property === "color")) {
            removeModeStyles();
        } else if (["HIGH_CONTRAST", "DARK_MODE", "LIGHT_MODE"].includes(instruction.action)) {
            removeModeStyles();
        }

        switch (instruction.action) {
            case "SET_STYLE":
                return applyStyle(instruction.selector, instruction.property, instruction.value, instruction.important);

            case "INCREASE_FONT_SIZE":
                return modifyFontSize(instruction.selector, instruction.increment);

            case "DECREASE_FONT_SIZE":
                return modifyFontSize(instruction.selector, -instruction.decrement);

            case "HIGH_CONTRAST":
                return highContrastMode();

            case "DARK_MODE":
                return darkMode();

            case "LIGHT_MODE":
                return lightMode();

            case "RELOAD_PAGE":
                window.location.reload();
                return { success: true, message: "Page reloaded" };

            default:
                return { error: "Unknown action: " + instruction.action };
        }
    } catch (error) {
        return { error: error.message };
    }

    function modifyFontSize(selector, change) {
        try {
            const elements = document.querySelectorAll(selector);
            if (elements.length === 0) {
                return { success: false, message: "No text elements found to modify font size" };
            }

            let successCount = 0;
            elements.forEach(el => {
                try {
                    const style = window.getComputedStyle(el);
                    const currentSize = parseFloat(style.fontSize);
                    if (!isNaN(currentSize)) {
                        let newSize = Math.max(currentSize + change, 8);
                        el.style.fontSize = newSize + "px";
                        successCount++;
                    }
                } catch (e) {
                    console.error("Error modifying font size for element:", el, e);
                }
            });

            return { success: true, message: `Modified font size for ${successCount} elements` };
        } catch (error) {
            return { error: `Failed to modify font size: ${error.message}` };
        }
    }

    function highContrastMode() {
        const styleEl = document.createElement("style");
        styleEl.id = "webmodifier-high-contrast";
        styleEl.textContent = `
            html, body { background-color: white !important; color: black !important; }
            * { background-color: white !important; color: black !important; border-color: black !important; }
            a { color: #0000EE !important; text-decoration: underline !important; }
            a:visited { color: #551A8B !important; }
            img, svg, video { filter: contrast(1.2) !important; }
            button, input, select, textarea { border: 1px solid black !important; }
        `;
        document.head.appendChild(styleEl);
        return { success: true, message: "High contrast mode applied" };
    }

    function darkMode() {
        const styleEl = document.createElement("style");
        styleEl.id = "webmodifier-dark-mode";
        styleEl.textContent = `
            html, body { background-color: #1a1a2e !important; color: #e0e0e0 !important; }
            * { color: #e0e0e0 !important; background-color: #1a1a2e !important; border-color: #333 !important; }
            a { color: #a78eff !important; }
            a:visited { color: #ff99ff !important; }
            h1, h2, h3, h4, h5, h6 { color: #ffffff !important; }
            input, textarea, select, button { background-color: #2c2c4d !important; color: #e0e0e0 !important; border: 1px solid #444466 !important; }
            img, video, canvas { filter: brightness(0.7) contrast(1.1) !important; }
        `;
        document.head.appendChild(styleEl);
        return { success: true, message: "Dark mode applied" };
    }

    function lightMode() {
        const styleEl = document.createElement("style");
        styleEl.id = "webmodifier-light-mode";
        styleEl.textContent = `
            html, body { background-color: initial !important; color: initial !important; }
            * { background-color: initial !important; color: initial !important; border-color: initial !important; filter: initial !important; }
        `;
        document.head.appendChild(styleEl);
        return { success: true, message: "Light mode applied" };
    }
}