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

const field = new Array<Array<number>>(ngrid);
for (let i = 0; i < ngrid; ++i) {
    field[i] = new Array<number>(ngrid);
    for (let j = 0; j < ngrid; ++j) field[i][j] = 0;
}

let scoreRed = 0;
let scoreBlue = 0;

function updateScores() {
    scoreRed = 0;
    scoreBlue = 0;
    for (let i = 0; i < ngrid; ++i) {
        for (let j = 0; j < ngrid; ++j) {
            if (field[i][j] > 0)++scoreRed;
            if (field[i][j] < 0)++scoreBlue;
        }
    }
}


enum Stone {
    None,
    Red,
    Blue
}

const stones = new Array<Array<Stone>>(ngrid);
for (let i = 0; i < ngrid; ++i) {
    stones[i] = new Array<Stone>(ngrid);
    for (let j = 0; j < ngrid; ++j) stones[i][j] = Stone.None;
}

function addStoneField(x: number, y: number, sgn: number) {
    for (let i = 0; i < stoneField.length; ++i) {
        for (let j = 0; j < stoneField.length; ++j) {
            let ii = x + (i - breadth);
            let jj = y + (j - breadth);
            if (ii < 0) ii = -ii - 1;
            if (jj < 0) jj = -jj - 1;
            if (ii >= ngrid) ii = 2 * ngrid - ii - 1;
            if (jj >= ngrid) jj = 2 * ngrid - jj - 1;
            field[ii][jj] += sgn * stoneField[i][j];
        }
    }
}

function putStone(x: number, y: number, stone: Stone) : boolean {
    const sgn = stone == Stone.Red ? +1 : stone == Stone.Blue ? -1 : 0;
    if (stones[x][y] != Stone.None) return false;
    if (sgn * field[x][y] <= -1) return false;
    stones[x][y] = stone;
    addStoneField(x, y, sgn);
    let removal = true;
    while (removal) {
        removal = false;
        for (let i = 0; i < ngrid; ++i) {
            for (let j = 0; j < ngrid; ++j) {
                if (stones[i][j] == Stone.None || stones[i][j] == stone) continue;
                if (-sgn * field[i][j] < 0) {
                    stones[i][j] = Stone.None;
                    addStoneField(i, j, sgn);
                    removal = true;
                }
            }
        }
    }
    updateScores();
    return true;
}

enum Player { Person, Computer }
let playerRed = Player.Person;
//let playerBlue = Player.Computer;
let playerBlue = Player.Person;

function search(stone: Stone) : number[] {
    function evaluate(i: number, j: number) : number {
        return 0;
    }
    const sgn = stone == Stone.Red ? +1 : -1;
    let x = 0;
    let y = 0;
    let maxValue = 0;
    for (let i = 0; i < ngrid; ++i) {
        for (let j = 0; j < ngrid; ++j) {
            if (stones[i][j] != Stone.None) continue;
            if (sgn * field[i][j] < -1) continue;
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

function drawTerritoryStatusBar(con: CanvasRenderingContext2D, y0: number, width: number, height: number) {
    con.beginPath();
    con.rect(2, y0 + 2, width - 4, height - 4);
    con.fillStyle = "#000000";
    con.fill();
    con.closePath();

    let widthRed  = (width - 4) * scoreRed  / (ngrid * ngrid);
    let widthBlue = (width - 4) * scoreBlue / (ngrid * ngrid);
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
    const canvas = <HTMLCanvasElement>document.getElementById("gameCanvas");
    const con = canvas.getContext("2d");

    const status = document.getElementById("status");
    status.textContent = "1 / " + totalTurn + " RED's TURN";

    const size = Math.min(document.body.clientWidth, 480);
    const statusBarHeight = 24;
    canvas.width = size;
    canvas.height = size + statusBarHeight + 10;

    let turn = 0;
    let cursorX = 0;
    let cursorY = 0;

    function onPutStone() {
        ++turn;
        draw();
        if (turn == totalTurn) {
            const winner = scoreRed > scoreBlue ? "RED" : "BLUE";
            alert(winner + " WIN!!!");
            document.location.reload();
        }
        else {
            status.textContent = (turn + 1) + " / " + totalTurn + " " + (turn % 2 == 0 ? "RED" : "BLUE") + "'s TURN";
        }
    }

    canvas.onmousemove = e => {
        cursorX = Math.floor((e.x - canvas.offsetLeft) * ngrid / size);
        cursorY = Math.floor((e.y - canvas.offsetTop)  * ngrid / size);
        draw();
    };

    canvas.onclick = e => {
        const x = Math.floor((e.x - canvas.offsetLeft) * ngrid / size);
        const y = Math.floor((e.y - canvas.offsetTop)  * ngrid / size);
        if (putStone(x, y, turn % 2 == 0 ? Stone.Red : Stone.Blue)) {
            onPutStone();

            const nextPlayer = turn % 2 == 0 ? playerRed : playerBlue;
            if (nextPlayer == Player.Computer) {
                const stone = turn % 2 == 0 ? Stone.Red : Stone.Blue;
                const pos = search(stone);
                if (putStone(pos[0], pos[1], stone)) {
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
                con.fillStyle = makeFieldColor(field[i][j]);
                con.fill();
                con.closePath();
            }
        }

        const radius = 0.3 * canvas.width / ngrid;
        for (let i = 0; i < ngrid; ++i) {
            for (let j = 0; j < ngrid; ++j) {
                if (stones[i][j] == Stone.None) continue;
                con.beginPath();
                con.arc(size * (i + 0.5) / ngrid, size * (j + 0.5) / ngrid, radius, 0, 2 * Math.PI);
                con.fillStyle = stones[i][j] == Stone.Red ? "#ff4040" : "#4040ff";
                con.strokeStyle = "#000000";
                con.fill();
                con.stroke();
                con.closePath();
            }
        }
        if (stones[cursorX][cursorY] == Stone.None && (turn % 2 == 0 ? +1 : -1) * field[cursorX][cursorY] > -1) {
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
        drawTerritoryStatusBar(con, size + 10, size, statusBarHeight);
    }

    draw();

    //setInterval(draw, 10);
};