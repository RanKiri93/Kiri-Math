import "./nerdamerConfig";

export type FormulaAst =
  | { type: "number"; value: string }
  | { type: "variable"; name: "x" }
  | { type: "constant"; name: "e" | "pi" }
  | { type: "unary"; op: "-"; argument: FormulaAst }
  | { type: "binary"; op: "+" | "-" | "*" | "/" | "^"; left: FormulaAst; right: FormulaAst }
  | { type: "function"; name: FormulaFunctionName; argument: FormulaAst };

export type FormulaFunctionName = "exp" | "ln" | "log" | "sin" | "cos" | "tan" | "cot" | "sqrt";

export type ParsedFormula = {
  ast: FormulaAst;
  nerdamer: string;
  latex: string;
};

type Token =
  | { type: "number"; value: string }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: "+" | "-" | "*" | "/" | "^" }
  | { type: "paren"; value: "(" | ")" }
  | { type: "end"; value: "" };

const allowedFunctions = new Set<FormulaFunctionName>([
  "exp",
  "ln",
  "log",
  "sin",
  "cos",
  "tan",
  "cot",
  "sqrt",
]);

export function parseFormula(input: string): ParsedFormula {
  const parser = new FormulaParser(tokenize(input));
  const ast = parser.parse();
  const normalizedAst = normalizeAst(ast);

  return {
    ast: normalizedAst,
    nerdamer: toNerdamer(normalizedAst),
    latex: toLatex(ast),
  };
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      const start = index;
      let dotCount = char === "." ? 1 : 0;
      index += 1;

      while (index < input.length && /[0-9.]/.test(input[index])) {
        if (input[index] === ".") dotCount += 1;
        index += 1;
      }

      const value = input.slice(start, index);
      if (dotCount > 1 || value === ".") {
        throw new Error("Invalid number");
      }

      tokens.push({ type: "number", value });
      continue;
    }

    if (/[A-Za-z]/.test(char)) {
      const start = index;
      index += 1;
      while (index < input.length && /[A-Za-z]/.test(input[index])) {
        index += 1;
      }
      tokens.push({ type: "identifier", value: input.slice(start, index).toLowerCase() });
      continue;
    }

    if (char === "+" || char === "-" || char === "*" || char === "/" || char === "^") {
      tokens.push({ type: "operator", value: char });
      index += 1;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
      index += 1;
      continue;
    }

    throw new Error("Unsupported character");
  }

  tokens.push({ type: "end", value: "" });
  return tokens;
}

class FormulaParser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): FormulaAst {
    const expression = this.parseAdditive();
    if (this.peek().type !== "end") {
      throw new Error("Unexpected token");
    }
    return expression;
  }

  private parseAdditive(): FormulaAst {
    let left = this.parseMultiplicative();

    while (this.matchOperator("+") || this.matchOperator("-")) {
      const operator = this.previous().value as "+" | "-";
      const right = this.parseMultiplicative();
      left = { type: "binary", op: operator, left, right };
    }

    return left;
  }

  private parseMultiplicative(): FormulaAst {
    let left = this.parsePower();

    while (this.matchOperator("*") || this.matchOperator("/")) {
      const operator = this.previous().value as "*" | "/";
      const right = this.parsePower();
      left = { type: "binary", op: operator, left, right };
    }

    return left;
  }

  private parsePower(): FormulaAst {
    const left = this.parseUnary();

    if (this.matchOperator("^")) {
      const right = this.parsePower();
      return { type: "binary", op: "^", left, right };
    }

    return left;
  }

  private parseUnary(): FormulaAst {
    if (this.matchOperator("-")) {
      return { type: "unary", op: "-", argument: this.parseUnary() };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): FormulaAst {
    const token = this.advance();

    if (token.type === "number") {
      return { type: "number", value: token.value };
    }

    if (token.type === "identifier") {
      if (token.value === "x") {
        return { type: "variable", name: "x" };
      }

      if (token.value === "e") {
        return { type: "constant", name: "e" };
      }

      if (token.value === "pi") {
        return { type: "constant", name: "pi" };
      }

      if (!allowedFunctions.has(token.value as FormulaFunctionName)) {
        throw new Error("Unsupported function");
      }

      this.consumeParen("(");
      const argument = this.parseAdditive();
      this.consumeParen(")");
      return { type: "function", name: token.value as FormulaFunctionName, argument };
    }

    if (token.type === "paren" && token.value === "(") {
      const expression = this.parseAdditive();
      this.consumeParen(")");
      return expression;
    }

    throw new Error("Expected expression");
  }

  private matchOperator(value: "+" | "-" | "*" | "/" | "^"): boolean {
    const token = this.peek();
    if (token.type === "operator" && token.value === value) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private consumeParen(value: "(" | ")"): void {
    const token = this.advance();
    if (token.type !== "paren" || token.value !== value) {
      throw new Error("Expected parenthesis");
    }
  }

  private advance(): Token {
    const token = this.peek();
    this.index += 1;
    return token;
  }

  private previous(): Token {
    return this.tokens[this.index - 1];
  }

  private peek(): Token {
    return this.tokens[this.index];
  }
}

function normalizeAst(ast: FormulaAst): FormulaAst {
  if (ast.type === "binary") {
    const left = normalizeAst(ast.left);
    const right = normalizeAst(ast.right);
    // Keep Euler exact: e^f is Exp(f), never Pow(Number(Math.E), f).
    if (ast.op === "^" && left.type === "constant" && left.name === "e") {
      return { type: "function", name: "exp", argument: right };
    }
    return {
      type: "binary",
      op: ast.op,
      left,
      right,
    };
  }

  if (ast.type === "unary") {
    return { type: "unary", op: "-", argument: normalizeAst(ast.argument) };
  }

  if (ast.type === "function") {
    const argument = normalizeAst(ast.argument);

    if (ast.name === "sin") {
      const doubledLinearFactor = getDoubledLinearFactor(argument);
      if (doubledLinearFactor) {
        const halfAngle = multiply(number(String(doubledLinearFactor)), variable());
        return multiply(number("2"), multiply(func("sin", halfAngle), func("cos", halfAngle)));
      }
    }

    return { type: "function", name: ast.name, argument };
  }

  return ast;
}

function getDoubledLinearFactor(ast: FormulaAst): number | undefined {
  const coefficient = getLinearXCoefficient(ast);
  if (coefficient === undefined || coefficient % 2 !== 0) {
    return undefined;
  }
  return coefficient / 2;
}

function getLinearXCoefficient(ast: FormulaAst): number | undefined {
  if (ast.type === "variable") {
    return 1;
  }

  if (ast.type !== "binary" || ast.op !== "*") {
    return undefined;
  }

  if (ast.left.type === "number" && ast.right.type === "variable") {
    return Number(ast.left.value);
  }

  if (ast.right.type === "number" && ast.left.type === "variable") {
    return Number(ast.right.value);
  }

  const leftCoefficient = getLinearXCoefficient(ast.left);
  if (leftCoefficient !== undefined && ast.right.type === "number") {
    return leftCoefficient * Number(ast.right.value);
  }

  const rightCoefficient = getLinearXCoefficient(ast.right);
  if (rightCoefficient !== undefined && ast.left.type === "number") {
    return rightCoefficient * Number(ast.left.value);
  }

  return undefined;
}

function number(value: string): FormulaAst {
  return { type: "number", value };
}

function variable(): FormulaAst {
  return { type: "variable", name: "x" };
}

function func(name: FormulaFunctionName, argument: FormulaAst): FormulaAst {
  return { type: "function", name, argument };
}

function multiply(left: FormulaAst, right: FormulaAst): FormulaAst {
  return { type: "binary", op: "*", left, right };
}

export function toNerdamer(ast: FormulaAst): string {
  switch (ast.type) {
    case "number":
      return ast.value;
    case "variable":
      return "x";
    case "constant":
      // Prefer exp(1) over bare e so nerdamer never materializes Math.E.
      return ast.name === "e" ? "exp(1)" : "pi";
    case "unary":
      return `(-${toNerdamer(ast.argument)})`;
    case "binary":
      return `(${toNerdamer(ast.left)}${ast.op}${toNerdamer(ast.right)})`;
    case "function": {
      const argument = toNerdamer(ast.argument);
      if (ast.name === "ln" || ast.name === "log") {
        return `log(${argument})`;
      }
      if (ast.name === "tan") {
        return `(sin(${argument})/cos(${argument}))`;
      }
      if (ast.name === "cot") {
        return `(cos(${argument})/sin(${argument}))`;
      }
      if (ast.name === "sqrt") {
        // Prefer rational powers so nerdamer can cancel radicals algebraically.
        return `((${argument})^(1/2))`;
      }
      return `${ast.name}(${argument})`;
    }
  }
}

export function toLatex(ast: FormulaAst): string {
  switch (ast.type) {
    case "number":
      return ast.value;
    case "variable":
      return "x";
    case "constant":
      return ast.name === "e" ? "e" : "\\pi";
    case "unary":
      return `-${wrapLatex(ast.argument, 4)}`;
    case "binary":
      if (ast.op === "/") {
        return `\\frac{${toLatex(ast.left)}}{${toLatex(ast.right)}}`;
      }
      if (ast.op === "^") {
        return `${wrapLatex(ast.left, 3)}^{${toLatex(ast.right)}}`;
      }
      if (ast.op === "*") {
        return `${wrapLatex(ast.left, 2)}\\,${wrapLatex(ast.right, 2)}`;
      }
      return `${wrapLatex(ast.left, 1)} ${ast.op} ${wrapLatex(ast.right, 1)}`;
    case "function": {
      if (ast.name === "exp") {
        return `e^{${toLatex(ast.argument)}}`;
      }
      if (ast.name === "sqrt") {
        return `\\sqrt{${toLatex(ast.argument)}}`;
      }
      const name = ast.name === "log" ? "ln" : ast.name;
      return `\\${name}\\left(${toLatex(ast.argument)}\\right)`;
    }
  }
}

function wrapLatex(ast: FormulaAst, parentPrecedence: number): string {
  if (precedence(ast) < parentPrecedence) {
    return `\\left(${toLatex(ast)}\\right)`;
  }
  return toLatex(ast);
}

function precedence(ast: FormulaAst): number {
  if (ast.type === "binary") {
    if (ast.op === "+" || ast.op === "-") return 1;
    if (ast.op === "*" || ast.op === "/") return 2;
    return 3;
  }
  if (ast.type === "unary") return 4;
  return 5;
}
