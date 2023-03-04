const entryName = "HKTRPG's Dice Counting";
Hooks.once("init", () => {
    console.log("How unfortunate are you? DiceCounting 1.0| Initializing");
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


Hooks.on('renderChatMessage', (message) => {
    try {
        let name = message.speaker.alias;
        console.log('message', message)
        const rolls = message.rolls;
        if (rolls.length === 0) return;
        const roll = rolls[0];
        const dices = roll.dice;
        if (dices.length === 0) return;
        DiceRoller.main(dices, name);



    } catch (error) {
        console.log('error', error)
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

    static main() {

    }

    static readHtmlCode(string) {
        // 創建一個空對象
        const result = {
            name: '',
            D6: {
                times: [],
                mean: [],
                max: [],
                min: [],
                last: []
            },
            D10: {
                times: [],
                mean: [],
                max: [],
                min: [],
                last: []
            },
            D20: {
                times: [],
                mean: [],
                max: [],
                min: [],
                last: []
            },
            D100: {
                times: [],
                mean: [],
                max: [],
                min: [],
                last: []
            }
        };

        // 正則表達式來匹配名稱
        const nameRegex = /<h1><strong>(.*?)<\/strong>.*<\/h1>/s;
        result.name = string.match(nameRegex)[1].trim();

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
            const rowRegex = /<strong id="(.*)">.+?:<\/strong>\s*((?:\d?\.?\d?,?\s*)+)\s*(?:<br>|<\/p>)/g;
            const rows = data.matchAll(rowRegex);

            // 遍歷所有匹配的數據行
            for (const row of rows) {
                console.log('row', row)
                const key = row[1].trim();
                const value = row[2] !== '</p>' ? row[2].split(",").map((x) => x.trim()) : null;
                result[key] = value;
            }

            // 如果對象中所有值都是空字符串，返回 null
            return Object.values(result).some((v) => v !== null && v !== "") ? result : null;
        }

        console.log(Object.keys(result), result);
        return result;
    }

    static updateData(data, newData) {
        let allRoll = analysisData(newData);
        for (let roll of allRoll) {
            let key = `D${roll.face}`;
            data[key].times++;
            data[key].mean = (data[key].mean * (data[key].times - 1) + roll.result) / data[key].times;
            if (roll.result === roll.face) data[key].max++;
            if (roll.result === 1) data[key].min++;
            data[key].last.push(roll.result);
            if (data[key].last.length > 30) data[key].last.shift();
        }
        return data;

    }
    static analysisData(fvttData) {
        let allRoll = [];
        let rolls = fvttData.rolls[0].dice;
        for (let roll of rolls) {
            for (let result of roll.results) {
                let dice = {
                    face: roll.face,
                    result: result.result
                }
                allRoll.push(dice);
            }
        }
        return allRoll;
    }
    static renderHtmlCode(data) {
        let html = `<h1><strong>${data.name}</strong></h1>
    `;
        for (let key in data) {
            if (key !== 'name') {
                html += `<h2><a id="${key}"></a>${key}</h2>
                <p><strong id="times">已擲骰次數:</strong> ${data[key].times}<br>
                <strong id="mean">平均值:</strong> ${data[key].mean}<br>
                <strong id="max">擲出最大值次數:</strong> ${data[key].max}<br>
                <strong id="min">擲出最小值次數:</strong> ${data[key].min}<br>
                <strong id="last">最近三十次結果:</strong> ${data[key].last.join(', ')}</p>
                
                `;
            }
        }
        console.log(html)
        return html;

    }

    static updateEntry(name, content) {
        let target = game.journal.find(v => v.name == entryName)
        if (!target) {
            __createNewEntry(name);
            target = game.journal.find(v => v.name == entryName)
        }
        const page = target.pages.find(v => v.name == name)
        if (!page) {
            __createNewPage(target, name, content);
            return;
        }
        const newPage = { "text.content": content, _id: page._id };

        target.updateEmbeddedDocuments("JournalEntryPage", [newPage]);
    }

    static __createNewPage(target, name, content) {
        let newPage = { "name": name, "text.content": content };
        target.createEmbeddedDocuments("JournalEntryPage", [newPage])
    }

    static __createNewEntry() {
        JournalEntry.create({ name: entryName });
    }
}
















const htmlText = `<h1><strong>某人</strong></h1>
<h2><a id="D6"></a>D6</h2>
            <p><strong id="times">已擲骰次數:</strong> 40<br>
            <strong id="mean">平均值:</strong> 3.5<br>
            <strong id="max">擲出最大值次數:</strong> 10<br>
            <strong id="min">擲出最小值次數:</strong> 20<br>
            <strong id="last">最近三十次結果:</strong> 2, 5, 6, 1, 2</p>

            <h2><a id="D10"></a>D10</h2>
            <p><strong id="times">已擲骰次數:</strong> 40<br>
            <strong id="mean">平均值:</strong> 3.5<br>
            <strong id="max">擲出最大值次數:</strong> 10<br>
            <strong id="min">擲出最小值次數:</strong> 20<br>
            <strong id="last">最近三十次結果:</strong> 2, 5, 6, 1, 2</p>

            <h2><a id="D20"></a>D20</h2>
            <p><strong id="times">已擲骰次數:</strong> 40<br>
            <strong id="mean">平均值:</strong> 3.5<br>
            <strong id="max">擲出最大值次數:</strong> 10<br>
            <strong id="min">擲出最小值次數:</strong> 20<br>
            <strong id="last">最近三十次結果:</strong> 2, 5, 6, 1, 2</p>

            <h2><a id="D100"></a>D100</h2>
            <p><strong id="times">已擲骰次數:</strong> 40<br>
            <strong id="mean">平均值:</strong> 3.5<br>
            <strong id="max">擲出最大值次數:</strong> 10<br>
            <strong id="min">擲出最小值次數:</strong> 20<br>
            <strong id="last">最近三十次結果:</strong> 2, 5, 6, 1, 2</p>

`
















