import { createReadStream } from 'fs';
import { parseStream, format } from 'fast-csv';

function readFile() {
  const [, , file] = process.argv;
  const stream = createReadStream(file);
  const stdoutStream = format({ delimiter: '\t', headers: true });
  stdoutStream.pipe(process.stdout);
  parseStream(stream, { headers: true })
    .on('error', (error) => console.error(error))
    .on('data', (row) => {
      const { id, json } = row;
      const jsonData = JSON.parse(json);
      if (isSquare(jsonData.length)) {
        const matrix = convertListToMatrix(jsonData, Math.sqrt(jsonData.length));
        const table = rotateTable(matrix, Math.sqrt(jsonData.length), Math.sqrt(jsonData.length)).flat();
        stdoutStream.write({ id, json: table, isValid: true });
      } else {
        stdoutStream.write({ id, json: "[]", isValid: false });
      }
    })
    .on('end', (rowCount: number) => {});
}

function isSquare(length: number): boolean {
  return Number.isInteger(Math.sqrt(length)) ? true : false;
}
function convertListToMatrix(list: Array<number>, size: number): number[][] {
  const matrix = Array.from(
    { length: Math.ceil(list.length / size) },
    (elem, index) => list.slice(index * size, index * size + size)
  );
  return matrix;
}

function rotateTable(list: number[][], m: number, n: number): number[][] {
  let row = 0,
    col = 0;
  let previous, current;

  /*
  row - Starting row index
  m - ending row index
  col - starting column index
  n - ending column index
  */
  while (row < m && col < n) {
    if (row + 1 === m || col + 1 === n) break;

    // replace the first element of current row with first element of next row
    previous = list[row + 1][col];

    // Move elements of first row
    // from the remaining rows
    for (let i = col; i < n; i++) {
      current = list[row][i];
      list[row][i] = previous;
      previous = current;
    }
    row++;
    // Move elements of last column
    // from the remaining columns
    for (let i = row; i < m; i++) {
      current = list[i][n - 1];
      list[i][n - 1] = previous;
      previous = current;
    }
    n--;

    // Move elements of last row
    // from the remaining rows
    if (row < m) {
      for (let i = n - 1; i >= col; i--) {
        current = list[m - 1][i];
        list[m - 1][i] = previous;
        previous = current;
      }
    }
    m--;

    // Move elements of first column
    // from the remaining rows
    if (col < n) {
      for (let i = m - 1; i >= row; i--) {
        current = list[i][col];
        list[i][col] = previous;
        previous = current;
      }
    }
    col++;
  }
  return list;
}

readFile();
