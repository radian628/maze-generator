// index.ts
var resize = function() {
  canvas.width = WIDTH * CELLSIZE;
  canvas.height = HEIGHT * CELLSIZE;
  enabledSquares = [];
  for (let i = 0;i < HEIGHT; i++) {
    enabledSquares.push([]);
    for (let j = 0;j < WIDTH; j++) {
      enabledSquares[i].push(false);
    }
  }
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
var makeStartAndEnd = function(index) {
  const startElement = document.createElement("div");
  startElement.style.display = "none";
  startElement.className = "start-marker";
  startElement.innerText = "Start" + index;
  document.body.appendChild(startElement);
  const endElement = document.createElement("div");
  endElement.style.display = "none";
  endElement.className = "end-marker";
  endElement.innerText = "End" + index;
  document.body.appendChild(endElement);
  return {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    startElement,
    endElement
  };
};
var handleMouseAction = function() {
  const yCell = Math.floor(mousePos.y / CELLSIZE);
  const xCell = Math.floor(mousePos.x / CELLSIZE);
  let startAndEnd = mazeStartsAndEnds[Number(startEndIndexInput.value)];
  if (!startAndEnd) {
    startAndEnd = makeStartAndEnd(Number(startEndIndexInput.value));
    mazeStartsAndEnds[Number(startEndIndexInput.value)] = startAndEnd;
  }
  if (modeInput.value === "maze") {
    if (clickingCanvas.get(0)) {
      enabledSquares[yCell][xCell] = true;
      ctx.fillStyle = "black";
      ctx.fillRect(xCell * CELLSIZE, yCell * CELLSIZE, CELLSIZE, CELLSIZE);
    } else if (clickingCanvas.get(2)) {
      enabledSquares[yCell][xCell] = false;
      ctx.fillStyle = "white";
      ctx.fillRect(xCell * CELLSIZE, yCell * CELLSIZE, CELLSIZE, CELLSIZE);
    }
  } else if (modeInput.value === "set-start") {
    if (clickingCanvas.get(0)) {
      const rect = canvas.getBoundingClientRect();
      startAndEnd.startElement.style.display = "block";
      startAndEnd.startElement.style.left = `${rect.left + xCell * CELLSIZE}px`;
      startAndEnd.startElement.style.top = `${rect.top + yCell * CELLSIZE}px`;
      startAndEnd.start = { x: xCell, y: yCell };
    }
  } else {
    if (clickingCanvas.get(0)) {
      const rect = canvas.getBoundingClientRect();
      startAndEnd.endElement.style.display = "block";
      startAndEnd.endElement.style.left = `${rect.left + xCell * CELLSIZE}px`;
      startAndEnd.endElement.style.top = `${rect.top + yCell * CELLSIZE}px`;
      startAndEnd.end = { x: xCell, y: yCell };
    }
  }
};
var isSolution = function(x, y) {
  return mazeStartsAndEnds.some(({ start, end }) => start.x === x && start.y === y || end.x === x && end.y === y);
};
var createMaze = function(originalPath) {
  const maze = [];
  const height = originalPath.length;
  const width = originalPath[0].length;
  const potentialEdges = [];
  function addPotentialEdge(x, y) {
    potentialEdges.push({ x, y });
  }
  function getBranchDirections(x, y) {
    const dirs = [];
    if (maze[y - 1]?.[x] && !maze[y - 1][x].visited)
      dirs.push("up");
    if (maze[y + 1]?.[x] && !maze[y + 1][x].visited)
      dirs.push("down");
    if (maze[y]?.[x - 1] && !maze[y][x - 1].visited)
      dirs.push("left");
    if (maze[y]?.[x + 1] && !maze[y][x + 1].visited)
      dirs.push("right");
    return dirs;
  }
  for (let y = 0;y < originalPath.length; y++) {
    maze.push([]);
    for (let x = 0;x < originalPath[y].length; x++) {
      const isSolnUp = isSolution(x, y) && y === 0;
      const isSolnDown = isSolution(x, y) && y === originalPath.length - 1;
      const isSolnLeft = isSolution(x, y) && x === 0;
      const isSolnRight = isSolution(x, y) && x === originalPath[y].length - 1;
      if (originalPath[y][x]) {
        maze[y].push({
          up: originalPath[y - 1]?.[x] ?? isSolnUp,
          down: originalPath[y + 1]?.[x] ?? isSolnDown,
          left: originalPath[y]?.[x - 1] ?? isSolnLeft,
          right: originalPath[y]?.[x + 1] ?? isSolnRight,
          visited: true
        });
        addPotentialEdge(x, y);
      } else {
        maze[y].push({
          up: isSolnUp,
          down: isSolnDown,
          left: isSolnLeft,
          right: isSolnRight,
          visited: false
        });
      }
    }
  }
  while (potentialEdges.length > 0) {
    const [randEdge] = potentialEdges.splice(Math.floor(Math.random() * potentialEdges.length), 1);
    let dirs = getBranchDirections(randEdge.x, randEdge.y);
    if (dirs.length == 0)
      continue;
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
      if (dirs.length > 0)
        addPotentialEdge(x, y);
    }
  }
  return maze;
};
var drawMaze = function(maze, cellSize, ctx) {
  for (let y = 0;y < maze.length; y++) {
    for (let x = 0;x < maze[y].length; x++) {
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
  for (let y = -1;y < maze.length; y++) {
    for (let x = -1;x < maze[0].length; x++) {
      const topLeft = maze[y]?.[x];
      const bottomLeft = maze[y + 1]?.[x];
      const topRight = maze[y]?.[x + 1];
      const bottomRight = maze[y + 1]?.[x + 1];
      if ((topLeft?.right ?? true) && (topLeft?.down ?? true) && (bottomLeft?.up ?? true) && (bottomLeft?.right ?? true) && (topRight?.left ?? true) && (topRight?.down ?? true) && (bottomRight?.up ?? true) && (bottomRight?.left ?? true)) {
        const top = y * cellSize;
        const left = x * cellSize;
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(left + cellSize - 1, top + cellSize - 1, 2, 2);
      }
    }
  }
  function addSolution(mazeStartPos, mazeEndPos) {
    let connectingLineX = 0;
    let connectingLineY = 0;
    let hasConnectingLine = false;
    if (mazeStartPos.x == 0) {
      hasConnectingLine = true;
      connectingLineX = 0;
      connectingLineY = (mazeStartPos.y + 0.5) * CELLSIZE;
    } else if (mazeStartPos.x == maze[0].length - 1) {
      hasConnectingLine = true;
      connectingLineX = (mazeStartPos.x + 1) * CELLSIZE;
      connectingLineY = (mazeStartPos.y + 0.5) * CELLSIZE;
    } else if (mazeStartPos.y == 0) {
      hasConnectingLine = true;
      connectingLineX = (mazeStartPos.x + 0.5) * CELLSIZE;
      connectingLineY = 0;
    } else if (mazeStartPos.y == maze.length - 1) {
      hasConnectingLine = true;
      connectingLineX = (mazeStartPos.x + 0.5) * CELLSIZE;
      connectingLineY = (mazeStartPos.y + 1) * CELLSIZE;
    }
    if (hasConnectingLine) {
      ctx.strokeStyle = completionColorInput.value;
      ctx.beginPath();
      ctx.moveTo(Math.round(connectingLineX) + 0.5, Math.round(connectingLineY) + 0.5);
      ctx.lineTo(Math.round((mazeStartPos.x + 0.5) * CELLSIZE) + 0.5, Math.round((mazeStartPos.y + 0.5) * CELLSIZE) + 0.5);
      ctx.stroke();
    }
    const pathToExit = findPath(maze, mazeStartPos.x, mazeStartPos.y, mazeEndPos.x, mazeEndPos.y);
    let pathCell = pathToExit;
    while (pathCell) {
      if (pathCell && pathCell.prev) {
        ctx.strokeStyle = completionColorInput.value;
        ctx.beginPath();
        ctx.moveTo(Math.round((pathCell.x + 0.5) * CELLSIZE) + 0.5, Math.round((pathCell.y + 0.5) * CELLSIZE) + 0.5);
        ctx.lineTo(Math.round((pathCell.prev.x + 0.5) * CELLSIZE) + 0.5, Math.round((pathCell.prev.y + 0.5) * CELLSIZE) + 0.5);
        ctx.stroke();
      }
      pathCell = pathCell?.prev;
    }
  }
  for (const path of mazeStartsAndEnds) {
    if (!path)
      continue;
    addSolution(path.start, path.end);
  }
};
var findPath = function(maze, sx, sy, ex, ey) {
  const searchQueue = [{ x: sx, y: sy }];
  const visited = new Set;
  while (true) {
    const box = searchQueue.shift();
    if (!box)
      return;
    if (box.x == ex && box.y == ey) {
      return box;
    }
    const cell = maze[box.y][box.x];
    if (visited.has(cell))
      continue;
    visited.add(cell);
    if (cell.up && maze[box.y - 1]?.[box.x]) {
      searchQueue.push({ x: box.x, y: box.y - 1, prev: box });
    }
    if (cell.down && maze[box.y + 1]?.[box.x]) {
      searchQueue.push({ x: box.x, y: box.y + 1, prev: box });
    }
    if (cell.left && maze[box.y]?.[box.x - 1]) {
      searchQueue.push({ x: box.x - 1, y: box.y, prev: box });
    }
    if (cell.right && maze[box.y]?.[box.x + 1]) {
      searchQueue.push({ x: box.x + 1, y: box.y, prev: box });
    }
  }
};
var widthInput = document.getElementById("width-input");
var heightInput = document.getElementById("height-input");
var cellSizeInput = document.getElementById("cellsize-input");
var backgroundColorInput = document.getElementById("bg-col-input");
var edgeColorInput = document.getElementById("edge-col-input");
var completionColorInput = document.getElementById("completion-col-input");
var startEndIndexInput = document.getElementById("start-end-index");
var modeInput = document.getElementById("maze-mode");
var resizeButton = document.createElement("button");
resizeButton.innerText = "Resize/Clear";
var generateButton = document.createElement("button");
generateButton.innerText = "Generate Maze";
var downloadButton = document.createElement("button");
downloadButton.innerText = "Download Image";
var canvas = document.createElement("canvas");
canvas.style = "border: 1px solid black;";
var ctx = canvas.getContext("2d");
for (const e of [resizeButton, generateButton, downloadButton, canvas])
  document.body.appendChild(e);
var WIDTH = Number(widthInput.value);
var HEIGHT = Number(heightInput.value);
var CELLSIZE = Number(cellSizeInput.value);
var BACKGROUND_COLOR = backgroundColorInput.value;
var EDGE_COLOR = edgeColorInput.value;
var COMPLETION_COLOR = completionColorInput.value;
backgroundColorInput.addEventListener("input", (e) => {
  BACKGROUND_COLOR = backgroundColorInput.value;
});
edgeColorInput.addEventListener("input", (e) => {
  EDGE_COLOR = edgeColorInput.value;
});
completionColorInput.addEventListener("input", (e) => {
  COMPLETION_COLOR = completionColorInput.value;
});
resizeButton.addEventListener("click", (e) => {
  WIDTH = Number(widthInput.value);
  HEIGHT = Number(heightInput.value);
  CELLSIZE = Number(cellSizeInput.value);
  mazeStartsAndEnds = [];
  for (const e2 of document.querySelectorAll(".start-marker, .end-marker"))
    e2.parentElement?.removeChild(e2);
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
var enabledSquares = [];
resize();
var clickingCanvas = new Map;
var mousePos = { x: 0, y: 0 };
var mazeStartsAndEnds = [];
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
  for (const key of clickingCanvas.keys())
    clickingCanvas.delete(key);
});
canvas.addEventListener("mousemove", (e) => {
  mousePos = { x: e.offsetX, y: e.offsetY };
  handleMouseAction();
});
