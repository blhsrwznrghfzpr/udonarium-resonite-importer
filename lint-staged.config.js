module.exports = {
  'src/**/*.ts': ['eslint --fix', 'prettier --write'],
  // Run typecheck and test when any .ts file is staged
  // Using function form to run commands without file arguments
  '*.ts': () => ['npm run typecheck', 'npm run test'],
};
