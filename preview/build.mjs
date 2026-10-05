// Bundles the Next.js prototype into one self-contained HTML page for the in-chat preview.
import { build } from "esbuild";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const shim = (f) => path.join(root, "preview/shims", f);
const MAP = {
  react: shim("react.js"),
  "react/jsx-runtime": shim("jsx-runtime.js"),
  "react/jsx-dev-runtime": shim("jsx-runtime.js"),
  "react-dom": shim("react-dom.js"),
  "react-dom/client": shim("react-dom.js"),
  "next/link": shim("next-link.tsx"),
  "next/navigation": shim("next-navigation.ts"),
};

const result = await build({
  entryPoints: [path.join(root, "preview/main.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
  plugins: [
    {
      name: "shims",
      setup(b) {
        b.onResolve({ filter: /^(react|react-dom|next)(\/.*)?$/ }, (args) => (MAP[args.path] ? { path: MAP[args.path] } : undefined));
        b.onResolve({ filter: /^@\// }, (args) => ({ path: require_resolve(path.join(root, args.path.slice(2))) }));
      },
    },
  ],
});

function require_resolve(p) {
  for (const ext of ["", ".tsx", ".ts", "/page.tsx", "/index.tsx"]) {
    try {
      readFileSync(p + ext);
      return p + ext;
    } catch {}
  }
  throw new Error("Cannot resolve " + p);
}

execSync(`npx @tailwindcss/cli -i app/globals.css -o preview/out.css --minify`, { cwd: root, stdio: "inherit" });
const css = readFileSync(path.join(root, "preview/out.css"), "utf8");
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const html = `<title>Call Flow Prototype</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap">
<style>
${css}
:root{color-scheme:light}
body{background:#f3f7ff;color:#101038}
</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>
${js}
</script>
`;
writeFileSync(path.join(root, "preview/callflow-preview.html"), html);
console.log("preview size", Math.round(html.length / 1024), "KB");
