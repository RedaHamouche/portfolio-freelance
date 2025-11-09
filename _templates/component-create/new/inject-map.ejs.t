---
to: src/templating/mappingComponent.ts
inject: true
skip_if: '<%= h.changeCase.pascal(name) %>,'
before: '// HYGEN_MAP_COMPONENT DO_NOT_REMOVE'
---
  <%= h.changeCase.pascal(name) %>,
