import Cell from "./cell.js";
import MazeDrawer from "./mazedrawer.js";
import PriorityQueue from "./priorityqueue.js";


/**
 * Represents a maze rendered in an HTML canvas element.
 */
export default class Maze {
    /**
     * Constructs a 2D maze with the given dimensions. The total size of the maze (equal
     * to the product of rows and columns) must be at least 1 and at most 2^31 - 1.
     *
     * @param {number} rows the number of rows in the maze
     * @param {number} columns the number of columns in the maze
     * @param {HTMLCanvasElement} canvasElement the canvas element that this maze will be rendered on
     */
    constructor(rows, columns, canvasElement) {
        if (rows > Math.floor(2147483647 / columns)) {
            throw new Error("Maze size is too large.");
        } else if (rows * columns === 0) {
            throw new Error("One of rows and columns is 0.");
        }

        this.rows = rows;
        this.columns = columns;
        this.board = this.initBoard();
        this.generateMaze();
        this.mazeDrawer = new MazeDrawer(this, canvasElement);
    }

    /**
     * Initializes and returns the maze board. Each element is initialized to an open cell, except:
     * - all cells in odd-indexed rows are closed, excluding the last row
     * - all cells in odd-indexed columns are closed, excluding the last column
     */
    initBoard() {
        let board = [];

        for (let i = 0; i < this.rows; i++) {
            let row = [];

            if (i % 2 === 0 || i === this.rows - 1) {
                for (let j = 0; j < this.columns; j++) {
                    if (j % 2 === 0 || j === this.columns - 1) {
                        row.push(new Cell(i, j, true, this));
                    } else {
                        row.push(new Cell(i, j, false, this));
                    }
                }
            } else {
                for (let j = 0; j < this.columns; j++) {
                    row.push(new Cell(i, j, false, this));
                }
            }

            board.push(row);
        }

        return board;
    }

    /**
     * Returns true if the cell at (row, column) is open; false otherwise.
     *
     * @param {number} row the row of the cell
     * @param {number} column the column of the cell
     */
    isOpen(row, column) {
        return this.board[row][column].isOpen();
    }

    /**
     * Generates a random maze using Prim's algorithm. The generated maze is stored in
     * this.board, a 2D boolean array of cells.
     */
    generateMaze() {
        /**
         * Puts each number from 0 to this.rows * this.columns - 1 into a random spot
         * in a 2D array with the same dimensions as the maze board. The function
         * then returns the 2D array.
         */
        const generateWeights = (function () {
            // We use the Fisher-Yates shuffle.
            let weights = [];

            for (let i = 0; i < this.rows; i++) {
                let currentRow = [];
                for (let j = 0; j < this.columns; j++) {
                    currentRow.push(i * this.columns + j);
                }
                weights.push(currentRow);
            }

            for (let i = this.rows * this.columns - 1; i >= 0; i--) {
                const row = Math.floor(i / this.columns);
                const column = i % this.columns;

                // rand is a random number between 0 and i inclusive.
                const rand = Math.floor(Math.random() * (i + 1));
                const randRow = Math.floor(rand / this.columns);
                const randColumn = rand % this.columns;

                const temp = weights[row][column];
                weights[row][column] = weights[randRow][randColumn];
                weights[randRow][randColumn] = temp;
            }

            return weights;
        }).bind(this);

        /**
         * Inserts the walls adjacent to the given cell into the priority queue.
         *
         * @param {Cell} cell the cell whose adjacent walls we want to insert into the priority queue
         * @param {PriorityQueue} pq the priority queue being used by the maze generator
         * @param {number[][]} weights the weights of each cell in the maze
         */
        const updatePQ = (function (cell, pq, weights) {
            let neighbours = this.neighbours(cell);

            for (let i = 0; i < neighbours.length; i++) {
                let cell = neighbours[i];

                if (!cell.isOpen()) {
                    pq.insert(cell, weights[cell.row][cell.column]);
                }
            }
        }).bind(this);

        let weights = generateWeights();
        let pq = new PriorityQueue();
        let visited = new Array(this.rows).fill(false).map(() => new Array(this.columns).fill(false));

        visited[0][0] = true;
        updatePQ(this.board[0][0], pq, weights);

        while (pq.size() !== 0) {
            let wall = pq.removeMin();
            let neighbours = this.neighbours(wall);
            let nextCell;

            for (let i = 0; i < neighbours.length; i++) {
                if (!visited[neighbours[i].getRow()][neighbours[i].getColumn()] && neighbours[i].isOpen()) {
                    // This if block runs at most once during the loop's execution.
                    // A wall joins exactly two open cells, and one of those cells must have
                    // been visited. Hence, at most one adjacent open cell is unvisited.
                    nextCell = neighbours[i];
                    break;
                }
            }

            // If nextCell is not undefined, then the if block in the for loop above must have run.
            // That means there is an open, unvisited cell adjacent to the wall. Hence, we should
            // remove the wall. 
            //
            // If nextCell is undefined, then both open cells adjacent to the wall have been visited. 
            // In this case, there is a 3% that we remove the wall, creating a cycle in the maze.
            if (nextCell !== undefined) {
                wall.setOpen(true);
                visited[wall.getRow()][wall.getColumn()] = true;
                visited[nextCell.getRow()][nextCell.getColumn()] = true;
                updatePQ(nextCell, pq, weights);
            } else if (Math.random() <= 0.03) {
                wall.setOpen(true);
                visited[wall.getRow()][wall.getColumn()] = true;
            }
        }
    }

    /**
     * Returns all valid neighbours of the given cell in this.board. The neighbours of
     * a cell are the cells exactly 1 unit above, below, to the left, and to the right
     * of the cell.
     *
     * @param {Cell} cell the cell whose neighbours we want
     */
    neighbours(cell) {
        let result = [];
        let row = cell.getRow();
        let column = cell.getColumn();

        for (let i = -1; i <= 1; i += 2) {
            if (0 <= row + i && row + i <= this.rows - 1) {
                result.push(this.board[row + i][column]);
            }

            if (0 <= column + i && column + i <= this.columns - 1) {
                result.push(this.board[row][column + i]);
            }
        }

        return result;
    }

    /**
     * Returns the number of rows in this maze.
     */
    getRows() {
        return this.rows;
    }

    /**
     * Returns the number of columns in this maze.
     */
    getColumns() {
        return this.columns;
    }

    /**
     * Returns the MazeDrawer object that renders this maze.
     */
    getMazeDrawer() {
        return this.mazeDrawer;
    }

    /**
     * Returns the cell at the given row and column in this maze, assuming
     * that the row and column are in the bounds of the maze board. If that
     * assumption is not true, returns null.
     *
     * @param {number} row the row of the cell to get
     * @param {number} column the column of the cell to get
     */
    getCell(row, column) {
        if (0 <= row && row < this.rows) {
            if (0 <= column && column < this.columns) {
                return this.board[row][column];
            }
        }

        return null;
    }

    /**
     * Renders this maze onto the canvas element associated with this maze.
     */
    render() {
        this.mazeDrawer.drawMaze();
    }
}