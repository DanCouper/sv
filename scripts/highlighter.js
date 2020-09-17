/**
 * WIP fork of https://github.com/lrsjng/lolight
 *
 * Tokenises aritrary code blocks and wraps the tokenised code in spans with
 * specific classes.
 */

let SELECTOR = ".lolight";
let CLS_PREFIX = "ll-";
let STYLE = "_nam#2196f3}_num#ec407a}_str#43a047}_rex#ef6c00}_pct#666}_key#555;font-weight:bold}_com#aaa;font-style:italic}"
  .replace(/_/g, "." + CLS_PREFIX)
  .replace(/#/g, "{color:#");

let KEYWORD_RE = /^(a(bstract|lias|nd|rguments|rray|s(m|sert)?|uto)|b(ase|egin|ool(ean)?|reak|yte)|c(ase|atch|har|hecked|lass|lone|ompl|onst|ontinue)|de(bugger|cimal|clare|f(ault|er)?|init|l(egate|ete)?)|do|double|e(cho|ls?if|lse(if)?|nd|nsure|num|vent|x(cept|ec|p(licit|ort)|te(nds|nsion|rn)))|f(allthrough|alse|inal(ly)?|ixed|loat|or(each)?|riend|rom|unc(tion)?)|global|goto|guard|i(f|mp(lements|licit|ort)|n(it|clude(_once)?|line|out|stanceof|t(erface|ernal)?)?|s)|l(ambda|et|ock|ong)|m(odule|utable)|NaN|n(amespace|ative|ext|ew|il|ot|ull)|o(bject|perator|r|ut|verride)|p(ackage|arams|rivate|rotected|rotocol|ublic)|r(aise|e(adonly|do|f|gister|peat|quire(_once)?|scue|strict|try|turn))|s(byte|ealed|elf|hort|igned|izeof|tatic|tring|truct|ubscript|uper|ynchronized|witch)|t(emplate|hen|his|hrows?|ransient|rue|ry|ype(alias|def|id|name|of))|u(n(checked|def(ined)?|ion|less|signed|til)|se|sing)|v(ar|irtual|oid|olatile)|w(char_t|hen|here|hile|ith)|xor|yield)$/;

let COM = "com";
let KEY = "key";
let NAM = "nam";
let NUM = "num";
let PCT = "pct";
let REX = "rex";
let SPC = "spc";
let STR = "str";
let UNK = "unk";

let TOKEN_RES = [
  [NUM, /#([0-9a-f]{6}|[0-9a-f]{3})\b/],
  [COM, /(\/\/|#).*?(?=\n|$)/],
  [COM, /\/\*[\s\S]*?\*\//],
  [COM, /<!--[\s\S]*?-->/],
  [REX, /\/(\\\/|[^\n])*?\//],
  [STR, /(['"`])(\\\1|[\s\S])*?\1/],
  [NUM, /[+-]?([0-9]*\.?[0-9]+|[0-9]+\.?[0-9]*)([eE][+-]?[0-9]+)?/],
  [PCT, /[\\.,:;+\-*\/=<>()[\]{}|?!&@~]/],
  [SPC, /\s+/],
  [NAM, /[\w$]+/],
  [UNK, /./],
];

function tokenize(text) {
  if (typeof text !== "string") {
    throw new Error("tok: no string");
  }

  let tokens = [];
  let len = TOKEN_RES.length;
  let shouldPreferDivOverRe = false;

  while (text) {
    for (let i = 0; i < len; i += 1) {
      let m = TOKEN_RES[i][1].exec(text);
      if (!m || m.index !== 0) {
        continue;
      }

      let cls = TOKEN_RES[i][0];
      if (cls === REX && shouldPreferDivOverRe) {
        continue;
      }

      let tok = m[0];

      if (cls === NAM && KEYWORD_RE.test(tok)) {
        cls = KEY;
      }
      if (cls === SPC) {
        if (tok.indexOf("\n") >= 0) {
          shouldPreferDivOverRe = false;
        }
      } else {
        shouldPreferDivOverRe = cls === NUM || cls === NAM;
      }

      text = text.slice(tok.length);
      tokens.push([cls, tok]);
      break;
    }
  }

  return tokens;
}

function withDoc(fail, fn) {
  if (typeof document !== "undefined") {
    fn(document);
  } else if (fail) {
    throw new Error("no doc");
  }
}

function highlightElement(el) {
  withDoc(true, (doc) => {
    let tokens = tokenize(el.textContent);
    el.innerHTML = "";
    tokens.forEach((token) => {
      let tok_el = doc.createElement("span");
      tok_el.className = CLS_PREFIX + token[0];
      tok_el.textContent = token[1];
      el.appendChild(tok_el);
    });
  });
}

function lolight(sel) {
  withDoc(true, (doc) => {
    doc.querySelectorAll(sel || SELECTOR).forEach((el) => {
      highlightElement(el);
    });
  });
}

withDoc(false, (doc) => {
  // do it with style
  let head = doc.querySelector("head");
  let style = doc.createElement("style");
  style.textContent = STYLE;
  head.insertBefore(style, head.firstChild);

  // auto highlight
  if (/^(i|c|loade)/.test(doc.readyState)) {
    lolight();
  } else {
    doc.addEventListener("DOMContentLoaded", function () {
      lolight();
    });
  }
});

lolight.tok = tokenize;
lolight.el = highlightElement;

export { lolight };
