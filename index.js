
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

