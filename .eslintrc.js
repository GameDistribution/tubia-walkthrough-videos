// http://eslint.org/docs/user-guide/configuring

module.exports = {
    'parser': 'babel-eslint',
    'extends': ['airbnb-base', 'prettier'],
    'env': {
        'browser': true,
        'es6': true,
    },
    'globals': {
        'Plyr': false,
        'jQuery': false,
        'google': false,
    },
    'rules': {
        'no-const-assign': 1,
        'no-this-before-super': 1,
        'no-undef': 1,
        'no-unreachable': 1,
        'no-unused-vars': 1,
        'constructor-super': 1,
        'valid-typeof': 1,
        'indent': [2, 4, {'SwitchCase': 1}],
        'quotes': [2, 'single', 'avoid-escape'],
        'semi': [2, 'always'],
        'eqeqeq': [2, 'always'],
        'one-var': [2, 'never'],
        'comma-dangle': [2, 'always-multiline'],
        'no-restricted-globals': [
            'error',
            {
                'name': 'event',
                'message': 'Use local parameter instead.',
            },
            {
                'name': 'error',
                'message': 'Use local parameter instead.',
            },
        ],
        'array-bracket-newline': [2, {'minItems': 2}],
        'array-element-newline': [2, {'minItems': 2}],
    },
    'parserOptions': {
        'sourceType': 'module',
    },
};
