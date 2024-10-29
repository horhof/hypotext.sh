// BEGIN src/program.js
const $ = console.log.bind(console)

/** @typedef {(args: string[]) => string} Operation */

/** @type {Record<string, Operation>} */
const ops = {}

async function setBodyHtml() {
  const homl = await getHomlSrc()
  const html = convertHomlToHtml(homl)
  document.body.innerHTML = html
}

/**
 * Get the HOML source either from a purported .homl file that matches this
 * .html file or else from the <body> element.
 * @returns {Promise<string>}
 */
async function getHomlSrc() {
  const url = window.location.href
  const isFile = url.startsWith(`file://`)
  const isHtml = url.endsWith(`.html`)

  // If this is something like https://example.com/index.html then try to search
  // for an index.homl file on the same server to load in.
  if (isHtml && !isFile) {
    const homlUrl = url.replace(/\.html$/, `.homl`)
    if (url !== homlUrl) {
      try {
        const fetchRes = await fetch(homlUrl)
        const homl = await fetchRes.text()
        if (homl) {
          return homl
        }
      } catch(err) {
        $(`getHomlSrc> Tried and failed to fetch a %o source file.`, homlUrl)
      }
    }
  }

  const body = document.body.textContent || ``
  $(`getHomlSrc> BodyContent=%o`, body)

  return body
}

/** @param {string} homlTxt */
function convertHomlToHtml(homlTxt) {
  /** @type {string[]} */
  const htmlLines = []

  const lines = homlTxt.split(`\n`)
  for (const line of lines) {
    if (line.length === 0) {
      continue
    }

    const [op, ...args] = line.split(`\t`)

    const fn = ops[op]
    if (!fn) {
      throw new Error(`Unknown op "${op}"`)
    }

    const html = fn(args)
    htmlLines.push(html)
  }

  return htmlLines.join(``)
}

/**
 * Expect that we were given args of the given arity and return the args back.
 * @param {string[]} args
 * @param {number} arity
 * @returns {string[]}
 */
function arity(args, arity) {
  if (args.length !== arity) {
    $(`arity> Arity=%o Args=%o`, arity, args)
    throw new Error(`Expected arity of ${arity}, got ${args.length}`)
  }

  return args
}
// END src/program.js
// BEGIN src/content-ops.js
/**
 * Heading.
 * @type {Operation}
 */
ops.h = function heading(args) {
  const [depth, text] = arity(args, 2)
  return `<h${depth}>${text}</h${depth}>`
}

/**
 * Paragraph.
 * @type {Operation}
 */
ops.p = function paragraph(args) {
  const [text] = arity(args, 1)
  return `<p>${text}</p>`
}
// END src/content-ops.js
// BEGIN src/main.js
setBodyHtml()
// END src/main.js