// see types of prompts:
// https://github.com/enquirer/enquirer/tree/master/examples
//
module.exports = [
  {
    type: 'select',
    name: 'componentType',
    message: 'Quel type de composant voulez-vous créer ?',
    choices: [
      'page',
      'path',
      'pathTangente',
    ],
  },
  {
    type: 'input',
    name: 'name',
    message: 'Nom du composant (ex: MyComponent)',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'Le nom du composant est requis';
      }
      if (!/^[A-Z]/.test(value)) {
        return 'Le nom doit commencer par une majuscule (PascalCase)';
      }
      return true;
    },
  },
];

