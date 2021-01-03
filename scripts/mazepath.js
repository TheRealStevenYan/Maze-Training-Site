import Cell from "./cell.js";
import Maze from "./maze.js";


/**
 * Represents a path through a maze. A path is an ordered list of cells satisfying the following:
 * 1. Any two cells adjacent to each other in the path are adjacent in the maze.
 * 2. There are no duplicate cells.
 * 3. Every cell in the path is an open cell and is in the maze.
 */
export default class MazePath {
    /**
     * Constructs an empty path through the given maze.
     *
     * @param {Maze} maze the maze that the path will travel through
     */
    constructor(maze) {
        this.maze = maze;
        this.path = [];
        this.cellPositions = new Array(maze.getRows()).fill(-1).map(() => new Array(maze.getColumns()).fill(-1));
    }

    /**
     * Appends the given cell to this maze path if all of the following are true:
     * 1. The cell is not already on the path.
     * 2. The cell is open.
     * 3. The cell is in the same maze that this path travels through.
     * 4. The last element of the path is a neighbouring cell.
     *
     * If the conditions are not all satisfied, then the function does not change the path.
     *
     * If the maze path changes, all cells affected are re-rendered.
     *
     * @param {Cell} cell the cell to add to this maze path
     */
    add(cell) {
        if (cell && cell.maze === this.maze && cell.isOpen()) {
            const drawer = this.maze.getMazeDrawer();

            if (this.path.length === 0) {
                this.cellPositions[cell.getRow()][cell.getColumn()] = 0;
                this.path.push(cell);
                drawer.drawEllipse(cell.getRow(), cell.getColumn());
            } else if (this.cellPositions[cell.getRow()][cell.getColumn()] === -1) {
                const cellNeighbours = cell.getNeighbours();
                const lastCell = this.path[this.path.length - 1];

                for (let i = 0; i < cellNeighbours.length; i++) {
                    const curr = cellNeighbours[i];

                    if (curr === lastCell) {
                        this.cellPositions[cell.getRow()][cell.getColumn()] = this.path.length;
                        this.path.push(cell);

                        drawer.drawCell(lastCell.getRow(), lastCell.getColumn(), this);
                        drawer.drawCell(cell.getRow(), cell.getColumn(), this);

                        break;
                    }
                }
            }
        }
    }

    /**
     * Removes the given cell and all cells that come after it from this maze path.
     * If the cell is not on the path, does nothing.
     *
     * The cell coming before the given cell in this maze path is re-rendered.
     *
     * @param {Cell} cell the cell to remove from this maze path
     */
    remove(cell) {
        if (cell && cell.maze === this.maze) {
            const drawer = this.maze.getMazeDrawer();
            const position = this.cellPositions[cell.getRow()][cell.getColumn()];

            if (position !== -1) {
                for (let i = position; i < this.path.length; i++) {
                    const currentCell = this.path[i];
                    this.cellPositions[currentCell.getRow()][currentCell.getColumn()] = -1;

                    // We omit the maze path from the function arguments because we are
                    // removing currentCell from the path, so we do not want currentCell
                    // to be rendered with a path.
                    drawer.drawCell(currentCell.getRow(), currentCell.getColumn(), this);
                }

                this.path.length = position;

                const lastCell = this.path[this.path.length - 1];
                drawer.drawCell(lastCell.getRow(), lastCell.getColumn(), this);
            }
        }
    }

    /**
     * Returns the position of the given cell in this maze path. If the cell is
     * not on the path, returns -1.
     *
     * @param {Cell} cell the cell whose position we want
     */
    getPosition(cell) {
        if (cell.maze === this.maze) {
            return this.cellPositions[cell.getRow()][cell.getColumn()];
        }

        return -1;
    }

    /**
     * Returns the cell at the given position in this maze path. Returns null
     * if there is no cell at the given position.
     *
     * @param {number} position the position of the cell to get
     */
    getCell(position) {
        if (0 <= position && position < this.path.length) {
            return this.path[position];
        }

        return null;
    }

    /**
     * Returns the number of cells on this maze path.
     */
    getLength() {
        return this.path.length;
    }

    /**
     * Returns true if the given cell is in this maze path; false otherwise.
     *
     * @param {Cell} cell the cell to check
     */
    isInPath(cell) {
        return this.getPosition(cell) !== -1;
    }

    /**
     * Returns true if this maze path is a valid path from the top-left corner to the
     * bottom-right corner of the maze; false otherwise.
     */
    isComplete() {
        for (let i = 0; i < this.path.length - 1; i++) {
            const cell = this.path[i];

            if (!cell.isOpen() || !cell.isNeighbour(this.path[i + 1])) {
                return false;
            }
        }

        const lastCell = this.path[this.path.length - 1];
        return lastCell.isOpen() && lastCell === this.maze.getCell(this.maze.getRows() - 1, this.maze.getColumns() - 1);
    }
}
