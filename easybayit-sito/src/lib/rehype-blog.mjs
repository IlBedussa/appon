// Plugin rehype per gli articoli del blog (Markdown):
// 1) evidenzia i marcatori "[DA VERIFICARE: …]" con <span class="ph"> (come il componente T);
// 2) apre i link esterni in una nuova scheda con rel="noopener".
const MARK = /(\[DA VERIFICARE[^\]]*\])/g;

function walk(node) {
  if (!node.children) return;
  const out = [];
  for (const ch of node.children) {
    if (ch.type === 'text' && MARK.test(ch.value)) {
      MARK.lastIndex = 0;
      for (const part of ch.value.split(MARK)) {
        if (!part) continue;
        if (part.startsWith('[DA VERIFICARE')) {
          out.push({ type: 'element', tagName: 'span', properties: { className: ['ph'] }, children: [{ type: 'text', value: part }] });
        } else out.push({ type: 'text', value: part });
      }
      continue;
    }
    if (ch.type === 'element' && ch.tagName === 'a' && /^https?:\/\//.test(String(ch.properties?.href ?? ''))) {
      ch.properties.target = '_blank';
      ch.properties.rel = ['noopener'];
    }
    walk(ch);
    out.push(ch);
  }
  node.children = out;
}

export default function rehypeBlog() {
  return (tree) => walk(tree);
}
