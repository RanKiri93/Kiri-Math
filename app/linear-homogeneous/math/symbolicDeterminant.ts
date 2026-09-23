import { safeSimplifyDeterminant } from "./symbolicSimplify";

/**
 * Exact symbolic determinant for square matrices up to 4×4.
 * Entries are nerdamer-compatible expression strings.
 */
export function symbolicDeterminant(matrix: string[][]): string {
  const order = matrix.length;
  if (order === 0) {
    throw new Error("symbolicDeterminant: empty matrix");
  }
  if (matrix.some((row) => row.length !== order)) {
    throw new Error("symbolicDeterminant: matrix must be square");
  }
  if (order > 4) {
    throw new Error("symbolicDeterminant: only matrices up to 4×4 are supported");
  }

  return safeSimplifyDeterminant(determinantRaw(matrix));
}

function determinantRaw(matrix: string[][]): string {
  const order = matrix.length;
  if (order === 1) {
    return `(${matrix[0][0]})`;
  }
  if (order === 2) {
    const [[a, b], [c, d]] = matrix;
    return `((${a})*(${d})-(${b})*(${c}))`;
  }

  // Laplace expansion along the first row.
  const terms: string[] = [];
  for (const column of matrix[0].keys()) {
    const minor = deleteRowAndColumn(matrix, 0, column);
    const cofactor = determinantRaw(minor);
    const sign = column % 2 === 0 ? "+" : "-";
    terms.push(`${sign}((${matrix[0][column]})*(${cofactor}))`);
  }
  return `(${terms.join("")})`;
}

function deleteRowAndColumn(matrix: string[][], rowIndex: number, columnIndex: number): string[][] {
  return matrix
    .filter((_, index) => index !== rowIndex)
    .map((row) => row.filter((_, index) => index !== columnIndex));
}
