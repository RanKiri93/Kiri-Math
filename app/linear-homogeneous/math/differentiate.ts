import type { FormulaAst } from "./formulaParser";

export function differentiate(ast: FormulaAst): FormulaAst {
  switch (ast.type) {
    case "number":
    case "constant":
      return number("0");
    case "variable":
      return number("1");
    case "unary":
      return negate(differentiate(ast.argument));
    case "binary":
      return differentiateBinary(ast);
    case "function":
      return differentiateFunction(ast);
  }
}

function differentiateBinary(ast: Extract<FormulaAst, { type: "binary" }>): FormulaAst {
  const leftPrime = differentiate(ast.left);
  const rightPrime = differentiate(ast.right);

  switch (ast.op) {
    case "+":
      return add(leftPrime, rightPrime);
    case "-":
      return subtract(leftPrime, rightPrime);
    case "*":
      return add(multiply(leftPrime, ast.right), multiply(ast.left, rightPrime));
    case "/":
      return divide(
        subtract(multiply(leftPrime, ast.right), multiply(ast.left, rightPrime)),
        power(ast.right, number("2")),
      );
    case "^": {
      // d/dx [u^v] = u^v * (v' ln u + v u'/u) for general v; for constant v: v u^(v-1) u'
      if (ast.right.type === "number") {
        const exponent = Number(ast.right.value);
        if (exponent === 0) return number("0");
        if (exponent === 1) return leftPrime;
        return multiply(
          multiply(number(String(exponent)), power(ast.left, number(String(exponent - 1)))),
          leftPrime,
        );
      }
      // u^v = exp(v ln u)
      return multiply(
        ast,
        add(
          multiply(rightPrime, ln(ast.left)),
          multiply(ast.right, divide(leftPrime, ast.left)),
        ),
      );
    }
  }
}

function differentiateFunction(ast: Extract<FormulaAst, { type: "function" }>): FormulaAst {
  const argumentPrime = differentiate(ast.argument);

  switch (ast.name) {
    case "exp":
      return multiply(func("exp", ast.argument), argumentPrime);
    case "ln":
    case "log":
      return divide(argumentPrime, ast.argument);
    case "sin":
      return multiply(func("cos", ast.argument), argumentPrime);
    case "cos":
      return multiply(negate(func("sin", ast.argument)), argumentPrime);
    case "tan":
      return multiply(add(number("1"), power(func("tan", ast.argument), number("2"))), argumentPrime);
    case "cot":
      return multiply(
        negate(add(number("1"), power(func("cot", ast.argument), number("2")))),
        argumentPrime,
      );
    case "sqrt":
      return divide(argumentPrime, multiply(number("2"), func("sqrt", ast.argument)));
  }
}

function number(value: string): FormulaAst {
  return { type: "number", value };
}

function func(name: Extract<FormulaAst, { type: "function" }>["name"], argument: FormulaAst): FormulaAst {
  return { type: "function", name, argument };
}

function ln(argument: FormulaAst): FormulaAst {
  return func("ln", argument);
}

function negate(argument: FormulaAst): FormulaAst {
  if (argument.type === "unary") return argument.argument;
  if (argument.type === "number" && argument.value === "0") return argument;
  return { type: "unary", op: "-", argument };
}

function add(left: FormulaAst, right: FormulaAst): FormulaAst {
  if (isZero(left)) return right;
  if (isZero(right)) return left;
  return { type: "binary", op: "+", left, right };
}

function subtract(left: FormulaAst, right: FormulaAst): FormulaAst {
  if (isZero(right)) return left;
  if (isZero(left)) return negate(right);
  return { type: "binary", op: "-", left, right };
}

function multiply(left: FormulaAst, right: FormulaAst): FormulaAst {
  if (isZero(left) || isZero(right)) return number("0");
  if (isOne(left)) return right;
  if (isOne(right)) return left;
  return { type: "binary", op: "*", left, right };
}

function divide(left: FormulaAst, right: FormulaAst): FormulaAst {
  if (isZero(left)) return number("0");
  if (isOne(right)) return left;
  return { type: "binary", op: "/", left, right };
}

function power(left: FormulaAst, right: FormulaAst): FormulaAst {
  if (isOne(right)) return left;
  if (isZero(right)) return number("1");
  return { type: "binary", op: "^", left, right };
}

function isZero(ast: FormulaAst): boolean {
  return ast.type === "number" && Number(ast.value) === 0;
}

function isOne(ast: FormulaAst): boolean {
  return ast.type === "number" && Number(ast.value) === 1;
}
