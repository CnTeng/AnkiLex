import path from "node:path";
import { build, type Plugin, type ResolvedConfig } from "vite";

interface IifeEntry {
  entry: string;
  name: string;
  fileName: string;
  minify?: boolean;
}

interface IifeModule {
  entry: string;
  name: string;
  minify?: boolean;
}

interface IifePluginOptions {
  entries?: IifeEntry[];
  modules?: Record<string, IifeModule>;
}

const MODULE_PREFIX = "iife:";
const RESOLVED_PREFIX = "\0iife:";

export function iifePlugin(options: IifePluginOptions = {}): Plugin {
  let viteConfig: ResolvedConfig;
  let emitted = false;

  const entries = options.entries ?? [];
  const modules = options.modules ?? {};

  const resolveEntry = (entry: string) =>
    path.isAbsolute(entry) ? entry : path.resolve(viteConfig.root, entry);

  const bundleIife = async (entry: string, name: string, minify = true) => {
    const bundleResult = await build({
      configFile: false,
      root: viteConfig.root,
      build: {
        lib: {
          entry: resolveEntry(entry),
          formats: ["iife"],
          name,
          fileName: "bundle",
        },
        write: false,
        minify,
        rollupOptions: {
          external: [],
        },
      },
      resolve: {
        alias: viteConfig.resolve.alias,
      },
      logLevel: "silent",
    });

    const output = Array.isArray(bundleResult) ? bundleResult[0] : bundleResult;
    const chunk = "output" in output ? output.output[0] : null;

    if (!chunk || !("code" in chunk)) {
      throw new Error("Failed to bundle IIFE: No output code found");
    }

    return chunk.code;
  };

  return {
    name: "vite-plugin-iife",

    configResolved(config) {
      viteConfig = config;
    },

    resolveId(id) {
      if (id in modules) {
        return RESOLVED_PREFIX + id;
      }
      if (id.startsWith(MODULE_PREFIX) && modules[id]) {
        return RESOLVED_PREFIX + id;
      }
      return null;
    },

    async load(id) {
      if (!id.startsWith(RESOLVED_PREFIX)) return null;

      const moduleId = id.slice(RESOLVED_PREFIX.length);
      const moduleConfig = modules[moduleId];

      if (!moduleConfig) {
        throw new Error(`Unknown IIFE module: ${moduleId}`);
      }

      const bundleCode = await bundleIife(
        moduleConfig.entry,
        moduleConfig.name,
        moduleConfig.minify ?? true,
      );

      return {
        code: `export default ${JSON.stringify(bundleCode)};`,
        map: null,
      };
    },

    async transform(_code, id) {
      if (!id.includes("?iife")) return null;

      const [filePath] = id.split("?");
      const params = new URLSearchParams(id.split("?")[1]);
      const name = params.get("name") || "Module";

      const bundleCode = await bundleIife(filePath, name, true);

      return {
        code: `export default ${JSON.stringify(bundleCode)};`,
        map: null,
      };
    },

    async generateBundle() {
      if (emitted || entries.length === 0) return;
      emitted = true;

      for (const entry of entries) {
        const code = await bundleIife(entry.entry, entry.name, entry.minify ?? true);
        this.emitFile({ type: "asset", fileName: entry.fileName, source: code });
      }
    },
  };
}
