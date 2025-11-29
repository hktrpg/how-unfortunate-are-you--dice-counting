/**
 * Constants for the module
 */
const MODULE_ID = "how-unfortunate-are-you--dice-counting";
const SETTING_KEY = "rollStats";
const JOURNAL_NAME = "HKTRPG's Dice Counting"; // Must match your old Journal Name exactly

/**
 * Default Data Structure
 */
const DEFAULT_STATS = {
    D4: { times: 0, sum: 0, max: 0, min: 0, last: [] },
    D6: { times: 0, sum: 0, max: 0, min: 0, last: [] },
    D8: { times: 0, sum: 0, max: 0, min: 0, last: [] },
    D10: { times: 0, sum: 0, max: 0, min: 0, last: [] },
    D12: { times: 0, sum: 0, max: 0, min: 0, last: [] },
    D20: { times: 0, sum: 0, max: 0, min: 0, last: [] },
    D100: { times: 0, sum: 0, max: 0, min: 0, last: [] }
};

Hooks.once("init", () => {
    // Register the setting to store data
    game.settings.register(MODULE_ID, SETTING_KEY, {
        name: "Dice Stats",
        scope: "world",
        config: false,
        type: Object,
        default: DEFAULT_STATS
    });
});

Hooks.once("ready", async () => {
    console.log(`${MODULE_ID} | Initializing`);
    
    // 1. Check/Create Journal
    await DiceStatsManager.ensureJournalExists();

    // 2. Attempt Migration (If old HTML exists but Settings are empty)
    await DiceStatsManager.migrate();
});

Hooks.on("createChatMessage", (message) => {
    if (!message.isRoll || !game.users.activeGM?.isSelf) return;
    DiceStatsManager.processRoll(message);
});

class DiceStatsManager {
    
    // =========================================================
    //  MIGRATION LOGIC
    // =========================================================

    static async migrate() {
        // Get current settings
        const currentSettings = game.settings.get(MODULE_ID, SETTING_KEY);

        // Check if settings are "empty" (all times == 0)
        const isSettingsEmpty = Object.values(currentSettings).every(d => d.times === 0);
        
        if (!isSettingsEmpty) return; // Data already exists, no need to migrate.

        const journal = game.journal.getName(JOURNAL_NAME);
        if (!journal) return; // No old journal to migrate from.

        console.log(`${MODULE_ID} | Detecting old data... attempting migration.`);
        
        // Get the content from the first page
        const page = journal.pages.contents[0];
        const htmlContent = page?.text?.content;

        if (!htmlContent) return;

        // Parse the old HTML
        const oldData = this.parseOldHtml(htmlContent);

        if (oldData) {
            // Merge old data into the new structure
            // Note: Old data stored 'mean', we need 'sum' for the new logic.
            // Approximation: sum = mean * times
            const newStats = foundry.utils.deepClone(DEFAULT_STATS);

            for (const [key, stat] of Object.entries(oldData)) {
                if (newStats[key]) {
                    newStats[key].times = stat.times || 0;
                    newStats[key].max = stat.max || 0;
                    newStats[key].min = stat.min || 0;
                    newStats[key].last = stat.last || [];
                    
                    // Reverse calculate Sum from Mean to maintain accuracy
                    newStats[key].sum = (stat.mean || 0) * (stat.times || 0);
                }
            }

            // Save to Settings
            await game.settings.set(MODULE_ID, SETTING_KEY, newStats);
            console.log(`${MODULE_ID} | Migration Successful!`);
            
            // Re-render the journal in the new format immediately
            await this.renderJournal(newStats);
        }
    }

    /**
     * Adapted from your original 'readHtmlCode' in index.js
     * Parses the HTML string to extract data.
     */
    static parseOldHtml(htmlString) {
        const result = {};
        
        // Regex to find blocks: <h2><a id="D6"></a>D6</h2> ... content ...
        const blockRegex = /<h2.*?id="(.*?)".*?<\/p>/sg;
        const blocks = htmlString.matchAll(blockRegex);

        for (const block of blocks) {
            const id = block[1]; // e.g., "D6"
            const content = block[0];
            result[id] = this._parseBlockData(content);
        }
        
        return Object.keys(result).length > 0 ? result : null;
    }

    static _parseBlockData(content) {
        const data = {};
        // Regex to find rows: <strong id="times">...:</strong> 123<br>
        const rowRegex = /<strong id="(.*)">.+?:<\/strong>\s*((?:\d?\.?\d?,?\s*)+)\s?(?:<br\s?\/?>|<\/p>)/g;
        const rows = content.matchAll(rowRegex);

        for (const row of rows) {
            const key = row[1].trim(); // times, mean, etc.
            let value = row[2];

            if (key === 'last') {
                // Convert "1, 2, 3" string to array
                value = value.includes(',') ? value.split(",").map(x => Number(x.trim())).filter(n => !isNaN(n)) : [];
            } else {
                value = Number(value);
            }
            data[key] = value;
        }
        return data;
    }

    // =========================================================
    //  CORE LOGIC
    // =========================================================

    static async processRoll(message) {
        const currentStats = foundry.utils.deepClone(game.settings.get(MODULE_ID, SETTING_KEY));
        let changed = false;

        for (const term of message.rolls[0].terms) {
            if (term instanceof Die || term.class === "Die") {
                const key = `D${term.faces}`;
                if (currentStats[key]) {
                    for (const result of term.results) {
                        if (!result.active) continue;
                        this._updateStatEntry(currentStats[key], term.faces, result.result);
                        changed = true;
                    }
                }
            }
        }

        if (changed) {
            await game.settings.set(MODULE_ID, SETTING_KEY, currentStats);
            await this.renderJournal(currentStats);
        }
    }

    static _updateStatEntry(data, faces, result) {
        data.times++;
        data.sum += result;
        if (result === faces) data.max++;
        if (result === 1) data.min++;
        data.last.push(result);
        if (data.last.length > 30) data.last.shift();
    }

    static async renderJournal(stats) {
        const entry = game.journal.getName(JOURNAL_NAME);
        if (!entry) return;

        let content = `<h1><strong>${game.i18n.localize("name")}</strong></h1>`;

        for (const [key, data] of Object.entries(stats)) {
            const mean = data.times > 0 ? (data.sum / data.times).toFixed(2) : 0;
            // Join array for display
            const lastStr = data.last.join(', ');

            content += `
            <h2><a id="${key}"></a>${key}</h2>
            <p>
                <strong id="times">${game.i18n.localize("times")}:</strong> ${data.times}<br>
                <strong id="mean">${game.i18n.localize("mean")}:</strong> ${mean}<br>
                <strong id="max">${game.i18n.localize("max")}:</strong> ${data.max}<br>
                <strong id="min">${game.i18n.localize("min")}:</strong> ${data.min}<br>
                <strong id="last">${game.i18n.localize("last")}:</strong> ${lastStr}
            </p>
            <hr>`;
        }

        const page = entry.pages.contents[0];
        if (page) {
            await page.update({ "text.content": content });
        }
    }

    static async ensureJournalExists() {
        let entry = game.journal.getName(JOURNAL_NAME);
        if (!entry) {
            // Create Journal with specific permissions
            entry = await JournalEntry.create({ 
                name: JOURNAL_NAME,
                ownership: { 
                    default: 2 // OBSERVER (Visible to all players)
                } 
            });
            await entry.createEmbeddedDocuments("JournalEntryPage", [{
                name: "Statistics",
                type: "text",
                text: { content: "Initializing..." }
            }]);
        }
    }
}