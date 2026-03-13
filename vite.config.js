import basicSsl from '@vitejs/plugin-basic-ssl';

export default {
  plugins: [
    basicSsl()
  ],
  server: {
    port: 5174,
    host: true
  }
};
