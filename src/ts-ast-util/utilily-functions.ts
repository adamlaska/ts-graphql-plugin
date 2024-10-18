import ts from '../tsmodule';
import { astf } from './ast-factory-alias';

function mergeNamedBinding(base: ts.NamedImportBindings | undefined, head: ts.NamedImportBindings | undefined) {
  if (!base && !head) return undefined;
  if (!base) return head;
  if (!head) return base;
  // treat namedImports only
  if (ts.isNamespaceImport(base) || ts.isNamespaceImport(head)) return base;
  return astf.updateNamedImports(base, [...base.elements, ...head.elements]);
}

function removeFromNamedBinding(base: ts.NamedImportBindings | undefined, names: string[]) {
  if (!base) return undefined;
  // treat namedImports only
  if (ts.isNamespaceImport(base)) return base;
  const elements = base.elements.filter(elm => !names.includes(elm.name.text));
  if (elements.length === 0) return undefined;
  return astf.updateNamedImports(base, elements);
}

function mergeImportClause(base: ts.ImportClause | undefined, head: ts.ImportClause | undefined) {
  if (!base && !head) return undefined;
  if (!base) return head;
  if (!head) return base;
  const name = head.name || base.name;
  const namedBindings = mergeNamedBinding(base.namedBindings, head.namedBindings);
  const isTypeOnly = base.isTypeOnly && head.isTypeOnly;
  return astf.updateImportClause(base, isTypeOnly, name, namedBindings);
}

function removeFromImportClause(base: ts.ImportClause | undefined, names: string[]) {
  if (!base) return undefined;
  const namedBindings = removeFromNamedBinding(base.namedBindings, names);
  const nameIdentifier = base.name && names.includes(base.name.text) ? undefined : base.name;
  if (!nameIdentifier && !namedBindings) return undefined;
  return astf.updateImportClause(base, base.isTypeOnly, nameIdentifier, namedBindings);
}

export function findNode(sourceFile: ts.SourceFile, position: number): ts.Node | undefined {
  function find(node: ts.Node): ts.Node | undefined {
    if (position >= node.getStart() && position < node.getEnd()) {
      return ts.forEachChild(node, find) || node;
    }
  }
  return find(sourceFile);
}

export function findAllNodes<S extends ts.Node>(
  sourceFile: ts.SourceFile,
  cond: (n: ts.Node) => S | boolean | undefined,
): S[] {
  const result: (S | ts.Node)[] = [];
  function find(node: ts.Node) {
    const hit = cond(node);
    if (hit) {
      result.push(hit === true ? node : hit);
      return;
    } else {
      ts.forEachChild(node, find);
    }
  }
  find(sourceFile);
  return result as S[];
}

export function getSanitizedTemplateText(
  node: ts.NoSubstitutionTemplateLiteral | ts.TemplateExpression,
  source?: ts.SourceFile,
) {
  const sourcePosition = node.getStart(source) + 1;
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    return { text: node.text ?? '', sourcePosition };
  } else {
    let text = node.head.text ?? '';
    for (const span of node.templateSpans) {
      // Note:
      // This magic number 3 is introduced from "${}".length
      text += ''.padEnd(span.expression.end - span.expression.pos + 3, ' ');
      text += span.literal.text;
    }
    return { text, sourcePosition };
  }
}

export function isTemplateLiteralTypeNode(node: ts.Node): node is ts.TemplateLiteralTypeNode {
  // ts.isNoSubstitutionTemplateLiteral exists TypeScript >= 4.1
  return typeof ts.isTemplateLiteralTypeNode === 'function' && ts.isTemplateLiteralTypeNode(node);
}

export function isImportDeclarationWithCondition(
  node: ts.Node,
  { isDefault, name, from }: { isDefault?: boolean; name?: string; from?: string },
) {
  if (!name && !from) return false;
  if (!ts.isImportDeclaration(node)) return false;
  if (from) {
    if (!ts.isStringLiteralLike(node.moduleSpecifier) || node.moduleSpecifier.text !== from) return false;
  }
  if (!name) return true;
  if (!node.importClause) return false;
  let result = false;
  if (isDefault !== false) {
    result = result || node.importClause.name?.text === name;
  }
  if (isDefault !== true && node.importClause.namedBindings) {
    if (ts.isNamedImports(node.importClause.namedBindings)) {
      result = result || node.importClause.namedBindings.elements.some(elm => elm.name?.text === name);
    } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
      result = result || node.importClause.namedBindings.name?.text === name;
    }
  }
  return result;
}

export function mergeImportDeclarationsWithSameModules(base: ts.ImportDeclaration, head: ts.ImportDeclaration) {
  if (!ts.isStringLiteralLike(base.moduleSpecifier) || !ts.isStringLiteralLike(head.moduleSpecifier)) return base;
  if (base.moduleSpecifier.text !== head.moduleSpecifier.text) return base;
  const modifiers = head.modifiers || base.modifiers;
  const importClause = mergeImportClause(base.importClause, head.importClause);
  return astf.updateImportDeclaration(base, modifiers, importClause, base.moduleSpecifier, undefined);
}

export function removeAliasFromImportDeclaration(base: ts.ImportDeclaration, names: string[]) {
  const modifiers = base.modifiers;
  const importClause = removeFromImportClause(base.importClause, names);
  if (!importClause) return undefined;
  return astf.updateImportDeclaration(base, modifiers, importClause, base.moduleSpecifier, undefined);
}
