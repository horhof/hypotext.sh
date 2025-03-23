// src/ops.ts
function arity(args, length) {
  if (args.length !== length) {
    throw new Error(`expected arity of ${length}, got ${args.length}`);
  }
  return args;
}
var getBraceSuffixRegex = function(sigil) {
  return new RegExp(`{(.+?)}${sigil}\\b`);
};
var getBracePrefixRegex = function(sigil) {
  return new RegExp(`\\b${sigil}{(.+?)}`);
};
var getBackslashPrefixRegex = function(sigil) {
  return new RegExp(`\\b${sigil}\\\\(\\S+?)\\b`);
};
var getBackslashSuffixRegex = function(sigil) {
  return new RegExp(`\\b(\\S+?)\\\\${sigil}\\b`);
};

class Doc {
  ops = {};
  inlines = {};
  blocks = [];
  get currentBlock() {
    return this.blocks[this.blocks.length - 1];
  }
  homl = ``;
  constructor() {
    this.ops = ops;
    this.inlines = defaultInlines;
  }
  setHoml(homl) {
    this.homl = homl;
    const lines = homl.split(`\n`);
    for (const line of lines) {
      if (line.length === 0) {
        continue;
      }
      const [sigil, ...args] = line.split(`\t`);
      for (let i = 0;i < args.length; i++) {
        const text = args[i];
        args[i] = this.processInlines(text);
      }
      const op = this.ops[sigil];
      if (!op) {
        console.error(`Unknown sigil "${sigil}". FullLine=%o`, line);
        continue;
      }
      op(this, args);
    }
  }
  addBlock(tag) {
    const block = new Block(tag);
    this.blocks.push(block);
    return block;
  }
  processInlines(text) {
    if (!text) {
      return text;
    }
    try {
      for (const sigil in this.inlines) {
        const fn = this.inlines[sigil];
        text = this.processInline(text, getBraceSuffixRegex(sigil), fn);
        text = this.processInline(text, getBracePrefixRegex(sigil), fn);
        text = this.processInline(text, getBackslashSuffixRegex(sigil), fn);
        text = this.processInline(text, getBackslashPrefixRegex(sigil), fn);
      }
    } catch (err) {
      console.error(`procInlines> Caught error: %o.`, err.message);
      return ``;
    }
    return text;
  }
  processInline(text, pattern, replace) {
    while (true) {
      const m = text.match(pattern);
      if (!m) {
        break;
      }
      const [, match] = m;
      text = text.replace(pattern, replace(match));
    }
    return text;
  }
  render() {
    let ret = ``;
    for (const block of this.blocks) {
      ret += block.render();
    }
    return ret;
  }
}

class Block {
  tag;
  lines;
  constructor(tag) {
    this.tag = tag;
    this.lines = [];
  }
  addLine(line) {
    this.lines.push(line);
  }
  render() {
    return `<${this.tag}>\n${this.lines.join(`\n`)}\n</${this.tag}>\n`;
  }
}
var ops = {};
ops.h = (doc, args) => {
  const [depth, text] = arity(args, 2);
  const div = doc.addBlock(`div`);
  div.addLine(`<h${depth}>${text}</h${depth}>`);
};
ops.p = (doc, args) => {
  const [text] = arity(args, 1);
  const p = doc.addBlock(`p`);
  p.addLine(text + `\n`);
};
ops.bq = (doc, args) => {
  const [text] = arity(args, 1);
  const bq = doc.addBlock(`blockquote`);
  bq.addLine(text + `\n`);
};
ops.li = (doc, args) => {
  const [text] = arity(args, 1);
  let block = doc.currentBlock;
  if (block.tag !== `ul`) {
    block = doc.addBlock(`ul`);
  }
  block.addLine(`<li>${text}</li>`);
};
ops.num = (doc, args) => {
  const [text] = arity(args, 1);
  let block = doc.currentBlock;
  if (block.tag !== `ol`) {
    block = doc.addBlock(`ol`);
  }
  block.addLine(`<li>${text}</li>`);
};
var defaultInlines = {};
defaultInlines.e = (text) => `<em>${text}</em>`;
defaultInlines.s = (text) => `<strong>${text}</strong>`;
defaultInlines.f = (text) => `<i class="foreign-language">${text}</i>`;

// src/program.ts
async function setBodyHtml(doc) {
  const homl = await getHomlSrc();
  console.log(`setBodyHtml> Get %o bytes of homl.`, homl.length);
  doc.setHoml(homl);
  const html = doc.render();
  document.body.innerHTML = html;
}
async function getHomlSrc() {
  const body = document.body.textContent || ``;
  return body;
}

// src/main.ts
var doc = new Doc;
setBodyHtml(doc);
