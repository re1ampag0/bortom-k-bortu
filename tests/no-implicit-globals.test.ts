// No code of src/ reads a global of the browser by accident: lib.dom.d.ts declares `external`, `name`, `status`…
// as globals, so a variable forgotten in a destructuring still type-checks. Chrome has window.external, Safari does
// not — `if (external)` in useShowQueue threw there and the table never mounted (PR #24, WebKit). ESLint is not in
// the project, and a grep would also catch `.name` / `.length`: the TypeScript checker tells a real global apart.
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const FORBIDDEN = new Set(['external', 'name', 'event', 'status', 'parent', 'top', 'length', 'closed', 'origin', 'self', 'opener', 'frames']);

function implicitGlobals(): string[] {
  const configPath = resolve('tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath));
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const checker = program.getTypeChecker();
  const src = resolve('src');
  const out: string[] = [];
  for (const file of program.getSourceFiles()) {
    if (!file.fileName.startsWith(src)) continue;
    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node) && FORBIDDEN.has(node.text)) {
        const decls = checker.getSymbolAtLocation(node)?.declarations ?? [];
        // A global is `declare var <name>` at the top of lib.dom (DOMRect.top and the like are properties, not globals).
        const global = (d: ts.Declaration) =>
          ts.isVariableDeclaration(d) && ts.isVariableStatement(d.parent.parent) && ts.isSourceFile(d.parent.parent.parent) && /lib\.dom\.d\.ts$/.test(d.getSourceFile().fileName);
        if (decls.length > 0 && decls.every(global)) {
          const { line } = file.getLineAndCharacterOfPosition(node.getStart());
          out.push(`${file.fileName.slice(src.length + 1)}:${line + 1} ${node.text}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  return out;
}

describe('src/ reads no global of the browser by accident', () => {
  it(`none of ${[...FORBIDDEN].join(', ')} resolves to a global of lib.dom`, () => {
    expect(implicitGlobals()).toEqual([]);
  }, 60_000);
});
