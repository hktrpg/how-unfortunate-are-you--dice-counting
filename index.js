
Hooks.once("init", () => {
    console.log("How unfortunate are you? DiceCounting 1.0| Initializing");
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

