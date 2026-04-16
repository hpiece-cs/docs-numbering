export default {
  test: {
    include: ['test/**/*.test.js'],
    environment: 'node',
    setupFiles: ['test/helpers/setup.js']
  }
};
