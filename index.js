const entryName = "HKTRPG's Dice Counting";
const diceCounting = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'];
const specialDiceing = [{
    name: 'COC D100',
    face: 100,
    _formula: "1dt + 1d10",
    get: '_total'
}]
Hooks.once("ready", async () => {
    console.log("How unfortunate are you? DiceCounting 1.0| Initializing");
    await DiceRoller.checkEntryExist();
});

/**
 * https://foundryvtt.wiki/en/development/api/settings
 * 
 * => Create Folder in Journal
 * 
 * 
 * 
 * renderChatMessage 
 * [0]
 * rolls
 * [0]
 * _formula = "1dt + 1d10"
 * total = XX    !!!!
 * 
 * 
 * +1   ->  "1dt + 1dt + 1d10"
 * +2   -> 1dt + 1dt + 1dt + 1d10
 * 
 * 
 * "1dt + 1dt + 1dt + 1d10"
 * 
 * 
 * _formula ="1d100"
 * total: 53
 * 
 * 
 * _formula ="1d20"
 * total
 * 
 * 
 * 
 * rolls
 * [0]
 * dice []
 * faces ==20 
 * 
 * results.results
 */


Hooks.on('createChatMessage', (chatMessage) => {
    if ((!chatMessage.isRoll) ||
        //   (game.view != "stream" && (!game.dice3d || game.dice3d.messageHookDisabled)) ||
        (chatMessage.getFlag("core", "RollTable"))) {
        return;
    }

    //const premisson = game.settings.get('core', 'permissions').JOURNAL_CREATE;
    //const recondUser = game.users.find(user => (premisson.indexOf(user.role) > -1) && user.active);
    const recondUser = game.users.find(user => user.isGM && user.active);
    if (!recondUser.isSelf) return;

    try {
        DiceRoller.main(chatMessage);
    } catch (error) {
        console.error('error', error)
    }
});


//diceSoNiceRollStart(X, Y)
//Y.roll.dice



class DiceRoller {
    constructor() {
        // this.diceResults = {}; // 存放每種骰子的統計數據
        // this.loadDiceResults();
        //  this.updateHTML();
    }

    static async main(message) {
        try {

            //1. get dice data
            let { dices, name } = DiceRoller.checkDice(message);
            let specialDice = DiceRoller.checkSpecialDice(message);
            if (specialDice) dices = [specialDice];
            if (!dices.length) return;
            //2. check Entry Exist 
            //if not exist, create new Entry
            await DiceRoller.checkEntryExist();

            //3. check Page Exist
            let { target, page } = await DiceRoller.checkPageExist(name);
            if (!page) {
                //if not exist, create new Page
                page = await DiceRoller.__createNewPage(target, name, htmlText);
            }
            console.debug('page', page)
            //4. get Page Data
            let contect = page?.text?.content || page[0].text.content;
            let data = DiceRoller.readHtmlCode(contect, name);
            //5. update Page Data
            let newData = await DiceRoller.updateData(data, dices);

            //5.1 render new html code
            let newHtmlText = DiceRoller.renderHtmlCode(newData);

            //6. update Page
            await DiceRoller.__updatePage(target, newHtmlText, page);
        } catch (error) {
            console.error('error', error)
            return;
        }

    }
    static checkSpecialDice(message) {
        const rolls = message.rolls;
        if (rolls.length === 0) return null;
        const roll = rolls[0];
        let specialDice = specialDiceing.find(d => d._formula === roll._formula);
        if (!specialDice) return null;
        let dice = {
            faces: specialDice.face,
            results: [{ result: roll.total }]
        };
        return dice;
    }

    static checkDice(message) {
        let name = message.user.name;
        let dices = [];
        const rolls = message.rolls;
        if (rolls.length === 0) return { dices, name };
        const roll = rolls[0];
        dices = roll.dice;
        return { dices, name };
    }

    static readHtmlCode(string, name) {
        // 創建一個空對象
        const result = { name: '', D4: { times: 0, mean: 0, max: 0, min: 0, last: [] }, D6: { times: 0, mean: 0, max: 0, min: 0, last: [] }, D8: { times: 0, mean: 0, max: 0, min: 0, last: [] }, D10: { times: 0, mean: 0, max: 0, min: 0, last: [] }, D12: { times: 0, mean: 0, max: 0, min: 0, last: [] }, D20: { times: 0, mean: 0, max: 0, min: 0, last: [] }, D100: { times: 0, mean: 0, max: 0, min: 0, last: [] } };

        // 正則表達式來匹配名稱
        //const nameRegex = /<h1><strong>(.*?)<\/strong>.*<\/h1>/s;
        result.name = name;

        // 正則表達式來匹配 D6 和 D10 的區塊
        const blockRegex = /<h2.*?id="(.*?)".*?<\/p>/sg;
        const blocks = string.matchAll(blockRegex);

        // 遍歷所有匹配的區塊
        for (const block of blocks) {
            const id = block[1];
            const data = block[0];
            // 根據區塊 ID 創建對象屬性
            result[id] = parseData(data);

        }
        // 解析區塊內容並返回對象
        function parseData(data) {
            const result = {};
            // 正則表達式來匹配數據行
            const rowRegex = /<strong id="(.*)">.+?:<\/strong>\s*((?:\d?\.?\d?,?\s*)+)\s?(?:<br\s?\/?>|<\/p>)/g;
            const rows = data.matchAll(rowRegex);
            // 遍歷所有匹配的數據行
            for (const row of rows) {
                const key = row[1].trim();
                let value = row[2] !== '</p>' ? row[2].split(",").map((x) => x.trim()) : null;
                if (key !== 'last') value = Number(value[0]);
                result[key] = value;
            }
            // 如果對象中所有值都是空字符串，返回 null
            return Object.values(result).some((v) => v !== null && v !== "") ? result : null;
        }
        return result;
    }

    static updateData(data, newData) {
        let allRoll = DiceRoller.__analysisData(newData);
        for (let roll of allRoll) {
            let key = `D${roll.face}`;
            if (!(diceCounting.indexOf(key) > -1)) continue;
            data[key].times++;
            data[key].mean = (data[key].mean * (data[key].times - 1) + roll.result) / data[key].times;
            if (roll.result === roll.face) data[key].max++;
            if (roll.result === 1) data[key].min++;
            data[key].last.push(roll.result);
            if (data[key].last.length > 30) data[key].last.shift();
            if (data[key].last[0] === '' && data[key].last.length > 1) data[key].last.shift();
        }
        return data;

    }
    static __analysisData(fvttData) {
        let allRoll = [];
        for (let roll of fvttData) {
            for (let result of roll.results) {
                let dice = {
                    face: roll.faces,
                    result: result.result
                }
                allRoll.push(dice);
            }
        }
        return allRoll;
    }
    static renderHtmlCode(data) {
        let html = `<h1><strong>${game.i18n.localize("name")}</strong></h1>
    `;
        for (let key in data) {
            if (key !== 'name') {
                html += `<h2><a id="${key}"></a>${key}</h2>
                <p><strong id="times">${game.i18n.localize("times")}:</strong> ${data[key].times}<br>
                <strong id="mean">${game.i18n.localize("mean")}:</strong> ${data[key].mean}<br>
                <strong id="max">${game.i18n.localize("max")}:</strong> ${data[key].max}<br>
                <strong id="min">${game.i18n.localize("min")}:</strong> ${data[key].min}<br>
                <strong id="last">${game.i18n.localize("last")}:</strong> ${data[key].last.join(', ')}</p>
                
                `;
            }
        }
        return html;

    }

    static async checkEntryExist() {
        let target = game.journal.find(v => v.name == entryName)
        if (!target) {
            await DiceRoller.__createNewEntry();
        }
    }

    static async checkPageExist(name) {
        const target = game.journal.find(v => v.name == entryName)
        const page = target.pages.find(v => v.name == name)
        return { target, page };
    }

    static async __updatePage(target, content, page) {
        const _id = page?._id || page[0]._id;
        const newPage = { "text.content": content, _id };
        await target.updateEmbeddedDocuments("JournalEntryPage", [newPage]);
    }

    static async __createNewPage(target, name, content) {
        let newPage = { "name": name, "text.content": content.replace('某人', name) };
        return await target.createEmbeddedDocuments("JournalEntryPage", [newPage])
    }

    static async __createNewEntry() {
        await JournalEntry.create({ name: entryName, "ownership.default": 2 });
    }
}
















const htmlText = `<h1><strong>擲骰紀錄</strong></h1>
            <h2><a id="D4"></a>D4</h2>
            <p><strong id="times">已擲骰次數:</strong> 0<br>
            <strong id="mean">平均值:</strong> 0<br>
            <strong id="max">擲出最大值次數:</strong> 0<br>
            <strong id="min">擲出最小值次數:</strong> 0<br>
            <strong id="last">最近三十次結果:</strong> </p>

            <h2><a id="D6"></a>D6</h2>
            <p><strong id="times">已擲骰次數:</strong> 0<br>
            <strong id="mean">平均值:</strong> 0<br>
            <strong id="max">擲出最大值次數:</strong> 0<br>
            <strong id="min">擲出最小值次數:</strong> 0<br>
            <strong id="last">最近三十次結果:</strong> </p>

            <h2><a id="D8"></a>D8</h2>
            <p><strong id="times">已擲骰次數:</strong> 0<br>
            <strong id="mean">平均值:</strong> 0<br>
            <strong id="max">擲出最大值次數:</strong> 0<br>
            <strong id="min">擲出最小值次數:</strong> 0<br>
            <strong id="last">最近三十次結果:</strong> </p>

            <h2><a id="D10"></a>D10</h2>
            <p><strong id="times">已擲骰次數:</strong> 0<br>
            <strong id="mean">平均值:</strong> 0<br>
            <strong id="max">擲出最大值次數:</strong> 0<br>
            <strong id="min">擲出最小值次數:</strong> 0<br>
            <strong id="last">最近三十次結果:</strong> </p>

            <h2><a id="D12"></a>D12</h2>
            <p><strong id="times">已擲骰次數:</strong> 0<br>
            <strong id="mean">平均值:</strong> 0<br>
            <strong id="max">擲出最大值次數:</strong> 0<br>
            <strong id="min">擲出最小值次數:</strong> 0<br>
            <strong id="last">最近三十次結果:</strong> </p>

            <h2><a id="D20"></a>D20</h2>
            <p><strong id="times">已擲骰次數:</strong> 0<br>
            <strong id="mean">平均值:</strong> 0<br>
            <strong id="max">擲出最大值次數:</strong> 0<br>
            <strong id="min">擲出最小值次數:</strong> 0<br>
            <strong id="last">最近三十次結果:</strong> </p>

            <h2><a id="D100"></a>D100</h2>
            <p><strong id="times">已擲骰次數:</strong> 0<br>
            <strong id="mean">平均值:</strong> 0<br>
            <strong id="max">擲出最大值次數:</strong> 0<br>
            <strong id="min">擲出最小值次數:</strong> 0<br>
            <strong id="last">最近三十次結果:</strong> </p>

`
















