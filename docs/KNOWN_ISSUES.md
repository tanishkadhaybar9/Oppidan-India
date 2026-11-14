# Oppidan ERMS — Known Issues & Future Enhancements

**Project**: Employee & Resource Management System (ERMS)  
**Version**: 1.11.0  
**Date**: November 2026  

---

## 1. Operational Considerations

1. **Cold Start Latency on Free-Tier Hosting**:
   - The backend API is hosted on Render Web Services. If idle for >15 minutes, the first incoming request may experience a 30-50 second spin-up latency. Subsequent requests execute in sub-100ms.
2. **Neon Serverless Connection Pooling**:
   - Neon PostgreSQL scales compute to zero during inactivity. Connection pooling (`-pooler` connection string) ensures reliable reconnection upon waking.
3. **Email Notification Transport**:
   - In-app notification delivery is database-backed and functions seamlessly via polling and header unread badge counts. External SMTP email transport (e.g., SendGrid/AWS SES) can be plugged into the notification service for outbound email delivery if desired.

---

## 2. Planned Future Enhancements

- **Biometric Hardware Integration**: Support physical biometric fingerprint and facial recognition turnstiles via Webhooks.
- **Dynamic Org Chart Visualization**: Interactive SVG tree render of reporting hierarchies directly in the employee directory.
- **Self-Service Payslip Signature**: Digital signature / employee acknowledgement receipt upon payslip issuance.
