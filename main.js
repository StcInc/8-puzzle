var PRIMARY_COLOR = "#1565C0";
var MAX_GAME_ELEM = 8;

window.onload = function () {
    var canvas = document.getElementById('canvas'),
        context = canvas.getContext("2d"),
        width = canvas.width = window.innerWidth,
        height = canvas.height = window.innerHeight,
        field = createField(context, width, height, window.requestAnimationFrame),
        finished = document.getElementById("finished");

    finished.style.visibility = "hidden";
    finished.width = width;
    finished.height = "200px";
    finished.style.textAlign ="center";
    finished.style.color = PRIMARY_COLOR;


    runAStar(
        to2d([1, 2, 3, 4, 5, 6, 7, 8, undefined]),
        {col: 2, row: 2},
        field,
        function () {
            document.getElementById("finished").style.visibility = "visible";
        });


};

window.addEventListener('resize', function(event){
    window.onload();
});



function runAStar(finalPos, finalEmptyPos, field, onEnd) {

    var path = [];
    while (path.length == 0) {
        var pos = to2d(permutation([1, 2, 3, 4, 5, 6, 7, 8, undefined]));
        field.draw(pos);
        path = findSolution(pos, getEmptyPos(pos, undefined)); // ["left", "up", "right", "down", ...]
    }
    var initialPos = pos;
    var initialEmptyPos = getEmptyPos(pos, undefined);

    var current = 0;

    field.draw(initialPos);
    onNextStep(initialPos, initialEmptyPos);

    /**
     * Renders the result movement sequence step by step
     */
    function onNextStep(elems, emptyPos) {
        if (current >= path.length) {
            onEnd();
        }
        else { // step by step show the solution
            switch (path[current++]) {
                case "left":
                    field.moveLeft(elems, {col: emptyPos.col + 1,
                                           row: emptyPos.row}, onNextStep);
                    break;
                case "right":
                    field.moveRight(elems, {col: emptyPos.col -1,
                                            row: emptyPos.row}, onNextStep);
                    break;
                case "up":
                    field.moveUp(elems, {col: emptyPos.col,
                                         row: emptyPos.row + 1}, onNextStep);
                    break;
                case "down":
                    field.moveDown(elems, {col: emptyPos.col,
                                           row: emptyPos.row - 1}, onNextStep)
                    break;
                default:
                    console.log(path, current);
                    break;
            }
        }
    }


}

/**
 * Randomly moves tiles on the field, starting with given positions
 */
function runInfiniteMovement(positions, field) {
    field.draw(positions);
    onFinished(positions, {col: 2, row: 2}, "nope");

    function select (acts) {
        var prob = acts.length;
        var res = 0;
        while (prob > 0) {
            if (Math.floor(Math.random() * prob) == 0) {
                return acts[acts.length - prob];
            }
            --prob;
        }
        return acts[0];
    }

    function isValid(coords) {
        return !(coords.col < 0
              || coords.col > 2
              || coords.row < 0
              || coords.row > 2);
    }
    function isOposite(a, b) {
        return a == "left"  && b == "right"
            || a == "right" && b == "left"
            || a == "up"    && b == "down"
            || a == "down"  && b == "up";
    }
    function onFinished(elems, emptyPos, prev) {
        var acts = {
                left:  {col: emptyPos.col + 1, row: emptyPos.row    },
                right: {col: emptyPos.col - 1, row: emptyPos.row    },
                up:    {col: emptyPos.col,     row: emptyPos.row + 1},
                down:  {col: emptyPos.col,     row: emptyPos.row - 1}
            },
            moves = [];

        for (var fun in acts) {
            if (isValid(acts[fun]) && !isOposite(fun, prev)) {
                moves.push(fun);
            }
        }
        switch (select(moves)) {
            case "left":
                field.moveLeft(elems, acts.left, onFinished);
                break;
            case "right":
                field.moveRight(elems, acts.right, onFinished);
                break;
            case "up":
                field.moveUp(elems, acts.up, onFinished);
                break;
            case "down":
                field.moveDown(elems, acts.down, onFinished);
                break;
            default:
                console.log(moves);
                break;
        }
    }
}


/**
 * Creates game field visualising object
 */
function createField(ctx, width, height, requestAnimationFrame) { var f = {
    TILE_SIDE : 150,
    TILE_SPACING : 0.5,
    TEXT_FONT : '40px Arial',
    TEXT_COLOR : "white",
    BACK_COLOR : "white",
    PART_SEGM_AMOUNT : 25, // amount of partition segments for animation

    draw : function (elems) {
        ctx.clearRect(0, 0, width, height);
        for (var i = 0; i < elems.length; ++i) {
            for (var j = 0; j < elems[i].length; ++j) {
                if (elems[i][j] != undefined) {
                    this.drawTile(this.getTileX(j),
                                  this.getTileY(i),
                                  elems[i][j]);
                }
            }
        }
    },

    /**
     * Animates the movement of element at given position left
     * @param elems : array of positions
     * @param elemToMove : col, row of the element to be moved
     * @param onFinish : callback, taking resulting array of elements, free col and row, previous move,
     *   that will be called after animations is done
     */
    moveLeft : function (elems, elemToMove, onFinish) {
        var col = elemToMove.col,
            row = elemToMove.row,
            targetX = this.getTileX(col - 1),
            step = this.TILE_SIDE / this.PART_SEGM_AMOUNT;

        this.move(elems, col, row, -step, 0,
            function (x, y) { // has finished
                return x <= targetX;
            },
            function (text) { // onFinish
                elems[row][col-1] = text;
                f.draw(elems);
                onFinish(elems, elemToMove, "left");
            });
    },

    /**
     * Animates the movement of element at given position right
     * @param elems    : array of positions
     * @param elemToMove : col, row of the element to be moved
     * @param onFinish : callback, taking resulting array of elements, free col and row, previous move
     *   that will be called after animations is done
     */
    moveRight : function (elems, elemToMove, onFinish) {
        var col = elemToMove.col,
            row = elemToMove.row,
            targetX = this.getTileX(col + 1),
            step = this.TILE_SIDE / this.PART_SEGM_AMOUNT;

        this.move(elems, col, row, step, 0,
            function (x, y) { // has finished
                return x >= targetX;
            },
            function (text) { // onFinish
                elems[row][col+1] = text;
                f.draw(elems);
                onFinish(elems, elemToMove, "right");
            });
    },

    /**
     * Animates the movement of element at given position up
     * @param elems : array of positions
     * @param elemToMove : col, row of the element to be moved
     * @param onFinish : callback, taking resulting array of elements, free col and row, previous move,
     *   that will be called after animations is done
     */
    moveUp : function (elems, elemToMove, onFinish) {
        var col = elemToMove.col,
            row = elemToMove.row,
            targetY = this.getTileY(row - 1),
            step = this.TILE_SIDE / this.PART_SEGM_AMOUNT;

        this.move(elems, col, row, 0, -step,
            function (x, y) { // has finished
                return y <= targetY;
            },
            function (text) { // onFinish
                elems[row - 1][col] = text;
                f.draw(elems);
                onFinish(elems, elemToMove, "up");
            });
    },


    /**
     * Animates the movement of element at given position down
     * @param elems : array of positions
     * @param elemToMove : col, row of the element to be moved
     * @param onFinish : callback, taking resulting array of elements free col and row, previous move,
     *   that will be called after animations is done
     */
    moveDown : function (elems, elemToMove, onFinish) {
        var col = elemToMove.col,
            row = elemToMove.row,
            targetY = this.getTileY(row + 1),
            step = this.TILE_SIDE / this.PART_SEGM_AMOUNT;

        this.move(elems, col, row, 0, step,
            function (x, y) { // has finished
                return y >= targetY;
            },
            function (text) { // onFinish
                elems[row + 1][col] = text;
                f.draw(elems);
                onFinish(elems, elemToMove, "down");
            });
    },

    /**
     * Moves the tile at given column and row with the given delta-X and delta-Y
     * @param elems   : array of elements, representing field
     * @param col     : column of the element to be moved
     * @param row     : row of the element to be moved
     * @param dx      : delta-X value
     * @param dy      : delta-Y value
     * @param riched  : predicate, returning true if given x and y are final
     * @param onFinish: calback, taking the text of the moved element
     */
    move : function (elems, col, row, dx, dy, riched, onFinish) {
        var x = this.getTileX(col),
            y = this.getTileY(row),
            text = elems[row][col];

        elems[row][col] = undefined;

        function update () {
            f.draw(elems);
            x += dx;
            y += dy

            f.drawTile(x, y, text);
            if (riched(x, y)) {
                onFinish(text);

            } else {
                requestAnimationFrame(update);
            }
        }
        update();
    },

    /**
     * Returns drawing offset for the tile at given column
     * @param col : column number
     */
    getTileX : function (col) {
        return Math.floor(width / 2 - 1.5 * this.TILE_SIDE + col * this.TILE_SIDE);
    },

    /**
     * Returns drawing offset for the tile at given row
     * @param row : row number
     */
    getTileY : function (row) {
        return Math.floor(height / 2 - 1.5 * this.TILE_SIDE + row * this.TILE_SIDE);
    },


    /**
     * Returns tile's drawing width
     */
    getTileWidth : function () {
        return Math.floor(this.TILE_SIDE- this.TILE_SPACING);
    },

    /**
     * Returns tile's drawing height
     */
    getTileHeight : function () {
        return Math.floor(this.TILE_SIDE- this.TILE_SPACING);
    },

    /**
     * Prints specified text centered in the square specified by
     *   it's left upper corner
     * @param x     :  The x position of the rectangle.
     * @param y     :  The y position of the rectangle.
     * @param text  :  The text we are going to centralize
     */
    drawTile : function  (x, y, text) {
        var w = this.getTileWidth(),
            h = w;
        ctx.fillStyle = PRIMARY_COLOR;
        ctx.fillRect(x, y, w, h);

        ctx.textBaseline = "middle";
        ctx.font = this.TEXT_FONT;
        ctx.fillStyle = this.TEXT_COLOR;

        textX = x + this.TILE_SIDE / 2 - ctx.measureText(text).width / 2;
        textY = y + this.TILE_SIDE / 2;
        ctx.fillText(text, textX, textY);
    },


    /**
     * Draws swaure over the tile at given position with back color
     * @param x
     * @param y
     */
    eraseTile : function (x, y) {
        ctx.fillStyle = this.BACK_COLOR;
        ctx.fillRect(x, y, this.TILE_SIDE, this.TILE_SIDE);
    }

}; return f;}

/**
 * Creates 2-dimensional array out of one-dimensional
 * @param a - single dimensional array
 */
function to2d(a) {
    var res = [];
    var row = [];
    var side = Math.sqrt(a.length);
    for (var i = 0; i < side; ++i) {
        row = [];
        for (var j = 0; j < side; ++j) {
            row.push(a[i * side + j]);
        }
        res.push(row);
    }
    return res;
}

/**
 * Returns random true or false
 */
function randomPick() {
    return Math.floor(Math.random() * 2) == 0;
}

/**
 * Returns randomly permuted one-dimensional array
  * @param a - initial array to make permutation of
 */
function permutation(a){
    var tmp = 0;
    for (var i = 0; i < a.length; ++i) {
        for (var j = 0; j < a.length; ++j) {
            if (i != j && randomPick()) {
                tmp = a[i];
                a[i] = a[j];
                a[j] = tmp;
            }
        }
    }
    return a;
}


/**
 * Finds {col:, row:} - position of the specified element in two dimensional array
 * return undefined if element was not found in array
 * @param elems : a two dimensional array - where to find
 * @param elemToFind : an element position of which is required
 */
function getEmptyPos(elems, elemToFind) {
    for (var i = 0; i < elems.length; ++i) {
        for (var j = 0; j < elems[i].length; ++j) {
            if (elems[i][j] == undefined) {
                return {col: j, row: i};
            }
        }
    }
    return undefined;
}


/**
 * Returns list of avaliable moves with positions
 * @param pos : position of undefined element
 */
function getAvailableMoves(pos) {
    function isValid(coords) {
        return !(coords.col < 0
              || coords.col > 2
              || coords.row < 0
              || coords.row > 2);
    }

    var acts = {
            left:  {col: pos.col + 1, row: pos.row    },
            right: {col: pos.col - 1, row: pos.row    },
            up:    {col: pos.col,     row: pos.row + 1},
            down:  {col: pos.col,     row: pos.row - 1}
        };
    for (var act in acts) {
        if (!isValid(acts[act])) {
            delete acts[act];
        }
    }
    return acts;
}

function getNewState(prevState, newEmptyPos) {
    var elems = [];
    var row;
    for (var i = 0; i < prevState.elements.length; ++i) {
        row = [];
        for (var j = 0; j < prevState.elements[i].length; ++j) {
            if (i == prevState.emptyPos.row && j == prevState.emptyPos.col) {
                row.push(prevState.elements[newEmptyPos.row][newEmptyPos.col]);
            }
            else if (i == newEmptyPos.row && j == newEmptyPos.col) {
                row.push(undefined);
            }
            else {
                row.push(prevState.elements[i][j]);
            }
        }
        elems.push(row);
    }
    return {elements: elems, emptyPos: newEmptyPos, moves: prevState.moves + 1};
}




/**
 * Checks two 2-dimensional arrays for equality of elements
 */
function sameArrays(a1, a2) {
    if (a1.length == a2.length) {
        for (var i = 0; i < a1.length; ++i) {
            if (a1[i].length == a2[i].length) {
                for (var j = 0; j < a1[i].length; ++j) {
                    if (a1[i][j] != a2[i][j]) {
                        return false;
                    }
                }
            }
            else {
                console.log(a1, a2, "Have different row lengths");
                return false;
            }
        }
    }
    else {
        console.log(a1, a2, "Have different column heights");
        return false;
    }
    return true;
}


/**
 * Makes the hash of state's elements array, considering their positions
 */
function hashState(state) { // power of 11
    var res = 0;
    var p = 1;
    for (var i = 0; i < state.elements.length; ++i) {
        for (var j = 0; j < state.elements[i].length; ++j) {
            if (state.elements[i][j] != undefined) {
                res += state.elements[i][j] * p;
            }
            p *= 11;
        }
    }
    return res;
}

function heuristic(state) { // count of elements not on their places
    var pos = {
        1: [0, 0],
        2: [0, 1],
        3: [0, 2],
        4: [1, 0],
        5: [1, 1],
        6: [1, 2],
        7: [2, 0],
        8: [2, 1]
    };

    var res = 0;
    var elems = state.elements;
    for (var i = 0; i < elems.length; ++i) {
        for (var j = 0; j < elems[i].length; ++j) {
            var num = elems[i][j];
            if (typeof num === "undefined") {
                continue;
            }
            res += Math.abs(pos[num][0] - i) + Math.abs(pos[num][1] - j);
            // if (elems[i][j] != (i * elems.length + j + 1)) {
            //     ++res;
            // }
        }
    }
    return res;
}


/**
 * Returns true, if given state of field is final, i. e. all the elements
 * are ordered and the empty element is in the right bottom corner
 * @param elems : state of field
 */
function gameEnd(state) {
    if (state.emptyPos.col != 2 || state.emptyPos.row != 2) {
        return false;
    }
    var elems = state.elements;
    var prev = 0;
    for (var i = 0; i < elems.length; ++i) {
        for (var j = 0; j < elems[i].length; ++j) {
            if ((elems[i][j] == undefined) && (prev == MAX_GAME_ELEM)
                || (elems[i][j] == prev + 1))
            {
                ++prev;
            }
            else {
                return false;
            }
        }
    }
    return true;
}



/**
 * Uses A* to find the sequence of steps to be made to win the game
 */
function findSolution(initialPos, initialEmptyPos) {
    var initialState = {
        elements: initialPos,
        emptyPos: initialEmptyPos,
        moves: 0
    };
    initialState.stateHash = hashState(initialState);
    var open = [initialState];

    var closed = []; // stateHashes of the visited states
    var predecessor = {}; // stateHash : {prevState, state, move}

    var iters = 0;

    while (open.length > 0) {
        var current = open[0];

        if (closed.find(function (el) { return el == current.stateHash; }) != undefined) { // already visited
            open.shift();
            continue;
        }

        if (current.stateHash == 169343516) {
            console.log("found");
            break;
        }

        // if (gameEnd(current)) {
        //     break;
        // }

        var moves = getAvailableMoves(current.emptyPos);

        for (var m in moves) {
            var newState = getNewState(current, moves[m]);
            newState.stateHash = hashState(newState);
            if (predecessor[newState.stateHash] != undefined) {
                // if we can get into newState for less then earlier, update the predecessor
                if (predecessor[newState.stateHash].state.moves > newState.moves) {
                    predecessor[newState.stateHash].state = newState;
                    predecessor[newState.stateHash].prevState = current;
                    predecessor[newState.stateHash].move = m;
                }
            }
            else { // if there is no such state, add newState in predecessor
                predecessor[newState.stateHash] = {prevState: current, state: newState, move: m};
            }
            open.push(newState);
        }

        closed.push(current.stateHash);
        open.shift();
        open.sort(function(s1, s2) {
            var s1score = heuristic(s1) + s1.moves;
            var s2score = heuristic(s2) + s2.moves;
            if (s1score < s2score) {
                return -1;
            }
            if (s1score > s2score) {
                return 1;
            }
            return 0;
        });

        iters++;
        if (iters > 100) {
            return [];
            window.location = window.location;
        }
    }

    // restore path
    if (current != initialState) {
        var path = [];
        while (current != initialState) {
            console.log(predecessor[current.stateHash].move);
            path.unshift(predecessor[current.stateHash].move);
            current = predecessor[current.stateHash].prevState;
        }
        return path;
    }
    else {
        return [];
    }
}
