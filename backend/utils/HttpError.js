// SUDAH DISEDIAKAN. Hanya pesan error yang dibuat aplikasi boleh tampil ke client.
export class HttpError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
