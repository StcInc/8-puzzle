window.onload = function () {
    var canvas = document.getElementById('canvas'),
        context = canvas.getContext("2d"),
        width = canvas.width = window.innerWidth,
        height = canvas.height = window.innerHeight,
        positions = [
            [1, 2,         3],
            [4, undefined, 6],
            [7, 8,         9]
        ],
        field = createField(context, width, height, window.requestAnimationFrame);

    field.draw(positions);


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
        return !(coords[0] < 0 || coords[0] > 2 || coords[1] < 0 || coords[1] > 2);
    }

    function isOposite(a, b) {
        console.log(JSON.stringify(a), JSON.stringify(b));
        var res =  a == "left" && b == "right" || a == "right" && b == "left" || a == "up" && b == "down" || a == "down" && b == "up";
        console.log(res);
        return res;
    }

    function onFinished(elems, freeCol, freeRow, prev) {
        var acts = {
            left:  [freeCol + 1, freeRow    ],
            right: [freeCol - 1, freeRow    ],
            up:    [freeCol,     freeRow + 1],
            down:  [freeCol,     freeRow - 1]
        },
        funs = [];


        for (var fun in acts) {
            if (isValid(acts[fun]) && !isOposite(fun, prev)) {
                funs.push(fun);
            }
        }


        var res = select(funs);
        // console.log(acts, funs, res);
        switch (res) {
            case "left":
                field.moveLeft(elems, acts.left[0], acts.left[1], onFinished);
                break;
            case "right":
                field.moveRight(elems, acts.right[0], acts.right[1], onFinished);
                break;
            case "up":
                field.moveUp(elems, acts.up[0], acts.up[1], onFinished);
                break;
            case "down":
                field.moveDown(elems, acts.down[0], acts.down[1], onFinished);
                break;
            default:
                console.log(funs);
                break;
        }


    }

    field.moveLeft(positions, 2, 1, onFinished);
};

window.addEventListener('resize', function(event){
    window.onload();
});

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
                    this.drawTile(this.getTileX(j), this.getTileY(i), elems[i][j]);
                }
            }
        }
    },

    /**
     * Animates the movement of element at given position left
     * @param elems : array of positions
     * @param col   : element's column
     * @param row   : element's row
     * @param onFinish : callback, taking resulting array of elements, free col and row, previous move,
     *   that will be called after animations is done
     */
    moveLeft : function (elems, col, row, onFinish) {
        var targetX = this.getTileX(col - 1),
        step = this.TILE_SIDE / this.PART_SEGM_AMOUNT;

        this.move(elems, col, row, -step, 0,
            function (x, y) { // has finished
                return x <= targetX;
            },
            function (text) { // onFinish
                elems[row][col-1] = text;
                f.draw(elems);
                onFinish(elems, col, row, "left");
            });
    },



    /**
     * Animates the movement of element at given position right
     * @param elems    : array of positions
     * @param col      : element's column
     * @param row      : element's row
     * @param onFinish : callback, taking resulting array of elements, free col and row, previous move
     *   that will be called after animations is done
     */
    moveRight : function (elems, col, row, onFinish) {
        var targetX = this.getTileX(col + 1),
        step = this.TILE_SIDE / this.PART_SEGM_AMOUNT;

        this.move(elems, col, row, step, 0,
            function (x, y) { // has finished
                return x >= targetX;
            },
            function (text) { // onFinish
                elems[row][col+1] = text;
                f.draw(elems);
                onFinish(elems, col, row, "right");
            });
    },

    /**
     * Animates the movement of element at given position up
     * @param elems : array of positions
     * @param col   : element's column
     * @param row   : element's row
     * @param onFinish : callback, taking resulting array of elements, free col and row, previous move,
     *   that will be called after animations is done
     */
    moveUp : function (elems, col, row, onFinish) {
        var targetY = this.getTileY(row - 1),
        step = this.TILE_SIDE / this.PART_SEGM_AMOUNT;

        this.move(elems, col, row, 0, -step,
            function (x, y) { // has finished
                return y <= targetY;
            },
            function (text) { // onFinish
                elems[row - 1][col] = text;
                f.draw(elems);
                onFinish(elems, col, row, "up");
            });
    },


    /**
     * Animates the movement of element at given position down
     * @param elems : array of positions
     * @param col   : element's column
     * @param row   : element's row
     * @param onFinish : callback, taking resulting array of elements free col and row, previous move,
     *   that will be called after animations is done
     */
    moveDown : function (elems, col, row, onFinish) {
        var targetY = this.getTileY(row + 1),
        step = this.TILE_SIDE / this.PART_SEGM_AMOUNT;

        this.move(elems, col, row, 0, step,
            function (x, y) { // has finished
                return y >= targetY;
            },
            function (text) { // onFinish
                elems[row + 1][col] = text;
                f.draw(elems);
                onFinish(elems, col, row, "down");
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
        ctx.fillStyle = "#1565C0";
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
