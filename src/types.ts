interface _SchemaObject {
  id?: string;
  $id?: string;
  $schema?: string;
  [x: string]: any;
}
export interface SchemaObject extends _SchemaObject {
  id?: string;
  $id?: string;
  $schema?: string;
  $async?: false;
}
export interface AsyncSchema extends _SchemaObject {
  $async: true;
}

export type AnySchemaObject = SchemaObject | AsyncSchema;
export interface DataValidationCxt<T extends string | number = string | number> {
  instancePath: string;
  parentData: {
      [K in T]: any;
  };
  parentDataProperty: T;
  rootData: Record<string, any> | any[];
  dynamicAnchors: {
      [Ref in string]?: any;
  };
}

export interface ErrorObject<K extends string = string, P = Record<string, any>, S = unknown> {
  keyword: K;
  instancePath: string;
  schemaPath: string;
  params: P;
  propertyName?: string;
  message?: string;
  schema?: S;
  parentSchema?: AnySchemaObject;
  data?: unknown;
}

export interface SchemaValidateFunction {
  (schema: any, data: any, parentSchema?: AnySchemaObject, dataCxt?: DataValidationCxt): boolean | Promise<any>;
  errors?: Partial<ErrorObject>[];
}
