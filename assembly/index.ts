// The entry file of your WebAssembly module.

export function add(a: i32, b: i32): i32 {
  return a + b;
}

const engines: Array<Engine> = new Array<Engine>();

enum Kind {
  ConstantUnassigned,
  MutableUnassigned,
  ConstantAssigned,
  MutableAssigned,
  Type,
}

type refcount = i32;
enum DataType {
  i32,
  u32,
  i64,
  u64,
  isize,
  usize,
  f32,
  f64,
  i8,
  u8,
  i16,
  u16,
  bool,
  v128,
  externref,
  funcref,
}

abstract class Expression {
  term: string
  evaluate(scope:Scope):void {
  }
}

abstract class BinaryExpression extends Expression {
  left: Expression
  right: Expression
}

abstract class Variable {
  scope: Scope;
  metadata: string | null;
  kind: Kind = Kind.ConstantUnassigned;
  type: DataType = DataType.usize;
  constructor(
    scope: Scope,
    metadata: string | null = null,
    kind: Kind = Kind.ConstantUnassigned,
    type: DataType = DataType.usize
  ) {
    this.scope = scope;
    this.metadata = metadata;
    this.kind = kind;
    this.type = type;
  }
}

class Variable_i32 extends Variable {
  data: i32 = 0;
  static create(
    scope: Scope,
    metadata: string | null,
    kind: Kind,
    data: i32
  ): Variable_i32 {
    const instance = new Variable_i32(scope, metadata, kind, DataType.i32);
    instance.data = data;
    return instance;
  }
}

export function seti32(variable: Variable_i32, i: i32): void {
  assertAssignable(variable);
  markAssigned(variable);
  variable.data = i;
}

export function geti32(variable: Variable_i32): i32 {
  return variable.data;
}

class Variable_i64 extends Variable {
  data: i64 = 0;
  static create(
    scope: Scope,
    metadata: string | null,
    kind: Kind,
    data: i64
  ): Variable_i64 {
    const instance = new Variable_i64(scope, metadata, kind, DataType.i64);
    instance.data = data;
    return instance;
  }
}

export function seti64(variable: Variable_i64, i: i64): void {
  assertAssignable(variable);
  markAssigned(variable);
  variable.data = i;
}

export function geti64(variable: Variable_i64): i64 {
  return variable.data;
}

class Scope {
  parent: Scope | null;
  scopes: Array<Scope> = new Array<Scope>();
  variables: Map<string, Variable> = new Map<string, Variable>();
  engine: Engine;

  private constructor(engine: Engine) {
    this.engine = engine;
  }

  static create(engine: Engine): Scope {
    const scope = new Scope(engine);
    return scope;
  }
  static createWithParent(parent: Scope): Scope {
    const scope = Scope.create(parent.engine);
    scope.parent = parent;
    return scope;
  }
}

class Engine {
  constructor() {}
  scopes: Array<Scope> = new Array<Scope>();
  registerScope(scope: Scope): void {
    this.scopes.push(scope);
  }
}

export function newEngine(): Engine {
  const engine = new Engine();
  engines.push(engine);
  return engine;
}

export function newTopLevelScope(engine: Engine): Scope {
  const scope = Scope.create(engine);
  engine.registerScope(scope);
  return scope;
}

export function newChildScope(engine: Engine, parent: Scope): Scope {
  if (engine.scopes.includes(parent)) {
    const child = Scope.createWithParent(parent);
    return child;
  } else {
    throw new Error("The parent scope does not exist in this context.");
  }
}

export function declareVariable(
  scope: Scope,
  name: string,
  type: DataType,
  metadata: string = ""
): Variable {
  if (scope.variables.has(name)) {
    throw new Error("Variable already declared, cannot be redeclared.");
  }
  switch (type) {
    case DataType.i32:
      const variable = Variable_i32.create(
        scope,
        metadata,
        Kind.MutableUnassigned,
        type
      );
      scope.variables.set(name, variable);
      return variable;
  }
  throw new Error("unknown type");
}

function assertAssignable(variable: Variable): void {
  switch (variable.kind) {
    case Kind.ConstantAssigned:
      throw new Error("Cannot reassign a constant value.");
  }
}

function markAssigned(variable: Variable): void {
  if (variable.kind == Kind.ConstantUnassigned) {
    variable.kind = Kind.ConstantAssigned;
  }
  if (variable.kind == Kind.MutableUnassigned) {
    variable.kind = Kind.MutableAssigned;
  }
}