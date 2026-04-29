export default () => ({
  port: parseInt(process.env['PORT'] ?? '3000', 10) || 3000,
  database: {
    uri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/pashtoonic',
  },
  jwt: {
    secret: process.env['JWT_SECRET'] || 'default-secret-change-in-production-32chars',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
    refreshSecret:
      process.env['JWT_REFRESH_SECRET'] || 'default-refresh-secret-change-in-production',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  },
  upload: {
    path: process.env['UPLOAD_PATH'] || './uploads',
    maxAvatarSizeBytes:
      (parseInt(process.env['MAX_AVATAR_SIZE_MB'] ?? '5', 10) || 5) * 1024 * 1024,
    maxAudioSizeBytes:
      (parseInt(process.env['MAX_AUDIO_SIZE_MB'] ?? '50', 10) || 50) * 1024 * 1024,
    staticUrl: process.env['STATIC_URL'] || '/static',
  },
  throttle: {
    ttl: 60000,
    limit: 100,
  },
});
