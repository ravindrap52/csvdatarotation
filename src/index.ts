import { createReadStream } from 'fs';
import { parseStream, format } from 'fast-csv';

interface csvData {
  id: string;
  json: string;
}

const isSquare = (length: number): boolean =>
  Number.isInteger(Math.sqrt(length)) ? true : false;

function readFile() {
  // reading the arguments
  const [, , file] = process.argv;
  const stream = createReadStream(file);
  const stdoutStream = format({ delimiter: '\t', headers: true, quoteHeaders: true });
  stdoutStream.pipe(process.stdout);
  parseStream(stream, { headers: true })
    .on('error', (error) => console.error(error))
    .on('data', (row: csvData) => {
      const { id, json } = row;
      try {
        const jsonData: Array<number> = JSON.parse(json);
        // if the number is square then rotate the data
        // if not then show empty array
        if (isSquare(jsonData.length)) {
          const rotatedCsvData = parseCsvRow(jsonData);
          stdoutStream.write({ id, json: rotatedCsvData, isValid: true });
        } else {
          stdoutStream.write({ id, json: '[]', isValid: false });
        }
      } catch (error) {
        console.log(error);
      }
    })
    .on('end', (rowCount: number) => {});
}

function parseCsvRow(jsonData: Array<number>): Array<number> {
  const sizeOfTheMatrix = Math.sqrt(jsonData.length);
  const matrix = convertListToMatrix(jsonData, sizeOfTheMatrix);
  const table = rotateTable(matrix, sizeOfTheMatrix).flat();
  return table;
}

function convertListToMatrix(list: Array<number>, size: number): number[][] {
  return Array.from({ length: Math.ceil(list.length / size) }, (elem, index) =>
    list.slice(index * size, index * size + size)
  );
}

function rotateTable(matrix: number[][], matrixSize: number): number[][] {
  let row: number = 0;
  let col: number = 0;
  let previous: number = 0;
  let current: number = 0;
  let rowEndIndex: number = matrixSize;
  let columnEndIndex: number = matrixSize;

  /*
  row - Starting row index
  col - starting column index
  */
  while (row < rowEndIndex && col < columnEndIndex) {
    if (row + 1 === rowEndIndex || col + 1 === columnEndIndex) break;

    // replace the first element of current row with first element of next row
    previous = matrix[row + 1][col];

    // firstrow, moving elements by 1 position
    for (let i = col; i < columnEndIndex; i++) {
      current = matrix[row][i];
      matrix[row][i] = previous;
      previous = current;
    }
    row++;
    // last column, moving elements by 1 position
    for (let i = row; i < rowEndIndex; i++) {
      current = matrix[i][columnEndIndex - 1];
      matrix[i][columnEndIndex - 1] = previous;
      previous = current;
    }
    columnEndIndex--;

    // last row, moving elements by 1 position
    if (row < rowEndIndex) {
      for (let i = columnEndIndex - 1; i >= col; i--) {
        current = matrix[rowEndIndex - 1][i];
        matrix[rowEndIndex - 1][i] = previous;
        previous = current;
      }
    }
    rowEndIndex--;

    // first column, moving elements by 1 position
    if (col < columnEndIndex) {
      for (let i = rowEndIndex - 1; i >= row; i--) {
        current = matrix[i][col];
        matrix[i][col] = previous;
        previous = current;
      }
    }
    col++;
  }
  return matrix;
}

readFile();
