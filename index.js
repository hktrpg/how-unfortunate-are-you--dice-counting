
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
        const rolls = message.rolls;
        if (rolls.length === 0) return;
        const roll = rolls[0];
        const dices = roll.dice;
        if (dices.length === 0) return;




    } catch (error) {
        console.log('error', error)
    }
});

class DiceStats {
    constructor() {
        this.stats = {}; // 存放每種骰子的統計數據
        this.MAX_RECORDS = 30; // 最多記錄30次擲骰結果
        this.loadStats();
    }

    // 從 dice.txt 中讀取統計數據
    loadStats() {
        const fs = require("fs");
        try {
            const data = fs.readFileSync("dice.txt", "utf8");
            if (data) {
                this.stats = JSON.parse(data);
            }
        } catch (err) {
            console.error(err);
        }
    }

    // 將統計數據寫入 dice.txt
    saveStats() {
        const fs = require("fs");
        try {
            fs.writeFileSync("dice.txt", JSON.stringify(this.stats));
        } catch (err) {
            console.error(err);
        }
    }

    // 更新骰子統計數據
    updateStats(die, result) {
        if (!this.stats[die]) {
            this.stats[die] = {
                rolls: [], // 擲骰結果列表
                totalRolls: 0, // 總擲骰次數
                average: 0, // 平均數
                minCount: 0, // 擲出最小值的次數
                maxCount: 0, // 擲出最大值的次數
                lastMinTime: "", // 最近擲出最小值的時間
                lastMaxTime: "", // 最近擲出最大值的時間
            };
        }

        // 新擲骰結果加入統計數據
        const rolls = this.stats[die].rolls;
        rolls.push(result);
        this.stats[die].totalRolls++;
        this.stats[die].average = rolls.reduce((acc, cur) => acc + cur) / rolls.length;

        // 如果擲骰結果列表超過30，則刪除最舊的一個
        if (rolls.length > this.MAX_RECORDS) {
            rolls.shift();
        }

        // 計算擲出最小值和最大值的次數以及最近的時間
        let min = Infinity;
        let max = -Infinity;
        let minCount = 0;
        let maxCount = 0;
        let lastMinTime = "";
        let lastMaxTime = "";
        for (let i = 0; i < rolls.length; i++) {
            const roll = rolls[i];
            if (roll < min) {
                min = roll;
                minCount = 1;
                lastMinTime = new Date().toLocaleString();
            } else if (roll === min) {
                minCount++;
            }
            if (roll > max) {
                max = roll;
                maxCount = 1;
                lastMaxTime = new Date().toLocaleString
            } else if (roll === max) {
                maxCount++;
            }
        }
        this.stats[die].minCount = minCount;
        this.stats[die].maxCount = maxCount;
        this.stats[die].lastMinTime = lastMinTime;
        this.stats[die].lastMaxTime = lastMaxTime;

        // 將統計數據寫入 dice.txt
        this.saveStats();
    }
}

const diceStats = new DiceStats();
diceStats.updateStats("d6", 4);
diceStats.updateStats("d6", 3);
diceStats.updateStats("d6", 6);
diceStats.updateStats("d6", 1);
diceStats.updateStats("d6", 2);
diceStats.updateStats("d10", 8);
diceStats.updateStats("d10", 10);
diceStats.updateStats("d20", 18);
diceStats.updateStats("d100", 50);