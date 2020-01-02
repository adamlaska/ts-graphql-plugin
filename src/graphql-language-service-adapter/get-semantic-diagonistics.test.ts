import * as ts from 'typescript/lib/tsserverlibrary';
import { AdapterFixture } from '../testing/adapter-fixture';
import { createSimpleSchema } from '../testing/graphql-util/schema/simple-schema';
import { GraphQLSchema } from 'graphql';

function craeteFixture(name: string, schema?: GraphQLSchema) {
  return new AdapterFixture(name, schema);
}

const defaultSemanticDigostics: ts.Diagnostic[] = [];

const delegateFn = () => defaultSemanticDigostics;

describe('getSemanticDiagnostics', () => {
  it('should delegate original fn when schema is not set', () => {
    const fixture = craeteFixture('input.ts');
    const actual = fixture.adapter.getSemanticDiagnostics(delegateFn, 'input.ts');
    expect(actual).toEqual(defaultSemanticDigostics);
  });

  it('should validate GraphQL syntax in template string', () => {
    const fixture = craeteFixture('input.ts', createSimpleSchema());
    const validateFn: () => ts.Diagnostic[] = fixture.adapter.getSemanticDiagnostics.bind(
      fixture.adapter,
      delegateFn,
      'input.ts',
    );

    fixture.source = 'const ql = `';
    const [actual1] = validateFn();
    const messageText = actual1.messageText as string;
    expect(messageText.match(/Syntax Error:/)).toBeTruthy();
    expect(actual1.start).toBe(11); // start character

    // prettier-ignore
    fixture.source = 'const ql = `' + '\n'
                   + '{`';
    const [actual2] = validateFn();
    expect(actual2.start).toBe(13); // start character (multiline)

    fixture.source = 'const ql = `query { hello }`';
    expect(validateFn()).toEqual([]); // no errors for valid query

    // prettier-ignore
    fixture.source = 'const ql = `query {' + '\n'
                   + '  hello' + '\n'
                   + ' }`';
    expect(validateFn()).toEqual([]); // no errors for valid query (multiline)
  });

  it('should return diagnostic array for invalid GraphQL template string', () => {
    const fixture = craeteFixture('input.ts', createSimpleSchema());
    const validateFn: () => ts.Diagnostic[] = fixture.adapter.getSemanticDiagnostics.bind(
      fixture.adapter,
      delegateFn,
      'input.ts',
    );

    // prettier-ignore
    fixture.source = 'const ql = `query {' + '\n'
                   + '  hoge,' + '\n'
                   + ' }`';
    const [actual] = validateFn();
    const messageText = actual.messageText as string;
    expect(/Cannot query field "hoge"/.test(messageText)).toBeTruthy();
  });

  it('should return empty array for valid GraphQL template string', () => {
    const fixture = craeteFixture('input.ts', createSimpleSchema());
    const validateFn: () => ts.Diagnostic[] = fixture.adapter.getSemanticDiagnostics.bind(
      fixture.adapter,
      delegateFn,
      'input.ts',
    );

    // prettier-ignore
    fixture.source = 'const ql = `query {' + '\n'
                   + '  hello' + '\n'
                   + ' }`';
    expect(validateFn()).toEqual([]); // no errors for valid query (multiline)
  });

  it('should work with incomplete document', () => {
    const fixture = craeteFixture('input.ts', createSimpleSchema());
    const validateFn: () => ts.Diagnostic[] = fixture.adapter.getSemanticDiagnostics.bind(
      fixture.adapter,
      delegateFn,
      'input.ts',
    );

    fixture.source = `
      export const fragment = gql\`
        fragment MyFragment on Query {
          __typename

      \`;
    `;
    expect(validateFn().length).toBe(1);
  });
});
