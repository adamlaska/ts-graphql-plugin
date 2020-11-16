import ts from 'typescript';
import type {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLInterfaceType,
  GraphQLScalarType,
} from 'graphql/type';
import type { DocumentNode, OperationDefinitionNode, FragmentDefinitionNode } from 'graphql/language';
import { SourceWriteHelper } from '../ts-ast-util/types';

type GraphQLFragmentTypeConditionNamedType = GraphQLObjectType | GraphQLUnionType | GraphQLInterfaceType;

export interface TypeGenVisitorAddon {
  customScalar?: (input: CustomScalarInput) => CustomScalarOutput;
  document?: (input: DocumentInput) => void;
  operationDefiniton?: (input: OperationDefinionInput) => void;
  fragmentDefinition?: (input: FragmentDefinitionInput) => void;
}

export interface TypeGenAddonFactory {
  (context: TypeGenVisitorAddonContext): TypeGenVisitorAddon;
}

export interface TypeGenVisitorAddonContext {
  readonly source: SourceWriteHelper;
}

// TODO move this type to other file because type-gen-visitor should not need to know the following info
export interface TypeGenAddonInfo {
  readonly schema: GraphQLSchema;
  readonly extractedInfo: {
    readonly fileName: string;
    readonly tsSourceFile: ts.SourceFile;
    readonly tsTemplateNode: ts.NoSubstitutionTemplateLiteral | ts.TemplateExpression;
  };
}

export interface CustomScalarInput {
  readonly scalarType: GraphQLScalarType;
}

export type CustomScalarOutput = void | ts.TypeNode;

export interface DocumentInput {
  readonly graphqlNode: DocumentNode;
}

export interface OperationDefinionInput {
  readonly graqhqlNode: OperationDefinitionNode;
  readonly operationType: GraphQLObjectType;
  readonly tsResultNode: ts.TypeAliasDeclaration;
  readonly tsVariableNode: ts.TypeAliasDeclaration;
}

export interface FragmentDefinitionInput {
  readonly graphqlNode: FragmentDefinitionNode;
  readonly fragmentType: GraphQLFragmentTypeConditionNamedType;
  readonly tsNode: ts.TypeAliasDeclaration;
}
