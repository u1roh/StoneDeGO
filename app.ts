const ngrid = 12;
const breadth = 5;  // 1つの石が持つパワーの広がり
const totalTurn = 80;

function makeHexString(x: number) {
    const y = Math.round(255 * x);
    return y < 16 ? "0" + y.toString(16) : y.toString(16);
}

function makeColorString(r: number, g: number, b: number) {
    return "#" + makeHexString(r) + makeHexString(g) + makeHexString(b);
}

function makeFieldColor(value: number) {
    let r = value < 0 ? 0 : 1 < value ? 1 : value;
    let g = Math.abs(value) < 1 ? 0 : 2 < Math.abs(value) ? 1 : Math.abs(value) - 1;
    let b = -value < 0 ? 0 : 1 < -value ? 1 : -value;
    return makeColorString(r, g, b);
}

function getFieldValue(r: number): number {
    /*
    r /= breadth + 1;
    return r > 1 ? 0 : 0.5 * (1 + r) * (1 + r) * (1 - r) * (1 - r);
    */
    return Math.pow(0.4, r);
}

const stoneField = new Array<Array<number>>(2 * breadth + 1);
for (let i = 0; i < stoneField.length; ++i) {
    stoneField[i] = new Array<number>(2 * breadth + 1);
    for (let j = 0; j < stoneField.length; ++j) {
        const r = Math.sqrt((i - breadth) * (i - breadth) + (j - breadth) * (j - breadth));
        stoneField[i][j] = getFieldValue(r);
    }
}


enum Stone {
    None,
    Red,
    Blue
}


class GameBoard {
    field: Array<Array<number>>;
    stones: Array<Array<Stone>>;
    scoreRed: number;
    scoreBlue: number;
    constructor() {
        this.field = new Array<Array<number>>(ngrid);
        this.stones = new Array<Array<Stone>>(ngrid);
        for (let i = 0; i < ngrid; ++i) {
            this.field[i] = new Array<number>(ngrid);
            this.stones[i] = new Array<Stone>(ngrid);
            for (let j = 0; j < ngrid; ++j) {
                this.field[i][j] = 0;
                this.stones[i][j] = Stone.None;
            }
        }
    }
    private updateScores() {
        this.scoreRed = 0;
        this.scoreBlue = 0;
        for (let i = 0; i < ngrid; ++i) {
            for (let j = 0; j < ngrid; ++j) {
                if (this.field[i][j] > 0)++this.scoreRed;
                if (this.field[i][j] < 0)++this.scoreBlue;
            }
        }
    }
    private addStoneField(x: number, y: number, sgn: number) {
        for (let i = 0; i < stoneField.length; ++i) {
            for (let j = 0; j < stoneField.length; ++j) {
                let ii = x + (i - breadth);
                let jj = y + (j - breadth);
                if (ii < 0) ii = -ii - 1;
                if (jj < 0) jj = -jj - 1;
                if (ii >= ngrid) ii = 2 * ngrid - ii - 1;
                if (jj >= ngrid) jj = 2 * ngrid - jj - 1;
                this.field[ii][jj] += sgn * stoneField[i][j];
            }
        }
    }
    putStone(x: number, y: number, stone: Stone) : boolean {
        const sgn = stone == Stone.Red ? +1 : stone == Stone.Blue ? -1 : 0;
        if (this.stones[x][y] != Stone.None) return false;
        if (sgn * this.field[x][y] <= -1) return false;
        this.stones[x][y] = stone;
        this.addStoneField(x, y, sgn);
        let removal = true;
        while (removal) {
            removal = false;
            for (let i = 0; i < ngrid; ++i) {
                for (let j = 0; j < ngrid; ++j) {
                    if (this.stones[i][j] == Stone.None || this.stones[i][j] == stone) continue;
                    if (-sgn * this.field[i][j] < 0) {
                        this.stones[i][j] = Stone.None;
                        this.addStoneField(i, j, sgn);
                        removal = true;
                    }
                }
            }
        }
        this.updateScores();
        return true;
    }
    score(stone: Stone): number {
        return stone == Stone.Red ? this.scoreRed : this.scoreBlue;
    }
    countStones(stone: Stone): number {
        let n = 0;
        for (let i = 0; i < ngrid; ++i) {
            for (let j = 0; j < ngrid; ++j) {
                if (this.stones[i][j] == stone)++n;
            }
        }
        return n;
    }
    clone(): GameBoard {
        let dst = new GameBoard();
        for (let i = 0; i < ngrid; ++i) {
            for (let j = 0; j < ngrid; ++j) {
                dst.field[i][j] = this.field[i][j];
                dst.stones[i][j] = this.stones[i][j];
            }
        }
        dst.scoreRed = this.scoreRed;
        dst.scoreBlue = this.scoreBlue;
        return dst;
    }
}

enum Player { Person, Computer }
let playerRed = Player.Person;
let playerBlue = Player.Computer;
//let playerBlue = Player.Person;

function search(game: GameBoard, stone: Stone) : number[] {
    function evaluate(i: number, j: number) : number {
        const copy = game.clone();
        copy.putStone(i, j, stone);
        const sgn = stone == Stone.Red ? -1 : +1;
        const enemy = stone == Stone.Red ? Stone.Blue : Stone.Red;
        let minScore = 1000;
        for (let i = 0; i < ngrid; ++i) {
            for (let j = 0; j < ngrid; ++j) {
                if (copy.stones[i][j] != Stone.None) continue;
                if (sgn * copy.field[i][j] < -1) continue;
                const copy2 = copy.clone();
                copy2.putStone(i, j, enemy);
                const score1 = copy2.score(stone) - game.score(stone);
                const score2 = copy2.countStones(stone) - game.countStones(stone) + game.countStones(enemy) - copy2.countStones(enemy);
                const score = score1 + 40 * score2;
                if (score < minScore) minScore = score;
            }
        }
        return minScore;
    }
    const sgn = stone == Stone.Red ? +1 : -1;
    let x = 0;
    let y = 0;
    let maxValue = -1000;
    for (let i = 0; i < ngrid; ++i) {
        for (let j = 0; j < ngrid; ++j) {
            if (game.stones[i][j] != Stone.None) continue;
            if (sgn * game.field[i][j] < -1) continue;
            const value = evaluate(i, j);
            if (value > maxValue) {
                maxValue = value;
                x = i;
                y = j;
            }
        }
    }
    return [x, y];
}

function drawTerritoryStatusBar(con: CanvasRenderingContext2D, game: GameBoard, y0: number, width: number, height: number) {
    con.beginPath();
    con.rect(2, y0 + 2, width - 4, height - 4);
    con.fillStyle = "#000000";
    con.fill();
    con.closePath();

    let widthRed  = (width - 4) * game.scoreRed  / (ngrid * ngrid);
    let widthBlue = (width - 4) * game.scoreBlue / (ngrid * ngrid);
    con.beginPath();
    con.rect(2, y0 + 2, widthRed, height - 4);
    con.fillStyle = "#ff0000";
    con.fill();
    con.closePath();
    con.beginPath();
    con.rect(width - 2 - widthBlue, y0 + 2, widthBlue, height - 4);
    con.fillStyle = "#0000ff";
    con.fill();
    con.closePath();
}


window.onload = () => {
    const game = new GameBoard();

    const canvas = <HTMLCanvasElement>document.getElementById("gameCanvas");
    const con = canvas.getContext("2d");

    const status = document.getElementById("status");
    status.textContent = "1 / " + totalTurn + " RED's TURN";

    const size = Math.min(document.body.clientWidth, 480);
    const statusBarHeight = 24;
    canvas.width = size;
    canvas.height = size + statusBarHeight + 10;

    let turn = 0;
    let cursorX = -1;
    let cursorY = -1;

    function onPutStone() {
        ++turn;
        draw();
        if (turn == totalTurn) {
            const winner = game.scoreRed > game.scoreBlue ? "RED" : "BLUE";
            alert(winner + " WIN!!!");
            document.location.reload();
        }
        else {
            status.textContent = (turn + 1) + " / " + totalTurn + " " + (turn % 2 == 0 ? "RED" : "BLUE") + "'s TURN";
        }
    }

    function getMousePosition(e: MouseEvent) {
        var rect = (<HTMLElement>e.target).getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    canvas.onmousemove = e => {
        const pos = getMousePosition(e);
        cursorX = Math.floor(pos.x * ngrid / size);
        cursorY = Math.floor(pos.y * ngrid / size);
        draw();
    };

    canvas.onclick = e => {
        const pos = getMousePosition(e);
        const x = Math.floor(pos.x * ngrid / size);
        const y = Math.floor(pos.y * ngrid / size);
        if (game.putStone(x, y, turn % 2 == 0 ? Stone.Red : Stone.Blue)) {
            onPutStone();

            const nextPlayer = turn % 2 == 0 ? playerRed : playerBlue;
            if (nextPlayer == Player.Computer) {
                const stone = turn % 2 == 0 ? Stone.Red : Stone.Blue;
                const pos = search(game, stone);
                if (game.putStone(pos[0], pos[1], stone)) {
                    onPutStone();
                }
            }
        }
    };

    function draw() {
        con.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < ngrid; ++i) {
            for (let j = 0; j < ngrid; ++j) {
                con.beginPath();
                con.rect(size * i / ngrid, size * j / ngrid, size / ngrid, size / ngrid);
                con.fillStyle = makeFieldColor(game.field[i][j]);
                con.fill();
                con.closePath();
            }
        }

        const radius = 0.3 * canvas.width / ngrid;
        for (let i = 0; i < ngrid; ++i) {
            for (let j = 0; j < ngrid; ++j) {
                if (game.stones[i][j] == Stone.None) continue;
                con.beginPath();
                con.arc(size * (i + 0.5) / ngrid, size * (j + 0.5) / ngrid, radius, 0, 2 * Math.PI);
                con.fillStyle = game.stones[i][j] == Stone.Red ? "#ff4040" : "#4040ff";
                con.strokeStyle = "#000000";
                con.fill();
                con.stroke();
                con.closePath();
            }
        }
        if (0 <= cursorX && cursorX < ngrid &&
            0 <= cursorY && cursorY < ngrid &&
            game.stones[cursorX][cursorY] == Stone.None &&
            (turn % 2 == 0 ? +1 : -1) * game.field[cursorX][cursorY] > -1) {
            con.beginPath();
            con.arc(size * (cursorX + 0.5) / ngrid, size * (cursorY + 0.5) / ngrid, radius, 0, 2 * Math.PI);
            con.strokeStyle = turn % 2 == 0 ? "#ff4040" : "#4040ff";
            con.stroke();
            con.closePath();
        }

        con.beginPath();
        for (let i = 0; i <= ngrid; ++i) {
            const y = size * i / ngrid;
            con.moveTo(0, y);
            con.lineTo(size, y);
        }
        for (let i = 0; i <= ngrid; ++i) {
            const x = size * i / ngrid;
            con.moveTo(x, 0);
            con.lineTo(x, size);
        }
        con.lineWidth = 1;
        con.strokeStyle = "#ffffff";
        con.stroke();
        con.closePath();

        // status bar
        drawTerritoryStatusBar(con, game, size + 10, size, statusBarHeight);
    }

    draw();

    //setInterval(draw, 10);
};