# SchoolERP Roadmap Summary: Phase 2 & 3

## 1. Release Sequencing

### Phase 2: Operations & Academic Core Enhancements (Q2-Q3 2026)
1. **Academic Core**: Homework, Lesson Planning, Advanced Grading.
2. **Operations**: Visitor Management, Discipline Log.
3. **Infrastructure**: Alert Management (Automation Hub), MFA for Staff.
4. **Finance**: Tally Export, Payment Gateway Reconciliation.

### Phase 3: Ecosystem & Interaction (Q4 2026+)
1. **Interaction**: Parent-Teacher Chat, PTM Booking.
2. **Mobile**: Native-first app features (Offline modes, Biometrics).
3. **Enterprise**: Rule-based automation (Custom Triggers), White-labeling.

## 2. Key Dependencies
- **Communication Gateway**: Requires stable WhatsApp/SMS API integration for Alert Management.
- **Hardware Integration**: Visitor badge printing depends on Web-Print protocol standardization.
- **Tally Schema**: Accounting exports must maintain compatibility with Tally Prime 3.0+.

## 3. Risks & Mitigations
- **Complexity**: Automated alerts can lead to "notification fatigue". *Mitigation*: Enable tenant-level "Quiet Hours" and "Digest" modes.
- **Privacy**: Two-way chat increases PII exposure. *Mitigation*: End-to-end encryption for chat payloads + strict moderation logs.
- **Scaling**: Bulk PDF generation for report cards/receipts. *Mitigation*: Use async Go workers with prioritized queues.

## 4. Acceptance Summary
The Documentation audit confirms that all Phase 2 candidate features now have technical specifications that align with our multi-tenant, audit-grade architecture.
