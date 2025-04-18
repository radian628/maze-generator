const widthInput = document.getElementById("width-input")! as HTMLInputElement;
const heightInput = document.getElementById(
  "height-input"
)! as HTMLInputElement;
const cellSizeInput = document.getElementById(
  "cellsize-input"
)! as HTMLInputElement;
const backgroundColorInput = document.getElementById(
  "bg-col-input"
) as HTMLInputElement;
const edgeColorInput = document.getElementById(
  "edge-col-input"
) as HTMLInputElement;
const resizeButton = document.createElement("button");
resizeButton.innerText = "Resize/Clear";
const generateButton = document.createElement("button");
generateButton.innerText = "Generate Maze";
const downloadButton = document.createElement("button");
downloadButton.innerText = "Download Image";
const canvas = document.createElement("canvas");
canvas.style = "border: 1px solid black;";
const ctx = canvas.getContext("2d")!;

for (const e of [resizeButton, generateButton, downloadButton, canvas])
  document.body.appendChild(e);

type Cell = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  visited: boolean;
};
type Maze = Cell[][];
let WIDTH = Number(widthInput.value);
let HEIGHT = Number(heightInput.value);
let CELLSIZE = Number(cellSizeInput.value);
let BACKGROUND_COLOR = backgroundColorInput.value;
let EDGE_COLOR = edgeColorInput.value;

backgroundColorInput.addEventListener("input", (e) => {
  BACKGROUND_COLOR = backgroundColorInput.value;
});
edgeColorInput.addEventListener("input", (e) => {
  EDGE_COLOR = edgeColorInput.value;
});

resizeButton.addEventListener("click", (e) => {
  WIDTH = Number(widthInput.value);
  HEIGHT = Number(heightInput.value);
  CELLSIZE = Number(cellSizeInput.value);
  resize();
});

generateButton.addEventListener("click", (e) => {
  const maze = createMaze(enabledSquares);
  drawMaze(maze, CELLSIZE, ctx);
});

downloadButton.addEventListener("click", (e) => {
  const img = canvas.toDataURL("image/png", 1);
  const a = document.createElement("a");
  a.href = img;
  a.download = `maze_${WIDTH}x${HEIGHT}.png`;
  a.click();
});

let enabledSquares: boolean[][] = [];

function resize() {
  canvas.width = WIDTH * CELLSIZE;
  canvas.height = HEIGHT * CELLSIZE;
  enabledSquares = [];
  for (let i = 0; i < HEIGHT; i++) {
    enabledSquares.push([]);
    for (let j = 0; j < WIDTH; j++) {
      enabledSquares[i].push(false);
    }
  }
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

resize();

let clickingCanvas = new Map<number, boolean>();
let mousePos = { x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  clickingCanvas.set(e.button, true);
  e.preventDefault();
  mousePos = { x: e.offsetX, y: e.offsetY };
  handleMouseAction();
  return false;
});
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  return false;
});
canvas.addEventListener("mouseup", (e) => {
  for (const key of clickingCanvas.keys()) clickingCanvas.delete(key);
});
canvas.addEventListener("mousemove", (e) => {
  mousePos = { x: e.offsetX, y: e.offsetY };
  handleMouseAction();
});

function handleMouseAction() {
  const yCell = Math.floor(mousePos.y / CELLSIZE);
  const xCell = Math.floor(mousePos.x / CELLSIZE);
  if (clickingCanvas.get(0)) {
    enabledSquares[yCell][xCell] = true;
    ctx.fillStyle = "black";
    ctx.fillRect(xCell * CELLSIZE, yCell * CELLSIZE, CELLSIZE, CELLSIZE);
  } else if (clickingCanvas.get(2)) {
    enabledSquares[yCell][xCell] = false;
    ctx.fillStyle = "white";
    ctx.fillRect(xCell * CELLSIZE, yCell * CELLSIZE, CELLSIZE, CELLSIZE);
  }
}

function createMaze(originalPath: boolean[][]) {
  const maze: Maze = [];
  const height = originalPath.length;
  const width = originalPath[0].length;

  const potentialEdges: { x: number; y: number }[] = [];

  function addPotentialEdge(x: number, y: number) {
    potentialEdges.push({ x, y });
  }

  function getBranchDirections(x: number, y: number) {
    const dirs: string[] = [];
    if (maze[y - 1]?.[x] && !maze[y - 1][x].visited) dirs.push("up");
    if (maze[y + 1]?.[x] && !maze[y + 1][x].visited) dirs.push("down");
    if (maze[y]?.[x - 1] && !maze[y][x - 1].visited) dirs.push("left");
    if (maze[y]?.[x + 1] && !maze[y][x + 1].visited) dirs.push("right");
    return dirs;
  }

  for (let y = 0; y < originalPath.length; y++) {
    maze.push([]);
    for (let x = 0; x < originalPath[y].length; x++) {
      if (originalPath[y][x]) {
        maze[y].push({
          up: originalPath[y - 1]?.[x] ?? true,
          down: originalPath[y + 1]?.[x] ?? true,
          left: originalPath[y]?.[x - 1] ?? true,
          right: originalPath[y]?.[x + 1] ?? true,
          visited: true,
        });
        addPotentialEdge(x, y);
      } else {
        maze[y].push({
          up: false,
          down: false,
          left: false,
          right: false,
          visited: false,
        });
      }
    }
  }

  while (potentialEdges.length > 0) {
    const [randEdge] = potentialEdges.splice(
      Math.floor(Math.random() * potentialEdges.length),
      1
    );

    let dirs = getBranchDirections(randEdge.x, randEdge.y);
    if (dirs.length == 0) continue;
    potentialEdges.push(randEdge);
    let x = randEdge.x;
    let y = randEdge.y;

    while (dirs.length > 0) {
      const randDir = dirs[Math.floor(Math.random() * dirs.length)];

      if (randDir == "up") {
        maze[y][x].up = true;
        y--;
        maze[y][x].down = true;
      } else if (randDir == "down") {
        maze[y][x].down = true;
        y++;
        maze[y][x].up = true;
      } else if (randDir == "left") {
        maze[y][x].left = true;
        x--;
        maze[y][x].right = true;
      } else if (randDir == "right") {
        maze[y][x].right = true;
        x++;
        maze[y][x].left = true;
      }

      maze[y][x].visited = true;
      dirs = getBranchDirections(x, y);
      if (dirs.length > 0) addPotentialEdge(x, y);
    }
  }

  return maze;
}

function drawMaze(maze: Maze, cellSize: number, ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      const top = y * cellSize;
      const left = x * cellSize;
      ctx.fillStyle = EDGE_COLOR;
      ctx.fillRect(left, top, cellSize, cellSize);
      ctx.fillStyle = BACKGROUND_COLOR;
      if (maze[y][x].up) {
        ctx.fillRect(left + 1, top, cellSize - 2, cellSize - 1);
      }
      if (maze[y][x].down) {
        ctx.fillRect(left + 1, top + 1, cellSize - 2, cellSize - 1);
      }
      if (maze[y][x].left) {
        ctx.fillRect(left, top + 1, cellSize - 1, cellSize - 2);
      }
      if (maze[y][x].right) {
        ctx.fillRect(left + 1, top + 1, cellSize - 1, cellSize - 2);
      }
    }
  }

  for (let y = -1; y < maze.length; y++) {
    for (let x = -1; x < maze[0].length; x++) {
      const topLeft = maze[y]?.[x];
      const bottomLeft = maze[y + 1]?.[x];
      const topRight = maze[y]?.[x + 1];
      const bottomRight = maze[y + 1]?.[x + 1];
      if (
        (topLeft?.right ?? true) &&
        (topLeft?.down ?? true) &&
        (bottomLeft?.up ?? true) &&
        (bottomLeft?.right ?? true) &&
        (topRight?.left ?? true) &&
        (topRight?.down ?? true) &&
        (bottomRight?.up ?? true) &&
        (bottomRight?.left ?? true)
      ) {
        const top = y * cellSize;
        const left = x * cellSize;
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(left + cellSize - 1, top + cellSize - 1, 2, 2);
      }
    }
  }
}
