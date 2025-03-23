// src/ops.ts
function arity(args, arity2) {
  if (args.length !== arity2) {
    throw new Error(`expected arity of ${arity2}, got ${args.length}`);
  }
  return args;
}
var ops = {};
ops.h = (args) => {
  const [depth, text] = arity(args, 2);
  return `<h${depth}>${text}</h${depth}>`;
};
ops.p = (args) => {
  const [text] = arity(args, 1);
  return `<p>${text}</p>`;
};
ops.bq = (args) => {
  const [text] = arity(args, 1);
  return `<blockquote>${text}</blockquote>`;
};

// src/program.ts
async function setBodyHtml() {
  const homl = await getHomlSrc();
  const html = convertHomlToHtml(homl);
  document.body.innerHTML = html;
}
async function getHomlSrc() {
  const body = document.body.textContent || ``;
  return body;
}
var convertHomlToHtml = function(homlTxt) {
  const htmlLines = [];
  const lines = homlTxt.split(`\n`);
  for (const line of lines) {
    if (line.length === 0) {
      continue;
    }
    const [op, ...args] = line.split(`\t`);
    const fn = ops[op];
    if (!fn) {
      throw new Error(`unknown op "${op}"`);
    }
    const html = fn(args);
    htmlLines.push(html);
  }
  return htmlLines.join(``);
};

// src/main.ts
window["ops"] = ops;
setBodyHtml();
