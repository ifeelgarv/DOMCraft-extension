document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const commandInput = document.getElementById('commandInput');
    const applyButton = document.getElementById('applyButton');
    const resetButton = document.getElementById('resetButton');
    const statusMessage = document.getElementById('statusMessage');
    const statusText = document.getElementById('statusText');
    const loader = document.querySelector('.loader');
    const exampleButtons = document.querySelectorAll('.example-btn');
    
    // Add event listeners for example command buttons
    exampleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            commandInput.value = btn.dataset.command;
            commandInput.focus();
        });
    });
    
    // Reset button handler
    resetButton.addEventListener('click', () => {
        executeCommand('reset page');
    });
    
    // Apply button handler
    applyButton.addEventListener('click', () => {
        const commandText = commandInput.value.trim();
        
        if (!commandText) {
            showStatus('Please enter a command.', 'error');
            return;
        }
        
        executeCommand(commandText);
    });
    
    // Main function to execute commands
    function executeCommand(commandText) {
        console.log('Executing command:', commandText);
        
        // Show loading state
        showLoading();
        
        // Parse the command
        const instruction = parseCommand(commandText);
        console.log('Parsed instruction:', instruction);
        
        if (!instruction) {
            showStatus('Command not recognized. Try something like "change background to blue" or "increase font size"', 'error');
            return;
        }
        
        // Execute the command on the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                console.error('Error querying tabs:', chrome.runtime.lastError.message);
                showStatus('Error accessing current tab: ' + chrome.runtime.lastError.message, 'error');
                return;
            }
            
            if (tabs && tabs.length > 0) {
                const tabId = tabs[0].id;
                
                if (tabId === undefined || tabId === null) {
                    console.error('Error: Active tab ID is invalid.');
                    showStatus('Error: Could not identify the active tab.', 'error');
                    return;
                }
                
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: pageModifierFunction,
                    args: [instruction]
                }, (results) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error executing script:', chrome.runtime.lastError.message);
                        showStatus('Error applying changes: ' + chrome.runtime.lastError.message, 'error');
                    } else if (results && results[0] && results[0].result && results[0].result.error) {
                        console.error('Error from injected script:', results[0].result.error);
                        showStatus('Error during page modification: ' + results[0].result.error, 'error');
                    } else {
                        console.log('Script executed successfully, results:', results);
                        showStatus('Changes applied successfully!', 'success');
                    }
                });
            } else {
                console.warn('No active tab found.');
                showStatus('No active tab found to apply changes.', 'error');
            }
        });
    }
    
    // Helper functions for UI feedback
    function showLoading() {
        statusMessage.classList.remove('hidden', 'success', 'error');
        loader.classList.remove('hidden');
        statusText.textContent = 'Applying changes...';
    }
    
    function showStatus(message, type) {
        statusMessage.classList.remove('hidden');
        loader.classList.add('hidden');
        
        if (type === 'success') {
            statusMessage.classList.add('success');
            statusMessage.classList.remove('error');
        } else if (type === 'error') {
            statusMessage.classList.add('error');
            statusMessage.classList.remove('success');
        } else {
            statusMessage.classList.remove('success', 'error');
        }
        
        statusText.textContent = message;
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.classList.add('hidden');
            }, 3000);
        }
    }
});

function parseCommand(commandText) {
    console.log('Parsing command:', commandText);
    const lowerCmd = commandText.toLowerCase();
    
    // Define color variations - include more synonyms for better recognition
    const colorMappings = {
        'red': 'red',
        'blue': 'blue',
        'light blue': 'lightblue',
        'dark blue': 'darkblue',
        'green': 'green',
        'light green': 'lightgreen',
        'dark green': 'darkgreen',
        'yellow': 'yellow',
        'black': 'black',
        'white': 'white',
        'purple': 'purple',
        'orange': 'orange',
        'pink': 'pink',
        'brown': 'brown',
        'gray': 'gray',
        'grey': 'gray',
        'light gray': 'lightgray',
        'light grey': 'lightgray',
        'dark gray': 'darkgray',
        'dark grey': 'darkgray',
        'cyan': 'cyan',
        'magenta': 'magenta',
        'silver': 'silver',
        'gold': 'gold',
        'beige': 'beige',
        'mint': 'mintcream',
        'lavender': 'lavender',
        'sky blue': 'skyblue',
        'navy': 'navy',
        'teal': 'teal',
        'olive': 'olive',
        'maroon': 'maroon',
        'cream': 'cornsilk'
    };
    
    // Reset Page / Reload
    if (/reset|reload|refresh|restore|revert|clear/i.test(lowerCmd)) {
        console.log('Parsed as RELOAD_PAGE');
        return { action: 'RELOAD_PAGE' };
    }
    
    // Change Font Size (Absolute)
    const fontSizeMatch = lowerCmd.match(/font\s+size\s+(\d+)\s*px/i) || lowerCmd.match(/set\s+font\s+size\s+to\s+(\d+)/i);
    if (fontSizeMatch && fontSizeMatch[1]) {
        const size = fontSizeMatch[1] + 'px';
        console.log('Parsed as SET_FONT_SIZE:', size);
        return { 
            action: 'SET_STYLE', 
            selector: 'body *', 
            property: 'fontSize', 
            value: size 
        };
    }
    
    // Increase Font Size
    if (/increase|bigger|larger|grow|enlarge/i.test(lowerCmd) && /font|text|size/i.test(lowerCmd)) {
        console.log('Parsed as INCREASE_FONT_SIZE');
        return { 
            action: 'INCREASE_FONT_SIZE', 
            selector: 'body *', 
            increment: 2 
        };
    }
    
    // Decrease Font Size
    if (/decrease|smaller|reduce|shrink/i.test(lowerCmd) && /font|text|size/i.test(lowerCmd)) {
        console.log('Parsed as DECREASE_FONT_SIZE');
        return { 
            action: 'DECREASE_FONT_SIZE', 
            selector: 'body *', 
            decrement: 2 
        };
    }
    
    // Change Background Color
    if (/background|bg/i.test(lowerCmd)) {
        for (const [colorName, colorValue] of Object.entries(colorMappings)) {
            if (lowerCmd.includes(colorName)) {
                console.log('Parsed as SET_BACKGROUND_COLOR:', colorValue);
                return { 
                    action: 'SET_STYLE', 
                    selector: 'body', 
                    property: 'backgroundColor', 
                    value: colorValue 
                };
            }
        }
    }
    
    // Change Text Color
    if (/text color|font color|color text|color font/i.test(lowerCmd)) {
        for (const [colorName, colorValue] of Object.entries(colorMappings)) {
            if (lowerCmd.includes(colorName)) {
                console.log('Parsed as SET_TEXT_COLOR:', colorValue);
                return { 
                    action: 'SET_STYLE', 
                    selector: 'body, body *', 
                    property: 'color', 
                    value: colorValue 
                };
            }
        }
    }
    
    // Hide Images
    if (/hide|remove|disable/i.test(lowerCmd) && /image|img|picture|photo/i.test(lowerCmd)) {
        console.log('Parsed as HIDE_IMAGES');
        return { 
            action: 'SET_STYLE', 
            selector: 'img, picture, svg, [role="img"]', 
            property: 'display', 
            value: 'none' 
        };
    }
    
    // Show Images
    if (/show|display|enable|unhide/i.test(lowerCmd) && /image|img|picture|photo/i.test(lowerCmd)) {
        console.log('Parsed as SHOW_IMAGES');
        return { 
            action: 'SET_STYLE', 
            selector: 'img, picture, svg, [role="img"]', 
            property: 'display', 
            value: 'inline-block' 
        };
    }
    
    // Change Line Height / Spacing
    if (/line height|line spacing|spacing between lines/i.test(lowerCmd)) {
        if (/increase|bigger|larger|more/i.test(lowerCmd)) {
            console.log('Parsed as INCREASE_LINE_HEIGHT');
            return { 
                action: 'INCREASE_LINE_HEIGHT', 
                selector: 'p, div, span, li, h1, h2, h3, h4, h5, h6', 
                value: 1.5 
            };
        } else if (/decrease|smaller|less|reduce/i.test(lowerCmd)) {
            console.log('Parsed as DECREASE_LINE_HEIGHT');
            return { 
                action: 'DECREASE_LINE_HEIGHT', 
                selector: 'p, div, span, li, h1, h2, h3, h4, h5, h6', 
                value: 1.2 
            };
        }
    }
    
    // Make Page High Contrast
    if (/high contrast|contrast mode|increase contrast/i.test(lowerCmd)) {
        console.log('Parsed as HIGH_CONTRAST');
        return { 
            action: 'HIGH_CONTRAST' 
        };
    }
    
    // Dark Mode
    if (/dark mode|night mode|dark theme/i.test(lowerCmd)) {
        console.log('Parsed as DARK_MODE');
        return { 
            action: 'DARK_MODE' 
        };
    }
    
    // Light Mode
    if (/light mode|day mode|light theme/i.test(lowerCmd)) {
        console.log('Parsed as LIGHT_MODE');
        return { 
            action: 'LIGHT_MODE' 
        };
    }
    
    console.log('Command not recognized by parser');
    return null;
}

function pageModifierFunction(instruction) {
    console.log('pageModifierFunction executing with instruction:', instruction);
    try {
        switch (instruction.action) {
            case 'SET_STYLE':
                console.log(`Executing SET_STYLE: selector='${instruction.selector}', property='${instruction.property}', value='${instruction.value}'`);
                return applyStyle(instruction.selector, instruction.property, instruction.value);
            
            case 'INCREASE_FONT_SIZE':
                console.log(`Executing INCREASE_FONT_SIZE: selector='${instruction.selector}', amount=${instruction.increment}`);
                return modifyFontSize(instruction.selector, instruction.increment);
            
            case 'DECREASE_FONT_SIZE':
                console.log(`Executing DECREASE_FONT_SIZE: selector='${instruction.selector}', amount=-${instruction.decrement}`);
                return modifyFontSize(instruction.selector, -instruction.decrement);
            
            case 'INCREASE_LINE_HEIGHT':
                console.log(`Executing INCREASE_LINE_HEIGHT: selector='${instruction.selector}', value=${instruction.value}`);
                return applyStyle(instruction.selector, 'lineHeight', instruction.value);
            
            case 'DECREASE_LINE_HEIGHT':
                console.log(`Executing DECREASE_LINE_HEIGHT: selector='${instruction.selector}', value=${instruction.value}`);
                return applyStyle(instruction.selector, 'lineHeight', instruction.value);
            
            case 'HIGH_CONTRAST':
                console.log('Executing HIGH_CONTRAST');
                return highContrastMode();
            
            case 'DARK_MODE':
                console.log('Executing DARK_MODE');
                return darkMode();
            
            case 'LIGHT_MODE':
                console.log('Executing LIGHT_MODE');
                return lightMode();
            
            case 'RELOAD_PAGE':
                console.log('Executing RELOAD_PAGE');
                window.location.reload();
                return { success: true, message: 'Page reloaded' };
            
            default:
                console.warn('Unknown action in pageModifierFunction:', instruction.action);
                return { error: 'Unknown action: ' + instruction.action };
        }
    } catch (error) {
        console.error('Error in pageModifierFunction:', error);
        return { error: error.message };
    }
    
    // Helper function to apply styles to elements
    function applyStyle(selector, property, value) {
        try {
            const elements = document.querySelectorAll(selector);
            console.log(`Found ${elements.length} elements matching selector: ${selector}`);
            
            if (elements.length === 0) {
                console.warn(`No elements found for selector: ${selector}`);
                // Don't return error, some pages might not have images, etc.
            }
            
            let successCount = 0;
            elements.forEach(el => {
                try {
                    el.style[property] = value;
                    successCount++;
                } catch (e) {
                    console.error('Error applying style to element:', el, e);
                }
            });
            
            return { 
                success: true, 
                message: `Applied style to ${successCount} elements` 
            };
        } catch (error) {
            console.error('Error in applyStyle:', error);
            return { error: `Failed to apply style: ${error.message}` };
        }
    }
    
    // Helper function to modify font size
    function modifyFontSize(selector, change) {
        try {
            const elements = document.querySelectorAll(selector);
            console.log(`Found ${elements.length} elements matching selector: ${selector}`);
            
            if (elements.length === 0) {
                console.warn(`No elements found for selector: ${selector}`);
                return { 
                    success: false, 
                    message: 'No text elements found to modify font size' 
                };
            }
            
            let successCount = 0;
            elements.forEach(el => {
                try {
                    // Get computed style
                    const style = window.getComputedStyle(el);
                    const currentSize = parseFloat(style.fontSize);
                    
                    if (!isNaN(currentSize)) {
                        // Apply minimum font size constraints
                        let newSize = Math.max(currentSize + change, 8);
                        el.style.fontSize = newSize + 'px';
                        successCount++;
                    }
                } catch (e) {
                    console.error('Error modifying font size for element:', el, e);
                }
            });
            
            return { 
                success: true, 
                message: `Modified font size for ${successCount} elements` 
            };
        } catch (error) {
            console.error('Error in modifyFontSize:', error);
            return { error: `Failed to modify font size: ${error.message}` };
        }
    }
    
    // High contrast mode implementation
    function highContrastMode() {
        try {
            // Set body background to white and text to black
            document.body.style.backgroundColor = '#FFFFFF';
            
            // Add CSS for high contrast
            const styleEl = document.createElement('style');
            styleEl.id = 'webmodifier-high-contrast';
            styleEl.textContent = `
                * {
                    background-color: white !important;
                    color: black !important;
                    border-color: black !important;
                }
                a {
                    color: #0000EE !important;
                    text-decoration: underline !important;
                }
                a:visited {
                    color: #551A8B !important;
                }
                img, svg, video {
                    filter: contrast(1.2) !important;
                }
                button, input, select, textarea {
                    border: 1px solid black !important;
                }
            `;
            
            // Remove existing high contrast style if any
            const existingStyle = document.getElementById('webmodifier-high-contrast');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            document.head.appendChild(styleEl);
            return { 
                success: true, 
                message: 'High contrast mode applied' 
            };
        } catch (error) {
            console.error('Error in highContrastMode:', error);
            return { error: `Failed to apply high contrast mode: ${error.message}` };
        }
    }
    
    // Dark mode implementation
    function darkMode() {
        try {
            // Create or update dark mode style
            const styleEl = document.createElement('style');
            styleEl.id = 'webmodifier-dark-mode';
            styleEl.textContent = `
                html, body {
                    background-color: #121212 !important;
                    color: #E0E0E0 !important;
                }
                * {
                    color: #E0E0E0;
                    background-color: #121212;
                }
                a {
                    color: #8AB4F8 !important;
                }
                a:visited {
                    color: #C58AF9 !important;
                }
                h1, h2, h3, h4, h5, h6 {
                    color: #FFFFFF !important;
                }
                input, textarea, select, button {
                    background-color: #333333 !important;
                    color: #E0E0E0 !important;
                    border: 1px solid #555555 !important;
                }
                img, video, canvas {
                    filter: brightness(0.8) contrast(1.2) !important;
                }
            `;
            
            // Remove existing dark mode style if any
            const existingStyle = document.getElementById('webmodifier-dark-mode');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            document.head.appendChild(styleEl);
            return { 
                success: true, 
                message: 'Dark mode applied' 
            };
        } catch (error) {
            console.error('Error in darkMode:', error);
            return { error: `Failed to apply dark mode: ${error.message}` };
        }
    }
    
    // Light mode implementation
    function lightMode() {
        try {
            // Remove dark mode style if present
            const darkModeStyle = document.getElementById('webmodifier-dark-mode');
            if (darkModeStyle) {
                darkModeStyle.remove();
            }
            
            const highContrastStyle = document.getElementById('webmodifier-high-contrast');
            if (highContrastStyle) {
                highContrastStyle.remove();
            }
            
            // Set basic light mode styles
            document.body.style.backgroundColor = '#FFFFFF';
            document.body.style.color = '#333333';
            
            return { 
                success: true, 
                message: 'Light mode applied' 
            };
        } catch (error) {
            console.error('Error in lightMode:', error);
            return { error: `Failed to apply light mode: ${error.message}` };
        }
    }
}