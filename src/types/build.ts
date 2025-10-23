/**
 * Build system type definitions
 */

// Use Bun's native plugin type
type BunPlugin = import("bun").BunPlugin;

export interface BuildConfig {
  outdir: string;
  target: "bun" | "node" | "browser";
  sourcemap?: boolean | "inline" | "external" | "none" | "linked";
  minify?: boolean;
  external?: string[];
  platform?: "bun" | "node" | "neutral";
  format?: "esm" | "cjs" | "iife";
  define?: Record<string, string>;
  plugins?: BunPlugin[]; // Proper Bun plugin type
  entrypoint?: string;
  naming?: {
    entry?: string;
    chunk?: string;
    asset?: string;
  };
  // Additional build optimization properties
  splitting?: boolean;
  treeShaking?: boolean;
  drop?: string[];
  pure?: string[];
  deadCodeElimination?: boolean;
  entrypoints?: string[];
}

export interface BuildResult {
  success: boolean;
  outputFiles: BuildOutputFile[];
  metafile?: BuildMetafile;
  warnings: BuildWarning[];
  errors: BuildError[];
  duration: number;
  size: number;
}

export interface BuildOutputFile {
  path: string;
  size: number;
  hash?: string;
  type: "entry" | "chunk" | "asset";
}

export interface BuildMetafile {
  inputs: Record<string, BuildInput>;
  outputs: Record<string, BuildOutput>;
}

export interface BuildInput {
  bytes: number;
  imports: BuildImport[];
}

export interface BuildImport {
  path: string;
  kind:
    | "import-statement"
    | "require-call"
    | "dynamic-import"
    | "require-resolve"
    | "import-rule"
    | "url-token"
    | "call-expression";
  external?: boolean;
}

export interface BuildOutput {
  bytes: number;
  imports: BuildImport[];
  exports: BuildExport[];
  entryPoint?: string;
}

export interface BuildExport {
  name: string;
  kind: "local" | "star" | "default";
}

export interface BuildWarning {
  text: string;
  location?: {
    file: string;
    line: number;
    column: number;
    length: number;
    lineText: string;
  };
  notes?: BuildNote[];
}

export interface BuildError {
  text: string;
  location?: {
    file: string;
    line: number;
    column: number;
    length: number;
    lineText: string;
  };
  notes?: BuildNote[];
}

export interface BuildNote {
  text: string;
  location?: {
    file: string;
    line: number;
    column: number;
    length: number;
    lineText: string;
  };
}

export interface BuildEnvironment {
  name: string;
  config: BuildConfig;
  description: string;
  useCases: string[];
}
