---
to: src/templating/mappingComponent.ts
inject: true
skip_if: "const <%= h.changeCase.pascal(name) %> = dynamic"
before: '// HYGEN_IMPORT_COMPONENT DO_NOT_REMOVE'
---
const <%= h.changeCase.pascal(name) %> = dynamic(() => import('@/components/templatingComponents/<%= componentType %>/<%= h.changeCase.pascal(name) %>'), { ssr: true });
