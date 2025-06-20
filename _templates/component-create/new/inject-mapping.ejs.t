---
to: src/templating/mappingComponent.ts
inject: true
skip_if: "import <%= h.changeCase.pascal(name) %> from '@/components/<%= h.changeCase.pascal(name) %>';"
before: '// HYGEN_IMPORT_COMPONENT DO_NOT_REMOVE'
---
import <%= h.changeCase.pascal(name) %> from '@/components/<%= h.changeCase.pascal(name) %>'; 