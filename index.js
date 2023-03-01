
Hooks.once("init", () => {
    console.log("Show Online player First 1.0 | Initializing");
});

Hooks.on('renderDialog', () => {
    try {
        const users = game.users.filter(user => user.active);
        let playerNames = users.map(u => u.name)
        sortLabel('.form-fields', playerNames)
        sortLabel('.show-to-players', playerNames)
    } catch (error) {
        console.log('error', error)
    }
});


Hooks.on('renderApplication', () => {
    try {
        const users = game.users.filter(user => user.active);
        let playerNames = users.map(u => u.name)
        //permission-control
        reorderFormGroups(playerNames);
    } catch (error) {
        // console.log('error', error)
    }
});

function reorderFormGroups(players) {
    const formGroups = document.querySelectorAll('.form-group');
    if (!formGroups) return;
    // 找到 players 包含的 form-group
    const selectedFormGroups = [];
    formGroups.forEach((formGroup) => {
        const label = formGroup.querySelector('label');
        if (label && players.includes(label.textContent)) {
            selectedFormGroups.push(formGroup);
        }
    });

    // 把選中的 form-group 移动到 hidden 的后面
    const hiddenFormGroup = document.querySelector('.form-group.hidden');
    selectedFormGroups.forEach((formGroup) => {
        hiddenFormGroup.parentNode.insertBefore(formGroup, hiddenFormGroup.nextSibling);
    });
}

function sortLabel(className, playerNames) {
    const formFields = document.querySelector(className);
    if (!formFields) return;
    const playerLabels = formFields.querySelectorAll('label.checkbox');
    const playerMap = new Map();
    // 將符合條件的玩家名稱及對應的標籤放入map中
    playerLabels.forEach(label => {
        const playerName = label.textContent.trim();
        if (playerNames.includes(playerName)) {
            playerMap.set(playerName, label);
        }
    });
    // 將map中的標籤依序放在前面
    playerNames.forEach(playerName => {
        const label = playerMap.get(playerName);
        if (label) {
            formFields.insertBefore(label, formFields.firstChild);
        }
    });
}